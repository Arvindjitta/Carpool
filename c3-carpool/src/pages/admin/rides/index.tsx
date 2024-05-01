import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import "./index.css";

interface CarInfo {
  make: string;
  model: string;
  year: number;
}

interface Ride {
  _id: {
    $oid: string;
  };
  userId: string;
  startPoint: string;
  endPoint: string;
  date: string;
  time: string;
  seatsAvailable?: number;
  numberOfRiders?: number;
  pricePerSeat?: number;
  status: string;
  carInfo?: CarInfo;
  showCarInfo: boolean;
  userType: string;
}

const RideManagementPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/rides", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch rides");
      }
      const data: Ride[] = await response.json();
      setRides(data);
    } catch (error) {
      console.error("Error fetching rides:", error);
      alert("Failed to load rides");
    }
    setLoading(false);
  };

  const deleteRide = async (rideId: string) => {
    if (window.confirm("Are you sure you want to delete this ride?")) {
      try {
        const response = await fetch(
          `http://127.0.0.1:5000/rides/${encodeURIComponent(rideId)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to delete ride");
        }
        alert("Ride deleted successfully");
        setRides(rides.filter((ride) => ride._id.$oid !== rideId));
      } catch (error) {
        console.error("Error deleting ride:", error);
        alert("Failed to delete ride");
      }
    }
  };

  return (
    <div className="RideManagement">
      <h1>Ride Management</h1>
      {loading ? (
        <p>Loading rides...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Start Point</th>
              <th>End Point</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>

              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride) => (
              <tr key={ride._id.$oid}>
                <td>{ride._id.$oid}</td>
                <td>{ride.startPoint}</td>
                <td>{ride.endPoint}</td>
                <td>{ride.date}</td>
                <td>{ride.time}</td>
                <td>{ride.status}</td>

                <td>
                  {/* <button onClick={() => alert("Edit ride not implemented")}>
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button> */}
                  <button onClick={() => deleteRide(ride._id.$oid)}>
                    <FontAwesomeIcon icon={faTrash} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RideManagementPage;
