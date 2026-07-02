import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import getPublicId from "../utils/getPublicId.js"
import collectionOwnerVerification from "../utils/collectionOwnerVerification.js"
import { Collection } from "../models/collection.model.js"

const searchPublicLinks = asyncHandler(async (res, req) => {

    const linkTitle = res.query.linkTitle

    if(!linkTitle) {
        throw new ApiError(400, "Card title is required")
    }

    const links = await Collection.aggregate([
        {
            $match: {
                isPrivate: false
            }
        }
    ])

})

export { searchPublicLinks }