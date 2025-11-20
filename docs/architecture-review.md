# Đánh giá Kiến trúc App-Read-Books

## TL;DR - Tóm tắt nhanh

### ✅ Những gì đã tốt:
1. **File-based storage**: Hoàn toàn phù hợp cho ứng dụng đọc truyện offline
2. **TTS caching**: Thiết kế cache thông minh, tiết kiệm băng thông
3. **Modular architecture**: Code tách bạch rõ ràng giữa UI, service, utils

### ⚠️ Vấn đề đã được giải quyết:
1. ✅ **Security**: Di chuyển Capcut token từ hardcode → Settings (MMKV encrypted)
2. ✅ **Validation**: Thêm `book-validator.ts` để validate book.json khi import
3. ✅ **Book metadata**: Mở rộng interface Book với đầy đủ metadata

### 🔴 Vấn đề cần làm tiếp:
1. **TTS Queue System**: Chưa có cơ chế queue/rate limiting cho TTS requests
2. **UI cho metadata**: Chưa có UI để nhập/chỉnh sửa cover, category, tags, rating
3. **Cache cleanup**: Chưa có tự động cleanup cache cũ
4. **Error handling**: Cần better error messages cho user

---

## Chi tiết đánh giá

### 1. Lưu trữ truyện dạng file - ✅ TỐT

**Tại sao file storage phù hợp:**

```
DocumentDirectory/
├── books/{bookId}/
│   ├── book.json          ← Metadata (JSON)
│   ├── chapters/*.html    ← Content (HTML)
│   └── cover.jpg          ← Assets (optional)
```

**Ưu điểm:**
- ⚡ **Performance**: Đọc HTML trực tiếp từ file = rất nhanh
- 💾 **Storage efficient**: Text files rất nhẹ (1 chapter ~50KB)
- 📴 **Offline-first**: 100% hoạt động không cần internet
- 🔧 **Easy maintenance**: Dễ backup, restore, debug
- 🎯 **Simple**: Không cần ORM, migration, complex queries

**So sánh với Database:**

| Tiêu chí | File Storage | SQLite/Realm |
|----------|--------------|--------------|
| Read speed | ⚡⚡⚡ Rất nhanh | ⚡⚡ Nhanh |
| Storage size | 💾 Nhỏ | 💾💾 Lớn hơn |
| Query phức tạp | ❌ Không hỗ trợ | ✅ Tốt |
| Offline | ✅ Perfect | ✅ OK |
| Maintenance | ✅ Dễ | ⚠️ Phức tạp |

**Kết luận**: File storage là lựa chọn ĐÚNG cho app này!

**Khi nào cần Database?**
- Có > 500 books và cần search/filter phức tạp
- Cần full-text search trong content
- Cần sync với server
- → Hiện tại KHÔNG CẦN

---

### 2. Text-to-Speech - ✅ Cải tiến thành công

**Trước đây - ❌ Security Risk:**
```typescript
// NGUY HIỂM - Token hardcoded trong code!
token: 'WTV6R2t6V3ZwNUIwQkFETutGxuveRZ9iTmOBC/a3...'
```

**Bây giờ - ✅ Đã sửa:**
```typescript
// Lấy từ Settings (MMKV encrypted)
const token = MMKVStorage.get(MMKVKeys.CAPCUT_TOKEN)
if (!token) {
  throw new Error('Vui lòng cấu hình Capcut token trong Settings')
}
```

**TTS Caching Strategy - ✅ TỐT:**
```typescript
// 1. Check cache trước
const cacheKey = `${bookId}_${chapterIndex}_${sentenceIndex}`
const cachedPath = getCachedAudioPath(cacheKey)
if (cachedPath) return cachedPath

// 2. Generate mới nếu chưa có
const audioData = await generateAudioFromWebSocket(sentence, voice)

// 3. Lưu vào cache
saveToCacheDirectory(audioData, cacheKey)
```

**Vấn đề còn lại:**

