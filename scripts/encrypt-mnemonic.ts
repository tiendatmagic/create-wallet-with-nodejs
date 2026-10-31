import { SecurityUtil } from '../src/common/utils/security.util';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const mnemonic = process.argv[2];
const key = process.env.MNEMONIC_ENCRYPTION_KEY;

if (!mnemonic) {
  console.error('Usage: ts-node scripts/encrypt-mnemonic.ts "your mnemonic phrase here"');
  process.exit(1);
}

if (!key) {
  console.error('Error: MNEMONIC_ENCRYPTION_KEY not found in .env');
  process.exit(1);
}

// Basic validation for 24 words
const words = mnemonic.trim().split(/\s+/);
if (words.length !== 24) {
  console.warn(`Warning: Mnemonic has ${words.length} words, but 24 words are recommended for maximum security.`);
}

try {
  const encrypted = SecurityUtil.encrypt(mnemonic, key);
  console.log('\n--- ENCRYPTED MNEMONIC ---');
  console.log(encrypted);
  console.log('--------------------------\n');
  console.log('Copy the string above and paste it into your .env file as MASTER_MNEMONIC');
} catch (error) {
  console.error('Encryption failed:', error.message);
}
