function onOpen() {
  SpreadsheetApp.getUi().createMenu("Additional Keywords")
    .addItem("Get Related Keywords [KWs]", "newRelatedKeywordsTab")
    .addItem("Get Matching Keywords [KWs]", "newMatchingKeywordsTab")
    .addToUi()
}

function relatedTerms(keyword) {
  const YOUR_AHREFS_API_KEY = "YOUR_AHREFS_API_KEY"
  const url = `https://api.ahrefs.com/v3/keywords-explorer/related-terms?limit=10&order_by=volume&where=%7B%22field%22%3A%22word_count%22%2C%22is%22%3A%5B%22gt%22%2C2%5D%7D&select=keyword%2Cvolume&country=us&keywords=${keyword}`

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/xml',
      Authorization: `Bearer ${YOUR_AHREFS_API_KEY}`
    }
  }

  var res = UrlFetchApp.fetch(url, options)
  var num = JSON.parse(res)
  
  const keywords = num.keywords;
  return keywords;
}

function newRelatedKeywordsTab() {
  const originalSheet = SpreadsheetApp.getActiveSheet(); // Store the original sheet
  const originalSheetName = originalSheet.getName();
  let kws = []
  kws.push(...SpreadsheetApp.getActiveSheet().getActiveRange().getValues())

  let existingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(`${originalSheetName} - Related Keywords`);

  if (!existingSheet) {
    existingSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet().setName(`${originalSheetName} - Related Keywords`);
    existingSheet.getRange(1, 1).setValue("Keyword");
    existingSheet.getRange(1, 2).setValue("SV");
  }

  let lastRow = existingSheet.getLastRow() + 1;

  for (let j = 0; j < kws.length; j++) {
    let keywords = relatedTerms(`${kws[j][0]}`.toString().toLowerCase().replaceAll(" ", "+"));
    keywords.forEach((k, index) => {
      existingSheet.getRange(lastRow + index, 1).setValue(`${k.keyword}`);
      existingSheet.getRange(lastRow + index, 2).setValue(`${k.volume}`);
    });
    lastRow += keywords.length;
  }
}

function  matchingTerms(keyword) {
  const YOUR_AHREFS_API_KEY = "YOUR_AHREFS_API_KEY"
  const url = `https://api.ahrefs.com/v3/keywords-explorer/matching-terms?limit=10&order_by=volume&where=%7B%22field%22%3A%22word_count%22%2C%22is%22%3A%5B%22gt%22%2C2%5D%7D&select=keyword%2Cvolume&country=us&terms=questions&keywords=${keyword}`

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/xml',
      Authorization: `Bearer ${YOUR_AHREFS_API_KEY}`
    }
  }

  var res = UrlFetchApp.fetch(url, options)
  var num = JSON.parse(res)
  
  const keywords = num.keywords;
  return keywords;
}

function newMatchingKeywordsTab() {
  const originalSheet = SpreadsheetApp.getActiveSheet();
  const originalSheetName = originalSheet.getName();
  let kws = []
  kws.push(...SpreadsheetApp.getActiveSheet().getActiveRange().getValues())

  let existingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(`${originalSheetName} - Matching Keywords`);

  if (!existingSheet) {
    existingSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet().setName(`${originalSheetName} - Matching Keywords`);
    existingSheet.getRange(1, 1).setValue("Keyword");
    existingSheet.getRange(1, 2).setValue("SV");
  }

  let lastRow = existingSheet.getLastRow() + 1;

  for (let j = 0; j < kws.length; j++) {
    let keywords = matchingTerms(`${kws[j][0]}`.toString().toLowerCase().replaceAll(" ", "+"));
    keywords.forEach((k, index) => {
      existingSheet.getRange(lastRow + index, 1).setValue(`${k.keyword}`);
      existingSheet.getRange(lastRow + index, 2).setValue(`${k.volume}`);
    });
    lastRow += keywords.length;
  }
}

