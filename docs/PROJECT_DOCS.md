# Tài liệu Mô tả Ứng dụng App Read Books

## 1. Giới thiệu
**App Read Books** là một ứng dụng di động được xây dựng bằng React Native (Expo), cho phép người dùng đọc truyện, sách với các tính năng nâng cao như dịch thuật và tóm tắt nội dung bằng AI (Copilot API).

## 2. Các Tính năng Chính

### 2.1. Quản lý Sách (Book Management)
- **Danh sách sách:** Hiển thị danh sách các truyện/sách đã tải về.
- **Thêm sách:**
  - Tải sách từ nguồn dữ liệu trực tuyến (Supabase).
  - Sách được tải về dưới dạng file `.zip` và tự động giải nén vào thư mục lưu trữ của ứng dụng.
- **Xóa sách:** Cho phép xóa sách khỏi thiết bị thông qua thao tác vuốt (swipe) trên danh sách.
- **Thông tin sách:** Xem thông tin chi tiết của sách.

### 2.2. Đọc Sách (Reading)
- **Hiển thị nội dung:** Hiển thị nội dung chương truyện dưới dạng HTML.
- **Điều hướng:**
  - Chuyển chương (Trước/Sau).
  - Tự động lưu vị trí đọc (offset) và cuộn đến vị trí đó khi mở lại.
  - Nút cuộn nhanh xuống cuối trang.
- **Chế độ đọc AI (AI Reading Modes):**
  - **Mặc định (None):** Hiển thị nội dung gốc của sách.
  - **Dịch thuật (Translate):** Sử dụng Copilot API để dịch nội dung chương sang ngôn ngữ đích (cấu hình trong Settings).
  - **Tóm tắt (Summary):** Sử dụng Copilot API để tóm tắt nội dung chương.

### 2.3. Cài đặt (Settings)
- Quản lý các cấu hình quan trọng:
  - **Copilot API:** API URL, Model, Prompts cho dịch và tóm tắt.
  - **Supabase:** Anon Key để tải sách.
- Cấu hình giao diện đọc (Typography): Font chữ, kích thước, chiều cao dòng.

## 3. Kiến trúc và Công nghệ

### 3.1. Tech Stack
- **Framework:** React Native (Expo).
- **Language:** TypeScript.
- **State Management:** Zustand (kết hợp với MMKV để persist data).
- **Navigation:** Expo Router.
- **Storage:** MMKV (cho settings/state), Expo File System (cho file sách).
- **AI Integration:** Copilot-compatible chat completion API thông qua provider nội bộ.
- **UI Components:** React Native Gesture Handler, Bottom Sheet.

### 3.2. Cấu trúc Thư mục Chính
- `app/`: Chứa các màn hình và cấu hình routing (Expo Router).
- `components/`: Các UI component tái sử dụng.
- `controllers/`: Quản lý state (Store) và storage.
- `services/`: Các service xử lý logic nghiệp vụ (Download, AI providers, AI actions, Database).
- `hooks/`: Custom hooks cho logic đọc sách, navigation, v.v.
- `utils/`: Các hàm tiện ích hỗ trợ.

### 3.3. Ownership sau Refactor
- `app/*`: chỉ xử lý routing + composition UI.
- `hooks/*`: orchestration lifecycle và trạng thái cho màn hình.
- `services/*`: business logic, network/file/database I/O và provider integration.
- `controllers/*`: schema state, persistence, migration.

## 4. Luồng Hoạt động (Operational Flows)

### 4.1. Khởi động Ứng dụng
1. **Splash Screen:** Hiển thị màn hình chờ.
2. **Initialization:** Thiết lập các state và điều hướng ban đầu.
3. **Check State:** Kiểm tra trong `useAppStore` xem người dùng có đang đọc dở cuốn sách nào không (`reading.onScreen`).
   - Nếu có: Điều hướng trực tiếp vào màn hình đọc (`/reading`).
   - Nếu không: Vào màn hình chính (`/`).

### 4.2. Luồng Tải Sách
1. Người dùng vào màn hình "Tải truyện" (`app/add-book/index.tsx`).
2. Hook orchestration `useAddBook` gọi service import (`services/book-import.service.ts`) để lấy danh sách sách khả dụng.
3. Người dùng chọn tải sách:
   - File `.zip` được tải về qua `downloadFile`.
   - File được giải nén vào thư mục sách của ứng dụng qua `unzip`.
   - File zip gốc bị xóa sau khi giải nén thành công.
4. Danh sách sách ở màn hình chính được cập nhật.

### 4.3. Luồng Đọc và Xử lý AI
1. Màn hình `Reading` khởi tạo, lấy `bookId` từ params.
2. Hook `useReadingContent` được kích hoạt:
   - Kiểm tra `readingAIMode` từ Store.
   - **Mode None:** Đọc nội dung file chương từ bộ nhớ máy.
   - **Mode Translate/Summary:**
     - Gửi nội dung chương đến Copilot API.
     - Gửi prompt tương ứng (Dịch/Tóm tắt) để AI xử lý.
     - Nhận về văn bản đã xử lý.
3. Nội dung (Gốc hoặc AI) được hiển thị lên màn hình.

## 5. Yêu cầu Cấu hình
Để ứng dụng hoạt động đầy đủ, người dùng cần cấu hình các thông số sau trong phần Settings:
- **Supabase Anon Key:** Để tải sách.
- **Copilot API URL/Model:** Để sử dụng tính năng Dịch và Tóm tắt.
