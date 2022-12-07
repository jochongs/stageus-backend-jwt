window.onload = async ()=>{
    const postData = await getPostData();
    addPostItem(postData);
    checkLoginState();

    //오늘 로그인 횟수 출력
    getLoginCount();

    document.querySelector('.board_search_form').addEventListener('submit', submitSearchKeywordEvent);
}

//로그인 상태와 사용자의 아이디를 가져오는 함수
const checkLoginState = async () => {
    //request userData
    const response = await fetch(`/session`);
    const result = await response.json();
    
    //check result
    if(result.success){ 
        //알림 확인 기능
        checkNotification(result.id);

        //로그인 버튼 생성
        document.querySelector('.nav_login_btn').classList.add('hidden');

        //로그아웃 버튼 제거
        document.querySelector('.nav_logout_btn').classList.remove('hidden');

        //알림 버튼 생성
        document.querySelector('.notification_btn_container').classList.remove('hidden');

        //유저 정보 보기 버튼 생성
        const userInfoBtn = document.querySelector('.user_info_btn');
        userInfoBtn.classList.remove('hidden');
        const img = userInfoBtn.querySelector('img');
        img.classList.remove('hidden');
        userInfoBtn.innerText = result.id;
        userInfoBtn.append(img);

        //글쓰기 section생성
        document.querySelector('.write_post_section').classList.remove('hidden');
    }else{ //로그인이 되지 않았을 경우
        //로그인 버튼 생성
        document.querySelector('.nav_login_btn').classList.remove('hidden');

        //로그아웃 버튼 제거
        document.querySelector('.nav_logout_btn').classList.add('hidden');

        //유저 정보 보기 버튼 제거
        const userInfoBtn = document.querySelector('.user_info_btn');
        userInfoBtn.classList.add('hidden');

        //글 쓰기 section 제거
        document.querySelector('.write_post_section').classList.add('hidden');
    }
}

//포스트데이터를 가져오는 함수
const getPostData = async (from = 0)=>{
    return new Promise(async (resolve, reject) => {
        //request post data
        const response = await fetch(`/post/all?from=${from}`);
        const result = await response.json();

        console.log(`${from}으로 검색 완료`);

        if(result.success){ //성공하면
            resolve(result.data);
        }else if(result.code === 500){ //데이터베이스 에러 발생시
            reject([]);
        }
    })
}

//게시글을 뿌려주는 함수
const addPostItem = (postItemArray=[]) => {
    //remove all post item
    document.querySelectorAll('.post_container>div').forEach((postItem) => {
        postItem.remove();
    })

    //add post item
    postItemArray.forEach((postItem,index)=>{
        const postIdx = postItem.post_idx;
        const postTitle = postItem.post_title;
        const postAuthor = postItem.nickname; //닉네임을 표시하는 것으로 설정
        const postDate = new Date(postItem.post_date);
        const postImg = postItem.post_img_path;

        const idxContainer = document.createElement('div');
        idxContainer.innerText = postIdx;
        idxContainer.classList.add('post_item_idx_container');

        const titleContainer = document.createElement('div');
        titleContainer.classList.add('post_item_title_container');
        if(postImg.length !== 0){
            titleContainer.innerText = postTitle + ' 🖼';
        }else{
            titleContainer.innerText = postTitle;
        }

        const authorContainer = document.createElement('div');
        authorContainer.classList.add('post_item_author_container');
        authorContainer.innerText = postAuthor;

        const dateContainer = document.createElement('div');
        dateContainer.classList.add('post_item_date_container');
        dateContainer.innerText = `${postDate.getFullYear()}-${postDate.getMonth()+1}-${postDate.getDate()}`;

        const postItemDiv = document.createElement('div');
        postItemDiv.classList.add('post_item');
        postItemDiv.dataset.postIdx = postIdx;
        postItemDiv.append(idxContainer);
        postItemDiv.append(titleContainer);
        postItemDiv.append(authorContainer);
        postItemDiv.append(dateContainer);
        postItemDiv.addEventListener('click',()=>{
            location.href = `/page/post/${postIdx}`;
        })
        document.querySelector('.post_container').append(postItemDiv);
    })

    if(postItemArray.length === 0){
        //img
        const img = document.createElement('img');
        img.src = 'https://static.thenounproject.com/png/2157340-200.png';

        //nothing post container
        const nothingPostContainer = document.createElement('div');
        nothingPostContainer.classList.add('nothing_post_container');
        nothingPostContainer.append(img);

        document.querySelector('.post_container').append(nothingPostContainer);
    }
}

