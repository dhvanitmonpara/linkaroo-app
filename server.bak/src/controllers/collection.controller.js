import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Collection } from "../models/collection.model.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import getPublicId from "../utils/getPublicId.js"
import collectionOwnerVerification from "../utils/collectionOwnerVerification.js"
import { Link } from "../models/link.model.js"
import { User } from "../models/user.model.js"
import convertToObjectId from "../utils/convertToObjectId.js"
import { clerkClient } from "@clerk/express"

const createCollection = asyncHandler(async (req, res) => {

    const { title, description = "", theme = "bg-zinc-200", coverImage, isInbox = false, type, userEmail } = req.body

    if (!title) {
        throw new ApiError(400, "Title is required")
    }

    if (!userEmail) {
        throw new ApiError(400, "User email is required")
    }

    const user = await User.findOne({
        email: userEmail
    })

    if (!user || !user._id) {
        throw new ApiError(400, "User not found in database")
    }

    const collectionOnDatabase = await Collection.findOne({
        title,
        createdBy: user._id
    })

    if (collectionOnDatabase) {
        throw new ApiError(400, "Collection with the same title already exists")
    }

    const collection = await Collection.create({
        createdBy: user._id,
        title,
        description,
        isInbox,
        theme,
        type,
        coverImage,
        collaborators: []
    })

    if (!collection) {
        throw new ApiError(500, "Failed to create collection")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collection,
            "Collection created successfully"
        ))
})

const addCollaborator = asyncHandler(async (req, res) => {

    const { collectionId } = req.params

    const collection = await Collection.findById(collectionId)

    if (!collection) {
        throw new ApiError(404, "Collection not found")
    }

    if (collection.isInbox) {
        throw new ApiError(400, "Inbox is not a collection")
    }

    const { collectionOwnerId, collaboratorId } = req.body

    if (!collectionOwnerId || !collaboratorId) {
        throw new ApiError(400, "collectionOwnerId and collaboratorId are required")
    }

    collectionOwnerVerification(collection.createdBy, collectionOwnerId, res)

    if (collectionOwnerId == collaboratorId) {
        throw new ApiError(400, "You cannot add yourself as a collaborator")
    }

    if (collection.collaborators.includes(collaboratorId)) {
        throw new ApiError(400, "User is already a collaborator")
    }

    collection.collaborators.push(collaboratorId)
    await collection.save()

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collection,
            "Collaborator added successfully"
        ))
})

const deleteCollaborator = asyncHandler(async (req, res) => {

    const collectionId = req.params.collectionId

    const collection = await Collection.findById(collectionId)

    if (!collection) {
        throw new ApiError(404, "Collection not found")
    }

    const { collectionOwnerId, collaboratorId } = req.body

    if (!collectionOwnerId || !collaboratorId) {
        throw new ApiError(400, "collectionOwnerId and collaboratorId are required")
    }

    collectionOwnerVerification(collection.createdBy, collectionOwnerId, res)

    const newCollaborators = collection.collaborators.filter(collaborator => (
        (typeof collaborator == "object" ? collaborator.valueOf().toString() : collaborator.toString()) !== collaboratorId.toString()
    ))
    collection.collaborators = newCollaborators
    await collection.save()

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collection,
            "Collaborator deleted successfully"
        ))
})

