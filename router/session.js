const router = require('express').Router();
const pgConfig = require('../config/pg_config');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');
const loginCookieConfig = require('../config/login_cookie_config');
const loginCount = require('../module/login_count');
const loginAuthCheck = require('../module/login_auth_check');
const { login } = require('../module/account_control');

// session api ====================================================
//로그인된 사용자 정보
router.get('/', loginAuthCheck, (req, res) => {    
    res.status(200).send({
        data : req.userData
    });
})

//로그인 시도 api
router.post('/', async (req, res) => {
    //FE로부터 받아오는 값
    const idValue = req.body.id;
    const pwValue = req.body.pw;

    //FE로 보낼 값
    const result = {};
    let statusCode = 200;

    try{
        const token = await login(idValue, pwValue);

        //cookie set
        res.cookie('token', token, loginCookieConfig);
    }catch(err){
        console.log(err);
        
        statusCode = err.code;
        result.message = err.message;
        err.type ? result.type = err.type : null;
    }

    //응답
    res.status(statusCode).send(result);
})

router.delete('/', loginAuthCheck, async (req, res) => {
    //FE로 보낼 데이터
    const result = {};

    //쿠키 제거
    res.clearCookie('token');
    
    //응답
    res.status(200).send(result);
})

module.exports = router;