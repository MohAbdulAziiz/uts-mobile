import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function TestDB() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "comments"));
        const commentData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(commentData);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRatings = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ratings"));
        const ratings = querySnapshot.docs.map((doc) => doc.data().rating);
        if (ratings.length > 0) {
          const total = ratings.length;
          const avg = ratings.reduce((sum, r) => sum + r, 0) / total;
          setAverageRating(avg);
          setTotalVotes(total);
        }
      } catch (error) {
        console.error("Error fetching ratings:", error);
      }
    };

    fetchData();
    fetchRatings();
  }, []);

  const handleRate = async (rating) => {
    setSelectedRating(rating);
    try {
      await addDoc(collection(db, "ratings"), { rating });
      await fetchRatings(); // Refresh rating data
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Test Database Connection</h2>

      {/* Comments Section */}
      {loading ? (
        <p>Loading comments...</p>
      ) : (
        <ul>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <li key={comment.id} className="border-b py-2">
                <strong>{comment.name}:</strong> {comment.comment}
              </li>
            ))
          ) : (
            <p>No comments found</p>
          )}
        </ul>
      )}

      {/* Rating Section */}
      <div className="mt-6 text-center">
        <h3 className="text-xl font-bold mb-2">Rate This Website</h3>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              className={`text-3xl ${
                star <= selectedRating ? "text-yellow-500" : "text-gray-400"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="mt-2 text-lg font-semibold">
          Rating {averageRating.toFixed(1)} (from {totalVotes} voters)
        </p>
      </div>
    </div>
  );
}
