const bip39 = require('bip39');
const HDKey = require('hdkey');
const ethUtil = require('ethereumjs-util');
const readlineSync = require('readline-sync');

const passphrase = readlineSync.question('Enter a passphrase: ', { hideEchoBack: true });

// Generate a 12-word mnemonic (128 bits for 12 words)
// Generate a 15-word mnemonic (160 bits for 15 words)
// Generate a 18-word mnemonic (192 bits for 18 words)
// Generate a 21-word mnemonic (224 bits for 21 words)
// Generate a 24-word mnemonic (256 bits for 24 words)
const mnemonic = bip39.generateMnemonic(256);
console.log("Your mnemonic phrase:", mnemonic);

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
