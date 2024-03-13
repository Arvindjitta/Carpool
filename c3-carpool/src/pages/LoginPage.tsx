import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css"; // Make sure to create and style LoginPage.css

interface ILoginFormData {
  email: string;
  password: string;
}

function ClickCounter() {
  // Use useRef to hold a mutable value that doesn't cause re-renders
  const clickCount = React.useRef(0);
  console.log("MyComponent rendered!");

  const handleClick = () => {
    clickCount.current += 1;
    console.log(`Button clicked ${clickCount.current} times`);
  };

  return <button onClick={handleClick}>Click Me</button>;
}

function ClickCounterWithUseState() {
  // Use useState to hold and set the number of clicks
  const [clickCount, setClickCount] = useState(0);
  console.log("MyComponent rendered!");

  const handleClick = () => {
    setClickCount(clickCount + 1);
  };

  return (
    <div>
      <button onClick={handleClick}>Click Me</button>
      <p>Button clicked {clickCount} times</p>
    </div>
  );
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginFormData, setLoginFormData] = useState<ILoginFormData>({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // New state to track form submission

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginFormData({
      ...loginFormData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true); // Disable the submit button
    console.log(loginFormData);
    // Here, you would typically handle login verification
    // For now, let's assume login is successful and redirect to a dashboard/homepage
    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginFormData),
      });

      if (response.ok) {
        const { access_token, userType } = await response.json();
        console.log("Login successful:", access_token, userType);
        alert(`Login successful as ${userType}!`);

        // Store the received token and userType in localStorage/sessionStorage or context
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("userType", userType);

        // Redirect user based on userType or to a common dashboard
        navigate("/dashboard", { state: { userType: `${userType}` } }); // Adjust the path as needed
      } else {
        const errorResponse = await response.json();
        alert("Login failed: " + errorResponse.error);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
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
        <button type="submit" disabled={isSubmitting}>
          Log In
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
