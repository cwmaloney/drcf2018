"use strict";

// load dependent modules
const fs = require('fs');

class RequestQueue {

  constructor(queueName, maxPendingRequestsPerUser = 3) {
    this.queueName = queueName;
    this.maxPendingRequestsPerUser = maxPendingRequestsPerUser;
    this.nextId = 1;
    this.requests = new Map();
    this.queueFileName = queueName + ".json";
  }

  static getNowTimestampObject() {
    const nowDate = new Date();
    const nowTimestampObject = { year: nowDate.getFullYear(), month: nowDate.getMonth()+1, day: nowDate.getDate(),
                                  hour: nowDate.getHours(), minute: nowDate.getMinutes()};
    return nowTimestampObject;
  }

  static getNowTimestampNumber() {
    const timestampObject = RequestQueue.getNowTimestampObject();
    const timestampString = RequestQueue.getTimestampStringFromObject(timestampObject);
    const timestampNumber = RequestQueue.getTimestampNumber(timestampString);
    return timestampNumber;            
  }

  static parseDateAndTime(date, time) {
    // get now - use it for defaults
    const nowTimestampObject = RequestQueue.getNowTimestampObject();;

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
        throw new Error(`Invalid date ${date} - Year must be ${now.year}`);
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
    const timestampString = RequestQueue.getTimestampString(
      timestampObject.year, timestampObject.month, timestampObject.day,
      timestampObject.hour, timestampObject.minute);
    return timestampString;
  }

  static getTimestampNumber(timeString) {
    return new Number(timeString);
  }

  getNextRequestId() {
    return this.nextId;
  }

  // get requests that have request times "in the past"
  // and have not been processed
  getActiveRequests() {
    const activeRequests = [];
    const currentTimestampNumber = RequestQueue.getNowTimestampNumber();
    for (const timestampNumber of this.requests.keys()) {
      if (timestampNumber <= currentTimestampNumber) {
        const timestampObject = this.requests.get(timestampNumber);
        for (let index = 0; index < timestampObject.requests.length; index++) {
          let requestObject = timestampObject.requests[index];
          if (requestObject.processedCount === undefined || requestObject.processedCount < 1) {      
            activeRequests.push(requestObject);
          }
        }
      }
    }
    return activeRequests;
  }

  // ----- file storage -----

  loadRequests(fileName) {
    if (!fileName) {
      fileName = this.queueFileName;
    }
    if (fs.existsSync(fileName)) {
      console.log(`loading requests from ${fileName}...`);

      try {
        const temp = JSON.parse(fs.readFileSync(fileName, 'utf8'));
        this.nextId = temp.nextId;
        this.requests = new Map(temp.map);
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }

      console.log(`loading requests complete nextId=${this.nextId} size=${this.requests.size}`);
    }
  }

  writeRequests(fileName) {
    if (!fileName) {
      fileName = this.queueFileName;
    }
    //console.log(`writing requests to ${fileName} nextId=${this.nextId} size=${this.requests.size} ...`);

    const temp = { nextId: this.nextId, map: [...this.requests] };

    fs.writeFileSync(fileName, JSON.stringify(temp, null, '\t'), 'utf8');

    //console.log(`writing requests complete`);
  }

  // ----- queue / dequeue ----

  addRequest(sessionId, request, date, time) {
    const nowTimestampNumber = RequestQueue.getNowTimestampNumber();

    const timestampObject = RequestQueue.parseDateAndTime(date, time);
    const timestampString = RequestQueue.getTimestampStringFromObject(timestampObject);
    const timestampNumber = RequestQueue.getTimestampNumber(timestampString);

    if (timestampNumber < nowTimestampNumber) {
      throw new Error(`Requested request time is in the past`);
    }

    let timestampMapObject = this.requests.get(timestampString);
    if (!timestampMapObject) {
      timestampMapObject = { timestampObject, timestampString, timestampNumber, requests: [] };
      this.requests.set(timestampString, timestampMapObject);
    }
    const id = this.nextId++;

    console.log("addRequest:", sessionId, id, request, date, time);

    const requestObject = { sessionId, id, request, processedCount: 0 };
    if (date) {
      requestObject.formattedDate
        = (timestampObject.month).toString().padStart(2,0)
          + '/' + (timestampObject.day).toString().padStart(2,0);
    }
    if (time) {
      requestObject.formattedTime
        = (timestampObject.hour).toString().padStart(2,0)
          + ':' + (timestampObject.minute).toString().padStart(2,0);
    }
    timestampMapObject.requests.push(requestObject);
    this.writeRequests();

    return requestObject;
  }

