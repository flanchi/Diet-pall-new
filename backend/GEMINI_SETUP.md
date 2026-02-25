# Google Gemini API Setup

## Get Your API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

## Configure the Backend

1. Open C:\backend\.env
2. Paste your API key after GOOGLE_API_KEY=
3. Save the file

Example:
```
GOOGLE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuv
```

## Restart the Backend

After adding your API key:
1. Stop the backend server (Ctrl+C)
2. Restart it with: 
pm start

The AI Advisor will now use Google Gemini API to provide personalized dietary advice!
