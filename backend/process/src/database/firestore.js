import admin from "firebase-admin";
var serviceAccount = require("./seng559-firebase-adminsdk-tddx2-f4c57cc7a7.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

export const db = admin.firestore();
