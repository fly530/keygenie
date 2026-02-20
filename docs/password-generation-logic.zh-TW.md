# KeyGenie 密碼生成邏輯文件

## 概述

KeyGenie 採用確定性密碼生成演算法，使用 Argon2id 金鑰派生函數（透過 WebAssembly 實作），確保相同輸入（網站名稱、帳號、主密碼）始終產生相同密碼。為確保密碼生成一致性，系統要求瀏覽器必須支援 WebAssembly，不支援 WebAssembly 的裝置將無法使用此功能。密碼在本地裝置上生成，不會儲存在任何伺服器上。

## 核心原理

### 1. 確定性生成
- **輸入參數**：網站名稱（siteName）、帳號（account，可選）、主密碼（masterPassword）
- **輸出結果**：12–18 位密碼（含大小寫字母、數字、特殊字元）
- **特性**：相同輸入參數始終產生相同密碼

### 2. 零知識架構
- 主密碼不會離開本地裝置
- 密碼生成過程完全在客戶端完成
- 伺服器不儲存任何密碼相關資訊

## 演算法詳細說明

### 步驟 1：輸入正規化

```javascript
const normalizedSiteName = (siteName || '').trim().toLowerCase();
const normalizedAccount = (account || '').trim().toLowerCase();
```

**重要說明**：
- 為提高一致性與使用體驗，所有 `siteName` 與 `account` 在運算前都會：
  - 使用 `trim()` 修剪首尾空白
  - 使用 `toLowerCase()` 轉為小寫
- **目的**：避免使用者輸入 `google.com` 與 `Google` 或 ` google.com ` 產生不同密碼
- **範例**：
  - `"Google"` → `"google"`
  - `" google.com "` → `"google.com"`
  - `"User@Example.com"` → `"user@example.com"`

### 步驟 2：建構 Salt

```javascript
const salt = `${normalizedSiteName}:${normalizedAccount}`;
```

- 使用正規化後的網站名稱與帳號組成 salt
- 格式：`網站名稱:帳號`
- 若帳號為空，格式為：`網站名稱:`

### 步驟 3：Argon2id 金鑰派生

KeyGenie 使用 Argon2id 演算法生成密碼，要求瀏覽器必須支援 WebAssembly：

```javascript
const hashHex = await argon2id({
  password: masterPassword,
  salt: new TextEncoder().encode(salt),
  parallelism: 1,        // 並行度：1（適合瀏覽器單執行緒環境）
  iterations: 3,        // 迭代次數：3（平衡安全性與速度）
  memorySize: 131072,   // 記憶體成本：128 MB (131072 KB)
  hashLength: 32,       // 雜湊長度：32 bytes (256 bits)
  outputType: 'hex'     // 輸出格式：十六進位
});
```

**Argon2id 參數說明**：
- **演算法**：Argon2id（2015 年密碼雜湊競賽獲勝者）
- **並行度 (Parallelism)**：1（適合瀏覽器單執行緒環境）
- **迭代次數 (Iterations)**：3 次（平衡安全性與速度）
- **記憶體成本 (Memory)**：128 MB（131,072 KB）
  - 對一般使用者影響小（現代裝置通常有足夠記憶體）
  - 對攻擊者成本高，可有效抵抗 GPU 與 ASIC 攻擊
- **輸出長度**：256 bits (32 bytes)
- **實作方式**：使用 `hash-wasm` 的 WebAssembly 實作，提供接近原生的效能

**Argon2id 安全性優勢**：
- **記憶體硬函數**：128 MB 記憶體需求大幅提高暴力破解成本
- **抗 GPU**：相較 PBKDF2，對 GPU 攻擊抵抗力更強
- **抗 ASIC**：記憶體硬特性使專用硬體攻擊成本極高
- **經實戰驗證**：2015 年密碼雜湊競賽獲勝者，被廣泛採用

**WebAssembly 要求**：
- 系統會偵測瀏覽器是否支援 WebAssembly
- 若不支援，將顯示裝置不相容的錯誤提示
- 確保所有裝置使用相同演算法，保證密碼生成一致性
- 支援瀏覽器：Chrome 57+、Firefox 52+、Safari 11+、Edge 16+

