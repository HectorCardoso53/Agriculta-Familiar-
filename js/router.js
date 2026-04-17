// ═══════════════════════════════════════════
//  js/router.js — Navegação SPA
// ═══════════════════════════════════════════

const PAGE_TITLES = {
  dashboard:    'Dashboard',
  responsaveis: 'Responsáveis',
  projetos:     'Projetos',
  lancamentos:  'Lançamentos',
};

function navigate(pagina) {
  state.paginaAtual = pagina;

  if (pagina !== 'lancamentos') {
    state.responsavelSelecionado = null;
    state.projetoSelecionado     = null;
    state.fornecedorSelecionado  = null;
  }

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = document.getElementById('nav-' + pagina);
  if (navEl) navEl.classList.add('active');

  render();
}

function render() {
  if (!window.currentUser) return; // ← guarda: aguarda autenticação

  document.getElementById('page-title').textContent = PAGE_TITLES[state.paginaAtual] || '';

  const pages = {
    dashboard:    renderDashboard,
    responsaveis: renderResponsaveis,
    projetos:     renderProjetos,
    lancamentos:  renderLancamentos,
  };

  const fn = pages[state.paginaAtual] || renderDashboard;
  Promise.resolve(fn()).catch(err => {
    console.error('Erro ao renderizar página:', err);
    document.getElementById('content').innerHTML =
      `<div class="empty"><p>Erro ao carregar. Verifique sua conexão e tente novamente.</p></div>`;
  });
}

function abrirProjeto(id) {
  state.projetoSelecionado = id;
  state.paginaAtual        = 'lancamentos';

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('nav-lancamentos').classList.add('active');

  render();
}