// Create =GROK() Formula for Google Sheets
function callGrok(prompt) {
  // NOTE: You must save your Grok API Key in Project Settings > Script Properties
  let grokAPIkey = ScriptProperties.getProperty("grokAPIkey")
  let url = "https://api.x.ai/v1/chat/completions"

  const payload = {
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful SEO assistant that can help write descriptive meta description overviews based on topics."
      },
      {
        "role": "user",
        "content": `${prompt}`
      }
    ],
    "model": "grok-3-latest",
  }

  const options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": `Bearer ${grokAPIkey}`
    },
    "payload": JSON.stringify(payload)
  }

  try {
    const response = UrlFetchApp.fetch(url, options)
    const json = response.getContentText()
    const data = JSON.parse(json)
    // Logger.log(data.choices[0].message.content)
    return data.choices[0].message.content
  } catch (error) {
    return "Error: " + error.message;
  }
}

function GROK(value) {
  // If you know what prompt you want consistently (UPDATE for your use case):
  let prompt = "For the following topic, generate a meta description between 120 and 158 characters in length, only providing the meta description and no other values or context: " + value;
  // For more flexibility, add an additional input to the formula params [i.e. function GROK(context, value)...] and concatenate into a final prompt:
  // let prompt = context + value;
  return callGrok(prompt)
}
