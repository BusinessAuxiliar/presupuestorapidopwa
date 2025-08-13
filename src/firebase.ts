// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfWl64LM6EJ1oXMLi8YbcW6I0pcMlkpNA",
  authDomain: "app-guille.firebaseapp.com",
  projectId: "app-guille",
  storageBucket: "app-guille.appspot.com",
  messagingSenderId: "1015863025170",
  appId: "1:1015863025170:web:cacfb628eb805bdf66c2cb",
  measurementId: "G-EB07Q26S43"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);