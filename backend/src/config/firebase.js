import fs from "fs";
import admin from "firebase-admin";
import 'dotenv/config'

const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("../../serviceAccountKey.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

export const bucket = admin.storage().bucket();