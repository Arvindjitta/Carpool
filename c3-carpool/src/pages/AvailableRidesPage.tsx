import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ride } from "../Interfaces/Index";
import "../styles/AvailableRidesPage.css";

const AvailableRidesPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/available-rides", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Authorization header if needed
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch rides");
      }
      let data: Ride[] = await response.json();
      let currentUserType = localStorage.getItem("userType");
      //filtering data based on usertype
      data = data.filter((ride) => ride.userType !== currentUserType);

      console.log("DATA", data);
      setRides(data);
    } catch (error) {
      console.error("Error fetching available rides:", error);
      // Handle fetch error, e.g., display a message
    }
  };

  const joinRide = async (rideId: string) => {
    try {
      const response = await fetch(`/api/join-ride/${rideId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization header if needed
        },
      });
      if (!response.ok) {
        throw new Error("Failed to join ride");
      }
      alert("Successfully joined the ride!");
      fetchRides(); // Refresh rides
    } catch (error) {
      console.error("Error joining ride:", error);
      // Handle join error, e.g., display a message
    }
  };

  const to12HourFormat = (time: string): string => {
    const [hour, minute] = time.split(":").map(Number); // Convert the hour and minute parts to numbers
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="AvailableRides">
      <h1>Available Rides</h1>
      {rides.map((ride) => (
        <div className="RideCard">
          <div className="TimeAndDestination">
            <div>
              {ride.startPoint} -----to----- {ride.endPoint}
            </div>
            <div className="time">{to12HourFormat(ride.time)}</div>
          </div>

          <div className="TimeAndDestination">
            <div>
              {ride.userType === "rider"
                ? `Riders: ${ride.numberOfRiders}`
                : `Seats Available: ${ride.seatsAvailable}`}
            </div>
            <div className="Price">
              {ride.userType === "rider"
                ? `${ride.pricePerSeat ? ride.pricePerSeat : "--"}$ /per person`
                : `${ride.pricePerSeat}$ /per person`}
            </div>
          </div>

          <button
            className="DetailsButton"
            onClick={() => {
              /* toggle details */
            }}
          >
            Details
          </button>
          <button
            className="JoinButton"
            // onClick={() => handleJoinRide(ride.id)}
          >
            Join Ride
          </button>
        </div>
      ))}
    </div>
  );
};

export default AvailableRidesPage;
