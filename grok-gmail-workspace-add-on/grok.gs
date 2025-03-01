function grok(thread, context, name) {
  const API_KEY = "YOUR_xAI_API_KEY"

  const url = "https://api.x.ai/v1/chat/completions"

  const payload = {
    "model": "grok-2-latest", // update to Grok 3 when in production
    "messages": [
      { role: "system", content: "You are a helpful email assistant."},
      { role: "assistant", content: `Here is the entire email thread for context: ${thread}`},
      { role: "assistant", content: `Here is the previous email in this thread: ${context}`},
      { role: "assistant", content: `For additional context and so you only respond on my behalf, I am: ${name}`},
      { role: "user", content: `Please draft an email response based on the context provided in the previous email without the subject line or signature and only the body of the email.` }
    ]
  }

  const options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": "Bearer " + API_KEY,
    },
    "payload": JSON.stringify(payload)
  }

  try {
    const response = UrlFetchApp.fetch(url, options)
    const json = response.getContentText()
    const data = JSON.parse(json)
    return data.choices[0].message.content;
  } catch (error) {
    return "Error: " + error.message;
  }
}

function getCurrentEmail(event) {
  const accessToken = event.messageMetadata.accessToken;
  GmailApp.setCurrentMessageAccessToken(accessToken)
  const messageId = event.messageMetadata.messageId;
  let emailId = GmailApp.getMessageById(messageId).getId();
  const threadId = event.messageMetadata.threadId;
  let thread = GmailApp.getThreadById(threadId).getMessages();
  let body = GmailApp.getMessageById(messageId).getPlainBody();
  let name = getName()

  let source = [];
  let message = [];

  for (let i = 0; i < thread.length; i++) {
    source.push(thread[i].getFrom())
    message.push(parseEmailBody(thread[i].getPlainBody()))
  }

  let response = grok(message, body, name)

  // Google Workspace Code
  const section = CardService.newCardSection().setHeader(
    '<font color="#1257e0"><b>AI Generated Response</b></font>'
  );

  const insertDraftButton = CardService.newTextButton()
    .setOnClickAction(
      CardService.newAction().setFunctionName('insertDraft').setParameters({
        emailId: emailId, 
        response: response,
      })
    )
    .setText('Insert Draft');

  const createThreadDocButton = CardService.newTextButton()
    .setOnClickAction(
      CardService.newAction().setFunctionName('createDoc')
    )
    .setText('View Thread as Doc');

  // Build the main card after adding the section.
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('AI Generated Response')
        .setSubtitle(response)
    )
    .addSection(
      section.addWidget(
        CardService.newButtonSet().addButton(insertDraftButton)
      ).addWidget(CardService.newButtonSet().addButton(createThreadDocButton))
    )
    .build();

  return [card];
}

function createDoc(event) {
  const accessToken = event.messageMetadata.accessToken;
  GmailApp.setCurrentMessageAccessToken(accessToken)
  const messageId = event.messageMetadata.messageId;
  const threadId = event.messageMetadata.threadId;
  let thread = GmailApp.getThreadById(threadId).getMessages();
  let title = GmailApp.getMessageById(messageId).getSubject();

  let source = [];
  let message = [];
  let doc = DocumentApp.create(title).getId()

  for (let i = 0; i < thread.length; i++) {
    source.push(thread[i].getFrom())
    message.push(parseEmailBody(thread[i].getPlainBody()))
  }

  for (let j = 0; j < thread.length; j++) {
    DocumentApp.openById(doc).getBody().appendParagraph(source[j]).setHeading(DocumentApp.ParagraphHeading.HEADING1)
    DocumentApp.openById(doc).getBody().appendParagraph(message[j]).appendHorizontalRule()
  }
}

function insertDraft(parameters) {
    const jsonObject = JSON.parse(JSON.stringify(parameters));
    const emailId = jsonObject.parameters.emailId;
    const response = jsonObject.parameters.response;
  try {
    GmailApp.getMessageById(emailId).createDraftReplyAll(response);
    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("Email Drafted Successfully!"))
      .build();
  } catch (error) {
    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("Error Creating Draft"))
      .build();
  }
}

function getName() {
  try {
    var userEmail = Session.getActiveUser().getEmail();

    var profile = People.People.get('people/me', {
      personFields: 'names'
    });

    if (profile.names && profile.names.length > 0) {
      var displayName = profile.names[0].displayName;
      return displayName;
    } else {
      return userEmail;
    }
  } catch (e) {
    Logger.log('Error retrieving user name: ' + e.toString());
    return Session.getActiveUser().getEmail();
  }
}

function parseEmailBody(body) {
  /* LLM Prompt for Regex: "I'm trying to parse email threads and simply return the sender information and the body of the email they sent. Google Apps Script GmailApp exposes two ways of doing this .getBody() which returns HTML content and .getPlainBody() which returns text but lots of other information. What do you think is the best way to parse this information to remove unnecessary text from the email thread?" */

  // Remove quoted replies
  body = body.replace(/^>.*$/gm, ''); // Remove lines starting with >
  body = body.replace(/^On .* wrote:$/gm, ''); // Remove "On ... wrote:" lines
  body = body.replace(/^-{3,}.*$/gm, ''); //remove horizontal lines.

  // Remove disclaimers and signatures (customize as needed)
  body = body.replace(/This email and any files transmitted with it are confidential.*/gs, '');
  body = body.replace(/--\s*$/gm, ''); //remove signature seperators.

  // Clean up whitespace
  body = body.trim();
  body = body.replace(/\n{1,}/g, '\n'); // Reduce multiple newlines

  return body;
}

