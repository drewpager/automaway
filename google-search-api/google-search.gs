function onOpen() {
  SpreadsheetApp.getUi().createMenu("Google Search API")
    .addItem("Run Google Search API", "googleSearch")
    .addToUi()
}

function googleSearch() {
  const rankPosition = 1;
  const API_KEY = "YOUR_API_KEY"
  const keywords = SpreadsheetApp.getActiveSheet().getActiveRange().getValues();
  
  for (let i = 0; i < keywords.length; i++) {
    let cell = keywords[i][0];
    const formatCell = cell.replaceAll(/ /g, "+").toLowerCase()

    const CX = "YOUR_CX"
    let url = "https://www.googleapis.com/customsearch/v1?key=" + API_KEY + "&cx=" + CX + "&q=" + formatCell;
    
    let response = UrlFetchApp.fetch(url);
    let data = JSON.parse(response);

    if (data) {
      const colLocal = SpreadsheetApp.getSelection().getCurrentCell().getColumn()
      const rowLocal = SpreadsheetApp.getSelection().getCurrentCell().getRow() + i;

      for (let j = rankPosition - 1; j < rankPosition; j++) {
        const numberOne = SpreadsheetApp.getActiveSheet().getRange(rowLocal, colLocal + 1);
        if (!data["items"][j].link) {
          numberOne.setValue('No Search Results')
        } else {
          numberOne.setValue(`${data["items"][j].link}`)
        }
      }
    } else {
      ui.alert("Something Failed During Search")
    }
  }
}
