import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Tag } from "../models/tag.model.js"
import { Collection } from "../models/collection.model.js"
import convertToObjectId from "../utils/convertToObjectId.js"
import collectionOwnerVerification from "../utils/collectionOwnerVerification.js"

const addUsernameInTag = (tag, username) => {
    const addedUserTag = username + "/" + tag
    return addedUserTag
}

const removeUsernameTag = (tag, username) => {
    const removedUserTag = tag.replace(username + "/", "")
    return removedUserTag
}

const createTag = asyncHandler(async (req, res) => {

    const { tag, username, userId } = req.body

    if (!tag) throw new ApiError(400, "tag is required");
    if (!userId) throw new ApiError(400, "userId is required");

    const userIdObject = convertToObjectId(userId);
    const userTag = addUsernameInTag(tag, username)
    const existingTag = await Tag.findOne({ tagname: userTag })

    if (existingTag) throw new ApiError(400, "Tag already exists");

    const newTag = await Tag.create({ tagname: userTag, owner: userIdObject })
    const removedUserTag = removeUsernameTag(newTag.tagname, username)

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            { tagname: removedUserTag },
            "Tag created successfully"
        ))
})

const removeTag = asyncHandler(async (req, res) => {

    const collectionId = req.params.collectionId

    const { tag } = req.body

    if (!tag) {
        throw new ApiError(400, "Tag is required")
    }

    const collection = await Collection.findById(collectionId)

    if (!collection) {
        throw new ApiError(404, "Collection not found")
    }

    collectionOwnerVerification(collection.createdBy, req.user, res)

    const userTag = addUsernameInTag(tag, req.user.username)

    const existingTag = await Tag.findOne({ tagname: userTag })

    if (!existingTag) {
        throw new ApiError(404, "Tag not found")
    }

    const tagId = existingTag._id

    if (!tagId) {
        throw new ApiError(400, "Tag ID is required")
    }

    collection.tags = collection.tags.filter(t => t.toString() !== tagId.toString())
    await collection.save()

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collection,
            "Tag deleted successfully"
        ))

})

const deleteTag = asyncHandler(async (req, res) => {

    const { tagId } = req.params

    if (!tagId) {
        throw new ApiError(400, "Tag ID is required")
    }

    const tagOnCollections = await Collection.updateMany(
        { tags: tagId },
        { $pull: { tags: tagId } }
    );

    if (tagOnCollections.length > 0) {
        throw new ApiError(400, "Tag is used on a collection")
    }

    const tag = await Tag.findByIdAndDelete(tagId)

    if (!tag) {
        throw new ApiError(404, "Tag not found")
    }

    const removedUserTag = removeUsernameTag(tag.tagname)

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                tagname: removedUserTag,
                tagOnCollections
            },
            "Tag deleted successfully"
        ))

})

const addTag = asyncHandler(async (req, res) => {

    const collectionId = req.params.collectionId

    const collectionOnDatabase = await Collection.findById(collectionId)

    if (!collectionOnDatabase) {
        throw new ApiError(404, "Collection not found")
    }

    collectionOwnerVerification(collectionOnDatabase.createdBy, req.user, res)

    const { tag } = req.body

    if (!tag) {
        throw new ApiError(400, "Tag is required")
    }

    const userTag = addUsernameInTag(tag, req.user.username)

    const existingTag = await Tag.findOne({ tagname: userTag })

    if (!existingTag) {
        throw new ApiError(400, "Tag not found")
    }

    const tagAlreadyExists = collectionOnDatabase.tags.includes(existingTag._id)

    if (tagAlreadyExists) {
        throw new ApiError(400, "Tag already exists")
    }

    collectionOnDatabase.tags.push(existingTag._id)
    await collectionOnDatabase.save()

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collectionOnDatabase,
            "Tag added successfully"
        ))

})

const getTagsByCollection = asyncHandler(async (req, res) => {

    const { collectionId } = req.params

    if (!collectionId) {
        throw new ApiError(400, "Collection ID is required")
    }

    const tagIds = await Collection.findById(collectionId).select("tags")

    if (!tagIds) {
        throw new ApiError(404, "Collection not found")
    }

    const tags = await Tag.find({ _id: { $in: tagIds.tags } })

    if (!tags) {
        throw new ApiError(404, "Tags not found")
    }

    tags.forEach(tag => {
        tag.tagname = removeUsernameTag(tag.tagname)
    })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            tags,
            "Tags retrieved successfully"
        ))

})

const getTagsByOwner = asyncHandler(async (req, res) => {

    const { userId } = req.params
    if (!userId) throw new ApiError(400, "User ID is required");

    const tags = await Tag.find({ owner: userId })

    if (!tags) {
        throw new ApiError(404, "No tags found for this user")
    }

    tags.forEach(tag => {
        tag.tagname = removeUsernameTag(tag.tagname)
    })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            tags,
            "Tags retrieved successfully"
        ))
})

const getTagsByCollaborator = asyncHandler(async (req, res) => {

    const { collaboratorId } = req.params
    if (!collaboratorId) throw new ApiError(400, "Collaborator ID is required");

    const tags = await Collection.aggregate([
        {
            $match: { collaborators: req.collaboratorId }
        },
        {
            $lookup: {
                from: 'tags',
                localField: 'tags',
                foreignField: '_id',
                as: 'tagname'
            }
        },
        {
            $unwind: '$tagname'
        },
        {
            $lookup: {
                from: 'users',
                localField: 'tagname.owner',
                foreignField: '_id',
                as: 'tagOwner'
            }
        },
        {
            $unwind: "$tagOwner"
        },
        {
            $project: {
                _id: 1,
                collectionTitle: "$title",
                collaborators: 1,
                tagname: '$tagname.tagname',
                tagId: '$tagname._id',
                owner: "$tagOwner.username"

            }
        }
    ])

    if (!tags) {
        throw new ApiError(500, "Error while fetching tags")
    }

    tags.forEach(tag => {
        tag.tagname = removeUsernameTag(tag.tagname, tag.owner)
    })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            tags,
            "Tags retrieved successfully"
        ))

})

const renameTag = asyncHandler(async (req, res) => {

    const tagId = req.params.tagId
    const newTagname = req.body.newTagname

    if (!tagId || !newTagname) {
        throw new ApiError(400, "Tag ID and new tagname are required")
    }

    const userTag = addUsernameInTag(newTagname, req.user.username)

    const newTag = await Tag.findByIdAndUpdate(
        tagId,
        { tagname: userTag },
        { new: true }
    )

    if (!newTag) {
        throw new ApiError(404, "Tag not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            newTag,
            "Tag renamed successfully"
        ))

})

const customizeCollectionTag = asyncHandler(async (req, res) => {
    const collectionId = req.params.collectionId
    const tagArray = req.body.tagArray

    if (!collectionId || !tagArray) {
        throw new ApiError(400, "Collection ID and tag array are required")
    }

    const collection = await Collection.findByIdAndUpdate(
        collectionId,
        { tags: tagArray },
        { new: true }
    )

    if (!collection) {
        throw new ApiError(404, "Collection not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            collection,
            "Tags updated successfully"
        ))

})

export {
    createTag,
    deleteTag,
    addTag,
    removeTag,
    getTagsByCollection,
    getTagsByOwner,
    getTagsByCollaborator,
    renameTag,
    customizeCollectionTag,
    removeUsernameTag,
    addUsernameInTag,
}