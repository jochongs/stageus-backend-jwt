window.onload = async () => {
    //prepare data
    const token = localStorage.getItem('token');

    if(token === null){
        //auth요청
        const response = await fetch('/auth');
        const result = await response.json();

        if(result.success){
            localStorage.setItem('token', result.token);
            location.href = '/';
        }
    }
}

const loginEvent = async ()=>{
    const idValue = document.querySelector('#id_input').value;
    const pwValue = document.querySelector('#pw_input').value;
    const errorDiv = document.querySelector('.error_message_div');
    
    //에러 메시지 초기화
    errorDiv.innerHTML = "";

    //request
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
    const result = await response.json();

    //check result
    if(result.success){
        localStorage.setItem('token', result.token);
        location.href = document.referrer;
    }else if(result.code === 500){
        location.href = '/page/error';
    }else{
        errorDiv.innerHTML = `*아이디또는 비밀번호가 잘못되었습니다.`;
    }
}

//google login
const clickGoogleLoginBtnEvent = () => {
    location.href = '/auth/google';
}