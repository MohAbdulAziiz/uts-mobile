import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBUifo9Yz_Uv9fZPb_6ZTKH6Dr9kf28EfA",
  authDomain: "uts-project-e8640.firebaseapp.com",
  projectId: "uts-project-e8640",
  storageBucket: "uts-project-e8640.appspot.com", // Perbaikan URL yang salah
  messagingSenderId: "537601119342",
  appId: "1:537601119342:web:b6d9502bbe66422123427f",
  measurementId: "G-2R4SNG1NT3",
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Fungsi untuk menambahkan komentar ke Firestore
export async function addComment(name, comment) {
  try {
    const docRef = await addDoc(collection(db, "comments"), {
      name: name,
      comment: comment,
      timestamp: new Date(),
    });

    return { id: docRef.id, name, comment };
  } catch (error) {
    console.error("Gagal menambahkan komentar:", error);
    throw new Error("Gagal menambahkan komentar");
  }
}

// ✅ Fungsi untuk mendapatkan semua komentar dari Firestore
export async function getComments() {
  try {
    const querySnapshot = await getDocs(collection(db, "comments"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}
