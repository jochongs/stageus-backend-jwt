const elastic = require('elasticsearch');
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');

//댓글 가져오는 함수
const commentGet = (postIdx, searchFor = 'post_idx') => {
    return new Promise(async (resolve, reject) => {
        try{
            //connect es client
            const esClient = new elastic.Client({
                node : 'http://localhost:9200'
            });

            //check index
            const checkResult = await esClient.indices.exists({
                index : 'comment'
            })
            if(!checkResult){
                resolve([])
            }

            //GET comment
            const searchResult = await esClient.search({
                index : 'comment',
                body : {
                    query : {
                        match : {
                            [searchFor] : postIdx
                        }
                    },
                    sort : [{
                        comment_date : 'desc'
                    }]
                }
            })
            const commentData = searchResult.hits.hits.map((hits) => hits._source);
            
            resolve(commentData);
        }catch(err){
            reject(err);
        }
    })
}

//게시글 추가 함수
const commentAdd = (commentData) => {
    const commentAuthor = commentData.commentAuthor;
    const commentContents = commentData.commentContents;
    const postIdx = commentData.postIdx;
    const nickname = commentData.nickname.trim();
    const date = new Date();
    date.setHours(date.getHours() + 9);

    return new Promise(async (resolve, reject) => {
        const pgClient = new Client(pgConfig);
        try{
            //connect pg client
            await pgClient.connect();

            //connect es client
            const esClient = new elastic.Client({
                node : 'http://localhost:9200'
            });

            //BEGIN
            await pgClient.query('BEGIN');

            //INSERT
            const sql = `INSERT INTO backend.comment (comment_author, comment_contents, post_idx) VALUES ($1, $2, $3) RETURNING comment_idx`;
            const insertResult = await pgClient.query(sql, [commentAuthor, commentContents, postIdx]);
            const commentIdx = insertResult.rows[0].comment_idx;

            //index
            await esClient.index({
                index : 'comment',
                id : commentIdx,
                routing : postIdx,
                body : {
                    comment_idx : commentIdx,
                    comment_contents : commentContents,
                    comment_author : commentAuthor,
                    nickname : nickname,
                    comment_date : date.getTime(),
                    post_idx : postIdx
                }
            })

            //COMMIT
            await pgClient.query('COMMIT');

            //resolve
            resolve(1);
        }catch(err){
            //ROLLBACK
            await pgClient.query('ROLLBACK');
            
            //reject
            reject(err);
        }
    })
}

//게시글 수정 함수
const commentModify = (commentIdx, userData, commentData) => {
    //prepare data
    const commentContents = commentData.contents

    return new Promise(async (resolve, reject) => {
        //set psql
        const pgClient = new Client(pgConfig);

        //connect elasticsearch
        const esClient = elastic.Client({
            node : "http://localhost:9200"
        });

        try{
            //connect psql
            await pgClient.connect();

            //GET comment author
            const searchResult = await esClient.get({
                index : 'comment',
                id : commentIdx
            });
            const commentAuthor = searchResult._source.comment_author;

            //check authority 
            if(userData.id === commentAuthor || userData.authority === 'admin'){
                //BEGIN
                await pgClient.query('BEGIN');

                //UPDATE comment psql
                const sql2 = `UPDATE backend.comment SET comment_contents=$1 WHERE comment_idx = $2`;
                await pgClient.query(sql2, [commentContents, commentIdx]);

                //update comment elasticsearch
                const updateResult = await esClient.update({
                    index : 'comment',
                    id : commentIdx,
                    body : {
                        doc : {
                            comment_contents : commentContents
                        }
                    }
                })
                console.log(updateResult);

                //COMMIT
                await pgClient.query('COMMIT');

                //resolve
                resolve(1);
            }else{
                reject({ auth : false });
            }
        }catch(err){
            //ROLLBACK
            pgClient.query('ROLLBACK');

            //reject
            reject({
                err : err,
                auth : true
            });
        }
    })
}

const commentDelete = (commentIdx, userData) => {
    return new Promise(async (resolve, reject) => {
        //connect psql
        const pgClient = new Client(pgConfig);

        //connect elasticsearch
        const esClient = elastic.Client({
            node : "http://localhost:9200"
        });

        try{
            //connect psql
            await pgClient.connect();

            //GET comment author
            const searchResult = await esClient.get({
                index : 'comment',
                id : commentIdx
            });
            const commentAuthor = searchResult._source.comment_author;

            if(userData.id === commentAuthor || userData.authority === 'admin'){
                //BEGIN
                await pgClient.query('BEGIN');

                //DELETE comment psql
                const sql2 = 'DELETE FROM backend.comment WHERE comment_idx=$1';
                await pgClient.query(sql2, [commentIdx]);

                //delete comment es
                await esClient.delete({
                    index : 'comment',
                    id : commentIdx
                })

                //COMMIT
                await pgClient.query('COMMIT');

                //resolve
                resolve(1);
            }else{
                //ROLLBACK
                await pgClient.query('ROLLBACK');
                //reject
                reject({
                    auth : false
                })
            }
        }catch(err){
            //reject
            reject({
                err : err,
                auth : true
            })
        }
    })
}
module.exports = {
    commentGet : commentGet,
    commentAdd : commentAdd,
    commentModify : commentModify,
    commentDelete : commentDelete
}