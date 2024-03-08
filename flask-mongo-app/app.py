from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.json_util import dumps
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token
import json
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# MongoDB connection setup
client = MongoClient('mongodb+srv://rvindjitta11:eQgGxyrvB3ADmoA5@cluster0.g7egdoz.mongodb.net/CarpoolDB?retryWrites=true&w=majority')
db = client.CarpoolDB  # Using the 'CarpoolDB' database
users = db.users  # Accessing the 'users' collection

app.config["JWT_SECRET_KEY"] = "your_jwt_secret_key"

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.route('/')
def welcome():
    return "Welcome to the Carpool Application!"

@app.route('/insert-dummy-data', methods=['GET'])
def insert_dummy_data():
    try:
        # Define a list of dummy data to insert
        dummy_users = [
            {"name": "Alice", "email": "alice@example.com", "password": bcrypt.generate_password_hash("password1").decode('utf-8')},
            {"name": "Bob", "email": "bob@example.com", "password": bcrypt.generate_password_hash("password2").decode('utf-8')},
            {"name": "Charlie", "email": "charlie@example.com", "password": bcrypt.generate_password_hash("password3").decode('utf-8')}
        ]
        # Insert dummy data into the database
        result = users.insert_many(dummy_users)
        return jsonify({'message': f'{len(result.inserted_ids)} dummy users inserted.'}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/get-dummy-users', methods=['GET'])
def get_dummy_users():
    try:
        # Fetch all users (excluding passwords) from the database
        users_list = users.find({}, {'password': 0})
        return jsonify(json.loads(dumps(users_list))), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete-dummy-users', methods=['GET'])
def delete_dummy_users():
    try:
        # Assuming dummy users can be identified by an email pattern
        dummy_user_criteria = {"email": {"$regex": "example.com$"}}
        result = users.delete_many(dummy_user_criteria)
        return jsonify({'message': f'Dummy users deleted. Total documents deleted: {result.deleted_count}'}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Insert new user
# @app.route('/register', methods=['POST'])
# def register():
#     try:
#         user_data = request.get_json()
#         user_data['password'] = bcrypt.generate_password_hash(user_data['password']).decode('utf-8')  # Hashing the password
#         result = users.insert_one(user_data)
#         return jsonify({'message': 'User registered successfully', 'id': str(result.inserted_id)}), 201
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


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

@app.errorhandler(Exception)
def handle_exception(e):
    # Optionally, log the error here
    app.logger.error(f"Unhandled exception: {e}")

    # Return a JSON response with a 500 status code
    return jsonify({'error': 'A server error occurred'}), 500
    

# Login
@app.route('/login', methods=['POST'])
def login():
    try:
        login_details = request.get_json()
        user = users.find_one({'email': login_details['email']})
        
        if user and bcrypt.check_password_hash(user['password'], login_details['password']):
            access_token = create_access_token(identity=login_details['email'])
            return jsonify(access_token=access_token), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
