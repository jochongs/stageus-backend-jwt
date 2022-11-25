const router = require('express').Router();
const pgConfig = require('../config/pg_config');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');


// session api ====================================================
//로그인된 사용자의 아이디
router.get('/', (req, res) => {
    //FE로 부터 받은 값 확인
    const token = req.headers.authorization;

    //FE로 보내줄 값 확인
    const result = {
        success : false
    }

    //auth check
    if(token === undefined){ //no auth 
        //send result
        res.send(result);
    }else{
        try{
            //verify token
            const userData = jwt.verify(token, SECRET_KEY);
            
            //send result
            result.success = true;
            result.id = userData.id;
            userData.authority !== null ? result.authority = userData.authority : null;
            res.send(result);
        }catch(err){
            //send result
            result.success = false;
            res.send(result);
        }
    }
})

//로그인 시도 api
router.post('/', async (req, res) => {
    //FE로부터 받아오는 값
    const idValue = req.body.id;
    const pwValue = req.body.pw;

    //FE로 보낼 값
    const result = {
        success : false,
        code : 200,
        auth : true,
    }

    try{
        //DB연결
        const client = new Client(pgConfig);
        await client.connect();

        //SELECT
        const sql = `SELECT id, authority, login_type FROM backend.account WHERE id=$1 AND pw=$2`;
        const selectData = await client.query(sql,[idValue,pwValue]);

        //check id, pw
        if(selectData.rows.length === 0){
            //send result ( success )
            result.success = false;
            result.code = 200;
            result.auth = false;
            res.send(result);
        }else{
            //prepare data
            const id = selectData.rows[0].id;
            const name = selectData.rows[0].name;
            const nickname = selectData.rows[0].nickname;
            const authority = selectData.rows[0].authority;
            const loginType = selectData.rows[0].login_type;

            //check login type
            if(loginType !== null){
                //send result ( another login type )
                result.success = false;
                result.code = 200;
                result.auth = false;
                result.loginType = selectData.rows[0].login_type;
                res.send(result);

                return 0;
            }

            //make token
            const token = jwt.sign(
                {
                    id : id,
                    name : name,
                    nickname : nickname,
                    authority : authority
                },
                SECRET_KEY,
                {
                    "expiresIn" : '1h',
                    'issuer' : "stageus"
                }
            );

            //send result
            result.success = true;
            result.auth = true;
            result.code = 200;
            result.token = token;
            res.send(result);
        }
    }catch(err){
        console.log(err);

        //send result
        result.success = false;
        result.auth = false;
        result.code = 500;
    }
    
    
})

module.exports = router;