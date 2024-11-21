const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const bip39 = require('bip39');
const HDKey = require('hdkey');
const ethUtil = require('ethereumjs-util');
const fs = require('fs');
const os = require('os');

if (isMainThread) {
  // === Main Thread Logic ===
  const desiredEndings = ['123456', '99999', '999999', '000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '00000', '11111', '22222', '33333', '44444', '55555', '66666', '77777', '88888']
  const numThreads = 5; // Number of logical CPU cores
  console.log(`Detected ${numThreads} CPU cores. Using ${numThreads} threads.`);

  console.log(`Main thread: Spawning ${numThreads} workers to find addresses.`);

  // Create worker threads
  for (let i = 0; i < numThreads; i++) {
    const worker = new Worker(__filename, {
      workerData: { desiredEndings }, // Pass desiredEndings without batchSize
    });

    // Listen for messages from the worker
    worker.on('message', (foundData) => {
      console.log(`Found by Worker ${i}:`, foundData);

      // Write the result to a file
      fs.writeFileSync('found.txt', foundData + '\n', { flag: 'a' });
    });

    // Handle errors from the worker
    worker.on('error', (err) => {
      console.error(`Worker ${i} encountered an error:`, err);
    });

    // Handle when the worker finishes
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker ${i} stopped with exit code ${code}`);
      } else {
        console.log(`Worker ${i} finished successfully.`);
      }
    });
  }
} else {
  // === Worker Thread Logic ===
  const { desiredEndings } = workerData;

  async function findAddressWithEnding() {
    let mnemonic;
    let seed;
    let hdwallet;
    let count = 0; // Counter for generated wallets

    while (true) {
      // Generate mnemonic
      mnemonic = bip39.generateMnemonic(256);

      // Convert mnemonic to seed
      seed = bip39.mnemonicToSeedSync(mnemonic);

      // Create HD wallet from the seed
      hdwallet = HDKey.fromMasterSeed(seed);

      // Derive the first address from "m/44'/60'/0'/0/0"
      const wallet = hdwallet.derive("m/44'/60'/0'/0/0");
      const address = ethUtil.pubToAddress(wallet.publicKey, true).toString('hex');

      // Increment wallet count
      count++;

      // Log the count of generated wallets
      if (count % 1000 === 0) {
        console.log(`Worker: Generated ${count} wallets so far.`);
      }

      // Check if the address ends with any of the desired endings
      if (desiredEndings.some((ending) => address.endsWith(ending))) {
        const foundData = `Mnemonic: ${mnemonic}\nAddress: 0x${address}\nPrivate Key: ${wallet.privateKey.toString('hex')}\nIndex: 0`;

        parentPort.postMessage(foundData); // Send the result to the Main Thread
        // return; // Exit immediately after finding a match (if needed)
      }
    }
  }

  findAddressWithEnding();
}
