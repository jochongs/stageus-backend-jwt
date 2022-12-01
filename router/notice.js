const router = require('express').Router();
const redis = require('redis').createClient();
const loginAuth = require('../module/login_auth_check');
const { delNotification } = require('../module/notification');

router.get('/:userId', loginAuth, async (req, res) => {
    //prepare data
    const noticeUserId = req.params.userId;
    const userId = req.userData.id;

    //FE로 보낼 데이터
    const result = {
        success : true,
        code : 200,
        auth : true,
        data : []
    }

    //auth check
    if(noticeUserId !== userId){
        //send reuslt
        result.success = false;
        result.code = 200,
        result.auth = false;
        res.send(result);

        return;
    }

    try{
        //connect redis
        await redis.connect();

        //get notice
        const noticeArray = await redis.keys(`notice-${userId}-*`);

        for(let i = 0; i < noticeArray.length; i++){
            const notice = noticeArray[i];
            
            //get notice data
            const noticeData = await redis.hGetAll(notice);

            result.data.push(noticeData);
        }

        //disconnect redis
        await redis.disconnect();

        //send result
        res.send(result);
    }catch(err){
        console.log(err);

        //check redis is opened
        if(redis.isOpen){
            //disconnect redis
            await redis.disconnect();
        }

        //send result
        result.success = false;
        result.code = 500;
        res.send(result);
    }
})

router.delete('/:noticeIdx', loginAuth, async (req, res) => {
    //prepare data
    const loginUserId = req.userData.id;
    const noticeIdx = req.params.noticeIdx;
    const noticeUserId = req.query.userId;
    const noticeArray = [];

    noticeArray.push({
        id : loginUserId,
        noticeIdx : noticeIdx
    })

    //FE로 보낼 데이터
    const result = {
        success : true,
        code : 200,
        auth : true
    }


    //auth check
    if(loginUserId === noticeUserId){
        try{
            //connect redis
            await redis.connect();
    
            //delete notice
            for(let i = 0; i < noticeArray.length; i++){
                //prepare data
                const notice = noticeArray[i];
                const noticeIdx = notice.noticeIdx;
                const userId = notice.id;
                
                const deleteState = await redis.del(`notice-${userId}-${noticeIdx}`);
            }

            //redis disconnect
            await redis.disconnect();
    
            //send result ( success )
            res.send(result);
        }catch(err){
            console.log(err);

            //send result ( server error )
            result.success = false;
            result.code = 500;
            res.send(result);
        }
    }else{
        //send result ( no auth )
        result.success = false;
        result.auth = false;
        res.send(result);
    }
})

module.exports = router;