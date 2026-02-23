const express = require("express");
const cors = require("cors");
const mysql2 = require("mysql2/promise");
require("dotenv").config();

const PORT = process.env.DB_PORT || 3000; // PORT for server
const app = express();

// ---------- MySQL Connection Pool ----------
const dbConfig = mysql2.createPool({
  waitForConnections: true,
  connectTimeout: 1000,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ---------- Middleware ----------
app.use(express.json());

// CORS
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
      return callback(null, false); // block unknown origins
    },
  })
);

// ---------- Routes ----------

// GET all todos
app.get("/todos", async (req, res) => {
  try {
    const [rows] = await dbConfig.execute("SELECT * FROM todos");
    if (!rows.length) {
      return res.status(404).json({ message: "No data in the database" });
    }
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST new todo
app.post("/todos", async (req, res) => {
  try {
    const { taskname, description, status, date } = req.body;
    const [result] = await dbConfig.execute(
      "INSERT INTO todos (taskname, description, status, date) VALUES (?, ?, ?, ?)",
      [taskname, description, status, date]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "Insertion failed" });
    }

    return res.status(201).json({ id: result.insertId, taskname, description, status, date });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// DELETE todo by id
app.delete("/todos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await dbConfig.execute("DELETE FROM todos WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No todo found to delete" });
    }

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT update todo by id
app.put("/todos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { taskname, description, status, date } = req.body;

    // FIXED: "UPDATE FROM" -> "UPDATE" only
    const [result] = await dbConfig.execute(
      "UPDATE todos SET taskname = ?, description = ?, status = ?, date = ? WHERE id = ?",
      [taskname, description, status, date, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No todo found to update" });
    }

    return res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "404 - Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at PORT ${PORT}`);
});