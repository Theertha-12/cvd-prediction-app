import logging
import asyncio
import time
from typing import Dict
from core.config import settings

logger = logging.getLogger(__name__)


# Dummy classes for when Groq is not available
class DummyGroq:
    def __init__(self, api_key):
        self.api_key = api_key

    @property
    def chat(self):
        return self

    @property
    def completions(self):
        return self

    def create(self, **kwargs):
        class MockResponse:
            choices = [type('obj', (object,), {
                'message': type('obj', (object,), {
                    'content': 'I apologize, but the AI service is currently unavailable. Please try again later or consult your healthcare provider for medical advice.'})()
            })()]

        return MockResponse()

    @property
    def models(self):
        return self

    def list(self):
        return []


class DummyGroqError(Exception):
    pass


# Try to import Groq, fall back to dummy if not available
try:
    from groq import Groq, GroqError

    logger.info("Groq library imported successfully")
except ImportError as e:
    logger.warning(f"Groq library not found: {e}. Using dummy implementation.")
    Groq = DummyGroq
    GroqError = DummyGroqError


class LLMService:
    def __init__(self):
        try:
            self.client = Groq(api_key=settings.GROQ_API_KEY)
            self.models = {
                "doctor": "llama3-70b-8192",
                "patient": "llama3-8b-8192"
            }
            self.max_retries = 3
            self.retry_delay = 1.5  # seconds
            logger.info("LLM service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize LLM service: {e}")
            self.client = DummyGroq(api_key="dummy")
            self.models = {
                "doctor": "dummy-model",
                "patient": "dummy-model"
            }
            self.max_retries = 1
            self.retry_delay = 0

    async def get_response(self, prompt: str, role: str) -> Dict[str, str]:
        """Get AI response from Groq API with retry logic - NOW PROPERLY ASYNC"""
        attempt = 0

        while attempt < self.max_retries:
            try:
                # Run the synchronous API call in a thread pool to make it truly async
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt}],
                        model=self.models.get(role, "llama3-8b-8192"),
                        temperature=0.3 if role == "doctor" else 0.7,
                        max_tokens=500,
                        timeout=10
                    )
                )

                logger.info(f"✅ Successfully got LLM response for {role}")
                return {
                    "response": response.choices[0].message.content.strip(),
                    "source": "ai"
                }

            except GroqError as e:
                logger.error(f"Groq API error (attempt {attempt + 1}): {e}")
                # Handle specific API errors
                if "rate limit" in str(e).lower():
                    logger.warning("Rate limit exceeded, increasing retry delay")
                    self.retry_delay *= 2  # Exponential backoff

            except Exception as e:
                logger.error(f"LLM service error (attempt {attempt + 1}): {e}")

            # Wait before retrying (use asyncio.sleep for async)
            attempt += 1
            if attempt < self.max_retries:
                logger.info(f"Retrying in {self.retry_delay} seconds (attempt {attempt}/{self.max_retries})")
                await asyncio.sleep(self.retry_delay)

        # Fallback response if all retries fail
        logger.error("All retries failed, returning fallback response")
        return {
            "response": "I'm having trouble accessing the medical knowledge base. "
                        "Please try again later or contact support if the issue persists.",
            "source": "error"
        }

    async def validate_api_key(self) -> bool:
        """Check if the Groq API key is valid - NOW ASYNC"""
        try:
            if isinstance(self.client, DummyGroq):
                logger.warning("Using dummy Groq client - API key validation skipped")
                return False

            # Run synchronous API call in thread pool
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.models.list()
            )
            logger.info("✅ API key validation successful")
            return True

        except GroqError as e:
            logger.error(f"API key validation failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Connection error during validation: {e}")
            return False