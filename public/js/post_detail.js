window.onload = ()=>{
    const postIdx = location.pathname.split('/')[location.pathname.split('/').length-1];
    requestPostData(postIdx);
    requestCommentData(postIdx);
    checkLoginState();
}

const requestPostData = async (postIdx)=>{
    //request post data
    const response = await fetch(`/post/${postIdx}`);

    //request user data
    const response2 = await fetch('/session');
    const result2 = await response2.json();
    const userData = result2.data;

    if(response.status === 200){
        const result = await response.json();
        const data = result.data;

        const postAuthor = data.post_author.trim();

        const date = new Date(data.post_date);
        const dateDiv = document.querySelector('.date_container');
        dateDiv.innerText = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate().toString().padStart(2,0)}`;

        const titleDiv = document.querySelector('.title_container');
        titleDiv.innerHTML = data.post_title;

        const contentsDiv = document.querySelector('.contents_container');
        contentsDiv.innerHTML = data.post_contents;

        const authorDiv = document.querySelector('.author_container');
        authorDiv.innerHTML = data.nickname;

        //add img
        result.data.post_img_path.forEach((postImgPath) => {
            const img = document.createElement('img');
            img.setAttribute('src',`https://jochong.s3.ap-northeast-2.amazonaws.com/post/${postImgPath}`);
            document.querySelector('.contents_container').append(img);
        })

        if(userData?.id === postAuthor || userData.authority === 'admin'){
            document.querySelector('.post_detail_btn_container').classList.remove('hidden');
        }
    }else if(response.status === 404){
        location.href = '/page/error404'; 
    }else if(response.status === 409){
        alert('예상하지 못한 에러가 발생했습니다.');
    }
}

const requestCommentData = async (postIdx)=>{
    //request comment data
    const response = await fetch(`/comment?postIdx=${postIdx}`);

    if(response.status === 200){
        const result = await response.json();

        //prepare data
        const commentDataArray = result.data;

        //request user data
        const response2 = await fetch('/session');
        const result2 = await response2.json();
        const userData = result2.data;

        commentDataArray.forEach((commentData, index) => {
            const author = commentData.nickname;
            const date = new Date(commentData.comment_date);
            date.setHours(date.getHours() - 9);
            const contents = commentData.comment_contents;
            const commentIdx = commentData.comment_idx;
            const commentAuthor = commentData.comment_author.trim();
            
            //댓글 내용 div
            const commentContentsDiv = document.createElement('div');
            commentContentsDiv.classList.add('comment_contents');
            commentContentsDiv.innerText = contents;

            //댓글 작성자 div
            const commentAuthorDiv = document.createElement('div');
            commentAuthorDiv.classList.add('comment_author');
            commentAuthorDiv.innerText = author;

            //댓글 작성일 div
            const commentDateDiv = document.createElement('div');
            commentDateDiv.classList.add('comment_date');
            commentDateDiv.innerText = `${date.getFullYear()}년 ${date.getMonth()+1}월 ${date.getDate()}일`;

            //comment author date div
            const commentAuthorDateContainer = document.createElement('div');
            commentAuthorDateContainer.classList.add('comment_author_date_container');
            commentAuthorDateContainer.append(commentAuthorDiv);
            commentAuthorDateContainer.append(commentDateDiv);

            //comment item div
            const commentItem = document.createElement('div');
            commentItem.classList.add('comment_item');
            commentItem.append(commentContentsDiv);
            commentItem.append(commentAuthorDateContainer);


            console.log(userData, commentAuthor);
            if(userData.id === commentAuthor || userData.authority === 'admin'){
                //삭제 버튼 div
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '삭제';
                deleteBtn.dataset.commentIdx = commentIdx;
                deleteBtn.classList.add('comment_delete_btn');
                deleteBtn.addEventListener('click',clickDeleteCommentBtnEvent);

                //수정 버튼 div
                const modifyBtn = document.createElement('button');
                modifyBtn.innerHTML = "수정";
                modifyBtn.dataset.commentIdx = commentIdx;
                modifyBtn.classList.add('comment_modify_btn');
                modifyBtn.addEventListener('click',clickModifyCommentBtnEvent);
                
                commentAuthorDateContainer.append(deleteBtn);
                commentAuthorDateContainer.append(modifyBtn);
            }

            document.querySelector('.comment_container').append(commentItem);
        })
    }else if(response.code === 409){
        alert('에상하지 못한 에러가 발생했습니다.');
        location.reload();
    }
}

//로그인 상태 확인 함수
const checkLoginState = async () => {
    //request login state
    const response = await fetch('/session');

    if(response.status === 200){ //로그인이 되어있으면
        const result = await response.json();
        document.querySelector('.comment_container .input_container').classList.remove('hidden');

        //로그인 버튼 생성
        document.querySelector('.nav_login_btn').classList.add('hidden');

        //로그아웃 버튼 제거
        document.querySelector('.nav_logout_btn').classList.remove('hidden');

        //유저 정보 보기 버튼 생성
        const userInfoBtn = document.querySelector('.user_info_btn');
        userInfoBtn.classList.remove('hidden');
        const img = userInfoBtn.querySelector('img');
        img.classList.remove('hidden');
        userInfoBtn.innerText = result.data.id;
        userInfoBtn.append(img);
    }else{ //로그인이 되어있지 않으면
        document.querySelector('.comment_container .input_container').classList.add('hidden');

        //로그인 버튼 생성
        document.querySelector('.nav_login_btn').classList.remove('hidden');

        //로그아웃 버튼 제거
        document.querySelector('.nav_logout_btn').classList.add('hidden');

        //유저 정보 보기 버튼 제거
        const userInfoBtn = document.querySelector('.user_info_btn');
        userInfoBtn.classList.add('hidden');
    }
}

