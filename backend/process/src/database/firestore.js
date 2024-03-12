import db from "./firebase.js";
import { collection, doc, addDoc, deleteDoc, updateDoc, getDocs, query, where } from "firebase/firestore";

// Wrapper for Firestore's addDoc function
async function addDocument(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      await updateDoc(doc(db, collectionName, docRef.id), {
        id: docRef.id
      });
      return docRef.id; 
    } catch (e) {
      console.error("Error adding document: ", e);
      return null;
    }
}

// Wrapper for Firestore's updateDoc function
async function updateDocument(collectionName, docId, newData) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, newData);
      console.log("Document successfully updated!");
    } catch (e) {
      console.error("Error updating document: ", e);
    }
}

// Wrapper for Firestore's deleteDoc function
async function deleteDocument(collectionName, docId) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      console.log("Document successfully deleted!");
    } catch (e) {
      console.error("Error removing document: ", e);
    }
}

async function getDocuments(collectionName, fieldName, value) {
    const q = query(collection(db, collectionName), where(fieldName, "==", value));
    try {
      const querySnapshot = await getDocs(q);
      let documents = [];
      querySnapshot.forEach((doc) => {
        // Push document data and id to the array
        documents.push({ id: doc.id, ...doc.data() });
      });
      return documents;
    } catch (error) {
      console.error("Error getting documents: ", error);
      throw error;
    }
}

  export { addDocument, updateDocument, deleteDocument, getDocuments };