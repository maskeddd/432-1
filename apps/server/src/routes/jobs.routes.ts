import express, { type Router } from "express"
import {
	getAllJobsController,
	getJob,
	getUserJobs,
} from "../controllers/jobs.controller.js"
import { authenticateJWT } from "../middlewares/auth.middleware.js"

const router: Router = express.Router()

router.get("/:id", authenticateJWT, getJob)
router.get("/user/:username", authenticateJWT, getUserJobs)
router.get("/", authenticateJWT, getAllJobsController) // admin only

export default router
