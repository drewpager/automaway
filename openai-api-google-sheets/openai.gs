// function onOpen() {
//   SpreadsheetApp.getUi().createMenu("Open AI Integrations")
//     .addItem("GPT for Sheets", "callGPT4")
//     .addToUi()
// }

function callGPT4(prompt) {
  // let cell = SpreadsheetApp.getActiveSheet().getActiveCell();
  // let title = cell.getValue();
  // let aiPrompt = prompt ? prompt : `Summarize in 50 to 60 words what would be covered in a YouTube tutorial on ${title}`
  const apiKey = "YOUR_API_KEY"
  const url = "https://api.openai.com/v1/chat/completions"

  const payload = {
    "model": "gpt-4o-mini",
    "messages": [
      { role: "system", content: "You are a helpful assistant."},
      { role: "user", content: prompt }
    ]
  }

  const options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": "Bearer " + apiKey,
    },
    "payload": JSON.stringify(payload),
  }

  try {
    const response = UrlFetchApp.fetch(url, options)
    const json = response.getContentText()
    const data = JSON.parse(json)
    // SpreadsheetApp.getActiveSheet().getRange(cell.getRow(), cell.getColumn() + 1).setValue(`${data.choices[0].message.content}`)
    return data.choices[0].message.content
  } catch (error) {
    return "Error: " + error.message;
  }
}

function GPT4(p, v) {
  let prompt = p + v;
  return callGPT4(prompt);
}

