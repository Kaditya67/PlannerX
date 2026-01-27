import dotenv from "dotenv";

// Load env vars
dotenv.config();

const getEnvVar = (key, defaultValue = undefined) => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is missing`);
  }
  return value;
};

export const env = {
  NODE_ENV: getEnvVar("NODE_ENV", "development"),
  PORT: getEnvVar("PORT", "5000"),
  MONGODB_URI: getEnvVar("MONGODB_URI"),
  JWT_SECRET: getEnvVar("JWT_SECRET"),
  JWT_EXPIRE: getEnvVar("JWT_EXPIRE", "30d"),
  COOKIE_EXPIRE: getEnvVar("COOKIE_EXPIRE", "30"),
  CORS_ORIGIN: getEnvVar("CORS_ORIGIN", "http://localhost:5173"),
  RATE_LIMIT_WINDOW_MS: getEnvVar("RATE_LIMIT_WINDOW_MS", "900000"),
  RATE_LIMIT_MAX: getEnvVar("RATE_LIMIT_MAX", "100"),
};
