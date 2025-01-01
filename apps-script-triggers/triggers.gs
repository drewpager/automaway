function onOpen() {
  SpreadsheetApp.getUi().createMenu("Triggers")
    .addItem("Create Trigger", "createTrigger")
    .addItem("Delete Trigger(s)", "deleteTrigger")
    .addToUi();
  getPrice();
}

function onEdit(e) {
  // The `if` statement constrains the trigger to a single sheet. Update the "Event Driven" string to match your sheet name or remove if statement
  if (SpreadsheetApp.getActiveSheet().getSheetName() === "Event Driven") {
    const range = e.range;
    range.setNote('Last modified on ' + Utilities.formatDate(new Date(), "GMT", 'MM-dd-yyyy') + ' by ' + Session.getActiveUser().getEmail())
  }
}

function getPrice() {
  let sheet = SpreadsheetApp.getActiveSheet();
  let lastRow = sheet.getLastRow()
  let lastCol = sheet.getLastColumn()
  // Find the desired target column index
  let timeCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Time");
  let priceCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Price");

  // fetch current bitcoin price
  let btc = UrlFetchApp.fetch('https://api.coindesk.com/v1/bpi/currentprice.json')
  let data = JSON.parse(btc.getContentText())
  let btcPrice = `${data.bpi.USD.rate}`
  
  // return the time and current btc price on function trigger
  sheet.getRange(lastRow + 1, timeCol + 1).setValue(Utilities.formatDate(new Date(), "PST", 'HH:mm:ss'))
  sheet.getRange(lastRow + 1, priceCol + 1).setValue(btcPrice)
}

function createTrigger() {
  // Example trigger run every minute (delete trigger after testing or extend trigger duration)
  ScriptApp.newTrigger('getPrice')
    .timeBased()
    .everyMinutes(1)
    .create();
}

function deleteTrigger() {
  // Loop over all triggers and delete.
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

