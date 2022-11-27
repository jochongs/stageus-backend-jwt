const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');

module.exports = (req, res, next) => {
    //FE에서 받은 값
    const token = req.signedCookies.token;

    //FE로 보내줄 값
    const result = {
        success : false,
        auth : false,
        code : 200
    }

    try{    
        //check token
        req.userData = jwt.verify(token, SECRET_KEY);

        next();
    }catch(err){
        //send result
        res.send(result);
    }
}