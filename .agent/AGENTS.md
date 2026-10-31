# AGENTS.md - Nhật Ký Hoạt Động & Yêu Cầu Của Dự Án

## Tổng Quan Dự Án
- **Thư mục:** `E:\create-wallet-with-nodejs`
- **Mục đích:** Các script Node.js tạo và dò ví tiền điện tử (Ethereum, HD Wallet, bip39) theo mẫu địa chỉ mong muốn (vanity address) sử dụng đa luồng (Worker threads).

## Lịch Sử Yêu Cầu & Quá Trình Thực Hiện

### 1. Cải tiến hiển thị tốc độ dò theo giây (createyourwalletyourway-multi.js)
- **Yêu cầu:** Thể hiện rõ tốc độ dò được theo từng giây (ví dụ: `200 seed phrase/s` hoặc `200/s`).
- **Giải pháp:**
  - Dùng `SharedArrayBuffer` (`BigInt64Array`) giữa Main thread và các Worker threads.
  - Main thread dùng `setInterval` 1 giây để tính toán và cập nhật real-time.
  - Hiển thị: Tốc độ tức thời (seed/s), Tốc độ TB, Tổng số seed phrases đã dò, Thời gian chạy.

### 2. Hỗ trợ tùy chọn Passphrase (BIP-39) cho createwallet.js và createyourwalletyourway-multi.js
- **Yêu cầu:** Thêm khả năng truyền Passphrase vào khi tạo ví đơn lẻ và khi dò ví đa luồng.
- **Thực hiện:**
  - [createwallet.js](createwallet.js): Nhận passphrase từ file bí mật riêng hoặc dòng lệnh, truyền vào `bip39.mnemonicToSeedSync(mnemonic, passphrase)`.
  - [createyourwalletyourway-multi.js](createyourwalletyourway-multi.js): Truyền qua `workerData`, gọi `mnemonicToSeedSync(mnemonic, passphrase)`, ghi vào `found.txt` khi tìm thấy.

### 3. Tách Passphrase ra file riêng bí mật (passphrase.txt)
- **Yêu cầu:** Có một file riêng để nhập passphrase bảo mật, không để lộ trên command line hay code chính.
- **Thực hiện:**
  - Tạo file [passphrase.txt](passphrase.txt) tại thư mục gốc dự án. Người dùng chỉ cần mở file này và gõ mật khẩu vào.
  - Thêm `passphrase.txt` và `.env` vào [.gitignore](.gitignore) để ngăn chặn việc commit mật khẩu lên Git.
  - Cả [createwallet.js](createwallet.js) và [createyourwalletyourway-multi.js](createyourwalletyourway-multi.js) tự động đọc mật khẩu từ [passphrase.txt](passphrase.txt).
  - Tự động che giấu (mask `M***3`) mật khẩu khi hiển thị ở Console để chống nhìn trộm (shoulder surfing).
  - Nếu file trống, hệ thống tự động hiểu là không dùng passphrase.
