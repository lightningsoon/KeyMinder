import { EncryptionService } from '../utils/encryption';

export interface IUser {
  id: string;
  username: string;
  email: string;
  password: string; // 存储的是哈希后的密码
  masterKey: string; // 存储的是加密后的主密钥
  createdAt: Date;
  updatedAt: Date;
}

export class User implements IUser {
  id: string;
  username: string;
  email: string;
  password: string;
  masterKey: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<IUser>) {
    this.id = data.id || EncryptionService.generateId();
    this.username = data.username || '';
    this.email = data.email || '';
    this.password = data.password || '';
    this.masterKey = data.masterKey || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async create(username: string, email: string, plainPassword: string): Promise<User> {
    // 生成主密钥
    const masterKey = EncryptionService.generateMasterKey();

    // 使用用户密码加密主密钥
    const encryptedMasterKey = EncryptionService.encryptMasterKey(masterKey, plainPassword);

    // 哈希用户密码
    const hashedPassword = await EncryptionService.hashPassword(plainPassword);

    return new User({
      username,
      email,
      password: hashedPassword,
      masterKey: encryptedMasterKey,
    });
  }
}
