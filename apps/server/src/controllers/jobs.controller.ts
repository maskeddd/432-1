import type { Response } from "express"
import type { Request as JWTRequest } from "express-jwt"
import { getAllJobs, getJobById, getJobsByUser } from "../data/jobs.store.js"

export async function getJob(req: JWTRequest, res: Response) {
	const jobId = req.params.id

	if (!jobId) {
		return res.status(400).json({ error: "Missing jobId parameter" })
	}

	const job = await getJobById(jobId)
	if (!job) {
		return res.status(404).json({ error: "Job not found" })
	}

	if (req.auth?.role !== "admin" && job.user !== req.auth?.username) {
		return res.status(403).json({ error: "Forbidden" })
	}

	res.json(job)
}

export async function getUserJobs(req: JWTRequest, res: Response) {
	const username = req.params.username

	if (!username) {
		return res.status(400).json({ error: "Missing username parameter" })
	}

	if (req.auth?.role !== "admin" && req.auth?.username !== username) {
		return res.status(403).json({ error: "Forbidden" })
	}

	const jobs = await getJobsByUser(username)
	res.json(jobs)
}

export async function getAllJobsController(req: JWTRequest, res: Response) {
	if (req.auth?.role !== "admin") {
		return res.status(403).json({ error: "Forbidden" })
	}

	const jobs = await getAllJobs()
	res.json(jobs)
}
