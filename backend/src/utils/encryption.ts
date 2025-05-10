import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

export class EncryptionService {
  static generateId(): string {
    return uuidv4();
  }

  static generateMasterKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  // 加强版的加密方法
  static encrypt(text: string, key: string): string {
    try {
      // 生成随机的初始化向量
      const iv = CryptoJS.lib.WordArray.random(128 / 8);
      
      // 使用 PBKDF2 从密码生成密钥
      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const derivedKey = CryptoJS.PBKDF2(key, salt, {
        keySize: 256 / 32,
        iterations: 10000
      });

      // 使用 AES-CBC 模式加密
      const encrypted = CryptoJS.AES.encrypt(text, derivedKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // 将 salt、iv 和加密数据组合成一个字符串
      return `${salt}:${iv}:${encrypted}`;
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  // 加强版的解密方法
  static decrypt(ciphertext: string, key: string): string {
    try {
      // 分解加密字符串
      const [salt, iv, encrypted] = ciphertext.split(':');
      
      // 重新生成密钥
      const derivedKey = CryptoJS.PBKDF2(key, salt, {
        keySize: 256 / 32,
        iterations: 10000
      });

      // 解密
      const decrypted = CryptoJS.AES.decrypt(encrypted, derivedKey, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('Decryption failed: Invalid data or key');
    }
  }

  // 用于密码哈希的方法保持不变
  static async hashPassword(password: string): Promise<string> {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString() + ':' + salt;
  }

  // 主密钥加密方法
  static encryptMasterKey(masterKey: string, password: string): string {
    return this.encrypt(masterKey, password);
  }

  // 主密钥解密方法
  static decryptMasterKey(encryptedMasterKey: string, password: string): string {
    return this.decrypt(encryptedMasterKey, password);
  }

  // 数据加密方法（供 PasswordEntry 使用）
  static encryptData(text: string, key: string): string {
    return this.encrypt(text, key);
  }

  // 数据解密方法（供 PasswordEntry 使用）
  static decryptData(ciphertext: string, key: string): string {
    return this.decrypt(ciphertext, key);
  }

  // 验证密码
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const [hash, salt] = hashedPassword.split(':');
      const testHash = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 10000
      }).toString();
      return hash === testHash;
    } catch (error) {
      throw new Error('Password verification failed');
    }
  }
}
