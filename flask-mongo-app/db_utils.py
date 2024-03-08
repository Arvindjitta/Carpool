from flask_bcrypt import generate_password_hash
from pymongo.errors import BulkWriteError

def insert_mock_users(mongo):
    users = [
        {"name": "John Doe", "email": "john@example.com", "password": "password123"},
        {"name": "Jane Doe", "email": "jane@example.com", "password": "password456"},
    ]

    for user in users:
        user['password'] = generate_password_hash(user['password']).decode('utf-8')

    try:
        result = mongo.db.users.insert_many(users, ordered=False)
        print(f"Inserted {len(result.inserted_ids)} users.")
    except BulkWriteError as e:
        print(e.details)
