const moveMainPage = ()=>{
    location.href = "/";
}

const moveLoginPage = ()=>{
    location.href = "/page/login";
}

const moveSignupPage = ()=>{
    location.href = "/page/signup";
}

const movePostDetailPage = (post_idx)=>{
    location.href = `/page/post/${post_idx}`;
}