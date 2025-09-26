// apps/server/src/services/dynamodb.service.ts
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb"
import type { Job } from "../types/job"

const REGION = process.env.AWS_REGION ?? "ap-southeast-2"
const QUT_USERNAME = process.env.QUT_USERNAME
if (!QUT_USERNAME) {
  throw new Error("Missing QUT_USERNAME env var")
}

const TABLE_NAME =
  process.env.DDB_TABLE_NAME ??
  `${QUT_USERNAME.split("@")[0]}-jobs` // e.g., n12040866-jobs
const SORT_KEY = "jobId"

const client = new DynamoDBClient({ region: REGION })
const docClient = DynamoDBDocumentClient.from(client)

//Ensure the jobs table exists.

export async function ensureJobsTable(): Promise<void> {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }))
    
    return
  } catch {

  }

  const create = new CreateTableCommand({
    TableName: TABLE_NAME,
    AttributeDefinitions: [
      { AttributeName: "qut-username", AttributeType: "S" },
      { AttributeName: SORT_KEY, AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "qut-username", KeyType: "HASH" },
      { AttributeName: SORT_KEY, KeyType: "RANGE" },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
  })

  try {
    await client.send(create)
    console.log(`[DDB] Created table: ${TABLE_NAME}`)
  } catch (err: any) {
    if (err?.name === "ResourceInUseException") {
      console.log(`[DDB] Table already exists: ${TABLE_NAME}`)
    } else {
      console.error("[DDB] Error creating table:", err)
      throw err
    }
  }
}

/** Create/replace a job item */
export async function putJobItem(job: Job) {
  // Enforce required keys
  if (!job?.jobId) throw new Error("putJobItem: job.jobId is required")
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      "qut-username": QUT_USERNAME,
      [SORT_KEY]: job.jobId,
      ...job, // includes: user, status, inputFile, outputFile?, createdAt
    },
  })
  await docClient.send(command)
}

/** Fetch a job by jobId */
export async function getJobItem(jobId: string): Promise<Job | undefined> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      "qut-username": QUT_USERNAME,
      [SORT_KEY]: jobId,
    },
  })
  const res = await docClient.send(command)
  return (res.Item as Job | undefined) ?? undefined
}

/** List *all* jobs in your partition (for admin screens / overviews) */
export async function queryAllJobs(): Promise<Job[]> {
  // Query with only the partition key returns all items in that partition
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :username",
    ExpressionAttributeNames: { "#pk": "qut-username" },
    ExpressionAttributeValues: { ":username": QUT_USERNAME },
  })
  const res = await docClient.send(command)
  return (res.Items as Job[]) ?? []
}

/** List jobs for a specific `job.user` (your app's logical username) */
export async function queryJobsByUser(username: string): Promise<Job[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :username",
    FilterExpression: "#user = :u",
    ExpressionAttributeNames: {
      "#pk": "qut-username",
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

/** Patch specific fields of a job (status, outputFile, etc.) */
export async function updateJobFields(
  jobId: string,
  fields: Partial<Pick<Job, "status" | "outputFile" | "user" | "createdAt" | "inputFile">>
): Promise<Job> {
  const clean = { ...fields }
  // Never allow changing keys
  delete (clean as any)["qut-username"]
  delete (clean as any)["jobId"]

  const entries = Object.entries(clean)
  if (entries.length === 0) {
    const current = await getJobItem(jobId)
    if (!current) throw new Error("updateJobFields: job not found")
    return current
  }

  const UpdateExpression =
    "SET " +
    entries.map(([, _v], i) => `#k${i} = :v${i}`).join(", ")

  const ExpressionAttributeNames = Object.fromEntries(
    entries.map(([k], i) => [`#k${i}`, k])
  )

  const ExpressionAttributeValues = Object.fromEntries(
    entries.map(([_, v], i) => [`:v${i}`, v])
  )

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      "qut-username": QUT_USERNAME,
      [SORT_KEY]: jobId,
    },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ReturnValues: "ALL_NEW",
  })

  const res = await docClient.send(command)
  return res.Attributes as Job
}
