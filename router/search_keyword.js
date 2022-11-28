const router = require('express').Router();
const redis = require('redis').createClient();

router.get('/', async (req, res) => {
    //FE로 보낼 데이터
    const result = {
        success : true,
        code : 200,
        data : []
    }

    try{
        //connect
        await redis.connect();

        //get search-keyword list
        const keywordList = await redis.lRange('search-keyword', 0, -1);

        //disconnect
        await redis.disconnect();

        //send result
        result.data = keywordList;
        res.send(result);
    }catch(err){
        console.log(err);

        //send result
        result.success = false;
        result.code = 500;
        delete result.data;
        res.send(result);
    }
})

module.exports = router;