//댓글 추가 버튼 클릭 이벤트
const clickCommentSubmitBtnEvent = async ()=>{
    //prepare data
    const postIdx = location.pathname.split('/')[location.pathname.split('/').length-1];
    const comment = document.getElementById('comment').value;

    //request add comment
    const response = await fetch(`/comment?postIdx=${postIdx}`,{
        "method" : "POST",
        "headers" : {
            "Content-Type" : "application/json",
        },
        "body" : JSON.stringify({
            contents : comment,
        })
    })
    
    if(response.status === 200){
        location.reload();
    }else if(response.status == 409){
        alert('예상하지 못한 에러가 발생했습니다.');
    }else if(response.status === 401){
        location.href = '/page/login';
    }else if(response.status === 403){
        alert('권한이 없습니다.');
        location.reload();
    }
}

//댓글 삭제 버튼 클릭 이벤트
const clickDeleteCommentBtnEvent = async (e)=>{
    //prepare data
    const commentIdx = e.target.dataset.commentIdx;

    //request delete comment
    const response = await fetch(`/comment/${commentIdx}`,{
        "method" : "DELETE",
        "headers" : {
            "Content-Type" : "application/json",
        }
    })
    
    if(response.status === 200){
        location.reload();
    }else if(response.status == 409){
        alert('예상하지 못한 에러가 발생했습니다.');
    }else if(response.status === 401){
        location.href = '/page/login';
    }else if(response.status === 403){
        alert('권한이 없습니다.');
        location.reload();
    }
}

//댓글 수정 버튼 클릭 이벤트
const clickModifyCommentBtnEvent = (e)=>{
    const commentItem = e.target.parentElement.parentElement;
    const commentContents = commentItem.querySelector('.comment_contents').innerText;

    const input = document.createElement('input');
    input.id = "comment_modify_input";
    input.classList.add('comment_modify_input');
    input.value = commentContents;

    const submitBtn = document.createElement('button');
    submitBtn.classList.add('modify_comment_submit_btn');
    submitBtn.innerText = "수정완료";
    submitBtn.addEventListener('click', async ()=>{
        //prepare data
        const commentIdx = e.target.dataset.commentIdx;
        const contents = input.value;

        //request comment modify
        const response = await fetch(`/comment/${commentIdx}`, {
            "method" : "PUT",
            "headers" : {
                "Content-Type" : "application/json"
            },
            "body" : JSON.stringify({
                contents : contents,
            })
        })
        
        if(response.status === 200){
            location.reload();
        }else if(response.status == 409){
            alert('예상하지 못한 에러가 발생했습니다.');
        }else if(response.status === 401){
            location.href = '/page/login';
        }else if(response.status === 403){
            alert('권한이 없습니다.');
            location.reload();
        }
    })
    
    
    commentItem.innerHTML = "";
    commentItem.appendChild(input);
    commentItem.append(submitBtn);
}

//게시글 삭제하는 함수
const clickDeletePostBtnEvent = async ()=>{
    //prepare
    const postIdx = location.pathname.split('/')[location.pathname.split('/').length-1];

    const response = await  fetch(`/post/${postIdx}`,{
        "method" : "DELETE",
        "headers" : {
            "Content-Type" : "application/json"
        },
    })

    if(response.status === 200){
        location.href = '/';
    }else if(response.status === 401){
        location.href = '/page/login';
    }else if(response.status === 403){
        alert('삭제 권한이 없습니다.');
    }else if(response.status === 409){
        alert('예상하지 못한 에러가 발생했습니다.');
        location.reload();
    }
}

const clickModifyPostBtnEvent = ()=>{
    //삭제 수정 버튼 삭제
    document.querySelector('.post_detail_btn_container').classList.add('hidden');

    const post_container = document.querySelector('.post_detail_container');

    const titleInput = document.createElement('input');
    titleInput.id = 'modify_post_title_input';
    titleInput.classList = 'modify_post_title_input';
    

    const titleContainer = post_container.querySelector('.title_container');
    titleInput.value = titleContainer.innerText;
    titleContainer.innerHTML = "";
    titleContainer.append(titleInput);

    const contentsInput = document.createElement('textarea');
    contentsInput.classList.add('modify_post_contents_input');
    contentsInput.id= "modify_post_contents_input";

    const postModifySubmitBtn = document.createElement('button');
    postModifySubmitBtn.classList.add('post_modify_submit_btn');
    postModifySubmitBtn.innerHTML = "수정완료";
    postModifySubmitBtn.addEventListener('click',async (e)=>{
        //prepare data
        const postIdx = location.pathname.split('/')[location.pathname.split('/').length-1];       
        const titleValue = titleInput.value;
        const contentsValue = contentsInput.value;
        
        //request post modify
        const response = await fetch(`/post/${postIdx}`,{
            "method" : "PUT",
            "headers" : {
                "Content-Type" : "application/json"
            },
            "body" : JSON.stringify({
                title : titleValue,
                contents : contentsValue,
            })
        })
        
        if(response.status === 200){
            location.reload();
        }else if(response.status === 401){
            location.href = '/page/login';
        }else if(response.status === 403){
            alert('수정 권한이 없습니다.');
        }else if(response.status === 409){
            alert('예상하지 못한 에러가 발생했습니다.');
            location.reload();
        }
    })
    
    const contentsContainer = post_container.querySelector('.contents_container');
    contentsInput.value = contentsContainer.innerText;
    contentsContainer.innerHTML = "";
    contentsContainer.append(contentsInput);

    post_container.append(postModifySubmitBtn);
}