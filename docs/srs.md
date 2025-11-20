# Tài liệu SRS – app-read-books

## 1. Giới thiệu
### 1.1 Mục đích
Tài liệu này mô tả yêu cầu phần mềm (Software Requirements Specification) cho ứng dụng đọc truyện **app-read-books**. Mục tiêu là cung cấp một nguồn tham chiếu thống nhất cho việc bảo trì, nâng cấp và mở rộng tính năng trên nền tảng React Native/Expo.

### 1.2 Phạm vi
Ứng dụng hỗ trợ người dùng tải bộ truyện đã được đóng gói (ZIP) về máy, đọc offline, tự động tóm tắt nội dung bằng Google Gemini, và tạo audio TTS để nghe. Sản phẩm phục vụ độc giả cá nhân và đội nội bộ muốn quản lý thư viện truyện tùy chỉnh.

### 1.3 Thuật ngữ & viết tắt
- **Book Package**: Thư mục chứa `book.json` và các chương HTML nằm trong `chapters/`.
- **MMKV**: Thư viện lưu trữ key-value cục bộ hiệu năng cao.
- **TTS**: Text-to-Speech được cung cấp bởi Capcut WebSocket API.
- **Gemini**: Google Generative Language API dùng để cô đọng chương truyện.
- **TrackPlayer**: Thư viện phát audio nền `react-native-track-player`.

## 2. Tác nhân & vai trò
| Tác nhân | Mô tả | Quyền hạn |
| --- | --- | --- |
| **Độc giả** | Người dùng cuối đọc truyện, nghe audio | Duyệt/thêm/xóa truyện, đọc chương, bật summary/TTS |
| **Người cấu hình nội bộ** | Quản trị thiết lập API key, prompt | Nhập Gemini API key, prompt, Supabase key thông qua `.env` hoặc màn hình cài đặt |
| **Dịch vụ bên thứ ba** | Gemini, Supabase Edge Function, Capcut TTS, TrackPlayer | Cung cấp dữ liệu, tóm tắt chương, streaming audio |

## 3. Tổng quan hệ thống
### 3.1 Kiến trúc
- Ứng dụng Expo Router (`app/_layout.tsx`) quản lý điều hướng file-based và đăng ký các provider (BottomSheet, toast, spinner).
- State chia sẻ bằng Zustand (`controllers/store.ts`) và được persist qua MMKV (`controllers/mmkv.ts`).
- Nội dung truyện được lưu trong `expo-file-system` tại `DocumentDirectory/books/<bookId>`.
- Luồng đọc chương sử dụng hooks tùy chỉnh (`hooks/use-reading-*`) phối hợp với sự kiện `DeviceEventEmitter` để đồng bộ UI.
- Dịch vụ nền: TrackPlayer service (`services/track-player-service.ts`, `services/playback-service.ts`) và bộ đệm TTS (`controllers/tts-cache.ts`).

### 3.2 Công nghệ chính
React Native 0.81, Expo SDK 54, Expo Router, Zustand, MMKV, React Native Track Player, Expo File System (API beta), Google Gemini API, Capcut WebSocket TTS, Supabase Edge Functions.

## 4. Yêu cầu chức năng
### 4.1 Quản lý thư viện
- Liệt kê danh sách truyện tại `app/index.tsx`, đọc dữ liệu từ thư mục `books/` bằng `readFolderBooks()` (`utils/index.ts`).
- Bật/tắt chế độ chỉnh sửa để xóa truyện (`components/home-book-item.tsx`).

### 4.2 Nhập truyện
- Fetch danh sách xuất bản từ Supabase Function (`app/add-book/index.tsx`).
- Tải file ZIP qua `services/download-file.ts`, lưu tại `download_books/`, giải nén bằng `react-native-zip-archive` sang `books/`.
- Xóa file tạm sau khi giải nén; thông báo trạng thái qua `GToast`.

### 4.3 Đọc truyện & điều khiển
- Màn hình `app/reading/index.tsx` hiển thị nội dung HTML qua `components/content-display.tsx` (RenderHTML).
- Điều hướng chương bằng swipe/scroll, lưu offset đọc (`hooks/use-reading-controller.ts`).
- Tự động phục hồi chương gần nhất và trạng thái đọc (`hooks/use-reupdate-reading.ts`).
- Bảng thông tin truyện/thiết lập (`components/sheet-book-info.tsx`) cho phép: đổi font, cỡ chữ, line-height, mở mục lục (`app/references/index.tsx`), tạo summary & audio hàng loạt.

