import io
from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel
from gtts import gTTS

router = APIRouter(prefix="/api/tts", tags=["tts"])


class TTSRequest(BaseModel):
    text: str


@router.post("")
def text_to_speech(req: TTSRequest):
    tts = gTTS(text=req.text, lang="en", slow=False)
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)
    return Response(content=buf.read(), media_type="audio/mpeg")
