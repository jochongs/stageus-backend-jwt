const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');

module.exports = (req, res, next) => {
    //FE에서 받은 값
    const token = req.signedCookies.token || "";

    //FE로 보낼 값
    const result = {};
    let statsuCode = 200;

    //어드민 권한 확인
    try{
        //check token
        const userData = jwt.verify(token, SECRET_KEY);

        //check authority 
        if(userData.authority === 'admin'){
            next();
            return;
        }else{
            statsuCode = 403;
        }
    }catch(err){
        console.log(err)

        statsuCode = 401;
    }

    //응답
    res.status(statsuCode).send(result);
}