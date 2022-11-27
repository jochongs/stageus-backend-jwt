const clickWriteBtnEvent = async ()=>{
    //prepare data
    const titleValue = document.getElementById('title').value;
    const contentsValue = document.getElementById('contents').value;
    const postImgArray = document.querySelector('.post_img_input').files;

    if(postImgArray.legnth > 3){
        alert('이미지는 3개까지 올릴 수 있습니다.');
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
        const result = await response.json();

        //check result
        if(result.success){
            location.reload();
        }else if(result.code === 500){
            location.href = "/page/error";
        }else if(!result.auth){
            alert('권한이 없습니다.');
            localStorage.removeItem('token'); //maybe token expired
        }
    }
}