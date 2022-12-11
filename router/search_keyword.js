const router = require('express').Router();
const redis = require('redis').createClient();
const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');
const loginAuthCheck = require('../module/login_auth_check');

router.get('/', loginAuthCheck, async (req, res) => {
    //FE에서 받은 데이터
    const userData = req.userData;  

    //FE로 보낼 데이터
    const result = {};
    let statusCode = 200;

    //검색 키워드 가져오기
    try{
        //connect
        await redis.connect();

        //get search-keyword list
        const keywordList = await redis.zRange(`board_search_keyword-${userId}`, 0, -1);

        //disconnect
        await redis.disconnect();

        //send result
        result.data = keywordList.reverse();
    }catch(err){    
        console.log(err);

        result.message = 'unexpected error occured';
        statusCode = 409;
    }

    //응답
    res.status(statusCode).send(result);
})

module.exports = router;