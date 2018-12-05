
//////////////////////////////////////////////////////////////////////////////
// teams and data
//////////////////////////////////////////////////////////////////////////////

const teamNameToDataMap = {
  Baylor: {name: "Baylor", colors: ["Green", "Gold"], mascot: "Bears", cheers: ["Go Bears!"]},
  BVNW: {name: "BVNW", colors: ["Purple", "White"], mascot: "Huskies", cheers: ["Go Huskies!"]},
  Chiefs: {name: "Chiefs", colors: ["Red", "Yellow"], mascot: "Chiefs", cheers: ["Go Chiefs!"]},
  Grinch: {name: "Grinch", colors: ["Grinch Green"], mascot: "Grinch", cheers: ["Go Grinch!"]},
  Halloween: {name: "Halloween", colors: [ "Orange", "Black"], mascot: "Halloween", cheers: ["Halloween!"], imageNames:["1f383.png", "1f47b.png"]},
  Iowa: {name: "Iowa", colors: ["Gold", "Black"],    mascot: "Hawks", cheers: ["Go Hawks!"]},
  "Iowa State": {name: "Iowa State", colors: ["Red", "Gold"], mascot: "Cyclones", cheers: ["Go Cyclones!"]},
  "Kansas State": {name: "Kansas State", colors: [ "Royal Purple", "Silver" ], mascot: "Wildcats", cheers: ["Go Wildcats!"]},
  "Kansas":{name: "Kansas", colors:  [ "Blue", "Red"], mascot: "Jayhawks", cheers: ["Rock Chalk Jayhawk!"]},
  Mavericks: {name: "Mavericks", colors: [ "Orange", "Light Blue"], mascot: "Maverick", cheers: ["Go Mavericks!"]},
  MNU: {name: "MNU", colors: [ "Blue", "Fuchsia"], mascot: "Pioneers", cheers: ["Go Pioneers!"]},
  Missouri: {name: "Missouri", colors: [ "Gold", "Black"], mascot: "Tigers", cheers: ["M - I - Z - Z - O - U"]},
  Nebraska: {name: "Nebraska", colors: [ "Red", "White" ], mascot: "Huskers", cheers: ["Go Huskers!"]},
  Neptunes: {name: "Neptunes", colors: [ "Dark Blue", "White"], mascot: "Neptunes", cheers: ["Go Neptunes!"]},
  "Olathe South": {name: "Olathe South", colors: [ "Blue", "Gold"], mascot: "Falcons", cheers: ["Go Falcons!"]},
  Oklahoma: {name: "Oklahoma", colors: [ "Crimson", "Cream" ], mascot: "Sooners", cheers: ["Boomer Sooner!"]},
  "Oklahoma State": {name: "Oklahoma State", colors: [ "Orange", "Black" ], mascot: "Pokes", cheers: ["Go Pokes!"]},
  "Pittsburg State": {name: "Pittsburg State", colors: [ "Crimson", "Gold"], mascot: "Gorillas", cheers: ["Go Gorillas!"]},
  Rainbow: {name: "Rainbow", colors: [ "Dark Red", "Red", "Orange Red", "Orange", "Yellow",
             "Chartreuse", "Green", "Blue", "Indigo", "Violet"], /*mascot: "", */ cheers: [], imageNames:["1f308.png"]},
  Reindeer: {name: "Reindeer", colors: [ "Dark Brown", "Red"], mascot: "Reindeer", cheers: ["Go Reindeer!"]},
  Rockhurst: {name: "Rockhurst", colors: [ "Royal Blue", "White"], mascot: "Hawks", cheers: ["Go Hawks!"]},
  Royals: {name: "Royals", colors: [ "Blue", "White"], mascot: "Royals", cheers: ["Go Royals!"]},
  Rudolph: {name: "Rudolph", colors: [ "Dark Brown", "Red"], mascot: "Rudolph", cheers: ["Go Rudolph!"]},
  Santa: {name: "Santa", colors: [ "Red", "White"], mascot: "Santa", cheers: ["Go Santa!"], imageNames:["1f385.png"]},
  Snow: {name: "Snow", colors: [ "Snow"], mascot: "Snow", cheers: ["Snow!"], imageNames:["2744.png"]},
  Snowman: {name: "Snowman", colors: [ "Snow"], mascot: "Snowman", cheers: ["Snowman!"], imageNames:["26c4.png"]},
  Tree: {name: "Tree", colors: [ "Green"], mascot: "Tree", cheers: ["Tree!"], imageNames:["1f384.png"]},
  "Sporting KC": {name: "Sporting KC", colors: [ "Sporting Blue", "Dark Indigo"], mascot: "Sporting", cheers: ["Go Sporting!"]},
  "STA Saints": {name: "STA", colors: [ "Blue", "Gold" ], mascot: "Saints", cheers: ["Go Saints!"]},
  "Texas Christian": {name: "TCU", colors: [ "Horned Frog Purple", "White"], mascot: "Horned Frogs", cheers: ["Go Frogs!"]},
  Texas: {name: "Texas", colors: [ "Orange", "White"], mascot: "Horns", cheers: ["Hook 'em Horns!"]},
  "Texas Tech": {name: "Texas Tech", colors: [ "Scarlet", "Black"], mascot: "Red Raiders", cheers: ["Go Red Raiders!"]},
  UMKC: {name: "UMKC", colors: [ "Blue", "Gold"], mascot: "Roos", cheers: ["Go Roos!"]},
  USA: {name: "USA", colors: [ "Red", "White", "Blue"], mascot: "USA", cheers: ["USA! USA! USA!"]}
};

module.exports = { teamNameToDataMap };
