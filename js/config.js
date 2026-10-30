/**
 * IMPÉRIO DAS MÁQUINAS — configuração central do site.
 *
 * Dados oficiais: logo e Instagram @imperiodasmaquinasbia.
 * Não coloque senhas, tokens ou chaves neste arquivo: ele é público no navegador.
 */
const MAQUIMINAS_CONFIG = Object.freeze({
  empresa: Object.freeze({
    nome: 'Império das Máquinas',
    nomeCurto: 'Império',
    responsavel: 'Beatriz Amaral',
    slogan: 'Máquinas para padaria',
    cidade: '',
    estado: '',
    endereco: '',
    horario: '',
    cnpj: '',
    origem: '',
    tempoMercado: '',
    linhas: Object.freeze(['Novas', 'Revisadas'])
  }),

  whatsapp: '5532984818603',
  email: '',
  telefone: '',
  instagram: 'https://www.instagram.com/imperiodasmaquinasbia/',
  instagramUsuario: '@imperiodasmaquinasbia',

  areaCliente: '',

  siteUrl: '',

  whatsappMensagemPadrao: 'Olá! Vim pelo site do Império das Máquinas e gostaria de atendimento.',

  api: Object.freeze({
    baseUrl: null,
    produtos: null,
    leads: null,
    logistica: null,
    axia: null
  }),

  catalogo: Object.freeze({
    exibirDemonstrativos: true,
    itensPorDestaque: 4
  }),

  axia: Object.freeze({
    ativo: true,
    modo: 'preview',
    nome: 'BIA',
    saudacaoAutomatica: true,
    saudacaoAtrasoMs: 2500
  }),

  /**
   * Somente o que o Instagram declara. Condições comerciais detalhadas
   * (parcelas, PIX, prazos) são informadas no atendimento.
   */
  condicoes: Object.freeze({
    linhasEquipamento: Object.freeze(['Novas', 'Revisadas']),
    garantia: true,
    melhoresCondicoes: true,
    voltagemObrigatoria: true,
    entradaPercentual: null,
    restante: '',
    pixEntrada: false,
    naoAceitaCartao: false,
    boletoAposAnaliseCadastral: false,
    contratoAntesDoBoleto: false,
    entradaNaEntrega: false,
    entradaNaEntregaRegiao: '',
    entradaNaEntregaEstados: Object.freeze([]),
    entradaNaEntregaQuando: '',
    entradaForaDoEscopo: '',
    fretePagoNoCarregamento: false,
    freteForaDoRaio: '',
    cargaPorContaDaIndustria: false,
    descargaPorContaDoComprador: false,
    acessoPorContaDoComprador: false,
    vaiMontado: false,
    desmontadoComMontadorAteKm: null,
    montagemCobradaNoOrcamento: false,
    desmontadoPerdeGarantia: false,
    garantiaNovoMeses: null,
    garantiaSemiNovoDias: null,
    assistenciaTecnicaRaioKm: null,
    regrasManuseio: Object.freeze([])
  }),

  presenca: Object.freeze({
    industria: null,
    entregaEstados: '',
    freteGratis: null
  })
});

window.MAQUIMINAS_CONFIG = MAQUIMINAS_CONFIG;
