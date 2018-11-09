
//////////////////////////////////////////////////////////////////////////////
// DirectiveQueue
//   Directives are channel updates with a duration.
//   The duration delays processiong of the next message in the queue.
//////////////////////////////////////////////////////////////////////////////

function setChannelData(directive) {
  // if (directive.universe > 0) {
  //   console.log(`setChannelData: universe=${directive.universe} channel=${directive.channelNumber}
  //     data=${directive.channelData}`);
  // }
  artnet.setChannelData(directive.universe,
    directive.channelNumber,
    directive.channelData);
    artnet.send(directive.universe);
}

class DirectiveQueue {
  constructor() {
    this.oldestIndex = 1;
    this.newestIndex = 1;
    this.directives = {};
    this.timerId = null;
    this.lastUsedTimestamp = null;
  }

  getSize() {
    return this.newestIndex - this.oldestIndex;
  }

  getRequestCount() {
    let count = 0;
    for (let index = this.oldestIndex; index < this.newestIndex; index++) {
      let directive = this.directives[index];
      if (directive.requestPlaceholder) {
        count++;
      }
    }
    return count;
  }

  getRequestCountForSession(sessionId) {
    let count = 0;
    for (let index = this.oldestIndex; index < this.newestIndex; index++) {
      let directive = this.directives[index];
      if (directive.sessionId === sessionId && directive.requestPlaceholder) {
        count++;
      }
    }
    return count;
  }

  enqueue(directive) {
    if (Array.isArray(directive)) {
      for (let arrayIndex = 0; arrayIndex < directive.length; arrayIndex++) {
        this.directives[this.newestIndex] = directive[arrayIndex];
        this.newestIndex++;
      }
    } else {
      this.directives[this.newestIndex] = directive;
      this.newestIndex++;
    }
    this.sendNextDirective();
    this.lastUsedTimestamp = new Date();
  }

  dequeue() {
    const oldestIndex = this.oldestIndex;
    const newestIndex = this.newestIndex;
    let directive;
 
    if (oldestIndex !== newestIndex) {
      this.lastUsedTimestamp = new Date();
      directive = this.directives[oldestIndex];
      delete this.directives[oldestIndex];
      this.oldestIndex++;
      return directive;
    }
    return undefined;
  }

  sendNextDirective() {
    if (this.timerId === undefined || this.timerId === null) {
      let directive = this.dequeue();
      if (directive && directive.universe !== undefined) {
        setChannelData(directive);
        const duration = directive.duration;
        if (duration !== undefined && duration !== null) {
          this.timerId = setTimeout(
            this.onThrottleTimeout.bind(this), duration);
        }
      }
    }
  }
  
  onThrottleTimeout(universe) {
    this.timerId = null;
    this.sendNextDirective();
  }
}

const directiveQueues = { };

function getQueueForElement(elementName) {
  const elementInfo = elements[elementName];
  const queueName = elementInfo.queueName;
  let queue = directiveQueues[queueName];
  if (queue === null || queue === undefined) {
    queue = new DirectiveQueue();
    directiveQueues[queueName] = queue;
    console.log(`Creating queue ${queueName} for ${elementName}`)
  }
  return queue;
}

function enqueueDirectives(directives) {
  if (Array.isArray(directives)) {
    for (let arrayIndex = 0; arrayIndex < directives.length; arrayIndex++) {
      enqueueOneDirective(directives[arrayIndex]);
    }
  } else {
    enqueueOneDirective(directives);
  }
}

function enqueueOneDirective(directive) {
  if (directive !== null && directive !== undefined) {
    let queue = getQueueForElement(directive.elementName);
    queue.enqueue(directive);
  }
}

function getQueueMessage(elementName) {
  const queue = getQueueForElement(elementName);
  const count = queue.getRequestCount();
  if (count == 1) {
    return `(There is one request ahead of yours.)`;
  } else if (count > 1) {
    return `(There are ${count} requests ahead of yours.)`;
  }
  return '';
}

function enqueueRequestPlaceholder(sessionId, elementName) {
  let directive = {};

  directive.sessionId = sessionId;
  directive.elementName = elementName;
  directive.requestPlaceholder = true;

  // console.log(`enqueueRequestPlaceholder: sessionId=${sessionId} elementName=${elementName}`);

  enqueueOneDirective(directive);
}

function checkOverUse(sessionId, elementName) {
  let message = null;

  const queue = getQueueForElement(elementName);

  if (queue.getRequestCountForSession(sessionId) >= maxRequestPerUser) {
    message = `You have two many requests in the queue now.  Please try again in a few minutes.`;
  }

  return message;
}
