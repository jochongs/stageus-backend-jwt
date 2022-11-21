const router = require('express').Router();
const mongodb = require('mongodb').MongoClient;

router.get('/:option', async (req, res) => {
    //요청 준비
    const {userId, api, method, order, only, start_date, end_date, page} = req.query;
    const limit = 30;

    //FE로 보내줄 데이터 준비
    const result = {
        success : true,
        auth : true
    }

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

    if(req.params.option === 'all'){
        //DB연결
        try{
            const DB = await mongodb.connect("mongodb://localhost:27017");
            const data =  await DB.db('stageus').collection("log").find(query,{projection : projection}).skip(skip).limit(limit).sort(sort).toArray();
            DB.close();

            result.data = data;
            res.send(result);
        }catch(err){
            console.log(err);

            result.success = false;
            result.errorMessage = "DB에러가 발생했습니다.";
            result.code = 500;

            res.send(result);
        }   
    }
})

module.exports = router;