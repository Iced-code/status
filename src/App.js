import './App.css'
import { useEffect, useState } from "react";
import { FaGoogle } from "react-icons/fa";

import { db } from "./firebase";
import {
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, doc, getDocs, deleteDoc } from "firebase/firestore";

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
  const [feed, setFeed] = useState("me");

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

  function toggleFeed() {
    if(feed === "me"){
      setFeed("friends");
    }
    else {
      setFeed("me");
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text) return;

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
    setFeed("me");
  };

  return (
    <div className="App">
      <h1>Status</h1>
      {user && (
        <button onClick={async () => {

          if (!auth.currentUser) return;
          const q = query(
            collection(db, "statuses"),
            where("userID", "==", auth.currentUser.uid)
          );

          const snapshot = await getDocs(q);
          const deletions = snapshot.docs.map((docItem) =>
            deleteDoc(doc(db, "statuses", docItem.id))
          );

          /* const snapshot = await getDocs(collection(db, "statuses"));
          snapshot.forEach((docItem) => deleteDoc(doc(db, "statuses", docItem.id))); */
        }}>
          Clear my posts
        </button>
      )}

      {!user && (
        <p style={{ color: "red", fontSize: "0.9rem" }}>
          ⚠️ This is a personal test app. Do not enter real credentials.
        </p>
      )}

      
      {!user && (
        <div className='login'>
          <h2>Login</h2>

          <form onSubmit={handleEmailLogin} className='loginForm'>
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

          <button onClick={handleRegister} className="registerButton">Register</button>
          <button onClick={signIn} className="signInGoogleButton">{/* <IoLogoGoogle size={24}/> */}Sign in with Google</button>
        </div>
      )}

      {user && (
        <>
          <p>{`Signed in as: ${user.displayName || user.email}`}</p>
          <button onClick={logOut}>Sign out</button>
        </>
      )}

      {user ? (
        <div className='postForm'>
          <h1>What's your status?</h1>
          <form onSubmit={handleSubmit}>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder={'😄'}
              maxLength={2}
              className='emojiInput'
            />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Start typing...'
              maxLength={50}
            />
            <button type="submit">Post</button>
          </form>
        </div>
      ) : (<></>)}

      {user && (
        <div className={`feed`}>
          {/* <button onClick={() => setFeed(feed === "me" ? "friends" : "me")} className={`toggleFeed`}><h2>{feed === "me" ? "My Status" : "Followers Statuses"}</h2></button> */}
          <div className={`toggleFeed ${feed}`}>
            <button onClick={() => setFeed("me")} id="meButton"><h2>My Status</h2></button>
            <button onClick={() => setFeed("friends")} id="friendsButton"><h2>Following</h2></button>
          </div>
          
          {statuses.map((s, i) => (
              <p key={i} className={`post ${user && s.email === user.email ? "myPost": "othersPost"} ${feed}`}>
                {(s.email).split("@")[0]}: {s.emoji} {s.text}
              </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
