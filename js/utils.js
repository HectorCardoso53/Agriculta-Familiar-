// ═══════════════════════════════════════════
//  js/utils.js — Estado global e helpers
// ═══════════════════════════════════════════

// ── Formatos por banco ────────────────────
const BANCOS_FORMATO = {
  BB: { agPh: "0000-0", ctPh: "0000000-0", agMax: 5, ctMax: 9 },
  Bradesco: { agPh: "0000-0", ctPh: "000000000-0", agMax: 5, ctMax: 10 },
  Caixa: { agPh: "0000", ctPh: "00000000000-0", agMax: 4, ctMax: 13 },
  Itaú: { agPh: "0000", ctPh: "00000-0", agMax: 4, ctMax: 6 },
  Santander: { agPh: "0000", ctPh: "000000000", agMax: 4, ctMax: 9 },
  Nubank: { agPh: "0001", ctPh: "000000000-0", agMax: 4, ctMax: 10 },
  Inter: { agPh: "0001", ctPh: "0000000-0", agMax: 4, ctMax: 9 },
  Sicredi: { agPh: "0000", ctPh: "00000", agMax: 4, ctMax: 5 },
  Sicoob: { agPh: "0000", ctPh: "0000000-0", agMax: 4, ctMax: 9 },
  BRB: { agPh: "000", ctPh: "0000000-0", agMax: 3, ctMax: 9 },
  C6: { agPh: "0001", ctPh: "0000000-0", agMax: 4, ctMax: 9 },
  PicPay: { agPh: "0001", ctPh: "000000000-0", agMax: 4, ctMax: 10 },
  "Mercado Pago": { agPh: "0001", ctPh: "0000000-0", agMax: 4, ctMax: 9 },
};

// Máscara genérica de agência com dígito verificador
function _mAgenciaDV(v, max) {
  const d = v.replace(/\D/g, "").slice(0, max);
  if (max <= 4) return d; // sem dígito (Itaú, Caixa, etc.)
  return d.replace(/(\d{4})(\d{1})$/, "$1-$2");
}

// Máscara genérica de conta com dígito verificador
function _mContaDV(v, max) {
  const d = v.replace(/\D/g, "").slice(0, max);
  if (max <= 5) return d; // sem dígito (Sicredi, Santander)
  // Caixa: 11 dígitos + 1 DV = 12 total (sem hífen no meio)
  if (max === 13) return d.replace(/(\d{11})(\d{1})$/, "$1-$2");
  // Padrão: até 8 dígitos + 1 DV
  return d.replace(/(\d{1,8})(\d{1})$/, "$1-$2");
}

function onBancoChange(prefixo) {
  const banco = document.getElementById(prefixo + "-banco").value;
  const agEl = document.getElementById(prefixo + "-agencia");
  const ctEl = document.getElementById(prefixo + "-conta");
  const formato = BANCOS_FORMATO[banco];

  agEl.value = "";
  ctEl.value = "";

  if (formato) {
    agEl.placeholder = formato.agPh;
    ctEl.placeholder = formato.ctPh;

    // Remove listeners antigos clonando os elementos
    const agClone = agEl.cloneNode(true);
    const ctClone = ctEl.cloneNode(true);
    agEl.parentNode.replaceChild(agClone, agEl);
    ctEl.parentNode.replaceChild(ctClone, ctEl);

    // Aplica máscara específica do banco
    agClone.addEventListener("input", function () {
      this.value = _mAgenciaDV(this.value, formato.agMax);
    });
    ctClone.addEventListener("input", function () {
      this.value = _mContaDV(this.value, formato.ctMax);
    });
  } else {
    agEl.placeholder = "0000-0";
    ctEl.placeholder = "00000-0";
  }
}

// ── Estado global ─────────────────────────
const state = {
  paginaAtual: "dashboard",
  responsavelSelecionado: null,
  projetoSelecionado: null,
  fornecedorSelecionado: null,
  editandoResp: null,
  _cache: {},
};

// ── Referência global (compartilhada) ──────
function userCol(colecao) {
  return window.db
    .collection("users")
    .doc(window.currentUser.uid)
    .collection(colecao);
}

// ── LOAD ──────────────────────────────────
async function load(colecao) {
  const snap = await userCol(colecao).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── SAVE ──────────────────────────────────
async function saveDoc(colecao, id, dados) {
  await userCol(colecao).doc(id).set(dados, { merge: true });
}

// ── DELETE ────────────────────────────────
async function deleteDoc(colecao, id) {
  await userCol(colecao).doc(id).delete();
}

// ── ID único ─────────────────────────────
const uid = () => window.db.collection("_").doc().id;

// ── Moeda ────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );

// ── Número ───────────────────────────────
const fmtN = (v) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v || 0);

// ── Data ISO → DD/MM/YYYY ─────────────────
const parseDate = (d) => (d ? d.split("-").reverse().join("/") : "");

// ── Spinner ───────────────────────────────
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

// ── Toast ─────────────────────────────────
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

// ── Máscaras fixas ────────────────────────
function _aplicarMascara(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", function () {
    this.value = fn(this.value);
  });
}

function _mCPF(v) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function _mCNPJ(v) {
  return v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
function _mTel(v) {
  v = v.replace(/\D/g, "").slice(0, 11);
  return v.length <= 10
    ? v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
    : v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}
function _mCEP(v) {
  return v
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}
function _mAgencia(v) {
  return v
    .replace(/\D/g, "")
    .slice(0, 5)
    .replace(/(\d{4})(\d{1})$/, "$1-$2");
}
function _mConta(v) {
  return v
    .replace(/\D/g, "")
    .slice(0, 9)
    .replace(/(\d{1,8})(\d{1})$/, "$1-$2");
}

function initMascaras() {
  _aplicarMascara("r-cnpj", _mCNPJ);
  _aplicarMascara("r-cep", _mCEP);
  _aplicarMascara("r-telefone", _mTel);
  _aplicarMascara("r-agencia", _mAgencia);
  _aplicarMascara("r-conta", _mConta);
  _aplicarMascara("f-cpf", _mCPF);
  _aplicarMascara("f-agencia", _mAgencia);
  _aplicarMascara("f-conta", _mConta);
}

// ── Toggle CPF/CNPJ ──────────────────────
function toggleDocTipo(prefixo, tipo) {
  const input =
    document.getElementById(prefixo + "-cnpj") ||
    document.getElementById(prefixo + "-cpf");
  const label = document.getElementById(prefixo + "-doc-tipo-label");
  if (!input || !label) return;

  input.value = "";
  input.id = prefixo + "-" + tipo;
  input.placeholder = tipo === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00";
  label.textContent = tipo.toUpperCase();

  // Remove listener antigo e aplica novo
  const clone = input.cloneNode(true);
  input.parentNode.replaceChild(clone, input);
  _aplicarMascara(prefixo + "-" + tipo, tipo === "cnpj" ? _mCNPJ : _mCPF);
}

// ── Proteção anti-duplo clique ────────────
function _setBtnLoading(btnEl, loading) {
  if (!btnEl) return;
  if (loading) {
    btnEl.disabled = true;
    btnEl._textoOriginal = btnEl.textContent;
    btnEl.textContent = "Salvando...";
  } else {
    btnEl.disabled = false;
    btnEl.textContent = btnEl._textoOriginal || "Salvar";
  }
}
