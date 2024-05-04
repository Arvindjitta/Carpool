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
  const userType = localStorage.getItem("userType");
  const currentUserId = localStorage.getItem("userId");
  const openModal = (id: string) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedId(null); // Optionally clear the selected ride ID on modal close
  };

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("rideId:", selectedId);
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch("http://127.0.0.1:5000/book-ride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rideId: selectedId,
          bookedBy: currentUserId,
          seatsBooked: number,
          status: "Booked",
          pickupLocation,
          departureTime: rides.find((ride) => ride._id.$oid === selectedId)
            ?.departureTime,
          date: rides.find((ride) => ride._id.$oid === selectedId)?.date,
        }),
      });

      if (response.ok) {
        closeModal();
        alert("Ride booked successfully!");
      } else {
        const errorData = await response.json();
        alert(`Booking failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error booking ride:", error);
      alert("Booking failed due to an error.");
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
      if (userType === "driver") {
        data = data.filter((ride) => ride.listedBy.$oid === currentUserId);
        console.log("userId", currentUserId);
      } else {
        data = data.filter((ride) => ride.userType !== currentUserType);
      }

      console.log("RIDE", rides);
      setRides(data.reverse());
      console.log("DAta", data);
    } catch (error) {
      console.error("Error fetching available rides:", error);
      // Handle fetch error, e.g., display a message
    }
  };

  function formatDate(inputDate: any) {
    // Parse the input date string
    const inputDateFormat = new Date(inputDate);

    // Adjust the date by adding the timezone offset
    const adjustedDate = new Date(
      inputDateFormat.getTime() + inputDateFormat.getTimezoneOffset() * 60000
    );

    // Extract year, month, and day components
    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, "0"); // Adding 1 to month since getMonth() returns zero-based month
    const day = String(adjustedDate.getDate()).padStart(2, "0");

    // Format the date as MM-DD-YYYY
    const formattedDate = `${month}-${day}-${year}`;

    return formattedDate;
  }

  // Example usage:
  const inputDate = "2024-05-03";
  const formattedDate = formatDate(inputDate);
  console.log(formattedDate); // Output: '05-03-2024'

  const to12HourFormat = (time: string): string => {
    const [hour, minute] = time.split(":").map(Number); // Convert the hour and minute parts to numbers
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="AvailableRides">
      <h1>{userType === "driver" ? "My Rides" : "Available Rides"}</h1>

      {rides.map((ride) => (
        <div key={ride._id.$oid} className="RideCard">
          <div className="TimeAndDestination">
            <div>
              {ride.startPoint} -----to----- {ride.endPoint}
            </div>
            <div>
              <div className="time">
                {formatDate(ride.date)} -- <b>D:</b>{" "}
                {to12HourFormat(ride.departureTime)}
                {/* {ride.arrivalTime} */}
              </div>
              <div className="time"></div>
            </div>
          </div>

          <div className="TimeAndDestination">
            <div>
              {ride.userType === "rider"
                ? `Riders: ${ride.numberOfRiders}`
                : `Seats Available: ${ride.seatsAvailable}`}
              <div style={{ paddingTop: 10 }}>
                <b>{ride.duration} min </b>
              </div>
            </div>

            <div className="Price">
              {ride.userType === "rider"
                ? `${ride.pricePerSeat ? ride.pricePerSeat : "--"}$ /per person`
                : `${ride.pricePerSeat}$ /per person`}
            </div>
          </div>
          {userType === "rider" && (
            <button onClick={() => toggleDetails(ride._id.$oid)}>
              {selectedId === ride._id.$oid ? "Hide Details" : "Show Details"}
            </button>
          )}

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
          {userType === "rider" && (
            <button
              className="JoinButton"
              // onClick={() => handleJoinRide(ride.id)}
              onClick={() => openModal(ride._id.$oid)}
            >
              Book Ride
            </button>
          )}
          <Modal isOpen={isModalOpen} onClose={closeModal}>
            <h2>Ride Booking</h2>
            <form onSubmit={(e) => handleSubmit(e)}>
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
