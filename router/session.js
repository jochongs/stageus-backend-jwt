const router = require('express').Router();
const pgConfig = require('../config/pg_config');
const { Client } = require('pg');
const logging = require('../module/logging');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// setting ====================================================
dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET_KEY;

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
            userData.authority !== null ? result.authority = 'admin' : null;
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
        const sql = `SELECT id,authority FROM backend.account WHERE id=$1 AND pw=$2`;
        const selectData = await client.query(sql,[idValue,pwValue]);

        //check id, pw
        if(selectData.rows.length === 0){
            //send result
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

//로그아웃 api
router.delete('/',(req,res)=>{
    const result = {
        state : false
    }
    if(req.session.userId !== undefined){ //로그인이 되어있는 경우
        req.session.userId = undefined;
        result.state = true;
        result.authority = false;
    }else{
        result.state = false;
        result.error = {
            errorMessage : "이미 로그아웃이 되어있습니다."
        }
    }
    logging(req,res,result);
    res.send(result);
})


module.exports = router;