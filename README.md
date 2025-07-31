# Cardio Guard: AI Powered Cardiovascular Disease (CVD) Risk Prediction System

## Overview

Cardio Guard is a full-stack clinical decision support system designed to predict cardiovascular disease (CVD) risk using machine learning. It supports both patients and doctors with secure role-based access, offers intelligent AI-powered chatbot support using Groq LLM, and provides batch prediction for efficient clinical workflows.

The system’s backend is built with **FastAPI** and **SQLAlchemy**, employing a trained ML model for risk prediction. The frontend is a modern **React.js** application with Tailwind CSS styling.

Model training and evaluation are available in a dedicated Google Colab notebook, ensuring transparency and reproducibility.

## Key Features

- **Single Patient CVD Risk Prediction:** Patients submit health metrics and receive instant AI-driven CVD risk scores.
- **Batch Prediction for Doctors:** Doctors upload CSV files of multiple patients for bulk risk analysis.
- **Role-Based Authentication:** JWT-secured login with differentiated access for patients and doctors.
- **Medical Chatbot:** AI chatbot powered by **Groq LLM** to answer cardiovascular health queries in natural language.
- **Transparent Model Training:** Complete data preprocessing, model building and export in Google Colab notebook.
- **Analytics:** Doctors receive visualized reports and statistics for uploaded batches.
- **Secure Database Access:** Backend uses **SQLAlchemy ORM** with asynchronous session management for database operations.

## Project Structure

```
cvd-risk-project/
├── backend/
│   ├── main.py                       # FastAPI app entry point
│   ├── requirements.txt              # Backend Python dependencies
│   ├── models/                      # Trained ML models & preprocessing scalers
│   │   ├── final_logreg_model_7features.joblib
│   │   └── scaler_7features.joblib
│   ├── api/                         # API route modules: auth, predict, batch, chat etc.
│   ├── core/                        # Configuration, security (JWT), and model loading utils
│   ├── db/                          # SQLAlchemy models, CRUD operations, migrations
│   ├── utils/                       # Chatbot logic with Groq LLM integration
│   └── ...                         # Additional backend modules and utilities
├── frontend/
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # React components (forms, chatbot, dashboard)
│   │   ├── api/                    # REST API client setup for backend communication
│   │   ├── auth/                   # Authentication context and hooks
│   │   ├── pages/                  # Route pages (login, dashboard, batch upload, etc.)
│   │   ├── styles/                 # Tailwind CSS and custom styles
│   │   └── App.js                  # Root React component
│   ├── package.json                # Frontend dependencies and scripts
│   └── ...                       # Other frontend-specific config files
├── model-training/
│   └── CVD_Risk_Prediction.ipynb   # Jupyter/Colab notebook for data prep, training, and export
├── .gitignore
└── README.md                      # This file
```

## Frontend Summary

- Developed using **React.js** with functional components and hooks.
- Responsive design leveraging **Tailwind CSS**.
- Features:
  - Authentication flows with JWT token handling.
  - Patient interface to enter health metrics and receive risk predictions.
  - Doctor dashboard with batch CSV upload and analytics visualization.
  - Interactive chatbot UI connected to backend Groq LLM service.
- API communication is handled securely through Axios with token authentication.

## Backend Summary

- Built on **FastAPI**, supporting asynchronous HTTP endpoints.
- Database interaction via **SQLAlchemy ORM** with async sessions, handling user & prediction data.
- Main functionalities:
  - **Authentication:** JWT token-based login and registration with role-based access.
  - **Prediction:** Single patient and batch prediction endpoints utilizing pre-trained ML model.
  - **Chatbot:** Chat service integration with Groq LLM for AI-powered health query answering.
- Includes input validation via Pydantic models.
- Logging and rate limiting with SlowAPI middleware.
- Health endpoints monitor database, model, and chatbot statuses.

## Model Training

- Training notebook resides in `model-training/CVD_Risk_Prediction.ipynb`.
- Utilizes:
  - **pandas** for data manipulation.
  - **scikit-learn** for feature scaling, model training (Logistic Regression or similar), and evaluation.
- Training steps:
  - Data cleaning and preprocessing.
  - Feature selection with clinical relevance.
  - Model training and hyperparameter tuning.
  - Metrics calculation (accuracy, recall, ROC-AUC).
  - Export model and scaler (`.joblib`) for server inference.
- Exported models placed into `backend/models/` to be loaded on API startup.

## Environment Setup Instructions

### Backend Setup

```bash
cd backend
python -m venv .venv
# Activate venv
# Windows:
.\\.venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
```

- Create a `.env` file in the backend folder including:

```
SECRET_KEY=your_secure_jwt_secret_key
HUGGINGFACEHUB_API_TOKEN=your_huggingface_token_if_used
GROQ_API_KEY=your_groq_llm_api_key
DATABASE_URL=your_database_connection_string
```

- Run backend server:

```bash
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## API Endpoints Overview

- `POST /auth/register` – Register new user (patient or doctor).
- `POST /auth/login` – Login, returns JWT token.
- `GET /auth/me` – Get current logged-in user details.
- `POST /predict` – Predict CVD risk for single patient (JWT required).
- `POST /doctor/batch_predict` – Batch risk prediction for multiple patients (Doctor only).
- `POST /chat` – Interact with AI chatbot powered by Groq LLM (JWT required).
- `GET /health` – Health status of service components.

## Dataset

- Uses **Framingham Heart Study Dataset** or equivalent clinical data.
- Key features: age, sex, cigarettes per day, total cholesterol, systolic BP, diastolic BP, glucose.
- Dataset is preprocessed and scaled before model training.
- Dataset source and preprocessing details are documented in the model training notebook.

## Tech Stack Summary

| Component         | Technologies                              |
|-------------------|------------------------------------------|
| Frontend          | React.js, Tailwind CSS                    |
| Backend           | FastAPI, Pydantic, SQLAlchemy             |
| Database          | MySQL (via SQLAlchemy ORM)   |
| ML Model          | scikit-learn (Logistic Regression etc.)  |
| Chatbot           | Groq LLM (Large Language Model)           |
| Authentication    | JWT (PyJWT)                               |
| Model Training    | Google Colab, pandas, scikit-learn        |

## Security and Privacy

- All sensitive endpoints require JWT-authenticated requests.
- Role-based authorization for patients and doctors.
- Backend enforces rate limits to prevent abuse.
- Health data is securely stored in relational DB managed via SQLAlchemy.
- It is recommended to run backend over HTTPS in production.
- No personal data logging or sharing beyond system scope.

## License & Clinical Disclaimer

This project is licensed under the **MIT License**.

> **Clinical Disclaimer:**  
> - This software is intended solely for educational, research, and operational support purposes.  
> - It does **not provide medical advice, diagnosis, or treatment**.  
> - Predictions and chatbot responses serve informative roles only and should never replace professional healthcare judgment.  
> - Using this system **does not establish any doctor-patient relationship**.  
> - Always consult licensed medical professionals before making any clinical decisions.  
> - The authors disclaim any liability for medical outcomes arising from its use.

## Acknowledgements

- [scikit-learn](https://scikit-learn.org/)  
- [FastAPI](https://fastapi.tiangolo.com/)  
- [React.js](https://reactjs.org/)  
- [Groq AI LLM](https://groq.com)  
- [Framingham Heart Study Dataset](https://www.kaggle.com/datasets/amanajmera1/framingham-heart-study-dataset)  
- [Google Colab](https://colab.research.google.com/)





