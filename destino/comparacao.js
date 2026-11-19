const formulario = document.querySelector('#comparar');
const opcoes = document.querySelector('#opcoes');
const solicitados = document.querySelector('#solicitados');
const paineis = document.querySelectorAll('[data-api]');

const formatos = {
  'json-token': { json: true, token: true },
  json: { json: true, token: false },
  'texto-token': { json: false, token: true },
};

async function testar(painel, caminho, cenario, pedido, cabecalhosSolicitados) {
  const { api, redirecionar, apiOriginal, redirecionarOriginal } = painel.dataset;
  const original = cenario === 'original' && Boolean(apiOriginal);
  const urlDireta = original ? apiOriginal : api;
  const urlRedirecionada = original ? redirecionarOriginal : redirecionar;
  const viaRedirect = caminho !== 'direto';
  const url = viaRedirect ? urlRedirecionada : urlDireta;

  const segundoSet = painel.querySelector('[data-segundo-set]');
  const listaPermitida = painel.querySelector('[data-permitidos]');
  if (segundoSet) {
    segundoSet.hidden = original;
    listaPermitida.textContent = original ? 'Content-Type' : 'X-Demo-Token';
  }

  const permitidos = listaPermitida.textContent.split(',').map(valor => valor.trim());
  const ausentes = cabecalhosSolicitados.filter(nome => !permitidos.includes(nome));
  const diferenca = painel.querySelector('[data-diferenca]');
  const resultado = painel.querySelector('[data-resultado]');
  const corpo = painel.querySelector('[data-corpo]');
  const diagnostico = painel.querySelector('[data-diagnostico]');

  painel.querySelector('[data-rota]').textContent = url;
  painel.querySelector('[data-etapa-redirect]').hidden = !viaRedirect;
  painel.querySelector('[data-destino]').textContent = urlDireta;
  diferenca.dataset.faltando = ausentes.length > 0;
  diferenca.textContent = ausentes.length
    ? `Falta ${ausentes.join(', ')} na lista permitida.`
    : 'A lista inclui todos os cabeçalhos solicitados.';
  resultado.dataset.estado = 'pendente';
  resultado.textContent = 'Enviando POST…';
  corpo.hidden = true;
  if (diagnostico) diagnostico.hidden = true;

  try {
    const resposta = await fetch(url, { ...pedido, signal: AbortSignal.timeout(8000) });
    corpo.textContent = await resposta.text();
    corpo.hidden = !corpo.textContent;
    resultado.dataset.estado = resposta.ok ? 'ok' : 'erro';
    resultado.textContent = `HTTP ${resposta.status}`;
  } catch (erro) {
    resultado.dataset.estado = 'erro';
    resultado.textContent = erro.name === 'TimeoutError' ? 'Tempo limite excedido' : 'Falha no fetch.';

    if (diagnostico && erro instanceof TypeError && ausentes.length > 0) {
      resultado.textContent = 'Bloqueio de CORS esperado';
      const redirecionamento = viaRedirect ? ` (redirected from '${new URL(url, location.origin).href}')` : '';
      diagnostico.querySelector('code').textContent =
        `Access to fetch at '${urlDireta}'${redirecionamento} from origin '${location.origin}' ` +
        `has been blocked by CORS policy: Request header field ${ausentes[0].toLowerCase()} ` +
        'is not allowed by Access-Control-Allow-Headers in preflight response.';
      diagnostico.hidden = false;
    }
  }
}

async function comparar() {
  const { caminho, cenario, formato } = formulario.elements;
  const { json, token } = formatos[formato.value];
  const headers = { 'Content-Type': json ? 'application/json' : 'text/plain' };
  const cabecalhosSolicitados = [];

  if (json) cabecalhosSolicitados.push('Content-Type');
  if (token) {
    headers['X-Demo-Token'] = 'demo';
    cabecalhosSolicitados.push('X-Demo-Token');
  }

  const body = json ? JSON.stringify({ mensagem: 'teste de CORS' }) : 'teste de CORS';
  const pedido = { method: 'POST', headers, body };
  solicitados.textContent = cabecalhosSolicitados.join(',').toLowerCase();

  opcoes.disabled = true;
  try {
    await Promise.all(Array.from(paineis, painel =>
      testar(painel, caminho.value, cenario.value, pedido, cabecalhosSolicitados)));
  } finally {
    opcoes.disabled = false;
  }
}

formulario.addEventListener('submit', evento => {
  evento.preventDefault();
  comparar();
});
formulario.addEventListener('change', comparar);
comparar();
