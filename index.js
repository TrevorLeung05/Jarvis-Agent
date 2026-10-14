const readline = require('readline');
const { scheduleMeeting, sendEmail } = require('./src/tools/office');
const { speak } = require('./src/audio/tts');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function handleCommand(input) {
  const text = input.trim();
  const lower = text.toLowerCase();

  try {
    if (lower.startsWith('schedule')) {
      const fromMatch = text.match(/from:([^\s]+)/i);
      const targetAccount = fromMatch ? fromMatch[1].toLowerCase() : (lower.includes('second') ? 'second' : 'primary');

      await speak(`Scheduling meeting on ${targetAccount} calendar.`);
      const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 90 * 60 * 1000).toISOString();

      const result = await scheduleMeeting(
        'Jarvis Sync Meeting',
        start,
        end,
        'Auto-scheduled via Jarvis Agent V1',
        targetAccount
      );
      console.log(`\n[SUCCESS] Meeting link (${targetAccount}):`, result.eventLink);
      await speak(`Meeting scheduled on ${targetAccount} calendar.`);

    } else if (lower.startsWith('email')) {
      const fromMatch = text.match(/from:([^\s]+)/i);
      const toMatch = text.match(/to:([^\s]+)/i);
      const ccMatch = text.match(/cc:([^\s]+)/i);
      const subjMatch = text.match(/subject:"([^"]+)"|subject:([^\s]+)/i);
      const bodyMatch = text.match(/body:"([^"]+)"|body:(.+)/i);

      const account = fromMatch ? fromMatch[1].toLowerCase() : 'primary';
      const to = toMatch ? toMatch[1] : null;
      const cc = ccMatch ? ccMatch[1] : null;
      const subject = subjMatch ? (subjMatch[1] || subjMatch[2]) : 'Notice from Jarvis';
      const body = bodyMatch ? (bodyMatch[1] || bodyMatch[2]) : 'Hello from Jarvis Agent';

      if (!to) {
        console.log('\n[ERROR] Missing recipients. Example:');
        console.log('  email from:second to:person1@gmail.com subject:"Hi" body:"Hello"');
        await speak('Please provide recipient email addresses.');
      } else {
        await speak(`Sending email from ${account} account.`);
        const result = await sendEmail(to, subject, body, cc, account);
        console.log(`\n[SUCCESS] Email sent from [${account}]! Message ID:`, result.messageId);
        await speak('Email has been sent successfully.');
      }

    } else {
      await speak(`Command acknowledged: ${text}`);
      console.log(`[ECHO] ${text}`);
    }
  } catch (err) {
    console.error('\n[ERROR]', err.message);
    await speak('An error occurred executing that command.');
  }
}

async function main() {
  console.log('\n=========================================');
  console.log('       JARVIS AGENT V1 IS ONLINE         ');
  console.log('=========================================');
  console.log('Available Commands:');
  console.log('  - schedule');
  console.log('  - schedule from:personal');
  console.log('  - email to:a@test.com subject:"Hi" body:"Hello"');
  console.log('  - exit\n');

  await speak('Jarvis Agent is online and ready.');
  process.stdout.write('Jarvis > ');

  rl.on('line', async (line) => {
    if (line.trim().toLowerCase() === 'exit') {
      await speak('Shutting down. Goodbye.');
      process.exit(0);
    }
    await handleCommand(line);
    process.stdout.write('\nJarvis > ');
  });
}

main();
