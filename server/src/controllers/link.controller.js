import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Collection } from "../models/collection.model.js"
import { Link, UserLink } from "../models/link.model.js"
import axios from "axios"
import validator from "validator"
import fetchMetadata, { detectContentType } from "../utils/fetchMetadata.js"
import convertToObjectId from "../utils/convertToObjectId.js"

const createLink = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;
    if (!collectionId) throw new ApiError(400, "Collection ID is required");

    const { title, description, link, userId, linkId, image } = req.body;

    if (!link) throw new ApiError(400, "Link is required.");
    if (!userId) throw new ApiError(400, "User ID is required.");
    if (!linkId && !title) throw new ApiError(400, "Title is required.");

    const userIdObject = convertToObjectId(userId);
    const collectionIdObject = convertToObjectId(collectionId);
    const linkIdObject = linkId ? convertToObjectId(linkId) : null;

    if (!validator.isURL(link)) throw new ApiError(400, "Invalid link format.");

    // Check if link is reachable using HEAD request
    const isReachable = async (url) => {
        try {
            const response = await axios.head(url, {
                timeout: 5000,
                headers: { "User-Agent": "Mozilla/5.0" },
            });
            return response.status >= 200 && response.status < 400;
        } catch (error) {
            console.error(`HEAD request failed for ${url}:`, error.message);
            return false;
        }
    };

    const isLinkReachable = await isReachable(link);

    let existingLinkId = linkIdObject;
    let existingLinkRef = null

    if (!linkIdObject) {
        // Run both queries in parallel for optimization
        const [existingLink] = await Promise.all([
            Link.findOne({ link }),
        ]);

        if (existingLink) {
            existingLinkId = existingLink._id;
        } else {
            // Create new link if it doesn't exist
            const contentType = detectContentType(link);
            const newLink = await Link.create({
                title,
                description: description || "",
                link,
                image,
                contentType,
            });

            if (!newLink) throw new ApiError(500, "Failed to create link.");
            existingLinkId = newLink._id;
        }
        existingLinkRef = existingLink
    }

    // Check if the user already has this link in the same collection
    const existingUserLink = await UserLink.findOne({
        userId: userIdObject,
        collectionId: collectionIdObject,
        linkId: existingLinkId,
    });

    if (existingUserLink) {
        throw new ApiError(400, "You already have this link in this collection")
    }

    // Create UserLink
    const newUserLink = await UserLink.create({
        userId: userIdObject,
        linkId: existingLinkId,
        collectionId: collectionIdObject,
        customTitle: title || existingUserLink?.title || "",
        customDescription: description || existingUserLink?.description || "",
    });

    if (!newUserLink) throw new ApiError(500, "Failed to create user link")

    const customLink = {
        title: newUserLink.customTitle,
        description: newUserLink.customDescription,
        collectionId: collectionId,
        link: link,
        image: image,
        isChecked: false,
        contentType: detectContentType(link),
    }

    return res.status(201).json(new ApiResponse(201, { data: customLink, isLinkReachable }, "Link created successfully"));
});

