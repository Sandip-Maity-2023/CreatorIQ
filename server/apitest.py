import os
from dotenv import load_dotenv
from google_auth_oauthlib.flow import InstalledAppFlow

load_dotenv()

# YouTube Data API Read-Only Scope
SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"]

client_config = {
    "web": {
        "client_id": os.getenv("YOUTUBE_CLIENT_ID"),
        "client_secret": os.getenv("YOUTUBE_CLIENT_SECRET"),
        "auth_uri": os.getenv("GOOGLE_CLIENT_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
        "token_uri": os.getenv("GOOGLE_CLIENT_TOKEN_URI", "https://oauth2.googleapis.com/token"),
        "redirect_uris": [os.getenv("GOOGLE_CLIENT_REDIRECT_URI", "http://localhost:8000/api/v1/auth/youtube/callback")]
    }
}

try:
    flow = InstalledAppFlow.from_client_config(client_config, scopes=SCOPES)
    auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
    print("[SUCCESS] Credentials are valid!")
    print(f"Generated Auth URL:\n{auth_url}")
except Exception as e:
    print(f"[ERROR] Credentials Error: {e}")