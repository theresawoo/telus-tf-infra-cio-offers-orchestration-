import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc } from 'firebase/firestore';

// Note: In a production environment, these should be loaded from process.env
// For this orchestrator, we initialize with a generic configuration.
const firebaseConfig = {
  apiKey: "AIzaSy-PLACEHOLDER",
  authDomain: "offers-orchestrator.firebaseapp.com",
  projectId: "offers-orchestrator",
  storageBucket: "offers-orchestrator.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const featuresCol = collection(db, 'features');
export const sprintsCol = collection(db, 'sprints');
export const logsCol = collection(db, 'logs');
export const runRatesDoc = doc(db, 'settings', 'runRates');