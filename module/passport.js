const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GOOGLE_CONFIG = require('../config/google_config');

module.exports = () => {
    passport.serializeUser((user, done) => {
        done(null, user);
    })
    
    passport.deserializeUser((obj, done) => {
        done(null, obj);
    })
    
    passport.use(
        new GoogleStrategy(
            {
                clientID: GOOGLE_CONFIG.web.client_id,
                clientSecret: GOOGLE_CONFIG.web.client_secret,
                callbackURL: GOOGLE_CONFIG.web.redirect_uris[0],
                passReqToCallback : true,
            },  
            (req, accessToken, refreshToken, profile, done) => {
                console.log('google profile : ');
                console.log(profile);
                
                //session 설정 
                req.session = profile.name;
    
                //done
                done(null, profile.name);
            }
        )
    )
}