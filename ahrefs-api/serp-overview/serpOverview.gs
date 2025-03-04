function onOpen() {
  SpreadsheetApp.getUi().createMenu("SERP Overview")
    .addItem("Get SERP (Testing)", "getSERP")
    .addItem("Get SERP Average", "getSERPAvg")
    .addToUi()
}

// Step 2
function getSERPAvg() {
  let sheet = SpreadsheetApp.getActiveSheet();
  const lastCol = sheet.getLastColumn();
  const range = sheet.getActiveRange().getValues()
  const row = sheet.getSelection().getCurrentCell().getRow()
  let drColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("DR (Average)")
  let trafficColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Traffic (Average)")
  let refsColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Referring Domains (Average)")
  let valColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Traffic Value (Average)")

  let date = Utilities.formatDate(new Date(), "GMT", "YYYY-MM-dd")

  let formatRange = []

  for (let i = 0; i < range.length; i++) {
    formatRange.push(range[i][0].toString().toLowerCase().replaceAll(" ", "+"))
  }

  for (let j = 0; j < formatRange.length; j++) {
    let API_KEY = "YOUR_AHREFS_API_KEY"
    const url = "https://api.ahrefs.com/v3/serp-overview/serp-overview?select=domain_rating%2Ckeywords%2Crefdomains%2Ctop_keyword%2Ctop_keyword_volume%2Ctraffic%2Curl%2Cvalue&top_positions=10&date=" + `${date}` + "&country=us&keyword=" + `${formatRange[j]}`

    const options = {
      method: "GET",
      headers: {
        Accept: 'application/json, application/xml',
        Authorization: `Bearer ${API_KEY}`
      }
    }

    const res = UrlFetchApp.fetch(url, options)
    const num = JSON.parse(res)

    const serp = num.positions;
    const organicSerp = serp.filter(s => s.type.includes("organic"))

    const numericFields = ["top_keyword_volume", "value", "traffic", "domain_rating", "refdomains", "keywords"];
    const averages = {};

    numericFields.forEach(field => {
      const values = organicSerp
        .map(item => item[field])
        .filter(value => typeof value === 'number' && value !== null);

      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        averages[field] = sum / values.length;
      } else {
        averages[field] = null;
      }
    });

    if (organicSerp.length === 0) {
      sheet.getRange(row+j, drColumn+1).setValue(`SERP not found`)
      sheet.getRange(row+j, trafficColumn+1).setValue(`SERP not found`)
      sheet.getRange(row+j, refsColumn+1).setValue(`SERP not found`)
      sheet.getRange(row+j, valColumn+1).setValue(`SERP not found`)
    }

    if (averages.value !== null) {
      sheet.getRange(row+j, drColumn+1).setValue(`${Math.round(averages.domain_rating)}`)
      sheet.getRange(row+j, trafficColumn+1).setValue(`${Math.round(averages.traffic)}`)
      sheet.getRange(row+j, refsColumn+1).setValue(`${Math.round(averages.refdomains)}`)
      sheet.getRange(row+j, valColumn+1).setValue(`${Math.round(averages.value/100)}`)
    }
  }
}

// Step 1
function getSERP() {
  let sheet = SpreadsheetApp.getActiveSheet();
  const lastCol = sheet.getLastColumn();
  const range = sheet.getActiveRange().getValues()
  const row = sheet.getSelection().getCurrentCell().getRow()
  let urlColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("URL")
  let drColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("DR")
  let trafficColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Traffic")
  let refsColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Referring Domains")
  let valColumn = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Traffic Value")

  let date = Utilities.formatDate(new Date(), "GMT", "YYYY-MM-dd")

  let formatRange = []

  for (let i = 0; i < range.length; i++) {
    formatRange.push(range[i][0].toString().toLowerCase().replaceAll(" ", "+"))
  }

  let API_KEY = "YOUR_AHREFS_API_KEY"
  const url = "https://api.ahrefs.com/v3/serp-overview/serp-overview?select=domain_rating%2Ckeywords%2Crefdomains%2Ctop_keyword%2Ctop_keyword_volume%2Ctraffic%2Curl%2Cvalue&top_positions=10&date=" + `${date}` + "&country=us&keyword=" + `${formatRange[0]}`

  const options = {
    method: "GET",
    headers: {
      Accept: 'application/json, application/xml',
      Authorization: `Bearer ${API_KEY}`
    }
  }

  const res = UrlFetchApp.fetch(url, options)
  const num = JSON.parse(res)

  const serp = num.positions;
  const organicSerp = serp.filter(s => s.type.includes("organic"))

  if (organicSerp.length === 0) {
    sheet.getRange(row, urlColumn+1).setValue(`SERP not found`)
  }

  organicSerp.map((item, index) => {
    if (item.url === null || item.traffic === null) {
      return;
    } else {
      sheet.getRange(row+index, urlColumn+1).setValue(`${item.url}`)
      sheet.getRange(row+index, drColumn+1).setValue(`${item.domain_rating}`)
      sheet.getRange(row+index, trafficColumn+1).setValue(`${item.traffic}`)
      sheet.getRange(row+index, refsColumn+1).setValue(`${item.refdomains}`)
      sheet.getRange(row+index, valColumn+1).setValue(`${item.value/100}`)
    }
  })
}

