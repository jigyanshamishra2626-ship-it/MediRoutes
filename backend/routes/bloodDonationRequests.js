const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// Send a donation request to a registered donor
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { bloodRequestId, donorId } = req.body;

    if (!bloodRequestId || !donorId) {
      return res.status(400).json({
        message: "Blood request ID and donor ID are required."
      });
    }

    // Confirm that this blood request belongs to the logged-in patient
    const bloodRequest = await pool.query(
      `SELECT id, blood_group
       FROM blood_requests
       WHERE id = $1 AND patient_id = $2`,
      [bloodRequestId, req.user.id]
    );

    if (bloodRequest.rows.length === 0) {
      return res.status(404).json({
        message: "Your blood request was not found."
      });
    }

    // Confirm donor is available and has the required blood group
    const donor = await pool.query(
      `SELECT id
       FROM blood_donors
       WHERE id = $1
         AND blood_group = $2
         AND is_available = TRUE
         AND consent_to_contact = TRUE`,
      [donorId, bloodRequest.rows[0].blood_group]
    );

    if (donor.rows.length === 0) {
      return res.status(400).json({
        message: "No eligible available donor found for this blood group."
      });
    }

    // Prevent duplicate requests to the same donor for the same blood request
    const existing = await pool.query(
      `SELECT id
       FROM blood_donation_requests
       WHERE blood_request_id = $1
         AND donor_id = $2
         AND request_status NOT IN ('Rejected', 'Cancelled')`,
      [bloodRequestId, donorId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "A request has already been sent to this donor."
      });
    }

    const result = await pool.query(
      `INSERT INTO blood_donation_requests
       (blood_request_id, donor_id, request_status)
       VALUES ($1, $2, 'Pending')
       RETURNING *`,
      [bloodRequestId, donorId]
    );

    res.status(201).json({
      message: "Donation request sent to the donor.",
      donationRequest: result.rows[0]
    });
  } catch (error) {
    console.error("Donation request error:", error);
    res.status(500).json({
      message: "Unable to send donation request."
    });
  }
});

module.exports = router;