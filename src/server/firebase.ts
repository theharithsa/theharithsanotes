import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { initializeFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { projectId, bucketName } from "./config.ts";

export function firebaseApp() {
  return (
    getApps()[0] ??
    initializeApp({
      projectId,
      storageBucket: bucketName,
      ...(process.env.FIRESTORE_EMULATOR_HOST
        ? {}
        : { credential: applicationDefault() }),
    })
  );
}
export const database = () =>
  initializeFirestore(firebaseApp(), {
    preferRest: !process.env.FIRESTORE_EMULATOR_HOST,
  });
export const identity = () => getAuth(firebaseApp());
export const mediaBucket = () => getStorage(firebaseApp()).bucket(bucketName);
