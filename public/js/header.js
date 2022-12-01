//로그아웃 버튼 클릭 이벤트
const clickLogoutBtnEvent = async ()=>{
    //request logout
    const response = await fetch('/session', {
        method : "DELETE"
    })
    const result = await response.json();

    //check result
    if(result.success){
        location.href = '/';
    }else{
        alert('로그아웃에 실패했습니다.');
        location.reload();
    }
}

//회원 정보 보기 버튼 이벤트
const clickUserInfoBtnEvent = async ()=>{
    //request login auth 
    const response = await fetch('/session');
    const result = await response.json();

    console.log(result);
    location.href = `/page/account/${result.id}`;
}

//알림 버튼 클릭 이벤트
const clickNotificationBtnEvent = async () => {
    document.querySelector('.notification_container').classList.remove('hidden');
}

//알림 창 닫기 버튼 클릭 이벤트
const clickCloseNotificationBtnEvent = () => {
    document.querySelector('.notification_container').classList.add('hidden');
}