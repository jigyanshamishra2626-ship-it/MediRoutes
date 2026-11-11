const express = require("express");
const router = express.Router();
const pool = require("../db");

// Get all hospitals with services and bed categories
router.get("/", async (req, res) => {
  try {
    const hospitalsResult = await pool.query(`
      SELECT id, name, address, phone, website, description, is_verified
      FROM hospitals
      ORDER BY name ASC
    `);

    const hospitals = await Promise.all(
      hospitalsResult.rows.map(async (hospital) => {
        const servicesResult = await pool.query(
          `SELECT id, service_name, price, price_unit, details,
                  is_available
           FROM hospital_services
           WHERE hospital_id = $1
           ORDER BY service_name`,
          [hospital.id]
        );

        const bedsResult = await pool.query(
          `SELECT id, bed_type, total_beds, available_beds,
                  price_per_day, ventilator_supported
           FROM hospital_beds
           WHERE hospital_id = $1
           ORDER BY bed_type`,
          [hospital.id]
        );

        return {
          ...hospital,
          services: servicesResult.rows,
          beds: bedsResult.rows
        };
      })
    );

    res.json(hospitals);
  } catch (error) {
    console.error("Fetch hospitals error:", error.message);
    res.status(500).json({
      message: "Unable to load hospitals."
    });
  }
});

// Get one hospital with services and bed availability
router.get("/:id", async (req, res) => {
  try {
    const hospitalId = Number(req.params.id);

    if (!Number.isInteger(hospitalId) || hospitalId < 1) {
      return res.status(400).json({
        message: "Invalid hospital ID."
      });
    }

    const hospitalResult = await pool.query(
      `SELECT id, name, address, phone, website, description, is_verified
       FROM hospitals
       WHERE id = $1`,
      [hospitalId]
    );

    if (hospitalResult.rows.length === 0) {
      return res.status(404).json({
        message: "Hospital not found."
      });
    }

    const servicesResult = await pool.query(
      `SELECT id, service_name, price, price_unit, details,
              is_available, last_updated
       FROM hospital_services
       WHERE hospital_id = $1
       ORDER BY service_name`,
      [hospitalId]
    );

    const bedsResult = await pool.query(
      `SELECT id, bed_type, total_beds, available_beds,
              price_per_day, ventilator_supported, last_updated
       FROM hospital_beds
       WHERE hospital_id = $1
       ORDER BY bed_type`,
      [hospitalId]
    );

    res.json({
      hospital: hospitalResult.rows[0],
      services: servicesResult.rows,
      beds: bedsResult.rows
    });
  } catch (error) {
    console.error("Fetch hospital details error:", error.message);
    res.status(500).json({
      message: "Unable to load hospital details."
    });
  }
});

module.exports = router;