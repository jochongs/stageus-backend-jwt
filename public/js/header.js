//로그아웃 버튼 클릭 이벤트
const clickLogoutBtnEvent = async ()=>{
    const request = await fetch(`/session`,{
        "method" : "DELETE",
        "headers" : {
            "Content-Type" : "application/json"
        },
    })
    const result = await request.json();

    if(result.state){
        alert('로그아웃 되었습니다.');
        location.reload();
    }else{
        alert('이미 로그아웃 되어있습니다.');
        location.reload();
    }
}

//회원 정보보기 버튼 이벤트
const clickUserInfoBtnEvent = async ()=>{
    const response = await fetch('/session');
    const result = await response.json();

    console.log(result);
    
    if(result.state){
        location.href = `/page/account/${result.id}`;
    }else{
        alert('접근권한이 없습니다.');
    }
}