const redis = require('redis').createClient();

const loginCount = async (userId) => {
    //prepare data
    const date = new Date();
    date.setHours(date.getHours() + 9);
    const todayString = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;

    //set tomorrow ( 00 : 02 )
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 9);
    tomorrow.setDate(date.getDate() + 1);
    tomorrow.setHours(0);
    tomorrow.setMinutes(2);
    const secondDif = (tomorrow.getTime() - date.getTime()) / 1000;

    console.log(`delete login data on redis after ${secondDif} || user ${userId}`);

    //connect redis
    await redis.connect();
    
    //get todayString user login
    const userTodayLoginCount = await redis.get(`login-${userId}-${todayString}`);

    //check user login state
    if(userTodayLoginCount === null){
        //set user login state 1
        await redis.set(`login-${userId}-${todayString}`, 1);
        await redis.expire(`login-${userId}-${todayString}`, secondDif);

        //todayString total login count 
        const todayTotalLoginCount = await redis.get(`login-total-${todayString}`);

        //check todayString total login count existence
        if(todayTotalLoginCount === null){
            await redis.set(`login-total-${todayString}`, 1);
        }else{
            await redis.set(`login-total-${todayString}`, parseInt(todayTotalLoginCount) + 1);
        }
    }else{
        //set user login count + 1
        await redis.set(`login-${userId}-${todayString}`, parseInt(userTodayLoginCount) + 1);
        await redis.expire(`login-${userId}-${todayString}`, secondDif);
    }

    //disconnect redis
    await redis.disconnect();
}

module.exports = loginCount;