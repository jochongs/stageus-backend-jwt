window.onload = ()=>{
    checkLoginState();
    getAccountData();
}

//로그인 상태와 사용자의 아이디를 가져오는 함수
const checkLoginState = async ()=>{
    const response = await fetch('/session');
    const result = await response.json();
    
    if(result.state){ //로그인을 한 경우
        //로그인 버튼 생성
        document.querySelector('.nav_login_btn').classList.add('hidden');

        //로그아웃 버튼 제거
        document.querySelector('.nav_logout_btn').classList.remove('hidden');

        //유저 정보 보기 버튼 생성
        const userInfoBtn = document.querySelector('.user_info_btn');
        userInfoBtn.classList.remove('hidden');
        const img = userInfoBtn.querySelector('img');
        img.classList.remove('hidden');
        userInfoBtn.innerText = result.id;
        userInfoBtn.append(img);
    }else{ //로그인이 되지 않았을 경우
        //로그인 버튼 생성
        document.querySelector('.nav_login_btn').classList.remove('hidden');

        //로그아웃 버튼 제거
        document.querySelector('.nav_logout_btn').classList.add('hidden');

        //유저 정보 보기 버튼 제거
        const userInfoBtn = document.querySelector('.user_info_btn');
        userInfoBtn.classList.add('hidden');
    }
}

//사용자의 정보를 받아오는 API
const getAccountData = async ()=>{
    //사용자 아이디 
    const userId = location.pathname.split('/')[location.pathname.split('/').length-1];

    //요청
    const response = await fetch(`/account/${userId}`);
    const result = await response.json();

    if(result.state){
        console.log(result.data);
        //DB값 가져오기
        const data = result.data[0];
        const id = data.id;
        const name = data.name.trim();
        const nickname = data.nickname.trim();

        //Div 가져오기
        const profileIdDiv = document.querySelector('.profile_id');
        const profileNameDiv = document.querySelector('.profile_name');
        const profileNicknameDiv = document.querySelector('.profile_nickname');

        //값 넣기
        profileIdDiv.innerText = id;
        profileNameDiv.innerText = name;
        profileNicknameDiv.innerText = nickname;
    }else{
        if(!result.error.auth){
            alert(result.error.errorMessage);
            location.href = '/';
        }else if(result.error.DB){
            location.href = '/page/error';
        }
    }
}

//수정하기 버튼 클릭 이벤트 
const clickModifyUserInfoBtnEvent = ()=>{   
    const nameInput = document.createElement('input');
    nameInput.classList.add('modify_name_input');
    nameInput.classList.add('modify-input');

    const nicknameInput = document.createElement('input');
    nicknameInput.classList.add('modify_nickname_input');
    nicknameInput.classList.add('modify-input');

    const nameContainer = document.querySelector('.profile_name');
    nameInput.value = nameContainer.innerText;
    nameContainer.innerHTML = "";
    nameContainer.append(nameInput);

    const nicknameContainer = document.querySelector('.profile_nickname');
    nicknameInput.value = nicknameContainer.innerText;
    nicknameContainer.innerHTML = "";
    nicknameContainer.append(nicknameInput);

    const modifySubmitBtn = document.createElement('button');
    modifySubmitBtn.classList.add('profile_modify_btn');
    modifySubmitBtn.innerText = "수정완료";
    modifySubmitBtn.addEventListener('click',async (e)=>{
        const name = nameInput.value;
        const nickname = nicknameInput.value;
        const usreId = location.pathname.split('/')[location.pathname.split('/').length-1];

        const errorMessageContainerArray = document.querySelectorAll('.error-container');
        errorMessageContainerArray.forEach((errorMessageContainer)=>{
            errorMessageContainer.remove();
        })  

        const response = await fetch(`/account/${usreId}`,{
            "method" : "PUT",
            "headers" : {
                "Content-Type" : "application/json"
            },
            "body" : JSON.stringify({
                name : name,
                nickname : nickname,
            })
        })
        const result = await response.json();

        console.log(result);    
        
        if(result.state){
            location.reload();
        }else{
            if(result.error.DB){
                location.href = "/page/error";
            }else if(!result.error.auth){
                alert(result.error.errorMessage);
            }else{
                result.error.errorMessage.forEach((error)=>{
                    const errorContainer = document.createElement('div');
                    errorContainer.classList.add('error-container');
                    errorContainer.innerText = error.message;

                    const className = `.profile_${error.class}_container`;
                    console.log(className);
                    const profileContaienr = document.querySelector(className);
                    profileContaienr.append(errorContainer);
                })
            }
        }
    });
    
    const profileModifyBtnContainer = document.querySelector('.profile_modify_btn_container');
    profileModifyBtnContainer.innerHTML = "";
    profileModifyBtnContainer.append(modifySubmitBtn);
}