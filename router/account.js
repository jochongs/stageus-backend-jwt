const router = require('express').Router();
const testRegExp = require('../module/reg_exp');
const path = require('path');
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');
const loginAuthCheck = require('../module/login_auth_check');

//api ===============================================================================
//모든 계정 데이터를 가져오는 API
router.get('/all',(req,res)=>{
    //FE로 보낼 데이터 준비
    const result = {
        state : false,
        error : {
            DB : false,
            auth : true,
            errorMessage : ""
        }
    }

    //관리자만 요청 할 수 있음
    if(req.session.authority === 'admin'){
        //sql준비
        const sql = 'SELECT * FROM backend.account';

        //DB연결
        try{
            const client = new Client(pgConfig);
            client.connect((err)=>{
                if(err) console.log(err);
            })
            client.query(sql,(err,data)=>{
                if(err){
                    result.state = false;
                    result.error.DB = true;
                    result.error.errorMessage = "DB에러가 발생했습니다.";
                }else{
                    result.state = true;
                    delete result.error;
                    result.data = data.rows;
                }
                res.send(result);
            })
        }catch{
            result.state = false;
            result.error.DB = true;
            result.error.errorMessage = "DB에러가 발생했습니다.";
            res.send(result);
        }
    }else{
        result.state = false;
        result.error.auth = false;
        result.error.errorMessage = "접근 권한이 없습니다.";
        res.send(result);
    }
})

//회원정보 요청 api 
router.get('/:userId',loginAuthCheck,(req,res)=>{
    //FE로 부터 받을  값
    const userId = req.params.userId;

    //FE로 보내줄 값
    const result = {
        state : true,
        error : {
            DB : false,
            auth : true,
            erorrMessage : ""
        }
    }

    if(req.session.userId === userId || req.session.authority === 'admin'){
        //sql준비
        const sql = 'SELECT id,name,nickname FROM backend.account WHERE id=$1';
        const params = [userId];

        //DB연결
        try{
            const client = new Client(pgConfig);
            client.connect((err)=>{
                if(err) console.log(err);
            })
            client.query(sql,params,(err,data)=>{
                if(err){
                    result.state = false;
                    result.error.DB = true;
                    result.error.errorMessage = "DB에러가 발생했습니다.";        
                }else{
                    result.state = true;
                    delete result.error;
                    result.data = data.rows;
                }
                res.send(result);
            })
        }catch{
            result.state = false;
            result.error.DB = true;
            result.error.errorMessage = "DB에러가 발생했습니다.";        
            res.send(result);
        }
    }else{
        result.state = false;
        result.error.DB = false;
        result.error.auth = false;
        result.error.errorMessage = "접근권한이 없습니다.";
        res.send(result);
    }
})
//회원정보 시도 api (회원가입 api)
router.post('/', (req,res)=>{
    //get input data
    const idValue = req.body.id;
    const pwValue = req.body.pw;
    const pwCheckValue = req.body.pwCheck;
    const nameValue = req.body.name;
    const nicknameValue = req.body.nickname;

    console.log(pgConfig);

    const result = {
        state : true,
        error : {
            DB :false,
            errorMessage : []
        }
    }

    const errorMessage = {
        id : {
            regError : "아이디는 영문자로 시작하는 영문자 또는 숫자 6~12자이어야 합니다."
        },
        pw : {
            regError : "비밀번호는 8~12자의 영문과 숫자의 조합이여야 합니다. "
        },
        pwCheck : {
            difPwError : "비밀번호와 다릅니다."
        },
        name : {
            regError : "이름은 2~6글자의 한글 또는 영문자이어야 합니다."
        },
        nickname : {
            regError : "닉네임은 2~12글자의 한글 또는 영문자이어야 합니다."
        }
    }

    //exception
    if(!testRegExp(idValue,'id')){ //id RegExp error 
        const tempObj = {
            class : "id",
            message : errorMessage.id.regError,
        }
        result.state = false; 
        result.error.errorMessage.push(tempObj);
    }
    if(!testRegExp(pwValue,'pw')){ //pw RegExp error
        const tempObj = {
            class : "pw",
            message : errorMessage.pw.regError,
        }
        result.state = false;
        result.error.errorMessage.push(tempObj);
    }
    if(pwCheckValue !== pwValue){ //if pwCheckValue is different from pw
        const tempObj = {
            class : "pw_check",
            message : errorMessage.pwCheck.difPwError,
        }
        result.state = false;
        result.error.errorMessage.push(tempObj);
    }
    if(!testRegExp(nameValue,'name')){ //name RegExp error
        const tempObj = {
            class : "name",
            message : errorMessage.name.regError,
        }
        result.state = false;
        result.error.errorMessage.push(tempObj);
    }
    if(!testRegExp(nicknameValue,'nickname')){ //nickname RegExp error
        const tempObj = {
            class : "nickname",
            message : errorMessage.nickname.regError,
        }
        result.state = false;
        result.error.errorMessage.push(tempObj);
    }
    
    if(result.state){ //예외 상황이 발생하지 않을 시
        const client = new Client(pgConfig);
        client.connect((err)=>{
            if(err){
                console.log(err);
            }
        });
        const sql = `INSERT INTO backend.account VALUES ($1,$2,$3,$4)`;
        try{
            client.query(sql,[idValue,pwValue,nameValue,nicknameValue],(err,results)=>{
                if(err){
                    console.log(err.code);
                    if(err.code === '23505'){
                        result.state = false;
                        const tempObj = {
                            class : "id",
                            message : "이미 있는 아이디입니다."
                        }
                        result.error.errorMessage.push(tempObj);
                    }else{
                        result.state = false;
                        result.error.DB = true;
                        result.error.errorMessage = "DB에러가 발생했습니다.";
                    }
                }
                res.send(result);
            });
        }catch{ //혹시 몰라서
            result.state = false; 
            result.error.DB = true;
            result.error.DB = "DB에러가 발생했습니다.";
            res.send(result);
        }
    }else{ //예외 상황 발생 시
        res.send(result);
    }
})

