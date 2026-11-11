import { useState } from "react";

const API = "http://localhost:5000";

export default function Doctor() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const today = new Date().toLocaleDateString("en-CA");

  const total = appointments.length;
  const pending = appointments.filter(
    (a) => a.status === "Pending"
  ).length;
  const confirmed = appointments.filter(
    (a) => a.status === "Confirmed"
  ).length;
  const rejected = appointments.filter(
    (a) => a.status === "Rejected"
  ).length;

  const todaysAppointments = appointments.filter(
    (a) =>
      a.appointment_date &&
      String(a.appointment_date).slice(0, 10) === today
  ).length;

  const filteredAppointments = appointments.filter((a) => {
    if (!selectedDate) return true;

    return (
      a.appointment_date &&
      String(a.appointment_date).slice(0, 10) === selectedDate
    );
  });

  async function login(e) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch(`${API}/api/auth/doctor-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      setToken(data.token);
      setDoctor(data.doctor);
      await loadAppointments(data.token);
    } catch {
      setMessage("Backend server check karo.");
    }
  }

  async function loadAppointments(authToken = token) {
    try {
      const res = await fetch(`${API}/api/doctor/appointments`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Appointments load nahi hui.");
        return;
      }

      setAppointments(data);
      setMessage("");
    } catch {
      setMessage("Appointments load nahi hui.");
    }
  }

  async function updateStatus(id, status) {
    try {
      const res = await fetch(
        `${API}/api/doctor/appointments/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Status update failed.");
        return;
      }

      setMessage("Appointment status updated!");
      await loadAppointments();
    } catch {
      setMessage("Status update nahi hua.");
    }
  }

  if (!doctor) {
    return (
      <div style={styles.page}>
        <form onSubmit={login} style={styles.card}>
          <h1>✚ Medi Routes</h1>
          <h2>Doctor Login</h2>
          <p>Login to manage your appointments.</p>

          <input
            style={styles.input}
            type="email"
            placeholder="Doctor email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button style={styles.button} type="submit">
            Login
          </button>

          {message && <p style={styles.message}>{message}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.dashboard}>
        <h1>✚ Medi Routes</h1>
        <h2>Welcome, {doctor.name}</h2>
        <p>{doctor.specialty}</p>

        <button
          style={styles.button}
          onClick={() => loadAppointments()}
        >
          ↻ Refresh Appointments
        </button>

        <button
          style={styles.logout}
          onClick={() => {
            setToken("");
            setDoctor(null);
            setAppointments([]);
            setPassword("");
            setEmail("");
            setSelectedDate("");
            setMessage("");
          }}
        >
          Logout
        </button>

        {message && <p style={styles.message}>{message}</p>}

        <h2>Dashboard Overview</h2>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p>Total Appointments</p>
            <h2>{total}</h2>
          </div>

          <div style={styles.statCard}>
            <p>Pending</p>
            <h2 style={{ color: "#b7791f" }}>{pending}</h2>
          </div>

          <div style={styles.statCard}>
            <p>Confirmed</p>
            <h2 style={{ color: "#16803c" }}>{confirmed}</h2>
          </div>

          <div style={styles.statCard}>
            <p>Rejected</p>
            <h2 style={{ color: "#c62828" }}>{rejected}</h2>
          </div>

          <div style={styles.statCard}>
            <p>Today's Appointments</p>
            <h2 style={{ color: "#087f8c" }}>
              {todaysAppointments}
            </h2>
          </div>
        </div>

        <h3>Filter Appointments by Date</h3>

        <div style={styles.filterBox}>
          <input
            type="date"
            style={styles.dateInput}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <button
            style={styles.logout}
            onClick={() => setSelectedDate("")}
          >
            Reset Filter
          </button>
        </div>

        <h3>
          My Appointments ({filteredAppointments.length})
        </h3>

        {filteredAppointments.length === 0 ? (
          <p>No appointments found for this date.</p>
        ) : (
          filteredAppointments.map((a) => (
            <div key={a.id} style={styles.appointment}>
              <p>
                <b>Patient:</b> {a.patient_name || "Patient"}
              </p>

              <p>
                <b>Phone:</b>{" "}
                {a.phone || "Phone number not available"}
              </p>

              <p>
                <b>Doctor:</b> {a.doctor_name || doctor.name}
              </p>

              <p>
                <b>Date:</b>{" "}
                {a.appointment_date
                  ? String(a.appointment_date).slice(0, 10)
                  : "Not available"}
              </p>

              <p>
                <b>Time:</b> {a.time_slot || "Not available"}
              </p>

              <p>
                <b>Status:</b>{" "}
                <span
                  style={{
                    color:
                      a.status === "Confirmed"
                        ? "#16803c"
                        : a.status === "Rejected"
                        ? "#c62828"
                        : "#b7791f",
                    fontWeight: "bold",
                  }}
                >
                  {a.status}
                </span>
              </p>

              {a.status !== "Confirmed" &&
                a.status !== "Rejected" && (
                  <div>
                    <button
                      style={styles.button}
                      onClick={() => updateStatus(a.id, "Confirmed")}
                    >
                      Confirm
                    </button>

                    <button
                      style={styles.reject}
                      onClick={() => updateStatus(a.id, "Rejected")}
                    >
                      Reject
                    </button>
                  </div>
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f0f7f8",
    padding: "30px 16px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    maxWidth: "420px",
    margin: "50px auto",
    padding: "28px",
    background: "white",
    borderRadius: "14px",
    boxShadow: "0 4px 18px #0001",
  },
  dashboard: {
    maxWidth: "850px",
    margin: "auto",
    padding: "25px",
    background: "white",
    borderRadius: "14px",
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    margin: "14px 0",
    border: "1px solid #ccc",
    borderRadius: "7px",
  },
  button: {
    padding: "11px 16px",
    margin: "5px",
    border: "none",
    borderRadius: "7px",
    background: "#087f8c",
    color: "white",
    cursor: "pointer",
  },
 logout: {
    padding: "11px 16px",
    margin: "5px",
    border: "1px solid #7c3aed",
    borderRadius: "7px",
    background: "#ede9fe",
    color: "#4c1d95",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    opacity: 1,
  },
  reject: {
    padding: "11px 16px",
    margin: "5px",
    border: "none",
    borderRadius: "7px",
    background: "#c62828",
    color: "white",
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    margin: "20px 0",
  },
  statCard: {
    padding: "16px",
    background: "#f0f7f8",
    border: "1px solid #dce5e5",
    borderRadius: "10px",
    textAlign: "center",
  },
  filterBox: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
  },
  dateInput: {
    padding: "11px",
    border: "1px solid #ccc",
    borderRadius: "7px",
    maxWidth: "100%",
  },
  appointment: {
    padding: "16px",
    marginTop: "15px",
    border: "1px solid #dce5e5",
    borderRadius: "10px",
    overflowWrap: "anywhere",
  },
  message: {
    color: "#087f8c",
    fontWeight: "bold",
  },
};