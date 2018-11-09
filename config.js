//////////////////////////////////////////////////////////////////////////////
// limits

const maxQueuedRequestsPerUser = 3;

//////////////////////////////////////////////////////////////////////////////
// keep active

let idleCheckTimeout = 1 * 1000;

let idleColors = [ "red", "orange", "yellow", "green", "blue", "navy", "violet", "purple", "celadon", "white" ];
let idleTeams = [ "Chiefs", "Royals", "Sporting", "Kansas", "Kansas State", "Missouri", "Rainbow", "Santa", "USA" ];

//////////////////////////////////////////////////////////////////////////////

module.exports = {
  maxQueuedRequestsPerUser,
  idleCheckTimeout,
  idleColors,
  idleTeams
  };
