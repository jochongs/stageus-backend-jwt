const redis = require('redis').createClient();

module.exports = async (searchKeyword) => {
    try{
        //connect redis
        await redis.connect();

        //get keyword list
        const keywordList = await redis.lRange('search-keyword', 0, -1);

        if(!keywordList.includes(searchKeyword)){
            //left push
            await redis.lPush('search-keyword', searchKeyword);

            if(keywordList.length === 5){
                //right pop
                await redis.rPop('search-keyword');
            }
        }

        //disconnect redis
        await redis.disconnect();
    }catch(err){
        console.log(err);
    }
}