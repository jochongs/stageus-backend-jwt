const router = require('express').Router();
const testRegExp = require('../module/reg_exp');
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');
const loginAuthCheck = require('../module/login_auth_check');
const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');
const { accountGet, accountModify, accountAdd } = require('../module/account_control');

//api ===============================================================================
//모든 계정 데이터를 가져오는 API (사용하지 않음)
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
    const userData = req.userData;
    console.log(userId);

    //FE로 보내줄 값
    const result = {};
    let statusCode = 200;

    //계정 데이터 가져오기
    try{
        const getUserData = await accountGet(userId, userData);
        result.data = getUserData;
    }catch(err){
        console.log(err);

        result.message = err.message;
        statusCode = err.code;
    }

    //응답
    res.status(statusCode).send(result);
})

//회원정보 시도 api (회원가입 api)
router.post('/', async (req, res) => { 
    //FE에서 데이터 받기
    const accountData = {
        id : req.body.id,
        pw : req.body.pw,
        pwCheck : req.body.pwCheck,
        name : req.body.name,
        nickname : req.body.nickname
    }

    //FE로 보내줄 데이터
    const result = {
        errorMessage : []
    }
    let statusCode = 200;

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

    //데이터 예외처리
    if(!testRegExp(idValue, 'id')){ //id RegExp error 
        statusCode = 400;
        result.errorMessage.push({
            class : "id",
            message : errorMessage.id.regError
        });
    }
    if(!testRegExp(pwValue, 'pw')){ //pw RegExp error
        statusCode = 400;
        result.errorMessage.push({
            class : "pw",
            message : errorMessage.pw.regError
        });
    }
    if(pwCheckValue !== pwValue){ //if pwCheckValue is different from pw
        statusCode = 400;
        result.errorMessage.push({
            class : "pw_check",
            message : errorMessage.pwCheck.difPwError
        });
    }
    if(!testRegExp(nameValue, 'name')){ //name RegExp error
        statusCode = 400;
        result.errorMessage.push({
            class : "name",
            message : errorMessage.name.regError
        });
    }
    if(!testRegExp(nicknameValue, 'nickname')){ //nickname RegExp error
        statusCode = 400;
        result.errorMessage.push({
            class : "nickname",
            message : errorMessage.nickname.regError
        });
    }
    
    //회원가입 시도
    if(statusCode === 200){ 
        delete result.errorMessage;
        try{
            await accountAdd(accountData);
        }catch(err){
            if(err.code === 400){
                result.errorMessage.push({
                    class : 'id',
                    message : '이미 있는 아이디입니다.'
                })
                statusCode = 400;
            }else{
                result.message = err.message;
                statusCode = err.code;
            }
        }
    }

    //응답
    res.status(statusCode).send(result);
})

router.put('/:userId', loginAuthCheck, async (req, res) => {
    //FE에서 받은 값
    const userId = req.params.userId;
    const userData = req.userData;
    const nameValue = req.body.name;
    const nicknameValue = req.body.nickname;

    //FE로 보내줄 값    
    const result = {
        errorMessage : []
    }
    let statusCode = 200;

    //데이터 예외처리
    if(!testRegExp(nameValue,'name')){
        statusCode = 400;
        result.errorMessage.push({
            class : "name",
            message : "이름 형식이 맞지 않습니다."
        })
    }
    if(!testRegExp(nicknameValue,'nickname')){
        statusCode = 400;
        result.errorMessage.push({
            class : "nickname",
            message : "닉네임 형식이 맞지 않습니다."
        })
    }

    //회원 수정
    if(statusCode === 200){
        delete result.errorMessage;
        try{
            if(userData.id === userId || userData.authority === 'admin'){
                //modify
                //await accountModify(userData, nameValue, nicknameValue);
            }else{
                //set result ( no auth )
                result.success = false;
                result.auth = false;
                result.code = 401;
            }
        }catch(err){
            statusCode = err.code;
            result.message = err.message;
        }
    }
    
    //응답
    res.status(statusCode).send(result);
})

module.exports = router;