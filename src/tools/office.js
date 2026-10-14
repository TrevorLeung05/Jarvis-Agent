const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

function getAuth(account = 'primary') {
  const credentialsPath = path.join(__dirname, '../../credentials.json');

  let tokenFile = account === 'primary' ? 'token.json' : `token-${account}.json`;
  let tokenPath = path.join(__dirname, '../../', tokenFile);

  if (!fs.existsSync(tokenPath)) {
    throw new Error(`Token file [${tokenFile}] not found. Run: node setup-auth.js ${account}`);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const { client_secret, client_id } = credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
  oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(tokenPath, 'utf8')));
  return oAuth2Client;
}

// Tool 1: Google Calendar Meeting Scheduler
async function scheduleMeeting(title, startIso, endIso, description = '', account = 'primary') {
  const auth = getAuth(account);
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: title,
      description: description,
      start: { dateTime: startIso },
      end: { dateTime: endIso }
    }
  });

  return { success: true, eventLink: res.data.htmlLink, id: res.data.id, account };
}

// Tool 2: Gmail Message Sender
async function sendEmail(to, subject, body, cc = null, account = 'primary') {
  const auth = getAuth(account);
  const gmail = google.gmail({ version: 'v1', auth });

  const toList = Array.isArray(to) ? to.join(', ') : to;

  // Append signature to every outgoing email
  const fullBody = `${body}\r\n\r\n---\r\nSent from Trevor's Jarvis`;

  const headers = [
    `To: ${toList}`,
    cc ? `Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}` : null,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    fullBody
  ].filter(line => line !== null).join('\r\n');

  const base64EncodedEmail = Buffer.from(headers)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: base64EncodedEmail
    }
  });

  return { success: true, messageId: res.data.id, account };
}

module.exports = { scheduleMeeting, sendEmail };
