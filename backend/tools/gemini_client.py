import os
from typing import AsyncIterator

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

_client = AsyncOpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
    timeout=60.0,
)


async def generate(
    prompt: str,
    system: str = "",
    response_schema=None,
) -> dict:
    response = await _client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )

    return {"text": response.choices[0].message.content}


async def stream(prompt: str, system: str = "") -> AsyncIterator[str]:
    response = await _client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        stream=True,
    )

    async for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
