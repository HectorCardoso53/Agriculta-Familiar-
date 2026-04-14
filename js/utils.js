// ═══════════════════════════════════════════
//  js/utils.js — Estado global e helpers
//  Dados persistidos no Firestore por usuário.
//
//  Estrutura das coleções no Firestore:
//  users/{uid}/responsaveis/{id}
//  users/{uid}/projetos/{id}
//  users/{uid}/fornecedores/{id}
//  users/{uid}/produtos/{id}
// ═══════════════════════════════════════════

// ── Estado global ─────────────────────────
const state = {
  paginaAtual: "dashboard",
  responsavelSelecionado: null,
  projetoSelecionado: null,
  fornecedorSelecionado: null,
  editandoResp: null,

  // Cache local para evitar múltiplas leituras
  _cache: {},
};

// ── Referência global (compartilhada) ──────
function userCol(colecao) {
  return window.db
    .collection("users")
    .doc(window.currentUser.uid)
    .collection(colecao);
}

// ── LOAD: lê todos os docs de uma coleção ─
async function load(colecao) {
  const snap = await userCol(colecao).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── SAVE: salva um documento (upsert) ─────
async function saveDoc(colecao, id, dados) {
  await userCol(colecao).doc(id).set(dados, { merge: true });
}

// ── DELETE: remove um documento ──────────
async function deleteDoc(colecao, id) {
  await userCol(colecao).doc(id).delete();
}

// ── Geração de ID único ───────────────────
const uid = () => window.db.collection("_").doc().id;

// ── Formatação de moeda ───────────────────
const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );

// ── Formatação numérica ───────────────────
const fmtN = (v) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v || 0);

// ── Data ISO → DD/MM/YYYY ─────────────────
const parseDate = (d) => (d ? d.split("-").reverse().join("/") : "");

// ── Spinner de carregamento ───────────────
function showLoading(msg = "Carregando...") {
  const el = document.getElementById("content");
  if (el)
    el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;padding:80px;gap:12px;color:var(--muted)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        style="animation:spin .7s linear infinite">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span style="font-size:14px">${msg}</span>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `;
}

// ── Modais ────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

function initModals() {}

// ── Toast de feedback ─────────────────────
function showToast(msg, tipo = "success") {
  let el = document.getElementById("_toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "_toast";
    el.style.cssText = `
      position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:8px;
      font-size:13.5px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.15);
      opacity:0;transform:translateY(8px);transition:opacity .2s,transform .2s;
      z-index:999;font-family:'DM Sans',sans-serif;
    `;
    document.body.appendChild(el);
  }
  el.style.background = tipo === "error" ? "var(--red)" : "var(--green-dark)";
  el.style.color = "#fff";
  el.textContent = msg;
  el.style.opacity = "1";
  el.style.transform = "translateY(0)";
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
  }, 3000);
}

// ── Máscaras de input ─────────────────────
function _aplicarMascara(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', function () {
    const pos = this.selectionStart;
    this.value = fn(this.value);
  });
}

function _mCPF(v)     { return v.replace(/\D/g,'').slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2'); }
function _mCNPJ(v)    { return v.replace(/\D/g,'').slice(0,14).replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2'); }
function _mTel(v)     { v=v.replace(/\D/g,'').slice(0,11); return v.length<=10 ? v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3') : v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3'); }
function _mCEP(v)     { return v.replace(/\D/g,'').slice(0,8).replace(/(\d{5})(\d{1,3})$/,'$1-$2'); }
function _mAgencia(v) { return v.replace(/\D/g,'').slice(0,5).replace(/(\d{4})(\d{1})$/,'$1-$2'); }
function _mConta(v)   { return v.replace(/\D/g,'').slice(0,9).replace(/(\d{1,8})(\d{1})$/,'$1-$2'); }

function initMascaras() {
  _aplicarMascara('r-cnpj',     _mCNPJ);
  _aplicarMascara('r-cep',      _mCEP);
  _aplicarMascara('r-telefone', _mTel);
  _aplicarMascara('r-agencia',  _mAgencia);
  _aplicarMascara('r-conta',    _mConta);
  _aplicarMascara('f-cpf',      _mCPF);
  _aplicarMascara('f-agencia',  _mAgencia);
  _aplicarMascara('f-conta',    _mConta);
}