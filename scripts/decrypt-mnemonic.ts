import { SecurityUtil } from '../src/common/utils/security.util';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const encryptedMnemonic = process.env.MASTER_MNEMONIC;
const key = process.env.MNEMONIC_ENCRYPTION_KEY;

if (!encryptedMnemonic) {
  console.error('Error: MASTER_MNEMONIC not found in .env');
  process.exit(1);
}

if (!key) {
  console.error('Error: MNEMONIC_ENCRYPTION_KEY not found in .env');
  process.exit(1);
}

try {
  const decrypted = SecurityUtil.decrypt(encryptedMnemonic, key);
  
  console.log('\n==================================================');
  console.log('   KẾT QUẢ GIẢI MÃ SEED PHRASE (24 TỪ)');
  console.log('==================================================\n');
  console.log(decrypted);
  console.log('\n==================================================');
  console.log('CẢNH BÁO: Đừng để ai nhìn thấy màn hình này!');
  console.log('Hãy lưu trữ ví này ở nơi ngoại tuyến an toàn.');
  console.log('==================================================\n');
  
} catch (error) {
  console.error('Giải mã thất bại. Có thể do MNEMONIC_ENCRYPTION_KEY không đúng.');
  console.error('Chi tiết lỗi:', error.message);
}
