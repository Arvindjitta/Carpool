import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RegistrationPage from "./pages/RegistrationPage"; // Ensure this import
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ListRidePage from "./pages/ListRidePage";
import AvailableRidesPage from "./pages/AvailableRidesPage";
import WalletManagementPage from "./pages/WalletManagementPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/list-ride" element={<ListRidePage />} />
        <Route path="/available-rides" element={<AvailableRidesPage />} />
        <Route path="/manage-wallet" element={<WalletManagementPage />} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
