import cors from "cors"
import express, { type Express } from "express"
import { errorHandler } from "./middlewares/errorHandler.middleware.js"
import clipperRoutes from "./routes/clipper.routes.js"

const app: Express = express()

app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:5173",
		credentials: true,
	})
)

app.use("/", clipperRoutes)

app.use(errorHandler)

export default app
