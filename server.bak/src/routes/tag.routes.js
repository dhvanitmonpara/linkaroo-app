import { Router } from "express";
import {
    createTag,
    deleteTag,
    addTag,
    removeTag,
    getTagsByCollection,
    getTagsByOwner,
    getTagsByCollaborator,
    renameTag,
    customizeCollectionTag
} from "../controllers/tag.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

// secure routes
router.use(verifyJWT)
router.route("/").post(createTag)

router.route("/get/collections/:collectionId").get(getTagsByCollection)
router.route("/get/o/:userId").get(getTagsByOwner)
router.route("/get/c/:collaboratorId").get(getTagsByCollaborator)

router.route("/:collectionId/add").patch(addTag)
router.route("/:collectionId/remove").patch(removeTag)
router.route("/:collectionId/customize").patch(customizeCollectionTag)

router.route("/:tagId")
    .delete(deleteTag)
    .put(renameTag)

export default router