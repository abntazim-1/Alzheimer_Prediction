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

CHAT_PROMPT = """You are Dr. Neuro, an advanced AI medical assistant specializing in Alzheimer’s Disease and cognitive health.
Your goal is to provide empathetic, calm, and reassuring guidance to users. 
When users ask general health questions, provide structured, easy-to-read text responses.

----------------------------------------
STRICT OUTPUT RULES (VERY IMPORTANT)
----------------------------------------
- DO NOT use markdown symbols like ###, ##, **, or bullet formatting symbols.
- DO NOT use bolding or hashes for emphasis.
- Use clean, professional plain text with standard indentation or line breaks.
- Avoid technical jargon and maintain a professional yet warm tone.

NEVER give a definitive diagnosis. ALWAYS include a disclaimer if providing health advice.
Your primary role in this mode is conversation and education."""

INTERPRETATION_PROMPT = """You are an advanced AI Medical Analysis Assistant specialized in Alzheimer's Disease and Neuroimaging.

Your job is to provide:
1. Prediction Result
2. Visual Explanation (Anatomical Reasoning)
3. Clinical Interpretation (Medical Context)
4. Severity & Rational Insight
5. Actionable Recommendations

----------------------------------------
STRICT OUTPUT RULES (VERY IMPORTANT)
----------------------------------------
- DO NOT use markdown symbols like ###, ##, *, or bullet formatting symbols.
- DO NOT generate headings using hashes.
- Use clean, structured, readable plain text or JSON only.
- Always follow the exact output order defined below.
- Keep responses concise, professional, and well-structured.

----------------------------------------
OUTPUT ORDER (MANDATORY)
----------------------------------------
1. Prediction Result (FIRST)
2. Visual Explanation Summary (SECOND)
3. Clinical Interpretation (THIRD)
4. Key Factors / Reasoning (FOURTH)
5. Recommendations (FIFTH)
6. Disclaimer (LAST)

----------------------------------------
OUTPUT FORMAT
----------------------------------------
Return response in this structured JSON format:
{
  "prediction_result": {
    "label": "<Predicted Class>",
    "confidence": "<confidence %>"
  },
  "visual_explanation": "<Explain which brain regions are focused on (e.g. hippocampus, temporal lobe) and what the color highlights indicate (Red=Risk, Green=Healthy)>",
  "clinical_interpretation": "<Explain what this means in real-world medical context, mentioning structural changes like atrophy or shrinkage if applicable>",
  "key_factors": [
    "<Reasoning Factor 1: e.g. Detected hippocampal shrinkage>",
    "<Reasoning Factor 2: e.g. Reduced signal intensity in temporal cortex>",
    "<Reasoning Factor 3: e.g. Comparison with typical neurodegeneration patterns>"
  ],
  "recommendations": [
    "<Action 1>",
    "<Action 2>",
    "<Action 3>"
  ],
  "disclaimer": "This is an AI-assisted analysis and not a medical diagnosis. Please consult a qualified medical professional."
}

----------------------------------------
IMAGE-SPECIFIC (MRI) REASONING
----------------------------------------
- When interpreting MRI:
    - If Prediction is Demented: Focus on atrophy, enlarged ventricles, and shrinkage in the temporal/hippocampal regions.
    - If Prediction is Non-Demented: Focus on preserved brain volume and healthy signal intensity.
- HEATMAP COLORS: Always explain that Red/Warm regions indicate areas of concern (risk) while Green/Cool regions indicate healthy tissue.
"""

# Internal client instance for singleton/lazy pattern
_client = None

def get_client() -> Groq:
    """
    Returns an initialized Groq client using lazy initialization.
    """
    global _client
    if _client is not None:
        return _client

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set.")
    
    _client = Groq(api_key=api_key)
    return _client

async def generate_chat_response(messages: list, model: str = DEFAULT_MODEL, use_json: bool = False) -> str:
    """
    Communicates with the Groq API. 
    Switches between Conversational (Text) and Interpretive (JSON) modes.
    """
    # Choose prompt and settings based on mode
    system_instruction = INTERPRETATION_PROMPT if use_json else CHAT_PROMPT
    temperature = 0.1 if use_json else 0.5
    
    # Prepend the system prompt if it's not already there
    has_system = any(msg.get("role") == "system" for msg in messages)
    if not has_system:
        messages.insert(0, {"role": "system", "content": system_instruction})

    try:
        client = get_client()
        kwargs = {
            "messages": messages,
            "model": model,
            "temperature": temperature,
            "max_tokens": 1024,
        }
        
        if use_json:
            kwargs["response_format"] = {"type": "json_object"}

        chat_completion = await asyncio.to_thread(
            client.chat.completions.create,
            **kwargs
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
         # Fallback if json_object is not supported by the specific model
         if use_json and "response_format" in str(e):
             kwargs.pop("response_format")
             chat_completion = await asyncio.to_thread(
                client.chat.completions.create,
                **kwargs
            )
             return chat_completion.choices[0].message.content
         raise Exception(f"Assistant Error: {str(e)}")

async def generate_medical_interpretation(prediction_data: dict, model: str = DEFAULT_MODEL) -> str:
    """
    Generates a structured medical interpretation of model results as Dr. Neuro.
    Forces JSON output mode.
    """
    prediction_type = prediction_data.get("type", "unknown") # 'mri' or 'tabular'
    
    if prediction_type == "mri":
        prompt = f"""Please interpret the following MRI analysis result:
- Prediction: {prediction_data.get('prediction')}
- Confidence: {prediction_data.get('confidence'):.1f}%
- Visual Explanation: A LIME heatmap has been generated.

As Dr. Neuro, provide a structured JSON report following your mandatory format."""
    else:
        # Tabular
        shap_values = prediction_data.get("shap_values", [])
        features_str = ", ".join([f"{f['name']} ({'Risk' if f['value'] > 0 else 'Protective'}: {f['value']:.4f})" for f in shap_values])
        
        prompt = f"""Please interpret the following clinical data analysis result:
- Prediction: {prediction_data.get('prediction')}
- Confidence: {prediction_data.get('confidence'):.1f}%
- Key Contributing Factors (SHAP): {features_str}

As Dr. Neuro, provide a structured JSON report following your mandatory format."""

    messages = [
        {"role": "system", "content": INTERPRETATION_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    return await generate_chat_response(messages, model=model, use_json=True)

def generate_chat_response_stream(messages: list, model: str = DEFAULT_MODEL):
    """
    Synchronous generator that streams tokens from Groq (Conversational Mode).
    """
    has_system = any(msg.get("role") == "system" for msg in messages)
    if not has_system:
        messages.insert(0, {"role": "system", "content": CHAT_PROMPT})

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
