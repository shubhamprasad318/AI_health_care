from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_pymongo import PyMongo  # Using MongoDB instead of MySQL
import pandas as pd
import numpy as np
import pickle
import csv
from collections import Counter
import warnings
from sklearn.ensemble import RandomForestClassifier
from flask_bcrypt import Bcrypt 
from flask_mail import Mail, Message
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# ------------------ Email Configuration ------------------ #
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'zerowood70@gmail.com'
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'yourpassword')  # Use env variable for email password
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True

bcrypt = Bcrypt(app)
CORS(app)
mail = Mail(app)

# ------------------ File Upload Configuration ------------------ #
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.secret_key = "helloAI"

# ------------------ MongoDB Configuration ------------------ #
# If your MONGO_URI does not include a database name, you can set one via MONGO_DBNAME.
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/helloai")
app.config["MONGO_DBNAME"] = os.environ.get("MONGO_DBNAME", "helloai")
mongo = PyMongo(app)

# Helper function to get the correct DB object
def get_db():
    # If mongo.db is not set because the URI lacks a database name,
    # use mongo.cx to get the database using MONGO_DBNAME.
    return mongo.db if mongo.db is not None else mongo.cx[app.config["MONGO_DBNAME"]]

# ------------------ Suppress Warnings ------------------ #
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

# ------------------ Load Machine Learning Models and Data ------------------ #
with open('./models/svm_model.pkl', 'rb') as a:
    svm_model = pickle.load(a)

with open('./models/nb_model.pkl', 'rb') as b:
    nb_model = pickle.load(b)

with open('./models/rf_model.pkl', 'rb') as c:
    rf_model = pickle.load(c)

with open('./models/data_dict.pkl', 'rb') as d:
    data_dict = pickle.load(d)

with open('./models/Doctor_Specialist_Model.pkl', 'rb') as f:
    specialization = pickle.load(f)


# ------------------ Routes ------------------ #

# Login Endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    print(f"Login attempt for: {email}")

    db = get_db()
    # Find the user document in the "store" collection by email
    user = db.store.find_one({"email": email})
    print("User from DB:", user)

    # Check if user exists and verify password
    if user and bcrypt.check_password_hash(user["password"], password):
        print("Login successful")
        session['email'] = email
        return jsonify({"success": True, "message": "Login successful"})
    else:
        print("Login failed")
        return jsonify({"logged_in": False, "message": "Login failed. Please check your email and password."})


# Signup Endpoint
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    print("Signup data received:", data)

    first_name = data.get('first_name')
    last_name = data.get('last_name')
    name = f"{first_name} {last_name}"
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone_number')
    age = data.get('age')
    gender = data.get('gender')
    city = data.get('city')
    state = data.get('state')
    address = f"{city} {state}"

    # Hash the password (decode to store as a string)
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    print("Hashed Password:", hashed_password)

    # Create the user document
    user_data = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "gender": gender,
        "age": age,
        "phone": phone,
        "address": address
    }

    db = get_db()
    # Insert into the "store" collection
    db.store.insert_one(user_data)
    return jsonify({"success": True, "message": "Registration successful"})


# Contact Us Endpoint
@app.route('/contact', methods=['GET', 'POST'])
def contact():
    data = request.json

    # Extract form data
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    details = data.get('details')

    # Create the email message
    msg = Message(
        subject=f'Contact Form Submission from {name}',
        sender='zerowood70@gmail.com',
        recipients=[email]  # Change to desired recipient or list of recipients
    )
    msg.body = f"""
    Name: {name}
    Email: {email}
    Phone: {phone}
    Details: {details}
    """

    try:
        mail.send(msg)
        response = {
            "status": "success",
            "message": "Message sent successfully!"
        }
        return jsonify(response), 200
    except Exception as e:
        response = {
            "status": "error",
            "message": str(e)
        }
        return jsonify(response), 500


