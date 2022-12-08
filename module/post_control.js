const elastic = require('elasticsearch');
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');
const s3 = require('../module/s3');

//게시글 검색하는 함수 ver. ElasticSearch
const postSearch = (keyword = "", option = { search : 'post_title', size : 30, from : 0, dateRange : 0}) => {
    return new Promise(async (resolve, reject) => {
        try{
            //connect es
            const esClient = new elastic.Client({
                node : 'http://localhost:9200'
            });

            //check index
            const exitsResult = await esClient.indices.exists({
                index : 'post',
            });
            if(!exitsResult || keyword === ""){
                resolve([])
            }
            
            //SEARCH
            const searchResult = await esClient.search({
                index : 'post',
                body : {
                    query : {
                        bool : {
                            must : [
                                {
                                    wildcard : {
                                        [option.search] : `*${keyword}*`
                                    }
                                },
                                {
                                    range : {
                                        post_date : {
                                            gte : option.dateRange
                                        }
                                    }
                                }
                            ]
                        }
                    }, 
                    from : option.from * option.size,
                    size : option.size,
                    sort : [{
                        post_idx : 'desc'
                    }]
                }
            })

            resolve(searchResult.hits.total.value !== 0 ? searchResult.hits.hits.map(data => data._source) : []);
        }catch(err){
            reject({
                err : err,
                message : "es 에러 발생"
            });
        }
    })
}

//게시글 한개를 가져오는 함수
const getPostOne = (postIdx) => {
    return new Promise(async (resolve, reject) => {
        try{
            //CONNECT es
            const esClient = new elastic.Client({
                node : 'http://localhost:9200'
            });

            //EXSITS
            const exitsResult = await esClient.indices.exists({
                index : 'post',
            });
            if(!exitsResult) throw "error";
            
            //get one
            const searchResult = await esClient.search({
                index : 'post',
                body : {
                    query : {
                        match : {
                            post_idx : postIdx
                        }
                    }
                }
            })

            //404 check
            if(searchResult.hits.total.value === 0){
                resolve(404);
            }else{
                resolve(searchResult.hits.hits[0]?._source);
            }
        }catch(err){
            reject(err);
        }
    })
}

//게시글 검색하는 함수 ver. PostgreSql
const postSearchPsql = (keyword = "", option = { search : 'post_title', size : 30, from : 0 }) => {
    return new Promise(async (resolve, reject) => {
        //sql 준비
        const sql = `SELECT 
                        post_title,
                        post_contents,
                        post_date,post_author,
                        nickname,
                        img_path,
                        backend.post.post_idx
                    FROM 
                        backend.post 
                    JOIN 
                        backend.account 
                    ON 
                        id = post_author 
                    LEFT JOIN 
                        backend.post_img_mapping 
                    ON 
                        backend.post.post_idx = backend.post_img_mapping.post_idx  
                    WHERE 
                        ${option.search}
                    LIKE 
                        $1
                    OFFSET
                        $2
                    LIMIT 
                        $3
                    `;


        //connect psql
        const client = new Client(pgConfig);
        try{
            await client.connect();

            //SELECT post data
            const selectData = await client.query(sql, [ `%${keyword}%`, option.from, option.size]);
            resolve(selectData.rows);
        }catch(err){
            console.log(err);
            
            reject(err);
        }
    })
}

//게시글 가져오는 함수
const postGetAll = (option = { from : 0, size : 30}) => {
    return new Promise(async (resolve, reject) => {
        try{
            //connect es
            const esClient = new elastic.Client({
                node : "http://localhost:9200"
            });

            //check index
            const exitsResult = await esClient.indices.exists({
                index : 'post'
            })

            //check data
            if(exitsResult){
                //SEARCH post ( all )
                const searchResult = await esClient.search({
                    index : 'post',
                    body : {
                        query : {
                            match_all : {}
                        },
                        size : option.size,
                        from : option.from * option.size,
                        sort : [{
                            post_idx : 'desc'
                        }]
                    }
                })

                //resolve
                resolve({
                    data : searchResult.hits.hits.map((data) => {
                        return data._source
                    })
                })
            }else{
                resolve([]);
            }
        }catch(err){
            //reject
            reject({
                err : err,
                message : 'ES에러 발생'
            })
        }
    })
}

//게시글 추가 함수
const postAdd = (postData) => {
    //prepare data
    const titleValue = postData.title;
    const contentsValue = postData.contents;
    const postAuthor = postData.author;
    const fileArray = postData.fileArray;
    const date = new Date();
    date.setHours(date.getHours() + 9);

    return new Promise(async (resolve, reject) => {
        const pgClient = new Client(pgConfig);
        try{
            //connect psql
            await pgClient.connect();

            //connect ES
            const esClient = elastic.Client({
                node : "http://localhost:9200"
            });
            
            //BEGIN
            await pgClient.query("BEGIN");
            
            //SELECT nickname
            const selectNicknameSql = 'SELECT nickname FROM backend.account WHERE id = $1';
            const selectNicknameResult = await pgClient.query(selectNicknameSql, [postAuthor]);
            const AuthorNickname = selectNicknameResult.rows[0].nickname;

            //INSERT post data
            const sql = `INSERT INTO backend.post (post_title,post_contents,post_author) VALUES ($1,$2,$3) RETURNING post_idx`;
            const valueArray = [titleValue, contentsValue, postAuthor];
            const postData = await pgClient.query(sql, valueArray);
            const postIdx = postData.rows[0].post_idx;

            //INSERT post_img_path
            const sql2 = `INSERT INTO backend.post_img_mapping (post_idx,img_path) VALUES ($1,$2)`;
            for(let i = 0; i < fileArray.length; i++){
                await pgClient.query(sql2, [postIdx, fileArray[i].transforms[0].key]);
            }

            //INSERT post data to ES
            await esClient.index({
                index : 'post',
                id : postIdx,
                body : {
                    post_idx : postIdx,
                    post_title : titleValue,
                    post_contents : contentsValue,
                    post_author : postAuthor,
                    post_date : date.getTime(),
                    post_img_path : fileArray.map((file) => file.transforms[0].key),
                    nickname : AuthorNickname
                }
            })
            
            //COMMIT 
            await pgClient.query('COMMIT');

            //resolve
            resolve(1);
        }catch(err){
            //ROLLBACK
            pgClient.query('ROLLBACK');

            //reject
            reject({
                err : err,
                message : err.message
            });
        }
    })
}

