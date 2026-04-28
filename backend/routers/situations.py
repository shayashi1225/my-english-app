from fastapi import APIRouter
from services.claude_service import get_situations

router = APIRouter(prefix="/api/situations", tags=["situations"])


@router.get("")
def list_situations():
    return get_situations()
