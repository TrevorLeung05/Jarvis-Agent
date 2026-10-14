const { exec } = require('child_process');

function speak(text) {
  return new Promise((resolve) => {
    const cleanText = text.replace(/["']/g, '');
    const cmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${cleanText}')"`;
    exec(cmd, () => resolve());
  });
}

module.exports = { speak };
