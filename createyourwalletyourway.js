// Import the required libraries
const bip39 = require('bip39');
const HDKey = require('hdkey');
const ethUtil = require('ethereumjs-util');
const fs = require('fs'); // Import the fs module for file operations

// Function to find an Ethereum address that ends with the desired ending(s)
async function findAddressWithEnding(desiredEndings) {
  let mnemonic;
  let seed;
  let hdwallet;
  let wallet;
  let address;

  while (true) {
    // Generate a 24-word mnemonic (256 bits)
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

    // Check if the address ends with any of the desired endings
    if (desiredEndings.some(ending => address.endsWith(ending))) {
      const foundData = `Generated mnemonic phrase: ${mnemonic} \nFound address: 0x${address} with private key: ${privateKey}\n`;

      // Log to console
      console.log(foundData);

      // Write to file (create found.txt if it doesn't exist)
      fs.writeFileSync('found.txt', foundData, { flag: 'a' }); // 'a' flag appends to the file if it exists

      //    break;
    }
  }
}


findAddressWithEnding(['12345', '99999', '9999']);
