
//////////////////////////////////////////////////////////////////////////////
// recordSuggestion 
//////////////////////////////////////////////////////////////////////////////

function recordSuggestion(request, response) {
  // console.log("onRecordSuggestion");
  
  let suggestionType = request.parameters.type;
  if (suggestionType === undefined || suggestionType == null) {
    console.log('grizilla::onRecordSuggestion - not type');
    return;
  }

  let suggestion = request.parameters.type;
  if (suggestion === undefined || suggestion == null) {
    console.error('grizilla::onRecordSuggestion - missing suggestion');
    let message = `Try: My suggestion is ...`;
    fillResponse(request, response, message);    
    return;
  }

  recordSuggestion(request.sessionId, suggestionType, suggestion);
  
  let message = `Thank you for your suggestion. Happy Holidays!`;
  fillResponse(request, response, message);    
}

function recordSuggestion(sessionId, type, suggestion) {
  const data = `${sessionId}:${type}:${suggesion}\n`;
  fs.appendFile('./suggestions.txt', data,
    (err) => {
      if (err) {
        console.error(`Unable to log suggestion: ${data}`)
      }
      console.log(`recorded suggestion: ${data}`);
    });
}
