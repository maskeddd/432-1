import { readFile, writeFile } from "node:fs/promises"
import { basename } from "node:path"
import {
	CreateBucketCommand,
	GetObjectCommand,
	HeadBucketCommand,
	PutBucketCorsCommand,
	PutBucketTaggingCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getParameters } from "shared"

let s3: S3Client
let bucketName: string
let qutUsername: string
let clientUrl: string

export async function initS3() {
	const {
		bucket,
		qutUsername: qut,
		clientUrl: url,
	} = await getParameters({
		bucket: "/group83/s3/bucketName",
		qutUsername: "/group83/qutUsername",
		clientUrl: "/group83/clientUrl",
	})
	if (!bucket || !qut || !url) {
		throw new Error("Missing required S3 config values in Parameter Store")
	}
	bucketName = bucket
	qutUsername = qut
	clientUrl = url
	s3 = new S3Client({ region: "ap-southeast-2" })
}

export function getBucketName() {
	return bucketName
}

export async function ensureBucketExists() {
	try {
		await s3.send(new HeadBucketCommand({ Bucket: bucketName }))
	} catch {
		const createCommand = new CreateBucketCommand({ Bucket: bucketName })
		await s3.send(createCommand)
		const tagCommand = new PutBucketTaggingCommand({
			Bucket: bucketName,
			Tagging: {
				TagSet: [
					{ Key: "qut-username", Value: qutUsername },
					{ Key: "purpose", Value: "assignment-2" },
				],
			},
		})
		await s3.send(tagCommand)
		const corsCommand = new PutBucketCorsCommand({
			Bucket: bucketName,
			CORSConfiguration: {
				CORSRules: [
					{
						AllowedHeaders: ["*"],
						AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
						AllowedOrigins: [clientUrl],
						ExposeHeaders: ["ETag"],
					},
				],
			},
		})
		await s3.send(corsCommand)
	}
}

export async function getPresignedUploadUrl(
	key: string,
	contentType: string,
	expiresIn = 3600
) {
	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: key,
		ContentType: contentType,
	})
	const url = await getSignedUrl(s3, command, { expiresIn })
	return { uploadUrl: url, key }
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
	const command = new GetObjectCommand({
		Bucket: bucketName,
		Key: key,
	})
	return getSignedUrl(s3, command, { expiresIn })
}

export async function downloadFileFromS3(key: string, localPath: string) {
	const command = new GetObjectCommand({ Bucket: bucketName, Key: key })
	const obj = await s3.send(command)
	if (!obj.Body) throw new Error("No object body in S3 response")
	const bytes = await obj.Body.transformToByteArray()
	await writeFile(localPath, Buffer.from(bytes))
	return localPath
}

export async function uploadFileToS3(
	localPath: string,
	keyPrefix = "results/"
) {
	const data = await readFile(localPath)
	const fileName = basename(localPath)
	const key = `${keyPrefix}${fileName}`
	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: key,
		Body: data,
		ContentType: "video/mp4",
	})
	await s3.send(command)
	return key
}
