import serviceAccount from "./database/seng559-firebase-adminsdk-tddx2-cbed457917.js";
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

export const db = admin.firestore();
