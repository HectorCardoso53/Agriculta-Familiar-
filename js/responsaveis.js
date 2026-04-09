// ═══════════════════════════════════════════
//  js/responsaveis.js — CRUD de Responsáveis
// ═══════════════════════════════════════════

const RESP_FIELDS = [
  'nome','cnpj','endereco','municipio','cep',
  'representante','cpf','telefone','banco','agencia','conta'
];

// ── Listagem ──────────────────────────────

async function renderResponsaveis() {
  document.getElementById('breadcrumb').textContent = '';
  showLoading('Carregando responsáveis...');

  const [resps, projets] = await Promise.all([
    load('responsaveis'),
    load('projetos'),
  ]);

  document.getElementById('content').innerHTML = `
    <div class="flex items-center justify-between mb-24">
      <div>
        <h2 style="font-size:18px;font-weight:600">Responsáveis Cadastrados</h2>
        <p class="text-muted mt-4">${resps.length} registro(s) encontrado(s)</p>
      </div>
      <button class="btn btn-primary" onclick="abrirModalResp()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Novo Responsável
      </button>
    </div>
    ${resps.length
      ? `<div class="resp-grid">${resps.map(r => _cardResponsavel(r, projets)).join('')}</div>`
      : `<div class="empty">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
             <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
             <circle cx="9" cy="7" r="4"/>
           </svg>
           <p>Nenhum responsável cadastrado ainda.</p>
         </div>`}
  `;
}

function _cardResponsavel(r, projets) {
  const nProj = projets.filter(p => p.responsavelId === r.id).length;
  return `
    <div class="resp-card">
      <div class="resp-card-badge">${nProj} proj.</div>
      <div class="resp-card-name">${r.nome}</div>
      <div class="resp-card-meta">
        ${r.cnpj          ? `CNPJ: ${r.cnpj}<br>`           : ''}
        ${r.municipio     ? r.municipio                      : ''}
        ${r.representante ? `<br>Rep.: ${r.representante}`  : ''}
      </div>
      <div class="resp-card-actions">
        <button class="btn btn-primary btn-sm"   onclick="abrirResponsavel('${r.id}')">Ver Projetos</button>
        <button class="btn btn-secondary btn-sm" onclick="editarResponsavel('${r.id}')">Editar</button>
        <button class="btn btn-danger btn-sm"    onclick="excluirResponsavel('${r.id}')">Excluir</button>
      </div>
    </div>`;
}

// ── Detalhe ───────────────────────────────

function abrirResponsavel(id) {
  state.responsavelSelecionado = id;
  state.paginaAtual = 'responsaveis';
  renderDetalheResponsavel(id);
}

async function renderDetalheResponsavel(id) {
  showLoading();
  const [resps, projets, ferns, prods] = await Promise.all([
    load('responsaveis'),
    load('projetos'),
    load('fornecedores'),
    load('produtos'),
  ]);

  const resp = resps.find(r => r.id === id);
  if (!resp) return renderResponsaveis();

  const meusProjetos = projets.filter(p => p.responsavelId === id);
  document.getElementById('breadcrumb').textContent = `Responsáveis › ${resp.nome}`;

  document.getElementById('content').innerHTML = `
    <div class="back-btn" onclick="renderResponsaveis()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      Voltar para Responsáveis
    </div>

    <div class="card mb-24">
      <div class="card-header">
        <div class="card-title">${resp.nome}</div>
        <span class="badge badge-green">Responsável</span>
      </div>
      <div class="card-body">
        <div class="form-grid cols-3">
          ${_di('CNPJ',          resp.cnpj,          true)}
          ${_di('Município',     resp.municipio)}
          ${_di('CEP',           resp.cep)}
          ${_di('Endereço',      resp.endereco)}
          ${_di('Representante', resp.representante)}
          ${_di('CPF',           resp.cpf,           true)}
          ${_di('Telefone',      resp.telefone)}
          ${_di('Banco',         resp.banco)}
          ${_di('Agência',       resp.agencia,       true)}
          ${_di('Conta',         resp.conta,         true)}
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between mb-16">
      <h3 style="font-size:15px;font-weight:600">
        Projetos deste Responsável (${meusProjetos.length})
      </h3>
      <button class="btn btn-primary btn-sm" onclick="abrirModalProj('${id}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Novo Projeto
      </button>
    </div>

    ${meusProjetos.length
      ? meusProjetos.map(p => _cardProjetoDetalhe(p, id, ferns, prods)).join('')
      : `<div class="empty"><p>Nenhum projeto cadastrado para este responsável.</p></div>`}
  `;
}

