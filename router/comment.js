const router = require('express').Router();
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');
const loginAuthCheck = require('../module/login_auth_check');
const { addNotification } = require('../module/notification');
const { commentGet, commentAdd, commentModify, commentDelete, commentSearch, commentSearchPsql } = require('../module/comment_control');
const getDateRange = require('../module/get_date_range');


//댓글의 db데이터를 가져오는 api
router.get('/', async (req, res) => {
    //FE로 받을 데이터
    const postIdx = req.query?.postIdx;
    const searchKeyword = req.query?.keyword || "";
    const searchSize = req.query.size || 30;
    const searchFrom = req.query.from || 0;
    const searchDB = req.query.db || 'elasticsearch';
    const searchDateRange = getDateRange(req.query['date-range']) || 0;
    const searchType = req.query['search-type'] || "post_title";

    //옵션 셋팅
    const searchOption = {
        search : searchType,
        size : searchSize,
        from : searchFrom,
        dateRange : searchDateRange
    }

    //FE로 보내줄 데이터
    const result = {};
    let statusCode = 200;

    //댓글 가져오기
    try{
        if(postIdx){ //get comment data with post idx
            const searchResult = await commentGet(postIdx);
            result.data = searchResult;
        }else if(searchDB === 'elasticsearch'){ //get search result from elasticsearch
            const commentData = await commentSearch(searchKeyword, searchOption);
            result.data = commentData;   
        }else{ //get search result from psql 
            const commentData = await commentSearchPsql(searchKeyword, searchOption);
            result.data = commentData;
        }
    }catch(err){
        console.log(err);

        result.message = err.message;
        statusCode = err.code;
    }

    //응답
    res.status(statusCode).send(result);
});

//comment에 데이터 삽입 api
router.post('/', loginAuthCheck, async (req, res) => {
    //FE에서 받아온 값
    const commentData = {
        commentAuthor : req.userData.id,
        postIdx : req.query.postIdx,
        commentContents : req.body.contents,
        nickname : req.userData.nickname
    }

    //FE에 보낼 값
    const result = {};
    let statusCode = 200;

    //데이터 예외처리
    if(commentData.commentContents.length === 0){
        statusCode = 400;
        result.errorMessage = [{
            class : "contents",
            message : "내용을 입력해야합니다."
        }]
    }
    
    //댓글 추가하기
    if(statusCode === 200){ 
        try{
            await commentAdd(commentData);
            await addNotification([{
                code : 1,
                user : commentData.commentAuthor,
                idx : commentData.postIdx,
                contents : commentData.commentContents,
                nickname : commentData.nickname
            }])
        }catch(err){
            console.log(err);

            statusCode = err.code;
            result.message = err.message;
        }
    }

    //응답
    res.status(statusCode).send(result);
})

//comment 수정 api
router.put('/:commentIdx', loginAuthCheck, async (req, res) => {
    //FE에서 받아온 데이터
    const commentIdx = req.params.commentIdx;
    const commentData = {
        contents : req.body.contents
    }

    //FE에 줄 데이터
    const result = {};
    let statusCode = 200;

    //데이터 예외 처리
    if(commentData.contents.length === 0){
        statusCode = 400;
        result.errorMessage = [{
            class : "contents",
            message : "내용을 입력해야합니다."
        }];
    }

    //댓글 수정하기
    if(statusCode === 200){
        try{
            await commentModify(commentIdx, req.userData, commentData);
        }catch(err){
            console.log(err);
            
            result.message = err.message;
            statusCode = err.code;
        }
    }

    //응답
    res.status(statusCode).send(result);
})


//comment 삭제 api
router.delete('/:commentIdx', loginAuthCheck, async (req, res) => {
    //FE로부터 받은 데이터
    const commentIdx = req.params.commentIdx;

    //FE로 보내줄 데이터
    const result = {};
    let statusCode = 200;

    //데이터 삭제하기
    try{
        await commentDelete(commentIdx, req.userData);
    }catch(err){
        console.log(err);
            
        result.message = err.message;
        statusCode = err.code;
    }

    //응답
    res.status(statusCode).send(result);
})

module.exports = router;