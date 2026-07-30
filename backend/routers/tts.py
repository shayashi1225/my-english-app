import io
import random
from typing import Optional
from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel
import edge_tts

router = APIRouter(prefix="/api/tts", tags=["tts"])

# Mix of US/UK/AU English neural voices, male and female, so AI speakers
# don't all sound the same.
VOICES = [
    "en-US-AriaNeural",
    "en-US-JennyNeural",
    "en-US-MichelleNeural",
    "en-GB-SoniaNeural",
    "en-AU-NatashaNeural",
    "en-US-GuyNeural",
    "en-US-ChristopherNeural",
    "en-US-EricNeural",
    "en-GB-RyanNeural",
    "en-AU-WilliamNeural",
]


class TTSRequest(BaseModel):
    text: str
    session_id: Optional[int] = None


def pick_voice(session_id: Optional[int]) -> str:
    if session_id is None:
        return random.choice(VOICES)
    return VOICES[session_id % len(VOICES)]


@router.post("")
async def text_to_speech(req: TTSRequest):
    voice = pick_voice(req.session_id)
    communicate = edge_tts.Communicate(req.text, voice)
    buf = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])
    buf.seek(0)
    return Response(content=buf.read(), media_type="audio/mpeg")
