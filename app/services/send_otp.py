import os
import requests
from dotenv import load_dotenv

load_dotenv()

AUTH_KEY = os.getenv("MSG91_AUTH_KEY")
TEMPLATE_ID = os.getenv("MSG91_TEMPLATE_ID")
SENDER_ID = os.getenv("MSG91_SENDER_ID", "VYPMTR")  # optional

def send_sms_otp(mobile: str, otp: str) -> bool:
    """
    Send OTP via MSG91 SMS
    """
    payload = {
        "template_id": TEMPLATE_ID,
        "mobile": f"91{mobile}",
        "authkey": AUTH_KEY,
        "otp": otp
    }

    try:
        response = requests.post("https://api.msg91.com/api/v5/otp", data=payload)
        response.raise_for_status()
        print(f"✅ OTP sent to {mobile}: {response.text}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ OTP sending failed: {e}")
        return False

from pydantic import BaseModel

class VerifyOTPRequest(BaseModel):
    mobile: str
    otp: str

@router.post("/verify-otp")
def verify_otp(payload: VerifyOTPRequest):
    mobile = payload.mobile
    otp = payload.otp

    if mobile not in otp_cache:
        raise HTTPException(status_code=404, detail="OTP not sent to this number")

    record = otp_cache[mobile]

    if record.get("verified"):
        raise HTTPException(status_code=400, detail="OTP already used")

    if datetime.now() - record["timestamp"] > timedelta(minutes=5):
        raise HTTPException(status_code=400, detail="OTP expired")

    if otp != record["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Mark as verified
    record["verified"] = True
    return {"status": "success", "message": "OTP verified"}

from random import randint

@router.post("/send-otp")
def send_otp(payload: SendOTPRequest):
    mobile = payload.mobile

    # generate 6-digit otp
    otp = str(randint(100000, 999999))

    # call msg91 (your existing logic)
    send_sms_otp(mobile, otp)

    # store otp temporarily
    otp_cache[mobile] = {
        "otp": otp,
        "timestamp": datetime.now(),
        "verified": False
    }

    return {"status": "sent", "mobile": mobile}


