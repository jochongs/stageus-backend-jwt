window.onload = async () => {
    //auth요청
    const response = await fetch('/auth');
    const result = await response.json();

    if(result.success){
        localStorage.setItem('token', result.token);
        location.href = '/';
    }
}

const loginEvent = async ()=>{
    const idValue = document.querySelector('#id_input').value;
    const pwValue = document.querySelector('#pw_input').value;
    const errorDiv = document.querySelector('.error_message_div');
    
    //에러 메시지 초기화
    errorDiv.innerHTML = "";

    //request login
    const response = await fetch('/session',{
        "method" : "POST",
        "headers" : {
            "Content-Type" : "application/json"
        },
        "body" : JSON.stringify({
            "id" : idValue,
            "pw" : pwValue,
        })
    })

    //check result
    if(response.status === 200){
        location.href = document.referrer;
    }else if(response.status === 400){
        const result = await response.json();

        if(result.type){
            alert(`${result.type}으로 로그인해주세요`);
            location.reload();
        }else{
            errorDiv.innerHTML = `*아이디또는 비밀번호가 잘못되었습니다.`;  
        }
    }else if(response.status === 409){
        alert('예상하지 못한 에러가 발생했습니다.');
    }
}

//google login
const clickGoogleLoginBtnEvent = () => {
    location.href = '/auth/google';
}