import React from "react";
import { useNavigate } from "react-router-dom";
// Import the FontAwesomeIcon component and the specific icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCarSide, faUser } from "@fortawesome/free-solid-svg-icons";
import "../styles/HomePage.css";

const HomePage: React.FC = () => {
  let navigate = useNavigate();

  const handleRegister = (userType: "rider" | "driver") => {
    navigate("/register", { state: { userType } });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Community Carpool Connect (C3)</h1>
      </header>
      <main>
        {/* Intro, How It Works, Benefits sections remain unchanged */}
        <section className="sign-up">
          <h2>Get Started</h2>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <button
              style={{ marginRight: "10px" }}
              onClick={() => handleRegister("rider")}
            >
              <FontAwesomeIcon icon={faUser} /> Register as Rider
            </button>
            <button onClick={() => handleRegister("driver")}>
              <FontAwesomeIcon icon={faCarSide} /> Register as Driver
            </button>
          </div>
          <a href="/login" className="login-link">
            Already have an account? Log in
          </a>
        </section>
      </main>
      <footer className="App-footer">
        <a href="/login" className="admin-login-link">
          Admin Login
        </a>
        {/* Other footer content */}
      </footer>
    </div>
  );
};

export default HomePage;