  // get requests that have request times "in the future"
  getQueuedRequests() {
    const queuedRequests = [];
    const currentTimestampNumber = RequestQueue.getNowTimestampNumber();
    for (const timestampNumber of this.requests.keys()) {
      if (timestampNumber > currentTimestampNumber) {
        const timestampObject = this.requests.get(timestampNumber);
        for (let index = 0; index < timestampObject.requests.length; index++) {
          let requestObject = timestampObject.requests[index];
          if (requestObject.processedCount === undefined || requestObject.processedCount < 1) {      
            queuedRequests.push(requestObject);
          }
        }
      }
    }
    return queuedRequests;
  }

  getNextRequest() {
    const activeRequests = this.getActiveRequests();
    let nextRequest = null;
    if (activeRequests.length > 0) {
      nextRequest = activeRequests[0];
      for (let index = 1; index < activeRequests.length; index++) {
        const requestObject = activeRequests[index];
        if (requestObject.id < nextRequest.id) {      
          nextRequest = requestObject;
        }
      }
    }
    return nextRequest;
  }

  checkOverUse(sessionId) {
    let response = null;

    const count = this.getRequestCountForSession(sessionId);   
    if (count >= this.maxPendingRequestsPerUser) {
      response = `You have too many request in the queue.  Try again after your requests have been processed.`;
    }
  
    return response;
  }
    
  getRequestCountForSession(sessionId) {
    let count = 0;
    for (const timestampNumber of this.requests.keys()) {
      const timestampObject = this.requests.get(timestampNumber);
      for (let index = 0; index < timestampObject.requests.length; index++) {
        const requestObject = timestampObject.requests[index];
        if (requestObject.processedCount === undefined || requestObject.processedCount < 1) {
          if (requestObject.sessionId === sessionId) {
            count++;
          } 
        }
      }
    }
    return count;
  }

  findRequestById(requestId) {
    for (const timestampNumber of this.requests.keys()) {
     const requestObject = this.requests.get(timestampNumber);
      if (requestObject.id == requestId) {
        return requestObject;
      }
    }
    return null;
  }
}



module.exports = RequestQueue;


// function getFutureTime(minutes) {
//   let temp = new Date();
//   temp = new Date(temp.getTime() + minutes*60*1000);
//   const result = temp.getFullYear().toString().padStart(4,0)
//                 + '-' + (temp.getMonth() + 1).toString().padStart(2,0)
//                 + '-' + (temp.getDate()).toString().padStart(2,0)
//                 + 'T' + (temp.getHours()).toString().padStart(2,0)
//                 + ':' + (temp.getMinutes()).toString().padStart(2,0)
//                 + ':' + (temp.getSeconds()).toString().padStart(2,0)
//                 + '-0600';
//   return result;
// }

// make test safe to run on "production" computer

// function test() {
//   const queue = new RequestQueue();

//   // queue.loadRequests("noFile");

//   // queue.addRequest('1', "Amy, I love you, Sheldon");
//   // queue.addRequest('2', "Cinnamon, I love you, Raj", null, "15:01");
//   // queue.addRequest('1', "Penny, Will you be my Valentine?, Leonard", null, "15:01");
//   // queue.addRequest('3', "Bernadette, Will you marry me? Howard", "2-14", "20:00");

//   // queue.writeRequests("testRequestQueue.json");
//   // queue.loadRequests("testRequestQueue.json");
//   // queue.writeRequests("testRequestQueue.json");

//   queue.displayNextRequest();

//   function addList1() {
//     const soon = getFutureTime(2);
//     queue.addRequest('1', "Sue, I love you, Billy.  ");
//     queue.addRequest('2', "Bernadette, Will you be my Valentine? Howard.  ", null, soon);
//     queue.addRequest('3', "Sally, Will you marry me? Harry.  ", null, soon);
//   }

//   function noop() {
//   }

//   function addList2() {
//     queue.addRequest('1', "Amy, I love you, Sheldon.  ");
//     const soon = getFutureTime(2);
//     queue.addRequest('2', "Cinnamon, Will you be my Valentine? Raj  ", null, soon);
//     queue.addRequest('1', "Penny, Will you be my Valentine? Leonard.  ", null, soon);
//     queue.addRequest('3', "Luci, Will you marry me? Desi.  ", "2018-02-14T19:07:00-0600", "2018-02-14T19:07:00-0600");
//   }

//   addList1();
//   setTimeout(addList2, 25*1000);

//   setTimeout(noop, 5*60*1000);
// }

// test();
