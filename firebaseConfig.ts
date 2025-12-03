import * as firebaseApp from "firebase/app";
import { getDatabase } from "firebase/database";

// ============================================================================
// ⚠️ IMPORTANTE: SUSTITUYE ESTOS DATOS CON LOS DE TU PROYECTO DE FIREBASE
// 1. Ve a console.firebase.google.com
// 2. Crea un proyecto -> Añade App Web -> Copia la config
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyDTZ141rZA_GTKF29QvcHQQzJ8dDaEQW_E",
  authDomain: "navidadsecreta-f5eb1.firebaseapp.com",
  databaseURL: "https://navidadsecreta-f5eb1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "navidadsecreta-f5eb1",
  storageBucket: "navidadsecreta-f5eb1.firebasestorage.app",
  messagingSenderId: "35639861668",
  appId: "1:35639861668:web:ebe842c436dda752a7e131"
};

// Inicializar Firebase
// Use type assertion to bypass potential "no exported member" TS error depending on environment
const app = (firebaseApp as any).initializeApp(firebaseConfig);
export const db = getDatabase(app);