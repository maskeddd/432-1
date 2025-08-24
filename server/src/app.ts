import express from "express"
import { errorHandler } from "./middlewares/errorHandler.middleware.ts"
import clipperRoutes from "./routes/clipper.routes.ts"

const app = express()

app.use("/", clipperRoutes)

app.use(errorHandler)

export default app
