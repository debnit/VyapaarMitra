# VyapaarMitra – MSME SaaS Platform

## 🏗️ Stack

- Python 3.11
- FastAPI
- Docker-ready

## 🔧 Local Dev

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

## ☁️ Deploy to Render

- Connect GitHub
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host=0.0.0.0 --port=8000`



# VyapaarMitra Backend

FastAPI backend powering MSME onboarding and authentication system.

## Features
- OTP-based mobile authentication (MSG91)
- OTP verification with expiry
- MSME registration API (WIP)
- Built with FastAPI, Uvicorn, Python 3.10+

## Routes
- `POST /send-otp` → Sends OTP via SMS
- `POST /verify-otp` → Verifies OTP (expires in 5 min)

## Local Dev
```bash
uvicorn main:app --reload
