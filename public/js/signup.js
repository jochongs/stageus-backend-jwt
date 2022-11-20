const clickSignupBtnEvent = async ()=>{
    //get all input value
    const idValue = document.getElementById('id_input').value;
    const pwValue = document.getElementById('pw_input').value;
    const pwCheckValue = document.getElementById('pw_check_input').value;
    const nameValue = document.getElementById('name_input').value;
    const nicknameValue = document.getElementById('nickname_input').value;

    //delete all error-message div
    const errorMessageDivArray = document.querySelectorAll('.error-message');
    errorMessageDivArray.forEach((div)=>{
        div.remove();
    })


    const response = await fetch('/account',{
        "method" : "POST",
        "headers" : {
            "Content-Type" : "application/json"
        },
        "body" : JSON.stringify({
            "id" : idValue,
            "pw" : pwValue,
            "pwCheck" : pwCheckValue,
            "name" : nameValue,
            "nickname" : nicknameValue,
        })
    })
    const result = await response.json();
    
    if(result.state){ //성공시
        alert('회원가입 성공');
        location.href = '/page/login';
    }else{
        if(result.error.DB){ //db에러 시
            //location.href = '/page/error';
        }else{ //예외처리 에러시
            result.error.errorMessage.map((data)=>{
                const div = document.createElement('div');
                div.classList.add('error-message');
                div.innerText = data.message;
    
                document.querySelector(`.${data.class}_input_container`).append(div);
            })
        }
    }
}