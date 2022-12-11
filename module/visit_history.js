const jwt = require('jsonwebtoken');
const JWT_SCRETKEY = require('../config/jwt_secret_key');
const { addVisitHistory } = require('../module/visit_history_control');

const visitHistory = async (req, res, next) => {
    //FE에서 받은 값
    const token = req.signedCookies.token;
    
    //방문기록 삽입
    try{
        const userData = jwt.verify(token, JWT_SCRETKEY);

        await addVisitHistory(userData.id, req.url);
    }catch(err){
        console.log(err);
    }

    //응답
    next();
}

module.exports = visitHistory;