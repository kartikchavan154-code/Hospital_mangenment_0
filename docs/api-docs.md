# Hospital Management System — REST API Specifications

All endpoints use `http://localhost:4000/api` as their base URL and return JSON responses.

---

## 🔒 Authentication API

### 1. User Login
- **Endpoint**: `POST /auth/login`
- **Payload**:
  ```json
  {
    "email": "admin@hospital.com",
    "password": "admin123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": 1,
        "email": "admin@hospital.com",
        "role": "admin",
        "firstName": "System",
        "lastName": "Administrator"
      }
    }
  }
  ```

### 2. Verify Session
- **Endpoint**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "email": "admin@hospital.com",
        "role": "admin"
      }
    }
  }
  ```

---

## 🏥 Patients API

### 1. Retrieve Patients
- **Endpoint**: `GET /patients?page=1&limit=10&search=<query>`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "dateOfBirth": "1985-03-15",
        "gender": "male",
        "bloodGroup": "A+",
        "user": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@hospital.com"
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

### 2. Register Patient
- **Endpoint**: `POST /patients`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "email": "new.patient@hospital.com",
    "firstName": "Alice",
    "lastName": "Smith",
    "phone": "555-9090",
    "dateOfBirth": "1992-05-14",
    "gender": "female",
    "bloodGroup": "B+",
    "allergies": "None"
  }
  ```

---

## 📅 Appointments API

### 1. Book Appointment Slot
- **Endpoint**: `POST /appointments`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**:
  ```json
  {
    "patientId": 1,
    "doctorId": 1,
    "appointmentDate": "2026-07-20",
    "appointmentTime": "10:30:00",
    "type": "consultation",
    "reason": "Chest pain follow-up"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Appointment booked.",
    "data": {
      "id": 4,
      "patientId": 1,
      "doctorId": 1,
      "appointmentDate": "2026-07-20",
      "appointmentTime": "10:30:00",
      "status": "scheduled"
    }
  }
  ```

### 2. Get Available Doctor Slots
- **Endpoint**: `GET /appointments/available-slots?doctorId=1&date=2026-07-20`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "date": "2026-07-20",
      "doctorId": "1",
      "availableSlots": [
        "09:00:00",
        "09:30:00",
        "10:00:00",
        "11:00:00"
      ]
    }
  }
  ```

---

## 💳 Billing & Invoices API

### 1. Generate Invoice
- **Endpoint**: `POST /bills`
- **Payload**:
  ```json
  {
    "patientId": 1,
    "items": [
      { "name": "Consultation", "quantity": 1, "rate": 150, "amount": 150 },
      { "name": "Blood test", "quantity": 1, "rate": 50, "amount": 50 }
    ],
    "tax": 10,
    "discount": 5,
    "dueDate": "2026-08-01"
  }
  ```

### 2. Download Invoice PDF
- **Endpoint**: `GET /bills/:id/download`
- **Response**: Triggers an attachment download of a binary PDF format file `invoice-<invoiceNumber>.pdf`.

---

## 🧠 Machine Learning API (Proxy Gateway)

### 1. Appointment Waiting-Time Forecast
- **Endpoint**: `POST /ml/predict/wait-time`
- **Payload**:
  ```json
  {
    "doctorId": 1,
    "dayOfWeek": 3,
    "hour": 10,
    "activeAppointments": 4
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "predictedWaitTime": 18,
      "confidence": 0.85,
      "unit": "minutes"
    }
  }
  ```

### 2. Symptoms Diagnosis Risk Predictions
- **Endpoint**: `POST /ml/predict/disease-risk`
- **Payload**:
  ```json
  {
    "symptoms": "chest pain, shortness of breath",
    "age": 45,
    "gender": "male"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "risks": [
        { "disease": "Hypertension / Cardiovascular Disease", "probability": 0.65, "severity": "high" }
      ]
    }
  }
  ```
