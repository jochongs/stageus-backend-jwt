const router = require('express').Router();
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');
const loginAuth = require('../module/login_auth_check');
const postImgUploadMiddleware = require('../module/post_img_upload');
const s3 = require('../module/s3');
const searchKeywordSave = require('../module/search_keyword_save');
const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');
const { postAdd, postModify } = require('../module/post_control');

//게시글 검색 api
router.get('/search', async (req, res) => {
    //prepare data
    const searchKeyword = req.query.keyword;
    let userData = null;
    try{
        userData = req.signedCookies.token !== undefined ? jwt.verify(req.signedCookies.token, SECRET_KEY) : null;
    }catch{
        userData = null;
    }
    
    //FE로 보낼 값
    const result = {
        success : true,
        code : 200,
        auth : true,
        data : []
    }

    if(userData?.id !== undefined){
        searchKeywordSave(searchKeyword, userData.id);
    }

    try{
        const client = new Client(pgConfig);
        await client.connect();

        //SELECT query
        sql = `SELECT 
                    DISTINCT ON 
                        (backend.post.post_idx) 
                    backend.post.post_idx,
                    post_title,
                    post_contents,
                    post_date,
                    post_author,
                    nickname,
                    img_path
                FROM
                    backend.post 
                JOIN 
                    backend.account 
                ON 
                    id=post_author
                LEFT JOIN 
                    backend.post_img_mapping
                ON 
                    backend.post.post_idx = backend.post_img_mapping.post_idx
                WHERE
                    post_title
                LIKE
                    $1
                ORDER BY 
                    post_idx DESC
                `;
        const selectData = await client.query(sql,[`%${searchKeyword}%`]);

        //add search keyword
        //searchKeywordSave(searchKeyword)

        //send result
        result.data = selectData.rows;
        res.send(result);
    }catch(err){
        console.log(err)
        
        //res.send
        result.success = false;
        result.code = 500;
        res.send(result);
    }
})

//게시글 받아오기 api
router.get('/:option', async (req, res) => {
    //prepare data
    const option = req.params.option;

    //FE로 보낼 값
    const result ={
        success : true,
        code : 200,
        auth : true,
        data : []
    }

    //sql 준비
    let sql = "";
    let params = [];
    if(option === 'all'){
        //post all
        sql = `SELECT 
                    DISTINCT ON 
                        (backend.post.post_idx) 
                    backend.post.post_idx,
                    post_title,
                    post_contents,
                    post_date,
                    post_author,
                    nickname,
                    img_path
                FROM
                    backend.post 
                JOIN 
                    backend.account 
                ON 
                    id=post_author
                LEFT JOIN 
                    backend.post_img_mapping
                ON 
                    backend.post.post_idx = backend.post_img_mapping.post_idx
                ORDER BY 
                    post_idx DESC`;
    }else{
        //specific post
        sql = `SELECT 
                    post_title,
                    post_contents,
                    post_date,post_author,
                    nickname,
                    img_path 
                FROM 
                    backend.post 
                JOIN 
                    backend.account 
                ON 
                    id=post_author 
                LEFT JOIN 
                    backend.post_img_mapping 
                ON 
                    backend.post.post_idx=backend.post_img_mapping.post_idx  
                WHERE 
                    backend.post.post_idx=$1`;
        params.push(option);
    }

    //connect DB
    const client = new Client(pgConfig);
    try{
        await client.connect();

        //SELECT post data
        const selectData = await client.query(sql,params);
        
        //send result
        result.data = selectData.rows;
        res.send(result);
    }catch(err){
        console.log(err);

        //res.send
        result.success = false;
        result.code = 500;
        res.send(result);
    }
})

