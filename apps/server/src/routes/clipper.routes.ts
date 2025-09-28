import express, { type Router } from "express"
import { clip } from "../controllers/clipper.controller.js"
import { getUploadUrl } from "../controllers/files.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router: Router = express.Router()

router.post("/clip", verifyJWT, clip)

router.post("/upload-url", verifyJWT, getUploadUrl)

export default router
