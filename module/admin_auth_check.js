const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');

module.exports = (req, res, next) => {
    //FE에서 받은 값
    const token = req.headers.authorization;

    //FE로 보낼 값
    const result = {
        success : false,
        auth : false,
        code : 200
    }

    try{
        //check token
        const userData = jwt.verify(token, SECRET_KEY);

        //check authority 
        if(userData.authority === 'admin'){
            next();
        }else{
            res.redirect('/');
        }
    }catch(err){
        console.log(err)

        //send result
        res.send(result)
    }
}