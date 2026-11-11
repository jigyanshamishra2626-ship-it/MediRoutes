const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

// Doctor-only authentication
const doctorAuth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Doctor login required." });
  }

  try {
    const decoded = jwt.verify(
      header.split(" ")[1],
      process.env.JWT_SECRET
    );

    if (decoded.role !== "doctor") {
      return res.status(403).json({ message: "Doctor access only." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Get all doctors' weekly availability
router.get("/doctors", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT da.id, da.doctor_id, d.name AS doctor_name,
             da.day_of_week, da.start_time, da.end_time,
             da.is_available
      FROM doctor_availability da
      JOIN doctors d ON d.id = da.doctor_id
      ORDER BY da.doctor_id, da.day_of_week
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Availability fetch error:", error.message);
    res.status(500).json({ message: "Unable to fetch availability." });
  }
});

// Get leave dates for all doctors
router.get("/leaves", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT dl.id, dl.doctor_id, d.name AS doctor_name,
             dl.leave_date, dl.reason
      FROM doctor_leaves dl
      JOIN doctors d ON d.id = dl.doctor_id
      ORDER BY dl.leave_date
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Leave fetch error:", error.message);
    res.status(500).json({ message: "Unable to fetch leave dates." });
  }
});

// Doctor adds or updates their own weekly availability
router.put("/my-schedule", doctorAuth, async (req, res) => {
  try {
    const { day_of_week, start_time, end_time, is_available = true } = req.body;

    const day = Number(day_of_week);

    if (!Number.isInteger(day) || day < 1 || day > 6) {
      return res.status(400).json({
        message: "Choose a day from Monday (1) to Saturday (6)."
      });
    }

    if (typeof is_available !== "boolean") {
      return res.status(400).json({
        message: "is_available must be true or false."
      });
    }

    if (
      is_available &&
      (!/^\d{2}:\d{2}$/.test(start_time || "") ||
       !/^\d{2}:\d{2}$/.test(end_time || "") ||
       start_time >= end_time)
    ) {
      return res.status(400).json({
        message: "Enter valid start and end times; end must be later."
      });
    }

    const result = await pool.query(
      `INSERT INTO doctor_availability
         (doctor_id, day_of_week, start_time, end_time, is_available)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (doctor_id, day_of_week)
       DO UPDATE SET
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         is_available = EXCLUDED.is_available
       RETURNING *`,
      [
        req.user.id,
        day,
        is_available ? start_time : "09:00",
        is_available ? end_time : "17:00",
        is_available
      ]
    );

    res.json({
      message: "Weekly schedule saved.",
      schedule: result.rows[0]
    });
  } catch (error) {
    console.error("Schedule save error:", error.message);
    res.status(500).json({ message: "Unable to save schedule." });
  }
});

// Doctor adds leave for themselves
router.post("/my-leaves", doctorAuth, async (req, res) => {
  try {
    const { leave_date, reason = "" } = req.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(leave_date || "")) {
      return res.status(400).json({
        message: "Select a valid leave date."
      });
    }

    const result = await pool.query(
      `INSERT INTO doctor_leaves (doctor_id, leave_date, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (doctor_id, leave_date)
       DO UPDATE SET reason = EXCLUDED.reason
       RETURNING *`,
      [req.user.id, leave_date, reason.trim()]
    );

    res.status(201).json({
      message: "Leave saved.",
      leave: result.rows[0]
    });
  } catch (error) {
    console.error("Leave save error:", error.message);
    res.status(500).json({ message: "Unable to save leave." });
  }
});

// Doctor views only their own leaves
router.get("/my-leaves", doctorAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, doctor_id, leave_date, reason
       FROM doctor_leaves
       WHERE doctor_id = $1
       ORDER BY leave_date`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("My leaves error:", error.message);
    res.status(500).json({ message: "Unable to fetch your leaves." });
  }
});

// Doctor deletes only their own leave
router.delete("/my-leaves/:id", doctorAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM doctor_leaves
       WHERE id = $1 AND doctor_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Leave not found for this doctor."
      });
    }

    res.json({ message: "Leave deleted." });
  } catch (error) {
    console.error("Leave delete error:", error.message);
    res.status(500).json({ message: "Unable to delete leave." });
  }
});

module.exports = router;