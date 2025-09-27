import app from "./app.js"
import { ensureJobsTable } from "./services/dynamodb.service.js"

const port = 3000

// Ensure the DDB table exists, then start the server
ensureJobsTable()
	.catch((e) => {
		console.error("Failed to ensure DynamoDB table:", e)
		process.exit(1)
	})
	.then(() => {
		app.listen(port, () => {
			console.log(`Server started on port ${port}`)
		})
	})
