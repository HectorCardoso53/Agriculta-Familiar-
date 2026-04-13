// ═══════════════════════════════════════════
//  js/pdf.js — Relatório PNAE (Anexo II)
//  Seções I, II, III, IV e V
// ═══════════════════════════════════════════

{
  // ── Constantes de layout ──────────────────
  const MARGIN = 15;
  const PAGE_W = 210;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const BLUE = [37, 99, 235];
  const BLUE_H = [219, 234, 254];
  const SUBTOTAL_C = [224, 242, 254];
  const TOTAL_IV_C = [191, 219, 254];

  // ── Cabeçalho de página ───────────────────
  function _header(doc, proj) {

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // ← preto
    doc.text("ANEXO II", PAGE_W / 2, MARGIN + 24, { align: "center" });

    doc.setFontSize(9.5);
    doc.text(
      "PROJETO DE VENDA DE GÊNEROS ALIMENTÍCIOS",
      PAGE_W / 2,
      MARGIN + 29,
      { align: "center" }
    );
    doc.text(
      "PROGRAMA NACIONAL DE ALIMENTAÇÃO ESCOLAR",
      PAGE_W / 2,
      MARGIN + 34,
      { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); // ← preto
    doc.text(`Projeto: ${proj ? proj.nome : ""}`, MARGIN, MARGIN + 40);
    doc.text(
      `Data: ${proj ? parseDate(proj.data) : ""}`,
      PAGE_W - MARGIN,
      MARGIN + 40,
      { align: "right" }
    );
    doc.line(MARGIN, MARGIN + 42, PAGE_W - MARGIN, MARGIN + 42);
  }

  // ── Rodapé com numeração ──────────────────
  function _footers(doc) {
    const total = doc.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100); // ← cinza suave para rodapé
      doc.line(MARGIN, 285, PAGE_W - MARGIN, 285);
      doc.text(`Página ${i} de ${total}`, PAGE_W / 2, 290, { align: "center" });
      doc.setTextColor(0);
    }
  }

  // ── Agrupa produtos para Seção IV ─────────
  function _totaisPorProduto(ferns, prods) {
    const mapa = {};
    ferns.forEach((f) => {
      prods
        .filter((p) => p.fornecedorId === f.id)
        .forEach((p) => {
          const k = p.produto.trim().toLowerCase();
          const qtd = parseFloat(p.quantidade) || 0;
          const prco = parseFloat(p.preco) || 0;
          if (!mapa[k])
            mapa[k] = {
              produto: p.produto,
              unidade: p.unidade,
              quantidade: 0,
              totalValor: 0,
              totalQtd: 0,
            };
          mapa[k].quantidade += qtd;
          mapa[k].totalValor += qtd * prco;
          mapa[k].totalQtd += qtd;
        });
    });
    return Object.values(mapa)
      .map((i) => ({
        produto: i.produto,
        unidade: i.unidade,
        quantidade: i.quantidade,
        precoMedio: i.totalQtd > 0 ? i.totalValor / i.totalQtd : 0,
        total: i.totalValor,
      }))
      .sort((a, b) => a.produto.localeCompare(b.produto, "pt-BR"));
  }

  // ════════════════════════════════════════
  //  GERADOR PRINCIPAL
  // ════════════════════════════════════════
  async function gerarConteudoPDF(pid) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // ← Logo removida completamente

    const [projets, resps, ferns, prods] = await Promise.all([
      load("projetos"),
      load("responsaveis"),
      load("fornecedores"),
      load("produtos"),
    ]);

    const proj = projets.find((p) => p.id === pid);
    const resp = proj ? resps.find((r) => r.id === proj.responsavelId) : null;
    const meusFerns = ferns.filter((f) => f.projetoId === pid);

    // ← _header sem logo
    _header(doc, proj);
    let y = MARGIN + 46;

    // ──────────────────────────────────────
    // I – PROPONENTE
    // ──────────────────────────────────────
    if (resp) {
      const bodyI = [
        ["Nome / Razão Social", resp.nome || ""],
        ["CNPJ", resp.cnpj || ""],
        ["Endereço", resp.endereco || ""],
        ["Município", resp.municipio || ""],
        ["CEP", resp.cep || ""],
        ["Telefone", resp.telefone || ""],
      ];

      doc.autoTable({
        startY: y,
        theme: "grid",
        head: [["I – IDENTIFICAÇÃO DO PROPONENTE", ""]],
        body: bodyI,
        headStyles: { fillColor: BLUE, textColor: 255 },
        bodyStyles: { textColor: [0, 0, 0] }, // ← preto
        columnStyles: {
          0: { cellWidth: 55, fillColor: BLUE_H, fontStyle: "bold", textColor: [0, 0, 0] },
          1: { cellWidth: CONTENT_W - 55, textColor: [0, 0, 0] },
        },
      });

      const yDados = doc.lastAutoTable.finalY;

      doc.autoTable({
        startY: yDados,
        theme: "grid",
        body: [
          [
            "Banco",
            resp.banco || "",
            "Agência",
            resp.agencia || "",
            "Conta",
            resp.conta || "",
          ],
        ],
        bodyStyles: { textColor: [0, 0, 0] }, // ← preto
      });

      y = doc.lastAutoTable.finalY + 8;
    }

    // ──────────────────────────────────────
    // II – FORNECEDORES
    // ──────────────────────────────────────
    if (meusFerns.length) {
      doc.autoTable({
        startY: y,
        theme: "grid",
        head: [[{ content: "II – RELAÇÃO DE FORNECEDORES", colSpan: 6 }]],
        headStyles: { fillColor: BLUE, textColor: 255 },
        body: [],
      });

      y = doc.lastAutoTable.finalY;

      const bodyForns = meusFerns.map((f) => [
        f.nome,
        f.cpf || "—",
        f.dap || "—",
        f.banco || "—",
        f.agencia || "—",
        f.conta || "—",
      ]);

      doc.autoTable({
        startY: y,
        theme: "grid",
        head: [["Fornecedor", "CPF", "CAF", "Banco", "Agência", "Conta"]],
        body: bodyForns,
        headStyles: { fillColor: BLUE, textColor: 255 },
        bodyStyles: { textColor: [0, 0, 0] }, // ← preto
      });

      y = doc.lastAutoTable.finalY + 8;
    }

    // ──────────────────────────────────────
    // III – AGRICULTORES + PRODUTOS
    // ──────────────────────────────────────
    let grandTotal = 0;
    const bodyRows = [];

    meusFerns.forEach((f) => {
      const fps = prods.filter((p) => p.fornecedorId === f.id);
      if (!fps.length) return;

      let subtotal = 0;

      fps.forEach((p, i) => {
        const tot = (p.quantidade || 0) * (p.preco || 0);
        subtotal += tot;
        grandTotal += tot;

        bodyRows.push([
          i === 0
            ? {
                content: f.nome,
                rowSpan: fps.length,
                styles: { valign: "middle", halign: "center", textColor: [0, 0, 0] },
              }
            : undefined,
          p.produto,
          p.unidade,
          fmtN(p.quantidade),
          fmt(p.preco),
          fmt(tot),
        ].filter((c) => c !== undefined));
      });

      bodyRows.push([
        { content: `Subtotal — ${f.nome}`, colSpan: 5, styles: { fillColor: SUBTOTAL_C, fontStyle: "bold", textColor: [0, 0, 0] } },
        { content: fmt(subtotal), styles: { fillColor: SUBTOTAL_C, fontStyle: "bold", textColor: [0, 0, 0] } },
      ]);
    });

    doc.autoTable({
      startY: y,
      theme: "grid",
      head: [
        [
          "III – IDENTIFICAÇÃO DO AGRICULTOR",
          "Produto",
          "Unidade",
          "Qtd",
          "Preço",
          "Total",
        ],
      ],
      body: bodyRows,
      headStyles: { fillColor: BLUE, textColor: 255 },
      bodyStyles: { textColor: [0, 0, 0] }, // ← preto
      columnStyles: {
        0: { cellWidth: 45, valign: "middle", halign: "center" },
        1: { cellWidth: 55 },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 18, halign: "right" },
        4: { cellWidth: 22, halign: "right" },
        5: { cellWidth: 22, halign: "right" },
      },
    });

    // ──────────────────────────────────────
    // IV – TOTALIZAÇÃO
    // ──────────────────────────────────────
    const yIV = doc.lastAutoTable.finalY + 10;
    const totais = _totaisPorProduto(meusFerns, prods);

    doc.autoTable({
      startY: yIV,
      theme: "grid",
      head: [["IV – TOTALIZAÇÃO POR PRODUTO", "", "", "", "", ""]],
      body: totais.map((t, i) => [
        i + 1,
        t.produto,
        t.unidade,
        fmtN(t.quantidade),
        fmt(t.precoMedio),
        fmt(t.total),
      ]),
      headStyles: { fillColor: BLUE, textColor: 255 },
      bodyStyles: { textColor: [0, 0, 0] }, // ← preto
    });

    // ──────────────────────────────────────
    // V – IDENTIFICAÇÃO DA ENTIDADE EXECUTORA
    // ──────────────────────────────────────
    const yV = doc.lastAutoTable.finalY + 10;

    doc.autoTable({
      startY: yV,
      theme: "grid",
      head: [[{
        content: "V – IDENTIFICAÇÃO DA ENTIDADE EXECUTORA DO PNAE/FNDE/MEC",
        colSpan: 3,
      }]],
      headStyles: { fillColor: BLUE, textColor: 255, halign: "center" },
      body: [
        [
          {
            content: "1. Nome da Entidade:\nMUNICÍPIO DE ORIXIMINÁ/PA –\nSECRETARIA MUNICIPAL DE EDUCAÇÃO",
            styles: { cellWidth: 90, textColor: [0, 0, 0] },
          },
          {
            content: "2. CNPJ\n06.102.908/0001-92",
            styles: { cellWidth: 50, halign: "center", textColor: [0, 0, 0] },
          },
          {
            content: "3. Município\nOriximiná/PA",
            styles: { cellWidth: 50, halign: "center", textColor: [0, 0, 0] },
          },
        ],
        [{ content: "4. Endereço: Travessa Carlos Maria Teixeira, nº 785", colSpan: 3, styles: { textColor: [0, 0, 0] } }],
        [{ content: "6. Nome do representante: Ivana Maria Pereira de Souza – Secretária Municipal de Educação.", colSpan: 3, styles: { textColor: [0, 0, 0] } }],
      ],
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 50 },
        2: { cellWidth: 50 },
      },
    });

    _footers(doc);
    return doc;
  } // ← fecha gerarConteudoPDF

  // ── Expõe as funções publicamente ────────
  window.gerarConteudoPDF = gerarConteudoPDF;

  window.gerarPDF = async function (pid) {
    try {
      const doc = await gerarConteudoPDF(pid);
      const projs = await load("projetos");
      const proj = projs.find((p) => p.id === pid);
      doc.save(
        `PNAE_${(proj ? proj.nome : "projeto").replace(/\s+/g, "_")}.pdf`
      );
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF. Verifique se há dados suficientes no projeto.");
    }
  };

  window.gerarEImprimir = async function (pid) {
    try {
      const doc = await gerarConteudoPDF(pid);
      doc.autoPrint();
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.onload = () =>
          setTimeout(() => {
            win.print();
            URL.revokeObjectURL(url);
          }, 500);
      } else {
        alert("Popup bloqueado. Permita popups neste site e tente novamente.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF para impressão.");
    }
  };
} // ← fecha o bloco isolado