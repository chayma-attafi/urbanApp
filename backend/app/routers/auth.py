import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import send_verification_email
from app.core.security import create_access_token, get_password_hash, verify_password
from app.database import get_db
from app.models.user import Profile, User
from app.routers.deps import get_current_user
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest

router = APIRouter()


def set_auth_cookie(response: Response, user_id: str) -> None:
    token = create_access_token(user_id, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    token = str(uuid.uuid4())
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        is_verified=False,
        verification_token=token,
    )
    db.add(user)
    db.flush()
    profile = Profile(
        user_id=user.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
    )
    db.add(profile)
    db.commit()

    try:
        send_verification_email(payload.email, token)
    except Exception:
        pass  # ne bloque pas l'inscription si l'email échoue

    return {"message": "Un email de vérification a été envoyé. Vérifiez votre boîte mail."}


@router.get("/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Lien de vérification invalide ou expiré")
    if user.is_verified:
        return {"message": "Compte déjà vérifié"}

    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Compte vérifié avec succès. Vous pouvez vous connecter."}


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Veuillez vérifier votre email avant de vous connecter.",
        )

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    set_auth_cookie(response, user.id)
    return {"user": user, "profile": profile}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out"}


@router.get("/me", response_model=AuthResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    return {"user": current_user, "profile": profile}
