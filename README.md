# **AI Health Care**

## **Project Overview**

The **AI Health Care** project is a health application designed to predict diseases based on symptoms. Using machine learning models like **Random Forest**, **Naive Bayes**, and **SVM**, the app identifies potential diseases and offers recommendations. It also integrates a real-time chatbot to assist users, provides a doctor recommendation system, and features a responsive frontend built with **React.js**. The backend is built with **Flask** and connects to a **MySQL database/ Mongodb** for managing medical records.

## **Features**

* **Disease Prediction**: Predicts diseases based on user-provided symptoms using machine learning models.  
* **Doctor Recommendation System**: Recommends doctors based on the predicted disease.  
* **Real-Time Chatbot**: A chatbot powered by AI to assist users with basic medical queries.  
* **Medical Record Management**: MySQL database/Mongodb integration to store and retrieve patient records.  
* **Responsive Frontend**: User-friendly interface built using React.js that works across devices.

## **Technologies Used**

* **Frontend**: React.js, CSS, HTML, JavaScript  
* **Backend**: Python, Flask  
* **Machine Learning**: Scikit-learn (Random Forest, Naive Bayes, SVM)  
* **Database**: MySQL,Mongodb  
* **Chatbot**: AI-powered chatbot using predefined responses and Natural Language Processing  
* **Other Libraries**: Flask-MySQLdb, Flask-SocketIO

## **Installation**

### **Backend Setup**

Clone the repository:  
`git clone https://github.com/shubhamprasad318/AI_Health_Care.git`  
`cd AI_Health_Care`

1. Install required Python packages:  
   `pip install -r requirements.txt`  
2. Set up the MySQL database by running the provided SQL script (`database_setup.sql`).  
3. Run the Flask app:  
   `python -m flask run`

### **Frontend Setup**

Navigate to the frontend directory: `cd frontend`

1. Install the required Node.js packages:  
   `npm install`  
2. Start the development server:  
   `npm run dev`  
3. Open the browser and go to `http://localhost:3000` to view the application.

## **Usage**

1. Open the application on your browser.  
2. Enter symptoms into the system for disease prediction.  
3. The system will predict potential diseases and suggest a doctor.  
4. Use the chatbot for additional queries related to health.
