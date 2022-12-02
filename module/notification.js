const redis = require('redis').createClient();
const { Client } = require('pg');
const pgConfig = require('../config/pg_config');

//알람 추가 함수 (필요시 프로미스로 변경)
const addNotification = (noticeArray) => { 
    const date = new Date();
    date.setHours(date.getHours() + 9);
    noticeArray.forEach(async (notice) => {
        //prepare data
        const noticeCode = notice.code;
        const noticeUser = notice.user;
        const idx = notice.idx;
        const contents = notice.contents;
        const nickname = notice.nickname;

        const timeString = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
        
        //create notice idx
        const randomNumber = Math.floor(Math.random() * 1000000)
        const noticeIdx = `${timeString}-${randomNumber}`;

        //post notice
        if(noticeCode === 1){
            try{
                //connect pgClient 
                const pgClient = new Client(pgConfig);
                await pgClient.connect();

                //SELECT post_author
                const selectSql = 'SELECT post_author FROM backend.post WHERE post_idx = $1';
                const selectData = await pgClient.query(selectSql, [idx]);
                
                //post_author check
                if(selectData.rows.length === 0){
                    throw {
                        message : `cannot find post width post_idx = ${idx}`
                    }
                }

                //prepare data
                const postAuthor = selectData.rows[0].post_author;

                //same user
                if(noticeUser === postAuthor){
                    return {
                        success : 1
                    }
                }

                //connect redis
                await redis.connect();

                //setHash 
                await redis.hSet(`notice-${postAuthor}-${noticeIdx}`, {
                    code : noticeCode,
                    noticeUser : noticeUser,
                    idx : idx,
                    contents : contents,
                    time : timeString,
                    noticeIdx : noticeIdx,
                    nickname : nickname,
                    id : postAuthor,
                })
                await redis.expire(`notice-${postAuthor}-${noticeIdx}`, 60 * 60 * 24 * 3);

                //redis disconnect
                await redis.disconnect();

                //return
                return {
                    success : 1
                }
            }catch(err){
                console.log(err);

                if(redis.isOpen){
                    await redis.disconnect();
                }

                return {
                    success : -1,
                    err : err
                };
            }
        }else{
            return {
                success : -1,
                err : "unrealized version (notice.code errror)"
            }
        }
    });
}

//알람 삭제 함수
const delNotification = async (noticeArray) => {
    try{
        //connect redis
        await redis.connect();

        //delete notice
        for(let i = 0; i < noticeArray.length; i++){
            //prepare data
            const notice = noticeArray[i];
            const noticeIdx = notice.noticeIdx;
            const userId = notice.id;
            
            await redis.del(`notice-${userId}-${noticeIdx}`);
        }

        //return
        return {
            success : 1
        }
    }catch(err){
        return {
            success : -1,
            err : err
        }
    }
}

module.exports = {
    addNotification : addNotification,
    delNotification : delNotification
}