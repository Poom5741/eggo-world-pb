import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import createWalletRouter from "./routes/createWallet";
import chainRouter from "./routes/chainRouter";
import eip7702Router from "./routes/eip7702Router";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "wallet-srv",
    version: "1.0.0"
  });
});

// Wallet routes
app.use("/api/v1/wallet", createWalletRouter);
app.use("/api/v1", chainRouter);
app.use("/api/v2/eip7702", eip7702Router);

// Start server
app.listen(PORT, () => {
  console.log(`Wallet service running on port ${PORT}`);
});

export default app;
