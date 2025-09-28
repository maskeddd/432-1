import {
	CreateBucketCommand,
	GetObjectCommand,
	HeadBucketCommand,
	PutBucketTaggingCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getParameters } from "shared"

let s3: S3Client
let bucketName: string
let qutUsername: string

export async function initS3() {
	const { bucket, qutUsername: qut } = await getParameters({
		bucket: "/group83/s3/bucketName",
		qutUsername: "/group83/qutUsername",
	})

	if (!bucket || !qut) {
		throw new Error("Missing required S3 config values in Parameter Store")
	}

	bucketName = bucket
	qutUsername = qut

	s3 = new S3Client({ region: "ap-southeast-2" })
}

export async function ensureBucketExists(): Promise<void> {
	try {
		await s3.send(new HeadBucketCommand({ Bucket: bucketName }))
	} catch {
		const createCommand = new CreateBucketCommand({
			Bucket: bucketName,
		})

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
	}
}

export async function uploadToS3(
	buffer: Buffer,
	key: string,
	contentType: string
) {
	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: key,
		Body: buffer,
		ContentType: contentType,
	})

	await s3.send(command)

	return {
		key,
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
	return { url, key }
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600) {
	const command = new GetObjectCommand({
		Bucket: bucketName,
		Key: key,
	})

	const url = await getSignedUrl(s3, command, { expiresIn })
	return url
}
