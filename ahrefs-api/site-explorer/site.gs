function onOpen() {
  SpreadsheetApp.getUi().createMenu("Ahrefs API")
    .addItem("Pull Top Pages Performance", "getCompetitor")
    .addToUi()
}

function getCompetitor() {
  var ui = SpreadsheetApp.getUi(); // Same variations.

  var result = ui.prompt(
      'Top Competitor URL',
      'Enter the URL path to content (i.e. https://www.make.com/en/blog/):',
      ui.ButtonSet.OK_CANCEL);

  // Process the user's response.
  var button = result.getSelectedButton();
  var target = result.getResponseText();
  if (button == ui.Button.OK) {
    // User clicked "OK".
    getTopPages(target);
  } else if (button == ui.Button.CANCEL) {
    // User clicked "Cancel".
    ui.alert('I didn\'t get that.');
  } else if (button == ui.Button.CLOSE) {
    // User clicked X in the title bar.
    ui.alert('You closed the dialog.');
  }
}

function getTopPages(target) {
  const date = Utilities.formatDate(new Date(), "GMT", "YYYY-MM-dd");

  const url = "https://api.ahrefs.com/v3/site-explorer/top-pages?date=" + `${date}` + "&limit=50&order_by=sum_traffic&select=sum_traffic%2Cvalue%2Curl&protocol=both&mode=prefix&volume_mode=monthly&target=" + `${target}`

  let dr = domainRating(target, date)

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/xml',
      Authorization: 'Bearer YOUR_AHREFS_API_KEY'
    }
  }

  var res = UrlFetchApp.fetch(url, options)
  var num = JSON.parse(res)
  
  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange(1, 2).setValue("Traffic")
  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange(1, 3).setValue("Value")
  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange(1, 4).setValue("Referring Domains")
  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange(1, 5).setValue("Domain Rating")
  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange(2, 5).setValue(`${dr}`)

  for (let i = 0; i < 50; i++) {
    let refs = referringDomains(num.pages[i].url)
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange(2 + i, 1).setValue(num.pages[i].url)
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange(2 + i, 2).setValue(num.pages[i].sum_traffic)
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange(2 + i, 3).setValue(Number(num.pages[i].value/100))
    SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange(2 + i, 4).setValue(`${refs}`)
  }
}

function domainRating(target, date) {
   // Construct Date for Ahrefs API
  const yesterday = new Date();
  const year = yesterday.getFullYear()
  const month = yesterday.getMonth();
  const day = yesterday.getDate()

  let dated = date ? date : Utilities.formatDate(new Date(year, month, day), "GMT+1", "yyyy-MM-dd")

  // Construct API Call
  const url = "https://api.ahrefs.com/v3/site-explorer/domain-rating?target=" + `${target}` + "&date="+ `${dated}`;

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/xml',
      Authorization: 'Bearer YOUR_AHREFS_API_KEY'
    }
  }

  var res = UrlFetchApp.fetch(url, options)
  var num = JSON.parse(res)
  
  // Isolate DR
  return num.domain_rating.domain_rating
}

function referringDomains(target) {
  const yesterday = new Date();
  const year = yesterday.getFullYear()
  const month = yesterday.getMonth();
  const day = yesterday.getDate() - 1
  const date_to = Utilities.formatDate(new Date(year, month, day), "GMT+1", "yyyy-MM-dd")

  const url = 'https://api.ahrefs.com/v3/site-explorer/backlinks-stats?date='+ `${date_to}` +'&target=' + `${target}` + '&mode=exact';

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/xml',
      Authorization: 'Bearer YOUR_AHREFS_API_KEY'
    }
  }

  var res = UrlFetchApp.fetch(url, options)
  var num = JSON.parse(res)
  
  var refs = num.metrics ? num.metrics.live_refdomains : 0;

  return [refs]
}

