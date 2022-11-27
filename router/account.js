const router = require('express').Router();
const testRegExp = require('../module/reg_exp');
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');
const loginAuthCheck = require('../module/login_auth_check');
const jwt = require('jsonwebtoken');

const SECRET_KEY = require('../config/jwt_secret_key');

//api ===============================================================================
//모든 계정 데이터를 가져오는 API (테스트가 필요합니다.)
router.get('/all', async (req, res) => {
    //FE로 받은 데이터
    const token = req.signedCookies.token;

    //FE로 보낼 데이터 준비
    const result = {
        success : false,
        data : [],
        auth : false,
        code : 200
    }

    try{
        const userData = jwt.verify(token, SECRET_KEY);

        //관리자만 요청 할 수 있음
        if(userData.authority === 'admin'){

            //DB연결
            const client = new Client(pgConfig);
            try{

                await client.connect();

                //SELECT
                const sql = 'SELECT * FROM backend.account';
                const selectData = await client.query(sql);
                
                //send result
                result.success = true;
                result.data = selectData.rows;
                result.auth = true;
                res.send(result);
            }catch(err){

                console.log(err);

                //send result
                result.success = false;
                result.code = 500;
                result.auth = true;
                res.send(result);
            }
        }else{
            throw "no auth";
        }
    }catch(err){
        console.log(err);
        
        //send result
        result.success = false;
        result.code = 200;
        result.auth = false;
        res.send(result);
    }
})

//회원정보 요청 api 
router.get('/:userId', loginAuthCheck, async (req, res) => {
    //FE로 부터 받을  값
    const userId = req.params.userId;
    const token = req.signedCookies.token;

    //FE로 보내줄 값
    const result = {
        success : false,
        data : [],
        auth : false,
        code : 500
    }
    
    try{
        //check token
        const userData = jwt.verify(token, SECRET_KEY);
        
        //권한 확인
        if(userData.id === userId || userData.authority === 'admin'){   
            //DB연결
            const client = new Client(pgConfig);
            try{
                await client.connect();

                //SELECT
                const sql = 'SELECT id,name,nickname FROM backend.account WHERE id=$1';
                const selectData = await client.query(sql,[userId]);

                //send result
                result.success = true;
                result.data = selectData.rows;
                result.code = 200;
                result.auth = true;
                res.send(result);
            }catch(err){
                console.log(err);

                //send result
                result.success = false;
                result.code = 500;
                result.auth = true;
                delete result.data;
                res.send(result);
            }
        }else{
            throw "no auth";
        }
    }catch(err){
        console.log(err);

        //send reuslt
        result.success = false;
        result.code = 200;
        result.auth = false;
        delete result.data;
        res.send(result);
    }
})

//회원정보 시도 api (회원가입 api)
router.post('/', async (req, res) => { 
    //FE에서 데이터 받기
    const idValue = req.body.id;
    const pwValue = req.body.pw;
    const pwCheckValue = req.body.pwCheck;
    const nameValue = req.body.name;
    const nicknameValue = req.body.nickname;

    //FE로 보내줄 데이터
    const result = {
        success : true,
        errorMessage : [],
        auth : true,
        code : 500
    }

    //에러메세지 목록
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
    if(!testRegExp(idValue, 'id')){ //id RegExp error 
        const tempObj = {
            class : "id",
            message : errorMessage.id.regError
        }
        result.success = false; 
        result.errorMessage.push(tempObj);
    }
    if(!testRegExp(pwValue, 'pw')){ //pw RegExp error
        const tempObj = {
            class : "pw",
            message : errorMessage.pw.regError
        }
        result.success = false;
        result.errorMessage.push(tempObj);
    }
    if(pwCheckValue !== pwValue){ //if pwCheckValue is different from pw
        const tempObj = {
            class : "pw_check",
            message : errorMessage.pwCheck.difPwError
        }
        result.success = false;
        result.errorMessage.push(tempObj);
    }
    if(!testRegExp(nameValue, 'name')){ //name RegExp error
        const tempObj = {
            class : "name",
            message : errorMessage.name.regError
        }
        result.success = false;
        result.errorMessage.push(tempObj);
    }
    if(!testRegExp(nicknameValue, 'nickname')){ //nickname RegExp error
        const tempObj = {
            class : "nickname",
            message : errorMessage.nickname.regError
        }
        result.success = false;
        result.errorMessage.push(tempObj);
    }
    
    //예외처리 통과
    if(result.success){ //예외 상황이 발생하지 않을 시
        //DB 연결
        const client = new Client(pgConfig);
        try{
            await client.connect();

            //INSERT
            const sql = `INSERT INTO backend.account VALUES ($1,$2,$3,$4)`;
            await client.query(sql,[idValue,pwValue,nameValue,nicknameValue]);
            
            //send result
            result.success = true;
            result.auth = true;
            result.code = 200;
            delete result.errorMessage;
            res.send(result);
        }catch(err){
            //아이디 중복
            if(err.code === '23505'){
                result.state = false;
                const tempObj = {
                    class : "id",
                    message : "이미 있는 아이디입니다."
                }
                result.errorMessage.push(tempObj);
            }else{
                console.log(err);
            }

            //send result
            result.success = false;
            result.auth = true;
            result.code = 500;
            res.send(result);
        }
    }else{ //예외 상황 발생 시
        res.send(result);
    }
})

router.put('/:userId', loginAuthCheck, async (req, res) => {
    //FE에서 받은 값
    const userId = req.params.userId;
    const nameValue = req.body.name;
    const nicknameValue = req.body.nickname;
    const token = req.signedCookies.token;

    //FE로 보내줄 값    
    const result = {
        success : true,
        errorMessage : [],
        auth : false,
        code : 500,
    }

    //Input 예외처리
    if(!testRegExp(nameValue,'name')){
        result.success = false;
        result.errorMessage.push({
            class : "name",
            message : "이름 형식이 맞지 않습니다."
        })
    }
    if(!testRegExp(nicknameValue,'nickname')){
        result.success = false;
        result.errorMessage.push({
            class : "nickname",
            message : "닉네임 형식이 맞지 않습니다."
        })
    }

    //input 예외에 걸렸는지 확인
    if(result.success){
        try{
            //check token
            const userData = jwt.verify(token, SECRET_KEY);

            //check authority 
            if(userId === userData.id || userData.authority === 'admin'){
                const client = new Client(pgConfig);
                try{

                    await client.connect();
                    //UPDATE
                    const sql = `UPDATE backend.account SET name=$1 ,nickname=$2 WHERE id=$3`;
                    const params = [nameValue,nicknameValue,userId];
                    await client.query(sql,params);

                    //send result
                    result.success = true;
                    delete result.errorMessage;
                    result.auth = true;
                    result.code = 200;
                    res.send(result);
                }catch(err){
                    console.log(err);

                    //send result;
                    result.success = false;
                    result.auth = true;
                    result.code = 500;
                    delete result.errorMessage;
                }
            }else{
                throw "no auth";
            }
        }catch(err){
            //send result
            result.success = false;
            result.auth = false;
            delete result.errorMessage;
            result.code = 200;
            res.send(result);
        }
    }else{
        res.send(result);
    }
})

module.exports = router;