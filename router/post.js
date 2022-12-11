const router = require('express').Router();
const loginAuth = require('../module/login_auth_check');
const postImgUploadMiddleware = require('../module/post_img_upload');
const searchKeywordSave = require('../module/search_keyword_save');
const jwt = require('jsonwebtoken');
const SECRET_KEY = require('../config/jwt_secret_key');
const { postAdd, postModify, postDelete, postGetAll, postSearch, getPostOne, postSearchPsql } = require('../module/post_control');
const getDateRange = require('../module/get_date_range');

//게시글 모두 가져오기 api
router.get('/all', async (req, res) => {
    //FE에서 받은 값
    const searchSize = req.query.size === undefined ? 30 : req.query.size;
    const searchFrom = req.query.from === undefined ? 0 : req.query.from;

    //FE로 보낼 값
    const result = {};
    let statusCode = 200;

    //게시글 가져오기
    try{
        const postData = await postGetAll({ from : searchFrom, size : searchSize });
        result.data = postData.data;
    }catch(err){
        console.log(err);
        
        statusCode = err.code;
        result.message = err.message;
    }
    
    //send result
    res.status(statusCode).send(result);
})

//게시글 한개 가져오기 API
router.get('/:postIdx', async (req, res) => {
    //FE에서 받은 값
    const postIdx = req.params.postIdx;
    
    //FE로 보낼 값
    const result = {}
    let statusCode = 200;

    //데이터 가져오기
    try{
        const postData = await getPostOne(postIdx);
        result.data = postData;
    }catch(err){
        statusCode = err.code;
        result.message = err.code === 404 ? "data not found" :'unexpected error occured';
    }

    //응답
    res.status(statusCode).send(result);
})

//게시글 검색 API
router.get('/', async (req, res) => {
    //FE에서 받은 값
    const searchKeyword = req.query?.keyword;
    const searchSize = req.query?.size || 30;
    const searchFrom = req.query.from || 0;
    const searchDB = req.query.db || 'elasticsearch';
    const searchDateRange = getDateRange(req.query['date-range']) || 0;
    const searchType = req.query['search-type'] || 'post_title';

    //검색 옵션 준비
    const searchOption = {
        search : searchType,
        size : searchSize,
        from : searchFrom,
        dateRange : searchDateRange
    }

    //FE로 보낼 값
    const result = {};
    let statusCode = 200;

    //예외 처리
    if(!searchKeyword){
        statusCode = 400;
        res.status(400).send(result);
        return;
    }

    //검색 키워드 저장
    try{
        searchKeywordSave(searchKeyword, jwt.verify(req.signedCookies.token, SECRET_KEY).id || "");
    }catch{}

    //검색 데이터 가져오기
    try{ 
        if(searchDB === 'elasticsearch'){
            const searchResult = await postSearch(searchKeyword, searchOption);
            result.data = searchResult;  
        }else if(searchDB === 'postgre'){ 
            const searchResult = await postSearchPsql(searchKeyword, searchOption);
            result.data = searchResult;
        }
    }catch(err){
        console.log(err);

        statusCode = err.code;
    }
    
    //응답
    res.status(statusCode).send(result);
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
        errorMessage : []
    }
    let statusCode = 200;

    //data예외처리
    if(postData.title.length === 0 || postData.title.length > 32){
        statusCode = 400;
        result.errorMessage.push({
            class : 'title',
            message : "제목의 길이는 1~32자여야 합니다."
        });
    }
    if(postData.contents.length === 0){
        statusCode = 400;
        result.errorMessage.push({
            class : 'contents',
            message : "글의 내용은 필수 사항입니다."
        });
    }

    //게시글 데이터 추가하기
    if(statusCode === 200){
        delete result.errorMessage;
        try{
            await postAdd(postData);
        }catch(err){
            console.log(err);

            statusCode = err.code;
            result.message = err.message;
        }
    }

    //응답
    res.status(statusCode).send(result);
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
        errorMessage : []
    }
    let statusCode = 200;

    //데이터 예외처리
    if(postData.title.length === 0 || postData.title.length > 32){
        statusCode = 400;
        result.errorMessage.push({
            class : "title",
            message : "제목은 0~32자여야 합니다."
        })
    }
    if(postData.contents.length === 0){
        statusCode = 400;
        result.errorMessage.push({
            class : "contents",
            message : "내용을 입력해야합니다."
        })
    }

    //게시글 수정하기
    if(statusCode === 200){
        delete result.errorMessage;
        try{
            await postModify(postIdx, req.userData, postData);
        }catch(err){
            console.log(err);

            statusCode = err.code;
            result.message = err.message;
        }
    }

    //응답
    res.status(statusCode).send(result);
})

//post삭제 api
router.delete('/:postIdx',loginAuth, async (req,res)=>{
    //FE에서 받은 데이터
    const postIdx = req.params.postIdx;

    //FE로 보내줄 데이터
    const result = {};
    let statusCode = 200;

    //게시글 삭제하기
    try{
        await postDelete(postIdx, req.userData);
    }catch(err){
        console.log(err);

        result.message = err.message;
        statusCode = err.code;
    }

    //응답
    res.status(statusCode).send(result);
})

module.exports = router;