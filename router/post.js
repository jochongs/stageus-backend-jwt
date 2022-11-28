const router = require('express').Router();
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');
const loginAuth = require('../module/login_auth_check');
const postImgUploadMiddleware = require('../module/post_img_upload');
const s3 = require('../module/s3');
const searchKeywordSave = require('../module/search_keyword_save');

console.log(pgConfig);

//게시글 받아오기 api
router.get('/:option', async (req, res) => {
    //option값 가져오기
    const option = req.params.option;
    const searchKeyword = req.query.keyword;

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
    }else if(searchKeyword?.length !== 0 && option === 'search'){
        //search post
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
        params.push(`%${searchKeyword}%`);
        searchKeywordSave(searchKeyword);
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
    const {title : titleValue, contents : contentsValue, imgFileArray} = req.body;
    const postAuthor = req.userData.id;

    //FE로 보내줄 값
    const result = {
        success : true,
        code : 200,
        auth : true,
        errorMessage : []
    }

    //body data의 입력 길이 검사
    if(titleValue.length === 0 || titleValue.length > 32){
        result.success = false;   
        result.errorMessage.push({
            class : 'title',
            message : "제목의 길이는 1~32자여야 합니다."
        });
    }
    if(contentsValue.length ===0){
        result.success = false;   
        result.errorMessage.push({
            class : 'contents',
            message : "글의 내용은 필수 사항입니다."
        });
    }

    //예외사항 없으면
    if(result.success){        
        const client = new Client(pgConfig);
        try{
            //DB연결
            await client.connect();
            
            //BEGIN
            await client.query('BEGIN');

            //INSERT post data
            const sql = `INSERT INTO backend.post (post_title,post_contents,post_author) VALUES ($1,$2,$3) RETURNING post_idx`;
            const valueArray = [titleValue, contentsValue, postAuthor];
            const data = await client.query(sql, valueArray);

            //INSERT post_img_path data
            const postIdx = data.rows[0].post_idx;
            const sql2 = `INSERT INTO backend.post_img_mapping (post_idx,img_path) VALUES ($1,$2)`;
            for(let i = 0; i < req.files.length; i++){
                await client.query(sql2, [postIdx, req.files[i].transforms[0].key]);
            }

            //COMMIT
            await client.query('COMMIT');

            //send result
            delete result.error;
            res.send(result);
        }catch(err){
            console.log(err);

            //ROLLBACK
            await client.query('ROLLBACK');

            //delete img on s3
            for(let i = 0; i < req.files.length; i++){
                const imgPath = req.files[i].transforms[0].key;
                try{
                    await s3.deleteObject({
                        Bucket: 'jochong/post', 
                        Key: imgPath
                    }).promise();
                }catch(err2){
                    console.log(err2);
                }
            }
            
            //send result
            result.success = false;
            result.code = 500;
            delete result.errorMessage;
            res.send(result);
        }
    }else{
        res.send(result);
    }
});

//게시글 수정
router.put('/:postIdx', loginAuth, async (req, res) => {
    //FE에서 받아온 데이터
    const postIdx = req.params.postIdx;
    const titleValue = req.body.title;
    const contentsValue = req.body.contents;
    const authority = req.userData.authority;
    const userId = req.userData.id;

    //FE로 보내줄 데이터
    const result = {
        success : true,
        errorMessage : [],
        auth : true,
        code : 200
    }

    //데이터 검증
    if(titleValue.length === 0 || titleValue.length > 32){
        result.success = false;
        result.errorMessage.push({
            class : "title",
            message : "제목은 0~32자여야 합니다."
        })
    }
    if(contentsValue.length === 0){
        result.success = false;
        result.errorMessage.push({
            class : "contents",
            message : "내용을 입력해야합니다."
        })
    }

    if(result.success){
        //DB연결
        const client = new Client(pgConfig);
        try{
            await client.connect();

            //SELECT post_author query for login auth check
            const sql = `SELECT post_author FROM backend.post WHERE post_idx=$1`;
            const selectResult = await client.query(sql, [postIdx]);

            //auth check
            if(selectResult.rows[0].post_author === userId || authority === 'admin'){
                //UPDATE 
                const sql2 = 'UPDATE backend.post SET post_title=$1,post_contents=$2 WHERE post_idx=$3';
                await client.query(sql2, [titleValue, contentsValue, postIdx]);

                //send result
                delete result.errorMessage;
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

            //send result
            result.success = false;
            result.auth = true;
            result.code = 500;
            res.send(result);
        }
    }else{
        res.send(result);
    }
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