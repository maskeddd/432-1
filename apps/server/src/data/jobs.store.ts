// apps/server/src/data/jobs.store.ts
import type { Job } from "../types/job"
import {
  putJobItem,
  getJobItem,
  queryAllJobs,
  queryJobsByUser,
  updateJobFields,
} from "../services/dynamodb.service.js"

/** Add a new job (used by clipper flow) */
export async function addJob(job: Job): Promise<void> {
  await putJobItem(job)
}

/** Update an existing job with partial fields */
export async function updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
  return updateJobFields(jobId, updates)
}

/** Get one job by ID */
export async function getJobById(jobId: string): Promise<Job | undefined> {
  return getJobItem(jobId)
}

/** Get jobs owned by a logical user (your app's `job.user`) */
export async function getJobsByUser(username: string): Promise<Job[]> {
  return queryJobsByUser(username)
}

/** Get all jobs in the partition (admin/overview) */
export async function getAllJobs(): Promise<Job[]> {
  return queryAllJobs()
}