//게시글 수정 함수
const postModify = (postIdx, requestUserData, postData) => {
    //prepare data
    const titleValue = postData.title;
    const contentsValue = postData.contents;

    return new Promise(async (resolve, reject) => {
        //connect psql
        const pgClient = new Client(pgConfig);

        //connect elasticsearch
        const esClient = elastic.Client({
            node : "http://localhost:9200"
        });

        try{
            await pgClient.connect();
            
            //BEGIN
            await pgClient.query('BEGIN');

            //search post_author
            const searchResult = await esClient.search({
                index : 'post',
                body : {
                    query : {
                        match : {
                            post_idx : postIdx
                        }
                    }
                }
            })
            const postAuthor = searchResult.hits.hits[0]._source.post_author;

            //auth check
            if(postAuthor === requestUserData.id || requestUserData.authority === 'admin'){
                //UPDATE psql
                const sql2 = 'UPDATE backend.post SET post_title=$1,post_contents=$2 WHERE post_idx=$3';
                await pgClient.query(sql2, [titleValue, contentsValue, postIdx]);

                //UDPATE elasticsearch
                const esUpdateResult = await esClient.updateByQuery({
                    index : "post",
                    refresh: true,
                    body : {
                        script : {
                            lang: "painless",
                            post_title : titleValue,
                            source : `ctx._source.post_contents = "${contentsValue}"; ctx._source.post_title = "${titleValue}"`
                        },
                        query : {
                            match : {
                                post_idx : postIdx
                            }
                        }
                    }
                })

                //resolve
                resolve(1);

                await pgClient.query('COMMIT');
            }else{
                //reject
                reject({
                    auth : false,
                    message : "권한이 없습니다."
                });
            }
        }catch(err){
            //reject
            reject({
                err : err,
                auth : true,
                message : err.message
            });
        }
    })
}

//게시글 삭제 함수
const postDelete = (postIdx, requestUserData) => {
    return new Promise(async (resolve, reject) => {
        //CONNECT postgre
        const pgClient = new Client(pgConfig);
        try{
            await pgClient.connect();

            //CONNECT es
            const esClient = new elastic.Client({
                node : 'http://localhost:9200'
            });

            const searchResult = await esClient.search({
                index : 'post',
                body : {
                    query : {
                        match : {
                            post_idx : postIdx
                        }
                    }
                }
            })
            const postAuthor = searchResult.hits.hits[0]._source.post_author;

            //SELECT img mapping
            const sql = 'SELECT * FROM backend.post_img_mapping WHERE post_idx = $1';
            const selectResult = await pgClient.query(sql, [postIdx]);
            const imgPathArray = selectResult.rows.map(data => data.img_path);
            
            //auth check
            if(postAuthor === requestUserData.id || requestUserData.authority === 'admin'){
                //BEGIN
                await pgClient.query('BEGIN');

                //DELETE post data
                const delPostSql = 'DELETE FROM backend.post WHERE post_idx = $1';
                await pgClient.query(delPostSql, [postIdx]);

                //DELETE post_img_mapping data
                const delPostImgMappingSql = 'DELETE FROM backend.post_img_mapping WHERE post_idx = $1';
                await pgClient.query(delPostImgMappingSql, [postIdx]);

                //DELETE post img ON s3
                for(const imgPath of imgPathArray){
                    await s3.deleteObject({
                        Bucket: 'jochong/post', 
                        Key: imgPath
                    }).promise();
                }

                //DELETE post data on elasticsearch
                const delPostResult = await esClient.deleteByQuery({
                    index : 'post',
                    body : {
                        query : {
                            match : {
                                post_idx : postIdx
                            }
                        }
                    }
                });

                //DELETE comment data on elasticsearch ( 테스트가 필요합니다. )
                const delCommentResult = await esClient.deleteByQuery({
                    index : 'comment',
                    body : {
                        query : {
                            match : {
                                post_idx : postIdx
                            }
                        }
                    }
                })
                console.log(delCommentResult);

                //COMMIT
                await pgClient.query('COMMIT');

                //resolve
                resolve(1);
            }else{
                reject({
                    message : "권한이 없습니다.",
                    auth : false
                })
            }
        }catch(err){
            //ROLLBACK
            await pgClient.query('ROLLBACK');

            //reject
            reject({
                err : err,
                message : "DB에러가 발생했습니다.",
                auth : true
            })
        }
    })
}

module.exports = {
    postAdd : postAdd,
    postModify : postModify,
    postDelete : postDelete,
    postGetAll : postGetAll,
    postSearch : postSearch,
    getPostOne : getPostOne,
    postSearchPsql : postSearchPsql
}