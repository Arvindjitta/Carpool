import React, { useState } from "react";
import { useLocation } from "react-router-dom"; // Import useLocation hook
import "../styles/RegistrationPage.css"; // Assuming you have a CSS file for styling
import { useNavigate } from "react-router-dom";

interface ICarInfo {
  licensePlate?: string;
  make?: string;
  model?: string;
  type?: string;
}

interface IFormData {
  name: string;
  email: string;
  password: any;
  contactInfo: string;
  carInfo?: ICarInfo;
}

const RegistrationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extracting userType from location state; defaulting to "rider" if not found
  const userType = location.state?.userType || "rider";

  const initialFormData: IFormData = {
    name: "",
    email: "",
    password: "",
    contactInfo: "",
    carInfo: { licensePlate: "", make: "", model: "", type: "" },
  };

  const [formData, setFormData] = useState<IFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state to track form submission

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("carInfo.")) {
      setFormData({
        ...formData,
        carInfo: {
          ...formData.carInfo,
          [name.split(".")[1]]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true); // Disable the submit button

    // Prepare the data to be submitted
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
        // If the registration is successful, handle accordingly
        // For example, you could clear the form, show a success message, or redirect the user
        const result = await response.json();
        console.log(result);
        // alert("Registration successful!");
        navigate("/login"); // Adjust the path as needed

        // Reset form or redirect user
        // setFormData(initialFormData);
        // redirect user to login or other page
      } else {
        // If the server responded with an error status, handle accordingly
        const errorResponse = await response.json();
        alert("Registration failed: " + errorResponse.error);
      }
    } catch (error) {
      // If the request failed to reach the server or there was an error in the request itself
      console.error("Registration error:", error);
      alert("Registration failed: An unexpected error occurred.");
    } finally {
      setIsSubmitting(false); // Re-enable the submit button after the API call completes
    }
  };

  return (
    <div className="registrationForm">
      <h2>Register as a {userType === "driver" ? "Driver" : "Rider"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
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
            type="text"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Contact Info:</label>
          <input
            type="text"
            name="contactInfo"
            value={formData.contactInfo}
            onChange={handleInputChange}
            required
          />
        </div>
        {userType === "driver" && (
          <>
            <h3>Car Information</h3>
            <div>
              <label>License Plate:</label>
              <input
                type="text"
                name="carInfo.licensePlate"
                value={formData.carInfo?.licensePlate}
                onChange={handleInputChange}
                required={userType === "driver"}
              />
            </div>
            <div>
              <label>Make:</label>
              <input
                type="text"
                name="carInfo.make"
                value={formData.carInfo?.make}
                onChange={handleInputChange}
                required={userType === "driver"}
              />
            </div>
            <div>
              <label>Model:</label>
              <input
                type="text"
                name="carInfo.model"
                value={formData.carInfo?.model}
                onChange={handleInputChange}
                required={userType === "driver"}
              />
            </div>
            <div>
              <label>Type:</label>
              <input
                type="text"
                name="carInfo.type"
                value={formData.carInfo?.type}
                onChange={handleInputChange}
                required={userType === "driver"}
              />
            </div>
          </>
        )}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default RegistrationPage;
