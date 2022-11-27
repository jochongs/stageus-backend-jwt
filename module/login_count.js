const redis = require('redis').createClient();

const loginCount = async (userId) => {
    //prepare data
    const date = new Date();
    date.setHours(date.getHours() + 9);
    const today = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;

    //connect redis
    await redis.connect();
    
    //user today login check
    const userTodayLoginCount = await redis.get(`login-${userId}-${today}`);
    if(userTodayLoginCount === null){
        await redis.set(`login-${userId}-${today}`, 1);

        //today total login count 
        const todayTotalLoginCount = await redis.get(`login-total-${today}`);

        if(todayTotalLoginCount === null){
            await redis.set(`login-total-${today}`, 1);
        }else{
            await redis.set(`login-total-${today}`, parseInt(todayTotalLoginCount) + 1);
        }
    }else{
        await redis.set(`login-${userId}-${today}`, parseInt(userTodayLoginCount) + 1);
        await redis.expire(`login-${userId}-${today}`, 60 * 60 * 24);
    }

    //disconnect redis
    await redis.disconnect();
}

module.exports = loginCount;