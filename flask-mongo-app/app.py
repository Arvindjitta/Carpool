from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.json_util import dumps
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import json
import re
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# MongoDB connection setup
client = MongoClient('mongodb+srv://rvindjitta11:eQgGxyrvB3ADmoA5@cluster0.g7egdoz.mongodb.net/CarpoolDB?retryWrites=true&w=majority')
db = client.CarpoolDB  # Using the 'CarpoolDB' database
users = db.users  # Accessing the 'users' collection
rides = db.rides  # Accessing the 'rides' collection
cars = db.car_info # Accessing the 'car_info' collection

app.config["JWT_SECRET_KEY"] = "your_jwt_secret_key"

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

#home
@app.route('/')
def welcome():
    return "Welcome to the Carpool Application!"

#register
@app.route('/register', methods=['POST'])
def register():
    user_data = request.get_json()

    # Basic validation checks
    if not user_data.get('email') or not re.match(r"[^@]+@[^@]+\.[^@]+", user_data['email']):
        return jsonify({'error': 'Invalid or missing email'}), 400
    if not user_data.get('password') or len(user_data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    if not user_data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    if users.find_one({'email': user_data['email']}):
        return jsonify({'error': 'Email already in use'}), 409

    # Hash the password
    user_data['password'] = bcrypt.generate_password_hash(user_data['password']).decode('utf-8')
    user_data['wallet_balance'] = 0.0  # Initialize wallet_balance to zero
    
    # Add createdAt timestamp
    user_data['createdAt'] = datetime.utcnow()

    # Initialize car_info to None for all users; will only be updated for drivers with carInfo
    car_info = None

    # Check if user is a driver and provided carInfo
    if user_data.get('userType') == 'driver':
        car_info = user_data.pop('carInfo', None)  # Extract and remove carInfo if present
        if not car_info:
            return jsonify({'error': 'Car information is required for drivers'}), 400
        # Validate carInfo contents if necessary, e.g., ensure licensePlate, make, model, type are present
        # Add createdAt timestamp to car_info
        car_info['createdAt'] = datetime.utcnow()

    try:
        # Insert the new user document into the users collection
        user_result = users.insert_one(user_data)
        user_id = user_result.inserted_id

        # If userType is 'driver' and carInfo was provided and extracted, insert it into the cars collection
        if car_info:
            car_info['userId'] = user_id  # Associate the car with the user by their ID
            cars.insert_one(car_info)

        return jsonify({'message': 'User registered successfully', 'userId': str(user_id)}), 201
    except Exception as e:
        # Roll back or handle user creation if car insertion fails, if necessary
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500


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
        user = users.find_one({'email': login_details['email']})
        
        if user and bcrypt.check_password_hash(user['password'], login_details['password']):
            access_token = create_access_token(identity=login_details['email'])
            return jsonify(access_token=access_token, userType=user.get('userType', 'unknown')), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#list/schedule ride 
@app.route('/list-ride', methods=['POST'])
@jwt_required()
def list_ride():
    current_user_email = get_jwt_identity()  # Get the email of the logged-in user
    ride_data = request.get_json()

    # Start by checking common required fields
    common_required_fields = ['startPoint', 'endPoint', 'date', 'time']
    if not all(field in ride_data for field in common_required_fields):
        return jsonify({'error': 'Missing required ride details'}), 400

    # Retrieve current user's details from the users collection
    current_user = users.find_one({"email": current_user_email})
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    # Check userType and required fields based on userType
    if current_user.get('userType') == 'driver':
        # Attempt to retrieve driver's car information
        car_info = cars.find_one({"userId": current_user["_id"]})
        if not car_info:
            return jsonify({'error': 'Car information not found for driver'}), 404
        # Include carInfo details in the ride_data, excluding the MongoDB '_id' field
        ride_data['carInfo'] = {k: v for k, v in car_info.items() if k != '_id'}
    elif current_user.get('userType') == 'rider':
        if 'numberOfRiders' not in ride_data:
            return jsonify({'error': 'Number of riders is required for rider listing'}), 400
    else:
        return jsonify({'error': 'Invalid userType specified'}), 400

    # Set the user who listed the ride
    ride_data['listedBy'] = current_user["_id"]
    ride_data['createdAt'] = datetime.utcnow()  # Add creation timestamp to the ride
    #status varchar [note: 'Can be "Open", "In-progress", "Completed", "Cancelled"']
    ride_data['status'] = "Open" 

    try:
        # Insert the new ride document into the rides collection
        result = rides.insert_one(ride_data)
        return jsonify({'message': 'Ride listed/scheduled successfully', 'rideId': str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

#wallet code
@app.route('/wallet', methods=['GET', 'POST'])
@jwt_required()
def manage_wallet():
    current_user_id = get_jwt_identity()
    
    if request.method == 'GET':
        # Fetch wallet balance
        user = users.find_one({"_id": current_user_id})
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"balance": user.get("walletBalance", 0)}), 200

    elif request.method == 'POST':
        # Add or withdraw funds based on the posted transaction type
        data = request.json
        amount = data.get("amount")
        transaction_type = data.get("type")  # "add" for adding funds, "withdraw" for withdrawing funds

        if not amount or amount <= 0:
            return jsonify({"error": "Amount must be a positive number"}), 400

        user = users.find_one({"_id": current_user_id})
        if not user:
            return jsonify({"error": "User not found"}), 404

        if transaction_type == "add":
            # Add funds to the user's wallet balance
            new_balance = user.get("walletBalance", 0) + amount
            users.update_one({"_id": current_user_id}, {"$set": {"walletBalance": new_balance}})
            transaction = {
                "userId": current_user_id,
                "amount": amount,
                "type": "credit",
                "date": datetime.utcnow(),
                "balanceAfter": new_balance
            }
            transactions.insert_one(transaction)

        elif transaction_type == "withdraw":
            if amount > user.get("walletBalance", 0):
                return jsonify({"error": "Insufficient funds"}), 400

            # Withdraw funds from the user's wallet balance
            new_balance = user.get("walletBalance", 0) - amount
            users.update_one({"_id": current_user_id}, {"$set": {"walletBalance": new_balance}})
            transaction = {
                "userId": current_user_id,
                "amount": amount,
                "type": "debit",
                "date": datetime.utcnow(),
                "balanceAfter": new_balance
            }
            transactions.insert_one(transaction)

        return jsonify({
            "message": "Transaction successful",
            "new_balance": new_balance,
            "transaction_type": transaction_type
        }), 200



# Get all users (Limit to 100 for performance)  
@app.route('/users', methods=['GET'])
def get_all_users():
    try:
        all_users_cursor = users.find({}, {'password': 0}).limit(100)  # Excluding password from the result
        all_users = list(all_users_cursor)
        return jsonify(json.loads(dumps(all_users))), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)

