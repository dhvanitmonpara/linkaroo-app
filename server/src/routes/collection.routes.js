import { Router } from "express";
import {
    createCollection,
    getCollectionById,
    getCollectionsByOwner,
    getCollectionsByCollaborator,
    getCollectionsByTagId,
    updateCollection,
    deleteCollection,
    addCollaborator,
    deleteCollaborator,
    updateCoverImage,
    uploadCoverImage,
    deleteCoverImage,
    toggleIsPublic,
    copyCollection,
    getCollectionsByUser,
    getCollectionByName
} from "../controllers/collection.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

// secure routes
router.use(verifyJWT)
router.route("/").post(createCollection)

router.route("/u/:collectionId").get(getCollectionById)
router.route("/u/all/:userId").get(getCollectionsByUser)

router.route("/o/get/:userId").get(getCollectionsByOwner)
router.route("/o/:collectionId/:collectionOwnerId")
    .delete(deleteCollection)
router.route("/o/:collectionId")
    .patch(updateCollection)

router.route("/c/get/:collaboratorId").get(getCollectionsByCollaborator)

router.route("/v/:collectionId").post(copyCollection)

router.route("/o/c/:collectionId")
    .patch(addCollaborator)
    .delete(deleteCollaborator)

router.route("/t/:tagId").get(getCollectionsByTagId)

router.route("/n/:collectionName").get(getCollectionByName)

router.route("/status/:collectionId").patch(toggleIsPublic)

router.route("/o/:collectionId/cover-image/:userId")
    .delete(deleteCoverImage)
    .post(upload.single("coverImage"), uploadCoverImage)
    .patch(upload.single("coverImage"), updateCoverImage)

export default router