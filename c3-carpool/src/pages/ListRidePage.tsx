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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(rideDetails);
    // Here, implement your logic to list the ride
    // For now, simulate successful submission
    alert("Ride listed successfully!");
    navigate("/dashboard"); // Redirect back to the dashboard
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
