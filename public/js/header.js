//로그아웃 버튼 클릭 이벤트
const clickLogoutBtnEvent = ()=>{
    if(localStorage.getItem('token') === null){
        alert("이미 로그아웃 되었습니다.");
        location.reload();
    }else{
        localStorage.removeItem("token");
        alert('로그아웃 되었습니다.');
        location.reload();
    }
}

//회원 정보보기 버튼 이벤트
const clickUserInfoBtnEvent = async ()=>{
    const token = localStorage.getItem('token');
    
    if(token === null){

    }else{
        const response = await fetch(`/session`,{
            method : "GET",
            headers : {
                Authorization : token
            }
        });
        const result = await response.json();
        
        if(result.success){
            location.href = `/page/account/${result.id}`;
        }else{
            alert('접근권한이 없습니다.');
            location.reload();
        }
    }
}