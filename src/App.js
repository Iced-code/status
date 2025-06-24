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

import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
const auth = getAuth();
const provider = new GoogleAuthProvider();

function signIn() {
  signInWithPopup(auth, provider).then((result) => {
    console.log("Signed in as: ", result.user.uid);
  }).catch((error) => {
    console.error("login error:", error);
  });
}

function App() {
  const [emoji, setEmoji] = useState("");
  const [text, setText] = useState("");
  const [statuses, setStatuses] = useState([]);
  const[user, setUser] = useState(null);

  useEffect(() => {
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    })

    const q = query(collection(db, "statuses"), orderBy("timestamp", "desc"));
    const unsubscribe2 = onSnapshot(q, (snapshot) => {
      setStatuses(snapshot.docs.map((doc) => doc.data()));
    });
    return () => {unsubscribe(); unsubscribe2();};
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emoji || !text) return;

    await addDoc(collection(db, "statuses"), {
      emoji,
      text,
      timestamp: serverTimestamp(),
      userID: auth.currentUser.uid,
      userName: auth.currentUser.displayName
    });
    setEmoji("");
    setText("");
  };

  return (
    <div className="App">
      <h1>Status Wall</h1>
      
      {!user && <button onClick={signIn}>Sign in</button>}
      {user ? (
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
      ) : (<p>Please sign in</p>)}

      <h2>Live Feed</h2>
      <ul>
        {statuses.map((s, i) => (
          <li key={i}>
            {s.userName}: {s.emoji} {s.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
