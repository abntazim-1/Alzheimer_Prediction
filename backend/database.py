import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.future import select

# Load environment variables from .env.local in the project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(PROJECT_ROOT, ".env.local"))

# Database Path
DATABASE_URL = os.getenv("DATABASE_URL")
    
if not DATABASE_URL:
    # Default to a local SQLite file in the backend directory
    db_path = os.path.join(BASE_DIR, 'neuro_chat.db')
    DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"
elif DATABASE_URL.startswith("sqlite") and ":/" in DATABASE_URL and os.name != 'nt':
    # Catch Windows-style paths (e.g., C:/) when running on Linux
    print(f"WARNING: Detected Windows-style path in DATABASE_URL on non-Windows system: {DATABASE_URL}")
    print("Falling back to local neuro_chat.db in backend directory.")
    db_path = os.path.join(BASE_DIR, 'neuro_chat.db')
    DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"

# SQLAlchemy Setup
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# Models
class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)  # UUID or random string
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.session_id"), index=True)
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Database Initialization
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Helper functions
async def save_chat_message(session_id: str, role: str, content: str):
    async with AsyncSessionLocal() as session:
        # Ensure session exists
        result = await session.execute(select(ChatSession).where(ChatSession.session_id == session_id))
        db_session = result.scalars().first()
        if not db_session:
            db_session = ChatSession(session_id=session_id)
            session.add(db_session)
        
        message = ChatMessage(session_id=session_id, role=role, content=content)
        session.add(message)
        await session.commit()

async def get_chat_history(session_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp)
        )
        return result.scalars().all()
