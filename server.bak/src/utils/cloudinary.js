import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        // file has been uploaded successfully
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation is failed
        throw new ApiError(500, "Failed to upload to cloudinary: ", error.message)
    }
}

const deleteFromCloudinary = async (cloudFileName, resourceType = "image") => {
    try {
        if (!cloudFileName) return null
        const response = await cloudinary.uploader.destroy(cloudFileName, { resource_type: resourceType }, (err, result) => {
            if (err) { throw new ApiError(500, "Failed to delete from cloudinary: ", err.message) }
            return result
        })
        return response
    } catch (error) {
        throw new ApiError(500, "Failed to delete from cloudinary: ", error.message)
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }