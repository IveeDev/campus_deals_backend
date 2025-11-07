import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoute from "#routes/auth.routes.js";
import userRoute from "#routes/user.routes.js";
import campusRoute from "#routes/campus.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "#config/logger.js";
import { errorHandler } from "#middleware/errorHandler.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  morgan("combined", {
    stream: { write: message => logger.info(message.trim()) },
  })
);

app.get("/", (req, res) => {
  logger.info("Hello from campus deals API");
  res.status(200).send("Hello from  campus deals API");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({ message: "CampusDeals API is running!" });
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/campuses", campusRoute);

app.use((req, res) => {
  res.status(404).json({ error: "Routes not found" });
});

// Global error handler (MUST be last)
app.use(errorHandler);

export default app;
