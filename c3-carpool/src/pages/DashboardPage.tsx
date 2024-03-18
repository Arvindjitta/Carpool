import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faUserFriends,
  faWallet,
  faRoad,
  faCalendarPlus,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/DashboardPage.css"; // Ensure you create appropriate styles

const DashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"rider" | "driver">("rider");

  // Assuming the user type (rider or driver) is passed via state from the HomePage component
  useEffect(() => {
    if (location.state && (location.state as any).userType) {
      setUserType((location.state as any).userType);
    } else {
      // If no user type is provided, redirect back to the home page or a default route
      navigate("/");
    }
  }, [location, navigate]);

  const handleLogout = () => {
    // Display confirmation dialog
    const isConfirmed = window.confirm("Are you sure you want to logout?");

    if (isConfirmed) {
      // User clicked "OK", proceed with logout
      localStorage.removeItem("userType"); // Example: Clearing a userType stored in localStorage
      localStorage.removeItem("authToken"); // Example: Clearing an auth token if you're using one

      // Redirect the user to the login page or home page
      navigate("/login");
    }
    // If user clicked "Cancel", do nothing and let them remain on the page
  };

  return (
    <div className="Dashboard">
      <header className="Dashboard-header">
        <h1>
          Welcome to Your {userType.charAt(0).toUpperCase() + userType.slice(1)}{" "}
          Dashboard
        </h1>
        <button onClick={handleLogout} className="Logout-button">
          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
        </button>
      </header>
      <main>
        <section className="Dashboard-actions">
          <h2>Quick Actions</h2>
          <div className="Actions-container">
            {/* Conditionally rendered buttons wrapped in divs for card styling */}

            <div
              className="Action-card"
              onClick={() => navigate("/available-rides")}
            >
              <FontAwesomeIcon icon={faUserFriends} />
              <span>Find Rides</span>
            </div>
            <div
              className="Action-card"
              onClick={() => navigate("/manage-wallet")}
            >
              <FontAwesomeIcon icon={faWallet} />
              <span>Manage Wallet</span>
            </div>
            <div
              className="Action-card"
              onClick={() => navigate("/view-rides")}
            >
              <FontAwesomeIcon icon={faRoad} />
              <span>View My Rides</span>
            </div>
            {userType === "driver" && (
              <div
                className="Action-card"
                onClick={() => navigate("/list-ride")}
              >
                <FontAwesomeIcon icon={faCalendarPlus} />
                <span>Schedule a Ride</span>
              </div>
            )}
            {userType === "rider" && (
              <div
                className="Action-card"
                onClick={() => navigate("/list-ride")}
              >
                <FontAwesomeIcon icon={faCar} />
                <span>List a Ride</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
