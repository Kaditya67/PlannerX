import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import { env } from "./config/env.js"
import authRoutes from "./routes/auth.routes.js"
import workspaceRoutes from "./routes/workspace.routes.js"
import planRoutes from "./routes/plan.routes.js"
import sectionRoutes from "./routes/section.routes.js"
import itemRoutes from "./routes/item.routes.js"
import sessionRoutes from "./routes/session.routes.js"
import adminRoutes from "./routes/admin.routes.js"

// Middleware imports
import errorHandler from "./middlewares/error.middleware.js"
import notFound from "./middlewares/notFound.middleware.js"


const app = express()

/* -------------------------------------------
   SECURITY
-------------------------------------------- */
app.use(helmet())

/* -------------------------------------------
   CORS
-------------------------------------------- */
/* -------------------------------------------
   CORS
-------------------------------------------- */
const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173"]

app.use(
  cors({
    origin: (origin, callback) => { 
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)


/* -------------------------------------------
   BODY PARSERS
-------------------------------------------- */
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(cookieParser())

/* -------------------------------------------
   LOGGING (DEV ONLY)
-------------------------------------------- */
/* -------------------------------------------
   LOGGING (DEV ONLY)
-------------------------------------------- */
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

/* -------------------------------------------
   RATE LIMIT (PROD ONLY)
-------------------------------------------- */
/* -------------------------------------------
   RATE LIMIT (PROD ONLY)
-------------------------------------------- */
if (env.NODE_ENV === "production") {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,               // per IP
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
      req.method === "OPTIONS" || req.path === "/health",
    message: {
      success: false,
      message: "Too many requests, please try again later",
    },
  })

  app.use("/api", apiLimiter)
}

/* -------------------------------------------
   HEALTH CHECK
-------------------------------------------- */
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" })
})

/* -------------------------------------------
   ROUTES
-------------------------------------------- */
app.use("/api/auth", authRoutes)
app.use("/api/workspaces", workspaceRoutes)
app.use("/api/plans", planRoutes)
app.use("/api/sections", sectionRoutes)
app.use("/api/items", itemRoutes)
app.use("/api/sessions", sessionRoutes)
app.use("/api/admin", adminRoutes)

/* -------------------------------------------
   ERROR HANDLING
-------------------------------------------- */
app.use(notFound)
app.use(errorHandler)

export default app
