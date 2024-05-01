import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Booking {
  _id: {
    $oid: string;
  };
  rideId: string;
  bookedBy: string;
  seatsBooked: number;
  status: string;
  pickupLocation: string;
  created_At: string;
}

const BookedRidesPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const userType = localStorage.getItem("userType") as string;

  useEffect(() => {
    fetchBookings();
  }, []);

  //fetch all the bookings
  const fetchBookings = async () => {
    try {
      const userType = localStorage.getItem("userType") as string;
      const token = localStorage.getItem("access_token") as string;
      const url =
        userType === "rider"
          ? "/rider/booked-rides"
          : "/driver/scheduled-bookings";

      const response = await fetch(`http://127.0.0.1:5000${url}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }
      const data: Booking[] = await response.json();
      // Sort bookings by created_At in descending order to show the latest bookings first
      let reversed_data = data.reverse();
      setBookings(reversed_data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const token = localStorage.getItem("access_token") as string;
      const response = await fetch(
        `http://127.0.0.1:5000/cancel-booking/${bookingId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to cancel booking");
      }
      const result = await response.json();
      alert(result.message);
      setBookings((prev) =>
        prev.filter((booking) => booking._id.$oid !== bookingId)
      ); // Remove the cancelled booking from state
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking");
    }
  };

  //completion of ride
  const completeRide = async (
    rideId: string,
    riderId: string,
    seatsBooked: number
  ) => {
    setLoading(true);

    try {
      // Fetch ride details to get the pricePerSeat
      const rideDetails = await fetchRideDetails(rideId);
      const fare = rideDetails.pricePerSeat * seatsBooked; //multiplied with the booked tickets
      console.log("rideDetails.pricePerSeat", rideDetails.pricePerSeat);
      console.log("ride_id, fare, ridrId", rideId, fare, riderId);
      const url = `http://127.0.0.1:5000/complete-ride?ride_id=${encodeURIComponent(
        rideId
      )}&fare=${encodeURIComponent(fare)}&riderId=${encodeURIComponent(
        riderId
      )}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (response.ok) {
        alert("Ride completed successfully!");
        // Update bookings to reflect the completed status
        setBookings((prev) =>
          prev.map((booking) =>
            booking.rideId === rideId
              ? { ...booking, status: "Completed" }
              : booking
          )
        );
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error completing ride:", error);
      alert("Failed to complete ride");
    } finally {
      setLoading(false);
    }
  };

  //get the ride details
  async function fetchRideDetails(rideId: string): Promise<any> {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/ride-details/${rideId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch ride details");
      }
      const rideDetails = await response.json();
      return rideDetails;
    } catch (error) {
      console.error("Error:", error);
      throw error; // Rethrow to handle it in the caller function
    }
  }

  return (
    <div className="AvailableRides">
      <h1>
        {localStorage.getItem("userType") === "rider"
          ? "My Booked Rides"
          : "Scheduled Bookings"}
      </h1>
      {bookings.map((booking) => (
        <div key={booking._id.$oid} className="RideCard">
          <div className="TimeAndDestination">
            <div>Pickup Location: {booking.pickupLocation}</div>
          </div>
          <div className="DriverInfo">
            <div>Status: {booking.status}</div>
            <div>Seats Booked: {booking.seatsBooked}</div>
          </div>
          <div>
            <strong>Date:</strong>{" "}
            {new Date(booking.created_At).toLocaleDateString()}
          </div>
          {booking.status !== "Cancelled" && booking.status !== "Completed" && (
            <button
              className="CancelButton"
              onClick={() => cancelBooking(booking._id.$oid)}
            >
              Cancel Booking
            </button>
          )}
          {userType === "rider" &&
            (booking.status === "Booked" ||
              booking.status === "In-progress") && (
              <button
                onClick={() =>
                  completeRide(
                    booking.rideId,
                    booking.bookedBy,
                    booking.seatsBooked
                  )
                }
                disabled={loading}
              >
                {loading ? "Processing..." : "Complete Ride"}
              </button>
            )}
        </div>
      ))}
    </div>
  );
};

export default BookedRidesPage;
