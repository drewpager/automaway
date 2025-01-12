function getKeywords() {
  let sheet = SpreadsheetApp.getActiveSheet()
  let numRows = sheet.getLastRow()
  let numCols = sheet.getLastColumn()
  // Replace "Outline" with your column heading for the Google Doc URL
  let outlineCol = sheet.getRange(1, 1, 1, numCols).getValues()[0].indexOf("Outline")
  
  let keywords = sheet.getRange(2, 1, numRows - 1, 1).getValues()
  
  for (let i = 0; i < keywords.length; i++) {

    let res = geminiAPI(keywords[i][0])
    let newDoc = DocumentApp.create(`${keywords[i][0]} Outline`)
    newDoc.getBody().setText(`${res}`)
    newDoc.saveAndClose()
    const url = DocumentApp.openById(newDoc.getId()).getUrl()
    sheet.getRange(i + 2, outlineCol + 1).setValue(`${url}`)
  } 
}

function geminiAPI(keyword) {
  const API_KEY = "YOUR_API_KEY"
  // The endpoint URL for generating content
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY;

  const payload = {
    "contents": [{
      "parts": [{
        "text": `Generate an SEO outline for the topic '${keyword}' in plain text format. Avoid using any markdown formatting (e.g., #, **, *). Present the outline in a clear and concise manner with proper line breaks and indentation where necessary.`
      }]
    }]
  };

  const options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() === 200) {
    const content = JSON.parse(response.getContentText());
    const generatedStory = content.candidates[0].content.parts[0].text;
    return generatedStory
  } else {
    return Error(`Something broke here!`)
  }
}

