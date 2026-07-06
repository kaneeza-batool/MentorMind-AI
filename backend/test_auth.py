import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

print("Key prefix:", os.getenv("GEMINI_API_KEY")[:5])

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

models = client.models.list()

for m in models:
    print(m.name)
    break
