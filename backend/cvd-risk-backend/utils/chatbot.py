import logging
from typing import Dict, Optional
from core.config import settings
from utils.llm_integration import LLMService
import re
import json

logger = logging.getLogger(__name__)


class ChatbotService:
    def __init__(self):
        self.llm = LLMService()
        self.menu_answers = self._initialize_menu_answers()
        self.guidelines = "2023 AHA/ACC Guidelines for Cardiovascular Disease Prevention"
        self.normalized_keys = self._initialize_normalized_keys()

    def _initialize_menu_answers(self):
        return {
            "what are common heart attack symptoms?": {
                "response": "Common heart attack symptoms include:\n- Chest pain or discomfort\n- Shortness of breath\n- Pain in arms, back, neck or jaw\n- Cold sweat\n- Nausea\n- Lightheadedness\n\nWomen may experience different symptoms like fatigue, indigestion, or abdominal pain.",
                "source": "medical_db"
            },
            "what is a normal blood pressure?": {
                "response": "Normal blood pressure is typically around 120/80 mmHg. Elevated blood pressure is between 120-129/<80, and hypertension is 130/80 or higher.",
                "source": "medical_db"
            },
            "how can I lower my cholesterol?": {
                "response": "To lower cholesterol:\n1. Eat heart-healthy foods (reduce saturated fats)\n2. Exercise regularly\n3. Quit smoking\n4. Lose excess weight\n5. Limit alcohol consumption\n6. Consider medication if lifestyle changes aren't enough",
                "source": "medical_db"
            },
            "what are the risk factors for heart disease?": {
                "response": "Major risk factors include:\n- High blood pressure\n- High cholesterol\n- Smoking\n- Diabetes\n- Obesity\n- Physical inactivity\n- Unhealthy diet\n- Family history of heart disease",
                "source": "medical_db"
            },
            "what is the difference between a heart attack and cardiac arrest?": {
                "response": "A heart attack is a circulation problem (blocked artery prevents blood from reaching the heart muscle). Cardiac arrest is an electrical problem (heart stops beating unexpectedly). A heart attack can lead to cardiac arrest.",
                "source": "medical_db"
            },
            "how often should I get my cholesterol checked?": {
                "response": "Adults 20+ should get checked every 4-6 years. Those with risk factors or existing heart conditions may need more frequent checks. Consult your doctor for personalized advice.",
                "source": "medical_db"
            },
            "what are the warning signs of a stroke?": {
                "response": "Remember FAST:\nF: Face drooping\nA: Arm weakness\nS: Speech difficulty\nT: Time to call emergency services\nOther signs: sudden confusion, vision problems, dizziness, severe headache.",
                "source": "medical_db"
            },
            "can stress cause heart problems?": {
                "response": "Chronic stress can contribute to heart disease by:\n- Raising blood pressure\n- Increasing inflammation\n- Leading to unhealthy coping behaviors (smoking, overeating)\nManaging stress is crucial for heart health.",
                "source": "medical_db"
            },
            "what is a healthy diet for heart health?": {
                "response": "A heart-healthy diet includes:\n- Fruits and vegetables\n- Whole grains\n- Lean proteins (fish, poultry)\n- Healthy fats (olive oil, avocados)\n- Limited sodium, sugar, and saturated fats\nConsider the DASH or Mediterranean diet.",
                "source": "medical_db"
            },
            "how does exercise benefit heart health?": {
                "response": "Exercise:\n1. Strengthens heart muscle\n2. Lowers blood pressure\n3. Improves cholesterol levels\n4. Helps maintain healthy weight\n5. Reduces stress\nAim for 150 minutes of moderate exercise weekly.",
                "source": "medical_db"
            }
        }

    def _initialize_normalized_keys(self):
        normalized = {}
        for question in self.menu_answers.keys():
            normalized[self._normalize_text(question)] = question
        return normalized

    async def get_personalized_response(
            self,
            message: str,
            role: str,
            prediction_context: Optional[Dict] = None
    ) -> Dict[str, str]:
        """Generate reliable responses for menu questions"""
        try:
            clean_msg = self._sanitize_input(message)
            normalized_msg = self._normalize_text(clean_msg)

            if normalized_msg in self.normalized_keys:
                original_question = self.normalized_keys[normalized_msg]
                logger.info(f"Matched menu question: {original_question}")
                return self.menu_answers[original_question]

            context = self._create_context(
                clean_msg,
                role,
                prediction_context
            )

            ai_response = await self.llm.get_response(context, role)

            validated_response = self._validate_response(
                ai_response["response"],
                clean_msg,
                role
            )

            return {
                "response": validated_response,
                "source": ai_response["source"],
                "personalized": bool(prediction_context)
            }
        except Exception as e:
            logger.error(f"Response error: {e}")
            return self._get_fallback_response(clean_msg, role, prediction_context)

    def _normalize_text(self, text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text

    def _sanitize_input(self, text: str) -> str:
        clean_text = re.sub(r"[^\w\s.,?!\-'()]", "", text)
        return clean_text[:500]

    def _create_context(self, question: str, role: str, prediction_context: Optional[Dict]) -> str:
        context_lines = [
            f"ROLE: {'Cardiologist assistant' if role == 'doctor' else 'Patient health advisor'}",
            f"MEDICAL GUIDELINES: {self.guidelines}"
        ]

        # Add prediction context if available
        if prediction_context:
            risk_percentage = prediction_context.get('riskScore', 0) * 100
            risk_category = prediction_context.get('riskCategory', 'Unknown')
            key_factors = prediction_context.get('keyFactors', [])

            context_lines.append(
                f"PATIENT CONTEXT: {risk_category} CVD risk ({risk_percentage:.1f}%)"
            )

            if key_factors:
                context_lines.append(
                    f"KEY RISK FACTORS: {', '.join(key_factors)}"
                )
        else:
            context_lines.append("PATIENT CONTEXT: No specific patient context")

        context_lines.extend([
            f"USER QUESTION: {question}",
            "INSTRUCTIONS: Provide accurate, concise medical information. ",
            "If uncertain, recommend consulting a healthcare provider.",
            "For doctors: Focus on clinical implications and management strategies."
        ])

        return "\n".join(context_lines)

    def _validate_response(self, response: str, question: str, role: str) -> str:
        if role == "patient" and "consult your doctor" not in response.lower():
            response += "\n\nRemember: This is general information only. Consult your healthcare provider for personal medical advice."
        return response

    def _get_fallback_response(self, question: str, role: str, prediction_context: Optional[Dict]) -> Dict:
        risk_note = ""
        if prediction_context:
            risk_score = prediction_context.get('riskScore', 0) * 100
            risk_category = prediction_context.get('riskCategory', 'unknown')
            risk_note = f" (Note: Patient CVD risk is {risk_category} at {risk_score:.1f}%)"

        return {
            "response": f"I'm having trouble answering that question.{risk_note} Please consult your healthcare provider for accurate information.",
            "source": "fallback",
            "personalized": bool(prediction_context)
        }