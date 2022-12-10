const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');

module.exports = (req, res, next) => {
    //FE에서 받은 값
    const token = req.signedCookies.token;

    //FE로 보내줄 값
    const result = {};

    //토큰 확인하기
    try{    
        if(token){
            req.userData = jwt.verify(token, SECRET_KEY);
        }else{
            throw {
                message : "token expired"
            }
        }

        next();
    }catch(err){
        result.message = err.message;
        res.status(401).send(result);
    }
}