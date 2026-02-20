// 常用網站可接受的特殊符號 (避免使用 ~ 等較少支援的符號)
const SPECIAL_CHARS = '!@#$%^&*()_+-=';

// 檢測 WebAssembly 支持
function supportsWebAssembly() {
  try {
    if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(new Uint8Array([0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]));
      if (module instanceof WebAssembly.Module) {
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

// 自定义错误类：设备不兼容
export class DeviceIncompatibleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DeviceIncompatibleError';
  }
}

/**
 * 規範化輸入字串,提高密碼生成的一致性
 * 
 * 處理步驟:
 * 1. 移除首尾空白
 * 2. 轉換為小寫
 * 3. Unicode 正規化 (NFKC) - 處理不同 Unicode 表示
 * 4. 合併多個連續空白為一個
 * 5. 移除零寬字符
 * 
 * @param {string} input - 原始輸入
 * @returns {string} 規範化後的字串
 */
function normalizeInput(input) {
  if (!input) return '';

  return input
    .trim()                                      // 移除首尾空白
    .toLowerCase()                               // 轉小寫
    .normalize('NFKC')                           // Unicode 正規化(相容性分解+組合)
    .replace(/\s+/g, ' ')                        // 多個空白合併為一個
    .replace(/[\u200B-\u200D\uFEFF]/g, '');     // 移除零寬字符
}

// 預加載 hash-wasm 模組(性能優化)
let argon2idModule = null;
let preloadPromise = null;

/**
 * 預加載 hash-wasm 模組
 * 在應用啟動時調用,減少首次生成密碼的延遲
 */
export async function preloadHashWasm() {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    try {
      const { argon2id } = await import('hash-wasm');
      argon2idModule = argon2id;
      console.log('✅ hash-wasm 模組預加載成功');
      return argon2id;
    } catch (error) {
      console.error('❌ hash-wasm 模組預加載失敗:', error);
      argon2idModule = null;
      preloadPromise = null;
      throw error;
    }
  })();

  return preloadPromise;
}

// 使用 Argon2id 生成密碼
async function generatePasswordArgon2id(siteName, account, masterPassword) {
  try {
    // 使用預加載的模組或動態導入
    let argon2id = argon2idModule;
    if (!argon2id) {
      const module = await import('hash-wasm');
      argon2id = module.argon2id;
    }

    // 1. 正規化輸入:使用增強的規範化函數,提高一致性
    const normalizedSiteName = normalizeInput(siteName);
    const normalizedAccount = normalizeInput(account);

    // 2. 使用正規化後的網站名稱和帳號作為 salt
    const saltString = `${normalizedSiteName}:${normalizedAccount}`;
    let saltBytes = new TextEncoder().encode(saltString);

    // 3. 確保 salt 至少 8 字節（Argon2id 要求）
    // 如果不足 8 字節，使用 SHA-256 哈希來擴展，確保確定性
    if (saltBytes.length < 8) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', saltBytes);
      saltBytes = new Uint8Array(hashBuffer);
    }

    // 4. 使用 Argon2id 衍生密鑰
    // 參數：Memory 128MB, Iterations 3, Parallelism 1
    const hashHex = await argon2id({
      password: masterPassword,
      salt: saltBytes,
      parallelism: 1,        // 並行度：1（適合瀏覽器單線程環境）
      iterations: 3,          // 迭代次數：3（平衡安全性和速度）
      memorySize: 131072,     // 記憶體成本：128 MB (131072 KB)
      hashLength: 32,         // 哈希長度：32 bytes (256 bits)
      outputType: 'hex'       // 輸出格式：十六進制
    });

    // 将十六进制字符串转换为字节数组
    const hashArray = [];
    for (let i = 0; i < hashHex.length; i += 2) {
      hashArray.push(parseInt(hashHex.substring(i, i + 2), 16));
    }

    let result = '';

    // 4. 前 4 個字符確保基本要求
    result += String.fromCharCode(65 + parseInt(hashHex.substring(0, 2), 16) % 26);  // 大寫字母
    result += String.fromCharCode(97 + parseInt(hashHex.substring(2, 4), 16) % 26);  // 小寫字母
    result += parseInt(hashHex.substring(4, 6), 16) % 10;                            // 數字
    result += SPECIAL_CHARS[parseInt(hashHex.substring(6, 8), 16) % SPECIAL_CHARS.length]; // 特殊字符

    // 5. 生成后续 8 个字符
    for (let i = 8; i < 24; i += 2) {
      const value = parseInt(hashHex.substring(i, i + 2), 16);
      if (value % 4 === 0) {
        result += String.fromCharCode(65 + value % 26);  // 大写字母
      } else if (value % 4 === 1) {
        result += String.fromCharCode(97 + value % 26);  // 小写字母
      } else if (value % 4 === 2) {
        result += value % 10;                            // 数字
      } else {
        result += SPECIAL_CHARS[value % SPECIAL_CHARS.length]; // 特殊字符
      }
    }

    // 6. 计算动态长度：基础 12 位 + hashArray[15] % 7 (0-6位)
    const extraLength = hashArray[15] % 7;

    // 7. 生成额外字符
    if (extraLength > 0) {
      for (let i = 24; i < 24 + (extraLength * 2); i += 2) {
        const value = parseInt(hashHex.substring(i, i + 2), 16);
        if (value % 4 === 0) {
          result += String.fromCharCode(65 + value % 26);
        } else if (value % 4 === 1) {
          result += String.fromCharCode(97 + value % 26);
        } else if (value % 4 === 2) {
          result += value % 10;
        } else {
          result += SPECIAL_CHARS[value % SPECIAL_CHARS.length];
        }
      }
    }

    return result;
  } catch (error) {
    console.error('💥 generatePasswordArgon2id 內部錯誤:', error);
    console.error('錯誤堆疊:', error.stack);
    throw error;
  }
}

// 主函數：使用 Argon2id 生成密碼
// 
// 重要說明：
// - 為了保證一致性，所有設備都必須使用相同的算法（Argon2id）
// - 不支持 WebAssembly 的舊瀏覽器將無法使用此功能
// - 這確保了所有設備生成的密碼完全相同
export async function generatePassword(siteName, account, masterPassword) {
  // 檢測 WebAssembly 支持
  if (!supportsWebAssembly()) {
    throw new DeviceIncompatibleError('DEVICE_INCOMPATIBLE');
  }

  // 使用 Argon2id 生成密碼
  return await generatePasswordArgon2id(siteName, account, masterPassword);
}