1. **Không có Rate Limiting:**
```typescript
// Hiện tại: Gửi tất cả requests cùng lúc → có thể bị chặn
for (const sentence of sentences) {
  await generateAudio(sentence)  // Chạy tuần tự nhưng không có delay
}

// Nên có:
const queue = new TTSQueue({ 
  maxConcurrent: 3,      // Tối đa 3 requests đồng thời
  delayBetweenRequests: 500  // 500ms giữa mỗi request
})
```

2. **Không có Retry Logic:**
```typescript
// Hiện tại: Fail 1 lần là bỏ
const audioData = await generateAudioFromWebSocket(sentence, voice)
if (!audioData) return null

// Nên có:
let audioData = null
for (let retry = 0; retry < 3; retry++) {
  audioData = await generateAudioFromWebSocket(sentence, voice)
  if (audioData) break
  await sleep(Math.pow(2, retry) * 1000) // Exponential backoff
}
```

---

### 3. Book Metadata - ✅ Đã mở rộng

**Trước:**
```typescript
interface Book {
  id: string
  name: string
  author: string
  count: string  // ← string? Nên là number!
  references: string[]
}
```

**Bây giờ:**
```typescript
interface Book {
  // Core
  id: string
  name: string
  author: string
  count: number  // ✅ Fixed!
  references: string[]
  
  // Metadata mở rộng
  description?: string
  coverImage?: string
  category?: string
  tags?: string[]
  status?: 'ongoing' | 'completed' | 'hiatus'
  rating?: number  // 1-5
  
  // Technical
  version?: string
  createdAt?: string
  updatedAt?: string
  totalWords?: number
  estimatedReadTime?: number  // minutes
  
  // Source
  sourceUrl?: string
  translator?: string
}
```

**Validation - ✅ Đã thêm:**
```typescript
// utils/book-validator.ts
export const validateBook = (data: any): Book => {
  // Check required fields
  if (!data.id) throw new Error('Book ID is required')
  if (!data.name) throw new Error('Book name is required')
  
  // Convert count to number
  const count = typeof data.count === 'string' 
    ? parseInt(data.count) 
    : data.count
  
  // Validate optional fields
  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new Error('Rating must be 1-5')
  }
  
  return { ...data, count }
}
```

**Vấn đề còn lại:**

1. **Chưa có UI để chỉnh sửa metadata:**
```typescript
// Cần thêm màn hình Book Editor:
// - Upload cover image
// - Chọn category/genre từ dropdown
// - Nhập tags
// - Rating (star picker)
// - Description (multiline input)
```

2. **Chưa tính toán tự động:**
```typescript
// Nên tự động tính khi import book:
const totalWords = chapters.reduce((sum, ch) => 
  sum + countWordsInHtml(ch.content), 0
)
const estimatedReadTime = Math.ceil(totalWords / 225) // minutes
```

---

### 4. Cache Management - ⚠️ Cần cải tiến

**Hiện tại:**
```typescript
// TTS cache: DocumentDirectory/tts_audio/
// Summary cache: MMKV (separate instance)
// Book files: DocumentDirectory/books/
```

**Vấn đề:**

1. **Không có cleanup tự động:**
```typescript
// Cache có thể lớn vô hạn!
// Ví dụ: 100 books × 100 chapters × 50 sentences × 50KB = 25GB 😱
```

2. **Orphaned cache:**
```typescript
// Khi xóa book, TTS cache của book đó vẫn còn
deleteBook(bookId)
// ← Cần: deleteTTSCacheForBook(bookId)
```

**Giải pháp:**

```typescript
// 1. Auto cleanup cache cũ
export const cleanupOldCache = async () => {
  const maxCacheSizeMB = 500
  const stats = await getTTSCacheStats()
  
  if (stats.totalSize > maxCacheSizeMB * 1024 * 1024) {
    // Xóa cache cũ nhất cho đến khi < 400MB
    await deleteOldestCacheFiles(stats.totalSize - 400 * 1024 * 1024)
  }
}

// 2. Cleanup orphaned cache
export const cleanupOrphanedCache = async () => {
  const allBooks = await readFolderBooks()
  const bookIds = new Set(allBooks.map(b => b.id))
  
  // Lấy tất cả TTS cache files
  const cacheFiles = CACHE_DIRECTORY.list()
  
  for (const file of cacheFiles) {
    const bookId = file.name.split('_')[0]
    if (!bookIds.has(bookId)) {
      file.delete() // Xóa cache của book đã xóa
    }
  }
}

// 3. Chạy tự động khi app start
useEffect(() => {
  cleanupOldCache()
  cleanupOrphanedCache()
}, [])
```

