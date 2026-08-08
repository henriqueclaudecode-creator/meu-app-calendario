// Autenticação — login com Google via Firebase Auth. Ao logar, cria/atualiza o
// documento users/{uid} no Firestore (base para sincronizar a assinatura entre
// aparelhos). A interface é a mesma que a UI já usa: usuarioAtual, observarAuth,
// entrarComGoogle, sair, deletarConta.
//
// Duas plataformas:
//   • App instalado (Android): login NATIVO via @capacitor-firebase/authentication
//     (o popup do Firebase não funciona dentro do WebView). Pega a credencial
//     nativa e entra também no SDK web, para o resto do app (Firestore,
//     onAuthStateChanged) enxergar o usuário normalmente.
//   • Navegador (dev/PWA): signInWithPopup, como antes.
//
// Se o Firebase não estiver configurado (sem .env.local), cai num stub local
// para o app continuar funcionando offline.

import { Capacitor } from '@capacitor/core';
import { firebaseAtivo, auth, db, googleProvider } from './firebase';
import {
  signInWithPopup, signInWithCredential, signOut, onAuthStateChanged,
  deleteUser, GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { identificarUsuario, esquecerUsuario } from './billing';

const NATIVO = Capacitor.isNativePlatform?.() ?? false;

const ouvintes = new Set();
let atual = null;

function paraUsuario(u) {
  return u ? { uid: u.uid, nome: u.displayName ?? 'Usuário', email: u.email ?? '', foto: u.photoURL ?? null } : null;
}

function avisar() {
  for (const cb of ouvintes) cb(atual);
}

// Carrega o plugin nativo só quando precisa (evita peso no bundle web).
async function pluginAuth() {
  const mod = await import('@capacitor-firebase/authentication');
  return mod.FirebaseAuthentication;
}

// ---------- Modo Firebase ----------
if (firebaseAtivo) {
  onAuthStateChanged(auth, async (u) => {
    atual = paraUsuario(u);
    if (u) {
      // Cria/atualiza o perfil (nunca escreve 'premium' — isso é do backend).
      try {
        await setDoc(
          doc(db, 'users', u.uid),
          { email: u.email ?? '', nome: u.displayName ?? '', atualizadoEm: serverTimestamp() },
          { merge: true },
        );
      } catch { /* Firestore pode ainda não estar liberado; ignora. */ }
      // Liga as compras do RevenueCat a este usuário (sincroniza entre aparelhos).
      identificarUsuario(u.uid);
    }
    avisar();
  });
}

export function usuarioAtual() {
  return atual;
}

export function observarAuth(cb) {
  ouvintes.add(cb);
  cb(atual);
  return () => ouvintes.delete(cb);
}

export async function entrarComGoogle() {
  if (!firebaseAtivo) { atual = { uid: 'local', nome: 'Usuário', email: 'voce@exemplo.com', foto: null }; avisar(); return atual; }

  if (NATIVO) {
    // 1) Login nativo do Android → devolve a credencial do Google.
    const FirebaseAuthentication = await pluginAuth();
    const r = await FirebaseAuthentication.signInWithGoogle();
    const idToken = r?.credential?.idToken;
    const accessToken = r?.credential?.accessToken;
    // 2) Entra também no SDK web com a mesma credencial, para o restante do app
    //    (Firestore, onAuthStateChanged) funcionar como no navegador.
    const cred = GoogleAuthProvider.credential(idToken, accessToken);
    const res = await signInWithCredential(auth, cred);
    return paraUsuario(res.user);
  }

  // Navegador: popup padrão.
  const r = await signInWithPopup(auth, googleProvider);
  return paraUsuario(r.user);
}

export async function sair() {
  if (!firebaseAtivo) { atual = null; avisar(); return; }
  if (NATIVO) {
    try { const P = await pluginAuth(); await P.signOut(); } catch { /* ignora */ }
  }
  try { await esquecerUsuario(); } catch { /* ignora */ }
  await signOut(auth);
}

export async function deletarConta() {
  if (!firebaseAtivo) { atual = null; avisar(); return; }
  const u = auth.currentUser;
  if (!u) return;
  try {
    await deleteDoc(doc(db, 'users', u.uid));
  } catch { /* ignora */ }
  try {
    await deleteUser(u);
    if (NATIVO) { try { const P = await pluginAuth(); await P.signOut(); } catch { /* ignora */ } }
  } catch {
    // Pode exigir login recente; ao menos desloga.
    await sair();
  }
}
