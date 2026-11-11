const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Admin login required." });
  }

  try {
    const decoded = jwt.verify(
      authHeader.split(" ")[1],
      process.env.JWT_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access only." });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid admin login." });
  }
}

// Create emergency requests table if it does not exist
async function ensureEmergencyTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS emergency_requests (
      id SERIAL PRIMARY KEY,
      patient_name VARCHAR(150),
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      status VARCHAR(30) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
  ALTER TABLE emergency_requests
  ADD COLUMN IF NOT EXISTS patient_phone VARCHAR(20)
`);
}

// Patient submits emergency location
router.post("/", async (req, res) => {
  try {
   const { patientName, patientPhone, latitude, longitude } = req.body;
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return res.status(400).json({
        message: "Valid GPS coordinates are required."
      });
    }

    await ensureEmergencyTable();

  const result = await pool.query(
  `INSERT INTO emergency_requests
   (patient_name, patient_phone, latitude, longitude)
   VALUES ($1, $2, $3, $4)
   RETURNING *`,
  [
    patientName || "Patient",
    patientPhone || "",
    latitude,
    longitude
  ]
);

    res.status(201).json({
      message: "Emergency location shared with admin.",
      request: result.rows[0]
    });
  } catch (error) {
    console.error("Emergency request error:", error.message);
    res.status(500).json({
      message: "Unable to submit emergency request."
    });
  }
});

// Admin views emergency requests
router.get("/", adminAuth, async (req, res) => {
  try {
    await ensureEmergencyTable();

    const result = await pool.query(`
      SELECT *
      FROM emergency_requests
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch emergency requests error:", error.message);
    res.status(500).json({
      message: "Unable to fetch emergency requests."
    });
  }
});
router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Approved or Rejected.",
      });
    }

    await ensureEmergencyTable();

    const result = await pool.query(
      `UPDATE emergency_requests
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Emergency request not found.",
      });
    }

    res.json({
      message: `Emergency request ${status.toLowerCase()} successfully!`,
      request: result.rows[0],
    });
  } catch (error) {
    console.error("Update emergency status error:", error.message);
    res.status(500).json({
      message: "Unable to update emergency status.",
    });
  }
});
module.exports = router;