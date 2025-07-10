

\# Cardiovascular Disease (CVD) Risk Prediction System



\## Overview



This project is a clinical decision support tool for predicting the risk of cardiovascular disease (CVD) in patients using machine learning.  

It features a secure FastAPI backend, a batch prediction interface for doctors, and a medical chatbot powered by large language models (LLMs) for patient and clinician support.  

Model training and evaluation are performed in a Google Colab notebook, ensuring reproducibility and transparency.



\## Features



\- \*\*CVD Risk Prediction:\*\* Predicts the probability of CVD for individual patients based on clinical features.

\- \*\*Batch Prediction:\*\* Doctors can upload or enter multiple patient records and receive risk predictions for all at once.

\- \*\*Role-Based Access:\*\* Secure JWT authentication for patients and doctors; doctors have access to additional tools.

\- \*\*Medical Chatbot:\*\* Integrated AI chatbot for answering health-related queries and providing patient education.

\- \*\*Model Training Notebook:\*\* Google Colab notebook for data preprocessing, training, and model export.



\## Project Structure



```

cvd-risk-project/

├── backend/

│   ├── main.py

│   ├── requirements.txt

│   ├── models/

│   │   ├── final\_logreg\_model\_7features.joblib

│   │   └── scaler\_7features.joblib

│   └── ... (other backend files)

├── model-training/

│   └── CVD\_Risk\_Prediction.ipynb

├── .gitignore

└── README.md

```



\## What I Have Done



\- \*\*Developed a FastAPI backend\*\* for CVD risk prediction with endpoints for single and batch predictions.

\- \*\*Implemented JWT authentication\*\* to provide secure, role-based access for patients and doctors.

\- \*\*Integrated a medical chatbot\*\* using Hugging Face or OpenAI LLMs to answer user questions.

\- \*\*Created a Google Colab notebook\*\* for end-to-end model training, including data preprocessing, feature engineering, model fitting, and export.

\- \*\*Tested the API locally\*\* and ensured batch prediction works for doctor accounts.



\## What You Can Do With This Project



\- \*\*Patients:\*\* Log in, enter your health data, and receive a personalized CVD risk prediction.

\- \*\*Doctors:\*\* Log in to batch-predict CVD risk for multiple patients, and access additional analytics.

\- \*\*Anyone:\*\* Explore and retrain the model using the provided Colab notebook and sample data.



\## How to Use



\### 1. Clone the Repository



```bash

git clone 

cd cvd-risk-project

```



\### 2. Backend Setup



```bash

cd backend

python -m venv .venv

.\\.venv\\Scripts\\activate        # On Windows

pip install -r requirements.txt

\# Set up your .env file (see below)

uvicorn main:app --reload

```



\### 3. Model Training (Optional)



\- Open `model-training/CVD\_Risk\_Prediction.ipynb` in Google Colab or Jupyter.

\- Retrain the model and export `.joblib` files as needed.

\- Place the model and scaler files in `backend/models/`.



\### 4. Using the API



\- \*\*/predict:\*\* POST endpoint for single patient risk prediction (requires JWT token).

\- \*\*/doctor/batch\_predict:\*\* POST endpoint for batch prediction (doctors only).

\- \*\*/chat:\*\* POST endpoint for the medical chatbot (requires JWT token).



\### 5. Environment Variables



Create a `.env` file in `backend/` with:



```

SECRET\_KEY=your\_jwt\_secret\_key

HUGGINGFACEHUB\_API\_TOKEN=your\_huggingface\_token

```



\## Example API Usage



\*\*Single Prediction:\*\*



```json

POST /predict

{

&nbsp; "sex": 1,

&nbsp; "age": 55,

&nbsp; "cigsPerDay": 10,

&nbsp; "totChol": 230,

&nbsp; "sysBP": 140,

&nbsp; "diaBP": 90,

&nbsp; "glucose": 110

}

```



\*\*Batch Prediction:\*\*  

Send a list of patient records to `/doctor/batch\_predict` (doctors only).



\*\*Chatbot:\*\*  

Send a message to `/chat` with your question.



\## Datasets Used



\- \[Framingham Heart Study Dataset](https://www.kaggle.com/datasets/amanajmera1/framingham-heart-study-dataset) (or your chosen dataset)

\- Features: Age, sex, cigarettes per day, total cholesterol, systolic BP, diastolic BP, glucose.



\## Tech Stack



\- \*\*Backend:\*\* FastAPI, Pydantic, SQLAlchemy

\- \*\*ML:\*\* scikit-learn, pandas, numpy

\- \*\*Authentication:\*\* JWT (PyJWT)

\- \*\*Chatbot:\*\* Hugging Face LLM (or OpenAI)

\- \*\*Model Training:\*\* Google Colab notebook

\- \*\*Database:\*\* SQLite (dev), PostgreSQL (prod, optional)



\## License \& Clinical Disclaimer



This project is licensed under the \*\*MIT License\*\*.



> \*\*Clinical Disclaimer:\*\*  

> This software is intended for clinical research, education, and operational support.  

> \*\*It does not provide medical advice, diagnosis, or treatment.\*\*  

> All risk predictions and chatbot responses are for informational purposes only and should not replace professional medical judgment.  

> Use of this software does not establish a doctor-patient relationship.  

> \*\*Always consult qualified healthcare professionals before making clinical decisions.\*\*  

> The authors and contributors are not responsible for any clinical outcomes resulting from use of this system.



\## Acknowledgements



\- \[scikit-learn](https://scikit-learn.org/)

\- \[FastAPI](https://fastapi.tiangolo.com/)

\- \[Hugging Face](https://huggingface.co/)

\- \[Google Colab](https://colab.research.google.com/)

\- \[Framingham Heart Study Dataset](https://www.kaggle.com/datasets/amanajmera1/framingham-heart-study-dataset)



