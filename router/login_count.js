const router = require('express').Router();
const redis = require('redis').createClient();

router.get('/', async (req, res) => {
    //prepare data
    const date = new Date();
    date.setHours(date.getHours() + 9);

    //FE로 보내줄 데이터
    const result = {};
    let statusCode = 200;

    try{
        //connect redis
        await redis.connect();

        //get today login count
        result.data = await redis.SCARD(`today_login`);

        //disconnect redis
        await redis.disconnect();
    }catch(err){
        console.log(err);
        
        statusCode = 409;
    }

    //응답
    res.status(statusCode).send(result);  
})

module.exports = router;