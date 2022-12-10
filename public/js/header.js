//로그아웃 버튼 클릭 이벤트
const clickLogoutBtnEvent = async ()=>{
    //request logout
    const response = await fetch('/session', {
        method : "DELETE"
    })

    //check result
    if(response.status === 200){
        location.href = '/';
    }else if(response.status === 401){
        alert('이미 로그아웃 되어있습니다.');
    }
}

//회원 정보 보기 버튼 이벤트
const clickUserInfoBtnEvent = async ()=>{
    //request login auth 
    const response = await fetch('/session');
    
    if(response.status === 200){
        const result = await response.json();
        location.href = `/page/account/${result.data.id}`;
    }else if(response.status === 401){
        location.href = '/page/login';
    }else if(response.status === 403){
        alert('접근 권한이 없습니다.');
    }
}

//알림 버튼 클릭 이벤트
const clickNotificationBtnEvent = async () => {
    document.querySelector('.notification_container').classList.remove('hidden');
}

//알림 창 닫기 버튼 클릭 이벤트
const clickCloseNotificationBtnEvent = () => {
    document.querySelector('.notification_container').classList.add('hidden');
}