# Disease Prediction Endpoint
@app.route('/diseasepredict', methods=['GET', 'POST'])
def predictDisease():
    symptoms = request.get_json()
    # Extract the symptom values from the JSON payload
    symptom_list = [symptoms[key]["value"] for key in symptoms]
    symptom_list = [str(symptom).strip() for symptom in symptom_list]
    print("Received Symptoms:", symptom_list)

    # Initialize input data as an array of zeros for the model
    input_data = [0] * len(data_dict["symptom_index"])

    # Set positions for each reported symptom
    for symptom in symptom_list:
        if symptom:
            index = data_dict["symptom_index"].get(symptom, -1)
            if index != -1:
                input_data[index] = 1

    input_data = np.array(input_data).reshape(1, -1)

    if sum(input_data[0]) == 0:
        print("Error: No valid symptoms provided.")

    # ---- PATCH: Fix for missing attribute in DecisionTreeClassifier ----
    for estimator in rf_model.estimators_:
        if not hasattr(estimator, 'monotonic_cst'):
            estimator.monotonic_cst = None
    # -----------------------------------------------------------------------

    # Make predictions using each model
    rf_prediction = data_dict["predictions_classes"][rf_model.predict(input_data)[0]]
    nb_prediction = data_dict["predictions_classes"][nb_model.predict(input_data)[0]]
    svm_prediction = data_dict["predictions_classes"][svm_model.predict(input_data)[0]]
    print("RF Prediction:", rf_prediction)
    print("NB Prediction:", nb_prediction)
    print("SVM Prediction:", svm_prediction)

    # Define a mode function using Counter
    def mode(arr):
        counter = Counter(arr)
        max_count = max(counter.values())
        mode_values = [k for k, v in counter.items() if v == max_count]
        return mode_values[0]

    final_prediction = mode([svm_prediction, rf_prediction, nb_prediction])
    print("Final Prediction:", final_prediction)

    predictions = {
        "rf_model_prediction": rf_prediction,
        "nb_model_prediction": nb_prediction,
        "svm_model_prediction": svm_prediction,
        "final_prediction": final_prediction
    }
    print("All Predictions:", predictions)

    # Retrieve disease description from CSV file
    disease_descriptions = {}
    with open('../back_end/models/symptom_Description.csv', 'r', newline='') as csvfile:
        reader = csv.reader(csvfile)
        next(reader)  # Skip header row
        for row in reader:
            disease_name, description = row
            disease_descriptions[disease_name] = description

    description = disease_descriptions.get(predictions['final_prediction'], "Description not found.")
    print("Disease Description:", description)

    # Retrieve precautions from CSV file
    disease_precautions = {}
    with open('../back_end/models/symptom_precaution.csv', 'r', newline='') as csvfile:
        reader = csv.reader(csvfile)
        next(reader)  # Skip header row
        for row in reader:
            disease, precaution_1, precaution_2, precaution_3, precaution_4 = row
            disease_precautions[disease] = [precaution_1, precaution_2, precaution_3, precaution_4]

    precautions = disease_precautions.get(predictions['final_prediction'], ["Precautions not found."])
    print("Precautions:", precautions)
    prediction = predictions['final_prediction']

    # Recommend a doctor specialization based on the prediction
    if prediction in specialization:
        specialize = specialization[prediction]
        print(f"For {prediction}, recommend consulting a {specialize}.")
    else:
        specialize = "No specific recommendation"
        print(f"No specific recommendation found for {prediction}.")

    response = {
        "prediction": prediction,
        "description": description,
        "precautions": precautions,
        "specialize": specialize,
    }
    return jsonify(response)


# Profile Retrieval Endpoint
@app.route('/profile', methods=['GET', 'POST'])
def profile():
    user = request.get_json()
    print("Profile request data:", user)
    email = user.get('email')
    print("Email for profile:", email)

    db = get_db()
    # Find the user document by email
    user_data = db.store.find_one({"email": email})
    print("User data from DB:", user_data)

    if user_data:
        user_details = {
            'name': user_data.get("name"),
            'email': user_data.get("email"),
            'gender': user_data.get("gender"),
            'age': user_data.get("age"),
            'phone': user_data.get("phone"),
            'address': user_data.get("address")
        }
        return jsonify(user_details)
    else:
        return jsonify({'error': 'User not found'}), 404
    

# Appointment Booking Endpoint
@app.route('/appoint', methods=['POST'])
def appoint():
    try:
        data = request.json
        
        # Extract appointment details
        patient_name = data.get('name')
        patient_email = data.get('email')
        appointment_date = data.get('date')
        appointment_time = data.get('time')
        doctor_name = data.get('doctorName')
        doctor_specialization = data.get('doctorSpecialization')
        doctor_city = data.get('doctorCity')
        doctor_location = data.get('doctorLocation')
        
        print(f"Appointment Details: {data}")

        # Send confirmation email to the patient
        msg = Message(
            subject="Appointment Confirmation",
            sender="zerowood70@gmail.com",
            recipients=[patient_email],
            body=f"Dear {patient_name},\n\nYour appointment with {doctor_name}, {doctor_specialization}, "
                 f"on {appointment_date} at {appointment_time} in {doctor_city}, {doctor_location} has been "
                 f"successfully booked.\n\nBest regards,\nYour AI-HealthEngine Team"
        )
        mail.send(msg)

        response = {
            "success": True,
            "message": "Appointment booked successfully!"
        }
        return jsonify(response), 200
    
    except Exception as e:
        print(f"An error occurred: {e}")
        response = {
            "success": False,
            "message": "Failed to book the appointment."
        }
        return jsonify(response), 500
    

# File Upload Endpoint
@app.route("/upload", methods=["POST", "GET"])    
def upload():
    try:
        # Check if a file is part of the request
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['file']

        # Check if the filename is not empty
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Save the file to the uploads folder
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        return jsonify({'message': 'File uploaded successfully', 'file_path': file_path}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ------------------ Main ------------------ #

if __name__ == '__main__':
    app.run()
