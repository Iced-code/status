import './App.css'
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

import { collection, addDoc, setDoc, query, orderBy, onSnapshot, serverTimestamp, where, doc, getDocs, deleteDoc } from "firebase/firestore";

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

  const [allText, setAllText] = useState("");

  useEffect(() => {
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    })

    const q = query(collection(db, "statuses"), orderBy("timestamp", "desc"));
    const unsubscribe2 = onSnapshot(q, (snapshot) => {
      setStatuses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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
      alert(error + error.message);
    });
  }

  function createTextSummary(){
    let combText = "";

    for(let i = 0; i < statuses.length; i++){ 
      if(user.uid !== statuses[i].userID){
        combText += " " + statuses[i].text;
      }
    }
    setAllText(combText);
    console.log(allText);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text) return;
    setFeed("me");

    // await setDoc(doc(db, "statuses", auth.currentUser.uid), {
    await addDoc(collection(db, "statuses"), {
      emoji,
      text,
      timestamp: serverTimestamp(),
      userID: auth.currentUser.uid,
      email: auth.currentUser.email || user.email
    });
    setEmoji("");
    setText("");
  };

  return (
    <div className="App">
      <h1>Status</h1>

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
          <button onClick={signIn} className="signInGoogleButton">Sign in with Google</button>
        </div>
      )}

      {user && (
        <>
          <p>{`Signed in as: ${user.email}`}</p>
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

      {/* {user && (
        <div>
          {statuses.map((s, i) => {
              return (
                <div>
                  <p key={i} className={`post ${user && s.email === user.email ? "myPost": "othersPost"} ${feed}`}>
                    {(s.email).split("@")[0]}: {s.emoji} {s.text}
                  </p>
                </div>
                
              );
          })}

          <p id='output'></p>
        </div>
      )} */}

      {user && (
        <div className={`feed`}>
          <div>
            <button id="summarizeBtn" onClick={createTextSummary}>Summarize</button>
            <pre id="output"></pre>
          </div>
          
          <div className={`toggleFeed ${feed}`}>
            <button onClick={() => setFeed("me")} id="meButton"><h2>My Status</h2></button>
            <button onClick={() => setFeed("friends")} id="friendsButton"><h2>Following</h2></button>
          </div>
          
          {statuses.map((s, i) => {
            const relativeTime = s.timestamp?.toDate() 
            ? formatDistanceToNow(s.timestamp.toDate(), {addSuffix: true}) : "just now";

            return (
              <div>
                <p key={i} className={`post ${user && s.email === user.email ? "myPost": "othersPost"} ${feed}`}>
                  {(s.email).split("@")[0]}: {s.emoji} {s.text} 
                  <br></br>
                  <small>{relativeTime}</small>
                </p>
              </div>
            );
          })}

          {feed === "me" && statuses.length > 0 && (
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

              setFeed("me");
            }}>
              Clear my posts
            </button>
          )}
        </div>
      )}

      <script src="C:/Users/dracg/gitQuick/script.js"></script>
    </div>
  );
}

export default App;
