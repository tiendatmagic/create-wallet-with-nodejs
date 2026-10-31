import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import { ethers } from 'ethers';
import bs58 from 'bs58';
import * as nacl from 'tweetnacl';
import * as readline from 'readline';

const bip32 = BIP32Factory(ecc);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => 
  new Promise((resolve) => rl.question(query, resolve));

const DOGE_NETWORK = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: 'dc',
  bip32: { public: 0x02facafd, private: 0x02fac398 },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e,
};

async function main() {
  console.log('\n--- MGX Wallet Key Export Tool (V3 - REAL ADDRESSES) ---\n');
  
  const mnemonic = await question('Enter your 24-word seed phrase: ');
  if (!bip39.validateMnemonic(mnemonic)) {
    console.error('Invalid mnemonic phrase!');
    process.exit(1);
  }

  const indexStr = await question('Enter user index (e.g. 1): ');
  const index = parseInt(indexStr);
  
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed);

  const MAX_INDEX = 2147483647;
  const account = Math.floor(index / MAX_INDEX);
  const addressIndex = index % MAX_INDEX;

  console.log(`\nResults for Index ${index}:`);
  console.log('------------------------------------------------------------');

  // BTC
  const btcPath = `m/44'/0'/${account}'/0/${addressIndex}`;
  const btcChild = root.derivePath(btcPath);
  const { address: btcAddr } = bitcoin.payments.p2wpkh({
    pubkey: btcChild.publicKey,
    network: bitcoin.networks.bitcoin,
  });
  console.log(`BTC:`);
  console.log(`  Address: ${btcAddr}`);
  console.log(`  Private Key (Hex): ${Buffer.from(btcChild.privateKey!).toString('hex')}`);

  // ETH / BNB
  const ethPath = `m/44'/60'/${account}'/0/${addressIndex}`;
  const ethChild = root.derivePath(ethPath);
  const ethWallet = new ethers.Wallet(Buffer.from(ethChild.privateKey!).toString('hex'));
  console.log(`\nETH / BNB:`);
  console.log(`  Address: ${ethWallet.address}`);
  console.log(`  Private Key (Hex): ${ethWallet.privateKey}`);

  // DOGE
  const dogePath = `m/44'/3'/${account}'/0/${addressIndex}`;
  const dogeChild = root.derivePath(dogePath);
  const { address: dogeAddr } = bitcoin.payments.p2pkh({
    pubkey: dogeChild.publicKey,
    network: DOGE_NETWORK,
  });
  console.log(`\nDOGE:`);
  console.log(`  Address: ${dogeAddr}`);
  console.log(`  Private Key (Hex): ${Buffer.from(dogeChild.privateKey!).toString('hex')}`);

  // TRX (REAL)
  const trxPath = `m/44'/195'/${account}'/0/${addressIndex}`;
  const trxChild = root.derivePath(trxPath);
  const trxWallet = new ethers.Wallet(Buffer.from(trxChild.privateKey!).toString('hex'));
  
  const trxEthAddr = trxWallet.address.substring(2);
  const trxInput = Buffer.from('41' + trxEthAddr, 'hex');
  const trxHash1 = Buffer.from(ethers.sha256(trxInput).substring(2), 'hex');
  const trxHash2 = Buffer.from(ethers.sha256(trxHash1).substring(2), 'hex');
  const trxChecksum = trxHash2.slice(0, 4);
  const trxAddr = bs58.encode(Buffer.concat([trxInput, trxChecksum]));

  console.log(`\nTRX:`);
  console.log(`  Address: ${trxAddr}`);
  console.log(`  Private Key (Hex): ${trxWallet.privateKey}`);

  // SOL (REAL BIP44)
  const solPath = `m/44'/501'/${index}'/0'`;
  const solChild = root.derivePath(solPath);
  const solKeypair = nacl.sign.keyPair.fromSeed(solChild.privateKey!);
  const solAddr = bs58.encode(Buffer.from(solKeypair.publicKey));
  const solPriv = bs58.encode(Buffer.from(solKeypair.secretKey));
  console.log(`\nSOL:`);
  console.log(`  Address: ${solAddr}`);
  console.log(`  Private Key (Base58): ${solPriv}`);
  console.log(`  (Note: Nhập chuỗi Base58 này vào Trust Wallet / Phantom làm Private Key)`);

  // SUI
  const suiPath = `m/44'/784'/${index}'/0'/0'`;
  const suiChild = root.derivePath(suiPath);
  const suiKeypair = nacl.sign.keyPair.fromSeed(suiChild.privateKey!);
  const { blake2b } = require('@noble/hashes/blake2b');
  const suiTmp = new Uint8Array(suiKeypair.publicKey.length + 1);
  suiTmp[0] = 0x00;
  suiTmp.set(suiKeypair.publicKey, 1);
  const suiHash = blake2b(suiTmp, { dkLen: 32 });
  const suiAddr = '0x' + Buffer.from(suiHash).toString('hex');
  console.log(`\nSUI:`);
  console.log(`  Address: ${suiAddr}`);
  console.log(`  Private Key (Hex): ${Buffer.from(suiChild.privateKey!).toString('hex')}`);

  // APTOS
  const aptPath = `m/44'/637'/${index}'/0'/0'`;
  const aptChild = root.derivePath(aptPath);
  const aptKeypair = nacl.sign.keyPair.fromSeed(aptChild.privateKey!);
  const { sha3_256 } = require('js-sha3');
  const aptHash = sha3_256.create();
  aptHash.update(aptKeypair.publicKey);
  aptHash.update(new Uint8Array([0x00]));
  const aptAddr = '0x' + aptHash.hex();
  console.log(`\nAPTOS:`);
  console.log(`  Address: ${aptAddr}`);
  console.log(`  Private Key (Hex): ${Buffer.from(aptChild.privateKey!).toString('hex')}`);

  // TON
  const tonPath = `m/44'/607'/${index}'/0'/0'`;
  const tonChild = root.derivePath(tonPath);
  const tonKeypair = nacl.sign.keyPair.fromSeed(tonChild.privateKey!);
  const { WalletContractV4 } = require('@ton/ton');
  const tonWallet = WalletContractV4.create({ workchain: 0, publicKey: Buffer.from(tonKeypair.publicKey) });
  console.log(`\nTON:`);
  console.log(`  Address: ${tonWallet.address.toString({ bounceable: false })}`);
  console.log(`  Private Key (Hex): ${Buffer.from(tonChild.privateKey!).toString('hex')}`);

  // ADA
  const adaPath = `m/44'/1815'/${index}'/0/0`;
  const adaChild = root.derivePath(adaPath);
  const adaKeypair = nacl.sign.keyPair.fromSeed(adaChild.privateKey!);
  const { bech32 } = require('bech32');
  const adaHeader = 0x61;
  const adaData = new Uint8Array(1 + adaKeypair.publicKey.length);
  adaData[0] = adaHeader;
  adaData.set(adaKeypair.publicKey, 1);
  const adaWords = bech32.toWords(adaData);
  const adaAddr = bech32.encode('addr', adaWords);
  console.log(`\nADA:`);
  console.log(`  Address: ${adaAddr}`);
  console.log(`  Private Key (Hex): ${Buffer.from(adaChild.privateKey!).toString('hex')}`);

  console.log('------------------------------------------------------------\n');
  rl.close();
}

main();
