from datetime import timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import engine, get_db
from app.models import Base
from app.auth import authenticate_user, create_access_token, seed_admin_user
from app.schemas import Token
from app.routers import notifications, stats

settings = get_settings()

# Create tables (Alembic used in prod, this covers dev quick-start)
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    if settings.should_seed_default_admin:
        db = next(get_db())
        try:
            seed_admin_user(
                db,
                username=settings.default_admin_username,
                password=settings.default_admin_password,
                is_admin=True,
            )
        finally:
            db.close()
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title="Notification Management System",
    description="Generic async notification service supporting Email, SMS and Push channels.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(notifications.router)
app.include_router(stats.router)


@app.post("/api/auth/token", response_model=Token, tags=["Auth"])
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "notification-api"}
