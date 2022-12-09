const elastic = require('elasticsearch');
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');

//계정 가져오는 함수
const accountGet = (id) => {
    return new Promise(async (resolve, reject) => {
        const pgClient = new Client(pgConfig);
        try{
            //connect psql
            await pgClient.connect();

            //SELECT
            const selectSql = 'SELECT id, name, nickname FROM backend.account WHERE id = $1';
            const selectResult = await pgClient.query(selectSql, [id]);
            const userData = selectResult.rows;

            //resolve
            resolve(userData);
        }catch(err){
            reject(err);
        }
    });
}

//계정 이름과 닉네임 수정 함수
const accountModify = (userData, name, nickname) => {
    return new Promise(async (resolve, reject) => {
        const pgClient = new Client(pgConfig);
        try{
            //connect psql
            await pgClient.connect();

            //connect es
            const esClient = new elastic.Client({
                node : 'http://localhost:9200'
            });

            //BEGIN
            await pgClient.query('BEGIN');

            //UPDATE
            const updateSql = 'UPDATE backend.account SET name=$1, nickname = $2 WHERE id = $3';
            await pgClient.query(updateSql, [name, nickname, userData.id]);

            //update nickname in post index
            await esClient.updateByQuery({
                index : 'post',
                body : {
                    script : {
                        lang : 'painless',
                        source : `ctx._source.nickname = "${nickname}";`
                    },
                    query : {
                        match : {
                            post_author : userData.id
                        }
                    }
                }
            })

            //COMMIT
            await pgClient.query('COMMIT');

            //resolve
            resolve(1);
        }catch(err){
            reject(err);
        }
    });
}

module.exports = {
    accountGet : accountGet,
    accountModify : accountModify
}