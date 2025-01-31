function onOpen() {
  SpreadsheetApp.getUi().createMenu("Get Ahrefs Data")
    .addItem("Get Keyword Metrics", "getKeywordMetrics")
    .addToUi();
}

function getKeywordMetrics() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastCol = sheet.getLastColumn();
  const range = sheet.getActiveRange().getValues()
  const row = sheet.getSelection().getCurrentCell().getRow()
  let kdColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Keyword Difficulty")
  let cvColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Click Volume")
  let svColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Search Volume")

  let formatRange = []

  for (let i = 0; i < range.length; i++) {
    formatRange.push(range[i][0].toString().toLowerCase().replaceAll(" ", "+"))
  }

  let formattedRange = formatRange.join("%2C+")
  
  const url = "https://api.ahrefs.com/v3/keywords-explorer/overview?select=clicks%2Cvolume%2Ckeyword%2Cdifficulty&country=us&keywords=" + `${formattedRange}`

  const options = {
    method: "GET",
    headers: {
      Accept: 'application/json, application/xml',
      // https://app.ahrefs.com/account/api-keys
      Authorization: 'Bearer YOUR_AHREFS_API_KEY'
    }
  }

  const res = UrlFetchApp.fetch(url, options)
  const num = JSON.parse(res)

  const keywords = num.keywords;

  for (let j = 0; j < range.length; j++) {
    let kdCol = sheet.getRange(row + j, kdColumn + 1)
    let cvCol = sheet.getRange(row + j, cvColumn + 1)
    let svCol = sheet.getRange(row + j, svColumn + 1)

    keywords.map((k) => {
      if (k.keyword === range[j][0].toLowerCase()) {
        if (!k.difficulty) {
          kdCol.setNote("No KD Reported by Ahrefs")
        }
        kdCol.setValue(k.difficulty ? k.difficulty : 0)
        if (!k.clicks) {
          cvCol.setNote("No Click Volume Reported")
        }
        cvCol.setValue(k.clicks ? k.clicks : 0)
        if (!k.volume) {
          svCol.setNote("No Search Volume Reported")
        }
        svCol.setValue(k.volume ? k.volume : 0)
      }
    })
  }
  // Part Two
  searchVolumeSparkline()
}

// Part Two
function searchVolumeSparkline() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastCol = sheet.getLastColumn();
  const range = SpreadsheetApp.getActiveSheet().getActiveRange().getValues();
  var row = SpreadsheetApp.getSelection().getCurrentCell().getRow();
  let svGrowthColumn = SpreadsheetApp.getActiveSheet().getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Search Volume Trend");

  for (let i = 0; i < range.length; i++) {
    let keyword = range[i].toString().replaceAll(" ", "+");
    const url = 'https://api.ahrefs.com/v3/keywords-explorer/volume-history?country=us&keyword=' + `${keyword}`;

    const options = {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/xml',
        // https://app.ahrefs.com/account/api-keys
        Authorization: 'Bearer YOUR_AHREFS_API_KEY'
      }
    }

    var res = UrlFetchApp.fetch(url, options)
    var num = JSON.parse(res)
    // Logger.log(num)
    let metrics = num.metrics;
    let searchVolTrendCol = SpreadsheetApp.getActiveSheet().getRange(row + i, svGrowthColumn + 1)
  
    var searchVol = [];
    for (let m = 0; m < metrics.length; m++) {
      searchVol.push(metrics[m].volume)
    }
    if (searchVol.length > 0) {
      searchVolTrendCol.setFormula(`=SPARKLINE({${searchVol}})`)
    } else {
      searchVolTrendCol.setValue("Trend Data Unavailable")
    }
  }
}
