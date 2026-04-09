// ═══════════════════════════════════════════
//  js/pdf.js — Relatório PNAE (Anexo II)
//  Seções I, II e III (Totalização)
// ═══════════════════════════════════════════

// Todas as constantes e funções internas ficam
// dentro do bloco { } para não conflitar com
// variáveis de outros arquivos (utils.js, etc.)
{
  // ── Constantes de layout ──────────────────
  const MARGIN     = 15;
  const PAGE_W     = 210;
  const CONTENT_W  = PAGE_W - MARGIN * 2;
  const BLUE       = [37,  99,  235];
  const BLUE_H     = [219, 234, 254];
  const SUBTOTAL_C = [224, 242, 254];
  const TOTAL_IV_C = [191, 219, 254];
  const GRAY_HDR   = [37, 99, 235];   // azul — título seção IV

  // ── Carrega logo (opcional) ───────────────
  async function _loadLogo() {
    try {
      const r = await fetch("img/prefeitura.png");
      if (!r.ok) return null;
      const blob = await r.blob();
      return new Promise(res => {
        const fr = new FileReader();
        fr.onloadend = () => res(fr.result);
        fr.readAsDataURL(blob);
      });
    } catch { return null; }
  }

  // ── Cabeçalho de página ───────────────────
  function _header(doc, logo, proj) {
    if (logo) doc.addImage(logo, "PNG", PAGE_W / 2 - 8, MARGIN, 16, 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BLUE);
    doc.text("ANEXO II", PAGE_W / 2, MARGIN + 24, { align: "center" });

    doc.setFontSize(9.5);
    doc.text("PROJETO DE VENDA DE GÊNEROS ALIMENTÍCIOS",  PAGE_W / 2, MARGIN + 29, { align: "center" });
    doc.text("PROGRAMA NACIONAL DE ALIMENTAÇÃO ESCOLAR",  PAGE_W / 2, MARGIN + 34, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(`Projeto: ${proj ? proj.nome : ""}`,              MARGIN,           MARGIN + 40);
    doc.text(`Data: ${proj ? parseDate(proj.data) : ""}`, PAGE_W - MARGIN,  MARGIN + 40, { align: "right" });
    doc.line(MARGIN, MARGIN + 42, PAGE_W - MARGIN, MARGIN + 42);
  }

  // ── Rodapé com numeração ──────────────────
  function _footers(doc) {
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.line(MARGIN, 285, PAGE_W - MARGIN, 285);
      doc.text(`Página ${i} de ${total}`, PAGE_W / 2, 290, { align: "center" });
      doc.setTextColor(0);
    }
  }

  // ── Agrupa produtos para Seção IV ─────────
  function _totaisPorProduto(ferns, prods) {
    const mapa = {};
    ferns.forEach(f => {
      prods.filter(p => p.fornecedorId === f.id).forEach(p => {
        const k    = p.produto.trim().toLowerCase();
        const qtd  = parseFloat(p.quantidade) || 0;
        const prco = parseFloat(p.preco)      || 0;
        if (!mapa[k]) mapa[k] = { produto: p.produto, unidade: p.unidade, quantidade: 0, totalValor: 0, totalQtd: 0 };
        mapa[k].quantidade  += qtd;
        mapa[k].totalValor  += qtd * prco;
        mapa[k].totalQtd    += qtd;
      });
    });
    return Object.values(mapa)
      .map(i => ({
        produto:    i.produto,
        unidade:    i.unidade,
        quantidade: i.quantidade,
        precoMedio: i.totalQtd > 0 ? i.totalValor / i.totalQtd : 0,
        total:      i.totalValor,
      }))
      .sort((a, b) => a.produto.localeCompare(b.produto, "pt-BR"));
  }

  // ════════════════════════════════════════
  //  GERADOR PRINCIPAL
  // ════════════════════════════════════════
  async function gerarConteudoPDF(pid) {
    const { jsPDF } = window.jspdf;
    const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const logo = await _loadLogo();

    const [projets, resps, ferns, prods] = await Promise.all([
      load("projetos"),
      load("responsaveis"),
      load("fornecedores"),
      load("produtos"),
    ]);

    const proj      = projets.find(p => p.id === pid);
    const resp      = proj   ? resps.find(r => r.id === proj.responsavelId) : null;
    const meusFerns = ferns.filter(f => f.projetoId === pid);
    const H         = doc => _header(doc, logo, proj); // atalho

    H(doc);
    let y = MARGIN + 46;

    // ══════════════════════════════════════
    //  I — IDENTIFICAÇÃO DO PROPONENTE
    //  Banco, Agência e Conta em colunas
    //  separadas, lado a lado
    // ══════════════════════════════════════
    if (resp) {
      // Linhas normais
      const bodyI = [
        ["Nome / Razão Social",  resp.nome          || ""],
        ["CNPJ",                 resp.cnpj          || ""],
        ["Endereço",             resp.endereco      || ""],
        ["Município",            resp.municipio     || ""],
        ["CEP",                  resp.cep           || ""],
        ["Telefone",             resp.telefone      || ""],
      ];

      doc.autoTable({
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        theme: "grid",
        headStyles: { fillColor: BLUE, textColor: 255, fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        head: [["I – IDENTIFICAÇÃO DO PROPONENTE", ""]],
        body: bodyI,
        columnStyles: {
          0: { cellWidth: 55, fontStyle: "bold", fillColor: BLUE_H },
          1: { cellWidth: CONTENT_W - 55 },
        },
      });

      // Linha extra: Banco | Agência | Conta — cada um em sua célula
      const yDados = doc.lastAutoTable.finalY;
      doc.autoTable({
        startY: yDados,
        margin: { left: MARGIN, right: MARGIN },
        theme: "grid",
        bodyStyles: { fontSize: 9 },
        body: [[
          { content: "Banco",                        styles: { fontStyle: "bold", fillColor: BLUE_H, cellWidth: 30 } },
          { content: resp.banco    || "",             styles: { cellWidth: 55 } },
          { content: "Agência",                      styles: { fontStyle: "bold", fillColor: BLUE_H, cellWidth: 25 } },
          { content: resp.agencia  || "",             styles: { cellWidth: 30 } },
          { content: "Conta",                        styles: { fontStyle: "bold", fillColor: BLUE_H, cellWidth: 25 } },
          { content: resp.conta    || "",             styles: { cellWidth: CONTENT_W - 165 } },
        ]],
      });

      y = doc.lastAutoTable.finalY + 6;
    }

    // ══════════════════════════════════════
    //  II — IDENTIFICAÇÃO DO AGRICULTOR
    // ══════════════════════════════════════
    let grandTotal   = 0;
    const bodyRowsII = [];

    meusFerns.forEach(f => {
      const fps = prods.filter(p => p.fornecedorId === f.id);
      if (!fps.length) return;
      let agTot = 0;

      fps.forEach((p, i) => {
        const tot  = (parseFloat(p.quantidade) || 0) * (parseFloat(p.preco) || 0);
        agTot     += tot;
        grandTotal += tot;
        bodyRowsII.push([
          i === 0 ? `${f.nome}\nCPF: ${f.cpf || "—"}   DAP: ${f.dap || "—"}` : "",
          p.produto,
          p.unidade,
          fmtN(p.quantidade),
          fmt(p.preco),
          fmt(tot),
        ]);
      });

      bodyRowsII.push([
        { content: `Subtotal — ${f.nome}`, colSpan: 5, styles: { fontStyle: "bold", fillColor: SUBTOTAL_C } },
        { content: fmt(agTot), styles: { fontStyle: "bold", fillColor: SUBTOTAL_C, halign: "right" } },
      ]);
    });

    bodyRowsII.push([
      { content: "VALOR TOTAL DO PROJETO", colSpan: 5, styles: { fontStyle: "bold", fillColor: BLUE, textColor: 255 } },
      { content: fmt(grandTotal), styles: { fontStyle: "bold", fillColor: BLUE, textColor: 255, halign: "right" } },
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      theme: "grid",
      headStyles: { fillColor: BLUE, textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8.5, valign: "middle" },
      head: [["II – IDENTIFICAÇÃO DO AGRICULTOR", "Produto", "Unidade", "Quantidade", "Preço Unit.", "Valor Total"]],
      body: bodyRowsII,
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 22, halign: "right" },
        4: { cellWidth: 22, halign: "right" },
        5: { cellWidth: 28, halign: "right" },
      },
      didDrawPage: () => H(doc),
      pageBreak: "avoid",
      showHead: "everyPage",
    });

    // ══════════════════════════════════════
    //  III — TOTALIZAÇÃO POR PRODUTO
    // ══════════════════════════════════════
    let yIV = doc.lastAutoTable.finalY + 10;
    if (yIV > 245) { doc.addPage(); H(doc); yIV = MARGIN + 46; }

    const totais     = _totaisPorProduto(meusFerns, prods);
    const bodyRowsIV = totais.map((item, idx) => [
      String(idx + 1),
      item.produto,
      item.unidade,
      fmtN(item.quantidade),
      fmt(item.precoMedio),
      fmt(item.total),
    ]);

    bodyRowsIV.push([
      { content: "", styles: { fillColor: [250, 250, 248] } },
      { content: "", styles: { fillColor: [250, 250, 248] } },
      { content: "", styles: { fillColor: [250, 250, 248] } },
      { content: "", styles: { fillColor: [250, 250, 248] } },
      { content: "Total do projeto:", styles: { fontStyle: "bold", halign: "right", fillColor: TOTAL_IV_C } },
      { content: fmt(grandTotal),      styles: { fontStyle: "bold", halign: "right", fillColor: TOTAL_IV_C } },
    ]);

    doc.autoTable({
      startY: yIV,
      margin: { left: MARGIN, right: MARGIN },
      theme: "grid",
      head: [
        [{ content: "IV – TOTALIZAÇÃO POR PRODUTO", colSpan: 6,
           styles: { halign: "center", fillColor: GRAY_HDR, textColor: 255, fontStyle: "bold", fontSize: 10 } }],
        ["", "1. Produto", "2.Unidade", "3.Quantidade", "4.Preço/Unidade", "5.Valor Total por Produto"],
      ],
      body: bodyRowsIV,
      headStyles: { fillColor: BLUE_H, textColor: [20, 50, 140], fontStyle: "bold", fontSize: 8.5 },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 10, halign: "center", textColor: [150, 150, 150] },
        1: { cellWidth: 50 },
        2: { cellWidth: 22, halign: "center" },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
        5: { cellWidth: 43, halign: "right" },
      },
      didDrawPage: () => H(doc),
      showHead: "everyPage",
    });

    _footers(doc);
    return doc;
  }

  // ── Expõe as funções publicamente ────────
  window.gerarConteudoPDF = gerarConteudoPDF;

  window.gerarPDF = async function(pid) {
    try {
      const doc   = await gerarConteudoPDF(pid);
      const projs = await load("projetos");
      const proj  = projs.find(p => p.id === pid);
      doc.save(`PNAE_${(proj ? proj.nome : "projeto").replace(/\s+/g, "_")}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF. Verifique se há dados suficientes no projeto.");
    }
  };

  window.gerarEImprimir = async function(pid) {
    try {
      const doc  = await gerarConteudoPDF(pid);
      doc.autoPrint();
      const blob = doc.output("blob");
      const url  = URL.createObjectURL(blob);
      const win  = window.open(url, "_blank");
      if (win) {
        win.onload = () => setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 500);
      } else {
        alert("Popup bloqueado. Permita popups neste site e tente novamente.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF para impressão.");
    }
  };

} // fim do bloco isolado
