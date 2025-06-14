import { DATABASE_KEYS, DATABASE_NAME, DATABASE_STORE } from "@/constants/databaseConstants";
import { decryptData, encryptData } from "@/utils/encryptionUtils";
import { openDB } from "idb";

export const getDatabase = async () => {
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
    if(!encryptedData) return undefined;
    let data: T | undefined = undefined;
    try {
        data = JSON.parse(decryptData(encryptedData));
    }
    catch (error) {
        throw error;
    }
    return data;
    };

    export const upsertDataInDB = async <T>(data: T, key: DATABASE_KEYS): Promise<string> => {
    const db = await getDatabase();
    let encryptedData: string;

    try {
        encryptedData = encryptData(JSON.stringify(data));
    } catch (error) {
        throw error;
    }
    
    await db.put(DATABASE_STORE, encryptedData, key);
    return encryptedData;
};