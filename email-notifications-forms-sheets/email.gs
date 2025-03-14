function getEmailDetails() {
  // Change sheet name to reflect your responses or google sheet
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses 1")
  let lastRow = sheet.getLastRow()
  let lastCol = sheet.getLastColumn()
  // Update these based on column placement/naming
  let emailCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Email")
  let nameCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Name")

  let rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

  const recipientEmail = rowData[emailCol];
  const name = rowData[nameCol]

  // Trigger External Email
  sendFeedbackEmail(name, recipientEmail)
  // Send Yourself an Email
  sendSelfEmail()
}

function sendFeedbackEmail(name, recipientEmail) {
  var htmlTemplate = `
  <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Feedback Received</title>
      <style>
        body {
          font-family: sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .button {
          background-color: #d61072;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          display: inline-block;
        }
        .signature {
          margin-top: 30px;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <p>Hi {name},</p>

        <p>Thank you for your feedback. If you're not already a subscriber, I would really appreciate you subscribing by clicking here: <br/><a href="https://www.youtube.com/@automaway?sub_confirmation=1" class="button">Subscribe Here</a></p>

        <p>This will be the last email you receive from me unless you are interested in getting updates from me when I release a new video. If that's the case, simply respond to this email with "Yes, Drew, please get these repetitive tasks aut-o-ma-way"</p>

        <p class="signature">Stay automated,<br>Drew</p>
      </div>
    </body>
    </html>
  `;

  htmlTemplate = htmlTemplate.replace("{name}", name);

  var htmlOutput = HtmlService.createHtmlOutput(htmlTemplate);

  MailApp.sendEmail({
    to: recipientEmail,
    subject: "Your Automaway Feedback Has Been Received!",
    htmlBody: htmlOutput.getContent()
  });
}

function sendSelfEmail() {
  // Update with your own email address
  let email = "your_email_address@gmail.com"
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getUrl()
  var htmlTemplate = `
  <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Feedback Received</title>
      <style>
        body {
          font-family: sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <p>Somebody responded to your form <a href="{sheet}">here</a>.</p>
      </div>
    </body>
    </html>
  `;

  htmlTemplate = htmlTemplate.replace("{sheet}", sheet);

  var htmlOutput = HtmlService.createHtmlOutput(htmlTemplate);

  MailApp.sendEmail({
    to: email,
    subject: "You Received a Form Submission!",
    htmlBody: htmlOutput.getContent()
  });
}

