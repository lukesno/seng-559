import db from "./firebase.js";
import { doc, setDoc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

// Wrapper for Firestore's addDoc function
async function addDocument(collectionName, key, data) {
  try {
    await setDoc(doc(db, collectionName, key), data);
    console.log(`Added document ${key} to ${collectionName}`);
  } catch (e) {
    console.error("Error adding document: ", e);
    return null;
  }
}

// Wrapper for Firestore's updateDoc function
async function updateDocument(collectionName, key, newData) {
  try {
    await updateDoc(doc(db, collectionName, key), newData);
    console.log(`Updated document ${key} in ${collectionName}`);
  } catch (e) {
    console.error("Error updating document: ", e);
  }
}

// Wrapper for Firestore's deleteDoc function
async function deleteDocument(collectionName, key) {
  try {
    await deleteDoc(doc(db, collectionName, key));
    console.log(`Deleted document ${key} in ${collectionName}`);
  } catch (e) {
    console.error("Error removing document: ", e);
  }
}

async function getDocument(collectionName, key) {
  try {
    const querySnapshot = await getDoc(doc(db, collectionName, key));
    return querySnapshot.data();
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
}

export { addDocument, updateDocument, deleteDocument, getDocument };
