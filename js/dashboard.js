// ═══════════════════════════════════════════
//  js/dashboard.js — Tela inicial
// ═══════════════════════════════════════════

async function renderDashboard() {
  document.getElementById('breadcrumb').textContent = '';
  showLoading('Carregando dashboard...');

  // Lê todas as coleções em paralelo
  const [resps, projets, ferns, prods] = await Promise.all([
    load('responsaveis'),
    load('projetos'),
    load('fornecedores'),
    load('produtos'),
  ]);

  const totalGeral = prods.reduce(
    (s, p) => s + (parseFloat(p.quantidade) * parseFloat(p.preco) || 0), 0
  );

  // Projetos com valor calculado para tabela
  const projetosComValor = projets.map(p => {
    const fps   = ferns.filter(f => f.projetoId === p.id);
    const fIds  = fps.map(f => f.id);
    const total = prods
      .filter(x => fIds.includes(x.fornecedorId))
      .reduce((s, x) => s + (parseFloat(x.quantidade) * parseFloat(x.preco) || 0), 0);
    return { ...p, _total: total };
  });

  // Ordena por data decrescente e pega os 5 mais recentes
  const recentes = [...projetosComValor]
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
    .slice(0, 5);

  document.getElementById('content').innerHTML = `

    <!-- ── Boas-vindas ── -->
    <div style="margin-bottom:24px">
      <h2 style="font-size:20px;font-weight:600;letter-spacing:-.01em">
        Olá, ${window.currentUser?.displayName?.split(' ')[0] || 'bem-vindo'} 👋
      </h2>
      <p class="text-muted mt-4">Aqui está o resumo do sistema PNAE.</p>
    </div>

    <!-- ── Cards de indicadores ── -->
    <div class="stats-grid">

      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
        </div>
        <div class="stat-label">Responsáveis</div>
        <div class="stat-value">${resps.length}</div>
        <div class="text-muted" style="font-size:12px;margin-top:2px">grupos formais cadastrados</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon amber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="stat-label">Projetos</div>
        <div class="stat-value">${projets.length}</div>
        <div class="text-muted" style="font-size:12px;margin-top:2px">projetos de venda ativos</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div class="stat-label">Agricultores</div>
        <div class="stat-value">${ferns.length}</div>
        <div class="text-muted" style="font-size:12px;margin-top:2px">fornecedores cadastrados</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="stat-label">Valor Total Geral</div>
        <div class="stat-value" style="font-size:19px">${fmt(totalGeral)}</div>
        <div class="text-muted" style="font-size:12px;margin-top:2px">soma de todos os projetos</div>
      </div>

    </div>

    <!-- ── Linha: Projetos recentes + Resumo por responsável ── -->
    <div style="display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start">

      <!-- Tabela projetos recentes -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Projetos Recentes</div>
          <button class="btn btn-primary btn-sm" onclick="navigate('projetos')">Ver todos</button>
        </div>
        <div style="padding:0">
          ${_tabelaProjetosRecentes(recentes, resps)}
        </div>
      </div>

      <!-- Card lateral: Top responsáveis -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Responsáveis</div>
          <span class="badge badge-green">${resps.length}</span>
        </div>
        <div style="padding:4px 0">
          ${_listaResponsaveis(resps, projets, prods, ferns)}
        </div>
      </div>

    </div>

    <!-- ── Rodapé de dica ── -->
    ${projets.length === 0 ? `
      <div style="
        margin-top:24px;padding:20px 24px;
        background:var(--green-light);border-radius:var(--radius);
        border:1px solid #b2d8bf;display:flex;align-items:center;gap:14px">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>
          <div style="font-size:13.5px;font-weight:600;color:var(--green-dark)">
            Comece cadastrando um Responsável
          </div>
          <div style="font-size:12.5px;color:var(--green);margin-top:2px">
            Acesse o menu <strong>Responsáveis</strong> e clique em "Novo Responsável" para iniciar.
          </div>
        </div>
        <button class="btn btn-primary btn-sm" style="margin-left:auto;white-space:nowrap"
          onclick="navigate('responsaveis')">Ir agora</button>
      </div>
    ` : ''}
  `;
}

// ── Tabela projetos recentes ──────────────
function _tabelaProjetosRecentes(projets, resps) {
  if (!projets.length) {
    return `
      <div class="empty" style="padding:40px 24px">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p>Nenhum projeto ainda.</p>
        <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="navigate('projetos')">
          Criar projeto
        </button>
      </div>`;
  }

  const rows = projets.map(p => {
    const r = resps.find(x => x.id === p.responsavelId);
    return `<tr>
      <td>
        <div style="font-weight:500">${p.nome}</div>
        <div class="text-muted text-sm">${r ? r.nome : '—'}</div>
      </td>
      <td style="white-space:nowrap">${parseDate(p.data)}</td>
      <td><span class="badge badge-green font-mono">${fmt(p._total)}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="abrirProjeto('${p.id}')">Abrir</button>
      </td>
    </tr>`;
  }).join('');

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Projeto / Responsável</th>
            <th>Data</th>
            <th>Valor Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── Lista de responsáveis com resumo ──────
function _listaResponsaveis(resps, projets, prods, ferns) {
  if (!resps.length) {
    return `<div class="empty" style="padding:32px 16px">
      <p>Nenhum responsável cadastrado.</p>
      <button class="btn btn-primary btn-sm" style="margin-top:10px"
        onclick="navigate('responsaveis')">Cadastrar</button>
    </div>`;
  }

  return resps.map(r => {
    const nProj  = projets.filter(p => p.responsavelId === r.id).length;
    const pIds   = projets.filter(p => p.responsavelId === r.id).map(p => p.id);
    const fIds   = ferns.filter(f => pIds.includes(f.projetoId)).map(f => f.id);
    const total  = prods
      .filter(p => fIds.includes(p.fornecedorId))
      .reduce((s, p) => s + (parseFloat(p.quantidade) * parseFloat(p.preco) || 0), 0);

    const initials = r.nome.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');

    return `
      <div style="
        display:flex;align-items:center;gap:12px;
        padding:12px 20px;border-bottom:1px solid var(--border);
        cursor:pointer;transition:background .12s"
        onclick="abrirResponsavel('${r.id}')"
        onmouseover="this.style.background='var(--surface2)'"
        onmouseout="this.style.background=''">
        <div style="
          width:36px;height:36px;border-radius:50%;flex-shrink:0;
          background:var(--green-light);color:var(--green-dark);
          display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:600">${initials}</div>
        <div style="flex:1;overflow:hidden">
          <div style="font-size:13.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${r.nome}
          </div>
          <div class="text-muted" style="font-size:11.5px">${nProj} projeto(s)</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div class="font-mono" style="font-size:12px;color:var(--green-dark);font-weight:600">
            ${fmt(total)}
          </div>
        </div>
      </div>`;
  }).join('');
}
