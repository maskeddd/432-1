export interface Job {
	jobId: string
	user: string
	inputFile: string
	outputFile?: string
	status: "processing" | "completed" | "failed"
	createdAt: string
}
