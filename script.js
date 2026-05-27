// Tabelas Salariais Oficiais 2026 obtidas através das imagens anexadas
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
  }
};

// Constantes de Benefícios e Parâmetros Fiscais Vigentes em 2026
const AUX_ALIMENTACAO = 3270.32;
const AUX_TRANSPORTE = 1254.00;
const TETO_AUX_CRECHE_INDIVIDUAL = 1765.59;
const DEDUCAO_DEP_IR = 189.59;
const TETO_INSS = 8475.55;
const ALIQUOTA_RIOPREV = 0.14;

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
  if (base <= 2428.80) return 0;
  if (base <= 2826.65) return base * 0.075 - 182.16;
  if (base <= 3751.05) return base * 0.15 - 394.16;
  if (base <= 4664.68) return base * 0.225 - 675.49;
  return base * 0.275 - 908.73;
}

function obterPercentualTrienio(quantidade) {
  if (quantidade === 0) return 0;
  // 1º triênio é 10%, os próximos somam 5% cada até o teto de 60%
  let percentual = 10 + (quantidade - 1) * 5;
  return Math.min(percentual, 60) / 100;
}

function calcular() {
  const cargo = document.getElementById("cargo").value;
  const padrao = parseInt(document.getElementById("padrao").value);
  const regime = document.getElementById("regimePrevidencia").value;
  const qtdTrienios = parseInt(document.getElementById("trieniosQuantidade").value);
  const percAQ = parseFloat(document.getElementById("adicionalQualificacao").value) / 100;
  
  const qtdFilhosCreche = parseInt(document.getElementById("filhosCreche").value) || 0;
  const dependentes = parseInt(document.getElementById("dependentes").value) || 0;
  const pensaoPerc = (parseFloat(document.getElementById("pensao").value) || 0) / 100;
  const outros = parseFloat(document.getElementById("outros").value) || 0;
  let prevCompPercentual = parseFloat(document.getElementById("prevComp").value) || 0;

  // 1. Vencimentos estruturais (Vencimento + GAJ 100% + APJ 100%)
  const vencimentoBase = tabelaVencimentos2026[cargo][padrao];
  const gaj = vencimentoBase; 
  const apj = vencimentoBase; 
  const totalBaseEsmagado = vencimentoBase + gaj + apj;

  // 2. Adicionais de Carreira (Triênio e AQ)
  const percTrienio = obterPercentualTrienio(qtdTrienios);
  const valorTrienio = totalBaseEsmagado * percTrienio;
  const adicionalQualificacao = vencimentoBase * percAQ; 

  // Remuneração Bruta Sujeita a Descontos
  const rendimentoBrutoSujeitoPrevidencia = totalBaseEsmagado + valorTrienio + adicionalQualificacao;

  // 3. Previdência (RIOPREV - 14%)
  let rjprevObrigatoria = 0;
  if (regime === "pos2013") {
    const baseCalculoPrev = Math.min(rendimentoBrutoSujeitoPrevidencia, TETO_INSS);
    rjprevObrigatoria = baseCalculoPrev * ALIQUOTA_RIOPREV;
  } else {
    rjprevObrigatoria = rendimentoBrutoSujeitoPrevidencia * ALIQUOTA_RIOPREV;
  }

  // Previdência Complementar (RJPREV)
  const basePrevComp = Math.max(0, rendimentoBrutoSujeitoPrevidencia - TETO_INSS);
  const rjprevComplementar = regime === "pos2013" ? basePrevComp * (prevCompPercentual / 100) : 0;

  // Pensão Alimentícia e Dependentes
  const pensao = (rendimentoBrutoSujeitoPrevidencia - rjprevObrigatoria) * pensaoPerc;
  const deducaoDep = dependentes * DEDUCAO_DEP_IR;

  // 4. Base e Cálculo de Imposto de Renda (IRPF)
  const baseIR = Math.max(0, rendimentoBrutoSujeitoPrevidencia - rjprevObrigatoria - rjprevComplementar - pensao - deducaoDep);
  const ir = calcularIR(baseIR);

  // Consolidação de Benefícios e Auxílios Indenizatórios (Isentos)
  const valorCrecheTotal = qtdFilhosCreche * TETO_AUX_CRECHE_INDIVIDUAL;
  const totalAuxilios = AUX_ALIMENTACAO + AUX_TRANSPORTE + valorCrecheTotal;

  // Encerramento do Cálculo Líquido
  const totalDescontosObrigatorios = rjprevObrigatoria + ir;
  const salarioLiquidoSemAuxilios = rendimentoBrutoSujeitoPrevidencia - totalDescontosObrigatorios - rjprevComplementar - pensao - outros;
  const resultadoFinalLiquidoGeral = salarioLiquidoSemAuxilios + totalAuxilios;

  // Renderização do Painel de Resultados
  document.getElementById("resultado").innerHTML = `
    <strong>Demonstrativo de Remuneração Estimada (TJRJ)</strong><br><br>

    Vencimento-Base: ${formatarMoeda(vencimentoBase)}<br>
    GAJ (100%): ${formatarMoeda(gaj)}<br>
    APJ (100%): ${formatarMoeda(apj)}<br>
    Triênio (${(percTrienio * 100).toFixed(0)}%): ${formatarMoeda(valorTrienio)}<br>
    Adicional de Qualificação (AQ): ${formatarMoeda(adicionalQualificacao)}<br>
    <span class="text-bruto">Bruto Remuneratório Geral: ${formatarMoeda(rendimentoBrutoSujeitoPrevidencia)}</span><br><br>

    <strong>Descontos e Retenções:</strong><br>
    Previdência Obrigatória (RIOPREV 14%): <span class="text-desconto">-${formatarMoeda(rjprevObrigatoria)}</span><br>
    ${regime === "pos2013" && rjprevComplementar > 0 ? `Previdência Complementar (RJPREV): <span class="text-desconto">-${formatarMoeda(rjprevComplementar)}</span><br>` : ""}
    Imposto de Renda Retido (IRPF): <span class="text-desconto">-${formatarMoeda(ir)}</span><br>
    Deduções de Dependentes informadas: +${formatarMoeda(deducaoDep)}<br>
    Pensão Alimentícia: <span class="text-desconto">-${formatarMoeda(pensao)}</span><br>
    Outros Descontos: <span class="text-desconto">-${formatarMoeda(outros)}</span><br><br>

    <strong>Benefícios e Auxílios Ganhos (Isentos):</strong><br>
    Auxílio Alimentação: ${formatarMoeda(AUX_ALIMENTACAO)}<br>
    Auxílio Transporte: ${formatarMoeda(AUX_TRANSPORTE)}<br>
    Auxílio Creche: ${formatarMoeda(valorCrecheTotal)}<br>
    <strong>Total em Auxílios Indenizados: +${formatarMoeda(totalAuxilios)}</strong><br><br>

    <hr style="border-top: 2px solid #cbd5e1;">
    <span class="text-liquido">Líquido Final na Conta: ${formatarMoeda(resultadoFinalLiquidoGeral)}</span>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  alternarRegimePrevidencia();
});
