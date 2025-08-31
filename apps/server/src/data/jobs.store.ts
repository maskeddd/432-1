import { readFile, writeFile } from "node:fs/promises"
import type { Job } from "../types/job"

const JOBS_FILE = "./jobs.json"

async function loadJobs(): Promise<Job[]> {
	try {
		const data = await readFile(JOBS_FILE, "utf-8")
		return JSON.parse(data) as Job[]
	} catch {
		return []
	}
}

async function saveJobs(jobs: Job[]): Promise<void> {
	await writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2))
}

export async function addJob(job: Job): Promise<void> {
	const jobs = await loadJobs()
	jobs.push(job)
	await saveJobs(jobs)
}

export async function updateJob(
	jobId: string,
	updates: Partial<Job>
): Promise<void> {
	const jobs = await loadJobs()
	const index = jobs.findIndex((j) => j.jobId === jobId)
	if (index !== -1) {
		jobs[index] = { ...jobs[index], ...updates } as Job
		await saveJobs(jobs)
	}
}

export async function getJobById(jobId: string): Promise<Job | undefined> {
	const jobs = await loadJobs()
	return jobs.find((j) => j.jobId === jobId)
}

export async function getJobsByUser(username: string): Promise<Job[]> {
	const jobs = await loadJobs()
	return jobs.filter((j) => j.user === username)
}

export async function getAllJobs(): Promise<Job[]> {
	return loadJobs()
}