### 4.4 Xử lý nội dung (Translate/Summary)
- **3 Reading Modes**: Normal (HTML gốc), Translate (dịch sang tiếng Việt), Summary (tóm tắt)
- Mode switching với debouncing 500ms để tránh spam API
- `hooks/use-content-processor.ts` xử lý cả translate và summarize thông qua Gemini API
- Cache nội dung đã xử lý trong SQLite database (`services/database-service.ts`)
- **Prefetch tự động**: `hooks/use-prefetch.ts` tạo nội dung cho 10 chương tiếp theo trong background

### 4.5 Chuyển văn bản thành giọng nói (TTS)
- TTS on-demand: Nút TTS riêng trên reading screen để generate audio khi cần
- Support TTS cho cả 3 modes (Normal/Translate/Summary)
- `services/tts-service.ts` quản lý generation và lưu metadata vào SQLite
- File audio MP3 lưu theo cấu trúc: `tts_audio/{bookId}/{chapter}/{mode}/sentence_N.mp3`
- `components/play-audio-control.tsx` phát audio từ database cache
- TrackPlayer service (`services/track-player-service.ts`) quản lý playback queue

### 4.6 Cài đặt và cache
- Màn hình `app/settings/index.tsx` hiển thị danh sách các cài đặt key-value động, cho phép người dùng xem và chỉnh sửa các thiết lập.
- Màn hình `app/setting-editor/index.tsx` cho phép thêm/sửa/xóa các cài đặt dạng key-value với cấu hình linh hoạt (input đơn dòng hoặc nhiều dòng, mô tả, giá trị mặc định).
- Hệ thống không hardcode từng input field cụ thể mà sử dụng cấu trúc dữ liệu động dựa trên `SettingConfig[]` định nghĩa trong `constants/SettingConfigs.ts`.
- Mỗi cài đặt bao gồm: key (MMKV key), label (nhãn hiển thị), inputType (single/multi line), placeholder, và description.
- **Cache Manager**: `utils/cache-manager.ts` quản lý cache statistics và clearing
  - Clear cache per book (xóa cả processed content và TTS files)
  - Clear cache per chapter
  - Get cache statistics (total TTS files, size, processed chapters)
- **Auto Migration**: `utils/migration-helper.ts` tự động migrate từ MMKV cache cũ sang SQLite
  - Chạy một lần khi app startup (tracked by `MIGRATION_V2_DONE` flag)
  - Xóa MMKV cache cũ và TTS files format cũ
  - Initialize SQLite database mới

## 5. Yêu cầu phi chức năng
- **Hiệu năng**: Đọc file cục bộ, load chương và summary trong vòng < 1s sau khi cache xong.
- **Độ tin cậy**: Phải phục hồi trạng thái đọc sau khi app khởi động lại (dựa trên `MMKVKeys.IS_READING`, `CURRENT_BOOK_ID`).
- **Khả năng mở rộng**: Module hóa rõ ràng giữa UI, dịch vụ và hooks để dễ bổ sung nguồn truyện hoặc dịch vụ TTS khác.
- **Bảo mật**: 
  - ✅ Không hardcode API key nhạy cảm; yêu cầu nhập qua Settings
  - ✅ Token Capcut được lưu trong MMKV (encrypted) thay vì hardcode trong code
  - Token cần làm mới định kỳ khi hết hạn (người dùng tự cập nhật qua Settings)
- **Khả dụng offline**: Nội dung truyện phải đọc được khi không có mạng; summary/TTS fallback sang nội dung gốc nếu API thất bại.
- **Validation**: Tất cả book.json phải được validate khi import để đảm bảo cấu trúc đúng và tránh lỗi runtime.

## 6. Luồng dữ liệu chính
1. **Import truyện**: Supabase API → tải ZIP → giải nén → `books/<bookId>` chứa `book.json`, `chapters/chapter-N.html`.
2. **Chọn truyện**: Người dùng chọn item → lưu `CURRENT_BOOK_ID` & `IS_READING` → mở `/reading`.
3. **Đọc chương**: Hook lấy chương → RenderHTML → ghi offset cuộn.
4. **Content Processing**: 
   - Mode switching (Normal/Translate/Summary) với 500ms debouncing
   - Normal: Hiển thị HTML gốc, không cache
   - Translate/Summary: Check SQLite cache → Nếu không có → Call Gemini API → Lưu database → Hiển thị
5. **Prefetch Background**: usePrefetch tự động xử lý 10 chương tiếp theo, max 2 concurrent, 2s delay giữa batches
6. **TTS On-Demand**: User click TTS button → Generate audio → Lưu files + metadata vào database → Auto-play

## 7. Mô-đun chính
### 7.1 Ứng dụng & điều hướng (`app/`)
- `_layout.tsx`: Khởi tạo TrackPlayer, TTS cache directory, Gesture Handler, auto migration on startup, ghi nhận trạng thái đọc để resume.
- `/index`, `/add-book`, `/reading`, `/settings`, `/setting-editor`, `/references` tương ứng với các màn hình chính.
- `/settings`: Màn hình danh sách cài đặt hiển thị tất cả key-value configs, cho phép điều hướng đến editor.
- `/setting-editor`: Màn hình thêm/sửa từng setting cụ thể với input type linh hoạt.

