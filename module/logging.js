const mongodb = require('mongodb').MongoClient;
const url = require('url');

const logging = async (req,res,result) =>{
    //url 데이터 준비
    const urlObj = url.parse(req.originalUrl);

    //데이터 준비
    const reqObj = {
        type : "request",
        time : req.date,
        body : req.body,
    }
    const resObj = {
        type : "response",
        time : new Date(),
        code : res.statusCode,
        result : result
    }
    const obj = {
        userId : req.session.userId !== undefined ? req.session.userId : "",
        method : req.method,
        api : urlObj.pathname,
        queryString : urlObj.query,
        ip : req.ip,
        req : reqObj,
        res : resObj
    }

    //DB연결 후 삽입
    try{
        const DB = await mongodb.connect("mongodb://localhost:27017");
        await DB.db('stageus').collection("log").insertOne(obj);
        DB.close();    
    }catch(err){
        const DB = await mongodb.connect("mongodb://localhost:27017");
        await DB.db('stageus').collection("log_error").insertOne({
            time : new Date(),
            err : err,
            obj : obj
        });
        console.log(err);
        DB.close();    
    }
}

module.exports = logging;