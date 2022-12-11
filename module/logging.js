const mongodb = require('mongodb').MongoClient;
const url = require('url');

const logging = async (req, res, result) => {
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
        userId : req.session?.userId || "",
        method : req.method,
        api : urlObj.pathname,
        queryString : urlObj.query,
        ip : req.ip,
        req : reqObj,
        res : resObj
    }

    try{
        //INSERT
        const DB = await mongodb.connect("mongodb://localhost:27017");
        await DB.db('stageus').collection("log").insertOne(obj);

        //CLOSE
        DB.close();    
    }catch(err){
        console.log(err);

        //INSERT
        const DB = await mongodb.connect("mongodb://localhost:27017");
        await DB.db('stageus').collection("log_error").insertOne({
            time : new Date(),
            err : err,
            obj : obj
        });

        //CLOSE
        DB.close();    
    }
}

module.exports = logging;