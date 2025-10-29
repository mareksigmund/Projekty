import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncBlob {
  alg: 'aes-256-gcm';
  keyId: string; // np. 'k1'
  iv: string; // base64
  tag: string; // base64 (auth tag)
  ct: string; // base64 (ciphertext)
}

@Injectable()
export class CryptoService {
  private key: Buffer;
  private keyId: string;

  constructor(private readonly config: ConfigService) {
    const b64 = this.config.get<string>('WEBHOOK_ENC_KEY_BASE64');
    this.keyId = this.config.get<string>('WEBHOOK_KEY_ID') ?? 'k1';
    if (!b64)
      throw new InternalServerErrorException('WEBHOOK_ENC_KEY_BASE64 not set');
    const buf = Buffer.from(b64, 'base64');
    if (buf.length !== 32)
      throw new InternalServerErrorException(
        'Encryption key must be 32 bytes (base64 of 32B)',
      );
    this.key = buf;
  }

  encrypt(plaintext: string): EncBlob {
    const iv = crypto.randomBytes(12); // GCM zaleca 12B IV
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const ct = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return {
      alg: 'aes-256-gcm',
      keyId: this.keyId,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      ct: ct.toString('base64'),
    };
  }

  decrypt(blob: EncBlob): string {
    if (blob.alg !== 'aes-256-gcm') throw new Error('Unsupported alg');
    const iv = Buffer.from(blob.iv, 'base64');
    const tag = Buffer.from(blob.tag, 'base64');
    const ct = Buffer.from(blob.ct, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString('utf8');
  }
}
