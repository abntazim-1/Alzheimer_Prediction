import os
import json
import asyncio
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env.local in the project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(BASE_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
load_dotenv(os.path.join(PROJECT_ROOT, ".env.local"))

# Use a powerful Groq model for medical reasoning
DEFAULT_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are Dr. Neuro, an empathetic, highly knowledgeable AI medical assistant specializing in Alzheimer's Disease and cognitive health. 
Your goal is to guide users through an assessment, explain medical concepts simply, and interpret prediction results. 
Do not provide definitive medical diagnoses, but rather informational insights and recommendations to see a human specialist. 
Always maintain a professional, trustworthy, and concise tone. 
Keep your responses relatively brief unless specifically asked for a detailed explanation."""

# Internal client instance for singleton/lazy pattern
_client = None

def get_client() -> Groq:
    """
    Returns an initialized Groq client using lazy initialization.
    This prevents GroqError during module import if the API key is missing.
    """
    global _client
    if _client is not None:
        return _client

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY environment variable is not set. "
            "Please configure it in .env.local (local) or your Cloud Provider's environment settings (production)."
        )
    
    _client = Groq(api_key=api_key)
    return _client

async def generate_chat_response(messages: list, model: str = DEFAULT_MODEL) -> str:
    """
    Communicates with the Groq API.
    """
    # Prepend the system prompt if it's not already there
    has_system = any(msg.get("role") == "system" for msg in messages)
    if not has_system:
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

    try:
        client = get_client()
        # Run the synchronous Groq call in a threadpool
        chat_completion = await asyncio.to_thread(
            client.chat.completions.create,
            messages=messages,
            model=model,
            temperature=0.5,
            max_tokens=1024,
        )
        return chat_completion.choices[0].message.content
        
    except Exception as e:
         raise Exception(f"Assistant Error: {str(e)}")

def generate_chat_response_stream(messages: list, model: str = DEFAULT_MODEL):
    """
    Synchronous generator that streams tokens from Groq.
    """
    has_system = any(msg.get("role") == "system" for msg in messages)
    if not has_system:
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

    try:
        client = get_client()
        stream = client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=0.5,
            max_tokens=1024,
            stream=True,
        )
        
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content
                
    except Exception as e:
        yield f"\n[Backend Stream Error: {str(e)}]"
