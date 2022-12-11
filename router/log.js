const router = require('express').Router();
const mongodb = require('mongodb').MongoClient;

router.get('/all', async (req, res) => {
    //요청 준비
    const {userId, api, method, order, only, start_date, end_date, page} = req.query;
    const limit = 30;

    //FE로 보내줄 데이터 준비
    const result = {};
    let statsuCode = 200;

    //쿼리 준비
    const query = {}
    const date = {}
    let skip = 0;
    if(page !== undefined){
        skip = page*limit;
    }
    if(userId !== undefined){
        query.userId = userId;
    }
    if(method !== undefined){
        query.method = method;
    }
    if(api !== undefined){
        query.api = api;
    }
    if(start_date !== undefined){
        date.$gte = new Date(start_date).toISOString();
    }
    if(end_date !== undefined){
        date.$lt = new Date(end_date).toISOString();
    }
    if(start_date !== undefined || end_date !== undefined){
        query.date = date;
    }

    //프로젝션 준비
    const projection = {
        _id : 0,
        ip : 0,
    }

    //정렬준비
    let sort = {
        "req.time" : -1
    }
    if(order !== 'desc'){ 
        sort = {
            "req.time" : 1
        }
    }

    //로깅 데이터 가져오기
    try{
        const DB = await mongodb.connect("mongodb://localhost:27017");
        const logData =  await DB.db('stageus').collection("log").find(query,{projection : projection}).skip(skip).limit(limit).sort(sort).toArray();
        result.data = logData;
        DB.close();
    }catch(err){
        console.log(err);

        result.message = 'unexpected error occured';
        statsuCode = 409;
    }   

    //응답
    res.status(statsuCode).send(result);
})

module.exports = router;