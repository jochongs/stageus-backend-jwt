const requestLog = async (itemRemoveOption=true,page=0)=>{
    if(itemRemoveOption){
        //item 들초기화 
        document.querySelectorAll('.log_item').forEach((item)=>{
            item.remove();
        })
        
        //버튼 page 데이터 초기화
        document.querySelector('#additional_btn').dataset.page = 1;
    }

    const startDate = document.querySelector('#start_date').value;
    const endDate = document.querySelector('#end_date').value;
    const userId = document.querySelector('#id_input').value;
    const api = document.querySelector('#api_input').value;
    //const only = document.querySelector('#only_input').value;
    const order = document.querySelector('#order_input').value;
    
    //쿼리스트링 준비
    let queryString = "";
    if(startDate !== ""){
        if(queryString.length === 0){
            queryString = `start_date=${new Date(startDate).toISOString()}`;
        }else{
            queryString += `&start_date=${new Date(startDate).toISOString()}`;
        }
    }
    if(endDate !== ""){
        if(queryString.length === 0){
            queryString = `end_date=${new Date(endDate).toISOString()}`;
        }else{
            queryString += `&end_date=${new Date(endDate).toISOString()}`;
        }
    }
    if(userId.length !== 0){
        if(queryString.length === 0){
            queryString = `userId=${userId}`;
        }else{
            queryString += `&userId=${userId}`;
        }
    }
    if(api.length !== 0){
        if(queryString.length === 0){
            queryString = `api=${api}`;
        }else{
            queryString += `&api=${api}`;
        }
    }
    if(order==='desc'){
        if(queryString.length === 0){
            queryString = `order=${order}`;
        }else{
            queryString += `&order=${order}`;
        }
    }
    // if(only.length !== 0){
    //     if(queryString.length === 0){
    //         queryString = `only=${only}`;
    //     }else{
    //         queryString += `&only=${only}`;
    //     }
    // }
    if(page !== 0 ){
        if(queryString.length === 0){
            queryString = `page=${page}`;
        }else{
            queryString += `&page=${page}`;
        }
    }

    //서버에 요청
    const request = await fetch(`/log/all?${queryString}`);
    const result = await request.json();

    addLogData(result.data);
    console.log(result);
}

