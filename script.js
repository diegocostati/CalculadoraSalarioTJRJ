// Tabelas de vencimentos oficiais extraídas das imagens fornecidas pelo usuário
const tabelaVencimentos = {
  tecnico: {
    1: 3737.01, 2: 3867.82, 3: 4003.19, 4: 4143.30,
    5: 4350.47, 6: 4502.74, 7: 4660.33, 8: 4823.43,
    9: 5064.61, 10: 5241.87, 11: 5425.35, 12: 5615.22
  },
  analista: {
    1: 6131.17, 2: 6345.77, 3: 6567.85, 4: 6797.75,
    5: 7137.64, 6: 7387.46, 7: 7646.03, 8: 7913.63,
    9: 8309.32, 10: 8600.14, 11: 8901.13, 12: 9212.68
  }
};

// Constantes de Benefícios do TJRJ e Parâmetros Tributários Nacionais/Estaduais
const AUX_ALIMENTACAO = 1710.00;
const AUX_LOCOMOCAO = 580.80; 
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

function calcular() {
  const cargo = document.getElementById("cargo").value;
  const padrao = parseInt(document.getElementById("padrao").value);
  const regime = document.getElementById("regimePrevidencia").value;
  const percAQ = parseFloat(document.getElementById("adicionalQualificacao").value) / 100;
  
  const valorSaude = parseFloat(document.getElementById("auxilioSaudeFaixa").value) || 0;
  const valorCreche = (parseInt(document.getElementById("filhosCreche").value) || 0) * 1141.00;
  
  const dependentes = parseInt(document.getElementById("dependentes").value) || 0;
  const pensaoPerc = (parseFloat(document.getElementById("pensao").value) || 0) / 100;
  const outros = parseFloat(document.getElementById("outros").value) || 0;
  let prevCompPercentual = parseFloat(document.getElementById("prevComp").value) || 0;

  // 1. Puxa os dados salariais base conforme a imagem enviada
  const vencimentoBase = tabelaVencimentos[cargo][padrao];
  const gaj = vencimentoBase; // No TJRJ a GAJ equivale a 100% estável do base
  
  // 2. Calcula o Adicional de Qualificação (incide apenas sobre o Vencimento-Base)
  const adicionalQualificacao = vencimentoBase * percAQ;

  // Bruto Remuneratório Sujeito a Descontos Previdenciários
  const rendimentoBrutoSujeitoPrevidencia = vencimentoBase + gaj + adicionalQualificacao;

  // 3. Cálculo de Previdência (RIOPREV - 14%)
  let rjprevObrigatoria = 0;
  if (regime === "pos2013") {
    // Servidores que entraram pós-reforma têm desconto limitado ao teto do INSS
    const baseCalculoPrev = Math.min(rendimentoBrutoSujeitoPrevidencia, TETO_INSS);
    rjprevObrigatoria = baseCalculoPrev * ALIQUOTA_RIOPREV;
  } else {
    // Servidores antigos contribuem sobre a totalidade da remuneração em 14%
    rjprevObrigatoria = rendimentoBrutoSujeitoPrevidencia * ALIQUOTA_RIOPREV;
  }

  // Previdência Complementar (RJPREV)
  const basePrevComp = Math.max(0, rendimentoBrutoSujeitoPrevidencia - TETO_INSS);
  const rjprevComplementar = regime === "pos2013" ? basePrevComp * (prevCompPercentual / 100) : 0;

  // Pensão Alimentícia calculada sobre a base líquida clássica (Bruto - Previdência)
  const pensao = (rendimentoBrutoSujeitoPrevidencia - rjprevObrigatoria) * pensaoPerc;
  const deducaoDep = dependentes * DEDUCAO_DEP_IR;

  // 4. Cálculo do Imposto de Renda (IRPF)
  const baseIR = Math.max(0, rendimentoBrutoSujeitoPrevidencia - rjprevObrigatoria - rjprevComplementar - pensao - deducaoDep);
  const ir = calcularIR(baseIR);

  // Somatório Geral de Auxílios Indenizatórios (Isentos de impostos)
  const totalAuxilios = AUX_ALIMENTACAO + AUX_LOCOMOCAO + valorSaude + valorCreche;

  // Fechamento das contas
  const totalDescontosObrigatorios = rjprevObrigatoria + ir;
  const salarioLiquidoSemAuxilios = rendimentoBrutoSujeitoPrevidencia - totalDescontosObrigatorios - rjprevComplementar - pensao - outros;
  const resultadoFinalLiquidoGeral = salarioLiquidoSemAuxilios + totalAuxilios;

  // Renderização final na interface
  document.getElementById("resultado").innerHTML = `
    <strong>Resultado da Simulação (TJRJ)</strong><br><br>

    Vencimento-Base: ${formatarMoeda(vencimentoBase)}<br>
    GAJ (100%): ${formatarMoeda(gaj)}<br>
    Adicional de Qualificação (AQ): ${formatarMoeda(adicionalQualificacao)}<br>
    <span style="color: #1e40af;"><strong>Bruto Remuneratório: ${formatarMoeda(rendimentoBrutoSujeitoPrevidencia)}</strong></span><br><br>

    <strong>Descontos Retidos:</strong><br>
    Previdência Obrigatória (RIOPREV 14%): ${formatarMoeda(rjprevObrigatoria)}<br>
    ${regime === "pos2013" && prevCompPercentual > 0 ? `Previdência Complementar (RJPREV): ${formatarMoeda(rjprevComplementar)}<br>` : ""}
    Imposto de Renda Retido (IRPF): ${formatarMoeda(ir)}<br>
    Dedução de dependentes aplicada: -${formatarMoeda(deducaoDep)}<br>
    Pensão Alimentícia: ${formatarMoeda(pensao)}<br>
    Outros Descontos: ${formatarMoeda(outros)}<br><br>

    <strong>Benefícios e Auxílios Adicionais (Isentos):</strong><br>
    Auxílio Alimentação: ${formatarMoeda(AUX_ALIMENTACAO)}<br>
    Auxílio Locomoção (Estimado): ${formatarMoeda(AUX_LOCOMOCAO)}<br>
    Auxílio Saúde: ${formatarMoeda(valorSaude)}<br>
    Auxílio Creche/Educação: ${formatarMoeda(valorCreche)}<br>
    <strong>Total Recebido em Auxílios: +${formatarMoeda(totalAuxilios)}</strong><br><br>

    <hr style="border-top: 2px solid #cbd5e1;">
    <h3 style="margin: 8px 0 0; font-size: 18px; color: #111827;">
      Líquido Final na Conta: <span style="color: #15803d;">${formatarMoeda(resultadoFinalLiquidoGeral)}</span>
    </h3>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  alternarRegimePrevidencia();
});
