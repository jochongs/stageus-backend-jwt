const router = require('express').Router();
const {Client} = require('pg');
const pgConfig = require('../config/pg_config');
const loginAuthCheck = require('../module/login_auth_check');


//댓글의 db데이터를 가져오는 api
router.get('/',(req,res)=>{
    //FE로 받을 데이터
    const postIdx = req.query.postIdx;

    //FE로 보내줄 데이터
    const result = {
        state : true,
        error : {
            DB : false,
            errorMessage : ""
        },
        data : []
    }

    //sql문 준비
    const sql = `SELECT comment_idx,post_idx,comment_contents,comment_date,nickname,comment_author FROM backend.comment JOIN backend.account ON comment_author=id WHERE post_idx = $1 ORDER BY comment_idx DESC`;

    //DB 준비 
    try{
        const client = new Client(pgConfig);
        client.connect((err)=>{
            if(err) console.log(err);
        })
        client.query(sql,[postIdx],(err,data)=>{
            if(err){
                console.log(err);
                result.state = false;
                result.error.DB = true;
                result.error.errorMessage = "DB 에러가 발생했습니다.";
                delete result.data;        
            }else{
                result.data = data.rows;
                delete result.error;
            }
            res.send(result);
        })
    }catch(err){
        result.state = false;
        result.error.DB = true;
        result.error.errorMessage = "DB 에러가 발생했습니다.";
        delete result.data;
        res.send(result);
    }
});

//comment에 데이터 삽입 api
router.post('/',loginAuthCheck,(req,res)=>{
    //FE에서 받아온 값
    const author = req.session.userId;
    const postIdx = req.query.postIdx;
    const contents = req.body.contents;

    //FE에 보낼 값
    const result = {
        state : true,
        error : {
            DB : false,
            auth : true
        }
    }

    if(contents.length === 0){ //입력값 예외상황
        result.state = false;
        result.error.errorMessage = [{
            class : "contents",
            message : "내용을 입력해야합니다."
        }]
        res.send(result);
    }else{ 
        //sql준비
        const sql = `INSERT INTO backend.comment (comment_author,comment_contents,post_idx) VALUES ($1,$2,$3)`;
        const params = [req.session.userId, contents, postIdx];

        //DB연결
        try{
            const client = new Client(pgConfig);
            client.connect((err)=>{
                if(err) console.log(err);
            })
            client.query(sql,params,(err)=>{
                if(err){
                    result.state = false;
                    result.error.DB = true;
                    result.error.errorMessage = "DB에러가 발생헀습니다.";
                }else{
                    delete result.error;
                }
                res.send(result);
            })
        }catch{
            result.state = false;
            result.error.DB = true;
            result.error.errorMessage = "DB에러가 발생헀습니다.";
            res.send(result);
        }
    }
})

//comment 수정 api
router.put('/:commentIdx',loginAuthCheck,(req,res)=>{
    //FE에서 받아온 데이터
    const commentIdx = req.params.commentIdx;
    const userId = req.session.userId;
    const contents = req.body.contents;

    //FE에 줄 데이터
    const result = {
        state : true,
        error : {
            DB : false,
            auth : true,
            errorMessage : ""
        }
    }

    if(contents.length === 0){
        result.state = false;
        delete result.error.errorMessage;
        result.error.errorMessage = [];
        result.error.errorMessage.push({
            class : "contents",
            message : "내용을 입력해야합니다."
        })
        res.send(result);
    }else{
        //sql준비
        const sql = `SELECT comment_author FROM backend.comment WHERE comment_idx=$1`;
        const params = [commentIdx];

        //DB 연결
        const client = new Client(pgConfig);
        client.connect((err)=>{
            if(err) console.log(err);
        })
        client.query(sql,params,(err,data)=>{
            if(err){
                console.log(err);
                result.state = false;
                result.error.DB = true;
                result.error.errorMessage = "DB에러가 발생했습니다.";
                res.send(result);
            }else{
                if(userId === data.rows[0].comment_author || req.session.authority === 'admin'){
                    //sql준비
                    const sql2 = `UPDATE backend.comment SET comment_contents=$1 WHERE comment_idx = $2`;
                    const params = [contents,commentIdx];

                    //DB연결
                    client.query(sql2,params,(err2)=>{
                        if(err2){
                            console.log(err2);
                            result.state = false;
                            result.error.DB = true;
                            result.error.errorMessage = "DB에러가 발생했습니다.";
                        }else{
                            delete result.error;
                        }
                        res.send(result);
                    })
                }else{
                    result.state = false;
                    result.error.auth = false;
                    result.error.errorMessage = "접근 권한이 없습니다.";
                    res.send(result);
                }
            }
        })
    }
})


//comment 삭제 api
router.delete('/:commentIdx',loginAuthCheck,(req,res)=>{
    //FE로부터 받은 데이터
    const commentIdx = req.params.commentIdx;
    const userId = req.session.userId;

    //FE로 보내줄 데이터
    const result = {
        state : true,
        error : {
            DB : false,
            auth : true,
            errorMessage : ""
        }
    }

    //sql준비
    const sql = `SELECT comment_author FROM backend.comment WHERE comment_idx=$1`;
    const params = [commentIdx];

    //DB연결
    try{
        const client = new Client(pgConfig);
        client.connect((err)=>{
            if(err) console.log(err);
        })
        client.query(sql,params,(err,data)=>{
            if(err){
                console.log(err);
                result.state = false;
                result.error.DB = true;
                result.error.errorMessage = "DB에러가 발생했습니다.";
                res.send(result);
            }else{
                if(userId === data.rows[0].comment_author || req.session.authority === 'admin'){
                    //sql 준비
                    const sql2 = 'DELETE FROM backend.comment WHERE comment_idx=$1';
                    
                    client.query(sql2,params,(err2)=>{
                        if(err2){
                            console.log(err2);
                            result.state = false;
                            result.error.DB = true;
                            result.error.errorMessage = "DB에러가 발생했습니다.";
                        }else{
                            delete result.error;
                        }
                        res.send(result);
                    })
                }else{
                    result.state = false;
                    result.error.errorMessage = "DB에러가 발생했습니다.";
                    res.send(result);
                }
            }
        })
    }catch{
        result.state = false;
        result.error.DB = true;
        result.error.errorMessage = "DB에러가 발생했습니다.";
        res.send(result);
    }
})

module.exports = router;