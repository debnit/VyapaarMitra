
from fastapi import HTTPException
from datetime import datetime, timedelta

# TEMP cache for OTPs
otp_cache = {}

from app.services.send_otp import send_sms_otp
from fastapi import APIRouter, HTTPException
from app.schemas import SendOTPRequest
from app.utils import generate_otp  # Assume this exists

router = APIRouter()

@router.post("/send-otp")
def send_otp_route(payload: SendOTPRequest):
    otp = generate_otp()
    mobile = payload.mobile

    success = send_sms_otp(mobile, otp)

    if success:
        return {"message": "OTP sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send OTP")
