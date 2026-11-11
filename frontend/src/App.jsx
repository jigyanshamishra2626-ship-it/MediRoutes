import { useState, useEffect } from "react";
import "./App.css";
import Admin from "./Admin";
import Doctor from "./Doctor";
const API = "http://localhost:5000";

function App() {
  const isAdminPage = window.location.pathname === "/admin";
  const [search, setSearch] = useState("");
  const [emergencyLocation, setEmergencyLocation] = useState(null);
  const [emergencyPhone, setEmergencyPhone] = useState("");
const [emergencyMessage, setEmergencyMessage] = useState("");
const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [showLoginPanel, setShowLoginPanel] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalSearch, setHospitalSearch] = useState("");
const [hospitalLoading, setHospitalLoading] = useState(true);
const [hospitalError, setHospitalError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [authMode, setAuthMode] = useState("register");
  const [name, setName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loggedInPatient, setLoggedInPatient] = useState(null);

  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  const [bookingMessage, setBookingMessage] = useState("");
  const [myAppointments, setMyAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
// Bed Booking
  const [bedType, setBedType] = useState("General Ward");
  const [acType, setAcType] = useState("Non-AC");
  const [bedHospitalId, setBedHospitalId] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [durationDays, setDurationDays] = useState("1");
  const [bedMessage, setBedMessage] = useState("");
  const [myBedBookings, setMyBedBookings] = useState([]);
  const [bedLoading, setBedLoading] = useState(false);
  // Blood Request
const [bloodHospitalId, setBloodHospitalId] = useState("");
const [bloodGroup, setBloodGroup] = useState("O+");
const [unitsRequired, setUnitsRequired] = useState("1");
const [requiredDate, setRequiredDate] = useState("");
const [contactNumber, setContactNumber] = useState("");
const [bloodMessage, setBloodMessage] = useState("");
const [myBloodRequests, setMyBloodRequests] = useState([]);
const [bloodLoading, setBloodLoading] = useState(false);
// Blood Donor Registration
const [donorName, setDonorName] = useState("");
const [donorBloodGroup, setDonorBloodGroup] = useState("O+");
const [donorCity, setDonorCity] = useState("Bhubaneswar");
const [donorContact, setDonorContact] = useState("");
const [donorConsent, setDonorConsent] = useState(false);
const [donorMessage, setDonorMessage] = useState("");
const [donorSearchGroup, setDonorSearchGroup] = useState("O+");
const [donorSearchCity, setDonorSearchCity] = useState("Bhubaneswar");
const [availableDonors, setAvailableDonors] = useState([]);
 useEffect(() => {
    fetch(`${API}/api/doctors`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load doctors.");
        return response.json();
      })
      .then((data) => {
        setDoctors(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load doctors. Please start the backend server.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch(`${API}/api/hospitals`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load hospitals.");
        return response.json();
      })
      .then((data) => {
        setHospitals(data);
        setHospitalLoading(false);
      })
      .catch(() => {
        setHospitalError("Unable to load hospitals.");
        setHospitalLoading(false);
      });
  }, []);
  const submitBloodRequest = async (e) => {
  e.preventDefault();
  setBloodMessage("");

  const token = localStorage.getItem("patientToken");

  if (!token || !loggedInPatient) {
    setBloodMessage("Please login before requesting blood.");
    return;
  }

  try {
    const response = await fetch(`${API}/api/blood-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        hospitalId: Number(bloodHospitalId),
        bloodGroup,
        unitsRequired: Number(unitsRequired),
        requiredDate: requiredDate || null,
        contactNumber,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Blood request failed.");
    }

    setBloodMessage(data.message || "Blood request submitted.");
    setBloodHospitalId("");
    setUnitsRequired("1");
    setRequiredDate("");
    setContactNumber("");

    await fetchMyBloodRequests();
  } catch (err) {
    setBloodMessage(err.message || "Unable to submit blood request.");
  }
};

const fetchMyBloodRequests = async () => {
  const token = localStorage.getItem("patientToken");

  if (!token) {
    setBloodMessage("Please login first.");
    return;
  }

  setBloodLoading(true);

  try {
    const response = await fetch(`${API}/api/blood-requests/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load blood requests.");
    }

    setMyBloodRequests(data);
  } catch (err) {
    setBloodMessage(err.message);
  } finally {
    setBloodLoading(false);
  }
};
const registerBloodDonor = async (e) => {
  e.preventDefault();
  setDonorMessage("");

  const token = localStorage.getItem("patientToken");

  if (!token) {
    setDonorMessage("Please login first.");
    return;
  }

  try {
    const response = await fetch(`${API}/api/blood-donors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        donorName,
        bloodGroup: donorBloodGroup,
        city: donorCity,
        contactNumber: donorContact,
        consentToContact: donorConsent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Donor registration failed.");
    }

    setDonorMessage(data.message || "Donor registration successful.");
    setDonorName("");
    setDonorContact("");
    setDonorConsent(false);
  } catch (err) {
    setDonorMessage(err.message || "Unable to register donor.");
  }
};

const searchBloodDonors = async (e) => {
  e.preventDefault();
  setDonorMessage("");

  const token = localStorage.getItem("patientToken");

  if (!token) {
    setDonorMessage("Please login first.");
    return;
  }

  try {
    const params = new URLSearchParams({
      city: donorSearchCity,
      bloodGroup: donorSearchGroup,
    });

    const response = await fetch(
      `${API}/api/blood-donors/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Donor search failed.");
    }

    setAvailableDonors(data);
  } catch (err) {
    setDonorMessage(err.message || "Unable to search donors.");
  }
};
  const fetchBedBookings = async () => {
  const token = localStorage.getItem("patientToken");

  if (!token) {
    setBedMessage("Please login first.");
    return;
  }

  setBedLoading(true);

  try {
    const response = await fetch(`${API}/api/bed-bookings/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load bed bookings.");
    }

    setMyBedBookings(data);
  } catch (err) {
    setBedMessage(err.message);
  } finally {
    setBedLoading(false);
  }
};
const bookBed = async (e) => {
  e.preventDefault();
  setBedMessage("");

  const token = localStorage.getItem("patientToken");

  if (!token || !loggedInPatient) {
    setBedMessage("Please login before requesting a bed.");
    return;
  }

  try {
    const response = await fetch(`${API}/api/bed-bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        hospitalId: Number(bedHospitalId),
        bedType,
        acType,
        admissionDate,
        durationDays: Number(durationDays),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Bed booking request failed.");
    }

    setBedMessage(data.message || "Bed booking request submitted.");
    setBedHospitalId("");
    setAdmissionDate("");
    setDurationDays("1");

    await fetchBedBookings();
  } catch (err) {
    setBedMessage(err.message || "Unable to submit bed booking.");
  }
};
  const fetchAppointments = async () => {
    const token = localStorage.getItem("patientToken");

    if (!token) {
      setBookingMessage("Please login to view appointments.");
      return;
    }

    setAppointmentsLoading(true);

    try {
      const response = await fetch(`${API}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to load appointments.");
      }

      setMyAppointments(
        data.map((item) => ({
          ...item,
          patientName: item.patientName ?? item.patient_name ?? "",
          doctorName: item.doctorName ?? item.doctor_name ?? "",
          date: item.date ?? item.appointment_date ?? "",
          timeSlot: item.timeSlot ?? item.time_slot ?? "",
        }))
      );
    } catch (err) {
      setBookingMessage(err.message);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setBookingMessage("");

    if (loginPassword.length < 8) {
      setBookingMessage("Password must be at least 8 characters.");
      return;
    }

    if (loginPassword !== confirmPassword) {
      setBookingMessage("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setBookingMessage("Registration successful! Please login.");
      setAuthMode("login");
      setLoginPassword("");
      setConfirmPassword("");
      setName("");
    } catch (err) {
      setBookingMessage(err.message || "Unable to register.");
    }
  };

  const handlePatientLogin = async (e) => {
    e.preventDefault();
    setBookingMessage("");

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      localStorage.setItem("patientToken", data.token);
      setLoggedInPatient(data.patient);
      setLoginPassword("");
      setBookingMessage(data.message || "Login successful!");
      await fetchAppointments();
    } catch (err) {
      setBookingMessage(err.message || "Unable to login.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("patientToken");
    setLoggedInPatient(null);
    setMyAppointments([]);
    setLoginEmail("");
    setLoginPassword("");
    setBookingMessage("You have logged out.");
  };

  const bookAppointment = async (e) => {
    e.preventDefault();
    setBookingMessage("");

    const token = localStorage.getItem("patientToken");

    if (!token || !loggedInPatient) {
      setBookingMessage("Please login before booking.");
      return;
    }

    try {
      const response = await fetch(`${API}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientName,
          phone,
          doctorName,
          date,
          timeSlot,
        }),
      });

    const data = await response.json();
console.log("Booking response:", response.status, data);

if (!response.ok) {
  throw new Error(data.message || "Booking failed.");
}

      setBookingMessage(data.message || "Appointment request submitted!");
      setPatientName("");
      setPhone("");
      setDoctorName("");
      setDate("");
      setTimeSlot("");
      await fetchAppointments();
    } catch (err) {
      setBookingMessage(err.message || "Unable to book appointment.");
    }
  };

  const cancelAppointment = async (id) => {
    const token = localStorage.getItem("patientToken");
    if (!token) {
      setBookingMessage("Please login again.");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/api/appointments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to cancel appointment.");
      }

      setMyAppointments((previous) =>
        previous.filter((item) => item.id !== id)
      );
      setBookingMessage(data.message || "Appointment cancelled.");
    } catch (err) {
      setBookingMessage(err.message);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const text = search.toLowerCase();
    return (
      (doctor.name || "").toLowerCase().includes(text) ||
      (doctor.specialty || "").toLowerCase().includes(text) ||
      (doctor.hospital || "").toLowerCase().includes(text)
    );
  });
  if (window.location.pathname === "/doctor") {
  return <Doctor />;
}
if (isAdminPage) {
  return <Admin />;
}
  return (
    <div className="app">
      <header className="navbar">
        <h2>✚ Medi Routes</h2>
        <nav>
          <a href="#home">Home</a>
          <a href="#doctors">Find Doctors</a>
          <a href="#appointments">Appointments</a>
        </nav>
        <div className="login-menu">
  <button
    type="button"
    onClick={() => setShowLoginPanel(!showLoginPanel)}
  >
    Login ▾
  </button>

  {showLoginPanel && (
    <div className="login-panel">
      <h3>Login to Medi Routes</h3>

      <button
        type="button"
        onClick={() => {
          setAuthMode("login");
          setShowLoginPanel(false);
          document.querySelector(".patient-login")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        Patient Login
      </button>

      <button
        type="button"
        onClick={() => {
          window.location.href = "/doctor";
        }}
      >
        Doctor Login
      </button>

      <button
        type="button"
        onClick={() => {
          window.location.href = "/admin";
        }}
      >
        Admin Login
      </button>
    </div>
  )}
</div>
        <button
          type="button"
          onClick={() =>
            document.getElementById("appointments")?.scrollIntoView({
              behavior: "smooth",
            })
          }
        >
          Book Appointment
        </button>
      </header>

      <main>
        {!loggedInPatient ? (
          <section className="patient-login">
            <h2>
              {authMode === "register" ? "Create Patient Account" : "Patient Login"}
            </h2>
            <p>
              {authMode === "register"
                ? "Register to book and manage your appointments."
                : "Login with your registered email and password."}
            </p>

            <div className="auth-toggle">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setBookingMessage("");
                }}
                disabled={authMode === "register"}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setBookingMessage("");
                }}
                disabled={authMode === "login"}
              >
                Login
              </button>
            </div>

            <form
              onSubmit={
                authMode === "register" ? handleRegister : handlePatientLogin
              }
            >
              {authMode === "register" && (
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}

              <input
                type="email"
                placeholder="Enter your email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                minLength={8}
                required
              />

              {authMode === "register" && (
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              )}

              <button type="submit">
                {authMode === "register" ? "Create Account" : "Login"}
              </button>
            </form>

            {bookingMessage && <p>{bookingMessage}</p>}
          </section>
        ) : (
          <section className="patient-login">
            <h2>Welcome, {loggedInPatient.name}!</h2>
            <p>You are logged in as a patient.</p>
            <button type="button" onClick={handleLogout}>Logout</button>
          </section>
        )}

        <section className="hero" id="home">
          <div>
            <p className="tag">YOUR HEALTH, OUR PRIORITY</p>
            <h1>Healthcare made<br />simple for everyone.</h1>
            <p>
              Find doctors, explore medical services and manage
              your appointments in one place.
            </p>
            <a className="primary" href="#doctors">Find a Doctor →</a>
          </div>
          <div className="hero-card">
            <span>✚</span>
            <h2>Your health matters.</h2>
            <p>Find the right care at the right time.</p>
            <div className="health-status">● Healthcare access made easier</div>
          </div>
        </section>

        <section className="stats">
          <div><strong>24/7</strong><span>Online Access</span></div>
          <div><strong>Easy</strong><span>Doctor Search</span></div>
          <div><strong>Secure</strong><span>Patient Experience</span></div>
        </section>
        <section className="emergency-section">
  <h2>🚨 Emergency Assistance</h2>
  <p>Get emergency help and share your current location.</p>

  <a href="tel:112" className="emergency-call-btn">
    📞 Call Emergency Services (112)
  </a>
