/*
 * Convert string to date
 */
export const parseDate = (str: any) => {
    if(!str) {
        throw new Error("Value cannot be null of 'parseDate()'!");
    }

    if (/^\d{10}$/.test(str)) {
        return new Date(str * 1000);
    } else if (/^\d{13}$/.test(str)) {
        return new Date(str * 1);
    }

    if(/\date\d/.test(str) && str.indexOf('+0000') > -1){
        //Is only used to Xcalibyte (ex. 2019-08-14T06:21:09.842+0000)
        let a:any = str.match(/\d+/g) || [];
        return new Date(a[0], a[1]-1, a[2], a[3], a[4], a[5]);
    }

    return new Date(str.toString().replace(/-/g, "/"));
}

/*
 * Date format
 * dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss.S") ==> 2001-07-02 08:09:04.423
 * dateFormat(new Date(), "yyyy-M-d h:m:s.S")      ==> 2001-7-2 8:9:4.18
 */
export const dateFormat = (date: Date, fmt: string) => {
    var o: any = {
      "M+": date.getMonth() + 1,
      "d+": date.getDate(),
      "h+": date.getHours(),
      "m+": date.getMinutes(),
      "s+": date.getSeconds(),
      "q+": Math.floor((date.getMonth() + 3) / 3),
      "S": date.getMilliseconds()
    };

    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }

    for (var k in o){
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      }
    }

    return fmt;
  }


export function secondToTime(second: number){
    let hour = Math.floor(second / 3600);
    second = hour ? (second % 3600) : second;

    let minute = Math.floor(second / 60);
    second = minute ? (second % 60) : second;

    let _hour = hour < 10 ? "0" + hour : hour;
    let _minute = minute < 10 ? "0" + minute : minute;
    let _second = second < 10 ? "0" + second : second;
    return `${_hour}:${_minute}:${_second}`;
}