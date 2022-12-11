const jwt = require('jsonwebtoken');
const JWT_SCRETKEY = require('../config/jwt_secret_key');

const visitHistory = (req, res, next) => {
    const token = req.signedCookies.token;
    try{
        const userData = jwt.verify(token, JWT_SCRETKEY); 
    }catch(err){
        next();
    }
}

module.exports = visitHistory;