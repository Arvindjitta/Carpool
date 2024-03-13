import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ListRidePage.css"; // Make sure to create and import corresponding styles

const ListRidePage: React.FC = () => {
  const navigate = useNavigate();
  const userType = localStorage.getItem("userType"); // 'rider' or 'driver'

  const [rideDetails, setRideDetails] = useState({
    startPoint: "",
    endPoint: "",
    date: "",
    time: "",
    seatsAvailable: "",
    pricePerSeat: "",
    numberOfRiders: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRideDetails({ ...rideDetails, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prepare the data to be sent to the backend
    const requestData = { ...rideDetails, userType };

    // Assuming your backend endpoint for listing rides is /api/list-ride
    const endpoint = "http://127.0.0.1:5000/list-ride";
    const token = localStorage.getItem("access_token"); // Assuming you store your auth token in localStorage
    console.log("Token", token);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include the Authorization header with the token, if needed
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        // Handle server errors or validation errors
        const errorData = await response.json();
        alert(`Failed to list ride: ${errorData.error}`);
        return;
      }

      // If the request was successful
      const data = await response.json();
      alert(data.message); // "Ride listed successfully!"
      navigate("/dashboard", { state: { userType: `${userType}` } }); // Redirect back to the dashboard
    } catch (error) {
      console.error("Error listing ride:", error);
      alert(error);

      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="ListRide">
      <h1>List Your Ride</h1>
      <form onSubmit={handleSubmit} className="RideForm">
        <input
          type="text"
          name="startPoint"
          placeholder="Start Point"
          value={rideDetails.startPoint}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="endPoint"
          placeholder="End Point"
          value={rideDetails.endPoint}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="date"
          value={rideDetails.date}
          onChange={handleChange}
          required
        />
        <input
          type="time"
          name="time"
          value={rideDetails.time}
          onChange={handleChange}
          required
        />
        {userType === "driver" && (
          <input
            type="number"
            name="seatsAvailable"
            placeholder="Seats Available"
            value={rideDetails.seatsAvailable}
            onChange={handleChange}
            required
          />
        )}
        {userType === "rider" && (
          <input
            type="number"
            name="numberOfRiders"
            placeholder="Number of Riders"
            value={rideDetails.numberOfRiders || ""}
            onChange={handleChange}
            required
          />
        )}
        {userType === "driver" && (
          <input
            type="text"
            name="pricePerSeat"
            placeholder="Price per Seat (optional)"
            value={rideDetails.pricePerSeat}
            onChange={handleChange}
          />
        )}
        <button type="submit">List Ride</button>
      </form>
      <button
        onClick={() =>
          navigate("/dashboard", { state: { userType: `${userType}` } })
        }
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default ListRidePage;
