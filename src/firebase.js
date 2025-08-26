import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyCCcSE-R_tzb58E1E4pyNKrpQkVgNpB1xI",
    authDomain: "notes-app-c0dcb.firebaseapp.com",
    projectId: "notes-app-c0dcb",
    storageBucket: "notes-app-c0dcb.firebasestorage.app",
    messagingSenderId: "178269262260",
    appId: "1:178269262260:web:8552c6408ae44780a0a2e1",
    measurementId: "G-WB9D3QFKYK"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)