const copyCollection = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;
    const { userId } = req.body;

    if (!collectionId) throw new ApiError(400, "Collection ID is required");
    if (!userId) throw new ApiError(400, "User ID is required");

    const collectionIdObject = convertToObjectId(collectionId);
    const userIdObject = convertToObjectId(userId);

    const collection = await Collection
        .findById(collectionIdObject)
        .select("-collaborators -viewers -isInbox -isPublic -tags -createdAt -updatedAt");

    if (!collection) throw new ApiError(404, "Collection not found");

    const existingCollection = await Collection.findOne({
        title: collection.title + " (copy)",
        createdBy: userIdObject,
        type: collection.type
    });

    if (existingCollection) {
        return res.status(301).json(new ApiResponse(
            301,
            { _id: existingCollection._id },
            "Collection already exists"
        ));
    }

    const newCollection = await Collection.create({
        createdBy: userIdObject,
        title: collection.title + " (copy)",
        description: collection.description,
        theme: collection.theme,
        coverImage: collection.coverImage,
        collaborators: [],
        icon: collection.icon,
        viewers: [],
        type: collection.type
    });

    if (!newCollection) throw new ApiError(500, "Failed to create collection");

    const links = await Link.find({ collectionId: collectionIdObject }).lean();

    if (links.length > 0) {
        const newLinks = links.map(({ title, description, link, image, tags, icon }) => ({
            collectionId: newCollection._id,
            title,
            description,
            link,
            image,
            tags,
            icon
        }));

        try {
            await Link.insertMany(newLinks);
        } catch (error) {
            throw new ApiError(500, "Failed to copy links");
        }
    }

    return res.status(200).json(new ApiResponse(
        200,
        newCollection,
        "Collection copied successfully"
    ));
});

const getCollectionById = asyncHandler(async (req, res) => {
    const { collectionId } = req.params

    if (!collectionId) {
        throw new ApiError(400, "Collection ID is required")
    }

    const collectionIdObject = convertToObjectId(collectionId);

    const collections = await Collection.aggregate([
        {
            $match: { _id: collectionIdObject }
        },
        {
            $lookup: {
                from: 'tags',
                localField: 'tags',
                foreignField: '_id',
                as: 'tags'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy'
            }
        },
        {
            $unwind: '$createdBy'
        },
        {
            $lookup: {
                from: 'users',
                localField: 'collaborators',
                foreignField: '_id',
                as: 'collaborators'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'viewers',
                foreignField: '_id',
                as: 'viewers'
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                theme: 1,
                createdAt: 1,
                isInbox: 1,
                type: 1,
                isPublic: 1,
                updatedAt: 1,
                coverImage: 1,
                collaborators: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    clerkId: 1,
                },
                createdBy: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    clerkId: 1,
                },
                viewers: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    clerkId: 1,
                },
                tags: 1
            }
        }
    ])

    if (!collections) {
        throw new ApiError(404, "Collection not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collections[0],
            "Collection retrieved successfully"
        ))

})

const getCollectionByName = asyncHandler(async (req, res) => {
    const { collectionName } = req.params

    if (!collectionName) {
        throw new ApiError(400, "Collection name is required")
    }

    const collection = await Collection.findOne(
        { title: collectionName, isInbox: true },
        {
            title: 1,
            description: 1,
            theme: 1,
            createdAt: 1,
            isInbox: 1,
            type: 1,
            updatedAt: 1,
            createdBy: 1,
        }
    );

    if (!collection) {
        throw new ApiError(404, "Collection not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collection,
            "Collection retrieved successfully"
        ))

})

const updateCollection = asyncHandler(async (req, res) => {

    const { collectionId } = req.params

    if (!collectionId) {
        throw new ApiError(400, "Collection ID is required")
    }

    const collection = await Collection.findById(collectionId)

    const { collectionOwnerId, title, description, theme = "dark" } = req.body

    if (!collectionOwnerId) {
        throw new ApiError(400, "collectionOwnerId is required")
    }

    collectionOwnerVerification(collection.createdBy, collectionOwnerId, res)

    const updatedCollection = await Collection.findByIdAndUpdate(
        collectionId,
        {
            $set: {
                title,
                description,
                theme,
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedCollection,
            "Collection updated successfully"
        ))
})

const deleteCollection = asyncHandler(async (req, res) => {

    const { collectionId, collectionOwnerId } = req.params

    if (!collectionId) throw new ApiError(400, "Collection ID is required");
    if (!collectionOwnerId) throw new ApiError(400, "collectionOwnerId is required");

    const collection = await Collection.findById(collectionId)

    if (!collection) {
        throw new ApiError(404, "Collection not found")
    }

    collectionOwnerVerification(collection.createdBy, collectionOwnerId, res)

    const collectionLinks = Link.deleteMany({ collectionId })

    if (!collectionLinks) {
        throw new ApiError(500, "Failed to delete Collection links")
    }

    await Collection.deleteOne()

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Collection deleted successfully"
        ))
})

