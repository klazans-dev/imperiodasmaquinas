/**
 * AxiaService — contrato da futura assistente BIA.
 *
 * Nesta etapa NÃO há IA: o widget oferece atalhos e encaminhamento para um especialista.
 * Quando MAQUIMINAS_CONFIG.api.axia existir (backend próprio), `ask()` passa a enviar as
 * mensagens para lá. Chaves de modelos de IA nunca devem ficar no front-end.
 *
 * REGRA FUNDAMENTAL: a BIA nunca inventa preço, especificação, prazo, frete,
 * disponibilidade ou condição comercial. Ela responde apenas com dados oficiais
 * obtidos pelas ferramentas abaixo; sem dado cadastrado, usa FALLBACK_MESSAGE e
 * oferece transferência para um especialista mantendo o contexto (buildHandoff).
 */
(function () {
  const config = window.MAQUIMINAS_CONFIG;

  const FALLBACK_MESSAGE =
    'Não encontrei uma informação cadastrada para essa condição. Posso encaminhar você para um especialista do Império das Máquinas.';

  const RULES = Object.freeze({
    naoInventar: ['preço', 'especificação', 'prazo', 'frete', 'disponibilidade', 'condição comercial'],
    fonteDeDados: 'Somente dados oficiais (ProductService / API do ERP Callinfo / LogisticsService).',
    semInformacao: FALLBACK_MESSAGE,
    transferenciaHumana: 'Sempre disponível, mantendo o contexto do atendimento.'
  });

  /**
   * Ferramentas que o backend da BIA poderá expor ao modelo.
   * Cada uma deve consultar a fonte oficial correspondente.
   */
  const TOOLS = Object.freeze([
    { nome: 'buscarProdutos', fonte: 'ProductService.list / ERP', retorna: 'produtos, especificações, voltagens, aplicações' },
    { nome: 'detalharProduto', fonte: 'ProductService.getById / ERP', retorna: 'ficha técnica completa' },
    { nome: 'consultarPrecoEstoque', fonte: 'ERP Callinfo', retorna: 'preço, estoque, disponibilidade (somente se cadastrados)' },
    { nome: 'consultarRegrasComerciais', fonte: 'ERP Callinfo', retorna: 'condições comerciais vigentes' },
    { nome: 'consultarServicos', fonte: 'ERP Callinfo', retorna: 'montagem, desmontagem, instalação' },
    { nome: 'solicitarCotacaoFrete', fonte: 'LogisticsService', retorna: 'status da cotação, prazo e valor quando disponíveis' },
    { nome: 'registrarOrcamento', fonte: 'LeadService / ERP', retorna: 'protocolo do orçamento' },
    { nome: 'transferirParaEspecialista', fonte: 'buildHandoff', retorna: 'atendimento humano com contexto' }
  ]);

  /**
   * Estrutura de intenção que a BIA deverá extrair.
   * Ex.: "Quero uma masseira para entregar no Amazonas" ->
   * { intencao: 'compra', produto: 'masseira', destino: { uf: 'AM' },
   *   proximasInformacoes: ['capacidade', 'producao', 'voltagem', 'quantidade', 'cidade'] }
   */
  function createIntent(partial = {}) {
    return {
      intencao: null,       // 'compra' | 'duvida_tecnica' | 'frete' | 'pos_venda' | 'outro'
      produto: null,
      produtoId: null,
      destino: null,        // { cidade, uf }
      voltagem: null,
      quantidade: null,
      proximasInformacoes: [],
      ...partial
    };
  }

  /** Contexto para transferência a um vendedor. */
  function buildHandoff(context = {}) {
    const rows = [
      ['Cliente', context.cliente],
      ['Interesse', context.interesse],
      ['Destino', context.destino],
      ['Produto', context.produto],
      ['Voltagem', context.voltagem],
      ['Quantidade', context.quantidade],
      ['Status', context.status || 'Solicitou atendimento com especialista']
    ];
    return ['ATENDIMENTO VIA SITE / BIA', ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)].join('\n');
  }

  /**
   * Respostas oficiais sobre condições e políticas, montadas a partir de
   * MAQUIMINAS_CONFIG.condicoes / presenca (nunca texto livre inventado).
   */
  function policyAnswer(message) {
    const c = config.condicoes;
    if (!c) return null;
    const text = String(message || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const emp = config.empresa || {};
    const partes = [];
    if (/cnpj|quem somos|bia|beatriz|amaral|historia da empresa|instagram/.test(text)) {
      partes.push(
        `O Império das Máquinas trabalha com ${emp.slogan || 'máquinas de padaria'}. ` +
        `Instagram oficial da empresa: ${config.instagramUsuario || '@imperiodasmaquinasbia'}.`
      );
    }
    if (/pag|parcel|boleto|entrada|prazo de pag|forma de pag|condic|pix|cartao|melhor/.test(text)) {
      partes.push('As melhores condições são combinadas no atendimento. Valores, parcelas e formas de pagamento saem no orçamento.');
    }
    if (/nova|seminova|revisad|reformad|usada|semi/.test(text) && c.linhasEquipamento) {
      partes.push(`Linhas: ${c.linhasEquipamento.join(' e ')}.`);
      if (/seminova|semi[-\s]?nova|reformad/.test(text)) {
        partes.push('Seminova não é uma linha à parte: já entra no equipamento reformado, dentro de revisadas.');
      }
    }
    if (/voltag|220|380|tensao|energia/.test(text) && c.voltagemObrigatoria) {
      partes.push('Voltagem: informe se a rede é 220 V ou 380 V para o orçamento.');
    }
    if (/frete|envio|transport/.test(text)) {
      partes.push('Frete e prazos são informados no orçamento, conforme destino e equipamento.');
    }
    if (/garantia/.test(text) && c.garantia) {
      partes.push('Há garantia. O prazo e a cobertura dependem da condição do equipamento (nova ou revisada) e são confirmados no orçamento.');
    }
    if (!partes.length) return null;
    return { texto: partes.join('\n\n'), acoes: ['condicoes', 'orcamento', 'especialista'] };
  }

  function isOnline() {
    return config.axia.ativo && config.axia.modo === 'online' && Boolean(config.api.axia);
  }

  /**
   * Envia uma mensagem para a BIA. Em modo preview, retorna a resposta padrão de encaminhamento.
   * @returns {Promise<{texto: string, acoes: string[], intencao?: Object}>}
   */
  async function ask(message, history = []) {
    const policy = policyAnswer(message);
    if (policy) return policy;
    if (!isOnline()) {
      return {
        texto: 'A BIA está em fase de preparação e ainda não responde automaticamente. ' +
          'Para não passar nenhuma informação sem confirmação, vou encaminhar você para um especialista do Império das Máquinas.',
        acoes: ['especialista', 'orcamento', 'catalogo']
      };
    }
    try {
      const response = await fetch(config.api.axia, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ mensagem: message, historico: history, pagina: window.location.pathname })
      });
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    } catch (error) {
      console.error('[AxiaService]', error);
      return { texto: FALLBACK_MESSAGE, acoes: ['especialista'] };
    }
  }

  window.AxiaService = Object.freeze({ RULES, TOOLS, FALLBACK_MESSAGE, createIntent, buildHandoff, policyAnswer, isOnline, ask });
})();
