from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from services.llm_service import generate_chat_response, generate_chat_response_stream
from database import save_chat_message, get_chat_history

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "llama-3.3-70b-versatile"
    session_id: Optional[str] = "default_user" # Added for DB persistence

@router.get("/chat/history/{session_id}")
async def fetch_chat_history(session_id: str):
    """Retrieves chat history for a given session."""
    history = await get_chat_history(session_id)
    return [{"role": msg.role, "content": msg.content, "timestamp": msg.timestamp} for msg in history]

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Save user message
        user_content = request.messages[-1].content
        await save_chat_message(request.session_id, "user", user_content)
        
        formatted_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        response_text = await generate_chat_response(
            messages=formatted_messages, 
            model=request.model
        )
        
        # Save assistant response
        await save_chat_message(request.session_id, "assistant", response_text)
        
        return {"response": response_text}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    try:
        # Save user message before streaming
        user_content = request.messages[-1].content
        await save_chat_message(request.session_id, "user", user_content)
        
        formatted_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        async def stream_and_save():
            full_response = ""
            for chunk in generate_chat_response_stream(formatted_messages, request.model):
                full_response += chunk
                yield chunk
            # Save assistant response after stream completes
            await save_chat_message(request.session_id, "assistant", full_response)

        return StreamingResponse(stream_and_save(), media_type="text/plain")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")
