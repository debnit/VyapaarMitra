from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
from app.services.otp import send_otp

router = APIRouter()
OTP_STORE = {}

class OTPRequest(BaseModel):
    mobile: str

class OTPVerify(BaseModel):
    mobile: str
    otp: str

@router.post("/send-otp")
def send_otp_route(data: OTPRequest):
    otp = str(random.randint(100000, 999999))
    OTP_STORE[data.mobile] = otp
    send_otp(data.mobile, otp)
    return {"message": "OTP sent"}

@router.post("/verify-otp")
def verify_otp_route(data: OTPVerify):
    if OTP_STORE.get(data.mobile) == data.otp:
        return {"message": "Login successful"}
    raise HTTPException(status_code=400, detail="Invalid OTP")
