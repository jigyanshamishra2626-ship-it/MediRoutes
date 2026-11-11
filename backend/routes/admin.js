const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

// Admin authentication
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please login as admin.",
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin access only.",
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired admin login.",
    });
  }
}
// Admin Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const result = await pool.query(
      "SELECT id, name, email, password_hash FROM admins WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const admin = result.rows[0];
    const bcrypt = require("bcryptjs");

    const validPassword = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const token = jwt.sign(
      { id: admin.id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Admin login successful!",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    res.status(500).json({
      message: "Admin login failed."
    });
  }
});
// View all appointments
router.get("/appointments", adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM appointments
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to fetch appointments.",
    });
  }
});

// Confirm an appointment
router.patch(
  "/appointments/:id/confirm",
  adminAuth,
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE appointments
         SET status = 'Confirmed'
         WHERE id = $1
         RETURNING *`,
        [req.params.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Appointment not found.",
        });
      }

      res.json({
        message: "Appointment confirmed successfully.",
        appointment: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Unable to confirm appointment.",
      });
    }
  }
);
// Create the first admin account
router.post("/setup", async (req, res) => {
  try {
    const { name, email, password, setupKey } = req.body;

    if (!name || !email || !password || !setupKey) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({
        message: "Invalid setup key."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters."
      });
    }

    const bcrypt = require("bcryptjs");
    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO admins (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name.trim(), normalizedEmail, hashedPassword]
    );

    res.status(201).json({
      message: "Admin account created successfully.",
      admin: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "An admin with this email already exists."
      });
    }

    console.error("Admin setup error:", error.message);
    res.status(500).json({
      message: "Unable to create admin account."
    });
  }
});
// View all bed booking requests
router.get("/bed-bookings", adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bb.*, h.name AS hospital_name
      FROM bed_bookings bb
      LEFT JOIN hospitals h ON h.id = bb.hospital_id
      ORDER BY bb.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Bed requests error:", error.message);
    res.status(500).json({
      message: "Unable to fetch bed requests."
    });
  }
});

// Approve or reject a bed booking request
router.patch("/bed-bookings/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Approved or Rejected."
      });
    }

    const result = await pool.query(
      `UPDATE bed_bookings
       SET booking_status = $1
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Bed booking request not found."
      });
    }

    res.json({
      message: `Bed booking ${status.toLowerCase()} successfully.`,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error("Bed status update error:", error.message);
    res.status(500).json({
      message: "Unable to update bed booking status."
    });
  }
});
// View all blood requests
router.get("/blood-requests", adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT br.*, h.name AS hospital_name
      FROM blood_requests br
      LEFT JOIN hospitals h ON h.id = br.hospital_id
      ORDER BY br.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Blood requests error:", error.message);
    res.status(500).json({
      message: "Unable to fetch blood requests."
    });
  }
});

// Approve or reject a blood request
router.patch("/blood-requests/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Approved or Rejected."
      });
    }

    const result = await pool.query(
      `UPDATE blood_requests
       SET request_status = $1
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Blood request not found."
      });
    }

    res.json({
      message: `Blood request ${status.toLowerCase()} successfully.`,
      request: result.rows[0]
    });
  } catch (error) {
    console.error("Blood status update error:", error.message);
    res.status(500).json({
      message: "Unable to update blood request status."
    });
  }
});
module.exports = router;