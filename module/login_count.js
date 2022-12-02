const redis = require('redis').createClient();

const loginCount = async (userId) => {
    //connect redis
    await redis.connect();
    
    //get todayString user login
    await redis.SADD('today_login', userId);

    //disconnect redis
    await redis.disconnect();
}

module.exports = loginCount;