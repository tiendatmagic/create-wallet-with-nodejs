const bip39 = require('bip39');
const fs = require('fs');

// Get seed phrase input from command line
// node recover.js "? note ? twist ? stone shadow ? observe ? submit ?"
const input = process.argv[2];

if (!input) {
  console.error('Please provide a seed phrase with "?" for missing words.');
  process.exit(1);
}

const words = input.trim().split(/\s+/);
const wordlist = bip39.wordlists.english;

// Check for valid phrase length
if (words.length !== 12 && words.length !== 24) {
  console.error('Seed phrase must have 12 or 24 words.');
  process.exit(1);
}

// Find indexes of missing words
const missingIndexes = [];
words.forEach((w, i) => {
  if (w === '?') missingIndexes.push(i);
});

if (missingIndexes.length === 0) {
  console.log('No missing words to recover.');
  process.exit(0);
}

console.log(`Seed phrase has ${words.length} words. Recovering ${missingIndexes.length} missing word(s)...`);

// Generate output filename based on current time (GMT+7)
const now = new Date();
const local = new Date(now.getTime() + 7 * 60 * 60 * 1000); // GMT+7
const timestamp = local.toISOString().replace(/[:.]/g, '-');
const filename = `seed-${timestamp}.txt`;

// Remove file if it already exists
if (fs.existsSync(filename)) {
  fs.unlinkSync(filename);
}

// Recursive function to try all combinations
function dfs(index, arr) {
  if (index === missingIndexes.length) {
    const phrase = arr.join(' ');
    if (bip39.validateMnemonic(phrase)) {
      console.log('Found valid seed phrase:', phrase);
      fs.appendFileSync(filename, phrase + '\n');
    }
    return;
  }

  for (const word of wordlist) {
    arr[missingIndexes[index]] = word;
    dfs(index + 1, arr);
  }
}

// Start recovery process
console.time('Recovery time');
dfs(0, [...words]);
console.timeEnd('Recovery time');

console.log(`Finished. Check results in: ${filename}`);
