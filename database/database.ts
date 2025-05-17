import { DATABASE_NAME, DATABASE_STORES } from "@/constants/databaseConstants";
import { openDB } from "idb";

export const getDatabase = async () => {
  return await openDB(DATABASE_NAME, 1, {
    upgrade(db) {
      DATABASE_STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      });
    },
  });
}
