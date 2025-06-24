import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

function App() {
  const [emoji, setEmoji] = useState("");
  const [text, setText] = useState("");
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "statuses"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStatuses(snapshot.docs.map((doc) => doc.data()));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emoji || !text) return;
    await addDoc(collection(db, "statuses"), {
      emoji,
      text,
      timestamp: serverTimestamp(),
    });
    setEmoji("");
    setText("");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Status Wall</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="Emoji"
          maxLength={2}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What’s up?"
          maxLength={50}
        />
        <button type="submit">Post</button>
      </form>

      <h2>Live Feed</h2>
      <ul>
        {statuses.map((s, i) => (
          <li key={i}>
            {s.emoji} {s.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
