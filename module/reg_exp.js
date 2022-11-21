const testRegExp = (testString, type='id') => {
    const tempRegExp = {
        id : /^[a-z]+[a-z0-9]{5,13}$/g, //영문자로 시작하는 영문자 또는 숫자 6~12자
        pw : /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,12}$/, //8~12자 영문, 숫자 조합
        name : /^(?=.*[a-z0-9가-힣])[a-z0-9가-힣]{2,6}$/, //한글 또는 숫자 2~6글자
        nickname : /^(?=.*[a-z0-9가-힣])[a-z0-9가-힣]{2,12}$/ //한글 또는 숫자 2~12글자
    }
    return tempRegExp[type].test(testString);
}

module.exports = testRegExp;