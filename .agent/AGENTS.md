# AGENTS.md - Nhật Ký Hoạt Động & Yêu Cầu Của Dự Án

## Tổng Quan Dự Án
- **Thư mục:** `E:\create-wallet-with-nodejs`
- **Mục đích:** Các script Node.js tạo và dò ví tiền điện tử (Ethereum, HD Wallet, bip39) theo mẫu địa chỉ mong muốn (vanity address) sử dụng đa luồng (Worker threads).

## Lịch Sử Yêu Cầu & Quá Trình Thực Hiện

### 1. Cải tiến hiển thị tốc độ dò theo giây (createyourwalletyourway-multi.js)
- **Yêu cầu:** Thể hiện rõ tốc độ dò được theo từng giây (ví dụ: `200 seed phrase/s` hoặc `200/s`).
- **Hiện trạng trước đó:**
  - Worker chỉ gửi message khi đủ 1000 ví (`count % 1000 === 0`), do PBKDF2 nặng nên mất hàng chục giây mới in một dòng log.
  - Tốc độ tổng tính lệch pha, console bị trôi dòng lộn xộn.
- **Giải pháp thực hiện:**
  - Dùng `SharedArrayBuffer` (`BigInt64Array`) chia sẻ bộ nhớ đếm giữa các Worker threads và Main thread (hiệu năng tối đa, không nghẽn IPC).
  - Main thread dùng `setInterval` đúng 1 giây cập nhật số liệu chính xác theo thời gian thực (real-time).
  - Hiển thị rõ: **Tốc độ hiện tại (seed/s)**, **Tốc độ trung bình (TB/s)**, **Tổng số seed phrase/ví đã dò**, **Thời gian đã chạy (HH:MM:SS)**.
  - Cập nhật tại chỗ trên một dòng mượt mà (`\r`), khi tìm thấy ví (`found`) thì in banner nổi bật và ghi vào file `found.txt`.
  - Bắt tín hiệu `SIGINT` (Ctrl+C) để in báo cáo thống kê trước khi thoát.

