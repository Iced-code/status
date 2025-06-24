// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBd_EBYmRmWkUvkqhh6i7FtJATMuJ4J9Y8",
  authDomain: "status-app-84800.firebaseapp.com",
  projectId: "status-app-84800",
  storageBucket: "status-app-84800.firebasestorage.app",
  messagingSenderId: "976231427953",
  appId: "1:976231427953:web:d16f2ed24125ba0a7cd0d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);