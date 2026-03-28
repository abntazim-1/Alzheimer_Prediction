import os
import json
import asyncio
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env.local in the project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(PROJECT_ROOT, ".env.local"))

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# Use a powerful Groq model for medical reasoning
DEFAULT_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are Dr. Neuro, an empathetic, highly knowledgeable AI medical assistant specializing in Alzheimer's Disease and cognitive health. 
Your goal is to guide users through an assessment, explain medical concepts simply, and interpret prediction results. 
Do not provide definitive medical diagnoses, but rather informational insights and recommendations to see a human specialist. 
Always maintain a professional, trustworthy, and concise tone. 
Keep your responses relatively brief unless specifically asked for a detailed explanation."""

async def generate_chat_response(messages: list, model: str = DEFAULT_MODEL) -> str:
    """
    Communicates with the Groq API.
    """
    # Prepend the system prompt if it's not already there
    has_system = any(msg.get("role") == "system" for msg in messages)
    if not has_system:
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

    try:
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
         raise Exception(f"Error communicating with Groq API: {str(e)}")

def generate_chat_response_stream(messages: list, model: str = DEFAULT_MODEL):
    """
    Synchronous generator that streams tokens from Groq.
    """
    has_system = any(msg.get("role") == "system" for msg in messages)
    if not has_system:
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

    try:
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