const getCollectionsByOwner = asyncHandler(async (req, res) => {

    const { userId } = req.params

    if (!userId) {
        throw new ApiError(400, "User ID is required")
    }

    const userIdObject = convertToObjectId(userId);

    const collections = await Collection.find({ createdBy: userIdObject })

    if (!collections) {
        throw new ApiError(404, "No collections found for this user")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collections,
            "Collections fetched successfully"
        ))
})

const getCollectionsByCollaborator = asyncHandler(async (req, res) => {

    const { collaboratorId } = req.params

    if (!collaboratorId) {
        throw new ApiError(400, "User ID is required")
    }

    const collaboratorIdObject = convertToObjectId(collaboratorId);

    const collections = await Collection.find({ collaborators: collaboratorIdObject })

    if (!collections) {
        throw new ApiError(404, "No collections found for this user")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collections,
            "Collections fetched successfully"
        ))

})

const getCollectionsByUser = asyncHandler(async (req, res) => {

    const { userId } = req.params

    if (!userId) throw new ApiError(400, "User ID is required");
    const userIdObject = convertToObjectId(userId);

    const collections = await Collection.aggregate([
        {
            $match: {
                $or: [
                    { createdBy: userIdObject },
                    { collaborators: userIdObject },
                ],
            }
        },
        {
            $lookup: {
                from: 'tags',
                localField: 'tags',
                foreignField: '_id',
                as: 'tags'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy'
            }
        },
        {
            $unwind: '$createdBy'
        },
        {
            $lookup: {
                from: 'users',
                localField: 'collaborators',
                foreignField: '_id',
                as: 'collaborators'
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                theme: 1,
                font: 1,
                createdAt: 1,
                updatedAt: 1,
                type: 1,
                isInbox: 1,
                coverImage: 1,
                isPublic: 1,
                collaborators: {
                    _id: 1,
                    email: 1,
                    username: 1,
                    clerkId: 1,
                },
                createdBy: {
                    _id: 1,
                    email: 1,
                    username: 1,
                    clerkId: 1,
                },
                tags: 1
            }
        }
    ])

    if (!collections) throw new ApiError(404, "No collections found");

    // Extract unique emails from creators and collaborators
    const uniqueEmails = [
        ...new Set([
            ...collections.map(collection => collection.createdBy.email),
            ...collections.flatMap(collection =>
                collection.collaborators ? collection.collaborators.map(c => c.email) : []
            )
        ])
    ];

    if (uniqueEmails.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(
                300,
                collections,
                "Collections fetched successfully but no users found"
            ))
    }

    const users = await clerkClient.users.getUserList({
        emailAddress: uniqueEmails,
        limit: uniqueEmails.length,
    });

    const collectionWithUsers = collections.map(collection => {

        const creator = users.data.find(user =>
            Array.isArray(user.emailAddresses) &&
            user.emailAddresses.some(email => email.emailAddress.toLowerCase() === collection.createdBy.email.toLowerCase())
        )

        const processedCollection = {
            ...collection,
            createdBy: {
                ...collection.createdBy,
                fullName: creator?.fullName || creator?.firstName,
                imageUrl: creator?.imageUrl || null
            },
            collaborators: (collection.collaborators || []).map(collaborator => {
                const collaboratorUser = users.data.find(user =>
                    Array.isArray(user.emailAddresses) &&
                    user.emailAddresses.some(email => email.emailAddress.toLowerCase() === collaborator.email.toLowerCase())
                );

                return {
                    ...collaborator,
                    fullName: collaborator?.fullName || collaborator?.firstName,
                    imageUrl: collaboratorUser?.imageUrl || null
                };
            })
        }

        return processedCollection
    });

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collectionWithUsers,
            "Collections fetched successfully"
        ))
})

