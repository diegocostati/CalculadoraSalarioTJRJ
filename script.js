// Tabelas Salariais Oficiais 2026 obtidas através das diretrizes do TJRJ
const tabelaVencimentos2026 = {
  tecnico: {
    1: 1895.18, 2: 1970.99, 3: 2049.81, 4: 2131.81,
    5: 2217.09, 6: 2305.78, 7: 2398.01, 8: 2493.92,
    9: 2593.68, 10: 2697.42, 11: 2805.32, 12: 2917.54,
    13: 3150.95, 14: 3403.01, 15: 3675.25, 16: 3969.26
  },
  analista: {
    1: 3121.28, 2: 3246.14, 3: 3375.98, 4: 3511.03,
    5: 3651.47, 6: 3797.51, 7: 3949.43, 8: 4107.41,
    9: 4271.71, 10: 4442.57, 11: 4620.26, 12: 4805.09,
    13: 5189.49, 14: 5604.65, 15: 6053.02, 16: 6537.27
  },
  analista_oja: {
    1: 3121.28, 2: 3246.14, 3: 3375.98, 4: 3511.03,  
    5: 3651.47, 6: 3797.51, 7: 3949.43, 8: 4107.41,  
    9: 4271.71, 10: 4442.57, 11: 4620.26, 12: 4805.09,  
    13: 5189.49, 14: 5604.65, 15: 6053.02, 16: 6537.27   
  }
};

// Tabela Oficial de Cargos em Comissão e Funções de Confiança (Anexo III - TJRJ)
const tabelaChefiaTJRJ = {
  "nenhum": 0.00,
  "cai-1": 1089.08,
  "cai-2": 2158.16,
  "cai-3": 4291.31,
  "cai-4": 4904.36,
  "cai-5": 5517.39,
  "cai-6": 6130.45,
  "dai-6": 6080.49,
  "das-6": 9828.71,
  "das-7": 10486.77,
  "das-8": 11124.80,
  "das-9": 12249.28,
  "das-10": 21700.22,
  "das-11": 25943.03,
  "dgcg": 33471.43
};

// Constantes de Benefícios e Parâmetros Fiscais Vigentes em 2026
const AUX_ALIMENTACAO = 3270.32;
const AUX_TRANSPORTE = 1254.00;
const TETO_AUX_CRECHE_INDIVIDUAL = 1765.59;
const DEDUCAO_DEP_IR = 189.59;
const TETO_INSS = 8475.55;
const ALIQUOTA_RIOPREV = 0.14;
const GRATIFICACAO_LOCALIZACAO_OJA = 3560.57;

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function alternarRegimePrevidencia() {
  const regime = document.getElementById("regimePrevidencia").value;
  const blocoPrevComp = document.getElementById("blocoPrevComp");
  const prevComp = document.getElementById("prevComp");

  if (regime === "pre2013") {
    blocoPrevComp.style.opacity = "0.5";
    prevComp.disabled = true;
    prevComp.value = 0;
  } else {
    blocoPrevComp.style.opacity = "1";
    prevComp.disabled = false;
  }
  calcular();
}

function calcularIR(base) {
  let irTradicional = 0;
  
  if (base <= 2428.80) {
    irTradicional = 0;
  } else if (base <= 2826.65) {
    irTradicional = base * 0.075 - 182.16;
  } else if (base <= 3751.05) {
    irTradicional = base * 0.15 - 394.16;
  } else if (base <= 4664.68) {
    irTradicional = base * 0.225 - 675.49;
  } else {
    irTradicional = base * 0.275 - 908.73;
  }

  // Redutores fiscais de 2026 (Isenção até R$ 5.000,00)
  if (base <= 5000.00) {
    return 0;
  } else if (base <= 7350.00) {
    let redutor = 978.62 - (0.133145 * base);
    let irFinal = irTradicional - redutor;
    return Math.max(0, irFinal);
  }

  return Math.max(0, irTradicional);
}

function obterPercentualTrienio(quantidade) {
  if (quantidade === 0) return 0;
  let percentual = 10 + (quantidade - 1) * 5;
  return Math.min(percentual, 60) / 100;
}

