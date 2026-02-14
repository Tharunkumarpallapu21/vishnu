// 🔥 YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB--HhdMiZaURmqziuB4AwKC9uXlvcp0BY",
  authDomain: "vishnu-15f35.firebaseapp.com",
  databaseURL: "https://vishnu-15f35-default-rtdb.firebaseio.com",
  projectId: "vishnu-15f35",
  storageBucket: "vishnu-15f35.firebasestorage.app",
  messagingSenderId: "880067262142",
  appId: "1:880067262142:web:df072fe93dfeb13bbc90ef",
  measurementId: "G-X0D51C1K4S"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const lockRef = db.ref("siteLock");

// UI
const busyScreen = document.getElementById("busyScreen");
const busyStatus = document.getElementById("busyStatus");
const busyTimer  = document.getElementById("busyTimer");
const fadeLayer  = document.getElementById("fadeLayer");

// Unique visitor id
const myId = Date.now() + "_" + Math.random().toString(36).slice(2);
let busyInterval = null;

// ===============================
// 🔒 SINGLE USER LOCK
// ===============================
lockRef.once("value").then(snapshot => {
  const data = snapshot.val();
  const now = Date.now();

  // Auto-reset stale lock (older than 2 minutes)
  if (data && data.locked && (now - data.time) > 120000) {
    lockRef.set({ locked: false, by: null, time: 0 });
  }

  lockRef.once("value").then(snap2 => {
    const d = snap2.val();

    if (d && d.locked && d.by !== myId) {
      // Someone else is inside
      document.body.style.overflow = "hidden";
      busyScreen.style.display = "flex";
      if (busyStatus) busyStatus.textContent = "Someone is reading the story right now…";

      if (busyTimer && d.time) {
        updateBusyTimer(d.time);
        if (busyInterval) clearInterval(busyInterval);
        busyInterval = setInterval(() => updateBusyTimer(d.time), 1000);
      }
    } else {
      // Acquire lock
      lockRef.set({ locked: true, by: myId, time: Date.now() });

      // Auto-release on disconnect
      lockRef.onDisconnect().set({ locked: false, by: null, time: 0 });
    }
  });
});

// Live listener: if lock is released, reload waiting page
lockRef.on("value", snapshot => {
  const data = snapshot.val();
  if (data && data.locked === false) {
    if (busyScreen && busyScreen.style.display === "flex") {
      location.reload();
    }
  }
});

function updateBusyTimer(startTime){
  const diff = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  if (busyTimer) busyTimer.textContent = `They’ve been inside for ${m}m ${s}s`;
}

// ===============================
// 💌 TYPING LETTER
// ===============================
const fullLetterEl = document.getElementById("fullLetter");
const letterTextEl = document.getElementById("letterText");
const openStoryBtn = document.getElementById("openStoryBtn");
const letterScene  = document.querySelector(".letter-scene");

document.body.classList.add("locked");

function typeLetter(){
  if(!fullLetterEl || !letterTextEl) return;
  const text = fullLetterEl.innerText.trim();
  let i=0; letterTextEl.innerText="";
  const t=setInterval(()=>{
    letterTextEl.innerText+=text[i++];
    if(i>=text.length){
      clearInterval(t);
      openStoryBtn.style.display="inline-block";
    }
  },35);
}
typeLetter();

if(openStoryBtn){
  openStoryBtn.addEventListener("click", ()=>{
    letterScene.classList.add("fade-out");
    setTimeout(()=>{
      letterScene.style.display="none";
      document.body.classList.remove("locked");
      setupObserver();
      window.scrollTo(0,0);
    },1200);
  });
}

// ===============================
// 🎬 SCROLL ANIMATIONS
// ===============================
function setupObserver(){
  const contents=document.querySelectorAll(".content");
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("show");
        if(fadeLayer){
          fadeLayer.classList.add("active");
          setTimeout(()=>fadeLayer.classList.remove("active"),600);
        }
      }
    });
  },{threshold:0.3});
  contents.forEach(el=>observer.observe(el));
}

// ===============================
// ❤️ 261 UNIQUE LIKES UNLOCK
// ===============================
const TARGET_LIKES = 261;

const btn = document.getElementById("heartBtn");
const countEl = document.getElementById("count");
const likesLeftEl = document.getElementById("likesLeft");
const progressBar = document.getElementById("progressBar");
const hidden = document.getElementById("hiddenSections");
const lockSection = document.getElementById("lockSection");

// Unique per-device like ID
let userLikeId = localStorage.getItem("likeUserId");
if (!userLikeId) {
  userLikeId = "u_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  localStorage.setItem("likeUserId", userLikeId);
}

const likesRef = db.ref("likes");

// Live count for everyone
likesRef.on("value", snapshot => {
  const data = snapshot.val() || {};
  const totalLikes = Object.keys(data).length;

  if (countEl) countEl.textContent = totalLikes;
  const left = Math.max(0, TARGET_LIKES - totalLikes);
  if (likesLeftEl) likesLeftEl.textContent = `${left} likes left to unlock`;

  const percent = Math.min(100, (totalLikes / TARGET_LIKES) * 100);
  if (progressBar) progressBar.style.width = percent + "%";

  if (totalLikes >= TARGET_LIKES) {
    if (hidden) hidden.style.display = "block";
    if (lockSection) lockSection.style.display = "none";
    setupObserver();
  }
});

// Disable button if already liked
likesRef.child(userLikeId).once("value").then(snap => {
  if (snap.exists() && btn) {
    btn.disabled = true;
    btn.textContent = "♥ You already liked";
    btn.style.opacity = "0.6";
    btn.style.cursor = "default";
  }
});

// Handle click
if (btn) {
  btn.addEventListener("click", () => {
    likesRef.child(userLikeId).once("value").then(snap => {
      if (!snap.exists()) {
        likesRef.child(userLikeId).set(true);
      } else {
        btn.disabled = true;
        btn.textContent = "♥ You already liked";
      }
    });
  });
}
