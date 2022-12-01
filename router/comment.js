const router = require('express').Router();
const {Client} = require('pg');
const pgConfig = require('../config/pg_config');
const loginAuthCheck = require('../module/login_auth_check');
const { addNotification } = require('../module/notification');

//댓글의 db데이터를 가져오는 api
router.get('/', async (req, res) => {
    //FE로 받을 데이터
    const postIdx = req.query.postIdx;

    //FE로 보내줄 데이터
    const result = {
        success : true,
        data : [],
        auth : true,
        code : 200
    }

    try{
        //DB connect
        const client = new Client(pgConfig);
        await client.connect();

        //SELECT comment data
        const sql = `SELECT comment_idx,post_idx,comment_contents,comment_date,nickname,comment_author FROM backend.comment JOIN backend.account ON comment_author=id WHERE post_idx = $1 ORDER BY comment_idx DESC`;
        const selectData = await client.query(sql, [postIdx]);

        //send result
        result.data = selectData.rows;
        delete result.error;
        res.send(result);
    }catch(err){
        console.log(err);

        //send result
        result.success = false;
        result.code = 500;
        delete result.data;
        res.send(result);
    }
});

//comment에 데이터 삽입 api
router.post('/', loginAuthCheck, async (req, res) => {
    //FE에서 받아온 값
    const commentAuthor = req.userData.id;
    const postIdx = req.query.postIdx;
    const contents = req.body.contents;
    const nickname = req.userData.nickname;

    //FE에 보낼 값
    const result = {
        success : true,
        errorMessage : [],
        auth : true,
        code : 200
    }

    if(contents.length === 0){ //입력값 예외상황
        result.state = false;
        result.errorMessage = [{
            class : "contents",
            message : "내용을 입력해야합니다."
        }]
        res.send(result);
    }else{ 
        try{
            //DB connect
            const client = new Client(pgConfig);
            await client.connect();

            //INSERT comment
            const sql = `INSERT INTO backend.comment (comment_author,comment_contents,post_idx) VALUES ($1,$2,$3)`;
            await client.query(sql, [commentAuthor, contents, postIdx]);

            //add notification
            addNotification([{
                code : 1,
                user : commentAuthor,
                idx : postIdx,
                contents : contents,
                nickname : nickname
            }])

            //send result
            delete result.errorMessage;
            res.send(result);
        }catch(err){
            console.log(err);

            //send result
            result.success = false;
            result.code = 500;
            delete result.errorMessage;
            res.send(result);
        }
    }
})

//comment 수정 api
router.put('/:commentIdx', loginAuthCheck, async (req, res) => {
    //FE에서 받아온 데이터
    const commentIdx = req.params.commentIdx;
    const userId = req.userData.id;
    const authority = req.userData.authority;
    const contents = req.body.contents;

    //FE에 줄 데이터
    const result = {
        success : true,
        errorMessage : [],
        auth : true,
        code : 200
    }

    //FE data check
    if(contents.length === 0){
        //send result
        result.success = false;
        result.errorMessage.push({
            class : "contents",
            message : "내용을 입력해야합니다."
        })
        res.send(result);
    }else{
        try{
            //DB connect
            const client = new Client(pgConfig);
            await client.connect();
            
            //SELECT comment author
            const sql = `SELECT comment_author FROM backend.comment WHERE comment_idx=$1`;
            const params = [commentIdx];
            const selectCommentAuthorData = await client.query(sql, params);

            //check authority 
            if(userId === selectCommentAuthorData.rows[0].comment_author || authority === 'admin'){
                //DELETE comment
                const sql2 = `UPDATE backend.comment SET comment_contents=$1 WHERE comment_idx = $2`;
                await client.query(sql2, [contents, commentIdx]);

                //send result (success)
                result.success = true;
                result.auth = true;
                delete result.errorMessage;
                res.send(result);
            }else{
                //send result (no auth)
                result.success = false;
                result.auth = false;
                delete result.errorMessage;
                res.send(result);
            }
        }catch(err){
            console.log(err);
            
            //send result (error)
            delete result.errorMessage;
            result.success = false;
            result.auth = true;
            result.code = 500;
            res.send(result);
        }
    }
})


//comment 삭제 api
router.delete('/:commentIdx', loginAuthCheck, async (req, res) => {
    //FE로부터 받은 데이터
    const commentIdx = req.params.commentIdx;
    const userId = req.userData.id;
    const userAuthority = req.userData.authority;

    //FE로 보내줄 데이터
    const result = {
        success : true,
        code : 200,
        auth : true
    }

    try{
        //DB connect
        const client = new Client(pgConfig);
        await client.connect();

        //SELECT comment author
        const sql = `SELECT comment_author FROM backend.comment WHERE comment_idx=$1`;
        const selectCommentAuthor = await client.query(sql, [commentIdx]);
        
        //check authority
        if(userId === selectCommentAuthor.rows[0].comment_author || userAuthority === 'admin'){
            //DELETE comment
            const sql2 = 'DELETE FROM backend.comment WHERE comment_idx=$1';
            await client.query(sql2, [commentIdx]);

            //send result (success)
            res.send(result);
        }else{
            //send result (no auth)
            result.success = false;
            result.auth = false;
            res.send(result);
        }
    }catch(err){
        console.log(err);

        //send result (error)
        result.success = false;
        result.code = 500;
        result.auth = true;
        res.send(result);
    }
})

module.exports = router;