export const isJson = (obj: any) => Object.prototype.toString.call(obj) === "[object Object]";

export const isJsonString = (str: string) => {
    if(!str) {
        return false;
    }

    try {
        return isJson(JSON.parse(str));
    } catch(err) {
        return false;
    }
};
  
export const isSingleJsonString = (str: string) => {
    if(!str) {
        return false;
    }

    try {
        let existsObject = false;
        let obj = JSON.parse(str);
  
        if(Array.isArray(obj)) {
            return false;
        }
  
        for(let key in obj){
            if(typeof obj[key] !== 'string' && typeof obj[key] !== 'number') {
                existsObject = true;
                break;
            }
        }
        return existsObject ? false : true;
    } catch(err) {
        return false;
    }
};

export const isEmptyObject = (obj: object) => {
    for(let key in obj){
        return false;
    }
        return true;
}