function calcular() {
  const cargo = document.getElementById("cargo").value;
  const padrao = parseInt(document.getElementById("padrao").value);
  const regime = document.getElementById("regimePrevidencia").value;
  const qtdTrienios = parseInt(document.getElementById("trieniosQuantidade").value);
  const percAQ = parseFloat(document.getElementById("adicionalQualificacao").value) / 100;
  
  const cargoChefiaSelecionado = document.getElementById("cargoChefia").value;
  const valorChefia = tabelaChefiaTJRJ[cargoChefiaSelecionado] || 0;

  const qtdFilhosCreche = parseInt(document.getElementById("filhosCreche").value) || 0;
  const dependentes = parseInt(document.getElementById("dependentes").value) || 0;
  const pensaoPerc = (parseFloat(document.getElementById("pensao").value) || 0) / 100;
  const outros = parseFloat(document.getElementById("outros").value) || 0;
  let prevCompPercentual = parseFloat(document.getElementById("prevComp").value) || 0;
  
  const gratificacoesExtras = parseFloat(document.getElementById("gratificacoesExtras").value) || 0;

  // 1. Vencimentos estruturais efetivos (Vencimento + GAJ 100% + APJ 100%)
  const vencimentoBase = tabelaVencimentos2026[cargo][padrao];
  const gaj = vencimentoBase; 
  const apj = vencimentoBase; 
  const totalBaseEsmagado = vencimentoBase + gaj + apj;

  // 2. Adicionais de Carreira Efetivos (Triênio e AQ sobre a base do cargo efetivo)
  const percTrienio = obterPercentualTrienio(qtdTrienios);
  const valorTrienio = totalBaseEsmagado * percTrienio;
  const adicionalQualificacao = totalBaseEsmagado * percAQ; 

  // Base do Cargo Efetivo: sofre incidência de Previdência Comum e Complementar
  const basePrevidenciariaEfetiva = totalBaseEsmagado + valorTrienio + adicionalQualificacao;

  // Salário Bruto Remuneratório Total (inclui Chefia e Gratificações Extras)
  const salarioBrutoRemuneratorio = basePrevidenciariaEfetiva + valorChefia + gratificacoesExtras;

  // 3. Previdência Social Obrigatória (RIOPREV - 14%)
  // ATENÇÃO: Chefia é transitória e NÃO entra na base de cálculo da previdência
  let rjprevObrigatoria = 0;
  if (regime === "pos2013") {
    const baseCalculoPrev = Math.min(basePrevidenciariaEfetiva, TETO_INSS);
    rjprevObrigatoria = baseCalculoPrev * ALIQUOTA_RIOPREV;
  } else {
    rjprevObrigatoria = basePrevidenciariaEfetiva * ALIQUOTA_RIOPREV;
  }

  // Previdência Complementar (RJPREV)
  // Também calculada estritamente sobre a base do cargo efetivo que exceder o teto
  const basePrevComp = Math.max(0, basePrevidenciariaEfetiva - TETO_INSS);
  const rjprevComplementar = regime === "pos2013" ? basePrevComp * (prevCompPercentual / 100) : 0;

  // Pensão Alimentícia (calculada sobre o bruto remuneratório)
  const pensao = salarioBrutoRemuneratorio * pensaoPerc;
  const deducaoDep = dependentes * DEDUCAO_DEP_IR;

  // 4. Base e Cálculo de Imposto de Renda (IRPF)
  // O Cargo de Chefia é tributável pelo IR e compõe o bruto integral
  const baseIR = Math.max(0, salarioBrutoRemuneratorio - rjprevObrigatoria - rjprevComplementar - pensao - deducaoDep);
  const ir = calcularIR(baseIR);

  // Consolidação de Benefícios e Auxílios Indenizatórios (Isentos)
  const valorCrecheTotal = qtdFilhosCreche * TETO_AUX_CRECHE_INDIVIDUAL;
  const valorOjaIndenizatorio = cargo === "analista_oja" ? GRATIFICACAO_LOCALIZACAO_OJA : 0;
  const totalAuxilios = AUX_ALIMENTACAO + AUX_TRANSPORTE + valorCrecheTotal + valorOjaIndenizatorio;

  // Encerramento do Cálculo Líquido
  const totalDescontosObrigatorios = rjprevObrigatoria + ir;
  const salarioLiquidoSemAuxilios = salarioBrutoRemuneratorio - totalDescontosObrigatorios - rjprevComplementar - pensao - outros;
  const resultadoFinalLiquidoGeral = salarioLiquidoSemAuxilios + totalAuxilios;

  // Renderização do Painel de Resultados
  document.getElementById("resultado").innerHTML = `
    <h3>Demonstrativo de Remuneração Estimada (TJRJ)</h3>
    <hr>
    
    <strong>Vantagens e Adicionais do Cargo:</strong><br>
    Vencimento-Base: ${formatarMoeda(vencimentoBase)}<br>
    GAJ (100%): ${formatarMoeda(gaj)}<br>
    APJ (100%): ${formatarMoeda(apj)}<br>
    Triênio (${(percTrienio * 100).toFixed(0)}%): ${formatarMoeda(valorTrienio)}<br>
    Adicional de Qualificação (AQ): ${formatarMoeda(adicionalQualificacao)}<br>
    ${valorChefia > 0 ? `Cargo em Comissão / Função de Chefia: <strong>+${formatarMoeda(valorChefia)}</strong><br>` : ""}
    ${gratificacoesExtras > 0 ? `Gratificações Extras: ${formatarMoeda(gratificacoesExtras)}<br>` : ""}
    <strong>Salário Bruto Remuneratório:</strong> ${formatarMoeda(salarioBrutoRemuneratorio)}<br><br>

    <strong>Previdência Social (Obrigatória):</strong><br>
    <small style="color: var(--text-muted); display: block; margin-bottom: 4px;">*Calculada sobre o cargo efetivo (${formatarMoeda(basePrevidenciariaEfetiva)}), excluindo chefias transitórias.</small>
    Previdência Obrigatória (RIOPREV 14%): <span class="text-desconto">-${formatarMoeda(rjprevObrigatoria)}</span><br><br>

    ${regime === "pos2013" && rjprevComplementar > 0 ? `
    <strong>Previdência Complementar (Opcional):</strong><br>
    Previdência Complementar (RJPREV): <span class="text-desconto">-${formatarMoeda(rjprevComplementar)}</span><br><br>
    ` : ""}

    <strong>Imposto de Renda (IRPF 2026):</strong><br>
    Deduções de Dependentes informadas: +${formatarMoeda(deducaoDep)}<br>
    Base de Cálculo do IR: ${formatarMoeda(baseIR)}<br>
    Desc. IR na Fonte (IRPF): <span class="text-desconto">-${formatarMoeda(ir)}</span><br><br>

    <strong>Outros Descontos e Retenções:</strong><br>
    Pensão Alimentícia: <span class="text-desconto">-${formatarMoeda(pensao)}</span><br>
    Outros Descontos: <span class="text-desconto">-${formatarMoeda(outros)}</span><br><br>

    <strong>Benefícios e Auxílios Ganhos (Isentos):</strong><br>
    Auxílio Alimentação: ${formatarMoeda(AUX_ALIMENTACAO)}<br>
    Auxílio Transporte: ${formatarMoeda(AUX_TRANSPORTE)}<br>
    Auxílio Creche: ${formatarMoeda(valorCrecheTotal)}<br>
    ${cargo === "analista_oja" ? `Gratificação de Locomoção (OJA): ${formatarMoeda(GRATIFICACAO_LOCALIZACAO_OJA)}<br>` : ""}
    Total em Auxílios Indenizados: +${formatarMoeda(totalAuxilios)}<br><br>

    <div style="background-color: #1e3a8a; color: white; padding: 10px; border-radius: 8px; margin-bottom: 12px; font-weight: bold;">
      Salário Bruto + Benefícios: ${formatarMoeda(salarioBrutoRemuneratorio + totalAuxilios)}
    </div>

    <strong>Salário Líquido Final:</strong> <span class="text-liquido" style="color: #10b981; font-weight: bold; font-size: 1.2em;">${formatarMoeda(resultadoFinalLiquidoGeral)}</span>
  `;
}

// Gerenciamento do Pop-up de Aviso Legal
document.addEventListener("DOMContentLoaded", () => {
  alternarRegimePrevidencia(); 

  const modal = document.getElementById("disclaimerModal");
  const btnAceitar = document.getElementById("btnAceitarDisclaimer");

  if (btnAceitar && modal) {
    btnAceitar.addEventListener("click", () => {
      modal.style.opacity = "0";
      setTimeout(() => {
        modal.style.display = "none";
      }, 300);
    });
  }
});