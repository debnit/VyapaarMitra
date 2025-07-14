from pydantic import BaseModel

class SendOTPRequest(BaseModel):
    mobile: str
