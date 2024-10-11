// Import the required libraries
const bip39 = require('bip39');
const HDKey = require('hdkey');
const ethUtil = require('ethereumjs-util');

// Function to find an Ethereum address that ends with the desired ending
async function findAddressWithEnding(desiredEnding) {
  let mnemonic;
  let seed;
  let hdwallet;
  let wallet;
  let address;

  while (true) {
    // Generate a 12-word mnemonic (128 bits for 12 words)
    // Generate a 24-word mnemonic (256 bits for 24 words)
    mnemonic = bip39.generateMnemonic(256);
    console.log("Generated mnemonic phrase:", mnemonic);

    // Convert mnemonic to seed
    seed = bip39.mnemonicToSeedSync(mnemonic);

    // Create HD wallet from the seed
    hdwallet = HDKey.fromMasterSeed(seed);

    // Derive wallet using the Ethereum standard path "m/44'/60'/0'/0/0"
    wallet = hdwallet.derive("m/44'/60'/0'/0/0");

    // Extract private key and public key
    const privateKey = wallet.privateKey.toString('hex');
    const publicKey = ethUtil.privateToPublic(wallet.privateKey).toString('hex');
    address = ethUtil.pubToAddress(wallet.publicKey, true).toString('hex');

    // Check if the address ends with the desired ending
    if (address.endsWith(desiredEnding)) {
      console.log(`Found address: 0x${address} with private key: ${privateKey}`);
      break;
    }
  }
}

// Call the function with the desired ending
findAddressWithEnding('99999');
