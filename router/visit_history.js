const router = require('express').Router();
const { getVisitHistory } = require('../module/visit_history_control');

router.get('/', async (req, res) => {
    //FE에서 받은 값
    const userId = req.query.id;

    //FE로 보낼 값
    const result = {};
    let statusCode = 200;

    //방문 기록 가져오기
    try{
        result.data = await getVisitHistory(userId);
    }catch(err){
        console.log(err);
        
        result.message = err.message;
        statusCode = err.code;
    }

    //응답
    res.status(statusCode).send(result);
})

module.exports = router;