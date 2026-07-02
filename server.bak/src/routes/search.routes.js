import { Router } from "express";
import {
    searchPublicLinks
} from "../controllers/search.controller.js";

const router = Router()

// secure routes
router.route("/links/public/:linkTitle").get(searchPublicLinks)

export default router