// ═══════════════════════════════════════════
//  js/projetos.js — CRUD de Projetos
// ═══════════════════════════════════════════

// ── Listagem ──────────────────────────────

async function renderProjetos() {
  document.getElementById('breadcrumb').textContent = '';
  showLoading('Carregando projetos...');

  const [projets, resps, ferns, prods] = await Promise.all([
    load('projetos'),
    load('responsaveis'),
    load('fornecedores'),
    load('produtos'),
  ]);

  document.getElementById('content').innerHTML = `
    <div class="flex items-center justify-between mb-24">
      <div>
        <h2 style="font-size:18px;font-weight:600">Projetos</h2>
        <p class="text-muted mt-4">${projets.length} projeto(s) cadastrado(s)</p>
      </div>
      <button class="btn btn-primary" onclick="abrirModalProj()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Novo Projeto
      </button>
    </div>

    <div class="card">
      <div style="padding:0">
        ${projets.length
          ? _tabelaProjetos(projets, resps, ferns, prods)
          : `<div class="empty">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                 <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
               </svg>
               <p>Nenhum projeto cadastrado ainda.</p>
             </div>`}
      </div>
    </div>
  `;
}

function _tabelaProjetos(projets, resps, ferns, prods) {
  const rows = projets
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
    .map(p => {
      const r    = resps.find(x => x.id === p.responsavelId);
      const fIds = ferns.filter(f => f.projetoId === p.id).map(f => f.id);
      const total = prods
        .filter(x => fIds.includes(x.fornecedorId))
        .reduce((s, x) => s + (parseFloat(x.quantidade) * parseFloat(x.preco) || 0), 0);

      return `<tr>
        <td><strong>${p.nome}</strong></td>
        <td>${r ? r.nome : '<span class="text-muted">—</span>'}</td>
        <td style="white-space:nowrap">${parseDate(p.data)}</td>
        <td><span class="badge badge-green font-mono">${fmt(total)}</span></td>
        <td class="flex gap-8">
          <button class="btn btn-primary btn-sm"  onclick="abrirProjeto('${p.id}')">Abrir</button>
          <button class="btn btn-danger btn-sm"   onclick="excluirProjeto('${p.id}')">Excluir</button>
        </td>
      </tr>`;
    }).join('');

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Projeto</th><th>Responsável</th>
            <th>Data</th><th>Valor Total</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── Modal ─────────────────────────────────

async function abrirModalProj(respId) {
  const resps = await load('responsaveis');
  const sel   = document.getElementById('p-resp');

  sel.innerHTML = resps.length
    ? resps.map(r =>
        `<option value="${r.id}" ${r.id === respId ? 'selected' : ''}>${r.nome}</option>`
      ).join('')
    : '<option value="">— Nenhum responsável —</option>';

  document.getElementById('p-nome').value = '';
  document.getElementById('p-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('p-mecanismos').value = ''; // ← adicione
  openModal('modal-proj');
}

async function salvarProjeto() {
  const nome = document.getElementById('p-nome').value.trim();
  const resp = document.getElementById('p-resp').value;
  const data = document.getElementById('p-data').value;

  if (!nome) { alert('Informe o nome do projeto.'); return; }
  if (!resp) { alert('Selecione um responsável.'); return; }

  try {
    const id = uid();
    await saveDoc('projetos', id, { responsavelId: resp, nome, data });
    closeModal('modal-proj');
    showToast('Projeto salvo!');

    if (state.responsavelSelecionado) {
      renderDetalheResponsavel(state.responsavelSelecionado);
    } else {
      renderProjetos();
    }
  } catch (e) {
    console.error(e);
    showToast('Erro ao salvar projeto.', 'error');
  }
}

// ── Excluir ───────────────────────────────

async function excluirProjeto(id, respId) {
  if (!confirm('Excluir projeto e todos os dados vinculados?')) return;
  showLoading('Excluindo...');

  try {
    const ferns = await load('fornecedores');
    const fps   = ferns.filter(f => f.projetoId === id);

    for (const f of fps) {
      const prods = await load('produtos');
      for (const p of prods.filter(x => x.fornecedorId === f.id)) {
        await deleteDoc('produtos', p.id);
      }
      await deleteDoc('fornecedores', f.id);
    }
    await deleteDoc('projetos', id);

    showToast('Projeto excluído.');
    if (respId) renderDetalheResponsavel(respId);
    else renderProjetos();
  } catch (e) {
    console.error(e);
    showToast('Erro ao excluir.', 'error');
  }
}
