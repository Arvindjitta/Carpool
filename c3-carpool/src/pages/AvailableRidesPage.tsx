import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ride } from "../Interfaces/Index";
import "../styles/AvailableRidesPage.css";
import Modal from "../components/Model";

const AvailableRidesPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);
  const [number, setNumber] = useState<number | "">("");
  const [pickupLocation, setPickupLocation] = useState<string>("");

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputNumber = parseInt(event.target.value);
    if (inputNumber >= 1 && inputNumber <= 6) {
      setNumber(inputNumber);
    } else {
      setNumber("");
    }
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPickupLocation(event.target.value);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    id: string
  ) => {
    console.log(
      "BODY",
      JSON.stringify({
        rideId: id,
        bookedBy: localStorage.getItem("userId"),
        seatsBooked: number,
        status: "Booked",
        pickupLocation: pickupLocation,
      })
    );
    event.preventDefault();
    try {
      const token = localStorage.getItem("access_token"); // Fetch JWT token from local storage
      const response = await fetch("http://127.0.0.1:5000/book-ride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include JWT token in Authorization header
        },
        body: JSON.stringify({
          rideId: id,
          bookedBy: localStorage.getItem("userId"),
          seatsBooked: number,
          status: "Booked",
          pickupLocation: pickupLocation,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to list ride: ${errorData.error}`);
        return;
      }
      closeModal(); // Close the modal after successful booking
      alert("Ride booked successfully!");
    } catch (error) {
      console.error("Error booking ride:", error);

      // Handle booking error, e.g., display a message
    }
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleDetails = (id: string) => {
    setSelectedId((prevId) => (prevId === id ? null : id));
  };

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

      setRides(data.reverse());
      console.log("DAta", data);
    } catch (error) {
      console.error("Error fetching available rides:", error);
      // Handle fetch error, e.g., display a message
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
        <div key={ride._id.$oid} className="RideCard">
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

          <button onClick={() => toggleDetails(ride._id.$oid)}>
            {selectedId === ride._id.$oid ? "Hide Details" : "Show Details"}
          </button>

          {selectedId === ride._id.$oid && (
            <div style={{ paddingLeft: "20px" }}>
              <p style={{ color: "black" }}>
                License Plate: {ride.carInfo?.licensePlate}
              </p>
              <p style={{ color: "black" }}>Make: {ride.carInfo?.make}</p>
              <p style={{ color: "black" }}>Model: {ride.carInfo?.model}</p>
              <p style={{ color: "black" }}>Type: {ride.carInfo?.type}</p>
            </div>
          )}

          <button
            className="JoinButton"
            // onClick={() => handleJoinRide(ride.id)}
            onClick={openModal}
          >
            Book Ride
          </button>
          <Modal isOpen={isModalOpen} onClose={closeModal}>
            <h2>Ride Booking</h2>
            <form onSubmit={(e) => handleSubmit(e, ride._id.$oid)}>
              <label htmlFor="numberInput">Enter number of people</label>
              <input
                type="number"
                id="numberInput"
                value={number}
                onChange={handleChange}
                min="1"
                max="6"
                required
              />
              <h1></h1>
              <label htmlFor="locationInput">Enter pickup location:</label>
              <input
                type="text"
                id="locationInput"
                value={pickupLocation}
                onChange={handleLocationChange}
                required
              />
              <button type="submit">Submit</button>
              <br />
              <br />
            </form>
          </Modal>
        </div>
      ))}
    </div>
  );
};

export default AvailableRidesPage;
