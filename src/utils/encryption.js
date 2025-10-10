// Simple encryption/decryption utility for table parameters
// Using Base64 encoding with a simple cipher for basic obfuscation

const SECRET_KEY = "RestaurantApp2024";

/**
 * Encrypt a table parameter value
 * @param {string} value - The value to encrypt (table name/id)
 * @returns {string} - Encrypted and encoded value
 */
export const encryptTableParam = (value) => {
  try {
    if (!value) return '';
    
    // Convert value to string and add timestamp for uniqueness
    const timestamp = Date.now().toString();
    const dataToEncrypt = `${value}|${timestamp}`;
    
    // Simple XOR cipher with secret key
    let encrypted = '';
    for (let i = 0; i < dataToEncrypt.length; i++) {
      const keyChar = SECRET_KEY[i % SECRET_KEY.length];
      const encryptedChar = String.fromCharCode(
        dataToEncrypt.charCodeAt(i) ^ keyChar.charCodeAt(0)
      );
      encrypted += encryptedChar;
    }
    
    // Encode to Base64 for URL safety
    return btoa(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

/**
 * Decrypt a table parameter value
 * @param {string} encryptedValue - The encrypted value to decrypt
 * @returns {string} - Decrypted table value (without timestamp)
 */
export const decryptTableParam = (encryptedValue) => {
  try {
    if (!encryptedValue) return '';
    
    // Decode from Base64
    const encrypted = atob(encryptedValue);
    
    // Decrypt using XOR cipher
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const keyChar = SECRET_KEY[i % SECRET_KEY.length];
      const decryptedChar = String.fromCharCode(
        encrypted.charCodeAt(i) ^ keyChar.charCodeAt(0)
      );
      decrypted += decryptedChar;
    }
    
    // Extract original value (remove timestamp)
    const parts = decrypted.split('|');
    return parts[0] || '';
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

/**
 * Validate if an encrypted value can be properly decrypted
 * @param {string} encryptedValue - The encrypted value to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEncryptedParam = (encryptedValue) => {
  try {
    const decrypted = decryptTableParam(encryptedValue);
    return decrypted.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Extract query parameter from URL
 * @param {string} paramName - Name of the parameter to extract
 * @param {string} url - URL to extract from (optional, defaults to current URL)
 * @returns {string} - Parameter value or empty string
 */
export const getQueryParam = (paramName, url = window.location.href) => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get(paramName) || '';
  } catch (error) {
    console.error('Query parameter extraction error:', error);
    return '';
  }
};