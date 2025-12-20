import connectDB from "../config/db.js";

export const withDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("DB Connection Error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Database connection failed" 
    });
  }
};
