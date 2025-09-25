import express, { type Router } from "express"
import {
	getAllJobsController,
	getJob,
	getUserJobs,
} from "../controllers/jobs.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router: Router = express.Router()

router.get("/:id", verifyJWT, getJob)
router.get("/user/:username", verifyJWT, getUserJobs)
router.get("/", verifyJWT, getAllJobsController)

export default router
