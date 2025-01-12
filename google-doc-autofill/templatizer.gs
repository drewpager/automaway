function generateContract() {
  // https://docs.google.com/document/d/{{YOUR_TEMPLATE_ID}}/edit?
  const contractTemplate = DriveApp.getFileById("YOUR_TEMPLATE_ID")
  // https://drive.google.com/drive/folders/{{YOUR_CURRENT_FOLDER_ID}}
  const destinationFolder = DriveApp.getFolderById("YOUR_CURRENT_FOLDER_ID")

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Contract Generator")
  const lastCol = sheet.getLastColumn();
  const rows = sheet.getDataRange().getValues()
  rows.forEach(function(row, index) {
    if (index === 0) return;
    let client = row[0]
    let state = row[1]
    let address = row[2]
    let poc = row[3]
    let title = row[4]
    let duration = row[5]
    let rate = row[6]
    let total = row[7]
    let start = row[8]

    const copy = contractTemplate.makeCopy(`Automaway ${client} Consulting Contract ${Utilities.formatDate(new Date(start), "GMT", "M.d.YYYY")}`, destinationFolder)
    const doc = DocumentApp.openById(copy.getId())
    const body = doc.getBody()
    const friendlyStartDate = Utilities.formatDate(new Date(start), "GMT", "MMMM dd, YYYY")

    body.replaceText(`{startDate}`, friendlyStartDate)
    body.replaceText(`{clientName}`, client)
    body.replaceText(`{clientState}`, state)
    body.replaceText(`{monthlyRate}`, Intl.NumberFormat("en-US", { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(rate))
    body.replaceText(`{clientAddress}`, address)
    body.replaceText(`{duration}`, duration)
    body.replaceText(`{clientPOC}`, poc)
    body.replaceText(`{clientPOCTitle}`, title)
    body.replaceText(`{totalFee}`, Intl.NumberFormat("en-US", { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(total))
    body.replaceText(`{date}`, Utilities.formatDate(new Date(), "GMT", "MMMM dd, YYYY"))

    doc.saveAndClose()
    const url = doc.getUrl()
    sheet.getRange(index + 1, lastCol + 1).setValue(url)
  })
}
