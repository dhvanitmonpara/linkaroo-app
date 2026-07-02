import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import getPublicId from "../utils/getPublicId.js"
import sendMail from "../utils/sendMail.js"
import { Collection } from "../models/collection.model.js"

const createUser = async (req, res) => {
    try {
        const { email, username, clerkId } = req.body;

        if (!username || !email || !clerkId) {
            return res.status(400).json({ status: 400, message: "All fields are required" });
        }

        const existedUser = await User.findOne({ $or: [{ username }, { email }] });

        if (existedUser) {
            return res.status(400).json({ status: 400, message: "User with email or username already exists" });
        }

        const user = await User.create({
            email,
            clerkId,
            username: username.toLowerCase(),
        });

        if (!user) {
            return res.status(500).json({ status: 500, message: "Something went wrong while creating user" });
        }

        const inbox = await Collection.create({
            createdBy: user._id,
            title: `${username}/inbox`,
            isInbox: true,
        });

        if (!inbox) {
            return res.status(500).json({ status: 500, message: "Something went wrong while creating inbox" });
        }

        return res.status(201).json({
            status: 201,
            data: { user, inbox },
            message: "User registered successfully",
        });

    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
}

const getCurrentUser = asyncHandler(async (req, res) => {

    const { email } = req.params

    if (!email) {
        return res
            .status(400)
            .json(new ApiResponse(
                400,
                {},
                "Email is required"
            ))
    }

    const user = await User.findOne({ email })

    if (!user) {
        return res
            .status(404)
            .json(new ApiResponse(
                404,
                user,
                "User not found"
            ))
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Current user fetched successfully"
        ))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Account details updated successfully"
        ))
})

const searchUserByEmail = asyncHandler(async (req, res) => {
    const { user } = req.body;

    // FIXME: Add fuzzy search
    // const users = await User.aggregate([
    //     {
    //         $search: {
    //             index: 'username_text_email_text', // Replace with your actual search index name
    //             text: {
    //                 query: `"${user}"`,
    //                 path: ['username', 'email'],
    //                 fuzzy: { maxEdits: 1 } // Adjust maxEdits as needed
    //             }
    //         }
    //     },
    //     {
    //         $project: { _id: 0, username: 1, email: 1 }
    //     }
    // ]);

    // const users = await User.aggregate([
    //     {
    //       $match: {
    //         $text: { $search: user }
    //       }
    //     },
    //     {
    //       $project: {
    //         _id: 0,
    //         username: 1,
    //         email: 1,
    //         score: { $meta: "textScore" }
    //       }
    //     },
    //     {
    //       $sort: { score: -1 }
    //     },
    //     {
    //       $limit: 10
    //     }
    //   ]);

    // const listIndexes = await User.collection.listIndexes().toArray();
    // console.log("Search Indexes:", listIndexes);

    const users = await User.find({
        email: { $regex: user, $options: 'i' }
    }, { _id: 0, username: 1, email: 1 });

    if (!users) {
        throw new ApiError(404, "No users found")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            users,
            "Users fetched successfully"
        ));
});

const searchUserByUsername = asyncHandler(async (req, res) => {
    const { user } = req.body;
    const users = await User.find({
        $or: [
            { username: { $regex: user, $options: 'i' } },
            { email: { $regex: user, $options: 'i' } }
        ]
    }, { _id: 0, username: 1, email: 1 })

    if (!users) {
        throw new ApiError(404, "No users found")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            users,
            "Users fetched successfully"
        ));
})

const sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body; ``

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const mailResponse = await sendMail(email, "OTP");

        if (!mailResponse.success) {
            console.error("Failed to send OTP:", mailResponse.error);
            return res.status(500).json({ message: mailResponse.error || "Failed to send OTP" });
        }

        return res.status(200).json({
            messageId: mailResponse.messageId,
            otp: mailResponse.otpCode,
            message: "OTP sent successfully"
        });
    } catch (error) {
        console.error("Error in sendOtp:", error.message);
        return res.status(500).json({
            message: "Failed to send OTP due to server error",
            error: error.message
        });
    }
});

const updateBio = asyncHandler(async (req, res) => {

    const bio = req.body.bio

    if (!bio) {
        throw new ApiError(400, "Bio is required")
    }

    const userId = req.user?._id

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                bio
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Bio updated successfully"
        ))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    // deleting cover image from cloudinary

    const oldImagePath = await User.findById(req.user?._id).$project({ coverImage: 1 })

    const coverImageName = getPublicId(oldImagePath.coverImage)

    if (!coverImageName) {
        throw new ApiError(500, "Error while extracting image name from image URL",)
    }

    const response = await deleteFromCloudinary(coverImageName)

    // updating profile in the database

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-bio")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                user,
                deletionResponse: response
            },
            "Cover image updated successfully"
        ))
})

const uploadUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const coverImageURL = coverImage?.url

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImageURL
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                user,
                coverImageURL
            },
            "Cover image uploaded successfully"
        ))
})

const toggleTheme = asyncHandler(async (req, res) => {

    const { theme } = req.body

    const userId = req.user?._id

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                theme: theme
            }
        },
        {
            new: true
        }
    ).select("-coverImage -bio")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Theme updated successfully"
        ))

})

const updateProfileSettings = asyncHandler(async (req, res) => {

    const { font = "font-mono", theme = "dark", isSearchShortcutEnabled, useFullTypeFormAdder } = req.body;
    const { userId } = req.params

    if (!userId) throw new ApiError(400, "User ID is required");

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                font,
                theme,
                isSearchShortcutEnabled,
                useFullTypeFormAdder
            }
        },
        {
            new: true,
        }
    );

    if (!user) {
        throw new ApiError(500, "Failed to update profile settings");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            "Profile settings updated successfully"
        )
    );
});

const sendFeedback = asyncHandler(async (req, res) => {

    const { title, description } = req.body
    const sendBy = req.user.email

    if (!title || !description) {
        throw new ApiError(400, "title and description are required")
    }

    if (!sendBy) {
        throw new ApiError(400, "Email is required")
    }

    try {
        const mailResponse = await sendMail(process.env.GMAIL_USER, "FEEDBACK-SENT", {
            title,
            description,
            sendBy
        });

        if (!mailResponse.success) {
            console.error("Failed to send Feedback:", mailResponse.error);
            return res.status(500).json({ message: mailResponse.error || "Failed to send Feedback" });
        }

        sendMail(sendBy, "FEEDBACK-RECEIVED");

        return res.status(200).json({
            success: true,
            messageId: mailResponse.messageId,
            message: "Feedback sent successfully"
        });
    } catch (error) {
        console.error("Error in sendFeedback:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to send feedback due to server error",
            error: error.message
        });
    }
})

export {
    createUser,
    getCurrentUser,
    updateAccountDetails,
    searchUserByEmail,
    searchUserByUsername,
    updateBio,
    updateUserCoverImage,
    uploadUserCoverImage,
    toggleTheme,
    updateProfileSettings,
    sendOtp,
    sendFeedback
}