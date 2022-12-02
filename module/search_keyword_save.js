const redis = require('redis').createClient();

module.exports = async (searchKeyword, userId = "") => {
    if(userId.length === 0){
        return;
    }
    try{
        //connect redis
        await redis.connect();

        //set now korea time
        const date = new Date();
        date.setHours(date.getHours() + 9); //korea time
        
        //ADD keyword
        await redis.zAdd(`board_search_keyword-${userId}`, [{
            score : date.getTime(),
            value : searchKeyword
        }]);

        //check search keyword number 
        const keywordCount = await redis.zRange(`board_search_keyword-${userId}`, 0, -1);
        if(keywordCount.length >= 6){
            await redis.zRem(`board_search_keyword-${userId}`, keywordCount[0])
        }

        //disconnect redis
        await redis.disconnect();
    }catch(err){
        if(redis.isOpen){
            await redis.disconnect();
        }

        console.log(err);
    }
} //sorted set 사용 