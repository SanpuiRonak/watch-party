import { ENCRYPTION_ALGORITHM } from '@/constants/appConstants';
import { createCipheriv, createDecipheriv } from 'crypto';
export enum KeyType {
    userKey
}

type EncryptionKey = {
    encryptionKey: Buffer;
    iv: Buffer;
}

const getEncryptionKeyFromEnv = (keyType: KeyType): EncryptionKey => {
    let key: string | undefined = undefined;
    let iv: string | undefined = undefined;

    switch (keyType) {
        case KeyType.userKey:
            key = process.env.NEXT_PUBLIC_USER_DATA_KEY;
            iv = process.env.NEXT_PUBLIC_USER_DATA_IV;
    }

    if (!key || !iv) {
        throw new Error(`Encryption key or IV is not defined in environment variables. keyType=${keyType}, key=${key}, iv=${iv}`);
    }
    return {
        encryptionKey: Buffer.from(key, 'base64'),
        iv: Buffer.from(iv, 'base64')
    }
}


export const encryptData = (serializedData: string, keyType: KeyType): string => {
    let key: EncryptionKey;

    try {
        key = getEncryptionKeyFromEnv(keyType);
    } catch (error) {
        throw error;
    }

    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key.encryptionKey, key.iv);
    let encryptedData = cipher.update(serializedData, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    return encryptedData;
}

export const decryptData = (encryptedData: string, keyType: KeyType): string => {
    let key: EncryptionKey;

    try {
        key = getEncryptionKeyFromEnv(keyType);
    } catch (error) {
        throw error;
    }

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key.encryptionKey, key.iv);
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');
    return decryptedData;
};

