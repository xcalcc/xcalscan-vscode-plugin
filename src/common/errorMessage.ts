import language from './language';

/*
 * Formatting error message
 */
export const formattingApiMessage = (message: string, unifyErrorCode: string) => {
    let newMessage;
    let msgList = message.match(/(\[.+?\])/g) || [];

    if (msgList.length === 0) {
        newMessage = message;
    }
    else {
        msgList = msgList.map(v => language(v.replace(/\[|\]/g, "")));
        newMessage = msgList.join("\n");
    }

    return `${newMessage}` + (unifyErrorCode ? ` (${unifyErrorCode})` : "");
}

/*
 * Get error message for try catch
 */
export const getApiMessage = (error: any) => {
    let message;
    if(!error){
        return error;
    }

    if(error.response){
      let data = error.response.data || {};
      if(typeof data === "string"){
        //server error (e.g. http 500)
        message = language(error.response.statusText);
      } else {
        //api error
        message = data.localizedMessage || data.message || error.response.statusText;
        message = formattingApiMessage(message, data.unifyErrorCode);
      }
    } else {
      //js error or Network Error
      message = error.toString();
      message = message.replace(/Error:\s?/, "");
      message = language(message) || "";
    }
  
    return message;
  }