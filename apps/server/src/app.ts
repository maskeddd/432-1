import cors from "cors"
import express from "express"
import { errorHandler } from "./middlewares/errorHandler.middleware.ts"
import clipperRoutes from "./routes/clipper.routes.ts"

const app = express()

app.use(
	cors({
		origin: "http://localhost:5173",
		methods: ["GET", "POST", "PUT", "DELETE"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
)

app.use("/", clipperRoutes)

app.use(errorHandler)

export default app
