from datetime import datetime, timedelta
from typing import Optional

MIN_BOX = 1
MAX_BOX = 5

BOX_INTERVAL_DAYS = {1: 1, 2: 2, 3: 4, 4: 8, 5: 16}

VALID_RATINGS = {"again", "hard", "good"}


def apply_rating(box: int, rating: str, now: Optional[datetime] = None) -> tuple[int, datetime]:
    if rating not in VALID_RATINGS:
        raise ValueError(f"Unknown rating: {rating}")
    now = now or datetime.utcnow()

    if rating == "again":
        new_box = MIN_BOX
    elif rating == "hard":
        new_box = box
    else:  # good
        new_box = min(box + 1, MAX_BOX)

    next_review_at = now + timedelta(days=BOX_INTERVAL_DAYS[new_box])
    return new_box, next_review_at
