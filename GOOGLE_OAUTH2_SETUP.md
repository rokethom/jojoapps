# Google OAuth2 Setup Guide

## Backend Setup

1. **Install Dependencies:**
   ```bash
   pip install google-auth google-auth-oauthlib google-auth-httplib2
   ```

2. **Configure Google OAuth2 in settings.py:**
   ```python
   # Google OAuth2 Settings
   GOOGLE_OAUTH2_CLIENT_ID = 'your-actual-google-client-id'
   GOOGLE_OAUTH2_CLIENT_SECRET = 'your-actual-google-client-secret'
   GOOGLE_OAUTH2_REDIRECT_URI = 'http://localhost:3000/auth/google/callback'
   ```

3. **Get Google OAuth2 Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Set Application type to "Web application"
   - Add authorized redirect URIs: `http://localhost:3000/auth/google/callback`
   - Copy Client ID and Client Secret

## Frontend Setup

1. **Install Dependencies:**
   ```bash
   npm install gapi-script
   ```

2. **Configure Environment Variables:**
   Create `.env` file in frontend-customer directory:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your-actual-google-client-id
   REACT_APP_GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
   ```

3. **Google Cloud Console Setup:**
   - In OAuth consent screen, add your domain
   - Add authorized JavaScript origins: `http://localhost:3000`
   - Add authorized redirect URIs: `http://localhost:3000/auth/google/callback`

## Testing

1. **Start Backend:**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start Frontend:**
   ```bash
   cd frontend-customer
   npm start
   ```

3. **Test Google Login:**
   - Go to login page
   - Click "Masuk dengan Google"
   - Should redirect to Google OAuth and back to app

## Features Implemented

- ✅ Google OAuth2 login for existing users
- ✅ Google OAuth2 registration for new users
- ✅ Automatic user creation with Google profile data
- ✅ JWT token generation
- ✅ Error handling for invalid tokens
- ✅ UI integration with existing design