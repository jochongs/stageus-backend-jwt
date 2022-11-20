const loginEvent = async ()=>{
    const idValue = document.querySelector('#id_input').value;
    const pwValue = document.querySelector('#pw_input').value;
    const errorDiv = document.querySelector('.error_message_div');
    
    //에러 메시지 초기화
    errorDiv.innerHTML = "";
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

    if(result.state){ //로그인 성공시
        location.href = document.referrer;
    }else if(result.error.DB){ //DB에러 발생시
        location.href = '/page/error';
    }else{
        errorDiv.innerHTML = `*${result.error.errorMessage}`;
    }
}