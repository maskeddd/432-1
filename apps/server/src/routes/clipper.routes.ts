import express, { type Router } from "express"
import multer from "multer"
import { clip, processTemp } from "../controllers/clipper.controller.js"
import { optionalAuth } from "../middlewares/auth.middleware.js"

const router: Router = express.Router()

const upload = multer({
	storage: multer.diskStorage({
		destination: "uploads/",
		filename: (_, file, cb) => {
			cb(null, `${Date.now()}-${file.originalname}`)
		},
	}),
})

router.post("/clip", optionalAuth, upload.single("video"), clip)

router.post("/upload", upload.single("video"), (req, res) => {
	if (!req.file) return res.status(400).json({ error: "No file uploaded" })
	res.json({ filename: req.file.filename })
})

router.post("/process", optionalAuth, upload.single("video"), processTemp)

export default router
