const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const bip39 = require('bip39');
const HDKey = require('hdkey');
const ethUtil = require('ethereumjs-util');
const fs = require('fs');
const os = require('os');

// Hàm format thời gian theo định dạng HH:MM:SS
function formatDuration(totalSeconds) {
  const sec = Math.floor(totalSeconds % 60);
  const min = Math.floor((totalSeconds / 60) % 60);
  const hour = Math.floor(totalSeconds / 3600);
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

if (isMainThread) {
  // === Main Thread Logic ===
  const desiredEndings = ['12345', '00000', '11111', '22222', '33333', '44444', '55555', '66666', '77777', '88888', '99999', '99'];
  const numThreads = os.cpus().length; // Nhận diện số lõi CPU

  console.log('=============================================================');
  console.log('🚀 BẮT ĐẦU DÒ TÌM VÍ ETHEREUM ĐA LUỒNG (VANITY WALLET)');
  console.log(`💻 Phát hiện: ${numThreads} CPU Cores -> Sử dụng ${numThreads} luồng (Workers)`);
  console.log(`🎯 Đuôi địa chỉ cần tìm: ${desiredEndings.join(', ')}`);
  console.log('⚡ Tốc độ dò (seed phrase / giây) sẽ cập nhật liên tục mỗi giây bên dưới:');
  console.log('=============================================================\n');

  // SharedArrayBuffer để các worker cập nhật số lượng ví đã dò mà không nghẽn IPC
  const sharedBuffer = new SharedArrayBuffer(numThreads * 8);
  const counts = new BigInt64Array(sharedBuffer);

  const startTime = Date.now();
  let lastCheckTime = startTime;
  let lastTotalCount = 0n;

  // Tạo và chạy các worker
  const workers = [];
  for (let i = 0; i < numThreads; i++) {
    const worker = new Worker(__filename, {
      workerData: {
        workerIndex: i,
        sharedBuffer,
        desiredEndings
      },
    });

    // Lắng nghe sự kiện tìm thấy ví phù hợp
    worker.on('message', (message) => {
      if (message.type === 'found') {
        if (process.stdout.isTTY) {
          process.stdout.write('\r\x1b[K'); // Xóa dòng trạng thái hiện tại
        }

        console.log('\n=============================================================');
        console.log(`🎉 [TÌM THẤY VÍ PHÙ HỢP] bởi Worker ${i}!`);
        console.log('-------------------------------------------------------------');
        console.log(message.data);
        console.log('-------------------------------------------------------------');
        console.log('📁 Đã lưu thông tin vào file: found.txt');
        console.log('=============================================================\n');

        // Ghi kết quả vào file
        fs.writeFileSync('found.txt', message.data + '\n\n', { flag: 'a' });
      }
    });

    // Bắt lỗi từ worker
    worker.on('error', (err) => {
      console.error(`\n❌ Worker ${i} gặp lỗi:`, err);
    });

    // Xử lý khi worker dừng
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`\n⚠️ Worker ${i} dừng với mã lỗi ${code}`);
      }
    });

    workers.push(worker);
  }

  // Định kỳ mỗi 1 giây (1000ms) tính toán và hiển thị tốc độ dò theo giây
  const statsInterval = setInterval(() => {
    const now = Date.now();
    const elapsedSec = (now - startTime) / 1000;
    const intervalSec = (now - lastCheckTime) / 1000;

    let currentTotal = 0n;
    for (let j = 0; j < numThreads; j++) {
      currentTotal += counts[j];
    }

    const diff = Number(currentTotal - lastTotalCount);
    const speed = intervalSec > 0 ? Math.round(diff / intervalSec) : 0;
    const avgSpeed = elapsedSec > 0 ? Math.round(Number(currentTotal) / elapsedSec) : 0;

    lastTotalCount = currentTotal;
    lastCheckTime = now;

    const timeStr = formatDuration(elapsedSec);
    const speedStr = `${speed.toLocaleString('en-US')} seed/s`;
    const avgStr = `${avgSpeed.toLocaleString('en-US')} seed/s`;
    const totalStr = currentTotal.toLocaleString('en-US');

    // Thể hiện rõ ràng tốc độ theo giây
    const statusLine = `[⏱️ ${timeStr}] ⚡ Tốc độ: ${speedStr} (TB: ${avgStr}) | Đã dò: ${totalStr} seed phrases | Threads: ${numThreads}`;

    if (process.stdout.isTTY) {
      process.stdout.write(`\r\x1b[K${statusLine}`);
    } else {
      console.log(statusLine);
    }
  }, 1000);

  // Khi người dùng bấm Ctrl + C để dừng
  process.on('SIGINT', () => {
    clearInterval(statsInterval);

    const totalElapsed = (Date.now() - startTime) / 1000;
    let finalTotal = 0n;
    for (let j = 0; j < numThreads; j++) {
      finalTotal += counts[j];
    }
    const finalAvgSpeed = totalElapsed > 0 ? Math.round(Number(finalTotal) / totalElapsed) : 0;

    console.log('\n\n--- 🛑 ĐÃ DỪNG TIẾN TRÌNH DÒ VÍ ---');
    console.log(`⏱️ Tổng thời gian chạy: ${formatDuration(totalElapsed)}`);
    console.log(`📊 Tổng số seed phrase đã dò: ${finalTotal.toLocaleString('en-US')}`);
    console.log(`⚡ Tốc độ trung bình toàn bộ: ${finalAvgSpeed.toLocaleString('en-US')} seed/s`);
    process.exit(0);
  });

} else {
  // === Worker Thread Logic ===
  const { desiredEndings, workerIndex, sharedBuffer } = workerData;
  const counts = new BigInt64Array(sharedBuffer);

  function findAddressWithEnding() {
    while (true) {
      // 1. Tạo mnemonic (256-bit entropy -> 24 từ seed phrase)
      const mnemonic = bip39.generateMnemonic(256);

      // 2. Chuyển mnemonic thành seed
      const seed = bip39.mnemonicToSeedSync(mnemonic);

      // 3. Tạo HD wallet từ seed
      const hdwallet = HDKey.fromMasterSeed(seed);

      // 4. Derive địa chỉ đầu tiên (m/44'/60'/0'/0/0)
      const wallet = hdwallet.derive("m/44'/60'/0'/0/0");
      const address = ethUtil.pubToAddress(wallet.publicKey, true).toString('hex');

      // 5. Cập nhật số lượng đã dò vào bộ nhớ chia sẻ chung (SharedArrayBuffer)
      counts[workerIndex]++;

      // 6. Kiểm tra đuôi mong muốn
      if (desiredEndings.some((ending) => address.endsWith(ending))) {
        const foundData =
          `Mnemonic: ${mnemonic}\n` +
          `Address: 0x${address}\n` +
          `Private Key: ${wallet.privateKey.toString('hex')}\n` +
          `Index: 0`;

        parentPort.postMessage({ type: 'found', data: foundData });
      }
    }
  }

  findAddressWithEnding();
}
