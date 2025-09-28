import cors from "cors"
import express, { type Express } from "express"
import { getParameter } from "shared"
import { errorHandler } from "./middlewares/errorHandler.middleware.js"
import clipperRoutes from "./routes/clipper.routes.js"
import jobsRoutes from "./routes/jobs.routes.js"

const app: Express = express()

app.use(express.json())

app.use(
	cors({
		origin: (await getParameter("/group83/clientUrl")) || "",
		credentials: true,
	})
)

app.use("/", clipperRoutes)
app.use("/jobs", jobsRoutes)

app.use(errorHandler)

export default app
