// Import the required libraries
const bip39 = require('bip39');
const HDKey = require('hdkey');
const ethUtil = require('ethereumjs-util');

// Generate a 12-word mnemonic (128 bits for 12 words)
// Generate a 24-word mnemonic (256 bits for 24 words)
const mnemonic = bip39.generateMnemonic(128);
console.log("Your mnemonic phrase:", mnemonic);

// Convert mnemonic to seed
const seed = bip39.mnemonicToSeedSync(mnemonic);
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
