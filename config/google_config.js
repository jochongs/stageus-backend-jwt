const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  "web": {
    "client_id": process.env.GOOGLE_CLIENT_ID, 
    "project_id": "express-257208",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": process.env.GOOGLE_CLIENT_PW, 
    "redirect_uris": ["https://backend.xn--289a320aihm.com/auth/google/callback"]
  }
}