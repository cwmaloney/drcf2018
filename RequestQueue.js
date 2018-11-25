"use strict";

const fs = require('fs');

const TimestampUtilities = require("./TimestampUtilities.js");

class RequestQueue {

  constructor(queueName, maxPendingRequestsPerUser = 3) {
    this.queueName = queueName;
    this.maxPendingRequestsPerUser = maxPendingRequestsPerUser;
    this.nextId = 1;
    this.requests = new Map();
    this.queueFileName = queueName + "Queue.json";
  }

  getNextRequestId() {
    return this.nextId;
  }

  // get requests that have request times "in the past"
  // and have not been processed
  getActiveRequests() {
    const activeRequests = [];
    const currentTimestampNumber = TimestampUtilities.getNowTimestampNumber();
    for (const timestampNumber of this.requests.keys()) {
      if (timestampNumber <= currentTimestampNumber) {
        const timestampObject = this.requests.get(timestampNumber);
        for (let index = 0; index < timestampObject.requests.length; index++) {
          let requestObject = timestampObject.requests[index];
          if (!requestObject.processedTimestamp) {      
            activeRequests.push(requestObject);
          }
        }
      }
    }
    return activeRequests;
  }

  addRequest(sessionId, request, date, time) {
    const nowTimestampNumber = TimestampUtilities.getNowTimestampNumber();

    const timestampObject = TimestampUtilities.parseDateAndTime(date, time);
    const timestampString = TimestampUtilities.getTimestampStringFromObject(timestampObject);
    const timestampNumber = TimestampUtilities.getTimestampNumber(timestampString);

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

    const requestObject = { sessionId, id, request, processedTimestamp: undefined };
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
    const currentTimestampNumber = TimestampUtilities.getNowTimestampNumber();
    for (const timestampNumber of this.requests.keys()) {
      if (timestampNumber > currentTimestampNumber) {
        const timestampObject = this.requests.get(timestampNumber);
        for (let index = 0; index < timestampObject.requests.length; index++) {
          let requestObject = timestampObject.requests[index];
          if (!requestObject.processedTimestamp) {      
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
        if (!requestObject.processedTimestamp) {
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
        this.requests = new Map(temp.requests);
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

    const temp = { nextId: this.nextId, requests: [...this.requests] };

    fs.writeFileSync(fileName, JSON.stringify(temp, null, '\t'), 'utf8');

    //console.log(`writing requests complete`);
  }
}

module.exports = RequestQueue;
