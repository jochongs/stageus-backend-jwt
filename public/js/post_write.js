const clickWriteBtnEvent = async ()=>{
    const titleValue = document.getElementById('title').value;
    const contentsValue = document.getElementById('contents').value;
    const postImgArray = document.querySelector('.post_img_input').files;

    if(postImgArray.legnth > 3){
        alert('이미지는 3개까지 올릴 수 있습니다.');
    }else{
        const formData = new FormData();
        formData.append('title', titleValue);
        formData.append('contents', contentsValue);
        for(let i = 0; i < postImgArray.length; i++){
            formData.append(`postImg`,postImgArray[i]);
        }   

        const response = await fetch('/post', {
            "method" : "POST",
            "body" : formData,
        })

        const result = await response.json();
        
        console.log(result);
    
        if(result.state){ //성공시 
            location.reload();
        }else{
            if(result.DB){
                console.log(result.error.errorMessage);
                location.href = '/page/error';
            }else if(!result.error.auth){ //권한이 없을 시
                location.href = '/page/login';
            }else{ //입력 내용 예외상황 발생시
                alert(result.error.errorMessage[0].message);
            }
        }
    }
}





//SELECT DISTINCT post_title,post_contents,post_date,post_author,nickname,img_path FROM backend.post JOIN backend.account ON id=post_author JOIN backend.post_img_mapping ON backend.post.post_idx=backend.post_img_mapping.post_idx  WHERE backend.post.post_idx=57;