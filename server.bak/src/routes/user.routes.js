import { Router } from "express";
import {
    createUser,
    getCurrentUser,
    updateAccountDetails,
    searchUserByEmail,
    searchUserByUsername,
    updateBio,
    updateProfileSettings,
    uploadUserCoverImage,
    updateUserCoverImage,
    toggleTheme,
    sendOtp,
    sendFeedback
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/").post(createUser)
router.route("/send-otp").post(sendOtp)
router.route("/current/:email").get(getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/update-bio").patch(verifyJWT, updateBio)
router.route("/settings/update/:userId").post(verifyJWT, updateProfileSettings)
router.route("/cover-image")
    .post(verifyJWT, upload.single("coverImage"), uploadUserCoverImage)
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/theme").patch(verifyJWT, toggleTheme)
router.route("/verified-search/email").patch(searchUserByEmail)
router.route("/feedback").post(verifyJWT, sendFeedback)
router.route("/search/email").patch(searchUserByEmail)
router.route("/verified-search/username").patch(searchUserByUsername)
router.route("/search/username").patch(searchUserByUsername)

export default router;