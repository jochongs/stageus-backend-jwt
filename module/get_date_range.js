module.exports = (dateRangeString) => {
    const date = new Date();
    date.setHours(date.getHours() + 9);

    if(dateRangeString === 'all'){
        return 0;
    }else if(dateRangeString === 'today'){
        date.setHours(0);
        date.setSeconds(0);
        date.setMinutes(0);
        date.setMilliseconds(0);
    }else if(dateRangeString === 'yesterday'){
        date.setDate(date.getDate() - 1);
        date.setHours(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        date.setMinutes(0);
    }else{
        date.setDate(date.getDate() - 3);
        date.setHours(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        date.setMinutes(0);
    }
    return date.getTime();
}