### 7.2 Components (`components/`)
- UI chung: `Screen`, `Divider`, `Button`, `Icon`, `GToast`, `GSpinner`.
- Reading utilities: `content-display`, `sheet-book-info`, `reading/*` controls (top navigation, TTS button, audio control).
- Data-driven cells: `home-book-item`, `download-book-item`.

### 7.3 Hooks (`hooks/`)
- `use-reading-chapter`, `use-reading-controller`, `use-reupdate-reading`: quản lý luồng đọc và offset với debouncing.
- `use-content-processor`: xử lý translate/summary với cache-first strategy.
- `use-prefetch`: background prefetching cho 10 chương tiếp theo.
- `use-tts-audio`: quản lý TTS audio playback từ database.
- `use-tts-audio`: pipeline TTS + TrackPlayer.
- `use-typed-local-search-params`: hỗ trợ router params an toàn kiểu.

### 7.4 Controllers (`controllers/`)
- `store.ts`: Zustand store với readingMode ('normal' | 'translate' | 'summary'), TTS state, prefetch state
- `mmkv.ts`: wrapper đọc/ghi JSON
- `tts-cache.ts`: khởi tạo TTS cache directory và logging

### 7.5 Services (`services/`)
- `database-service.ts`: SQLite CRUD cho processed_chapters, tts_audio_cache, prefetch_queue
- `gemini-service.ts`: translateChapter() và summarizeChapter() với custom prompts
- `tts-service.ts`: TTS generation, database storage, event emission
- `convert-tts.ts`: Capcut WebSocket TTS API integration
- `playback-service.ts`, `track-player-service.ts`: TrackPlayer management
- `download-file.ts`: tải ZIP và quản lý file tạm

### 7.6 Utils (`utils/`)
- `index.ts`: thao tác file hệ thống, load sách, định dạng kích thước, quản lý current book
- `book-validator.ts`: validate cấu trúc book.json, đảm bảo data integrity
- `cache-manager.ts`: cache statistics và clearing cho SQLite + filesystem
- `migration-helper.ts`: MMKV → SQLite migration, chạy một lần
- `string-helpers.ts`: tiền xử lý chuỗi, chia câu phục vụ TTS/Gemini

## 8. Lưu trữ & cấu trúc dữ liệu
- **Cấu trúc Book Package**
  - `book.json`: Metadata của truyện với các trường:
    - Bắt buộc: `id`, `name`, `author`, `count` (number), `references[]`
    - Tùy chọn: `description`, `coverImage`, `category`, `tags`, `genre`, `status`, `rating`, `language`, `version`, timestamps, `totalWords`, `sourceUrl`, etc.
    - Được validate bởi `utils/book-validator.ts` khi import
  - `chapters/chapter-<index>.html`: nội dung HTML thuần.
  - `cover.jpg` (optional): Ảnh bìa truyện
  - `thumbnail.jpg` (optional): Thumbnail nhỏ
- **MMKV Keys** (`constants/AppConst.ts`): lưu trạng thái đọc, Gemini key/model/prompts, offset, Capcut token/voice, MIGRATION_V2_DONE flag
- **Setting Configs** (`constants/SettingConfigs.ts`): danh sách các cấu hình setting động, mỗi setting có:
  - `key`: unique identifier lưu trong MMKV
  - `label`: nhãn hiển thị UI
  - `inputType`: 'single' | 'multiline' xác định loại input
  - `placeholder`: gợi ý cho người dùng
  - `description`: mô tả chi tiết về setting
  - `defaultValue`: giá trị mặc định (optional)
- **SQLite Database** (`reading_app.db`):
  - `processed_chapters`: Cache nội dung đã translate/summary
  - `tts_audio_cache`: Metadata của TTS audio files
  - `prefetch_queue`: Hàng đợi prefetch với status tracking
- **TTS Files**: `DocumentDirectory/tts_audio/{bookId}/{chapter}/{mode}/sentence_N.mp3`

## 9. Tích hợp & cấu hình
| Dịch vụ | File cấu hình | Lưu ý |
| --- | --- | --- |
| Supabase Edge Function | `app/add-book/index.tsx`, `AppConfigs.API.SUPABASE_ANON_KEY` | Cần `EXPO_PUBLIC_SUPABASE_ANON_KEY` hoặc cập nhật runtime |
| Google Gemini | `services/gemini-service.ts`, `app/settings/index.tsx` | Nhập API key/prompt qua UI hoặc env; kiểm soát chi phí |
| Capcut TTS WebSocket | `services/convert-tts.ts` | Token và device params hardcode, cần cơ chế refresh định kỳ |
| TrackPlayer | `_layout.tsx`, `services/track-player-service.ts` | iOS cần chạy `npx expo run:ios` để nhúng service |

