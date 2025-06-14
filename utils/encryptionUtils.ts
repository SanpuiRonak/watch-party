import { createCipheriv, createDecipheriv } from 'crypto';

import { ENCRYPTION_ALGORITHM } from '@/constants/encryptionConstants';

type EncryptionKey = {
    encryptionKey: Buffer;
    iv: Buffer;
};

const getEncryptionKeyFromEnv = (): EncryptionKey => {
    // TODO generate key dynamically for each user
    const key: string | undefined = process.env.NEXT_PUBLIC_USER_DATA_KEY;
    const iv: string | undefined = process.env.NEXT_PUBLIC_USER_DATA_IV;

    if ((key === undefined || key === '') || (iv === undefined || iv === '')) {
        throw new Error(`Encryption key or IV is not defined in environment variables. key=${key}, iv=${iv}`);
    }
    return {
        encryptionKey: Buffer.from(key, 'base64'),
        iv: Buffer.from(iv, 'base64'),
    };
};

export const encryptData = (serializedData: string): string => {
    const key = getEncryptionKeyFromEnv();

    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key.encryptionKey, key.iv);
    let encryptedData = cipher.update(serializedData, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    return encryptedData;
};

export const decryptData = (encryptedData: string): string => {
    const key = getEncryptionKeyFromEnv();

    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key.encryptionKey, key.iv);
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');
    return decryptedData;
};
