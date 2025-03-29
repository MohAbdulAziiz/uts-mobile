import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";

// 🔹 Firebase Config
const firebaseConfig = { 
  apiKey: "AIzaSyBUifo9Yz_Uv9fZPb_6ZTKH6Dr9kf28EfA",
  authDomain: "uts-project-e8640.firebaseapp.com",
  projectId: "uts-project-e8640",
  storageBucket: "uts-project-e8640.appspot.com",
  messagingSenderId: "537601119342",
  appId: "1:537601119342:web:b6d9502bbe66422123427f",
  measurementId: "G-2R4SNG1NT3",
};

// 🔹 Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Fungsi untuk menambahkan rating ke Firestore
export async function addRating(rating) {
  try {
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      throw new Error("❌ Rating harus berupa angka antara 1 hingga 5");
    }

    const docRef = await addDoc(collection(db, "ratings"), {
      ratingsId1: rating, // Pastikan rating disimpan sebagai Number
      timestamp: serverTimestamp(), // Menggunakan serverTimestamp() untuk waktu yang akurat
    });

    console.log("✅ Rating berhasil ditambahkan dengan ID:", docRef.id);
    return { id: docRef.id, ratingsId1: rating };
  } catch (error) {
    if (error.code === "permission-denied") {
      console.error("❌ Gagal menambahkan rating: Tidak memiliki izin akses.");
    } else {
      console.error("🔥 Error saat menambahkan rating:", error.message);
    }
    throw new Error("⚠ Gagal menambahkan rating. Periksa aturan Firestore.");
  }
}

// ✅ Fungsi untuk mengambil semua rating dan menghitung rata-rata
export async function getRatings() {
  try {
    const querySnapshot = await getDocs(collection(db, "ratings"));
    
    if (querySnapshot.empty) {
      console.warn("⚠ Tidak ada rating dalam database.");
      return { ratings: [], averageRating: 0, totalVotes: 0 };
    }

    const ratings = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ratingsId1: data.ratingsId1 ?? 0, // Gunakan default jika data kosong
        timestamp: data.timestamp?.toDate() || new Date(), // Konversi timestamp
      };
    });

    // 🔹 Menghitung rata-rata rating
    const totalVotes = ratings.length;
    const totalRatings = ratings.reduce((sum, r) => sum + (r.ratingsId1 || 0), 0);
    const averageRating = totalVotes > 0 ? totalRatings / totalVotes : 0;

    return { 
      ratings, 
      averageRating: parseFloat(averageRating.toFixed(1)), 
      totalVotes 
    };
  } catch (error) {
    if (error.code === "permission-denied") {
      console.error("❌ Gagal mengambil rating: Tidak memiliki izin akses.");
    } else {
      console.error("🔥 Error saat mengambil rating:", error.message);
    }
    return { ratings: [], averageRating: 0, totalVotes: 0 };
  }
}
