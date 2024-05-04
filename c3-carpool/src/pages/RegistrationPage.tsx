import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/RegistrationPage.css";

interface ICarInfo {
  licensePlate?: string;
  make?: string;
  model?: string;
  type?: string;
}

interface IFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth?: string;
  ssn?: string;
  carInfo?: ICarInfo;
}

const RegistrationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userType = location.state?.userType || "rider";

  const initialFormData: IFormData = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    ...(userType === "driver"
      ? {
          ssn: "",
          carInfo: { licensePlate: "", make: "", model: "", type: "" },
        }
      : {}),
    ...(userType === "rider" ? { dateOfBirth: "" } : {}),
  };

  const [formData, setFormData] = useState<IFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("carInfo.")) {
      const fieldName = name.split(".")[1];
      setFormData((prevFormData) => ({
        ...prevFormData,
        carInfo: {
          ...prevFormData.carInfo,
          [fieldName]: value,
        },
      }));
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      setIsSubmitting(false);
      return;
    }

    const submitData = {
      ...formData,
      userType,
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result);
        navigate("/login");
      } else {
        const errorResponse = await response.json();
        alert("Registration failed: " + errorResponse.error);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed: An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registrationForm">
      <h2>Register as a {userType === "driver" ? "Driver" : "Rider"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name:</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Last Name:</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Confirm Password:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>City:</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>State:</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Zip Code:</label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            required
          />
        </div>
        {userType === "driver" && (
          <>
            <div>
              <label>SSN:</label>
              <input
                type="text"
                name="ssn"
                value={formData.ssn}
                onChange={handleInputChange}
                required
              />
            </div>
            <h3>Car Information</h3>
            <div>
              <label>License Plate:</label>
              <input
                type="text"
                name="carInfo.licensePlate"
                value={formData.carInfo?.licensePlate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Make:</label>
              <input
                type="text"
                name="carInfo.make"
                value={formData.carInfo?.make}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Model:</label>
              <input
                type="text"
                name="carInfo.model"
                value={formData.carInfo?.model}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label>Type:</label>
              <input
                type="text"
                name="carInfo.type"
                value={formData.carInfo?.type}
                onChange={handleInputChange}
                required
              />
            </div>
          </>
        )}
        {userType === "rider" && (
          <div>
            <label>Date of Birth:</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              required
            />
          </div>
        )}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default RegistrationPage;
