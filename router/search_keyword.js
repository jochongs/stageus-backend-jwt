const router = require('express').Router();
const redis = require('redis').createClient();
const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');

router.get('/', async (req, res) => {
    //FE에서 받은 데이터
    const token = req.signedCookies.token;

    //FE로 보낼 데이터
    const result = {
        success : true,
        code : 200,
        data : [],
        auth : true
    }

    try{
        const userData = jwt.verify(token, SECRET_KEY);
        const userId = userData.id;

        try{
            //connect
            await redis.connect();
    
            //get search-keyword list
            const keywordList = await redis.zRange(`board_search_keyword-${userId}`, 0, -1);

            //disconnect
            await redis.disconnect();
    
            //send result
            result.data = keywordList.reverse();
            res.send(result);
        }catch(err){    
            //send result
            result.success = false;
            result.code = 500;
            delete result.data;
            result.auth = false;
            res.send(result);
        }
    }catch(err){
        if(redis.isOpen){
            await redis.disconnect();
        }

        //send reuslt ( no auth )
        result.success = false;
        result.code = 200;
        result.auth = false;
        res.send(result);
    }
})

module.exports = router;