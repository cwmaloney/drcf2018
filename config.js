// This file contains data we can modify without resubmitting the app for approval.
//
// we try to always make es-link "happy"
/* eslint quote-props: ["error", "always"] */
/* eslint quotes: ["error", "double"] */

const maxRequestsPerUser = 3;

//////////////////////////////////////////////////////////////////////////////
// keep active
//////////////////////////////////////////////////////////////////////////////

let idleCheckTimeout = 1 * 1000;

let idleColors = [ "red", "orange", "yellow", "green", "blue", "navy", "violet", "purple", "celadon", "white" ];
let idleTeams = [ "Chiefs", "Royals", "Sporting", "Kansas", "Kansas State", "Missouri", "Rainbow", "Santa", "USA" ];

module.exports = {
  maxRequestsPerUser,
  idleCheckTimeout,
  idleColors,
  idleTeams
  };
