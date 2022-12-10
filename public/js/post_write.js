const clickWriteBtnEvent = async ()=>{
    document.querySelector('.post_submit_btn').disabled = true;
        
    //prepare data
    const titleValue = document.getElementById('title').value;
    const contentsValue = document.getElementById('contents').value;
    const postImgArray = document.querySelector('.post_img_input').files;

    if(postImgArray.legnth > 3){
        alert('이미지는 3개까지 올릴 수 있습니다.');
        document.querySelector('.post_submit_btn').disabled = false;
    }else{
        //make formdata
        const formData = new FormData();
        formData.append('title', titleValue);
        formData.append('contents', contentsValue);
        for(let i = 0; i < postImgArray.length; i++){
            formData.append(`postImg`,postImgArray[i]);
        }

        //request
        const response = await fetch('/post', {
            "method" : "POST",
            "headers" : {
            },
            "body" : formData,
        })

        document.querySelector('.post_submit_btn').disabled = false;

        if(response.status === 200){
            location.reload();
        }else if(response.status === 401){
            location.href = '/page/login';
        }else if(response.status === 409){
            alert('예상하지 못한 에러가 발생했습니다.');
        }else if(400){
            alert('제목과 내용의 길이를 확인해주세요. 제목은 32글자를 넘을 수 없고 제목과 내용은 빈칸 일 수 없습니다. 이미지 파일 용량은 1mb를 넘을 수 없습니다.');
        }
    }
}