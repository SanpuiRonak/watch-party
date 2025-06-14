import { openDB } from 'idb';

import { DATABASE_KEYS, DATABASE_NAME, DATABASE_STORE } from '@/constants/databaseConstants';
import { decryptData, encryptData } from '@/utils/encryptionUtils';

export const getDatabase = async (): Promise<ReturnType<typeof openDB>> => {
    return await openDB(DATABASE_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(DATABASE_STORE)) {
                db.createObjectStore(DATABASE_STORE);
            }
        },
    });
};

export const getDataFromDB = async <T>(key: DATABASE_KEYS): Promise<T | undefined> => {
    const db = await getDatabase();
    const encryptedData = await db.get(DATABASE_STORE, key);
    if(encryptedData === undefined || encryptedData === null) return undefined;
    let data: T | undefined = undefined;
    
    data = JSON.parse(decryptData(encryptedData));
    
    return data;
};

export const upsertDataInDB = async <T>(data: T, key: DATABASE_KEYS): Promise<string> => {
    const db = await getDatabase();
    const encryptedData: string = encryptData(JSON.stringify(data));
    
    await db.put(DATABASE_STORE, encryptedData, key);
    return encryptedData;
};
