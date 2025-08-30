import { mkdir, rm } from "node:fs/promises"
import * as os from "node:os"
import * as path from "node:path"

export async function createTempDir(): Promise<string> {
	const job_id = crypto.randomUUID()
	const dirPath = path.join(os.tmpdir(), `video-clip-job-${job_id}`)
	await mkdir(dirPath, { recursive: true })
	console.log(`[${job_id}] Created temporary directory: ${dirPath}`)
	return dirPath
}

export async function cleanupTempDir(dirPath: string): Promise<void> {
	try {
		await rm(dirPath, { recursive: true, force: true })
		console.log(`Cleaned up temporary directory: ${dirPath}`)
	} catch (error) {
		console.error(`Failed to clean up temporary directory ${dirPath}:`, error)
	}
}
