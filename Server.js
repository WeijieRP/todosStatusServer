const express = require("express");
const cors = require("cors");
const mysql2 = require("mysql2/promise");
require("dotenv").config();

const app = express();

/* ================================
   SERVER PORT (NOT DB PORT)
================================ */
const PORT = process.env.PORT || 3000;

/* ================================
   MYSQL CONNECTION POOL
================================ */
const dbConfig = mysql2.createPool({
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

/* ================================
   MIDDLEWARE
================================ */
app.use(express.json());

/* ================================
   CORS CONFIG
================================ */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.REACT_APP_API_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

/* ================================
   ROUTES
================================ */

/* ===== GET ALL TODOS ===== */
app.get("/todos", async (req, res) => {
  try {
    const [rows] = await dbConfig.execute("SELECT * FROM todos");
    return res.status(200).json(rows);
  } catch (error) {
    console.log("GET ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

/* ===== GET SINGLE TODO ===== */
app.get("/todos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await dbConfig.execute(
      "SELECT * FROM todos WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Todo not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.log("GET BY ID ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

/* ===== CREATE TODO ===== */
app.post("/todos", async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body);

    const { taskname, description, status } = req.body;

    if (!taskname || !description || !status) {
      return res.status(400).json({
        message: "All fields (taskname, description, status) are required",
      });
    }

    const dateNow = new Date().toISOString();

    const [result] = await dbConfig.execute(
      "INSERT INTO todos (taskname, description, status, date) VALUES (?, ?, ?, ?)",
      [taskname, description, status, dateNow]
    );

    console.log("INSERTED ID:", result.insertId);

    return res.status(201).json({
      id: result.insertId,
      taskname,
      description,
      status,
      date: dateNow,
    });
  } catch (error) {
    console.log("POST ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

/* ===== UPDATE TODO ===== */
app.put("/todos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { taskname, description, status } = req.body;

    if (!taskname || !description || !status) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const dateNow = new Date().toISOString();

    const [result] = await dbConfig.execute(
      "UPDATE todos SET taskname = ?, description = ?, status = ?, date = ? WHERE id = ?",
      [taskname, description, status, dateNow, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }

    return res.status(200).json({
      message: "Updated successfully",
      id,
      taskname,
      description,
      status,
      date: dateNow,
    });
  } catch (error) {
    console.log("PUT ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

/* ===== DELETE TODO ===== */
app.delete("/todos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [result] = await dbConfig.execute(
      "DELETE FROM todos WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.log("DELETE ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

/* ===== 404 HANDLER ===== */
app.use((req, res) => {
  res.status(404).json({ message: "404 - Route not found" });
});

/* ================================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});