//오늘 로그인한 회원 수 가져오는 함수
const getLoginCount = async () => {
    //request today total login count
    const response = await fetch('/login-count');
    const result = await response.json();

    if(result.success){
        console.log(result.data); 
        return result.data;
    }else{
        return -1;
    }
}

//검색 키워드를 가져오는 함수
const getSearchKeywordArray = () => {
    return new Promise(async (resolve, reject) => {
        const response = await fetch('/search-keyword');
        const result = await response.json();
    
        if(result.success){
            resolve(result.data);
        }else{
            resolve([])
        }
    })
}

//알림 존재 여부 확인 함수
const checkNotification = async (userId) => {
    //request notification data
    const response = await fetch(`/notice/${userId}`);
    const result = await response.json();

    //check result
    if(result.success){
        if(result.data.length !== 0){
            document.querySelector('.new_notification_logo').classList.remove('hidden');
            
            addNotification(result.data);

            console.log(result.data);
        }  
    }
}

//알림 뿌려주는 함수
const addNotification = (notificationArray) => {
    const typeText = {
        code1 : "님이 댓글을 남겼습니다."
    };

    notificationArray.forEach((notification) => {
        //prepare data
        const code = notification.code;
        const nickname = notification.nickname;
        const idx = notification.idx;
        const contents = notification.contents;
        const id = notification.id;
        const noticeIdx = notification.noticeIdx;

        const notificationTypeContentsContainer = document.createElement('div');
        notificationTypeContentsContainer.classList.add('notification_type_contents_container');

        if(code === '1'){
            //user span
            const userSpan = document.createElement('span');
            userSpan.innerText = nickname;
            userSpan.classList.add('notification_user');
            
            //type span
            const typeSpan = document.createElement('span');
            typeSpan.innerText = typeText[`code${code}`];

            //append
            notificationTypeContentsContainer.append(userSpan);
            notificationTypeContentsContainer.append(typeSpan);
        }

        //notification contents
        const notificationContentsContainer = document.createElement('div');
        notificationContentsContainer.classList.add('notification_contents_container');
        notificationContentsContainer.innerText = contents;

        //notification item
        const notificationItem = document.createElement('div');
        notificationItem.classList.add('notification_item');
        notificationItem.append(notificationTypeContentsContainer);
        notificationItem.append(notificationContentsContainer);
        notificationItem.addEventListener('click', async (e) => {
            const response = await fetch(`/notice/${noticeIdx}?userId=${id}`, {
                method : "DELETE"
            })
            const result = await response.json();

            if(result.success){
                location.href = `/page/post/${idx}`;
            }else{
                alert('에러가 발생했습니다.');
                location.reload();
            }
        })

        //item container
        const notificationItemContainer = document.querySelector('.notification_item_container');
        notificationItemContainer.append(notificationItem);
    })
}

//게시판 최근 검색어를 화면에 띄워주는 함수
const addCurSearchKeyword = (keywordList) => {
    removeCurSearchKeyword();
    keywordList.forEach((keyword) => {
        //span
        const span = document.createElement('span');
        span.innerText = keyword;
        
        //item
        const curSearchItem = document.createElement('div');
        curSearchItem.classList.add('cur_search_item');
        curSearchItem.append(span);
        curSearchItem.addEventListener('mousedown', async (e) => {
            //prepare data
            const keyword = e.currentTarget.querySelector('span').innerText;
            
            //display search keyword
            document.querySelector('#search-keyword').value = keyword;

            //request search post
            const response = await fetch(`/post?keyword=${keyword}`);
            const result = await response.json();

            addPostItem(result.data);
        })

        //cur_search_container
        const curSearchContainer = document.querySelector('.cur_search_container');
        curSearchContainer.append(curSearchItem);
    })
}

//최근 검색어를 화면에서 안보이게 하는 함수
const removeCurSearchKeyword = () => {
    //search item array
    const curSearchItemArray = document.querySelectorAll('.cur_search_item');

    curSearchItemArray.forEach((curSearchItem) => {
        curSearchItem.remove();
    })
}

//현재 보고 있는 페이지네이션을 가져오는 함수
const getPageNationNumber = () => {
    return parseInt(document.querySelector('.page_number_container').innerText);
}

