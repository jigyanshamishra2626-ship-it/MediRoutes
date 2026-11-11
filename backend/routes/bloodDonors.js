const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const validBloodGroups = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

// Register as a blood donor
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      donorName,
      bloodGroup,
      city,
      contactNumber,
      consentToContact
    } = req.body;

    if (
      !donorName?.trim() ||
      !bloodGroup ||
      !city?.trim() ||
      !contactNumber?.trim()
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

    if (!/^[0-9+\-\s()]{7,20}$/.test(contactNumber)) {
      return res.status(400).json({
        message: "Please enter a valid contact number."
      });
    }

    if (consentToContact !== true) {
      return res.status(400).json({
        message: "Consent is required before sharing donor contact details."
      });
    }

    const result = await pool.query(
      `INSERT INTO blood_donors
       (patient_id, donor_name, blood_group, city,
        contact_number, consent_to_contact)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING
       RETURNING id, donor_name, blood_group, city,
                 is_available, created_at`,
      [
        req.user.id,
        donorName.trim(),
        bloodGroup,
        city.trim(),
        contactNumber.trim(),
        true
      ]
    );

    res.status(201).json({
      message: "Blood donor registration submitted successfully.",
      donor: result.rows[0]
    });
  } catch (error) {
    console.error("Blood donor registration error:", error);
    res.status(500).json({
      message: "Unable to register as a blood donor."
    });
  }
});

// Search available donors by city and blood group
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { city, bloodGroup } = req.query;

    if (!city?.trim() || !validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        message: "Please provide a city and valid blood group."
      });
    }

    const result = await pool.query(
      `SELECT id, donor_name, blood_group, city
       FROM blood_donors
       WHERE LOWER(city) = LOWER($1)
         AND blood_group = $2
         AND is_available = TRUE
         AND consent_to_contact = TRUE
       ORDER BY created_at DESC`,
      [city.trim(), bloodGroup]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Donor search error:", error);
    res.status(500).json({
      message: "Unable to search donors."
    });
  }
});

module.exports = router;