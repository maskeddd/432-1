import app from "./app.js"
import { initCognito } from "./middlewares/auth.middleware.js"
import { ensureJobsTable, initDynamoDB } from "./services/dynamodb.service.js"
import { ensureBucketExists, initS3 } from "./services/s3.service.js"

const port = 3000

async function start() {
	await initCognito()

	await initS3()
	await ensureBucketExists()

	await initDynamoDB()
	await ensureJobsTable()

	app.listen(port, () => {
		console.log(`Server started on port ${port}`)
	})
}

start()