//현재 보고 있는 페이지네이션을 수정하는 함수
const setPagenationNumber = (number) => {
    if(number === 1){
        //unactive pre btn
        document.querySelector('.pre_btn_container button').classList.add('pagenation-btn-unactive');

        //set number
        document.querySelector('.page_number_container').innerText = number;
    }else if(number >= 2){
        //set number
        document.querySelector('.page_number_container').innerText = number;

        //active pre btn
        document.querySelector('.pre_btn_container button').classList.remove('pagenation-btn-unactive');
    }
}

//게시판 검색 데이터를 가져오는 함수
const getSearchPostData = async (keyword, option = { size : 30, from : 0 }) => {
    //prepare data
    const searchType = document.querySelector('#search-type-select').value;
    const dateRange = document.querySelector('#date-range-select').value;
    const db = document.querySelector('#db-select').value;

    return new Promise(async (resolve, reject) => {
        //request search post
        try{
            const response = await fetch(`/post?keyword=${keyword}&size=${option.size}&from=${option.from}&date-range=${dateRange}&search-type=${searchType}&db=${db}`);
            const result = await response.json();
            
            resolve(result.data);
        }catch(err){
            console.log(err);

            reject([]);
        }
    })
}

//현재 검색 키워드를 가져오는 함수
const getKeyword = () => {
    return document.querySelector('#search-keyword').value;
}

//게시판 검색어 서브밋 이벤트
const submitSearchKeywordEvent = async (e) => {
    e.preventDefault();

    //prepare data
    const keyword = getKeyword();
    
    //check keyword
    if(keyword.length === 0){
        alert('검색어를 입력해주세요');
    }else{
        //get post data with search keyword
        const searchPostData = await getSearchPostData(keyword, { from : getPageNationNumber() - 1, size : 30 });

        //set page nation number
        setPagenationNumber(1);

        addPostItem(searchPostData);
    }
}

//게시판 검색어 인풋태그 포커스 이벤트
const focusSearchKeyworInputdEvent = async () => {
    const response = await fetch('/search-keyword');
    const result = await response.json();

    console.log(result);

    if(result.success){
        addCurSearchKeyword(result.data);
        console.log(result.data);
    }
}

//게시판 검색어 인풋 태그 포커스 아웃 이벤트
const focusOutSearchKeywordEvent = async () => {
    setTimeout(()=>{
        removeCurSearchKeyword();
    }, 10)
}

//최근 검색어 입력 input 이벤트
const inputCurSearchKeywordEvent = async () => {
    //prepare data
    const inputkeyword = document.querySelector('#search-keyword').value;

    if(inputkeyword.length === 0){
        const response = await fetch('/search-keyword');
        const result = await response.json();

        if(result.success){
            addCurSearchKeyword(result.data);
            console.log(result.data);
        }
    }else{
        removeCurSearchKeyword();
    }
}

//페이지네이션 이전 버튼 클릭 이벤트
const clickPagenationPreBtnEvent = async () => {
    //prepare data
    const searchKeyword = getKeyword();
    const pageNationNumber = getPageNationNumber() - 1;
    if(pageNationNumber === 0) return;

    if(searchKeyword.length === 0){  //전체 검색
        //request post data
        const postData = await getPostData(pageNationNumber - 1);
        addPostItem(postData);
    
        //set page nation number
        setPagenationNumber(pageNationNumber);
    }else{   //키워드 검색
        //request post data with keyword
        const searchPostData = await getSearchPostData(searchKeyword, { from : pageNationNumber - 1, size : 30 });
        addPostItem(searchPostData);

        //set page nation number
        setPagenationNumber(pageNationNumber);
    }
}

//페이지네이션 다음 버튼 클릭 이벤트
const clickPagenationNextBtnEvent = async () => {
    //prepare data
    const pageNationNumber = getPageNationNumber();
    const searchKeyword = getKeyword();

    if(searchKeyword.length === 0){ //get all post data
        //request post data
        const postData = await getPostData(pageNationNumber);
        addPostItem(postData);

        //set page nation number
        setPagenationNumber(pageNationNumber + 1);
    }else{  //get post data with search keyword
        //request post data
        const postData = await getSearchPostData(searchKeyword, { from : pageNationNumber, size : 30 });
        addPostItem(postData);

        //set pagenatio number
        setPagenationNumber(pageNationNumber + 1);
    }
}