const elastic = require('elasticsearch');
const { Client } = require('pg');
require('dotenv').config({ path : '../.env'});
const pgConfig = {
    user : process.env.POSTGRE_USER,
    password : process.env.POSTGRE_PASSWORD,
    host : process.env.POSTGRE_HOST,
    database : process.env.POSTGRE_DATABASE,
    post : process.env.POSTGRE_POST
}



const saveAccountDataToEs = async () => {
    try{
        //CONNECT pg
        const pgClient = new Client(pgConfig);
        await pgClient.connect();

        //CONNECT es
        const esClient = new elastic.Client({
            node : "http://localhost:9200"
        });
        
        //SELECT 
        const selectAccountDataSql = 'SELECT * FROM backend.account';
        const accountResult = await pgClient.query(selectAccountDataSql);
        const accountDataArray = accountResult.rows;

        for(let i = 0; i < accountDataArray.length; i++){
            //prepare data
            const accountData = accountDataArray[i];

            //POST data to elasticsearch
            const response = await esClient.index({
                index : 'account',
                _id : accountData.id,
                body : {
                    id : accountData.id,
                    name : accountData.name,
                    nickname : accountData.nickname,
                    authority : accountData.authority,
                    login_type : accountData.login_type,
                }
            });

            console.log(response);
        }
    }catch(err){
        console.log(err);
    }
}

//saveAccountDataToEs();
console.log('사용하지 않기로 했습니다.');