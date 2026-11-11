const express = require("express");
const router = express.Router();

const doctors = [
  {
    id: 1,
    name: "Dr. Ananya Sharma",
    specialty: "Cardiologist",
    hospital: "City Heart Clinic",
    experience: "8 years"
  },
  {
    id: 2,
    name: "Dr. Rahul Das",
    specialty: "General Physician",
    hospital: "MediCare Hospital",
    experience: "5 years"
  },
  {
    id: 3,
    name: "Dr. Priya Patel",
    specialty: "Dermatologist",
    hospital: "HealthPlus Clinic",
    experience: "6 years"
  },
  {
    id: 4,
    name: "Dr. Amit Kumar",
    specialty: "Orthopedic",
    hospital: "LifeCare Hospital",
    experience: "7 years"
  }
];

router.get("/", (req, res) => {
  res.json(doctors);
});

module.exports = router;