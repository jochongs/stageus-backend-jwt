const router = require('express').Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const googleConfig = require('../config/google_config');
const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');
const cookieConfig = require('../config/login_cookie_config');
const loginCount = require('../module/login_count');

// passport ================================================================================
passport.serializeUser((user, done) => {
    done(null, user);
})

passport.deserializeUser((user, done) => {
    done(null, user);
})

passport.use(
    new GoogleStrategy(
        {
            clientID: googleConfig.web.client_id,
            clientSecret: googleConfig.web.client_secret,
            callbackURL: googleConfig.web.redirect_uris[0],
        },  
        async (accessToken, refreshToken, profile, done) => {
            //prepare data
            const id = profile.emails[0].value;
            const nickname = profile.displayName;
            const name = profile.displayName;

            try{
                //DB connect
                const client = new Client(pgConfig);
                await client.connect();

                //SELECT
                const selectSQL = `SELECT id FROM backend.account WHERE id=$1`;   
                const selectData = await client.query(selectSQL, [id]);

                //check nessecity signup
                if(selectData.rows.length === 0){
                    //INSERT
                    const insertSQL = `INSERT INTO backend.account (id, pw, name, nickname, authority, login_type) VALUES ($1, $2, $3, $4, $5, $6)`;
                    await client.query(insertSQL,[id, 'temppassword', name, nickname, 'google', 'google']);
                }

                //done
                done(null, {
                    name : name,
                    nickname : nickname,
                    id : id,
                    authority : "google",
                });
            }catch(err){
                console.log(err);

                done(null, false, {message : "DB error"});
            }
        }
    )
)

// auth api ================================================================================
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email']}));

router.get('/google/callback', passport.authenticate('google', { failureRedirect : '/page/error'}), (req, res) => {
    res.redirect('/page/login');
});

router.get('/', (req, res) => {
    //FE로 보낼 data
    const result = {};
    let statusCode = 200;

    
    if(req.session.passport !== undefined){
        //prepare data
        const id = req.session.passport.user.id;
        const name = req.session.passport.user.name;
        const nickname = req.session.passport.user.nickname;
        const authority = req.session.passport.user.authority;

        //set token
        const token = jwt.sign(
            {
                id : id,
                name : name,
                nickname : nickname,
                authority : authority
            },
            SECRET_KEY,
            {
                "expiresIn" : '1h',
                'issuer' : "stageus"
            }
        );
        
        //set cookie
        res.cookie('token', token, cookieConfig);

        //login count
        loginCount(id);

        //destroy session
        req.session.destroy((err) => {
            if(err){
                console.log(err);
            }
        })

        //응답
        res.status(statusCode).send(result);
    }else{
        statusCode = 401;

        //응답
        res.status(statusCode).send(result);
    }
});

module.exports = router;