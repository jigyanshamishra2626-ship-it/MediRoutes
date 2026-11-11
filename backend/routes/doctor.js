const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

// Doctor authentication
const doctorAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Login required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "doctor") {
      return res.status(403).json({ message: "Doctor access only" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Doctor sees their own appointments
router.get("/appointments", doctorAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM appointments
       WHERE doctor_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Doctor appointments error:", error.message);
    res.status(500).json({ message: "Unable to load appointments" });
  }
});

// Doctor confirms or rejects an appointment
router.patch("/appointments/:id/status", doctorAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Confirmed", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET status = $1
       WHERE id = $2 AND doctor_id = $3
       RETURNING *`,
      [status, req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Appointment not found for this doctor",
      });
    }

    res.json({
      message: "Appointment status updated",
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error("Update appointment error:", error.message);
    res.status(500).json({ message: "Unable to update appointment" });
  }
});

module.exports = router;