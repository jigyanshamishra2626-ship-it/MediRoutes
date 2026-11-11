const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// Create a bed booking request
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      hospitalId,
      bedType,
      acType,
      admissionDate,
      durationDays
    } = req.body;

    if (!hospitalId || !bedType || !admissionDate || !durationDays) {
      return res.status(400).json({
        message: "Please fill all required fields."
      });
    }

    const allowedBeds = [
      "General Ward",
      "Private Room",
      "ICU",
      "ICU with Ventilator"
    ];

    if (!allowedBeds.includes(bedType)) {
      return res.status(400).json({
        message: "Invalid bed type."
      });
    }

    if (!["AC", "Non-AC"].includes(acType || "Non-AC")) {
      return res.status(400).json({
        message: "Select AC or Non-AC."
      });
    }

    if (
      !Number.isInteger(Number(durationDays)) ||
      Number(durationDays) < 1 ||
      Number(durationDays) > 90
    ) {
      return res.status(400).json({
        message: "Duration must be between 1 and 90 days."
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(admissionDate)) {
      return res.status(400).json({
        message: "Please select a valid admission date."
      });
    }

    const [year, month, day] = admissionDate.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);

    if (
      selectedDate.getFullYear() !== year ||
      selectedDate.getMonth() !== month - 1 ||
      selectedDate.getDate() !== day
    ) {
      return res.status(400).json({
        message: "Please select a valid admission date."
      });
    }

    const hospitalResult = await pool.query(
      "SELECT id FROM hospitals WHERE id = $1",
      [hospitalId]
    );

    if (hospitalResult.rows.length === 0) {
      return res.status(404).json({
        message: "Hospital not found."
      });
    }

    // Do not claim availability until real bed inventory is confirmed.
    const result = await pool.query(
      `INSERT INTO bed_bookings
       (patient_id, hospital_id, bed_type, ac_type,
        admission_date, duration_days, booking_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
       RETURNING *`,
      [
        req.user.id,
        hospitalId,
        bedType,
        acType || "Non-AC",
        admissionDate,
        Number(durationDays)
      ]
    );

    res.status(201).json({
      message: "Bed booking request submitted. Await hospital confirmation.",
      booking: result.rows[0]
    });
  } catch (error) {
    console.error("Bed booking error:", error);
    res.status(500).json({
      message: "Unable to submit bed booking request."
    });
  }
});

// View the logged-in patient's bed booking requests
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, h.name AS hospital_name
       FROM bed_bookings b
       JOIN hospitals h ON h.id = b.hospital_id
       WHERE b.patient_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch bed bookings error:", error);
    res.status(500).json({
      message: "Unable to load bed booking requests."
    });
  }
});

module.exports = router;