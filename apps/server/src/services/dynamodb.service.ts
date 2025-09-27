// apps/server/src/services/dynamodb.service.ts
import {
	CreateTableCommand,
	DescribeTableCommand,
	DynamoDBClient,
	ResourceInUseException,
} from "@aws-sdk/client-dynamodb"
import {
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	QueryCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb"
import type { Job } from "../types/job"

// Configuration
const REGION = process.env.AWS_REGION ?? "ap-southeast-2"
const QUT_USERNAME = process.env.QUT_USERNAME

if (!QUT_USERNAME) {
	throw new Error("Missing QUT_USERNAME env var")
}

const TABLE_NAME =
	process.env.DDB_TABLE_NAME ?? `${QUT_USERNAME.split("@")[0]}-jobs`
const PARTITION_KEY = "qut-username"
const SORT_KEY = "jobId"

// DynamoDB clients
const client = new DynamoDBClient({ region: REGION })
const docClient = DynamoDBDocumentClient.from(client)

/** Ensure the jobs table exists */
export async function ensureJobsTable(): Promise<void> {
	try {
		await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }))
		return
	} catch {
		// Table doesn't exist, create it
	}

	const createCommand = new CreateTableCommand({
		TableName: TABLE_NAME,
		AttributeDefinitions: [
			{ AttributeName: PARTITION_KEY, AttributeType: "S" },
			{ AttributeName: SORT_KEY, AttributeType: "S" },
		],
		KeySchema: [
			{ AttributeName: PARTITION_KEY, KeyType: "HASH" },
			{ AttributeName: SORT_KEY, KeyType: "RANGE" },
		],
		ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
	})

	try {
		await client.send(createCommand)
		console.log(`[DDB] Created table: ${TABLE_NAME}`)
	} catch (err) {
		if (err instanceof ResourceInUseException) {
			console.log(`[DDB] Table already exists: ${TABLE_NAME}`)
		} else {
			console.error("[DDB] Error creating table:", err)
			throw err
		}
	}
}

/** Create/replace a job item */
export async function putJobItem(job: Job): Promise<void> {
	if (!job?.jobId) {
		throw new Error("putJobItem: job.jobId is required")
	}

	const command = new PutCommand({
		TableName: TABLE_NAME,
		Item: {
			[PARTITION_KEY]: QUT_USERNAME,
			...job,
			[SORT_KEY]: job.jobId,
		},
	})

	await docClient.send(command)
}

/** Fetch a job by jobId */
export async function getJobItem(jobId: string): Promise<Job | undefined> {
	const command = new GetCommand({
		TableName: TABLE_NAME,
		Key: {
			[PARTITION_KEY]: QUT_USERNAME,
			[SORT_KEY]: jobId,
		},
	})

	const res = await docClient.send(command)
	return res.Item as Job | undefined
}

/** List all jobs in your partition */
export async function queryAllJobs(): Promise<Job[]> {
	const command = new QueryCommand({
		TableName: TABLE_NAME,
		KeyConditionExpression: "#pk = :username",
		ExpressionAttributeNames: { "#pk": PARTITION_KEY },
		ExpressionAttributeValues: { ":username": QUT_USERNAME },
	})

	const res = await docClient.send(command)
	return (res.Items as Job[]) ?? []
}

/** List jobs for a specific user */
export async function queryJobsByUser(username: string): Promise<Job[]> {
	const command = new QueryCommand({
		TableName: TABLE_NAME,
		KeyConditionExpression: "#pk = :username",
		FilterExpression: "#user = :u",
		ExpressionAttributeNames: {
			"#pk": PARTITION_KEY,
			"#user": "user",
		},
		ExpressionAttributeValues: {
			":username": QUT_USERNAME,
			":u": username,
		},
	})

	const res = await docClient.send(command)
	return (res.Items as Job[]) ?? []
}

/** Update specific fields of a job */
export async function updateJobFields(
	jobId: string,
	fields: Partial<
		Pick<Job, "status" | "outputFile" | "user" | "createdAt" | "inputFile">
	>
): Promise<Job> {
	// Filter out key fields that shouldn't be updated
	const updateableFields = { ...fields }
	delete updateableFields[PARTITION_KEY as keyof typeof updateableFields]
	delete updateableFields[SORT_KEY as keyof typeof updateableFields]

	const entries = Object.entries(updateableFields)

	if (entries.length === 0) {
		const current = await getJobItem(jobId)
		if (!current) {
			throw new Error("updateJobFields: job not found")
		}
		return current
	}

	const command = new UpdateCommand({
		TableName: TABLE_NAME,
		Key: {
			[PARTITION_KEY]: QUT_USERNAME,
			[SORT_KEY]: jobId,
		},
		UpdateExpression: `SET ${entries.map((_, i) => `#k${i} = :v${i}`).join(", ")}`,
		ExpressionAttributeNames: Object.fromEntries(
			entries.map(([key], i) => [`#k${i}`, key])
		),
		ExpressionAttributeValues: Object.fromEntries(
			entries.map(([_, value], i) => [`:v${i}`, value])
		),
		ReturnValues: "ALL_NEW",
	})

	const res = await docClient.send(command)
	return res.Attributes as Job
}
