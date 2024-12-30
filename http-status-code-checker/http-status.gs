function onOpen() {
  SpreadsheetApp.getUi().createMenu("HTTP Status Checker")
    .addItem("Get HTTP Status [Highlight URL(s)]", "getHTTPStatus")
    .addToUi()
}

function getHTTPStatus() {
  let sheet = SpreadsheetApp.getActiveSheet();
  let row = sheet.getActiveCell().getRowIndex();
  let col = sheet.getActiveCell().getColumn();
  let urls = sheet.getActiveRange().getValues();

  for (let i = 0; i < urls.length; i++) {
    try {
      let response = UrlFetchApp.fetch(urls[i][0], { muteHttpExceptions: true, followRedirects: false }).getResponseCode();
      sheet.getRange(row + i, col + 1).setValue(`${response}`)
    } catch (error) {
      return `Error fetching URL: ${error.message}`;
    }
  }
}

function HTTPSTATUS(input) {
  try {
    let response = UrlFetchApp.fetch(input, { muteHttpExceptions: true, followRedirects: false }).getResponseCode();
    return `${response}`
  } catch (error) {
    Logger.log(`Error fetching URL: ${error.message}`)
    return `Error fetching URL: ${error.message}`;
  }
}
