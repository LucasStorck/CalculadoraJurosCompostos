const form = document.getElementById("form");
const infosSection = document.getElementById("infos");

const tipoInvestimento = document.getElementById("tipo_investimento");

// Boxes
const boxFixo = document.getElementById("box_taxa_fixa");
const boxCdi = document.getElementById("box_cdi");
const boxCdiPct = document.getElementById("box_cdi_percent");
const boxSelic = document.getElementById("box_selic");
const boxSelicExtra = document.getElementById("box_selic_extra");

// Inputs
const valorInicialInput = document.getElementById("valor_inicial");
const aporteMensalInput = document.getElementById("aporte_mensal");
const tempoInput = document.getElementById("tempo");
const tipoTempoInput = document.getElementById("tipo_tempo");

const taxaJurosInput = document.getElementById("taxa_juros");
const tipoTaxaInput = document.getElementById("tipo_taxa");
const taxaCdiInput = document.getElementById("taxa_cdi");
const percentualCdiInput = document.getElementById("percentual_cdi");
const taxaSelicInput = document.getElementById("taxa_selic");
const selicExtraInput = document.getElementById("selic_extra");

// Outputs
const grossValueOut = document.getElementById("gross-value");
const netValueOut = document.getElementById("net-value");
const taxValueOut = document.getElementById("tax-value");
const investedValueOut = document.getElementById("invested-value");

let growthChart = null;

tipoInvestimento.addEventListener("change", (e) => {
  const v = e.target.value;

  boxFixo.classList.add("hidden-input");
  boxCdi.classList.add("hidden-input");
  boxCdiPct.classList.add("hidden-input");
  boxSelic.classList.add("hidden-input");
  boxSelicExtra.classList.add("hidden-input");

  if (v === "fixo") {
    boxFixo.classList.remove("hidden-input");
  } else if (v === "cdb" || v === "lci_lca") {
    boxCdi.classList.remove("hidden-input");
    boxCdiPct.classList.remove("hidden-input");
  } else if (v === "tesouro_selic") {
    boxSelic.classList.remove("hidden-input");
    boxSelicExtra.classList.remove("hidden-input");
  }
});

function formatCurrency(element) {
  let value = element.value.replace(/\D/g, "");
  value = (value / 100).toFixed(2) + "";
  value = value.replace(".", ",");
  value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  element.value = value;
}

function formatPercent(element) {
  let value = element.value.replace(/[^\d,]/g, "");
  element.value = value;
}

valorInicialInput.addEventListener("input", () =>
  formatCurrency(valorInicialInput),
);
aporteMensalInput.addEventListener("input", () =>
  formatCurrency(aporteMensalInput),
);
taxaJurosInput.addEventListener("input", () => formatPercent(taxaJurosInput));
taxaCdiInput.addEventListener("input", () => formatPercent(taxaCdiInput));
percentualCdiInput.addEventListener("input", () =>
  formatPercent(percentualCdiInput),
);
taxaSelicInput.addEventListener("input", () => formatPercent(taxaSelicInput));
selicExtraInput.addEventListener("input", () => formatPercent(selicExtraInput));

function parseCurrency(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/\./g, "").replace(",", "."));
}

function getIRRate(months) {
  const days = months * 30;
  if (days <= 180) return 0.225;
  if (days <= 360) return 0.2;
  if (days <= 720) return 0.175;
  return 0.15;
}

