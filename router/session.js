const router = require('express').Router();
const pgConfig = require('../config/pg_config');
const { Client } = require('pg');
const logging = require('../module/logging');


//로그인된 사용자의 아이디
router.get('/',(req,res)=>{
    if(req.session.userId === undefined){
        res.send({state : false});
    }else{
        if(req.session.authority === 'admin'){
            res.send({
                state : true,
                id : req.session.userId,
                authority : 'admin'
            })
        }else{
            res.send({
                state : true,
                id : req.session.userId
            })   
        }
    }
})

//로그인 시도 api
router.post('/',(req,res)=>{
    //FE로부터 받아오는 값
    const idValue = req.body.id;
    const pwValue = req.body.pw;

    //FE로 보낼 값
    const result = {
        state : false
    }

    //DB연결
    const client = new Client(pgConfig);
    client.connect((err)=>{
        if(err){
            console.log(err);
        }
    })
    const sql = `SELECT id,authority FROM backend.account WHERE id=$1 AND pw=$2`;
    client.query(sql,[idValue,pwValue],(err,data)=>{
        if(err){
            console.log(err);
            result.error = {
                DB : true,
                errorMessage : "DB 에러가 발생했습니다."
            }
        }else{
            if(data.rows.length === 0){ //아이디 비밀번호가 잘못됨
                result.error = {
                    DB : false,
                    auth : false,
                    errorMessage : "아이디 또는 비밀번호가 잘못되었습니다."
                } 
            }else{ //모두 성공
                result.state = true;
                req.session.userId = idValue;
                if(data.rows[0].authority === 'admin'){
                    req.session.authority = 'admin';
                }
            }
        }
        res.send(result);
    });
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