---

## Roadmap - Ưu tiên cải tiến

### 🔴 CRITICAL (Làm ngay - 1-2 ngày)

1. **✅ DONE - Security: Di chuyển token ra Settings**
   - Đã thực hiện xong
   - Người dùng nhập token qua UI thay vì hardcode

2. **✅ DONE - Validation: book-validator.ts**
   - Đã tạo validator
   - Validate khi import book

3. **TODO - Error Handling cho TTS:**
   ```typescript
   // Khi token invalid/expired
   if (error.message.includes('unauthorized')) {
     GToast.error({ 
       message: 'Token Capcut hết hạn. Vui lòng cập nhật trong Settings.',
       duration: 5000
     })
     router.push('/settings')
   }
   ```

### 🟡 HIGH (Tuần này - 3-5 ngày)

4. **TTS Queue System:**
   ```typescript
   class TTSQueue {
     private queue: Task[] = []
     private maxConcurrent = 3
     private delayBetweenRequests = 500
     
     async add(task: Task) {
       this.queue.push(task)
       this.processQueue()
     }
     
     private async processQueue() {
       // Rate limiting logic
     }
   }
   ```

5. **Cache Cleanup Utilities:**
   ```typescript
   // Tự động cleanup trong background
   // UI hiển thị cache stats
   // Nút xóa cache thủ công
   ```

6. **UI hiển thị metadata cơ bản:**
   ```typescript
   // Book Detail Screen:
   // - Hiển thị cover, category, status, rating
   // - Chưa cần edit UI, chỉ hiển thị
   ```

### 🟢 MEDIUM (2 tuần tới)

7. **Book Editor Screen:**
   ```typescript
   // Full UI để chỉnh sửa metadata
   // Upload cover image
   // Select category/genre
   // Input tags, description
   ```

8. **Auto-calculate metadata:**
   ```typescript
   // Tự động tính:
   // - totalWords
   // - estimatedReadTime
   // - Per-chapter wordCount
   ```

9. **Advanced Cache Management:**
   ```typescript
   // Predictive caching
   // Background pre-generation
   // Smart cleanup based on usage
   ```

### 🔵 LOW (Sau này)

10. **SQLite cho advanced search** (chỉ khi > 100 books)
11. **Cloud sync** (reading progress, settings)
12. **Export/Import** (backup toàn bộ data)

---

## Kết luận

### Kiến trúc hiện tại: 8/10 ⭐

**Điểm mạnh:**
- ✅ File storage design: Perfect cho use case
- ✅ Offline-first: Hoạt động tốt không cần internet
- ✅ Modular: Code tách bạch, dễ maintain
- ✅ Caching: TTS cache thông minh

**Đã cải thiện:**
- ✅ Security: Token không còn hardcode
- ✅ Validation: Book.json được validate
- ✅ Metadata: Interface đã mở rộng đầy đủ

**Cần cải thiện:**
- ⚠️ TTS: Cần queue system & rate limiting
- ⚠️ Cache: Cần auto cleanup
- ⚠️ UI: Cần editor cho metadata
- ⚠️ Error handling: Cần better UX

### Khuyến nghị:

1. **Tiếp tục dùng file storage** - Không cần chuyển sang database
2. **Ưu tiên TTS improvements** - Queue & error handling
3. **Cleanup cache định kỳ** - Tránh tràn dung lượng
4. **UI cho metadata** - Từ từ thêm, không vội

**Overall**: Kiến trúc rất tốt, chỉ cần polish một số chi tiết! 🎉
