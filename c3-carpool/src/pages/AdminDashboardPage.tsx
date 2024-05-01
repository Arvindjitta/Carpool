import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faCar,
  faMoneyBillWave,
  faEnvelopeOpenText,
  faChartLine,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/DashboardPage.css"; // Reusing your existing styles

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    const isConfirmed = window.confirm("Are you sure you want to logout?");
    if (isConfirmed) {
      // Example: Clearing storage items and redirecting
      localStorage.removeItem("authToken");
      localStorage.removeItem("access_token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userType");

      navigate("/");
    }
  };

  // Placeholder for navigation functions (e.g., navigate to user management page)
  const navigateTo = (path: any) => () => navigate(path);

  return (
    <div className="Dashboard">
      <header className="Dashboard-header">
        <h1>Welcome to the Admin Dashboard</h1>
        <button onClick={handleLogout} className="Logout-button">
          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
        </button>
      </header>
      <main>
        <section className="Dashboard-actions">
          <h2>Admin Actions</h2>
          <div className="Actions-container">
            {/* User Management */}
            <div className="Action-card" onClick={navigateTo("/admin/users")}>
              <FontAwesomeIcon icon={faUser} />
              <span>User Management</span>
            </div>
            {/* Ride Management */}
            <div className="Action-card" onClick={navigateTo("/admin/rides")}>
              <FontAwesomeIcon icon={faCar} />
              <span>Ride Management</span>
            </div>
            {/* Financial Overview */}
            <div
              className="Action-card"
              onClick={navigateTo("/admin/financials")}
            >
              <FontAwesomeIcon icon={faMoneyBillWave} />
              <span>Financials</span>
            </div>
            {/* User Queries */}
            {/* <div className="Action-card" onClick={navigateTo("/admin/support")}>
              <FontAwesomeIcon icon={faEnvelopeOpenText} />
              <span>User Support</span>
            </div> */}
            {/* Reports */}
            {/* <div className="Action-card" onClick={navigateTo("/admin/reports")}>
              <FontAwesomeIcon icon={faChartLine} />
              <span>Reports</span>
            </div> */}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
