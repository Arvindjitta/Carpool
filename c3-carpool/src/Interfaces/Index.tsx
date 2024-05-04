// Interfaces.ts
export interface CarInfo {
  licensePlate: string;
  make: string;
  model: string;
  type: string;
}

export interface Ride {
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
  arrivalTime: "";
  departureTime: "";
  duration: "";
  listedBy: {
    $oid: string;
  };
}