const getCollectionsByTagId = asyncHandler(async (req, res) => {

    const tagId = req.params.tagId

    if (!tagId) {
        throw new ApiError(404, "Tag id is required")
    }

    const tagIdObject = convertToObjectId(tagId);

    const collections = await Collection.find({ tags: tagIdObject })

    if (!collections) {
        throw new ApiError(404, "No collections found for this tag")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collections,
            "Collections fetched successfully"
        ))

})

const uploadCoverImage = asyncHandler(async (req, res) => {
    const { collectionId, userId } = req.params

    if (!collectionId) {
        throw new ApiError(400, "Collection ID is required")
    }

    if (!userId) {
        throw new ApiError(400, "User ID is required")
    }

    const collection = await Collection.findById(CollectionId)

    if (!collection) {
        throw new ApiError(404, "Collection not found")
    }

    collectionOwnerVerification(collection.createdBy, userId, res)

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    collection.coverImage = coverImage.url;
    await collection.save();

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                collectionId: collection._id,
                coverImage: coverImage.url,
            },
            "Cover image uploaded successfully"
        ))
})

const updateCoverImage = asyncHandler(async (req, res) => {
    const { collectionId, userId } = req.params

    if (!collectionId) {
        throw new ApiError(400, "Collection ID is required")
    }

    if (!userId) {
        throw new ApiError(400, "User ID is required")
    }

    const collection = await Collection.findById(CollectionId);

    if (!collection) {
        throw new ApiError(404, "Collection not found")
    }

    collectionOwnerVerification(collection.createdBy, userId, res)

    if (!collection.coverImage) {
        throw new ApiError(400, "No cover image currently attached to this Collection")
    }

    const coverImageName = getPublicId(collection.coverImage);

    if (!coverImageName) {
        throw new ApiError(500, "Error while extracting image name from image URL")
    }

    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const cloudinaryRes = await deleteFromCloudinary(coverImageName);

    collection.coverImage = coverImage.url;
    await collection.save();

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { collection, cloudinaryRes },
            "Cover image updated successfully"
        ))
});

const deleteCoverImage = asyncHandler(async (req, res) => {
    const { collectionId, userId } = req.params

    if (!collectionId) {
        throw new ApiError(400, "Collection ID is required")
    }

    if (!userId) {
        throw new ApiError(400, "User ID is required")
    }

    const collection = await Collection.findById(collectionId);

    if (!collection) {
        throw new ApiError(404, "Collection not found")
    }

    collectionOwnerVerification(collection.createdBy, userId, res)

    if (!collection.coverImage) {
        return res.status(400).json(new ApiResponse(400, "No cover image found"))
    }

    const coverImageName = getPublicId(collection.coverImage);

    const coverImage = deleteFromCloudinary(coverImageName);

    if (!coverImage) {
        throw new ApiError(500, "Error while deleting cover image from Cloudinary")
    }

    collection.coverImage = "";
    await collection.save();

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { collection, coverImage },
            "Cover image deleted successfully"
        ))

})

const toggleIsPublic = asyncHandler(async (req, res) => {

    const { collectionId } = req.params

    if (!collectionId) {
        throw new ApiError(400, "Collection ID is required")
    }

    const collection = await Collection.findById(collectionId)

    if (!collection) {
        throw new ApiError(404, "Collection not found")
    }

    collection.isPublic = !collection.isPublic;
    await collection.save()

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Collection visibility toggled successfully"
        ))

})

export {
    createCollection,
    copyCollection,
    getCollectionById,
    getCollectionsByOwner,
    getCollectionsByCollaborator,
    getCollectionsByTagId,
    getCollectionsByUser,
    updateCollection,
    deleteCollection,
    addCollaborator,
    deleteCollaborator,
    updateCoverImage,
    uploadCoverImage,
    getCollectionByName,
    deleteCoverImage,
    toggleIsPublic
}