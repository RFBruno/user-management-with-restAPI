class Utils{
    
    static dateFormat(date){
        let day = date.getDate() < 10 ? '0'+date.getDate() : date.getDate();
        let month = (date.getMonth() + 1) < 10 ? '0'+(date.getMonth() + 1) : (date.getMonth() + 1);
        let minutes = date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes();

        return day+'/'+month+'/'+date.getFullYear()+' - '+date.getHours()+':'+minutes;
    }

}