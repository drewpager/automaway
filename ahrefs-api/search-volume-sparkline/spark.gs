function onOpen() {
  SpreadsheetApp.getUi().createMenu("Spark Charts")
    .addItem("SV Trend Data", "searchVolumeSparkline")
    .addToUi()
}

function searchVolumeSparkline() {
  const sheet = SpreadsheetApp.getActiveSheet()
  const lastCol = sheet.getLastColumn()
  const range = sheet.getActiveRange().getValues()
  const row = sheet.getSelection().getCurrentCell().getRow()
  let svGrowthColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Search Volume Trend")

  for (let i = 0; i < range.length; i++) {
    let keyword = range[i].toString().replaceAll(" ", "+")
    const url = 'https://api.ahrefs.com/v3/keywords-explorer/volume-history?country=us&keyword=' + `${keyword}`

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
    
    let metrics = num.metrics;

    let searchVolumeTrendCol = sheet.getRange(row + i, svGrowthColumn + 1)

    let searchVol = []

    for (let j = 0; j < metrics.length; j++) {
      searchVol.push(metrics[j].volume)
    }

    if (searchVol.length > 0) {
      // Helpful data notation for end user
      let last = Number(metrics.length - 1);
      let sparkStart = Utilities.formatDate(new Date(`${metrics[0].date}`), "GMT", "MM-dd-YYYY")
      let sparkEnd = Utilities.formatDate(new Date(`${metrics[last].date}`), "GMT", "MM-dd-YYYY")
      // Set the SPARKLINE formula passing in searchVol data
      searchVolumeTrendCol.setFormula(`=SPARKLINE({${searchVol}})`)
      searchVolumeTrendCol.setNote(`Keyword volume from ${sparkStart} to ${sparkEnd}`)
    } else {
      // Helpful error handling
      searchVolumeTrendCol.setValue("Trend Data Unavailable")
    }
  }
}
