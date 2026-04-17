// ═══════════════════════════════════════════
//  js/lancamentos.js — Fornecedores e Produtos
// ═══════════════════════════════════════════

// ── Render principal ──────────────────────

async function renderLancamentos() {
  document.getElementById("breadcrumb").textContent = "Lançamentos";
  showLoading("Carregando lançamentos...");

  const [projets, resps, ferns, prods] = await Promise.all([
    load("projetos"),
    load("responsaveis"),
    load("fornecedores"),
    load("produtos"),
  ]);

  if (!projets.length) {
    document.getElementById("content").innerHTML =
      `<div class="empty"><p>Crie um projeto antes de lançar fornecedores.</p></div>`;
    return;
  }

  // Garante projeto selecionado válido
  let pid = state.projetoSelecionado;
  if (!pid || !projets.find((p) => p.id === pid)) {
    pid = projets.sort((a, b) => (b.data || "").localeCompare(a.data || ""))[0]
      .id;
    state.projetoSelecionado = pid;
  }

  const proj = projets.find((p) => p.id === pid);
  const resp = proj ? resps.find((r) => r.id === proj.responsavelId) : null;
  const meusFer = ferns.filter((f) => f.projetoId === pid);
  const fIds = meusFer.map((f) => f.id);
  const meusP = prods.filter((p) => fIds.includes(p.fornecedorId));
  const totalP = meusP.reduce(
    (s, p) => s + (parseFloat(p.quantidade) * parseFloat(p.preco) || 0),
    0,
  );

  document.getElementById("content").innerHTML = `

    <!-- ── Barra superior ── -->
    <div class="flex items-center justify-between mb-24" style="flex-wrap:wrap;gap:12px">
      <div class="flex items-center gap-12" style="flex-wrap:wrap">
        ${_seletorProjeto(projets, resps, pid)}
        ${proj ? `<span class="badge badge-amber">${parseDate(proj.data)}</span>` : ""}
        ${resp ? `<span class="text-muted text-sm">${resp.nome}</span>` : ""}
      </div>
      <div class="flex gap-8" style="flex-wrap:wrap">
        <span class="badge badge-green font-mono" style="font-size:13px;padding:6px 12px">
          ${fmt(totalP)}
        </span>
        ${
          proj
            ? `
          <button class="btn btn-amber btn-sm" onclick="gerarPDF('${pid}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Gerar PDF
          </button>
          <button class="btn btn-primary btn-sm" onclick="gerarEImprimir('${pid}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Gerar e Imprimir
          </button>
        `
            : ""
        }
        <button class="btn btn-primary btn-sm" onclick="abrirModalForn('${pid}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Fornecedor
        </button>
      </div>
    </div>

    <!-- ── Blocos de fornecedores ── -->
    ${
      meusFer.length
        ? meusFer.map((f) => _blocoFornecedor(f, prods)).join("")
        : `<div class="empty">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
             <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
             <circle cx="12" cy="12" r="3"/>
           </svg>
           <p>Nenhum fornecedor neste projeto.<br>Clique em "+ Fornecedor" para começar.</p>
         </div>`
    }
  `;
}

// ── Seletor de projeto ────────────────────
function _seletorProjeto(projets, resps, pid) {
  const opts = projets
    .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
    .map((p) => {
      const r = resps.find((x) => x.id === p.responsavelId);
      return `<option value="${p.id}" ${p.id === pid ? "selected" : ""}>
        ${p.nome}${r ? " — " + r.nome : ""}
      </option>`;
    })
    .join("");

  return `
    <div class="select-wrap" style="min-width:260px">
      <select onchange="state.projetoSelecionado=this.value;renderLancamentos()">${opts}</select>
    </div>`;
}

// ── Bloco de um fornecedor ────────────────
function _blocoFornecedor(f, prods) {
  const ps = prods.filter((p) => p.fornecedorId === f.id);
  const tf = ps.reduce(
    (s, p) => s + (parseFloat(p.quantidade) * parseFloat(p.preco) || 0),
    0,
  );

  return `
    <div class="fornecedor-block">
      <div class="fornecedor-block-header" onclick="toggleForn('${f.id}')">
        <div>
          <strong>${f.nome}</strong>

          <div class="text-muted text-sm" style="margin-top:4px">
            CPF: ${f.cpf || "—"} · CAF OU NIS: ${f.dap || "—"}<br>
            Banco: ${f.banco || "—"} · Ag: ${f.agencia || "—"} · Conta: ${f.conta || "—"}
          </div>
        </div>

        <div class="flex items-center gap-8">
          <span class="badge badge-green font-mono">${fmt(tf)}</span>

          <button class="btn btn-primary btn-sm"
            onclick="event.stopPropagation();abrirModalProd('${f.id}','${state.projetoSelecionado}')">
            + Produto
          </button>

          <button class="btn btn-danger btn-sm"
            onclick="event.stopPropagation();excluirFornecedor('${f.id}')">✕</button>
        </div>
      </div>

      <div class="fornecedor-block-body" id="forn-body-${f.id}">
        ${
          ps.length
            ? _tabelaProdutos(ps)
            : `<p class="text-muted text-sm">Nenhum produto. Clique em "+ Produto" para adicionar.</p>`
        }
      </div>
    </div>`;
}

