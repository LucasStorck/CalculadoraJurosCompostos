const form = document.getElementById('form');

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const valor_inicial = parseFloat(document.getElementById('valor_inicial').value);
  const taxa_juros = parseFloat(document.getElementById('taxa_juros').value) / 100;
  const tempo = parseFloat(document.getElementById('tempo').value);

  const montante = valor_inicial * Math.pow((1 + taxa_juros), tempo);
  const juros = montante - valor_inicial;

  document.getElementById('infos').classList.remove('hidden');

  document.getElementById('return').textContent = `Valor Final: R$ ${montante.toFixed(2).replace('.', ',')}`;
  document.getElementById('interest').textContent = `Juros Acumulados: R$ ${juros.toFixed(2).replace('.', ',')}`;
});

form.addEventListener('keypress', function (event) {
  if (event.key === 'Enter') {
    document.querySelector('button[type="submit"]').click();
  }
});