
const fs = require('fs');

const TimestampUtilities = require("./TimestampUtilities.js");

class SuggestionManager {

  constructor(q) {
    this.suggestionsFileName = "Suggestions.json";
    this.suggestions = new Array();
  }

  getSuggestions() {
    return this.suggestions;
  }

  addSuggestion(request, response) {
    // console.log("onRecordSuggestion");

    const suggestion = request.parameters.message;
    if (suggestion === undefined || suggestion === null) {
      console.error('grizilla::recordSuggestion - missing suggestion');
      return;
    }

    // name is optional
    const name = request.parameters.name;
    
    console.log(`SuggestionManager addSuggestion message: ${suggestion} from: ${name}`);

    //const nowTimestampNumber = TimestampUtilities.getNowTimestampNumber();

    const timestampObject = TimestampUtilities.parseDateAndTime();
    const timestampString = TimestampUtilities.getTimestampStringFromObject(timestampObject);
    const timestampNumber = TimestampUtilities.getTimestampNumber(timestampString);

    const suggestionObject = { suggestion, name, timestampString, timestampNumber}

    this.suggestions.push(suggestionObject);

    this.writeSuggestions();
    
    this.fillResponse(request, response, "Okay", "Thank you for your suggestion. Happy Holidays!");    
  }

  fillResponse(request, response, status, message) {
    return response.json({
      status: status,
      message: message,
      source: 'SuggestionManager'
    });
  }

  // ----- file storage -----

  loadSuggestions(fileName) {
    if (!fileName) {
      fileName = this.queueFileName;
    }
    if (fs.existsSync(fileName)) {
      console.log(`loading suggestions from ${fileName}...`);

      try {
        const temp = JSON.parse(fs.readFileSync(fileName, 'utf8'));
        this.suggestions = new Map(temp.suggestions);
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }

      console.log(`loading suggestions complete nextId=${this.nextId} size=${this.suggestions.size}`);
    }
  }

  writeSuggestions(fileName) {
    if (!fileName) {
      fileName = this.queueFileName;
    }
    //console.log(`writing suggestions to ${fileName} nextId=${this.nextId} size=${this.suggestions.size} ...`);

    const temp = { suggestions: this.suggestions };

    fs.writeFileSync(fileName, JSON.stringify(temp, null, '\t'), 'utf8');

    //console.log(`writing suggestions complete`);
  }

}

module.exports = SuggestionManager;
