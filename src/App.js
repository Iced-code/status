import './App.css'
import { useEffect, useState } from "react";

import { db } from "./firebase";
import {
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDocs, deleteDoc } from "firebase/firestore";

import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
const auth = getAuth();
const provider = new GoogleAuthProvider();

function signIn() {
  signInWithPopup(auth, provider).then((result) => {
    console.log("Signed in as: ", result.user.uid);
  }).catch((error) => {
    console.error("login error:", error);
  });
}

function logOut() {
  signOut(auth).then(() => {
    console.log("User signed out");
  }).catch((error) => {
    console.error("Sign out error:", error);
  });
}

function App() {
  const [emoji, setEmoji] = useState("");
  const [text, setText] = useState("");
  const [statuses, setStatuses] = useState([]);
  const[user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  function handleRegister(e) {
    e.preventDefault();
    createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
      console.log("Registered as:", userCredential.user);
    }).catch((error) => {
      alert(error.message);
    });
  }
  function handleEmailLogin(e) {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
      console.log("Signed in as:", userCredential.user);
    }).catch((error) => {
      alert(error.message);
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emoji || !text) return;

    await addDoc(collection(db, "statuses"), {
      emoji,
      text,
      timestamp: serverTimestamp(),
      userID: auth.currentUser.uid,
      userName: auth.currentUser.displayName,
      email: auth.currentUser.email || user.email
    });
    setEmoji("");
    setText("");
  };

  return (
    <div className="App">
      <h1>Status Wall</h1>

      {/* <button onClick={async () => {
        const snapshot = await getDocs(collection(db, "statuses"));
        snapshot.forEach((docItem) => deleteDoc(doc(db, "statuses", docItem.id)));
      }}>
        Clear All Posts
      </button> */}

      
      {!user && (
        <div className='login'>
          <form onSubmit={handleEmailLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Email'
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Password'
            />
            <button type='submit'>Sign in</button>

          </form>

          <button onClick={handleRegister} className="register">Register</button>
          <button onClick={signIn} className="signInGoogleButton">Sign in with Google</button>
        </div>
      )}

      {user && (
        <>
          <p>{`Signed in as: ${user.displayName || user.email}`}</p>
          <button onClick={logOut}>Sign out</button>
        </>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className='postForm'>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="Emoji"
            maxLength={2}
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`What’s up?`}
            maxLength={50}
          />
          <button type="submit">Post</button>
        </form>
      ) : (<p>Please sign in</p>)}

      <div className='feed'>
        <h2>Live Feed</h2>
        {statuses.map((s, i) => (
            <p key={i} className={`post ${user && s.userName === user.displayName ? "myPost": "othersPost"}`}>
              {s.userName || s.email}: {s.emoji} {s.text}
            </p>
        ))}
      </div>
    </div>
  );
}

export default App;