function initChart(labels, principalData, grossData, netData) {
  const ctx = document.getElementById("growthChart").getContext("2d");

  if (growthChart) {
    growthChart.destroy();
  }

  growthChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Bruto",
          data: grossData,
          borderColor: "#22d3ee",
          backgroundColor: "rgba(34, 211, 238, 0.15)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: "Líquido",
          data: netData,
          borderColor: "#10b981", // green net
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Investido",
          data: principalData,
          borderColor: "#94a3b8",
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: "#f8fafc", font: { family: "Inter" } } },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(context.parsed.y);
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#94a3b8" },
          grid: { color: "rgba(255, 255, 255, 0.05)" },
        },
        y: {
          ticks: {
            color: "#94a3b8",
            callback: function (value) {
              return (
                "R$ " +
                (value >= 1000 ? (value / 1000).toFixed(1) + "k" : value)
              );
            },
          },
          grid: { color: "rgba(255, 255, 255, 0.05)" },
        },
      },
    },
  });
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const invType = tipoInvestimento.value;
  const P = parseCurrency(valorInicialInput.value);
  const PMT = parseCurrency(aporteMensalInput.value);
  let t = parseFloat(tempoInput.value);

  if (isNaN(t) || t <= 0) return alert("Por favor, informe um tempo válido.");
  if (isNaN(P)) return alert("Por preencha o valor inicial.");

  const isTimeAnnual = tipoTempoInput.value === "anos";
  const totalMonths = isTimeAnnual ? t * 12 : t;

  let annualRate = 0;

  if (invType === "fixo") {
    const rawRate = parseCurrency(taxaJurosInput.value) / 100;
    if (isNaN(rawRate)) return alert("Informe a taxa fixa validamente.");
    if (tipoTaxaInput.value === "mensal") {
      annualRate = Math.pow(1 + rawRate, 12) - 1;
    } else {
      annualRate = rawRate;
    }
  } else if (invType === "cdb" || invType === "lci_lca") {
    const cdiRate = parseCurrency(taxaCdiInput.value) / 100;
    const pctCdi = parseCurrency(percentualCdiInput.value) / 100;
    if (isNaN(cdiRate) || isNaN(pctCdi))
      return alert("Informe dados da taxa CDI.");
    annualRate = cdiRate * pctCdi;
  } else if (invType === "tesouro_selic") {
    const selicState = parseCurrency(taxaSelicInput.value) / 100;
    const selicExtra = parseCurrency(selicExtraInput.value) / 100;
    if (isNaN(selicState) || isNaN(selicExtra))
      return alert("Informe dados da taxa Selic.");
    annualRate = selicState + selicExtra;
  }

  const ratePerMonth = Math.pow(1 + annualRate, 1 / 12) - 1;
  const isExempt = invType === "lci_lca";

  let totalInvested = 0;

  let labels = [];
  let principalData = [];
  let grossData = [];
  let netData = [];

  let contributions = [];
  contributions.push({ amount: P, currentGross: P, startMonth: 0 });
  totalInvested += P;

  labels.push("Mês 0");
  principalData.push(P);
  grossData.push(P);
  netData.push(P);

  for (let i = 1; i <= totalMonths; i++) {
    let currentMonthGross = 0;
    let currentMonthNet = 0;

    for (let c of contributions) {
      c.currentGross += c.currentGross * ratePerMonth;

      const ageMonths = i - c.startMonth;
      const grossInterest = c.currentGross - c.amount;
      let netInterest = grossInterest;

      if (!isExempt) {
        const taxRate = getIRRate(ageMonths);
        netInterest = grossInterest * (1 - taxRate);
      }

      currentMonthGross += c.currentGross;
      currentMonthNet += c.amount + netInterest;
    }

    if (PMT > 0) {
      contributions.push({ amount: PMT, currentGross: PMT, startMonth: i });
      totalInvested += PMT;
      currentMonthGross += PMT;
      currentMonthNet += PMT;
    }

    if (
      totalMonths <= 120 ||
      i % Math.ceil(totalMonths / 24) === 0 ||
      i === totalMonths
    ) {
      labels.push(`Mês ${i}`);
      principalData.push(totalInvested);
      grossData.push(currentMonthGross);
      netData.push(currentMonthNet);
    }
  }

  const finalGrossValue = grossData[grossData.length - 1];
  const finalNetValue = netData[netData.length - 1];
  const totalTaxPaid = finalGrossValue - finalNetValue;

  const formatBRL = (val) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  grossValueOut.textContent = formatBRL(finalGrossValue);
  netValueOut.textContent = formatBRL(finalNetValue);
  taxValueOut.textContent = formatBRL(totalTaxPaid);
  investedValueOut.textContent = formatBRL(totalInvested);

  initChart(labels, principalData, grossData, netData);

  infosSection.classList.remove("hidden");

  if (window.innerWidth <= 768) {
    infosSection.scrollIntoView({ behavior: "smooth" });
  }
});
