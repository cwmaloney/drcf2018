"use strict";

class TimestampUtilities {

  static getNowTimestampObject() {
    const nowDate = new Date();
    const nowTimestampObject = { year: nowDate.getFullYear(), month: nowDate.getMonth()+1, day: nowDate.getDate(),
                                  hour: nowDate.getHours(), minute: nowDate.getMinutes()};
    return nowTimestampObject;
  }

  static getNowTimestampNumber() {
    const timestampObject = TimestampUtilities.getNowTimestampObject();
    const timestampString = TimestampUtilities.getTimestampStringFromObject(timestampObject);
    const timestampNumber = TimestampUtilities.getTimestampNumber(timestampString);
    return timestampNumber;            
  }

  static parseDateAndTime(date, time) {
    // get now - use it for defaults
    const nowTimestampObject = TimestampUtilities.getNowTimestampObject();

    let parsed = Object.assign(nowTimestampObject);

    if (date) {
      // const parsedDate = new Date(temp);
      // parsed.year = parsedDate.getYear();
      // parsed.month = parsedDate.getMonth();
      // parsed.day = parsedDate.getDay();

      let temp = date;
      const indexOfT = temp.indexOf('T');
      if (indexOfT){
        temp = temp.substr(0, indexOfT);
      }    
      const dateParts = temp.split('-');
      if (dateParts.length > 3) {
        throw new Error(`invalid date ${date}`);
      } else if (dateParts.length == 3) {
        parsed.year = Number.parseInt(dateParts[0]);
        parsed.month = Number.parseInt(dateParts[1]);
        parsed.day = Number.parseInt(dateParts[2]);
      } else if (dateParts.length == 2) {
        parsed.month = Number.parseInt(dateParts[0]);
        parsed.day = Number.parseInt(dateParts[1]);
      } else if (dateParts.length == 1) {
        parsed.day = Number.parseInt(dateParts[0]);
      }
      if (parsed.year > nowTimestampObject.year) {
        throw new Error(`Invalid date ${date} - Year must be ${nowTimestampObject.year}`);
      }
      if (parsed.month != 2) {
        throw new Error(`Invalid date ${date} - Month must be February`);
      }
      if (parsed.day < 1 || parsed.day > 28) {
        throw new Error(`Invalid date ${date} - Day must be between 1 and 28`);       
      }
    }

    if (time) {
      // const parsedTime = new Date(time);
      // parsed.hour = parseTime.getHours();
      // parsed.minute = parseMinut.getMinutes();
 
      let temp = time;
      const indexOfT = temp.indexOf('T');
      if (indexOfT){
        temp = temp.substr(indexOfT+1);
      }
      const indexOfDash = temp.indexOf('-');
      if (indexOfDash){
        temp = temp.substr(0, indexOfDash);
      }    
 
      const timeParts = temp.split(':');
      if (timeParts.length > 3) {
        throw new Error(`Invalid time ${time}`);
      } else if (timeParts.length == 3 || timeParts.length == 2) {
        parsed.hour = Number.parseInt(timeParts[0]);
        parsed.minute = Number.parseInt(timeParts[1]);
        // ignore seconds
      } else if (timeParts.length == 1) {
        parsed.hour = Number.parseInt(timeParts[0]);
        parsed.minute = 0;
      }
      if (parsed.hour < 0 || parsed.hour > 23) {
        throw new Error(`Invalid time ${time} - Hour must be between 0 and 23`);
      }
      if (parsed.minute < 0 || parsed.minute > 59) {
        throw new Error(`Invalid time ${time} - Minute must be between 0 and 59`);
      }
    }

    // adjust time to PM
    if (nowTimestampObject.year === parsed.now
        && nowTimestampObject.year === parsed.month
        && nowTimestampObject.day === parsed.day
        && nowTimestampObject.hour >= parsed.hour
        && parsed.hour < 12) {
      parsed.hour += 12;
    }

    return parsed;
  }

  static getTimestampString(year, month, day, hour, minute) {
    return year.toString().padStart(4,0)
            + month.toString().padStart(2,0)
            + day.toString().padStart(2,0)
            + hour.toString().padStart(2,0)
            + minute.toString().padStart(2,0);
  }

  static getTimestampStringFromObject(timestampObject) {
    const timestampString = TimestampUtilities.getTimestampString(
      timestampObject.year, timestampObject.month, timestampObject.day,
      timestampObject.hour, timestampObject.minute);
    return timestampString;
  }

  static getTimestampNumber(timeString) {
    return new Number(timeString);
  }

}

module.exports = TimestampUtilities;