const createLinkWithMetadata = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;

    if (!collectionId) {
        throw new ApiError(400, "Collection ID is required.");
    }

    const { link, userId } = req.body;

    if (!userId) throw new ApiError(400, "User ID is required.");
    if (!link) throw new ApiError(400, "Link is required.");

    // Check if it's a valid URL
    let isValidUrl = false;
    try {
        new URL(link);
        isValidUrl = true;
    } catch (e) {
        // Not a valid URL, treat as a note
    }

    let title, description, image, contentType, uniqueLinkStr;

    if (isValidUrl) {
        // Fetch metadata
        let metadata;
        try {
            metadata = await fetchMetadata(link);
        } catch (error) {
            console.error("Error fetching metadata:", error);
            throw new ApiError(500, "Failed to fetch metadata.");
        }

        title = metadata?.title || "Untitled Link";
        description = metadata?.description || "";
        image = metadata?.image || null;
        contentType = metadata?.contentType || 'link';
        uniqueLinkStr = link;
    } else {
        title = link.substring(0, 30) + (link.length > 30 ? "..." : ""); // Short title from note
        description = link; // Full text as description
        image = null;
        contentType = 'note';
        uniqueLinkStr = `note://${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Check if link already exists (shared among users)
    let existingLink = await Link.findOne({ link: uniqueLinkStr });

    if (!existingLink) {
        // Create the Link document if it doesn't exist
        existingLink = await Link.create({
            title,
            description,
            link: uniqueLinkStr,
            image,
            contentType,
        });

        if (!existingLink) {
            throw new ApiError(500, "Failed to create link.");
        }
    }

    // Check if UserLink already exists (avoid duplicates)
    const existingUserLink = await UserLink.findOne({
        userId,
        collectionId,
        linkId: existingLink._id,
    });

    if (existingUserLink) {
        throw new ApiError(400, "You already have this link in your collection.");
    }

    // Create UserLink (user's personal reference)
    const newUserLink = await UserLink.create({
        userId,
        collectionId,
        linkId: existingLink._id,
        customTitle: title,
        customDescription: description,
    });

    return res.status(201).json(
        new ApiResponse(201, { userLink: newUserLink, link: existingLink }, "Link added to collection successfully")
    );
});

const getLinksByCollection = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;

    if (!collectionId) {
        throw new ApiError(400, "Collection ID is required");
    }

    const collectionIdObject = convertToObjectId(collectionId);

    // Fetch user-specific links from UserLink and populate link details
    const userLinks = await UserLink
        .find({ collectionId: collectionIdObject })
        .populate({
            path: "linkId",
            select: "title description link image contentType",
        })

    if (userLinks.length === 0) {
        throw new ApiError(404, "No links found for the given collection");
    }

    return res.status(200).json(new ApiResponse(200, userLinks, "Links retrieved successfully"));
});

const getAllLinks = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const userLinks = await UserLink
        .find({ userId: userId })
        .populate({
            path: "linkId",
            select: "title description link image contentType",
        })
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, userLinks, "All links retrieved successfully"));
});

const updateLink = asyncHandler(async (req, res) => {
    const { linkId } = req.params;

    if (!linkId) {
        throw new ApiError(400, "Link ID is required");
    }

    const { title, description, link } = req.body;

    // Ensure link is a valid URL if provided
    if (link && !validator.isURL(link)) {
        throw new ApiError(400, "Invalid link format.");
    }

    // Only update provided fields (prevent overwriting with undefined)
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (link) updateFields.link = link;

    // Update link document
    const updatedLink = await Link.findByIdAndUpdate(
        linkId,
        updateFields,
        { new: true } // Return updated document
    );

    // Handle case where link doesn't exist
    if (!updatedLink) {
        throw new ApiError(404, "Link not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedLink, "Link updated successfully"));
});

const deleteLink = asyncHandler(async (req, res) => {
    const { userLinkId } = req.params;

    if (!userLinkId) {
        throw new ApiError(400, "UserLink ID is required");
    }

    const userLinkIdObject = convertToObjectId(userLinkId)

    // Find the UserLink document
    const userLink = await UserLink.findById(userLinkIdObject);

    if (!userLink) {
        throw new ApiError(404, "UserLink not found");
    }

    const { linkId } = userLink;

    // Delete the user-specific link reference
    await UserLink.findByIdAndDelete(userLinkId);

    // Check if any other users still reference this link
    const otherReferences = await UserLink.findOne({ linkId });

    // If no other users have this link, delete the actual Link document
    if (!otherReferences) {
        await Link.findByIdAndDelete(linkId);
    }

    return res.status(200).json(new ApiResponse(
        200,
        { deletedUserLinkId: userLinkId },
        "UserLink deleted successfully"
    ));
});

const toggleIsChecked = asyncHandler(async (req, res) => {

    const { linkId } = req.params

    if (!linkId) {
        throw new ApiError(400, "Link ID is required")
    }

    const link = await UserLink.findById(linkId)

    if (!link) {
        throw new ApiError(400, "Link not found")
    }

    link.isChecked = !link.isChecked

    await link.save()

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            null,
            "Link updated successfully"
        ))
})

const moveLinkFromInbox = asyncHandler(async (req, res) => {

    const { collectionId, linkId } = req.body

    if (!collectionId) {
        throw new ApiError(400, "Collection ID is required")
    }

    const collection = await Collection.findById(collectionId)

    if (!collection) {
        throw new ApiError(404, "Collection not found")
    }

    const Link = await UserLink.findByIdAndUpdate(
        linkId,
        {
            $set: {
                collectionId
            }
        },
        { new: true }
    )

    if (!Link) {
        throw new ApiError(404, "Link not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            null,
            "Link moved successfully"
        ))
})

export { createLink, createLinkWithMetadata, getLinksByCollection, getAllLinks, updateLink, deleteLink, toggleIsChecked, moveLinkFromInbox }