### 步驟 4：轉為十六進位字串

```javascript
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
```

- 將 256 bits 的二進位資料轉為 64 個十六進位字元
- 每個位元組轉為兩位十六進位數（00–FF）

### 步驟 5：生成前 4 個字元（滿足基本要求）

密碼前 4 個字元確保滿足基本密碼要求：

```javascript
// 第 1 個字元：大寫字母 (A-Z)
result += String.fromCharCode(65 + parseInt(hashHex.substring(0, 2), 16) % 26);

// 第 2 個字元：小寫字母 (a-z)
result += String.fromCharCode(97 + parseInt(hashHex.substring(2, 4), 16) % 26);

// 第 3 個字元：數字 (0-9)
result += parseInt(hashHex.substring(4, 6), 16) % 10;

// 第 4 個字元：特殊字元
result += SPECIAL_CHARS[parseInt(hashHex.substring(6, 8), 16) % SPECIAL_CHARS.length];
```

**特殊字元集**：
```javascript
const SPECIAL_CHARS = '!@#$%^&*()_+-=';
```

**說明**：
- 使用雜湊值前 8 個十六進位字元（4 個位元組）
- 透過模運算確保字元類型分佈均勻
- 保證密碼至少含一個大寫、一個小寫、一個數字與一個特殊字元

### 步驟 6：生成後續 8 個字元

```javascript
for (let i = 8; i < 24; i += 2) {
  const value = parseInt(hashHex.substring(i, i + 2), 16);
  if (value % 4 === 0) {
    result += String.fromCharCode(65 + value % 26);  // 大寫字母
  } else if (value % 4 === 1) {
    result += String.fromCharCode(97 + value % 26);  // 小寫字母
  } else if (value % 4 === 2) {
    result += value % 10;                            // 數字
  } else {
    result += SPECIAL_CHARS[value % SPECIAL_CHARS.length]; // 特殊字元
  }
}
```

**說明**：
- 使用雜湊值第 9–24 個十六進位字元（8 個位元組）
- 以 `value % 4` 決定字元類型，確保四種類型均勻分佈
- 每種類型機率約 25%

### 步驟 7：計算動態長度

```javascript
const extraLength = hashArray[15] % 7;
```

**說明**：
- 使用雜湊陣列第 16 個位元組（索引 15）
- 透過模 7 得到 0–6 的額外長度
- 基礎長度：12 位
- 最終長度：12–18 位

### 步驟 8：生成額外字元（若長度 > 12）

```javascript
if (extraLength > 0) {
  for (let i = 24; i < 24 + (extraLength * 2); i += 2) {
    const value = parseInt(hashHex.substring(i, i + 2), 16);
    // 與步驟 6 相同邏輯生成字元
  }
}
```

**說明**：
- 若 `extraLength > 0`，繼續用雜湊值生成額外字元
- 從雜湊值第 25 個字元開始
- 生成邏輯與步驟 6 相同

## 密碼特性

### 長度
- **基礎長度**：12 位
- **最大長度**：18 位
- **動態長度**：依雜湊值自動決定（12–18 位）

### 字元組成
- **大寫字母**：A–Z（26 個）
- **小寫字母**：a–z（26 個）
- **數字**：0–9（10 個）
- **特殊字元**：`!@#$%^&*()_+-=`（14 個）

### 安全性保證
1. **前 4 位保證**：至少每種字元類型各一個
2. **均勻分佈**：後續字元透過模運算使類型分佈均勻
3. **唯一性**：不同網站/帳號組合產生不同密碼

## 範例

### 輸入範例
- **網站名稱**：`example.com`（或 `Example.com`、` EXAMPLE.COM ` 都會被正規化為 `example.com`）
- **帳號**：`user@example.com`（或 `User@Example.com` 會被正規化為 `user@example.com`）
- **主密碼**：`MyMasterPassword123!`

### 生成過程
1. **輸入正規化**：
   - `siteName`: `example.com` → `example.com`
   - `account`: `user@example.com` → `user@example.com`
