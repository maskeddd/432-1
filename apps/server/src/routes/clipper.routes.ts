import express, { type Router } from "express"
import multer from "multer"
import { clip } from "../controllers/clipper.controller.js"
import { handleUpload } from "../controllers/upload.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router: Router = express.Router()

// const upload = multer({
// 	storage: multer.diskStorage({
// 		destination: "uploads/",
// 		filename: (_, file, cb) => {
// 			cb(null, `${Date.now()}-${file.originalname}`)
// 		},
// 	}),
// })

const upload = multer({
	storage: multer.memoryStorage(),
})

router.post("/clip", verifyJWT, upload.single("video"), clip)

router.post("/upload", verifyJWT, upload.single("video"), handleUpload)

export default router
