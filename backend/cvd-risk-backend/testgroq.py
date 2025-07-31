import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


def test_groq_api():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "your-groq-api-key-here":
        print("❌ Groq API key not configured in .env file")
        return

    try:
        client = Groq(api_key=api_key)
        models = client.models.list()
        print("✅ Groq API connection successful!")
        print(f"Available models: {[model.id for model in models.data]}")

        # Test a simple chat
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": "What is cardiovascular disease?"}],
            model="llama3-8b-8192",
            max_tokens=100
        )
        print("\nTest response:")
        print(chat_completion.choices[0].message.content)

    except Exception as e:
        print(f"❌ Groq API test failed: {e}")


if __name__ == "__main__":
    test_groq_api()