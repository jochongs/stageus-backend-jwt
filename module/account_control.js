const elastic = require('elasticsearch');
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');
const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');
const loginCount = require('../module/login_count');

//계정 가져오는 함수
const accountGet = (id, userData) => {
    return new Promise(async (resolve, reject) => {
        console.log(id, userData);
        //auth check
        if(id !== userData.id && userData.authroity !== 'admin'){
            reject({
                code : 403,
                message : 'no auth'
            })
        } 
        
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
            reject({
                code : 409,
                message : 'unexpected error occured'
            })
        }
    });
}

//계정 이름과 닉네임 수정 함수 ( time out 이슈로 인해서 사용을 막아둠 )
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

const accountAdd = (accountData) => {
    return new Promise(async (resolve, reject) => {
        try{
            //DB 연결
            const client = new Client(pgConfig);
            await client.connect();

            //INSERT
            const sql = `INSERT INTO backend.account VALUES ($1,$2,$3,$4)`;
            await client.query(sql,[accountData.id, accountData.pw, accountData.name, accountData.nickname]);
            
            resolve(1);
        }catch(err){
            if(err.code === '23505'){
                result.state = false;
                result.errorMessage.push({
                    class : "id",
                    message : "이미 있는 아이디입니다."
                });
                
                reject({
                    message : 'duplicate id',
                    code : 400
                })
            }else{
                reject({
                    err : err,
                    message : 'unexpected error occured',
                    code : 409
                })
            }
        }
    });
}

const login = (idValue, pwValue) => {
    return new Promise(async (resolve, reject) => {
        //로그인 시도
        try{
            //DB연결
            const client = new Client(pgConfig);
            await client.connect();

            //SELECT
            const sql = `SELECT id, authority, login_type, name, nickname FROM backend.account WHERE id=$1 AND pw=$2`;
            const selectData = await client.query(sql,[idValue,pwValue]);

            //check id, pw
            if(selectData.rows.length === 0){
                reject({
                    code : 400,
                    message : 'failed to login'
                });
            }else{
                //prepare data
                const id = selectData.rows[0].id;
                const name = selectData.rows[0].name;
                const nickname = selectData.rows[0].nickname;
                const authority = selectData.rows[0].authority;
                const loginType = selectData.rows[0].login_type;

                //check login type
                if(loginType !== null){
                    res.cookie('token', token, loginCookieConfig);

                    reject({
                        code : 400,
                        message : 'login type error',
                        type : loginType
                    });
                }

                //make token
                const token = jwt.sign(
                    {
                        id : id,
                        nickname : nickname.trim(),
                        authority : authority,
                        name : name.trim(),
                    },
                    SECRET_KEY,
                    {
                        "expiresIn" : '1h',
                        'issuer' : "stageus"
                    }
                );

                

                //login count 
                loginCount(id);

                resolve(token);
            }
        }catch(err){
            reject({
                err : err,
                message : 'unexpected error occured',
                code : 409
            });
        }
    });
}

module.exports = {
    accountGet : accountGet,
    accountModify : accountModify,
    accountAdd : accountAdd,
    login : login
}