2. **建構 Salt**：`example.com:user@example.com`
3. **Argon2id 派生** 256 bits 雜湊值
4. **轉為** 64 位十六進位字串
5. **依演算法生成** 12–18 位密碼

### 輸出特性
- 相同輸入 → 相同輸出（確定性）
- 不同網站 → 不同密碼（唯一性）
- 含所有字元類型（安全性）

## 安全性分析

### 優點
1. **零知識架構**：主密碼不離開本地裝置
2. **確定性生成**：無需儲存，隨時可重現
3. **高熵值**：256 bits 雜湊提供足夠隨機性
4. **抗暴力破解**：128 MB 記憶體成本 + 3 次迭代，大幅提高破解難度
5. **Salt 機制**：每個網站使用不同 salt，防止彩虹表攻擊
6. **記憶體硬特性（Argon2id）**：128 MB 對攻擊者成本高
7. **抗 GPU/ASIC（Argon2id）**：相較傳統演算法，對專用硬體攻擊抵抗力更強

### 注意事項
1. **主密碼安全**：主密碼一旦遺失無法恢復
2. **輸入正規化**：
   - 網站名稱與帳號會自動轉為小寫並修剪空白
   - `google.com`、`Google`、` GOOGLE ` 都會產生相同密碼
   - 但 `google.com` 與 `google` 仍會產生不同密碼（字串本身不同）
3. **輸入一致性**：
   - 正規化後的輸入必須完全一致才會產生相同密碼
   - 例如：`google.com` 與 `google` 會產生不同密碼
4. **本地生成**：密碼在客戶端生成，不依賴伺服器
5. **WebAssembly 要求**：系統要求瀏覽器必須支援 WebAssembly，不支援的裝置將無法使用此功能，以確保所有裝置使用相同演算法與密碼生成一致性

## 技術規格

### 演算法：Argon2id
- **演算法**：Argon2id（透過 hash-wasm WebAssembly 實作）
- **並行度**：1
- **迭代次數**：3
- **記憶體成本**：128 MB (131,072 KB)
- **輸出雜湊長度**：256 bits (32 bytes)
- **實作庫**：hash-wasm
- **效能**：200–800 ms（依裝置效能）

### 通用規格
- **密碼長度**：12–18 位
- **字元集大小**：76 個字元（26+26+10+14）
- **瀏覽器相容性**：
  - **要求**：必須支援 WebAssembly
  - **支援瀏覽器**：Chrome 57+、Firefox 52+、Safari 11+、Edge 16+
  - **不支援裝置**：顯示裝置不相容錯誤，無法使用密碼生成功能

## 實作位置

- **檔案路徑**：`frontend/src/utils/passwordGenerator.js`
- **匯出函式**：`generatePassword(siteName, account, masterPassword)`
- **回傳型別**：`Promise<string>`

## 效能考量

### Argon2id 效能
- **桌上型**：200–500 ms（依 CPU）
- **中高階行動裝置**：300–800 ms
- **低階行動裝置**：800 ms–2 s
- **記憶體峰值**：約 130 MB（短暫）

### 使用者體驗優化
- 生成密碼時顯示載入狀態
- 自動偵測裝置效能並選擇最佳演算法
- 無縫回退機制確保相容性

## 演算法遷移說明

### 重要提示
⚠️ **演算法變更會使生成的密碼完全不同**

- 從 PBKDF2 遷移至 Argon2id 後，相同輸入會產生不同密碼
- 使用者需重新生成所有密碼

### 相容性策略
- **一致性優先**：為確保所有裝置產生相同密碼，系統要求皆使用 Argon2id
- **WebAssembly 要求**：不支援 WebAssembly 的舊瀏覽器無法使用密碼生成功能
- **錯誤提示**：不支援的裝置會顯示明確提示，引導使用支援 WebAssembly 的現代瀏覽器

## 版本資訊

- **文件版本**：2.1
- **最後更新**：2025-01-29
- **主要變更**：
  - v2.1：移除 PBKDF2 回退，要求所有裝置使用 Argon2id 以確保一致性
  - v2.0：遷移至 Argon2id（優先），保留 PBKDF2 回退
  - v1.0：初始版本，使用 PBKDF2
