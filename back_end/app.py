from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_mysqldb import MySQL
import pandas as pd
import numpy as np
import pickle
import csv
from scipy.stats import mode
import warnings
from sklearn.ensemble import RandomForestClassifier
from collections import Counter
from flask_bcrypt import Bcrypt 
from flask_mail import Mail, Message
from collections import Counter
import os



app = Flask(__name__)

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'zerowood70@gmail.com'
app.config['MAIL_PASSWORD'] = 'yourpassword'
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True



bcrypt = Bcrypt(app) 
CORS(app) 
mail = Mail(app)

# Ensure the 'uploads' directory exists
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.secret_key = "helloAI"


app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'helloAI'
 
mysql = MySQL(app)

#removing warnings

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)


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


#This is a Login Page
@app.route('/login', methods=['POST'])
def login():

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    print(email,password)

    cursor = mysql.connection.cursor()
    cursor.execute('SELECT * FROM store WHERE email = %s', (email,))
    user = cursor.fetchone()
    cursor.close()

    print(user)

    if user and bcrypt.check_password_hash(user[2], password):  # Assuming that password is the third column in the users table
        print("Login")
        session['email'] = email
        return jsonify({"success": True, "message": "Login successful"})

    else:
        print("error")
        return jsonify(logged_in=False, message='Login failed. Please check your email and password.')
 

#This is SignUp Form
@app.route('/signup', methods=['POST'])
def signup():

    data = request.get_json()
    
    print(data)

    first_name = data.get('first_name')
    last_name = data.get('last_name')
    #store both in one
    name = f"{first_name} {last_name}"
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone_number')
    age = data.get('age')
    gender = data.get('gender')
    #store both in one
    city = data.get('city')
    state = data.get('state')
    address = f"{city} {state}"


    hashed_password = bcrypt.generate_password_hash(password)
    bcrypt_pwd = bcrypt.check_password_hash(hashed_password,password)
#    is_valid = bcrypt.check_password_hash 
#    (hashed_password, password) 

    print(hashed_password)
    print(bcrypt_pwd)



    print(data)
    cursor = mysql.connection.cursor()
    cursor.execute("INSERT INTO store VALUES (%s,%s,%s,%s,%s,%s,%s)",(name,email,hashed_password,gender,age,phone,address))
    cursor.connection.commit()
    cursor.close()

    return jsonify({"success": True, "message": "Registration successful"})


#This is for Contact Us form
@app.route('/contact', methods = ['GET','POST'])
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
        recipients=[{email}]  # Your recipient email address
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


