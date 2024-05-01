import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RegistrationPage from "./pages/RegistrationPage"; // Ensure this import
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ListRidePage from "./pages/ListRidePage";
import AvailableRidesPage from "./pages/AvailableRidesPage";
import WalletManagementPage from "./pages/WalletManagementPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import BookedRidesPage from "./pages/BookingsRidePage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import RideManagementPage from "./pages/admin/rides";
import FinancialManagementPage from "./pages/admin/transactions";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/list-ride" element={<ListRidePage />} />
        <Route path="/available-rides" element={<AvailableRidesPage />} />
        <Route path="/manage-wallet" element={<WalletManagementPage />} />
        <Route path="/booked-rides" element={<BookedRidesPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/rides" element={<RideManagementPage />} />
        <Route path="admin/financials" element={<FinancialManagementPage />} />
      </Routes>
    </Router>
  );
}

export default App;
