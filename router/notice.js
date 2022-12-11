const router = require('express').Router();
const redis = require('redis').createClient();
const loginAuth = require('../module/login_auth_check');
const { delNotification } = require('../module/notification');

router.get('/:userId', loginAuth, async (req, res) => {
    //prepare data
    const noticeUserId = req.params.userId;
    const userId = req.userData.id;

    //FE로 보낼 데이터
    const result = {};
    let statusCode = noticeUserId === userId ? 200 : 403;

    //auth check
    if(noticeUserId !== userId){
        statusCode === 403;
    }

    if(statusCode === 200){
        try{
            //connect redis
            await redis.connect();
    
            //get notice
            const noticeArray = await redis.keys(`notice-${userId}-*`);
            result.data = [];
    
            for(let i = 0; i < noticeArray.length; i++){
                const notice = noticeArray[i];
                
                //get notice data
                const noticeData = await redis.hGetAll(notice);
    
                result.data.push(noticeData);
            }
    
            //disconnect redis
            await redis.disconnect();
        }catch(err){
            console.log(err);
    
            //disconnect
            if(redis.isOpen){
                await redis.disconnect();
            }
    
            statusCode = 409;
        }
    }

    //응답
    res.status(statusCode).send(result);
})

router.delete('/:noticeIdx', loginAuth, async (req, res) => {
    //prepare data
    const loginUserId = req.userData.id;
    const noticeIdx = req.params.noticeIdx;
    const noticeUserId = req.query.userId;

    //FE로 보낼 데이터
    const result = {};
    let statusCode = 200;

    //auth check
    if(loginUserId === noticeUserId){
        try{
            //connect redis
            await redis.connect();
    
            //delete notice
            await redis.del(`notice-${loginUserId}-${noticeIdx}`);

            //redis disconnect
            await redis.disconnect();
        }catch(err){
            console.log(err);

            result.message = 'unexpected error occurd';
            statusCode = 409;
        }
    }else{
        result.message = 'no auth';
        statusCode = 403;
    }

    //응답
    res.status(statusCode).send(result);
})

module.exports = router;