#Route for disease prediction...
@app.route('/diseasepredict', methods = ['GET','POST'])
def predictDisease():

    symptoms = request.get_json()
    # symptom_list = [symptoms[key]["value"] for key in symptoms]
    # symptom_list = [str(symptom).strip() for symptom in symptom_list]
    symptom_list = [symptoms[key]["value"] for key in symptoms]
    symptom_list = [str(symptom).strip() for symptom in symptom_list]
    print("Received Symptoms:", symptom_list)

    # Initialize input data as an array of zeros
    input_data = [0] * len(data_dict["symptom_index"])

    # Update the input vector based on input symptoms
    for symptom in symptom_list:
        if symptom:
            index = data_dict["symptom_index"].get(symptom, -1)
            if index != -1:
                input_data[index] = 1

    # print("Updated input data after processing symptoms:", input_data)  # Debugging line

    input_data = np.array(input_data).reshape(1, -1)

    # Check if the input data is all zeros
    if sum(input_data[0]) == 0:
        print("Error: No valid symptoms provided.")
    # print("Input Data for Prediction:", input_data)

    # Make predictions with the models
    rf_prediction = data_dict["predictions_classes"][rf_model.predict(input_data)[0]]
    nb_prediction = data_dict["predictions_classes"][nb_model.predict(input_data)[0]]
    svm_prediction = data_dict["predictions_classes"][svm_model.predict(input_data)[0]]
    print("RF Prediction:", rf_prediction, "NB Prediction:", nb_prediction, "SVM Prediction:", svm_prediction)

    # Define mode function
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

    print("Final Predictions:", predictions)

    # # Get the symptoms from the request JSON payload
    # symptoms = request.json
    # symptom_list = [str(symptoms.get('symptom1', "")), str(symptoms.get('symptom2', "")), str(symptoms.get('symptom3', ""))]
    # # symptom_list = [str(symptoms["symptom1"]), str(symptoms["symptom2"]), str(symptoms["symptom3"])]
    # print(symptom_list)

    # # Initialize input data as an array of zeros
    # input_data = [0] * len(data_dict["symptom_index"])

    # for symptom in symptom_list:
    #     index = data_dict["symptom_index"].get(symptom, -1)
    #     print(index)
    #     if index != -1:
    #         input_data[index] = 1

    # print("Updated input data after processing symptoms:", input_data)  # Debugging line

    # input_data = np.array(input_data).reshape(1, -1)


    # if sum(input_data[0]) == 0:
    #     print("error")

    # print(input_data)
    # rf_prediction = data_dict["predictions_classes"][rf_model.predict(input_data)[0]]
    # nb_prediction = data_dict["predictions_classes"][nb_model.predict(input_data)[0]]
    # svm_prediction = data_dict["predictions_classes"][svm_model.predict(input_data)[0]]
    # print(rf_prediction,svm_prediction,nb_prediction)
 

    # # final_prediction = mode([ nb_prediction, svm_prediction], axis=0, keepdims=True, nan_policy='omit')[0][0]
    # def mode(arr):
    #     counter = Counter(arr)
    #     max_count = max(counter.values())
    #     mode_values = [k for k, v in counter.items() if v == max_count]
    #     return mode_values[0]

    # final_prediction = mode([ svm_prediction,rf_prediction,nb_prediction])
 
    # print(final_prediction)

    
    # print(f'Final Prediction: {final_prediction}')
    # predictions = {
    #     "rf_model_prediction": rf_prediction,
    #     "nb_model_prediction": nb_prediction,
    #     "svm_model_prediction": svm_prediction,
    #     "final_prediction": final_prediction
    # }

    # # session['predicted_disease'] = predictions['final_prediction']
    # print(predictions['final_prediction'])

    
    # # return jsonify({"prediction": predictions['final_prediction']})
    disease_descriptions = {}
    with open('../back_end/models/symptom_Description.csv', 'r', newline='') as csvfile:
        reader = csv.reader(csvfile)
        next(reader)  # Skip the header row
        for row in reader:
            disease_name, description = row
            disease_descriptions[disease_name] = description

    description = disease_descriptions.get(predictions['final_prediction'], "Description not found.")
    print(description)

    # Retrieve the precautions for the predicted disease
    disease_precautions = {}
    with open('../back_end/models/symptom_precaution.csv', 'r', newline='') as csvfile:
        reader = csv.reader(csvfile)
        next(reader)  # Skip the header row
        for row in reader:
            disease, precaution_1, precaution_2, precaution_3, precaution_4 = row
            disease_precautions[disease] = [precaution_1, precaution_2, precaution_3, precaution_4]

    precautions = disease_precautions.get(predictions['final_prediction'], ["Precautions not found."])
    print(precautions)
    prediction = predictions['final_prediction']

    #Recommend a doctor related to their disease
    if prediction in specialization:
        specialize = specialization[prediction]
        print (f"For {prediction}, recommend consulting a {specialization[prediction]}.")
    else:
        print (f"No specific recommendation found for {prediction}.")

    #precaution is changed
    response = {
        "prediction": prediction,
        "description": description,
        "precautions": precautions,
        "specialize":specialize,
    }

    return jsonify(response)    


#Route for profile prediction...
@app.route('/profile', methods = ['GET','POST'])
def profile():

    user = request.get_json()
    print(user)
    email = user.get('email')
    print(email)
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT * FROM store WHERE email = %s', (email,))
    user_data = cursor.fetchone()
    print(user_data)
    cursor.close()

    if user_data:
        user_details = {
            'name': user_data[0],
            'email': user_data[1],
            'gender': user_data[3],
            'age': user_data[4],
            'phone': user_data[5],
            'address': user_data[6]
        }
        return jsonify(user_details)
    else:
        return jsonify({'error': 'User not found'}), 404
    

#Route for profile prediction...
@app.route('/appoint', methods=['POST'])
def appoint():
    try:
        data = request.json
        
        # Extract details from the data
        patient_name = data.get('name')
        patient_email = data.get('email')
        appointment_date = data.get('date')
        appointment_time = data.get('time')
        doctor_name = data.get('doctorName')
        doctor_specialization = data.get('doctorSpecialization')
        doctor_city = data.get('doctorCity')
        doctor_location = data.get('doctorLocation')
        
        # Here you can add code to save the appointment details to a database
        # For now, we'll just print the data to the console
        print(f"Appointment Details: {data}")

        # Send confirmation email
        msg = Message(
            subject="Appointment Confirmation",
            sender="zerowood70@gmail.com",
            recipients=[patient_email],
            body=f"Dear {patient_name},\n\nYour appointment with {doctor_name}, {doctor_specialization}, "
                 f"on {appointment_date} at {appointment_time} in {doctor_city}, {doctor_location} has been "
                 f"successfully booked.\n\nBest regards,\nYour AI-HealthEngine Team"
        )
        mail.send(msg)

        # Simulate saving the data and sending a success response
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
    
@app.route("/upload",methods = ["POST","GET"])    
def upload():

    try:
        # Check if the request contains a file
        if 'file' not in request.files:
            # 400 Bad Request: The client did not send a file
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['file']

        # If the user does not select a file, the browser submits an empty file without a filename
        if file.filename == '':
            # 400 Bad Request: The client did not select a file
            return jsonify({'error': 'No selected file'}), 400

        # Save the file to the 'uploads' folder
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        # 200 OK: File uploaded successfully
        return jsonify({'message': 'File uploaded successfully', 'file_path': file_path}), 200
    except Exception as e:
        # 500 Internal Server Error: Something went wrong on the server
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run()