## 10. Yêu cầu kiểm thử
- **Unit**: Hooks (đặc biệt `use-content-processor`, `use-prefetch`, `use-tts-audio`) cần stub dịch vụ bên ngoài
- **Integration**: Kiểm tra import sách, mode switching với debouncing, prefetch background processing, TTS generation
- **End-to-End**: Thao tác người dùng chính (tải truyện → đọc → cycle modes → generate TTS → nghe audio)
- **Regression**: Track resume khi đóng/mở app, cache manager hoạt động đúng, migration chạy một lần
- **Performance**: 
  - Cache hit rate >90% cho chapters đã đọc
  - Prefetch không làm lag UI
  - Debouncing ngăn spam API calls

## 11. Các ràng buộc & rủi ro
1. **Token Capcut**: 
   - ✅ Đã chuyển sang lưu trong Settings (MMKV encrypted)
   - ⚠️ Vẫn cần người dùng tự làm mới token khi hết hạn
   - Cân nhắc: Xây dựng server trung gian để quản lý token tập trung
2. **Gemini API**: 
   - ✅ Đã có debouncing 500ms và prefetch rate limiting (max 2 concurrent, 2s delay)
   - ✅ SQLite cache giảm 95% API calls
   - Giới hạn tốc độ của Gemini vẫn cần monitor
3. **Validation**: 
   - ✅ Đã có `book-validator.ts` để validate cấu trúc
   - Cần thêm UI hiển thị lỗi chi tiết khi import book lỗi
4. **Database Migration**:
   - ✅ Auto migration từ MMKV sang SQLite
   - ⚠️ Không có rollback mechanism nếu migration failed
   - Cân nhắc: Backup MMKV data trước khi xóa
5. **TrackPlayer**: Cần quyền audio background; chưa có hướng dẫn cấp quyền Android/iOS trong tài liệu
6. **Book metadata**: 
   - Interface đã mở rộng nhưng chưa có UI để nhập/chỉnh sửa metadata mở rộng
   - Chưa có UI upload/hiển thị cover image
   - Chưa tính toán `totalWords` và `estimatedReadTime` tự động

## 12. Hướng dẫn thiết lập & build
1. Cài phụ thuộc: `pnpm install` (hoặc `npm install`).
2. Thiết lập biến môi trường trong `.env` hoặc Expo config:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Chạy dev: `pnpm start` (Expo).
4. Build native: `pnpm ios` / `pnpm android` (yêu cầu EAS hoặc prebuild).
5. Reset project template: `pnpm reset-project`.

## 13. Hạng mục mở / đề xuất nâng cấp
1. **Bảo mật khóa**: chuyển Capcut token và Gemini key sang backend hoặc secure storage
2. **Offline mode hoàn chỉnh**: Download và cache toàn bộ truyện với tất cả modes
3. **Smart prefetch**: Machine learning để predict chapters user sẽ đọc
4. **Batch processing UI**: Restore auto-generate screen với progress tracking (đã xóa do prefetch tự động)
5. **Testing**: thêm suite Jest/Playwright cho luồng tải/đọc/mode switching/prefetch
6. **Sync đa thiết bị**: backend để đồng bộ trạng thái đọc và cache
7. **Import/Export Settings**: backup và restore toàn bộ settings
8. **Validation cho Settings**: kiểm tra format API key, token trước khi lưu
9. **Setting Groups**: nhóm settings theo category (API Keys, Prompts, TTS, etc.)
10. **Analytics**: Track cache hit rate, API usage, mode preferences, reading time
11. **Content diff detection**: Re-process khi source content update
12. **TTS voice selection**: Multiple voices cho translate/summary modes

## 14. Phụ lục
### 14.1 Scripts & công cụ
- `pnpm lint`, `pnpm test`, `pnpm tsc` cho chất lượng mã.
- `scripts/reset-project.js` dùng để dọn code mẫu Expo.

### 14.2 Thư viện chính
Xem `package.json` để biết phiên bản cụ thể (Expo 54, React Native 0.81, Zustand 5, TrackPlayer 4.1.1, etc.).

### 14.3 Các câu hỏi cần làm rõ
- Định dạng chính xác của file ZIP export? (naming, encoding).
- Chính sách lưu API key Gemini theo người dùng hay toàn cục?
- TrackPlayer có cần chạy khi app background? Nếu có cần cập nhật quyền & thông báo.
- Chiến lược refresh token Capcut và Supabase.

Tài liệu sẽ được cập nhật khi kiến trúc hoặc phạm vi dự án thay đổi.
