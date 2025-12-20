import mongoose from "mongoose"

let isConnected = false

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    isConnected = true
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)

    // Attach listeners ONLY ONCE
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err)
    })

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected")
      isConnected = false
    })

    return conn
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message)
    process.exit(1)
  }
}

export default connectDB
