"""
Gemini client — thin wrapper around google-generativeai.

Lazy-configured: configure() is only called when an actual API call is made,
so the server boots fine without GEMINI_API_KEY set.
"""
import os
from typing import AsyncIterator, Optional
import google.generativeai as genai

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
_configured = False


def _configure() -> None:
    global _configured
    if _configured:
        return
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to your .env file."
        )
    genai.configure(api_key=api_key)
    _configured = True


def get_model(system_prompt: str = "") -> genai.GenerativeModel:
    _configure()
    generation_config = genai.types.GenerationConfig(
        temperature=0.7,
        max_output_tokens=4096,
    )
    return genai.GenerativeModel(
        model_name=MODEL,
        system_instruction=system_prompt or None,
        generation_config=generation_config,
    )


async def generate(
    prompt: str,
    system: str = "",
    response_schema: Optional[dict] = None,
) -> dict:
    """Single-turn JSON generation. Returns {"text": "..."}."""
    model = get_model(system)
    response = await model.generate_content_async(prompt)
    return {"text": response.text}


async def stream(prompt: str, system: str = "") -> AsyncIterator[str]:
    """Async generator yielding text chunks from Gemini."""
    model = get_model(system)
    response = await model.generate_content_async(prompt, stream=True)
    async for chunk in response:
        if chunk.text:
            yield chunk.text
