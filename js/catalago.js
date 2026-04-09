// ═══════════════════════════════════════════
//  js/catalogo.js — Lista oficial PNAE
//  Funções do catálogo + autocomplete
// ═══════════════════════════════════════════

const CATALOGO_PNAE = [
  { nome: 'ABOBRINHA REGIONAL',                                     unidade: 'KG',   preco: 6.13  },
  { nome: 'ABACAXI (*CONFORME SAFRA)',                               unidade: 'KG',   preco: 8.22  },
  { nome: 'ALFACE REGIONAL',                                         unidade: 'KG',   preco: 9.37  },
  { nome: 'BANANA GRANDE',                                           unidade: 'KG',   preco: 9.86  },
  { nome: 'BANANA PRATA',                                            unidade: 'KG',   preco: 10.16 },
  { nome: 'BATATA DOCE (*CONFORME SAFRA)',                           unidade: 'KG',   preco: 8.05  },
  { nome: 'BEIJU DE MANDIOCA OU TAPIOCA COM CASTANHA DO PARÁ 200g', unidade: 'PCT',  preco: 10.35 },
  { nome: 'CALDO DE CANA',                                           unidade: 'PCT',  preco: 6.28  },
  { nome: 'CASTANHA DO PARÁ 200g (*CONFORME SAFRA)',                 unidade: 'PCT',  preco: 10.20 },
  { nome: 'CARÁ (*CONFORME SAFRA)',                                  unidade: 'KG',   preco: 8.50  },
  { nome: 'CHEIRO VERDE',                                            unidade: 'KG',   preco: 24.12 },
  { nome: 'COUVE',                                                   unidade: 'KG',   preco: 23.05 },
  { nome: 'COLORAL',                                                 unidade: 'PCT',  preco: 6.07  },
  { nome: 'CRUEIRA',                                                 unidade: 'KG',   preco: 10.00 },
  { nome: 'FARINHA DE MANDIOCA',                                     unidade: 'KG',   preco: 15.20 },
  { nome: 'FARINHA DE TAPIOCA',                                      unidade: 'KG',   preco: 21.32 },
  { nome: 'FEIJÃO BRANCO (*CONFORME SAFRA)',                         unidade: 'KG',   preco: 10.66 },
  { nome: 'FEIJÃO DE CORDA',                                         unidade: 'KG',   preco: 11.12 },
  { nome: 'GALINHA CAIPIRA',                                         unidade: 'KG',   preco: 32.50 },
  { nome: 'GOMA DE TAPIOCA',                                         unidade: 'KG',   preco: 12.31 },
  { nome: 'JERIMUM',                                                 unidade: 'KG',   preco: 8.05  },
  { nome: 'LARANJA REGIONAL (*CONFORME SAFRA)',                      unidade: 'KG',   preco: 8.72  },
  { nome: 'LIMÃO',                                                   unidade: 'KG',   preco: 7.05  },
  { nome: 'MACAXEIRA IN NATURA',                                     unidade: 'KG',   preco: 7.12  },
  { nome: 'MACAXEIRA MINIMAMENTE PROCESSADA',                        unidade: 'KG',   preco: 11.20 },
  { nome: 'MAMÃO',                                                   unidade: 'KG',   preco: 8.42  },
  { nome: 'MAXIXE REGIONAL',                                         unidade: 'KG',   preco: 8.35  },
  { nome: 'MELANCIA (*CONFORME SAFRA)',                              unidade: 'KG',   preco: 8.74  },
  { nome: 'MELÃO REGIONAL (*CONFORME SAFRA)',                        unidade: 'KG',   preco: 7.12  },
  { nome: 'MILHO VERDE (*CONFORME SAFRA)',                           unidade: 'KG',   preco: 7.56  },
  { nome: 'OVOS DE GALINHA CAIPIRA',                                 unidade: 'CUBA', preco: 35.00 },
  { nome: 'PEPINO REGIONAL',                                         unidade: 'KG',   preco: 8.12  },
  { nome: 'PEIXE (TAMBAQUI/TUCUNARÉ/PIRAPITINGA)',                   unidade: 'KG',   preco: 23.30 },
  { nome: 'PIMENTÃO REGIONAL',                                       unidade: 'KG',   preco: 16.70 },
  { nome: 'PIMENTA DE CHEIRO',                                       unidade: 'KG',   preco: 19.20 },
  { nome: 'PÃO CASEIRO',                                             unidade: 'UNID', preco: 2.50  },
  { nome: 'POLPA DE AÇAÍ (*CONFORME SAFRA) 500g',                    unidade: 'PCT',  preco: 16.20 },
  { nome: 'POLPA DE FRUTA SABOR ACEROLA 500g',                       unidade: 'KG',   preco: 9.20  },
  { nome: 'POLPA DE FRUTA SABOR TAPEREBÁ 500g',                      unidade: 'KG',   preco: 8.87  },
  { nome: 'PUPUNHA (*CONFORME SAFRA)',                                unidade: 'KG',   preco: 8.00  },
  { nome: 'QUIABO REGIONAL',                                         unidade: 'KG',   preco: 8.12  },
  { nome: 'TANGERINA REGIONAL (*CONFORME SAFRA)',                    unidade: 'KG',   preco: 8.66  },
  { nome: 'TOMATE REGIONAL',                                         unidade: 'KG',   preco: 10.22 },
];

