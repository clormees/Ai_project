import google.generativeai as genai
import os
from dotenv import load_dotenv

# Загружаем ключ
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("--- ДОСТУПНЫЕ МОДЕЛИ ---")
try:
    for m in genai.list_models():
        # Нам нужны только те, что умеют писать текст (generateContent)
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ {m.name}")
except Exception as e:
    print(f"Ошибка: {e}")
print("------------------------")