//게시글 쓰기 api
router.post('/', loginAuth, postImgUploadMiddleware, async (req,res)=>{
    //FE로부터 값 받기
    const postData = {
        title : req.body.title,
        contents : req.body.contents,
        author : req.userData.id,
        fileArray : req.files
    }

    //FE로 보내줄 값
    const result = {
        success : true,
        code : 200,
        auth : true,
        errorMessage : []
    }

    //body data의 입력 길이 검사
    if(postData.title.length === 0 || postData.title.length > 32){
        result.success = false;   
        result.errorMessage.push({
            class : 'title',
            message : "제목의 길이는 1~32자여야 합니다."
        });
    }
    if(postData.contents.length === 0){
        result.success = false;   
        result.errorMessage.push({
            class : 'contents',
            message : "글의 내용은 필수 사항입니다."
        });
    }

    //Check data exception
    if(result.success){
        delete result.errorMessage;

        //ADD post data
        try{
            await postAdd(postData);
        }catch(err){
            console.log(err);

            //set result
            result.success = false;
            result.code = 500;
        }
    }
    res.send(result);
});

//게시글 수정
router.put('/:postIdx', loginAuth, async (req, res) => {
    //FE에서 받아온 데이터
    const postIdx = req.params.postIdx;
    const postData = {
        title : req.body.title,
        contents : req.body.contents
    }

    //FE로 보내줄 데이터
    const result = {
        success : true,
        errorMessage : [],
        auth : true,
        code : 200
    }

    //데이터 검증
    if(postData.title.length === 0 || postData.contents.length > 32){
        result.success = false;
        result.errorMessage.push({
            class : "title",
            message : "제목은 0~32자여야 합니다."
        })
    }
    if(postData.contents.length === 0){
        result.success = false;
        result.errorMessage.push({
            class : "contents",
            message : "내용을 입력해야합니다."
        })
    }

    //check data exception
    if(result.success){
        delete result.errorMessage;
        
        //MODIFY post
        try{
            await postModify(postIdx, req.userData, postData);
        }catch(err){
            console.log(err);

            //set result
            result.success = false;
            result.auth = err.auth;
            result.message = err.message;
        }
    }else{
        //set result (data exception)
        result.success = false;
    }
    res.send(result);
})

//post삭제 api
router.delete('/:postIdx',loginAuth, async (req,res)=>{
    //FE에서 받은 데이터
    const postIdx = req.params.postIdx;
    const userId = req.userData.id;
    const userAuthority = req.userData.authority;

    //FE로 보내줄 데이터
    const result = {
        success : true,
        auth : true,
        code : 200
    }

    //DB연결
    const client = new Client(pgConfig);
    try{
        await client.connect();

        //select post_author, img_path 
        const sql = `SELECT post_author, img_path FROM backend.post LEFT JOIN backend.post_img_mapping ON backend.post.post_idx = backend.post_img_mapping.post_idx WHERE backend.post.post_idx=$1`;
        const selectData = await client.query(sql,[postIdx]);
        const postAuthor = selectData.rows[0].post_author;
        const imgPathArray = [];
        if(selectData.rows[0].img_path !== null){
            selectData.rows.forEach((row)=>{
                imgPathArray.push(row.img_path);
            })
        }

        //check auth
        if(postAuthor === userId || userAuthority === 'admin'){
            //BEGIN
            await client.query('BEGIN');
            
            //DELETE post data
            const deletePostSql = 'DELETE FROM backend.post WHERE post_idx=$1';
            await client.query(deletePostSql,[postIdx]);

            //DELETE post_img_mapping data
            const deletePostImgMappingSql = 'DELETE FROM backend.post_img_mapping WHERE post_idx = $1';
            await client.query(deletePostImgMappingSql,[postIdx]);
            for(const imgPath of imgPathArray){
                await s3.deleteObject({
                    Bucket: 'jochong/post', 
                    Key: imgPath
                }).promise();
            }

            //COMMIT
            await client.query('COMMIT');

            //res.send
            delete result.error;
            res.send(result);
        }else{ 
            //send result
            result.success = false;
            result.auth = false;
            result.code = 200;
            res.send(result);
        }
    }catch(err){
        console.log(err);

        //ROLLBACK
        await client.query('ROLLBACK');

        //send result
        result.success = false;
        result.auth = true;
        result.code = 500;
        res.send(result);
    }
})

module.exports = router;