//데이터 추가해주는 함수
const addLogData = (logDataArray)=>{
    logDataArray.map((logData)=>{
        //데이터
        const method = logData.method;
        const api = logData.api;
        const queryString = logData.queryString;
        const userId = logData.userId;
        const reqTime = logData?.req?.time;
        const reqBody = logData?.req?.body;
        const resResult = logData?.res?.result;
        const resCode = logData?.res?.code;

        const reqDate = new Date(reqTime);
        const reqDateString = `${reqDate.getFullYear()}-${(reqDate.getMonth()+1).toString().padStart(2,0)}-${reqDate.getDate().toString().padStart(2,0)} ${reqDate.getHours().toString().padStart(2,0)}:${reqDate.getMinutes().toString().padStart(2,0)}:${reqDate.getSeconds().toString().padStart(2,0)}`;
        const resTime = logData?.res?.time;
        const resDate = new Date(resTime);
        const resDateString = `${resDate.getFullYear()}-${(resDate.getMonth()+1).toString().padStart(2,0)}-${resDate.getDate().toString().padStart(2,0)} ${resDate.getHours().toString().padStart(2,0)}:${resDate.getMinutes().toString().padStart(2,0)}:${resDate.getSeconds().toString().padStart(2,0)}`;
        
        //method sapn
        const methodSpan = document.createElement('span');
        methodSpan.classList.add(`${method}-method`);
        methodSpan.innerText = method;

        //method div
        const logMethodCotnainer = document.createElement('div');
        logMethodCotnainer.classList.add('log_method_container');
        logMethodCotnainer.classList.add('log-contents');
        logMethodCotnainer.append(methodSpan);

        //api div
        const logApiContainer = document.createElement('div');
        logApiContainer.classList.add('log_api_container');
        logApiContainer.classList.add('log-contents');
        logApiContainer.innerText = api;

        //userId div
        const logIdContainer = document.createElement('div');
        logIdContainer.classList.add('log_id_container');
        logIdContainer.classList.add('log-contents');
        logIdContainer.innerText = userId

        //req time
        const logReqTimeContainer = document.createElement('div');
        logReqTimeContainer.classList.add('log_req_time_container');
        logReqTimeContainer.classList.add('log-contents');
        logReqTimeContainer.innerText = reqDateString;
        
        //res time
        const logResTimeContainer = document.createElement('div');
        logResTimeContainer.classList.add('log_res_time_container');
        logResTimeContainer.classList.add('log-contents');
        logResTimeContainer.innerText = resDateString;
        
        //log item header
        const logItemHeaderContainer = document.createElement('div');
        logItemHeaderContainer.classList.add('log_item_header_container');
        logItemHeaderContainer.append(logMethodCotnainer);
        logItemHeaderContainer.append(logApiContainer);
        logItemHeaderContainer.append(logIdContainer);
        logItemHeaderContainer.append(logReqTimeContainer);
        logItemHeaderContainer.append(logResTimeContainer);        
        logItemHeaderContainer.addEventListener('click',(e)=>{
            const itemHeader = e.currentTarget;
            itemHeader.parentElement.querySelector('.log_item_main_container').classList.toggle('hidden');
        })



        //req title container
        const reqTitleContainer = document.createElement('div');
        reqTitleContainer.classList.add('req_title_container');
        reqTitleContainer.classList.add('log-main-title');
        reqTitleContainer.innerText = "요청";

        //body pre tag
        const bodyPre = document.createElement('pre');
        bodyPre.innerHTML = `${reqBody}`;

        //req main container
        const reqMainContainer = document.createElement('div');
        reqMainContainer.classList.add('req_main_container');
        
        reqMainContainer.append(returnLogMainItemTitleContainer('req','time',reqDateString));
        reqMainContainer.append(returnLogMainItemTitleContainer('req','query',queryString));
        reqMainContainer.append(returnLogMainItemTitleContainer('req','body',JSON.stringify(reqBody)));
        
        //req container 
        const reqContainer = document.createElement('div');
        reqContainer.classList.add('req_container');
        reqContainer.append(reqTitleContainer,reqMainContainer);

        
        
        //res title container
        const resTitleContainer = document.createElement('div');
        resTitleContainer.classList.add('res_title_container');
        resTitleContainer.classList.add('log-main-title');
        resTitleContainer.innerText = "응답";

        //result pre tag
        const resultPre = document.createElement('pre');
        resultPre.innerHTML = `${resResult}`;

        //res main container
        const resMainContainer = document.createElement('div');
        resMainContainer.classList.add('res_main_container');

        resMainContainer.append(returnLogMainItemTitleContainer('res','time',resDateString));
        resMainContainer.append(returnLogMainItemTitleContainer('res','code',resCode));
        resMainContainer.append(returnLogMainItemTitleContainer('res','result',resResult));

        //res container 
        const resContainer = document.createElement('div');
        resContainer.classList.add('res_container');
        resContainer.append(resTitleContainer,resMainContainer);



        //log item main container
        const logItemMainContainer = document.createElement('div');
        logItemMainContainer.classList.add('log_item_main_container','hidden');
        logItemMainContainer.append(reqContainer,resContainer);


        //log item
        const logItem = document.createElement('div');
        logItem.classList.add('log_item');
        logItem.append(logItemHeaderContainer,logItemMainContainer);

        document.querySelector('.log_main').append(logItem);
    })
}

//title container를 동적으로 생성해주는 함수
const returnLogMainItemTitleContainer = (type,name,value)=>{
    const titleContainer = document.createElement('div');
    titleContainer.classList.add(`${type}_main_item_title_container`);
    titleContainer.innerText = name;

    const contentsContainer = document.createElement('div');
    contentsContainer.classList.add(`${type}_main_item_contents_container`);
    contentsContainer.innerText = value;

    const mainItem = document.createElement('div');
    mainItem.classList.add(`${type}_main_item`);
    mainItem.append(titleContainer,contentsContainer);

    return mainItem;
}

//더보기 버튼 함수 이벤트
const clickAdditionalBtnClickEvent = ()=>{
    if(document.querySelectorAll('.log_item').length === 0){
        alert('검색을 먼저누르세용');
    }else{
        const pageData = document.querySelector('#additional_btn').dataset.page;
        requestLog(false,pageData);
        document.querySelector('#additional_btn').dataset.page = parseInt(pageData) + 1;
    }
}