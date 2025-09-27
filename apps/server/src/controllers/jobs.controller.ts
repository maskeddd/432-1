import type { Request, Response } from "express"
import {
	getJobItem,
	queryAllJobs,
	queryJobsByUser,
} from "../services/dynamodb.service.js"

export async function getJob(req: Request, res: Response) {
	const jobId = req.params.id

	if (!jobId) {
		return res.status(400).json({ error: "Missing jobId parameter" })
	}

	const job = await getJobItem(jobId)
	if (!job) {
		return res.status(404).json({ error: "Job not found" })
	}

	if (
		!res.locals.user.groups.includes("Administrator") &&
		job.user !== res.locals.user.id
	) {
		return res.status(403).json({ error: "Forbidden" })
	}

	res.json(job)
}

export async function getUserJobs(req: Request, res: Response) {
	const username = req.params.username

	if (!username) {
		return res.status(400).json({ error: "Missing username parameter" })
	}

	if (
		!res.locals.user.groups.includes("Administrator") &&
		username !== res.locals.user.id
	) {
		return res.status(403).json({ error: "Forbidden" })
	}

	const jobs = await queryJobsByUser(username)
	res.json(jobs)
}

export async function getAllJobsController(_: Request, res: Response) {
	if (!res.locals.user.groups.includes("Administrator")) {
		return res.status(403).json({ error: "Forbidden" })
	}

	const jobs = await queryAllJobs()
	res.json(jobs)
}
