// utils/firebase.js

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAI0LyFrVkhjkb0_kC-oEEeFWe8BRMw69g",
  authDomain: "resumedashboard-cecac.firebaseapp.com",
  projectId: "resumedashboard-cecac",
  storageBucket: "resumedashboard-cecac.appspot.com",
  messagingSenderId: "401110997305",
  appId: "1:401110997305:web:9cd7775736f8f3e1b230e8",
  measurementId: "G-HCNF1CYRSL"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);

// 🔁 Export what you need
export { storage };
