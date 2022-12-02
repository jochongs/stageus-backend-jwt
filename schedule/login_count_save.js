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
    const yesterdayString = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

    try{
        //connect postgresql
        const pgClient = new Client(pgConfig);
        await pgClient.connect();

        //SELECT yesterday login count
        const selectSql = 'SELECT * FROM backend.login_count WHERE date = $1';
        const psqlLoginCount = await pgClient.query(selectSql, [yesterdayString]);

        //check data existence
        if(psqlLoginCount.rows.length > 0){
            return 0;
        }

        //redis connect
        await redis.connect();

        //GET yesterday total login count
        const yesterdayTotalLoginCount = await redis.get('today_login');

        //INSERT
        const insertSql = 'INSERT INTO backend.login_count (date, login_count) VALUES ($1, $2)';
        await pgClient.query(insertSql, [yesterdayString, yesterdayTotalLoginCount]);

        //DEL key
        await redis.del('today_login');

        //disconnect redis
        await redis.disconnect();
    }catch(err){
        console.log(err);
    }
}






//set today
const today = new Date();
today.setHours(today.getHours() + 9);

//set tomorrow ( 00 : 00 )
const tomorrow = new Date();
tomorrow.setHours(tomorrow.getHours() + 9);
tomorrow.setDate(today.getDate() + 1);
tomorrow.setHours(0);
tomorrow.setMinutes(0);

setTimeout(()=>{
    saveFunc();
    setInterval(saveFunc, 1000 * 60 * 60 * 24);
}, tomorrow.getTime() - today.getTime());