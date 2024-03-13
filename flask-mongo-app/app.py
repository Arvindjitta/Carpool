from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.json_util import dumps
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import json
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# MongoDB connection setup
client = MongoClient('mongodb+srv://rvindjitta11:eQgGxyrvB3ADmoA5@cluster0.g7egdoz.mongodb.net/CarpoolDB?retryWrites=true&w=majority')
db = client.CarpoolDB  # Using the 'CarpoolDB' database
users = db.users  # Accessing the 'users' collection
rides = db.rides  # Accessing the 'rides' collection

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
    user_data['password'] = bcrypt.generate_password_hash(user_data['password']).decode('utf-8')  # Using Flask-Bcrypt

    # Differentiating between rider and driver
    if user_data.get('userType') == 'driver' and not user_data.get('carInfo'):
        return jsonify({'error': 'Car information is required for drivers'}), 400

    # Insert the new user document into the MongoDB collection
    try:
        result = users.insert_one(user_data)
        return jsonify({'message': 'User registered successfully', 'userId': str(result.inserted_id)}), 201
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
        user = users.find_one({'email': login_details['email']})
        
        if user and bcrypt.check_password_hash(user['password'], login_details['password']):
            access_token = create_access_token(identity=login_details['email'])
            return jsonify(access_token=access_token, userType=user.get('userType', 'unknown')), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/list-ride', methods=['POST'])
@jwt_required()
def list_ride():
    current_user_email = get_jwt_identity()  # Get the email of the logged-in user
    ride_data = request.get_json()

    # Start by checking common required fields
    common_required_fields = ['startPoint', 'endPoint', 'date', 'time']
    if not all(field in ride_data for field in common_required_fields):
        return jsonify({'error': 'Missing required ride details'}), 400

    # Additional checks based on userType
    if ride_data.get('userType') == 'driver':
        # Check for driver-specific required fields
        driver_required_fields = ['seatsAvailable', 'carInfo']
        if not all(field in ride_data for field in driver_required_fields):
            return jsonify({'error': 'Missing required details for driver listing'}), 400
    elif ride_data.get('userType') == 'rider':
        # Check for rider-specific required fields
        if 'numberOfRiders' not in ride_data:
            return jsonify({'error': 'Number of riders is required for rider listing'}), 400
    else:
        # If userType is neither 'driver' nor 'rider', return an error
        return jsonify({'error': 'Invalid userType specified'}), 400

    # Append the current user's email to the ride_data for reference
    ride_data['listedBy'] = current_user_email

    try:
        # Insert the new ride document into the MongoDB collection
        result = rides.insert_one(ride_data)
        return jsonify({'message': 'Ride listed/scheduled successfully', 'rideId': str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500




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

