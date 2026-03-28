import requests
import json
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables from .env.local in the project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(PROJECT_ROOT, ".env.local"))

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_API_URL = f"{OLLAMA_BASE_URL}/api/chat"

SYSTEM_PROMPT = """You are Dr. Neuro, an empathetic, highly knowledgeable AI medical assistant specializing in Alzheimer's Disease and cognitive health. 
Your goal is to guide users through an assessment, explain medical concepts simply, and interpret prediction results. 
Do not provide definitive medical diagnoses, but rather informational insights and recommendations to see a human specialist. 
Always maintain a professional, trustworthy, and concise tone. 
Keep your responses relatively brief unless specifically asked for a detailed explanation."""

async def generate_chat_response(messages: list, model: str = "phi3") -> str:
    """
    Communicates with the local Ollama instance recursively.
    """
    
    # Prepend the system prompt if it's not already there
    has_system = any(msg.get("role") == "system" for msg in messages)
    if not has_system:
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0.5, # Slightly creative but grounded for medical
            "num_predict": 300  # Prevent excessively long responses
        }
    }

    try:
        # Run the synchronous requests call in a threadpool to avoid blocking FastAPI
        response = await asyncio.to_thread(
            requests.post,
            OLLAMA_API_URL, 
            json=payload, 
            timeout=60
        )
        
        response.raise_for_status()
        data = response.json()
        
        return data["message"]["content"]
        
    except requests.exceptions.ConnectionError:
        raise Exception("Failed to connect to Ollama. Make sure Ollama is installed and running locally on port 11434.")
    except Exception as e:
         raise Exception(f"Error communicating with local LLM: {str(e)}")

def generate_chat_response_stream(messages: list, model: str = "phi3"):
    """
    Synchronous generator that streams tokens from Ollama locally.
    FastAPI handles sync generators in a streaming response perfectly.
    """
    has_system = any(msg.get("role") == "system" for msg in messages)
    if not has_system:
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

    payload = {
        "model": model,
        "messages": messages,
        "stream": True,  # Enable streaming explicitly here
        "options": {
            "temperature": 0.5,
            "num_predict": 300
        }
    }

    try:
        response = requests.post(OLLAMA_API_URL, json=payload, stream=True, timeout=60)
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                yield data.get("message", {}).get("content", "")
                
    except Exception as e:
        yield f"\n[Backend Stream Error: {str(e)}]"
