import express from "express"
import multer from "multer"
import { clip } from "../controllers/clipper.controller.ts"

const router = express.Router()

const upload = multer({
	storage: multer.diskStorage({
		destination: "uploads/",
		filename: (_, file, cb) => {
			cb(null, `${Date.now()}-${file.originalname}`)
		},
	}),
})

router.post("/clip", upload.single("video"), clip)

export default router
