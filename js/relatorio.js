// ═══════════════════════════════════════════
//  js/relatorio.js — Relatório por Projeto
// ═══════════════════════════════════════════

let _relProjFiltro = '';

function filtrarRelatorio(pid) {
  _relProjFiltro = pid;
  renderRelatorio();
}

async function renderRelatorio() {
  showLoading('Carregando relatório...');

  const [projetos, responsaveis, fornecedores] = await Promise.all([
    load('projetos'),
    load('responsaveis'),
    load('fornecedores'),
  ]);

  document.getElementById('breadcrumb').textContent = '';

  const respMap = Object.fromEntries(responsaveis.map(r => [r.id, r]));

  const projFilt = _relProjFiltro
    ? projetos.filter(p => p.id === _relProjFiltro)
    : projetos.sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  const grupos = projFilt.map(p => ({
    proj:  p,
    resp:  respMap[p.responsavelId] || null,
    ferns: fornecedores.filter(f => f.projetoId === p.id),
  }));

  const selectOpts = projetos
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
    .map(p => `<option value="${p.id}" ${p.id === _relProjFiltro ? 'selected' : ''}>${p.nome}</option>`)
    .join('');

  const totalForn = grupos.reduce((s, g) => s + g.ferns.length, 0);

  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div class="select-wrap" style="min-width:220px">
          <select onchange="filtrarRelatorio(this.value)">
            <option value="">Todos os projetos</option>
            ${selectOpts}
          </select>
        </div>
        <span class="badge badge-green">${totalForn} fornecedor${totalForn !== 1 ? 'es' : ''}</span>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" onclick="imprimirRelatorioFornecedores()" ${totalForn ? '' : 'disabled'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Imprimir
        </button>
        <button class="btn btn-primary" onclick="baixarRelatorioFornecedores()" ${totalForn ? '' : 'disabled'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Baixar PDF
        </button>
      </div>
    </div>
  `;

  if (!grupos.length) {
    html += `<div class="empty"><p>Nenhum projeto encontrado.</p></div>`;
    document.getElementById('content').innerHTML = html;
    return;
  }

  grupos.forEach(({ proj, resp, ferns }) => {
    const docLabel = resp && resp.docTipo === 'cpf' ? 'CPF' : 'CNPJ';

    // Bloco do responsável
    const respInfo = resp ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px 24px;padding:12px 20px;background:var(--surface2);border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:2px">Responsável</div>
          <div style="font-size:13px;font-weight:600">${resp.nome}</div>
        </div>
        ${resp.cnpj ? `<div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:2px">${docLabel}</div>
          <div style="font-size:13px">${resp.cnpj}</div>
        </div>` : ''}
        ${resp.municipio ? `<div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:2px">Município</div>
          <div style="font-size:13px">${resp.municipio}</div>
        </div>` : ''}
        ${resp.telefone ? `<div>
          <div style="font-size:10px;color:var(--muted);margin-bottom:2px">Telefone</div>
          <div style="font-size:13px">${resp.telefone}</div>
        </div>` : ''}
      </div>
    ` : '';

    // Tabela de fornecedores
    const linhas = ferns.map((f, i) => {
      const fDocLabel = f.docTipo === 'cnpj' ? 'CNPJ' : 'CPF';
      return `<tr>
        <td style="text-align:center;color:var(--muted)">${i + 1}</td>
        <td><strong>${f.nome}</strong></td>
        <td>${fDocLabel}: ${f.cpf || '—'}</td>
        <td>${f.dap || '—'}</td>
        <td>${f.banco || '—'}</td>
        <td>${f.agencia || '—'}</td>
        <td>${f.conta || '—'}</td>
      </tr>`;
    }).join('');

    html += `
      <div class="card" style="margin-bottom:24px;overflow:hidden">
        <div style="background:var(--blue);color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700;font-size:14px">${proj.nome}</div>
            <div style="font-size:11px;opacity:.8;margin-top:2px">${parseDate(proj.data)}</div>
          </div>
          <span style="background:rgba(255,255,255,.2);padding:3px 10px;border-radius:20px;font-size:12px">
            ${ferns.length} fornecedor${ferns.length !== 1 ? 'es' : ''}
          </span>
        </div>

        ${respInfo}

        ${ferns.length ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width:32px;text-align:center">#</th>
                  <th>Nome do Fornecedor</th>
                  <th>CPF / CNPJ</th>
                  <th>CAF / NIS</th>
                  <th>Banco</th>
                  <th>Agência</th>
                  <th>Conta</th>
                </tr>
              </thead>
              <tbody>${linhas}</tbody>
            </table>
          </div>
        ` : `<div style="padding:16px 20px;color:var(--muted);font-size:13px;font-style:italic">Nenhum fornecedor cadastrado.</div>`}
      </div>
    `;
  });

  document.getElementById('content').innerHTML = html;
}

// ════════════════════════════════════════
//  PDF
// ════════════════════════════════════════

async function _imgParaBase64(src) {
  const res  = await fetch(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function _gerarRelatorioConteudo() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const MARGIN     = 15;
  const PAGE_W     = 297;
  const CONTENT_W  = PAGE_W - MARGIN * 2;
  const BLUE       = [37, 99, 235];
  const BLUE_H     = [219, 234, 254];
  const BLUE_LIGHT = [71, 130, 255];

  const [[projetos, responsaveis, fornecedores], logoB64] = await Promise.all([
    Promise.all([load('projetos'), load('responsaveis'), load('fornecedores')]),
    _imgParaBase64('img/prefeitura.png').catch(() => null),
  ]);

  const respMap = Object.fromEntries(responsaveis.map(r => [r.id, r]));

  const projFilt = _relProjFiltro
    ? projetos.filter(p => p.id === _relProjFiltro)
    : projetos.sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  const grupos = projFilt.map(p => ({
    proj:  p,
    resp:  respMap[p.responsavelId] || null,
    ferns: fornecedores.filter(f => f.projetoId === p.id),
  }));

  // ── Cabeçalho com logo centralizada ──
  const LOGO_W = 22;
  const LOGO_H = 22;
  const cx     = PAGE_W / 2;

  if (logoB64) {
    doc.addImage(logoB64, 'PNG', cx - LOGO_W / 2, MARGIN, LOGO_W, LOGO_H);
  }

  const logoOffset = logoB64 ? LOGO_H + 4 : 0;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text('PREFEITURA MUNICIPAL DE ORIXIMINÁ', cx, MARGIN + logoOffset + 6, { align: 'center' });

  doc.setFontSize(10);
  doc.text('SECRETARIA MUNICIPAL DE EDUCAÇÃO', cx, MARGIN + logoOffset + 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text('RELAÇÃO DE RESPONSÁVEIS E FORNECEDORES — PNAE', cx, MARGIN + logoOffset + 18, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(120);
  const hoje = new Date().toLocaleDateString('pt-BR');
  const sub  = _relProjFiltro && grupos[0]
    ? `Projeto: ${grupos[0].proj.nome}  •  Gerado em ${hoje}`
    : `Todos os projetos  •  Gerado em ${hoje}`;
  doc.text(sub, cx, MARGIN + logoOffset + 24, { align: 'center' });

  doc.setTextColor(0);
  doc.setDrawColor(37, 99, 235);
  doc.line(MARGIN, MARGIN + logoOffset + 27, PAGE_W - MARGIN, MARGIN + logoOffset + 27);
  doc.setDrawColor(0);

  let y = MARGIN + logoOffset + 32;

  grupos.forEach(({ proj, resp, ferns }) => {
    // Cabeçalho do projeto
    doc.autoTable({
      startY: y,
      theme: 'grid',
      tableWidth: CONTENT_W,
      head: [[{
        content: `${proj.nome}   |   ${parseDate(proj.data)}   |   ${ferns.length} fornecedor${ferns.length !== 1 ? 'es' : ''}`,
        styles: { halign: 'left', fontSize: 9, fontStyle: 'bold' },
      }]],
      headStyles: { fillColor: BLUE, textColor: 255 },
      body: [],
      margin: { left: MARGIN, right: MARGIN },
    });
    y = doc.lastAutoTable.finalY;

    // Linha do responsável
    if (resp) {
      const docLabel = resp.docTipo === 'cpf' ? 'CPF' : 'CNPJ';
      const partes = [
        `Responsável: ${resp.nome}`,
        resp.cnpj     ? `${docLabel}: ${resp.cnpj}`       : null,
        resp.municipio? `Município: ${resp.municipio}`     : null,
        resp.telefone ? `Tel: ${resp.telefone}`            : null,
      ].filter(Boolean).join('   |   ');

      doc.autoTable({
        startY: y,
        theme: 'grid',
        tableWidth: CONTENT_W,
        head: [],
        body: [[{ content: partes, styles: { fontSize: 8.5, fontStyle: 'italic', fillColor: BLUE_H, textColor: [0,0,0] } }]],
        margin: { left: MARGIN, right: MARGIN },
      });
      y = doc.lastAutoTable.finalY;
    }

    // Tabela de fornecedores
    if (ferns.length) {
      const body = ferns.map((f, i) => {
        const fDocLabel = f.docTipo === 'cnpj' ? 'CNPJ' : 'CPF';
        return [
          i + 1,
          f.nome     || '—',
          `${fDocLabel}: ${f.cpf || '—'}`,
          f.dap      || '—',
          f.banco    || '—',
          f.agencia  || '—',
          f.conta    || '—',
        ];
      });

      doc.autoTable({
        startY: y,
        theme: 'grid',
        tableWidth: CONTENT_W,
        head: [['#', 'Nome do Fornecedor', 'CPF / CNPJ', 'CAF / NIS', 'Banco', 'Agência', 'Conta']],
        body,
        headStyles: { fillColor: BLUE_LIGHT, textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, textColor: [0,0,0] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 72 },
          2: { cellWidth: 44 },
          3: { cellWidth: 36 },
          4: { cellWidth: 38 },
          5: { cellWidth: 24 },
          6: { cellWidth: 43 },
        },
        margin: { left: MARGIN, right: MARGIN },
      });
      y = doc.lastAutoTable.finalY + 10;
    } else {
      y += 6;
    }
  });

  // Numeração de páginas
  const totalPags = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPags; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.line(MARGIN, 200, PAGE_W - MARGIN, 200);
    doc.text(`Página ${i} de ${totalPags}`, PAGE_W / 2, 205, { align: 'center' });
    doc.setTextColor(0);
  }

  return doc;
}

window.baixarRelatorioFornecedores = async function () {
  try {
    const doc  = await _gerarRelatorioConteudo();
    const data = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    doc.save(`Relacao_Fornecedores_${data}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Erro ao gerar PDF.');
  }
};

window.imprimirRelatorioFornecedores = async function () {
  try {
    const doc  = await _gerarRelatorioConteudo();
    doc.autoPrint();
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) {
      win.onload = () => setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 500);
    } else {
      alert('Popup bloqueado. Permita popups neste site e tente novamente.');
    }
  } catch (e) {
    console.error(e);
    alert('Erro ao gerar PDF para impressão.');
  }
};
