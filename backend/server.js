const express = require("express");
const cors = require("cors");
require("dotenv").config();

const doctorsRouter = require("./routes/doctors");
const bedBookingsRouter = require("./routes/bedBookings");
const bloodRequestsRouter = require("./routes/bloodRequests");
const bloodDonorsRouter = require("./routes/bloodDonors");
const bloodDonationRequestsRouter = require("./routes/bloodDonationRequests");
const hospitalsRouter = require("./routes/hospitals");
const emergencyRouter = require("./routes/emergency");
const appointmentsRouter = require("./routes/appointments");
const pool = require("./db");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const doctorRouter = require("./routes/doctor");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/doctors", doctorsRouter);
app.use("/api/auth", authRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/bed-bookings", bedBookingsRouter);
app.use("/api/blood-requests", bloodRequestsRouter);
app.use("/api/blood-donors", bloodDonorsRouter);
app.use("/api/blood-donation-requests", bloodDonationRequestsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/hospitals", hospitalsRouter);
app.use("/api/emergency", emergencyRouter);
app.use("/api/availability", require("./routes/availability"));
app.get("/", (req, res) => {
  res.json({
    message: "Medi Routes API is running",
    status: "success"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Medi Routes Backend"
  });
});
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "PostgreSQL connected successfully!",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error("Database test failed:", error.message);

    res.status(500).json({
      message: "Database connection failed."
    });
  }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Medi Routes server running on port ${PORT}`);
});