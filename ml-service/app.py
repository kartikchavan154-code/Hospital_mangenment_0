import os
import random
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Dummy/fallback predictors in case models aren't trained
def predict_wait_time_dummy(doctor_id, day_of_week, hour, active_appointments):
    # Base wait time depends on doctor_id (just to make it dynamic) and active appointments
    base = 10 + (int(doctor_id) % 3) * 5
    # Add time for active appointments (say 10 mins per appointment)
    wait_time = base + active_appointments * 12
    # Adjust for hour of day (rush hours)
    if 11 <= hour <= 13 or 15 <= hour <= 17:
        wait_time += 8
    # Random fluctuation
    wait_time += random.randint(-3, 5)
    return max(5, wait_time)

def predict_disease_risk_dummy(symptoms):
    # Map symptoms to common diseases
    symptom_list = [s.strip().lower() for s in symptoms.split(',')]
    
    risks = []
    
    # Simple rule based checks
    has_fever = any(s in symptom_list for s in ['fever', 'high temperature', 'chills'])
    has_cough = any(s in symptom_list for s in ['cough', 'cold', 'sore throat', 'runny nose'])
    has_chest_pain = any(s in symptom_list for s in ['chest pain', 'breathlessness', 'shortness of breath'])
    has_headache = any(s in symptom_list for s in ['headache', 'migraine', 'dizziness'])
    has_joint_pain = any(s in symptom_list for s in ['joint pain', 'stiffness', 'back pain'])
    has_fatigue = any(s in symptom_list for s in ['fatigue', 'weakness', 'thirst', 'frequent urination'])

    if has_chest_pain:
        risks.append({"disease": "Hypertension / Cardiovascular Disease", "probability": 0.65, "severity": "high"})
    if has_fever and has_cough:
        risks.append({"disease": "Upper Respiratory Infection / Flu", "probability": 0.80, "severity": "low"})
    if has_headache and not has_fever:
        risks.append({"disease": "Tension Headache / Migraine", "probability": 0.70, "severity": "low"})
    if has_joint_pain:
        risks.append({"disease": "Osteoarthritis / Muscle Strain", "probability": 0.55, "severity": "moderate"})
    if has_fatigue:
        risks.append({"disease": "Type 2 Diabetes / Vitamin Deficiency", "probability": 0.45, "severity": "moderate"})
        
    # Default fallbacks if no symptoms match specifically
    if not risks:
        risks.append({"disease": "General Fatigue / Stress", "probability": 0.30, "severity": "low"})
        risks.append({"disease": "Seasonal Allergies", "probability": 0.20, "severity": "low"})
        
    return risks

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "Hospital Management System ML Service"})

@app.route('/predict/wait-time', methods=['POST'])
def predict_wait_time():
    try:
        data = request.get_json() or {}
        doctor_id = data.get('doctorId', 1)
        day_of_week = data.get('dayOfWeek', 1) # 1 = Monday, etc.
        hour = data.get('hour', 10) # 24hr format
        active_appointments = data.get('activeAppointments', 2)
        
        # In a real setup, we would try to load a trained sklearn model:
        # model = joblib.load('models/wait_time_model.pkl')
        # prediction = model.predict([[doctor_id, day_of_week, hour, active_appointments]])[0]
        
        wait_time = predict_wait_time_dummy(doctor_id, day_of_week, hour, active_appointments)
        
        return jsonify({
            "predictedWaitTime": int(wait_time),
            "confidence": 0.85,
            "unit": "minutes"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/predict/disease-risk', methods=['POST'])
def predict_disease_risk():
    try:
        data = request.get_json() or {}
        symptoms = data.get('symptoms', '')
        age = data.get('age', 35)
        gender = data.get('gender', 'male')
        
        # In a real setup, we would load the trained classifier:
        # model = joblib.load('models/disease_risk_model.pkl')
        # prediction = model.predict_proba([[age, gender_encoded, symptom_features...]])
        
        risks = predict_disease_risk_dummy(symptoms)
        
        return jsonify({
            "risks": risks,
            "age": age,
            "gender": gender
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"ML Service running on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
