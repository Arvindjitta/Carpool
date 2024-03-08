import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css"; // Make sure to create and style LoginPage.css

interface ILoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginFormData, setLoginFormData] = useState<ILoginFormData>({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginFormData({
      ...loginFormData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(loginFormData);
    // Here, you would typically handle login verification
    // For now, let's assume login is successful and redirect to a dashboard/homepage
    navigate("/dashboard", { state: { userType: "rider" } }); // Adjust the path as needed
  };

  return (
    <div className="loginForm">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={loginFormData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={loginFormData.password}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit">Log In</button>
      </form>
    </div>
  );
};

export default LoginPage;
