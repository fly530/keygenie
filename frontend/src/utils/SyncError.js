/**
 * 同步錯誤類別
 * 用於統一處理同步過程中的各種錯誤
 */
export class SyncError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'SyncError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * 錯誤代碼常數
 */
export const ERROR_CODES = {
    // 網絡相關錯誤
    NETWORK_ERROR: 'NETWORK_ERROR',
    NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',

    // 認證相關錯誤
    AUTH_ERROR: 'AUTH_ERROR',
    NOT_LOGGED_IN: 'NOT_LOGGED_IN',

    // 同步相關錯誤
    SYNC_CONFLICT: 'SYNC_CONFLICT',
    SYNC_FAILED: 'SYNC_FAILED',

    // 數據相關錯誤
    DATA_INVALID: 'DATA_INVALID',
    DATA_NOT_FOUND: 'DATA_NOT_FOUND',

    // 未知錯誤
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * 根據錯誤類型創建 SyncError
 * @param {Error} error - 原始錯誤
 * @returns {SyncError} 同步錯誤對象
 */
export function createSyncError(error) {
    // 網絡錯誤
    if (error.name === 'TypeError' || error.name === 'NetworkError') {
        return new SyncError(
            '網絡連接失敗',
            ERROR_CODES.NETWORK_ERROR,
            { originalError: error.message }
        );
    }

    // 超時錯誤
    if (error.name === 'AbortError') {
        return new SyncError(
            '請求超時',
            ERROR_CODES.NETWORK_TIMEOUT,
            { originalError: error.message }
        );
    }

    // HTTP 錯誤
    if (error.status) {
        if (error.status === 401 || error.status === 403) {
            return new SyncError(
                '認證失敗',
                ERROR_CODES.AUTH_ERROR,
                { status: error.status, originalError: error.message }
            );
        }

        if (error.status === 404) {
            return new SyncError(
                '數據不存在',
                ERROR_CODES.DATA_NOT_FOUND,
                { status: error.status, originalError: error.message }
            );
        }

        if (error.status >= 400 && error.status < 500) {
            return new SyncError(
                '請求錯誤',
                ERROR_CODES.DATA_INVALID,
                { status: error.status, originalError: error.message }
            );
        }

        if (error.status >= 500) {
            return new SyncError(
                '服務器錯誤',
                ERROR_CODES.SYNC_FAILED,
                { status: error.status, originalError: error.message }
            );
        }
    }

    // 默認錯誤
    return new SyncError(
        error.message || '未知錯誤',
        ERROR_CODES.UNKNOWN_ERROR,
        { originalError: error.toString() }
    );
}
