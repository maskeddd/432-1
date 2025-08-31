import cors from "cors"
import express, { type Express } from "express"
import { errorHandler } from "./middlewares/errorHandler.middleware.js"
import authRoutes from "./routes/auth.routes.js"
import clipperRoutes from "./routes/clipper.routes.js"
import jobsRoutes from "./routes/jobs.routes.js"

const app: Express = express()

app.use(express.json())

app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:5173",
		credentials: true,
	})
)

app.use("/", clipperRoutes)
app.use("/jobs", jobsRoutes)
app.use("/auth", authRoutes)

app.use(errorHandler)

export default app