function _tabelaProdutos(ps) {
  const rows = ps
    .map((p) => {
      const tot = parseFloat(p.quantidade) * parseFloat(p.preco) || 0;
      return `<tr>
      <td><strong>${p.produto}</strong></td>
      <td>${p.unidade}</td>
      <td style="text-align:right" class="font-mono">${fmtN(p.quantidade)}</td>
      <td style="text-align:right" class="font-mono">${fmt(p.preco)}</td>
      <td style="text-align:right" class="font-mono"><strong>${fmt(tot)}</strong></td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="excluirProduto('${p.id}')">✕</button>
      </td>
    </tr>`;
    })
    .join("");

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produto</th><th>Un.</th>
            <th style="text-align:right">Qtd.</th>
            <th style="text-align:right">Preço Unit.</th>
            <th style="text-align:right">Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ── Accordion ─────────────────────────────
function toggleForn(id) {
  const el = document.getElementById("forn-body-" + id);
  if (el) el.style.display = el.style.display === "none" ? "" : "none";
}

// ── Fornecedor — modal / CRUD ─────────────

function abrirModalForn(pid) {
  state.projetoSelecionado = pid;
  ["f-nome", "f-cpf", "f-dap"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  openModal("modal-forn");
}

async function salvarFornecedor() {
  const btn = document.querySelector("#modal-forn .btn-primary");
  if (btn && btn.disabled) return;
  _setBtnLoading(btn, true);

  const docElCPF = document.getElementById("f-cpf");
  const docElCNPJ = document.getElementById("f-cnpj");
  const docEl = docElCPF || docElCNPJ;
  const docTipo = docElCPF ? "cpf" : "cnpj";

  const nome = document.getElementById("f-nome").value.trim();
  const cpf = docEl ? docEl.value.trim() : "";
  const dap = document.getElementById("f-dap").value.trim();
  const banco = document.getElementById("f-banco").value.trim();
  const agencia = document.getElementById("f-agencia").value.trim();
  const conta = document.getElementById("f-conta").value.trim();

  if (!nome) {
    alert("Informe o nome do fornecedor.");
    _setBtnLoading(btn, false);
    return;
  }

  try {
    const id = uid();
    await saveDoc("fornecedores", id, {
      projetoId: state.projetoSelecionado,
      nome,
      cpf,
      docTipo,
      dap,
      banco,
      agencia,
      conta,
    });
    closeModal("modal-forn");
    showToast("Fornecedor adicionado!");
    renderLancamentos();
  } catch (e) {
    console.error(e);
    showToast("Erro ao salvar fornecedor.", "error");
  } finally {
    _setBtnLoading(btn, false);
  }
}

// ── Produto — modal / CRUD ────────────────

function abrirModalProd(fid, pid) {
  state.fornecedorSelecionado = fid;
  state.projetoSelecionado = pid;

  // Limpa todos os campos
  ["pr-produto", "pr-qtd", "pr-preco", "pr-total"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("pr-unidade").value = "KG";

  // Popula o select com os produtos PNAE (primeira vez)
  popularSelectPNAE();

  // Reseta o select para opção vazia
  const sel = document.getElementById("pr-select-pnae");
  if (sel) sel.value = "";

  // Cálculo automático do total
  const calc = () => {
    const q = parseFloat(document.getElementById("pr-qtd").value) || 0;
    const p = parseFloat(document.getElementById("pr-preco").value) || 0;
    document.getElementById("pr-total").value = fmt(q * p);
  };
  document.getElementById("pr-qtd").oninput = calc;
  document.getElementById("pr-preco").oninput = calc;

  openModal("modal-prod");
}

async function salvarProduto() {
  const produto = document.getElementById("pr-produto").value.trim();
  const unidade = document.getElementById("pr-unidade").value;
  const quantidade = parseFloat(document.getElementById("pr-qtd").value) || 0;
  const preco = parseFloat(document.getElementById("pr-preco").value) || 0;

  if (!produto) {
    alert("Informe o produto.");
    return;
  }
  if (!quantidade) {
    alert("Informe a quantidade.");
    return;
  }
  if (!preco) {
    alert("Informe o preço.");
    return;
  }

  // ── Valida limite de R$ 40.000 por fornecedor ──
  const prodsExistentes = await load("produtos");
  const totalAtual = prodsExistentes
    .filter((p) => p.fornecedorId === state.fornecedorSelecionado)
    .reduce(
      (s, p) =>
        s + (parseFloat(p.quantidade) || 0) * (parseFloat(p.preco) || 0),
      0,
    );

  const novoValor = quantidade * preco;
  const novoTotal = totalAtual + novoValor;

  if (novoTotal > 40000) {
    const disponivel = 40000 - totalAtual;
    alert(
      `⚠️ Limite de R$ 40.000,00 excedido!\n\n` +
        `Subtotal atual deste fornecedor: ${fmt(totalAtual)}\n` +
        `Este produto adicionaria: ${fmt(novoValor)}\n` +
        `Total resultante: ${fmt(novoTotal)}\n\n` +
        `Valor ainda disponível: ${fmt(disponivel > 0 ? disponivel : 0)}`,
    );
    return;
  }

  try {
    const id = uid();
    await saveDoc("produtos", id, {
      projetoId: state.projetoSelecionado,
      fornecedorId: state.fornecedorSelecionado,
      produto,
      unidade,
      quantidade,
      preco,
    });
    closeModal("modal-prod");
    showToast("Produto adicionado!");
    renderLancamentos();
  } catch (e) {
    console.error(e);
    showToast("Erro ao salvar produto.", "error");
  }
}

async function excluirProduto(id) {
  if (!confirm("Excluir produto?")) return;
  try {
    await deleteDoc("produtos", id);
    showToast("Produto excluído.");
    renderLancamentos();
  } catch (e) {
    showToast("Erro ao excluir.", "error");
  }
}
