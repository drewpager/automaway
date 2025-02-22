function onOpen() {
  SpreadsheetApp.getUi().createMenu("Ahrefs API")
    .addItem("Pull Top Competitor Performance", "getCompetitor")
    .addToUi()
}

function getTopPages(target) {
  const date = Utilities.formatDate(new Date(), "GMT", "YYYY-MM-dd")
  const url = "https://api.ahrefs.com/v3/site-explorer/top-pages?date=" + `${date}` + "&limit=50&order_by=sum_traffic&select=sum_traffic%2Cvalue%2Curl&protocol=both&mode=prefix&volume_mode=monthly&target=" + `${target}`

  let dr = domainRating(target, date)

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/xml',
      Authorization: 'Bearer YOUR_AHREFS_API_KEY'
    }
  }

  const res = UrlFetchApp.fetch(url, options)
  const num = JSON.parse(res)

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange(1, 2).setValue("Traffic")
  sheet.getRange(1, 3).setValue("Value")
  sheet.getRange(1, 4).setValue("Referring Domains")
  sheet.getRange(1, 5).setValue("Domain Rating")
  sheet.getRange(2, 5).setValue(`${dr}`)

  for (let i = 0; i < 50; i++) {
    let refs = referringDomains(num.pages[i].url, date)
    sheet.getRange(2 + i, 1).setValue(num.pages[i].url)
    sheet.getRange(2 + i, 2).setValue(num.pages[i].sum_traffic)
    sheet.getRange(2 + i, 3).setValue(Number(num.pages[i].value/100))
    sheet.getRange(2 + i, 4).setValue(`${refs}`)
  }
}

function domainRating(target, date) {
  const url = "https://api.ahrefs.com/v3/site-explorer/domain-rating?protocol=both&target=" + `${target}` + "&date=" + `${date}`

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/xml',
      Authorization: 'Bearer YOUR_AHREFS_API_KEY'
    }
  }

  const res = UrlFetchApp.fetch(url, options)
  const num = JSON.parse(res)

  return num.domain_rating.domain_rating
}

function referringDomains(target, date) {
  const url = "https://api.ahrefs.com/v3/site-explorer/backlinks-stats?date=" + `${date}` + "&target=" + `${target}` + "&mode=exact"

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/xml',
      Authorization: 'Bearer YOUR_AHREFS_API_KEY'
    }
  }

  const res = UrlFetchApp.fetch(url, options)
  const num = JSON.parse(res)

  const refs = num.metrics ? num.metrics.live_refdomains : 0;

  return [refs]
}

function getCompetitor() {
  const ui = SpreadsheetApp.getUi()

  const result = ui.prompt(
    'Top Competitor URL',
    'Enter the URL path to content (i.e. https://www.make.com/en/blog/):', ui.ButtonSet.OK_CANCEL);

  const button = result.getSelectedButton()
  const target = result.getResponseText();

  if (button == ui.Button.OK) {
    getTopPages(target)
  } else if (button == ui.Button.CANCEL) {
    ui.alert("I did not get that")
  } else if (button == ui.Button.CLOSE) {
    ui.alert("You closed the dialog")
  }
}

