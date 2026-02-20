# KeyGenie Password Generation Logic

## Overview

KeyGenie uses a deterministic password generation algorithm with the Argon2id key derivation function (via WebAssembly), so the same inputs (site name, account, master password) always produce the same password. To ensure consistency, the system requires the browser to support WebAssembly; devices without WebAssembly support cannot use this feature. Passwords are generated on the local device and are never stored on any server.

## Core Principles

### 1. Deterministic Generation
- **Inputs**: Site name (siteName), account (optional), master password (masterPassword)
- **Output**: A 12–18 character password (uppercase, lowercase, digits, special characters)
- **Property**: The same inputs always produce the same password

### 2. Zero-Knowledge Architecture
- The master password never leaves the local device
- Password generation is done entirely on the client
- The server does not store any password-related data

## Algorithm Details

### Step 1: Input Normalization

```javascript
const normalizedSiteName = (siteName || '').trim().toLowerCase();
const normalizedAccount = (account || '').trim().toLowerCase();
```

**Notes**:
- For consistency and UX, `siteName` and `account` are always:
  - Trimmed with `trim()`
  - Converted to lowercase with `toLowerCase()`
- **Purpose**: Avoid different passwords for `google.com` vs `Google` or ` google.com `
- **Examples**:
  - `"Google"` → `"google"`
  - `" google.com "` → `"google.com"`
  - `"User@Example.com"` → `"user@example.com"`

### Step 2: Build Salt

```javascript
const salt = `${normalizedSiteName}:${normalizedAccount}`;
```

- Salt is the normalized site name and account joined with a colon
- Format: `siteName:account`
- If account is empty: `siteName:`

### Step 3: Argon2id Key Derivation

KeyGenie uses Argon2id for password generation; the browser must support WebAssembly:

```javascript
const hashHex = await argon2id({
  password: masterPassword,
  salt: new TextEncoder().encode(salt),
  parallelism: 1,        // Parallelism: 1 (suited for single-threaded browser)
  iterations: 3,         // Iterations: 3 (balance of security and speed)
  memorySize: 131072,    // Memory: 128 MB (131072 KB)
  hashLength: 32,        // Hash length: 32 bytes (256 bits)
  outputType: 'hex'      // Output: hexadecimal
});
```

**Argon2id parameters**:
- **Algorithm**: Argon2id (winner of the 2015 password hashing competition)
- **Parallelism**: 1 (suited for single-threaded browser)
- **Iterations**: 3 (balance of security and speed)
- **Memory**: 128 MB (131,072 KB)
  - Minimal impact for normal users (modern devices have enough RAM)
  - High cost for attackers; resists GPU and ASIC attacks
- **Output length**: 256 bits (32 bytes)
- **Implementation**: `hash-wasm` WebAssembly build for near-native performance

**Argon2id security**:
- **Memory-hard**: 128 MB requirement greatly increases brute-force cost
- **GPU-resistant**: Stronger than PBKDF2 against GPU attacks
- **ASIC-resistant**: Memory-hard design makes dedicated hardware attacks very costly
- **Well-vetted**: 2015 competition winner, widely adopted

**WebAssembly requirement**:
- The app checks whether the browser supports WebAssembly
- If not, an “device not compatible” message is shown
- This ensures the same algorithm everywhere and consistent password generation
- Supported: Chrome 57+, Firefox 52+, Safari 11+, Edge 16+

### Step 4: Convert to Hexadecimal String

```javascript
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
```

- 256 bits of binary data become 64 hexadecimal characters
- Each byte is two hex digits (00–FF)

### Step 5: First 4 Characters (Basic Requirements)

The first 4 characters guarantee the basic password rules:

```javascript
// 1st: uppercase (A-Z)
result += String.fromCharCode(65 + parseInt(hashHex.substring(0, 2), 16) % 26);

// 2nd: lowercase (a-z)
result += String.fromCharCode(97 + parseInt(hashHex.substring(2, 4), 16) % 26);

// 3rd: digit (0-9)
result += parseInt(hashHex.substring(4, 6), 16) % 10;

// 4th: special character
result += SPECIAL_CHARS[parseInt(hashHex.substring(6, 8), 16) % SPECIAL_CHARS.length];
```

**Special character set**:
```javascript
const SPECIAL_CHARS = '!@#$%^&*()_+-=';
```

**Notes**:
- Uses the first 8 hex characters (4 bytes) of the hash
- Modulo ensures even distribution of character types
- Ensures at least one uppercase, one lowercase, one digit, and one special character

### Step 6: Next 8 Characters

```javascript
for (let i = 8; i < 24; i += 2) {
  const value = parseInt(hashHex.substring(i, i + 2), 16);
  if (value % 4 === 0) {
    result += String.fromCharCode(65 + value % 26);  // uppercase
  } else if (value % 4 === 1) {
    result += String.fromCharCode(97 + value % 26);  // lowercase
  } else if (value % 4 === 2) {
    result += value % 10;                            // digit
  } else {
    result += SPECIAL_CHARS[value % SPECIAL_CHARS.length]; // special
  }
}
```

**Notes**:
- Uses hex characters 9–24 (8 bytes)
- `value % 4` chooses character type for roughly even distribution
- Each type has ~25% probability

