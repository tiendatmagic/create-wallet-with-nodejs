const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const bip39 = require('bip39');
const HDKey = require('hdkey');
const ethUtil = require('ethereumjs-util');
const fs = require('fs');
const os = require('os');

if (isMainThread) {
  // === Main Thread Logic ===
  const desiredEndings = ['99999', '999999', '000000'];
  const numThreads = os.cpus().length; // Number of logical CPU cores
  console.log(`Detected ${numThreads} CPU cores. Using ${numThreads} threads.`);

  console.log(`Main thread: Spawning ${numThreads} workers to find addresses.`);

  // Create worker threads
  for (let i = 0; i < numThreads; i++) {
    const worker = new Worker(__filename, {
      workerData: { desiredEndings, batchSize: 1000 }, // Pass desiredEndings and batchSize
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
  const { desiredEndings, batchSize } = workerData;

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

      // Derive multiple addresses from the same seed
      for (let i = 0; i < batchSize; i++) {
        const wallet = hdwallet.derive(`m/44'/60'/0'/0/${i}`);
        const address = ethUtil.pubToAddress(wallet.publicKey, true).toString('hex');

        // Increment wallet count
        count++;

        // Log the count of generated wallets
        if (count % 1000 === 0) {
          console.log(`Worker: Generated ${count} wallets so far.`);
        }

        // Check if the address ends with any of the desired endings
        if (desiredEndings.some((ending) => address.endsWith(ending))) {
          const foundData = `Mnemonic: ${mnemonic}\nAddress: 0x${address}\nPrivate Key: ${wallet.privateKey.toString('hex')}\nIndex: ${i}`;

          parentPort.postMessage(foundData); // Send the result to the Main Thread
          //  return; // Exit immediately after finding a match
        }
      }
    }
  }

  findAddressWithEnding();
}