<input
  type="tel"
  placeholder="Enter your phone number"
  value={emergencyPhone}
  onChange={(e) => setEmergencyPhone(e.target.value)}
  style={{
    padding: "12px",
    margin: "8px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    width: "240px",
  }}
/>
  <button
    type="button"
    className="emergency-location-btn"
    disabled={emergencyLoading}
    onClick={() => {
      if (!navigator.geolocation) {
        setEmergencyMessage("Location is not supported by this browser.");
        return;
      }

      setEmergencyLoading(true);
      setEmergencyMessage("");

      navigator.geolocation.getCurrentPosition(
       async (position) => {
  try {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    const response = await fetch(
      "http://localhost:5000/api/emergency",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientName: loggedInPatient?.name || "Patient",
        patientPhone: emergencyPhone,
          latitude,
          longitude,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to share location.");
    }

    setEmergencyLocation({ latitude, longitude });
    setEmergencyMessage(
      "Emergency location shared with admin successfully."
    );
  } catch (error) {
    setEmergencyMessage(
      error.message || "Unable to share location."
    );
  } finally {
    setEmergencyLoading(false);
  }
},
        () => {
          setEmergencyMessage(
            "Location unavailable. Please allow location permission and try again."
          );
          setEmergencyLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }}
  >
   
    {emergencyLoading ? "Getting Location..." : "📍 Share My Location"}
  </button>

  {emergencyMessage && <p>{emergencyMessage}</p>}

  {emergencyLocation && (
    <p>
      <a
        href={`https://www.google.com/maps?q=${emergencyLocation.latitude},${emergencyLocation.longitude}`}
        target="_blank"
        rel="noreferrer"
      >
        View My Location on Google Maps
      </a>
    </p>
  )}
</section>
<section className="hospitals" id="hospitals">
  <p className="tag">HOSPITAL DIRECTORY</p>
  <h2>Find Hospitals in Bhubaneswar</h2>
  <div className="hospital-search">
  <input
    type="text"
    placeholder="Search hospital by name..."
    value={hospitalSearch}
    onChange={(e) => setHospitalSearch(e.target.value)}
  />
</div>
  <p>Explore hospital contact details and services.</p>

  {hospitalLoading && <p>Loading hospitals...</p>}
  {hospitalError && <p>{hospitalError}</p>}

  {!hospitalLoading && !hospitalError && (
    <div className="hospital-grid">
     {hospitals
 .filter((hospital) =>
  `${hospital.name} ${hospital.address}`
    .toLowerCase()
    .includes(hospitalSearch.toLowerCase())
)
  .map((hospital) => (
        <article className="hospital-card" key={hospital.id}>
          <div className="hospital-icon">✚</div>
          <h3>{hospital.name}</h3>
          <p>{hospital.address}</p>
          {hospital.address && (
  <a
    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hospital.address)}`}
    target="_blank"
    rel="noreferrer"
    className="hospital-directions-btn"
  >
    📍 Get Directions
  </a>
)}
          <p>
            <strong>Phone:</strong>{" "}
            {hospital.phone || "Contact details unavailable"}
          </p>

          {hospital.website && (
            <a href={hospital.website} target="_blank" rel="noreferrer">
              Official Website ↗
            </a>
          )}
          <button
  type="button"
  className="hospital-details-btn"
  onClick={() => setSelectedHospital(hospital)}
>
  View Full Details
</button>
{hospital.services && hospital.services.length > 0 && (
  <div className="hospital-services">
    <h4>Available Services</h4>
    <ul>
      {hospital.services.map((service) => (
        <li key={service.id}>{service.service_name}</li>
      ))}
    </ul>
  </div>
)}
{hospital.beds && hospital.beds.length > 0 && (
  <div className="hospital-beds">
    <h4>Bed Categories</h4>

    <ul>
      {hospital.beds.map((bed) => (
        <li key={bed.id}>
          {bed.bed_type}
          {bed.ventilator_supported && " (Ventilator Supported)"}
        </li>
      ))}
    </ul>

    <p className="bed-demo-note">
      Demo data only. Live bed availability is not connected.
    </p>
  </div>
)}
          <p className="verification-note">
            {hospital.is_verified
              ? "Basic details marked verified"
              : "Details not yet verified"}
          </p>
        </article>
      ))}
    {hospitals.filter((hospital) =>
  `${hospital.name} ${hospital.address}`
    .toLowerCase()
    .includes(hospitalSearch.toLowerCase())
).length === 0 && (
  <p className="no-hospitals">
    No hospitals found. Try another hospital name.
  </p>
)}
{selectedHospital && (
  <div className="hospital-detail-panel">
    <div className="hospital-detail-header">
      <h3>{selectedHospital.name}</h3>
      <button
        type="button"
        onClick={() => setSelectedHospital(null)}
      >
        Close ×
      </button>
    </div>

    <p>
      <strong>Address:</strong> {selectedHospital.address}
    </p>

    <p>
      <strong>Phone:</strong>{" "}
      {selectedHospital.phone || "Not available"}
    </p>

    <p>
      <strong>About:</strong>{" "}
      {selectedHospital.description || "Details not available"}
    </p>

    <h4>Hospital Services</h4>
    {selectedHospital.services?.length > 0 ? (
      <ul>
        {selectedHospital.services.map((service) => (
          <li key={service.id}>
            {service.service_name}
          </li>
        ))}
      </ul>
    ) : (
      <p>Service details not available.</p>
    )}

    <h4>Bed Categories</h4>
    {selectedHospital.beds?.length > 0 ? (
      <ul>
        {selectedHospital.beds.map((bed) => (
          <li key={bed.id}>
            {bed.bed_type}
            {bed.ventilator_supported &&
              " (Ventilator Supported)"}
          </li>
        ))}
      </ul>
    ) : (
      <p>Bed category details not available.</p>
    )}

    <p className="bed-demo-note">
      Demo information only. Live bed availability is not connected.
    </p>
  </div>
)}
      {hospitals.length === 0 && <p>No hospitals found.</p>}
    </div>
  )}
</section>
        <section className="doctors" id="doctors">
          <p className="tag">OUR MEDICAL DIRECTORY</p>
          <h2>Find the right doctor</h2>
          <p>Search by doctor, specialty or clinic.</p>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cardiologist, doctor, hospital..."
          />

          {loading && <p>Loading doctors...</p>}
          {error && <p>{error}</p>}

          {!loading && !error && (
            <div className="doctor-grid">
              {filteredDoctors.map((doctor) => (
                <article className="doctor-card" key={doctor.id}>
                  <div className="doctor-icon">⚕</div>
                  <h3>{doctor.name}</h3>
                  <p>{doctor.specialty}</p>
                  <small>{doctor.hospital}</small>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("appointments")?.scrollIntoView({
                        behavior: "smooth",
                      })
                    }
                  >
                    Request Appointment
                  </button>
                </article>
              ))}
              {filteredDoctors.length === 0 && <p>No matching doctors found.</p>}
            </div>
          )}
        </section>
<section className="appointment" id="bed-booking">
  <h2>Book a Hospital Bed</h2>
  <p>Submit a bed request and wait for hospital confirmation.</p>

  {loggedInPatient ? (
    <form onSubmit={bookBed} className="booking-form">
      <select
        value={bedHospitalId}
        onChange={(e) => setBedHospitalId(e.target.value)}
        required
      >
        <option value="">Select Hospital</option>
        {hospitals.map((hospital) => (
          <option key={hospital.id} value={hospital.id}>
            {hospital.name}
          </option>
        ))}
      </select>

      <select
        value={bedType}
        onChange={(e) => setBedType(e.target.value)}
        required
      >
        <option value="General Ward">General Ward</option>
        <option value="Private Room">Private Room</option>
        <option value="ICU">ICU</option>
        <option value="ICU with Ventilator">ICU with Ventilator</option>
      </select>

      <select
        value={acType}
        onChange={(e) => setAcType(e.target.value)}
        required
      >
        <option value="Non-AC">Non-AC</option>
        <option value="AC">AC</option>
      </select>

      <label>Admission Date</label>
      <input
        type="date"
        value={admissionDate}
        min={new Date().toLocaleDateString("en-CA")}
        onChange={(e) => setAdmissionDate(e.target.value)}
        required
      />

      <label>Duration (days)</label>
      <input
        type="number"
        min="1"
        max="90"
        value={durationDays}
        onChange={(e) => setDurationDays(e.target.value)}
        required
      />

      <button type="submit">Submit Bed Request</button>
    </form>
  ) : (
    <p>Please register or login first to request a hospital bed.</p>
  )}

  {bedMessage && <p>{bedMessage}</p>}

  {loggedInPatient && (
    <div className="my-appointments">
      <h3>My Bed Requests</h3>
      <button type="button" onClick={fetchBedBookings}>
        View My Bed Requests
      </button>

      {bedLoading && <p>Loading bed requests...</p>}

      {!bedLoading && myBedBookings.map((booking) => (
        <div className="appointment-card" key={booking.id}>
          <h4>{booking.hospital_name}</h4>
          <p>Bed Type: {booking.bed_type}</p>
          <p>Room: {booking.ac_type}</p>
          <p>Admission Date: {String(booking.admission_date).slice(0, 10)}</p>
          <p>Duration: {booking.duration_days} day(s)</p>
          <p>Status: <strong>{booking.booking_status}</strong></p>
          <p>Confirmation is subject to hospital approval.</p>
        </div>
      ))}

      {!bedLoading && myBedBookings.length === 0 && (
        <p>No bed requests loaded yet. Select "View My Bed Requests".</p>
      )}
    </div>
  )}

  <p className="bed-demo-note">
    Bed availability and charges are not live-verified. Please confirm directly
    with the hospital, especially for urgent medical needs.
  </p>
</section>
<section className="appointment" id="blood-request">
  <h2>Request Blood</h2>
  <p>Submit a blood request for hospital confirmation.</p>

  {loggedInPatient ? (
    <form onSubmit={submitBloodRequest} className="booking-form">
      <select
        value={bloodHospitalId}
        onChange={(e) => setBloodHospitalId(e.target.value)}
        required
      >
        <option value="">Select Hospital</option>
        {hospitals.map((hospital) => (
          <option key={hospital.id} value={hospital.id}>
            {hospital.name}
          </option>
        ))}
      </select>

      <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="O+">O+</option>
        <option value="O-">O-</option>
      </select>

      <input
        type="number"
        placeholder="Units required"
        min="1"
        max="20"
        value={unitsRequired}
        onChange={(e) => setUnitsRequired(e.target.value)}
        required
      />

      <label>Required Date</label>
      <input
        type="date"
        value={requiredDate}
        onChange={(e) => setRequiredDate(e.target.value)}
      />

      <input
        type="tel"
        placeholder="Contact number"
        value={contactNumber}
        onChange={(e) => setContactNumber(e.target.value)}
        required
      />

      <button type="submit">Submit Blood Request</button>
    </form>
  ) : (
    <p>Please login first to request blood.</p>
  )}

  {bloodMessage && <p>{bloodMessage}</p>}

  {loggedInPatient && (
    <div className="my-appointments">
      <h3>My Blood Requests</h3>
      <button type="button" onClick={fetchMyBloodRequests}>
        View My Blood Requests
      </button>

      {bloodLoading && <p>Loading...</p>}

      {myBloodRequests.map((request) => (
        <div className="appointment-card" key={request.id}>
          <p>Hospital: {request.hospital_name}</p>
          <p>Blood Group: {request.blood_group}</p>
          <p>Units: {request.units_required}</p>
          <p>Status: {request.request_status}</p>
        </div>
      ))}
    </div>
  )}

  <p>Blood availability must be confirmed with the hospital or blood bank.</p>
</section>
<section className="appointment" id="blood-donor">
  <h2>Register as a Blood Donor</h2>
  <p>Register to let people search for eligible donors in your city.</p>

  {loggedInPatient ? (
    <form onSubmit={registerBloodDonor} className="booking-form">
      <input
        type="text"
        placeholder="Donor full name"
        value={donorName}
        onChange={(e) => setDonorName(e.target.value)}
        required
      />

      <select
        value={donorBloodGroup}
        onChange={(e) => setDonorBloodGroup(e.target.value)}
        required
      >
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="O+">O+</option>
        <option value="O-">O-</option>
      </select>

      <input
        type="text"
        placeholder="City"
        value={donorCity}
        onChange={(e) => setDonorCity(e.target.value)}
        required
      />

      <input
        type="tel"
        placeholder="Contact number"
        value={donorContact}
        onChange={(e) => setDonorContact(e.target.value)}
        required
      />

      <label>
        <input
          type="checkbox"
          checked={donorConsent}
          onChange={(e) => setDonorConsent(e.target.checked)}
          required
        />
        I consent to being contacted about blood donation.
      </label>

      <button type="submit">Register as Donor</button>
    </form>
  ) : (
    <p>Please login first to register as a donor.</p>
  )}

  {donorMessage && <p>{donorMessage}</p>}
</section>
<section className="appointment" id="donor-search">
  <h2>Find Blood Donors</h2>
  <p>Search registered donors by city and blood group.</p>

  {loggedInPatient ? (
    <form onSubmit={searchBloodDonors} className="booking-form">
      <input
        type="text"
        placeholder="Enter city"
        value={donorSearchCity}
        onChange={(e) => setDonorSearchCity(e.target.value)}
        required
      />

      <select
        value={donorSearchGroup}
        onChange={(e) => setDonorSearchGroup(e.target.value)}
        required
      >
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="O+">O+</option>
        <option value="O-">O-</option>
      </select>

      <button type="submit">Search Donors</button>
    </form>
  ) : (
    <p>Please login first to search donors.</p>
  )}

  {availableDonors.map((donor) => (
    <div className="appointment-card" key={donor.id}>
      <h3>{donor.donor_name}</h3>
      <p>Blood Group: {donor.blood_group}</p>
      <p>City: {donor.city}</p>
    </div>
  ))}

  {loggedInPatient && availableDonors.length === 0 && (
    <p>No matching donors shown. Search by city and blood group.</p>
  )}
</section>
        <section className="appointment" id="appointments">
          <h2>Book an Appointment</h2>
          <p>Enter your details to request an appointment.</p>

          {loggedInPatient ? (
            <form onSubmit={bookAppointment} className="booking-form">
              <input
                type="text"
                placeholder="Patient full name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
              <input
                type="tel"
                placeholder="Contact number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern="[0-9]{10}"
                title="Enter a 10-digit phone number"
                required
              />
              <select
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                required
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.name}>
                    {doctor.name} - {doctor.specialty}
                  </option>
                ))}
              </select>
            <input
  type="date"
  value={date}
  min={(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  })()}
  onChange={(e) => setDate(e.target.value)}
  required
/>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                required
              >
                <option value="">Select Appointment Time</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:00 PM">03:00 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
              <button type="submit">Submit Appointment Request</button>
            </form>
          ) : (
            <p>Please register or login first to book an appointment.</p>
          )}

          {bookingMessage && <p>{bookingMessage}</p>}

          {loggedInPatient && (
            <div className="my-appointments">
              <h2>My Appointments</h2>
              <button type="button" onClick={fetchAppointments}>
                View Appointments
              </button>

              {appointmentsLoading && <p>Loading appointments...</p>}
              {!appointmentsLoading && myAppointments.length === 0 && (
                <p>No appointments found. Book an appointment first.</p>
              )}

              {myAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-card">
                  <h3>{appointment.patientName || loggedInPatient.name}</h3>
                  <p>Doctor: {appointment.doctorName || "Not specified"}</p>
                  <p>
                    Date: {appointment.date
                      ? String(appointment.date).slice(0, 10)
                      : "Not specified"}
                  </p>
                  <p>Time: {appointment.timeSlot || "Not specified"}</p>
                  <p>Status: <strong>{appointment.status || "Pending"}</strong></p>
                  <button
                    type="button"
                    onClick={() => cancelAppointment(appointment.id)}
                  >
                    Cancel Appointment
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        <strong>✚ Medi Routes</strong>
        <p>Healthcare access, made simpler.</p>
        <small>
          Demo website. Doctor listings are sample data,
          not verified providers.
        </small>
      </footer>
    </div>
  );
}

export default App;