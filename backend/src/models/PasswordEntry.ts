import { EncryptionService } from '../utils/encryption';

export interface IPasswordEntry {
  id: string;
  userId: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
}

export class PasswordEntry implements IPasswordEntry {
  id: string;
  userId: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;

  constructor(data: Partial<IPasswordEntry>) {
    this.id = data.id || EncryptionService.generateId();
    this.userId = data.userId || '';
    this.title = data.title || '';
    this.username = data.username || '';
    this.password = data.password || '';
    this.url = data.url;
    this.notes = data.notes;
    this.category = data.category;
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastUsed = data.lastUsed;
  }

  // 使用主密钥加密敏感数据
  encrypt(masterKey: string): void {
    this.password = EncryptionService.encrypt(this.password, masterKey);
    if (this.notes) {
      this.notes = EncryptionService.encrypt(this.notes, masterKey);
    }
  }

  // 使用主密钥解密敏感数据
  decrypt(masterKey: string): void {
    this.password = EncryptionService.decrypt(this.password, masterKey);
    if (this.notes) {
      this.notes = EncryptionService.decrypt(this.notes, masterKey);
    }
  }
}
