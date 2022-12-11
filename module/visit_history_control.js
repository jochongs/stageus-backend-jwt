const elastic = require('elasticsearch');

const getVisitHistory = (userId) => {
    return new Promise(async (resolve, reject) => {
        try{
            const esClient = new elastic.Client({
                node : 'http://localhost:9200'
            })
            
            if(!await esClient.indices.exists({ index : 'visit-history' })){
                resolve([]);
            }

            const searchResult = await esClient.search({
                index : 'visit-history',
                body : {
                    query : {
                        match : {
                            _routing : userId
                        }
                    }
                }
            })
            const visitHistoryData = searchResult.hits.hits.map(data => data._source);

            resolve(visitHistoryData);
        }catch(err){
            reject({
                err : err,
                message : 'unexpected error occured',
                code : 409                  
            })
        }
    });
}

const addVisitHistory = (userId, path) => {
    return new Promise(async (resolve, reject) => {
        //prepare data
        const date = new Date();
        date.setHours(date.getHours() + 9);

        try{
            const esClient = new elastic.Client({
                node : 'http://localhost:9200'
            });

            await esClient.index({
                index : 'visit-history',
                routing : userId,
                body : {
                    id : userId,
                    page : path,
                    time : date.getTime()
                }
            });

            resolve(1);
        }catch(err){
            reject({
                err : err,
                message : 'unexpected error occured',
                code : 409
            })
        }
    });
}

module.exports = {
    getVisitHistory : getVisitHistory,
    addVisitHistory : addVisitHistory
}