// ═══════════════════════════════════════════
//  Abre o modal do catálogo
// ═══════════════════════════════════════════
function abrirCatalogo() {
  const busca = document.getElementById('cat-busca');
  if (busca) busca.value = '';
  _renderCatalogo(CATALOGO_PNAE);
  openModal('modal-catalogo');
}

// ═══════════════════════════════════════════
//  Filtra a lista dentro do modal catálogo
// ═══════════════════════════════════════════
function filtrarCatalogo(termo) {
  const t = termo.trim().toLowerCase();
  _renderCatalogo(t
    ? CATALOGO_PNAE.filter(p => p.nome.toLowerCase().includes(t))
    : CATALOGO_PNAE
  );
}

// ═══════════════════════════════════════════
//  Renderiza as linhas do catálogo
// ═══════════════════════════════════════════
function _renderCatalogo(lista) {
  const el       = document.getElementById('cat-lista');
  const contador = document.getElementById('cat-contador');
  if (!el) return;

  if (contador) contador.textContent = `${lista.length} produto(s)`;

  if (!lista.length) {
    el.innerHTML = `<div style="padding:32px;text-align:center;color:var(--muted);font-size:13px">
      Nenhum produto encontrado.
    </div>`;
    return;
  }

  el.innerHTML = lista.map((p, i) => `
    <div onclick="selecionarProdutoPNAE('${_esc(p.nome)}','${p.unidade}',${p.preco})"
      style="display:flex;align-items:center;justify-content:space-between;
             padding:11px 24px;cursor:pointer;border-bottom:1px solid var(--border);gap:12px"
      onmouseover="this.style.background='var(--green-light)'"
      onmouseout="this.style.background=''">

      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
        <span style="width:22px;height:22px;border-radius:50%;background:var(--surface2);
          border:1px solid var(--border);display:flex;align-items:center;justify-content:center;
          font-size:10px;font-weight:600;color:var(--muted);flex-shrink:0">${i + 1}</span>
        <span style="font-size:13.5px;font-weight:500">${p.nome}</span>
      </div>

      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
        <span style="background:var(--blue-light);color:var(--blue);
          font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">${p.unidade}</span>
        <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:700;
          color:var(--green-dark);min-width:64px;text-align:right">
          R$ ${p.preco.toFixed(2).replace('.', ',')}
        </span>
      </div>
    </div>
  `).join('');
}

function _esc(str) { return str.replace(/'/g, "\\'"); }

// ═══════════════════════════════════════════
//  Ao clicar num produto: preenche o modal-prod
//  e fecha o catálogo
// ═══════════════════════════════════════════
function selecionarProdutoPNAE(nome, unidade, preco) {
  document.getElementById('pr-produto').value = nome;
  document.getElementById('pr-unidade').value = unidade;
  document.getElementById('pr-preco').value   = preco.toFixed(2);

  closeModal('modal-catalogo');

  // Recalcula total se já houver quantidade
  const q = parseFloat(document.getElementById('pr-qtd').value) || 0;
  document.getElementById('pr-total').value = fmt(q * preco);

  // Foca direto na quantidade
  setTimeout(() => document.getElementById('pr-qtd').focus(), 80);
}

// ═══════════════════════════════════════════
//  Popula o <select> do modal-prod com os
//  43 produtos do catálogo
// ═══════════════════════════════════════════
function popularSelectPNAE() {
  const sel = document.getElementById('pr-select-pnae');
  if (!sel || sel.options.length > 1) return; // já populado

  CATALOGO_PNAE.forEach(p => {
    const opt    = document.createElement('option');
    opt.value    = JSON.stringify({ nome: p.nome, unidade: p.unidade, preco: p.preco });
    opt.textContent = `${p.nome}  |  ${p.unidade}  |  R$ ${p.preco.toFixed(2).replace('.', ',')}`;
    sel.appendChild(opt);
  });
}

// Chamada quando o usuário muda a opção no select
function selecionarProdutoPNAESelect(valorJSON) {
  if (!valorJSON) return;

  const p = JSON.parse(valorJSON);

  // Preenche os campos
  document.getElementById('pr-produto').value  = p.nome;
  document.getElementById('pr-unidade').value  = p.unidade;
  document.getElementById('pr-preco').value    = p.preco.toFixed(2);

  // Recalcula total se já tiver quantidade
  const q = parseFloat(document.getElementById('pr-qtd').value) || 0;
  document.getElementById('pr-total').value = fmt(q * p.preco);

  // Foca na quantidade
  setTimeout(() => document.getElementById('pr-qtd').focus(), 80);
}