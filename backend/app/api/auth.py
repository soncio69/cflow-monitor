from fastapi import APIRouter, HTTPException
from app.models.schemas import LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Simple in-memory credentials (internal tool)
VALID_CREDENTIALS = {
    "admin": "admin",
    "monitor": "monitor"
}


@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest):
    """Simple login endpoint for internal use"""
    if credentials.username in VALID_CREDENTIALS:
        if VALID_CREDENTIALS[credentials.username] == credentials.password:
            return LoginResponse(
                success=True,
                message="Login successful"
            )

    raise HTTPException(status_code=401, detail="Invalid credentials")
