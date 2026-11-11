const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// Book appointment
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { patientName, phone, doctorName, date, timeSlot } = req.body;
console.log("Booking date received:", date, typeof date);
    // Validate required fields
    if (!patientName || !phone || !doctorName || !date || !timeSlot) {
      return res.status(400).json({
        message: "Please fill all fields."
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        message: "Please select a valid date."
      });
    }

   if (
  typeof date !== "string" ||
  !/^\d{4}-\d{2}-\d{2}$/.test(date)
) {
  return res.status(400).json({
    message: "Please select a valid date."
  });
}

const [year, month, day] = date.split("-").map(Number);

const selectedDate = new Date(year, month - 1, day);

if (
  selectedDate.getFullYear() !== year ||
  selectedDate.getMonth() !== month - 1 ||
  selectedDate.getDate() !== day
) {
  return res.status(400).json({
    message: "Please select a valid date."
  });
}
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        message: "Past dates cannot be booked."
      });
    }

    // Find doctor
    const doctorResult = await pool.query(
      `SELECT id, name
       FROM doctors
       WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))`,
      [doctorName]
    );

    if (doctorResult.rows.length === 0) {
      return res.status(400).json({
        message: "Doctor not found. Please select a valid doctor."
      });
    }

    const doctor = doctorResult.rows[0];

    // JavaScript day numbers: Sunday = 0, Monday = 1 ... Saturday = 6
    const dayOfWeek = selectedDate.getDay();

    // Check doctor's weekly availability
    const scheduleResult = await pool.query(
      `SELECT start_time, end_time, is_available
       FROM doctor_availability
       WHERE doctor_id = $1
         AND day_of_week = $2`,
      [doctor.id, dayOfWeek]
    );

    if (
      scheduleResult.rows.length === 0 ||
      !scheduleResult.rows[0].is_available
    ) {
      return res.status(400).json({
        message: "Doctor is not available on this day."
      });
    }

    const schedule = scheduleResult.rows[0];

    // Accept time formats such as 09:00 or 09:00 AM
    const timeMatch = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(
      String(timeSlot).trim()
    );

    if (!timeMatch) {
      return res.status(400).json({
        message: "Please select a valid appointment time."
      });
    }

    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const meridiem = timeMatch[3]?.toUpperCase();

    if (minutes > 59) {
      return res.status(400).json({
        message: "Please select a valid appointment time."
      });
    }

    if (meridiem) {
      if (hours < 1 || hours > 12) {
        return res.status(400).json({
          message: "Please select a valid appointment time."
        });
      }

      hours = hours % 12;

      if (meridiem === "PM") {
        hours += 12;
      }
    } else if (hours > 23) {
      return res.status(400).json({
        message: "Please select a valid appointment time."
      });
    }

    const slotMinutes = hours * 60 + minutes;

    const startParts = String(schedule.start_time)
      .slice(0, 5)
      .split(":");

    const endParts = String(schedule.end_time)
      .slice(0, 5)
      .split(":");

    const startMinutes =
      Number(startParts[0]) * 60 + Number(startParts[1]);

    const endMinutes =
      Number(endParts[0]) * 60 + Number(endParts[1]);

    // Appointment must start within working hours
    if (slotMinutes < startMinutes || slotMinutes >= endMinutes) {
      return res.status(400).json({
        message: "Selected time is outside doctor's working hours."
      });
    }

    // Check doctor leave
    const leaveResult = await pool.query(
      `SELECT id
       FROM doctor_leaves
       WHERE doctor_id = $1
         AND leave_date = $2::date
       LIMIT 1`,
      [doctor.id, date]
    );

    if (leaveResult.rows.length > 0) {
      return res.status(400).json({
        message:
          "Doctor is on leave on this date. Please select another date."
      });
    }

    // Check whether slot is already booked
    const slotCheck = await pool.query(
      `SELECT id
       FROM appointments
       WHERE doctor_id = $1
         AND appointment_date = $2
         AND time_slot = $3
         AND status <> 'Rejected'
       LIMIT 1`,
      [doctor.id, date, timeSlot]
    );

    if (slotCheck.rows.length > 0) {
      return res.status(409).json({
        message:
          "This time slot is already booked. Please select another time."
      });
    }

    // Save appointment
    const result = await pool.query(
      `INSERT INTO appointments
       (
         patient_id,
         doctor_id,
         patient_name,
         phone,
         doctor_name,
         appointment_date,
         time_slot,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        doctor.id,
        patientName,
        phone,
        doctor.name,
        date,
        timeSlot,
        "Pending"
      ]
    );

    return res.status(201).json({
      message: "Appointment request submitted successfully!",
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error("Booking error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "This time slot is already booked. Please select another time."
      });
    }

    return res.status(500).json({
      message: "Unable to book appointment."
    });
  }
});

// Get logged-in patient's appointments
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM appointments
       WHERE patient_id = $1
       ORDER BY appointment_date DESC, id DESC`,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Fetch appointments error:", error.message);

    return res.status(500).json({
      message: "Unable to load appointments."
    });
  }
});

// Cancel logged-in patient's own appointment
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM appointments
       WHERE id = $1
         AND patient_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Appointment not found."
      });
    }

    return res.json({
      message: "Appointment cancelled successfully."
    });
  } catch (error) {
    console.error("Cancel error:", error.message);

    return res.status(500).json({
      message: "Unable to cancel appointment."
    });
  }
});

module.exports = router;