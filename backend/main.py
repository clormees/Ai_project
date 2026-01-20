import os
import uuid
import uvicorn
import io
import base64 # POTRZEBNE DO KODOWANIA OBRAZU
from PIL import Image
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai

# Ładowanie klucza API
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)

app = FastAPI()

# Konfiguracja CORS (zezwolenie na dostęp z Reacta)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Magazyn czatów (w pamięci RAM)
chat_sessions = {}

# 1. Utwórz nowy czat
@app.post("/chats/new")
async def create_chat():
    chat_id = str(uuid.uuid4())
    model = genai.GenerativeModel('gemini-1.5-flash')
    session = model.start_chat(history=[])
    
    chat_sessions[chat_id] = {
        "session": session,
        "history": [],
        "title": "Nowy czat"
    }
    return {"chat_id": chat_id, "title": "Nowy czat", "history": []}

# 2. Pobierz listę czatów
@app.get("/chats")
async def get_chats():
    return [{"id": k, "title": v["title"]} for k, v in chat_sessions.items()]

# 3. Pobierz historię konkretnego czatu
@app.get("/chats/{chat_id}")
async def get_chat_history(chat_id: str):
    if chat_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Czat nie znaleziony")
    return chat_sessions[chat_id]["history"]

# 4. Wyślij wiadomość (Z PLIKIEM LUB BEZ)
@app.post("/chats/{chat_id}/message")
async def send_message(
    chat_id: str,
    message: str = Form(...),
    file: UploadFile = File(None)
):
    if chat_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Czat nie znaleziony")
    
    chat_data = chat_sessions[chat_id]
    
    try:
        content_to_send = [message]
        
        # Zmienna do przechowywania obrazu w historii (Base64)
        image_data_url = None 

        if file:
            # 1. Odczytujemy plik
            file_bytes = await file.read()
            
            # 2. Przygotowujemy dla Gemini (format Pillow Image)
            image = Image.open(io.BytesIO(file_bytes))
            content_to_send.append(image)
            
            # 3. Przygotowujemy dla Historii (kodujemy do ciągu Base64)
            base64_str = base64.b64encode(file_bytes).decode('utf-8')
            mime_type = file.content_type or "image/jpeg"
            image_data_url = f"data:{mime_type};base64,{base64_str}"

        # Zapisujemy wiadomość użytkownika (teraz z polem image)
        user_msg_entry = {"role": "user", "text": message}
        if image_data_url:
            user_msg_entry["image"] = image_data_url # Dodajemy obraz do obiektu
            
        chat_data["history"].append(user_msg_entry)
        
        # Jeśli to początek rozmowy, aktualizujemy tytuł czatu
        if len(chat_data["history"]) <= 2:
            chat_data["title"] = message[:30] + "..."

        # Wysyłamy do Google
        response = chat_data["session"].send_message(content_to_send)
        
        # Zapisujemy odpowiedź bota
        chat_data["history"].append({"role": "bot", "text": response.text})
        
        return {"response": response.text, "new_title": chat_data["title"]}
    
    except Exception as e:
        print(f"Błąd: {e}")
        return {"response": f"Błąd: {str(e)}"}

# 5. Usuń czat
@app.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    if chat_id in chat_sessions:
        del chat_sessions[chat_id]
        return {"status": "ok"}
    raise HTTPException(status_code=404, detail="Czat nie znaleziony")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)