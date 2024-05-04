from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.json_util import dumps
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import json
import re
from flask_cors import CORS
from datetime import datetime
from flask_jwt_extended import decode_token
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
from bson import ObjectId

# MongoDB connection setup
client = MongoClient('mongodb+srv://rvindjitta11:eQgGxyrvB3ADmoA5@cluster0.g7egdoz.mongodb.net/CarpoolDB?retryWrites=true&w=majority')
db = client.CarpoolDB  # Using the 'CarpoolDB' database
riders = db.riders
drivers= db.drivers
admins= db.admin 
transactions=db.transactions
bookings=db.bookings
rides = db.rides  # Accessing the 'rides' collection
# cars = db.car_info # Accessing the 'car_info' collection

app.config["JWT_SECRET_KEY"] = "your_jwt_secret_key"

# Collections for different user types
collections = {
    'driver': drivers,
    'rider': riders,
    'admin': admins,
}

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

#used to generate HASHED_PASSWORD_LATER
# password = "admin123"
# hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

# print(hashed_password)

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

#home
@app.route('/')
def welcome():
    return "Welcome to the Carpool Application!"


#This function handles the registration process when a POST request is made to the '/register' endpoint.
@app.route('/register', methods=['POST'])
def register():
    user_data = request.get_json()

    required_fields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'address', 'city', 'state', 'zipCode']
    if any(field not in user_data or not user_data[field] for field in required_fields):
        return jsonify({'error': 'All fields must be filled'}), 400
    if user_data['password'] != user_data['confirmPassword']:
        return jsonify({'error': 'Passwords do not match'}), 400
    if not re.match(r"[^@]+@[^@]+\.[^@]+", user_data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    if len(user_data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    user_data['password'] = bcrypt.generate_password_hash(user_data['password']).decode('utf-8')
    del user_data['confirmPassword']
    user_data['wallet_balance'] = 0.0
    user_data['createdAt'] = datetime.utcnow()

    userType = user_data.get('userType')
    if userType == 'driver':
        driver_fields = ['ssn']
        if any(field not in user_data or not user_data[field] for field in driver_fields):
            return jsonify({'error': 'All driver specific fields must be filled'}), 400
        if 'carInfo' not in user_data:
            return jsonify({'error': 'Car information is required for drivers'}), 400
        if db.drivers.find_one({'email': user_data['email']}):
            return jsonify({'error': 'Email already in use'}), 409
        result = drivers.insert_one(user_data)
    elif userType == 'rider':
        rider_fields = ['dateOfBirth']
        if any(field not in user_data or not user_data[field] for field in rider_fields):
            return jsonify({'error': 'All rider specific fields must be filled'}), 400
        if db.riders.find_one({'email': user_data['email']}):
            return jsonify({'error': 'Email already in use'}), 409
        result = riders.insert_one(user_data)
    else:
        return jsonify({'error': 'Invalid user type'}), 400

    userId = result.inserted_id
    return jsonify({'message': 'User registered successfully', 'userId': str(userId)}), 201

    user_data = request.get_json()

    # Basic validation checks
    if not user_data.get('email') or not re.match(r"[^@]+@[^@]+\.[^@]+", user_data['email']):
        return jsonify({'error': 'Invalid or missing email'}), 400
    if not user_data.get('password') or len(user_data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    if not user_data.get('name'):
        return jsonify({'error': 'Name is required'}), 400

    # Hash the password and initialize default values
    user_data['password'] = bcrypt.generate_password_hash(user_data['password']).decode('utf-8')
    user_data['wallet_balance'] = 0.0
    user_data['createdAt'] = datetime.utcnow()

    userType = user_data.get('userType')

    if userType == 'driver':
        # Include carInfo directly in driver data
        if 'carInfo' not in user_data:
            return jsonify({'error': 'Car information is required for drivers'}), 400

        # Check if the email is already in use in the drivers collection
        if db.drivers.find_one({'email': user_data['email']}):
            return jsonify({'error': 'Email already in use'}), 409

        # Insert the driver with carInfo
        result = drivers.insert_one(user_data)
        userId = result.inserted_id

    elif userType == 'rider':
        # Check if the email is already in use in the riders collection
        if db.riders.find_one({'email': user_data['email']}):
            return jsonify({'error': 'Email already in use'}), 409

        # Insert the rider
        result = riders.insert_one(user_data)
        userId = result.inserted_id

    else:
        return jsonify({'error': 'Invalid user type'}), 400

    return jsonify({'message': 'User registered successfully', 'userId': str(userId)}), 201


#GET the specific Ride-details with the ride_id
@app.route('/ride-details/<ride_id>', methods=['GET'])
def ride_details(ride_id):
    try:
        # Convert the ride_id to an ObjectId for querying MongoDB
        ride_id_obj = ObjectId(ride_id)
        ride = rides.find_one({'_id': ride_id_obj})

        if not ride:
            return jsonify({'error': 'Ride not found'}), 404
        
        # Convert the MongoDB document to a JSON string
        ride_json = dumps(ride)
        return ride_json, 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


#error handler
@app.errorhandler(Exception)
def handle_exception(e):
    # Optionally, log the error here
    app.logger.error(f"Unhandled exception: {e}")

    # Return a JSON response with a 500 status code
    return jsonify({'error': 'A server error occurred'}), 500
    

#Login
@app.route('/login', methods=['POST'])
def login():
    try:
        login_details = request.get_json()

        for user_type, user_collection in collections.items():
            user = user_collection.find_one({'email': login_details['email']})
            if user and bcrypt.check_password_hash(user['password'], login_details['password']):
                access_token = create_access_token(identity=login_details['email'])
                print("USER ID",str(user['_id']))
                return jsonify(access_token=access_token, userType=user_type, userId=str(user['_id'])), 200
        
        # If no user is found in any collection, or password is incorrect
        return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# To schedule the ride by Driver
@app.route('/list-ride', methods=['POST'])
@jwt_required()  # This decorator ensures that this endpoint requires authentication
def list_ride():
    current_user_email = get_jwt_identity()  # Extracts the identity from the token
    ride_data = request.get_json()

    # Start by checking common required fields
    common_required_fields = ['startPoint', 'endPoint', 'date', 'arrivalTime', 'departureTime', 'duration', 'seatsAvailable', 'pricePerSeat']
    if not all(field in ride_data for field in common_required_fields):
        return jsonify({'error': 'Missing required ride details'}), 400

    # Retrieve current user's details from the users collection
    current_user = drivers.find_one({"email": current_user_email})
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    # Check userType and required fields based on userType
    if current_user.get('userType') == 'driver':
        # Attempt to retrieve driver's car information
        ride_data['carInfo'] = current_user["carInfo"]
    
    elif current_user.get('userType') == 'rider':
        if 'numberOfRiders' not in ride_data:
            return jsonify({'error': 'Number of riders is required for rider listing'}), 400
    else:
        return jsonify({'error': 'Invalid userType specified'}), 400

    # Set the user who listed the ride
    ride_data['listedBy'] = current_user["_id"]
    ride_data['createdAt'] = datetime.utcnow()  # Add creation timestamp to the ride
    # Status varchar [note: 'Can be "Open", "In-progress", "Completed", "Cancelled"']
    ride_data['status'] = "Open" 

    try:
        # Insert the new ride document into the rides collection
        result = rides.insert_one(ride_data)
        return jsonify({'message': 'Ride listed/scheduled successfully', 'rideId': str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# #To schedule the ride by Driver
# @app.route('/list-ride', methods=['POST'])
# @jwt_required()  # This decorator ensures that this endpoint requires authentication
# def list_ride():
#     current_user_email = get_jwt_identity()  # Extracts the identity from the token
#     ride_data = request.get_json()

#     # Start by checking common required fields
#     common_required_fields = ['startPoint', 'endPoint', 'date', 'time']
#     if not all(field in ride_data for field in common_required_fields):
#         return jsonify({'error': 'Missing required ride details'}), 400

#     # Retrieve current user's details from the users collection
#     current_user = drivers.find_one({"email": current_user_email})
#     if not current_user:
#         return jsonify({"error": "User not found"}), 404

#     # Check userType and required fields based on userType
#     if current_user.get('userType') == 'driver':
#         # Attempt to retrieve driver's car information
#         ride_data['carInfo'] = current_user["carInfo"]
    
#     elif current_user.get('userType') == 'rider':
#         if 'numberOfRiders' not in ride_data:
#             return jsonify({'error': 'Number of riders is required for rider listing'}), 400
#     else:
#         return jsonify({'error': 'Invalid userType specified'}), 400

#     # Set the user who listed the ride
#     ride_data['listedBy'] = current_user["_id"]
#     ride_data['createdAt'] = datetime.utcnow()  # Add creation timestamp to the ride
#     #status varchar [note: 'Can be "Open", "In-progress", "Completed", "Cancelled"']
#     ride_data['status'] = "Open" 

#     try:
#         # Insert the new ride document into the rides collection
#         result = rides.insert_one(ride_data)
#         return jsonify({'message': 'Ride listed/scheduled successfully', 'rideId': str(result.inserted_id)}), 201
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500


@app.route('/admin-details', methods=['GET'])
@jwt_required()  # Require authentication to ensure data security
def get_admin_details():
    try:
        # Fetch the admin document, assuming there's only one admin
        admin_info = admins.find_one({}, {'_id': 0, 'commissionEarned': 1})  # Excluding the MongoDB ID, include only commissionEarned
        
        if not admin_info:
            return jsonify({"error": "Admin details not found"}), 404

        # Return the admin details, focusing on commissionEarned
        return jsonify(admin_info), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# @app.route('/book-ride', methods=['POST'])
# @jwt_required()  # Ensure authentication is required
# def book_ride():
#     try:
#         # Get booking data from the request
#         booking_data = request.get_json()
        
#         # Check if all required fields are present
#         required_fields = ['rideId', 'bookedBy', 'seatsBooked', 'status', 'pickupLocation', 'departureTime', 'date']
#         if not all(field in booking_data for field in required_fields):
#             return jsonify({'error': 'Missing required booking details'}), 400

#         # Check if the user has any active bookings
#         current_user_email = get_jwt_identity()  # Get the email from the JWT token

#           # Retrieve user ID using the email
#         user_document = riders.find_one({"email": current_user_email})
#         if not user_document:
#             return jsonify({'error': 'User not found'}), 404
#         current_user_id = user_document['_id']

#        # Check if the user has any active bookings
#         active_booking_count = bookings.count_documents({
#             'bookedBy': str(current_user_id),
#             'status': {"$in": ["Booked", "In-progress"]}  # Assuming these are the statuses for active bookings
#         })
#         print("Active", current_user_id, active_booking_count)
        
        
#         if active_booking_count > 0:
#             return jsonify({'error': 'You have an active booking. Please cancel it before booking a new ride.'}), 403

#         # Generate timestamp for created_At
#         booking_data['created_At'] =  datetime.utcnow()

#         # Store the booking data in the bookings collection
#         booking_id = bookings.insert_one(booking_data).inserted_id
        
#         return jsonify({'message': 'Ride booked successfully', 'bookingId': str(booking_id)}), 201
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500


@app.route('/book-ride', methods=['POST'])
@jwt_required()  # Ensure authentication is required
def book_ride():
    try:
        # Get booking data from the request
        booking_data = request.get_json()
        
        # Check if all required fields are present
        required_fields = ['rideId', 'bookedBy', 'seatsBooked', 'status', 'pickupLocation', 'departureTime', 'date']
        if not all(field in booking_data for field in required_fields):
            return jsonify({'error': 'Missing required booking details'}), 400

        # Retrieve the ride details
        ride_id = booking_data['rideId']
        ride = rides.find_one({"_id": ObjectId(ride_id)})
        if not ride:
            return jsonify({'error': 'Ride not found'}), 404

        # Check if seats are available
        seats_available = int(ride.get('seatsAvailable', 0))
        seats_booked = int(booking_data.get('seatsBooked', 0))
        if seats_booked > seats_available:
            return jsonify({'error': 'Not enough seats available'}), 400

        # Check if the user has any active bookings
        current_user_email = get_jwt_identity()  # Get the email from the JWT token
        user_document = riders.find_one({"email": current_user_email})
        if not user_document:
            return jsonify({'error': 'User not found'}), 404
        current_user_id = user_document['_id']
        active_booking_count = bookings.count_documents({
            'bookedBy': str(current_user_id),
            'status': {"$in": ["Booked", "In-progress"]}  # Assuming these are the statuses for active bookings
        })
        if active_booking_count > 0:
            return jsonify({'error': 'You have an active booking. Please cancel it before booking a new ride.'}), 403

        # Store the booking data in the bookings collection
        booking_data['created_At'] =  datetime.utcnow()
        booking_id = bookings.insert_one(booking_data).inserted_id
        
        # Update seatsAvailable in the ride collection
        new_seats_available = seats_available - seats_booked
        rides.update_one({"_id": ObjectId(ride_id)}, {"$set": {"seatsAvailable": new_seats_available}})
        
        return jsonify({'message': 'Ride booked successfully', 'bookingId': str(booking_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500



#booked rides -rider
@app.route('/rider/booked-rides', methods=['GET'])
@jwt_required()
def rider_booked_rides():
    current_user_email = get_jwt_identity()
    try:
        # Retrieve rider details to get the rider's ID
        rider = riders.find_one({"email": current_user_email})
        if not rider:
            return jsonify({"error": "Rider not found"}), 404

        # Find all bookings made by the rider
        bookings_cursor = bookings.find({"bookedBy": str(rider['_id'])})
        booked_rides = list(bookings_cursor)
        return jsonify(json.loads(dumps(booked_rides))), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch booked rides", "details": str(e)}), 500

# #booked rides -driver
# @app.route('/driver/scheduled-bookings', methods=['GET'])
# @jwt_required()
# def driver_scheduled_bookings():
#     current_user_email = get_jwt_identity()
#     print("Current User Email:", current_user_email)
#     try:
#         # Retrieve driver details to get the driver's ID
#         driver = drivers.find_one({"email": current_user_email})
#         if not driver:
#             return jsonify({"error": "Driver not found"}), 404
       
#         driver_id_obj = ObjectId(driver['_id']) 
#         print("Driver ID:", driver_id_obj) 
#         # Find all rides listed by the driver
#         rides_cursor = rides.find({"listedBy": driver_id_obj})
#         rides_list = list(rides_cursor)
#         print(rides_cursor)

#         # For each ride, find related bookings
#         scheduled_bookings = []
#         for ride in rides_list:
#             ride_bookings = bookings.find({"rideId": str(ride['_id'])})
#             for booking in ride_bookings:
#                 scheduled_bookings.append(booking)

#         return jsonify(json.loads(dumps(scheduled_bookings))), 200
#     except Exception as e:
#         return jsonify({"error": "Failed to fetch scheduled bookings", "details": str(e)}), 500

@app.route('/driver/scheduled-bookings', methods=['GET'])
@jwt_required()
def driver_scheduled_bookings():
    current_user_email = get_jwt_identity()
    user_id = request.args.get('userId')  # Get userId from query parameters
    print("Current User Email:", current_user_email)
    try:
        # Retrieve driver details to get the driver's ID
        driver = drivers.find_one({"email": current_user_email})
        if not driver:
            return jsonify({"error": "Driver not found"}), 404

        driver_id_obj = ObjectId(driver['_id'])
        print("Driver ID:", driver_id_obj)
        # Find all rides listed by the driver or the user
        if user_id:
            rides_cursor = rides.find({"listedBy": ObjectId(user_id)})
        else:
            rides_cursor = rides.find({"listedBy": driver_id_obj})
        rides_list = list(rides_cursor)
        print(rides_cursor)

        # For each ride, find related bookings
        scheduled_bookings = []
        for ride in rides_list:
            ride_bookings = bookings.find({"rideId": str(ride['_id'])})
            for booking in ride_bookings:
                scheduled_bookings.append(booking)

        return jsonify(json.loads(dumps(scheduled_bookings))), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch scheduled bookings", "details": str(e)}), 500


#cancel booking
@app.route('/cancel-booking/<booking_id>', methods=['POST'])
@jwt_required()
def cancel_booking(booking_id):
    try:
        booking_id_obj = ObjectId(booking_id)  # Convert string to ObjectId
        current_user_id = get_jwt_identity()

        print("Booking ID:", booking_id)
        print("User ID:", current_user_id)

        # Retrieve booking information
        booking = bookings.find_one({"_id": booking_id_obj})
        if not booking:
            return jsonify({"error": "Booking not found or user unauthorized to cancel this booking"}), 404

        # Get ride ID and seats booked from the booking
        ride_id = booking.get("rideId")
        seats_booked = booking.get("seatsBooked")

        # Increment seats available in the ride collection
        ride = rides.find_one({"_id": ObjectId(ride_id)})
        if not ride:
            return jsonify({"error": "Ride not found"}), 404

        current_seats_available = ride.get("seatsAvailable", 0)
        new_seats_available = current_seats_available + seats_booked

        # Update seatsAvailable in the ride collection
        rides.update_one({"_id": ObjectId(ride_id)}, {"$set": {"seatsAvailable": new_seats_available}})

        # Update booking status to "Cancelled"
        result = bookings.update_one(
            {"_id": booking_id_obj},
            {"$set": {"status": "Cancelled"}}
        )

        if result.modified_count == 0:
            return jsonify({"error": "Failed to cancel booking"}), 500

        return jsonify({"message": "Booking cancelled successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#update/add car-info 
@app.route('/update-car', methods=['POST'])
@jwt_required()
def update_car():
    current_user_id = get_jwt_identity()  # Assuming JWT identity is set to userId
    car_data = request.get_json()

    # Assuming each driver can have multiple cars, identify which car to update
    # This could be managed by requiring a carId in the request for updates
    car_id = car_data.get('carId')

    if car_id:
        # Update existing car information
        try:
            result = cars.update_one({'carId': car_id, 'userId': current_user_id}, {'$set': car_data})
            if result.modified_count == 0:
                return jsonify({'message': 'No changes made or car not found'}), 404
            return jsonify({'message': 'Car information updated successfully'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        # Add new car information for the user
        car_data['userId'] = current_user_id
        try:
            cars.insert_one(car_data)
            return jsonify({'message': 'Car information added successfully'}), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

#available-rides
@app.route('/available-rides', methods=['GET'])
@jwt_required(optional=True)
def available_rides():
    try:
        # Find rides with status 'Open', directly including embedded 'carInfo'
        rides_cursor = rides.find({"status": "Open"})
        
        # Convert cursor to list of dicts and then to JSON string
        rides_list = list(rides_cursor)
        rides_json = dumps(rides_list)
        
        return rides_json, 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch available rides", "details": str(e)}), 500



#Ride-completion
@app.route('/complete-ride', methods=['POST'])
def complete_ride():
    ride_id = request.args.get('ride_id')
    fare = float(request.args.get('fare'))
    riderId = request.args.get('riderId')

    try:
        # Retrieve the ride from the database
        ride = rides.find_one({'_id': ObjectId(ride_id)})
        if not ride:
            return jsonify({'error': 'Ride not found'}), 404

        # Check if the ride has already been completed
        if ride['status'] == 'Completed':
            return jsonify({'error': 'Ride is already completed'}), 400

        rider_id = ObjectId(riderId)
        driver_id = ride['listedBy']
        admin_commission = fare * 0.10  # 10% commission
        driver_payment = fare - admin_commission

        print("Fare",fare,)
        # Update the wallets of the rider and driver
        riders.update_one(
            {'_id': rider_id},
            {'$inc': {'walletBalance': -fare}}
        )
        drivers.update_one(
            {'_id': ObjectId(driver_id)},
            {'$inc': {'walletBalance': driver_payment}}
        )

        # Update the admin's commission earnings
        admins.update_one(
            {},  # Assuming there is one admin document
            {'$inc': {'commissionEarned': admin_commission}}
        )

        # Update the ride status to 'Completed'
        rides.update_one(
            {'_id': ObjectId(ride_id)},
            {'$set': {'status': 'Completed'}}
        )

        # Update all associated bookings to 'Completed'
        bookings.update_many(
            {'rideId': ride_id},
            {'$set': {'status': 'Completed'}}
        )

        # Record the transaction
        transactions.insert_one({
            'payerId': rider_id,
            'payeeId': driver_id,
            'amount': fare,
            'commission': admin_commission,
            'status': 'Completed',
            'created_At': datetime.utcnow()
        })

        return jsonify({'message': 'Ride and associated bookings completed successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# #wallet code
# @app.route('/wallet', methods=['GET', 'POST'])
# @jwt_required()
# def manage_wallet():
#     current_user_id = get_jwt_identity()
    
#     if request.method == 'GET':
#         # Fetch wallet balance
#         user = users.find_one({"_id": current_user_id})
#         if not user:
#             return jsonify({"error": "User not found"}), 404
#         return jsonify({"balance": user.get("walletBalance", 0)}), 200

#     elif request.method == 'POST':
#         # Add or withdraw funds based on the posted transaction type
#         data = request.json
#         amount = data.get("amount")
#         transaction_type = data.get("type")  # "add" for adding funds, "withdraw" for withdrawing funds

#         if not amount or amount <= 0:
#             return jsonify({"error": "Amount must be a positive number"}), 400

#         user = users.find_one({"_id": current_user_id})
#         if not user:
#             return jsonify({"error": "User not found"}), 404

#         if transaction_type == "add":
#             # Add funds to the user's wallet balance
#             new_balance = user.get("walletBalance", 0) + amount
#             users.update_one({"_id": current_user_id}, {"$set": {"walletBalance": new_balance}})
#             transaction = {
#                 "userId": current_user_id,
#                 "amount": amount,
#                 "type": "credit",
#                 "date": datetime.utcnow(),
#                 "balanceAfter": new_balance
#             }
#             transactions.insert_one(transaction)

#         elif transaction_type == "withdraw":
#             if amount > user.get("walletBalance", 0):
#                 return jsonify({"error": "Insufficient funds"}), 400

#             # Withdraw funds from the user's wallet balance
#             new_balance = user.get("walletBalance", 0) - amount
#             users.update_one({"_id": current_user_id}, {"$set": {"walletBalance": new_balance}})
#             transaction = {
#                 "userId": current_user_id,
#                 "amount": amount,
#                 "type": "debit",
#                 "date": datetime.utcnow(),
#                 "balanceAfter": new_balance
#             }
#             transactions.insert_one(transaction)

#         return jsonify({
#             "message": "Transaction successful",
#             "new_balance": new_balance,
#             "transaction_type": transaction_type
#         }), 200

@app.route('/wallet', methods=['GET'])
@jwt_required()
def get_wallet_balance():
    current_user_email = get_jwt_identity()
    user_info = None

    # Retrieve the user type and details from the appropriate collection
    for user_type, collection in collections.items():
        user_info = collection.find_one({"email": current_user_email})
        if user_info:
            break

    if not user_info:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"balance": user_info.get("walletBalance", 0), "userType": user_type}), 200


@app.route('/wallet', methods=['POST'])
@jwt_required()
def update_wallet_balance():
    current_user_email = get_jwt_identity()
    transaction_data = request.get_json()
    amount = float(transaction_data.get("amount", 0))
    transaction_type = transaction_data.get("type")

    print("Amount", amount)
    print("transaction_type" ,transaction_data.get("type"))


    if not amount or amount <= 0:
        return jsonify({"error": "Amount must be a positive number"}), 400

    user_info = None
    user_collection = None

    # Find the user's collection and document based on email and user type
    for user_type, collection in collections.items():
        user_info = collection.find_one({"email": current_user_email})
        if user_info:
            user_collection = collection
            break

    if not user_info:
        return jsonify({"error": "User not found"}), 404

    # Perform the transaction
    if transaction_type == "add":
        new_balance = user_info.get("walletBalance", 0) + amount
    elif transaction_type == "withdraw":
        if amount > user_info.get("walletBalance", 0):
            return jsonify({"error": "Insufficient funds"}), 400
        new_balance = user_info.get("walletBalance", 0) - amount
    else:
        return jsonify({"error": "Invalid transaction type"}), 400

    # Update the user's wallet balance in the appropriate collection
    user_collection.update_one({"_id": user_info["_id"]}, {"$set": {"walletBalance": new_balance}})

    # Log the transaction
    transaction = {
        "userId": str(user_info["_id"]),
        "amount": amount,
        "type": transaction_type,
        "date": datetime.utcnow(),
        "balanceAfter": new_balance
    }
    transactions.insert_one(transaction)

    return jsonify({"message": "Transaction successful", "new_balance": new_balance}), 200

#delete user
@app.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        # Convert user_id to a BSON ObjectId for MongoDB
        bson_user_id = ObjectId(user_id)

        # Attempt to delete the user from the riders collection
        riders_result = riders.delete_one({'_id': bson_user_id})
        # Attempt to delete the user from the drivers collection
        drivers_result = drivers.delete_one({'_id': bson_user_id})

        # Check if the user was found and deleted in any of the collections
        if riders_result.deleted_count + drivers_result.deleted_count > 0:
            return jsonify({'success': True, 'message': 'User deleted successfully'}), 200
        else:
            return jsonify({'error': 'User not found'}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/users', methods=['GET'])
def get_all_users():
    try:
        # Fetch data from the riders collection
        riders_cursor = riders.find({}, {'password': 0}).limit(100)  # Excluding password from the result
        rider_list = list(riders_cursor)

        # Fetch data from the drivers collection
        drivers_cursor = drivers.find({}, {'password': 0}).limit(100)  # Excluding password from the result
        driver_list = list(drivers_cursor)

        # Combine the two lists
        combined_users = rider_list + driver_list
        
        # Send combined data as JSON
        return jsonify(json.loads(dumps(combined_users))), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rides', methods=['GET'])
@jwt_required(optional=True)
def get_all_rides():
    try:
        # Find all rides in the database, not filtering by any specific status
        rides_cursor = rides.find()

        # Convert cursor to list of dicts and then to JSON string
        rides_list = list(rides_cursor)
        rides_json = dumps(rides_list)
        
        return rides_json, 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch rides", "details": str(e)}), 500

#delete ride ID
@app.route('/rides/<ride_id>', methods=['DELETE'])
@jwt_required(optional=True)
def delete_ride(ride_id):
    try:
        # Convert ride_id to a BSON ObjectId for MongoDB
        bson_ride_id = ObjectId(ride_id)

        # Attempt to delete the ride from the rides collection
        result = rides.delete_one({'_id': bson_ride_id})

        # Check if the ride was found and deleted
        if result.deleted_count > 0:
            return jsonify({'success': True, 'message': 'Ride deleted successfully'}), 200
        else:
            return jsonify({'error': 'Ride not found'}), 404

    except Exception as e:
        # Handle the case where the ObjectId conversion fails
        if isinstance(e, bson.errors.InvalidId):
            return jsonify({'error': 'Invalid ride ID format'}), 400
        return jsonify({"error": "Failed to delete ride", "details": str(e)}), 500

@app.route('/transactions', methods=['GET'])
@jwt_required(optional=True)
def get_transactions():
    try:
        # Fetch transactions data, excluding potentially sensitive fields
        cursor = transactions.find({})  # Exclude MongoDB's default _id field
        transaction_list = list(cursor)
        # Convert the list of MongoDB objects to JSON
        return jsonify(json.loads(dumps(transaction_list))), 200
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return jsonify({"error": "Unable to fetch transactions"}), 500

if __name__ == '__main__':
    app.run(debug=True)

