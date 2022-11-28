const redis = require('redis').createClient();
const { Client } = require('pg');
require('dotenv').config({ path : '../.env'});
const pgConfig = {
    user : process.env.POSTGRE_USER,
    password : process.env.POSTGRE_PASSWORD,
    host : process.env.POSTGRE_HOST,
    database : process.env.POSTGRE_DATABASE,
    post : process.env.POSTGRE_POST
}

const saveFunc = async ()=>{
    //prepare data
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() + 9 - 24);
    const yesterdayString = `${yesterday.getFullYear()}${yesterday.getMonth() + 1}${yesterday.getDate()}`;

    try{
        //redis connect
        await redis.connect();

        //GET yesterday total login count
        let yesterdayTotalLoginCount = await redis.get(`login-total-${yesterdayString}`);
        if(yesterdayTotalLoginCount === null){
            yesterdayTotalLoginCount = 0;
        }

        console.log(yesterdayString, yesterdayTotalLoginCount);

        //connect postgresql
        const pgClient = new Client(pgConfig);
        await pgClient.connect();

        //INSERT
        const insertSql = 'INSERT INTO backend.login_count (date, login_count) VALUES ($1, $2)';
        await pgClient.query(insertSql, [`${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`, yesterdayTotalLoginCount]);

        //DELETE yesterday total login count 
        await redis.del(`login-total-${yesterdayString}`);

        //disconnect redis
        await redis.disconnect();
    }catch(err){
        console.log(err);
    }
}

saveFunc();
setInterval(saveFunc, 1000 * 60 * 60 * 24);