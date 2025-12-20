import app from "./app.js"
import connectDB from "./config/db.js"
import dotenv from "dotenv"

dotenv.config()

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    console.log("⏳ Connecting to MongoDB...")
    await connectDB()          // 🔥 THIS WAS MISSING
    console.log("✅ MongoDB ready")

    app.listen(PORT, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      )
    })
  } catch (err) {
    console.error("❌ Server startup failed:", err)
    process.exit(1)
  }
}

startServer()

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err)
  process.exit(1)
})

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err)
  process.exit(1)
})
