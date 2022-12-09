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
    const postIdx = req.query.postIdx;
    const searchKeyword = req.query.keyword === undefined ? "" : req.query.keyword;
    const searchSize = req.query.size === undefined ? 30 : req.query.size;
    const searchFrom = req.query.from === undefined ? 0 : req.query.from;
    const searchDB = req.query.db === undefined ? 'elasticsearch' : req.query.db;
    const searchDateRange = req.query['date-range'] === undefined ? 0 : getDateRange(req.query['date-range']);
    const searchType = req.query['search-type'] === undefined ? 'post_title' : req.query['search-type'];

    const searchOption = {
        search : searchType,
        size : searchSize,
        from : searchFrom,
        dateRange : searchDateRange
    }

    //FE로 보내줄 데이터
    const result = {
        success : true,
        data : [],
        auth : true,
        code : 200
    }

    try{
        if(postIdx !== undefined){
            //get commnet data on Elasticsearch
            const searchResult = await commentGet(postIdx);

            //set result ( success )
            result.data = searchResult;
            delete result.error;
        }else{
            if(searchDB === 'elasticsearch'){
                //get search result from elasticsearch
                const commentData = await commentSearch(searchKeyword, searchOption);
                result.data = commentData;   
            }else{
                //get search result from psql 
                const commentData = await commentSearchPsql(searchKeyword, searchOption);
                console.log(commentData);
                result.data = commentData;
            }
        }
    }catch(err){
        console.log(err);

        //set result ( error )
        result.success = false;
        result.code = 500;
        delete result.data;
    }
    res.send(result);
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
    const result = {
        success : true,
        errorMessage : [],
        auth : true,
        code : 200
    }

    //check exception
    if(commentData.commentContents.length === 0){
        result.state = false;
        result.errorMessage = [{
            class : "contents",
            message : "내용을 입력해야합니다."
        }]
        res.send(result);
    }else{ 
        try{
            //add comment data
            await commentAdd(commentData);

            //add notification
            addNotification([{
                code : 1,
                user : commentData.commentAuthor,
                idx : commentData.postIdx,
                contents : commentData.commentContents,
                nickname : commentData.nickname
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
    const commentData = {
        contents : req.body.contents
    }

    //FE에 줄 데이터
    const result = {
        success : true,
        errorMessage : [],
        auth : true,
        code : 200
    }

    //FE data check
    if(commentData.contents.length === 0){
        //send result
        result.success = false;
        result.errorMessage.push({
            class : "contents",
            message : "내용을 입력해야합니다."
        })
    }

    if(result.success){
        try{
            //modify comment
            await commentModify(commentIdx, req.userData, commentData);

            //set result
            delete result.errorMessage;
        }catch(err){
            console.log(err);
            
            if(err.auth){
                //set result ( no auth )
                delete result.errorMessage;
                result.success = false;
                result.auth = true;
                result.code = 401;
            }else if(err.err.status !== 404){
                //set result ( server error )
                delete result.errorMessage;
                result.success = false;
                result.auth = true;
                result.code = 500;
            }
        }
    }

    //send result
    res.send(result);
})


//comment 삭제 api
router.delete('/:commentIdx', loginAuthCheck, async (req, res) => {
    //FE로부터 받은 데이터
    const commentIdx = req.params.commentIdx;

    //FE로 보내줄 데이터
    const result = {
        success : true,
        code : 200,
        auth : true
    }

    try{
        //delete
        await commentDelete(commentIdx, req.userData);
    }catch(err){
        if(!err.auth){
            //set result ( no auth )
            result.success = false;
            result.auth = false;
            result.code = 401;
        }else if(!err.status === 404){
            console.log(err);

            //set result (error)
            result.success = false;
            result.code = 500;
            result.auth = true;
        }
    }
    res.send(result);
})

module.exports = router;