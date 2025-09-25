import express, { type Router } from "express"
import multer from "multer"
import { clip } from "../controllers/clipper.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router: Router = express.Router()

const upload = multer({
	storage: multer.diskStorage({
		destination: "uploads/",
		filename: (_, file, cb) => {
			cb(null, `${Date.now()}-${file.originalname}`)
		},
	}),
})

router.post("/clip", verifyJWT, upload.single("video"), clip)

export default router
