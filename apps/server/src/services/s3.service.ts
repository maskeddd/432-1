import {
	CreateBucketCommand,
	GetObjectCommand,
	HeadBucketCommand,
	PutBucketTaggingCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const bucketName = process.env.S3_BUCKET_NAME || ""
const region = process.env.AWS_REGION || "ap-southeast-2"

const s3 = new S3Client({ region })

async function ensureBucketExists(): Promise<void> {
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
					{ Key: "qut-username", Value: process.env.QUT_USERNAME },
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
	await ensureBucketExists()

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