function _di(label, valor, mono = false) {
  if (!valor) return '';
  return `
    <div>
      <div class="text-muted text-sm">${label}</div>
      <div ${mono ? 'class="font-mono"' : ''} style="font-size:14px">${valor}</div>
    </div>`;
}

function _cardProjetoDetalhe(p, respId, ferns, prods) {
  const fps   = ferns.filter(f => f.projetoId === p.id);
  const fIds  = fps.map(f => f.id);
  const total = prods
    .filter(x => fIds.includes(x.fornecedorId))
    .reduce((s, x) => s + (parseFloat(x.quantidade) * parseFloat(x.preco) || 0), 0);

  return `
    <div class="card mb-16">
      <div class="card-header">
        <div>
          <div class="card-title">${p.nome}</div>
          <div class="text-muted text-sm mt-4">${parseDate(p.data)} · ${fps.length} fornecedor(es)</div>
        </div>
        <div class="flex gap-8">
          <span class="badge badge-green font-mono">${fmt(total)}</span>
          <button class="btn btn-primary btn-sm"  onclick="abrirProjeto('${p.id}')">Abrir</button>
          <button class="btn btn-danger btn-sm"   onclick="excluirProjeto('${p.id}','${respId}')">Excluir</button>
        </div>
      </div>
    </div>`;
}

// ── Modal salvar ──────────────────────────

function abrirModalResp(id) {
  state.editandoResp = id || null;
  const resps = state._cacheResps || [];
  const el    = id ? resps.find(r => r.id === id) : null;

  document.getElementById('modal-resp-title').textContent = el ? 'Editar Responsável' : 'Novo Responsável';
  RESP_FIELDS.forEach(f => {
    document.getElementById('r-' + f).value = el ? (el[f] || '') : '';
  });
  openModal('modal-resp');
}

// Carrega cache para edição sem nova query
async function editarResponsavel(id) {
  const resps = await load('responsaveis');
  state._cacheResps = resps;
  abrirModalResp(id);
}

async function salvarResponsavel() {
  const obj = {};
  RESP_FIELDS.forEach(f => { obj[f] = document.getElementById('r-' + f).value.trim(); });
  if (!obj.nome) { alert('Informe o nome do responsável.'); return; }

  const id = state.editandoResp || uid();
  try {
    await saveDoc('responsaveis', id, obj);
    closeModal('modal-resp');
    showToast(state.editandoResp ? 'Responsável atualizado!' : 'Responsável salvo!');
    renderResponsaveis();
  } catch (e) {
    console.error(e);
    showToast('Erro ao salvar. Tente novamente.', 'error');
  }
}

// ── Excluir (cascata) ─────────────────────

async function excluirResponsavel(id) {
  if (!confirm('Excluir responsável e todos os dados vinculados?')) return;
  showLoading('Excluindo...');

  try {
    const projets = await load('projetos');
    const meus    = projets.filter(p => p.responsavelId === id);

    for (const p of meus) {
      const ferns = await load('fornecedores');
      const fps   = ferns.filter(f => f.projetoId === p.id);

      for (const f of fps) {
        const prods = await load('produtos');
        for (const pr of prods.filter(x => x.fornecedorId === f.id)) {
          await deleteDoc('produtos', pr.id);
        }
        await deleteDoc('fornecedores', f.id);
      }
      await deleteDoc('projetos', p.id);
    }
    await deleteDoc('responsaveis', id);

    showToast('Responsável excluído.');
    renderResponsaveis();
  } catch (e) {
    console.error(e);
    showToast('Erro ao excluir.', 'error');
  }
}