router.put('/:userId',loginAuthCheck ,(req,res)=>{
    //FE에서 받은 값
    const userId = req.params.userId;
    const nameValue = req.body.name;
    const nicknameValue =req.body.nickname;

    //FE로 보내줄 값    
    const result = {
        state : true,
        error : {
            DB : false,
            auth : true,
            errorMessage : [] 
        }
    }

    //Input 예외처리
    if(!testRegExp(nameValue,'name')){
        result.state = false;
        result.error.errorMessage.push({
            class : "name",
            message : "이름 형식이 맞지 않습니다."
        })
    }
    if(!testRegExp(nicknameValue,'nickname')){
        result.state = false;
        result.error.errorMessage.push({
            class : "nickname",
            message : "닉네임 형식이 맞지 않습니다."
        })
    }

    //input 예외에 걸렸는지 확인
    if(result.state){
        if(userId === req.session.userId || req.session.authority === 'admin'){
            //sql 준비
            const sql = `UPDATE backend.account SET name=$1 ,nickname=$2 WHERE id=$3`;
            const params = [nameValue,nicknameValue,userId];

            //DB 연결
            const client = new Client(pgConfig);
            client.connect((err)=>{
                if(err) console.log(err);
            })
            client.query(sql,params,(err)=>{
                if(err){
                    console.log(err);
                    result.state = false;
                    result.error.DB = false;
                    result.error.errorMessage = "DB에러가 발생했습니다.";
                }else{
                    result.state = true;
                    delete result.error;
                }
                res.send(result);
            })
        }else{
            result.state = false;
            result.error.auth = false;
            delete result.error.errorMessage;
            result.error.errorMessage = "접근 권한이 없습니다.";
            res.send(result);
        }
    }else{
        res.send(result);
    }
})



//시험용 안씀
router.post('/login', async (req,res)=>{
    const client = new Client(pgConfig);
    client.connect((err)=>{
        if(err){
            console.log(err);
            return;
        }
    });
    console.log('/account/login api 호출');
    const result = {
        error : false,
        loginState : false,
    }

    const idValue = req.body.id;
    const pwValue =req.body.pw;
    
    const sql = "SELECT * FROM backend.account WHERE id=$1 AND pw=$2";
    const values = [idValue,pwValue];
    client.query(sql,values,(err,data)=>{
        if(err){
            console.log(err);
            res.send(result);
            return;
        }else{
            const row = data.rows;
            console.log(row);
            if(row.length != 0){
                result.loginState = true;
            }
            res.send(result);
        }
    })
})

module.exports = router;