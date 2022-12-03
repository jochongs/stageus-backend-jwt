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
        const result = await response.json();

        document.querySelector('.post_submit_btn').disabled = false;

        //check result
        if(result.success){
            location.reload();
        }else if(result.code === 500){
            location.href = "/page/error";
        }else if(!result.auth){
            alert('권한이 없습니다.');
            location.reload();
        }else if(result.code === 501){
            alert('이미지 파일을 다시 한번 확인해주세요 이미지 파일은 1mb용량을 넘을 수 없습니다.');
        }else{
            alert(result.errorMessage[0].message);
        }
    }
}