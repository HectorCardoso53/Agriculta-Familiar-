// ═══════════════════════════════════════════
//  js/pdf.js — Relatório PNAE (Anexo II)
//  Inclui Seção IV: Totalização por Produto
// ═══════════════════════════════════════════

const PDF_MARGIN    = 15;
const PDF_PAGE_W    = 210;
const PDF_CONTENT_W = PDF_PAGE_W - PDF_MARGIN * 2;
const PDF_GREEN     = [26, 80, 50];
const PDF_GREEN_H   = [240, 245, 240];
const PDF_SUBTOTAL  = [230, 245, 235];
const PDF_TOTAL_IV  = [220, 240, 228];

/**
 * Constrói e retorna o documento jsPDF completo.
 * @param {string} pid — ID do projeto
 * @returns {Promise<jsPDF>}
 */
async function gerarConteudoPDF(pid) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Carrega dados do Firestore em paralelo ──
  const [projets, resps, ferns, prods] = await Promise.all([
    load('projetos'),
    load('responsaveis'),
    load('fornecedores'),
    load('produtos'),
  ]);

  const proj = projets.find(p => p.id === pid);
  const resp = proj ? resps.find(r => r.id === proj.responsavelId) : null;
  const meusFerns = ferns.filter(f => f.projetoId === pid);

  // ── Cabeçalho (repetido em cada página) ──
  const addHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PDF_GREEN);
    doc.text('ANEXO II', PDF_PAGE_W / 2, PDF_MARGIN, { align: 'center' });

    doc.setFontSize(9.5);
    doc.text('PROJETO DE VENDA DE GÊNEROS ALIMENTÍCIOS', PDF_PAGE_W / 2, PDF_MARGIN + 5, { align: 'center' });
    doc.text('PROGRAMA NACIONAL DE ALIMENTAÇÃO ESCOLAR', PDF_PAGE_W / 2, PDF_MARGIN + 10, { align: 'center' });

    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Projeto: ${proj ? proj.nome : ''}`, PDF_MARGIN, PDF_MARGIN + 16);
    doc.text(`Data: ${proj ? parseDate(proj.data) : ''}`, PDF_PAGE_W - PDF_MARGIN, PDF_MARGIN + 16, { align: 'right' });
    doc.line(PDF_MARGIN, PDF_MARGIN + 18, PDF_PAGE_W - PDF_MARGIN, PDF_MARGIN + 18);
  };

  // ── Rodapé com numeração ──────────────────
  const addFooters = () => {
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.line(PDF_MARGIN, 285, PDF_PAGE_W - PDF_MARGIN, 285);
      doc.text(`Página ${i} de ${total}`, PDF_PAGE_W / 2, 290, { align: 'center' });
      doc.setTextColor(0);
    }
  };

  // ── Página 1 ──────────────────────────────
  addHeader();
  let y = PDF_MARGIN + 24;

  // ══════════════════════════════════════════
  //  I — Dados do Proponente
  // ══════════════════════════════════════════
  if (resp) {
    doc.autoTable({
      startY: y,
      margin: { left: PDF_MARGIN, right: PDF_MARGIN },
      theme: 'grid',
      headStyles: { fillColor: PDF_GREEN, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      head: [['I – IDENTIFICAÇÃO DO PROPONENTE', '']],
      body: [
        ['Nome / Razão Social',     resp.nome          || ''],
        ['CNPJ',                    resp.cnpj          || ''],
        ['Endereço',                resp.endereco      || ''],
        ['Município',               resp.municipio     || ''],
        ['CEP',                     resp.cep           || ''],
        ['Representante Legal',     resp.representante || ''],
        ['CPF do Representante',    resp.cpf           || ''],
        ['Telefone',                resp.telefone      || ''],
        ['Banco / Agência / Conta', [resp.banco, resp.agencia, resp.conta].filter(Boolean).join(' / ')],
      ],
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold', fillColor: PDF_GREEN_H },
        1: { cellWidth: PDF_CONTENT_W - 55 },
      },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // ══════════════════════════════════════════
  //  II — Identificação Agricultor / Produto
  // ══════════════════════════════════════════
  let grandTotal   = 0;
  const bodyRowsII = [];

  meusFerns.forEach(f => {
    const fps = prods.filter(p => p.fornecedorId === f.id);
    if (!fps.length) return;

    let agTot = 0;

    fps.forEach((p, i) => {
      const tot  = parseFloat(p.quantidade) * parseFloat(p.preco) || 0;
      agTot     += tot;
      grandTotal += tot;

      bodyRowsII.push([
        i === 0 ? `${f.nome}\nCPF: ${f.cpf || '—'}\nDAP: ${f.dap || '—'}` : '',
        p.produto,
        p.unidade,
        fmtN(p.quantidade),
        fmt(p.preco),
        fmt(tot),
      ]);
    });

    bodyRowsII.push([
      { content: `Subtotal — ${f.nome}`, colSpan: 5, styles: { fontStyle: 'bold', fillColor: PDF_SUBTOTAL } },
      { content: fmt(agTot), styles: { fontStyle: 'bold', fillColor: PDF_SUBTOTAL, halign: 'right' } },
    ]);
  });

  bodyRowsII.push([
    { content: 'VALOR TOTAL DO PROJETO', colSpan: 5, styles: { fontStyle: 'bold', fillColor: PDF_GREEN, textColor: 255 } },
    { content: fmt(grandTotal), styles: { fontStyle: 'bold', fillColor: PDF_GREEN, textColor: 255, halign: 'right' } },
  ]);

  doc.autoTable({
    startY: y,
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    theme: 'grid',
    headStyles: { fillColor: PDF_GREEN, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, valign: 'middle' },
    head: [['II – IDENTIFICAÇÃO DO AGRICULTOR', 'Produto', 'Unidade', 'Quantidade', 'Preço Unit.', 'Valor Total']],
    body: bodyRowsII,
    columnStyles: {
      0: { cellWidth: 48 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
    didDrawPage: () => addHeader(),
    pageBreak: 'avoid',
    showHead: 'everyPage',
  });

  // ══════════════════════════════════════════
  //  III — Assinaturas
  // ══════════════════════════════════════════
  let ySign = doc.lastAutoTable.finalY + 14;
  if (ySign > 260) { doc.addPage(); addHeader(); ySign = PDF_MARGIN + 26; }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_GREEN);
  doc.text('III – ASSINATURAS', PDF_MARGIN, ySign);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  ySign += 8;

  doc.line(PDF_MARGIN, ySign + 10, PDF_MARGIN + 75, ySign + 10);
  doc.setFontSize(9);
  doc.text(resp ? (resp.representante || 'Representante Legal') : 'Representante Legal', PDF_MARGIN, ySign + 15);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Assinatura do Representante Legal', PDF_MARGIN, ySign + 20);

  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.line(PDF_PAGE_W - PDF_MARGIN - 75, ySign + 10, PDF_PAGE_W - PDF_MARGIN, ySign + 10);
  doc.text('Local e Data', PDF_PAGE_W - PDF_MARGIN - 75, ySign + 15);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Local e data da assinatura', PDF_PAGE_W - PDF_MARGIN - 75, ySign + 20);
  doc.setTextColor(0);

  // ══════════════════════════════════════════
  //  IV — Totalização por Produto
  // ══════════════════════════════════════════
  let yIV = ySign + 32;
  if (yIV > 245) { doc.addPage(); addHeader(); yIV = PDF_MARGIN + 26; }

  const totaisPorProduto = _calcularTotaisPorProduto(meusFerns, prods);

  const bodyRowsIV = totaisPorProduto.map((item, idx) => [
    String(idx + 1),
    item.produto,
    item.unidade,
    fmtN(item.quantidade),
    fmt(item.precoMedio),
    fmt(item.total),
  ]);

  bodyRowsIV.push([
    { content: '', styles: { fillColor: [250, 250, 248] } },
    { content: '', styles: { fillColor: [250, 250, 248] } },
    { content: '', styles: { fillColor: [250, 250, 248] } },
    { content: '', styles: { fillColor: [250, 250, 248] } },
    { content: 'Total do projeto:', styles: { fontStyle: 'bold', halign: 'right', fillColor: PDF_TOTAL_IV } },
    { content: fmt(grandTotal),     styles: { fontStyle: 'bold', halign: 'right', fillColor: PDF_TOTAL_IV } },
  ]);

  doc.autoTable({
    startY: yIV,
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    theme: 'grid',
    head: [
      [{
        content: 'IV – TOTALIZAÇÃO POR PRODUTO',
        colSpan: 6,
        styles: {
          halign: 'center',
          fillColor: [210, 213, 208],
          textColor: [30, 50, 30],
          fontStyle: 'bold',
          fontSize: 10,
        },
      }],
      ['', '1. Produto', '2.Unidade', '3.Quantidade', '4.Preço/Unidade', '5.Valor Total por Produto'],
    ],
    body: bodyRowsIV,
    headStyles: { fillColor: [240, 242, 238], textColor: [40, 60, 40], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', textColor: [150, 150, 150] },
      1: { cellWidth: 50 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 43, halign: 'right' },
    },
    didDrawPage: () => addHeader(),
    showHead: 'everyPage',
  });

  addFooters();
  return doc;
}

// ── Agrupa e soma por produto ─────────────
function _calcularTotaisPorProduto(ferns, prods) {
  const mapa = {};

  ferns.forEach(f => {
    prods.filter(p => p.fornecedorId === f.id).forEach(p => {
      const chave = p.produto.trim().toLowerCase();
      const qtd   = parseFloat(p.quantidade) || 0;
      const preco = parseFloat(p.preco)      || 0;
      const tot   = qtd * preco;

      if (!mapa[chave]) {
        mapa[chave] = { produto: p.produto, unidade: p.unidade, quantidade: 0, totalValor: 0, totalQtd: 0 };
      }
      mapa[chave].quantidade += qtd;
      mapa[chave].totalValor += tot;
      mapa[chave].totalQtd   += qtd;
    });
  });

  return Object.values(mapa)
    .map(item => ({
      produto:    item.produto,
      unidade:    item.unidade,
      quantidade: item.quantidade,
      precoMedio: item.totalQtd > 0 ? item.totalValor / item.totalQtd : 0,
      total:      item.totalValor,
    }))
    .sort((a, b) => a.produto.localeCompare(b.produto, 'pt-BR'));
}

// ── Download ──────────────────────────────
async function gerarPDF(pid) {
  try {
    const doc   = await gerarConteudoPDF(pid);
    const projs = await load('projetos');
    const proj  = projs.find(p => p.id === pid);
    doc.save(`PNAE_${(proj ? proj.nome : 'projeto').replace(/\s+/g, '_')}.pdf`);
  } catch (e) {
    console.error(e);
    alert('Erro ao gerar PDF. Verifique se há dados suficientes no projeto.');
  }
}

// ── Abre e imprime ────────────────────────
async function gerarEImprimir(pid) {
  try {
    const doc  = await gerarConteudoPDF(pid);
    doc.autoPrint();
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');

    if (win) {
      win.onload = () => {
        setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 500);
      };
    } else {
      alert('Popup bloqueado. Permita popups neste site e tente novamente.');
    }
  } catch (e) {
    console.error(e);
    alert('Erro ao gerar PDF para impressão.');
  }
}