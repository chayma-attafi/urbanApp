import base64
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Profile, User
from app.routers.deps import get_current_user
from app.schemas.auth import ProfileResponse
from app.schemas.profile import ProfileUpdate

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.put("/me", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    update_data = payload.model_dump(exclude_unset=True)
    avatar_value = update_data.get("avatar_url")
    if avatar_value and avatar_value.startswith("data:image"):
        try:
            _, base64_data = avatar_value.split("base64,", 1)
            image_bytes = base64.b64decode(base64_data)
            upload_dir = "static/avatars"
            os.makedirs(upload_dir, exist_ok=True)
            file_name = f"{uuid.uuid4()}.jpg"
            file_path = os.path.join(upload_dir, file_name)
            with open(file_path, "wb") as avatar_file:
                avatar_file.write(image_bytes)
            update_data["avatar_url"] = f"/static/avatars/{file_name}"
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid avatar image") from exc

    for field, value in update_data.items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
