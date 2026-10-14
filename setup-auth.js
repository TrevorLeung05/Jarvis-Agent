const fs = require('fs');
const http = require('http');
const url = require('url');
const { google } = require('googleapis');

// Read the label passed via command line (default to 'primary' if omitted)
const accountArg = process.argv[2] ? process.argv[2].trim().toLowerCase() : 'primary';
const tokenFilename = accountArg === 'primary' ? 'token.json' : `token-${accountArg}.json`;

const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
const { client_secret, client_id } = credentials.installed || credentials.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  'http://localhost:3000/oauth2callback'
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent select_account',
  scope: [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.send'
  ]
});

console.log('\n==============================================');
console.log(` LINKING ACCOUNT: [${accountArg}]`);
console.log(` SAVING TO FILE : [${tokenFilename}]`);
console.log('==============================================\n');
console.log('Open this link in your browser:\n');
console.log(authUrl);
console.log('\nWaiting for callback on http://localhost:3000 ...');

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/oauth2callback')) {
    const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
    const code = qs.get('code');

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<h2>Successfully linked [${accountArg}]! Token saved to ${tokenFilename}. You can close this window.</h2>`);
    server.close();

    const { tokens } = await oAuth2Client.getToken(code);
    fs.writeFileSync(tokenFilename, JSON.stringify(tokens, null, 2));
    console.log(`\n[SUCCESS] Token created and saved directly to ${tokenFilename}!\n`);
    process.exit(0);
  }
}).listen(3000);
