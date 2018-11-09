
//////////////////////////////////////////////////////////////////////////////
// sessionDataCache is keyed by session id from Dialogflow
// The session data object is the value of the map.
// The session data object contains a sequence number, creation data, and last used date.
const sessionDataCache = new Map();
const maxSessionCount = 2;
let sessionCounter = 0;

function removeOldSessionsFromCache() {
  // remove old sessions when the cache is full
  while (sessionDataCache.length > maxSessionCount) {
    let sessiondIdToDelete = undefined;
    let sessionDataToDelete = undefined;
    for (const sessionId of sessionDataCache.keys()) {
      // delete oldest session
      const sessionData = sessionDataCache.get(sessionId);
      if (sessionData.lastUsedTimestamp < sessionToDelete.lastUsedTimestamp) {
        sessionIdToDelete = sessionId;
        sessionDataToDelete = sessionData;
      }
    }
    if (sessiondIdToDelete) {
      console.log(`removing oldest sessionData: sessionId=${sessiondIdToDelete}`)
      sessionDataCache.delete(sessiondIdToDelete);
    }
  }
}

function getSessionData(sessionId) {
  let sessionData = sessionDataCache.get(sessionId);
  if (sessionData === undefined) {
    sessionData = { sequence: sessionCounter++, creationTimestamp: new Date(), requests: 0 };
    sessionDataCache.set(sessionId, sessionData);
    console.log(`${sessionData.sequence}: creatingSessionData: sessionId=${sessionId.slice(-12)}`)
  }
  // console.log(`getSessionData: session=${sessionId} data=${sessionDataCache[sessionId]}`);

  removeOldSessionsFromCache();

  return sessionData;
}

function getTimestamp(now) {
  return `[${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}]`
}
