"""
llm.py — Centralized LLM wrapper using Google Gemini (FREE).

Replaces all `anthropic.Anthropic()` calls across agents.
Every agent imports `call_llm` from here instead of using anthropic directly.
"""

import os
import time
from dotenv import load_dotenv
from google import genai

# Load .env from backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

_client = None

# Model fallback chain — try each in order
MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

def _get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY not set. Get a free key at https://aistudio.google.com/apikey "
                "and add it to backend/.env"
            )
        _client = genai.Client(api_key=api_key)
    return _client


def call_llm(
    user_message: str,
    system_prompt: str = "",
    max_tokens: int = 600,
    retries: int = 3,
) -> str:
    """
    Call Google Gemini and return the text response.
    Includes retry logic with backoff and model fallback.

    Args:
        user_message: The user/input prompt
        system_prompt: System-level instructions (optional)
        max_tokens: Maximum response tokens
        retries: Number of retry attempts per model

    Returns:
        Raw text response from the model
    """
    client = _get_client()

    config = genai.types.GenerateContentConfig(
        max_output_tokens=max_tokens,
        temperature=0.3,  # Lower temp for structured JSON outputs
    )

    if system_prompt:
        config.system_instruction = system_prompt

    last_error = None

    for model_name in MODELS:
        for attempt in range(retries):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=user_message,
                    config=config,
                )
                return response.text.strip()

            except Exception as e:
                last_error = e
                error_str = str(e)

                # Rate limit — wait and retry
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    wait = (attempt + 1) * 3  # 3s, 6s, 9s
                    print(f"[LLM] Rate limited on {model_name}, waiting {wait}s (attempt {attempt + 1}/{retries})")
                    time.sleep(wait)
                    continue

                # Invalid key or quota=0 — try next model
                if "quota" in error_str.lower() and "limit: 0" in error_str:
                    print(f"[LLM] Zero quota for {model_name}, trying next model...")
                    break

                # Other errors — retry
                print(f"[LLM] Error with {model_name}: {e}")
                if attempt < retries - 1:
                    time.sleep(2)
                    continue
                break

    # All models failed — raise the last error
    raise RuntimeError(
        f"All Gemini models failed. Last error: {last_error}\n"
        f"Your API key may be invalid or exhausted.\n"
        f"Get a new free key at: https://aistudio.google.com/apikey"
    )

