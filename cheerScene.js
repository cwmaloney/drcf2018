
//////////////////////////////////////////////////////////////////////////////
// cheer 
//////////////////////////////////////////////////////////////////////////////

function cheer(request, response) {
  let teamName = request.parameters.teamName;
  if (teamName === undefined || teamName == null) {
    console.error('grizilla::cheer - missing teamName');
    return;
  }

  // console.log(`cheer: ${teamName}`);

  const elementName = 'trees';

  const overUseMessage = checkOverUse(request.sessionId, elementName);
  if (overUseMessage != null && overUseMessage != undefined) {
    fillResponse(request, response, overUseMessage);
    return; 
  }

  const colorNames = teamNameToColorsMap[teamName];
  if (colorNames == undefined || colorNames == null) {
    console.error(`grizilla::cheer - Invalid team name ${teamName}.`);
    return;
  }
  
  setElementToTeamColors(request.sessionId, teamName, elementName);
  
  const queueMessage = getQueueMessage(elementName);
  enqueueRequestPlaceholder(request.sessionId, elementName);

  let message = `Go ${teamName}! Watch the trees cheer with you! ${queueMessage} Happy Holidays!`;
  fillResponse(request, response, message);
}

function setElementToTeamColors(sessionId, teamName, elementName) {   
  const elementInfo = elements[elementName];
  if (elementInfo === undefined || elementInfo === null) {
    console.error(`grizilla::setElementToTeamColors - ${elementName} is not a valid elemenet name.`);
    return;
  }

  const colorNames = teamNameToColorsMap[teamName];
  if (colorNames == undefined || colorNames == null) {
    console.error(`grizilla::setElementToTeamColors - Invalid team name ${teamName}.`);
    return;
  }

  const components = elementInfo.components;
  if (components == undefined || components == null) {
    console.error(`grizilla::setElementToTeamColors - Element does not have components ${elementName}.`);
    return;
  }

  let channelData = [];
  let colorIndex = -1;
  for (let componentIndex = 0; componentIndex < components.length; componentIndex++) {
    const component = components[componentIndex];
    colorIndex++;
    if (colorIndex === colorNames.length) {
      colorIndex = 0;
    }
    const colorName = colorNames[colorIndex];
    setElementColor(sessionId, colorName, component.name,component.number);
  }
}

//////////////////////////////////////////////////////////////////////////////
// onSetChannelData 
//////////////////////////////////////////////////////////////////////////////

function onSetChannelData(request, response) {
  // console.log("onSetChannelData");

  const universe = request.parameters.universe;
  if (universe === undefined || universe == null) {
    console.error('grizilla::onSetChannelData - missing universe');
    let message = `grizilla::onSetChannelData - missing universe`;
    return;
  }
  // console.log("onSetChannelData, elementName" + elementName);  

  const start = request.parameters.start;
  if (start === undefined || start === null) {
    console.error(`grizilla::onSetChannelData - missing start`);
    let message = `grizilla::onSetChannelData - missing start`;
    return;
  }

  const end = request.parameters.end;
  if (end === undefined || end === null) {
    end = start;
  }

  let values = request.parameters.values;
  if (values === undefined || values === null) {
    values = [ 255 ];
  }
  if (!Array.isArray(values)) {
    values = [ values ];
  }

  if (start < 1 || start > 512) {
    console.error('grizilla::onSetChannelData - bad start');
    let message = `grizilla::onSetChannelData - bad start`;
    fillResponse(request, response, message)
    return;
  }

  if (end < 1 || end > 512) {
    console.error('grizilla::onSetChannelData - bad end');
    let message = `grizilla::onSetChannelData - bad end`;
    fillResponse(request, response, message);
    return;
  }
  
  if (start > end) {
    console.error('grizilla::onSetChannelData - start > end');
    let message = `grizilla::onSetChannelData - start > end`;
    fillResponse(request, response, message);
    return;
  }

  let channelData = [];
  let valueIndex = -1;
  for (let index = 0; index < end-start+1; index++) {
    valueIndex++;
    if (valueIndex == values.length) {
      valueIndex = 0;
    }
    channelData[start + index - 1] = values[valueIndex];
  }    
  
  let directive = {};

  directive.universe = universe;
  directive.channelNumber = start;
  directive.channelData = channelData; 
  
  setChannelData(directive); 
  
  console.log(`onSetChannelData universe=${universe} start=${start} end=${end} values=${values}`);
  let message = `onSetChannelData universe=${universe} start=${start} end=${end} values=${values}`;
  fillResponse(request, response, message);    
}