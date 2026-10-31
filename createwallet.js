// Import the required libraries
const bip39 = require('bip39');
const HDKey = require('hdkey');
const ethUtil = require('ethereumjs-util');
const fs = require('fs');
const path = require('path');

// Hàm đọc Passphrase từ file riêng bí mật (passphrase.txt)
function getPassphrase() {
  const secretFile = path.join(__dirname, 'passphrase.txt');
  
  // Nếu file bị xóa, tự động tạo lại file rỗng để người dùng tiện sử dụng lại
  if (!fs.existsSync(secretFile)) {
    try {
      fs.writeFileSync(secretFile, '', 'utf8');
    } catch (_) {}
    return (process.argv[2] || '').trim();
  }

  const content = fs.readFileSync(secretFile, 'utf8').trim();
  if (content) return content;

  // Fallback: nhận từ tham số dòng lệnh nếu có
  return (process.argv[2] || '').trim();
}

const passphrase = getPassphrase();

// Generate a 12-word mnemonic (128 bits for 12 words)
// Generate a 15-word mnemonic (160 bits for 15 words)
// Generate a 18-word mnemonic (192 bits for 18 words)
// Generate a 21-word mnemonic (224 bits for 21 words)
// Generate a 24-word mnemonic (256 bits for 24 words)
const mnemonic = bip39.generateMnemonic(160);
console.log("Your mnemonic phrase:", mnemonic);

if (passphrase) {
  // Che bớt ký tự trên console để tránh bị nhìn trộm (bảo mật)
  const masked = passphrase.length > 2
    ? passphrase[0] + '*'.repeat(Math.min(passphrase.length - 2, 8)) + passphrase.slice(-1)
    : '***';
  console.log(`Passphrase: ${masked} (Đã tải bí mật từ file passphrase.txt)`);
} else {
  console.log("Passphrase: (Không sử dụng - file passphrase.txt đang trống)");
}

// Convert mnemonic to seed (có kèm passphrase nếu có)
const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
console.log("Seed:", seed.toString('hex'));

// Create HD wallet from the seed
const hdwallet = HDKey.fromMasterSeed(seed);

// Derive wallet using the Ethereum standard path "m/44'/60'/0'/0/0"
const wallet = hdwallet.derive("m/44'/60'/0'/0/0");

// Extract private key and public key
const privateKey = wallet.privateKey.toString('hex');
const publicKey = ethUtil.privateToPublic(wallet.privateKey).toString('hex');
const address = ethUtil.pubToAddress(wallet.publicKey, true).toString('hex');

// Display the results
console.log("Private Key:", privateKey);
console.log("Public Key:", publicKey);
console.log("Your Ethereum wallet address:", `0x${address}`);
