/** @format */
import { fileURLToPath } from "url";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import { authRoutes } from "./routes/authRoute.js";
import { productRoutes } from "./routes/productRoute.js";
import { cartRoutes } from "./routes/cartRoutes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const PgSession = connectPgSimple(session);

const PORT = process.env.PORT || 5000;
app.use(
  session({
    store: new PgSession({
      pool: pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SECRET_KEY || "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' is often needed for cross-site cookies if frontend/backend are on different domains
    },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the E-commerce API" });
});

const router = express.Router();
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);

app.use("/api", router);
app.use("/.netlify/functions/api", router);

app.get("/healthz", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ database: "connected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`server run on ${PORT}`);
  });
}

export default app;
// Server running
