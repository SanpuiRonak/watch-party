import { USER_STORE } from '@/constants/databaseConstants';
import { getDatabase } from '../database';
import { User } from '@/interface';
import { decryptData, encryptData, KeyType } from '../../utils/encryptionUtils';


export const getUserFromDB = async (): Promise<User | undefined> => {
  const db = await getDatabase();
  const encryptedUser = await db.get(USER_STORE, 'userData');
  if(!encryptedUser) return undefined;
  let user: User | undefined = undefined;
  try {
    user = JSON.parse(decryptData(encryptedUser, KeyType.userKey));
  }
  catch (error) {
    throw error;
  }
  return user;
};

export const saveUserInDB = async (user: User) => {
  const db = await getDatabase();
  let encryptedData: string;

  try {
    encryptedData = encryptData(JSON.stringify(user), KeyType.userKey);
  } catch (error) {
    throw error;
  }
  
  await db.put(USER_STORE, encryptedData, 'userData');
  return encryptedData;
};