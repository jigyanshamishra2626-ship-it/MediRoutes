import { useState } from "react";

const API = "http://localhost:5000";

export default function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [bedBookings, setBedBookings] = useState([]);
const [bloodRequests, setBloodRequests] = useState([]);
const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Admin login failed.");
      }

      setAdmin(data.admin);
      setToken(data.token);
      setPassword("");
      setMessage("Admin login successful!");

      await loadAppointments(data.token);
      await loadBedBookings(data.token);
await loadBloodRequests(data.token);
await loadEmergencyRequests(data.token);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadAppointments = async (adminToken = token) => {
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/admin/appointments`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load appointments.");
      }

      setAppointments(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };
const loadBedBookings = async (adminToken = token) => {
  try {
    const response = await fetch(`${API}/api/admin/bed-bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load bed requests.");
    }

    setBedBookings(data);
  } catch (error) {
    setMessage(error.message);
  }
};

const loadBloodRequests = async (adminToken = token) => {
  try {
    const response = await fetch(`${API}/api/admin/blood-requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load blood requests.");
    }

    setBloodRequests(data);
  } catch (error) {
    setMessage(error.message);
  }
};
const loadEmergencyRequests = async (adminToken = token) => {
  try {
    const response = await fetch(`${API}/api/emergency`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load emergency requests."
      );
    }

    setEmergencyRequests(data);
  } catch (error) {
    setMessage(error.message);
  }
};
  const confirmAppointment = async (id) => {
    try {
      const response = await fetch(
        `${API}/api/admin/appointments/${id}/confirm`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to confirm appointment.");
      }

      setMessage("Appointment confirmed successfully!");
      await loadAppointments();
    } catch (error) {
      setMessage(error.message);
    }
  };
const updateRequestStatus = async (type, id, status) => {
  try {
    const endpoint =
      type === "bed" ? "bed-bookings" : "blood-requests";

    const response = await fetch(
      `${API}/api/admin/${endpoint}/${id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to update request.");
    }

    setMessage(data.message);

    if (type === "bed") {
      await loadBedBookings();
    } else {
      await loadBloodRequests();
    }
  } catch (error) {
    setMessage(error.message);
  }
};
const updateEmergencyStatus = async (id, status) => {
  try {
    const response = await fetch(
      `${API}/api/emergency/${id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to update emergency status.");
    }

    setMessage(data.message || "Emergency status updated successfully!");
    await loadEmergencyRequests();
  } catch (error) {
    setMessage(error.message);
  }
};
  const logout = () => {
    setAdmin(null);
    setToken("");
    setAppointments([]);
    setEmail("");
    setPassword("");
    setMessage("Admin logged out.");
  };

  if (!admin) {
    return (
      <main style={styles.container}>
        <h1>✚ Medi Routes</h1>
        <h2>Doctor Admin Login</h2>

        <form onSubmit={login} style={styles.form}>
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Login as Admin
          </button>
        </form>

        {message && <p>{message}</p>}
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <h1>✚ Medi Routes Admin</h1>
      <h2>Welcome, {admin.name}</h2>
      <p>Manage patient appointment requests.</p>

      <button onClick={() => loadAppointments()} style={styles.button}>
        Refresh Appointments
      </button>

      <button onClick={logout} style={styles.logout}>
        Logout
      </button>

      {message && <p>{message}</p>}
      {loading && <p>Loading appointments...</p>}

      {!loading && appointments.length === 0 && (
        <p>No appointments found.</p>
      )}

      {appointments.map((item) => (
        <article key={item.id} style={styles.card}>
          <h3>{item.patient_name || item.patientName || "Patient"}</h3>
          <p>Phone: {item.phone || "Not provided"}</p>
          <p>Doctor: {item.doctor_name || item.doctorName || "Not specified"}</p>
          <p>
            Date: {String(item.appointment_date || item.date || "").slice(0, 10)}
          </p>
          <p>Time: {item.time_slot || item.timeSlot || "Not specified"}</p>
          <p>
            Status: <strong>{item.status || "Pending"}</strong>
          </p>

          {item.status === "Pending" && (
            <button
              onClick={() => confirmAppointment(item.id)}
              style={styles.button}
            >
              Confirm Appointment
            </button>
          )}
        </article>
      ))}
      <h2>Bed Booking Requests</h2>

<button
  onClick={loadBedBookings}
  style={styles.button}
>
  Refresh Bed Requests
</button>

{bedBookings.length === 0 && <p>No bed requests found.</p>}

{bedBookings.map((item) => (
  <article key={item.id} style={styles.card}>
    <h3>{item.hospital_name || "Hospital"}</h3>
    <p>Bed Type: {item.bed_type}</p>
    <p>Room: {item.ac_type}</p>
    <p>Admission Date: {String(item.admission_date).slice(0, 10)}</p>
    <p>Duration: {item.duration_days} day(s)</p>
    <p>Status: <strong>{item.booking_status}</strong></p>

    {item.booking_status === "Pending" && (
      <>
        <button
          onClick={() => updateRequestStatus("bed", item.id, "Approved")}
          style={styles.button}
        >
          Approve
        </button>

        <button
          onClick={() => updateRequestStatus("bed", item.id, "Rejected")}
          style={styles.logout}
        >
          Reject
        </button>
      </>
    )}
  </article>
))}
<h2>Blood Requests</h2>

      <button
        onClick={loadBloodRequests}
        style={styles.button}
      >
        Refresh Blood Requests
      </button>

      {bloodRequests.length === 0 && (
        <p>No blood requests found.</p>
      )}

      {bloodRequests.map((item) => (
        <article key={item.id} style={styles.card}>
          <h3>{item.hospital_name || "Hospital"}</h3>

          <p>Blood Group: {item.blood_group}</p>
          <p>Units Required: {item.units_required}</p>
          <p>
            Required Date:{" "}
            {item.required_date
              ? String(item.required_date).slice(0, 10)
              : "Not specified"}
          </p>
          <p>Contact: {item.contact_number || "Not provided"}</p>
          <p>
            Status: <strong>{item.request_status}</strong>
          </p>

          {item.request_status === "Pending" && (
            <>
              <button
                onClick={() =>
                  updateRequestStatus("blood", item.id, "Approved")
                }
                style={styles.button}
              >
                Approve
              </button>

              <button
                onClick={() =>
                  updateRequestStatus("blood", item.id, "Rejected")
                }
                style={styles.logout}
              >
                Reject
              </button>
            </>
          )}
        </article>
      ))}
      <section style={styles.card}>
  <h2>🚨 Emergency Requests</h2>

  <button
    style={styles.button}
    onClick={() => loadEmergencyRequests()}
  >
    Refresh Emergency Requests
  </button>

  {emergencyRequests.length === 0 ? (
    <p>No emergency requests found.</p>
  ) : (
    emergencyRequests.map((item) => (
      <div
        key={item.id}
        style={{
          border: "1px solid #fecaca",
          borderRadius: "8px",
          padding: "14px",
          marginTop: "12px",
        }}
      >
        <h3>🚨 {item.patient_name || "Patient"}</h3>
        <p><b>Status:</b> {item.status}</p>
        <p>
  <b>Phone:</b>{" "}
  {item.patient_phone || "Phone number not available"}
</p>
        <p>
          <b>Time:</b>{" "}
          {item.created_at
            ? new Date(item.created_at).toLocaleString()
            : "Not available"}
        </p>
        <p>
          <b>Latitude:</b> {item.latitude}
        </p>
        <p>
          <b>Longitude:</b> {item.longitude}
        </p>

      <a
  href={`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`}
  target="_blank"
  rel="noreferrer"
  style={{
    display: "inline-block",
    marginTop: "10px",
    padding: "10px 16px",
    background: "#087f8c",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "600",
  }}
>
  📍 Get Directions to Patient
</a>
        <br />

{item.patient_phone && (
  <a
    href={`tel:${item.patient_phone}`}
    style={{
      display: "inline-block",
      marginTop: "12px",
      padding: "10px 16px",
      background: "#16a34a",
      color: "white",
      textDecoration: "none",
      borderRadius: "8px",
      fontWeight: "600",
    }}
  >
    📞 Call Patient
  </a>
)}
{item.status === "Pending" && (
  <div style={{ marginTop: "12px" }}>
    <button
      onClick={() =>
        updateEmergencyStatus(item.id, "Approved")
      }
      style={{
        ...styles.button,
        background: "#16a34a",
      }}
    >
      ✓ Approve Emergency
    </button>

    <button
      onClick={() =>
        updateEmergencyStatus(item.id, "Rejected")
      }
      style={{
        ...styles.logout,
        background: "#dc2626",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        padding: "10px 16px",
      }}
    >
      ✕ Reject Emergency
    </button>
  </div>
)}
      </div>
    ))
  )}
</section>
    </main>
  );
}

const styles = {
  container: {
    maxWidth: "1100px",
    width: "calc(100% - 32px)",
    margin: "32px auto",
    padding: "28px",
    boxSizing: "border-box",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#29213D",
    background: "#F7F5FC",
    borderRadius: "20px",
    lineHeight: 1.7,
  },

  form: {
    display: "grid",
    gap: "14px",
    maxWidth: "440px",
    marginTop: "22px",
    padding: "24px",
    background: "#FFFFFF",
    border: "1px solid #E4DCF5",
    borderRadius: "16px",
    boxShadow: "0 6px 22px rgba(76, 44, 145, 0.08)",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 15px",
    color: "#29213D",
    background: "#FFFFFF",
    border: "1px solid #CFC3E8",
    borderRadius: "9px",
    fontSize: "15px",
    outlineColor: "#7045C2",
  },

  button: {
    display: "inline-block",
    padding: "11px 18px",
    background: "#6038B5",
    color: "#FFFFFF",
    border: "1px solid #6038B5",
    borderRadius: "9px",
    cursor: "pointer",
    marginRight: "8px",
    marginTop: "8px",
    fontSize: "14px",
    fontWeight: "700",
    lineHeight: 1.5,
  },

  logout: {
    display: "inline-block",
    padding: "11px 18px",
    margin: "8px",
    background: "#FCE8EC",
    color: "#A61B3C",
    border: "1px solid #F2BCC8",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
    lineHeight: 1.5,
  },

  card: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    background: "#FFFFFF",
    color: "#29213D",
    border: "1px solid #E0D7F1",
    borderLeft: "5px solid #7950C8",
    borderRadius: "15px",
    padding: "22px 24px",
    marginTop: "18px",
    marginBottom: "18px",
    boxShadow: "0 5px 18px rgba(55, 35, 90, 0.07)",
    overflowWrap: "anywhere",
  },
};