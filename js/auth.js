// ═══════════════════════════════════════════
//  js/auth.js — Firebase Auth + Firestore
//  Deve ser o PRIMEIRO script carregado.
//
//  COMO CONFIGURAR:
//  Substitua os valores abaixo pelas suas
//  credenciais do Firebase Console.
// ═══════════════════════════════════════════

(function initFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyAgSU0rM0KmOy5-nilSCivSuIRJbD4sZ5k",
    authDomain: "semed-2f097.firebaseapp.com",
    projectId: "semed-2f097",
    storageBucket: "semed-2f097.firebasestorage.app",
    messagingSenderId: "695866916407",
    appId: "1:695866916407:web:d50b7e30a43121898c89b2",
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Expõe auth e db globalmente para todos os módulos
  window.auth = firebase.auth();
  window.db = firebase.firestore();

  // Habilita cache offline do Firestore
  window.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Firestore offline: múltiplas abas abertas.");
    } else if (err.code === "unimplemented") {
      console.warn("Firestore offline: navegador não suportado.");
    }
  });

  // ── Guarda de rota ────────────────────────
  window.auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    window.currentUser = user;
    _renderUserInfo(user);

    // Inicializa o sistema após confirmar autenticação
    initModals();
    render();
  });
})();

// ── Avatar e nome na sidebar ──────────────
function _renderUserInfo(user) {
  const name = user.displayName || user.email || "Usuário";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
  const el = document.getElementById("sidebar-user");
  if (!el) return;
  el.innerHTML = `
    <div class="sidebar-avatar">${initials}</div>
    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">${name}</span>
  `;
}

// ── Logout ────────────────────────────────
async function logout() {
  if (!confirm("Deseja sair do sistema?")) return;
  await window.auth.signOut();
  window.location.href = "login.html";
}