### Step 7: Dynamic Length

```javascript
const extraLength = hashArray[15] % 7;
```

**Notes**:
- Uses the 16th byte of the hash array (index 15)
- Modulo 7 gives extra length 0–6
- Base length: 12
- Final length: 12–18 characters

### Step 8: Extra Characters (if length > 12)

```javascript
if (extraLength > 0) {
  for (let i = 24; i < 24 + (extraLength * 2); i += 2) {
    const value = parseInt(hashHex.substring(i, i + 2), 16);
    // Same logic as Step 6
  }
}
```

**Notes**:
- If `extraLength > 0`, more characters are generated from the hash
- Starts from the 25th hex character
- Same logic as Step 6

## Password Properties

### Length
- **Base**: 12 characters
- **Maximum**: 18 characters
- **Dynamic**: 12–18, determined by the hash

### Character Set
- **Uppercase**: A–Z (26)
- **Lowercase**: a–z (26)
- **Digits**: 0–9 (10)
- **Special**: `!@#$%^&*()_+-=` (14)

### Security Guarantees
1. **First 4**: At least one of each character type
2. **Distribution**: Later characters use modulo for even type distribution
3. **Uniqueness**: Different site/account pairs produce different passwords

## Example

### Sample Input
- **Site name**: `example.com` (or `Example.com`, ` EXAMPLE.COM ` → normalized to `example.com`)
- **Account**: `user@example.com` (or `User@Example.com` → `user@example.com`)
- **Master password**: `MyMasterPassword123!`

### Generation Steps
1. **Normalize**: `siteName` → `example.com`, `account` → `user@example.com`
2. **Salt**: `example.com:user@example.com`
3. **Argon2id**: 256-bit hash
4. **Encode**: 64-character hex string
5. **Build**: 12–18 character password per algorithm

### Output Properties
- Same input → same output (deterministic)
- Different site → different password (uniqueness)
- All character types present (security)

## Security Analysis

### Strengths
1. **Zero-knowledge**: Master password stays on device
2. **Deterministic**: No storage; password can be regenerated anytime
3. **High entropy**: 256-bit hash provides strong randomness
4. **Brute-force resistance**: 128 MB memory + 3 iterations raise cost significantly
5. **Salt**: Per-site salt prevents rainbow tables
6. **Memory-hard (Argon2id)**: 128 MB is costly for attackers
7. **GPU/ASIC resistance (Argon2id)**: Stronger than traditional KDFs against dedicated hardware

### Considerations
1. **Master password**: If lost, it cannot be recovered
2. **Input normalization**:
   - Site name and account are lowercased and trimmed
   - `google.com`, `Google`, ` GOOGLE ` all yield the same password
   - `google.com` and `google` still yield different passwords (different strings)
3. **Input consistency**:
   - Normalized inputs must match exactly for the same password
   - e.g. `google.com` vs `google` produce different passwords
4. **Local generation**: Passwords are generated on the client; no server dependency
5. **WebAssembly**: Browsers must support WebAssembly; unsupported devices get a clear error and cannot use password generation, ensuring one algorithm and consistent results everywhere

## Technical Specs

### Algorithm: Argon2id
- **Algorithm**: Argon2id (via hash-wasm WebAssembly)
- **Parallelism**: 1
- **Iterations**: 3
- **Memory**: 128 MB (131,072 KB)
- **Hash length**: 256 bits (32 bytes)
- **Library**: hash-wasm
- **Typical time**: 200–800 ms (device-dependent)

### General
- **Password length**: 12–18 characters
- **Character set size**: 76 (26+26+10+14)
- **Browser support**:
  - **Requirement**: WebAssembly support
  - **Supported**: Chrome 57+, Firefox 52+, Safari 11+, Edge 16+
  - **Unsupported**: Incompatible device message; password generation unavailable

## Implementation

- **File**: `frontend/src/utils/passwordGenerator.js`
- **Export**: `generatePassword(siteName, account, masterPassword)`
- **Return**: `Promise<string>`

## Performance

### Argon2id
- **Desktop**: 200–500 ms (CPU-dependent)
- **Mid/high-end mobile**: 300–800 ms
- **Low-end mobile**: 800 ms–2 s
- **Peak memory**: ~130 MB (short-lived)

### UX
- Loading indicator while generating
- Device capability detection for best algorithm choice
- Fallback behavior for compatibility where applicable

## Algorithm Migration

### Important
⚠️ **Changing the algorithm changes all generated passwords**

- After moving from PBKDF2 to Argon2id, the same inputs produce different passwords
- Users must regenerate all passwords

### Compatibility
- **Consistency first**: All devices use Argon2id so passwords match everywhere
- **WebAssembly**: Old browsers without WebAssembly cannot use password generation
- **Errors**: Unsupported devices see a clear message to use a modern WebAssembly-capable browser

## Version

- **Doc version**: 2.1
- **Last updated**: 2025-01-29
- **Changes**:
  - v2.1: Removed PBKDF2 fallback; all devices use Argon2id for consistency
  - v2.0: Switched to Argon2id (primary), kept PBKDF2 fallback
  - v1.0: Initial release, PBKDF2 only
