const router = require('express').Router();
const redis = require('redis').createClient();

router.get('/', async (req, res) => {
    //prepare data
    const date = new Date();
    date.setHours(date.getHours() + 9);
    const today = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;

    //FE로 보내줄 데이터
    const result = {
        success : true,
        data : 0,
        auth : true,
        code : 200
    }

    try{
        //connect redis
        await redis.connect();

        //get today login count
        const todayTotalLoignCount = await redis.get(`login-total-${today}`);

        //disconnect redis
        await redis.disconnect();
        
        //check today login count
        if(todayTotalLoignCount === null){
            //send result
            res.send(result);
        }else{
            //send result
            result.data = parseInt(todayTotalLoignCount);
            res.send(result);            
        }
    }catch(err){
        console.log(err);
        
        //send result( error )
        result.success = false;
        result.code = 500;
        res.send(result);
    }
})

module.exports = router;