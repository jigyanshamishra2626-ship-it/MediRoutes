const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const validBloodGroups = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

// Submit a blood request
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      hospitalId,
      bloodGroup,
      unitsRequired,
      requiredDate,
      contactNumber
    } = req.body;

    if (
      !hospitalId ||
      !bloodGroup ||
      !unitsRequired ||
      !contactNumber
    ) {
      return res.status(400).json({
        message: "Please fill all required fields."
      });
    }

    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        message: "Please select a valid blood group."
      });
    }

    if (
      !Number.isInteger(Number(unitsRequired)) ||
      Number(unitsRequired) < 1 ||
      Number(unitsRequired) > 20
    ) {
      return res.status(400).json({
        message: "Units must be between 1 and 20."
      });
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(contactNumber)) {
      return res.status(400).json({
        message: "Please enter a valid contact number."
      });
    }

    if (requiredDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(requiredDate)) {
        return res.status(400).json({
          message: "Please select a valid required date."
        });
      }

      const [year, month, day] = requiredDate.split("-").map(Number);
      const date = new Date(year, month - 1, day);

      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return res.status(400).json({
          message: "Please select a valid required date."
        });
      }
    }

    const hospital = await pool.query(
      "SELECT id FROM hospitals WHERE id = $1",
      [hospitalId]
    );

    if (hospital.rows.length === 0) {
      return res.status(404).json({
        message: "Hospital not found."
      });
    }

    const result = await pool.query(
      `INSERT INTO blood_requests
       (patient_id, hospital_id, blood_group, units_required,
        required_date, contact_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.user.id,
        hospitalId,
        bloodGroup,
        Number(unitsRequired),
        requiredDate || null,
        contactNumber.trim()
      ]
    );

    res.status(201).json({
      message: "Blood request submitted. Availability must be confirmed by the hospital or blood bank.",
      request: result.rows[0]
    });
  } catch (error) {
    console.error("Blood request error:", error);
    res.status(500).json({
      message: "Unable to submit blood request."
    });
  }
});

// View the logged-in patient's blood requests
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, h.name AS hospital_name
       FROM blood_requests br
       JOIN hospitals h ON h.id = br.hospital_id
       WHERE br.patient_id = $1
       ORDER BY br.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch blood requests error:", error);
    res.status(500).json({
      message: "Unable to load blood requests."
    });
  }
});

module.exports = router;