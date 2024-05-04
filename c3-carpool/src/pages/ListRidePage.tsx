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
    arrivalTime: "",
    departureTime: "", // New field for departure time
    duration: "", // New field for duration
    seatsAvailable: "",
    pricePerSeat: "",
    numberOfRiders: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "duration") {
      // Calculate arrival time based on duration
      const [hours, minutes] = value.split(":").map(Number);
      const [startHours, startMinutes] = rideDetails.departureTime
        .split(":")
        .map(Number);
      let totalHours = startHours + hours;
      let totalMinutes = startMinutes + minutes;
      if (totalMinutes >= 60) {
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes %= 60;
      }
      const arrivalHours = totalHours % 12 || 12; // Convert to 12-hour format
      const amPm = totalHours < 12 ? "AM" : "PM"; // Determine AM/PM
      const arrivalMinutes = totalMinutes;
      const arrivalTime = `${arrivalHours < 10 ? "0" : ""}${arrivalHours}:${
        arrivalMinutes < 10 ? "0" : ""
      }${arrivalMinutes} ${amPm}`;
      setRideDetails({ ...rideDetails, arrivalTime, [name]: value });
    } else {
      setRideDetails({ ...rideDetails, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const requestData = { ...rideDetails, userType };
    const token = localStorage.getItem("access_token"); // Retrieve the token from local storage

    try {
      const response = await fetch("http://127.0.0.1:5000/list-ride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Correctly include the token in the Authorization header
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to list ride: ${errorData.error}`);
        return;
      }

      const data = await response.json();
      alert(data.message); // "Ride listed successfully!"
      navigate("/dashboard", { state: { userType: `${userType}` } });
    } catch (error) {
      console.error("Error listing ride:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="ListRide">
      <h1>{userType === "rider" ? "List Your Ride" : "Schedule Your Ride"}</h1>
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
        <p>Start time:</p>
        <input
          type="time"
          name="departureTime"
          value={rideDetails.departureTime}
          onChange={handleChange}
          required
        />

        <input
          type="string"
          name="duration"
          placeholder="Duration (HH:MM)"
          value={rideDetails.duration}
          onChange={handleChange}
          required
        />

        {/* Display arrival time */}
        {rideDetails.arrivalTime && (
          <p>Calculated Arrival Time: {rideDetails.arrivalTime}</p>
        )}

        {userType === "driver" && (
          <input
            type="number"
            name="seatsAvailable"
            placeholder="Seats Available"
            value={rideDetails.seatsAvailable || ""}
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
    </div>
  );
};

export default ListRidePage;
