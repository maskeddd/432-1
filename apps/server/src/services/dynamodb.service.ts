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
import { getParameters } from "shared"
import type { Job } from "../types/job"

const PARTITION_KEY = "qut-username"
const SORT_KEY = "jobId"

let qutUsername: string
let tableName: string

let client: DynamoDBClient
let docClient: DynamoDBDocumentClient

export async function initDynamoDB() {
	const { qutUsername: qut, tableName: table } = await getParameters({
		qutUsername: "/group83/qutUsername",
		tableName: "/group83/dynamodb/tableName",
	})

	if (!qut || !table) {
		throw new Error("Missing qutUsername or tableName in Parameter Store")
	}

	qutUsername = qut
	tableName = table

	client = new DynamoDBClient({ region: "ap-southeast-2" })
	docClient = DynamoDBDocumentClient.from(client)
}

/** Ensure the jobs table exists */
export async function ensureJobsTable(): Promise<void> {
	try {
		await client.send(new DescribeTableCommand({ TableName: tableName }))
	} catch (err) {
		if (err instanceof Error && err.name !== "ResourceNotFoundException") {
			throw err
		}

		try {
			await client.send(
				new CreateTableCommand({
					TableName: tableName,
					AttributeDefinitions: [
						{ AttributeName: PARTITION_KEY, AttributeType: "S" },
						{ AttributeName: SORT_KEY, AttributeType: "S" },
					],
					KeySchema: [
						{ AttributeName: PARTITION_KEY, KeyType: "HASH" },
						{ AttributeName: SORT_KEY, KeyType: "RANGE" },
					],
					ProvisionedThroughput: {
						ReadCapacityUnits: 1,
						WriteCapacityUnits: 1,
					},
				})
			)
		} catch (createErr) {
			if (
				!(
					createErr instanceof Error &&
					createErr.name === "ResourceInUseException"
				)
			) {
				throw createErr
			}
		}
	}
}

/** Create/replace a job item */
export async function putJobItem(job: Job): Promise<void> {
	if (!job?.jobId) {
		throw new Error("putJobItem: job.jobId is required")
	}

	const command = new PutCommand({
		TableName: tableName,
		Item: {
			[PARTITION_KEY]: qutUsername,
			...job,
			[SORT_KEY]: job.jobId,
		},
	})

	await docClient.send(command)
}

/** Fetch a job by jobId */
export async function getJobItem(jobId: string): Promise<Job | undefined> {
	const command = new GetCommand({
		TableName: tableName,
		Key: {
			[PARTITION_KEY]: qutUsername,
			[SORT_KEY]: jobId,
		},
	})

	const res = await docClient.send(command)
	return res.Item as Job | undefined
}

/** List all jobs in your partition */
export async function queryAllJobs(): Promise<Job[]> {
	const command = new QueryCommand({
		TableName: tableName,
		KeyConditionExpression: "#pk = :username",
		ExpressionAttributeNames: { "#pk": PARTITION_KEY },
		ExpressionAttributeValues: { ":username": qutUsername },
	})

	const res = await docClient.send(command)
	return (res.Items as Job[]) ?? []
}

/** List jobs for a specific user */
export async function queryJobsByUser(username: string): Promise<Job[]> {
	const command = new QueryCommand({
		TableName: tableName,
		KeyConditionExpression: "#pk = :username",
		FilterExpression: "#user = :u",
		ExpressionAttributeNames: {
			"#pk": PARTITION_KEY,
			"#user": "user",
		},
		ExpressionAttributeValues: {
			":username": qutUsername,
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
		TableName: tableName,
		Key: {
			[PARTITION_KEY]: qutUsername,
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
