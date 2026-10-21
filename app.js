/* Espelhos de Vendas 3.0 · Fortal (base: App do Corretor 2.2.2)
   Lê os espelhos ao vivo (Supabase do app dos Espelhos) com o código do time.
   Telas: Início, Imóveis (filtro completo por projeto ou por unidade), Pregão, Ficha do projeto,
   Tabelas, Posts e envio ao cliente. Layout de celular (barra embaixo) e de computador (barra lateral). */
'use strict';
(() => {
  // ================= configuração =================
  const CFG = {url: 'https://dptchfjbotmddaniuzvr.supabase.co', key: 'sb_publishable_K9--vOhW8y5ldlbwzo6m_Q_g_gB9rYP', vapid: 'BI8mWAmkgfYL1lUm7gPdQ3JYK-YmFS_drWs7PfvbsU50oBFJKtbULXwWKp3BSE0cnWyAeBBIlXErynB_oQ6QmZo'};
  const NO_AR = location.hostname === 'luizmiguel08.github.io';
  const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);   // teste local: espelho copiado em /espelhos/
  const ESP = (NO_AR || LOCAL) ? '/espelhos/' : 'https://luizmiguel08.github.io/espelhos/';
  const FN_FOTO = CFG.url + '/functions/v1/corretor-foto';
  const VERSAO = '3.0.0, de 17/10/2026';
  const K = {cod: 'espelhos-codigo', cor: 'espelhos-corretor', dono: 'espelhos-dono', cache: 'corretor-resumo-v2', tema: 'corretor-tema', filtro: 'corretor-filtro-v2'};
  const TZ = 'America/Sao_Paulo';
  const MQ_LARGO = matchMedia('(min-width: 1024px)');
  const largo = () => MQ_LARGO.matches;
  const MQ_TABELA = matchMedia('(min-width: 1320px)');   // tabela de 11 colunas do projeto: só com espaço para ela inteira
  const tabelaLarga = () => MQ_TABELA.matches;
  const ehToque = () => matchMedia('(hover: none) and (pointer: coarse)').matches;
  const menosMov = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ================= utilidades =================
  const LS = {
    get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
    set(k, v){ try{ localStorage.setItem(k, v); return true; }catch(e){ return false; } },
    del(k){ try{ localStorage.removeItem(k); }catch(e){} }
  };
  const SS = {
    get(k){ try{ return JSON.parse(sessionStorage.getItem(k) || 'null'); }catch(e){ return null; } },
    set(k, v){ try{ sessionStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const num = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
  const BRL = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const BRLc = v => v >= 1e6 ? 'R$ ' + (Math.round(v / 1e4) / 100).toLocaleString('pt-BR') + ' mi' : 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  const BRLmi = v => {
    if(!(v > 0)) return 'R$ 0';
    if(v >= 1e7) return 'R$ ' + Math.round(v / 1e6).toLocaleString('pt-BR') + ' mi';
    if(v >= 1e6) return 'R$ ' + (Math.round(v / 1e5) / 10).toLocaleString('pt-BR') + ' mi';
    return 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  };
  const milTxt = v => v >= 1e6 ? (Math.round(v / 1e5) / 10).toLocaleString('pt-BR') + ' mi' : Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  const fmtM2 = v => (Number.isInteger(+v) ? String(+v) : (+v).toLocaleString('pt-BR', {maximumFractionDigits: 2})) + ' m²';
  const pct = (a, b) => b > 0 ? Math.round(a / b * 1000) / 10 : 0;
  const pctTxt = v => v.toLocaleString('pt-BR', {maximumFractionDigits: 1}) + '%';
  const plural = (n, um, varios) => n.toLocaleString('pt-BR') + ' ' + (n === 1 ? um : varios);
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MES3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const fH = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, hour: '2-digit', minute: '2-digit'});
  const fDia = new Intl.DateTimeFormat('en-CA', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'});
  const fDM = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, day: '2-digit', month: '2-digit'});
  const fDMA = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric'});
  const fLonga = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long'});
  const fSem = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, weekday: 'short'});
  const fHoraNum = new Intl.DateTimeFormat('en-GB', {timeZone: TZ, hour: '2-digit', hour12: false});
  const hora = ms => fH.format(ms);
  const diaKey = ms => fDia.format(ms);
  const maiusc1 = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const quandoTxt = ms => {
    if(!isFinite(ms)) return '';
    const d = diaKey(ms), h = diaKey(Date.now()), o = diaKey(Date.now() - 864e5);
    return d === h ? hora(ms) : d === o ? 'ontem ' + hora(ms) : fDM.format(ms) + ' ' + hora(ms);
  };
  const mesAno = ym => { if(!ym || !/^\d{4}-\d{2}/.test(ym)) return null; return MESES[+ym.slice(5, 7) - 1] + ' de ' + ym.slice(0, 4); };
  const mesAnoCurto = ymd => { if(!ymd || !/^\d{4}-\d{2}/.test(ymd)) return ''; return MES3[+ymd.slice(5, 7) - 1] + '/' + ymd.slice(0, 4); };
  const primeiroNome = s => String(s || '').trim().split(/\s+/)[0] || '';
  const urlImg = u => { if(!u) return null; u = String(u); if(/^https:\/\//i.test(u)) return u; if(/^nex\/[A-Za-z0-9/_.-]+$/.test(u)) return ESP + u; return null; };
  const urlSegura = u => /^https:\/\//i.test(String(u || '')) ? String(u) : null;
  const driveArq = id => 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view';
  const drivePasta = id => 'https://drive.google.com/drive/folders/' + encodeURIComponent(id);
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'arquivo';
  const distKm = (a, b) => {
    const R = 6371, rad = x => x * Math.PI / 180;
    const dLa = rad(b.lat - a.lat), dLo = rad(b.lng - a.lng);
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const kmTxt = d => d < 1 ? Math.round(d * 1000 / 50) * 50 + ' m' : (Math.round(d * 10) / 10).toLocaleString('pt-BR') + ' km';

  const svg = (d, sw) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  const ICO = {
    voltar: svg('<path d="M15 18l-6-6 6-6"/>', 2),
    seta: svg('<path d="M9 6l6 6-6 6"/>', 2),
    baixo: svg('<path d="M6 9l6 6 6-6"/>', 2),
    lupa: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    filtro: svg('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>', 1.9),
    enviar: svg('<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>', 2),
    fechar: svg('<path d="M6 6l12 12M18 6L6 18"/>', 2),
    x: '<svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    ok: svg('<path d="M5 12l5 5 9-10"/>', 3),
    zap: svg('<path d="M4 20l1.4-4.2A8 8 0 1 1 8.6 19z"/>', 1.9),
    nuvem: svg('<path d="M2 8.5a16 16 0 0 1 20 0"/><path d="M5.5 12a11 11 0 0 1 13 0"/><path d="M9 15.5a6 6 0 0 1 6 0"/><path d="M3 3l18 18"/>'),
    foto: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/>'),
    fotos: svg('<rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 21h12a2 2 0 0 0 2-2V7"/><path d="M3 13l4-4 4 4 3-3 3 3"/>'),
    baixar: svg('<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>', 2),
    compartilhar: svg('<path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/>', 1.9),
    copiar: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>', 1.9),
    arquivo: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>'),
    planilha: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>'),
    mira: svg('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
    pino: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    grade: svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
    lista: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
    ampliar: svg('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
    anterior: svg('<path d="M15 18l-6-6 6-6"/>', 2.2),
    proxima: svg('<path d="M9 6l6 6-6 6"/>', 2.2),
    relogio: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 1.9),
    imprimir: svg('<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>')
  };

  const GRUPOS = {
    one: {n: 'ONE', l: 'ONE Innovation', s: 'ONE'}, vitacon: {n: 'Vitacon', l: 'Vitacon', s: 'VTC'}, maskan: {n: 'Maskan', l: 'Maskan', s: 'MSK'},
    trisul: {n: 'Trisul', l: 'Trisul', s: 'TRI'}, canopus: {n: 'Canopus', l: 'Canopus', s: 'CNP'}, vitaurbana: {n: 'VitaUrbana', l: 'VitaUrbana', s: 'VU'},
    jra: {n: 'JRA', l: 'JRA', s: 'JRA'}, revenda: {n: 'Revenda ONE', l: 'Revenda ONE', s: 'REV'}, mundoapto: {n: 'Mundo Apto', l: 'Mundo Apto', s: 'MA'}
  };
  const ORDEM_GRUPOS = ['one', 'vitacon', 'maskan', 'trisul', 'canopus', 'vitaurbana', 'mundoapto', 'jra', 'revenda'];
  const nomeGrupo = k => GRUPOS[k] ? GRUPOS[k].n : ((S.P.find(p => p.grupo === k) || {}).construtora || k);
  const gruposPresentes = () => { const ks = new Set(S.P.map(p => p.grupo).filter(Boolean)); return ORDEM_GRUPOS.filter(k => ks.has(k)).concat([...ks].filter(k => !ORDEM_GRUPOS.includes(k)).sort()); };
  const FASE = {lanc: 'Lançamento', breve: 'Breve lançamento', obras: 'Em obras', pronto: 'Pronto para morar'};
  const FASE_CURTA = {lanc: 'Lançamento', breve: 'Breve', obras: 'Em obras', pronto: 'Pronto'};
  const ZONA = {centro: 'Centro', oeste: 'Oeste', sul: 'Sul', leste: 'Leste', norte: 'Norte', gsp: 'Grande SP'};
  const TIPOS = [['S', 'Studio'], ['1', '1 dorm.'], ['2', '2 dorms'], ['3', '3 dorms ou +'], ['L', 'Loja']];
  const CATS = [['R', 'Mercado (R2V)'], ['H1', 'HIS 1'], ['H2', 'HIS 2'], ['H', 'HIS'], ['P', 'HMP'], ['N', 'Não residencial']];
  const CAT_TXT = {R: 'R2V', H1: 'HIS 1', H2: 'HIS 2', H: 'HIS', P: 'HMP', N: 'NR', F: 'Fachada ativa'};
  const EXTRAS = [['mob', 'Mobiliado', 1], ['pcd', 'PCD / adaptável', 2], ['gd', 'Garden', 4], ['cob', 'Cobertura ou duplex', 32], ['promo', 'Em promoção', 16], ['dist', 'Distrato', 8]];
  const BIT = Object.fromEntries(EXTRAS.map(x => [x[0], x[2]]));
  const quemDe = p => p.construtora || (GRUPOS[p.grupo] ? GRUPOS[p.grupo].l : '');
  const siglaDe = p => GRUPOS[p.grupo] ? GRUPOS[p.grupo].s : String(p.nome || '?').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
  const nomeCurto = p => p.curto || p.nome;
  const NOS_B = /^(jardins|campos el[ií]seos)$/i;
  const NA_B = /^(vila|bela vista|consola|liberdade|mooca|lapa|penha|aclima|barra funda|sa[uú]de|[aá]gua branca|rep[uú]blica|s[eé]$|luz|ch[aá]cara|granja|cidade|pra[cç]a|aldeia)/i;
  const EM_B = /^(mirand[oó]polis|perdizes|pinheiros|moema|higien[oó]polis|santana|campos el[ií]seos|pomp[eé]ia|indian[oó]polis|interlagos|santa cec[ií]lia|santo amaro|alphaville|osasco|guarulhos|barueri|cotia|cerqueira c[eé]sar|parelheiros|guaianases|itaquera|sapopemba|campinas|sorocaba)/i;
  const noBairro = b => b ? (NOS_B.test(b) ? 'nos ' : NA_B.test(b) ? 'na ' : EM_B.test(b) ? 'em ' : 'no ') + b : '';
  const entregaTxt = p => p.fase === 'pronto' ? 'pronto para morar' : (mesAno(p.entrega) ? 'entrega em ' + mesAno(p.entrega) : 'entrega a definir');
  const entregaCurta = p => p.fase === 'pronto' ? 'Pronto' : (p.entrega ? mesAnoCurto(p.entrega) : 'A definir');
  function tiposTxt(t, amin, amax){
    t = t || ''; const partes = [];
    if(t.includes('S')) partes.push('studios');
    if(t.includes('1')) partes.push('1 dorm.');
    if(t.includes('2')) partes.push('2 dorms');
    if(t.includes('3')) partes.push('3 dorms ou +');
    if(!partes.length && t.includes('L')) partes.push('lojas');
    let txt = partes.length ? (partes.length === 1 ? partes[0] : partes.slice(0, -1).join(', ') + ' e ' + partes[partes.length - 1]) : '';
    if(amin && amax) txt += (txt ? ' de ' : '') + (Math.round(amin) === Math.round(amax) ? fmtM2(Math.round(amin)) : Math.round(amin) + ' a ' + fmtM2(Math.round(amax)));
    return maiusc1(txt);
  }
  const tipoNome = k => ({S: 'Studio', 1: '1 dorm.', 2: '2 dorms', 3: '3 dorms ou +', L: 'Loja'}[k] || '');

  // ================= estado =================
  const F0 = () => ({q: '', cons: [], fases: [], zonas: [], bairros: [], pmin: 0, pmax: 0, modo: 'pp', tipos: [], amin: 0, amax: 0, m2: 0, andar: 0, vaga: 0, ent: '', cats: [], extras: [], mov: '', perto: null, be: 0, bm: 0, bf: 0, livres: true, ordem: 'vendidos', ver: 'projetos', mostra: 12});
  const S = {
    cod: LS.get(K.cod), carregado: false, offline: false, carregando: null, resumo: null, geradoEm: 0,
    P: [], byId: new Map(), M: [], dias7: [], hoje: '', U: null, Uem: 0, Ucarregando: null, Uerro: false,
    det: new Map(), central: new Map(), centralV: new Map(), sel: new Map(),
    f: Object.assign(F0(), SS.get(K.filtro) || {}),
    ui: {rank: 'vendas', feed: 'tudo', feedMostra: 14, tabModo: {}, tabFiltro: 'livres', tabSel: new Map(), tabAberta: null, tabQ: '', tabTipo: '', listaQ: '', bairroQ: '', unidMostra: 40,
      tabVista: LS.get('corretor-tab-vista') === 'lista' ? 'lista' : 'espelho', espDenso: LS.get('corretor-esp-denso') === '1', espPreco: true, ef: null, efMais: false},
    scroll: {}
  };
  if(S.f.perto && !(S.f.perto.lat && S.f.perto.lng)) S.f.perto = null;
  const perfil = () => { try{ return JSON.parse(LS.get(K.cor) || '{}') || {}; }catch(e){ return {}; } };
  const salvarPerfil = o => LS.set(K.cor, JSON.stringify(Object.assign(perfil(), o || {})));
  function dono(){   // mesmo identificador do app dos Espelhos: os links criados aqui aparecem em "Enviadas" lá
    let d = LS.get(K.dono);
    if(!d || !/^[A-Za-z0-9_-]{16,64}$/.test(d)){
      const a = new Uint8Array(12); crypto.getRandomValues(a);
      d = btoa(String.fromCharCode.apply(null, a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      LS.set(K.dono, d);
    }
    return d;
  }

  // ================= servidor =================
  async function rpc(fn, args, ms){
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctl ? setTimeout(() => ctl.abort(), ms || 25000) : null;
    try{
      const r = await fetch(CFG.url + '/rest/v1/rpc/' + fn, {method: 'POST', headers: {apikey: CFG.key, 'Content-Type': 'application/json'}, body: JSON.stringify(args || {}), cache: 'no-store', signal: ctl ? ctl.signal : undefined});
      const txt = await r.text();
      if(!r.ok){ const e = new Error('rpc ' + fn + ' ' + r.status); e.status = r.status; e.body = txt; throw e; }
      return txt ? JSON.parse(txt) : null;
    }finally{ if(t) clearTimeout(t); }
  }
  const codigoInvalido = e => !!(e && e.body && /codigo_invalido/.test(e.body));

  function aplicarResumo(r){
    const cp = r.campos_p || [], cm = r.campos_m || [];
    const ip = Object.fromEntries(cp.map((k, i) => [k, i])), im = Object.fromEntries(cm.map((k, i) => [k, i]));
    const g = (a, k) => ip[k] == null ? null : a[ip[k]];
    S.P = (r.p || []).map(a => ({
      id: g(a, 'id'), nome: g(a, 'nome') || g(a, 'id'), grupo: g(a, 'grupo'), construtora: g(a, 'construtora'), bairro: g(a, 'bairro'), zona: g(a, 'zona'),
      fase: g(a, 'fase'), entrega: g(a, 'entrega'), livres: +g(a, 'livres') || 0, reservadas: +g(a, 'reservadas') || 0, processo: +g(a, 'processo') || 0,
      vendidas: +g(a, 'vendidas') || 0, total: +g(a, 'total') || 0, preco: num(g(a, 'preco')), avista: num(g(a, 'avista')), tipos: g(a, 'tipos') || '',
      amin: num(g(a, 'area_min')), amax: num(g(a, 'area_max')), capa: urlImg(g(a, 'capa')), destaque: g(a, 'destaque'), tabela: g(a, 'tabela'),
      tabelaEm: g(a, 'tabela_em'), faseTxt: g(a, 'fase_txt'), curto: g(a, 'curto'), endereco: g(a, 'endereco'), atualizadoEm: g(a, 'atualizado_em'),
      lat: num(g(a, 'lat')), lng: num(g(a, 'lng')), cidade: g(a, 'cidade'), vaga: g(a, 'vaga'), pm2: num(g(a, 'pm2')),
      cats: String(g(a, 'cats') || '').split(',').filter(Boolean), flags: g(a, 'flags') || '', nFotos: +g(a, 'n_fotos') || 0,
      v7: 0, r7: 0, p7: 0, vh: 0, rh: 0
    })).filter(p => p.id);
    S.byId = new Map(S.P.map(p => [p.id, p]));
    const gm = (a, k) => im[k] == null ? null : a[im[k]];
    S.M = (r.m || []).map(a => {
      const para = gm(a, 'para');
      return {p: gm(a, 'projeto'), n: String(gm(a, 'n')), de: gm(a, 'de'), para, em: (+gm(a, 'em') || 0) * 1000, preco: num(gm(a, 'preco')), area: num(gm(a, 'area')), tl: gm(a, 'tipologia'), agora: gm(a, 'agora'),
        tipo: para === 'vendida' ? 'venda' : para === 'reservada' ? 'reserva' : para === 'processo_final' ? 'processo' : para === 'disponivel' ? 'voltou' : 'outro'};
    }).filter(m => S.byId.has(m.p)).sort((x, y) => y.em - x.em);
    S.hoje = diaKey(Date.now());
    S.dias7 = []; for(let i = 6; i >= 0; i--) S.dias7.push(diaKey(Date.now() - i * 864e5));
    const set7 = new Set(S.dias7);
    for(const m of S.M){
      m.dia = diaKey(m.em);
      const p = S.byId.get(m.p);
      if(set7.has(m.dia)){ if(m.tipo === 'venda') p.v7++; else if(m.tipo === 'reserva') p.r7++; else if(m.tipo === 'processo') p.p7++; }
      if(m.dia === S.hoje){ if(m.tipo === 'venda') p.vh++; else if(m.tipo === 'reserva') p.rh++; }
    }
    S.resumo = r; S.geradoEm = Date.parse(r.gerado_em) || Date.now();
    const robo = r.robo || {}; let mx = 0; for(const k in robo){ const t = Date.parse(robo[k]); if(t > mx) mx = t; }
    S.lidoEm = mx || S.geradoEm;
    S.carregado = true;
    // unidades marcadas que saíram do espelho
    for(const [k, v] of S.sel){ if(!S.byId.has(v.p)) S.sel.delete(k); }
  }

  async function carregar(motivo){
    if(!S.cod) return;
    if(S.carregando) return S.carregando;
    S.carregando = (async () => {
      const antes = S.carregado ? assinatura() : null;
      try{
        const r = await rpc('corretor_resumo', {p_codigo: S.cod});
        aplicarResumo(r); S.offline = false; S.cacheEm = 0;
        LS.set(K.cache, JSON.stringify({em: Date.now(), r}));
        const mudou = antes === null || assinatura() !== antes;
        if(motivo === 'auto'){ if(mudou) refrescar(); }
        else if(antes === null || rotaAtual === null) render();
        else if(mudou) refrescar();
        if(!S.U || (mudou && Date.now() - S.Uem > 120000)) setTimeout(() => carregarUnidades(), S.U ? 0 : 900);
      }catch(e){
        if(codigoInvalido(e)){ sair('Esse código não vale mais. Peça o código novo ao Luiz e digite de novo.'); return; }
        const era = S.offline; S.offline = true;
        if(!S.carregado){
          const c = cacheLido();
          if(c){ aplicarResumo(c.r); S.cacheEm = c.em; }
          render();
        }else if(!era) refrescar();
      }finally{ S.carregando = null; }
    })();
    return S.carregando;
  }
  function cacheLido(){ try{ const c = JSON.parse(LS.get(K.cache) || 'null'); return c && c.r ? c : null; }catch(e){ return null; } }

  // índice das unidades livres (texto compacto: unidades por ";" e campos por "|")
  function aplicarUnidades(r){
    const mapa = new Map();
    for(const pid in (r.u || {})){
      if(!S.byId.has(pid)) continue;
      const arr = [];
      for(const lin of String(r.u[pid]).split(';')){
        if(!lin) continue;
        const c = lin.split('|');
        const at = c[3] === '' || c[3] == null ? null : c[3];
        arr.push({n: c[0], k: c[1] || null, a: c[2] ? +c[2] : null, at, an: at != null && /^\d+$/.test(at) ? +at : null,
          p: c[4] ? +c[4] : null, pv: c[5] ? +c[5] : null, c: c[6] || null, vg: c[7] === '' || c[7] == null ? null : +c[7], f: c[8] ? +c[8] : 0});
      }
      mapa.set(pid, arr);
    }
    S.U = mapa; S.Uem = Date.now(); S.Uversao = r.versao; S.Uerro = false;
  }
  async function carregarUnidades(forcar){
    if(!S.cod) return null;
    if(S.Ucarregando) return S.Ucarregando;
    if(S.U && !forcar && Date.now() - S.Uem < 120000) return S.U;
    S.Ucarregando = (async () => {
      try{ const r = await rpc('corretor_unidades', {p_codigo: S.cod}, 40000); aplicarUnidades(r); }
      catch(e){ if(codigoInvalido(e)){ sair('Esse código não vale mais. Digite o código novo do time.'); return null; } S.Uerro = true; }
      finally{ S.Ucarregando = null; }
      if(location.hash === '#/imoveis' && !document.querySelector('dialog[open]:not(#folha-filtros)')) atualizarImoveis();
      return S.U;
    })();
    return S.Ucarregando;
  }

  async function detalhe(id, forcar){
    const c = S.det.get(id);
    if(c && !forcar && (c.pr || Date.now() - c.em < 60000)) return c.pr || c.v;
    const pr = rpc('corretor_projeto', {p_codigo: S.cod, p_id: id}).then(v => { S.det.set(id, {v, em: Date.now()}); return v; })
      .catch(e => { if(c && c.v){ S.det.set(id, c); return c.v; } S.det.delete(id); throw e; });
    S.det.set(id, {pr, v: c && c.v, em: c ? c.em : 0});
    return pr;
  }
  function fichaCentral(id){   // ficha completa da central de produto (mesmo site, pasta /espelhos/nex/p/)
    if(S.central.has(id)) return S.central.get(id);
    const pr = fetch(ESP + 'nex/p/' + encodeURIComponent(id) + '.json', {cache: 'no-cache'})
      .then(r => r.ok ? r.json() : null)
      .then(v => { const c = (v && v.id === id) ? v : null; S.centralV.set(id, c); return c; })
      .catch(() => { S.central.delete(id); S.centralV.set(id, null); return null; });
    S.central.set(id, pr);
    return pr;
  }
  const imgCentral = (c, id, mini) => c && c.pasta ? ESP + 'nex/' + c.pasta + (mini ? 't' : '') + id + '.jpg' : null;

  // ================= estatísticas =================
  function stats(){
    const vend7 = S.M.filter(m => m.tipo === 'venda' && S.dias7.includes(m.dia));
    const comPreco = vend7.filter(m => m.preco > 0);
    const hoje = S.M.filter(m => m.dia === S.hoje);
    const vendHoje = hoje.filter(m => m.tipo === 'venda');
    return {
      vend7: vend7.length, vgv7: comPreco.reduce((s, m) => s + m.preco, 0), vend7Preco: comPreco.length,
      res7: S.M.filter(m => m.tipo === 'reserva' && S.dias7.includes(m.dia)).length,
      proc7: S.M.filter(m => m.tipo === 'processo' && S.dias7.includes(m.dia)).length,
      hoje, vendHoje: vendHoje.length, vgvHoje: vendHoje.filter(m => m.preco > 0).reduce((s, m) => s + m.preco, 0), vendHojePreco: vendHoje.filter(m => m.preco > 0).length,
      resHoje: hoje.filter(m => m.tipo === 'reserva').length, procHoje: hoje.filter(m => m.tipo === 'processo').length, voltHoje: hoje.filter(m => m.tipo === 'voltou').length
    };
  }
  const rankingDe = modo => {
    const k = modo === 'reservas' ? 'r7' : 'v7', o = modo === 'reservas' ? 'v7' : 'r7';
    return S.P.filter(p => p.v7 + p.r7 > 0).sort((a, b) => (b[k] - a[k]) || (b[o] - a[o]) || (b.livres - a.livres));
  };
  const statusTxt = m => m.tipo === 'venda' ? 'vendida' : m.tipo === 'reserva' ? 'reservada' : m.tipo === 'processo' ? 'em processo' : m.tipo === 'voltou' ? 'voltou' : (m.para || '');
  const statusCls = m => m.tipo === 'venda' ? 'st-vendida' : m.tipo === 'voltou' ? 'st-voltou' : m.tipo === 'processo' ? 'st-processo' : 'st-reservada';
  const vendasPorDia = () => S.dias7.map(d => ({d, n: S.M.filter(m => m.dia === d && m.tipo === 'venda').length}));

  // ================= imagens =================
  const LARG_NEXT = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
  function tamImg(u, w){   // pede a foto do tamanho certo quando o site deixa (Drive e Vitacon)
    if(!u) return u;
    if(/^https:\/\/lh3\.googleusercontent\.com\//.test(u)) return u.replace(/=[swh]\d+[^/]*$/i, '') + '=w' + w;
    const m = /^https:\/\/vitacon\.com\.br\/_next\/image\/?\?(.*)$/.exec(u);
    if(m){ const q = new URLSearchParams(m[1]); q.set('w', String(LARG_NEXT.find(x => x >= w) || 3840)); q.set('q', '82'); return 'https://vitacon.com.br/_next/image/?' + q.toString(); }
    return u;
  }
  function original(u){   // a maior versão, para baixar e mandar ao cliente
    if(/^https:\/\/lh3\.googleusercontent\.com\//.test(u)) return u.replace(/=[swh]\d+[^/]*$/i, '') + '=s0';
    const m = /^https:\/\/vitacon\.com\.br\/_next\/image\/?\?(.*)$/.exec(u);
    if(m){ const q = new URLSearchParams(m[1]); const o = q.get('url'); if(o && /^https:\/\//.test(o)) return o; }
    return u;
  }
  const temTamanhos = u => /^https:\/\/(lh3\.googleusercontent\.com|vitacon\.com\.br\/_next\/image)/.test(u || '');
  function imgTag(src, alt, cls, o){
    if(!src) return '';
    o = o || {};
    const w = o.w || 800;
    const ext = /^https?:/i.test(src) && !src.startsWith(location.origin);
    let a = '<img src="' + esc(tamImg(src, w)) + '"';
    if(temTamanhos(src) && !o.semSet) a += ' srcset="' + esc([Math.round(w / 2), w, w * 2].map(x => tamImg(src, x) + ' ' + x + 'w').join(', ')) + '" sizes="' + esc(o.sizes || '100vw') + '"';
    a += ' alt="' + esc(alt || '') + '"' + (cls ? ' class="' + cls + '"' : '') + (o.prioridade ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"' + (ext ? ' referrerpolicy="no-referrer"' : '');
    if(o.sigla != null) a += ' data-sigla="' + esc(o.sigla) + '"';
    if(o.troca) a += ' data-troca="' + esc(o.troca) + '"';
    return a + (o.extra || '') + '>';
  }
  const capaVazia = (p, cls) => '<span class="capa-vazia' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><b>' + esc(siglaDe(p)) + '</b><small>Foto em breve</small></span>';
  function capaProj(p, o){   // foto do projeto com a moldura e a reserva para quando não abre
    o = o || {};
    if(!p.capa) return capaVazia(p, o.cls);
    return imgTag(p.capa, o.alt != null ? o.alt : 'Foto do ' + p.nome, o.cls || '', {w: o.w || 800, sizes: o.sizes, prioridade: o.prioridade, sigla: siglaDe(p)});
  }
  document.addEventListener('error', ev => {   // foto que não abriu vira a moldura com a sigla da construtora
    const t = ev.target;
    if(!t || t.tagName !== 'IMG' || t.dataset.falhou) return;
    t.dataset.falhou = '1';
    if(t.dataset.troca){ const alt = t.dataset.troca; t.removeAttribute('data-troca'); t.removeAttribute('srcset'); t.dataset.falhou = ''; t.src = alt; return; }
    if(t.dataset.sigla != null){
      const d = document.createElement('span'); d.className = 'capa-vazia ' + (t.className || ''); d.setAttribute('aria-hidden', 'true');
      d.innerHTML = '<b>' + esc(t.dataset.sigla) + '</b><small>Foto em breve</small>';
      t.replaceWith(d);
    }else t.classList.add('img-falhou');
  }, true);

  // ================= roteamento =================
  const ROTAS = [
    [/^#?\/?$/, 'inicio', () => telaInicio()],
    [/^#\/imoveis$/, 'imoveis', () => telaImoveis()],
    [/^#\/pregao$/, 'pregao', () => telaPregao()],
    [/^#\/tabelas$/, 'tabelas', () => telaListaProjetos('tabelas')],
    [/^#\/tabelas\/([a-z0-9-]+)$/, 'tabelas', id => telaTabela(id)],
    [/^#\/posts$/, 'posts', () => telaListaProjetos('posts')],
    [/^#\/posts\/([a-z0-9-]+)$/, 'posts', id => telaPost(id)],
    [/^#\/p\/([a-z0-9-]+)$/, 'imoveis', id => telaProjeto(id)],
    [/^#\/comparar(?:\?([^#]*))?$/, 'comparar', qs => telaComparar(qs)],
    [/^#\/perfil$/, 'perfil', () => telaPerfil()]
  ];
  let rotaAtual = null, abaAtual = null;
  function render(){
    const app = $('#app');
    document.body.classList.toggle('sem-casca', !S.cod || !S.carregado);
    if(!S.cod){ rotaAtual = null; app.innerHTML = telaPortao(); ligarPortao(); return; }
    if(!S.carregado){
      if(S.offline) app.innerHTML = '<section class="portao"><img src="img/logo-fortal.png" alt="Fortal" width="160"><h1 class="t-1">Sem conexão</h1><p class="texto-2">Não consegui ler os espelhos e ainda não há nada salvo neste aparelho. Confira a internet e tente de novo.</p><button type="button" class="btn btn-pri btn-alto" data-acao="tentar">Tentar de novo</button></section>';
      return;
    }
    const h = location.hash || '#/';
    let achou = null;
    for(const [re, aba, fn] of ROTAS){ const m = h.match(re); if(m){ achou = {aba, fn, arg: m[1]}; break; } }
    if(!achou){ location.replace(hashAntigo(h) || '#/'); return; }
    const mesma = rotaAtual === h;
    if(!mesma && rotaAtual) S.scroll[rotaAtual] = window.scrollY;
    const y = mesma ? window.scrollY : (S.scroll[h] || 0);
    rotaAtual = h; abaAtual = achou.aba;
    $$('[data-aba]').forEach(a => { if(a.dataset.aba === achou.aba) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    atualizarLateral();
    pos.length = 0;
    const html = achou.fn(achou.arg);
    if(html == null) return;
    const ROLOS = '.faixa-cards,.pilulas.rola,.escolha-fotos,.miniaturas,.fotos-linha,#gal,.mosaico-movel';
    const lados = mesma ? $$(ROLOS, app).map(e => e.scrollLeft) : [];
    app.innerHTML = (S.offline ? faixaOffline() : '') + '<div class="pagina pg-' + achou.aba + (mesma ? '' : ' vista') + '">' + html + '</div>';
    depoisDeRender();
    if(lados.length) $$(ROLOS, app).forEach((e, i) => { if(lados[i]) e.scrollLeft = lados[i]; });
    window.scrollTo(0, y);
    if(!mesma){ const f = $('#app h1'); if(f && document.activeElement === document.body){ /* foco fica na página */ } }
  }
  // atualização automática: não mexe em campo com foco, folha aberta, ficha ou post
  function refrescar(){
    if(!S.carregado || !S.cod) return render();
    atualizarLateral();
    if(document.querySelector('dialog[open]')) return;
    const h = location.hash || '#/';
    if(h === '#/imoveis') return atualizarImoveis();
    if(h === '#/tabelas' || h === '#/posts') return atualizarLista(h.slice(2));
    if(/^#\/(p|tabelas|posts)\//.test(h) || h === '#/perfil' || /^#\/comparar/.test(h) || /^#\/(avisos|enviadas|docs|mercado|escritorio|resumo|mais)/.test(h)) return;
    const ae = document.activeElement; if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    render();
  }
  const assinatura = () => S.M.length + ':' + (S.M[0] ? S.M[0].em + S.M[0].n : '') + ':' + S.P.reduce((s, p) => s + p.livres * 3 + p.reservadas * 7 + p.vendidas, 0) + ':' + (S.offline ? 1 : 0);
  function faixaOffline(){
    const em = S.cacheEm || S.geradoEm;
    return '<div class="faixa-aviso"><div class="aviso" role="status">' + ICO.nuvem + '<p>Sem internet. Você está vendo o que ficou salvo neste aparelho' + (em ? ' às ' + hora(em) + (diaKey(em) !== S.hoje ? ' de ' + fDM.format(em) : '') : '') + '. Preço e unidades livres podem ter mudado.</p></div></div>';
  }
  const pos = [];   // ações a rodar depois de pintar a tela
  function depoisDeRender(){ const fs = pos.splice(0); fs.forEach(f => { try{ const r = f(); if(r && r.catch) r.catch(e => console.error(e)); }catch(e){ console.error(e); } }); }
  window.addEventListener('hashchange', () => { fecharFolhas(); render(); });
  MQ_LARGO.addEventListener('change', () => { if(S.carregado && S.cod && !document.querySelector('dialog[open]')) render(); });
  MQ_TABELA.addEventListener('change', () => { if(/^#\/tabelas\//.test(location.hash)) atualizarTabela(); });

  // barra lateral do computador: aviso ao vivo e perfil
  function atualizarLateral(){
    const v = $('#lat-vivo'), pf = $('#lat-perfil');
    if(v && S.carregado){
      const st = stats();
      v.innerHTML = '<p class="ao-vivo"><span class="ponto"><i class="pulso"></i><i></i></span>Ao vivo, ' + esc(hora(S.lidoEm)) + '</p>' +
        '<p class="lat-n"><b class="num ouro">' + esc(BRLmi(st.vgv7)) + '</b><span>vendidos em 7 dias</span></p>' +
        '<p class="lat-mini">' + esc(plural(st.vendHoje, 'venda', 'vendas') + ' e ' + plural(st.resHoje, 'reserva', 'reservas') + ' hoje') + '</p>';
    }
    if(pf){
      const p = perfil(), n = primeiroNome(p.nome);
      pf.innerHTML = '<span class="avatar-c">' + esc((n || 'F').charAt(0).toUpperCase()) + '</span><span class="lat-pf-txt"><b>' + esc(n || 'Seu perfil') + '</b><small>Perfil e ajustes</small></span>';
    }
  }

  // ================= portão (código do time) =================
  function telaPortao(msg){
    msg = msg || S.msgPortao || '';
    return '<section class="portao">' +
      '<img src="img/logo-fortal.png" alt="Fortal Inteligência Imobiliária" width="160">' +
      '<h1 class="t-1">Espelhos de Vendas</h1>' +
      '<p class="texto-2">Espelhos ao vivo, fichas, tabelas, avisos e o link para o cliente. Digite o código do time.</p>' +
      '<form id="f-portao" autocomplete="off">' +
      '<label class="campo">Código do time<input id="cod" name="cod" type="password" inputmode="text" autocapitalize="off" autocorrect="off" spellcheck="false" required minlength="3" maxlength="80"></label>' +
      '<p class="erro-txt" id="cod-erro" role="alert">' + esc(msg) + '</p>' +
      '<button class="btn btn-pri btn-alto" type="submit" id="cod-ok">Entrar</button>' +
      '</form></section>';
  }
  function ligarPortao(){
    const f = $('#f-portao'); if(!f) return;
    setTimeout(() => { const i = $('#cod'); if(i) i.focus(); }, 60);
    f.addEventListener('submit', async ev => {
      ev.preventDefault();
      const c = $('#cod').value.trim().toUpperCase(); if(!c) return;
      const b = $('#cod-ok'); b.disabled = true; b.textContent = 'Conferindo…'; $('#cod-erro').textContent = '';
      try{
        const r = await rpc('corretor_resumo', {p_codigo: c});
        S.cod = c; LS.set(K.cod, c); S.msgPortao = ''; S.offline = false; S.cacheEm = 0;
        aplicarResumo(r); LS.set(K.cache, JSON.stringify({em: Date.now(), r}));
        if(!location.hash) location.replace('#/');
        render();
        setTimeout(() => carregarUnidades(), 600);
      }catch(e){
        b.disabled = false; b.textContent = 'Entrar';
        $('#cod-erro').textContent = codigoInvalido(e) ? 'Código errado. Confira com o Luiz e tente de novo.' : 'Sem conexão com o servidor agora. Confira a internet e tente de novo.';
      }
    });
  }
  function sair(msg){
    S.cod = null; LS.del(K.cod); S.carregado = false; S.msgPortao = msg || ''; S.U = null;
    fecharFolhas(); render();
  }

  // ================= cartões =================
  const precoDe = p => (S.f.modo === 'pv' && p.avista != null) ? p.avista : (p.preco != null ? p.preco : p.avista);
  const SIZES_CARD = '(min-width: 1280px) 300px, (min-width: 1024px) 26vw, (min-width: 640px) 44vw, 80vw';
  function cardProj(p, o){
    o = o || {};
    const v = o.min != null ? o.min : precoDe(p);
    const rot = o.min != null ? 'No filtro, a partir de' : (S.f.modo === 'pv' && p.avista != null) || p.preco == null ? 'À vista a partir de' : 'A partir de';
    const selos = [];
    if(p.vh) selos.push('<span class="selo ouro">' + esc(plural(p.vh, 'venda', 'vendas')) + ' hoje</span>');
    else if(p.v7) selos.push('<span class="selo ouro">' + esc(plural(p.v7, 'venda', 'vendas')) + ' na semana</span>');
    if(p.fase && !o.semFase) selos.push('<span class="selo">' + esc(FASE_CURTA[p.fase] || p.fase) + '</span>');
    const info = [tiposTxt(p.tipos, p.amin, p.amax), maiusc1(entregaTxt(p))].filter(Boolean).join('. ');
    return '<a class="card' + (o.cls ? ' ' + o.cls : '') + '" href="#/p/' + esc(p.id) + '">' +
      '<span class="card-foto">' + capaProj(p, {w: 720, sizes: o.sizes || SIZES_CARD, alt: ''}) +
      (selos.length ? '<span class="card-selos">' + selos.join('') + '</span>' : '') +
      (o.dist != null ? '<span class="card-dist">' + ICO.pino + esc(kmTxt(o.dist)) + '</span>' : '') + '</span>' +
      '<span class="card-corpo"><span class="card-quem">' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span>' +
      '<span class="card-nome">' + esc(p.nome) + '</span>' +
      (v != null ? '<span class="card-preco"><small>' + esc(rot) + '</small><b class="num">' + esc(BRL(v)) + '</b></span>' : '<span class="card-preco sem">Tabela a publicar</span>') +
      (o.bolso ? '<span class="card-bolso">' + esc(o.bolso) + '</span>' : '') +
      '<span class="card-info">' + esc(info) + '.</span>' +
      (o.n != null ? '<span class="card-match">' + esc(plural(o.n, 'unidade livre', 'unidades livres')) + ' no filtro</span>'
        : '<span class="card-est">' + esc(p.livres ? plural(p.livres, 'livre', 'livres') + ' de ' + p.total.toLocaleString('pt-BR') : 'Esgotado no espelho') + '</span>') +
      '</span></a>';
  }
  function miniProj(p, cls){   // foto redonda para listas e ranking
    return '<span class="redonda' + (cls ? ' ' + cls : '') + '">' + (p.capa ? imgTag(p.capa, '', '', {w: 160, sizes: '56px', sigla: siglaDe(p)}) : '<span class="capa-vazia"><b>' + esc(siglaDe(p)) + '</b></span>') + '</span>';
  }

  // ================= INÍCIO =================
  function saudacao(){ const h = +fHoraNum.format(Date.now()); return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
  function fitaHtml(){
    const itens = S.M.slice(0, 16);
    if(!itens.length) return '';
    const item = m => { const p = S.byId.get(m.p); return '<span class="fita-item"><span class="h">' + esc(hora(m.em)) + '</span><b>' + esc(nomeCurto(p)) + ' ' + esc(m.n) + '</b><span class="' + statusCls(m) + '">' + esc(statusTxt(m)) + '</span>' + (m.preco ? '<span class="v">' + esc(BRLc(m.preco)) + '</span>' : '') + '</span>'; };
    const grupo = itens.map(item).join('');
    const dur = Math.max(30, itens.length * 6);
    return '<a class="fita" href="#/pregao" aria-label="Pregão ao vivo: últimas unidades vendidas e reservadas nos espelhos. Abrir o pregão">' +
      '<span class="fita-rot"><span class="ponto"><i class="pulso"></i><i></i></span>Ao vivo</span>' +
      '<span class="fita-trilho" style="--dur:' + dur + 's"><span class="fita-grupo">' + grupo + '</span><span class="fita-grupo" aria-hidden="true">' + grupo + '</span></span></a>';
  }
  function buscaAtalho(){
    return '<div class="busca-linha"><a class="busca" href="#/imoveis" data-acao="focar-busca">' + ICO.lupa + '<span>Projeto, bairro, rua ou metrô</span></a>' +
      '<a class="btn-filtro" href="#/imoveis" data-acao="abrir-filtros" aria-label="Filtro completo: preço, dormitórios, metragem, entrega, região e mais">' + ICO.filtro + '<span class="so-largo">Filtros</span></a></div>';
  }
  function telaInicio(){
    const pf = perfil(), st = stats(), nome = primeiroNome(pf.nome);
    let h = '<header class="ini-cab">' +
      '<div class="topo-movel"><img class="logo" src="img/logo-fortal.png" alt="Fortal Inteligência Imobiliária" width="45" height="46">' +
      '<a class="avatar" href="#/perfil" aria-label="Seu perfil e ajustes"><span>' + esc((nome || 'F').charAt(0).toUpperCase()) + '</span></a></div>' +
      '<div class="ini-saud"><p class="sub">' + esc(maiusc1(fLonga.format(Date.now()).replace('-feira', ''))) + '</p>' +
      '<h1 class="t-1">' + esc(saudacao() + (nome ? ', ' + nome : '')) + '</h1>' +
      '<p class="sub">Espelhos lidos às ' + esc(hora(S.lidoEm)) + (diaKey(S.lidoEm) !== S.hoje ? ' de ' + esc(fDM.format(S.lidoEm)) : '') + '. ' + esc(plural(S.P.filter(p => p.livres).length, 'projeto com unidade livre', 'projetos com unidade livre')) + '.</p></div>' +
      buscaAtalho() + '</header>';
    h += fitaHtml();
    const rank = rankingDe('vendas');
    const top = rank[0] || S.P.filter(p => p.livres > 0 && (p.fase === 'lanc' || p.fase === 'breve'))[0] || S.P[0];
    h += '<div class="ini-grade">' + (top ? heroHtml(top, !!rank[0]) : '') + '<div class="ini-lado">' + placarHtml(st) + rankingHtml() + '</div></div>';
    const vivos = S.P.filter(p => p.livres > 0);
    const ord = (a, b) => (b.v7 - a.v7) || (b.r7 - a.r7) || ((a.preco || 1e12) - (b.preco || 1e12));
    const lanc = vivos.filter(p => p.fase === 'lanc' || p.fase === 'breve').sort(ord);
    const obras = vivos.filter(p => p.fase === 'obras').sort(ord);
    const prontos = vivos.filter(p => p.fase === 'pronto').sort(ord);
    if(lanc.length) h += secaoCards('Lançamentos', 'lanc-t', lanc, 'lanc,breve', 8);
    if(obras.length) h += secaoCards('Em obras', 'obras-t', obras, 'obras', 4);
    if(prontos.length) h += secaoCards('Prontos para morar', 'pront-t', prontos, 'pronto', 4);
    const porG = {}; for(const p of vivos){ const k = p.grupo || '_'; porG[k] = (porG[k] || 0) + 1; }
    const gs = ORDEM_GRUPOS.filter(k => porG[k]).concat(Object.keys(porG).filter(k => k !== '_' && !ORDEM_GRUPOS.includes(k)));
    h += '<section class="sec" aria-labelledby="cons-t"><div class="sec-cab"><h2 class="t-2" id="cons-t">Por construtora</h2></div><div class="pilulas">' +
      gs.map(k => '<a class="pilula" href="#/imoveis" data-acao="ver-cons" data-v="' + esc(k) + '">' + esc(nomeGrupo(k)) + '<span class="n">' + porG[k] + '</span></a>').join('') + '</div></section>';
    return h;
  }
  function secaoCards(titulo, idT, lista, fase, n){
    return '<section class="sec" aria-labelledby="' + idT + '"><div class="sec-cab"><h2 class="t-2" id="' + idT + '">' + esc(titulo) + ' <span class="q">' + lista.length + '</span></h2>' +
      '<a class="link-mais" href="#/imoveis" data-acao="ver-fase" data-v="' + fase + '">Ver todos ' + ICO.seta + '</a></div>' +
      '<div class="faixa-cards' + (n <= 4 ? ' uma-linha' : '') + '">' + lista.slice(0, n).map(p => cardProj(p, {semFase: true})).join('') + '</div></section>';
  }
  function heroHtml(p, primeiro){
    const c = S.centralV.get(p.id);
    if(c === undefined) pos.push(() => trocarHeroCentral(p));
    const src = c && c.hero ? imgCentral(c, c.hero) : p.capa;
    const img = src ? imgTag(src, 'Foto do ' + p.nome, 'hero-img', {w: 1600, sizes: '(min-width: 1024px) 64vw, 100vw', prioridade: true, extra: ' id="hero-img"', sigla: siglaDe(p)}) : capaVazia(p, 'hero-img');
    const tip = tiposTxt(p.tipos, p.amin, p.amax);
    const linha2 = [p.avista && p.preco && p.avista < p.preco ? 'ou ' + BRL(p.avista) + ' à vista.' : '', tip ? tip + ', ' + entregaTxt(p) + '.' : maiusc1(entregaTxt(p)) + '.'].filter(Boolean).join(' ');
    return '<section class="hero" aria-labelledby="hero-t"><a class="hero-foto" href="#/p/' + esc(p.id) + '" tabindex="-1" aria-hidden="true">' + img + '</a><span class="veu-hero" aria-hidden="true"></span>' +
      (primeiro && p.v7 ? '<p class="selo ouro hero-selo">1º em vendas na semana</p>' : '') +
      '<div class="hero-txt"><p class="onde">' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</p>' +
      '<h2 id="hero-t"><a href="#/p/' + esc(p.id) + '">' + esc(p.nome) + '</a></h2>' +
      (p.preco ? '<p class="hero-preco"><span>Tabela a partir de</span><b class="num">' + esc(BRL(p.preco)) + '</b></p>' : '<p class="hero-preco"><span>Tabela ainda não publicada</span></p>') +
      '<p class="l">' + esc(linha2) + '</p>' +
      '<p class="l"><strong>' + esc(plural(p.v7, 'vendida', 'vendidas')) + '</strong> e ' + esc(plural(p.r7, 'reservada', 'reservadas')) + ' em 7 dias, ' + esc(plural(p.livres, 'livre', 'livres')) + '.</p>' +
      '<div class="hero-btns"><button type="button" class="btn btn-pri" data-acao="enviar" data-id="' + esc(p.id) + '">' + ICO.enviar + 'Mandar pro cliente</button>' +
      '<a class="btn btn-vidro" href="#/p/' + esc(p.id) + '">Ver projeto</a></div></div></section>';
  }
  async function trocarHeroCentral(p){
    const c = await fichaCentral(p.id);
    if(!c || !c.hero) return;
    const im = $('#hero-img'), src = imgCentral(c, c.hero);
    if(im && im.tagName === 'IMG' && src && im.getAttribute('src') !== src){ const n = new Image(); n.onload = () => { const a = $('#hero-img'); if(a && a.tagName === 'IMG'){ a.removeAttribute('srcset'); a.src = src; } }; n.src = src; }
  }
  function placarHtml(st){
    const semPreco = st.vend7 - st.vend7Preco;
    const dias = vendasPorDia(), mx = Math.max(1, ...dias.map(x => x.n));
    const rotDia = d => { const dt = new Date(d + 'T12:00:00-03:00'); return d === S.hoje ? 'hoje' : fSem.format(dt).replace('.', ''); };
    return '<section class="placar" aria-labelledby="placar-t"><h2 id="placar-t" class="rotulo">VGV vendido nos espelhos em 7 dias</h2>' +
      '<p class="grande num' + (st.vgv7 ? '' : ' zero') + '">' + esc(BRLmi(st.vgv7)) + '</p>' +
      '<dl class="placar-n"><div><dt>Vendas</dt><dd class="num">' + st.vend7 + '</dd></div><div><dt>Reservas</dt><dd class="num">' + st.res7 + '</dd></div><div><dt>Em processo</dt><dd class="num">' + st.proc7 + '</dd></div></dl>' +
      '<div class="mini-barras" role="img" aria-label="' + esc('Vendas por dia: ' + dias.map(x => rotDia(x.d) + ' ' + x.n).join(', ')) + '">' +
      dias.map(x => '<span class="' + (x.d === S.hoje ? 'hoje' : '') + '"><i style="height:' + Math.max(3, Math.round(x.n / mx * 56)) + 'px"></i><small>' + esc(rotDia(x.d)) + '</small></span>').join('') + '</div>' +
      (st.vend7 ? '<p class="nota">Soma do preço de tabela ' + (semPreco ? 'de ' + st.vend7Preco + ' das ' + st.vend7 + ' vendas. ' + (semPreco === 1 ? 'A outra não tem preço no espelho.' : 'As outras ' + semPreco + ' não têm preço no espelho.') : (st.vend7 === 1 ? 'da venda.' : 'das ' + st.vend7 + ' vendas.')) + '</p>' : '') +
      '<a class="pilula" href="#/pregao">Abrir o pregão de hoje ' + ICO.seta + '</a></section>';
  }
  function rankingHtml(){
    const modo = S.ui.rank, lst = rankingDe(modo).slice(0, 5);
    if(!lst.length) return '';
    return '<section class="ranking-box" aria-labelledby="rank-t"><div class="sec-cab"><h2 class="t-3" id="rank-t">Quem mais vende</h2><span class="sub">7 dias</span></div>' +
      '<div class="seg" role="group" aria-label="Ordenar o ranking">' +
      ['vendas', 'reservas'].map(k => '<button type="button" data-acao="rank" data-v="' + k + '" aria-pressed="' + (modo === k) + '">' + (k === 'vendas' ? 'Vendas' : 'Reservas') + '</button>').join('') + '</div>' +
      '<ol class="ranking">' + lst.map((p, i) => {
        const n = modo === 'reservas' ? p.r7 : p.v7;
        return '<li><a href="#/p/' + esc(p.id) + '"><span class="pos num">' + (i + 1) + '</span>' + miniProj(p) +
          '<span class="meio"><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span></span>' +
          '<span class="fim"><b class="num' + (modo === 'vendas' ? ' ouro' : '') + '">' + n + '</b><span>' + (modo === 'vendas' ? (n === 1 ? 'venda' : 'vendas') : (n === 1 ? 'reserva' : 'reservas')) + '</span></span></a></li>';
      }).join('') + '</ol><a class="link-mais" href="#/pregao">Ver o ranking dos 10 ' + ICO.seta + '</a></section>';
  }

  // ================= PREGÃO =================
  function telaPregao(){
    const st = stats();
    let h = '<header class="pg-cab"><div><h1 class="t-1">Pregão</h1><p class="sub">Tudo que mudou hoje nos espelhos.</p></div><p class="ao-vivo"><span class="ponto"><i class="pulso"></i><i></i></span>Ao vivo, ' + esc(hora(S.lidoEm)) + '</p></header>';
    const semP = st.vendHoje - st.vendHojePreco;
    const placar = '<section class="placar" aria-labelledby="hoje-t"><h2 class="rotulo" id="hoje-t">Vendido hoje</h2>' +
      '<p class="grande num' + (st.vgvHoje ? '' : ' zero') + '">' + esc(BRLmi(st.vgvHoje)) + '</p>' +
      '<dl class="placar-n"><div><dt>Vendas</dt><dd class="num">' + st.vendHoje + '</dd></div><div><dt>Reservas</dt><dd class="num">' + st.resHoje + '</dd></div><div><dt>Em processo</dt><dd class="num">' + st.procHoje + '</dd></div><div><dt>Voltaram</dt><dd class="num">' + st.voltHoje + '</dd></div></dl>' +
      (st.vendHoje ? '<p class="nota">VGV pelo preço de tabela ' + (semP ? 'de ' + st.vendHojePreco + ' das ' + st.vendHoje + ' vendas. ' + (semP === 1 ? 'A outra não tem preço no espelho.' : 'As outras ' + semP + ' não têm preço no espelho.') : (st.vendHoje === 1 ? 'da venda.' : 'das ' + st.vendHoje + ' vendas.')) + '</p>' : '') + '</section>';
    const porDia = vendasPorDia();
    const mx = Math.max(1, ...porDia.map(x => x.n)), tot = porDia.reduce((s, x) => s + x.n, 0);
    const rotDia = d => { const dt = new Date(d + 'T12:00:00-03:00'); return {sem: d === S.hoje ? 'hoje' : fSem.format(dt).replace('.', ''), dm: fDM.format(dt).slice(0, 2)}; };
    const aria = 'Unidades vendidas por dia: ' + porDia.map(x => { const r = rotDia(x.d); return (r.sem === 'hoje' ? 'hoje' : r.sem + ' ' + r.dm) + ', ' + (x.n || 'nenhuma'); }).join('; ');
    const barras = '<section class="caixa" aria-labelledby="sem-t"><div class="sec-cab"><h2 class="t-3" id="sem-t">Vendas por dia</h2><span class="sub num">' + tot + ' em 7 dias</span></div>' +
      '<div class="barras" role="img" aria-label="' + esc(aria) + '">' + porDia.map(x => '<span class="col' + (x.d === S.hoje ? ' hoje' : '') + (x.n ? '' : ' nada') + '" aria-hidden="true"><b class="num">' + x.n + '</b><i style="height:' + Math.max(2, Math.round(x.n / mx * 128)) + 'px"></i></span>').join('') + '</div>' +
      '<div class="barras-dias" aria-hidden="true">' + porDia.map(x => { const r = rotDia(x.d); return '<span' + (x.d === S.hoje ? ' class="hoje"' : '') + '><b>' + esc(r.sem) + '</b>' + esc(r.dm) + '</span>'; }).join('') + '</div></section>';
    let maiores = st.hoje.filter(m => m.tipo === 'venda' && m.preco > 0), rotMaior = 'Maior venda de hoje';
    if(!maiores.length){ maiores = S.M.filter(m => m.tipo === 'venda' && m.preco > 0 && S.dias7.includes(m.dia)); rotMaior = 'Maior venda da semana'; }
    const maior = maiores.sort((a, b) => b.preco - a.preco)[0];
    let maiorH = '';
    if(maior){
      const p = S.byId.get(maior.p);
      maiorH = '<a class="maior" href="#/p/' + esc(p.id) + '">' + (p.capa ? imgTag(p.capa, 'Foto do ' + p.nome, '', {w: 1000, sizes: '(min-width: 1024px) 34vw, 100vw', sigla: siglaDe(p)}) : capaVazia(p)) + '<span class="veu" aria-hidden="true"></span><span class="txt">' +
        '<span class="k">' + esc(rotMaior + (maior.dia === S.hoje ? ', às ' + hora(maior.em) : ', ' + fDM.format(maior.em))) + '</span>' +
        '<span class="t">' + esc(p.nome + ' ' + maior.n) + '</span><span class="d">' + esc([maior.area ? fmtM2(maior.area) : '', maior.tl, quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span>' +
        '<span class="v num">' + esc(BRL(maior.preco)) + '</span></span></a>';
    }
    let dia = S.hoje, lista = st.hoje, titulo = 'Movimento de hoje';
    if(!lista.length){ const ontem = diaKey(Date.now() - 864e5); dia = ontem; lista = S.M.filter(m => m.dia === ontem); titulo = 'Movimento de ontem'; }
    const filtros = [['tudo', 'Tudo', lista.length], ['venda', 'Vendas', lista.filter(m => m.tipo === 'venda').length], ['reserva', 'Reservas', lista.filter(m => m.tipo === 'reserva').length], ['processo', 'Em processo', lista.filter(m => m.tipo === 'processo').length], ['voltou', 'Voltaram', lista.filter(m => m.tipo === 'voltou').length]];
    const fl = S.ui.feed, vis = fl === 'tudo' ? lista : lista.filter(m => m.tipo === fl);
    const feed = '<section class="caixa" aria-labelledby="feed-t"><h2 class="t-3" id="feed-t">' + titulo + '</h2>' +
      '<div class="pilulas rola" role="group" aria-label="Filtrar o movimento">' + filtros.map(x => '<button type="button" class="pilula peq" data-acao="feed" data-v="' + x[0] + '" aria-pressed="' + (fl === x[0]) + '">' + esc(x[1]) + '<span class="n">' + x[2] + '</span></button>').join('') + '</div>' +
      (vis.length ? '<ul class="feed">' + vis.slice(0, S.ui.feedMostra).map(feedItem).join('') + '</ul>' : '<p class="texto-2">Nada nesse filtro' + (dia === S.hoje ? ' hoje' : ' ontem') + '.</p>') +
      (vis.length > S.ui.feedMostra ? '<button type="button" class="btn btn-largo" data-acao="mais-feed">Mostrar mais ' + Math.min(20, vis.length - S.ui.feedMostra) + ' de ' + (vis.length - S.ui.feedMostra) + '</button>' : '') + '</section>';
    const rk = rankingDe('vendas').slice(0, 10);
    const ranking = rk.length ? '<section class="caixa" aria-labelledby="rk-t"><div class="sec-cab"><h2 class="t-3" id="rk-t">Ranking da semana</h2><span class="sub">7 dias</span></div>' +
      '<div class="tabela-rank" role="table" aria-label="Ranking da semana por vendas"><div class="lin cab" role="row"><span role="columnheader">#</span><span role="columnheader">Projeto</span><span role="columnheader" class="dir">Vendas</span><span role="columnheader" class="dir">Reservas</span></div>' +
      rk.map((p, i) => '<a class="lin" role="row" href="#/p/' + esc(p.id) + '"><span role="cell" class="pos num">' + (i + 1) + '</span><span role="cell" class="nm">' + miniProj(p, 'peq') + '<span><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span></span></span><span role="cell" class="v num">' + p.v7 + '</span><span role="cell" class="r num">' + p.r7 + '</span></a>').join('') + '</div></section>' : '';
    h += '<div class="preg-grade"><div class="preg-a">' + placar + barras + feed + '</div><div class="preg-b">' + maiorH + ranking + '</div></div>';
    return h;
  }
  function feedItem(m){
    const p = S.byId.get(m.p);
    return '<li><span class="h num">' + esc(hora(m.em)) + '</span><span class="meio"><a href="#/p/' + esc(p.id) + '">' + esc(nomeCurto(p)) + ' <span class="u">' + esc(m.n) + '</span></a>' +
      '<span>' + esc([m.area ? fmtM2(m.area) : '', m.tl, quemDe(p)].filter(Boolean).join(', ')) + '</span></span>' +
      '<span class="fim"><span class="st ' + statusCls(m) + '">' + esc(statusTxt(m)) + '</span>' + (m.preco ? '<span class="v num' + (m.tipo === 'venda' ? ' ouro' : '') + '">' + esc(BRLc(m.preco)) + '</span>' : '') + '</span></li>';
  }

  // ================= FILTRO =================
  // Critérios de projeto (construtora, fase, região, entrega, movimento) e de unidade (preço, tipologia, metragem,
  // R$/m², andar, vaga, enquadramento, extras). Os de unidade usam o índice de unidades livres; até ele chegar,
  // vale a conta aproximada pelo resumo do projeto.
  const prU = (u, f) => f.modo === 'pv' ? u.pv : u.p;
  const temFU = (f, ign) => !!((ign !== 'preco' && (f.pmin || f.pmax)) || (ign !== 'tipos' && f.tipos.length) || (ign !== 'area' && (f.amin || f.amax)) || (ign !== 'm2' && f.m2) ||
    (ign !== 'andar' && f.andar) || (ign !== 'vaga' && f.vaga) || (ign !== 'cats' && f.cats.length) || (ign !== 'extras' && f.extras.length) || (ign !== 'bolso' && bolsoLigado(f)));
  const catBate = (c, alvo) => alvo === 'H' ? /^H/.test(c || '') : c === alvo;
  function passaU(u, f, ign){
    const pr = prU(u, f);
    if(ign !== 'preco' && (f.pmin || f.pmax)){ if(!(pr > 0)) return false; if(f.pmin && pr < f.pmin) return false; if(f.pmax && pr > f.pmax) return false; }
    if(ign !== 'tipos' && f.tipos.length && !f.tipos.includes(u.k)) return false;
    if(ign !== 'area' && (f.amin || f.amax)){ if(!(u.a > 0)) return false; if(f.amin && u.a < f.amin) return false; if(f.amax && u.a > f.amax) return false; }
    if(ign !== 'm2' && f.m2){ if(!(pr > 0 && u.a >= 10) || pr / u.a > f.m2) return false; }
    if(ign !== 'andar' && f.andar){ if(!(u.an >= f.andar)) return false; }
    if(ign !== 'vaga' && f.vaga){ if(!(u.vg >= f.vaga)) return false; }
    if(ign !== 'cats' && f.cats.length && !f.cats.some(c => catBate(u.c, c))) return false;
    if(ign !== 'extras' && f.extras.length){ for(const x of f.extras){ if(!(u.f & BIT[x])) return false; } }
    if(ign !== 'bolso' && bolsoLigado(f) && !cabeNoBolso(u, f)) return false;
    return true;
  }
  const FLAG_P = {mob: 'm', pcd: 'p', gd: 'g', dist: 'd', promo: 'o', cob: 'c'};
  function aproxP(p, f, ign){   // sem o índice de unidades: usa o resumo do projeto
    const pr = f.modo === 'pv' ? p.avista : (p.preco != null ? p.preco : p.avista);
    if(ign !== 'preco' && f.pmax && !(pr > 0 && pr <= f.pmax)) return false;
    if(ign !== 'tipos' && f.tipos.length && !f.tipos.some(k => p.tipos.includes(k))) return false;
    if(ign !== 'area' && (f.amin || f.amax)){ if(f.amin && !(p.amax >= f.amin)) return false; if(f.amax && !(p.amin > 0 && p.amin <= f.amax)) return false; }
    if(ign !== 'm2' && f.m2 && !(p.pm2 > 0 && p.pm2 <= f.m2)) return false;
    if(ign !== 'vaga' && f.vaga && p.vaga === 'nenhuma') return false;
    if(ign !== 'cats' && f.cats.length && !f.cats.some(c => p.cats.some(x => catBate(x, c)))) return false;
    if(ign !== 'extras' && f.extras.length && !f.extras.every(x => p.flags.includes(FLAG_P[x]))) return false;
    return true;
  }
  function passaP(p, f, ign){
    if(f.livres && !p.livres) return false;
    if(ign !== 'cons' && f.cons.length && !f.cons.includes(p.grupo)) return false;
    if(ign !== 'fases' && f.fases.length && !f.fases.includes(p.fase)) return false;
    if(ign !== 'zonas' && f.zonas.length && !f.zonas.includes(p.zona)) return false;
    if(ign !== 'bairros' && f.bairros.length && !f.bairros.includes(p.bairro)) return false;
    if(ign !== 'ent' && f.ent){
      if(f.ent === 'pronto'){ if(p.fase !== 'pronto') return false; }
      else if(p.fase !== 'pronto'){ if(!p.entrega || +p.entrega.slice(0, 4) > +f.ent) return false; }
    }
    if(ign !== 'mov' && f.mov){ if(f.mov === 'hoje' && !(p.vh + p.rh)) return false; if(f.mov === 'semana' && !p.v7) return false; }
    if(ign !== 'perto' && f.perto){ if(p.lat == null || p.lng == null || distKm(f.perto, p) > f.perto.raio) return false; }
    if(f.q){
      const termos = norm(f.q).split(/\s+/).filter(Boolean);
      if(termos.length){
        const alvo = norm([p.nome, p.curto, p.bairro, p.endereco, p.destaque, p.cidade, quemDe(p), GRUPOS[p.grupo] ? GRUPOS[p.grupo].n : '', ZONA[p.zona] ? 'zona ' + ZONA[p.zona] : ''].join(' '));
        if(!termos.every(t => alvo.includes(t))) return false;
      }
    }
    return true;
  }
  function resultado(f, ignP, ignU){
    const fu = temFU(f, ignU), usaU = fu && !!S.U;
    const out = [];
    for(const p of S.P){
      if(!passaP(p, f, ignP)) continue;
      if(fu){
        if(usaU){ const us = (S.U.get(p.id) || []).filter(u => passaU(u, f, ignU)); if(!us.length) continue; out.push({p, us}); }
        else { if(!aproxP(p, f, ignU)) continue; out.push({p, us: null, aprox: true}); }
      }else out.push({p, us: null});
    }
    return out;
  }
  function completar(res, f){
    for(const r of res){
      if(r.us){
        let mn = null, m2 = null;
        for(const u of r.us){ const v = prU(u, f); if(v > 0){ if(mn == null || v < mn) mn = v; if(u.a >= 10){ const x = v / u.a; if(m2 == null || x < m2) m2 = x; } } }
        r.min = mn; r.m2 = m2; r.n = r.us.length;
      }else{ r.min = precoDe(r.p); r.m2 = r.p.pm2; r.n = null; }
      r.dist = f.perto && r.p.lat != null ? distKm(f.perto, r.p) : null;
    }
    return res;
  }
  const chaveEnt = p => p.fase === 'pronto' ? '0000' : (p.entrega || '9999');
  const ORDENS = {
    vendidos: (a, b) => (b.p.v7 - a.p.v7) || (b.p.r7 - a.p.r7) || (b.p.livres - a.p.livres),
    preco: (a, b) => (a.min == null ? 1e12 : a.min) - (b.min == null ? 1e12 : b.min),
    precoDesc: (a, b) => (b.min == null ? -1 : b.min) - (a.min == null ? -1 : a.min),
    m2: (a, b) => (a.m2 == null ? 1e9 : a.m2) - (b.m2 == null ? 1e9 : b.m2),
    entrega: (a, b) => { const x = chaveEnt(a.p), y = chaveEnt(b.p); return x < y ? -1 : x > y ? 1 : (b.p.v7 - a.p.v7); },
    estoque: (a, b) => b.p.livres - a.p.livres,
    perto: (a, b) => (a.dist == null ? 1e9 : a.dist) - (b.dist == null ? 1e9 : b.dist),
    nome: (a, b) => String(a.p.nome).localeCompare(String(b.p.nome), 'pt-BR')
  };
  const ORDEM_TXT = [['vendidos', 'Mais vendidos'], ['preco', 'Menor preço'], ['precoDesc', 'Maior preço'], ['m2', 'Menor R$/m²'], ['entrega', 'Entrega mais cedo'], ['estoque', 'Mais unidades livres'], ['perto', 'Mais perto'], ['nome', 'Nome, de A a Z']];
  const salvarF = () => SS.set(K.filtro, Object.assign({}, S.f, {mostra: 12}));
  function facetas(f){
    const out = {};
    const campo = {cons: 'grupo', fases: 'fase', zonas: 'zona', bairros: 'bairro'};
    for(const g in campo){
      const cnt = {}; for(const r of resultado(f, g, null)){ const v = r.p[campo[g]]; if(v) cnt[v] = (cnt[v] || 0) + 1; }
      out[g] = cnt;
    }
    { const base = resultado(f, 'ent', null), cnt = {}; for(const o of ['pronto', '2026', '2027', '2028', '2029', '2030']) cnt[o] = base.filter(r => passaP(r.p, Object.assign({}, f, {ent: o}), null)).length; out.ent = cnt; }
    { const base = resultado(f, 'mov', null); out.mov = {hoje: base.filter(r => r.p.vh + r.p.rh).length, semana: base.filter(r => r.p.v7).length}; }
    const unidDe = r => r.us || (S.U ? (S.U.get(r.p.id) || []) : null);
    for(const g of ['tipos', 'cats', 'extras']){
      const base = resultado(f, null, g), cnt = {};
      const opcoes = g === 'tipos' ? TIPOS.map(x => x[0]) : g === 'cats' ? CATS.map(x => x[0]) : EXTRAS.map(x => x[0]);
      for(const r of base){
        const us = unidDe(r);
        for(const v of opcoes){
          let ok;
          if(us){ ok = g === 'tipos' ? us.some(u => u.k === v) : g === 'cats' ? us.some(u => catBate(u.c, v)) : us.some(u => u.f & BIT[v]); }
          else ok = g === 'tipos' ? r.p.tipos.includes(v) : g === 'cats' ? r.p.cats.some(x => catBate(x, v)) : r.p.flags.includes(FLAG_P[v]);
          if(ok) cnt[v] = (cnt[v] || 0) + 1;
        }
      }
      out[g] = cnt;
    }
    return out;
  }
  function filtrosAtivos(f){
    const L = [];
    if(f.q.trim()) L.push(['q', '“' + f.q.trim() + '”']);
    if(f.pmin || f.pmax) L.push(['preco', (f.modo === 'pv' ? 'À vista ' : '') + (f.pmin && f.pmax ? milTxt(f.pmin) + ' a ' + milTxt(f.pmax) : f.pmax ? 'até ' + milTxt(f.pmax) : 'a partir de ' + milTxt(f.pmin))]);
    else if(f.modo === 'pv') L.push(['modo', 'Preço à vista']);
    f.tipos.forEach(k => L.push(['tipos:' + k, tipoNome(k)]));
    if(f.amin || f.amax) L.push(['area', f.amin && f.amax ? f.amin + ' a ' + f.amax + ' m²' : f.amax ? 'até ' + f.amax + ' m²' : 'a partir de ' + f.amin + ' m²']);
    if(f.m2) L.push(['m2', 'R$/m² até ' + milTxt(f.m2)]);
    if(f.andar) L.push(['andar', 'A partir do ' + f.andar + 'º andar']);
    if(f.vaga) L.push(['vaga', f.vaga > 1 ? f.vaga + ' vagas ou +' : 'Com vaga']);
    if(f.ent) L.push(['ent', f.ent === 'pronto' ? 'Pronto para morar' : 'Chaves até ' + f.ent]);
    f.fases.forEach(k => L.push(['fases:' + k, FASE[k] || k]));
    f.zonas.forEach(z => L.push(['zonas:' + z, 'Zona ' + (ZONA[z] || z)]));
    f.bairros.forEach(b => L.push(['bairros:' + b, b]));
    if(f.perto) L.push(['perto', 'Até ' + kmTxt(f.perto.raio) + ' de você']);
    f.cons.forEach(c => L.push(['cons:' + c, nomeGrupo(c)]));
    f.cats.forEach(c => L.push(['cats:' + c, (CATS.find(x => x[0] === c) || [c, c])[1]]));
    f.extras.forEach(x => L.push(['extras:' + x, (EXTRAS.find(e => e[0] === x) || [x, x])[1]]));
    if(f.mov) L.push(['mov', f.mov === 'hoje' ? 'Mexeu hoje' : 'Vendeu na semana']);
    if(!f.livres) L.push(['livres', 'Com esgotados']);
    if(bolsoLigado(f)) L.push(['bolso', bolsoChip(f)]);
    return L;
  }
  function tirarFiltro(k){
    const f = S.f, [g, v] = k.split(/:(.*)/s);
    if(g === 'q') f.q = '';
    else if(g === 'preco'){ f.pmin = 0; f.pmax = 0; }
    else if(g === 'modo') f.modo = 'pp';
    else if(g === 'area'){ f.amin = 0; f.amax = 0; }
    else if(g === 'm2') f.m2 = 0; else if(g === 'andar') f.andar = 0; else if(g === 'vaga') f.vaga = 0;
    else if(g === 'bolso'){ f.be = 0; f.bm = 0; f.bf = 0; } else if(g === 'ent') f.ent = ''; else if(g === 'mov') f.mov = ''; else if(g === 'livres') f.livres = true;
    else if(g === 'perto'){ f.perto = null; if(f.ordem === 'perto') f.ordem = 'vendidos'; }
    else if(Array.isArray(f[g])) f[g] = f[g].filter(x => x !== v);
  }
  const nFiltros = f => filtrosAtivos(f).filter(x => x[0] !== 'q').length;
  function textoBusca(f){   // em português corrido, para a seleção do cliente
    const t = f.tipos.map(tipoNome).filter(Boolean);
    const partes = [];
    partes.push((t.length ? t.join(' ou ') : 'Imóveis'));
    if(f.amin || f.amax) partes.push(f.amin && f.amax ? 'de ' + f.amin + ' a ' + f.amax + ' m²' : f.amax ? 'até ' + f.amax + ' m²' : 'a partir de ' + f.amin + ' m²');
    if(f.pmax) partes.push('até ' + BRLc(f.pmax) + (f.modo === 'pv' ? ' à vista' : ''));
    if(f.bairros.length) partes.push(noBairro(f.bairros.slice(0, 3).join(', ')));
    else if(f.zonas.length) partes.push('na zona ' + f.zonas.map(z => ZONA[z] || z).join(' ou '));
    if(f.ent) partes.push(f.ent === 'pronto' ? 'prontos para morar' : 'com chaves até ' + f.ent);
    if(bolsoLigado(f)) partes.push(bolsoFrase(f));
    return partes.join(' ').slice(0, 200);
  }

  // ================= IMÓVEIS =================
  function telaImoveis(){
    const f = S.f;
    pos.push(() => {
      atualizarImoveis();
      if(!S.U) carregarUnidades();
      if(S.focarBusca){ S.focarBusca = false; const i = $('#q'); if(i) i.focus(); }
      if(S.abrirFiltros){ S.abrirFiltros = false; if(!largo()) abrirFiltros(); else { const p = $('#painel-f'); if(p) p.scrollIntoView({block: 'start'}); } }
    });
    const n = nFiltros(f);
    return '<header class="pg-cab"><div><h1 class="t-1">Imóveis</h1><p class="sub" id="imv-sub">' + esc(plural(S.P.length, 'projeto', 'projetos') + ' nos espelhos, ao vivo') + '</p></div>' +
      '<div class="cab-acoes"><a class="btn btn-peq btn-fino" href="#/comparar">' + ICO.comparar + 'Comparar</a><div class="seg seg-ver" role="group" aria-label="Ver por">' + [['projetos', 'Projetos', ICO.grade], ['unidades', 'Unidades', ICO.lista]].map(x => '<button type="button" data-acao="f-ver" data-v="' + x[0] + '" aria-pressed="' + (f.ver === x[0]) + '">' + x[2] + x[1] + '</button>').join('') + '</div></div></header>' +
      '<div class="busca-linha"><label class="busca"><span class="sr">Buscar projeto, bairro, rua ou metrô</span>' + ICO.lupa +
      '<input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Projeto, bairro, rua ou metrô" value="' + esc(f.q) + '" data-input="q">' +
      '<button type="button" class="limpar" data-acao="limpar-q" aria-label="Limpar a busca"' + (f.q ? '' : ' hidden') + '>' + ICO.fechar + '</button></label>' +
      '<button type="button" class="btn-filtro so-estreito' + (n ? ' ligado' : '') + '" id="btn-filtros" data-acao="abrir-filtros" aria-label="' + (n ? 'Filtros, ' + n + (n === 1 ? ' ligado' : ' ligados') : 'Filtros') + '">' + ICO.filtro + (n ? '<span class="bolha" aria-hidden="true">' + n + '</span>' : '') + '</button></div>' +
      '<div class="imv-grade">' +
      (largo() ? '<aside class="painel-f" id="painel-f" aria-label="Filtros">' + painelHtml() + '</aside>' : '') +
      '<div class="imv-col"><div id="imv-chips"></div>' +
      '<div class="contagem"><p id="imv-n" aria-live="polite"></p><label class="sr" for="ordem">Ordenar por</label>' +
      '<select id="ordem" data-input="ordem" class="sel">' + ORDEM_TXT.map(o => '<option value="' + o[0] + '"' + (f.ordem === o[0] ? ' selected' : '') + (o[0] === 'perto' && !f.perto ? ' disabled' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
      '<div id="imv-aviso"></div><div id="imv-res"></div></div></div>';
  }
  function atualizarImoveis(){
    const box = $('#imv-res'); if(!box) return;
    const f = S.f;
    const res = completar(resultado(f), f).sort(ORDENS[f.ordem] || ORDENS.vendidos);
    const L = filtrosAtivos(f);
    $('#imv-chips').innerHTML = L.length ? '<div class="pilulas ativos" aria-label="Filtros ligados">' + L.map(x => '<button type="button" class="pilula peq" data-acao="tirar" data-v="' + esc(x[0]) + '" aria-label="Tirar o filtro ' + esc(x[1]) + '">' + esc(x[1]) + ICO.x + '</button>').join('') +
      '<button type="button" class="link-mais" data-acao="limpar-tudo">Limpar tudo</button></div>' : '';
    const fu = temFU(f);
    const nU = fu && S.U ? res.reduce((s, r) => s + (r.us ? r.us.length : 0), 0) : null;
    const totU = S.U ? res.reduce((s, r) => s + (r.us ? r.us.length : (S.U.get(r.p.id) || []).length), 0) : null;
    $('#imv-n').innerHTML = f.ver === 'unidades' && totU != null
      ? '<b class="num">' + totU.toLocaleString('pt-BR') + '</b> ' + (totU === 1 ? 'unidade livre' : 'unidades livres') + ' em ' + esc(plural(res.length, 'projeto', 'projetos'))
      : '<b class="num">' + res.length.toLocaleString('pt-BR') + '</b> ' + (res.length === 1 ? 'projeto' : 'projetos') + (nU != null ? ', ' + esc(plural(nU, 'unidade livre', 'unidades livres')) + ' no filtro' : (f.livres ? ' com unidade livre' : ''));
    const sub = $('#imv-sub');
    if(sub) sub.textContent = plural(S.P.length, 'projeto', 'projetos') + (S.U ? ', ' + plural([...S.U.values()].reduce((s, a) => s + a.length, 0), 'unidade livre', 'unidades livres') : '') + ' nos espelhos, ao vivo';
    const aviso = $('#imv-aviso');
    if(aviso) aviso.innerHTML = fu && !S.U ? '<p class="aviso fino" role="status">' + (S.Uerro ? 'Não consegui abrir as unidades agora. O filtro está usando o resumo de cada projeto.' : 'Carregando as unidades para filtrar uma por uma…') + '</p>' : bolsoLigado(f) && !S.B ? '<p class="aviso fino" role="status">' + (S.Berro ? 'Não consegui abrir o fluxo das unidades agora. A busca pelo bolso volta quando a conexão voltar.' : 'Carregando o fluxo de pagamento das unidades…') + '</p>' : '';
    const nf = nFiltros(f), bf = $('#btn-filtros');
    if(bf){ bf.classList.toggle('ligado', !!nf); bf.setAttribute('aria-label', nf ? 'Filtros, ' + nf + (nf === 1 ? ' ligado' : ' ligados') : 'Filtros'); const b = bf.querySelector('.bolha'); if(nf){ if(b) b.textContent = nf; else bf.insertAdjacentHTML('beforeend', '<span class="bolha" aria-hidden="true">' + nf + '</span>'); } else if(b) b.remove(); }
    const sel = $('#ordem'); if(sel){ const o = sel.querySelector('option[value="perto"]'); if(o) o.disabled = !f.perto; if(sel.value !== f.ordem) sel.value = f.ordem; }
    $$('[data-acao="f-ver"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === f.ver));
    if(!res.length){
      const dicas = [];
      if(f.pmin || f.pmax) dicas.push('mudar o preço'); if(f.tipos.length) dicas.push('trocar a tipologia'); if(f.amin || f.amax) dicas.push('abrir a metragem');
      if(f.ent) dicas.push('aceitar entrega mais longe'); if(f.q.trim()) dicas.push('buscar outro nome ou bairro'); if(f.cons.length || f.fases.length || f.zonas.length || f.bairros.length) dicas.push('abrir a construtora ou a região');
      if(f.extras.length || f.cats.length || f.andar || f.vaga || f.m2) dicas.push('tirar algum extra');
      if(bolsoLigado(f)) dicas.push('subir a entrada ou a parcela');
      box.innerHTML = '<div class="vazio"><h2 class="t-3">Nada com esses filtros</h2><p class="texto-2">' + esc(dicas.length ? 'Tente ' + (dicas.length === 1 ? dicas[0] : dicas.slice(0, -1).join(', ') + ' ou ' + dicas[dicas.length - 1]) + '.' : 'Tente outra combinação.') + '</p>' +
        (bolsoLigado(f) ? bolsoVazio(f) : '') + '<button type="button" class="btn" data-acao="limpar-tudo">Limpar os filtros</button></div>';
    }else if(f.ver === 'unidades') box.innerHTML = unidadesHtml(res) + barraSelHtml();
    else{
      const mostra = res.slice(0, f.mostra);
      box.innerHTML = '<div class="grade-cards">' + mostra.map(r => cardProj(r.p, {min: r.us ? r.min : null, n: r.us ? r.n : null, dist: r.dist, bolso: bolsoCard(r)})).join('') + '</div>' +
        (res.length > f.mostra ? '<button type="button" class="btn btn-largo" data-acao="mais-res">Mostrar mais ' + Math.min(12, res.length - f.mostra) + ' de ' + (res.length - f.mostra) + '</button>' : '') + barraSelHtml();
    }
    atualizarPainel();
  }

  // lista por unidade (com seleção para mandar várias ao cliente)
  function unidadesDaLista(res){
    const f = S.f, its = [];
    for(const r of res){ const us = r.us || (S.U ? (S.U.get(r.p.id) || []) : []); for(const u of us) its.push({p: r.p, u, pr: prU(u, f), dist: r.dist}); }
    const pr = x => x.pr > 0 ? x.pr : 1e12;
    const o = f.ordem;
    its.sort(o === 'precoDesc' ? (a, b) => (b.pr || 0) - (a.pr || 0)
      : o === 'm2' ? (a, b) => (a.pr > 0 && a.u.a ? a.pr / a.u.a : 1e9) - (b.pr > 0 && b.u.a ? b.pr / b.u.a : 1e9)
      : o === 'entrega' ? (a, b) => { const x = chaveEnt(a.p), y = chaveEnt(b.p); return x < y ? -1 : x > y ? 1 : pr(a) - pr(b); }
      : o === 'perto' ? (a, b) => ((a.dist == null ? 1e9 : a.dist) - (b.dist == null ? 1e9 : b.dist)) || pr(a) - pr(b)
      : o === 'vendidos' ? (a, b) => (b.p.v7 - a.p.v7) || pr(a) - pr(b)
      : o === 'estoque' ? (a, b) => (b.p.livres - a.p.livres) || pr(a) - pr(b)
      : o === 'nome' ? (a, b) => String(a.p.nome).localeCompare(String(b.p.nome), 'pt-BR') || String(a.u.n).localeCompare(String(b.u.n), 'pt-BR', {numeric: true})
      : (a, b) => pr(a) - pr(b));
    return its;
  }
  const andarCurto = at => at == null ? '' : at === 'T' ? 'Térreo' : at === 'S' ? 'Subsolo' : at === 'L' ? 'Loja' : /^\d+$/.test(at) ? at + 'º' : at;
  const vagaTxt = vg => vg == null ? '' : vg > 1 ? vg + ' vagas' : vg === 1 ? '1 vaga' : 'Sem vaga';
  function unidadesHtml(res){
    if(!S.U) return '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:52px"></div><div class="brilho" style="height:52px"></div><div class="brilho" style="height:52px"></div><p class="sub">' + (S.Uerro ? 'Não consegui abrir as unidades agora.' : 'Carregando as unidades livres…') + '</p></div>';
    const its = unidadesDaLista(res), f = S.f, lim = S.ui.unidMostra || 40;
    // duas linhas por célula (principal em cima, apoio embaixo): cabe sem cortar coluna de 600 px para cima
    const par = (a, b) => a ? '<span>' + esc(a) + '</span>' + (b ? '<small>' + esc(b) + '</small>' : '') : b ? '<span>' + esc(b) + '</span>' : '';
    const lin = x => {
      const k = x.p.id + '|' + x.u.n, mk = S.sel.has(k), m2 = x.pr > 0 && x.u.a ? x.pr / x.u.a : null;
      const tipo = x.u.k ? tipoNome(x.u.k) : '', area = x.u.a ? fmtM2(x.u.a) : '', cat = x.u.c ? CAT_TXT[x.u.c] : '';
      const andar = andarCurto(x.u.at) ? andarCurto(x.u.at) + (/^\d+$/.test(x.u.at || '') ? ' andar' : '') : '', vaga = vagaTxt(x.u.vg);
      const desc = [tipo, area, andar, vaga, cat, x.u.f & 1 ? 'mobiliado' : ''].filter(Boolean).join(', ');
      return '<div class="tu-lin' + (mk ? ' marcada' : '') + '" role="row">' +
        '<span role="cell" class="tu-ck"><button type="button" class="ck-btn" data-acao="sel-u" data-p="' + esc(x.p.id) + '" data-n="' + esc(x.u.n) + '" aria-pressed="' + mk + '" aria-label="Marcar a unidade ' + esc(x.u.n) + ' do ' + esc(x.p.nome) + '"><span class="ck">' + ICO.ok + '</span></button></span>' +
        '<a role="cell" class="tu-proj" href="#/p/' + esc(x.p.id) + '" title="' + esc(x.p.nome) + '">' + miniProj(x.p, 'peq') + '<span><b>' + esc(x.p.nome) + '</b><small>' + esc([quemDe(x.p), x.p.bairro].filter(Boolean).join(', ')) + '</small></span></a>' +
        '<span role="cell" class="tu-n num"><b>' + esc(x.u.n) + '</b><small class="tu-desc">' + esc(desc) + '</small>' + (cat ? '<small class="tu-cat">' + esc(cat) + '</small>' : '') + '</span>' +
        '<span role="cell" class="tu-x">' + par(tipo, area) + '</span>' +
        '<span role="cell" class="tu-x">' + par(andar, [vaga, x.u.f & 1 ? 'mobiliado' : ''].filter(Boolean).join(', ')) + '</span>' +
        '<span role="cell" class="tu-p num">' + (x.pr > 0 ? '<b>' + esc(BRL(x.pr)) + '</b>' : '<span class="apoio">sem preço</span>') + (m2 ? '<small>' + esc(BRL(m2)) + '/m²</small>' : '') + '</span>' +
        '<span role="cell" class="tu-x tu-e">' + esc(entregaCurta(x.p)) + '</span>' + (bolsoLigado(f) ? '<span role="cell" class="tu-bolso">' + esc(bolsoCurto(x.u.bo)) + '</span>' : '') + '</div>';
    };
    return '<div class="tab-unid"><div class="tu-corpo" role="table" aria-label="Unidades livres no filtro">' +
      '<div class="tu-lin cab" role="row"><span role="columnheader"><span class="sr">Marcar</span></span><span role="columnheader">Projeto</span><span role="columnheader">Unidade</span><span role="columnheader">Tipo e área</span><span role="columnheader">Andar e vaga</span><span role="columnheader" class="dir">' + (f.modo === 'pv' ? 'À vista' : 'Preço') + '</span><span role="columnheader">Entrega</span></div>' +
      its.slice(0, lim).map(lin).join('') + '</div></div>' +
      (its.length > lim ? '<button type="button" class="btn btn-largo" data-acao="mais-unid">Mostrar mais ' + Math.min(60, its.length - lim) + ' de ' + (its.length - lim).toLocaleString('pt-BR') + '</button>' : '');
  }
  function barraSelHtml(){
    if(!S.sel.size) return '';
    const projs = new Set([...S.sel.values()].map(v => v.p));
    return '<div class="barra-envio" id="barra-sel"><p><span><b class="num">' + S.sel.size + '</b> ' + (S.sel.size === 1 ? 'unidade' : 'unidades') + '</span><small>' + esc(plural(projs.size, 'projeto', 'projetos')) + '</small></p>' +
      '<button type="button" class="btn" data-acao="sel-limpar">Limpar</button><button type="button" class="btn btn-pri" data-acao="enviar-sel">' + ICO.enviar + '<span>Mandar<span class="so-largo"> pro cliente</span></span></button></div>';
  }

  // painel de filtros (lateral no computador, folha no celular)
  function chipF(g, v, rot, on, cnt){
    return '<button type="button" class="pilula peq" data-acao="f" data-g="' + g + '" data-v="' + esc(v) + '" aria-pressed="' + !!on + '">' + esc(rot) +
      (cnt !== undefined ? '<span class="n" data-cnt="' + g + ':' + esc(v) + '">' + (cnt || 0) + '</span>' : '') + '</button>';
  }
  const campoNum = (id, rot, val, ph, suf) => '<label class="campo mini"><span>' + rot + '</span><span class="campo-suf"><input id="' + id + '" inputmode="numeric" autocomplete="off" placeholder="' + esc(ph) + '" value="' + (val ? esc(val.toLocaleString('pt-BR')) : '') + '" data-input="fnum" data-campo="' + id + '">' + (suf ? '<i>' + suf + '</i>' : '') + '</span></label>';
  function painelHtml(){
    const f = S.f, fc = facetas(f);
    const sec = (id, tit, corpo, dica) => '<section class="fsec" data-sec="' + id + '"><h3>' + esc(tit) + (dica ? '<small>' + esc(dica) + '</small>' : '') + '</h3>' + corpo + '</section>';
    let h = '';
    h += sec('preco', 'Preço', '<div class="seg" role="group" aria-label="Qual preço">' + [['pp', 'Tabela'], ['pv', 'À vista']].map(x => '<button type="button" data-acao="f-modo" data-v="' + x[0] + '" aria-pressed="' + (f.modo === x[0]) + '">' + x[1] + '</button>').join('') + '</div>' +
      '<div class="campos-2">' + campoNum('f-pmin', 'De', f.pmin, 'R$ 0') + campoNum('f-pmax', 'Até', f.pmax, 'Sem limite') + '</div>' +
      '<div class="pilulas">' + [[300000, '300 mil'], [400000, '400 mil'], [500000, '500 mil'], [750000, '750 mil'], [1000000, '1 mi'], [1500000, '1,5 mi'], [2000000, '2 mi']].map(o => '<button type="button" class="pilula peq" data-acao="f-pmax" data-v="' + o[0] + '" aria-pressed="' + (f.pmax === o[0] && !f.pmin) + '">até ' + o[1] + '</button>').join('') + '</div>', 'por unidade');
    h += sec('bolso', 'Cabe no bolso do cliente', bolsoCampos(f));
    h += sec('tipos', 'Tipologia', '<div class="pilulas">' + TIPOS.map(x => chipF('tipos', x[0], x[1], f.tipos.includes(x[0]), fc.tipos[x[0]])).join('') + '</div>');
    h += sec('area', 'Metragem', '<div class="campos-2">' + campoNum('f-amin', 'De', f.amin, '0', 'm²') + campoNum('f-amax', 'Até', f.amax, 'Sem limite', 'm²') + '</div>' +
      '<div class="pilulas">' + [[0, 30, 'até 30 m²'], [30, 45, '30 a 45'], [45, 65, '45 a 65'], [65, 90, '65 a 90'], [90, 0, '90 m² ou +']].map(o => '<button type="button" class="pilula peq" data-acao="f-area" data-v="' + o[0] + '-' + o[1] + '" aria-pressed="' + (f.amin === o[0] && f.amax === o[1]) + '">' + o[2] + '</button>').join('') + '</div>');
    h += sec('m2', 'Preço por m²', '<div class="campos-2">' + campoNum('f-m2', 'Até', f.m2, 'Sem limite', '/m²') + '</div><div class="pilulas">' + [[8000, '8 mil'], [10000, '10 mil'], [12000, '12 mil'], [15000, '15 mil'], [20000, '20 mil']].map(o => '<button type="button" class="pilula peq" data-acao="f-m2" data-v="' + o[0] + '" aria-pressed="' + (f.m2 === o[0]) + '">até ' + o[1] + '</button>').join('') + '</div>');
    h += sec('andar', 'Andar', '<div class="pilulas">' + [[0, 'Qualquer'], [5, '5º ou +'], [10, '10º ou +'], [15, '15º ou +'], [20, '20º ou +']].map(o => '<button type="button" class="pilula peq" data-acao="f-andar" data-v="' + o[0] + '" aria-pressed="' + (f.andar === o[0]) + '">' + o[1] + '</button>').join('') + '</div>');
    h += sec('vaga', 'Vaga de garagem', '<div class="pilulas">' + [[0, 'Tanto faz'], [1, 'Com vaga'], [2, '2 vagas ou +']].map(o => '<button type="button" class="pilula peq" data-acao="f-vaga" data-v="' + o[0] + '" aria-pressed="' + (f.vaga === o[0]) + '">' + o[1] + '</button>').join('') + '</div>', 'onde o espelho informa');
    h += sec('ent', 'Entrega', '<div class="pilulas">' + [['', 'Tanto faz'], ['pronto', 'Pronto'], ['2026', 'até 2026'], ['2027', 'até 2027'], ['2028', 'até 2028'], ['2029', 'até 2029'], ['2030', 'até 2030']].map(o => '<button type="button" class="pilula peq" data-acao="f-ent" data-v="' + o[0] + '" aria-pressed="' + (f.ent === o[0]) + '">' + o[1] + (o[0] ? '<span class="n" data-cnt="ent:' + o[0] + '">' + (fc.ent[o[0]] || 0) + '</span>' : '') + '</button>').join('') + '</div>' +
      '<p class="fsub">Fase da obra</p><div class="pilulas">' + ['lanc', 'breve', 'obras', 'pronto'].map(k => chipF('fases', k, FASE_CURTA[k], f.fases.includes(k), fc.fases[k])).join('') + '</div>');
    h += sec('mob', 'Mobília', '<div class="pilulas">' + chipF('extras', 'mob', 'Mobiliado', f.extras.includes('mob'), fc.extras.mob) + '</div>', 'entregue com móveis, onde a ficha informa');
    h += sec('regiao', 'Região', '<div class="pilulas">' + Object.keys(ZONA).filter(z => S.P.some(p => p.zona === z)).map(z => chipF('zonas', z, ZONA[z], f.zonas.includes(z), fc.zonas[z])).join('') + '</div>' +
      '<p class="fsub">Bairros</p><label class="busca mini"><span class="sr">Buscar bairro</span>' + ICO.lupa + '<input id="f-bairro-q" type="search" autocomplete="off" placeholder="Buscar bairro" value="' + esc(S.ui.bairroQ) + '" data-input="bairro-q"></label>' +
      '<div class="pilulas" id="f-bairros">' + bairrosChips(fc) + '</div>' +
      '<p class="fsub">Perto de você</p>' + (f.perto ? '<div class="pilulas">' + [1, 2, 3, 5, 10].map(r => '<button type="button" class="pilula peq" data-acao="f-raio" data-v="' + r + '" aria-pressed="' + (f.perto.raio === r) + '">até ' + r + ' km</button>').join('') + '<button type="button" class="link-mais" data-acao="f-perto-off">Desligar</button></div>'
        : '<button type="button" class="btn btn-peq" data-acao="f-perto">' + ICO.mira + 'Usar minha localização</button><p class="nota">A localização fica só neste aparelho.</p>'));
    h += sec('cons', 'Construtora', '<div class="pilulas">' + gruposPresentes().map(k => chipF('cons', k, nomeGrupo(k), f.cons.includes(k), fc.cons[k])).join('') + '</div>');
    h += sec('cats', 'Enquadramento', '<div class="pilulas">' + CATS.map(x => chipF('cats', x[0], x[1], f.cats.includes(x[0]), fc.cats[x[0]])).join('') + '</div>', 'categoria da unidade no espelho');
    h += sec('extras', 'Extras da unidade', '<div class="pilulas">' + EXTRAS.filter(x => x[0] !== 'mob').map(x => chipF('extras', x[0], x[1], f.extras.includes(x[0]), fc.extras[x[0]])).join('') + '</div>');
    h += sec('mov', 'Movimento', '<div class="pilulas">' + [['', 'Tanto faz'], ['hoje', 'Mexeu hoje'], ['semana', 'Vendeu na semana']].map(o => '<button type="button" class="pilula peq" data-acao="f-mov" data-v="' + o[0] + '" aria-pressed="' + (f.mov === o[0]) + '">' + o[1] + (o[0] ? '<span class="n" data-cnt="mov:' + o[0] + '">' + (fc.mov[o[0]] || 0) + '</span>' : '') + '</button>').join('') + '</div>');
    h += sec('estoque', 'Estoque', '<div class="pilulas">' + '<button type="button" class="pilula peq" data-acao="f-livres" data-v="1" aria-pressed="' + f.livres + '">Só com unidade livre</button><button type="button" class="pilula peq" data-acao="f-livres" data-v="0" aria-pressed="' + !f.livres + '">Incluir esgotados</button></div>');
    h += '<div class="painel-pe so-largo"><button type="button" class="btn btn-largo" data-acao="limpar-tudo">Limpar os filtros</button><p class="nota">Os números contam projetos com o resto do filtro aplicado.</p></div>';
    return h;
  }
  function bairrosChips(fc){   // os 14 bairros com mais projetos, ou os que batem com a busca, mais os já marcados
    const f = S.f, todos = {};
    for(const p of S.P){ if(p.bairro && (!f.livres || p.livres)) todos[p.bairro] = (todos[p.bairro] || 0) + 1; }
    const bq = norm(S.ui.bairroQ).trim();
    let bs = Object.keys(todos);
    bs = bq ? bs.filter(b => norm(b).includes(bq)) : bs.sort((a, b) => (todos[b] - todos[a]) || a.localeCompare(b, 'pt-BR')).slice(0, 14);
    const bSel = f.bairros.filter(b => !bs.includes(b));
    return bSel.concat(bs.sort((a, b) => a.localeCompare(b, 'pt-BR'))).map(b => chipF('bairros', b, b, f.bairros.includes(b), fc.bairros[b])).join('') +
      (bq && !bs.length ? '<p class="texto-2">Nenhum bairro com esse nome.</p>' : '');
  }
  function atualizarPainel(){   // repinta o painel guardando o foco e a rolagem
    const alvos = [$('#painel-f'), $('#folha-filtros .folha-corpo')].filter(Boolean);
    for(const box of alvos){
      const ae = document.activeElement;
      if(ae && box.contains(ae) && ae.tagName === 'INPUT') { atualizarContagens(box); continue; }
      const chave = ae && box.contains(ae) ? (ae.dataset.acao || '') + '|' + (ae.dataset.g || '') + '|' + (ae.dataset.v || '') : null;
      const y = box.scrollTop;
      box.innerHTML = painelHtml();
      box.scrollTop = y;
      if(chave){ const [a, g, v] = chave.split('|'); const el = $$('[data-acao="' + a + '"]', box).find(e => (e.dataset.g || '') === g && (e.dataset.v || '') === v); if(el) el.focus({preventScroll: true}); }
    }
    const vn = $('#ver-n'); if(vn) vn.textContent = verNTxt();
  }
  function atualizarContagens(box){
    const fc = facetas(S.f);
    $$('[data-cnt]', box).forEach(s => { const [g, v] = s.dataset.cnt.split(/:(.*)/s); const n = fc[g] ? fc[g][v] || 0 : 0; s.textContent = n; });
  }
  const verNTxt = () => { const r = resultado(S.f); return S.f.ver === 'unidades' && S.U ? 'Ver ' + plural(r.reduce((s, x) => s + (x.us ? x.us.length : (S.U.get(x.p.id) || []).length), 0), 'unidade', 'unidades') : 'Ver ' + plural(r.length, 'projeto', 'projetos'); };
  function abrirFiltros(){
    abrirFolha('filtros', 'Filtros', painelHtml(), '<button type="button" class="btn" data-acao="limpar-tudo">Limpar</button><button type="button" class="btn btn-pri" data-acao="fechar-folha" id="ver-n">' + verNTxt() + '</button>', 'folha-alta');
  }
  function mudouFiltro(){ S.f.mostra = 12; S.ui.unidMostra = 40; salvarF(); atualizarImoveis(); }
  function pedirLocal(){
    if(!navigator.geolocation){ toast('Este aparelho não informa a localização.'); return; }
    toast('Procurando sua localização…', 6000);
    navigator.geolocation.getCurrentPosition(p => {
      S.f.perto = {lat: p.coords.latitude, lng: p.coords.longitude, raio: (S.f.perto && S.f.perto.raio) || 3};
      S.f.ordem = 'perto'; mudouFiltro(); toast('Mostrando os mais perto de você.');
    }, () => toast('Não consegui sua localização. Libere a localização para este site e tente de novo.', 5000), {enableHighAccuracy: false, timeout: 12000, maximumAge: 600000});
  }
  const lerNum = s => { const d = String(s || '').replace(/\D/g, ''); return d ? +d : 0; };

  // ================= PROJETO =================
  const exDe = a => (a && a[7] && typeof a[7] === 'object') ? a[7] : {};
  const areaU = a => { const ex = exDe(a); return ex.a != null ? +ex.a : (a[2] != null ? +a[2] : null); };
  function tipologiaU(det, a){
    const tl = exDe(a).tl; if(tl != null && String(tl).trim()) return String(tl).trim();
    const r = det.info && det.info.tipologias_regra, ar = areaU(a);
    if(Array.isArray(r) && ar > 0){ let best = null; for(const q of r){ if(ar <= +q[0] && (!best || +q[0] < +best[0])) best = q; } if(best) return best[1]; }
    return null;
  }
  const andarTxt = v => v === 'T' ? 'térreo' : v === 'S' ? 'subsolo' : v === 'L' ? 'loja' : (v != null && v !== '' ? v + 'º andar' : '');
  function precosCampos(det){
    const pc = (det.dados && Array.isArray(det.dados.precos_campos)) ? det.dados.precos_campos.filter(x => x && x.k) : [];
    if(pc.length) return pc;
    const u = (det.dados.unidades || []).find(a => exDe(a).pp != null || exDe(a).pv != null);
    if(!u) return [{k: 'pp', label: 'Tabela'}];
    const ex = exDe(u), out = []; if(ex.pp != null) out.push({k: 'pp', label: 'Parcelado'}); if(ex.pv != null) out.push({k: 'pv', label: 'À vista'});
    return out.length ? out : [{k: 'pp', label: 'Tabela'}];
  }
  const chaveBase = det => { const pc = precosCampos(det); return pc.some(x => x.k === 'pp') ? 'pp' : pc[0].k; };
  const precoU = (a, k) => { const v = exDe(a)[k]; return typeof v === 'number' && v > 0 ? v : null; };
  const stLabel = (det, st) => (det.dados.status && det.dados.status[st]) || ({disponivel: 'Disponível', reservada: 'Reservada', vendida: 'Vendida', processo_final: 'Em processo'}[st] || st);
  const nomeTabela = t => /^tabela/i.test(String(t).trim()) ? String(t).trim() : 'Tabela ' + t;
  const vagaDe = (det, a) => { const v = det.info && det.info.vagas; if(!v || !['todas', 'algumas', 'nenhuma'].includes(v.r)) return null; if(v.r === 'nenhuma') return 0; const n = v.u && typeof v.u === 'object' ? parseInt(v.u[String(a[0])], 10) : NaN; return n > 0 ? n : (v.r === 'todas' && !(v.u && typeof v.u === 'object') ? 1 : 0); };

  // book do empreendimento: da central (no próprio site ou no Drive), da documentação da construtora, do material do WhatsApp,
  // o PDF achado na pasta do book (servidor) e, por último, a pasta do book no Drive
  ICO.livro = svg('<path d="M12 6.5C10 5 7 4.5 4 5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z"/><path d="M12 6.5V20"/>');
  const driveBaixar = id => 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(id);
  const idDrive = id => !!id && /^[A-Za-z0-9_-]{10,}$/.test(String(id)) && !/^[a-z]+-/.test(String(id));
  const idPasta = u => { const m = /\/folders\/([A-Za-z0-9_-]{10,})/.exec(String(u || '')); return m ? m[1] : null; };
  function bookDe(det, c){
    if(c && c.book && c.pasta && /^[A-Za-z0-9_.-]+\.pdf$/i.test(c.book)) return {u: ESP + 'nex/' + c.pasta + c.book, t: 'Book do empreendimento', s: 'PDF', arq: true, mesmo: true};
    const mo = c && Array.isArray(c.material_oficial) ? c.material_oficial.filter(m => m && idDrive(m.id) && /book/i.test((m.c || '') + ' ' + (m.n || ''))) : [];
    const m = mo.find(x => /cliente/i.test(x.c || '')) || mo.find(x => !/vista/i.test(x.c || '')) || mo[0];
    if(m) return {u: driveBaixar(m.id), t: m.c || 'Book', s: m.mb ? String(m.mb).replace('.', ',') + ' MB' : 'PDF', arq: true};
    const dp = det.docs && det.docs.projeto;
    const d = dp && Array.isArray(dp.docs) ? dp.docs.find(x => x && x.c === 'book' && (urlSegura(x.u) || (x.x !== 'link' && idDrive(x.id)))) : null;
    if(d) return {u: urlSegura(d.u) || driveBaixar(d.id), t: d.t || d.a || 'Book', s: [d.a, d.d].filter(Boolean).join(', ') || 'PDF', arq: true};
    const mat = det.info && Array.isArray(det.info.material) ? det.info.material.find(x => x && x.tipo === 'pdf' && /book/i.test(x.t || '') && urlSegura(x.u)) : null;
    if(mat) return {u: mat.u, t: mat.t, s: 'PDF', arq: true};
    if(det.book && idDrive(det.book.id)) return {u: driveBaixar(det.book.id), t: det.book.t || 'Book', s: 'PDF', arq: true};
    const pid = idPasta(det.info && det.info.drive && det.info.drive.book) || (dp && Array.isArray(dp.pastas) ? (dp.pastas.find(x => x && /^book/i.test(x.c || '') && idDrive(x.id)) || {}).id : null);
    if(pid) return {u: drivePasta(pid), t: 'Pasta do book', s: 'Google Drive', arq: false};
    return null;
  }

  // fluxo de pagamento (mesma regra do app dos Espelhos)
  function fluxoDe(det, a){
    const ex = exDe(a), F = det.dados.tabela && det.dados.tabela.fluxos, FI = det.info && det.info.fluxo;
    let T = null, src = null;
    if(F){ const f = ex.fs || ex.fa; if(f && F[f[0]]){ T = F[f[0]]; src = 'T'; } }
    if(!T && FI && Array.isArray(FI.tabelas) && FI.tabelas.length){ T = FI.tabelas.find(t => t.tipos && t.tipos.includes(a[3])) || FI.tabelas.find(t => t.padrao) || FI.tabelas[0]; src = 'I'; }
    if(!T || !Array.isArray(T.cols)) return null;
    const L = [];
    if(src === 'T'){ const f = ex.fs || ex.fa; T.cols.forEach((c, i) => { const v = +f[i + 1]; if(v > 0) L.push({n: c.n || 1, v, d: c.d, t: c.t, rot: c.rot, fin: c.t === 'fin'}); }); }
    else {
      const tot = ex[FI.base || 'pp'];
      if(FI.aprox || !(tot > 0)) return {T, linhas: [], aprox: true};
      let usado = 0;
      T.cols.forEach(c => { if(c.t === 'fin') return; const n = c.n || 1, v = tot * (+c.p || 0) / 100 / n; usado += v * n; if(v > 0) L.push({n, v, d: c.d, t: c.t, rot: c.rot}); });
      const f = T.cols.find(c => c.t === 'fin'); if(f) L.push({n: 1, v: tot - usado, d: f.d, t: 'fin', rot: f.rot, fin: true});
    }
    const total = L.reduce((s, l) => s + l.v * l.n, 0);
    return {T, linhas: L, total, src};
  }
  const ROT_FLUXO = {ato: 'Ato', sinal: 'Sinal', parc: 'Parcelas', mensal: 'Mensais', semestral: 'Semestrais', anual: 'Anuais', inter: 'Intermediárias', unica: 'Parcela única', chaves: 'Chaves', fin: 'Financiamento'};
  const CORES_FLUXO = ['#C8A24A', '#B08E42', '#9C7F3A', '#85703C', '#6E5F3A', '#5E5236'];
  function fluxoHtml(det, a){
    const fx = fluxoDe(det, a);
    const corr = (det.info && det.info.fluxo && det.info.fluxo.correcao) || (det.dados.tabela && det.dados.tabela.correcao) || '';
    const obs = det.info && det.info.fluxo && det.info.fluxo.obs;
    const cond = det.dados.tabela && Array.isArray(det.dados.tabela.condicoes) ? det.dados.tabela.condicoes.filter(Boolean) : [];
    if(!fx || !fx.linhas.length){
      if(!cond.length) return '';
      return '<p class="texto-2">Condições da ' + esc((det.dados.tabela && det.dados.tabela.nome) || 'tabela') + ':</p><ul class="lista-txt">' + cond.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>';
    }
    const tot = fx.total, fin = fx.linhas.filter(l => l.fin).reduce((s, l) => s + l.v * l.n, 0), ate = tot - fin;
    let ci = 0;
    const cores = fx.linhas.map(l => l.fin ? null : CORES_FLUXO[Math.min(ci++, CORES_FLUXO.length - 1)]);
    const corDe = (l, i) => l.fin ? 'var(--fin)' : cores[i];
    return '<div class="fluxo-barra" role="img" aria-label="' + esc(pctTxt(pct(ate, tot)) + ' pagos até as chaves' + (fin ? ' e ' + pctTxt(pct(fin, tot)) + ' no financiamento' : '')) + '">' +
      fx.linhas.map((l, i) => '<i class="' + (l.fin ? 'fin' : '') + '" style="width:' + pct(l.v * l.n, tot) + '%;background:' + corDe(l, i) + '"></i>').join('') + '</div>' +
      '<div class="fluxo-leg num"><span>' + esc(pctTxt(pct(ate, tot))) + ' até as chaves</span>' + (fin ? '<span>' + esc(pctTxt(pct(fin, tot))) + ' no financiamento</span>' : '') + '</div>' +
      '<dl class="fluxo-lista">' + fx.linhas.map((l, i) => '<div><span class="cor' + (l.fin ? ' fin' : '') + '" aria-hidden="true" style="background:' + corDe(l, i) + '"></span>' +
      '<dt>' + esc(l.rot || ROT_FLUXO[l.t] || l.t || 'Parcela') + '<small>' + esc((l.n > 1 ? l.n + ' parcelas' : '1 parcela') + (l.d ? (l.n > 1 ? ' a partir de ' : ' em ') + mesAnoCurto(l.d) : '')) + '</small></dt>' +
      '<dd><b class="num">' + esc((l.n > 1 ? l.n + 'x ' : '') + BRL(l.v)) + '</b><small>' + esc(pctTxt(pct(l.v * l.n, tot))) + '</small></dd></div>').join('') + '</dl>' +
      ((corr || obs) ? '<p class="nota">' + esc([corr, obs].filter(Boolean).join(' ')) + '</p>' : '');
  }
  function fotosDoProjeto(det, c){
    const out = [], vistos = new Set();
    const add = (src, t, th, mesma) => { if(!src) return; const k = original(src); if(vistos.has(k)) return; vistos.add(k); out.push({src, t: t || '', th: th || (temTamanhos(src) ? tamImg(src, 480) : null), mesma: !!mesma}); };
    if(c && Array.isArray(c.renders)) for(const r of c.renders) add(imgCentral(c, r.id), r.t, imgCentral(c, r.id, true), true);
    if(!out.length) add(det.info && urlImg(det.info.capa), 'Fachada');
    for(const f of (det.fotos || [])){ if(out.length >= 48) break; if(f && f.k === 'planta') continue; add(urlImg(f && f.u), f && f.t, urlImg(f && f.th), /^nex\//.test((f && f.u) || '')); }
    const mat = det.info && Array.isArray(det.info.material) ? det.info.material : [];
    for(const m of mat) if(m && m.tipo === 'foto') add(urlSegura(m.u), m.t);
    return out;
  }
  // plantas que vêm junto das fotos (info.fotos com k 'planta': a = metragens, fin = finais), como as da Lavvi.
  // O título diz o resto: "Planta 25,88 m² · studio · finais 03 a 10" ou "· pavimento do 4º ao 6º e 9º ao 14º andar"
  function finaisDoTitulo(t){
    const m = /\bfina(?:l|is)\s+([^·(]+)/i.exec(String(t || '')); if(!m) return [];
    const out = [];
    for(const parte of m[1].trim().split(/\s*,\s*|\s+e\s+/i)){
      const r = /^(\d{1,3})(?:\s+a\s+(\d{1,3}))?$/i.exec(parte.trim());
      if(!r) return [];   // final com letra (1A, 14B) ou texto: sem como comparar
      const x = +r[1], y = r[2] != null ? +r[2] : x;
      if(y < x || y - x > 60) return [];
      for(let k = x; k <= y; k++) out.push(k);
    }
    return out;
  }
  function andaresDoTitulo(t){
    const out = [], re = /((?:\d{1,2}[º°]\s*(?:ao|a|,|e)?\s*)+)\s*andar(?:es)?\b/gi;
    let m;
    while((m = re.exec(String(t || '')))){
      let prev = null, faixa = false;
      for(const tk of m[1].match(/\d{1,2}[º°]|\bao\b|\ba\b/gi) || []){
        if(/[º°]$/.test(tk)){ const n = parseInt(tk, 10); if(faixa && prev != null){ out.push([prev, n]); prev = null; } else { if(prev != null) out.push([prev, prev]); prev = n; } faixa = false; }
        else faixa = true;
      }
      if(prev != null) out.push([prev, prev]);
    }
    return out;
  }
  function plantasFotos(det){
    const out = [];
    for(const f of (det && det.fotos) || []){
      if(!f || f.k !== 'planta') continue;
      const src = urlImg(f.u); if(!src) continue;
      const tt = String(f.t || 'Planta').trim(), partes = tt.split(/\s+·\s+/);
      let fins = Array.isArray(f.fin) ? f.fin.map(x => /^\d{1,3}$/.test(String(x).trim()) ? +x : NaN) : [];
      if(fins.some(isNaN)) fins = [];
      if(!fins.length) fins = finaisDoTitulo(tt);
      out.push({src, t: partes[0], sub: partes.slice(1).join(', '), tt, as: (Array.isArray(f.a) ? f.a : []).map(Number).filter(x => x > 0), fins, andares: andaresDoTitulo(tt),
        pav: /pavimento/i.test(tt), opc: /op[cç][aã]o|ampliad|outra vers/i.test(tt), tec: /t[eé]cnica/i.test(tt)});
    }
    return out;
  }
  function plantasDoProjeto(det, c){
    const out = [];
    if(c && Array.isArray(c.plantas)) for(const pl of c.plantas) out.push({src: imgCentral(c, pl.id), t: pl.t ? 'Planta ' + pl.t : 'Planta', sub: pl.andares ? pl.andares + (pl.finais && pl.finais.length ? ', finais ' + pl.finais.map(x => String(x).padStart(2, '0')).join(', ') : '') : ''});
    if(!out.length && det.info && Array.isArray(det.info.plantas)) for(const pl of det.info.plantas){ const u = urlImg(pl && pl.u); if(u) out.push({src: u, t: pl.t || 'Planta', sub: pl.a || ''}); }
    if(!out.length){ const pf = plantasFotos(det); for(const x of pf.filter(y => !y.pav).concat(pf.filter(y => y.pav))) out.push({src: x.src, t: x.t, sub: x.sub}); }
    const mat = det.info && Array.isArray(det.info.material) ? det.info.material : [];
    for(const m of mat) if(m && m.tipo === 'planta' && urlSegura(m.u)) out.push({src: m.u, t: m.t || 'Planta', sub: ''});
    return out;
  }
  function telaProjeto(id){
    const p = S.byId.get(id);
    if(!p) return '<div class="vazio"><h2 class="t-3">Projeto não encontrado</h2><p class="texto-2">Ele pode ter saído dos espelhos.</p><a class="btn" href="#/imoveis">Ver os imóveis</a></div>';
    const cache = S.det.get(id), det = cache && cache.v, c = S.centralV.get(id);
    S.vistoProj = det && c !== undefined ? id + ':' + det.gerado_em + ':' + (c ? 1 : 0) : null;
    pos.push(() => carregarProjeto(id));
    if(!det || c === undefined) return migalha(p) + galeriaHtml(p, p.capa ? [{src: p.capa, t: 'Fachada'}] : []) + '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:54px;width:70%"></div><div class="brilho" style="height:8px"></div><div class="brilho" style="height:180px"></div><p class="sub">Buscando os preços de hoje no espelho…</p></div>';
    return projetoHtml(p, det, c);
  }
  async function carregarProjeto(id){
    const alvo = '#/p/' + id;
    try{
      const [det, c] = await Promise.all([detalhe(id), fichaCentral(id)]);
      if(location.hash !== alvo) return;
      if(S.vistoProj !== id + ':' + det.gerado_em + ':' + (c ? 1 : 0)) render();
    }catch(e){
      if(codigoInvalido(e)){ sair('Esse código não vale mais. Digite o código novo do time.'); return; }
      if(location.hash !== alvo) return;
      const box = $('.esqueleto'); if(box) box.outerHTML = '<div class="faixa-aviso" role="alert"><div class="aviso erro">' + ICO.nuvem + '<p>Não consegui abrir a ficha agora. Confira a internet e tente de novo.</p></div><button type="button" class="btn btn-largo" data-acao="recarregar">Tentar de novo</button></div>';
    }
  }
  const migalha = p => '<nav class="migalha" aria-label="Caminho"><a href="#/imoveis" data-acao="voltar">' + ICO.voltar + 'Imóveis</a><span class="so-largo">' + esc(quemDe(p)) + '</span><span class="so-largo" aria-current="page">' + esc(p.nome) + '</span></nav>';
  function galeriaHtml(p, fotos){
    S.fotosAtuais = fotos;
    if(!fotos.length) return '<section class="galeria vazia" aria-label="Fotos do projeto">' + capaVazia(p, 'galeria-vazia') + '</section>';
    if(largo()){
      const g = fotos.slice(0, 5);
      return '<section class="mosaico n' + g.length + '" aria-label="Fotos do projeto">' + g.map((f, i) => '<button type="button" class="mos-item" data-acao="luz" data-i="' + i + '" aria-label="' + esc('Ampliar ' + (f.t || 'foto ' + (i + 1))) + '">' +
        imgTag(f.src, f.t || ('Foto ' + (i + 1) + ' do ' + p.nome), '', {w: i === 0 ? 1600 : 800, sizes: i === 0 ? '50vw' : '25vw', prioridade: i === 0}) + '</button>').join('') +
        '<button type="button" class="btn btn-vidro mos-todas" data-acao="luz" data-i="0">' + ICO.fotos + 'Ver as ' + fotos.length + ' fotos</button></section>';
    }
    return '<section class="galeria-movel" aria-label="Fotos do projeto"><div class="trilho" id="gal" tabindex="0" aria-label="Fotos: deslize para o lado">' +
      fotos.map((f, i) => '<figure><button type="button" class="mos-item" data-acao="luz" data-i="' + i + '" aria-label="' + esc('Ampliar ' + (f.t || 'foto ' + (i + 1))) + '">' + imgTag(f.src, f.t || ('Foto ' + (i + 1) + ' do ' + p.nome), '', {w: 1080, sizes: '92vw', prioridade: i === 0}) + '</button></figure>').join('') + '</div>' +
      '<p class="gal-n num"><span id="gal-t">' + esc(fotos[0].t || '') + '</span><span id="gal-n">1 de ' + fotos.length + '</span></p></section>';
  }
  function unidadeRef(det, chave){   // a mais barata livre (com preço), para o "a partir de" e o fluxo
    const us = (det.dados.unidades || []).filter(a => a[6] === 'disponivel' && precoU(a, chave));
    us.sort((x, y) => precoU(x, chave) - precoU(y, chave));
    return us[0] || null;
  }
  function porTipologia(det, chave){
    const g = new Map();
    for(const a of (det.dados.unidades || [])){
      if(a[6] !== 'disponivel') continue;
      const t = tipologiaU(det, a) || 'Outras unidades', ar = areaU(a), v = precoU(a, chave);
      const x = g.get(t) || {t, n: 0, amin: null, amax: null, pmin: null};
      x.n++; if(ar > 0){ x.amin = x.amin == null ? ar : Math.min(x.amin, ar); x.amax = x.amax == null ? ar : Math.max(x.amax, ar); }
      if(v){ x.pmin = x.pmin == null ? v : Math.min(x.pmin, v); }
      g.set(t, x);
    }
    return [...g.values()].sort((a, b) => (a.pmin == null ? 1e12 : a.pmin) - (b.pmin == null ? 1e12 : b.pmin));
  }
  function painelProj(p, det, c){
    const d = det.dados, info = det.info || {}, chave = chaveBase(det), pc = precosCampos(det), bk = bookDe(det, c);
    const temPv = pc.some(x => x.k === 'pv');
    const us = d.unidades || [];
    const tot = us.length, liv = us.filter(a => a[6] === 'disponivel').length, vend = us.filter(a => a[6] === 'vendida').length, res = us.filter(a => a[6] === 'reservada').length, proc = us.filter(a => a[6] === 'processo_final').length;
    const ref = unidadeRef(det, chave);
    const pRef = ref ? precoU(ref, chave) : null, pvRef = ref && temPv ? precoU(ref, 'pv') : null;
    const regra = (d.tabela && (d.tabela.regra_curta || d.tabela.regra_avista)) || '';
    const tab = d.tabela || {};
    return '<section class="painel-proj" aria-labelledby="cot-t"><h2 class="rotulo" id="cot-t">' + (pRef ? esc((pc.find(x => x.k === chave) || {}).label === 'À vista' ? 'À vista a partir de' : 'Tabela a partir de') : 'Tabela') + '</h2>' +
      (pRef ? '<p class="valor num">' + esc(BRL(pRef)) + '</p>' : '<p class="valor sem">' + (liv ? 'Sem preço publicado' : 'Esgotado no espelho') + '</p>') +
      (ref ? '<p class="texto-2">' + (pvRef && chave !== 'pv' ? 'ou <strong>' + esc(BRL(pvRef)) + ' à vista</strong>. ' : '') + esc([tipologiaU(det, ref), areaU(ref) ? fmtM2(areaU(ref)) : '', 'unidade ' + ref[0]].filter(Boolean).join(', ')) + '.</p>' : '') +
      (regra ? '<p class="nota">' + esc(regra) + '</p>' : '') +
      '<div class="estoque"><div class="l1"><b>' + esc(pctTxt(pct(tot - liv, tot))) + ' do estoque já saiu</b><span class="num">' + esc(liv + ' livres de ' + tot) + '</span></div>' +
      '<div class="barra" role="img" aria-label="' + esc(vend + ' vendidas, ' + (res + proc) + ' reservadas ou em processo e ' + liv + ' livres') + '"><i class="vd" style="width:' + pct(vend, tot) + '%"></i><i class="rs" style="width:' + pct(res + proc, tot) + '%"></i></div>' +
      '<div class="legenda num"><span><i class="c-vd"></i>' + vend + ' vendidas</span><span><i class="c-rs"></i>' + (res + proc) + ' reservadas</span><span><i class="c-lv"></i>' + liv + ' livres</span></div></div>' +
      '<div class="acoes-proj"><button type="button" class="btn btn-pri btn-alto" data-acao="enviar" data-id="' + esc(p.id) + '">' + ICO.enviar + 'Mandar pro cliente</button>' +
      '<div class="btn-linha' + (bk ? ' tres' : '') + '"><a class="btn" href="#/tabelas/' + esc(p.id) + '">' + ICO.planilha + 'Tabela</a>' +
      (bk ? '<a class="btn" href="' + esc(bk.u) + '" target="_blank" rel="noopener"' + (bk.mesmo ? ' download' : '') + ' title="' + esc(bk.arq ? 'Baixar o book (' + bk.t + ')' : 'Abrir a pasta do book no Google Drive') + '">' + ICO.livro + 'Book</a>' : '') +
      '<button type="button" class="btn" data-acao="menu-baixar" data-id="' + esc(p.id) + '">' + ICO.baixar + 'Baixar</button></div>' +
      '<div class="btn-linha"><a class="btn btn-fino" href="#/comparar?p=' + encodeURIComponent(p.id) + '">' + ICO.comparar + 'Comparar</a><a class="btn btn-fino" href="#/posts/' + esc(p.id) + '">' + ICO.foto + 'Criar post</a></div></div>' +
      '<p class="nota">' + esc([tab.nome ? nomeTabela(tab.nome) : '', d.atualizado_em ? 'espelho lido ' + quandoTxt(Date.parse(d.atualizado_em)) : ''].filter(Boolean).join(', ')) + '.</p></section>';
  }
  function projetoHtml(p, det, c){
    const d = det.dados, info = det.info || {}, chave = chaveBase(det);
    const us = d.unidades || [];
    const areas = us.filter(a => a[6] === 'disponivel').map(areaU).filter(v => v > 0);
    const fotos = fotosDoProjeto(det, c);
    const fase = FASE[info.fase] || d.fase || '';
    let h = migalha(p) + galeriaHtml(p, fotos);
    const tipos = porTipologia(det, chave);
    const cab = '<header class="cab-proj"><p class="sub">' + esc([fase && fase + (quemDe(p) ? ' da ' + quemDe(p) : ''), noBairro(p.bairro || info.bairro)].filter(Boolean).join(' ')) + '</p>' +
      '<h1 class="t-0">' + esc(p.nome) + '</h1>' + (info.endereco || d.endereco ? '<p class="texto-2">' + ICO.pino + esc(info.endereco || d.endereco) + (p.cidade && p.cidade !== 'São Paulo' ? ', ' + esc(p.cidade) : '') + '</p>' : '') + '</header>' +
      '<ul class="fatos">' +
      (tipos.length ? '<li><small>Tipologias</small><b>' + esc(tiposTxt(p.tipos) || tipos.map(t => t.t).slice(0, 3).join(', ')) + '</b></li>' : '') +
      (areas.length ? '<li><small>Metragem</small><b class="num">' + esc(Math.min(...areas) === Math.max(...areas) ? fmtM2(Math.round(Math.min(...areas))) : Math.round(Math.min(...areas)) + ' a ' + fmtM2(Math.round(Math.max(...areas)))) + '</b></li>' : '') +
      '<li><small>Entrega</small><b>' + esc(info.fase === 'pronto' ? 'Pronto para morar' : (mesAno(info.entrega) ? maiusc1(mesAno(info.entrega)) : (d.fase || 'A definir'))) + '</b></li>' +
      (info.vagas && info.vagas.r && info.vagas.r !== '?' ? '<li><small>Vaga</small><b>' + esc({todas: 'Todas com vaga', algumas: 'Algumas unidades', nenhuma: 'Sem vaga'}[info.vagas.r] || '') + '</b></li>' : '') +
      '<li><small>Livres</small><b class="num">' + esc(p.livres + ' de ' + p.total) + '</b></li></ul>';
    let corpo = '';
    if(tipos.length){
      corpo += '<section class="sec" aria-labelledby="tip-t"><div class="sec-cab"><h2 class="t-2" id="tip-t">Unidades livres por tipologia</h2><a class="link-mais" href="#/tabelas/' + esc(p.id) + '">Ver todas ' + ICO.seta + '</a></div>' +
        '<div class="tab-tipos" role="table"><div class="tt-lin cab" role="row"><span role="columnheader">Tipologia</span><span role="columnheader">Livres</span><span role="columnheader">Metragem</span><span role="columnheader" class="dir">A partir de</span></div>' +
        tipos.slice(0, 10).map(t => '<a class="tt-lin" role="row" href="#/tabelas/' + esc(p.id) + '" data-acao="tab-tipo" data-v="' + esc(t.t) + '"><span role="cell"><b>' + esc(t.t) + '</b></span><span role="cell" class="num">' + t.n + '</span><span role="cell" class="num">' + esc(t.amin ? (Math.round(t.amin) === Math.round(t.amax) ? fmtM2(Math.round(t.amin)) : Math.round(t.amin) + ' a ' + fmtM2(Math.round(t.amax))) : '') + '</span><span role="cell" class="dir num ouro">' + (t.pmin ? esc(BRL(t.pmin)) : '<span class="apoio">sem preço</span>') + '</span></a>').join('') + '</div></section>';
    }
    const ref = unidadeRef(det, chave);
    { const fh = fluxoHtml(det, ref || us[0] || []); if(fh) corpo += '<section class="sec fluxo" aria-labelledby="flx-t"><h2 class="t-2" id="flx-t">Como o cliente paga</h2>' + (ref ? '<p class="texto-2">' + esc('Na unidade ' + ref[0] + (precoU(ref, chave) ? ' de ' + BRL(precoU(ref, chave)) : '') + ', a mais em conta livre hoje.') + '</p>' : '') + fh + '</section>'; }
    const mov = (det.mov || []).slice(0, 8);
    if(mov.length){
      const porN = new Map(us.map(a => [String(a[0]), a]));
      corpo += '<section class="sec" aria-labelledby="mov-t"><div class="sec-cab"><h2 class="t-2" id="mov-t">Movimento no espelho</h2><a class="link-mais" href="#/pregao">Pregão ' + ICO.seta + '</a></div>' +
        '<p class="texto-2">' + (p.v7 || p.r7 ? '<strong class="ouro">' + esc(plural(p.v7, 'venda', 'vendas')) + '</strong> e ' + esc(plural(p.r7, 'reserva', 'reservas')) + ' em 7 dias.' : 'Sem vendas nem reservas nos últimos 7 dias.') + '</p>' +
        '<ul class="mov">' + mov.map(m => {
          const mm = {tipo: m[2] === 'vendida' ? 'venda' : m[2] === 'reservada' ? 'reserva' : m[2] === 'processo_final' ? 'processo' : m[2] === 'disponivel' ? 'voltou' : 'outro', para: m[2]};
          const a = porN.get(String(m[0])), v = a ? precoU(a, chave) : null;
          return '<li><span class="h num">' + esc(quandoTxt(m[3] * 1000)) + '</span><span class="m"><strong class="u num">' + esc(m[0]) + '</strong> <span class="' + statusCls(mm) + '">' + esc(statusTxt(mm)) + '</span>' +
            (a ? '<small>' + esc([tipologiaU(det, a), areaU(a) ? fmtM2(areaU(a)) : '', andarTxt(a[4])].filter(Boolean).join(', ')) + '</small>' : '') + '</span>' +
            '<span class="v num' + (mm.tipo === 'venda' ? ' ouro' : '') + '">' + (v ? esc(BRLc(v)) : '') + '</span></li>';
        }).join('') + '</ul></section>';
    }
    const sobre = c && c.intro ? c.intro : (c && c.chamada) || info.destaque || '';
    const tipTxt = c && Array.isArray(c.tipologias) && c.tipologias.length ? c.tipologias.map(t => t[0] + (t[1] ? ' (' + t[1] + ')' : '')).join(', ') : (typeof info.tipologias === 'string' ? info.tipologias : '');
    if(sobre || tipTxt) corpo += '<section class="sec" aria-labelledby="sob-t"><h2 class="t-2" id="sob-t">Sobre</h2>' + (sobre ? '<p class="texto ler">' + esc(sobre) + '</p>' : '') + (tipTxt ? '<p class="texto-2">' + esc(tipTxt) + '</p>' : '') + '</section>';
    const lazerC = c && Array.isArray(c.lazer) && c.lazer.length ? c.lazer : null;
    const lazerI = Array.isArray(info.lazer) ? info.lazer.filter(Boolean) : [];
    if(lazerC){
      corpo += '<section class="sec" aria-labelledby="laz-t"><h2 class="t-2" id="laz-t">Lazer</h2>' + lazerC.map(l => '<div class="lazer-bloco"><h3>' + esc(l.onde || '') + '</h3><p>' + esc((l.itens || []).join(', ')) + '</p></div>').join('') +
        (lazerC.some(l => l.planta) ? '<div class="fotos-linha">' + lazerC.filter(l => l.planta).map(l => '<figure class="planta"><button type="button" class="mos-item" data-acao="luz-plantas-lazer" data-src="' + esc(imgCentral(c, l.planta)) + '">' + imgTag(imgCentral(c, l.planta), 'Planta do lazer: ' + (l.onde || '')) + '</button><figcaption>' + esc(l.onde || '') + '</figcaption></figure>').join('') + '</div>' : '') + '</section>';
    }else if(lazerI.length){
      corpo += '<section class="sec" aria-labelledby="laz-t"><h2 class="t-2" id="laz-t">Lazer <span class="q">' + lazerI.length + '</span></h2><ul class="pilulas lazer">' + lazerI.map(x => '<li class="pilula peq estatica">' + esc(x) + '</li>').join('') + '</ul></section>';
    }
    const plantas = plantasDoProjeto(det, c);
    S.plantasAtuais = plantas;
    if(plantas.length){
      corpo += '<section class="sec" aria-labelledby="pla-t"><div class="sec-cab"><h2 class="t-2" id="pla-t">Plantas <span class="q">' + plantas.length + '</span></h2>' + (plantas.length > 1 ? '<button type="button" class="link-mais" data-acao="baixar-plantas" data-id="' + esc(p.id) + '">' + ICO.baixar + 'Baixar todas</button>' : '') + '</div>' +
        '<div class="grade-plantas">' + plantas.map((pl, i) => '<figure class="planta"><button type="button" class="mos-item" data-acao="luz-planta" data-i="' + i + '" aria-label="' + esc('Ampliar ' + pl.t) + '">' + imgTag(pl.src, pl.t, '', {w: 900, sizes: '(min-width: 1024px) 22vw, 70vw'}) + '</button><figcaption>' + esc(pl.t) + (pl.sub ? '<small>' + esc(pl.sub) + '</small>' : '') + '</figcaption></figure>').join('') + '</div>' +
        (c && c.aviso_planta ? '<p class="nota">' + esc(c.aviso_planta) + '</p>' : '') + '</section>';
    }
    if(c && Array.isArray(c.vistas_rooftop) && c.vistas_rooftop.length){
      corpo += '<section class="sec" aria-labelledby="vis-t"><h2 class="t-2" id="vis-t">Vistas</h2><div class="fotos-linha">' + c.vistas_rooftop.map(v => '<figure>' + imgTag(imgCentral(c, v.id), v.t || 'Vista', '', {w: 900}) + '<figcaption>' + esc(v.t || '') + '</figcaption></figure>').join('') + '</div>' +
        (c.aviso_vista ? '<p class="nota">' + esc(c.aviso_vista) + '</p>' : '') + '</section>';
    }
    if(c && Array.isArray(c.perto) && c.perto.length){
      corpo += '<section class="sec perto" aria-labelledby="per-t"><h2 class="t-2" id="per-t">Perto daqui</h2>' + c.perto.map(x => {
        const [mn, como] = x.pe != null ? [x.pe + ' min', 'a pé'] : x.bike != null ? [x.bike + ' min', 'de bike'] : x.carro != null ? [x.carro + ' min', 'de carro'] : x.min != null ? [x.min + ' min', ''] : x.m != null ? [(+x.m >= 1000 ? (+x.m / 1000).toLocaleString('pt-BR', {maximumFractionDigits: 1}) + ' km' : x.m + ' m'), ''] : [null, ''];
        return '<div><span>' + esc(x.nome) + '</span>' + (mn != null ? '<span class="num"><b>' + esc(mn) + '</b>' + (como ? ' <small>' + esc(como) + '</small>' : '') + '</span>' : '') + '</div>';
      }).join('') + (c.perto_fonte ? '<p class="nota">' + esc(c.perto_fonte) + '</p>' : '') + '</section>';
    }
    const fatos = c && Array.isArray(c.fatos) ? c.fatos.filter(x => Array.isArray(x) && x[0]) : (info.ficha_tecnica && typeof info.ficha_tecnica === 'object' ? Object.entries(info.ficha_tecnica).map(([k, v]) => [maiusc1(k.replace(/_/g, ' ')), typeof v === 'string' ? v : JSON.stringify(v)]) : []);
    if(fatos.length) corpo += '<section class="sec" aria-labelledby="fic-t"><h2 class="t-2" id="fic-t">Ficha técnica</h2><dl class="ficha">' + fatos.map(f => '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>').join('') + '</dl></section>';
    if(c && Array.isArray(c.diferenciais) && c.diferenciais.length) corpo += '<section class="sec" aria-labelledby="dif-t"><h2 class="t-2" id="dif-t">Diferenciais</h2><ul class="lista-txt">' + c.diferenciais.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></section>';
    const docs = [];
    if(c && Array.isArray(c.material_oficial)) c.material_oficial.forEach(m => { if(m && m.id) docs.push({t: m.c || m.n, s: (m.n || '') + (m.mb ? ', ' + String(m.mb).replace('.', ',') + ' MB' : ''), u: driveArq(m.id), x: m.ext || 'pdf'}); });
    const dp = det.docs && det.docs.projeto;
    if(dp && Array.isArray(dp.docs)) dp.docs.forEach(x => { const u = urlSegura(x.u) || (x.id && x.x !== 'link' && !/^[a-z]+-/.test(x.id) ? driveArq(x.id) : null); if(u) docs.push({t: x.t || x.a, s: [x.a, x.d].filter(Boolean).join(', '), u, x: x.x || 'pdf'}); });
    if(dp && Array.isArray(dp.pastas)) dp.pastas.forEach(x => { if(x && x.id) docs.push({t: x.c || 'Pasta', s: 'Pasta no Google Drive', u: drivePasta(x.id), x: 'pasta'}); });
    const mat = Array.isArray(info.material) ? info.material : [];
    mat.forEach(m => { if(m && (m.tipo === 'pdf' || m.tipo === 'video') && urlSegura(m.u)) docs.push({t: m.t, s: m.tipo === 'pdf' ? 'PDF' : 'Vídeo', u: m.u, x: m.tipo === 'pdf' ? 'pdf' : 'mp4'}); });
    const site = urlSegura(info.pagina) || urlSegura(info.site);
    if(site) docs.push({t: 'Site oficial do projeto', s: site.replace(/^https:\/\/(www\.)?/, '').split('/')[0], u: site, x: 'site'});
    if(c && c.pagina) docs.unshift({t: 'Ficha completa nos Espelhos', s: 'Fotos, plantas por andar, vistas e simulador', u: ESP + 'nex/' + c.pagina, x: 'ficha'});
    if(docs.length) corpo += '<section class="sec" aria-labelledby="mat-t"><h2 class="t-2" id="mat-t">Material</h2><ul class="docs">' + docs.slice(0, 16).map(x => '<li><a href="' + esc(x.u) + '" target="_blank" rel="noopener"><span class="tipo" aria-hidden="true">' + esc(String(x.x).slice(0, 5)) + '</span><span class="t"><b>' + esc(x.t) + '</b>' + (x.s ? '<small>' + esc(x.s) + '</small>' : '') + '</span>' + ICO.seta + '</a></li>').join('') + '</ul>' +
      (det.docs && Array.isArray(det.docs.geral) && det.docs.geral.length ? '<p class="nota">A ' + esc(det.docs.construtora || 'construtora') + ' também tem ' + det.docs.geral.length + ' materiais gerais (treinamentos, campanhas e formulários) no app dos Espelhos.</p>' : '') + '</section>';
    if(d.nota) corpo += '<p class="legal">' + esc(d.nota) + '</p>';
    if(c && c.legal) corpo += '<p class="legal">' + esc(c.legal) + '</p>';
    corpo += '<p class="legal">Dados do espelho de ' + esc(d.atualizado_em ? quandoTxt(Date.parse(d.atualizado_em)) : 'hoje') + '. ' + esc(d.fonte || '') + (info.capa_fonte ? ' Fotos: ' + esc(info.capa_fonte) + '.' : '') + '</p>';
    const painel = painelProj(p, det, c);
    h += '<div class="proj-grade"><div class="proj-main">' + cab + (largo() ? '' : painel) + corpo + '</div>' + (largo() ? '<aside class="proj-lado">' + painel + '</aside>' : '') + '</div>';
    pos.push(ligarGaleria);
    return h;
  }
  function ligarGaleria(){
    const g = $('#gal'); if(!g) return;
    let t = null;
    g.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => {
      const fig = g.querySelector('figure'); const w = fig ? fig.getBoundingClientRect().width + 10 : g.clientWidth;
      const i = Math.max(0, Math.min((S.fotosAtuais || []).length - 1, Math.round(g.scrollLeft / w))), f = (S.fotosAtuais || [])[i];
      const nt = $('#gal-t'), nn = $('#gal-n'); if(nt) nt.textContent = f ? f.t || '' : ''; if(nn) nn.textContent = (i + 1) + ' de ' + (S.fotosAtuais || []).length;
    }, 60); }, {passive: true});
  }

  // visor de fotos em tela cheia
  function abrirLuz(lista, i, nome){
    if(!lista || !lista.length) return;
    fecharLuz();
    S.luz = {lista, i: i || 0, nome: nome || ''};
    const d = document.createElement('dialog'); d.className = 'luz'; d.id = 'luz'; d.setAttribute('aria-label', 'Fotos' + (nome ? ' do ' + nome : ''));
    d.innerHTML = '<div class="luz-cab"><p class="luz-n num" id="luz-n"></p><p class="luz-t" id="luz-t"></p><div class="luz-acoes">' +
      '<button type="button" class="btn btn-peq btn-vidro" data-acao="luz-baixar">' + ICO.baixar + '<span>Baixar</span></button>' +
      (podeCompartilharArquivos() ? '<button type="button" class="btn btn-peq btn-vidro so-toque" data-acao="luz-compartilhar">' + ICO.compartilhar + '<span>Enviar</span></button>' : '') +
      '<button type="button" class="ico-btn vidro" data-acao="luz-fechar" aria-label="Fechar">' + ICO.fechar + '</button></div></div>' +
      '<div class="luz-trilho" id="luz-trilho">' + lista.map((f, k) => '<figure>' + imgTag(f.src, f.t || ('Foto ' + (k + 1)), '', {w: 2048, sizes: '100vw', extra: k === S.luz.i ? '' : ''}) + '</figure>').join('') + '</div>' +
      (lista.length > 1 ? '<button type="button" class="luz-seta ant" data-acao="luz-ant" aria-label="Foto anterior">' + ICO.anterior + '</button><button type="button" class="luz-seta prox" data-acao="luz-prox" aria-label="Próxima foto">' + ICO.proxima + '</button>' : '');
    document.body.appendChild(d);
    d.addEventListener('close', () => { d.remove(); S.luz = null; });
    d.addEventListener('cancel', () => { /* Esc fecha */ });
    if(typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    const tr = $('#luz-trilho');
    requestAnimationFrame(() => { tr.scrollLeft = S.luz.i * tr.clientWidth; atualizarLuz(S.luz.i); });
    let t = null;
    tr.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => { if(!S.luz) return; const i2 = Math.round(tr.scrollLeft / tr.clientWidth); if(i2 !== S.luz.i) atualizarLuz(i2); }, 70); }, {passive: true});
  }
  function atualizarLuz(i){
    if(!S.luz) return;
    S.luz.i = Math.max(0, Math.min(S.luz.lista.length - 1, i));
    const f = S.luz.lista[S.luz.i];
    const n = $('#luz-n'), t = $('#luz-t'); if(n) n.textContent = (S.luz.i + 1) + ' de ' + S.luz.lista.length; if(t) t.textContent = f.t || '';
    aoMudarLuz();
  }
  function irLuz(delta){
    if(!S.luz) return;
    const tr = $('#luz-trilho'); if(!tr) return;
    const i = Math.max(0, Math.min(S.luz.lista.length - 1, S.luz.i + delta));
    tr.scrollTo({left: i * tr.clientWidth, behavior: menosMov() ? 'auto' : 'smooth'});
    atualizarLuz(i);
  }
  function fecharLuz(){ const d = $('#luz'); if(d){ try{ d.close(); }catch(e){} d.remove(); } S.luz = null; }

  // ================= LISTA (Tabelas e Posts) =================
  function telaListaProjetos(modo){
    const titulo = modo === 'tabelas' ? 'Tabelas' : 'Posts';
    const sub = modo === 'tabelas' ? 'Escolha o projeto para ver as unidades, os preços e o fluxo, marcar as que vão pro cliente e baixar a tabela.' : 'Escolha o projeto. O app monta a arte com a foto, o preço e o seu contato, pronta para o Stories ou o feed.';
    pos.push(() => atualizarLista(modo));
    return '<header class="pg-cab"><div><h1 class="t-1">' + titulo + '</h1><p class="texto-2 ler">' + esc(sub) + '</p></div></header>' +
      '<div class="busca-linha"><label class="busca"><span class="sr">Buscar projeto</span>' + ICO.lupa + '<input id="lq" type="search" autocomplete="off" placeholder="Nome do projeto, construtora ou bairro" value="' + esc(S.ui.listaQ) + '" data-input="lista" data-modo="' + modo + '"></label></div>' +
      '<p class="sub lista-n" id="lista-n"></p><ul class="lista-proj" id="lista"></ul>';
  }
  function atualizarLista(modo){
    const box = $('#lista'); if(!box) return;
    const termos = norm(S.ui.listaQ).split(/\s+/).filter(Boolean);
    let ps = S.P.filter(p => !termos.length || termos.every(t => norm([p.nome, p.curto, p.bairro, quemDe(p), GRUPOS[p.grupo] ? GRUPOS[p.grupo].n : ''].join(' ')).includes(t)));
    ps = ps.sort((a, b) => (b.v7 - a.v7) || (b.r7 - a.r7) || ((b.livres > 0) - (a.livres > 0)) || String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
    $('#lista-n').textContent = termos.length ? plural(ps.length, 'projeto encontrado', 'projetos encontrados') : plural(ps.length, 'projeto', 'projetos') + ', os que mais vendem primeiro';
    box.innerHTML = ps.map(p => '<li><a href="#/' + modo + '/' + esc(p.id) + '">' + miniProj(p) + '<span class="meio"><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span><span>' + esc(modo === 'tabelas' ? (p.tabela ? 'Tabela ' + String(p.tabela).replace(/^tabela(s)? (de )?/i, '') : 'Sem tabela publicada') : plural(p.livres, 'livre', 'livres') + (p.v7 ? ', ' + plural(p.v7, 'venda', 'vendas') + ' na semana' : '')) + '</span></span>' +
      '<span class="fim">' + (precoDe(p) != null ? '<b class="num">' + esc(BRLc(precoDe(p))) + '</b>' : '') + '<span>' + esc(p.livres ? plural(p.livres, 'livre', 'livres') : 'esgotado') + '</span></span></a></li>').join('') +
      (!ps.length ? '<li class="lista-mais">Nenhum projeto com esse nome.</li>' : '');
  }

  // ================= TABELA DE UNIDADES =================
  function telaTabela(id){
    const p = S.byId.get(id);
    if(!p) return '<div class="vazio"><h2 class="t-3">Projeto não encontrado</h2><a class="btn" href="#/tabelas">Ver as tabelas</a></div>';
    if(S.ui.tabProj !== id){ S.ui.tabProj = id; S.ui.tabQ = ''; S.ui.tabFiltro = 'livres'; S.ui.tabMostra = 150; S.ui.tabAberta = null; S.ui.ef = null; S.ui.efMais = false; }
    const ef = espFiltro(id);
    if(S.ui.tabTipoPedido){ ef.tb = S.ui.tabTipoPedido === 'Outras unidades' ? null : S.ui.tabTipoPedido; ef.st = 'disponivel'; }
    S.ui.tabTipoPedido = '';
    const cache = S.det.get(id), det = cache && cache.v;
    const visto = det ? det.gerado_em : null;
    pos.push(async () => {
      try{ const d2 = await detalhe(id); if(location.hash === '#/tabelas/' + id && d2.gerado_em !== visto) render(); }
      catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais. Digite o código novo do time.'); const b = $('.esqueleto'); if(b) b.innerHTML = '<p class="erro-txt">Não consegui abrir a tabela agora. Confira a internet.</p><button type="button" class="btn" data-acao="recarregar">Tentar de novo</button>'; }
    });
    const topo = '<div class="barra-topo"><a class="ico-btn" href="#/tabelas" aria-label="Voltar para a lista de tabelas">' + ICO.voltar + '</a>' + miniProj(p, 'peq so-largo') +
      '<div class="bt-tit"><h1>' + esc(p.nome) + '</h1><p class="sub">' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</p></div>' +
      '<div class="bt-acoes"><button type="button" class="btn btn-peq" data-acao="planilha-tabela" data-id="' + esc(id) + '" aria-label="Baixar a tabela em planilha">' + ICO.planilha + '<span class="so-largo">Planilha</span></button>' +
      '<button type="button" class="btn btn-peq" data-acao="pdf-tabela" data-id="' + esc(id) + '" aria-label="Baixar a tabela em PDF">' + ICO.imprimir + '<span class="so-largo">PDF</span></button>' +
      '<a class="btn btn-peq" href="#/comparar?p=' + encodeURIComponent(id) + '" aria-label="Comparar com outros projetos">' + ICO.comparar + '<span class="so-largo">Comparar</span></a>' +
      '<a class="btn btn-peq so-largo" href="#/p/' + esc(id) + '">Ficha ' + ICO.seta + '</a></div></div>';
    if(!det) return topo + '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:40px"></div><div class="brilho" style="height:60px"></div><div class="brilho" style="height:60px"></div><div class="brilho" style="height:60px"></div></div>';
    return topo + tabelaHtml(p, det);
  }
  const modoTabela = (p, det) => { const pc = precosCampos(det).slice(0, 3); return S.ui.tabModo[p.id] && pc.some(x => x.k === S.ui.tabModo[p.id]) ? S.ui.tabModo[p.id] : chaveBase(det); };
  function recentesDe(det){
    const r = new Map();
    for(const m of (det.mov || [])){ if(Date.now() - m[3] * 1000 < 36 * 3600e3 && !r.has(String(m[0]))) r.set(String(m[0]), m); }
    return r;
  }
  function unidadesTabela(p, det, modo){   // a lista usa os mesmos filtros do espelho, mais Livres / Mexeram / Todas
    const fil = S.ui.tabFiltro, q = norm(S.ui.tabQ).trim(), f = espFiltro(p.id);
    const U = espUnidades(det, S.centralV.get(p.id) || null), recentes = recentesDe(det);
    const base = U.filter(u => espBate(u, f, modo));
    const cont = {livres: base.filter(u => u.st === 'disponivel').length, todas: base.length, mov: base.filter(u => recentes.has(u.n)).length};
    let sel = base;
    if(fil === 'livres') sel = sel.filter(u => u.st === 'disponivel');
    else if(fil === 'mov') sel = sel.filter(u => recentes.has(u.n));
    if(q) sel = sel.filter(u => norm(u.n).includes(q) || norm(u.tl).includes(q));
    const us = sel.map(u => u.a);
    const andN = v => v === 'T' || v === 'S' || v === 'L' || v === 'G' ? 0 : (+v || 0);
    us.sort((x, y) => fil === 'livres' ? ((precoU(x, modo) || 1e12) - (precoU(y, modo) || 1e12)) : (andN(y[4]) - andN(x[4])) || String(x[0]).localeCompare(String(y[0]), 'pt-BR', {numeric: true}));
    return {us, cont, recentes};
  }
  function tabelaHtml(p, det){
    const d = det.dados, pc = precosCampos(det).slice(0, 3), modo = modoTabela(p, det), vista = vistaTab(det);
    const tab = d.tabela || {};
    const lido = d.atualizado_em ? quandoTxt(Date.parse(d.atualizado_em)) : '';
    const tabEm = tab.atualizado_em ? quandoTxt(Date.parse(tab.atualizado_em)) : '';
    if(!S.centralV.has(p.id)) pos.push(() => fichaCentral(p.id).then(c => { if(c && location.hash === '#/tabelas/' + p.id) atualizarTabela(); }).catch(() => {}));
    if(S.ui.tabQ && vista === 'espelho') pos.push(() => setTimeout(espRolarAchada, 60));
    return '<div class="tab-ctl">' +
      '<p class="sub">' + esc([tab.nome ? nomeTabela(tab.nome) : 'Sem tabela publicada', tabEm ? 'atualizada ' + tabEm : ''].filter(Boolean).join(', ')) + '. Espelho lido ' + esc(lido || 'hoje') + '.</p>' +
      '<div class="tab-ctl-lin">' +
      (espTemGrade(det) ? '<div class="seg seg-vista" role="group" aria-label="Como ver as unidades"><button type="button" data-acao="tab-vista" data-v="espelho" aria-pressed="' + (vista === 'espelho') + '">' + ICO.predio + 'Espelho</button><button type="button" data-acao="tab-vista" data-v="lista" aria-pressed="' + (vista === 'lista') + '">' + ICO.lista + 'Lista</button></div>' : '') +
      (pc.length > 1 ? '<div class="seg" role="group" aria-label="Preço mostrado">' + pc.map(x => '<button type="button" data-acao="tab-modo" data-id="' + esc(p.id) + '" data-v="' + esc(x.k) + '" aria-pressed="' + (modo === x.k) + '">' + esc(x.label) + '</button>').join('') + '</div>' : '') +
      '<label class="busca mini"><span class="sr">Buscar unidade</span>' + ICO.lupa + '<input type="search" inputmode="search" autocomplete="off" placeholder="' + (vista === 'espelho' ? 'Nº da unidade' : 'Unidade ou tipologia') + '" value="' + esc(S.ui.tabQ) + '" data-input="tab-q"></label></div>' +
      (tab.regra_curta ? '<p class="nota">' + esc(tab.regra_curta) + '</p>' : '') + '</div>' +
      '<div id="tab-lista">' + tabListaHtml(p, det) + '</div>';
  }
  function tabListaHtml(p, det){
    if(vistaTab(det) === 'espelho') return espelhoCorpoHtml(p, det);
    const pc = precosCampos(det).slice(0, 3), modo = modoTabela(p, det);
    const sel = S.ui.tabSel.get(p.id) || new Set();
    const {us, cont, recentes} = unidadesTabela(p, det, modo);
    const c = S.centralV.get(p.id) || null;
    let h = '<div class="pilulas rola tab-fil" role="group" aria-label="Quais unidades">' + [['livres', 'Livres', cont.livres], ['mov', 'Mexeram hoje e ontem', cont.mov], ['todas', 'Todas', cont.todas]].map(x => '<button type="button" class="pilula peq" data-acao="tab-fil" data-v="' + x[0] + '" aria-pressed="' + (S.ui.tabFiltro === x[0]) + '">' + esc(x[1]) + '<span class="n">' + x[2] + '</span></button>').join('') + '</div>' +
      espChipsHtml(espUnidades(det, c), espFiltro(p.id), modo, det, recentes, c, true);
    if(!us.length) h += '<p class="texto-2 vazio-txt">' + (S.ui.tabQ.trim() ? 'Nenhuma unidade com “' + esc(S.ui.tabQ.trim()) + '”.' : S.ui.tabFiltro === 'livres' ? 'Nenhuma unidade livre com esse filtro.' : S.ui.tabFiltro === 'mov' ? 'Nenhuma unidade mexeu nas últimas 36 horas.' : 'Nada com esse filtro.') + '</p>';
    const lim = S.ui.tabMostra || 150;
    const temPv = pc.some(x => x.k === 'pv') && modo !== 'pv';
    if(us.length && tabelaLarga()){
      h += '<div class="tab-u" role="table" aria-label="Unidades do ' + esc(p.nome) + '"><div class="tu2 cab" role="row"><span role="columnheader"><span class="sr">Marcar</span></span><span role="columnheader">Unidade</span><span role="columnheader">Andar</span><span role="columnheader">Tipologia</span><span role="columnheader" class="dir">Área</span><span role="columnheader">Faixa</span><span role="columnheader">Status</span><span role="columnheader" class="dir">' + esc((pc.find(x => x.k === modo) || {}).label || 'Preço') + '</span>' + (temPv ? '<span role="columnheader" class="dir">À vista</span>' : '<span role="columnheader"></span>') + '<span role="columnheader" class="dir">R$/m²</span><span role="columnheader"><span class="sr">Fluxo</span></span></div>' +
        us.slice(0, lim).map(a => linhaTabela(p, det, a, modo, sel, recentes, temPv)).join('') + '</div>';
    }else if(us.length) h += '<div class="unid" role="list">' + us.slice(0, lim).map(a => unidadeHtml(p, det, a, modo, sel, recentes)).join('') + '</div>';
    if(us.length > lim) h += '<button type="button" class="btn btn-largo" data-acao="tab-mais">Mostrar mais ' + Math.min(200, us.length - lim) + ' de ' + (us.length - lim) + '</button>';
    if(sel.size) h += barraTabelaHtml(p, sel);
    return h;
  }
  function atualizarTabela(){   // repinta só a lista, sem mexer na busca nem nos botões de cima
    const m = /^#\/tabelas\/([a-z0-9-]+)$/.exec(location.hash), box = $('#tab-lista');
    if(!m || !box) return;
    const p = S.byId.get(m[1]), c = S.det.get(m[1]), det = c && c.v;
    if(!p || !det) return;
    const ae = document.activeElement, foco = ae && box.contains(ae) && ae.dataset ? (ae.dataset.acao || '') + '|' + (ae.dataset.n || '') + '|' + (ae.dataset.k || '') + '|' + (ae.dataset.v || '') : null;
    const rola = $('.ep-rola', box), lado = rola ? rola.scrollLeft : 0, ops = $$('.ef-ops', box).map(e => e.scrollLeft);
    box.innerHTML = tabListaHtml(p, det);
    const r2 = $('.ep-rola', box); if(r2 && lado) r2.scrollLeft = lado;
    $$('.ef-ops', box).forEach((e, i) => { if(ops[i]) e.scrollLeft = ops[i]; });
    if(foco){ const [a, n, k, v] = foco.split('|'); const el = $$('[data-acao="' + a + '"]', box).find(e => (e.dataset.n || '') === n && (e.dataset.k || '') === k && (e.dataset.v || '') === v) || $$('[data-acao="' + a + '"]', box).find(e => (e.dataset.n || '') === n); if(el) el.focus({preventScroll: true}); }
  }
  function stDe(det, a, m){
    const livre = a[6] === 'disponivel';
    const qd = m ? (diaKey(m[3] * 1000) === S.hoje ? 'às ' + hora(m[3] * 1000) : quandoTxt(m[3] * 1000)) : '';
    return {livre, txt: livre ? (m ? 'voltou ' + qd : 'livre') : (stLabel(det, a[6]) + (m ? ' ' + qd : '')).toLowerCase(), cls: a[6] === 'vendida' ? 'st-vendida' : livre ? 'st-livre' : 'st-reservada'};
  }
  function linhaTabela(p, det, a, modo, sel, recentes, temPv){
    const n = String(a[0]), v = precoU(a, modo), pv = temPv ? precoU(a, 'pv') : null, mk = sel.has(n), m = recentes.get(n), ar = areaU(a), aberta = S.ui.tabAberta === p.id + ':' + n;
    const st = stDe(det, a, m), cat = (det.dados.cat_nome && det.dados.cat_nome[a[3]]) || a[3] || '';
    return '<div class="tu2-bloco' + (mk ? ' marcada' : '') + (st.livre ? '' : ' indisp') + (m ? ' novo' : '') + '"><div class="tu2" role="row">' +
      '<span role="cell">' + (st.livre ? '<button type="button" class="ck-btn" data-acao="tab-ck" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-pressed="' + mk + '" aria-label="Marcar a unidade ' + esc(n) + '"><span class="ck">' + ICO.ok + '</span></button>' : '') + '</span>' +
      '<span role="cell" class="num"><b>' + esc(n) + '</b></span><span role="cell">' + esc(andarTxt(a[4])) + '</span><span role="cell">' + esc(tipologiaU(det, a) || '') + '</span>' +
      '<span role="cell" class="dir num">' + esc(ar ? fmtM2(ar) : '') + '</span><span role="cell" class="pequeno">' + esc(cat) + '</span>' +
      '<span role="cell" class="' + st.cls + '">' + esc(st.txt) + '</span>' +
      '<span role="cell" class="dir num"><b>' + (v ? esc(BRL(v)) : '<span class="apoio">sem preço</span>') + '</b></span>' +
      '<span role="cell" class="dir num">' + (pv ? esc(BRL(pv)) : '') + '</span>' +
      '<span role="cell" class="dir num apoio">' + (v && ar ? esc(BRL(v / ar)) : '') + '</span>' +
      '<span role="cell"><button type="button" class="link-mais" data-acao="tab-abrir" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-expanded="' + aberta + '">Fluxo ' + ICO.baixo + '</button></span></div>' +
      (aberta ? '<div class="detalhe">' + (fluxoHtml(det, a) || '<p class="texto-2">Sem fluxo cadastrado para esta unidade.</p>') + '</div>' : '') + '</div>';
  }
  function unidadeHtml(p, det, a, modo, sel, recentes){
    const n = String(a[0]), v = precoU(a, modo), mk = sel.has(n), m = recentes.get(n), aberta = S.ui.tabAberta === p.id + ':' + n;
    const st = stDe(det, a, m);
    const desc = [tipologiaU(det, a), areaU(a) ? fmtM2(areaU(a)) : ''].filter(Boolean).join(', ');
    const sub = [andarTxt(a[4]), a[3] && a[3] !== 'R2V' ? a[3] : ''].filter(Boolean).join(', ');
    return '<div class="u' + (mk ? ' marcada' : '') + (st.livre ? '' : ' indisp') + (m ? ' novo' : '') + '" role="listitem"><div class="u-grade' + (st.livre ? '' : ' sem-ck') + '">' +
      (st.livre ? '<button type="button" class="ck-btn" data-acao="tab-ck" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-pressed="' + mk + '" aria-label="Marcar a unidade ' + esc(n) + ' para mandar"><span class="ck">' + ICO.ok + '</span></button>' : '') +
      '<button type="button" class="u-lin" data-acao="tab-abrir" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-expanded="' + aberta + '">' +
      '<span class="n num">' + esc(n) + '<small>' + esc(sub) + '</small></span><span class="d">' + esc(desc) + '<small class="' + st.cls + '">' + esc(st.txt) + '</small></span>' +
      '<span class="p num">' + (v ? esc(BRL(v)) : '<span class="apoio">sem preço</span>') + '</span></button></div>' +
      (aberta ? '<div class="detalhe">' + (fluxoHtml(det, a) || '<p class="texto-2">Sem fluxo cadastrado para esta unidade.</p>') + '</div>' : '') + '</div>';
  }

  // ================= ENVIAR PRO CLIENTE =================
  function camposAssinatura(){
    const pf = perfil();
    return '<fieldset><legend>Sua assinatura</legend><div class="campos-2"><label class="campo">Seu nome<input id="env-cor" maxlength="40" autocomplete="name" value="' + esc(pf.nome || '') + '"></label>' +
      '<label class="campo">Seu WhatsApp<input id="env-tel" maxlength="20" inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000" value="' + esc(pf.tel || '') + '"></label></div></fieldset>';
  }
  async function abrirEnvio(id, daTabela){
    const p = S.byId.get(id); if(!p) return;
    abrirFolha('envio', 'Mandar pro cliente', '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:50px"></div><div class="brilho" style="height:120px"></div><p class="sub">Abrindo as unidades livres…</p></div>', '');
    const dlg = $('#folha-envio');
    let det;
    try{ det = await detalhe(id); }
    catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais.'); if(dlg && dlg.isConnected) corpoFolha('<p class="erro-txt" role="alert">Não consegui abrir as unidades agora. Confira a internet e tente de novo.</p>', null, dlg); return; }
    const c = await fichaCentral(id).catch(() => null);
    if(!dlg || !dlg.isConnected) return;
    const chave = chaveBase(det), pc = precosCampos(det);
    const sel = daTabela ? new Set(S.ui.tabSel.get(id) || []) : new Set();
    const livres = (det.dados.unidades || []).filter(a => a[6] === 'disponivel').sort((x, y) => (precoU(x, chave) || 1e12) - (precoU(y, chave) || 1e12));
    if(!sel.size && livres[0]) sel.add(String(livres[0][0]));
    const comPers = persDoProjeto(id).filter(n => livres.some(a => String(a[0]) === n));
    const st = {id, sel, modo: S.ui.tabModo[id] || chave, formato: [...sel].some(n => persDe(id, n)) ? 'pers' : c && c.pagina ? 'ficha' : 'selecao', central: !!(c && c.pagina)};
    S.envio = st;
    const listaU = livres.filter((a, i) => i < 80 || sel.has(String(a[0]))).sort((x, y) => sel.has(String(y[0])) - sel.has(String(x[0]))).map(a => {
      const n = String(a[0]), v = precoU(a, st.modo) || precoU(a, chave);
      return '<label class="u-opc"><input type="checkbox" data-input="env-u" value="' + esc(n) + '"' + (sel.has(n) ? ' checked' : '') + '><span class="u-opc-t"><b class="num">' + esc(n) + '</b><span>' + esc([tipologiaU(det, a), areaU(a) ? fmtM2(areaU(a)) : '', andarTxt(a[4])].filter(Boolean).join(', ')) + '</span></span><span class="num ouro">' + (v ? esc(BRLc(v)) : '') + '</span></label>';
    }).join('');
    corpoFolha(
      '<div class="env-proj">' + miniProj(p) + '<p><b>' + esc(p.nome) + '</b><span>O cliente recebe um link com fotos e os valores das unidades marcadas.</span></p></div>' +
      '<label class="campo">Nome do cliente<input id="env-cli" maxlength="60" autocomplete="off" placeholder="Ex.: Maria" required></label>' +
      envFormatosHtml(st, comPers) +
      '<fieldset><legend>Unidades (' + livres.length + ' livres)</legend><div class="u-opcs" id="env-us">' + (listaU || '<p class="texto-2">Nenhuma unidade livre agora.</p>') + '</div>' + (livres.length > 80 ? '<p class="nota">Mostrando as 80 mais em conta.</p>' : '') + '</fieldset>' +
      (pc.length > 1 ? '<fieldset id="env-modo-f"' + (st.formato === 'pers' ? ' hidden' : '') + '><legend>Valor mostrado</legend><div class="seg" role="group">' + pc.slice(0, 3).map(x => '<button type="button" data-acao="env-modo" data-v="' + esc(x.k) + '" aria-pressed="' + (st.modo === x.k) + '">' + esc(x.label) + '</button>').join('') + '</div></fieldset>' : '') +
      camposAssinatura() + '<p class="erro-txt" id="env-erro" role="alert"></p>',
      '<button type="button" class="btn btn-pri btn-alto" data-acao="env-criar" id="env-ok">' + ICO.enviar + 'Criar o link</button>', dlg);
    setTimeout(() => { const i = $('#env-cli'); if(i && !ehToque()) i.focus(); }, 80);
  }
  function envFormatosHtml(st, comPers){
    const ops = [];
    if(comPers.length) ops.push(['pers', 'Ficha com o fluxo personalizado', 'O fluxo que você montou' + (comPers.length <= 3 ? ' (' + comPers.join(', ') + ')' : '') + ', com fotos e plantas. As outras unidades marcadas recebem a mesma entrada e parcelas. Até 4 unidades.']);
    ops.push(['ficha', st.central ? 'Ficha completa' : 'Ficha com a condição da tabela', 'Fotos, plantas' + (st.central ? ', lazer, mapa' : ' e mapa') + ' e o fluxo da tabela de cada unidade. Até 4 unidades.']);
    ops.push(['selecao', 'Só as unidades', 'Uma página com as unidades marcadas, fotos e o preço de cada uma. Até 40 unidades.']);
    return '<fieldset><legend>O que o cliente recebe</legend><div class="env-ops" role="radiogroup" aria-label="O que o cliente recebe">' + ops.map(o => '<button type="button" class="env-op" role="radio" data-acao="env-fmt" data-v="' + o[0] + '" aria-checked="' + (st.formato === o[0]) + '"><i aria-hidden="true"></i><span><b>' + esc(o[1]) + '</b><small>' + esc(o[2]) + '</small></span></button>').join('') + '</div></fieldset>';
  }
  function abrirEnvioMulti(){
    if(!S.sel.size) return;
    const its = [...S.sel.values()].map(v => ({p: S.byId.get(v.p), u: (S.U && S.U.get(v.p) || []).find(u => u.n === v.n), n: v.n})).filter(x => x.p);
    const porP = new Map(); for(const x of its){ if(!porP.has(x.p.id)) porP.set(x.p.id, []); porP.get(x.p.id).push(x); }
    S.envio = {multi: true, modo: S.f.modo};
    const lista = [...porP.values()].map(g => '<div class="env-grupo"><p class="env-g-t">' + miniProj(g[0].p, 'peq') + '<b>' + esc(g[0].p.nome) + '</b><span>' + esc(plural(g.length, 'unidade', 'unidades')) + '</span></p>' +
      g.map(x => '<p class="env-u"><span class="num"><b>' + esc(x.n) + '</b></span><span>' + esc(x.u ? [tipoNome(x.u.k), x.u.a ? fmtM2(x.u.a) : '', andarCurto(x.u.at)].filter(Boolean).join(', ') : '') + '</span><span class="num ouro">' + (x.u && prU(x.u, S.f) ? esc(BRLc(prU(x.u, S.f))) : '') + '</span></p>').join('') + '</div>').join('');
    abrirFolha('envio', 'Mandar pro cliente',
      '<p class="texto-2">' + esc(plural(its.length, 'unidade', 'unidades') + ' de ' + plural(porP.size, 'projeto', 'projetos')) + '. O cliente recebe uma página com as fotos e os valores e pode abrir cada projeto.</p>' +
      '<label class="campo">Nome do cliente<input id="env-cli" maxlength="60" autocomplete="off" placeholder="Ex.: Maria" required></label>' +
      '<fieldset><legend>Valor mostrado</legend><div class="seg" role="group">' + [['pp', 'Tabela'], ['pv', 'À vista']].map(x => '<button type="button" data-acao="env-modo" data-v="' + x[0] + '" aria-pressed="' + (S.envio.modo === x[0]) + '">' + x[1] + '</button>').join('') + '</div></fieldset>' +
      '<fieldset><legend>Unidades</legend><div class="env-lista">' + lista + '</div></fieldset>' + camposAssinatura() + '<p class="erro-txt" id="env-erro" role="alert"></p>',
      '<button type="button" class="btn btn-pri btn-alto" data-acao="env-criar" id="env-ok">' + ICO.enviar + 'Criar o link</button>');
    setTimeout(() => { const i = $('#env-cli'); if(i && !ehToque()) i.focus(); }, 80);
  }
  async function criarEnvio(){
    const st = S.envio; if(!st) return;
    const cli = $('#env-cli').value.trim(), cor = $('#env-cor').value.trim(), tel = $('#env-tel').value.trim();
    const erro = m => { $('#env-erro').textContent = m; };
    if(!cli){ erro('Digite o nome do cliente.'); $('#env-cli').focus(); return; }
    let itens, p = null, formato = 'selecao', texto;
    if(st.multi){
      itens = st.itens || [...S.sel.values()].map(v => ({p: v.p, n: v.n}));
      if(!itens.length){ erro('Nenhuma unidade marcada.'); return; }
      texto = st.texto || textoBusca(S.f);
    }else{
      p = S.byId.get(st.id);
      const us = $$('#env-us input:checked').map(i => i.value);
      if(!us.length){ erro('Marque pelo menos uma unidade.'); return; }
      formato = st.formato === 'pers' || st.formato === 'ficha' ? st.formato : 'selecao';
      if(formato !== 'selecao' && us.length > 4){ erro('A ficha leva até 4 unidades. Desmarque algumas ou escolha "Só as unidades".'); return; }
      if(formato === 'pers' && !us.some(n => persDe(p.id, n))){ erro('Nenhuma das unidades marcadas tem fluxo personalizado. Monte o fluxo na ficha da unidade ou escolha outra opção.'); return; }
      itens = us.map(n => ({p: p.id, n}));
      texto = p.nome;
    }
    salvarPerfil({nome: cor, tel});
    const b = $('#env-ok'); b.disabled = true; b.textContent = 'Criando o link…'; erro('');
    try{
      let url, avisos = false, pelaTabela = [];
      if(formato === 'ficha' || formato === 'pers'){
        const det = await detalhe(p.id), vs = valoresDoEnvio(det, p.id, itens.map(x => x.n), formato, st.modo);
        pelaTabela = vs.pelaTabela;
        const r = await rpc('link_criar', {p_codigo: S.cod, p_dono: dono(), p_endpoint: null, p_projeto: p.id, p_cliente: cli, p_corretor: cor, p_whats: tel, p_unidades: vs.itens});
        const c = await fichaCentral(p.id);
        url = new URL(ESP + 'nex/' + ((c && c.pagina) || 'ver.html') + '?l=' + encodeURIComponent(r.id), location.href).href;
        avisos = !!r.avisos;
      }else{
        const r = await rpc('selecao_criar', {p_codigo: S.cod, p_dono: dono(), p_endpoint: null, p_cliente: cli, p_corretor: cor, p_whats: tel,
          p_busca: Object.assign({texto, modo: st.modo, criterios: {}, origem: 'app'}, st.cmp ? {cmp: st.cmp} : {}), p_itens: itens});
        url = new URL(ESP + 's.html?s=' + encodeURIComponent(r.id), location.href).href;
        avisos = !!r.avisos;
      }
      const qtd = itens.length, nome1 = primeiroNome(cli);
      const msg = 'Olá, ' + nome1 + ', tudo bem? ' + (formato === 'pers' ? 'Separei a ficha do ' + p.nome + ' com a condição de pagamento que montei para você: ' : formato === 'ficha' ? 'Separei a ficha do ' + p.nome + ' para você, com fotos, plantas e os valores: '
        : st.cmp ? 'Separei ' + qtd + ' opções para você comparar lado a lado, com fotos e valores: ' : st.multi ? 'Separei ' + (qtd === 1 ? 'uma opção' : qtd + ' opções') + ' para você, com fotos e valores: ' : 'Separei ' + (qtd === 1 ? 'uma opção' : qtd + ' opções') + ' do ' + p.nome + ' para você, com fotos e valores: ') + url;
      S.envioPronto = {url, msg};
      const dlg = $('#folha-envio'); if(!dlg) return;
      corpoFolha('<div class="aviso ok" role="status">' + ICO.ok + '<p>Link pronto para ' + esc(nome1) + '. ' + (formato === 'pers' ? 'Ficha com o fluxo personalizado' : formato === 'ficha' ? 'Ficha' : 'Página') + ' com ' + esc(plural(qtd, 'unidade', 'unidades')) + '.' + (pelaTabela.length ? ' ' + esc((pelaTabela.length === 1 ? 'A ' + pelaTabela[0] + ' foi' : 'As unidades ' + pelaTabela.join(', ') + ' foram') + ' pela tabela: a mesma entrada e parcelas passam do valor dela.') : '') + (avisos ? ' Você recebe um aviso neste aparelho quando ' + esc(nome1) + ' abrir.' : '') + '</p></div>' +
        '<label class="campo">Mensagem<textarea id="env-msg" rows="5">' + esc(msg) + '</textarea><small>Dá para mudar o texto antes de mandar.</small></label>' +
        '<label class="campo">WhatsApp do cliente<input id="env-tel-cli" type="tel" inputmode="tel" autocomplete="off" maxlength="20" placeholder="Opcional"><small>Com o número, o botão do WhatsApp abre a conversa do cliente direto. O número não fica salvo.</small></label>' +
        '<p class="link-pronto">' + esc(url) + '</p>' +
        '<a class="btn" href="' + esc(url + (url.indexOf('?') >= 0 ? '&' : '?') + 'previa=1') + '" target="_blank" rel="noopener">Ver como o cliente vê ' + ICO.seta + '</a>',
        '<button type="button" class="btn" data-acao="env-copiar">' + ICO.copiar + 'Copiar</button><a class="btn btn-pri" id="env-wa" href="https://wa.me/?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener" data-acao="env-wa">' + ICO.zap + 'WhatsApp</a>', dlg);
      if(st.multi){ if(!st.cmp) S.sel.clear(); if(location.hash === '#/imoveis') atualizarImoveis(); }
      else{ S.ui.tabSel.delete(p.id); atualizarTabela(); }
    }catch(e){
      b.disabled = false; b.innerHTML = ICO.enviar + 'Criar o link';
      const t = (e && e.body) || '';
      erro(codigoInvalido(e) ? 'O código do time mudou. Entre de novo.' : /unidade_invalida/.test(t) ? 'Uma das unidades saiu do espelho. Feche e abra de novo.' : /limite_/.test(t) ? 'Limite de links por dia atingido neste aparelho. Tente amanhã.' : /muitas_unidades|muitos_projetos/.test(t) ? 'Seleção grande demais: até 40 unidades de até 15 projetos.' : 'Não consegui criar o link agora. Confira a internet e tente de novo.');
    }
  }

  // ================= POSTS =================
  // Arte de 1080 px para Stories (1080x1920) e feed (1080x1350). A foto vem direto do site quando ele libera,
  // senão pelo servidor de fotos do app, para o canvas poder ser salvo.
  const VARS = {
    Ouro: {banda: 'rgba(14,12,9,0.94)', caixa: '#C8A24A', caixaTexto: '#0E0C09', texto: '#F3EEE4', apoio: '#CFC6B4', contato: '#C8A24A', fio: '#3A352C'},
    Creme: {banda: 'rgba(14,12,9,0.94)', caixa: '#F3EEE4', caixaTexto: '#0E0C09', texto: '#F3EEE4', apoio: '#CFC6B4', contato: '#C8A24A', fio: '#3A352C'},
    Noite: {banda: 'rgba(246,243,236,0.96)', caixa: '#0E0C09', caixaTexto: '#F3EEE4', texto: '#1C1913', apoio: '#5C5446', contato: '#6B5216', fio: '#CFC7B7'}
  };
  const FONTE_URL = 'fonts/mona-sans.woff2';
  let fontesPost = null;
  function carregarFontesPost(){   // "Mona Larga" é a Mona Sans travada na largura 118%, para o canvas
    if(fontesPost) return fontesPost;
    fontesPost = (async () => {
      try{
        if(typeof FontFace !== 'undefined'){
          const ff = new FontFace('Mona Larga', 'url(' + FONTE_URL + ') format("woff2")', {weight: '200 900', stretch: '118%', style: 'normal'});
          document.fonts.add(ff); await ff.load();
        }
      }catch(e){}
      try{ await Promise.all(['700 72px "Mona Larga"', '400 38px "Mona Sans"', '600 30px "Mona Sans"', '700 32px "Mona Sans"'].map(f => document.fonts.load(f))); }catch(e){}
    })();
    return fontesPost;
  }
  function telaPost(id){
    const p = S.byId.get(id);
    if(!p) return '<div class="vazio"><h2 class="t-3">Projeto não encontrado</h2><a class="btn" href="#/posts">Escolher outro</a></div>';
    const topo = '<div class="barra-topo"><a class="ico-btn" href="#/posts" aria-label="Voltar para a lista">' + ICO.voltar + '</a>' + miniProj(p, 'peq so-largo') + '<div class="bt-tit"><h1>Post do ' + esc(nomeCurto(p)) + '</h1><p class="sub">' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</p></div></div>';
    if(!S.post || S.post.id !== id) S.post = {id, fmt: 'story', assunto: 'preco', var: 'Ouro', foto: 0, fotos: null, titulo: null, linha: null, legenda: null, local: null, blob: null};
    pos.push(() => prepararPost(id));
    return topo + '<div id="post-corpo"><div class="esqueleto" aria-busy="true"><div class="brilho" style="height:420px;width:240px;margin:0 auto"></div><p class="sub" style="text-align:center">Lendo a ficha e as fotos…</p></div></div>';
  }
  async function prepararPost(id){
    const alvo = '#/posts/' + id;
    let det, c;
    try{ [det, c] = await Promise.all([detalhe(id), fichaCentral(id)]); }
    catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais.'); const b = $('#post-corpo'); if(b) b.innerHTML = '<div class="faixa-aviso"><p class="erro-txt">Não consegui abrir a ficha agora. Confira a internet.</p><button type="button" class="btn" data-acao="recarregar">Tentar de novo</button></div>'; return; }
    if(location.hash !== alvo) return;
    const st = S.post, p = S.byId.get(id);
    if(!st.fotos) st.fotos = fotosDoProjeto(det, c).slice(0, 18).map(f => ({src: f.src, th: f.th, t: f.t, ok: null}));
    st.det = det; st.c = c;
    const textos = textosPost(p, det, c, st.assunto);
    if(st.titulo == null) st.titulo = textos.titulo;
    if(st.linha == null) st.linha = textos.linha;
    if(st.legenda == null) st.legenda = legendaPost(p, det, c);
    const assuntos = [['preco', 'Preço'], ['local', 'Localização'], ['entrega', 'Entrega'], ['lazer', 'Lazer']];
    const pf = perfil();
    $('#post-corpo').innerHTML = '<div class="post-grade">' +
      '<div class="post-prev-col"><div class="post-prev' + (st.fmt === 'feed' ? ' feed' : '') + '" id="post-prev"><canvas id="post-cv" width="1080" height="' + (st.fmt === 'feed' ? 1350 : 1920) + '" role="img" aria-label="Prévia do post"></canvas></div>' +
      '<p class="sub post-aviso" id="post-aviso" aria-live="polite"></p></div>' +
      '<div class="post-ctl">' +
      '<fieldset><legend>Formato</legend><div class="seg" role="group" aria-label="Formato"><button type="button" data-acao="post-fmt" data-v="story" aria-pressed="' + (st.fmt === 'story') + '">Stories</button><button type="button" data-acao="post-fmt" data-v="feed" aria-pressed="' + (st.fmt === 'feed') + '">Feed</button></div></fieldset>' +
      '<fieldset><legend>Assunto</legend><div class="pilulas" role="group" aria-label="Assunto do post">' + assuntos.map(a => '<button type="button" class="pilula peq" data-acao="post-assunto" data-v="' + a[0] + '" aria-pressed="' + (st.assunto === a[0]) + '">' + a[1] + '</button>').join('') + '</div></fieldset>' +
      '<fieldset><legend>Foto</legend><div class="escolha-fotos" role="group" aria-label="Escolher a foto">' +
      st.fotos.map((f, i) => '<button type="button" data-acao="post-foto" data-i="' + i + '" aria-pressed="' + (st.foto === i && !st.local) + '" aria-label="' + esc(f.t || 'Foto ' + (i + 1)) + '"' + (f.ok === false ? ' class="bloq"' : '') + '>' + imgTag(f.th || f.src, '', '', {w: 200, semSet: true}) + '</button>').join('') +
      '<label class="foto-local">' + ICO.foto + '<span>Do aparelho</span><input type="file" accept="image/*" data-input="post-arquivo" class="sr"></label></div></fieldset>' +
      '<fieldset><legend>Cor do título</legend><div class="seg" role="group" aria-label="Cor do título">' + Object.keys(VARS).map(k => '<button type="button" data-acao="post-var" data-v="' + k + '" aria-pressed="' + (st.var === k) + '">' + k + '</button>').join('') + '</div></fieldset>' +
      '<label class="campo">Título<input id="post-titulo" maxlength="60" value="' + esc(st.titulo) + '" data-input="post-texto"></label>' +
      '<label class="campo">Linha de apoio<textarea id="post-linha" rows="3" maxlength="160" data-input="post-texto">' + esc(st.linha) + '</textarea></label>' +
      '<label class="campo">Legenda do post<textarea id="post-legenda" class="legenda" rows="6" data-input="post-legenda">' + esc(st.legenda) + '</textarea><small>Montada a partir da ficha do projeto. Confira antes de postar.</small></label>' +
      '<div class="btn-linha"><button type="button" class="btn" data-acao="post-copiar">' + ICO.copiar + 'Copiar legenda</button><button type="button" class="btn" data-acao="post-baixar">' + ICO.baixar + 'Baixar imagem</button></div>' +
      (podeCompartilharArquivos() ? '<button type="button" class="btn btn-pri btn-alto" data-acao="post-compartilhar">' + ICO.compartilhar + 'Compartilhar</button>' : '') +
      (pf.nome && pf.tel ? '' : '<p class="nota">Seu nome e WhatsApp entram no rodapé da arte. <a href="#/perfil">Preencher o perfil</a>.</p>') +
      '</div></div>';
    desenharPost();
  }
  function textosPost(p, det, c, assunto){
    const info = det.info || {}, tip = tiposTxt(p.tipos, p.amin, p.amax);
    const lugar = noBairro(p.bairro);
    if(assunto === 'local'){
      const pt = c && Array.isArray(c.perto) ? c.perto.find(x => x.bike != null || x.pe != null) : null;
      const titulo = pt ? 'A ' + (pt.pe != null ? pt.pe + ' min a pé' : pt.bike + ' min de bike') + ' ' + (/^(av\.|avenida|rua|r\.|esta[cç])/i.test(pt.nome) ? 'da ' : 'do ') + String(pt.nome).replace(/^(av\.|avenida)\s*/i, 'Av. ').replace(/^(r\.)\s*/i, 'Rua ') : (p.bairro ? maiusc1(lugar) : p.nome);
      return {titulo, linha: [tip, info.destaque].filter(Boolean).join('. ').replace(/\.$/, '') + '.'};
    }
    if(assunto === 'entrega'){
      const titulo = p.fase === 'pronto' ? 'Pronto para morar' : (p.entrega ? 'Chaves em ' + MESES[+p.entrega.slice(5, 7) - 1] + ' de ' + p.entrega.slice(0, 4) : 'Lançamento ' + lugar);
      return {titulo, linha: [tip, p.preco ? 'Tabela a partir de ' + BRL(p.preco) : ''].filter(Boolean).join('. ') + '.'};
    }
    if(assunto === 'lazer'){
      const itens = c && Array.isArray(c.lazer) ? c.lazer.flatMap(l => l.itens || []) : (Array.isArray(info.lazer) ? info.lazer : []);
      const titulo = itens[0] ? String(itens[0]).replace(/\s*\(.*\)$/, '') : 'Lazer completo';
      return {titulo: titulo.length > 40 ? 'Lazer completo' : titulo, linha: (itens.slice(1, 5).join(', ') || tip) + '.'};
    }
    return {titulo: p.preco ? 'A partir de ' + BRLc(p.preco) : (FASE[p.fase] || 'Conheça'), linha: [tip ? tip + ' ' + lugar : lugar, entregaTxt(p)].filter(Boolean).join(', ') + '.'};
  }
  function legendaPost(p, det, c){
    const pf = perfil(), info = det.info || {};
    const partes = [];
    partes.push(p.nome + (p.bairro ? ', ' + p.bairro : '') + '.');
    const sobre = (c && c.chamada) || info.destaque;
    if(sobre) partes.push(String(sobre).replace(/\.$/, '') + '.');
    const tip = tiposTxt(p.tipos, p.amin, p.amax);
    if(tip && !sobre) partes.push(tip + '.');
    if(p.preco) partes.push('Tabela a partir de ' + BRL(p.preco) + (p.avista && p.avista < p.preco ? ', ou ' + BRL(p.avista) + ' à vista' : '') + '.');
    partes.push(maiusc1(entregaTxt(p)) + '.');
    partes.push('Me chama que eu mando a tabela e as condições.');
    const ass = [pf.nome, pf.tel, pf.creci ? 'CRECI ' + pf.creci : ''].filter(Boolean).join('\n');
    return partes.join(' ') + (ass ? '\n\n' + ass : '');
  }
  function carregarImg(src, cors){
    return new Promise(res => {
      const im = new Image(); if(cors) im.crossOrigin = 'anonymous';
      im.onload = () => res(im); im.onerror = () => res(null);
      if(/^https?:/i.test(src) && !src.startsWith(location.origin)) im.referrerPolicy = 'no-referrer';
      im.src = src;
    });
  }
  const imgsCanvas = new Map();
  function imagemCanvas(src){   // foto liberada para o canvas
    if(imgsCanvas.has(src)) return imgsCanvas.get(src);
    const pr = (async () => {
      const alvo = tamImg(src, 1600);
      if(podeDireto(alvo)){ const im = await carregarImg(alvo, true); if(im) return im; marcarSemCors(alvo); }
      try{ const b = await buscarFoto(alvo); return await carregarImg(URL.createObjectURL(b), false); }catch(e){ return null; }
    })();
    imgsCanvas.set(src, pr);
    pr.then(im => { if(!im) imgsCanvas.delete(src); });
    return pr;
  }
  let logoImg = null;
  async function desenharPost(){
    const st = S.post, cv = $('#post-cv'); if(!st || !cv) return;
    const vez = st.vez = (st.vez || 0) + 1;
    st.blob = null;
    const p = S.byId.get(st.id), V = VARS[st.var] || VARS.Ouro, pf = perfil();
    const W = 1080, H = st.fmt === 'feed' ? 1350 : 1920, feed = st.fmt === 'feed';
    const aviso = $('#post-aviso');
    await carregarFontesPost();
    if(!logoImg) logoImg = await carregarImg('img/logo-fortal.png', false);
    if(vez !== st.vez || !cv.isConnected) return;
    let foto = null;
    if(st.local) foto = st.local;
    else{
      const f = st.fotos && st.fotos[st.foto];
      if(f){
        if(aviso) aviso.textContent = 'Carregando a foto…';
        foto = await imagemCanvas(f.src);
        f.ok = !!foto;
        if(vez !== st.vez || !cv.isConnected) return;
        if(aviso) aviso.textContent = foto ? '' : 'Essa foto não abriu. Escolha outra ou use uma do aparelho.';
        if(!foto){ const b = $('.escolha-fotos [data-i="' + st.foto + '"]'); if(b) b.classList.add('bloq'); }
      }
    }
    if(vez !== st.vez) return;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0E0C09'; ctx.fillRect(0, 0, W, H);
    if(foto){
      const fw = foto.naturalWidth || foto.width, fh = foto.naturalHeight || foto.height;
      const r = Math.max(W / fw, H / fh), w = fw * r, h = fh * r;
      ctx.drawImage(foto, (W - w) * 0.5, (H - h) * 0.42, w, h);
    }else if(logoImg){
      ctx.globalAlpha = 0.16; const lw = 700, lh = lw * logoImg.height / logoImg.width; ctx.drawImage(logoImg, (W - lw) / 2, H * 0.12, lw, lh); ctx.globalAlpha = 1;
    }
    const caixa = (x, y, w, h, r, cor) => { ctx.fillStyle = cor; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); ctx.fill(); };
    const pad = feed ? 56 : 64, maxW = W - pad * 2;
    // selo da fase no alto da foto
    const fase = FASE[p.fase];
    if(fase){
      ctx.font = '600 ' + (feed ? 30 : 34) + 'px "Mona Sans"'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(fase).width, sh = feed ? 60 : 68, sy = feed ? 52 : 92;
      caixa(pad, sy, tw + 48, sh, sh / 2, 'rgba(14,12,9,0.78)');
      ctx.fillStyle = '#F3EEE4'; ctx.fillText(fase, pad + 24, sy + sh / 2 + 1);
    }
    const quebra = (txt, font, max, linhasMax) => {
      ctx.font = font; const pal = String(txt || '').split(/\s+/).filter(Boolean), L = []; let lin = '';
      for(const w of pal){ const t = lin ? lin + ' ' + w : w; if(ctx.measureText(t).width > max && lin){ L.push(lin); lin = w; } else lin = t; }
      if(lin) L.push(lin);
      if(L.length > linhasMax){ const r = L.slice(0, linhasMax); let u = r[linhasMax - 1]; while(ctx.measureText(u + '…').width > max && u.length) u = u.slice(0, -1); r[linhasMax - 1] = u.replace(/\s+\S*$/, '') + '…'; return r; }
      return L;
    };
    const tamT = feed ? 62 : 72, lhT = Math.round(tamT * 1.14), bx = 30, by = 22;
    const fT = '700 ' + tamT + 'px "Mona Larga", "Mona Sans", sans-serif';
    const tit = quebra(st.titulo, fT, maxW - bx * 2, 3);
    const fL = '400 ' + (feed ? 34 : 38) + 'px "Mona Sans", sans-serif', lhL = feed ? 48 : 54;
    const lin = quebra(st.linha, fL, maxW, 3);
    const nomeL = quebra(p.nome, '700 32px "Mona Sans", sans-serif', 430, 2);
    const hBairro = 44, hTit = tit.length * lhT + by * 2, hLin = lin.length * lhL, hRod = 120, gap = feed ? 22 : 28;
    const bandH = pad * 0.8 + hBairro + gap * 0.5 + hTit + gap + hLin + gap + 2 + gap + hRod + pad * 0.6;
    const y0 = H - bandH;
    const grad = ctx.createLinearGradient(0, y0 - 260, 0, y0);
    grad.addColorStop(0, V.banda.replace(/[\d.]+\)$/, '0)')); grad.addColorStop(1, V.banda);
    ctx.fillStyle = grad; ctx.fillRect(0, y0 - 260, W, 260);
    ctx.fillStyle = V.banda; ctx.fillRect(0, y0, W, bandH);
    let y = y0 + pad * 0.8;
    ctx.textBaseline = 'top';
    ctx.font = '600 30px "Mona Sans", sans-serif'; ctx.fillStyle = V.apoio;
    ctx.fillText([p.bairro, quemDe(p)].filter(Boolean).join(', '), pad, y + 6);
    y += hBairro + gap * 0.5;
    ctx.font = fT;
    const larg = Math.min(maxW, Math.max(...tit.map(t => ctx.measureText(t).width)) + bx * 2);
    caixa(pad, y, larg, hTit, 22, V.caixa);
    ctx.fillStyle = V.caixaTexto; tit.forEach((t, i) => ctx.fillText(t, pad + bx, y + by + i * lhT + (lhT - tamT) * 0.35));
    y += hTit + gap;
    ctx.font = fL; ctx.fillStyle = V.texto; lin.forEach((t, i) => ctx.fillText(t, pad, y + i * lhL));
    y += hLin + gap;
    ctx.fillStyle = V.fio; ctx.fillRect(pad, y, maxW, 2);
    y += 2 + gap;
    let xL = pad;
    if(logoImg){ const lh = 112, lw = lh * logoImg.width / logoImg.height; ctx.drawImage(logoImg, pad, y, lw, lh); xL = pad + lw + 22; }
    ctx.font = '700 32px "Mona Sans", sans-serif'; ctx.fillStyle = V.texto; nomeL.forEach((t, i) => ctx.fillText(t, xL, y + 16 + i * 42));
    const nomeC = pf.nome ? primeiroNome(pf.nome) + ', corretor Fortal' : 'Corretor Fortal', tel = pf.tel || '', creci = pf.creci ? 'CRECI ' + pf.creci : '';
    ctx.textAlign = 'right'; ctx.font = '600 30px "Mona Sans", sans-serif'; ctx.fillStyle = V.contato;
    ctx.fillText(nomeC, W - pad, y + 14); if(tel) ctx.fillText(tel, W - pad, y + 56);
    if(creci){ ctx.font = '400 24px "Mona Sans", sans-serif'; ctx.fillStyle = V.apoio; ctx.fillText(creci, W - pad, y + 98); }
    ctx.textAlign = 'left';
    try{ const b = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92)); if(vez === st.vez) st.blob = b; }
    catch(e){ if(aviso && vez === st.vez) aviso.textContent = 'Essa foto não deixa salvar a arte. Escolha outra ou use uma do aparelho.'; }
  }
  const nomeArquivoPost = () => { const p = S.byId.get(S.post.id); return 'post-' + (p ? slug(p.nome) : 'fortal') + '-' + S.post.fmt + '.jpg'; };

  // ================= ESPELHO DO PRÉDIO (como no app dos Espelhos: andares x finais, cor pela situação) =================
  ICO.predio = svg('<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M11 21v-3h2v3"/>');
  ICO.comparar = svg('<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/>', 1.9);
  const ST_ORDEM = ['disponivel', 'reservada', 'processo_final', 'vendida'];
  const ST_TILE = {disponivel: 'Disponíveis', reservada: 'Reservadas', processo_final: 'Em processo', vendida: 'Vendidas'};
  const FX_PADRAO = [[25, 'até 25 m²'], [30, '25 a 30 m²'], [35, '30 a 35 m²'], [45, '35 a 45 m²'], [70, '45 a 70 m²'], [9999, 'acima de 70 m²']];
  const ordTB = s => { const t = norm(s); return /^stud/.test(t) ? 0 : /^1/.test(t) ? 1 : /^2/.test(t) ? 2 : /^3/.test(t) ? 3 : /^4/.test(t) ? 4 : /loja/.test(t) ? 9 : 5; };
  const tipoKDe = s => { const t = norm(s); return /^stud|^kitn/.test(t) ? 'S' : /^1/.test(t) ? '1' : /^2/.test(t) ? '2' : /^[3-9]/.test(t) ? '3' : /loja/.test(t) ? 'L' : null; };
  const vagaRot = n => n == null ? null : n === 0 ? 'Sem vaga' : n === 1 ? '1 vaga' : n + ' vagas';
  const andarRot = v => v === 'T' ? 'Térreo' : v === 'S' ? 'Subsolo' : v === 'L' ? 'Loja' : v === 'G' ? 'Garden' : /^\d+$/.test(String(v)) ? v + 'º' : String(v == null ? '' : v);
  const kmil = v => v >= 1e6 ? (Math.round(v / 1e4) / 100).toLocaleString('pt-BR') + ' mi' : Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  const m2c = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR') + ' m²';
  const catNomeDe = (det, c) => (det.dados.cat_nome && det.dados.cat_nome[c]) || c;
  const EF0 = () => ({st: 'todos', mov: false, tb: null, fx: null, tipo: null, cat: null, final: null, vista: null, vaga: null, pmax: null, mob: null});
  const EF_ROT = {tb: 'Tipologia', fx: 'Metragem', tipo: 'Planta', cat: 'Enquadramento', vista: 'Vista', vaga: 'Vaga', pmax: 'Valor até', final: 'Final', mob: 'Mobília'};
  const mobProj = det => !!(det && det.info && det.info.mobiliado && det.info.mobiliado.r === 'todas');
  const espTemGrade = det => !!(det && det.dados && det.dados.grade && +det.dados.grade.colunas > 0 && Array.isArray(det.dados.grade.andares) && det.dados.grade.andares.length);
  const vistaTab = det => espTemGrade(det) && S.ui.tabVista !== 'lista' ? 'espelho' : 'lista';
  function espFiltro(id){ if(!S.ui.ef || S.ui.ef.pid !== id) S.ui.ef = Object.assign(EF0(), {pid: id}); return S.ui.ef; }
  function espFaixas(det, c){
    const f = c && Array.isArray(c.faixas) && c.faixas.length ? c.faixas : (Array.isArray(det.dados.faixas) && det.dados.faixas.length ? det.dados.faixas : FX_PADRAO);
    return f.filter(x => Array.isArray(x) && x.length >= 2 && +x[0] > 0).map(x => [+x[0], String(x[1])]).sort((x, y) => x[0] - y[0]);
  }
  const espFaixa = (FX, ar) => { if(!(ar > 0) || !FX.length) return null; for(const x of FX) if(ar <= x[0]) return x[1]; return FX[FX.length - 1][1]; };
  const _espU = new WeakMap();
  function espUnidades(det, c){   // unidades do espelho com o que os filtros e o mapa usam (guardado por leitura)
    const ch = _espU.get(det); if(ch && ch.c === c) return ch.U;
    const d = det.dados, G = d.grade || {}, rot = Array.isArray(G.rotulos_colunas) ? G.rotulos_colunas : null, FX = espFaixas(det, c);
    const tlCentral = tipo => {   // sem tipologia no espelho: a da planta daquele tipo na ficha da central ("Studio com closet 21 m²" vira Studio)
      if(!tipo || !c || !Array.isArray(c.plantas)) return '';
      const pl = c.plantas.find(x => Array.isArray(x.tipos) && x.tipos.map(String).includes(tipo)); if(!pl) return '';
      const t = norm(pl.t); return /^stud|^kitn/.test(t) ? 'Studio' : /^1 dorm/.test(t) ? '1 dorm' : /^2 dorm/.test(t) ? '2 dorms' : /^3 dorm/.test(t) ? '3 dorms' : /^4 dorm/.test(t) ? '4 dorms' : '';
    };
    const mp = mobProj(det);
    const U = (d.unidades || []).map(a => {
      const ar = areaU(a), tl = tipologiaU(det, a) || tlCentral(a[1] ? String(a[1]) : '') || '', col = +a[5] || 0, loja = a[4] === 'L' || /^loja/i.test(tl);
      const vi = (Array.isArray(d.vistas) ? d.vistas : []).find(v => col >= +v.col_ini && col <= +v.col_fim);
      return {a, n: String(a[0]), tipo: a[1] ? String(a[1]) : null, ar, tl, cat: a[3] || null, andar: a[4], col, st: a[6], loja,
        vista: vi ? vi.id : null, final: rot && !loja && rot[col] != null ? String(rot[col]) : null, fx: espFaixa(FX, ar), vg: vagaDe(det, a), mob: mp || !!exDe(a).mob};
    });
    _espU.set(det, {c, U});
    return U;
  }
  function espBate(u, f, modo, ign){   // filtros de unidade (menos a situação)
    if(ign !== 'tb' && f.tb && u.tl !== f.tb) return false;
    if(ign !== 'fx' && f.fx && u.fx !== f.fx) return false;
    if(ign !== 'tipo' && f.tipo && u.tipo !== f.tipo) return false;
    if(ign !== 'cat' && f.cat && u.cat !== f.cat) return false;
    if(ign !== 'final' && f.final && u.final !== f.final) return false;
    if(ign !== 'vista' && f.vista && u.vista !== f.vista) return false;
    if(ign !== 'vaga' && f.vaga && vagaRot(u.vg) !== f.vaga) return false;
    if(ign !== 'mob' && f.mob && !u.mob) return false;
    if(ign !== 'pmax' && f.pmax){ const v = precoU(u.a, modo); if(!(v > 0) || v > f.pmax) return false; }
    return true;
  }
  const espStBate = (u, f, recentes) => (f.st === 'todos' || u.st === f.st) && (!f.mov || recentes.has(u.n));
  const efAtivos = f => ['tb', 'fx', 'tipo', 'cat', 'final', 'vista', 'vaga', 'pmax', 'mob'].filter(k => f[k] != null && f[k] !== '');
  function efResumo(f){   // "Studio, até 25 m², até R$ 190 mil"
    return efAtivos(f).map(k => k === 'pmax' ? 'até ' + BRLc(f.pmax) : k === 'final' ? 'final ' + f.final : k === 'mob' ? 'mobiliado' : k === 'tipo' ? String(f.tipo).replace(/^TIPO /i, 'tipo ') : String(f[k])).join(', ');
  }
  function espPassos(U, modo){   // "valor até": quartis arredondados dos preços das livres
    const vs = U.filter(u => u.st === 'disponivel').map(u => precoU(u.a, modo)).filter(v => v > 0).sort((x, y) => x - y);
    if(vs.length < 4) return [];
    const arred = v => v >= 1e6 ? Math.ceil(v / 5e4) * 5e4 : Math.ceil(v / 1e4) * 1e4;
    const out = [];
    for(const q of [.2, .4, .6, .8]){ const v = arred(vs[Math.min(vs.length - 1, Math.floor(q * vs.length))]); if(!out.includes(v) && v < vs[vs.length - 1]) out.push(v); }
    return out;
  }

  // ---------- controles: blocos de situação e filtros com contagem das livres ----------
  function espTilesHtml(U, f, modo, det, recentes){
    const base = U.filter(u => espBate(u, f, modo) && (!f.mov || recentes.has(u.n)));
    const tot = base.length, sts = ST_ORDEM.filter(s => U.some(u => u.st === s));
    const rotSt = s => { if(s !== 'processo_final') return ST_TILE[s]; const l = stLabel(det, s); return l.length <= 16 ? l : ST_TILE[s]; };
    const CURTO = {todos: 'Total', disponivel: 'Disp.', reservada: 'Reserv.', processo_final: /^pend/i.test(stLabel(det, 'processo_final')) ? 'Pend.' : 'Proc.', vendida: 'Vend.'};
    const tile = (st, rot, n) => '<button type="button" class="ef-tile s-' + st + '" data-acao="ef-st" data-v="' + st + '" aria-pressed="' + (f.st === st) + '" aria-label="' + esc(rot + ': ' + n.toLocaleString('pt-BR')) + '"><span class="ef-tr"><i aria-hidden="true"></i><span class="l-longo">' + esc(rot) + '</span><span class="l-curto" aria-hidden="true">' + esc(CURTO[st] || rot) + '</span></span><b class="num">' + n.toLocaleString('pt-BR') + '</b><small>' + (st === 'todos' ? 'no filtro' : tot ? Math.round(n / tot * 100) + '%' : '0%') + '</small></button>';
    return '<div class="ef-tiles" style="--n:' + (sts.length + 1) + '">' + tile('todos', 'Total', tot) + sts.map(s => tile(s, rotSt(s), base.filter(u => u.st === s).length)).join('') + '</div>';
  }
  function espChipsHtml(U, f, modo, det, recentes, c, emLista){
    const disp = U.filter(u => u.st === 'disponivel');
    const conta = (k, pred) => disp.filter(u => pred(u) && espBate(u, f, modo, k)).length;
    const linha = (k, vals, sempre) => {
      const ops = vals.map(([v, l, pred]) => ({v, l, n: conta(k, pred)})).filter(o => o.n > 0 || String(f[k]) === String(o.v));
      if(!sempre && ops.length < 2 && f[k] == null) return '';
      if(!ops.length) return '';
      return '<div class="ef-lin"><span class="ef-rot">' + esc(EF_ROT[k]) + '</span><div class="ef-ops" role="group" aria-label="' + esc(EF_ROT[k]) + '">' +
        '<button type="button" class="pilula peq" data-acao="ef" data-k="' + k + '" data-v="" aria-pressed="' + (f[k] == null) + '">Todas</button>' +
        ops.map(o => '<button type="button" class="pilula peq" data-acao="ef" data-k="' + k + '" data-v="' + esc(o.v) + '" aria-pressed="' + (String(f[k]) === String(o.v)) + '">' + esc(o.l) + '<span class="n">' + o.n + '</span></button>').join('') + '</div></div>';
    };
    const tls = [...new Set(U.map(u => u.tl).filter(Boolean))].sort((x, y) => ordTB(x) - ordTB(y) || x.localeCompare(y, 'pt-BR', {numeric: true}));
    const FX = espFaixas(det, c);
    const fxs = FX.map(x => x[1]).filter(l => U.some(u => u.fx === l));
    const tipos = [...new Set(U.map(u => u.tipo).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'pt-BR', {numeric: true}));
    const arTipo = t => { const u = U.find(x => x.tipo === t && x.ar); return u ? ', ' + m2c(u.ar) : ''; };
    const cats = [...new Set(U.map(u => u.cat).filter(Boolean))].sort((x, y) => catNomeDe(det, x).localeCompare(catNomeDe(det, y), 'pt-BR'));
    const vistas = Array.isArray(det.dados.vistas) ? det.dados.vistas : [];
    const vagas = [...new Set(U.map(u => vagaRot(u.vg)).filter(Boolean))].sort((x, y) => (x === 'Sem vaga' ? 0 : parseInt(x, 10)) - (y === 'Sem vaga' ? 0 : parseInt(y, 10)));
    const passos = espPassos(U, modo);
    const linhas = [
      linha('tb', tls.map(t => [t, t, u => u.tl === t]), true),
      linha('fx', fxs.map(l => [l, l, u => u.fx === l])),
      linha('pmax', passos.map(v => [v, 'até ' + BRLc(v), u => { const x = precoU(u.a, modo); return x > 0 && x <= v; }])),
      tipos.length > 1 ? linha('tipo', tipos.map(t => [t, String(t).replace(/^TIPO /i, 'Tipo ') + arTipo(t), u => u.tipo === t])) : '',
      cats.length > 1 ? linha('cat', cats.map(c => [c, catNomeDe(det, c), u => u.cat === c])) : '',
      vistas.length ? linha('vista', vistas.map(v => [v.id, v.label, u => u.vista === v.id])) : '',
      vagas.length > 1 ? linha('vaga', vagas.map(v => [v, v, u => vagaRot(u.vg) === v])) : '',
      U.some(u => u.mob) && U.some(u => !u.mob) ? linha('mob', [['1', 'Mobiliado', u => u.mob]], true) : ''
    ].filter(Boolean);
    const extras = linhas.slice(2), abertos = S.ui.efMais || efAtivos(f).some(k => !['tb', 'fx', 'final'].includes(k));
    const ativos = efAtivos(f);
    const nMov = U.filter(u => recentes.has(u.n) && espBate(u, f, modo)).length;
    return '<div class="ef-filtros">' + linhas.slice(0, 2).join('') + (abertos ? extras.join('') : '') +
      '<div class="ef-acoes">' + (extras.length ? '<button type="button" class="link-mais" data-acao="ef-mais" aria-expanded="' + abertos + '">' + (abertos ? 'Menos filtros' : '<span>Mais filtros<span class="l-longo">: ' + esc(extras.map(h => (/class="ef-rot">([^<]+)/.exec(h) || [])[1]).filter(Boolean).join(', ').toLowerCase()) + '</span></span>') + ' ' + ICO.baixo + '</button>' : '') +
      (!emLista && (nMov || f.mov) ? '<button type="button" class="pilula peq" data-acao="ef-mov" aria-pressed="' + !!f.mov + '">Mexeram hoje e ontem<span class="n">' + nMov + '</span></button>' : '') +
      (f.final ? '<button type="button" class="pilula peq" data-acao="ef" data-k="final" data-v="" aria-label="Tirar o filtro do final ' + esc(f.final) + '">Final ' + esc(f.final) + ICO.x + '</button>' : '') +
      (ativos.length || (!emLista && (f.st !== 'todos' || f.mov)) ? '<button type="button" class="link-mais" data-acao="ef-limpar">Limpar filtros</button>' : '') + '</div></div>';
  }

  // ---------- o mapa ----------
  function espCelula(u, rr, ok, modo, sel, recentes, q, multiCat, det){
    const v = precoU(u.a, modo), mk = sel.has(u.n), mv = recentes.get(u.n), achou = q && norm(u.n) === q;
    const vend = u.st === 'vendida', tag = '';   // o enquadramento fica no filtro e na ficha da unidade: na célula não cabe
    const desc = ['Unidade ' + u.n, andarTxt(u.andar), u.tl, u.ar ? m2c(u.ar) : '', u.cat ? catNomeDe(det, u.cat) : '', v && !vend ? BRL(v) : '', stLabel(det, u.st)].filter(Boolean).join(', ');
    return '<button type="button" class="ep-u s-' + esc(u.st) + (ok ? '' : ' off') + (mk ? ' marc' : '') + (mv ? ' mov' : '') + (achou ? ' achou' : '') + '" data-acao="esp-u" data-n="' + esc(u.n) + '" style="grid-row:' + rr + ';grid-column:' + (u.col + 2) + '" aria-label="' + esc(desc) + '" title="' + esc(desc) + '">' +
      '<b>' + esc(u.n) + (tag ? '<i>' + esc(String(tag).slice(0, 6)) + '</i>' : '') + '</b>' +
      (vend ? '' : '<span>' + esc(u.ar ? m2c(u.ar) : (u.tl || '')) + '</span>' + (v && S.ui.espPreco !== false ? '<span class="pr">' + esc(kmil(v)) + '</span>' : '')) +
      (mk ? '<em class="ep-ok" aria-hidden="true">' + ICO.ok + '</em>' : '') + '</button>';
  }
  function espGradeHtml(p, det, U, f, modo, sel, recentes){
    const d = det.dados, G = d.grade || {}, COLS = Math.max(1, +G.colunas || 1), FLS = Array.isArray(G.andares) ? G.andares : [];
    const rot = Array.isArray(G.rotulos_colunas) ? G.rotulos_colunas : null, comuns = Array.isArray(d.comuns) ? d.comuns : [];
    const q = norm(S.ui.tabQ).trim(), multiCat = new Set(U.map(u => u.cat).filter(Boolean)).size > 1;
    const out = [], gc = (ini, fim) => 'grid-column:' + (+ini + 2) + ' / ' + (+fim + 3);
    let r = 1;
    const barras = Array.isArray(G.barras_topo) ? G.barras_topo : [];
    for(const b of barras) out.push('<div class="ep-barra ' + esc(b.estilo || '') + '" style="grid-row:' + r + ';' + gc(b.col_ini, b.col_fim) + '">' + esc(b.texto) + '</div>');
    if(barras.length){ out.push('<span class="ep-and ep-vazio" style="grid-row:' + r + '"></span>'); r++; }
    if(rot){
      out.push('<span class="ep-and ep-cab" style="grid-row:' + r + '">Final</span>');
      rot.forEach((l, i) => { if(i < COLS) out.push('<button type="button" class="ep-final" data-acao="ef-final" data-v="' + esc(l) + '" aria-pressed="' + (f.final === String(l)) + '" style="grid-row:' + r + ';grid-column:' + (i + 2) + '" aria-label="Ver só o final ' + esc(l) + '" title="Ver só o final ' + esc(l) + '">' + esc(l) + '</button>'); });
      r++;
    }
    for(const t of (Array.isArray(G.topo) ? G.topo : [])){ out.push('<span class="ep-and" style="grid-row:' + r + '">' + esc(t.rotulo || '') + '</span><div class="ep-topo" style="grid-row:' + r + ';' + gc(t.col_ini, t.col_fim) + '">' + esc(t.texto) + '</div>'); r++; }
    const linha = new Map(); FLS.slice().reverse().forEach((fl, i) => linha.set(String(fl), r + i));
    const contA = new Map();
    for(const [fl, rr] of linha) out.push('<span class="ep-and" style="grid-row:' + rr + '">' + esc(andarRot(fl)) + '</span>');
    for(const u of U){
      const rr = linha.get(String(u.andar)); if(!rr || u.col >= COLS) continue;
      const ok = espBate(u, f, modo) && espStBate(u, f, recentes);
      if(ok && u.st === 'disponivel') contA.set(String(u.andar), (contA.get(String(u.andar)) || 0) + 1);
      out.push(espCelula(u, rr, ok, modo, sel, recentes, q, multiCat, det));
    }
    for(const cm of comuns){ const rr = linha.get(String(cm.andar)); if(rr && +cm.col < COLS) out.push('<div class="ep-comum" style="grid-row:' + rr + ';grid-column:' + (+cm.col + 2) + '" title="Área comum: ' + esc(cm.label) + '">' + esc(cm.label) + '</div>'); }
    for(const [fl, rr] of linha){ const n = contA.get(fl); out.push('<span class="ep-bd' + (n ? '' : ' zero') + '" style="grid-row:' + rr + ';grid-column:' + (COLS + 2) + '"' + (n ? ' title="' + esc(plural(n, 'livre no filtro', 'livres no filtro') + ' no ' + andarRot(fl)) + '"' : '') + '>' + (n || '') + '</span>'); }
    r += FLS.length;
    if(G.barra_base){ out.push('<span class="ep-and ep-vazio" style="grid-row:' + r + '"></span><div class="ep-base" style="grid-row:' + r + ';' + gc(0, COLS - 1) + '">' + esc(G.barra_base) + '</div>'); }
    return '<div class="ep-rola" tabindex="0" role="region" aria-label="Espelho do ' + esc(p.nome) + ': role para os lados para ver todos os finais"><div class="ep' + (S.ui.espDenso ? ' denso' : '') + '" style="--cols:' + COLS + '">' + out.join('') + '</div></div>';
  }
  function espLegendaHtml(det, U){
    const sts = ST_ORDEM.filter(s => U.some(u => u.st === s));
    return '<div class="ep-leg">' + sts.map(s => '<span><i class="s-' + s + '" aria-hidden="true"></i>' + esc(stLabel(det, s)) + '</span>').join('') +
      '<span><i class="off" aria-hidden="true"></i>Fora do filtro</span><span><i class="mov" aria-hidden="true"></i>Mexeu hoje ou ontem</span><span><i class="marc" aria-hidden="true"></i>Marcada para mandar</span></div>';
  }
  function espelhoCorpoHtml(p, det){
    const c = S.centralV.get(p.id) || null, U = espUnidades(det, c), f = espFiltro(p.id), modo = modoTabela(p, det);
    const sel = S.ui.tabSel.get(p.id) || new Set(), recentes = recentesDe(det);
    const temPreco = U.some(u => precoU(u.a, modo));
    return espTilesHtml(U, f, modo, det, recentes) + espChipsHtml(U, f, modo, det, recentes, c) +
      '<div class="ep-quadro"><div class="ep-cab-q"><p class="sub"><span class="l-longo">Toque numa unidade para ver planta, valores e fluxo.</span><span class="l-curto">Toque na unidade para ver planta e valores.</span></p><div class="ep-ferr">' +
      (temPreco ? '<button type="button" class="pilula peq" data-acao="esp-preco" aria-pressed="' + (S.ui.espPreco !== false) + '">Preço na célula</button>' : '') +
      '<button type="button" class="pilula peq" data-acao="esp-denso" aria-pressed="' + !!S.ui.espDenso + '">Prédio inteiro</button></div></div>' +
      espGradeHtml(p, det, U, f, modo, sel, recentes) + espLegendaHtml(det, U) + '</div>' +
      (sel.size ? barraTabelaHtml(p, sel) : '');
  }
  function barraTabelaHtml(p, sel){
    return '<div class="barra-envio"><p><span><b class="num">' + sel.size + '</b> ' + (sel.size === 1 ? 'unidade' : 'unidades') + '</span><small>' + (sel.size === 1 ? 'marcada' : 'marcadas') + '</small></p><button type="button" class="btn" data-acao="tab-limpar" data-id="' + esc(p.id) + '">Limpar</button><button type="button" class="btn btn-pri" data-acao="enviar" data-id="' + esc(p.id) + '" data-sel="1">' + ICO.enviar + '<span>Mandar<span class="so-largo"> pro cliente</span></span></button></div>';
  }
  function espRolarAchada(){   // a unidade digitada na busca aparece no meio do mapa
    const el = $('.ep-u.achou'); if(el) el.scrollIntoView({block: 'nearest', inline: 'center', behavior: menosMov() ? 'auto' : 'smooth'});
  }

  // ---------- planta, posição no andar e vista da unidade (ficha da central de produto) ----------
  function finalNum(det, a){ const rot = det.dados.grade && det.dados.grade.rotulos_colunas; const v = rot && rot[+a[5]] != null ? parseInt(rot[+a[5]], 10) : NaN; return isNaN(v) ? null : v; }
  const andarNum = a => /^\d+$/.test(String(a[4])) ? +a[4] : (a[4] === 'T' ? 0 : null);
  function plantaDaUnidade(det, c, a){
    const tl = tipologiaU(det, a) || '', tipo = a[1] ? String(a[1]) : null, fin = finalNum(det, a), an = andarNum(a);
    if(c && Array.isArray(c.plantas) && c.plantas.length){
      const noAndar = x => an == null || x.de == null || (an >= +x.de && an <= +(x.ate != null ? x.ate : x.de));
      let pl = tipo ? c.plantas.find(x => Array.isArray(x.tipos) && x.tipos.map(String).includes(tipo)) : null;
      if(!pl && fin != null) pl = c.plantas.find(x => Array.isArray(x.finais) && x.finais.map(Number).includes(fin) && noAndar(x)) || c.plantas.find(x => Array.isArray(x.finais) && x.finais.map(Number).includes(fin));
      if(pl) return {src: imgCentral(c, pl.id), t: pl.t ? 'Planta ' + pl.t : 'Planta', sub: pl.andares || '', exata: true};
      const ar = areaU(a), tk = tipoKDe(tl);
      const cands = c.plantas.map(x => { const m = /(\d+(?:[.,]\d+)?)\s*m²/.exec(String(x.t || '')); return {x, m: m ? +m[1].replace(',', '.') : null}; }).filter(o => o.m && (!tk || tipoKDe(o.x.t) === tk));
      if(ar > 0 && cands.length){ cands.sort((x, y) => Math.abs(x.m - ar) - Math.abs(y.m - ar)); if(Math.abs(cands[0].m - ar) <= 2) return {src: imgCentral(c, cands[0].x.id), t: 'Planta ' + cands[0].x.t, sub: cands[0].x.andares || '', exata: false}; }
    }
    // plantas que vieram junto das fotos (com metragens e finais): a do final da unidade, na metragem e no andar dela
    const pf = plantasFotos(det);
    if(pf.length){
      const ar = areaU(a);
      const cands = pf.filter(x => !x.pav).map(x => {
        const fOk = x.fins.length && fin != null ? x.fins.includes(fin) : null;   // true, false ou sem informação
        const d = ar > 0 && x.as.length ? Math.min(...x.as.map(v => Math.abs(v - ar))) : 99;
        const faixa = ar > 0 && x.as.length >= 2 && ar >= Math.min(...x.as) - 0.3 && ar <= Math.max(...x.as) + 0.3;
        const andarOk = !x.andares.length || an == null || x.andares.some(([de, ate]) => an >= de && an <= ate);
        return {x, fOk, d, aOk: d <= 0.6 || faixa, andarOk};
      }).filter(o => o.fOk !== false && o.andarOk && (o.aOk || (o.fOk && o.d <= 3)));
      if(!cands.length) return null;
      cands.sort((p, q) => (q.fOk === true) - (p.fOk === true) || p.x.opc - q.x.opc || p.x.tec - q.x.tec || p.d - q.d);
      const m = cands[0], op = cands.find(o => o !== m && o.x.opc && !o.x.tec && Math.abs(o.d - m.d) < 0.6);
      return {src: m.x.src, t: m.x.t, sub: m.x.sub, exata: m.fOk === true || m.d <= 0.05, opcao: op ? {src: op.x.src, t: op.x.t + (op.x.sub ? ', ' + op.x.sub : '')} : null};
    }
    const outras = plantasDoProjeto(det, c).filter(x => x.src), tn = norm(tl).replace(/\./g, '');
    const hit = outras.find(x => tn && norm(x.t).replace(/\./g, '').includes(tn)) || (outras.length === 1 ? outras[0] : null);
    return hit ? {src: hit.src, t: hit.t, sub: hit.sub || '', exata: false} : null;
  }
  function pavimentoDaUnidade(det, a){   // planta do andar inteiro que veio junto das fotos (sem a unidade marcada)
    const an = andarNum(a); if(an == null) return null;
    const ps = plantasFotos(det).filter(x => x.pav && x.andares.some(([de, ate]) => an >= de && an <= ate));
    if(!ps.length) return null;
    const ar = areaU(a), x = ps.find(p => !(ar > 0) || !p.as.length || p.as.some(v => Math.abs(v - ar) <= 0.6)) || ps[0];
    return {src: x.src, t: x.t, sub: x.sub};
  }
  function andarDaUnidade(det, c, a){   // planta do pavimento com a unidade marcada
    if(!c || !Array.isArray(c.andar_img)) return null;
    const fin = finalNum(det, a), an = andarNum(a); if(fin == null || an == null) return null;
    const ai = c.andar_img.find(x => an >= +x.de && an <= +x.ate); if(!ai || !ai.cells || !(+ai.w > 0) || !(+ai.h > 0)) return null;
    const r = ai.cells[String(fin)]; if(!Array.isArray(r) || !r.length) return null;
    const rs = (Array.isArray(r[0]) ? r : [r]).filter(x => Array.isArray(x) && x.length >= 4);
    if(!rs.length) return null;
    return {src: imgCentral(c, ai.img), rs: rs.map(x => ({x: x[0] / ai.w * 100, y: x[1] / ai.h * 100, w: x[2] / ai.w * 100, h: x[3] / ai.h * 100})), leg: c.andar_legenda || ''};
  }
  function vistaDaUnidade(det, c, a){   // foto da vista daquela face, no andar mais próximo abaixo
    if(!c || !Array.isArray(c.faces)) return null;
    const fin = finalNum(det, a), col = +a[5], an = andarNum(a);
    const face = c.faces.find(x => (Array.isArray(x.finais) && fin != null && x.finais.map(Number).includes(fin)) || (Array.isArray(x.cols) && x.cols.map(Number).includes(col)));
    if(!face || !face.vistas || an == null) return null;
    const ks = Object.keys(face.vistas).map(Number).filter(n => !isNaN(n)).sort((x, y) => x - y); if(!ks.length) return null;
    let k = ks[0]; for(const n of ks) if(n <= an) k = n;
    return {src: imgCentral(c, face.vistas[String(k)]), t: 'Vista ' + (face.nome ? 'para a ' + face.nome : 'desta face'), sub: 'Foto tirada no ' + k + 'º andar'};
  }

  // ---------- folha da unidade ----------
  function unidadeCorpoHtml(p, det, c, a){
    const n = String(a[0]), ex = exDe(a), pc = precosCampos(det).slice(0, 3), ar = areaU(a), tl = tipologiaU(det, a), m = recentesDe(det).get(n), st = stDe(det, a, m);
    const vg = vagaDe(det, a), fin = finalNum(det, a), vi = (det.dados.vistas || []).find(v => +a[5] >= +v.col_ini && +a[5] <= +v.col_fim);
    const base = precoU(a, chaveBase(det));
    let h = '<div class="un-topo"><span class="un-st s-' + esc(a[6]) + '"><i aria-hidden="true"></i>' + esc(stLabel(det, a[6])) + '</span>' + (m ? '<span class="sub">' + esc(st.txt) + '</span>' : '') + '</div>';
    const precos = pc.map(x => ({l: x.label, v: precoU(a, x.k)})).filter(x => x.v);
    if(precos.length) h += '<div class="un-precos">' + precos.map(x => '<div><span>' + esc(x.l) + '</span><b class="num">' + esc(BRL(x.v)) + '</b></div>').join('') + (base && ar ? '<div><span>Por m²</span><b class="num">' + esc(BRL(base / ar)) + '</b></div>' : '') + '</div>';
    else if(a[6] === 'disponivel') h += '<p class="aviso fino">' + esc(det.dados.sem_tabela || 'Unidade sem preço na tabela. Confirme o valor com a construtora.') + '</p>';
    const fatos = [['Andar', andarTxt(a[4])], ['Tipologia', tl], ['Área', ar ? fmtM2(ar) : ''], ['Planta', a[1] ? String(a[1]).replace(/^TIPO /i, 'Tipo ') : ''], ['Enquadramento', a[3] ? catNomeDe(det, a[3]) : ''],
      ['Vaga', vg != null ? vagaRot(vg) : ''], ['Final', fin != null ? String(fin).padStart(2, '0') : ''], ['Vista', vi ? vi.label : ''], ['Mobiliado', ex.mob || mobProj(det) ? 'Sim' : ''], ['PCD', ex.pcd ? 'Adaptável' : '']].filter(x => x[1]);
    h += '<dl class="un-fatos">' + fatos.map(x => '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>').join('') + '</dl>';
    const pl = plantaDaUnidade(det, c, a), ad = andarDaUnidade(det, c, a), vs = vistaDaUnidade(det, c, a);
    const luz = [];
    let mid = '';
    if(pl){ const ip = luz.push({src: pl.src, t: pl.t + (pl.sub ? ', ' + pl.sub : '')}) - 1; if(pl.opcao) luz.push(pl.opcao); mid += '<figure class="planta un-planta"><button type="button" class="mos-item" data-acao="luz-un" data-i="' + ip + '" aria-label="' + esc('Ampliar a ' + pl.t) + '">' + imgTag(pl.src, pl.t, '', {w: 900, semSet: true}) + '</button><figcaption>' + esc(pl.exata ? pl.t : pl.t + ' (da tipologia)') + (pl.sub ? '<small>' + esc(pl.sub) + '</small>' : '') + (pl.opcao ? '<small>Tem opção de planta: amplie para ver.</small>' : '') + '</figcaption></figure>'; }
    const pv = ad ? null : pavimentoDaUnidade(det, a);
    if(pv){ luz.push({src: pv.src, t: 'Planta do andar' + (pv.sub ? ', ' + pv.sub : '')}); mid += '<figure class="planta un-planta"><button type="button" class="mos-item" data-acao="luz-un" data-i="' + (luz.length - 1) + '" aria-label="Ampliar a planta do andar">' + imgTag(pv.src, 'Planta do ' + andarTxt(a[4]), '', {w: 1200, semSet: true}) + '</button><figcaption>Planta do andar' + (pv.sub ? '<small>' + esc(maiusc1(pv.sub)) + '</small>' : '') + '</figcaption></figure>'; }
    if(ad){ luz.push({src: ad.src, t: 'Posição no andar'}); mid += '<figure class="planta un-andar-f"><button type="button" class="un-andar" data-acao="luz-un" data-i="' + (luz.length - 1) + '" aria-label="Ampliar a planta do andar">' + imgTag(ad.src, 'Planta do ' + andarTxt(a[4]), '', {w: 1200, semSet: true}) + ad.rs.map(r => '<i style="left:' + r.x.toFixed(2) + '%;top:' + r.y.toFixed(2) + '%;width:' + r.w.toFixed(2) + '%;height:' + r.h.toFixed(2) + '%"></i>').join('') + '</button><figcaption>Posição no andar<small>Unidade ' + esc(n) + ' em destaque</small></figcaption></figure>'; }
    if(vs){ luz.push({src: vs.src, t: vs.t + ', ' + vs.sub}); mid += '<figure class="planta un-vista"><button type="button" class="mos-item" data-acao="luz-un" data-i="' + (luz.length - 1) + '" aria-label="Ampliar a foto da vista">' + imgTag(vs.src, vs.t, '', {w: 900, semSet: true}) + '</button><figcaption>' + esc(vs.t) + '<small>' + esc(vs.sub) + '</small></figcaption></figure>'; }
    S.unLuz = luz;
    if(mid) h += '<div class="un-midia">' + mid + '</div>';
    else if(c === undefined) h += '<div class="brilho" style="height:180px;border-radius:14px"></div>';
    const fx = fluxoHtml(det, a);
    if(fx) h += '<details class="un-fluxo" open><summary>Como o cliente paga' + (fx && persDe(p.id, n) ? '<small>pela tabela</small>' : '') + '</summary>' + fx + '</details>';
    h += persSecaoHtml(p, det, a);
    if(c && c.aviso_planta && pl) h += '<p class="nota">' + esc(c.aviso_planta) + '</p>';
    return h;
  }
  function unidadePeHtml(p, a){
    const n = String(a[0]), livre = a[6] === 'disponivel', mk = (S.ui.tabSel.get(p.id) || new Set()).has(n);
    return (livre ? '<button type="button" class="btn" data-acao="un-marcar" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-pressed="' + mk + '">' + (mk ? ICO.ok + 'Marcada' : 'Marcar') + '</button>' +
      '<button type="button" class="btn btn-pri" data-acao="un-mandar" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '">' + ICO.enviar + 'Mandar</button>' : '') +
      '<a class="btn" href="#/comparar?p=' + encodeURIComponent(p.id) + '&n=' + encodeURIComponent(n) + '">' + ICO.comparar + 'Comparar</a>';
  }
  async function abrirUnidadeEsp(id, n){
    const p = S.byId.get(id), ch = S.det.get(id), det = ch && ch.v; if(!p || !det) return;
    const a = (det.dados.unidades || []).find(x => String(x[0]) === String(n)); if(!a) return;
    const c0 = S.centralV.has(id) ? S.centralV.get(id) : undefined;
    if(S.fe && !feAberto(id, n)) S.fe = null;   // rascunho de outra unidade não vale aqui
    abrirFolha('un', 'Unidade ' + n + (a[4] != null && a[4] !== '' ? ', ' + andarTxt(a[4]) : ''), '', unidadePeHtml(p, a), 'folha-un');
    const dlg = $('#folha-un'); if(dlg){ dlg.dataset.n = String(n); dlg.dataset.pid = id; corpoFolha(unidadeCorpoHtml(p, det, c0, a), null, dlg); if(S.fe) feTotais(); }
    if(c0 === undefined){
      const c = await fichaCentral(id).catch(() => null);
      const d2 = $('#folha-un'); if(d2 && d2.isConnected && d2.dataset.n === String(n)){ const cp = $('.folha-corpo', d2), y = cp.scrollTop; corpoFolha(unidadeCorpoHtml(p, det, c, a), null, d2); cp.scrollTop = y; if(S.fe) feTotais(); }
    }
  }
  function marcarUnidade(id, n){
    const s = S.ui.tabSel.get(id) || new Set();
    if(s.has(n)) s.delete(n); else s.add(n);
    if(s.size) S.ui.tabSel.set(id, s); else S.ui.tabSel.delete(id);
    const p = S.byId.get(id), ch = S.det.get(id), det = ch && ch.v, dlg = $('#folha-un');
    if(p && det && dlg){ const a = (det.dados.unidades || []).find(x => String(x[0]) === String(n)); if(a){ const pe = dlg.querySelector('.folha-pe'); if(pe) pe.innerHTML = unidadePeHtml(p, a); } }
    atualizarTabela();
  }

  // ================= COMPARAR (mesmo motor do app dos Espelhos: opções parecidas ou escolhidas, lado a lado) =================
  const CP_MOT = [['parecido', 'Parecidos'], ['preco', 'Mais barato'], ['entrega', 'Entrega mais próxima'], ['regiao', 'Outra região'], ['tamanho', 'Planta maior']];
  const CP_INTRO = {parecido: 'opções parecidas com o %s', preco: 'opções mais em conta que o %s', entrega: 'opções com entrega mais próxima que a do %s', regiao: 'opções em outra região, no lugar do %s', tamanho: 'opções com planta maior que a do %s'};
  const CP_PESOS = {   // a: metragem, p: valor, e: entrega, d: distância, f: fase
    parecido: {a: .25, p: .30, e: .15, d: .15, f: .15}, preco: {a: .25, p: .40, e: .10, d: .15, f: .10}, entrega: {a: .20, p: .20, e: .40, d: .10, f: .10},
    regiao: {a: .25, p: .30, e: .15, d: .10, f: .20}, tamanho: {a: .35, p: .25, e: .15, d: .15, f: .10}};
  const TIPO_ORD = ['S', '1', '2', '3'];
  const CP_RAIOS = [2, 3, 5, 8, 12];
  const CP_PRAZO_MIN = 6, CP_RAZAO = 1.43;
  const CP0 = () => ({tipo: 'parecidos', pid: null, n: null, motivo: 'parecido', modo: 'pv', raio: 3, inc: true, fora: new Set(), esc: [{pid: null, n: null}, {pid: null, n: null}], qs: null});
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const mesesTxt = n => n + (n === 1 ? ' mês' : ' meses');
  function mesesAte(ym){ const m = /^(\d{4})-(\d{2})/.exec(ym || ''); if(!m) return null; const h = new Date(); return Math.max(0, (+m[1] - h.getFullYear()) * 12 + (+m[2] - 1 - h.getMonth())); }
  const entregaMeses = p => p.fase === 'pronto' ? 0 : (p.entrega ? mesesAte(p.entrega) : null);
  function entregaVal(p){ if(p.fase === 'pronto') return 'Pronto para morar'; const m = entregaMeses(p); if(m == null) return 'A confirmar'; return mesAnoCurto(p.entrega) + (m === 0 ? ' (este mês)' : ' (em ' + mesesTxt(m) + ')'); }
  const faseCp = p => p.fase === 'breve' ? 'lanc' : (p.fase || null);
  const BRLmil = v => v >= 1e6 ? 'R$ ' + (Math.round(v / 1e4) / 100).toLocaleString('pt-BR') + ' mi' : v >= 1e3 ? 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil' : BRL(v);
  const pctAbs = x => Math.abs(x).toLocaleString('pt-BR', {maximumFractionDigits: 0}) + '%';
  const pc1 = x => x.toLocaleString('pt-BR', {maximumFractionDigits: 1}) + '%';
  function cpPreco(u, modo){   // o valor pedido; se o projeto não tiver, o que ele tiver (com o rótulo certo)
    const tem = {pv: u.pv > 0, pp: u.p > 0};
    const k = tem[modo] ? modo : (tem.pv && tem.pp ? (u.pv <= u.p ? 'pv' : 'pp') : tem.pv ? 'pv' : tem.pp ? 'pp' : null);
    return k ? {v: k === 'pv' ? u.pv : u.p, k, lbl: k === 'pv' ? 'à vista' : 'parcelado'} : null;
  }
  function cpMetr(p, u, modo){ const pr = cpPreco(u, modo); return {p, u, n: u.n, ar: u.a, tk: u.k, pr, v: pr ? pr.v : null, pm2: pr && u.a > 0 ? pr.v / u.a : null, em: entregaMeses(p), fase: faseCp(p)}; }
  const cpLivres = pid => ((S.U && S.U.get(pid)) || []).filter(u => u.k !== 'L');
  function cpTipica(pid, modo){   // a do meio (pelo valor) da tipologia com mais unidades livres
    const us = cpLivres(pid).filter(u => cpPreco(u, modo)); if(!us.length) return null;
    const g = new Map(); us.forEach(u => { const k = u.k || '?'; if(!g.has(k)) g.set(k, []); g.get(k).push(u); });
    const maior = [...g.values()].sort((x, y) => y.length - x.length)[0];
    maior.sort((x, y) => cpPreco(x, modo).v - cpPreco(y, modo).v);
    return maior[Math.floor((maior.length - 1) / 2)];
  }
  function cpUnidade(pid, n, modo){   // a unidade pedida (livre, do índice; senão da tabela do projeto, se já aberta) ou a típica
    if(n != null && n !== ''){
      const u = cpLivres(pid).find(x => x.n === String(n)); if(u && cpPreco(u, modo)) return u;
      const ch = S.det.get(pid), det = ch && ch.v;
      const a = det && (det.dados.unidades || []).find(x => String(x[0]) === String(n));
      if(a){ const tl = tipologiaU(det, a) || ''; const pu = {n: String(a[0]), k: tipoKDe(tl), a: areaU(a), at: a[4] == null ? null : String(a[4]), p: precoU(a, 'pp'), pv: precoU(a, 'pv'), c: null, vg: null, f: 0, st: a[6]}; if(cpPreco(pu, modo)) return pu; }
    }
    return cpTipica(pid, modo);
  }
  function cpAlternativas(ref, motivo, raio, modo){
    const P = ref.p, bo = norm(P.bairro || ''), out = [], W = CP_PESOS[motivo] || CP_PESOS.parecido;
    const filtraTipo = TIPO_ORD.includes(ref.tk), ixT = TIPO_ORD.indexOf(ref.tk);
    for(const Q of S.P){
      if(Q.id === P.id || !Q.livres) continue;
      const mesmoBairro = !!bo && norm(Q.bairro || '') === bo;
      let d = P.lat != null && P.lng != null && Q.lat != null && Q.lng != null ? distKm(P, Q) : null;
      if(d == null){ if(!mesmoBairro) continue; d = 0; } else if(d > raio) continue;
      if(motivo === 'regiao' && mesmoBairro) continue;
      let melhor = null, nTipo = 0, nDisp = 0;
      for(const u of cpLivres(Q.id)){
        nDisp++;
        const m = cpMetr(Q, u, modo);
        if(filtraTipo && m.tk === ref.tk) nTipo++;
        if(!m.v || !(m.ar > 0)) continue;
        if(filtraTipo && m.tk !== ref.tk && !(motivo === 'tamanho' && TIPO_ORD.indexOf(m.tk) === ixT + 1)) continue;
        const rA = m.ar / ref.ar, rP = m.v / ref.v;
        if(motivo === 'tamanho'){ if(rA < 1.08 || rA > 1.7) continue; } else if(rA < .65 || rA > 1.35) continue;
        if(rP < .55 || rP > 1.4) continue;
        if(motivo === 'preco' && rP > .98) continue;
        if(motivo === 'entrega'){ if(m.em == null) continue; if(ref.em != null ? (ref.em === 0 ? m.em !== 0 : m.em >= ref.em) : m.em > 12) continue; }
        const sA = motivo === 'tamanho' ? clamp01(1 - Math.abs(rA - 1.2) / .25) : clamp01(1 - Math.abs(rA - 1) / .30);
        const sP = motivo === 'preco' ? clamp01((1 - rP) / .2) : clamp01(1 - Math.abs(rP - 1) / .25);
        const sE = ref.em == null || m.em == null ? .5 : motivo === 'entrega' ? clamp01((ref.em - m.em) / 12 + (ref.em === 0 ? 1 : 0)) : clamp01(1 - Math.abs(m.em - ref.em) / 18);
        const sD = clamp01(1 - d / Math.max(raio, 1.5));
        const sF = !ref.fase || !m.fase ? .5 : ref.fase === m.fase ? 1 : (ref.fase === 'pronto' || m.fase === 'pronto' ? .3 : .6);
        const s = W.a * sA + W.p * sP + W.e * sE + W.d * sD + W.f * sF, dv = Math.abs(rP - 1);
        if(!melhor || s > melhor.s + 1e-9 || (Math.abs(s - melhor.s) <= 1e-9 && dv < melhor.dv)) melhor = {m, s, dv};
      }
      if(melhor && melhor.s >= .35) out.push({m: melhor.m, s: melhor.s, d, nTipo, nDisp, q: Q});
    }
    out.sort((x, y) => y.s - x.s || x.d - y.d);
    return out;
  }
  function cpBuscar(cp){
    const P = S.byId.get(cp.pid); if(!P) return null;
    const u = cpUnidade(P.id, cp.n, cp.modo); if(!u) return {ref: null, alts: []};
    const ref = cpMetr(P, u, cp.modo);
    const base = cp.motivo === 'regiao' ? Math.max(cp.raio, 5) : cp.raio, seq = [base].concat([3, 5, 8, 12].filter(r => r > base));
    let alts = [], usado = base;
    for(const r of seq){ alts = cpAlternativas(ref, cp.motivo, r, cp.modo); usado = r; if(alts.length >= 3) break; }
    return {ref, alts: alts.slice(0, 4), raio: usado, base, ampliou: usado > base};
  }
  function cpEscolhidos(cp){
    const out = [];
    for(const e of cp.esc){ const P = e.pid && S.byId.get(e.pid); if(!P) continue; const u = cpUnidade(P.id, e.n, cp.modo); if(u) out.push(cpMetr(P, u, cp.modo)); }
    return out;
  }

  // ---------- diferenças para o original ----------
  function cpDeltas(m, ref){
    const o = {};
    if(m.v != null && ref.v){ const x = (m.v - ref.v) / ref.v * 100; o.v = Math.abs(x) < .5 ? {t: 'mesmo valor', c: ''} : {t: BRLmil(Math.abs(m.v - ref.v)) + (x < 0 ? ' a menos' : ' a mais') + ' (' + pctAbs(x) + ')', c: x < 0 ? 'bom' : 'ruim'}; }
    if(m.ar > 0 && ref.ar > 0){ const x = m.ar - ref.ar; o.a = Math.abs(x) < .3 ? {t: 'mesma metragem', c: ''} : {t: fmtM2(Math.round(Math.abs(x) * 10) / 10) + ' a ' + (x > 0 ? 'mais' : 'menos'), c: x > 0 ? 'bom' : 'ruim'}; }
    if(m.pm2 && ref.pm2){ const x = (m.pm2 - ref.pm2) / ref.pm2 * 100; o.m = Math.abs(x) < 1 ? {t: 'igual', c: ''} : {t: pctAbs(x) + (x < 0 ? ' menos' : ' mais') + ' por m²', c: x < 0 ? 'bom' : 'ruim'}; }
    if(m.em != null && ref.em != null){ const x = m.em - ref.em; o.e = x === 0 ? {t: ref.em === 0 ? 'também pronto' : 'mesmo prazo', c: ''} : {t: mesesTxt(Math.abs(x)) + (x < 0 ? ' antes' : ' depois'), c: x < 0 ? 'bom' : 'ruim'}; }
    return o;
  }
  function cpPorque(m, ref, d){
    const o = cpDeltas(m, ref), t = [];
    if(o.v && o.v.c) t.push(o.v.t.replace(/ \(.*\)$/, ''));
    if(o.a && o.a.c) t.push(o.a.t);
    if(o.e && o.e.c) t.push('entrega ' + o.e.t);
    if(!t.length) t.push('valor e metragem praticamente iguais');
    return maiusc1(t.slice(0, 3).join(', ')) + (d != null ? ', a ' + kmTxt(d) + ' do original' : '');
  }

  // ---------- fluxo resumido (só no parcelado) e prazo ----------
  const cpPer = t => t === 'semestral' ? 6 : t === 'anual' ? 12 : (t === 'mensal' || t === 'parc') ? 1 : 0;
  const ymNum = d => { const m = /^(\d{4})-(\d{2})/.exec(d || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
  function prazoDatas(T){   // meses de hoje até a última parcela antes do financiamento
    if(!T || !Array.isArray(T.cols)) return null;
    const h = new Date(), hoje = h.getFullYear() * 12 + h.getMonth();
    let fim = null, n = 0;
    for(const c of T.cols){ if(c.t === 'fin') continue; const per = cpPer(c.t), d = ymNum(c.d), k = c.n || 1; if(per) n += k; if(d != null){ const e = d + (k - 1) * per; if(fim == null || e > fim) fim = e; } }
    return fim != null ? Math.max(0, fim - hoje) : n;
  }
  function cpFluxo(det, a){
    const fx = fluxoDe(det, a); if(!fx) return null;
    const prazo = fx.T && fx.T.prazo != null ? +fx.T.prazo : prazoDatas(fx.T);
    if(!fx.linhas || !fx.linhas.length || !(fx.total > 0)) return {txt: null, prazo, aprox: true};
    const L = fx.linhas, tot = fx.total, soma = ls => ls.reduce((s, l) => s + l.v * l.n, 0);
    const ato = L.filter(l => l.t === 'ato' || l.t === 'sinal'), fin = L.filter(l => l.fin), resto = L.filter(l => !l.fin && l.t !== 'ato' && l.t !== 'sinal');
    const atoV = soma(ato), atoN = ato.reduce((s, l) => s + l.n, 0), parcN = resto.reduce((s, l) => s + l.n, 0), finV = soma(fin), t = [];
    if(atoV) t.push(pc1(atoV / tot * 100) + ' de entrada' + (atoN > 1 ? ' em ' + atoN + 'x' : ''));
    if(parcN) t.push(parcN + (parcN === 1 ? ' parcela' : ' parcelas'));
    t.push(finV ? pc1(finV / tot * 100) + ' no financiamento' : 'sem financiamento');
    return {txt: t.join(', '), prazo};
  }
  const cpComparavel = (x, y) => { if(x == null || y == null) return true; const a = Math.max(x, CP_PRAZO_MIN), b = Math.max(y, CP_PRAZO_MIN); return Math.max(a, b) / Math.min(a, b) <= CP_RAZAO; };

  // ---------- tela ----------
  function cpSlotProj(slot, pid, rot){
    const P = pid && S.byId.get(pid);
    return '<button type="button" class="cp-proj" data-acao="cp-escolher" data-slot="' + esc(slot) + '">' + (P ? miniProj(P, 'peq') + '<span><b>' + esc(P.nome) + '</b><small>' + esc([quemDe(P), P.bairro].filter(Boolean).join(', ')) + '</small></span>' : '<span class="cp-proj-vazio">' + ICO.lupa + esc(rot) + '</span>') + ICO.baixo + '</button>';
  }
  function cpOpcoesUn(pid, n, modo){
    const tip = cpTipica(pid, modo), pr = tip && cpPreco(tip, modo);
    const us = cpLivres(pid).filter(u => cpPreco(u, modo)).sort((x, y) => cpPreco(x, modo).v - cpPreco(y, modo).v).slice(0, 160);
    const fora = n != null && n !== '' && !us.some(u => u.n === String(n));
    return '<option value=""' + (n == null || n === '' ? ' selected' : '') + '>Unidade típica' + (tip ? ': ' + [tipoNome(tip.k), tip.a ? fmtM2(tip.a) : '', pr ? BRLc(pr.v) : ''].filter(Boolean).join(', ') : '') + '</option>' +
      (fora ? '<option value="' + esc(n) + '" selected>Unidade ' + esc(n) + '</option>' : '') +
      us.map(u => '<option value="' + esc(u.n) + '"' + (String(n) === u.n ? ' selected' : '') + '>' + esc([u.n, u.at != null ? andarCurto(u.at) : '', u.a ? fmtM2(u.a) : '', tipoNome(u.k), BRL(cpPreco(u, modo).v)].filter(Boolean).join(', ')) + '</option>').join('');
  }
  function cpLinha(rot, val, delta, extra){
    return '<div><dt>' + esc(rot) + '</dt><dd>' + esc(val) + (delta && delta.t ? '<small class="cp-d' + (delta.c ? ' ' + delta.c : '') + '">' + esc(delta.t) + '</small>' : extra ? '<small class="cp-d">' + esc(extra) + '</small>' : '') + '</dd></div>';
  }
  function cpCardHtml(m, ref, rotulo, x, cp, k){
    const P = m.p, o = ref && m !== ref ? cpDeltas(m, ref) : {}, pv = cpPreco(m.u, 'pv'), pp = cpPreco(m.u, 'pp');
    const temPv = pv && pv.k === 'pv', temPp = pp && pp.k === 'pp';
    const kUsado = m.pr ? m.pr.k : cp.modo, kRef = ref && ref.pr ? ref.pr.k : cp.modo;   // sem a tabela pedida, a diferença vai na linha do valor que entrou na conta
    const dV = o.v ? (kUsado !== kRef ? {t: o.v.t + ', pelo ' + (kUsado === 'pp' ? 'parcelado' : 'à vista'), c: o.v.c} : o.v) : null;
    const fora = cp.fora.has(P.id), orig = !x && cp.tipo === 'parecidos';
    const incluido = orig ? cp.inc : !fora;
    const dl = cpLinha('Unidade', m.n + (m.u.at != null ? ', ' + andarTxt(m.u.at) : '')) +
      cpLinha('Metragem', [m.ar ? fmtM2(m.ar) : '', tipoNome(m.tk)].filter(Boolean).join(', ') || 'sem metragem', o.a) +
      cpLinha('À vista', temPv ? BRL(pv.v) : 'sem tabela à vista', kUsado === 'pv' ? dV : null) +
      cpLinha('Parcelado', temPp ? BRL(pp.v) : 'sem tabela parcelada', kUsado === 'pp' ? dV : null, temPv && temPp && pp.v > pv.v ? 'à vista fica ' + pctAbs((1 - pv.v / pp.v) * 100) + ' abaixo' : '') +
      cpLinha('Por m²', m.pm2 ? BRL(m.pm2) : 'sem valor', o.m, m.pm2 && m.pr ? 'no ' + m.pr.lbl : '') +
      cpLinha('Entrega', entregaVal(P), o.e) +
      cpLinha('Construtora', quemDe(P) || 'não informada') +
      (x ? cpLinha('Disponíveis', (x.nTipo && tipoNome(m.tk) ? x.nTipo + ' de ' + tipoNome(m.tk).toLowerCase() + ', ' : '') + plural(x.nDisp, 'livre no projeto', 'livres no projeto')) : cpLinha('Disponíveis', plural(P.livres, 'livre no projeto', 'livres no projeto'))) +
      (cp.modo === 'pp' ? '<div class="cp-fx" data-cpk="' + k + '"><dt>Fluxo</dt><dd><span class="brilho" style="display:block;height:18px;border-radius:6px"></span></dd></div>' : '');
    return '<article class="cp-card' + (orig || (cp.tipo === 'escolha' && k === 0) ? ' orig' : '') + (incluido ? '' : ' fora') + '">' +
      '<div class="cp-foto">' + capaProj(P, {w: 560, sizes: '(min-width:1024px) 22vw, 80vw'}) + '<span class="cp-selo">' + esc(rotulo) + '</span></div>' +
      '<div class="cp-corpo"><h3 class="t-3"><a href="#/p/' + esc(P.id) + '">' + esc(P.nome) + '</a></h3><p class="sub">' + esc([P.bairro, x && x.d != null ? 'a ' + kmTxt(x.d) + ' do original' : ''].filter(Boolean).join(', ')) + '</p>' +
      '<dl class="cp-fatos">' + dl + '</dl>' +
      '<div class="cp-pl" data-cpk="' + k + '"><span class="brilho"></span></div>' +
      (x && ref ? '<p class="cp-porque">' + esc(cpPorque(m, ref, x.d)) + '</p>' : '') +
      '<div class="cp-acoes"><button type="button" class="pilula peq" data-acao="cp-incluir" data-id="' + esc(P.id) + '" data-orig="' + (orig ? 1 : 0) + '" aria-pressed="' + incluido + '">' + (incluido ? ICO.ok : '') + 'No envio</button>' +
      '<a class="pilula peq" href="#/tabelas/' + esc(P.id) + '" data-acao="cp-espelho" data-id="' + esc(P.id) + '" data-n="' + esc(m.n) + '">' + ICO.predio + 'Espelho</a><a class="pilula peq" href="#/p/' + esc(P.id) + '">Ficha</a></div></div></article>';
  }
  function telaComparar(qs){
    if(!S.cp) S.cp = CP0();
    const cp = S.cp;
    if(qs && qs !== cp.qs){
      const q = new URLSearchParams(qs), pid = q.get('p');
      if(pid && S.byId.has(pid)){ cp.tipo = 'parecidos'; cp.pid = pid; cp.n = q.get('n') || null; cp.fora = new Set(); cp.inc = true; }
      cp.qs = qs;
    }
    const cab = '<header class="pg-cab"><div><h1 class="t-1">Comparar</h1><p class="texto-2 ler">' + (cp.tipo === 'parecidos' ? 'O cliente não gostou de um projeto? Escolha o projeto e o motivo: o app separa até 4 opções parecidas por perto e mostra lado a lado, com valores, metragem, entrega e planta.' : 'Escolha de 2 a 5 projetos e a unidade de cada um para ver lado a lado.') + '</p></div>' +
      '<div class="seg seg-cp" role="group" aria-label="Como comparar"><button type="button" data-acao="cp-tipo" data-v="parecidos" aria-pressed="' + (cp.tipo === 'parecidos') + '">Opções parecidas</button><button type="button" data-acao="cp-tipo" data-v="escolha" aria-pressed="' + (cp.tipo === 'escolha') + '">Escolher</button></div></header>';
    if(!S.U){
      pos.push(async () => { await carregarUnidades(); if(/^#\/comparar/.test(location.hash)) render(); });
      return cab + '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:120px"></div><div class="brilho" style="height:320px"></div><p class="sub">' + (S.Uerro ? 'Não consegui abrir as unidades agora.' : 'Carregando as unidades livres…') + '</p></div>';
    }
    if(cp.n && cp.pid && !S.det.get(cp.pid) && !cpLivres(cp.pid).some(u => u.n === String(cp.n))) pos.push(async () => { try{ await detalhe(cp.pid); if(/^#\/comparar/.test(location.hash)) render(); }catch(e){} });
    const modoSeg = '<div class="seg" role="group" aria-label="Valor a comparar">' + [['pv', 'À vista'], ['pp', 'Parcelado']].map(x => '<button type="button" data-acao="cp-modo" data-v="' + x[0] + '" aria-pressed="' + (cp.modo === x[0]) + '">' + x[1] + '</button>').join('') + '</div>';
    let ctl = '', itens = [], ref = null, aviso = '';
    if(cp.tipo === 'parecidos'){
      ctl = '<div class="cp-ctl"><div class="cp-campo cp-c-proj"><span class="rotulo">Projeto que o cliente viu</span>' + cpSlotProj('ref', cp.pid, 'Escolher o projeto') + '</div>' +
        (cp.pid ? '<label class="cp-campo cp-c-un"><span class="rotulo">Unidade de referência</span><select class="sel" data-input="cp-un">' + cpOpcoesUn(cp.pid, cp.n, cp.modo) + '</select></label>' : '') +
        '<div class="cp-campo cp-c-mot"><span class="rotulo">Por que ele não gostou?</span><div class="pilulas" role="group" aria-label="Motivo">' + CP_MOT.map(x => '<button type="button" class="pilula peq" data-acao="cp-motivo" data-v="' + x[0] + '" aria-pressed="' + (cp.motivo === x[0]) + '">' + x[1] + '</button>').join('') + '</div></div>' +
        '<div class="cp-campo"><span class="rotulo">Valor</span>' + modoSeg + '</div>' +
        '<label class="cp-campo"><span class="rotulo">Distância</span><select class="sel" data-input="cp-raio">' + CP_RAIOS.map(r => '<option value="' + r + '"' + (cp.raio === r ? ' selected' : '') + '>até ' + r + ' km</option>').join('') + '</select></label></div>';
      if(cp.pid){
        const r = cpBuscar(cp);
        if(!r || !r.ref) aviso = '<p class="aviso fino">Esse projeto não tem unidade livre com preço para servir de referência. Escolha outro projeto ou uma unidade.</p>';
        else{
          ref = r.ref;
          aviso = '<p class="cp-ref">Referência: <b>' + esc(ref.p.nome) + '</b>, unidade ' + esc(ref.n) + ', ' + esc([ref.ar ? fmtM2(ref.ar) : '', tipoNome(ref.tk), ref.pr ? BRL(ref.v) + ' ' + ref.pr.lbl : ''].filter(Boolean).join(', ')) + '.</p>' +
            (r.ampliou ? '<p class="aviso fino">Não achei opções suficientes até ' + r.base + ' km do projeto: ampliei a busca para ' + r.raio + ' km.</p>' : '') +
            (!r.alts.length ? '<p class="aviso fino">Nenhum projeto parecido até ' + r.raio + ' km. Tente outro motivo, o outro valor ou escolha os projetos.</p>' : '');
          itens = [{m: ref, x: null, rot: 'O cliente viu'}].concat(r.alts.map((x, i) => ({m: x.m, x, rot: 'Opção ' + (i + 1)})));
        }
      }
    }else{
      ctl = '<div class="cp-ctl cp-esc">' + cp.esc.map((e, i) => '<div class="cp-slot"><div class="cp-slot-cab"><span class="rotulo">' + (i === 0 ? 'Base da comparação' : 'Projeto ' + (i + 1)) + '</span>' +
        (cp.esc.length > 2 ? '<button type="button" class="link-mais" data-acao="cp-tirar" data-i="' + i + '" aria-label="Tirar o projeto ' + (i + 1) + '">Tirar</button>' : '') + '</div>' + cpSlotProj(String(i), e.pid, 'Escolher o projeto') +
        (e.pid ? '<select class="sel" data-input="cp-esc-un" data-i="' + i + '" aria-label="Unidade do projeto ' + (i + 1) + '">' + cpOpcoesUn(e.pid, e.n, cp.modo) + '</select>' : '') + '</div>').join('') +
        (cp.esc.length < 5 ? '<button type="button" class="btn btn-peq cp-mais" data-acao="cp-add">Mais um projeto</button>' : '') +
        '<div class="cp-campo"><span class="rotulo">Valor</span>' + modoSeg + '</div></div>';
      const ms = cpEscolhidos(cp);
      if(ms.length){ ref = ms[0]; itens = ms.map((m, i) => ({m, x: i ? {d: ref.p.lat != null && m.p.lat != null ? distKm(ref.p, m.p) : null, nTipo: 0, nDisp: m.p.livres} : null, rot: i ? 'Projeto ' + (i + 1) : 'Base'})); }
      if(ms.length < 2) aviso = '<p class="aviso fino">Escolha pelo menos dois projetos.</p>';
    }
    S.cpItens = itens;
    if(itens.length) pos.push(() => cpCarregarExtras(itens, ref));
    const cards = itens.length ? '<div class="cp-cards" style="--n:' + itens.length + '">' + itens.map((it, k) => cpCardHtml(it.m, ref, it.rot, it.x, cp, k)).join('') + '</div>' : '';
    const noEnvio = cpItensEnvio(cp);
    const barra = itens.length > 1 && noEnvio.length ? '<div class="barra-envio"><p><span><b class="num">' + noEnvio.length + '</b> ' + (noEnvio.length === 1 ? 'projeto' : 'projetos') + '</span><small>no envio, lado a lado</small></p><button type="button" class="btn btn-pri" data-acao="cp-mandar">' + ICO.enviar + '<span>Mandar<span class="so-largo"> pro cliente</span></span></button></div>' : '';
    return cab + ctl + aviso + cards + barra;
  }
  function cpItensEnvio(cp){
    const its = S.cpItens || [];
    return its.filter((it, k) => { const orig = !it.x && cp.tipo === 'parecidos'; return orig ? cp.inc : !cp.fora.has(it.m.p.id); }).map(it => ({p: it.m.p.id, n: it.m.n, nome: it.m.p.nome}));
  }
  async function cpCarregarExtras(itens, ref){   // planta da unidade e fluxo (no parcelado), projeto por projeto
    const cp = S.cp, alvo = '#/comparar' + (cp.qs ? '?' + cp.qs : '');
    let prazoRef;
    for(let k = 0; k < itens.length; k++){
      const it = itens[k], P = it.m.p;
      let det = null, c = null;
      try{ det = await detalhe(P.id); }catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais.'); }
      c = await fichaCentral(P.id).catch(() => null);
      if(!/^#\/comparar/.test(location.hash) || S.cpItens !== itens) return;
      const a = det && (det.dados.unidades || []).find(x => String(x[0]) === String(it.m.n));
      const box = $('.cp-pl[data-cpk="' + k + '"]');
      if(box){
        const pl = det && a ? plantaDaUnidade(det, c, a) : null;
        if(pl){ it.pl = pl; box.innerHTML = '<figure class="planta"><button type="button" class="mos-item" data-acao="luz-cp" data-k="' + k + '" aria-label="' + esc('Ampliar a ' + pl.t) + '">' + imgTag(pl.src, pl.t, '', {w: 640, semSet: true}) + '</button><figcaption>' + esc(pl.t) + (pl.exata ? '' : '<small>Planta da tipologia</small>') + '</figcaption></figure>'; }
        else box.innerHTML = '<p class="nota">Planta não cadastrada.</p>';
      }
      const fb = $('.cp-fx[data-cpk="' + k + '"] dd');
      if(fb){
        const fx = det && a ? cpFluxo(det, a) : null;
        if(k === 0) prazoRef = fx ? fx.prazo : null;
        const pz = fx && fx.prazo != null && fx.prazo >= 1 ? 'parcelas até ' + mesesTxt(fx.prazo) : '';
        const dif = k > 0 && fx && !cpComparavel(prazoRef, fx.prazo);
        fb.innerHTML = fx && fx.txt ? esc(fx.txt) + (pz ? '<small class="cp-d">' + esc(pz) + '</small>' : '') + (dif ? '<small class="cp-d ruim">prazo de pagamento bem diferente do original</small>' : '') : 'Consulte a tabela' + (pz ? '<small class="cp-d">' + esc(pz) + '</small>' : '');
      }
      if(location.hash !== alvo && !/^#\/comparar$/.test(location.hash)) return;
    }
  }
  function abrirEscolhaProjeto(slot){
    S.cpSlot = slot;
    abrirFolha('cp-proj', 'Escolher o projeto', '<label class="busca mini"><span class="sr">Buscar projeto</span>' + ICO.lupa + '<input type="search" id="cp-pq" autocomplete="off" placeholder="Nome, construtora ou bairro" data-input="cp-pq"></label><ul class="lista-proj cp-lista" id="cp-lista">' + cpListaProjHtml('') + '</ul>', '', 'folha-alta');
    setTimeout(() => { const i = $('#cp-pq'); if(i && !ehToque()) i.focus(); }, 80);
  }
  function cpListaProjHtml(q){
    const termos = norm(q).split(/\s+/).filter(Boolean);
    const ps = S.P.filter(p => p.livres > 0 && (!termos.length || termos.every(t => norm([p.nome, p.curto, p.bairro, quemDe(p)].join(' ')).includes(t))))
      .sort((a, b) => (b.v7 - a.v7) || String(a.nome).localeCompare(String(b.nome), 'pt-BR')).slice(0, 80);
    return ps.map(p => '<li><button type="button" class="cp-op" data-acao="cp-pick" data-id="' + esc(p.id) + '">' + miniProj(p) + '<span class="meio"><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span><span>' + esc(plural(p.livres, 'livre', 'livres')) + '</span></span></button></li>').join('') || '<li class="lista-mais">Nenhum projeto com unidade livre com esse nome.</li>';
  }
  function abrirEnvioCmp(){
    const cp = S.cp, its = cpItensEnvio(cp); if(its.length < 1) return;
    const refIt = (S.cpItens || [])[0];
    const motivo = cp.tipo === 'parecidos' ? cp.motivo : null;
    const u = {}; its.forEach(x => { if(!(x.p in u)) u[x.p] = x.n; });
    const o = cp.tipo === 'parecidos' && cp.inc && refIt ? refIt.m.p.id : (cp.tipo === 'escolha' && its[0] ? its[0].p : null);
    const texto = ('Comparativo: ' + (motivo && refIt ? (CP_INTRO[motivo] || CP_INTRO.parecido).replace('%s', refIt.m.p.nome) : its.map(x => x.nome).join(' x '))).slice(0, 200);
    S.envio = {multi: true, modo: cp.modo, itens: its.map(x => ({p: x.p, n: x.n})), texto, cmp: {o, u, m: motivo || 'escolha'}};
    const lista = its.map(x => { const P = S.byId.get(x.p), it = (S.cpItens || []).find(i => i.m.p.id === x.p && i.m.n === x.n), pr = it && it.m.pr; return '<p class="env-u">' + (P ? miniProj(P, 'peq') : '') + '<span><b>' + esc(x.nome) + '</b><small>' + esc('unidade ' + x.n + (it && it.m.ar ? ', ' + fmtM2(it.m.ar) : '')) + '</small></span><span class="num ouro">' + (pr ? esc(BRLc(pr.v)) : '') + '</span></p>'; }).join('');
    abrirFolha('envio', 'Mandar pro cliente',
      '<p class="texto-2">O cliente recebe uma página com os ' + its.length + ' projetos lado a lado (valores, metragem e entrega) e as fichas de cada um.</p>' +
      '<label class="campo">Nome do cliente<input id="env-cli" maxlength="60" autocomplete="off" placeholder="Ex.: Maria" required></label>' +
      '<fieldset><legend>No comparativo</legend><div class="env-lista">' + lista + '</div></fieldset>' + camposAssinatura() + '<p class="erro-txt" id="env-erro" role="alert"></p>',
      '<button type="button" class="btn btn-pri btn-alto" data-acao="env-criar" id="env-ok">' + ICO.enviar + 'Criar o link</button>');
    setTimeout(() => { const i = $('#env-cli'); if(i && !ehToque()) i.focus(); }, 80);
  }

  // ================= FLUXO PERSONALIZADO DA UNIDADE (o mesmo editor e o mesmo lugar dos Espelhos) =================
  // Guardado neste aparelho em 'nex-fluxos', por projeto|unidade: {linhas: [{q, nome, valor, quando}], em, auto, alvo}.
  // É a mesma chave da central dos Espelhos (mesmo site): o fluxo montado num app aparece no outro.
  const K_PERS = 'nex-fluxos', MAX_LINHAS = 8;
  ICO.lapis = svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>');
  const quandoMontado = ms => { const t = quandoTxt(ms); return /^\d\d:\d\d$/.test(t) ? 'hoje às ' + t : /^ontem /.test(t) ? t.replace('ontem ', 'ontem às ') : t.replace(/^(\S+) /, 'em $1 às '); };
  function persTodos(){ try{ const o = JSON.parse(LS.get(K_PERS) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }catch(e){ return {}; } }
  const persKey = (pid, n) => pid + '|' + n;
  function persDe(pid, n){ const pz = persTodos()[persKey(pid, String(n))]; return pz && Array.isArray(pz.linhas) && pz.linhas.length ? pz : null; }
  function persGravar(pid, n, pz){
    const o = persTodos(), k = persKey(pid, String(n));
    if(pz) o[k] = pz; else delete o[k];
    Object.keys(o).sort((x, y) => String((o[y] || {}).em || '').localeCompare(String((o[x] || {}).em || ''))).slice(80).forEach(z => { delete o[z]; });
    return LS.set(K_PERS, JSON.stringify(o));
  }
  const persDoProjeto = pid => Object.keys(persTodos()).filter(k => k.startsWith(pid + '|')).map(k => k.slice(pid.length + 1));

  // ---------- números ----------
  const temCent = v => Math.abs(v - Math.round(v)) >= 0.005;
  const BRL2 = v => 'R$ ' + (+v).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const fmtV = v => temCent(v) ? BRL2(v) : BRL(v);
  const numTxt = v => v == null || !isFinite(v) ? '' : (+v).toLocaleString('pt-BR', {minimumFractionDigits: temCent(v) ? 2 : 0, maximumFractionDigits: 2});
  function numBR(s){   // "12.019,42", "R$ 300.483", "1502.41" e "12 mil" viram número
    let t = String(s == null ? '' : s).toLowerCase().replace(/r\$|\s/g, '');
    if(!t) return null;
    const mil = /mil$|k$/.test(t); t = t.replace(/mil$|k$/, '');
    if(/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
    else if(!/^\d+\.\d{1,2}$/.test(t)) t = t.replace(/[.,]/g, '');
    let n = parseFloat(t); if(!isFinite(n)) return null;
    if(mil) n *= 1000;
    return Math.round(n * 100) / 100;
  }
  const tituloLinha = l => ((+l.q || 1) > 1 ? (+l.q) + ' ' : '') + String(l.nome || '').trim();
  const linhasDe = ls => ls.map(l => ({t: tituloLinha(l).slice(0, 60), v: fmtV(+l.valor || 0), s: String(l.quando || '').trim().slice(0, 80)}));
  const totalDe = ls => Math.round(ls.reduce((s, l) => s + (+l.q || 1) * (+l.valor || 0), 0) * 100) / 100;
  const ehFin = l => /financ|repasse/i.test(String(l.nome || ''));
  // linha que "fecha a conta": o financiamento (ou chaves, saldo); sem ele, a última parcela única
  function linhaFechamento(ls){
    for(let i = ls.length - 1; i >= 0; i--) if(/financ|chaves|saldo|repasse/i.test(ls[i].nome)) return i;
    for(let i = ls.length - 1; i >= 0; i--) if((+ls[i].q || 1) === 1) return i;
    return ls.length - 1;
  }
  function fecharConta(ls, alvo){   // muda só a linha de fechamento; resto <= 0: as outras parcelas já passam do alvo
    const i = linhaFechamento(ls), l = ls[i], q = +l.q || 1;
    const resto = Math.round((alvo - (totalDe(ls) - q * (+l.valor || 0))) * 100) / 100;
    l.valor = resto > 0 ? Math.round(resto / q * 100) / 100 : 0;
    return {i, resto, alvo};
  }
  // as outras parcelas chegaram (ou passaram) no total: a linha de fechamento ficou sem valor
  function passaTxt(fc, ls){
    const outras = Math.round((fc.alvo - fc.resto) * 100) / 100, lf = ls[fc.i] || {};
    return fc.resto < 0 ? 'As outras parcelas somam ' + fmtV(outras) + ', mais que o total de ' + fmtV(fc.alvo) + '. Diminua alguma delas.'
      : 'As outras parcelas já somam ' + fmtV(fc.alvo) + ' e não sobra valor para “' + tituloLinha(lf) + '”. Diminua alguma delas.';
  }
  function infoFin(ls, total){
    let i = -1; for(let j = ls.length - 1; j >= 0; j--) if(ehFin(ls[j])){ i = j; break; }
    if(i < 0 || !(total > 0)) return null;
    const v = Math.round((+ls[i].q || 1) * (+ls[i].valor || 0) * 100) / 100;
    return {v, pct: Math.round(v / total * 1000) / 10};
  }
  const proxMes = () => { const d = new Date(); d.setMonth(d.getMonth() + 1, 1); return MES3[d.getMonth()] + '/' + d.getFullYear(); };
  const NOME_FLUXO = {ato: 'Ato', sinal: 'Sinal', parc: 'parcelas', mensal: 'mensais', semestral: 'semestrais', anual: 'anuais', inter: 'intermediárias', unica: 'Parcela única', chaves: 'Chaves', fin: 'Financiamento bancário'};
  // o fluxo da tabela da unidade em linhas editáveis; sem fluxo, uma linha com o preço
  function linhasDaTabela(det, a){
    const fx = fluxoDe(det, a);
    if(fx && fx.linhas && fx.linhas.length){
      const ls = fx.linhas.map(l => {
        const q = l.n || 1, base = l.rot ? String(l.rot) : (NOME_FLUXO[l.t] || 'Parcela');
        return {q, nome: q > 1 ? base.charAt(0).toLowerCase() + base.slice(1) : base, valor: Math.round(l.v * 100) / 100,
          quando: l.d ? (q > 1 ? 'a partir de ' : 'em ') + mesAnoCurto(l.d) : (l.fin ? 'na entrega das chaves' : '')};
      });
      return {ls, total: totalDe(ls), fluxo: true};
    }
    const v = precoU(a, chaveBase(det)) || precoU(a, 'pv') || 0;
    return {ls: [{q: 1, nome: 'À vista', valor: v, quando: 'no fechamento'}], total: v, fluxo: false};
  }

  // ---------- o que vai para o cliente (mesmo formato do link da central dos Espelhos) ----------
  const NOTA_VALOR = 'Valor na data do envio, sujeito a alteração e à disponibilidade da unidade.';
  const corta = (s, n) => { s = String(s || '').trim(); if(s.length <= n) return s; const c = s.slice(0, n); const p = c.lastIndexOf('. '); return (p > 80 ? c.slice(0, p + 1) : c.slice(0, n - 1) + '…').trim(); };
  function valoresPers(pz){
    const dia = new Date().toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'});
    return {base: 'personalizado', rotulo: 'Condição personalizada', total: totalDe(pz.linhas), linhas: linhasDe(pz.linhas).slice(0, MAX_LINHAS),
      nota: 'Condição personalizada preparada em ' + dia + ', sujeita à aprovação da construtora e à disponibilidade da unidade.'};
  }
  function valoresTabela(det, a, modo){
    const tab = det.dados.tabela || {}, corr = (det.info && det.info.fluxo && det.info.fluxo.correcao) || tab.correcao || '';
    const nota = corta([tab.regra_curta, corr].filter(Boolean).join(' ') || NOTA_VALOR, 400), rot = tab.nome ? nomeTabela(tab.nome) : '';
    const tb = linhasDaTabela(det, a);
    if(tb.fluxo && (!modo || modo === chaveBase(det))) return {base: 'tabela', rotulo: rot || 'Tabela de vendas', total: Math.round(tb.total), linhas: linhasDe(tb.ls).slice(0, MAX_LINHAS), nota};
    const pc = precosCampos(det), k = modo && precoU(a, modo) ? modo : chaveBase(det), v = precoU(a, k);
    if(!v) return null;
    const lab = (pc.find(x => x.k === k) || {}).label || 'Valor';
    return {base: k, rotulo: rot, total: v, linhas: [{t: lab, v: BRL(v), s: ''}], nota};
  }
  // fluxo que fecha sozinho e sem total negociado acompanha o valor atual da tabela (ex.: tabela nova do mês), como na central
  function persAtual(det, a, pz){
    if(!pz || !pz.auto || pz.alvo) return pz;
    const tb = linhasDaTabela(det, a); if(!(tb.total > 0)) return pz;
    const ls = pz.linhas.map(l => Object.assign({}, l));
    return fecharConta(ls, tb.total).resto > 0 ? Object.assign({}, pz, {linhas: ls}) : pz;
  }
  // a condição montada numa unidade aplicada a outra: mesma entrada e parcelas, o financiamento fecha no valor dela
  function persDerivado(det, a, pz){
    const tb = linhasDaTabela(det, a); if(!(tb.total > 0)) return null;
    const ls = pz.linhas.map(l => Object.assign({}, l)), r = fecharConta(ls, tb.total);
    return r.resto > 0 ? {linhas: ls, em: pz.em} : null;
  }
  // valores de cada unidade do envio: o fluxo dela, o derivado da primeira personalizada ou a tabela
  function valoresDoEnvio(det, pid, ns, formato, modo){
    const porN = new Map((det.dados.unidades || []).map(a => [String(a[0]), a]));
    const fonte = formato === 'pers' ? ns.map(n => persDe(pid, n)).find(Boolean) : null, pelaTabela = [];
    const out = ns.map(n => {
      const a = porN.get(String(n)); if(!a) return {n};
      if(formato === 'pers'){
        const pz = persAtual(det, a, persDe(pid, n)) || (fonte ? persDerivado(det, a, fonte) : null);
        if(pz) return {n, valores: valoresPers(pz)};
        pelaTabela.push(n);
      }
      return {n, valores: valoresTabela(det, a, modo)};
    });
    return {itens: out, pelaTabela};
  }

  // ---------- na folha da unidade ----------
  function persResumoHtml(p, det, a){
    if(a[6] !== 'disponivel') return '';
    const n = String(a[0]), pz = persAtual(det, a, persDe(p.id, n));
    if(!pz) return '<div class="pers-cta"><p><b>Fluxo personalizado</b><span>Monte a condição do cliente (ato, mensais, financiamento). Ela vai junto quando você tocar em Mandar.</span></p>' +
      '<button type="button" class="btn btn-peq" data-fe="abrir">' + ICO.lapis + 'Montar fluxo</button></div>';
    const tot = totalDe(pz.linhas), tb = linhasDaTabela(det, a), d = tb.total > 0 ? Math.round((tot - tb.total) * 100) / 100 : 0;
    const dif = tb.total > 0 && Math.abs(d) >= 1 ? fmtV(Math.abs(d)) + (d < 0 ? ' abaixo' : ' acima') + ' da tabela (' + (d < 0 ? '−' : '+') + pctTxt(Math.round(Math.abs(d) / tb.total * 1000) / 10) + ')' : tb.total > 0 ? 'No valor da tabela' : '';
    const inf = infoFin(pz.linhas, tot);
    return '<section class="pers-box" aria-labelledby="pers-t"><div class="pers-cab"><h3 id="pers-t">Fluxo personalizado</h3><span class="pers-acoes">' +
      '<button type="button" class="link-mais" data-fe="copiar">' + ICO.copiar + 'Copiar</button><button type="button" class="link-mais" data-fe="abrir">' + ICO.lapis + 'Editar</button></span></div>' +
      '<div class="pers-ls">' + linhasDe(pz.linhas).map(l => '<div class="ln"><span>' + esc(l.t) + (l.s ? '<small>' + esc(l.s) + '</small>' : '') + '</span><b class="num">' + esc(l.v) + '</b></div>').join('') +
      '<div class="ln tot"><span>Valor total' + (dif ? '<small' + (d > 0 ? ' class="acima"' : '') + '>' + esc(dif) + '</small>' : '') + '</span><b class="num">' + esc(fmtV(tot)) + '</b></div></div>' +
      (inf ? '<p class="nota">Financiamento de ' + esc(fmtV(inf.v)) + ', ' + esc(pctTxt(inf.pct)) + ' do valor.</p>' : '') +
      '<div class="pers-info"><span>Montado ' + esc(quandoMontado(Date.parse(pz.em) || Date.now())) + ' neste aparelho. É este fluxo que vai no Mandar.</span><button type="button" class="link-mais" data-fe="descartar">Descartar</button></div></section>';
  }
  const MODELOS = [
    {rot: 'Ato', q: 1, nome: 'Ato', quando: 'no fechamento'},
    {rot: 'Mensais', q: 12, nome: 'mensais', quando: () => 'a partir de ' + proxMes()},
    {rot: 'Anuais', q: 2, nome: 'anuais', quando: ''},
    {rot: 'Parcela única', q: 1, nome: 'Parcela única', quando: ''},
    {rot: 'Financiamento', q: 1, nome: 'Financiamento bancário', quando: 'na entrega das chaves'},
    {rot: 'Outra', q: 1, nome: 'Parcela', quando: ''}
  ];
  function feRecalc(){
    const e = S.fe; if(!e || !e.auto || !e.linhas.length) return null;
    const alvo = numBR(e.alvo) || e.ref; if(!(alvo > 0)) return null;
    return fecharConta(e.linhas, alvo);
  }
  function feEditorHtml(){
    const e = S.fe, fc = feRecalc(), ls = e.linhas, cheio = ls.length >= MAX_LINHAS;
    e.fechaIdx = fc ? fc.i : -1;
    const lf = ls[linhaFechamento(ls)] || {}, onde = ehFin(lf) ? 'no financiamento' : 'em “' + tituloLinha(lf) + '”';
    return '<section class="pers-box editor" aria-labelledby="fe-t"><div class="pers-cab"><h3 id="fe-t">Montar fluxo personalizado</h3><span class="pers-acoes"><button type="button" class="link-mais" data-fe="restaurar">Voltar ao da tabela</button></span></div>' +
      '<p class="fe-dica">' + esc(fc ? 'Digite o que o cliente paga (ato, mensais, anuais). A linha destacada fecha a conta sozinha' + (e.ref ? ', no valor da tabela ou no total negociado.' : ', no total negociado.')
        : 'Mude a quantidade, o valor e a data de cada parcela, inclua ou tire linhas. O total soma sozinho e o cliente recebe exatamente este fluxo.') + '</p>' +
      '<div class="fe">' + ls.map((l, i) => {
        const fecha = fc && i === fc.i;
        return '<div class="fe-ln' + (fecha ? ' fecha' : '') + '" data-i="' + i + '">' +
          '<label class="fe-q"><span>Qtd.</span><input type="number" inputmode="numeric" min="1" max="480" step="1" value="' + (+l.q || 1) + '" data-fe-in="q"></label>' +
          '<label class="fe-n"><span>Parcela</span><input maxlength="40" autocomplete="off" value="' + esc(l.nome) + '" data-fe-in="nome"></label>' +
          '<button type="button" class="fe-x" data-fe="tirar" data-i="' + i + '" aria-label="Tirar a linha ' + esc(tituloLinha(l)) + '"' + (ls.length < 2 ? ' disabled' : '') + '>' + ICO.x + '</button>' +
          '<div class="fe-vs"><label class="fe-v"><span>' + (fecha ? 'Fecha a conta' : 'Valor de cada') + '</span><input inputmode="decimal" autocomplete="off" value="' + esc(numTxt(+l.valor || 0)) + '" data-fe-in="valor"' + (fecha ? ' readonly tabindex="-1" aria-label="Valor calculado para fechar a conta"' : '') + '></label>' +
          '<label class="fe-s"><span>Quando</span><input maxlength="60" autocomplete="off" value="' + esc(l.quando || '') + '" placeholder="ex.: a partir de ' + esc(proxMes()) + '" data-fe-in="quando"></label></div>' +
          '<small class="fe-sub"></small></div>';
      }).join('') + '</div>' +
      '<div class="fe-add"><span>' + (cheio ? 'Máximo de ' + MAX_LINHAS + ' linhas' : 'Incluir') + '</span>' + MODELOS.map((m, i) => '<button type="button" class="pilula peq" data-fe="add" data-i="' + i + '"' + (cheio ? ' disabled' : '') + '>+ ' + esc(m.rot) + '</button>').join('') + '</div>' +
      '<label class="fe-auto"><input type="checkbox" data-fe-in="auto"' + (e.auto ? ' checked' : '') + '><span>Fechar a conta sozinho ' + esc(onde) + '</span></label>' +
      '<div class="fe-tot"><span>Total do fluxo</span><b class="num" id="fe-total">—</b><small id="fe-dif"></small><small id="fe-fin"></small></div>' +
      '<div class="fe-neg"><label class="campo"><span>' + (e.auto ? 'Total negociado (opcional)' : 'Fechar o total em') + '</span><input inputmode="decimal" autocomplete="off" value="' + esc(e.alvo || '') + '" placeholder="' + esc(e.auto && e.ref ? 'em branco: o valor da tabela' : 'ex.: 295.000') + '" data-fe-in="alvo"></label>' +
      (e.auto ? '' : '<button type="button" class="btn btn-peq" data-fe="ajustar">Ajustar ' + esc(onde) + '</button>') + '</div>' +
      '<p class="erro-txt" id="fe-erro" role="alert">' + esc(e.erro || '') + '</p>' +
      '<div class="fe-bts"><button type="button" class="btn" data-fe="cancelar">Cancelar</button><button type="button" class="btn btn-pri" data-fe="salvar">' + ICO.ok + 'Salvar fluxo</button></div></section>';
  }
  function feTotais(){
    const e = S.fe, box = $('#fe-box'); if(!e || !box) return;
    const fc = feRecalc(), tot = totalDe(e.linhas);
    const el = $('#fe-total', box); if(el) el.textContent = fmtV(tot);
    if(fc){ const inp = $('.fe-ln[data-i="' + fc.i + '"] [data-fe-in="valor"]', box); if(inp && document.activeElement !== inp) inp.value = numTxt(+e.linhas[fc.i].valor || 0); }
    const dif = $('#fe-dif', box), neg = fc && numBR(e.alvo);
    if(dif){
      if(e.ref){
        const d = Math.round((tot - e.ref) * 100) / 100, pc = pctTxt(Math.round(Math.abs(d) / e.ref * 1000) / 10);
        dif.textContent = Math.abs(d) < 1 ? (fc ? 'Fecha no valor da tabela' : 'Igual ao valor da tabela') : fmtV(Math.abs(d)) + (d < 0 ? ' abaixo' : ' acima') + ' da tabela (' + (d < 0 ? '−' : '+') + pc + ')' + (neg ? ', total negociado' : '');
        dif.className = Math.abs(d) < 1 ? 'ok' : d < 0 ? 'abaixo' : 'acima';
      }else{ dif.textContent = ''; dif.className = ''; }
    }
    const fin = $('#fe-fin', box), inf = infoFin(e.linhas, tot);
    if(fin){
      if(fc && fc.resto <= 0){ fin.textContent = passaTxt(fc, e.linhas); fin.className = 'erro'; }
      else if(inf){ const acima = e.limite != null && inf.pct > e.limite + 0.05; fin.textContent = 'Financiamento de ' + fmtV(inf.v) + ', ' + pctTxt(inf.pct) + ' do valor' + (acima ? '. Acima dos ' + pctTxt(e.limite) + ' da tabela: confirme com o banco e a construtora.' : '.'); fin.className = acima ? 'alerta' : ''; }
      else{ fin.textContent = ''; fin.className = ''; }
    }
    $$('.fe-ln', box).forEach(r => { const l = e.linhas[+r.dataset.i], s = r.querySelector('.fe-sub'); if(!l || !s) return; const q = +l.q || 1; s.textContent = q > 1 && l.valor ? q + ' × ' + fmtV(+l.valor) + ' = ' + fmtV(q * l.valor) : ''; });
  }
  function feValidar(){
    const e = S.fe, ls = e.linhas;
    if(!ls.length) return 'Inclua pelo menos uma parcela.';
    const fc = feRecalc(); if(fc && fc.resto <= 0) return passaTxt(fc, ls);
    for(const l of ls){
      if(!String(l.nome || '').trim()) return 'Dê um nome a cada parcela (ex.: Ato, mensais, Financiamento).';
      if(!(+l.q >= 1 && +l.q <= 480 && Number.isInteger(+l.q))) return 'A quantidade de "' + tituloLinha(l) + '" precisa ser um número inteiro de 1 a 480.';
      if(!(+l.valor > 0)) return 'Falta o valor de "' + tituloLinha(l) + '".';
    }
    return '';
  }
  const feErro = m => { if(S.fe) S.fe.erro = m; const b = $('#fe-erro'); if(b) b.textContent = m; };
  function feSalvar(silencioso){
    const e = S.fe; if(!e) return true;
    const er = feValidar(); if(er){ feErro(er); const b = $('#fe-erro'); if(b) b.scrollIntoView({block: 'center', behavior: menosMov() ? 'auto' : 'smooth'}); return false; }
    const pz = {linhas: e.linhas.map(l => ({q: +l.q || 1, nome: String(l.nome).trim(), valor: Math.round((+l.valor) * 100) / 100, quando: String(l.quando || '').trim()})),
      em: new Date().toISOString(), auto: !!e.auto, alvo: e.auto ? (numBR(e.alvo) || null) : null};
    if(!persGravar(e.pid, e.n, pz)){ feErro('Não consegui guardar neste aparelho. Confira se o navegador não está em modo privado.'); return false; }
    S.fe = null;
    if(!silencioso){ feRedesenhar(); toast('Fluxo salvo. Toque em Mandar para enviar ao cliente com ele.', 4200); }
    return true;
  }
  function feUnidade(){   // projeto, espelho e unidade da folha aberta
    const d = $('#folha-un'); if(!d || !d.isConnected) return null;
    const pid = d.dataset.pid, n = d.dataset.n, ch = S.det.get(pid), det = ch && ch.v, p = S.byId.get(pid);
    const a = det && (det.dados.unidades || []).find(x => String(x[0]) === String(n));
    return a && p ? {d, pid, n: String(n), det, p, a} : null;
  }
  function feAbrir(){
    const u = feUnidade(); if(!u) return;
    const tb = linhasDaTabela(u.det, u.a), pz = persAtual(u.det, u.a, persDe(u.pid, u.n)), lim = tb.fluxo ? infoFin(tb.ls, tb.total) : null;
    let alvo = '';
    if(pz && pz.alvo) alvo = numTxt(pz.alvo);
    else if(pz && pz.auto === undefined && tb.total && Math.abs(totalDe(pz.linhas) - tb.total) >= 1) alvo = numTxt(totalDe(pz.linhas));
    S.fe = {pid: u.pid, n: u.n, linhas: (pz ? pz.linhas : tb.ls).slice(0, MAX_LINHAS).map(l => Object.assign({}, l)), ref: tb.total > 0 ? tb.total : null,
      alvo, auto: pz ? pz.auto !== false : true, limite: lim ? lim.pct : null, fechaIdx: -1, erro: ''};
    feRedesenhar(true);
  }
  const feAberto = (pid, n) => !!(S.fe && S.fe.pid === pid && S.fe.n === String(n));
  function persSecaoHtml(p, det, a){
    return '<div id="un-pers" class="un-pers">' + (feAberto(p.id, a[0]) ? '<div id="fe-box">' + feEditorHtml() + '</div>' : persResumoHtml(p, det, a)) + '</div>';
  }
  function feRedesenhar(rolar, foco){
    const u = feUnidade(); if(!u) return;
    const box = $('#un-pers', u.d); if(!box) return;
    const corpo = $('.folha-corpo', u.d), y = corpo.scrollTop;
    box.outerHTML = persSecaoHtml(u.p, u.det, u.a);
    if(S.fe) feTotais();
    corpo.scrollTop = y;
    if(foco){ const i = $(foco, u.d); if(i) i.focus({preventScroll: false}); }
    if(rolar) requestAnimationFrame(() => { const b = $('#un-pers', u.d); if(b) b.scrollIntoView({block: 'start', behavior: menosMov() ? 'auto' : 'smooth'}); });
  }
  // "Mandar" com o editor aberto: salva antes (se faltar algo, mostra o erro e não manda)
  function feAntesDeMandar(pid, n){ return !feAberto(pid, n) || feSalvar(true); }
  function textoPers(p, det, a, pz){
    const ls = linhasDe(pz.linhas), tot = totalDe(pz.linhas);
    return p.nome + ', unidade ' + a[0] + '\n' + maiusc1([andarTxt(a[4]), tipologiaU(det, a), areaU(a) ? fmtM2(areaU(a)) : ''].filter(Boolean).join(', ')) + '\n\nCondição personalizada:\n' +
      ls.map(l => '• ' + l.t + ': ' + l.v + (l.s ? ' (' + l.s + ')' : '')).join('\n') + (ls.length > 1 ? '\nValor total: ' + fmtV(tot) : '');
  }

  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-fe]'); if(!b) return;
    const u = feUnidade(); if(!u) return;
    const acao = b.dataset.fe;
    if(acao === 'abrir') return feAbrir();
    if(acao === 'copiar'){ const pz = persAtual(u.det, u.a, persDe(u.pid, u.n)); if(pz) copiar(textoPers(u.p, u.det, u.a, pz), 'Fluxo copiado. Cole na conversa com o cliente.'); return; }
    if(acao === 'descartar'){   // dois toques, sem janela do navegador
      if(b.dataset.certo !== '1'){ b.dataset.certo = '1'; b.textContent = 'Toque de novo para descartar'; setTimeout(() => { if(b.isConnected){ b.dataset.certo = ''; b.textContent = 'Descartar'; } }, 4000); return; }
      persGravar(u.pid, u.n, null); feRedesenhar(); toast('Fluxo personalizado descartado.'); return;
    }
    const e = S.fe; if(!e || !feAberto(u.pid, u.n)) return;
    if(acao === 'add'){
      if(e.linhas.length >= MAX_LINHAS) return;
      const m = MODELOS[+b.dataset.i]; if(!m) return;
      const nova = {q: m.q, nome: m.nome, valor: 0, quando: typeof m.quando === 'function' ? m.quando() : m.quando};
      const fin = e.linhas.findIndex(l => /financ|chaves|saldo|repasse/i.test(l.nome)), ehF = /financ/i.test(m.nome);
      // o ato no começo, o financiamento no fim (ele fecha a conta), o resto antes do financiamento ou no fim
      let pos = ehF ? e.linhas.length : /^ato$/i.test(m.nome) ? 0 : fin >= 0 ? fin : e.linhas.length;
      // a linha nova é para digitar: se ali ela virasse a que fecha a conta (fluxo sem financiamento, ex.: entrada + mensais), entra antes da atual
      if(!ehF){
        const atual = e.linhas[linhaFechamento(e.linhas)];
        const fica = k => { const t = e.linhas.slice(); t.splice(k, 0, nova); return t[linhaFechamento(t)] === atual; };
        if(!fica(pos)){ const k = e.linhas.indexOf(atual); if(k >= 0 && fica(k)) pos = k; }
      }
      e.linhas.splice(pos, 0, nova);
      feRedesenhar(false, '.fe-ln[data-i="' + pos + '"] [data-fe-in="valor"]:not([readonly])');
      return;
    }
    if(acao === 'tirar'){ if(e.linhas.length > 1){ e.linhas.splice(+b.dataset.i, 1); feRedesenhar(); } return; }
    if(acao === 'restaurar'){ e.linhas = linhasDaTabela(u.det, u.a).ls.slice(0, MAX_LINHAS); e.alvo = ''; e.erro = ''; feRedesenhar(); return; }
    if(acao === 'ajustar'){
      const alvo = numBR(e.alvo);
      if(!alvo || alvo <= 0){ feErro('Digite o total que quer fechar (ex.: 295.000).'); return; }
      const i = linhaFechamento(e.linhas), l = e.linhas[i], q = +l.q || 1, resto = Math.round((alvo - (totalDe(e.linhas) - q * (+l.valor || 0))) * 100) / 100;
      if(resto <= 0){ feErro(passaTxt({i, resto, alvo}, e.linhas)); return; }
      l.valor = Math.round(resto / q * 100) / 100; e.erro = ''; feRedesenhar();
      if(Math.abs(totalDe(e.linhas) - alvo) >= 0.01) toast('Arredondei os centavos: o total ficou ' + fmtV(totalDe(e.linhas)) + '.');
      return;
    }
    if(acao === 'cancelar'){ S.fe = null; feRedesenhar(); return; }
    if(acao === 'salvar') feSalvar();
  });
  document.addEventListener('input', ev => {
    const t = ev.target, k = t && t.dataset && t.dataset.feIn; if(!k || !S.fe || k === 'auto') return;
    const e = S.fe;
    if(k === 'alvo'){ e.alvo = t.value; feTotais(); return; }
    const r = t.closest('.fe-ln'), l = r && e.linhas[+r.dataset.i]; if(!l) return;
    if(k === 'q'){ const q = parseInt(t.value, 10); l.q = isFinite(q) && q > 0 ? Math.min(q, 480) : 1; }
    else if(k === 'nome') l.nome = t.value;
    else if(k === 'valor') l.valor = numBR(t.value) || 0;
    else if(k === 'quando') l.quando = t.value;
    if(e.erro){ e.erro = ''; const er = $('#fe-erro'); if(er) er.textContent = ''; }
    feTotais();
  });
  document.addEventListener('change', ev => {
    const t = ev.target, k = t && t.dataset && t.dataset.feIn; if(!k || !S.fe) return;
    if(k === 'auto'){ S.fe.auto = t.checked; feRedesenhar(); return; }
    // o nome define qual linha fecha a conta (ex.: "Financiamento"): redesenha se ela mudou
    if(k === 'nome' && S.fe.auto && linhaFechamento(S.fe.linhas) !== S.fe.fechaIdx) feRedesenhar();
  });
  document.addEventListener('focusout', ev => {   // ao sair do valor, mostra o número formatado (1502,4 vira 1.502,40)
    const t = ev.target; if(!t || !t.dataset || t.dataset.feIn !== 'valor' || !S.fe) return;
    const r = t.closest('.fe-ln'), l = r && S.fe.linhas[+r.dataset.i]; if(l && t.value.trim()) t.value = numTxt(+l.valor || 0);
  });

  // ================= PERFIL =================
  function telaPerfil(){
    const pf = perfil(), tema = LS.get(K.tema) || 'escuro';
    return '<header class="pg-cab"><div><h1 class="t-1">Perfil e ajustes</h1><p class="sub">Tudo aqui fica só neste aparelho.</p></div></header>' +
      '<div class="perfil-grade"><form id="f-perfil" class="caixa form-perfil" autocomplete="on">' +
      '<h2 class="t-3">Sua assinatura</h2><p class="texto-2">Seu nome e WhatsApp vão no link que o cliente abre, no rodapé dos posts e nos PDFs.</p>' +
      '<label class="campo">Seu nome<input id="pf-nome" name="name" autocomplete="name" maxlength="40" value="' + esc(pf.nome || '') + '"></label>' +
      '<label class="campo">Seu WhatsApp<input id="pf-tel" name="tel" autocomplete="tel" inputmode="tel" maxlength="20" placeholder="(11) 90000-0000" value="' + esc(pf.tel || '') + '"></label>' +
      '<label class="campo">CRECI<input id="pf-creci" maxlength="20" placeholder="Opcional" value="' + esc(pf.creci || '') + '"><small>Aparece embaixo do telefone nos posts e nos PDFs.</small></label>' +
      '<button class="btn btn-pri btn-alto" type="submit">Salvar</button></form>' +
      '<div class="perfil-lado"><section class="caixa"><h2 class="t-3">Tema</h2><div class="seg" role="group" aria-label="Tema">' + [['escuro', 'Escuro'], ['claro', 'Claro'], ['sistema', 'Automático']].map(t => '<button type="button" data-acao="tema" data-v="' + t[0] + '" aria-pressed="' + (tema === t[0]) + '">' + t[1] + '</button>').join('') + '</div></section>' +
      '<section class="caixa"><h2 class="t-3">Código do time</h2><p class="texto-2">O app usa o mesmo código do app dos Espelhos. Se o código mudar, entre de novo.</p>' +
      '<div class="btn-linha"><button type="button" class="btn" data-acao="sair">Trocar o código</button><a class="btn" href="' + esc(ESP) + '" target="_blank" rel="noopener">App dos Espelhos</a></div></section>' +
      '<p class="nota">Versão ' + esc(VERSAO) + '. Dados lidos às ' + esc(hora(S.geradoEm)) + '.</p></div></div>';
  }
  function aplicarTema(t){
    const claro = t === 'claro' || (t === 'sistema' && matchMedia('(prefers-color-scheme: light)').matches);
    if(claro) document.documentElement.setAttribute('data-tema', 'claro'); else document.documentElement.removeAttribute('data-tema');
    const m = $('meta[name="theme-color"]'); if(m) m.setAttribute('content', claro ? '#F6F3EC' : '#0E0C09');
  }

  // ================= FOTOS: buscar, converter, salvar e compartilhar =================
  const HOST_CORS = ['lh3.googleusercontent.com', 'www.revendasoneinnovation.com.br'];
  const semCors = new Set(SS.get('corretor-sem-cors') || []);
  const hostDe = u => { try{ return new URL(u, location.href).hostname; }catch(e){ return ''; } };
  const mesmaOrigem = u => { try{ return new URL(u, location.href).origin === location.origin; }catch(e){ return false; } };
  const podeDireto = u => mesmaOrigem(u) || (HOST_CORS.includes(hostDe(u)) && !semCors.has(hostDe(u)));
  function marcarSemCors(u){ const h = hostDe(u); if(h && !mesmaOrigem(u)){ semCors.add(h); SS.set('corretor-sem-cors', [...semCors]); } }
  const urlBaixar = src => temTamanhos(src) ? tamImg(src, 2048) : src;
  async function buscarFoto(u){   // direto quando o site libera; senão pelo servidor de fotos do app (precisa do código do time)
    if(podeDireto(u)){
      try{ const r = await fetch(u, {mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer'}); if(r.ok){ const b = await r.blob(); if(b.size && /^image\//.test(b.type)) return b; } }
      catch(e){ marcarSemCors(u); }
      if(mesmaOrigem(u)) throw new Error('foto_local');
    }
    const r = await fetch(FN_FOTO, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({c: S.cod, u}), cache: 'no-store'});
    if(!r.ok){ let cod = ''; try{ cod = (await r.json()).erro || ''; }catch(e){} const er = new Error('foto ' + r.status + ' ' + cod); er.status = r.status; er.codigo = cod; throw er; }
    const b = await r.blob();
    if(!b.size) throw new Error('foto_vazia');
    return b;
  }
  async function paraJpeg(b){   // webp e avif viram jpg, que abre em qualquer celular e no WhatsApp
    if(!/^image\/(webp|avif)$/i.test(b.type || '')) return b;
    try{
      let fonte, w, h, url = null;
      if(typeof createImageBitmap === 'function'){ fonte = await createImageBitmap(b); w = fonte.width; h = fonte.height; }
      else{ url = URL.createObjectURL(b); fonte = await carregarImg(url, false); if(!fonte) return b; w = fonte.naturalWidth; h = fonte.naturalHeight; }
      const k = Math.min(1, Math.sqrt(16e6 / (w * h)));
      const cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(fonte, 0, 0, cv.width, cv.height);
      if(fonte.close) fonte.close(); if(url) URL.revokeObjectURL(url);
      const out = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
      return out || b;
    }catch(e){ return b; }
  }
  const extDe = t => ({'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif'}[String(t || '').toLowerCase()] || '.jpg');
  function salvarBlob(b, nome){
    const u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = nome; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 60000);
  }
  let podeArq = null;
  function podeCompartilharArquivos(){
    if(podeArq != null) return podeArq;
    try{ podeArq = !!(navigator.share && navigator.canShare && navigator.canShare({files: [new File([new Uint8Array([255, 216, 255])], 'a.jpg', {type: 'image/jpeg'})]})); }catch(e){ podeArq = false; }
    return podeArq;
  }
  async function compartilhar(files, texto){   // chamar direto do toque, antes de qualquer espera
    try{ await navigator.share(Object.assign({files}, texto ? {text: texto} : {})); return true; }
    catch(e){ if(e && e.name === 'AbortError') return false; toast('Não deu para abrir o compartilhamento. Use Salvar.', 4500); return false; }
  }

  // ================= ZIP (sem compressão: foto já vem comprimida) e planilha Excel =================
  const CRC_T = (() => { const t = new Uint32Array(256); for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8){ let c = 0xFFFFFFFF; for(let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipar(arqs, tipo){   // arqs: [{nome, dados: Uint8Array}]
    const enc = new TextEncoder(), partes = [], central = [];
    let off = 0;
    const d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    for(const a of arqs){
      const nome = enc.encode(a.nome), dados = a.dados, crc = crc32(dados);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, tm, true); lh.setUint16(12, dt, true); lh.setUint32(14, crc, true); lh.setUint32(18, dados.length, true); lh.setUint32(22, dados.length, true);
      lh.setUint16(26, nome.length, true); lh.setUint16(28, 0, true);
      partes.push(lh.buffer, nome, dados);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, tm, true); ch.setUint16(14, dt, true); ch.setUint32(16, crc, true); ch.setUint32(20, dados.length, true); ch.setUint32(24, dados.length, true);
      ch.setUint16(28, nome.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, off, true);
      central.push(ch.buffer, nome);
      off += 30 + nome.length + dados.length;
    }
    const tamC = central.reduce((s, b) => s + b.byteLength, 0);
    const fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(4, 0, true); fim.setUint16(6, 0, true); fim.setUint16(8, arqs.length, true); fim.setUint16(10, arqs.length, true);
    fim.setUint32(12, tamC, true); fim.setUint32(16, off, true); fim.setUint16(20, 0, true);
    return new Blob(partes.concat(central, [fim.buffer]), {type: tipo || 'application/zip'});
  }
  function xlsxBlob(aba, linhas, larguras, congelar){   // células: texto, número ou {v, s}; s: 1 negrito, 2 R$, 3 área, 4 título
    const colL = i => { let s = ''; i++; while(i > 0){ const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
    const x = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    let sd = '';
    linhas.forEach((lin, r) => {
      sd += '<row r="' + (r + 1) + '">';
      (lin || []).forEach((c, k) => {
        if(c == null || c === '') return;
        const o = typeof c === 'object' ? c : {v: c}, ref = colL(k) + (r + 1), s = o.s ? ' s="' + o.s + '"' : '';
        if(typeof o.v === 'number' && isFinite(o.v)) sd += '<c r="' + ref + '"' + s + '><v>' + o.v + '</v></c>';
        else sd += '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + x(o.v) + '</t></is></c>';
      });
      sd += '</row>';
    });
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const NS = 'http://schemas.openxmlformats.org/';
    const folha = X + '<worksheet xmlns="' + NS + 'spreadsheetml/2006/main" xmlns:r="' + NS + 'officeDocument/2006/relationships">' +
      (congelar ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + congelar + '" topLeftCell="A' + (congelar + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : '') +
      '<cols>' + larguras.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>' +
      '<sheetData>' + sd + '</sheetData></worksheet>';
    const estilos = X + '<styleSheet xmlns="' + NS + 'spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0"/></numFmts>' +
      '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    const arqs = [
      ['[Content_Types].xml', X + '<Types xmlns="' + NS + 'package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', X + '<Relationships xmlns="' + NS + 'package/2006/relationships"><Relationship Id="rId1" Type="' + NS + 'officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', X + '<workbook xmlns="' + NS + 'spreadsheetml/2006/main" xmlns:r="' + NS + 'officeDocument/2006/relationships"><sheets><sheet name="' + x(aba).slice(0, 31) + '" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', X + '<Relationships xmlns="' + NS + 'package/2006/relationships"><Relationship Id="rId1" Type="' + NS + 'officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="' + NS + 'officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', estilos],
      ['xl/worksheets/sheet1.xml', folha]
    ];
    const enc = new TextEncoder();
    return zipar(arqs.map(([nome, txt]) => ({nome, dados: enc.encode(txt)})), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  // ================= BAIXAR E ENVIAR =================
  ICO.planta = svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h7v9M10 3v5M14 12h7M14 12v4"/>');
  const MAX_ZIP = 30;
  async function abrirBaixar(id){
    const p = S.byId.get(id); if(!p) return;
    abrirFolha('baixar', 'Baixar e enviar', '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:64px"></div><div class="brilho" style="height:64px"></div><div class="brilho" style="height:64px"></div></div>', '');
    const dlg = $('#folha-baixar');
    let det, c;
    try{ [det, c] = await Promise.all([detalhe(id), fichaCentral(id)]); }
    catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais. Digite o código novo do time.'); if(dlg && dlg.isConnected) corpoFolha('<p class="erro-txt" role="alert">Não consegui abrir o projeto agora. Confira a internet e tente de novo.</p>', '', dlg); return; }
    if(!dlg || !dlg.isConnected) return;
    corpoFolha(menuBaixarHtml(p, det, c), '', dlg);
  }
  function menuBaixarHtml(p, det, c){
    const fotos = fotosDoProjeto(det, c), plantas = plantasDoProjeto(det, c), bk = bookDe(det, c);
    const livres = (det.dados.unidades || []).filter(a => a[6] === 'disponivel').length;
    const sel = S.ui.tabSel.get(p.id);
    const nU = sel && sel.size ? plural(sel.size, 'unidade marcada', 'unidades marcadas') : plural(livres, 'unidade livre', 'unidades livres');
    const op = (acao, ico, t, s) => '<button type="button" class="opcao" data-acao="' + acao + '" data-id="' + esc(p.id) + '"><span class="opcao-ico" aria-hidden="true">' + ico + '</span><span class="opcao-t"><b>' + esc(t) + '</b><small>' + esc(s) + '</small></span>' + ICO.seta + '</button>';
    return '<div class="env-proj">' + miniProj(p) + '<p><b>' + esc(p.nome) + '</b><span>Fotos na melhor qualidade que a construtora publica. Os PDFs saem com o seu contato no rodapé.</span></p></div>' +
      '<div class="opcoes">' + (bk ? '<a class="opcao" href="' + esc(bk.u) + '" target="_blank" rel="noopener"' + (bk.mesmo ? ' download' : '') + '><span class="opcao-ico" aria-hidden="true">' + ICO.livro + '</span><span class="opcao-t"><b>' + esc(bk.arq ? 'Book do empreendimento (PDF)' : 'Pasta do book no Drive') + '</b><small>' + esc(bk.arq ? [/^book do empreendimento$/i.test(bk.t || '') ? '' : bk.t, bk.s].filter(Boolean).join(', ') : 'Abre a pasta com o book da construtora') + '</small></span>' + ICO.seta + '</a>' : '') +
      (fotos.length ? op('baixar-fotos', ICO.fotos, 'Fotos em alta (.zip)', plural(Math.min(MAX_ZIP, fotos.length), 'foto', 'fotos') + ' num arquivo só') : '') +
      (fotos.length && ehToque() && podeCompartilharArquivos() ? op('enviar-fotos', ICO.zap, 'Mandar fotos pelo WhatsApp', 'As ' + Math.min(10, fotos.length) + ' primeiras, direto no aplicativo') : '') +
      (plantas.length ? op('baixar-plantas', ICO.planta, 'Plantas (.zip)', plural(plantas.length, 'planta', 'plantas')) : '') +
      op('pdf-ficha', ICO.arquivo, 'Ficha do projeto em PDF', 'Fotos, tipologias, preços, lazer e plantas') +
      op('planilha-tabela', ICO.planilha, 'Tabela em planilha (Excel)', nU + ', com preços e fluxo') +
      op('pdf-tabela', ICO.imprimir, 'Tabela em PDF', nU + ', para imprimir ou mandar') +
      '</div>' + (!fotos.length ? '<p class="nota">Este projeto ainda não tem fotos publicadas.</p>' : '') +
      '<p class="nota">Os PDFs abrem a janela de impressão do aparelho. Escolha "Salvar como PDF".</p>';
  }
  async function prepararArquivos(id, tipo){   // tipo: fotos, plantas ou enviar (10 fotos para o WhatsApp)
    const p = S.byId.get(id); if(!p) return;
    let dlg = $('#folha-baixar');
    if(!dlg){ abrirFolha('baixar', 'Baixar e enviar', '', ''); dlg = $('#folha-baixar'); }
    const nomeT = tipo === 'plantas' ? 'plantas' : 'fotos';
    corpoFolha('<div class="esqueleto" aria-busy="true"><p class="sub">Abrindo as ' + nomeT + '…</p></div>', '', dlg);
    let det, c;
    try{ [det, c] = await Promise.all([detalhe(id), fichaCentral(id)]); }
    catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais. Digite o código novo do time.'); corpoFolha('<p class="erro-txt" role="alert">Não consegui abrir o projeto agora. Confira a internet.</p>', '', dlg); return; }
    const lista = (tipo === 'plantas' ? plantasDoProjeto(det, c).map(x => ({src: x.src, t: x.t})) : fotosDoProjeto(det, c)).slice(0, tipo === 'enviar' ? 10 : MAX_ZIP);
    const voltar = '<button type="button" class="btn" data-acao="menu-baixar" data-id="' + esc(id) + '">Voltar</button>';
    if(!lista.length){ corpoFolha('<p class="texto-2">Este projeto ainda não tem ' + nomeT + ' publicadas.</p>', voltar, dlg); return; }
    const job = {cancelado: false, dlg}; S.baixa = job;
    corpoFolha('<div class="progresso" role="status"><p><b class="num" id="bx-n">0</b> de ' + lista.length + ' ' + nomeT + ' prontas</p><div class="barra-prog"><i id="bx-barra"></i></div><p class="nota">Baixando na melhor qualidade disponível. Pode levar alguns segundos.</p></div>',
      '<button type="button" class="btn" data-acao="cancelar-baixa">Cancelar</button>', dlg);
    const out = new Array(lista.length); let feitos = 0, prox = 0, codRuim = false;
    const base = slug(p.nome) + (tipo === 'plantas' ? '-planta-' : '-foto-');
    const vai = async () => {
      while(prox < lista.length && !job.cancelado){
        const k = prox++;
        try{ const b = await paraJpeg(await buscarFoto(urlBaixar(lista[k].src))); out[k] = {b, nome: base + String(k + 1).padStart(2, '0') + extDe(b.type), i: k}; }
        catch(e){ if(e && e.codigo === 'codigo'){ codRuim = true; job.cancelado = true; } }
        feitos++;
        const n = $('#bx-n'), br = $('#bx-barra'); if(n) n.textContent = feitos; if(br) br.style.width = Math.round(feitos / lista.length * 100) + '%';
      }
    };
    await Promise.all([vai(), vai(), vai()]);
    if(codRuim){ S.baixa = null; sair('Esse código não vale mais. Digite o código novo do time.'); return; }
    if(job.cancelado || !dlg.isConnected) return;
    S.baixa = null;
    const ok = out.filter(Boolean);
    if(!ok.length){ corpoFolha('<p class="erro-txt" role="alert">Não consegui baixar as ' + nomeT + ' agora. Confira a internet e tente de novo.</p>', voltar, dlg); return; }
    const files = ok.map(x => new File([x.b], x.nome, {type: x.b.type || 'image/jpeg'}));
    const falhou = lista.length - ok.length;
    const miniaturas = '<div class="prontas">' + ok.slice(0, 12).map(x => { const f = lista[x.i]; return '<span class="redonda">' + imgTag(f.th || f.src, '', '', {w: 160, semSet: true}) + '</span>'; }).join('') + (ok.length > 12 ? '<span class="redonda mais num">+' + (ok.length - 12) + '</span>' : '') + '</div>';
    const nota = falhou ? ' ' + plural(falhou, 'não abriu no site da construtora', 'não abriram no site da construtora') + '.' : '';
    if(tipo === 'enviar'){
      S.pronto = {files, texto: ''};
      corpoFolha('<div class="aviso ok" role="status">' + ICO.ok + '<p>' + esc(plural(ok.length, 'foto pronta', 'fotos prontas')) + ' para mandar.' + esc(nota) + '</p></div>' + miniaturas,
        '<button type="button" class="btn btn-pri btn-alto" data-acao="share-pronto">' + ICO.zap + 'Mandar agora</button>', dlg);
      return;
    }
    const zip = zipar(await Promise.all(ok.map(async x => ({nome: x.nome, dados: new Uint8Array(await x.b.arrayBuffer())}))));
    const nomeZip = slug(p.nome) + '-' + nomeT + '.zip', mb = zip.size / 1048576;
    S.pronto = {zip, nomeZip, files: files.slice(0, 10)};
    if(!dlg.isConnected) return;
    corpoFolha('<div class="aviso ok" role="status">' + ICO.ok + '<p>' + esc(plural(ok.length, nomeT.slice(0, -1), nomeT)) + ' em ' + esc(nomeZip) + ', ' + esc(mb.toLocaleString('pt-BR', {maximumFractionDigits: 1})) + ' MB.' + esc(nota) + (ehToque() ? '' : ' O arquivo foi para a pasta de downloads.') + '</p></div>' + miniaturas,
      (ehToque() && podeCompartilharArquivos() ? '<button type="button" class="btn" data-acao="share-pronto">' + ICO.compartilhar + (files.length > 10 ? 'Enviar 10' : 'Enviar') + '</button>' : '') +
      '<button type="button" class="btn btn-pri" data-acao="salvar-pronto">' + ICO.baixar + (ehToque() ? 'Salvar o .zip' : 'Salvar de novo') + '</button>', dlg);
    if(!ehToque()) salvarBlob(zip, nomeZip);
  }
  // foto aberta no visor: deixa o arquivo pronto para o "Enviar" funcionar no primeiro toque
  let tLuz = null;
  function aoMudarLuz(ja){
    clearTimeout(tLuz);
    if(!S.luz || !podeCompartilharArquivos() || !ehToque()) return;
    tLuz = setTimeout(async () => {
      const L = S.luz; if(!L) return;
      const i = L.i, f = L.lista[i]; if(!f || (L.arq && L.arq.i === i)) return;
      try{ const b = await paraJpeg(await buscarFoto(urlBaixar(f.src))); if(S.luz === L) L.arq = {i, file: new File([b], nomeFotoLuz(L, i, b.type), {type: b.type || 'image/jpeg'})}; }catch(e){}
    }, ja ? 0 : 450);
  }
  const nomeFotoLuz = (L, i, tipo) => slug(L.nome || 'fortal') + '-' + String(i + 1).padStart(2, '0') + extDe(tipo);
  async function baixarFotoLuz(){
    const L = S.luz; if(!L) return;
    const i = L.i, f = L.lista[i]; if(!f) return;
    if(L.arq && L.arq.i === i){ salvarBlob(L.arq.file, L.arq.file.name); toast('Foto salva.'); return; }
    toast('Baixando a foto em alta…', 9000);
    try{ const b = await paraJpeg(await buscarFoto(urlBaixar(f.src))); salvarBlob(b, nomeFotoLuz(L, i, b.type)); toast('Foto salva.'); }
    catch(e){ if(e && e.codigo === 'codigo') return sair('Esse código não vale mais. Digite o código novo do time.'); toast('Não consegui baixar essa foto agora.', 4000); }
  }
  function enviarFotoLuz(){
    const L = S.luz; if(!L) return;
    if(L.arq && L.arq.i === L.i){ compartilhar([L.arq.file], ''); return; }
    toast('Preparando a foto. Toque em Enviar de novo em instantes.', 4000);
    aoMudarLuz(true);
  }

  // ================= PDF (impressão) e planilha =================
  const dataHora = s => { const t = Date.parse(s); return isFinite(t) ? fDMA.format(t) + ' às ' + hora(t) : ''; };
  function fluxoTxt(det, a){
    const fx = fluxoDe(det, a); if(!fx || !fx.linhas.length) return '';
    return fx.linhas.map(l => (l.rot || ROT_FLUXO[l.t] || l.t || 'Parcela') + ': ' + (l.n > 1 ? l.n + 'x ' : '') + BRL(l.v) + (l.d ? (l.n > 1 ? ' a partir de ' : ' em ') + mesAnoCurto(l.d) : '')).join('; ');
  }
  function imgImp(src, w, cls){
    if(!src) return '';
    const ext = /^https?:/i.test(src) && !src.startsWith(location.origin);
    return '<img src="' + esc(tamImg(src, w)) + '" alt="" class="' + (cls || '') + '" decoding="sync"' + (ext ? ' referrerpolicy="no-referrer"' : '') + '>';
  }
  function rodapeImp(det, c){
    const pf = perfil(), d = det.dados, info = det.info || {};
    const quem = [pf.nome || 'Fortal Inteligência Imobiliária', pf.tel, pf.creci ? 'CRECI ' + pf.creci : ''].filter(Boolean);
    return '<footer class="imp-rod"><div class="imp-cor"><img src="img/logo-fortal.png" alt="" class="imp-logo-p"><p><b>' + esc(quem[0]) + '</b>' + quem.slice(1).map(x => '<span>' + esc(x) + '</span>').join('') + '</p></div>' +
      '<p class="imp-legal">' + esc('Valores e disponibilidade do espelho de ' + (dataHora(d.atualizado_em) || fDMA.format(Date.now())) + ', sujeitos a alteração sem aviso. Imagens ilustrativas.' + (c && c.legal ? ' ' + c.legal : '') + (info.capa_fonte ? ' Fotos: ' + info.capa_fonte + '.' : '')) + '</p></footer>';
  }
  function htmlFicha(p, det, c){
    const d = det.dados, info = det.info || {}, chave = chaveBase(det), pc = precosCampos(det);
    const fotos = fotosDoProjeto(det, c), plantas = plantasDoProjeto(det, c).slice(0, 4);
    const ref = unidadeRef(det, chave), pRef = ref ? precoU(ref, chave) : null;
    const pvRef = ref && chave !== 'pv' && pc.some(x => x.k === 'pv') ? precoU(ref, 'pv') : null;
    const tipos = porTipologia(det, chave);
    const areas = (d.unidades || []).filter(a => a[6] === 'disponivel').map(areaU).filter(v => v > 0);
    const met = areas.length ? (Math.round(Math.min(...areas)) === Math.round(Math.max(...areas)) ? fmtM2(Math.round(Math.min(...areas))) : Math.round(Math.min(...areas)) + ' a ' + fmtM2(Math.round(Math.max(...areas)))) : '';
    const fase = FASE[info.fase] || d.fase || '';
    const ent = info.fase === 'pronto' ? 'Pronto para morar' : (mesAno(info.entrega) ? maiusc1(mesAno(info.entrega)) : (d.fase || 'A definir'));
    let h = '<article class="imp imp-ficha"><header class="imp-cab"><img src="img/logo-fortal.png" alt="Fortal" class="imp-logo"><div class="imp-cab-t">' +
      '<p class="imp-k">' + esc([fase && fase + (quemDe(p) ? ' da ' + quemDe(p) : ''), noBairro(p.bairro || info.bairro)].filter(Boolean).join(' ')) + '</p>' +
      '<h1>' + esc(p.nome) + '</h1>' + (info.endereco || d.endereco ? '<p>' + esc([info.endereco || d.endereco, p.cidade && p.cidade !== 'São Paulo' ? p.cidade : ''].filter(Boolean).join(', ')) + '</p>' : '') + '</div></header>';
    if(fotos.length) h += '<div class="imp-fotos n' + Math.min(3, fotos.length) + '">' + fotos.slice(0, 3).map((f, i) => imgImp(f.src, i ? 900 : 1600)).join('') + '</div>';
    h += '<section class="imp-fatos">' +
      (pRef ? '<div class="imp-preco"><small>' + (chave === 'pv' ? 'À vista a partir de' : 'A partir de') + '</small><b>' + esc(BRL(pRef)) + '</b>' + (pvRef ? '<span>ou ' + esc(BRL(pvRef)) + ' à vista</span>' : '') + '</div>' : '') +
      (tipos.length ? '<div><small>Tipologias</small><b>' + esc(tiposTxt(p.tipos) || tipos.map(t => t.t).slice(0, 3).join(', ')) + '</b></div>' : '') +
      (met ? '<div><small>Metragem</small><b>' + esc(met) + '</b></div>' : '') +
      '<div><small>Entrega</small><b>' + esc(ent) + '</b></div>' +
      (info.vagas && ['todas', 'algumas', 'nenhuma'].includes(info.vagas.r) ? '<div><small>Vaga</small><b>' + esc({todas: 'Todas com vaga', algumas: 'Algumas unidades', nenhuma: 'Sem vaga'}[info.vagas.r]) + '</b></div>' : '') + '</section>';
    const sobre = c && c.intro ? c.intro : (c && c.chamada) || info.destaque || '';
    if(sobre) h += '<section class="imp-sec"><h2>Sobre o projeto</h2><p>' + esc(sobre) + '</p></section>';
    if(tipos.length) h += '<section class="imp-sec"><h2>Unidades disponíveis</h2><table class="imp-t"><thead><tr><th>Tipologia</th><th class="dir">Disponíveis</th><th>Metragem</th><th class="dir">A partir de</th></tr></thead><tbody>' +
      tipos.slice(0, 14).map(t => '<tr><td><b>' + esc(t.t) + '</b></td><td class="dir">' + t.n + '</td><td>' + esc(t.amin ? (Math.round(t.amin) === Math.round(t.amax) ? fmtM2(Math.round(t.amin)) : Math.round(t.amin) + ' a ' + fmtM2(Math.round(t.amax))) : '') + '</td><td class="dir"><b>' + (t.pmin ? esc(BRL(t.pmin)) : 'sob consulta') + '</b></td></tr>').join('') + '</tbody></table></section>';
    const fx = ref ? fluxoDe(det, ref) : null;
    const corr = (info.fluxo && info.fluxo.correcao) || (d.tabela && d.tabela.correcao) || '';
    if(fx && fx.linhas.length){
      h += '<section class="imp-sec"><h2>Como pagar</h2><p class="imp-sub">' + esc('Exemplo na unidade ' + ref[0] + (pRef ? ' de ' + BRL(pRef) : '') + ', a mais em conta disponível hoje.') + '</p>' +
        '<table class="imp-t"><thead><tr><th>Etapa</th><th>Parcelas</th><th class="dir">Valor</th><th class="dir">% do total</th></tr></thead><tbody>' +
        fx.linhas.map(l => '<tr><td>' + esc(l.rot || ROT_FLUXO[l.t] || l.t || 'Parcela') + '</td><td>' + esc((l.n > 1 ? l.n + 'x' : '1x') + (l.d ? (l.n > 1 ? ' a partir de ' : ' em ') + mesAnoCurto(l.d) : '')) + '</td><td class="dir">' + esc(BRL(l.v)) + '</td><td class="dir">' + esc(pctTxt(pct(l.v * l.n, fx.total))) + '</td></tr>').join('') + '</tbody></table>' +
        (corr ? '<p class="imp-sub">' + esc(corr) + '</p>' : '') + '</section>';
    }
    const lazer = c && Array.isArray(c.lazer) && c.lazer.length ? c.lazer.map(l => (l.onde ? l.onde + ': ' : '') + (l.itens || []).join(', ')) : (Array.isArray(info.lazer) && info.lazer.length ? [info.lazer.filter(Boolean).join(', ')] : []);
    if(lazer.length) h += '<section class="imp-sec"><h2>Lazer</h2>' + lazer.map(t => '<p>' + esc(t) + '</p>').join('') + '</section>';
    if(c && Array.isArray(c.diferenciais) && c.diferenciais.length) h += '<section class="imp-sec"><h2>Diferenciais</h2><ul>' + c.diferenciais.slice(0, 12).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></section>';
    if(c && Array.isArray(c.perto) && c.perto.length) h += '<section class="imp-sec"><h2>Perto daqui</h2><ul class="imp-2col">' + c.perto.slice(0, 10).map(x => { const t = x.pe != null ? x.pe + ' min a pé' : x.bike != null ? x.bike + ' min de bike' : x.carro != null ? x.carro + ' min de carro' : x.min != null ? x.min + ' min' : ''; return '<li>' + esc(x.nome) + (t ? ', ' + esc(t) : '') + '</li>'; }).join('') + '</ul></section>';
    if(plantas.length) h += '<section class="imp-sec imp-plantas"><h2>Plantas</h2><div class="imp-pl n' + Math.min(plantas.length, 4) + '">' + plantas.map(pl => '<figure>' + imgImp(pl.src, 900) + '<figcaption>' + esc(pl.t) + (pl.sub ? ', ' + esc(pl.sub) : '') + '</figcaption></figure>').join('') + '</div></section>';
    const fatos = c && Array.isArray(c.fatos) ? c.fatos.filter(x => Array.isArray(x) && x[0]) : (info.ficha_tecnica && typeof info.ficha_tecnica === 'object' ? Object.entries(info.ficha_tecnica).map(([k, v]) => [maiusc1(k.replace(/_/g, ' ')), typeof v === 'string' ? v : JSON.stringify(v)]) : []);
    if(fatos.length) h += '<section class="imp-sec"><h2>Ficha técnica</h2><dl class="imp-dl">' + fatos.slice(0, 16).map(f => '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>').join('') + '</dl></section>';
    return h + rodapeImp(det, c) + '</article>';
  }
  function unidadesExport(p, det){   // as marcadas; senão o que está na tela da tabela; senão as livres
    const modo = modoTabela(p, det), sel = S.ui.tabSel.get(p.id);
    let us, rotulo;
    if(sel && sel.size){ us = (det.dados.unidades || []).filter(a => sel.has(String(a[0]))).sort((x, y) => (precoU(x, modo) || 1e12) - (precoU(y, modo) || 1e12)); rotulo = plural(us.length, 'unidade marcada', 'unidades marcadas'); }
    else if(location.hash === '#/tabelas/' + p.id){
      const f = espFiltro(p.id), resumo = efResumo(f);
      if(vistaTab(det) === 'espelho'){   // o que está aceso no espelho (em "Total", as livres)
        const U = espUnidades(det, S.centralV.get(p.id) || null), rec = recentesDe(det), st = f.st === 'todos' ? 'disponivel' : f.st;
        us = U.filter(u => espBate(u, f, modo) && u.st === st && (!f.mov || rec.has(u.n))).map(u => u.a).sort((x, y) => (precoU(x, modo) || 1e12) - (precoU(y, modo) || 1e12));
        const R = {disponivel: ['unidade livre', 'unidades livres'], reservada: ['unidade reservada', 'unidades reservadas'], processo_final: ['unidade em processo', 'unidades em processo'], vendida: ['unidade vendida', 'unidades vendidas']}[st] || ['unidade', 'unidades'];
        rotulo = plural(us.length, R[0], R[1]) + (f.mov ? ' que mexeram hoje e ontem' : '') + (resumo ? ', ' + resumo : '');
      }else{
        us = unidadesTabela(p, det, modo).us;
        const fil = S.ui.tabFiltro;
        rotulo = (fil === 'livres' ? plural(us.length, 'unidade livre', 'unidades livres') : plural(us.length, 'unidade', 'unidades') + (fil === 'mov' ? ' que mexeram hoje e ontem' : '')) + (resumo ? ', ' + resumo : '');
      }
    }else{
      us = (det.dados.unidades || []).filter(a => a[6] === 'disponivel').sort((x, y) => (precoU(x, modo) || 1e12) - (precoU(y, modo) || 1e12));
      rotulo = plural(us.length, 'unidade livre', 'unidades livres');
    }
    return {us, modo, rotulo};
  }
  function condicoesDe(det){
    const d = det.dados, tab = d.tabela || {}, info = det.info || {};
    return [tab.regra_curta, tab.regra_avista, (info.fluxo && info.fluxo.correcao) || tab.correcao, info.fluxo && info.fluxo.obs].concat(Array.isArray(tab.condicoes) ? tab.condicoes : []).filter(Boolean).map(String).filter((t, i, a) => a.indexOf(t) === i);
  }
  function htmlTabela(p, det, us, modo, rotulo){
    const d = det.dados, pc = precosCampos(det).slice(0, 3), tab = d.tabela || {};
    const todasLivres = us.every(a => a[6] === 'disponivel'), comFluxo = us.length <= 24;
    const nCols = 6 + (todasLivres ? 0 : 1) + pc.length;
    let h = '<article class="imp imp-tabela"><header class="imp-cab"><img src="img/logo-fortal.png" alt="Fortal" class="imp-logo"><div class="imp-cab-t"><p class="imp-k">Tabela de unidades</p><h1>' + esc(p.nome) + '</h1>' +
      '<p>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ') + '. ' + maiusc1(rotulo) + '. Espelho de ' + (dataHora(d.atualizado_em) || 'hoje') + (tab.nome ? '. ' + nomeTabela(tab.nome) : '') + '.') + '</p></div></header>' +
      '<table class="imp-t imp-t-u"><thead><tr><th>Unidade</th><th>Andar</th><th>Tipologia</th><th class="dir">Área</th><th>Faixa</th>' + (todasLivres ? '' : '<th>Status</th>') + pc.map(x => '<th class="dir">' + esc(x.label) + '</th>').join('') + '<th class="dir">R$/m²</th></tr></thead><tbody>';
    for(const a of us){
      const ar = areaU(a), v = precoU(a, modo), fx = comFluxo ? fluxoTxt(det, a) : '';
      h += '<tr' + (fx ? ' class="com-fluxo"' : '') + '><td><b>' + esc(a[0]) + '</b></td><td>' + esc(andarTxt(a[4])) + '</td><td>' + esc(tipologiaU(det, a) || '') + '</td><td class="dir">' + esc(ar ? fmtM2(ar) : '') + '</td><td>' + esc(a[3] || '') + '</td>' +
        (todasLivres ? '' : '<td>' + esc(stLabel(det, a[6])) + '</td>') + pc.map(x => { const pv = precoU(a, x.k); return '<td class="dir">' + (pv ? '<b>' + esc(BRL(pv)) + '</b>' : '') + '</td>'; }).join('') +
        '<td class="dir">' + (v && ar ? esc(BRL(v / ar)) : '') + '</td></tr>' + (fx ? '<tr class="fluxo-l"><td colspan="' + nCols + '">' + esc(fx) + '</td></tr>' : '');
    }
    h += '</tbody></table>';
    const cond = condicoesDe(det);
    if(cond.length) h += '<section class="imp-sec"><h2>Condições</h2><ul>' + cond.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></section>';
    return h + rodapeImp(det, null) + '</article>';
  }
  async function imprimir(html, titulo){
    const box = $('#impressao'); if(!box) return;
    box.innerHTML = html;
    const antes = document.title; document.title = titulo;
    const imgs = $$('img', box);
    await Promise.race([Promise.all(imgs.map(im => im.complete ? 1 : new Promise(r => { im.addEventListener('load', r, {once: true}); im.addEventListener('error', r, {once: true}); }))), new Promise(r => setTimeout(r, 9000))]);
    try{ await document.fonts.ready; }catch(e){}
    const fim = () => { document.title = antes; window.removeEventListener('afterprint', fim); };
    window.addEventListener('afterprint', fim);
    setTimeout(fim, 60000);
    window.print();
  }
  async function detalheOuAviso(id){
    try{ const [det, c] = await Promise.all([detalhe(id), fichaCentral(id)]); return {det, c}; }
    catch(e){ if(codigoInvalido(e)){ sair('Esse código não vale mais. Digite o código novo do time.'); return null; } toast('Não consegui abrir o projeto agora. Confira a internet.', 4000); return null; }
  }
  async function imprimirFicha(id){
    const p = S.byId.get(id); if(!p) return;
    fecharFolhas(); toast('Montando a ficha em PDF…', 6000);
    const r = await detalheOuAviso(id); if(!r) return;
    await imprimir(htmlFicha(p, r.det, r.c), 'Ficha ' + p.nome + ' - Fortal');
  }
  async function imprimirTabela(id){
    const p = S.byId.get(id); if(!p) return;
    fecharFolhas();
    const r = await detalheOuAviso(id); if(!r) return;
    const {us, modo, rotulo} = unidadesExport(p, r.det);
    if(!us.length){ toast('Nenhuma unidade para a tabela com esse filtro.'); return; }
    toast('Montando a tabela em PDF: ' + rotulo + '.', 5000);
    await imprimir(htmlTabela(p, r.det, us, modo, rotulo), 'Tabela ' + p.nome + ' - Fortal');
  }
  async function baixarPlanilha(id){
    const p = S.byId.get(id); if(!p) return;
    fecharFolhas();
    const r = await detalheOuAviso(id); if(!r) return;
    const det = r.det, d = det.dados, tab = d.tabela || {};
    const {us, modo, rotulo} = unidadesExport(p, det);
    if(!us.length){ toast('Nenhuma unidade para a planilha com esse filtro.'); return; }
    const pc = precosCampos(det).slice(0, 3), todasLivres = us.every(a => a[6] === 'disponivel');
    const cab = ['Unidade', 'Andar', 'Tipologia', 'Área (m²)', 'Faixa'].concat(todasLivres ? [] : ['Status'], pc.map(x => x.label), ['R$/m²', 'Vaga', 'Fluxo de pagamento']);
    const linhas = [
      [{v: 'Tabela do ' + p.nome, s: 4}],
      [[quemDe(p), p.bairro].filter(Boolean).join(', ') + '. ' + maiusc1(rotulo) + '. Espelho de ' + (dataHora(d.atualizado_em) || 'hoje') + (tab.nome ? '. ' + nomeTabela(tab.nome) : '') + '.'],
      [],
      cab.map(t => ({v: t, s: 1}))
    ];
    for(const a of us){
      const ar = areaU(a), v = precoU(a, modo), vg = vagaDe(det, a);
      linhas.push([String(a[0]), andarTxt(a[4]), tipologiaU(det, a) || '', ar ? {v: +ar, s: 3} : '', a[3] || ''].concat(
        todasLivres ? [] : [stLabel(det, a[6])],
        pc.map(x => { const pv = precoU(a, x.k); return pv ? {v: pv, s: 2} : ''; }),
        [v && ar ? {v: Math.round(v / ar), s: 2} : '', vg == null ? '' : vg ? vg + (vg > 1 ? ' vagas' : ' vaga') : 'Sem vaga', fluxoTxt(det, a)]));
    }
    linhas.push([]);
    condicoesDe(det).forEach(t => linhas.push([t]));
    linhas.push(['Valores sujeitos a alteração sem aviso. Gerado no App do Corretor da Fortal em ' + fDMA.format(Date.now()) + ' às ' + hora(Date.now()) + '.']);
    const larg = [10, 12, 24, 11, 10].concat(todasLivres ? [] : [14], pc.map(() => 15), [12, 11, 80]);
    salvarBlob(xlsxBlob('Unidades', linhas, larg, 4), 'tabela-' + slug(p.nome) + '.xlsx');
    toast('Planilha salva com ' + rotulo + '.', 4000);
  }

  // ================= folhas e avisos =================
  function abrirFolha(id, titulo, corpo, pe, cls){
    fecharFolhas();
    const d = document.createElement('dialog'); d.className = 'folha' + (cls ? ' ' + cls : ''); d.id = 'folha-' + id; d.setAttribute('aria-labelledby', 'folha-t-' + id);
    d.innerHTML = '<div class="folha-cab"><h2 id="folha-t-' + id + '">' + esc(titulo) + '</h2><button type="button" class="ico-btn" data-acao="fechar-folha" aria-label="Fechar">' + ICO.fechar + '</button></div>' +
      '<div class="folha-corpo">' + corpo + '</div><div class="folha-pe"' + (pe ? '' : ' hidden') + '>' + (pe || '') + '</div>';
    $('#folhas').appendChild(d);
    d.addEventListener('close', () => { d.remove(); if(id === 'filtros') atualizarImoveis(); if(S.baixa && S.baixa.dlg === d){ S.baixa.cancelado = true; S.baixa = null; } });
    d.addEventListener('click', ev => { if(ev.target === d) d.close(); });
    if(typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }
  function corpoFolha(corpo, pe, alvo){
    const d = alvo || $('#folhas dialog'); if(!d || !d.isConnected) return;
    d.querySelector('.folha-corpo').innerHTML = corpo;
    const f = d.querySelector('.folha-pe');
    if(pe != null){ f.innerHTML = pe; f.hidden = !pe; }
    d.querySelector('.folha-corpo').scrollTop = 0;
  }
  function fecharFolhas(){ $$('#folhas dialog').forEach(d => { try{ d.close(); }catch(e){} d.remove(); }); }
  let toastT = null;
  function toast(m, ms){
    const t = $('#toast'); if(!t) return;
    t.textContent = m; t.hidden = false;
    if(t.showPopover){ try{ if(t.matches(':popover-open')) t.hidePopover(); t.showPopover(); }catch(e){} }
    clearTimeout(toastT);
    toastT = setTimeout(() => { if(t.hidePopover){ try{ t.hidePopover(); }catch(e){} } t.hidden = true; }, ms || 3200);
  }
  async function copiar(txt, ok){
    try{ await navigator.clipboard.writeText(txt); toast(ok || 'Copiado.'); return; }catch(e){}
    try{
      const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      (document.querySelector('dialog[open]') || document.body).appendChild(ta); ta.select(); const k = document.execCommand('copy'); ta.remove();
      if(k){ toast(ok || 'Copiado.'); return; }
    }catch(e){}
    toast('Não deu para copiar. Toque e segure no texto para copiar.', 5000);
  }

  // ================= eventos =================
  const nomeDaRota = () => { const m = /^#\/(p|tabelas|posts)\/([a-z0-9-]+)/.exec(location.hash), p = m && S.byId.get(m[2]); return p ? p.nome : ''; };
  const CAMPO_F = {'f-pmin': 'pmin', 'f-pmax': 'pmax', 'f-amin': 'amin', 'f-amax': 'amax', 'f-m2': 'm2'};
  function lerValor(s, campo){   // aceita 450, 450 mil, 1,5 mi, 450.000
    s = String(s || '').toLowerCase().replace(/r\$|\s/g, '');
    if(!s) return 0;
    let mult = 1;
    if(/mil$/.test(s)){ mult = 1e3; s = s.replace(/mil$/, ''); }
    else if(/(mi|milh[aãoõ]+(es)?|m)$/.test(s)){ mult = 1e6; s = s.replace(/(mi|milh[aãoõ]+(es)?|m)$/, ''); }
    let n = /,\d{1,2}$/.test(s) ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s.replace(/[.,]/g, ''));
    if(!isFinite(n) || n < 0) return 0;
    n *= mult;
    if(mult === 1){
      if(campo === 'f-pmin' || campo === 'f-pmax'){ if(n > 0 && n < 20) n *= 1e6; else if(n >= 20 && n < 10000) n *= 1e3; }
      if(campo === 'f-m2' && n > 0 && n < 100) n *= 1e3;
    }
    return Math.round(n);
  }
  const tog = (arr, x) => arr.includes(x) ? arr.filter(y => y !== x) : arr.concat([x]);
  document.addEventListener('click', async ev => {
    const el = ev.target.closest('[data-acao]'); if(!el) return;
    const a = el.dataset.acao, v = el.dataset.v, id = el.dataset.id;
    const f = S.f;
    switch(a){
      case 'focar-busca': S.focarBusca = true; break;
      case 'abrir-filtros':
        if(location.hash !== '#/imoveis'){ S.abrirFiltros = true; }
        else{ ev.preventDefault(); if(largo()){ const pn = $('#painel-f'); if(pn) pn.scrollIntoView({block: 'start', behavior: menosMov() ? 'auto' : 'smooth'}); } else abrirFiltros(); }
        break;
      case 'ver-fase': Object.assign(S.f, F0(), {fases: v.split(','), ver: 'projetos'}); S.scroll['#/imoveis'] = 0; salvarF(); break;
      case 'ver-cons': Object.assign(S.f, F0(), {cons: [v], ver: 'projetos'}); S.scroll['#/imoveis'] = 0; salvarF(); break;
      case 'rank': S.ui.rank = v; render(); break;
      case 'feed': S.ui.feed = v; S.ui.feedMostra = 14; render(); break;
      case 'mais-feed': S.ui.feedMostra += 20; render(); break;
      case 'recarregar': render(); break;
      case 'tentar': el.disabled = true; el.textContent = 'Tentando…'; carregar('inicio'); break;
      case 'voltar': if(history.length > 1 && S.veioDeDentro){ ev.preventDefault(); history.back(); } break;
      case 'fechar-folha': { const d = el.closest('dialog'); if(d) d.close(); break; }
      // ---- filtro
      case 'f-ver': f.ver = v; salvarF(); atualizarImoveis(); break;
      case 'limpar-q': f.q = ''; { const i = $('#q'); if(i){ i.value = ''; i.focus(); } } el.hidden = true; mudouFiltro(); break;
      case 'tirar': tirarFiltro(v); if(v === 'q'){ const i = $('#q'); if(i) i.value = ''; const l = $('.busca .limpar'); if(l) l.hidden = true; } mudouFiltro(); break;
      case 'limpar-tudo': Object.assign(S.f, F0(), {ver: f.ver, ordem: f.ordem === 'perto' ? 'vendidos' : f.ordem}); S.ui.bairroQ = ''; { const i = $('#q'); if(i) i.value = ''; } mudouFiltro(); break;
      case 'mais-res': f.mostra += 12; atualizarImoveis(); break;
      case 'mais-unid': S.ui.unidMostra = (S.ui.unidMostra || 40) + 60; atualizarImoveis(); break;
      case 'f': { const g = el.dataset.g; if(Array.isArray(f[g])){ f[g] = tog(f[g], v); mudouFiltro(); } break; }
      case 'f-modo': f.modo = v; mudouFiltro(); break;
      case 'f-pmax': { const x = +v; if(f.pmax === x && !f.pmin) f.pmax = 0; else { f.pmax = x; f.pmin = 0; } mudouFiltro(); break; }
      case 'f-area': { const [x, y] = v.split('-').map(Number); if(f.amin === x && f.amax === y){ f.amin = 0; f.amax = 0; } else { f.amin = x; f.amax = y; } mudouFiltro(); break; }
      case 'f-m2': f.m2 = f.m2 === +v ? 0 : +v; mudouFiltro(); break;
      case 'f-andar': f.andar = +v; mudouFiltro(); break;
      case 'f-vaga': f.vaga = +v; mudouFiltro(); break;
      case 'f-ent': f.ent = v; mudouFiltro(); break;
      case 'f-mov': f.mov = v; mudouFiltro(); break;
      case 'f-livres': f.livres = v === '1'; mudouFiltro(); break;
      case 'f-raio': if(f.perto){ f.perto.raio = +v; mudouFiltro(); } break;
      case 'f-perto': pedirLocal(); break;
      case 'f-perto-off': f.perto = null; if(f.ordem === 'perto') f.ordem = 'vendidos'; mudouFiltro(); break;
      case 'sel-u': {
        const k = el.dataset.p + '|' + el.dataset.n;
        if(S.sel.has(k)) S.sel.delete(k);
        else{
          if(S.sel.size >= 40){ toast('Até 40 unidades por link.'); break; }
          const projs = new Set([...S.sel.values()].map(x => x.p)); projs.add(el.dataset.p);
          if(projs.size > 15){ toast('Até 15 projetos por link.'); break; }
          S.sel.set(k, {p: el.dataset.p, n: el.dataset.n});
        }
        const on = S.sel.has(k); el.setAttribute('aria-pressed', on); const row = el.closest('.tu-lin'); if(row) row.classList.toggle('marcada', on);
        const bs = $('#barra-sel'), novo = barraSelHtml();
        if(bs){ if(novo) bs.outerHTML = novo; else bs.remove(); } else if(novo){ const r = $('#imv-res'); if(r) r.insertAdjacentHTML('beforeend', novo); }
        break;
      }
      case 'sel-limpar': S.sel.clear(); atualizarImoveis(); break;
      case 'enviar-sel': abrirEnvioMulti(); break;
      // ---- tabela
      case 'tab-tipo': S.ui.tabTipoPedido = v || ''; S.ui.tabFiltro = 'livres'; break;
      case 'tab-modo': S.ui.tabModo[id] = v; render(); break;
      case 'tab-fil': S.ui.tabFiltro = v; S.ui.tabMostra = 150; render(); break;
      case 'tab-tipo-f': S.ui.tabTipo = v || ''; S.ui.tabMostra = 150; render(); break;
      case 'tab-mais': S.ui.tabMostra = (S.ui.tabMostra || 150) + 200; atualizarTabela(); break;
      case 'tab-ck': {
        const s = S.ui.tabSel.get(id) || new Set(), n = el.dataset.n;
        if(s.has(n)) s.delete(n); else { if(s.size >= 40){ toast('Até 40 unidades por link.'); break; } s.add(n); }
        S.ui.tabSel.set(id, s); atualizarTabela(); break;
      }
      case 'tab-limpar': S.ui.tabSel.delete(id); atualizarTabela(); break;
      case 'tab-abrir': { const k = id + ':' + el.dataset.n; S.ui.tabAberta = S.ui.tabAberta === k ? null : k; atualizarTabela(); break; }
      // ---- espelho do prédio
      case 'tab-vista': S.ui.tabVista = v; LS.set('corretor-tab-vista', v); render(); break;
      case 'ef': { const ef = S.ui.ef; if(!ef) break; const k = el.dataset.k; const nv = v === '' || v == null ? null : (k === 'pmax' ? +v : v); ef[k] = String(ef[k]) === String(nv) ? null : nv; S.ui.tabMostra = 150; atualizarTabela(); break; }
      case 'ef-st': { const ef = S.ui.ef; if(!ef) break; ef.st = ef.st === v ? 'todos' : v; atualizarTabela(); break; }
      case 'ef-mov': if(S.ui.ef){ S.ui.ef.mov = !S.ui.ef.mov; atualizarTabela(); } break;
      case 'ef-final': if(S.ui.ef){ S.ui.ef.final = S.ui.ef.final === v ? null : v; atualizarTabela(); } break;
      case 'ef-limpar': if(S.ui.ef){ S.ui.ef = Object.assign(EF0(), {pid: S.ui.ef.pid}); S.ui.tabQ = ''; const i = $('[data-input="tab-q"]'); if(i) i.value = ''; atualizarTabela(); } break;
      case 'ef-mais': S.ui.efMais = !S.ui.efMais; atualizarTabela(); break;
      case 'esp-denso': S.ui.espDenso = !S.ui.espDenso; LS.set('corretor-esp-denso', S.ui.espDenso ? '1' : ''); atualizarTabela(); break;
      case 'esp-preco': S.ui.espPreco = S.ui.espPreco === false; atualizarTabela(); break;
      case 'esp-u': abrirUnidadeEsp(S.ui.tabProj, el.dataset.n); break;
      case 'un-marcar': {
        const s = S.ui.tabSel.get(id) || new Set();
        if(!s.has(el.dataset.n) && s.size >= 40){ toast('Até 40 unidades por link.'); break; }
        marcarUnidade(id, el.dataset.n); break;
      }
      case 'un-mandar': {
        if(!feAntesDeMandar(id, el.dataset.n)){ toast('Confira o fluxo antes de mandar.'); break; }
        const s = S.ui.tabSel.get(id) || new Set(); s.add(el.dataset.n); S.ui.tabSel.set(id, s); fecharFolhas(); atualizarTabela(); abrirEnvio(id, true); break;
      }
      case 'luz-un': abrirLuz(S.unLuz || [], +el.dataset.i || 0, nomeDaRota()); break;
      // ---- comparar
      case 'cp-tipo': if(S.cp){ S.cp.tipo = v; S.cp.fora = new Set(); if(v === 'escolha' && !S.cp.esc[0].pid && S.cp.pid) S.cp.esc[0] = {pid: S.cp.pid, n: S.cp.n}; render(); } break;
      case 'cp-motivo': if(S.cp){ S.cp.motivo = v; S.cp.fora = new Set(); render(); } break;
      case 'cp-modo': if(S.cp){ S.cp.modo = v; render(); } break;
      case 'cp-escolher': abrirEscolhaProjeto(el.dataset.slot); break;
      case 'cp-pick': {
        const cp = S.cp, sl = S.cpSlot; if(!cp) break;
        if(sl === 'ref'){ cp.pid = id; cp.n = null; cp.fora = new Set(); cp.inc = true; }
        else{ const i = +sl; if(cp.esc[i]){ cp.esc[i] = {pid: id, n: null}; cp.fora = new Set(); } }
        fecharFolhas(); render(); break;
      }
      case 'cp-incluir': if(S.cp){ if(el.dataset.orig === '1') S.cp.inc = !S.cp.inc; else { if(S.cp.fora.has(id)) S.cp.fora.delete(id); else S.cp.fora.add(id); } render(); } break;
      case 'cp-add': if(S.cp && S.cp.esc.length < 5){ S.cp.esc.push({pid: null, n: null}); render(); } break;
      case 'cp-tirar': if(S.cp && S.cp.esc.length > 2){ S.cp.esc.splice(+el.dataset.i, 1); render(); } break;
      case 'cp-mandar': abrirEnvioCmp(); break;
      case 'cp-espelho': S.ui.tabQ = el.dataset.n || ''; if(S.ui.tabProj !== id){ S.ui.tabProj = id; S.ui.tabFiltro = 'livres'; S.ui.tabMostra = 150; S.ui.tabAberta = null; S.ui.ef = null; S.ui.efMais = false; } break;
      case 'luz-cp': { const it = (S.cpItens || [])[+el.dataset.k]; if(it && it.pl) abrirLuz([{src: it.pl.src, t: it.m.p.nome + ', ' + it.pl.t}], 0, it.m.p.nome); break; }
      // ---- envio
      case 'enviar': ev.preventDefault(); abrirEnvio(id, el.dataset.sel === '1'); break;
      case 'env-modo': if(S.envio){ S.envio.modo = v; $$('[data-acao="env-modo"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); } break;
      case 'env-fmt': if(S.envio){ S.envio.formato = v; $$('[data-acao="env-fmt"]').forEach(b => b.setAttribute('aria-checked', b.dataset.v === v)); const md = $('#env-modo-f'); if(md) md.hidden = v === 'pers'; } break;
      case 'env-criar': criarEnvio(); break;
      case 'env-copiar': { const m = $('#env-msg'); copiar(m ? m.value : (S.envioPronto || {}).msg, 'Mensagem com o link copiada.'); break; }
      case 'env-wa': { const m = $('#env-msg'), t = $('#env-tel-cli'), n = t ? t.value.replace(/\D/g, '') : ''; if(m) el.href = 'https://wa.me/' + (n.length >= 10 ? (n.length <= 11 ? '55' + n : n) : '') + '?text=' + encodeURIComponent(m.value); break; }
      // ---- fotos do projeto
      case 'luz': abrirLuz(S.fotosAtuais, +el.dataset.i || 0, nomeDaRota()); break;
      case 'luz-planta': abrirLuz((S.plantasAtuais || []).map(pl => ({src: pl.src, t: pl.t + (pl.sub ? ', ' + pl.sub : '')})), +el.dataset.i || 0, nomeDaRota()); break;
      case 'luz-plantas-lazer': abrirLuz([{src: el.dataset.src, t: 'Planta do lazer'}], 0, nomeDaRota()); break;
      case 'luz-fechar': fecharLuz(); break;
      case 'luz-ant': irLuz(-1); break;
      case 'luz-prox': irLuz(1); break;
      case 'luz-baixar': baixarFotoLuz(); break;
      case 'luz-compartilhar': enviarFotoLuz(); break;
      // ---- baixar
      case 'menu-baixar': abrirBaixar(id); break;
      case 'baixar-fotos': prepararArquivos(id, 'fotos'); break;
      case 'enviar-fotos': prepararArquivos(id, 'enviar'); break;
      case 'baixar-plantas': prepararArquivos(id, 'plantas'); break;
      case 'pdf-ficha': imprimirFicha(id); break;
      case 'pdf-tabela': imprimirTabela(id); break;
      case 'planilha-tabela': baixarPlanilha(id); break;
      case 'share-pronto': if(S.pronto && S.pronto.files) compartilhar(S.pronto.files, S.pronto.texto || ''); break;
      case 'salvar-pronto': if(S.pronto && S.pronto.zip){ salvarBlob(S.pronto.zip, S.pronto.nomeZip); toast('Arquivo salvo.'); } break;
      case 'cancelar-baixa': { if(S.baixa){ S.baixa.cancelado = true; S.baixa = null; } const d = el.closest('dialog'); if(d) d.close(); break; }
      // ---- posts
      case 'post-fmt': if(S.post){ S.post.fmt = v; prepararPost(S.post.id); } break;
      case 'post-assunto': {
        if(!S.post || !S.post.det) break;
        S.post.assunto = v; const p = S.byId.get(S.post.id), t = textosPost(p, S.post.det, S.post.c, v);
        S.post.titulo = t.titulo; S.post.linha = t.linha; $('#post-titulo').value = t.titulo; $('#post-linha').value = t.linha;
        $$('[data-acao="post-assunto"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); desenharPost(); break;
      }
      case 'post-var': if(S.post){ S.post.var = v; $$('[data-acao="post-var"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); desenharPost(); } break;
      case 'post-foto': if(S.post){ S.post.foto = +el.dataset.i; S.post.local = null; $$('[data-acao="post-foto"]').forEach(b => b.setAttribute('aria-pressed', b === el)); desenharPost(); } break;
      case 'post-copiar': copiar($('#post-legenda').value, 'Legenda copiada.'); break;
      case 'post-baixar': if(S.post && S.post.blob){ salvarBlob(S.post.blob, nomeArquivoPost()); toast('Imagem salva.'); } else toast('A arte ainda está sendo montada. Tente de novo em um instante.'); break;
      case 'post-compartilhar': {
        if(!S.post || !S.post.blob){ toast('A arte ainda está sendo montada. Tente de novo em um instante.'); break; }
        const txt = $('#post-legenda').value;
        try{ if(navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {}); }catch(e){}
        compartilhar([new File([S.post.blob], nomeArquivoPost(), {type: 'image/jpeg'})], txt).then(ok => { if(ok) toast('A legenda também foi copiada. É só colar no post.', 4500); });
        break;
      }
      // ---- perfil
      case 'tema': LS.set(K.tema, v); aplicarTema(v); $$('[data-acao="tema"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); break;
      case 'sair': sair(''); break;
      default: if(ACOES_X[a]) await ACOES_X[a](el, ev);
    }
  });
  const espera = {};
  const depois = (k, ms, fn) => { clearTimeout(espera[k]); espera[k] = setTimeout(fn, ms); };
  document.addEventListener('input', ev => {
    const el = ev.target, k = el.dataset && el.dataset.input; if(!k) return;
    if(k === 'q'){ S.f.q = el.value; const l = el.parentElement.querySelector('.limpar'); if(l) l.hidden = !el.value; depois('q', 160, mudouFiltro); }
    else if(k === 'fnum'){ const c = el.dataset.campo; depois('fnum', 450, () => { if(CAMPO_F[c]){ S.f[CAMPO_F[c]] = lerValor(el.value, c); mudouFiltro(); } }); }
    else if(k === 'bairro-q'){ S.ui.bairroQ = el.value; depois('bq', 120, () => { const fc = facetas(S.f); $$('#f-bairros').forEach(b => { b.innerHTML = bairrosChips(fc); }); }); }
    else if(k === 'lista'){ S.ui.listaQ = el.value; depois('lista', 120, () => atualizarLista(el.dataset.modo)); }
    else if(k === 'tab-q'){ S.ui.tabQ = el.value; depois('tq', 160, () => { atualizarTabela(); espRolarAchada(); }); }
    else if(k === 'cp-pq'){ depois('cpq', 120, () => { const l = $('#cp-lista'); if(l) l.innerHTML = cpListaProjHtml(el.value); }); }
    else if(k === 'post-texto'){ if(S.post){ S.post.titulo = $('#post-titulo').value; S.post.linha = $('#post-linha').value; depois('post', 160, desenharPost); } }
    else if(k === 'post-legenda'){ if(S.post) S.post.legenda = el.value; }
    else if(INPUTS_X[k]) INPUTS_X[k](el, ev, 'input');
  });
  document.addEventListener('change', async ev => {
    const el = ev.target, k = el.dataset && el.dataset.input; if(!k) return;
    if(k === 'ordem'){ S.f.ordem = el.value; salvarF(); atualizarImoveis(); }
    else if(k === 'fnum'){ const c = el.dataset.campo, val = lerValor(el.value, c); if(CAMPO_F[c] && S.f[CAMPO_F[c]] !== val){ S.f[CAMPO_F[c]] = val; setTimeout(mudouFiltro, 0); } el.value = val ? val.toLocaleString('pt-BR') : ''; }
    else if(k === 'env-u'){ const n = $$('#env-us input:checked').length; if(n > 40){ el.checked = false; toast('Até 40 unidades por link.'); } }
    else if(k === 'cp-un'){ if(S.cp){ S.cp.n = el.value || null; S.cp.fora = new Set(); render(); } }
    else if(k === 'cp-raio'){ if(S.cp){ S.cp.raio = +el.value || 3; S.cp.fora = new Set(); render(); } }
    else if(k === 'cp-esc-un'){ if(S.cp){ const i = +el.dataset.i; if(S.cp.esc[i]){ S.cp.esc[i].n = el.value || null; render(); } } }
    else if(k === 'post-arquivo'){
      const arq = el.files && el.files[0]; if(!arq || !S.post) return;
      const im = await carregarImg(URL.createObjectURL(arq), false);
      if(im){ S.post.local = im; $$('[data-acao="post-foto"]').forEach(b => b.setAttribute('aria-pressed', 'false')); desenharPost().then(() => { const a = $('#post-aviso'); if(a && !a.textContent) a.textContent = 'Usando a foto do aparelho.'; }); }
      else toast('Não consegui abrir essa foto.');
    }
    else if(INPUTS_X[k]) INPUTS_X[k](el, ev, 'change');
  });
  document.addEventListener('submit', ev => {
    if(SUBMITS_X[ev.target.id]){ ev.preventDefault(); SUBMITS_X[ev.target.id](ev.target, ev); return; }
    if(ev.target.id === 'f-perfil'){
      ev.preventDefault();
      salvarPerfil({nome: $('#pf-nome').value.trim(), tel: $('#pf-tel').value.trim(), creci: $('#pf-creci').value.trim()});
      atualizarLateral(); toast('Perfil salvo.');
    }
  });
  document.addEventListener('keydown', ev => {
    if(S.luz && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')){ ev.preventDefault(); irLuz(ev.key === 'ArrowLeft' ? -1 : 1); }
    if(ev.key === 'Enter' && ev.target && ev.target.dataset && ev.target.dataset.input === 'tab-q'){   // Enter no nº da unidade abre a ficha dela no espelho
      const q = norm(ev.target.value).trim(), ch = S.det.get(S.ui.tabProj), det = ch && ch.v;
      if(q && det && vistaTab(det) === 'espelho' && (det.dados.unidades || []).some(a => norm(a[0]) === q)){ ev.preventDefault(); abrirUnidadeEsp(S.ui.tabProj, (det.dados.unidades || []).find(a => norm(a[0]) === q)[0]); }
    }
  });
  window.addEventListener('hashchange', () => { S.veioDeDentro = true; fecharLuz(); });


  // ---------------- x_core.js ----------------
  // ================= ESPELHOS 3.0: o app dos Espelhos no visual do app do corretor =================
  // Tudo daqui para baixo é o que o app dos Espelhos tinha e o do corretor não: avisos e buscas salvas, resumo do dia,
  // enviadas, documentos, mercado, escritório, proposta em imagem e o material completo de cada projeto.
  // Os módulos registram rotas (ROTAS.push), ações de clique (ACOES_X), campos (INPUTS_X), formulários (SUBMITS_X),
  // itens do menu "Mais" (MAIS_X) e tradutores de endereço antigo (HASH_X).
  const ACOES_X = {}, INPUTS_X = {}, SUBMITS_X = {}, MAIS_X = [], HASH_X = [];
  const PERFIL_X = [];          // seções extras do Perfil: funções que devolvem o HTML de uma <section class="caixa">
  const UNIDADE_X = [];         // botões extras no pé da folha da unidade: (p, a) => HTML de botões (p = projeto do resumo, a = linha da unidade)
  const ESPELHO_ANTIGO = 'classico.html';            // o app anterior fica no ar por um tempo, para quem precisar
  GRUPOS.lavvi = GRUPOS.lavvi || {n: 'Lavvi', l: 'Lavvi', s: 'LV'};
  GRUPOS.cambur = GRUPOS.cambur || {n: 'Cambur', l: 'Cambur', s: 'CB'};
  ['lavvi', 'cambur'].forEach(k => { if(!ORDEM_GRUPOS.includes(k)) ORDEM_GRUPOS.splice(Math.max(ORDEM_GRUPOS.indexOf('jra'), 0), 0, k); });

  const endpointAtual = () => LS.get('espelhos-endpoint') || null;   // aparelho com aviso ligado: o mesmo do app anterior
  // administrador: o servidor diz pelo escritório (só o código de administrador lê a atividade)
  let adminP = null;
  function ehAdmin(){
    if(!S.cod) return Promise.resolve(false);
    if(!adminP) adminP = rpc('escritorio_atividade', {p_codigo: S.cod, p_desde: new Date().toISOString()})
      .then(r => { S.admin = !(r && r.erro === 'so_admin'); atualizarNavX(); return S.admin; })
      .catch(() => { adminP = null; return false; });
    return adminP;
  }

  // ---- endereços do app anterior (links do aviso das 8h, do Gênio, da central e dos favoritos)
  function hashAntigo(h){
    h = String(h || '');
    for(const f of HASH_X){ try{ const r = f(h); if(r) return r; }catch(e){} }
    let m;
    if(/^#buscar-agora$/.test(h)) return '#/imoveis';
    if(/^#buscar/.test(h)) return '#/enviadas';            // #buscar e #buscar-enviadas (aviso de link aberto)
    if((m = /^#resumo(?:-(\d{4}-\d{2}-\d{2}))?$/.exec(h))) return '#/resumo' + (m[1] ? '/' + m[1] : '');
    if(/^#mercado$/.test(h)) return '#/mercado';
    if((m = /^#docs(?:-([a-z0-9-]+))?$/.exec(h))) return '#/docs' + (m[1] ? '/' + m[1] : '');
    if(/^#escritorio$/.test(h)) return '#/escritorio';
    // unidade: #<projeto>-u<unidade>, com o número às vezes codificado (%20) nos avisos do servidor
    { const s = h.slice(1); let i = s.indexOf('-u');
      while(i > 0){ const pid = s.slice(0, i); if(S.byId.has(pid)){ let n = s.slice(i + 2); try{ n = decodeURIComponent(n); }catch(e){} if(n){ S.abrirUnidade = {pid, n}; return '#/tabelas/' + pid; } } i = s.indexOf('-u', i + 1); } }
    if((m = /^#([a-z0-9-]+)$/.exec(h)) && S.byId.has(m[1])) return '#/tabelas/' + m[1];
    return null;
  }
  // unidade pedida pelo endereço antigo (#pid-u1203): abre a folha dela quando a tabela carregar
  setInterval(() => {
    const a = S.abrirUnidade; if(!a) return;
    if(location.hash !== '#/tabelas/' + a.pid){ if(!/^#\/tabelas\//.test(location.hash)) S.abrirUnidade = null; return; }
    const ch = S.det.get(a.pid); if(!ch || !ch.v) return;
    S.abrirUnidade = null;
    if((ch.v.dados.unidades || []).some(u => String(u[0]) === String(a.n))) abrirUnidadeEsp(a.pid, a.n);
  }, 400);

  // ---- menu "Mais": no celular é a quinta aba; no computador os mesmos itens ficam na barra lateral
  const IX = {
    comparar: svg('<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/>', 1.7),
    posts: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/>', 1.7),
    sino: svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>', 1.7),
    enviadas: svg('<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>', 1.7),
    docs: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>', 1.7),
    mercado: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/><path d="M8 11h6M11 8v6"/>', 1.7),
    escritorio: svg('<rect x="3" y="10" width="18" height="10" rx="1.5"/><path d="M7 10V6h10v4M9 14h6"/>', 1.7),
    resumo: svg('<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M4 10h16M8 14h3M8 17h6"/>', 1.7),
    perfil: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', 1.7),
    antigo: svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>', 1.7)
  };
  MAIS_X.push(
    {aba: 'comparar', href: '#/comparar', rotulo: 'Comparar', desc: 'Opções parecidas para o cliente ou lado a lado', ico: IX.comparar, celular: true},
    {aba: 'posts', href: '#/posts', rotulo: 'Posts', desc: 'Arte pronta para o Stories ou o feed', ico: IX.posts, celular: true},
    {aba: 'avisos', href: '#/avisos', rotulo: 'Avisos', desc: 'Buscas salvas e notificações no celular', ico: IX.sino, lateral: true},
    {aba: 'enviadas', href: '#/enviadas', rotulo: 'Enviadas', desc: 'Links que você mandou e quem abriu', ico: IX.enviadas, lateral: true},
    {aba: 'docs', href: '#/docs', rotulo: 'Documentos', desc: 'Book, memorial, convenção e contratos', ico: IX.docs, lateral: true},
    {aba: 'mercado', href: '#/mercado', rotulo: 'Mercado', desc: 'O resto do mercado pela Órulo', ico: IX.mercado, lateral: true, quando: () => !!S.mercadoPronto},
    {aba: 'resumo', href: '#/resumo', rotulo: 'Resumo do dia', desc: 'O que mexeu nos espelhos ontem e hoje', ico: IX.resumo, lateral: true},
    {aba: 'escritorio', href: '#/escritorio', rotulo: 'Escritório', desc: 'Os agentes trabalhando ao vivo', ico: IX.escritorio, lateral: true, quando: () => !!S.admin},
    {aba: 'perfil', href: '#/perfil', rotulo: 'Perfil e ajustes', desc: 'Assinatura, tema, instalar e código do time', ico: IX.perfil}
  );
  const maisVisiveis = () => MAIS_X.filter(i => !i.quando || i.quando());
  function telaMais(){
    return '<header class="pg-cab"><div><h1 class="t-1">Mais</h1><p class="sub">Tudo o que o app tem além das abas de baixo.</p></div></header>' +
      '<ul class="mais-lista">' + maisVisiveis().map(i => '<li><a href="' + i.href + '" data-aba-link="' + i.aba + '"><span class="mais-ico">' + i.ico + '</span>' +
        '<span class="meio"><b>' + esc(i.rotulo) + '</b><span>' + esc(i.desc || '') + '</span></span>' + ICO.seta + '</a></li>').join('') + '</ul>' +
      '<p class="nota">Versão ' + esc(VERSAO) + '. <a href="' + ESPELHO_ANTIGO + '">Abrir a versão anterior do app</a></p>';
  }
  ROTAS.push([/^#\/mais$/, 'mais', () => telaMais()]);
  // abas extras da barra lateral (computador): aparecem conforme o que o código e o servidor liberam
  function atualizarNavX(){
    const box = $('#lat-nav-x'); if(!box) return;
    const its = maisVisiveis().filter(i => i.lateral);
    const html = its.map(i => '<a href="' + i.href + '" data-aba="' + i.aba + '">' + i.ico + esc(i.rotulo) + '</a>').join('');
    if(box.dataset.v !== html){ box.innerHTML = html; box.dataset.v = html; }
    $$('[data-aba]', box).forEach(a => { if(a.dataset.aba === abaAtual) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const mais = $('#nav [data-aba="mais"]');
    if(mais){ const naMais = ['mais', 'comparar', 'posts', 'avisos', 'enviadas', 'docs', 'mercado', 'resumo', 'escritorio', 'perfil'].includes(abaAtual); if(naMais) mais.setAttribute('aria-current', 'page'); else mais.removeAttribute('aria-current'); }
  }
  const _atualizarLateral = atualizarLateral;
  atualizarLateral = function(){ _atualizarLateral(); atualizarNavX(); };

  // pé da folha da unidade: botões dos módulos (proposta em imagem e outros)
  const _unidadePeHtml = unidadePeHtml;
  unidadePeHtml = function(p, a){ return _unidadePeHtml(p, a) + UNIDADE_X.map(f => { try{ return f(p, a) || ''; }catch(e){ console.error(e); return ''; } }).join(''); };

  // ---------------- x_material.js ----------------
  // ================= MATERIAL COMPLETO DE CADA PROJETO =================
  // Tudo o que o app dos Espelhos mostrava na ficha do projeto e o do corretor deixava de fora: ficha técnica em todos
  // os projetos (a da construtora quando existe, senão montada com os dados do espelho), ficha completa para todos,
  // tour virtual, mapa, condições da tabela, documentos da central e, na unidade, condomínio, IPTU e fotos.
  const MT_FT = {interiores: 'Interiores', paisagismo: 'Paisagismo', arquitetura: 'Arquitetura', incorporadora: 'Incorporadora', construtora: 'Construtora',
    terreno_m2: 'Terreno', area_terreno: 'Terreno', torres: 'Torres', pavimentos: 'Pavimentos', unidades: 'Unidades', elevadores: 'Elevadores', decoracao: 'Decoração'};
  function mtValorFicha(k, v){
    if(v == null || v === '') return '';
    if(typeof v === 'number') return /m2$|_m2|terreno/.test(k) ? fmtM2(Math.round(v * 100) / 100) : v.toLocaleString('pt-BR');
    if(Array.isArray(v)) return v.filter(x => x != null && x !== '').map(String).join(', ');
    if(typeof v === 'object') return Object.values(v).filter(x => typeof x === 'string' || typeof x === 'number').join(', ');
    return String(v);
  }
  // ficha técnica de qualquer projeto: dados do espelho e do cadastro, mais a ficha da construtora quando o cadastro tem
  function fichaTecnicaAuto(p, det){
    const d = det.dados || {}, i = det.info || {}, us = Array.isArray(d.unidades) ? d.unidades : [], f = [];
    const tem = rot => f.some(x => x[0] === rot);
    const cons = i.construtora || quemDe(p);
    if(cons) f.push(['Construtora', String(cons)]);
    const ft = i.ficha_tecnica && typeof i.ficha_tecnica === 'object' && !Array.isArray(i.ficha_tecnica) ? i.ficha_tecnica : {};
    if(ft.incorporadora && String(ft.incorporadora) !== String(cons)) f.push(['Incorporadora', mtValorFicha('incorporadora', ft.incorporadora)]);
    const tip = typeof i.tipologias === 'string' && i.tipologias.trim() ? i.tipologias.trim() : tiposTxt(p.tipos);
    if(tip) f.push(['Tipologias', tip]);
    const areas = us.map(areaU).filter(v => v > 0), r2 = v => Math.round(v * 100) / 100;
    if(areas.length){ const a0 = r2(Math.min(...areas)), a1 = r2(Math.max(...areas)); f.push(['Metragens', a0 === a1 ? fmtM2(a0) : 'de ' + fmtM2(a0).replace(' m²', '') + ' a ' + fmtM2(a1)]); }
    const revenda = /^rev-/.test(p.id);   // na revenda o espelho só tem as unidades à venda, não o prédio todo
    if(us.length && !revenda) f.push(['Unidades no espelho', String(us.length)]);
    const ands = revenda ? [] : us.map(a => a[4]).filter(v => v !== '' && v != null && isFinite(+v)).map(Number);
    if(ands.length){ const a0 = Math.min(...ands), a1 = Math.max(...ands); if(a1 >= 2) f.push(['Andares com unidades', a0 === a1 ? a1 + 'º' : a0 + 'º ao ' + a1 + 'º']); }
    if(i.fase === 'pronto') f.push(['Fase', 'Pronto para morar']);
    else{
      if(FASE[i.fase]) f.push(['Fase', FASE[i.fase]]);
      const ent = mesAno(i.entrega);
      if(ent) f.push(['Entrega', maiusc1(ent) + (/financiamento|previs|apto|iapart/i.test(i.entrega_fonte || '') ? ' (estimativa)' : '')]);
    }
    const vg = i.vagas && typeof i.vagas === 'object' && i.vagas.t ? String(i.vagas.t).replace(/[.]$/, '') : '';
    if(vg) f.push(['Vaga de garagem', vg]);
    if(mobProj(det)) f.push(['Mobiliado', 'Todas as unidades']);
    for(const [k, v] of Object.entries(ft)){
      if(k === 'incorporadora') continue;
      const rot = MT_FT[k] || maiusc1(k.replace(/_m2$/, '').replace(/_/g, ' ')), val = mtValorFicha(k, v);
      if(val && !tem(rot)) f.push([rot, val]);
    }
    const end = i.endereco || d.endereco, bairro = p.bairro || i.bairro;
    if(end) f.push(['Endereço', String(end).replace(/\s*·\s*/g, ', ')]);
    else if(bairro) f.push(['Bairro', bairro]);
    if(i.zona && ZONA[i.zona] && !/grande sp/i.test(ZONA[i.zona])) f.push(['Região', 'Zona ' + ZONA[i.zona]]);
    return f;
  }
  const mtMapa = (p, det) => {
    const i = det.info || {};
    if(i.lat != null && i.lng != null && isFinite(+i.lat) && isFinite(+i.lng) && i.geo !== 'bairro') return 'https://www.google.com/maps/search/?api=1&query=' + (+i.lat) + ',' + (+i.lng);
    const end = i.endereco || det.dados.endereco;
    return end ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(String(end) + (p.cidade ? ', ' + p.cidade : ', São Paulo')) : null;
  };
  const mtItem = (x, interno) => '<li><a href="' + esc(x.u) + '"' + (interno ? '' : ' target="_blank" rel="noopener"') + '><span class="tipo" aria-hidden="true">' + esc(String(x.x).slice(0, 5)) + '</span><span class="t"><b>' + esc(x.t) + '</b>' + (x.s ? '<small>' + esc(x.s) + '</small>' : '') + '</span>' + ICO.seta + '</a></li>';
  function mtInserir(h, ancora, fim, html){   // depois do primeiro "fim" que vem após a âncora
    const i = h.indexOf(ancora); if(i < 0) return null;
    const j = h.indexOf(fim, i); if(j < 0) return null;
    return h.slice(0, j) + html + h.slice(j);
  }

  // "Condições da Outubro 2026:" vira "Condições da tabela (Outubro 2026):"
  const mtTextos = h => h.replace(/<p class="texto-2">Condições da ([^<:]+):<\/p>/g, (m0, t) => '<p class="texto-2">Condições da ' + (/^tabela/i.test(t.trim()) ? t.trim() : 'tabela (' + t.trim() + ')') + ':</p>');
  const _projetoHtml = projetoHtml;
  projetoHtml = function(p, det, c){
    const c2 = Object.assign({}, c || {});
    const auto = !(c && c.pagina);
    if(auto) c2.pagina = '?p=' + encodeURIComponent(p.id);
    if(!(c && Array.isArray(c.fatos) && c.fatos.some(x => Array.isArray(x) && x[0]))) c2.fatos = fichaTecnicaAuto(p, det);
    let h = mtTextos(_projetoHtml(p, det, c2));
    if(auto) h = h.replace('<small>Fotos, plantas por andar, vistas e simulador</small>', '<small>Fotos, unidades e valores do espelho</small>');
    // condições da tabela que o fluxo não mostra
    const tab = det.dados.tabela || {}, regraPainel = tab.regra_curta || tab.regra_avista || '';
    if(h.indexOf('<p class="texto-2">Condições da ') < 0){
      const cond = [tab.regra_curta, tab.regra_avista].concat(Array.isArray(tab.condicoes) ? tab.condicoes : []).filter(Boolean).map(String)
        .filter((t, k, a) => a.indexOf(t) === k && t !== regraPainel);
      if(cond.length){
        const sec = '<section class="sec" aria-labelledby="cnd-t"><h2 class="t-2" id="cnd-t">Condições da tabela</h2>' + (tab.nome ? '<p class="texto-2">' + esc(nomeTabela(tab.nome)) + '</p>' : '') + '<ul class="lista-txt">' + cond.slice(0, 8).map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></section>';
        let novo = null;
        const i = h.indexOf('aria-labelledby="flx-t"');
        if(i >= 0){ const j = h.indexOf('</section>', i); if(j >= 0) novo = h.slice(0, j + 10) + sec + h.slice(j + 10); }
        if(!novo) for(const an of ['mov-t', 'sob-t', 'laz-t', 'pla-t', 'vis-t', 'per-t', 'fic-t', 'dif-t', 'mat-t']){
          const k = h.indexOf('<section class="sec" aria-labelledby="' + an + '">');
          if(k >= 0){ novo = h.slice(0, k) + sec + h.slice(k); break; }
        }
        if(novo) h = novo;
      }
    }
    // mais itens no material: documentos da central, tour, todo o material e mapa
    const extra = [];
    const dp = det.docs && det.docs.projeto && det.docs.projeto.id === p.id ? det.docs.projeto : null;
    const nD = dp && Array.isArray(dp.docs) ? dp.docs.length : 0, nP = dp && Array.isArray(dp.pastas) ? dp.pastas.length : 0;
    if(nD || nP) extra.push(mtItem({u: '#/docs/' + p.id, t: 'Documentos do projeto', s: [nD ? plural(nD, 'documento', 'documentos') : '', nP ? plural(nP, 'pasta no Drive', 'pastas no Drive') : ''].filter(Boolean).join(' e ') + ', com link para copiar', x: 'docs'}, true));
    for(const z of ((c && Array.isArray(c.tours)) ? c.tours : [])) if(z && urlSegura(z.u)) extra.push(mtItem({u: z.u, t: z.cli || z.t || 'Tour virtual', s: 'Tour virtual', x: 'tour'}));
    // material oficial que é só um link (pasta do Drive, espelho e tabela mais novos): a base só lista arquivos com id
    for(const m of ((c && Array.isArray(c.material_oficial)) ? c.material_oficial : [])) if(m && !m.id && urlSegura(m.u)) extra.push(mtItem({u: m.u, t: m.c || m.n || 'Material da construtora', s: /drive\.google\.com\/drive\/folders/.test(m.u) ? 'Pasta no Google Drive' : (m.n && m.n !== m.c ? m.n : 'Link da construtora'), x: /folders/.test(m.u) ? 'pasta' : 'link'}));
    const nMat = c && Array.isArray(c.material_oficial) ? c.material_oficial.length : 0;
    if(nMat > 6) extra.push(mtItem({u: ESP + 'nex/?p=' + encodeURIComponent(p.id) + '#mat', t: 'Todo o material da construtora', s: plural(nMat, 'arquivo', 'arquivos') + ' na ficha completa', x: 'mais'}));
    const mapa = mtMapa(p, det);
    if(mapa) extra.push(mtItem({u: mapa, t: 'Ver no mapa', s: String((det.info && det.info.endereco) || det.dados.endereco || p.bairro || '').replace(/\s*·\s*/g, ', '), x: 'mapa'}));
    if(extra.length) h = mtInserir(h, 'aria-labelledby="mat-t"', '</ul>', extra.join('')) || h;
    // os materiais gerais da construtora ficam na aba Documentos deste app
    if(det.docs && Array.isArray(det.docs.geral) && det.docs.geral.length){
      dcDoCache();
      const C = DC.idx ? DC.idx.construtoras.find(x => x.nome === det.docs.construtora) : null;
      h = h.replace(/<p class="nota">A ([^<]*?) também tem (\d+) materiais gerais \(treinamentos, campanhas e formulários\) no app dos Espelhos\.<\/p>/, (m0, quem, n) =>
        '<p class="nota">A ' + quem + ' também tem ' + plural(+n, 'material geral', 'materiais gerais') + ', que ' + (+n === 1 ? 'vale' : 'valem') + ' para todos os projetos: treinamentos, campanhas e formulários. <a href="#/docs' + (C ? '/' + esc(dcGeralChave(C)) : '') + '">Ver na aba Documentos</a></p>');
    }
    return h;
  };

  // ---- unidade: condomínio, IPTU, fotos da unidade (revenda) e a ficha completa da unidade
  const MT_FU = new Map();
  const mtFotoDrive = (id, w) => 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w' + (w || 1600);
  const _unidadeCorpoHtml = unidadeCorpoHtml;
  unidadeCorpoHtml = function(p, det, c, a){
    let h = mtTextos(_unidadeCorpoHtml(p, det, c, a));
    const ex = exDe(a), n = String(a[0]);
    const linhas = [];
    if(+ex.cond > 0) linhas.push(['Condomínio', BRL(+ex.cond) + ' por mês']);
    if(+ex.iptu > 0) linhas.push(['IPTU', BRL(+ex.iptu)]);
    if(ex.gd) linhas.push(['Garden', 'Sim']);
    if(ex.dist) linhas.push(['Histórico', 'Previamente distratada']);
    if(linhas.length) h = mtInserir(h, '<dl class="un-fatos">', '</dl>', linhas.map(x => '<div><dt>' + esc(x[0]) + '</dt><dd class="num">' + esc(x[1]) + '</dd></div>').join('')) || h;
    const livre = a[6] !== 'vendida';
    // à vista com o desconto sobre o parcelado, como no app anterior
    if(livre && +ex.pp > 0 && +ex.pv > 0 && +ex.pv < +ex.pp){ const d = Math.round((1 - ex.pv / ex.pp) * 1000) / 10; if(d > 0) h = h.replace('<div><span>À vista</span>', '<div><span>À vista <small class="mt-desc">' + esc('−' + d.toLocaleString('pt-BR') + '%') + '</small></span>'); }
    const notas = [];
    if(livre && +ex.pt > 0) notas.push('Preço de tabela ' + BRL(+ex.pt) + '. Esta unidade está com condição promocional.');
    if(ex.aj) notas.push('★ ' + String(ex.aj));
    const tab = det.dados.tabela || {};
    if(livre && ex.c != null && !tab.fluxos && Array.isArray(tab.condicoes) && tab.condicoes[ex.c]) notas.push('Condição desta unidade: ' + String(tab.condicoes[ex.c]));
    if(notas.length){
      const i = h.indexOf('<dl class="un-fatos">'), j = i >= 0 ? h.indexOf('</dl>', i) : -1;
      if(j >= 0) h = h.slice(0, j + 5) + notas.map(t => '<p class="nota mt-un-nota">' + esc(t) + '</p>').join('') + h.slice(j + 5);
    }
    if(/^https:\/\/drive\.google\.com\//.test(String(ex.fu || ''))){
      const k = p.id + '|' + n;
      h += '<div class="mt-fu" data-fu="' + esc(k) + '"><p class="rotulo">Fotos da unidade</p><div class="fotos-linha mt-fu-tira"><div class="brilho" style="height:104px;width:150px;border-radius:12px"></div><div class="brilho" style="height:104px;width:150px;border-radius:12px"></div></div></div>';
      setTimeout(() => mtFotosUnidade(p.id, n), 0);
    }
    const pastaU = /^https:\/\/drive\.google\.com\//.test(String(ex.fu || '')) ? String(ex.fu) : null;
    h += '<div class="mt-un-links">' + (pastaU ? '<a class="link-mais" href="' + esc(pastaU) + '" target="_blank" rel="noopener">Pasta da unidade no Drive ' + ICO.seta + '</a>' : '') +
      '<a class="link-mais mt-un-ficha" href="' + esc(ESP + 'nex/?p=' + encodeURIComponent(p.id) + '#u' + encodeURIComponent(n)) + '" target="_blank" rel="noopener">Ficha completa da unidade ' + ICO.seta + '</a></div>';
    return h;
  };
  async function mtFotosUnidade(pid, n){
    const k = pid + '|' + n;
    let r = MT_FU.get(k);
    if(!r){
      try{ r = await rpc('fotos_unidade', {p_codigo: S.cod, p_projeto: pid, p_unidade: String(n)}); }
      catch(e){ if(codigoInvalido(e)){ sair('Esse código não vale mais. Digite o código novo do time.'); return; } if(!(e && e.status)){ const b = $('.mt-fu'); if(b && b.dataset.fu === k) b.remove(); return; } r = {ok: false}; }
      MT_FU.set(k, r);
    }
    const box = $$('.mt-fu').find(b => b.dataset.fu === k); if(!box) return;
    const fotos = r && r.ok && Array.isArray(r.fotos) ? r.fotos.filter(f => f && f.id) : [];
    if(!fotos.length){ box.remove(); return; }
    const lista = fotos.slice(0, 40).map((f, i) => ({src: mtFotoDrive(f.id), t: f.t || 'Unidade ' + n + ', foto ' + (i + 1)}));
    S.mtFu = {k, lista};
    box.innerHTML = '<p class="rotulo">' + esc(plural(fotos.length, 'foto da unidade', 'fotos da unidade')) + '</p><div class="fotos-linha mt-fu-tira">' +
      lista.map((f, i) => '<button type="button" class="mos-item" data-acao="mt-fu-luz" data-i="' + i + '" aria-label="' + esc('Ver a foto ' + (i + 1) + ' da unidade') + '">' + imgTag(f.src, f.t, '', {w: 480, sizes: '160px'}) + '</button>').join('') + '</div>';
  }
  ACOES_X['mt-fu-luz'] = el => { if(S.mtFu && S.mtFu.lista.length) abrirLuz(S.mtFu.lista, +el.dataset.i || 0, 'unidade'); };

  // ---- ficha da central: o índice (nex/p/index.json) diz quem tem ficha montada; os outros nem pedem o arquivo
  let mtIdxCentral = null;
  const mtIndiceCentral = () => mtIdxCentral || (mtIdxCentral = fetch(ESP + 'nex/p/index.json', {cache: 'no-cache'})
    .then(r => r.ok ? r.json() : null)
    .then(l => Array.isArray(l) ? new Set(l.map(x => x && x.id).filter(Boolean)) : null)
    .catch(() => { mtIdxCentral = null; return null; }));
  const _fichaCentral = fichaCentral;
  fichaCentral = function(id){
    if(S.central.has(id)) return S.central.get(id);
    const pr = mtIndiceCentral().then(ids => {
      if(ids && !ids.has(id)){ S.centralV.set(id, null); return null; }
      S.central.delete(id);
      return _fichaCentral(id);
    });
    S.central.set(id, pr);
    return pr;
  };

  // ---- "Baixar e enviar": todo o material oficial da construtora, como na central dos Espelhos
  // (o app do corretor só oferecia o book; material técnico, book de vistas, cartilha e implantação ficavam de fora)
  function mtMaterialOficial(p, det, c){
    const out = [], vistos = new Set();
    const add = (id, u, t, s, x) => { const k = id || u; if(!k || vistos.has(k)) return; vistos.add(k); out.push({u, t, s, x}); };
    for(const m of ((c && Array.isArray(c.material_oficial)) ? c.material_oficial : [])){
      if(!m) continue;
      const u = m.id ? driveArq(m.id) : urlSegura(m.u); if(!u) continue;
      const nome = m.n && m.n !== m.c ? String(m.n) : '';
      add(m.id, u, m.c || m.n || 'Material da construtora', [nome, m.id ? String(m.ext || 'pdf').toUpperCase() : (/folders/.test(u) ? 'Pasta no Drive' : 'Link'), m.mb ? String(m.mb).replace('.', ',') + ' MB' : ''].filter(Boolean).join(', '), m.id ? (m.ext || 'pdf') : (/folders/.test(u) ? 'pasta' : 'link'));
    }
    const dp = det.docs && det.docs.projeto && det.docs.projeto.id === p.id ? det.docs.projeto : null;
    for(const x of ((dp && Array.isArray(dp.docs)) ? dp.docs : [])){
      if(!x) continue;
      const u = urlSegura(x.u) || (x.id && x.x !== 'link' && !/^[a-z]+-/.test(x.id) ? driveArq(x.id) : null); if(!u) continue;
      add(x.id, u, x.t || x.a || 'Documento', [x.a, x.d].filter(Boolean).join(', '), x.x || 'pdf');
    }
    for(const m of (Array.isArray(det.info && det.info.material) ? det.info.material : [])) if(m && (m.tipo === 'pdf' || m.tipo === 'video') && urlSegura(m.u)) add(null, m.u, m.t || (m.tipo === 'pdf' ? 'PDF' : 'Vídeo'), m.tipo === 'pdf' ? 'PDF' : 'Vídeo', m.tipo === 'pdf' ? 'pdf' : 'mp4');
    return out;
  }
  const _menuBaixarHtml = menuBaixarHtml;
  menuBaixarHtml = function(p, det, c){
    const h = _menuBaixarHtml(p, det, c);
    const docs = mtMaterialOficial(p, det, c);
    if(!docs.length) return h;
    const max = 24, nome = p.nome || '';
    const sec = '<section class="mt-mat" aria-labelledby="mt-mat-t"><h3 class="t-3" id="mt-mat-t">Material da construtora <span class="q">' + docs.length + '</span></h3>' +
      '<p class="nota">Arquivos originais da construtora. Abra no Drive ou copie o link para mandar ao cliente.</p><ul class="docs dc-docs mt-mat-docs">' +
      docs.slice(0, max).map(d => '<li><a href="' + esc(d.u) + '" target="_blank" rel="noopener" aria-label="' + esc('Abrir ' + d.t) + '"><span class="tipo" aria-hidden="true">' + esc(String(d.x).slice(0, 4)) + '</span><span class="t"><b>' + esc(d.t) + '</b>' + (d.s ? '<small>' + esc(d.s) + '</small>' : '') + '</span></a>' +
        '<button type="button" class="ico-btn dc-cp" data-acao="dc-copiar" data-u="' + esc(d.u) + '" data-t="' + esc(nome + ' · ' + d.t) + '" aria-label="' + esc('Copiar o link de ' + d.t) + '">' + ICO.copiar + '</button></li>').join('') + '</ul>' +
      (docs.length > max ? '<a class="link-mais" href="#/docs/' + esc(p.id) + '">Ver os ' + docs.length + ' arquivos ' + ICO.seta + '</a>' : '') + '</section>';
    const i = h.indexOf('<div class="opcoes">'), j = i >= 0 ? h.indexOf('</div>', i) : -1;
    return j >= 0 ? h.slice(0, j + 6) + sec + h.slice(j + 6) : h + sec;
  };

  // ---------------- x_docs.js ----------------
  // ================= DOCUMENTOS DAS CONSTRUTORAS (#/docs, #/docs/<projeto>) =================
  // O índice vem do servidor (função "documentos"): por construtora, os projetos com book, memorial, convenção, contrato,
  // matrícula, certidões e SCP, mais as pastas do Drive. Os arquivos abrem no Drive da construtora ou no site do app.
  const DC = {idx: null, pr: null, em: 0, erro: false, cons: null, tipo: null, q: '', t: null};
  const K_DOCS = 'espelhos-docs';
  const DC_TIPOS = [['book', 'Book'], ['memorial', 'Memorial'], ['convencao', 'Convenção'], ['contrato', 'Contrato'], ['matricula', 'Matrícula'],
    ['certidoes', 'Certidões'], ['societario', 'SPE'], ['scp', 'SCP'], ['credito', 'Crédito e cadastro'], ['condominio', 'Condomínio'], ['treinamento', 'Treinamento']];
  const DC_SIN = {book: 'book apresentacao folder', memorial: 'memorial descritivo acabamento', convencao: 'convencao condominio minuta regimento',
    contrato: 'contrato minuta quadro resumo qr compra venda compromisso enquadrado', matricula: 'matricula registro ri imovel cartorio averbacao',
    certidoes: 'certidao certidoes negativa trabalhista fgts protesto processos spe', societario: 'contrato social cnpj spe empresa sociedade junta comercial inteiro teor',
    scp: 'scp sociedade cessao investimento investidor', credito: 'credito cadastro ficha', institucional: 'institucional apresentacao',
    lojas: 'lojas loja', prefeitura: 'prefeitura alvara', condominio: 'condominio valor estimativa', treinamento: 'treinamento'};
  const DC_PARADA = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'o', 'a', 'os', 'as', 'para', 'pra', 'no', 'na', 'em', 'um', 'uma']);
  const dcN = s => norm(s).replace(/\s+/g, ' ').trim();
  const dcLink = x => /^https:\/\//.test(String((x && x.u) || '')) ? String(x.u) : (x && x.id ? driveArq(x.id) : null);
  const dcChave = (c, p) => p.id || ('x-' + slug(c.id) + '-' + slug(p.n));
  const dcGeralChave = c => 'geral-' + slug(c.id);

  function dcAplicar(d){
    if(!d || !Array.isArray(d.construtoras)) return false;
    for(const c of d.construtoras){
      c.projetos = Array.isArray(c.projetos) ? c.projetos : [];
      c.geral = Array.isArray(c.geral) ? c.geral : [];
      for(const p of c.projetos){
        p.docs = Array.isArray(p.docs) ? p.docs.filter(x => x && dcLink(x)) : [];
        p.pastas = Array.isArray(p.pastas) ? p.pastas.filter(x => x && x.id) : [];
        p._k = dcN(p.n + ' ' + c.nome);
        for(const x of p.docs) x._k = dcN((x.t || '') + ' ' + (x.a || '') + ' ' + (DC_SIN[x.c] || ''));
      }
      c.geral = c.geral.filter(x => x && dcLink(x));
      for(const x of c.geral) x._k = dcN((x.t || '') + ' ' + (x.a || '') + ' ' + (DC_SIN[x.c] || ''));
    }
    DC.idx = d;
    return true;
  }
  function dcCarregar(forcar){
    if(DC.pr) return DC.pr;
    if(!forcar && DC.idx && Date.now() - DC.em < 10 * 60e3) return Promise.resolve(DC.idx);
    if(!S.cod) return Promise.resolve(DC.idx);
    DC.pr = rpc('documentos', {p_codigo: S.cod}).then(d => {
      if(dcAplicar(d)){ DC.em = Date.now(); DC.erro = false; LS.set(K_DOCS, JSON.stringify(d)); }
      return DC.idx;
    }).catch(e => {
      if(codigoInvalido(e)){ sair('Esse código não vale mais. Digite o código novo do time.'); return null; }
      DC.erro = true; return DC.idx;
    }).finally(() => { DC.pr = null; });
    return DC.pr;
  }
  function dcDoCache(){ if(DC.idx) return; try{ const c = JSON.parse(LS.get(K_DOCS) || 'null'); if(c) dcAplicar(c); }catch(e){} }
  // documentos de um projeto do app (pelo id do espelho), em qualquer construtora
  function dcDoProjeto(pid){
    dcDoCache();
    if(!DC.idx || !pid) return null;
    for(const c of DC.idx.construtoras) for(const p of c.projetos) if(dcChave(c, p) === pid) return {c, p};
    const g = DC.idx.construtoras.find(c => dcGeralChave(c) === pid);
    return g ? {c: g, p: {n: 'Geral ' + g.nome, sub: 'Crédito, cadastro, institucional e lojas', docs: g.geral, pastas: g.pastas_gerais || [], geral: true}} : null;
  }
  const dcConta = c => c.projetos.reduce((s, p) => s + p.docs.length, 0) + c.geral.length;
  const dcToks = q => dcN(q).replace(/[^a-z0-9 ]+/g, ' ').split(' ').filter(t => t.length > 1 && !DC_PARADA.has(t));

  function telaDocs(chave){
    dcDoCache();
    const R = chave ? dcDoProjeto(chave) : null, p = chave ? S.byId.get(chave) : null;
    const nome = (R && R.p.n) || (p && p.nome) || '';
    if(chave) DC.tipo = null;
    pos.push(() => dcPintar(chave));
    pos.push(async () => {
      const antes = DC.idx;
      await dcCarregar();
      if(location.hash !== '#/docs' + (chave ? '/' + chave : '')) return;
      if(DC.idx !== antes || !DC.idx) dcPintar(chave);
    });
    return (chave ? '<nav class="migalha" aria-label="Caminho"><a href="#/docs">' + ICO.voltar + 'Documentos</a>' + (nome ? '<span aria-current="page">' + esc(nome) + '</span>' : '') + '</nav>' : '') +
      '<header class="pg-cab"><div><h1 class="t-1">' + (chave ? esc(nome || 'Documentos') : 'Documentos') + '</h1><p class="sub" id="dc-sub">' +
      (chave ? 'Documentos do projeto' : 'Book, memorial, convenção, contrato e matrícula das construtoras') + '</p></div>' +
      (chave && p ? '<a class="btn btn-peq" href="#/p/' + esc(p.id) + '">Ver o projeto</a>' : '') + '</header>' +
      (chave ? '' : '<div class="busca-linha"><label class="busca"><span class="sr">Buscar documento</span>' + ICO.lupa +
        '<input id="dc-q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Convenção, memorial, matrícula ou projeto" value="' + esc(DC.q) + '" data-input="dc-q">' +
        '<button type="button" class="limpar" data-acao="dc-limpar" aria-label="Limpar a busca"' + (DC.q ? '' : ' hidden') + '>' + ICO.fechar + '</button></label></div>') +
      '<div class="dc-filtros"><div class="pilulas rola" id="dc-cons" role="group" aria-label="Construtora" hidden></div><div class="pilulas rola" id="dc-tipos" role="group" aria-label="Tipo de documento" hidden></div></div>' +
      '<p class="sub dc-cont" id="dc-cont" aria-live="polite"></p>' +
      '<div class="dc-lista" id="dc-lista"><div class="esqueleto" aria-busy="true"><div class="brilho" style="height:78px"></div><div class="brilho" style="height:78px"></div><div class="brilho" style="height:78px"></div><div class="brilho" style="height:78px"></div></div></div>' +
      '<p class="nota dc-fonte" id="dc-fonte"></p>';
  }

  function dcPintar(chave){
    const lista = $('#dc-lista'); if(!lista) return;
    const I = DC.idx;
    if(!I){
      if(DC.erro) lista.innerHTML = '<div class="faixa-aviso" role="alert"><div class="aviso erro">' + ICO.nuvem + '<p>Não consegui abrir a lista de documentos agora. Confira a internet e tente de novo.</p></div><button type="button" class="btn btn-largo" data-acao="dc-recarregar">Tentar de novo</button></div>';
      return;
    }
    if(chave) return dcPintarProjeto(chave);
    if(DC.cons && !I.construtoras.some(c => c.id === DC.cons)) DC.cons = null;
    const cs = I.construtoras.filter(c => !DC.cons || c.id === DC.cons);
    const toks = dcToks(DC.q);
    // construtoras
    const boxC = $('#dc-cons');
    if(boxC){
      boxC.hidden = I.construtoras.length < 2;
      boxC.innerHTML = '<button type="button" class="pilula peq" data-acao="dc-cons" data-v="" aria-pressed="' + !DC.cons + '">Todas</button>' +
        I.construtoras.map(c => '<button type="button" class="pilula peq" data-acao="dc-cons" data-v="' + esc(c.id) + '" aria-pressed="' + (c.id === DC.cons) + '">' + esc(c.nome) + '<span class="n num">' + dcConta(c) + '</span></button>').join('');
    }
    // tipos que existem nas construtoras escolhidas
    const nTipo = {};
    for(const c of cs){ for(const p of c.projetos) for(const x of p.docs) nTipo[x.c] = (nTipo[x.c] || 0) + 1; for(const x of c.geral) nTipo[x.c] = (nTipo[x.c] || 0) + 1; }
    if(DC.tipo && !nTipo[DC.tipo]) DC.tipo = null;
    const boxT = $('#dc-tipos');
    if(boxT){
      const ts = DC_TIPOS.filter(([k]) => nTipo[k]);
      boxT.hidden = !ts.length;
      boxT.innerHTML = ts.map(([k, t]) => '<button type="button" class="pilula peq" data-acao="dc-tipo" data-v="' + k + '" aria-pressed="' + (DC.tipo === k) + '">' + esc(t) + '<span class="n num">' + nTipo[k] + '</span></button>').join('');
    }
    const cont = $('#dc-cont'), fonte = $('#dc-fonte');
    if(fonte) fonte.innerHTML = dcFonteHtml(cs.length === 1 ? cs[0] : null);
    // sem busca nem tipo: a lista de projetos, como em Tabelas
    if(!toks.length && !DC.tipo){
      const itens = [];
      for(const c of cs){
        for(const p of c.projetos) itens.push({c, p, k: dcChave(c, p), n: p.docs.length, f: p.pastas.length});
        if(c.geral.length || (c.pastas_gerais || []).length) itens.push({c, p: {n: 'Geral ' + c.nome}, k: dcGeralChave(c), n: c.geral.length, f: (c.pastas_gerais || []).length, geral: true});
      }
      itens.sort((a, b) => (!!a.geral - !!b.geral) || ((b.n > 0) - (a.n > 0)) || String(a.p.n).localeCompare(String(b.p.n), 'pt-BR'));
      const nDocs = itens.reduce((s, x) => s + x.n, 0);
      if(cont) cont.textContent = plural(itens.filter(x => !x.geral).length, 'projeto', 'projetos') + ', ' + plural(nDocs, 'documento', 'documentos') + (cs.length === 1 && cs[0].lido_em ? ', lidos em ' + String(cs[0].lido_em).split('-').reverse().slice(0, 2).join('/') : '');
      lista.innerHTML = itens.length ? '<ul class="lista-proj dc-projs">' + itens.map(x => {
        const pa = x.p.id ? S.byId.get(x.p.id) : null;
        const sub = x.geral ? 'Crédito, cadastro, institucional e lojas' : [cs.length > 1 || !DC.cons ? x.c.nome : '', pa ? pa.bairro : '', x.p.id && !pa ? 'fora do app' : (!x.p.id ? 'ainda não está no app' : '')].filter(Boolean).join(', ');
        return '<li><a href="#/docs/' + esc(x.k) + '">' + (pa ? miniProj(pa) : '<span class="redonda"><span class="capa-vazia"><b>' + esc(x.geral ? 'G' : String(x.p.n || '?').trim().charAt(0).toUpperCase()) + '</b></span></span>') +
          '<span class="meio"><b>' + esc(x.p.n) + '</b><span>' + esc(sub) + '</span></span>' +
          '<span class="fim dc-fim"><b class="num">' + x.n + '</b><span>' + esc(x.n ? (x.n === 1 ? 'documento' : 'documentos') : x.f ? plural(x.f, 'pasta', 'pastas') : 'vazio') + '</span></span></a></li>';
      }).join('') + '</ul>' : '<div class="vazio"><h2 class="t-3">Nenhum documento ainda</h2><p class="texto-2">Quando a construtora divulgar, os documentos aparecem aqui.</p></div>';
      return;
    }
    // busca ou tipo: os documentos que batem, por projeto
    const blocos = []; let nDoc = 0;
    for(const c of cs){
      const escolhe = (docs, nomeK) => {
        const doNome = toks.length && toks.every(t => nomeK.includes(t));
        return (docs || []).filter(x => (!DC.tipo || x.c === DC.tipo) && (doNome || !toks.length || (toks.every(t => x._k.includes(t) || nomeK.includes(t)) && toks.some(t => x._k.includes(t)))));
      };
      for(const p of c.projetos){ const ds = escolhe(p.docs, p._k); if(ds.length){ nDoc += ds.length; blocos.push(dcCartao(c, p, ds, false, cs.length > 1)); } }
      const g = escolhe(c.geral, dcN('geral ' + c.nome));
      if(g.length){ nDoc += g.length; blocos.push(dcCartao(c, {n: 'Geral ' + c.nome, sub: 'Crédito, cadastro, institucional e lojas', geral: true, docs: g, pastas: []}, g, false, false)); }
    }
    if(cont) cont.textContent = nDoc ? plural(nDoc, 'documento', 'documentos') + (blocos.length > 1 ? ' em ' + blocos.length + ' projetos' : '') : '';
    lista.innerHTML = blocos.length ? blocos.join('') : '<div class="vazio"><h2 class="t-3">Nada com "' + esc(DC.q || (DC_TIPOS.find(t => t[0] === DC.tipo) || [])[1] || '') + '"</h2><p class="texto-2">Tente outra palavra, como convenção, memorial, matrícula ou o nome do projeto.</p>' + (DC.q ? '<button type="button" class="btn" data-acao="dc-limpar">Limpar a busca</button>' : '') + '</div>';
  }
  function dcPintarProjeto(chave){
    const lista = $('#dc-lista'), R = dcDoProjeto(chave), cont = $('#dc-cont'), fonte = $('#dc-fonte');
    if(!R){
      const p = S.byId.get(chave);
      lista.innerHTML = '<div class="vazio"><h2 class="t-3">Sem documentos cadastrados</h2><p class="texto-2">' + (p ? 'O ' + esc(p.nome) + ' ainda não tem book nem documentos na central da construtora.' : 'Esse projeto não está na central de documentos.') + '</p><a class="btn" href="#/docs">Ver todos os documentos</a></div>';
      if(cont) cont.textContent = ''; return;
    }
    const {c, p} = R, docs = p.docs || [];
    const nTipo = {}; docs.forEach(x => { nTipo[x.c] = (nTipo[x.c] || 0) + 1; });
    if(DC.tipo && !nTipo[DC.tipo]) DC.tipo = null;
    const boxT = $('#dc-tipos');
    if(boxT){
      const ts = DC_TIPOS.filter(([k]) => nTipo[k]);
      boxT.hidden = docs.length < 7 || ts.length < 2;
      boxT.innerHTML = '<button type="button" class="pilula peq" data-acao="dc-tipo" data-v="" aria-pressed="' + !DC.tipo + '">Todos</button>' + ts.map(([k, t]) => '<button type="button" class="pilula peq" data-acao="dc-tipo" data-v="' + k + '" aria-pressed="' + (DC.tipo === k) + '">' + esc(t) + '<span class="n num">' + nTipo[k] + '</span></button>').join('');
    }
    const sub = $('#dc-sub'); if(sub) sub.textContent = [c.nome, plural(docs.length, 'documento', 'documentos'), (p.pastas || []).length ? plural(p.pastas.length, 'pasta no Drive', 'pastas no Drive') : ''].filter(Boolean).join(', ');
    const ds = docs.filter(x => !DC.tipo || x.c === DC.tipo);
    if(cont) cont.textContent = docs.length ? 'Abrir mostra o arquivo. O botão de copiar leva o link pronto para o WhatsApp do cliente.' : '';
    let h = dcCartao(c, p, ds, true, false, true);
    // o que vale para todos os projetos da construtora
    if(!p.geral && (c.geral.length || (c.pastas_gerais || []).length)) h += '<a class="dc-geral" href="#/docs/' + esc(dcGeralChave(c)) + '"><span class="meio"><b>Geral ' + esc(c.nome) + '</b><span>' + esc(plural(c.geral.length, 'documento', 'documentos') + (c.geral.length === 1 ? ' que vale' : ' que valem') + ' para todos os projetos: crédito, cadastro, institucional') + '</span></span>' + ICO.seta + '</a>';
    lista.innerHTML = h;
    if(fonte) fonte.innerHTML = dcFonteHtml(c);
  }
  function dcCartao(c, p, docs, comPastas, comCons, solto){
    const pa = p.id ? S.byId.get(p.id) : null, chave = p.geral ? dcGeralChave(c) : dcChave(c, p);
    const nd = (p.docs || []).length;
    const sub = p.sub || [comCons ? c.nome : '', nd ? plural(nd, 'documento', 'documentos') : (p.pastas || []).length ? 'Pastas no Drive' : 'Sem documentos'].filter(Boolean).join(', ');
    let h = '<section class="caixa dc-proj' + (solto ? ' solto' : '') + '">';
    if(!solto) h += '<div class="sec-cab"><div class="dc-cab-t"><h2 class="t-3"><a href="#/docs/' + esc(chave) + '">' + esc(p.n) + '</a></h2><p class="sub">' + esc(sub) + '</p></div>' + (pa ? '<a class="link-mais" href="#/p/' + esc(pa.id) + '">Projeto ' + ICO.seta + '</a>' : '') + '</div>';
    if(docs.length) h += '<ul class="docs dc-docs">' + docs.map(x => dcLinha(x, p)).join('') + '</ul>';
    else if(!(p.pastas || []).length) h += '<p class="texto-2">A pasta deste projeto está vazia na central da construtora.</p>';
    const ps = comPastas ? (p.pastas || []) : [];
    if(ps.length) h += '<div class="dc-pastas"><h3 class="rotulo">Pastas no Drive</h3><div class="pilulas">' + ps.map(f => '<a class="pilula peq" href="' + esc(drivePasta(f.id)) + '" target="_blank" rel="noopener">' + esc(f.c || 'Pasta') + (f.q ? '<span class="n">' + esc(f.q) + '</span>' : '') + '</a>').join('') + '</div></div>';
    if(solto && p.lt && urlSegura(p.lt)) h += '<a class="link-mais" href="' + esc(p.lt) + '" target="_blank" rel="noopener">Linktree da construtora ' + ICO.seta + '</a>';
    return h + '</section>';
  }
  function dcLinha(x, p){
    const u = dcLink(x), ext = String(x.x || 'pdf').toLowerCase().slice(0, 4);
    const nome = (p && p.n && !p.geral ? p.n + ' · ' : '') + (x.t || 'Documento');
    return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener" aria-label="' + esc('Abrir ' + (x.t || 'documento') + (p && p.n ? ' do ' + p.n : '')) + '"><span class="tipo" aria-hidden="true">' + esc(ext) + '</span>' +
      '<span class="t"><b>' + esc(x.t || 'Documento') + '</b>' + ([x.a, x.d].filter(Boolean).length ? '<small>' + esc([x.a, x.d].filter(Boolean).join(', ')) + '</small>' : '') + '</span></a>' +
      '<button type="button" class="ico-btn dc-cp" data-acao="dc-copiar" data-u="' + esc(u) + '" data-t="' + esc(nome) + '" aria-label="' + esc('Copiar o link de ' + (x.t || 'documento')) + '">' + ICO.copiar + '</button></li>';
  }
  function dcFonteHtml(c){
    const f = c && c.fonte;
    const de = c ? 'Fonte: ' + (f && f.u && urlSegura(f.u) ? '<a href="' + esc(f.u) + '" target="_blank" rel="noopener">' + esc(f.t || f.u) + '</a>' : esc((f && f.t) || c.nome)) + '. ' : '';
    return de + esc((c && c.arquivos) || 'Os arquivos ficam no Drive da construtora. Se um link não abrir, a construtora pode ter trocado o arquivo.') + ' Dá para pedir pelo Gênio também: "convenção do" e o nome do projeto, e o PDF chega no WhatsApp.';
  }

  ROTAS.push([/^#\/docs(?:\/([a-z0-9-]+))?$/, 'docs', arg => telaDocs(arg || null)]);
  ACOES_X['dc-cons'] = el => { DC.cons = el.dataset.v || null; DC.tipo = null; dcPintar(null); };
  ACOES_X['dc-tipo'] = el => { const v = el.dataset.v || null; DC.tipo = DC.tipo === v ? null : v; const m = /^#\/docs\/([a-z0-9-]+)$/.exec(location.hash); dcPintar(m ? m[1] : null); };
  ACOES_X['dc-limpar'] = () => { DC.q = ''; const i = $('#dc-q'); if(i){ i.value = ''; i.focus(); } const b = $('[data-acao="dc-limpar"].limpar'); if(b) b.hidden = true; dcPintar(null); };
  ACOES_X['dc-copiar'] = el => copiar(el.dataset.t + ': ' + el.dataset.u, 'Link copiado. É só colar no WhatsApp do cliente.');
  ACOES_X['dc-recarregar'] = async () => { DC.erro = false; const m = /^#\/docs\/([a-z0-9-]+)$/.exec(location.hash); await dcCarregar(true); dcPintar(m ? m[1] : null); };
  INPUTS_X['dc-q'] = (el, ev, tipo) => {
    if(tipo !== 'input') return;
    const b = $('[data-acao="dc-limpar"].limpar'); if(b) b.hidden = !el.value;
    clearTimeout(DC.t); DC.t = setTimeout(() => { DC.q = el.value; dcPintar(null); }, 120);
  };
  // a lista fica pronta antes de o corretor abrir a aba
  setTimeout(() => { if(S.cod && S.carregado) dcCarregar(); }, 4000);

  // ---------------- x_avisos.js ----------------
  // ================= AVISOS, RESUMO DO DIA E ENVIADAS =================
  // O que o app anterior tinha no painel "Avisos e ajustes" e na lupa: aviso neste aparelho (venda, reserva e liberação
  // dos projetos acompanhados, busca salva que achou unidade, cliente que abriu o link), resumo das 8h, buscas salvas
  // ("Me avisa quando aparecer", a partir do filtro do Imóveis), resumo do dia e tudo o que foi mandado deste aparelho,
  // com a ligação ao Gênio. Mesmas funções do servidor e mesmas chaves do aparelho do app anterior.
  const AV_K = {ep: 'espelhos-endpoint', av: 'espelhos-avisos', genio: 'espelhos-genio', cacheAntigo: 'espelhos-cache'};
  const AV_MAX = 40;                         // buscas salvas por aparelho (o servidor responde limite_buscas)
  // WhatsApp do Gênio: o build pode pôr em CFG.genio (como a chave do aviso); sem ele, o WhatsApp abre com a mensagem
  // pronta e o corretor escolhe a conversa do Gênio
  const avGenioWa = n => /^\d{10,15}$/.test(String(n || '')) ? String(n) : '';
  const AV_INFO = svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.01"/>', 2);
  const AV_CODIGO = 'Esse código não vale mais. Digite o código novo do time.';
  const AV = {reg: null, epAtivo: null, epPr: null, ep: null, st: null, buscas: null, buscasEm: 0, carregando: null, erroBuscas: false, resumo8: null,
    admin: false, excluir: null, msg: null, novo: null, marc: null, marcQ: '', memo: null, descBase: null};
  const EN = {sel: [], fic: [], mer: [], em: 0, carregando: null, erro: false, excluir: null, q: '', genio: null, vinc: null};
  const RS = {cache: new Map(), f: 'tudo', dia: null};
  const avEsq = (...hs) => '<div class="esqueleto" aria-busy="true">' + hs.map(h => '<div class="brilho" style="height:' + h + 'px"></div>').join('') + '</div>';
  const avListaE = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];
  const avListaOu = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' ou ' + a[a.length - 1];
  const avKm = v => (+v).toLocaleString('pt-BR', {maximumFractionDigits: 1}) + ' km';
  const avTroca = (sel, html) => { const b = $(sel); if(b && b._avHtml !== html){ b.innerHTML = html; b._avHtml = html; } };
  const avNaTela = h => location.hash === h;

  // ---------- notificação neste aparelho (a mesma assinatura do app anterior e da central) ----------
  const avSuporta = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const avIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const avInstalado = () => { try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }catch(e){ return false; } };
  const avPerm = () => { try{ return 'Notification' in window ? Notification.permission : 'nada'; }catch(e){ return 'nada'; } };
  const avAte = (pr, ms) => Promise.race([Promise.resolve(pr).catch(() => null), new Promise(r => setTimeout(() => r(null), ms))]);
  const avErro = m => { const e = new Error(m); e.amigavel = true; return e; };
  function avB64u(s){ const p = '='.repeat((4 - s.length % 4) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); }
  async function avReg(ms){   // registro do service worker; sem ele (fora do https, por exemplo) devolve null sem travar a tela
    if(AV.reg) return AV.reg;
    if(!('serviceWorker' in navigator)) return null;
    const r = await avAte(navigator.serviceWorker.ready, ms || 4000);
    if(r) AV.reg = r;
    return r;
  }
  async function avAssinatura(ms){
    if(!avSuporta()) return null;
    const r = await avReg(ms); if(!r || !r.pushManager) return null;
    try{ return await r.pushManager.getSubscription(); }catch(e){ return null; }
  }
  function avPrefs(){ try{ const o = JSON.parse(LS.get(AV_K.av) || 'null'); return o && Array.isArray(o.projs) ? o : null; }catch(e){ return null; } }
  // sem escolha salva, vale a mesma de saída do app anterior: os projetos da casa, fora das construtoras parceiras
  const AV_PADRAO = ['consolacao', 'sumare', 'raj-mendes', 'raj-2', 'nex-bela-cintra'];
  const avProjs = () => { const o = avPrefs(); return o ? o.projs.filter(x => typeof x === 'string' && x) : AV_PADRAO.filter(id => S.byId.has(id)); };
  const avGravarProjs = ids => LS.set(AV_K.av, JSON.stringify({projs: [...new Set(ids)]}));
  async function avInscrever(sub){
    const j = sub.toJSON(), k = j.keys || {};
    if(!j.endpoint || !k.p256dh || !k.auth) throw avErro('Não consegui ligar os avisos neste aparelho. Desligue e ligue de novo.');
    return rpc('inscrever', {p_codigo: S.cod, p_endpoint: j.endpoint, p_p256dh: k.p256dh, p_auth: k.auth, p_projetos: avProjs(), p_apelido: null});
  }
  // endereço do aviso deste aparelho; se o navegador trocou, leva as buscas salvas do endereço velho para o novo.
  // Uma consulta por vez: duas telas pedindo juntas não fazem a troca duas vezes.
  function avEndpoint(){
    if(!AV.epPr) AV.epPr = avEndpointJa().finally(() => { AV.epPr = null; });
    return AV.epPr;
  }
  async function avEndpointJa(){
    if(!avSuporta() || avPerm() !== 'granted'){ AV.epAtivo = null; return null; }
    const s = await avAssinatura(1500); if(!s){ AV.epAtivo = null; return null; }
    const velho = LS.get(AV_K.ep);
    if(velho && velho !== s.endpoint && S.cod){ try{ await rpc('busca_migrar', {p_codigo: S.cod, p_de: velho, p_para: s.endpoint}); }catch(e){} }
    LS.set(AV_K.ep, s.endpoint); AV.epAtivo = s.endpoint;
    return s.endpoint;
  }
  async function avEstado(){
    const suporta = avSuporta(), perm = avPerm();
    const ep = suporta && perm === 'granted' ? await avEndpoint() : null;
    if(!ep) AV.epAtivo = null;
    return {suporta, perm, ativo: !!ep, ep, ios: avIOS(), instalado: avInstalado()};
  }
  const avPedirPermissao = () => new Promise(res => { try{ const p = Notification.requestPermission(res); if(p && p.then) p.then(res, () => res('denied')); }catch(e){ res('denied'); } });
  // pede a permissão (primeira espera: precisa estar no toque), assina e registra este aparelho no servidor
  async function avLigar(){
    if(!avSuporta()) throw avErro(avIOS() && !avInstalado() ? 'No iPhone, o aviso só funciona com o app instalado. No Safari, toque em Compartilhar, escolha Adicionar à Tela de Início e abra o app pelo ícone novo.' : 'Este navegador não aceita notificações. No Android, use o Chrome. No iPhone, o app instalado na Tela de Início.');
    if(!CFG.vapid) throw avErro('Os avisos ainda não estão configurados neste app.');
    const perm = await avPedirPermissao();
    if(perm !== 'granted') throw avErro('As notificações ficaram bloqueadas. Libere nas configurações do navegador para este site e tente de novo.');
    const r = await avReg(8000);
    if(!r || !r.pushManager) throw avErro('Não consegui ligar os avisos agora. Feche o app, abra de novo e tente outra vez.');
    let sub = await r.pushManager.getSubscription();
    if(!sub) sub = await r.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: avB64u(CFG.vapid)});
    const res = await avInscrever(sub);
    avGravarProjs(avProjs());
    AV.admin = !!(res && res.admin);
    const ep = (await avEndpoint()) || sub.endpoint;
    // os links já mandados deste aparelho passam a avisar aqui quando o cliente abrir (como na central)
    const d = dono();
    rpc('minhas_selecoes', {p_codigo: S.cod, p_dono: d, p_endpoint: ep}).catch(() => {});
    rpc('meus_links', {p_codigo: S.cod, p_dono: d, p_endpoint: ep}).catch(() => {});
    AV.buscasEm = 0; EN.em = 0;
    return {sub, ep, res};
  }
  async function avDesligar(){
    const s = await avAssinatura(3000), ep = (s && s.endpoint) || AV.epAtivo || LS.get(AV_K.ep);
    if(ep) await rpc('desinscrever', {p_endpoint: ep}).catch(() => {});
    if(s) await s.unsubscribe().catch(() => {});
    AV.epAtivo = null;
    return !!(s || ep);
  }

  // ---------- buscas salvas: carregar e conferir com as unidades livres de agora ----------
  function avCarregarBuscas(forcar){
    if(!S.cod) return Promise.resolve(null);
    if(AV.carregando) return AV.carregando;
    if(!forcar && AV.buscas && Date.now() - AV.buscasEm < 30000) return Promise.resolve(AV.buscas);
    AV.carregando = (async () => {
      try{
        const ep = (await avEndpoint()) || LS.get(AV_K.ep) || null;
        AV.ep = ep;
        if(!ep){ AV.buscas = []; AV.resumo8 = null; }
        else{
          const r = await rpc('meus_avisos', {p_codigo: S.cod, p_endpoint: ep});
          AV.buscas = r && Array.isArray(r.buscas) ? r.buscas.filter(b => b && b.id != null) : [];
          AV.resumo8 = !!(r && r.resumo);
        }
        AV.buscasEm = Date.now(); AV.erroBuscas = false; AV.memo = null;
      }catch(e){
        if(codigoInvalido(e)){ sair(AV_CODIGO); return null; }
        AV.erroBuscas = true;
      }finally{ AV.carregando = null; }
      avContador();
      return AV.buscas;
    })();
    return AV.carregando;
  }
  // o mesmo casamento do servidor (o do app anterior), sobre o índice de unidades livres do app
  const AV_TIPO = {S: 'studio', 1: '1', 2: '2', 3: '3', L: 'loja'};
  const AV_TIPO_ORD = ['studio', '1', '2', '3', 'loja'];
  const AV_TIPO_NOME = {studio: 'studios', 1: '1 dorm.', 2: '2 dorms', 3: '3 dorms ou +', loja: 'lojas'};
  const AV_FASE = {lanc: 'lançamento', obras: 'em obras', pronto: 'pronto para morar'};
  const avZona = z => z === 'centro' ? 'Centro' : z === 'gsp' ? 'Grande SP' : 'Zona ' + (ZONA[z] || z);
  const avFaseDe = p => p.fase === 'breve' ? 'lanc' : (p.fase || null);
  const avRegioes = c => c && Array.isArray(c.regioes) && c.regioes.length ? c.regioes : (c && c.regiao ? [c.regiao] : []);
  const avTemFiltro = c => !!(c && ((c.projetos && c.projetos.length) || (c.grupos && c.grupos.length) || (c.fases && c.fases.length) || (c.tipos && c.tipos.length) ||
    (c.zonas && c.zonas.length) || c.regiao || (c.regioes && c.regioes.length) || c.m2_min != null || c.m2_max != null || c.preco_max != null || c.andar_min != null || c.vaga_min || c.entrega_ate));
  function avCasaProj(c, p){
    if(c.projetos && c.projetos.length && !c.projetos.includes(p.id)) return false;
    if(c.grupos && c.grupos.length && !c.grupos.includes(p.grupo)) return false;
    if(c.fases && c.fases.length && !c.fases.includes(avFaseDe(p))) return false;
    if(c.zonas && c.zonas.length && !c.zonas.includes(p.zona)) return false;
    const rs = avRegioes(c);
    if(rs.length && !(p.lat != null && p.lng != null && rs.some(r => isFinite(+r.lat) && isFinite(+r.lng) && distKm({lat: +r.lat, lng: +r.lng}, p) <= (+r.raio || 3)))) return false;
    if(c.entrega_ate){
      if(c.entrega_ate === 'pronto'){ if(p.fase !== 'pronto') return false; }
      else if(p.fase !== 'pronto' && !(/^\d{4}-\d{2}/.test(p.entrega || '') && String(p.entrega).slice(0, 7) <= c.entrega_ate)) return false;
    }
    return true;
  }
  const avPrecoU = (u, modo) => { const a = modo === 'pv' ? u.pv : u.p, b = modo === 'pv' ? u.p : u.pv; return a > 0 ? a : (b > 0 ? b : null); };
  function avCasaU(c, u){
    if(c.m2_min != null || c.m2_max != null){ if(!(u.a > 0)) return false; if(c.m2_min != null && u.a < c.m2_min - 0.005) return false; if(c.m2_max != null && u.a > c.m2_max + 0.005) return false; }
    if(c.andar_min != null && (u.an || 0) < c.andar_min) return false;
    if(c.preco_max != null){ const v = avPrecoU(u, c.modo || 'pv'); if(!(v > 0) || v > c.preco_max) return false; }
    const loja = u.k === 'L', comercial = !!(c.tipos && c.tipos.includes('loja'));
    if(c.tipos && c.tipos.length && !c.tipos.includes(loja ? 'loja' : (u.k ? AV_TIPO[u.k] || 'outro' : null))) return false;
    if(c.sem_loja && loja && !comercial) return false;
    if(c.vaga_min && !((u.vg || 0) >= c.vaga_min)) return false;
    return true;
  }
  function avAchados(c){   // unidades livres agora que batem com a busca (null enquanto o índice de unidades não chega)
    if(!S.U || !c) return null;
    const out = [];
    for(const p of S.P){ if(!avCasaProj(c, p)) continue; for(const u of (S.U.get(p.id) || [])) if(avCasaU(c, u)) out.push({p, u}); }
    return out;
  }
  function avAchadosDe(b){
    if(!S.U) return null;
    if(!AV.memo || AV.memo.em !== S.Uem) AV.memo = {em: S.Uem, m: new Map()};
    const k = String(b.id);
    if(!AV.memo.m.has(k)) AV.memo.m.set(k, avAchados(b.criterios || {}) || []);
    return AV.memo.m.get(k);
  }
  function avPorProjeto(its){   // "Raj Mendes (12), Sumaré (4) e mais 3 projetos"
    const n = new Map(); for(const {p} of its) n.set(p, (n.get(p) || 0) + 1);
    const l = [...n.entries()].sort((a, b) => b[1] - a[1]), ver = l.slice(0, 3).map(([p, k]) => p.nome + ' (' + k + ')');
    return l.length > 3 ? ver.join(', ') + ' e mais ' + plural(l.length - 3, 'projeto', 'projetos') : avListaE(ver);
  }
  function avContador(){   // menu Mais: quantas buscas têm unidade livre agora
    const it = MAIS_X.find(i => i.aba === 'avisos'); if(!it) return;
    if(AV.descBase == null) AV.descBase = it.desc || '';
    const n = (AV.buscas || []).filter(b => { const a = avAchadosDe(b); return a && a.length; }).length;
    it.desc = AV.descBase + (n ? '. ' + (n === 1 ? '1 busca com unidade livre agora' : n + ' buscas com unidade livre agora') : '');
  }

  // ---------- o filtro do Imóveis no formato do servidor (o mesmo dos avisos do app anterior) ----------
  function avCritDoFiltro(f){
    f = f || S.f;
    const c = {modo: f.modo === 'pv' ? 'pv' : 'pp'}, fora = [], obs = [];
    const q = String(f.q || '').trim();
    if(q){   // a busca por texto vira a lista dos projetos que batem com ela, como no app anterior
      const base = Object.assign(F0(), {q, livres: false});
      const ids = S.P.filter(p => passaP(p, base)).map(p => p.id);
      if(ids.length){ c.projetos = ids; obs.push('A busca “' + q + '” vira a lista ' + (ids.length === 1 ? 'do projeto que bate' : 'dos ' + ids.length + ' projetos que batem') + ' com ela hoje. Projeto que entrar depois com esse nome fica de fora.'); }
      else fora.push('A busca “' + q + '”, porque nenhum projeto bate com ela');
    }
    if(f.cons && f.cons.length) c.grupos = f.cons.slice();
    if(f.fases && f.fases.length){
      const fs = [...new Set(f.fases.map(x => x === 'breve' ? 'lanc' : x))].filter(x => AV_FASE[x]);
      if(fs.length) c.fases = fs;
      if(f.fases.includes('breve') && !f.fases.includes('lanc')) obs.push('Breve lançamento entra junto com Lançamento.');
    }
    if(f.zonas && f.zonas.length) c.zonas = f.zonas.slice();
    if(f.bairros && f.bairros.length){   // o servidor procura por distância: cada bairro vira um raio em volta dos projetos dele
      const rs = [], sem = [];
      for(const b of f.bairros){
        const ps = S.P.filter(p => p.bairro === b && p.lat != null && p.lng != null);
        if(!ps.length){ sem.push(b); continue; }
        const lat = ps.reduce((s, p) => s + p.lat, 0) / ps.length, lng = ps.reduce((s, p) => s + p.lng, 0) / ps.length;
        const mx = Math.max(0, ...ps.map(p => distKm({lat, lng}, p)));
        rs.push({nome: b, lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5, raio: Math.min(5, Math.max(1.5, Math.ceil((mx + 0.3) * 2) / 2))});
      }
      const usa = rs.slice(0, 8);
      if(usa.length === 1) c.regiao = usa[0]; else if(usa.length > 1) c.regioes = usa;
      if(usa.length) obs.push((usa.length === 1 ? 'O bairro vira um raio' : 'Cada bairro vira um raio') + ' em volta dos projetos dele: ' + usa.map(r => r.nome + ' até ' + avKm(r.raio)).join(', ') + '. Projeto novo que aparecer perto também entra.');
      if(rs.length > 8) fora.push('Os bairros depois do oitavo: ' + avListaE(rs.slice(8).map(r => r.nome)));
      if(sem.length) fora.push((sem.length === 1 ? 'O bairro ' : 'Os bairros ') + avListaE(sem) + ', sem localização no app');
    }
    if(f.perto) fora.push('Perto de você: a sua localização não sai deste aparelho. Para o aviso procurar na região, marque o bairro no filtro');
    if(f.ent === 'pronto') c.entrega_ate = 'pronto'; else if(/^\d{4}$/.test(f.ent || '')) c.entrega_ate = f.ent + '-12';
    if(f.tipos && f.tipos.length){ const ts = [...new Set(f.tipos.map(k => AV_TIPO[k]).filter(Boolean))]; if(ts.length) c.tipos = ts; }
    if(!(f.tipos || []).includes('L')) c.sem_loja = true;
    let a = +f.amin || 0, b = +f.amax || 0; if(a && b && a > b) [a, b] = [b, a];
    if(a) c.m2_min = a; if(b) c.m2_max = b;
    if(f.pmax) c.preco_max = +f.pmax;
    if(f.pmin) fora.push('O preço mínimo de ' + BRLc(f.pmin) + ': o aviso guarda só o preço máximo');
    if(f.m2) fora.push('O preço por m² até ' + BRLc(f.m2));
    if(f.andar) c.andar_min = +f.andar;
    if(f.vaga) c.vaga_min = +f.vaga;
    if(f.cats && f.cats.length) fora.push('O enquadramento: ' + avListaE(f.cats.map(k => (CATS.find(x => x[0] === k) || [k, k])[1])));
    if(f.extras && f.extras.length) fora.push('Os extras da unidade: ' + avListaE(f.extras.map(k => (EXTRAS.find(x => x[0] === k) || [k, k])[1])));
    if(f.mov) fora.push(f.mov === 'hoje' ? 'O filtro Mexeu hoje' : 'O filtro Vendeu na semana');
    if(typeof bolsoChip === 'function' && (f.be || f.bm || f.bf)){ const t = bolsoChip(f); fora.push('A busca pelo bolso: ' + t.charAt(0).toLowerCase() + t.slice(1)); }
    return {c, fora, obs};
  }
  function avNomesProjs(ids){   // construtora inteira vira "Vitacon (todos)"
    const out = [], usados = new Set(), porG = {};
    for(const p of S.P) if(p.grupo) (porG[p.grupo] = porG[p.grupo] || []).push(p.id);
    for(const g in porG) if(porG[g].length > 1 && porG[g].every(id => ids.includes(id))){ out.push(nomeGrupo(g) + ' (todos)'); porG[g].forEach(id => usados.add(id)); }
    for(const id of ids){ if(usados.has(id)) continue; const p = S.byId.get(id); out.push(p ? p.nome : String(id)); }
    return out;
  }
  function avCritTexto(c, comLojas){   // o que a busca procura, em português corrido
    if(!c) return '';
    const P = [], proj = !!(c.projetos && c.projetos.length), gr = !!(c.grupos && c.grupos.length);
    if(proj){ const n = avNomesProjs(c.projetos); P.push(n.length > 5 ? n.slice(0, 4).join(', ') + ' e mais ' + plural(n.length - 4, 'projeto', 'projetos') : avListaE(n)); }
    if(gr && !(proj && c.projetos.every(id => { const p = S.byId.get(id); return p && c.grupos.includes(p.grupo); }))) P.push('só ' + avListaE(c.grupos.map(nomeGrupo)));
    if(!proj && !gr) P.push('todos os projetos');
    const rs = avRegioes(c);
    if(rs.length){
      const r0 = +rs[0].raio || 3, mesmo = rs.every(r => (+r.raio || 3) === r0), nm = r => String(r.nome || 'um ponto no mapa');
      P.push('perto de ' + (mesmo ? avListaOu(rs.map(nm)) + ' (até ' + avKm(r0) + ')' : avListaOu(rs.map(r => nm(r) + ' (até ' + avKm(+r.raio || 3) + ')'))));
    }
    if(c.zonas && c.zonas.length) P.push(avListaOu(c.zonas.map(avZona)));
    if(c.fases && c.fases.length) P.push(avListaOu(c.fases.map(x => AV_FASE[x] || x)));
    if(c.entrega_ate) P.push(c.entrega_ate === 'pronto' ? 'pronto para morar' : 'chaves até ' + mesAnoCurto(c.entrega_ate));
    if(c.tipos && c.tipos.length) P.push(avListaOu(AV_TIPO_ORD.filter(t => c.tipos.includes(t)).map(t => AV_TIPO_NOME[t])));
    else if(comLojas && c.sem_loja) P.push('sem lojas');
    if(c.m2_min != null && c.m2_max != null) P.push('de ' + fmtM2(c.m2_min).replace(' m²', '') + ' a ' + fmtM2(c.m2_max));
    else if(c.m2_min != null) P.push('a partir de ' + fmtM2(c.m2_min)); else if(c.m2_max != null) P.push('até ' + fmtM2(c.m2_max));
    if(c.preco_max != null) P.push('até ' + BRLc(c.preco_max) + ((c.modo || 'pv') === 'pv' ? ' à vista' : ' pela tabela'));
    if(c.andar_min != null) P.push('do ' + c.andar_min + 'º andar para cima');
    if(c.vaga_min) P.push(c.vaga_min > 1 ? 'com ' + c.vaga_min + ' vagas ou mais' : 'com vaga');
    return maiusc1(P.join(', ')).replace(/R\$ /g, 'R$\u00a0') + '.';
  }

  // ---------- tela Avisos ----------
  ROTAS.push([/^#\/avisos$/, 'avisos', () => avTela()]);
  function avTela(){
    AV.excluir = null;
    pos.push(() => avPintar());
    return '<header class="pg-cab"><div><h1 class="t-1">Avisos</h1><p class="sub">Notificações neste aparelho e as buscas salvas dos seus clientes.</p></div></header>' +
      '<div class="av-grade"><div class="av-col">' +
      '<section class="caixa" id="av-push" aria-labelledby="av-push-t">' + avPushSecao(null) + '</section>' +
      '<section class="caixa" id="av-projs" aria-labelledby="av-projs-t">' + avProjsSecao(null) + '</section>' +
      '<section class="caixa" id="av-r8" aria-labelledby="av-r8-t">' + avResumo8Secao(null) + '</section>' +
      '</div><div class="av-col"><section class="caixa" id="av-buscas" aria-labelledby="av-buscas-t">' + avBuscasSecao(null) + '</section></div></div>';
  }
  async function avPintar(){
    const st = await avEstado();
    if(!avNaTela('#/avisos')) return;
    AV.st = st;
    avTroca('#av-push', avPushSecao(st)); avTroca('#av-projs', avProjsSecao(st)); avTroca('#av-r8', avResumo8Secao(st)); avTroca('#av-buscas', avBuscasSecao(st));
    await avCarregarBuscas(true);
    if(!avNaTela('#/avisos')) return;
    avTroca('#av-r8', avResumo8Secao(AV.st)); avTroca('#av-buscas', avBuscasSecao(AV.st));
    if(!S.U && !S.Uerro) carregarUnidades().then(() => { if(avNaTela('#/avisos')){ avTroca('#av-buscas', avBuscasSecao(AV.st)); avContador(); } });
  }
  function avPushSecao(st){
    const t = '<h2 class="t-3" id="av-push-t">Avisos neste aparelho</h2>';
    if(!st) return t + avEsq(22, 66);
    const m = AV.msg; AV.msg = null;   // o retorno do último toque aparece uma vez
    const msg = m ? '<div class="aviso' + (m.ok ? ' ok' : ' erro') + '" role="status">' + (m.ok ? ICO.ok : AV_INFO) + '<p>' + esc(m.t) + '</p></div>' : '';
    const estado = (cls, txt) => '<p class="av-estado' + (cls ? ' ' + cls : '') + '"><span class="av-ponto" aria-hidden="true"></span>' + esc(txt) + '</p>';
    if(!st.suporta){
      if(st.ios && !st.instalado) return t + estado('', 'Falta instalar o app') + '<p class="texto-2">No iPhone, o aviso só chega com o app instalado na Tela de Início.</p>' +
        '<ol class="av-passos"><li>Abra este endereço no Safari.</li><li>Toque em Compartilhar, o quadrado com a seta para cima.</li><li>Escolha Adicionar à Tela de Início e confirme.</li><li>Abra o app pelo ícone novo e volte aqui para ligar os avisos.</li></ol>' + msg;
      return t + estado('', 'Sem avisos neste navegador') + '<p class="texto-2">Este navegador não aceita notificações. No Android, use o Chrome. No computador, o Chrome, o Edge ou o Firefox.</p>' + msg;
    }
    if(st.perm === 'denied') return t + estado('bloq', 'Bloqueados neste navegador') + '<p class="texto-2">As notificações deste site estão bloqueadas. Libere nas configurações do navegador, no cadeado ao lado do endereço ou nos ajustes do app, e volte aqui.</p>' + msg;
    if(st.ativo) return t + estado('ligado', 'Ligados neste aparelho') +
      '<p class="texto-2">Chega um aviso a cada venda, reserva ou liberação nos projetos que você acompanha, quando aparecer unidade de uma busca salva e quando o cliente abrir um link seu.</p>' +
      (S.admin ? '<p class="nota">Com o código de administrador, chegam também os alertas do robô.</p>' : '') + msg +
      '<div class="btn-linha"><button type="button" class="btn" data-acao="av-teste">Mandar um teste</button><button type="button" class="btn" data-acao="av-desligar">Desligar</button></div>';
    return t + estado('', 'Desligados neste aparelho') +
      '<p class="texto-2">Ligue para receber no celular um aviso a cada venda, reserva ou unidade liberada, quando aparecer unidade das buscas dos seus clientes e quando o cliente abrir um link seu.</p>' + msg +
      '<button type="button" class="btn btn-pri btn-alto" data-acao="av-ligar">' + IX.sino + 'Ligar os avisos</button>' +
      '<p class="nota">O navegador vai pedir sua permissão. O aviso chega só neste aparelho.</p>';
  }
  function avProjsSecao(st){
    const ids = avProjs().filter(id => S.byId.has(id)), nomes = ids.map(id => S.byId.get(id).nome);
    return '<h2 class="t-3" id="av-projs-t">Projetos que você acompanha</h2>' +
      '<p class="texto-2">' + esc(ids.length ? plural(ids.length, 'projeto marcado', 'projetos marcados') + ': ' + (nomes.length > 4 ? nomes.slice(0, 4).join(', ') + ' e mais ' + (nomes.length - 4) : avListaE(nomes)) + '.'
        : 'Nenhum projeto marcado. Assim chegam só os avisos das buscas salvas, dos links que você mandou e o resumo das 8h.') + '</p>' +
      '<p class="nota">A cada venda, reserva ou unidade liberada nesses projetos, chega um aviso' + (st && !st.ativo ? ', quando os avisos estiverem ligados' : '') + '.</p>' +
      '<button type="button" class="btn" data-acao="av-projs">Escolher os projetos</button>';
  }
  function avResumo8Secao(st){
    const pode = !!(st && st.ativo && AV.resumo8 != null);
    return '<h2 class="t-3" id="av-r8-t">Resumo das 8h</h2>' +
      '<p class="texto-2">Todo dia às 8h chega no celular o que aconteceu na véspera: vendas, reservas, unidades liberadas e quanto está livre em cada projeto.</p>' +
      '<div class="seg av-seg" role="group" aria-label="Resumo das 8h neste aparelho">' + [['1', 'Receber'], ['0', 'Não receber']].map(x =>
        '<button type="button" data-acao="av-resumo8" data-v="' + x[0] + '" aria-pressed="' + (pode && (x[0] === '1') === AV.resumo8) + '"' + (pode ? '' : ' disabled') + '>' + x[1] + '</button>').join('') + '</div>' +
      (st && !st.ativo ? '<p class="nota">Ligue os avisos primeiro.</p>' : '') +
      '<a class="link-mais" href="#/resumo">Ver o resumo do dia ' + ICO.seta + '</a>';
  }
  function avBuscasSecao(st){
    const bs = AV.buscas, atual = avCritDoFiltro(S.f), temAtual = avTemFiltro(atual.c);
    let h = '<div class="sec-cab"><h2 class="t-3" id="av-buscas-t">Buscas salvas</h2>' + (bs ? '<span class="sub">' + bs.length + ' de ' + AV_MAX + '</span>' : '') + '</div>' +
      '<p class="texto-2">Quando uma unidade com o filtro do cliente ficar livre em qualquer projeto (reserva que caiu, distrato ou liberação), chega um aviso na hora, com o nome do cliente.</p>' +
      '<div class="av-atual"><p class="rotulo">Filtro de agora no Imóveis</p><p class="texto-2">' + esc(temAtual ? avCritTexto(atual.c) : 'Vazio. Escolha no Imóveis o que o cliente procura.') + '</p>' +
      '<button type="button" class="btn btn-pri" data-acao="av-salvar-f"' + (temAtual ? '' : ' disabled') + '>' + IX.sino + 'Salvar este filtro</button>' +
      '<a class="link-mais" href="#/imoveis">' + (temAtual ? 'Mudar o filtro no Imóveis' : 'Escolher o filtro no Imóveis') + ' ' + ICO.seta + '</a></div>';
    if(st && st.suporta && st.perm !== 'denied' && !st.ativo)
      h += '<div class="aviso">' + AV_INFO + '<p>' + (AV.ep && bs && bs.length ? 'Os avisos estão desligados neste aparelho. As buscas abaixo só avisam com eles ligados.' : 'Este aparelho ainda não recebe avisos. Dá para salvar mesmo assim: na hora, o app pede para ligar as notificações. O aviso chega no aparelho onde a busca foi salva.') + '</p></div>';
    if(!bs) return h + (AV.erroBuscas ? '<p class="erro-txt">Não consegui abrir as buscas salvas agora. Confira a internet.</p>' : avEsq(110, 110));
    if(!bs.length) return h + '<div class="vazio"><p class="texto-2">Nenhuma busca salva neste aparelho. No Imóveis, escolha o filtro do cliente e toque em Me avisa.</p></div>';
    return h + '<ul class="av-buscas">' + bs.map(avBuscaHtml).join('') + '</ul>';
  }
  function avBuscaHtml(b){
    const ach = avAchadosDe(b), id = String(b.id), conf = AV.excluir === id, ult = Date.parse(b.ultimo_aviso || '');
    const sub = +b.avisos ? plural(+b.avisos, 'aviso', 'avisos') + (isFinite(ult) ? ', o último ' + quandoMontado(ult) : '') : 'Nenhum aviso ainda';
    const agora = ach == null ? 'Conferindo as unidades livres…' : ach.length ? plural(ach.length, 'unidade livre', 'unidades livres') + ' agora: ' + avPorProjeto(ach) + '.' : 'Nenhuma livre agora. O aviso chega quando aparecer.';
    return '<li class="av-busca"><div class="av-busca-cab"><b>' + esc(b.cliente || 'Cliente sem nome') + '</b><span class="sub">' + esc(sub) + '</span></div>' +
      '<p class="texto-2">' + esc(avCritTexto(b.criterios || {})) + '</p><p class="av-agora' + (ach && ach.length ? ' tem' : '') + '">' + esc(agora) + '</p>' +
      '<div class="av-acoes">' + (ach && ach.length ? '<button type="button" class="btn btn-peq btn-fino" data-acao="av-unidades" data-id="' + esc(id) + '">Ver as unidades</button>' : '') +
      (conf ? '<button type="button" class="btn btn-peq av-perigo" data-acao="av-excluir" data-id="' + esc(id) + '">Confirmar a exclusão</button><button type="button" class="btn btn-peq btn-fino" data-acao="av-ex-cancelar">Cancelar</button>'
        : '<button type="button" class="btn btn-peq btn-fino" data-acao="av-excluir" data-id="' + esc(id) + '" aria-label="Excluir a busca de ' + esc(b.cliente || 'cliente') + '">Excluir</button>') + '</div></li>';
  }
  const avRepintarBuscas = () => { if(avNaTela('#/avisos')) avTroca('#av-buscas', avBuscasSecao(AV.st)); };
  // índice de unidades novo: as contagens de "livres agora" das buscas acompanham (a tela não é repintada sozinha)
  const _avCarregarUnidades = carregarUnidades;
  carregarUnidades = function(){
    const r = _avCarregarUnidades.apply(this, arguments);
    Promise.resolve(r).then(() => { if(AV.buscas){ avContador(); if(!document.querySelector('dialog[open]')) avRepintarBuscas(); } }).catch(() => {});
    return r;
  };

  ACOES_X['av-ligar'] = async el => {
    el.disabled = true;
    try{
      const r = await avLigar();
      await rpc('testar_aviso', {p_codigo: S.cod, p_endpoint: r.ep}).catch(() => {});
      AV.msg = {ok: true, t: 'Avisos ligados neste aparelho' + (AV.admin ? '. Com o código de administrador, chegam também os alertas do robô' : '') + '. Mandamos um aviso de teste: deve chegar em alguns segundos.'};
    }catch(e){
      if(codigoInvalido(e)){ sair(AV_CODIGO); return; }
      AV.msg = {ok: false, t: e && e.amigavel ? e.message : 'Não consegui ligar os avisos agora. Confira a internet e tente de novo.'};
    }
    if(avNaTela('#/avisos')) avPintar(); else { el.disabled = false; toast(AV.msg.t, 5000); AV.msg = null; }
  };
  ACOES_X['av-teste'] = async el => {
    const ep = await avEndpoint();
    if(!ep){ toast('Os avisos estão desligados neste aparelho.'); return; }
    el.disabled = true;
    try{ await rpc('testar_aviso', {p_codigo: S.cod, p_endpoint: ep}); toast('Teste mandado. Deve chegar em alguns segundos.', 4000); }
    catch(e){ if(codigoInvalido(e)){ sair(AV_CODIGO); return; } toast('Não consegui mandar o teste agora.'); }
    el.disabled = false;
  };
  ACOES_X['av-desligar'] = async el => {
    el.disabled = true;
    await avDesligar();
    AV.msg = {ok: true, t: 'Avisos desligados neste aparelho.'};
    AV.buscasEm = 0;
    if(avNaTela('#/avisos')) avPintar();
  };
  ACOES_X['av-resumo8'] = async el => {
    const v = el.dataset.v === '1'; if(AV.resumo8 === v) return;
    const ep = await avEndpoint();
    if(!ep){ toast('Ligue os avisos primeiro.'); return; }
    const antes = AV.resumo8; AV.resumo8 = v; avTroca('#av-r8', avResumo8Secao(AV.st));
    try{ await rpc('preferencias', {p_codigo: S.cod, p_endpoint: ep, p_resumo: v}); toast(v ? 'Você vai receber o resumo todo dia às 8h.' : 'Resumo das 8h desligado neste aparelho.'); }
    catch(e){ if(codigoInvalido(e)){ sair(AV_CODIGO); return; } AV.resumo8 = antes; avTroca('#av-r8', avResumo8Secao(AV.st)); toast('Não consegui salvar agora.'); }
  };
  ACOES_X['av-excluir'] = async el => {
    const id = String(el.dataset.id || '');
    if(AV.excluir !== id){ AV.excluir = id; avRepintarBuscas(); const b = $('#av-buscas [data-acao="av-excluir"][data-id="' + CSS.escape(id) + '"]'); if(b) b.focus(); return; }
    const b = (AV.buscas || []).find(x => String(x.id) === id);
    el.disabled = true;
    try{
      await rpc('busca_remover', {p_codigo: S.cod, p_endpoint: AV.ep || LS.get(AV_K.ep), p_id: b ? b.id : id});
      AV.buscas = (AV.buscas || []).filter(x => String(x.id) !== id);
      toast('Busca de ' + ((b && b.cliente) || 'cliente') + ' excluída.');
    }catch(e){ if(codigoInvalido(e)){ sair(AV_CODIGO); return; } toast('Não consegui excluir agora.'); }
    AV.excluir = null; AV.memo = null; avRepintarBuscas(); avContador();
    avCarregarBuscas(true).then(avRepintarBuscas);
  };
  ACOES_X['av-ex-cancelar'] = () => { AV.excluir = null; avRepintarBuscas(); };
  ACOES_X['av-unidades'] = el => {   // as unidades livres que batem com a busca, da mais em conta para a mais cara
    const b = (AV.buscas || []).find(x => String(x.id) === String(el.dataset.id)); if(!b) return;
    const c = b.criterios || {}, modo = c.modo || 'pv', ach = (avAchadosDe(b) || []).slice();
    ach.sort((x, y) => (avPrecoU(x.u, modo) || 1e12) - (avPrecoU(y.u, modo) || 1e12));
    const por = new Map(); for(const x of ach.slice(0, 80)){ if(!por.has(x.p.id)) por.set(x.p.id, []); por.get(x.p.id).push(x); }
    abrirFolha('av-un', 'Unidades para ' + (b.cliente || 'o cliente'),
      '<p class="texto-2">' + esc(plural(ach.length, 'unidade livre bate', 'unidades livres batem') + ' com a busca agora. Toque na unidade para abrir a ficha dela.') + '</p>' +
      '<div class="env-lista">' + [...por.values()].map(g => '<div class="env-grupo"><p class="env-g-t">' + miniProj(g[0].p, 'peq') + '<b>' + esc(g[0].p.nome) + '</b><span>' + esc(plural(g.length, 'unidade', 'unidades')) + '</span></p>' +
        g.map(x => { const v = avPrecoU(x.u, modo); return '<a class="env-u av-un" href="#/tabelas/' + esc(x.p.id) + '" data-acao="av-un" data-p="' + esc(x.p.id) + '" data-n="' + esc(x.u.n) + '"><span class="num"><b>' + esc(x.u.n) + '</b></span>' +
          '<span>' + esc([tipoNome(x.u.k), x.u.a ? fmtM2(x.u.a) : '', andarCurto(x.u.at)].filter(Boolean).join(', ')) + '</span><span class="num ouro">' + (v ? esc(BRLc(v)) : '') + '</span></a>'; }).join('') + '</div>').join('') + '</div>' +
      (ach.length > 80 ? '<p class="nota">Mostrando as 80 mais em conta.</p>' : ''), '', 'folha-alta');
  };
  ACOES_X['av-un'] = el => { S.abrirUnidade = {pid: el.dataset.p, n: el.dataset.n}; };   // a folha da unidade abre quando a tabela carregar

  // ---------- projetos acompanhados (p_projetos do inscrever, guardados em espelhos-avisos) ----------
  ACOES_X['av-projs'] = () => {
    AV.marc = new Set(avProjs().filter(id => S.byId.has(id))); AV.marcQ = '';
    abrirFolha('av-projs', 'Projetos que você acompanha',
      '<p class="texto-2">A cada venda, reserva ou unidade liberada nos projetos marcados, chega um aviso neste aparelho.</p>' +
      '<label class="busca mini av-pbusca"><span class="sr">Buscar projeto</span>' + ICO.lupa + '<input id="av-pq" type="search" autocomplete="off" placeholder="Projeto, construtora ou bairro" data-input="av-pq"></label>' +
      '<div class="av-pbar"><p class="sub" id="av-pn" aria-live="polite"></p><button type="button" class="link-mais" data-acao="av-ptodos">Marcar todos</button><button type="button" class="link-mais" data-acao="av-plimpar">Limpar</button></div>' +
      '<div class="av-plista" id="av-plista"></div>',
      '<button type="button" class="btn btn-pri btn-alto" data-acao="av-psalvar">Salvar</button>', 'folha-alta');
    avPLista();
  };
  function avPVisiveis(){
    const termos = norm(AV.marcQ).split(/\s+/).filter(Boolean);
    return S.P.filter(p => !termos.length || termos.every(t => norm([p.nome, p.curto, p.bairro, quemDe(p), p.grupo ? nomeGrupo(p.grupo) : ''].join(' ')).includes(t)));
  }
  function avPLista(){
    const box = $('#av-plista'); if(!box || !AV.marc) return;
    const por = new Map();
    for(const p of avPVisiveis()){ const g = p.grupo || '_'; if(!por.has(g)) por.set(g, []); por.get(g).push(p); }
    const ordem = gruposPresentes().filter(g => por.has(g)).concat(por.has('_') ? ['_'] : []);
    box.innerHTML = ordem.map(g => {
      const ps = por.get(g).sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR')), n = ps.filter(p => AV.marc.has(p.id)).length, nome = g === '_' ? 'Outros' : nomeGrupo(g);
      return '<div class="av-pgrupo" role="group" aria-label="' + esc(nome) + '"><div class="av-pg-cab"><span>' + esc(nome) + '<span class="n">' + n + ' de ' + ps.length + '</span></span>' +
        '<button type="button" class="link-mais" data-acao="av-pgrupo">' + (n === ps.length ? 'Desmarcar' : 'Marcar todos') + '</button></div><div class="u-opcs av-opcs">' +
        ps.map(p => '<label class="u-opc"><input type="checkbox" data-input="av-pck" value="' + esc(p.id) + '"' + (AV.marc.has(p.id) ? ' checked' : '') + '><span class="u-opc-t"><b>' + esc(p.nome) + '</b>' +
          '<span>' + esc([p.bairro, p.livres ? plural(p.livres, 'livre', 'livres') : 'esgotado'].filter(Boolean).join(', ')) + '</span></span></label>').join('') + '</div></div>';
    }).join('') || '<p class="texto-2">Nenhum projeto com esse nome.</p>';
    avPConta();
  }
  function avPGrupoConta(box){
    const is = $$('input[data-input="av-pck"]', box), n = is.filter(i => i.checked).length;
    const s = box.querySelector('.av-pg-cab .n'); if(s) s.textContent = n + ' de ' + is.length;
    const bt = box.querySelector('[data-acao="av-pgrupo"]'); if(bt) bt.textContent = n === is.length ? 'Desmarcar' : 'Marcar todos';
  }
  function avPConta(){ const n = $('#av-pn'); if(n && AV.marc) n.textContent = AV.marc.size ? plural(AV.marc.size, 'projeto marcado', 'projetos marcados') : 'Nenhum projeto marcado'; }
  function avPMarcar(caixas, on){   // marca ou desmarca as caixas sem repintar a lista (guarda a rolagem e o foco)
    for(const i of caixas){ i.checked = on; if(on) AV.marc.add(i.value); else AV.marc.delete(i.value); }
    $$('#av-plista .av-pgrupo').forEach(avPGrupoConta); avPConta();
  }
  INPUTS_X['av-pq'] = (el, ev, tipo) => { if(tipo !== 'input') return; AV.marcQ = el.value; depois('av-pq', 120, avPLista); };
  INPUTS_X['av-pck'] = el => {
    if(!AV.marc) return;
    if(el.checked) AV.marc.add(el.value); else AV.marc.delete(el.value);
    const box = el.closest('.av-pgrupo'); if(box) avPGrupoConta(box);
    avPConta();
  };
  ACOES_X['av-pgrupo'] = el => { const box = el.closest('.av-pgrupo'); if(!box || !AV.marc) return; const is = $$('input[data-input="av-pck"]', box); avPMarcar(is, !is.every(i => i.checked)); };
  ACOES_X['av-ptodos'] = () => { if(AV.marc) avPMarcar($$('#av-plista input[data-input="av-pck"]'), true); };
  ACOES_X['av-plimpar'] = () => { if(AV.marc) avPMarcar($$('#av-plista input[data-input="av-pck"]'), false); };
  ACOES_X['av-psalvar'] = async el => {
    if(!AV.marc) return;
    avGravarProjs([...AV.marc].concat(avProjs().filter(id => !S.byId.has(id))));   // projeto que saiu dos espelhos fica como estava
    el.disabled = true;
    const s = avPerm() === 'granted' ? await avAssinatura(2500) : null;
    if(s){
      try{ await avInscrever(s); toast('Projetos salvos. Os avisos já valem para eles.'); }
      catch(e){
        if(codigoInvalido(e)){ fecharFolhas(); sair(AV_CODIGO); return; }
        el.disabled = false; toast('Salvei neste aparelho, mas não consegui avisar o servidor. Tente de novo em instantes.', 5000); return;
      }
    }else toast('Projetos salvos. Valem quando os avisos estiverem ligados.');
    fecharFolhas();
    if(avNaTela('#/avisos')) avTroca('#av-projs', avProjsSecao(AV.st));
  };

  // ---------- "Me avisa quando aparecer": o filtro do Imóveis vira uma busca salva (busca_salvar) ----------
  ACOES_X['av-salvar-f'] = () => avAbrirSalvar();
  function avAbrirSalvar(){
    const r = avCritDoFiltro(S.f); AV.novo = r;
    const lista = a => '<ul>' + a.map(t => '<li>' + esc(t) + '.</li>').join('') + '</ul>';
    if(!avTemFiltro(r.c)){
      abrirFolha('av-busca', 'Me avisa quando aparecer', '<div class="vazio"><h3 class="t-3">' + (r.fora.length ? 'Esse filtro não vira aviso' : 'Escolha o filtro primeiro') + '</h3>' +
        (r.fora.length ? '<div class="texto-2 av-fora">' + lista(r.fora) + '</div>' : '') +
        '<p class="texto-2">No Imóveis, marque o que o cliente procura (região, tipologia, metragem, preço ou entrega) e toque em Me avisa.</p>' +
        (avNaTela('#/imoveis') ? '' : '<a class="btn" href="#/imoveis">Abrir o Imóveis</a>') + '</div>', '');
      return;
    }
    const ach = avAchados(r.c);
    abrirFolha('av-busca', 'Me avisa quando aparecer',
      '<form id="av-f-busca" class="av-form" autocomplete="off" novalidate>' +
      '<p class="texto-2">Quando uma unidade com este filtro ficar livre em qualquer projeto (reserva que caiu, distrato ou liberação), chega um aviso neste aparelho com o nome do cliente.</p>' +
      '<label class="campo">Nome do cliente<input id="av-cli" name="cliente" maxlength="60" autocomplete="off" placeholder="Ex.: Maria" required></label>' +
      '<div class="av-crit"><p class="rotulo">O aviso procura</p><p class="texto">' + esc(avCritTexto(r.c, true)) + '</p>' +
      (ach ? '<p class="nota">' + esc(ach.length ? plural(ach.length, 'unidade livre bate', 'unidades livres batem') + ' com ele agora, em ' + plural(new Set(ach.map(x => x.p.id)).size, 'projeto', 'projetos') + '. O aviso chega quando aparecer outra.' : 'Nenhuma unidade livre bate com ele agora.') + '</p>' : '') + '</div>' +
      (r.obs.length ? '<ul class="av-obs">' + r.obs.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '') +
      (r.fora.length ? '<div class="aviso av-aviso av-fora">' + AV_INFO + '<div><p><b>Fica de fora do aviso</b></p>' + lista(r.fora) + '</div></div>' : '') +
      '<div class="av-notas" id="av-notas"></div><p class="erro-txt" id="av-erro" role="alert"></p></form>',
      '<button type="submit" form="av-f-busca" class="btn btn-pri btn-alto" id="av-salvar">' + IX.sino + 'Salvar</button>');
    setTimeout(() => { const i = $('#av-cli'); if(i && !ehToque()) i.focus(); }, 80);
    avNotasSalvar($('#folha-av-busca'));
  }
  async function avNotasSalvar(dlg){   // o que impede ou muda o salvamento: avisos neste aparelho e o limite de buscas
    const [st] = await Promise.all([avEstado(), avAte(avCarregarBuscas(), 5000)]);
    if(!dlg || !dlg.isConnected) return;
    const box = $('#av-notas', dlg), bt = $('#av-salvar', dlg); if(!box) return;
    const erro = t => '<div class="aviso erro">' + AV_INFO + '<p>' + esc(t) + '</p></div>';
    let h = '', bloq = false;
    if(!st.suporta){ bloq = true; h += erro(st.ios && !st.instalado ? 'No iPhone, o aviso só chega com o app instalado. No Safari, toque em Compartilhar e escolha Adicionar à Tela de Início. Depois abra o app pelo ícone novo e salve a busca de novo.' : 'Este navegador não aceita notificações. Salve a busca pelo Chrome ou pelo app instalado no celular.'); }
    else if(st.perm === 'denied'){ bloq = true; h += erro('As notificações estão bloqueadas para este site. Libere nas configurações do navegador e tente de novo.'); }
    else if(!st.ativo) h += '<p class="nota">Ao salvar, o app liga os avisos neste aparelho e o navegador pede sua permissão.</p>';
    if(AV.buscas && AV.buscas.length >= AV_MAX){ bloq = true; h += erro('Este aparelho já tem ' + AV_MAX + ' buscas salvas, o máximo. Exclua alguma em Avisos para salvar outra.'); }
    box.innerHTML = h;
    if(bt) bt.disabled = bloq;
  }
  SUBMITS_X['av-f-busca'] = async () => {
    const r = AV.novo; if(!r) return;
    const i = $('#av-cli'), cli = (i ? i.value : '').trim().slice(0, 60), b = $('#av-salvar');
    const erro = m => { const e = $('#av-erro'); if(e) e.textContent = m; };
    if(b && b.disabled) return;
    if(!cli){ erro('Digite o nome do cliente.'); if(i) i.focus(); return; }
    if(AV.buscas && AV.buscas.length >= AV_MAX){ erro('Este aparelho já tem ' + AV_MAX + ' buscas salvas, o máximo. Exclua alguma em Avisos.'); return; }
    erro(''); if(b){ b.disabled = true; b.textContent = 'Salvando…'; }
    try{
      let ep = null;
      if(avPerm() !== 'granted') ep = (await avLigar()).ep;   // a permissão é pedida já no toque
      if(!ep) ep = await avEndpoint();
      if(!ep) ep = (await avLigar()).ep;
      if(!ep) throw avErro('Não consegui ligar os avisos neste aparelho.');
      await rpc('busca_salvar', {p_codigo: S.cod, p_endpoint: ep, p_cliente: cli, p_criterios: r.c, p_id: null});
      AV.buscasEm = 0; AV.memo = null; AV.novo = null;
      fecharFolhas();
      toast('Pronto. Quando aparecer unidade para ' + (primeiroNome(cli) || cli) + ', chega um aviso neste aparelho.', 4500);
      avCarregarBuscas(true).then(() => { if(avNaTela('#/avisos')) avPintar(); });
    }catch(e){
      if(codigoInvalido(e)){ fecharFolhas(); sair(AV_CODIGO); return; }
      const t = (e && e.body) || '';
      erro(/sem_notificacoes/.test(t) ? 'Ligue os avisos neste aparelho primeiro.' : /limite_buscas/.test(t) ? 'Você chegou ao limite de ' + AV_MAX + ' buscas salvas. Exclua alguma antiga em Avisos.'
        : e && e.amigavel ? e.message : 'Não consegui salvar agora. Confira a internet e tente de novo.');
      if(b){ b.disabled = false; b.innerHTML = IX.sino + 'Salvar'; }
    }
  };
  // botão no cabeçalho do Imóveis (ao lado do Comparar) e no aviso de "nada com esses filtros"
  const avBtnImoveis = () => '<button type="button" class="btn btn-peq btn-fino" data-acao="av-salvar-f" aria-label="Me avisa quando aparecer unidade com este filtro">' + IX.sino + 'Me avisa</button>';
  const _avTelaImoveis = telaImoveis;
  telaImoveis = function(){
    const h = _avTelaImoveis.apply(this, arguments);
    if(typeof h !== 'string' || h.includes('data-acao="av-salvar-f"')) return h;
    const a1 = '<div class="seg seg-ver"', a2 = '<div class="cab-acoes">';
    return h.includes(a1) ? h.replace(a1, avBtnImoveis() + a1) : h.includes(a2) ? h.replace(a2, a2 + avBtnImoveis()) : h;
  };
  const _avAtualizarImoveis = atualizarImoveis;
  atualizarImoveis = function(){
    const r = _avAtualizarImoveis.apply(this, arguments);
    const v = $('#imv-res > .vazio');
    if(v && !v.querySelector('[data-acao="av-salvar-f"]') && avTemFiltro(avCritDoFiltro(S.f).c))
      v.insertAdjacentHTML('beforeend', '<p class="texto-2">Ou salve a busca: quando aparecer unidade assim, chega um aviso neste aparelho.</p><button type="button" class="btn" data-acao="av-salvar-f">' + IX.sino + 'Me avisa quando aparecer</button>');
    return r;
  };

  // ---------- Resumo do dia (resumo_dia) ----------
  const RS_T = [['vendas', 'Vendas', 'Vendidas', 'st-vendida'], ['reservas', 'Reservas', 'Reservadas', 'st-reservada'], ['processo', 'Em processo', 'Em processo final', 'st-processo'], ['liberadas', 'Liberadas', 'Liberadas', 'st-livre']];
  const RS_FMT = new Intl.DateTimeFormat('pt-BR', {timeZone: 'UTC', weekday: 'long', day: '2-digit', month: '2-digit'});
  const rsSoma = (iso, d) => { const x = new Date(iso + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + d); return x.toISOString().slice(0, 10); };
  function rsRotulo(dia){
    const hoje = diaKey(Date.now()), ontem = rsSoma(hoje, -1);
    if(dia === hoje) return 'Hoje, até agora';
    const t = RS_FMT.format(new Date(dia + 'T12:00:00Z')).replace('-feira', '');
    return dia === ontem ? 'Ontem, ' + t : maiusc1(t);
  }
  ROTAS.push([/^#\/resumo(?:\/(\d{4}-\d{2}-\d{2}))?$/, 'resumo', dia => rsTela(dia)]);
  function rsTela(dia){
    const hoje = diaKey(Date.now()), ontem = rsSoma(hoje, -1);
    if(!dia || dia > hoje || isNaN(Date.parse(dia + 'T12:00:00Z'))) dia = ontem;
    if(RS.dia !== dia) RS.f = 'tudo';
    RS.dia = dia;
    pos.push(() => rsCarregar(dia));
    const lnk = (d, rot, ico, depois) => '<a class="btn btn-peq btn-fino" href="#/resumo/' + d + '" aria-label="' + esc(rot + ': ' + rsRotulo(d)) + '">' + (depois ? '' : ico) + '<span>' + rot + '</span>' + (depois ? ico : '') + '</a>';
    const prox = rsSoma(dia, 1);
    return '<header class="pg-cab"><div><h1 class="t-1">Resumo do dia</h1><p class="sub">' + esc(rsRotulo(dia)) + '</p></div>' +
      '<nav class="rs-nav" aria-label="Escolher o dia">' + lnk(rsSoma(dia, -1), 'Anterior', ICO.anterior) + (prox < ontem ? lnk(ontem, 'Ontem', '', true) : '') +
      (dia < hoje ? lnk(prox, prox === hoje ? 'Hoje' : 'Próximo', ICO.proxima, true) : '') + '</nav></header>' +
      '<div id="rs-corpo">' + avEsq(92, 150, 150) + '</div>';
  }
  async function rsCarregar(dia){
    const hoje = diaKey(Date.now()), aqui = () => RS.dia === dia && /^#\/resumo/.test(location.hash);
    let c = RS.cache.get(dia);
    if(!c || (dia === hoje && Date.now() - c.em > 60000)){
      try{
        const v = await rpc('resumo_dia', {p_codigo: S.cod, p_dia: dia});
        c = {v: v || {}, em: Date.now()}; RS.cache.set(dia, c);
        if(RS.cache.size > 40) RS.cache.delete(RS.cache.keys().next().value);
      }catch(e){
        if(codigoInvalido(e)){ sair(AV_CODIGO); return; }
        const box = $('#rs-corpo');
        if(box && aqui()) box.innerHTML = '<div class="vazio"><h2 class="t-3">Não consegui abrir o resumo</h2><p class="texto-2">Confira a internet e tente de novo.</p><button type="button" class="btn" data-acao="rs-tentar">Tentar de novo</button></div>';
        return;
      }
    }
    const box = $('#rs-corpo'); if(box && aqui()) box.innerHTML = rsHtml(c.v, dia);
  }
  function rsHtml(v, dia){
    const ps = Array.isArray(v && v.projetos) ? v.projetos.filter(Boolean) : [], n = (x, k) => (Array.isArray(x[k]) ? x[k] : []).length;
    const tot = {}; for(const t of RS_T) tot[t[0]] = ps.reduce((s, x) => s + n(x, t[0]), 0);
    const livres = ps.reduce((s, x) => s + (+x.disponiveis || 0), 0);
    let h = '<section class="caixa rs-placar" aria-labelledby="rs-tot-t"><h2 class="sr" id="rs-tot-t">Totais do dia</h2><dl class="placar-n">' +
      RS_T.map(t => '<div><dt>' + t[1] + '</dt><dd class="num' + (t[0] === 'vendas' && tot.vendas ? ' ouro' : '') + '">' + tot[t[0]].toLocaleString('pt-BR') + '</dd></div>').join('') + '</dl>' +
      (livres ? '<p class="nota">' + esc(plural(livres, 'unidade livre', 'unidades livres') + ' agora nos projetos do resumo.') + '</p>' : '') + '</section>';
    const mexeu = ps.filter(x => RS_T.some(t => n(x, t[0])));
    if(!mexeu.length) h += '<div class="vazio"><h2 class="t-3">Nada mudou neste dia</h2><p class="texto-2">Nenhuma venda, reserva ou liberação nos espelhos.</p></div>';
    else{
      const f = RS.f !== 'tudo' && tot[RS.f] ? RS.f : 'tudo';
      h += '<div class="pilulas rola rs-filtro" role="group" aria-label="Mostrar no resumo">' + [['tudo', 'Tudo', mexeu.length]].concat(RS_T.filter(t => tot[t[0]]).map(t => [t[0], t[1], tot[t[0]]])).map(x =>
        '<button type="button" class="pilula peq" data-acao="rs-f" data-v="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + esc(x[1]) + '<span class="n">' + x[2] + '</span></button>').join('') + '</div>';
      const vis = mexeu.filter(x => f === 'tudo' || n(x, f)).sort((a, b) => (n(b, 'vendas') - n(a, 'vendas')) || (n(b, 'reservas') - n(a, 'reservas')) ||
        (RS_T.reduce((s, t) => s + n(b, t[0]), 0) - RS_T.reduce((s, t) => s + n(a, t[0]), 0)) || String(a.nome || a.id).localeCompare(String(b.nome || b.id), 'pt-BR'));
      h += '<ul class="rs-lista">' + vis.map(x => rsItemHtml(x, f)).join('') + '</ul>';
    }
    if(ps.length > mexeu.length && mexeu.length) h += '<p class="nota rs-nota">' + esc(plural(ps.length - mexeu.length, 'projeto ficou', 'projetos ficaram') + ' sem mudança neste dia.') + '</p>';
    if(AV.resumo8 !== true) h += '<p class="nota rs-nota">Para receber este resumo no celular todo dia às 8h, ligue em Avisos.</p><a class="link-mais" href="#/avisos">Abrir os avisos ' + ICO.seta + '</a>';
    return h;
  }
  function rsItemHtml(x, f){
    const p = S.byId.get(x.id), nome = p ? p.nome : String(x.nome || x.id || 'Projeto');
    const linhas = RS_T.filter(t => (f === 'tudo' || f === t[0]) && Array.isArray(x[t[0]]) && x[t[0]].length).map(t =>
      '<div class="rs-linha"><span class="rs-rot ' + t[3] + '">' + esc(t[2]) + '<span class="n">' + x[t[0]].length + '</span></span><div class="pilulas">' +
      x[t[0]].map(u => p ? '<a class="pilula peq rs-un" href="#/tabelas/' + esc(p.id) + '" data-acao="rs-un" data-p="' + esc(p.id) + '" data-n="' + esc(u) + '" aria-label="' + esc('Unidade ' + u + ' do ' + nome) + '">' + esc(u) + '</a>'
        : '<span class="pilula peq estatica">' + esc(u) + '</span>').join('') + '</div></div>').join('');
    const disp = x.disponiveis != null && isFinite(+x.disponiveis) ? +x.disponiveis : (p ? p.livres : null);
    return '<li class="rs-proj"><div class="rs-proj-cab">' + (p ? miniProj(p, 'peq') : '<span class="redonda peq"><span class="capa-vazia"><b>' + esc(nome.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '?') + '</b></span></span>') +
      '<span class="meio">' + (p ? '<a href="#/p/' + esc(p.id) + '">' + esc(nome) + '</a><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span>' : '<b>' + esc(nome) + '</b>') + '</span>' +
      (disp != null ? '<span class="fim"><b class="num">' + disp.toLocaleString('pt-BR') + '</b><span>' + (disp === 1 ? 'livre agora' : 'livres agora') + '</span></span>' : '') + '</div>' + linhas + '</li>';
  }
  ACOES_X['rs-un'] = el => { S.abrirUnidade = {pid: el.dataset.p, n: el.dataset.n}; };
  ACOES_X['rs-f'] = el => {
    RS.f = el.dataset.v || 'tudo';
    const c = RS.cache.get(RS.dia), box = $('#rs-corpo'); if(!c || !box) return;
    box.innerHTML = rsHtml(c.v, RS.dia);
    const b = $('#rs-corpo [data-acao="rs-f"][data-v="' + RS.f + '"]'); if(b) b.focus({preventScroll: true});
  };
  ACOES_X['rs-tentar'] = () => { RS.cache.delete(RS.dia); const box = $('#rs-corpo'); if(box) box.innerHTML = avEsq(92, 150); rsCarregar(RS.dia); };

  // ---------- Enviadas: seleções, fichas da central e do Mercado mandadas deste aparelho, e o Gênio ----------
  const EN_VIU = {planta: 'a planta', vista: 'a vista', valores: 'os valores', galeria: 'as fotos', local: 'a localização', andar: 'a posição no andar'};
  const EN_VIU_MERC = {galeria: 'as fotos', planta: 'as plantas', valores: 'os valores', local: 'a localização'};
  ROTAS.push([/^#\/enviadas$/, 'enviadas', () => enTela()]);
  function enTela(){
    EN.excluir = null;
    pos.push(() => enCarregar());
    return '<header class="pg-cab"><div><h1 class="t-1">Enviadas</h1><p class="sub">O que você mandou deste aparelho e quem abriu.</p></div></header>' +
      '<div id="en-push"></div><div id="en-genio">' + enGenioHtml() + '</div>' +
      '<div class="busca-linha" id="en-busca"' + (enItens().length > 5 || EN.q ? '' : ' hidden') + '><label class="busca"><span class="sr">Buscar cliente ou projeto</span>' + ICO.lupa +
      '<input id="en-q" type="search" autocomplete="off" placeholder="Cliente ou projeto" value="' + esc(EN.q) + '" data-input="en-q"></label></div>' +
      '<p class="sub lista-n" id="en-n"></p><div id="en-lista">' + (EN.em ? '' : avEsq(130, 130, 130)) + '</div>';
  }
  function enCarregar(forcar){
    enAvisoPush();
    if(EN.em){ enPintar(); if(!forcar && Date.now() - EN.em < 20000){ enConferirGenio().then(() => { if(avNaTela('#/enviadas')) enPintarGenio(); }); return Promise.resolve(); } }
    if(EN.carregando) return EN.carregando;
    EN.carregando = (async () => {
      try{
        const ep = await avAte(avEndpoint(), 1600), d = dono();
        const [s, l, m] = await Promise.all([rpc('minhas_selecoes', {p_codigo: S.cod, p_dono: d, p_endpoint: ep || null}),
          rpc('meus_links', {p_codigo: S.cod, p_dono: d, p_endpoint: ep || null}).catch(() => null),
          rpc('meus_links_mercado', {p_codigo: S.cod, p_dono: d}).catch(() => null)]);
        EN.sel = Array.isArray(s) ? s : []; if(Array.isArray(l)) EN.fic = l; if(Array.isArray(m)) EN.mer = m;
        EN.em = Date.now(); EN.erro = false;
        if(EN.sel.concat(EN.fic).some(x => x && x.origem === 'genio')) LS.set(AV_K.genio, '1');
        // a página da central de cada ficha (a mesma regra do envio: ficha do projeto, senão ver.html)
        const pids = [...new Set(EN.fic.map(x => x && x.projeto).filter(id => id && !S.centralV.has(id)))];
        if(pids.length) await avAte(Promise.all(pids.map(id => fichaCentral(id))), 2500);
      }catch(e){
        if(codigoInvalido(e)){ sair(AV_CODIGO); return; }
        EN.erro = true;
      }finally{ EN.carregando = null; }
      if(!avNaTela('#/enviadas')) return;
      enPintar();
      await enConferirGenio();
      if(avNaTela('#/enviadas')) enPintarGenio();
    })();
    return EN.carregando;
  }
  async function enAvisoPush(){
    const ativo = AV.epAtivo || await avAte(avEndpoint(), 1600);
    const box = $('#en-push'); if(!box || !avNaTela('#/enviadas')) return;
    box.innerHTML = ativo ? '' : '<div class="aviso av-aviso">' + IX.sino + '<div><p>Ligue os avisos para saber na hora quando o cliente abrir o link ou tocar em Tenho interesse.</p>' +
      '<a class="link-mais" href="#/avisos">Ligar os avisos ' + ICO.seta + '</a></div></div>';
  }
  function enItens(){
    const L = [], add = (arr, tipo) => { for(const s of arr) if(s && s.id != null) L.push({k: tipo + ':' + s.id, tipo, em: s.criado_em, s}); };
    add(EN.sel, 'sel'); add(EN.fic, 'fic'); add(EN.mer, 'mer');
    return L.sort((x, y) => String(y.em || '').localeCompare(String(x.em || '')));
  }
  const enNomeProj = id => { const p = S.byId.get(id); return p ? p.nome : String(id || 'empreendimento'); };
  function enOque(it){
    const s = it.s, us = Array.isArray(s.unidades) ? s.unidades : [];
    if(it.tipo === 'mer') return 'Ficha do ' + (s.nome || 'empreendimento') + ', do Mercado' + (+s.tipos ? ', ' + plural(+s.tipos, 'opção', 'opções') : '');
    if(it.tipo === 'fic') return 'Ficha do ' + enNomeProj(s.projeto) + (us.length ? ', ' + (us.length === 1 ? 'unidade ' + us[0] : 'unidades ' + us.join(', ')) : '');
    const nu = +s.unidades || 0, np = +s.projetos || 0;
    return 'Seleção com ' + plural(nu, 'unidade', 'unidades') + (np ? ' em ' + plural(np, 'projeto', 'projetos') : '') + (s.texto ? ': ' + s.texto : '');
  }
  function enStatus(it){
    const s = it.s, link = it.tipo !== 'sel', ab = +s.aberturas || 0;
    if(s.expirado) return {cls: 'exp', t: 'Link vencido. Cada ' + (link ? 'ficha vale 90 dias.' : 'seleção vale 60 dias.')};
    if(!ab) return {cls: '', t: 'Ainda não abriu.'};
    const ui = Date.parse(s.ultimo_acesso || ''), vs = s.vistos && typeof s.vistos === 'object' ? s.vistos : {};
    const viu = link ? Object.keys(vs).map(k => (it.tipo === 'mer' ? EN_VIU_MERC : EN_VIU)[k]).filter(Boolean) : [];
    let t = 'Abriu ' + (ab === 1 ? '1 vez' : ab + ' vezes') + (isFinite(ui) ? ', a última ' + quandoMontado(ui) : '') + '.';
    if(+s.interesses) t += ' Tocou em Tenho interesse ' + (+s.interesses === 1 ? '1 vez' : +s.interesses + ' vezes') + '.';
    if(viu.length) t += ' Viu ' + avListaE(viu) + '.';
    if(link && vs.whatsapp) t += ' Tocou no WhatsApp.';
    return {cls: 'abriu', t};
  }
  const enAbs = rel => { try{ return new URL(ESP + rel, location.href).href; }catch(e){ return ESP + rel; } };
  const enPagina = pid => { const c = S.centralV.get(pid), pg = c && c.pagina; return /^[A-Za-z0-9_-]+\.html$/.test(String(pg || '')) ? pg : 'ver.html'; };
  function enUrl(it){
    const id = encodeURIComponent(it.s.id);
    return it.tipo === 'mer' ? enAbs('nex/m.html?l=' + id) : it.tipo === 'fic' ? enAbs('nex/' + enPagina(it.s.projeto) + '?l=' + id) : enAbs('s.html?s=' + id);
  }
  function enItemHtml(it){
    const s = it.s, st = enStatus(it), url = enUrl(it), link = it.tipo !== 'sel', conf = EN.excluir === it.k;
    const em = Date.parse(it.em || ''), cli = String(s.cliente || '').trim() || 'Cliente sem nome';
    const nome = it.tipo === 'mer' ? (s.nome || 'empreendimento') : enNomeProj(s.projeto);
    const msg = 'Oi, ' + primeiroNome(cli) + '. Segue de novo ' + (link ? 'a apresentação do ' + nome : 'a seleção de imóveis') + ' que separei para você: ' + url;
    return '<li class="en-item' + (st.cls === 'exp' ? ' exp' : '') + '"><div class="en-cab"><b>' + esc(cli) + (s.origem === 'genio' ? '<span class="en-tag" title="Mandado pelo Gênio no WhatsApp">Gênio</span>' : '') + '</b>' +
      (isFinite(em) ? '<span class="sub">enviada ' + esc(quandoMontado(em)) + '</span>' : '') + '</div>' +
      '<p class="en-oque">' + esc(enOque(it)) + '</p><p class="en-st' + (st.cls ? ' ' + st.cls : '') + '">' + esc(st.t) + '</p><div class="en-acoes">' +
      (s.expirado ? '' : '<a class="btn btn-peq btn-fino" href="' + esc(url + '&previa=1') + '" target="_blank" rel="noopener" aria-label="' + esc('Abrir o link de ' + cli + ' (a sua visita não conta como abertura)') + '">Abrir</a>' +
        '<button type="button" class="btn btn-peq btn-fino" data-acao="en-copiar" data-u="' + esc(url) + '">' + ICO.copiar + 'Copiar</button>' +
        '<a class="btn btn-peq btn-fino" href="https://wa.me/?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener">' + ICO.zap + 'Reenviar</a>') +
      (conf ? '<button type="button" class="btn btn-peq av-perigo" data-acao="en-apagar" data-k="' + esc(it.k) + '">Confirmar</button><button type="button" class="btn btn-peq btn-fino" data-acao="en-ap-cancelar">Cancelar</button>'
        : '<button type="button" class="btn btn-peq btn-fino" data-acao="en-apagar" data-k="' + esc(it.k) + '" aria-label="' + esc('Apagar o link de ' + cli) + '">Apagar</button>') + '</div></li>';
  }
  function enPintar(){
    const box = $('#en-lista'); if(!box) return;
    const todos = enItens(), q = EN.q.trim(), termos = norm(q).split(/\s+/).filter(Boolean);
    const vis = termos.length ? todos.filter(it => { const alvo = norm([it.s.cliente, enOque(it)].join(' ')); return termos.every(t => alvo.includes(t)); }) : todos;
    const bz = $('#en-busca'); if(bz) bz.hidden = todos.length <= 5 && !q;
    const n = $('#en-n');
    if(n) n.textContent = !EN.em ? '' : termos.length ? plural(vis.length, 'envio', 'envios') + ' com “' + q + '”' : todos.length ? plural(todos.length, 'envio', 'envios') + ', os mais novos primeiro' : '';
    if(!EN.em){ if(EN.erro) box.innerHTML = '<div class="vazio"><h2 class="t-3">Não consegui abrir o que você mandou</h2><p class="texto-2">Confira a internet e tente de novo.</p><button type="button" class="btn" data-acao="en-tentar">Tentar de novo</button></div>'; return; }
    if(!todos.length){ box.innerHTML = '<div class="vazio"><h2 class="t-3">Nada mandado deste aparelho ainda</h2><p class="texto-2">No Imóveis ou na tabela do projeto, marque as unidades e toque em Mandar pro cliente. O link aparece aqui, com o aviso de quando o cliente abrir.</p><a class="btn" href="#/imoveis">Abrir o Imóveis</a></div>'; return; }
    box.innerHTML = vis.length ? '<ul class="en-lista">' + vis.map(enItemHtml).join('') + '</ul>' : '<p class="texto-2 vazio-txt">Nenhum envio com esse nome.</p>';
  }
  ACOES_X['en-copiar'] = el => { if(el.dataset.u) copiar(el.dataset.u, 'Link copiado.'); };
  ACOES_X['en-apagar'] = async el => {
    const k = el.dataset.k || '';
    if(EN.excluir !== k){ EN.excluir = k; enPintar(); const b = $('#en-lista [data-acao="en-apagar"][data-k="' + CSS.escape(k) + '"]'); if(b) b.focus(); return; }
    const it = enItens().find(x => x.k === k); if(!it){ EN.excluir = null; enPintar(); return; }
    el.disabled = true;
    try{
      await rpc(it.tipo === 'mer' ? 'mercado_link_apagar' : it.tipo === 'fic' ? 'link_apagar' : 'selecao_apagar', {p_codigo: S.cod, p_dono: dono(), p_id: it.s.id});
      if(it.tipo === 'mer') EN.mer = EN.mer.filter(x => x !== it.s); else if(it.tipo === 'fic') EN.fic = EN.fic.filter(x => x !== it.s); else EN.sel = EN.sel.filter(x => x !== it.s);
      toast((it.tipo === 'sel' ? 'Seleção' : 'Ficha') + ' de ' + (it.s.cliente || 'cliente') + ' apagada. O link para de funcionar.');
    }catch(e){ if(codigoInvalido(e)){ sair(AV_CODIGO); return; } toast('Não consegui apagar agora.'); }
    EN.excluir = null; enPintar();
  };
  ACOES_X['en-ap-cancelar'] = () => { EN.excluir = null; enPintar(); };
  ACOES_X['en-tentar'] = () => { EN.em = 0; const box = $('#en-lista'); if(box) box.innerHTML = avEsq(130, 130); enCarregar(true); };
  INPUTS_X['en-q'] = (el, ev, tipo) => { if(tipo !== 'input') return; EN.q = el.value; depois('en-q', 120, enPintar); };

  // Gênio: o app gera um código, o corretor manda "ligar app CÓDIGO" no WhatsApp do Gênio e os links que ele mandar
  // passam a aparecer aqui. Sem a função no servidor (404), o quadro fica escondido.
  async function enConferirGenio(){
    if(EN.genio !== null || !S.cod) return;
    try{ await rpc('vinculo_status', {p_codigo: S.cod, p_dono: dono(), p_vinculo: '-'}); EN.genio = true; }
    catch(e){ if(e && e.status) EN.genio = e.status !== 404; }
  }
  function enPintarGenio(){ const box = $('#en-genio'); if(box) box.innerHTML = enGenioHtml(); }
  function enGenioHtml(){
    const v = EN.vinc;
    if(v && v.codigo && !v.fim){
      const txt = 'ligar app ' + v.codigo;
      return '<section class="caixa en-genio" aria-labelledby="en-g-t"><h2 class="t-3" id="en-g-t">Ligar ao Gênio</h2><p class="texto-2">Mande esta mensagem para o Gênio no WhatsApp' +
        (v.wa ? '' : ': o WhatsApp abre com ela pronta, é só escolher a conversa do Gênio') + '. O código vale 15 minutos.</p>' +
        '<p class="en-cod">' + esc(txt) + '</p><div class="btn-linha"><a class="btn btn-pri" href="https://wa.me/' + (v.wa || '') + '?text=' + encodeURIComponent(txt) + '" target="_blank" rel="noopener">' + ICO.zap + 'WhatsApp</a>' +
        '<button type="button" class="btn" data-acao="en-gcopiar">' + ICO.copiar + 'Copiar</button></div><p class="nota" role="status">Esperando o Gênio confirmar…</p></section>';
    }
    if(EN.genio !== true) return '';
    if(LS.get(AV_K.genio) === '1') return '<div class="aviso av-aviso en-genio">' + ICO.ok + '<div><p>Ligado ao Gênio: o que ele manda para você no WhatsApp aparece aqui, com a marca <span class="en-tag">Gênio</span>.</p>' +
      '<button type="button" class="link-mais" data-acao="en-genio">Ligar de novo</button></div></div>';
    return '<section class="caixa en-genio" aria-labelledby="en-g-t"><h2 class="t-3" id="en-g-t">Gênio no WhatsApp</h2><p class="texto-2">Os links que o Gênio manda no WhatsApp também podem aparecer aqui, com o aviso de quando o cliente abre.</p>' +
      '<button type="button" class="btn" data-acao="en-genio">Ligar ao Gênio</button></section>';
  }
  ACOES_X['en-genio'] = async el => {
    el.disabled = true;
    try{
      const ep = await avAte(avEndpoint(), 1600);
      const r = await rpc('vinculo_criar', {p_codigo: S.cod, p_dono: dono(), p_endpoint: ep || null});
      if(!r || !r.codigo) throw new Error('vinculo sem código');
      EN.vinc = {codigo: String(r.codigo), ate: Date.now() + 15 * 60e3, n: 0, fim: false, wa: avGenioWa(CFG.genio) || avGenioWa(r.whats || r.wa || r.numero)};
      enPintarGenio(); enEsperarGenio(EN.vinc);
    }catch(e){
      el.disabled = false;
      if(codigoInvalido(e)){ sair(AV_CODIGO); return; }
      if(e && e.status === 404){ EN.genio = false; enPintarGenio(); toast('A ligação com o Gênio ainda não está ativa.'); return; }
      toast(/limite_vinculos/.test((e && e.body) || '') ? 'Muitos códigos na última hora. Tente daqui a pouco.' : 'Não consegui gerar o código agora. Confira a internet.');
    }
  };
  async function enEsperarGenio(v){
    while(EN.vinc === v && !v.fim && S.cod){
      if(Date.now() > v.ate){ v.fim = true; EN.vinc = null; toast('O código venceu. Toque em Ligar ao Gênio para gerar outro.', 5000); if(avNaTela('#/enviadas')) enPintarGenio(); return; }
      await new Promise(r => setTimeout(r, v.n++ < 20 ? 3000 : 8000));
      if(EN.vinc !== v || !S.cod) return;
      try{
        const r = await rpc('vinculo_status', {p_codigo: S.cod, p_dono: dono(), p_vinculo: v.codigo});
        if(r && r.usado){
          v.fim = true; EN.vinc = null; EN.em = 0; LS.set(AV_K.genio, '1');
          const k = +r.movidos || 0;
          toast('Pronto: o Gênio está ligado a este aparelho' + (k ? ' e ' + (k === 1 ? '1 link dele veio' : k + ' links dele vieram') + ' para cá.' : '.'), 5500);
          if(avNaTela('#/enviadas')){ enPintarGenio(); enCarregar(true); }
          return;
        }
      }catch(e){}
    }
  }
  ACOES_X['en-gcopiar'] = () => { if(EN.vinc) copiar('ligar app ' + EN.vinc.codigo, 'Copiado. Cole na conversa com o Gênio.'); };

  // ---------- mensagens do service worker: aviso que chegou (atualizar) e toque no aviso (abrir) ----------
  function avAoAtualizar(){
    if(!S.cod) return;
    carregar('auto');
    AV.buscasEm = 0; EN.em = 0; RS.cache.delete(diaKey(Date.now()));
    if(document.querySelector('dialog[open]')) return;
    const ae = document.activeElement; if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    const h = location.hash;
    if(h === '#/avisos') avPintar();
    else if(h === '#/enviadas') enCarregar(true);
    else if(/^#\/resumo/.test(h) && RS.dia === diaKey(Date.now())) rsCarregar(RS.dia);
  }
  function avAbrir(url){   // o endereço do aviso usa os endereços do app anterior (#resumo, #buscar, #projeto-u101)
    let u; try{ u = new URL(url, location.href); }catch(e){ return; }
    if(u.origin !== location.origin) return;
    AV.buscasEm = 0; EN.em = 0;
    if(S.cod) carregar('auto');
    const h = u.hash && u.hash !== '#' ? u.hash : '';
    if(!h) return;
    const alvo = /^#\//.test(h) ? h : (hashAntigo(h) || '#/');
    fecharFolhas();
    if(location.hash === alvo){ if(S.carregado) render(); }
    else location.hash = alvo;
  }
  if('serviceWorker' in navigator){
    try{
      navigator.serviceWorker.addEventListener('message', ev => {
        const m = ev.data || {};
        if(m.tipo === 'atualizar') avAoAtualizar();
        else if(m.tipo === 'abrir' && m.url) avAbrir(String(m.url));
      });
    }catch(e){}
  }

  // ---------- sair: como no app anterior, quem sai deste aparelho para de receber os avisos aqui e o que ficou salvo é apagado ----------
  const _avSair = sair;
  sair = function(msg){
    const manual = !msg;   // o código que deixou de valer (com mensagem) não desliga os avisos, como no app anterior
    if(manual){ LS.del(K.cache); LS.del(AV_K.cacheAntigo); }
    AV.buscas = null; AV.buscasEm = 0; AV.memo = null; AV.resumo8 = null; AV.excluir = null; AV.st = null;
    EN.sel = []; EN.fic = []; EN.mer = []; EN.em = 0; EN.vinc = null; EN.genio = null; EN.q = ''; RS.cache.clear();
    const r = _avSair.apply(this, arguments);
    if(manual) avSairDoAparelho();
    return r;
  };
  async function avSairDoAparelho(){
    const s = await avAssinatura(3000), ep = (s && s.endpoint) || AV.epAtivo || LS.get(AV_K.ep);
    if(ep) await rpc('desinscrever', {p_endpoint: ep}).catch(() => {});
    if(s) await s.unsubscribe().catch(() => {});
    AV.epAtivo = null;
    if(ep){ LS.del(AV_K.ep); toast('Avisos desligados neste aparelho.'); }
  }

  // link criado neste aparelho leva o endereço do aviso (como no app anterior): o corretor fica sabendo quando o cliente abrir
  const AV_COM_EP = ['selecao_criar', 'link_criar', 'mercado_link_criar'];
  const _avRpc = rpc;
  rpc = function(fn, args, ms){
    if(AV_COM_EP.includes(fn) && args && typeof args === 'object' && 'p_endpoint' in args && args.p_endpoint == null){
      const ep = AV.epAtivo || (avPerm() === 'granted' ? LS.get(AV_K.ep) : null);
      if(ep) args = Object.assign({}, args, {p_endpoint: ep});
    }
    return _avRpc(fn, args, ms);
  };

  PERFIL_X.push(() => '<section class="caixa"><h2 class="t-3">Avisos</h2><p class="texto-2">Venda, reserva e liberação nos projetos que você acompanha, as buscas salvas dos clientes e o resumo das 8h. Trocar o código ou sair também desliga os avisos deste aparelho.</p>' +
    '<a class="btn" href="#/avisos">' + IX.sino + 'Abrir os avisos</a></section>');

  // na abertura: confere se o endereço do aviso mudou (leva as buscas junto) e conta as buscas com unidade livre
  setTimeout(() => { if(S.cod && avPerm() === 'granted') avEstado().then(st => { if(st.ativo) avCarregarBuscas(); }).catch(() => {}); }, 3500);

  // o Mercado avisa quando cria um link, e a lista de Enviadas busca de novo na próxima vez
  function enviadasMudou(){ EN.em = 0; }

  // ---------------- x_mercado.js ----------------
  // ================= MERCADO: o resto do mercado pela Órulo =================
  // Busca rápida na base da Órulo (integração oficial, atualizada todo dia pelo servidor). Os projetos que acompanhamos ao
  // vivo ficam fora dessa base e aparecem só no bloco "Da nossa carteira", sempre com o nosso dado de agora (S.P e S.U).
  // O item do menu só aparece com a base pronta (mercado_status). Book, tabela, contato do comercial e comissão vêm da Órulo
  // na hora, com o login de cada corretor (função "orulo"), e nada disso é guardado.
  // Rotas: #/mercado (busca) e #/mercado/<id> (ficha). Endereços antigos: #mercado, #orulo_ok e #orulo_erro=<motivo>.
  // Tudo fica dentro deste bloco para não esbarrar nos nomes do app e dos outros módulos.
  {
    // ---------- chaves e endereços (os mesmos do app anterior) ----------
    const MK_K_F = 'espelhos-mercado-filtros', MK_K_OR = 'espelhos-orulo', MK_K_OR_P = 'espelhos-orulo-pendente';
    const MK_PASSO = 24, MK_IDX_VALE = 6 * 3600e3, MK_ST_VALE = 10 * 60e3, MK_FICHA_VALE = 30 * 60e3, MK_MAT_VALE = 10 * 60e3;
    const MK_FN = () => CFG.url + '/functions/v1/orulo';
    const MK_MSG_COD = 'Esse código não vale mais. Digite o código novo do time.';
    const MK_CARREGANDO = ['testando', 'conferindo', 'listando', 'carregando'];

    // ---------- formatos ----------
    const mkNorm = s => norm(s).replace(/\s+/g, ' ').trim();
    const mkYM = s => String(s || '').slice(0, 7);
    const mkHojeYM = () => diaKey(Date.now()).slice(0, 7);
    const mkQuando = iso => {
      const t = Date.parse(iso); if(!isFinite(t)) return '';
      const d = diaKey(t);
      return (d === diaKey(Date.now()) ? 'hoje' : d === diaKey(Date.now() - 864e5) ? 'ontem' : 'em ' + fDM.format(t)) + ' às ' + hora(t);
    };
    const mkPct = v => (Math.round(+v * 100) / 100).toLocaleString('pt-BR') + '%';
    const mkM2 = v => fmtM2(Math.round(+v * 100) / 100);
    const mkE = (a, ult) => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + (ult || ' e ') + a[a.length - 1];
    const mkSair = e => { if(codigoInvalido(e)){ sair(MK_MSG_COD); return true; } return false; };
    const mkStrs = v => Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
    const mkT = {};
    const mkDepois = (k, ms, fn) => { clearTimeout(mkT[k]); mkT[k] = setTimeout(fn, ms); };
    const mkCoord = e => { const la = +e.la, lo = +e.lo; return e.la != null && e.lo != null && isFinite(la) && isFinite(lo) && (la || lo) ? {lat: la, lng: lo} : null; };
    const mkUrl = u => /^https?:\/\//i.test(String(u || '')) ? String(u) : null;
    const MKI = {
      tel: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
      mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
      fora: svg('<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>')
    };
    const MK_PONTO = '<p class="ao-vivo"><span class="ponto"><i class="pulso"></i><i></i></span>Ao vivo</p>';

    // ---------- estado (só na memória, como no app anterior; o índice vale 6 horas) ----------
    const mk = {
      q: '', bq: '', mostra: MK_PASSO, rs: null, io: null,
      IDX: null, porId: new Map(), idxPedido: null, erro: null, erroEm: 0, bairros: null,
      ST: null, stPedido: null, stTentou: 0, cod: null, pegando: false,
      fichas: new Map(), fichaPedido: new Map(), mats: new Map(), matPedido: new Map(),
      env: null, admForm: false, admT: null
    };

    // ---------- regiões ----------
    const MK_ZONAS = [['centro', 'Centro'], ['oeste', 'Zona Oeste'], ['sul', 'Zona Sul'], ['norte', 'Zona Norte'], ['leste', 'Zona Leste'], ['gsp', 'Grande SP']];
    const MK_BZ = {};
    [['centro', 'Sé|República|Bela Vista|Consolação|Liberdade|Santa Cecília|Bom Retiro|Cambuci|Luz|Higienópolis|Vila Buarque|Campos Elíseos|Aclimação|Brás|Pari'],
     ['oeste', 'Pinheiros|Perdizes|Pompeia|Pompéia|Lapa|Vila Madalena|Alto de Pinheiros|Butantã|Barra Funda|Água Branca|Sumaré|Sumarezinho|Jardim Paulista|Jardins|Jardim América|Jardim Europa|Jardim Paulistano|Cerqueira César|Itaim Bibi|Vila Olímpia|Vila Leopoldina|Jaguaré|Rio Pequeno|Morumbi|Pacaembu|Vila Ipojuca|Alto da Lapa|Vila Romana|Cidade Jardim|Vila Sônia|Raposo Tavares'],
     ['sul', 'Moema|Vila Mariana|Saúde|Vila Clementino|Paraíso|Ibirapuera|Campo Belo|Brooklin|Brooklin Paulista|Santo Amaro|Chácara Santo Antônio|Jabaquara|Conceição|Vila Guarani|Cursino|Ipiranga|Sacomã|Vila Nova Conceição|Indianópolis|Planalto Paulista|Mirandópolis|Bosque da Saúde|Vila da Saúde|Praça da Árvore|Alto da Boa Vista|Granja Julieta|Campo Limpo|Interlagos|Socorro|Vila Andrade|Panamby|Jardim Marajoara|Vila Mascote|Chácara Klabin|Vila Gumercindo|Jardim da Saúde|Vila Monumento'],
     ['norte', 'Santana|Tucuruvi|Casa Verde|Vila Guilherme|Mandaqui|Jaçanã|Freguesia do Ó|Limão|Pirituba|Vila Maria|Parada Inglesa|Lauzane Paulista|Água Fria|Imirim|Jardim São Paulo|Tremembé'],
     ['leste', 'Tatuapé|Mooca|Belém|Carrão|Vila Carrão|Penha|Vila Formosa|Jardim Anália Franco|Anália Franco|Vila Prudente|Água Rasa|Aricanduva|Itaquera|São Mateus|Vila Matilde|Cidade Líder|Sapopemba|Quarta Parada|Vila Ema|Parque São Lucas|Guaianases|São Miguel Paulista|Ermelino Matarazzo|Cangaíba|Vila Esperança']
    ].forEach(([z, l]) => l.split('|').forEach(b => { MK_BZ[mkNorm(b)] = z; }));
    const mkBairroLimpo = b => String(b || '').replace(/\s*\(.*\)\s*$/, '').trim();
    function mkZonaDe(e){
      if(e.c && mkNorm(e.c) !== 'sao paulo') return 'gsp';
      const nb = mkNorm(e.b), zm = /\(z\.?\s*(sul|norte|leste|oeste)\)/.exec(nb); if(zm) return zm[1];
      const b = nb.replace(/\s*\(.*\)\s*$/, ''); if(MK_BZ[b]) return MK_BZ[b];
      const c = mkCoord(e); if(!c) return '';
      const dy = (c.lat + 23.5505) * 111, dx = (c.lng + 46.6333) * 111 * Math.cos(23.55 * Math.PI / 180);
      if(Math.hypot(dx, dy) < 3.2) return 'centro';
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;   // 0 = leste, 90 = norte
      return ang >= 45 && ang < 135 ? 'norte' : (ang >= 135 || ang < -135) ? 'oeste' : ang < -45 ? 'sul' : 'leste';
    }
    const mkOnde = e => [mkBairroLimpo(e.b), e.c && mkNorm(e.c) !== 'sao paulo' ? e.c : ''].filter(Boolean).join(', ');

    // ---------- fases e tipologias ----------
    // tipologia: [tipo, área privativa, dormitórios, suítes, vagas, preço a partir de, estoque]
    const MK_FASES = [['breve', 'Breve lançamento'], ['lanc', 'Lançamento'], ['obras', 'Em obras'], ['pronto', 'Pronto']];
    const MK_FASE = Object.fromEntries(MK_FASES);
    const mkFaseK = e => { const f = mkNorm(e.f); return /futuro|breve/.test(f) ? 'breve' : /lancamento/.test(f) ? 'lanc' : /pronto|usado/.test(f) ? 'pronto' : 'obras'; };
    const MK_DORMS = [['s', 'Studio'], ['1', '1 dorm'], ['2', '2 dorms'], ['3', '3 dorms'], ['4', '4 dorms ou +'], ['c', 'Comercial']];
    const MK_VAGAS = [[0, 'Tanto faz'], [1, '1 ou mais'], [2, '2 ou mais']];
    const MK_RAPIDOS = [[300000, '300 mil'], [400000, '400 mil'], [500000, '500 mil'], [700000, '700 mil'], [1000000, '1 mi']];
    const MK_ORDENS = [['preco', 'Menor preço'], ['m2', 'Menor R$/m²'], ['entrega', 'Entrega mais próxima'], ['estoque', 'Mais unidades em estoque'], ['novos', 'Lançamentos mais recentes']];
    const MK_COMERCIAL = /sala|loja|comercial|terreno|galpao|pavilhao|edificio|fazenda|sitio|laje/;
    const MK_TIPO_BASE = {s: 'S', '1': '1', '2': '2', '3': '3', '4': '3', c: 'L'};   // tipo do Mercado -> tipo do espelho (S, 1, 2, 3 ou +, L)
    const mkDormK = t => { const n = mkNorm(t[0]); if(MK_COMERCIAL.test(n)) return 'c'; return (/studio|loft|kitnet/.test(n) || !(t[2] > 0)) ? 's' : t[2] >= 4 ? '4' : String(+t[2]); };
    function mkTipTxt(t, semArea){
      const tipo = String(t[0] || ''), n = mkNorm(tipo), a = !semArea && t[1] > 0 ? ' de ' + mkM2(t[1]) : '';
      if(/studio|loft|kitnet/.test(n) || MK_COMERCIAL.test(n) || !(t[2] > 0)) return (tipo || 'Unidade') + a;
      return +t[2] + (+t[2] === 1 ? ' dorm' : ' dorms') + (/cobertura|garden|duplex|triplex/.test(n) ? ' ' + tipo.toLowerCase() : '') + a;
    }
    const mkVagaTxt = v => v > 0 ? plural(+v, 'vaga', 'vagas') : 'sem vaga';
    const mkEntTxt = v => v === 'pronto' ? 'Pronto para morar' : 'até ' + mesAnoCurto(v);
    function mkPrep(e){   // o que a busca usa de cada empreendimento, calculado uma vez por leitura do índice
      if(e._fk === undefined){ e._fk = mkFaseK(e); e._z = mkZonaDe(e); e._tx = mkNorm([e.n, e.b, e.d, e.c].filter(Boolean).join(' ')); }
      return e;
    }
    const mkTodas = (e, d) => (d && Array.isArray(d.tipologias) && d.tipologias.length ? d.tipologias : (Array.isArray(e.t) ? e.t : []))
      .filter(Array.isArray).slice().sort((a, b) => ((+a[5] || 9e12) - (+b[5] || 9e12)) || (a[1] - b[1]));
    const mkComPreco = todas => { const p = todas.filter(t => t[5] > 0), v = p.filter(t => t[6] !== 0); return v.length ? v : p; };   // com preço, de preferência as que ainda têm estoque

    // ---------- números digitados ----------
    // "450" -> 450 mil · "450 mil" · "450.000" · "1,2 mi" -> 1.200.000
    function mkNumPreco(s){
      let t = mkNorm(s).replace(/r\$|\s/g, ''); if(!t) return null;
      const mi = /mi(lhao|lhoes|l)?$|mm$/.test(t) && !/mil$/.test(t), mil = /mil$|k$/.test(t);
      t = t.replace(/(milhoes|milhao|mil|mi|mm|k)$/, '');
      if(/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.'); else t = t.replace(/[.,]/g, '');
      let n = parseFloat(t); if(!isFinite(n) || n <= 0) return null;
      if(mi) n *= 1e6; else if(mil || n < 10000) n *= 1000;
      return Math.round(n);
    }
    const mkNumArea = s => { const n = parseFloat(String(s || '').replace(',', '.')); return isFinite(n) && n > 0 ? n : null; };

    // ---------- filtros (o mesmo formato salvo pelo app anterior) ----------
    const mkNovoF = () => ({preco: null, a1: null, a2: null, dorm: new Set(), ent: '', fase: new Set(), zona: new Set(), bairros: new Set(), vagas: 0, inc: '', est: true, ordem: 'preco'});
    let MF = mkNovoF();
    try{
      const s = JSON.parse(LS.get(MK_K_F) || 'null');
      if(s && typeof s === 'object'){
        MF = Object.assign(mkNovoF(), s, {dorm: new Set(mkStrs(s.dorm)), fase: new Set(mkStrs(s.fase)), zona: new Set(mkStrs(s.zona)), bairros: new Set(mkStrs(s.bairros))});
        MF.preco = +MF.preco || null; MF.a1 = +MF.a1 || null; MF.a2 = +MF.a2 || null; MF.vagas = +MF.vagas || 0; MF.est = MF.est !== false;
        if(typeof MF.ent !== 'string') MF.ent = ''; if(typeof MF.inc !== 'string') MF.inc = '';
        if(!MK_ORDENS.some(o => o[0] === MF.ordem)) MF.ordem = 'preco';
      }
    }catch(e){ MF = mkNovoF(); }
    const mkGravarF = () => LS.set(MK_K_F, JSON.stringify(Object.assign({}, MF, {dorm: [...MF.dorm], fase: [...MF.fase], zona: [...MF.zona], bairros: [...MF.bairros]})));
    const mkNFiltros = () => [MF.preco, MF.a1 || MF.a2, MF.dorm.size, MF.ent, MF.fase.size, MF.zona.size, MF.bairros.size, MF.vagas, MF.inc].filter(Boolean).length;
    const mkFiltraPerfil = () => !!(MF.preco || MF.a1 || MF.a2 || MF.dorm.size || MF.zona.size || MF.bairros.size);

    function mkTipsOk(e){
      const out = [];
      for(const t of (Array.isArray(e.t) ? e.t : [])){
        if(!Array.isArray(t)) continue;
        const preco = +t[5] || 0;
        if(MF.est && t[6] != null && !(t[6] > 0)) continue;
        if(MF.preco && !(preco > 0 && preco <= MF.preco)) continue;
        if(MF.a1 && !(t[1] >= MF.a1)) continue;
        if(MF.a2 && !(t[1] <= MF.a2)) continue;
        if(MF.dorm.size && !MF.dorm.has(mkDormK(t))) continue;
        if(MF.vagas && !((+t[4] || 0) >= MF.vagas)) continue;
        out.push(t);
      }
      return out.sort((a, b) => ((a[5] > 0 ? a[5] : 9e12) - (b[5] > 0 ? b[5] : 9e12)) || a[1] - b[1]);
    }
    function mkEntregaOk(fk, en){
      if(!MF.ent || fk === 'pronto') return true;
      const ym = mkYM(en);
      return !!ym && ym <= (MF.ent === 'pronto' ? mkHojeYM() : MF.ent);
    }
    function mkEmpOk(e, termos){
      if(MF.fase.size && !MF.fase.has(e._fk)) return false;
      if(!mkEntregaOk(e._fk, e.en)) return false;
      if(MF.zona.size && !MF.zona.has(e._z)) return false;
      if(MF.bairros.size && !MF.bairros.has(e.b)) return false;
      if(MF.inc && !mkNorm(e.d).includes(mkNorm(MF.inc))) return false;
      for(const w of termos) if(!e._tx.includes(w)) return false;
      return true;
    }
    function mkResultados(){
      const out = [], termos = mkNorm(mk.q).split(' ').filter(Boolean);
      for(const e of mk.IDX.e){
        if(!e || !mkEmpOk(mkPrep(e), termos)) continue;
        const ts = mkTipsOk(e); if(!ts.length) continue;
        const comP = ts.filter(t => t[5] > 0);
        const p = comP.length ? +comP[0][5] : 0;
        const m2 = comP.filter(t => t[1] > 0).reduce((m, t) => Math.min(m, t[5] / t[1]), Infinity);
        out.push({e, ts, p, m2, est: ts.reduce((s, t) => s + (+t[6] || 0), 0)});
      }
      const semP = x => x.p > 0 ? 0 : 1, k = MF.ordem;
      out.sort((a, b) =>
        k === 'm2' ? (semP(a) - semP(b) || a.m2 - b.m2) :
        k === 'entrega' ? ((mkYM(a.e.en) || '9999').localeCompare(mkYM(b.e.en) || '9999') || semP(a) - semP(b) || a.p - b.p) :
        k === 'estoque' ? (b.est - a.est) :
        k === 'novos' ? (String(b.e.ld || '').localeCompare(String(a.e.ld || '')) || semP(a) - semP(b) || a.p - b.p) :
        (semP(a) - semP(b) || a.p - b.p));
      return out;
    }

    // ---------- nossa carteira (dado ao vivo do app, nunca o da Órulo) ----------
    const mkDormsBase = () => MF.dorm.size ? new Set([...MF.dorm].map(k => MK_TIPO_BASE[k]).filter(Boolean)) : null;
    function mkNossos(){   // mesmo perfil da busca: preço, metragem, tipo, região, bairro, fase e entrega
      const out = [], dorms = mkDormsBase(), bs = [...MF.bairros].map(mkNorm), hoje = mkHojeYM();
      for(const p of S.P){
        if(!p.livres) continue;
        if(MF.zona.size){ const z = p.zona || mkZonaDe({b: p.bairro, c: p.cidade}); if(!z || !MF.zona.has(z)) continue; }
        if(bs.length && !bs.includes(mkNorm(p.bairro))) continue;
        if(MF.ent || MF.fase.size){   // fase pelo que o projeto tem no espelho; entrega só conta se houver data (ou se já está pronto)
          const fk = p.fase || (p.entrega ? (mkYM(p.entrega) <= hoje ? 'pronto' : 'obras') : '');
          if(MF.fase.size && !(fk && MF.fase.has(fk))) continue;
          if(MF.ent && !(fk === 'pronto' || (p.entrega && mkEntregaOk(fk, p.entrega)))) continue;
        }
        const us = S.U ? (S.U.get(p.id) || []) : null;
        if(us){
          let n = 0, pmin = 0;
          for(const u of us){
            const preco = +u.p || +u.pv || 0, a = +u.a || 0;
            if(MF.preco && !(preco > 0 && preco <= MF.preco)) continue;
            if(MF.a1 && !(a >= MF.a1)) continue;
            if(MF.a2 && !(a <= MF.a2)) continue;
            if(dorms && !(u.k && dorms.has(u.k))) continue;
            n++; if(preco > 0 && (!pmin || preco < pmin)) pmin = preco;
          }
          if(n) out.push({p, n, pmin});
        }else{   // sem o índice de unidades: a conta aproximada pelo resumo do projeto, como o filtro de Imóveis
          const pr = p.preco != null ? p.preco : p.avista;
          if(MF.preco && !(pr > 0 && pr <= MF.preco)) continue;
          if(MF.a1 && !(p.amax >= MF.a1)) continue;
          if(MF.a2 && !(p.amin > 0 && p.amin <= MF.a2)) continue;
          if(dorms && ![...dorms].some(k => String(p.tipos || '').includes(k))) continue;
          out.push({p, n: null, pmin: pr || 0});
        }
      }
      return out.sort((a, b) => ((b.n || 0) - (a.n || 0)) || (b.p.v7 - a.p.v7) || (b.p.livres - a.p.livres));
    }
    function mkPerto(e, ts){   // na ficha: o que temos ao vivo a até 3 km (ou no mesmo bairro), com tipologia parecida
      const c = mkCoord(e), b = mkNorm(mkBairroLimpo(e.b));
      const ks = new Set((ts.length ? ts : (Array.isArray(e.t) ? e.t : [])).filter(Array.isArray).map(t => MK_TIPO_BASE[mkDormK(t)]).filter(Boolean));
      const out = [];
      for(const p of S.P){
        if(!p.livres) continue;
        let d = null;
        if(c && p.lat != null && p.lng != null){ d = distKm(c, p); if(!(d <= 3)) continue; }
        else if(!(b && mkNorm(p.bairro) === b)) continue;
        if(ks.size && ![...ks].some(k => String(p.tipos || '').includes(k))) continue;
        out.push({p, d});
      }
      return out.sort((x, y) => (x.d == null ? 99 : x.d) - (y.d == null ? 99 : y.d)).slice(0, 6);
    }
    function mkLinhaNosso(x){
      const p = x.p, pr = x.pmin || (p.preco != null ? p.preco : p.avista);
      const l3 = x.n != null ? plural(x.n, 'unidade livre', 'unidades livres') + ' no perfil' : (x.d != null ? 'A ' + kmTxt(x.d) + ', ' : '') + plural(p.livres, 'livre', 'livres');
      return '<li><a href="#/p/' + esc(p.id) + '">' + miniProj(p) + '<span class="meio"><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span><span>' + esc(l3) + '</span></span>' +
        '<span class="fim">' + (pr ? '<b class="num">' + esc(BRLc(pr)) + '</b><span>a partir de</span>' : '<span>sem preço</span>') + '</span></a></li>';
    }
    function mkNossosHtml(){
      if(!mkFiltraPerfil()) return '';
      const ns = mkNossos(); if(!ns.length) return '';
      const tot = ns.reduce((s, x) => s + (x.n || 0), 0), aprox = ns.some(x => x.n == null);
      const tit = aprox ? plural(ns.length, 'projeto que acompanhamos tem', 'projetos que acompanhamos têm') + ' unidade livre com esse perfil, pelo resumo do espelho.'
        : plural(tot, 'unidade livre', 'unidades livres') + ' com esse perfil em ' + plural(ns.length, 'projeto', 'projetos') + ' que acompanhamos nos espelhos.';
      return '<section class="caixa mk-nossos" aria-labelledby="mk-nos-t"><div class="sec-cab"><h2 class="t-3" id="mk-nos-t">Da nossa carteira</h2>' + MK_PONTO + '</div>' +
        '<p class="texto-2">' + esc(tit) + '</p><ul class="lista-proj">' + ns.slice(0, 6).map(mkLinhaNosso).join('') + '</ul>' +
        (ns.length > 6 ? '<a class="link-mais" href="#/imoveis" data-acao="mk-ver-imoveis">Ver os ' + ns.length + ' em Imóveis ' + ICO.seta + '</a>' : '') + '</section>';
    }
    function mkPertoHtml(e, ts){
      const ns = mkPerto(e, ts); if(!ns.length) return '';
      return '<section class="sec mk-sec" aria-labelledby="mk-per-t"><div class="sec-cab"><h2 class="t-2" id="mk-per-t">Da nossa carteira, perto daqui</h2>' + MK_PONTO + '</div>' +
        '<p class="texto-2">' + esc('Projetos que acompanhamos nos espelhos, ' + (mkCoord(e) ? 'a até 3 km' : 'no mesmo bairro') + ' e com tipologia parecida.') + '</p>' +
        '<ul class="lista-proj">' + ns.map(mkLinhaNosso).join('') + '</ul></section>';
    }

    // ---------- servidor ----------
    function mkStatus(forcar){   // a situação da base: o item do menu só existe com ela pronta
      if(!S.cod) return Promise.resolve(null);
      const st = mk.ST;
      if(st && st._cod === S.cod && !forcar && Date.now() - st._t < MK_ST_VALE) return Promise.resolve(st);
      if(mk.stPedido) return mk.stPedido;
      const cod = S.cod;
      mk.stPedido = rpc('mercado_status', {p_codigo: cod})
        .then(r => { if(r && r.ok && cod === S.cod){ r._t = Date.now(); r._cod = cod; mk.ST = r; } return mk.ST && mk.ST._cod === S.cod ? mk.ST : null; })
        .catch(e => { if(mkSair(e)) return null; return mk.ST && mk.ST._cod === S.cod ? mk.ST : null; })
        .finally(() => { mk.stPedido = null; });
      return mk.stPedido;
    }
    function mkAplicarStatus(s){
      if(!s) return;
      const it = MAIS_X.find(i => i.aba === 'mercado');
      if(it && s.total > 0) it.desc = plural(+s.total, 'empreendimento', 'empreendimentos') + ' do resto do mercado, pela Órulo';
      const pronto = !!s.pronto;
      if(pronto === !!S.mercadoPronto) return;
      S.mercadoPronto = pronto; atualizarLateral();
      if(location.hash === '#/mais' && !document.querySelector('dialog[open]')) render();
    }
    async function mkConferir(){ mkAplicarStatus(await mkStatus(true)); }
    function mkCarregar(forcar){
      const I = mk.IDX;
      if(I && I._cod === S.cod && !forcar && Date.now() - I._t < MK_IDX_VALE) return Promise.resolve(I);
      if(mk.idxPedido) return mk.idxPedido;
      const cod = S.cod;
      mk.idxPedido = rpc('mercado_indice', {p_codigo: cod}, 60000)
        .then(r => {
          if(!r || r.ok === false || !Array.isArray(r.e)) throw new Error((r && r.erro) || 'sem_dados');
          if(cod !== S.cod) throw new Error('codigo_mudou');
          r._t = Date.now(); r._cod = cod;
          mk.IDX = r; mk.porId = new Map(r.e.filter(Boolean).map(e => [String(e.i), e])); mk.bairros = null; mk.erro = null;
          return r;
        })
        .catch(e => { mk.erro = e; mk.erroEm = Date.now(); throw e; })
        .finally(() => { mk.idxPedido = null; });
      return mk.idxPedido;
    }
    const mkTemIdx = () => !!(mk.IDX && mk.IDX._cod === S.cod);
    // a página espera a base: carregando, fora do ar, erro ou pronta (null)
    function mkPortaoHtml(alvo){
      if(mkTemIdx()) return null;
      const st = mk.ST && mk.ST._cod === S.cod ? mk.ST : null;
      if(st && !st.pronto) return '<div class="vazio"><h2 class="t-3">O Mercado ainda não está no ar</h2><p class="texto-2">A base da Órulo ainda está sendo preparada. O Mercado aparece no menu assim que ficar pronto.</p>' +
        (S.admin ? '<a class="btn" href="#/perfil">Ver a integração no Perfil</a>' : '<a class="btn" href="#/imoveis">Ver os imóveis</a>') + '</div>';
      if(mk.erro && !mk.idxPedido && Date.now() - mk.erroEm < 30e3) return '<div class="faixa-aviso" role="alert"><div class="aviso erro">' + ICO.nuvem + '<p>Não consegui carregar o mercado agora. Confira a internet e tente de novo.</p></div>' +
        '<button type="button" class="btn btn-largo" data-acao="mk-recarregar">Tentar de novo</button></div>';
      pos.push(() => mkGarantir(alvo));
      return '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:52px"></div><div class="brilho" style="height:240px"></div><div class="brilho" style="height:240px"></div><p class="sub">Carregando o mercado…</p></div>';
    }
    async function mkGarantir(alvo){
      const st = await mkStatus();
      if(location.hash !== alvo || !S.cod) return;
      if(st && !st.pronto){ mkAplicarStatus(st); render(); return; }
      try{ await mkCarregar(); }catch(e){ if(mkSair(e)) return; }
      if(location.hash === alvo) render();
    }

    // ---------- fotos ----------
    const mkIni = e => { const w = String(e.n || '').split(/\s+/).filter(x => x.length > 2).slice(0, 2).map(x => x[0]).join('').toUpperCase(); return w || String(e.n || '?').charAt(0).toUpperCase(); };
    const mkCapaVazia = (e, cls) => '<span class="capa-vazia' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><b>' + esc(mkIni(e)) + '</b><small>Sem foto</small></span>';
    const mkFoto = (e, o) => { const u = urlSegura(e.im); return u ? imgTag(u, o.alt || '', o.cls || '', {w: o.w || 720, sizes: o.sizes, sigla: mkIni(e)}) : mkCapaVazia(e, o.cls); };
    const mkMini = e => '<span class="redonda">' + (urlSegura(e.im) ? imgTag(urlSegura(e.im), '', '', {w: 160, sizes: '56px', sigla: mkIni(e)}) : '<span class="capa-vazia"><b>' + esc(mkIni(e)) + '</b></span>') + '</span>';

    // ---------- busca: cabeçalho, painel de filtros e resultados ----------
    function mkSubTxt(){
      const I = mkTemIdx() ? mk.IDX : null;
      if(!I) return mk.ST && mk.ST.total > 0 ? plural(+mk.ST.total, 'empreendimento', 'empreendimentos') + ' da Órulo' : 'O resto do mercado pela Órulo';
      return plural(I.e.length, 'empreendimento', 'empreendimentos') + ' da Órulo' + (I.versao && mkQuando(I.versao) ? ', atualizado ' + mkQuando(I.versao) : '');
    }
    function mkBairrosMapa(){
      if(mk.bairros) return mk.bairros;
      const n = new Map(); for(const e of (mkTemIdx() ? mk.IDX.e : [])) if(e && e.b) n.set(e.b, (n.get(e.b) || 0) + 1);
      return (mk.bairros = n);
    }
    function mkBairrosChips(){   // os 14 bairros com mais empreendimentos, ou os que batem com a busca, mais os já marcados
      const cnt = mkBairrosMapa(), bq = mkNorm(mk.bq);
      let bs = [...cnt.keys()];
      bs = bq ? bs.filter(b => mkNorm(b).includes(bq)).sort((a, b) => cnt.get(b) - cnt.get(a)).slice(0, 24)
        : bs.sort((a, b) => (cnt.get(b) - cnt.get(a)) || a.localeCompare(b, 'pt-BR')).slice(0, 14);
      const sel = [...MF.bairros].filter(b => !bs.includes(b));
      return sel.concat(bs.sort((a, b) => a.localeCompare(b, 'pt-BR'))).map(b => '<button type="button" class="pilula peq" data-acao="mk-f" data-g="bairros" data-v="' + esc(b) + '" aria-pressed="' + MF.bairros.has(b) + '">' + esc(b) +
        (cnt.has(b) ? '<span class="n">' + cnt.get(b) + '</span>' : '') + '</button>').join('') + (bq && !bs.length ? '<p class="texto-2">Nenhum bairro com esse nome.</p>' : '');
    }
    function mkPainelHtml(){
      const sec = (id, tit, corpo, dica) => '<section class="fsec" data-sec="mk-' + id + '"><h3>' + esc(tit) + (dica ? '<small>' + esc(dica) + '</small>' : '') + '</h3>' + corpo + '</section>';
      const pil = (acao, g, v, rot, on) => '<button type="button" class="pilula peq" data-acao="' + acao + '"' + (g ? ' data-g="' + g + '"' : '') + ' data-v="' + esc(v) + '" aria-pressed="' + !!on + '">' + esc(rot) + '</button>';
      const campo = (c, rot, val, ph, suf, modo, so) => '<label class="campo mini"><span' + (so ? ' class="sr"' : '') + '>' + esc(rot) + '</span><span class="campo-suf"><input inputmode="' + (modo || 'numeric') + '" autocomplete="off" placeholder="' + esc(ph) + '" value="' + esc(val) + '" data-input="mk-num" data-campo="' + c + '">' + (suf ? '<i>' + suf + '</i>' : '') + '</span></label>';
      const area = v => v ? String(v).replace('.', ',') : '';
      const y = +diaKey(Date.now()).slice(0, 4);
      const ents = [['', 'Tanto faz'], ['pronto', 'Pronto para morar']].concat([0, 1, 2, 3, 4].map(k => [(y + k) + '-12', 'até dez/' + (y + k)]));
      if(MF.ent && !ents.some(x => x[0] === MF.ent)) ents.push([MF.ent, mkEntTxt(MF.ent)]);
      let h = sec('preco', 'Valor até', campo('preco', 'Valor até', MF.preco ? MF.preco.toLocaleString('pt-BR') : '', 'Ex.: 450 mil', '', 'numeric', true) +
        '<div class="pilulas">' + MK_RAPIDOS.map(o => pil('mk-preco', '', o[0], 'até ' + o[1], MF.preco === o[0])).join('') + '</div>', 'a partir de, por tipologia');
      h += sec('area', 'Metragem', '<div class="campos-2">' + campo('a1', 'De', area(MF.a1), '0', 'm²', 'decimal') + campo('a2', 'Até', area(MF.a2), 'Máx.', 'm²', 'decimal') + '</div>');
      h += sec('dorm', 'Tipo de unidade', '<div class="pilulas">' + MK_DORMS.map(o => pil('mk-f', 'dorm', o[0], o[1], MF.dorm.has(o[0]))).join('') + '</div>');
      h += sec('ent', 'Entrega', '<div class="pilulas">' + ents.map(o => pil('mk-f1', 'ent', o[0], o[1], MF.ent === o[0])).join('') + '</div>' +
        '<p class="fsub">Fase da obra</p><div class="pilulas">' + MK_FASES.map(o => pil('mk-f', 'fase', o[0], o[1], MF.fase.has(o[0]))).join('') + '</div>');
      h += sec('regiao', 'Região', '<div class="pilulas">' + MK_ZONAS.map(o => pil('mk-f', 'zona', o[0], o[1], MF.zona.has(o[0]))).join('') + '</div>' +
        '<p class="fsub">Bairros</p><label class="busca mini"><span class="sr">Buscar bairro</span>' + ICO.lupa + '<input type="search" autocomplete="off" placeholder="Buscar bairro" value="' + esc(mk.bq) + '" data-input="mk-bq"></label>' +
        '<div class="pilulas" data-mk="bairros">' + mkBairrosChips() + '</div>');
      h += sec('vagas', 'Vagas', '<div class="pilulas">' + MK_VAGAS.map(o => pil('mk-f1', 'vagas', o[0], o[1], MF.vagas === o[0])).join('') + '</div>');
      h += sec('inc', 'Incorporadora', '<label class="busca mini"><span class="sr">Nome da incorporadora</span>' + ICO.lupa + '<input type="search" autocomplete="off" placeholder="Nome da incorporadora" value="' + esc(MF.inc) + '" data-input="mk-inc"></label>');
      h += sec('est', 'Estoque', '<div class="pilulas">' + pil('mk-f1', 'est', '1', 'Só com estoque', MF.est) + pil('mk-f1', 'est', '0', 'Incluir esgotadas', !MF.est) + '</div>', 'por tipologia');
      h += '<div class="painel-pe so-largo"><button type="button" class="btn btn-largo" data-acao="mk-limpar">Limpar os filtros</button><p class="nota">A busca vale para o resto do mercado. Os projetos que acompanhamos estão em Imóveis.</p></div>';
      return h;
    }
    const mkCaixasPainel = () => [$('#mk-painel'), $('#folha-mk-filtros .folha-corpo')].filter(Boolean);
    function mkRepintarPainel(){ for(const box of mkCaixasPainel()){ const y = box.scrollTop; box.innerHTML = mkPainelHtml(); box.scrollTop = y; } }
    function mkMarcarPainel(){   // só as marcas e os campos sem foco: não tira o foco de quem está digitando
      for(const box of mkCaixasPainel()){
        $$('[data-acao="mk-f"]', box).forEach(b => { const s = MF[b.dataset.g]; b.setAttribute('aria-pressed', !!(s instanceof Set && s.has(b.dataset.v))); });
        $$('[data-acao="mk-f1"]', box).forEach(b => { const g = b.dataset.g, v = b.dataset.v; b.setAttribute('aria-pressed', g === 'ent' ? MF.ent === v : g === 'vagas' ? MF.vagas === +v : g === 'est' ? MF.est === (v === '1') : false); });
        $$('[data-acao="mk-preco"]', box).forEach(b => b.setAttribute('aria-pressed', MF.preco === +b.dataset.v));
        $$('[data-input="mk-num"]', box).forEach(i => { if(i === document.activeElement) return; const c = i.dataset.campo, v = MF[c]; i.value = !v ? '' : c === 'preco' ? v.toLocaleString('pt-BR') : String(v).replace('.', ','); });
        $$('[data-input="mk-inc"]', box).forEach(i => { if(i !== document.activeElement) i.value = MF.inc; });
      }
    }
    function mkAtivos(){
      const L = [];
      if(mk.q.trim()) L.push(['q', '“' + mk.q.trim() + '”']);
      if(MF.preco) L.push(['preco', 'Até ' + milTxt(MF.preco)]);
      if(MF.a1 || MF.a2) L.push(['area', MF.a1 && MF.a2 ? 'De ' + String(MF.a1).replace('.', ',') + ' a ' + mkM2(MF.a2) : MF.a2 ? 'Até ' + mkM2(MF.a2) : 'A partir de ' + mkM2(MF.a1)]);
      MK_DORMS.forEach(o => { if(MF.dorm.has(o[0])) L.push(['dorm:' + o[0], o[1]]); });
      if(MF.ent) L.push(['ent', MF.ent === 'pronto' ? 'Pronto para morar' : 'Entrega ' + mkEntTxt(MF.ent)]);
      MK_FASES.forEach(o => { if(MF.fase.has(o[0])) L.push(['fase:' + o[0], o[1]]); });
      MK_ZONAS.forEach(o => { if(MF.zona.has(o[0])) L.push(['zona:' + o[0], o[1]]); });
      MF.bairros.forEach(b => L.push(['bairros:' + b, b]));
      if(MF.vagas) L.push(['vagas', MF.vagas > 1 ? MF.vagas + ' vagas ou mais' : '1 vaga ou mais']);
      if(MF.inc) L.push(['inc', 'Incorporadora: ' + MF.inc]);
      if(!MF.est) L.push(['est', 'Com esgotadas']);
      return L;
    }
    function mkTirar(k){
      const [g, v] = String(k).split(/:(.*)/s);
      if(g === 'q'){ mk.q = ''; const i = $('#mk-q'); if(i) i.value = ''; const l = $('#mk-q-x'); if(l) l.hidden = true; }
      else if(g === 'preco') MF.preco = null;
      else if(g === 'area'){ MF.a1 = null; MF.a2 = null; }
      else if(g === 'ent') MF.ent = '';
      else if(g === 'vagas') MF.vagas = 0;
      else if(g === 'inc') MF.inc = '';
      else if(g === 'est') MF.est = true;
      else if(MF[g] instanceof Set) MF[g].delete(v);
    }
    const mkVerTxt = () => { const n = mk.rs ? mk.rs.length : 0; return n ? 'Ver ' + plural(n, 'resultado', 'resultados') : 'Nenhum resultado'; };
    function mkBolha(){
      const nf = mkNFiltros(), bf = $('#mk-btn-f'); if(!bf) return;
      bf.classList.toggle('ligado', !!nf); bf.setAttribute('aria-label', nf ? 'Filtros, ' + nf + (nf === 1 ? ' ligado' : ' ligados') : 'Filtros');
      const b = bf.querySelector('.bolha');
      if(nf){ if(b) b.textContent = nf; else bf.insertAdjacentHTML('beforeend', '<span class="bolha" aria-hidden="true">' + nf + '</span>'); } else if(b) b.remove();
    }
    function mkCard(r){
      const e = r.e, fk = e._fk, perfil = mkFiltraPerfil();
      const tips = r.ts.slice(0, 3).map(t => mkTipTxt(t));
      if(r.ts.length > 3) tips.push('mais ' + (r.ts.length - 3));
      const ent = fk === 'pronto' ? 'Pronto para morar' : e.en && mesAno(mkYM(e.en)) ? 'Entrega em ' + mesAno(mkYM(e.en)) : '';
      const info = [maiusc1(mkE(tips)), ent].filter(Boolean).join('. ');
      let est = '', cls = 'card-est';
      if(perfil && r.est > 0){ est = plural(r.est, 'unidade', 'unidades') + ' no filtro'; cls = 'card-match'; }
      else if(e.es > 0) est = plural(+e.es, 'unidade', 'unidades') + ' em estoque';
      else if(e.es === 0) est = 'Sem estoque';
      return '<a class="card mk-card" href="#/mercado/' + encodeURIComponent(e.i) + '">' +
        '<span class="card-foto">' + mkFoto(e, {w: 720, sizes: SIZES_CARD}) + '<span class="card-selos"><span class="selo">' + esc(MK_FASE[fk]) + '</span></span></span>' +
        '<span class="card-corpo"><span class="card-quem">' + esc([e.d, mkOnde(e)].filter(Boolean).join(', ')) + '</span><span class="card-nome">' + esc(e.n) + '</span>' +
        (r.p > 0 ? '<span class="card-preco"><small>' + (perfil ? 'No filtro, a partir de' : 'A partir de') + '</small><b class="num">' + esc(BRL(r.p)) + '</b></span>' : '<span class="card-preco sem">Preço sob consulta</span>') +
        (info ? '<span class="card-info">' + esc(info) + '.</span>' : '') + (est ? '<span class="' + cls + '">' + esc(est) + '</span>' : '') + '</span></a>';
    }
    const mkMaisHtml = () => { const resto = mk.rs.length - mk.mostra; return resto > 0 ? '<button type="button" class="btn btn-largo" id="mk-mais" data-acao="mk-mais">' + esc('Mostrar mais ' + Math.min(resto, MK_PASSO) + ' de ' + resto.toLocaleString('pt-BR')) + '</button>' : ''; };
    function mkAtualizar(){
      const box = $('#mk-res'); if(!box || !mkTemIdx()) return;
      const rs = mk.rs = mkResultados();
      const sub = $('#mk-sub'); if(sub) sub.textContent = mkSubTxt();
      const demo = $('#mk-demo'); if(demo) demo.innerHTML = mk.IDX.demo ? '<p class="aviso fino" role="status">Prévia com dados de exemplo.</p>' : '';
      const L = mkAtivos(), ch = $('#mk-chips');
      if(ch) ch.innerHTML = L.length ? '<div class="pilulas ativos" aria-label="Filtros ligados">' + L.map(x => '<button type="button" class="pilula peq" data-acao="mk-tirar" data-v="' + esc(x[0]) + '" aria-label="Tirar o filtro ' + esc(x[1]) + '">' + esc(x[1]) + ICO.x + '</button>').join('') +
        '<button type="button" class="link-mais" data-acao="mk-limpar">Limpar tudo</button></div>' : '';
      const n = $('#mk-n'); if(n) n.innerHTML = rs.length ? '<b class="num">' + rs.length.toLocaleString('pt-BR') + '</b> ' + (rs.length === 1 ? 'empreendimento' : 'empreendimentos') : 'Nenhum empreendimento';
      const sel = $('#mk-ordem'); if(sel && sel.value !== MF.ordem) sel.value = MF.ordem;
      mkBolha();
      const ns = $('#mk-nossos'); if(ns) ns.innerHTML = mkNossosHtml();
      box.innerHTML = rs.length ? '<div class="grade-cards mk-grade" id="mk-grade">' + rs.slice(0, mk.mostra).map(mkCard).join('') + '</div>' + mkMaisHtml()
        : '<div class="vazio"><h2 class="t-3">Nada no mercado com esses filtros</h2><p class="texto-2">' + (mk.q.trim() ? 'Confira o nome ou busque só uma parte dele. ' : '') + 'Tente subir o valor, abrir a metragem ou tirar a data de entrega.</p><button type="button" class="btn" data-acao="mk-limpar">Limpar os filtros</button></div>';
      mkObservar();
      const vn = $('#mk-ver-n'); if(vn) vn.textContent = mkVerTxt();
    }
    function mkMais(){   // próximos 24 entram no fim da grade, sem repintar o que já está na tela
      const rs = mk.rs, g = $('#mk-grade'); if(!rs || !g) return;
      const de = mk.mostra; mk.mostra = Math.min(rs.length, mk.mostra + MK_PASSO);
      g.insertAdjacentHTML('beforeend', rs.slice(de, mk.mostra).map(mkCard).join(''));
      const b = $('#mk-mais'); if(!b) return;
      const resto = rs.length - mk.mostra;
      if(resto <= 0) b.remove(); else b.textContent = 'Mostrar mais ' + Math.min(resto, MK_PASSO) + ' de ' + resto.toLocaleString('pt-BR');
    }
    // Pedido do Luiz (08/10/2026): sem clicar em "Mostrar mais". Quando o fim da lista chega perto, os próximos entram sozinhos.
    function mkObservar(){
      if(mk.io){ mk.io.disconnect(); mk.io = null; }
      const b = $('#mk-mais'); if(!b || !('IntersectionObserver' in window)) return;
      const io = mk.io = new IntersectionObserver(es => {
        if(!es.some(x => x.isIntersecting)) return;
        const bt = $('#mk-mais'); if(!bt){ io.disconnect(); return; }
        mkMais();
        const nb = $('#mk-mais'); if(nb){ io.unobserve(nb); io.observe(nb); } else io.disconnect();   // se o botão continuar à vista, entra mais uma leva
      }, {rootMargin: '0px 0px 800px 0px'});
      io.observe(b);
    }
    function mkMudou(){ mkGravarF(); mk.mostra = MK_PASSO; mkAtualizar(); mkMarcarPainel(); }
    function mkDepoisLista(){
      const I = mk.IDX;
      if(I && Date.now() - I._t > MK_IDX_VALE) mkCarregar(true).then(() => { if(location.hash === '#/mercado') mkAtualizar(); }).catch(e => { mkSair(e); });
      if(mkFiltraPerfil() && !S.U) Promise.resolve(carregarUnidades()).then(() => { const b = $('#mk-nossos'); if(b && location.hash === '#/mercado') b.innerHTML = mkNossosHtml(); }).catch(() => {});
    }
    function telaMkLista(){
      const cab = '<header class="pg-cab"><div><h1 class="t-1">Mercado</h1><p class="sub" id="mk-sub">' + esc(mkSubTxt()) + '</p></div></header>';
      const g = mkPortaoHtml(location.hash); if(g != null) return cab + g;
      pos.push(() => { mkAtualizar(); mkDepoisLista(); });
      const n = mkNFiltros();
      return cab + '<div class="busca-linha"><label class="busca"><span class="sr">Buscar no mercado</span>' + ICO.lupa +
        '<input id="mk-q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Nome, bairro ou incorporadora" value="' + esc(mk.q) + '" data-input="mk-q">' +
        '<button type="button" class="limpar" id="mk-q-x" data-acao="mk-limpar-q" aria-label="Limpar a busca"' + (mk.q ? '' : ' hidden') + '>' + ICO.fechar + '</button></label>' +
        '<button type="button" class="btn-filtro so-estreito' + (n ? ' ligado' : '') + '" id="mk-btn-f" data-acao="mk-filtros" aria-label="' + (n ? 'Filtros, ' + n + (n === 1 ? ' ligado' : ' ligados') : 'Filtros') + '">' + ICO.filtro + (n ? '<span class="bolha" aria-hidden="true">' + n + '</span>' : '') + '</button></div>' +
        '<div class="imv-grade">' + (largo() ? '<aside class="painel-f" id="mk-painel" aria-label="Filtros do mercado">' + mkPainelHtml() + '</aside>' : '') +
        '<div class="imv-col"><div id="mk-demo"></div><div id="mk-chips"></div>' +
        '<div class="contagem"><p id="mk-n" aria-live="polite"></p><label class="sr" for="mk-ordem">Ordenar por</label><select id="mk-ordem" class="sel" data-input="mk-ordem">' +
        MK_ORDENS.map(o => '<option value="' + o[0] + '"' + (MF.ordem === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
        '<div id="mk-nossos"></div><div id="mk-res"></div>' +
        '<p class="nota mk-fonte">Fonte: Órulo, pela integração oficial. Os valores são “a partir de” (a unidade mais barata de cada tipologia) e podem mudar, então confirme com a incorporadora. Os projetos que acompanhamos ao vivo ficam fora desta busca: eles estão em Imóveis.</p></div></div>';
    }

    // ---------- ficha do empreendimento ----------
    function mkFatosHtml(e, d, todas){
      const fk = e._fk, m2 = mkComPreco(todas).filter(t => t[1] > 0).reduce((m, t) => Math.min(m, t[5] / t[1]), Infinity);
      const mes = s => { const m = mesAno(mkYM(s)); return m ? maiusc1(m) : ''; };
      const fatos = [
        ['Fase', MK_FASE[fk]],
        ['Entrega', fk === 'pronto' ? 'Pronto para morar' : mes(e.en) || 'A definir'],
        d && d.lancamento ? ['Lançamento', mes(d.lancamento)] : null,
        e.es != null && isFinite(+e.es) ? ['Estoque', (+e.es).toLocaleString('pt-BR') + (e.tt > 0 ? ' de ' + (+e.tt).toLocaleString('pt-BR') : '') + ' unid.'] : null,
        isFinite(m2) ? ['R$/m² a partir de', BRL(m2)] : null,
        d && (d.torres > 0 || d.andares > 0) ? ['Prédio', [d.torres > 0 ? plural(+d.torres, 'torre', 'torres') : '', d.andares > 0 ? plural(+d.andares, 'andar', 'andares') : ''].filter(Boolean).join(', ')] : null
      ].filter(x => x && x[1]);
      return '<ul class="fatos">' + fatos.map(f => '<li><small>' + esc(f[0]) + '</small><b>' + esc(f[1]) + '</b></li>').join('') + '</ul>';
    }
    function mkTipsHtml(e, ts, todas){
      if(!todas.length) return '';
      const ok = new Set(ts.map(t => t.join('|'))), destaca = ts.length > 0 && ts.length < todas.length;
      return '<section class="sec mk-sec" aria-labelledby="mk-tip-t"><h2 class="t-2" id="mk-tip-t">Tipologias <span class="q">' + todas.length + '</span></h2>' +
        '<div class="tab-tipos mk-tt" role="table" aria-label="Tipologias"><div class="tt-lin cab" role="row"><span role="columnheader">Tipologia</span><span role="columnheader" class="mk-lg">Área</span><span role="columnheader" class="mk-lg">Vagas</span>' +
        '<span role="columnheader">Estoque</span><span role="columnheader" class="dir">A partir de</span></div>' +
        todas.map(t => {
          const bate = destaca && ok.has(t.join('|')), area = t[1] > 0 ? mkM2(t[1]) : '';
          const est = t[6] == null ? '' : t[6] > 0 ? plural(+t[6], 'unid.', 'unid.') : 'esgotada';
          return '<div class="tt-lin' + (bate ? ' mk-ok' : '') + '" role="row"><span role="cell"><b>' + esc(mkTipTxt(t, true)) + '</b>' + (bate ? '<span class="sr">, serve para a busca</span>' : '') +
            '<small class="mk-cel">' + esc([area, mkVagaTxt(t[4])].filter(Boolean).join(', ')) + '</small></span>' +
            '<span role="cell" class="mk-lg num">' + esc(area) + '</span><span role="cell" class="mk-lg">' + esc(mkVagaTxt(t[4])) + '</span>' +
            '<span role="cell" class="num' + (t[6] === 0 ? ' mk-zero' : '') + '">' + esc(est) + '</span>' +
            '<span role="cell" class="dir num' + (t[5] > 0 ? ' ouro' : ' apoio') + '">' + esc(t[5] > 0 ? BRL(+t[5]) : 'sob consulta') + '</span></div>';
        }).join('') + '</div>' + (destaca ? '<p class="nota">Em destaque, as que servem para a sua busca.</p>' : '') + '</section>';
    }
    function mkPainelFichaHtml(e, d, todas){
      const ref = mkComPreco(todas).sort((a, b) => a[5] - b[5])[0], c = mkCoord(e);
      const mapa = c ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.lat + ',' + c.lng) : null;
      const book = mk.ST && mk.ST.login ? '<button type="button" class="btn" data-acao="mk-material" data-id="' + esc(e.i) + '">' + ICO.livro + 'Book e tabela</button>'
        : '<a class="btn" href="' + esc(mkUrlOrulo(e, d)) + '" target="_blank" rel="noopener">' + ICO.livro + 'Book na Órulo</a>';
      return '<section class="painel-proj" aria-labelledby="mk-cot-t"><h2 class="rotulo" id="mk-cot-t">' + (ref ? 'A partir de' : 'Preço') + '</h2>' +
        (ref ? '<p class="valor num">' + esc(BRL(+ref[5])) + '</p><p class="texto-2">' + esc('Na tipologia ' + mkTipTxt(ref) + (ref[4] > 0 ? ', com ' + plural(+ref[4], 'vaga', 'vagas') : '') + '.') + '</p>' : '<p class="valor sem">Sob consulta</p>') +
        '<div class="acoes-proj"><button type="button" class="btn btn-pri btn-alto" data-acao="mk-enviar" data-id="' + esc(e.i) + '">' + ICO.enviar + 'Enviar ao cliente</button>' +
        '<div class="btn-linha' + (mapa ? '' : ' mk-um') + '">' + book + (mapa ? '<a class="btn" href="' + esc(mapa) + '" target="_blank" rel="noopener">' + ICO.pino + 'Ver no mapa</a>' : '') + '</div></div>' +
        '<p class="nota">' + esc('Fonte: Órulo' + (d && mkQuando(d.tabela_em) ? ', tabela atualizada ' + mkQuando(d.tabela_em) : '') + '. Valores “a partir de”, sujeitos a alteração.') + '</p></section>';
    }
    function mkFichaHtml(e, ts, st){
      const d = st && st.d, todas = mkTodas(e, d);
      const fotos = [], vistos = new Set();
      const add = (u, t) => { const src = urlSegura(u); if(!src || vistos.has(src)) return; vistos.add(src); fotos.push({src, t: String(t || '')}); };
      if(d && Array.isArray(d.imagens)) d.imagens.slice(0, 40).forEach(f => { if(f) add(f.u, f.t); });
      if(!fotos.length) add(e.im, 'Fachada');
      const plantas = d && Array.isArray(d.plantas) ? d.plantas.slice(0, 40).map(f => f && urlSegura(f.u) ? {src: urlSegura(f.u), t: String(f.t || 'Planta'), sub: ''} : null).filter(Boolean) : [];
      S.plantasAtuais = plantas;   // a planta abre no visor do app (ação luz-planta)
      let gal;
      if(fotos.length) gal = galeriaHtml({nome: e.n, grupo: null}, fotos);   // mosaico no computador, trilho no celular (ação luz)
      else { S.fotosAtuais = []; gal = '<section class="galeria vazia" aria-label="Fotos">' + mkCapaVazia(e, 'galeria-vazia') + '</section>'; }
      const endereco = (d && typeof d.endereco === 'string' && d.endereco.trim()) || [mkBairroLimpo(e.b), e.c].filter(Boolean).join(', ');
      const migalha = '<nav class="migalha" aria-label="Caminho"><a href="#/mercado" data-acao="voltar">' + ICO.voltar + 'Mercado</a>' + (e.d ? '<span class="so-largo">' + esc(e.d) + '</span>' : '') + '<span class="so-largo" aria-current="page">' + esc(e.n) + '</span></nav>';
      const cab = '<header class="cab-proj"><p class="sub">' + esc([MK_FASE[e._fk] + (e.d ? ' da ' + e.d : ''), noBairro(mkBairroLimpo(e.b))].filter(Boolean).join(' ')) + '</p>' +
        '<h1 class="t-0">' + esc(e.n) + '</h1>' + (endereco ? '<p class="texto-2">' + ICO.pino + esc(endereco) + '</p>' : '') + '</header>' + mkFatosHtml(e, d, todas);
      let corpo = mkTipsHtml(e, ts, todas);
      if(!st) corpo += '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:120px"></div><p class="sub">Buscando fotos, plantas e lazer na Órulo…</p></div>';
      else if(st.erro) corpo += '<div class="faixa-aviso" role="alert"><div class="aviso erro">' + ICO.nuvem + '<p>Não consegui buscar fotos, plantas e lazer agora.</p></div><button type="button" class="btn" data-acao="mk-ficha-tentar" data-id="' + esc(e.i) + '">Tentar de novo</button></div>';
      corpo += mkMatHtml(e, d) + mkPertoHtml(e, ts);
      if(plantas.length) corpo += '<section class="sec mk-sec" aria-labelledby="mk-pla-t"><h2 class="t-2" id="mk-pla-t">Plantas <span class="q">' + plantas.length + '</span></h2><div class="grade-plantas">' +
        plantas.map((pl, i) => '<figure class="planta"><button type="button" class="mos-item" data-acao="luz-planta" data-i="' + i + '" aria-label="' + esc('Ampliar ' + pl.t) + '">' + imgTag(pl.src, pl.t, '', {w: 900, sizes: '(min-width: 1024px) 22vw, 70vw'}) + '</button><figcaption>' + esc(pl.t) + '</figcaption></figure>').join('') + '</div></section>';
      const lazer = d && Array.isArray(d.lazer) ? d.lazer.filter(x => typeof x === 'string' && x.trim()).slice(0, 24) : [];
      if(lazer.length) corpo += '<section class="sec mk-sec" aria-labelledby="mk-laz-t"><h2 class="t-2" id="mk-laz-t">Lazer e diferenciais <span class="q">' + lazer.length + '</span></h2><ul class="pilulas lazer">' + lazer.map(x => '<li class="pilula peq estatica">' + esc(x) + '</li>').join('') + '</ul></section>';
      const cond = d && Array.isArray(d.condicoes) ? d.condicoes.filter(x => typeof x === 'string' && x.trim()) : [];
      if(cond.length) corpo += '<section class="sec mk-sec" aria-labelledby="mk-cond-t"><h2 class="t-2" id="mk-cond-t">Condições de pagamento</h2><ul class="lista-txt">' + cond.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></section>';
      corpo += '<p class="legal">' + esc('Fonte: Órulo' + (d && mkQuando(d.tabela_em) ? ', tabela atualizada ' + mkQuando(d.tabela_em) : '') + '. Valores “a partir de”, sujeitos a alteração e à disponibilidade. Confirme com a incorporadora.') + '</p>';
      const painel = mkPainelFichaHtml(e, d, todas);
      return migalha + gal + '<div class="proj-grade"><div class="proj-main">' + cab + (largo() ? '' : painel) + corpo + '</div>' + (largo() ? '<aside class="proj-lado">' + painel + '</aside>' : '') + '</div>';
    }
    function mkCarregarFicha(e, alvo){
      const k = String(e.i); if(mk.fichaPedido.has(k)) return;
      const pr = rpc('mercado_ficha', {p_codigo: S.cod, p_id: e.i})
        .then(d => { mk.fichas.set(k, {d: d && typeof d === 'object' && d.ok !== false ? d : null, em: Date.now()}); })
        .catch(err => { if(mkSair(err)) return; mk.fichas.set(k, {d: null, em: Date.now(), erro: true}); })
        .finally(() => { mk.fichaPedido.delete(k); if(location.hash === alvo && S.cod) render(); });
      mk.fichaPedido.set(k, pr);
    }
    function telaMkFicha(id, alvo){
      const volta = '<nav class="migalha" aria-label="Caminho"><a href="#/mercado" data-acao="voltar">' + ICO.voltar + 'Mercado</a></nav>';
      const g = mkPortaoHtml(alvo); if(g != null) return volta + g;
      const e = mk.porId.get(String(id));
      if(!e) return volta + '<div class="vazio"><h2 class="t-3">Empreendimento não encontrado</h2><p class="texto-2">Ele pode ter saído da base da Órulo. Busque de novo no Mercado.</p><a class="btn" href="#/mercado">Abrir o Mercado</a></div>';
      mkPrep(e);
      const st = mk.fichas.get(String(e.i));
      if(!st || Date.now() - st.em > (st.erro ? 30e3 : MK_FICHA_VALE)) pos.push(() => mkCarregarFicha(e, alvo));
      pos.push(() => mkMaterialCarregar(e));
      pos.push(ligarGaleria);
      return mkFichaHtml(e, mkTipsOk(e), st);
    }
    function telaMercado(arg){
      if(!arg) return telaMkLista();
      let id = arg; try{ id = decodeURIComponent(arg); }catch(e){}
      return telaMkFicha(id, location.hash);
    }
    const mkFichaAberta = () => { const m = /^#\/mercado\/([A-Za-z0-9_.%-]+)$/.exec(location.hash); if(!m) return null; let id = m[1]; try{ id = decodeURIComponent(id); }catch(e){} return mk.porId.get(String(id)) || null; };

    // ---------- enviar ao cliente: ficha completa (nex/m.html) com fotos, plantas, as opções marcadas, lazer e mapa ----------
    // comissão, contato da construtora, book e tabela ficam só com o corretor (não entram no link)
    function mkAbrirEnvio(id){
      const e = mk.porId.get(String(id)); if(!e) return;
      const todas = Array.isArray(e.t) ? e.t : [], ts = mkTipsOk(e);
      const daBusca = new Set(ts.map(t => todas.indexOf(t)).filter(i => i >= 0));
      mk.env = {e, valores: true};
      const opcs = todas.map((t, i) => Array.isArray(t) ? '<label class="u-opc"><input type="checkbox" value="' + i + '"' + ((daBusca.size ? daBusca.has(i) : true) ? ' checked' : '') + '>' +
        '<span class="u-opc-t"><b>' + esc(mkTipTxt(t)) + '</b><span>' + esc([mkVagaTxt(t[4]), t[6] != null && !(t[6] > 0) ? 'sem estoque' : ''].filter(Boolean).join(', ')) + '</span></span>' +
        '<span class="num ouro">' + (+t[5] > 0 ? esc(BRLc(+t[5])) : '') + '</span></label>' : '').join('');
      abrirFolha('mk-envio', 'Enviar ao cliente',
        '<form id="mk-env-form" class="mk-env" autocomplete="off" novalidate>' +
        '<div class="env-proj">' + mkMini(e) + '<p><b>' + esc(e.n) + '</b><span>O cliente recebe um link com fotos, plantas, as opções marcadas, lazer e mapa. Comissão, contato da construtora, book e tabela ficam só com você.</span></p></div>' +
        '<label class="campo">Nome do cliente<input id="mk-env-cli" maxlength="60" autocomplete="off" placeholder="Ex.: Maria" required></label>' +
        (opcs ? '<fieldset><legend>Opções na ficha</legend><div class="u-opcs" id="mk-env-tips">' + opcs + '</div>' + (daBusca.size && daBusca.size < todas.filter(Array.isArray).length ? '<p class="nota">Já marcamos as que servem para a sua busca.</p>' : '') + '</fieldset>' : '') +
        '<fieldset><legend>Valores</legend><div class="seg" role="group" aria-label="Valores na ficha"><button type="button" data-acao="mk-env-val" data-v="1" aria-pressed="true">Mostrar “a partir de”</button><button type="button" data-acao="mk-env-val" data-v="0" aria-pressed="false">Sem valores</button></div></fieldset>' +
        camposAssinatura() + '<p class="erro-txt" id="mk-env-erro" role="alert"></p></form>',
        '<button type="submit" form="mk-env-form" class="btn btn-pri btn-alto" id="mk-env-ok">' + ICO.enviar + 'Criar o link</button>');
      setTimeout(() => { const i = $('#mk-env-cli'); if(i && !ehToque()) i.focus(); }, 80);
    }
    async function mkCriarLink(){
      const x = mk.env; if(!x) return;
      const val = s => { const i = $(s); return i ? i.value.trim() : ''; };
      const cli = val('#mk-env-cli'), nome = val('#env-cor'), tel = val('#env-tel');
      const erro = m => { const p = $('#mk-env-erro'); if(p) p.textContent = m; };
      if(!cli){ erro('Digite o nome do cliente.'); const i = $('#mk-env-cli'); if(i) i.focus(); return; }
      const tipos = $$('#mk-env-tips input:checked').map(c => +c.value);
      if((Array.isArray(x.e.t) ? x.e.t : []).filter(Array.isArray).length && !tipos.length){ erro('Marque pelo menos uma opção.'); return; }
      salvarPerfil({nome, tel});
      const b = $('#mk-env-ok'); if(b){ b.disabled = true; b.textContent = 'Criando o link…'; }
      erro('');
      try{
        const r = await rpc('mercado_link_criar', {p_codigo: S.cod, p_dono: dono(), p_endpoint: endpointAtual(), p_id: x.e.i, p_cliente: cli,
          p_corretor: nome, p_whats: tel, p_tipos: tipos, p_valores: !!x.valores});
        if(!r || !r.id) throw new Error('sem_id');
        if(mk.env !== x) return;
        const url = new URL(ESP + 'nex/m.html?l=' + encodeURIComponent(r.id), location.href).href, nome1 = primeiroNome(cli);
        const msg = 'Olá, ' + nome1 + ', tudo bem? Separei a apresentação do ' + x.e.n + ' para você, com fotos, plantas e as opções: ' + url;
        const dlg = $('#folha-mk-envio'); if(!dlg) return;
        corpoFolha('<div class="aviso ok" role="status">' + ICO.ok + '<p>' + esc('Link pronto para ' + nome1 + '. ' + (r.avisos ? 'Você recebe um aviso neste aparelho quando ' + nome1 + ' abrir. ' : 'Os avisos não estão ligados neste aparelho. ') + 'Acompanhe as aberturas em Enviadas.') + '</p></div>' +
          '<label class="campo">Mensagem<textarea id="mk-env-msg" rows="5">' + esc(msg) + '</textarea><small>Dá para mudar o texto antes de mandar.</small></label>' +
          '<p class="link-pronto">' + esc(url) + '</p>' +
          '<a class="btn" href="' + esc(url + '&previa=1') + '" target="_blank" rel="noopener">Ver como o cliente vê ' + ICO.seta + '</a>',
          '<button type="button" class="btn" data-acao="mk-env-copiar">' + ICO.copiar + 'Copiar</button><a class="btn btn-pri" id="mk-env-wa" href="https://wa.me/?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener" data-acao="mk-env-wa">' + ICO.zap + 'WhatsApp</a>', dlg);
        try{ if(typeof enviadasMudou === 'function') enviadasMudou(); }catch(err){}   // gancho do módulo de Enviadas, se existir
      }catch(e){
        const bt = $('#mk-env-ok'); if(bt){ bt.disabled = false; bt.innerHTML = ICO.enviar + 'Criar o link'; }
        if(mkSair(e)) return;
        const t = String((e && (e.body || e.message)) || '');
        erro(e && e.status === 404 ? 'A ficha do Mercado para o cliente ainda não está ativa no servidor.'
          : /sem_acesso/.test(t) ? 'A ficha do Mercado ainda não está liberada para o time.'
          : /limite_links/.test(t) ? 'Limite de links por dia atingido. Tente amanhã.'
          : 'Não consegui criar o link agora. Confira a internet e tente de novo.');
      }
    }

    // ---------- book, tabela, contato e comissão: Órulo na hora, com o login de cada corretor ----------
    function mkToken(){ try{ const t = JSON.parse(LS.get(MK_K_OR) || 'null'); return t && t.t ? t : null; }catch(e){ return null; } }
    function mkPendente(){ try{ const p = JSON.parse(LS.get(MK_K_OR_P) || 'null'); return p && p.s && Date.now() - (p.em || 0) < 15 * 60e3 ? p : null; }catch(e){ return null; } }
    const mkUrlOrulo = (e, d) => urlSegura(d && d.url) || ('https://www.orulo.com.br/buildings/' + encodeURIComponent(e.i));
    async function mkFn(corpo){   // mesma chamada do app anterior: só Content-Type, e o código do time no corpo
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const tm = ctl ? setTimeout(() => ctl.abort(), 30000) : null;
      try{
        const r = await fetch(MK_FN(), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(Object.assign({codigo: S.cod}, corpo)), cache: 'no-store', signal: ctl ? ctl.signal : undefined});
        let j = null; try{ j = await r.json(); }catch(e){ j = null; }
        if(!j) throw new Error('resposta ' + r.status);
        return j;
      }finally{ if(tm) clearTimeout(tm); }
    }
    function mkConectar(id){
      const b = new Uint8Array(24); crypto.getRandomValues(b);
      const s = btoa(String.fromCharCode.apply(null, b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      LS.set(MK_K_OR_P, JSON.stringify({s, id: id != null && id !== '' ? id : null, em: Date.now()}));
      location.href = MK_FN() + '/entrar?s=' + s;
    }
    const mkMatEspera = '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:62px"></div><div class="brilho" style="height:62px"></div><p class="sub">Buscando o material na Órulo…</p></div>';
    function mkMatHtml(e, d){
      const abrirO = '<a class="btn" href="' + esc(mkUrlOrulo(e, d)) + '" target="_blank" rel="noopener">Abrir na Órulo ' + MKI.fora + '</a>';
      const h = '<section class="sec mk-sec mk-mat" id="mk-mat" aria-labelledby="mk-mat-t"><h2 class="t-2" id="mk-mat-t">Book, tabela e contato do comercial</h2>';
      if(!(mk.ST && mk.ST.login)) return h + '<p class="texto-2">Material só para corretores, com o login de cada um na Órulo (o cadastro é grátis). Abra o empreendimento lá para baixar o book e a tabela e falar com o comercial.</p><div class="mk-col">' + abrirO + '</div></section>';
      if(!mkToken()) return h + '<p class="texto-2">Material só para corretores. Conecte a sua conta da Órulo uma vez: o login é de cada um e, se ainda não tiver conta, dá para criar grátis na própria tela da Órulo. O book, a tabela, o contato do comercial e a comissão aparecem aqui, direto da Órulo.</p>' +
        '<div class="mk-col"><button type="button" class="btn btn-pri" data-acao="mk-or-conectar" data-id="' + esc(e.i) + '">Conectar minha Órulo</button>' + abrirO + '</div></section>';
      const m = mk.mats.get(String(e.i));
      return h + '<div class="mk-mat-c" id="mk-mat-c" aria-live="polite">' + (m ? (m.r ? mkMatCorpo(m.r) : m.html) : mkMatEspera) + '</div>' +
        '<div class="mk-col">' + abrirO + '</div><button type="button" class="link-mais mk-sair" data-acao="mk-or-sair">Desconectar minha Órulo</button></section>';
    }
    function mkRepintarMaterial(){
      const e = mkFichaAberta(), box = $('#mk-mat'); if(!e || !box) return;
      const st = mk.fichas.get(String(e.i));
      box.outerHTML = mkMatHtml(e, st && st.d);
      mkMaterialCarregar(e);
    }
    const mkZap = t => { let d = String(t).replace(/\D/g, ''); if(d.length === 10 || d.length === 11) d = '55' + d; return d; };
    const mkPrimeiro = v => Array.isArray(v) ? v.find(x => x != null && String(x).trim()) : (v != null && String(v).trim() ? v : null);
    function mkIcoArq(tipo){ const t = mkNorm(tipo); return /tabela/.test(t) ? ICO.planilha : /book|apresenta|folder/.test(t) ? ICO.livro : /planta/.test(t) ? ICO.planta : ICO.arquivo; }
    function mkMatCorpo(r, extra){
      const ORD = ['Tabela', 'Book', 'Apresentação', 'Folder', 'Planta técnica', 'Memorial descritivo', 'Ficha técnica', 'Outros'];
      const posi = t => { const i = ORD.indexOf(t); return i < 0 ? 99 : i; };
      const arqs = (Array.isArray(r.arquivos) ? r.arquivos : []).filter(a => a && a.id != null).slice().sort((a, b) => posi(a.tipo) - posi(b.tipo));
      let h = (arqs.length || extra) ? '<ul class="docs mk-docs">' + arqs.map(a => '<li><button type="button" class="mk-doc" data-acao="mk-arq" data-arq="' + esc(a.id) + '" data-tipo="' + esc(a.tipo || '') + '" data-nome="' + esc(a.nome || '') + '"><span class="tipo" aria-hidden="true">' + mkIcoArq(a.tipo) + '</span>' +
        '<span class="t"><b>' + esc(a.tipo || 'Arquivo') + '</b>' + (a.nome ? '<small>' + esc(a.nome) + '</small>' : '') + '</span>' + ICO.seta + '</button></li>').join('') + (extra || '') + '</ul>'
        : '<p class="texto-2">Nenhum arquivo cadastrado na Órulo para este empreendimento.</p>';
      if(extra != null){   // folha do material: diz o que a Órulo não tem
        if(!arqs.length) h += '<p class="nota">A Órulo não tem book nem tabela em arquivo para este empreendimento.</p>';
        else if(!arqs.some(a => /book|apresenta/.test(mkNorm(a.tipo)))) h += '<p class="nota">A Órulo não tem o book deste empreendimento, só ' + esc([...new Set(arqs.map(a => String(a.tipo || 'arquivo').toLowerCase()))].join(', ')) + '.</p>';
      }
      const cts = Array.isArray(r.contatos) ? r.contatos.filter(c => c && typeof c === 'object') : [];
      const cm = cts.find(c => c.comissao_corretor != null || c.comissao_imobiliaria != null);
      if(cm) h += '<p class="texto-2"><b>Comissão:</b> ' + esc([cm.comissao_corretor != null ? 'corretor ' + mkPct(cm.comissao_corretor) : '', cm.comissao_imobiliaria != null ? 'imobiliária ' + mkPct(cm.comissao_imobiliaria) : ''].filter(Boolean).join(', ')) + '</p>';
      const linhas = cts.map(c => {
        const wa = mkPrimeiro(c.whatsapps), tel = mkPrimeiro(c.telefones), em = mkPrimeiro(c.emails), web = urlSegura(c.web);
        if(!wa && !tel && !em && !web) return '';
        return '<div class="mk-ct"><span class="mk-ct-n"><b>' + esc(c.nome || 'Comercial') + '</b>' + (c.parceiro ? '<small>' + esc(c.parceiro) + '</small>' : '') + '</span><span class="mk-ct-b">' +
          (wa ? '<a class="btn btn-peq" target="_blank" rel="noopener" href="https://wa.me/' + mkZap(wa) + '">' + ICO.zap + 'WhatsApp</a>' : '') +
          (tel ? '<a class="btn btn-peq" href="tel:' + esc(String(tel).replace(/[^\d+]/g, '')) + '">' + MKI.tel + 'Ligar</a>' : '') +
          (em ? '<a class="btn btn-peq" href="mailto:' + esc(String(em).trim()) + '">' + MKI.mail + 'E-mail</a>' : '') +
          (!wa && !tel && !em && web ? '<a class="btn btn-peq" target="_blank" rel="noopener" href="' + esc(web) + '">Contato ' + MKI.fora + '</a>' : '') + '</span></div>';
      }).filter(Boolean);
      if(linhas.length) h += '<div class="mk-cts">' + linhas.join('') + '</div>';
      const o = r.oportunidade;
      if(o && typeof o === 'object'){
        const ps = [];
        if(o.corretor) ps.push('<b>Campanha para o corretor:</b> ' + esc(o.corretor) + (o.corretor_ate ? ' (até ' + esc(o.corretor_ate) + ')' : ''));
        if(o.cliente) ps.push('<b>Para o cliente:</b> ' + esc(o.cliente) + (o.cliente_ate ? ' (até ' + esc(o.cliente_ate) + ')' : ''));
        if(o.desconto_max) ps.push('<b>Desconto máximo:</b> ' + esc(mkPct(o.desconto_max)));
        if(ps.length) h += '<div class="aviso ok mk-op">' + ps.map(p => '<p>' + p + '</p>').join('') + '</div>';
      }
      const site = urlSegura(r.site);
      if(site) h += '<a class="link-mais" href="' + esc(site) + '" target="_blank" rel="noopener">Site do empreendimento ' + MKI.fora + '</a>';
      return h;
    }
    function mkMaterialCarregar(e){
      if(!(mk.ST && mk.ST.login)) return;
      let tk = mkToken(); if(!tk) return;
      const k = String(e.i), m = mk.mats.get(k);
      if(m && Date.now() - m.em < (m.r ? MK_MAT_VALE : 2 * 60e3)) return;
      if(mk.matPedido.has(k)) return;
      const caixa = () => { const f = mkFichaAberta(); return f && String(f.i) === k ? $('#mk-mat-c') : null; };
      const tentar = '<button type="button" class="link-mais" data-acao="mk-mat-tentar" data-id="' + esc(e.i) + '">Tentar de novo</button>';
      const pr = (async () => {
        try{
          let r = await mkFn({acao: 'materiais', t: tk.t, id: e.i});
          if(!r.ok && r.erro === 'reconectar' && tk.r){
            const nv = await mkFn({acao: 'renovar', r: tk.r});
            if(nv.ok && nv.t){ tk = {t: nv.t, r: nv.r || tk.r, e: nv.e || tk.e || null}; LS.set(MK_K_OR, JSON.stringify(tk)); r = await mkFn({acao: 'materiais', t: tk.t, id: e.i}); }
          }
          if(!r.ok){
            if(r.erro === 'reconectar'){
              LS.del(MK_K_OR); mk.mats.clear();
              const c = caixa(); if(c) c.innerHTML = '<p class="texto-2">A sua conexão com a Órulo venceu.</p><button type="button" class="btn btn-pri" data-acao="mk-or-conectar" data-id="' + esc(e.i) + '">Conectar de novo</button>';
              return;
            }
            const html = '<p class="texto-2">' + esc(r.erro === 'nao_encontrado' ? 'A Órulo não tem material deste empreendimento para o seu login.' : 'Não consegui buscar o material na Órulo agora. Tente de novo em instantes.') + '</p>' + (r.erro === 'nao_encontrado' ? '' : tentar);
            mk.mats.set(k, {html, em: Date.now()});
            const c = caixa(); if(c) c.innerHTML = html;
            return;
          }
          mk.mats.set(k, {r, em: Date.now()});
          const c = caixa(); if(c) c.innerHTML = mkMatCorpo(r);
        }catch(err){ const c = caixa(); if(c) c.innerHTML = '<p class="texto-2">Sem conexão com a Órulo agora. Tente de novo em instantes.</p>' + tentar; }
        finally{ mk.matPedido.delete(k); }
      })();
      mk.matPedido.set(k, pr);
    }
    // "Book e tabela": folha com todo o material do empreendimento: arquivos da Órulo (tabela, book...), fotos e plantas
    function mkHubExtra(){
      const nf = (S.fotosAtuais || []).length, np = (S.plantasAtuais || []).length;
      const item = (acao, ico, t, sub) => '<li><button type="button" class="mk-doc" data-acao="' + acao + '" data-i="0"><span class="tipo" aria-hidden="true">' + ico + '</span><span class="t"><b>' + esc(t) + '</b><small>' + esc(sub) + '</small></span>' + ICO.seta + '</button></li>';
      return (nf ? item('luz', ICO.fotos, 'Fotos', plural(nf, 'foto', 'fotos')) : '') + (np ? item('luz-planta', ICO.planta, 'Plantas', plural(np, 'planta', 'plantas')) : '');
    }
    function mkAbrirMaterial(id){
      const e = mk.porId.get(String(id)) || mkFichaAberta(); if(!e || !(mk.ST && mk.ST.login)) return;
      if(!mkToken()){
        const m = $('#mk-mat'); if(m) m.scrollIntoView({behavior: menosMov() ? 'auto' : 'smooth', block: 'start'});
        mkConectar(e.i); return;
      }
      const k = String(e.i), extra = mkHubExtra();
      const pe = '<a class="btn" href="' + esc(mkUrlOrulo(e, (mk.fichas.get(k) || {}).d)) + '" target="_blank" rel="noopener">Abrir na Órulo ' + MKI.fora + '</a>';
      const corpo = m => '<div class="mk-mat-c">' + (m && m.r ? mkMatCorpo(m.r, extra) : (extra ? '<ul class="docs mk-docs">' + extra + '</ul>' : '') + (m ? m.html : mkMatEspera)) + '</div>';
      abrirFolha('mk-mat', 'Material do empreendimento', corpo(mk.mats.get(k)), pe);
      mkMaterialCarregar(e);
      const pr = mk.matPedido.get(k);
      if(pr) pr.then(() => { const d = $('#folha-mk-mat'); if(d) corpoFolha(corpo(mk.mats.get(k)), null, d); });
    }
    // Arquivo da Órulo (tabela, book...) aberto dentro do app. O arquivo vem direto da Órulo (tabelas.orulo.com.br libera o
    // app) e fica só na memória enquanto a folha está aberta. PDF: no computador, o leitor do próprio navegador; no celular,
    // onde o navegador não mostra PDF dentro da página, as páginas são desenhadas com o pdf.js, só as que estão perto da tela.
    const MK_PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
    let mkPdfPr = null;
    function mkPdfLib(){
      if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
      if(mkPdfPr) return mkPdfPr;
      mkPdfPr = new Promise((ok, falha) => {
        const s = document.createElement('script'); s.src = MK_PDFJS + 'pdf.min.js'; s.async = true; s.crossOrigin = 'anonymous';
        s.onload = () => { const L = window.pdfjsLib; if(!L){ mkPdfPr = null; falha(new Error('pdfjs')); return; } L.GlobalWorkerOptions.workerSrc = MK_PDFJS + 'pdf.worker.min.js'; ok(L); };
        s.onerror = () => { mkPdfPr = null; s.remove(); falha(new Error('pdfjs')); };
        document.head.appendChild(s);
      });
      return mkPdfPr;
    }
    const mkMB = n => (n / 1048576).toLocaleString('pt-BR', {maximumFractionDigits: n < 10485760 ? 1 : 0}) + ' MB';
    function mkNomeArq(doc){
      let n = String(doc.nome || doc.tipo || 'arquivo').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'arquivo';
      if(!/\.[a-z0-9]{2,4}$/i.test(n)){ const ext = doc.mime === 'application/pdf' ? 'pdf' : (/^image\/(jpe?g|png|webp)$/.exec(doc.mime) || [])[1]; if(ext) n += '.' + ext.replace('jpeg', 'jpg'); }
      return n;
    }
    const mkVisorEspera = t => '<div class="esqueleto" aria-busy="true"><div class="brilho mk-visor-brilho"></div><p class="sub" id="mk-visor-st">' + esc(t) + '</p></div>';
    function mkVisorErro(doc, msg){
      const box = $('#mk-visor'); if(!box || mk.doc !== doc) return;
      box.innerHTML = '<div class="aviso erro"><p>' + esc(msg) + '</p></div><div class="btn-linha"><button type="button" class="btn" data-acao="mk-doc-tentar">Tentar de novo</button>' +
        (doc.url ? '<a class="btn" href="' + esc(doc.url) + '" target="_blank" rel="noopener">Abrir em outra aba ' + MKI.fora + '</a>' : '') + '</div>';
    }
    const mkDocPe = () => '<button type="button" class="btn" data-acao="mk-doc-baixar" disabled>' + ICO.baixar + 'Baixar</button>' +
      '<button type="button" class="btn btn-pri" data-acao="mk-doc-enviar" disabled>' + ICO.enviar + 'Enviar ao cliente</button>';
    function mkAbrirArquivo(el){
      const e = mkFichaAberta(); if(!e) return;
      mkVerArquivo(e, el.dataset.arq, el.dataset.tipo, el.dataset.nome);
    }
    async function mkVerArquivo(e, arq, tipo, nome){
      const tk = mkToken(); if(!tk || !e) return;
      if(mk.doc && mk.doc.ctrl) mk.doc.ctrl.abort();
      const doc = mk.doc = {e, arq: String(arq), tipo: tipo || 'Arquivo', nome: nome || '', blob: null, mime: '', url: null, obj: null, ctrl: new AbortController(), pdf: null, io: null, zoom: 1, ratio: 1.414};
      const cab = '<div class="mk-visor-cab">' + (doc.nome ? '<p class="sub mk-visor-nome">' + esc(doc.nome) + '</p>' : '<span></span>') +
        '<button type="button" class="link-mais" data-acao="mk-material" data-id="' + esc(e.i) + '">Todo o material</button></div>';
      abrirFolha('mk-doc', doc.tipo, cab + '<div class="mk-visor" id="mk-visor" aria-live="polite">' + mkVisorEspera('Buscando o arquivo na Órulo…') + '</div>', mkDocPe(), 'folha-alta mk-folha-doc');
      const dlg = $('#folha-mk-doc');
      if(dlg) dlg.addEventListener('close', () => { doc.ctrl.abort(); if(doc.io) doc.io.disconnect(); if(doc.pdf){ try{ doc.pdf.destroy(); }catch(err){} } if(doc.obj) URL.revokeObjectURL(doc.obj); if(mk.doc === doc) mk.doc = null; });
      const st = t => { const s = $('#mk-visor-st'); if(s && mk.doc === doc) s.textContent = t; };
      try{
        let r = await mkFn({acao: 'arquivo', t: tk.t, id: e.i, arquivo: doc.arq});
        if(r && !r.ok && r.erro === 'reconectar' && tk.r){
          const nv = await mkFn({acao: 'renovar', r: tk.r});
          if(nv.ok && nv.t){ LS.set(MK_K_OR, JSON.stringify({t: nv.t, r: nv.r || tk.r, e: nv.e || tk.e || null})); r = await mkFn({acao: 'arquivo', t: nv.t, id: e.i, arquivo: doc.arq}); }
        }
        if(mk.doc !== doc) return;
        const u = r && r.ok ? mkUrl(r.url) : null;
        if(!u){ mkVisorErro(doc, r && r.erro === 'reconectar' ? 'A sua conexão com a Órulo venceu. Conecte de novo na ficha.' : 'A Órulo não devolveu o arquivo agora.'); return; }
        doc.url = u;
        if(!doc.nome && r.nome) doc.nome = String(r.nome);
        st('Baixando o arquivo…');
        const res = await fetch(u, {signal: doc.ctrl.signal});
        if(!res.ok) throw new Error('http ' + res.status);
        const total = +res.headers.get('content-length') || 0;
        let blob;
        if(res.body && res.body.getReader){
          const rd = res.body.getReader(), partes = []; let n = 0, ult = 0;
          for(;;){
            const {done, value} = await rd.read(); if(done) break;
            partes.push(value); n += value.length;
            if(n - ult > 262144){ ult = n; st('Baixando o arquivo… ' + mkMB(n) + (total ? ' de ' + mkMB(total) : '')); }
          }
          blob = new Blob(partes, {type: res.headers.get('content-type') || ''});
        } else blob = await res.blob();
        if(mk.doc !== doc) return;
        doc.blob = blob; doc.mime = String(blob.type || '').split(';')[0].trim().toLowerCase();
        const ehPdf = doc.mime === 'application/pdf' || /\.pdf$/i.test(new URL(u).pathname);
        if(ehPdf && doc.mime !== 'application/pdf'){ doc.blob = new Blob([blob], {type: 'application/pdf'}); doc.mime = 'application/pdf'; }
        $$('#folha-mk-doc [data-acao="mk-doc-baixar"], #folha-mk-doc [data-acao="mk-doc-enviar"]').forEach(b => { b.disabled = false; });
        const box = $('#mk-visor'); if(!box) return;
        if(ehPdf && !ehToque()){
          doc.obj = URL.createObjectURL(doc.blob);
          box.innerHTML = '<iframe class="mk-pdf" title="' + esc(doc.tipo) + '" src="' + esc(doc.obj) + '#view=FitH"></iframe>';
        } else if(ehPdf){
          st('Montando as páginas…');
          await mkPdfDesenhar(doc, box);
        } else if(/^image\//.test(doc.mime)){
          doc.obj = URL.createObjectURL(doc.blob);
          box.innerHTML = '<img class="mk-img-doc" alt="' + esc(doc.tipo) + '" src="' + esc(doc.obj) + '">';
        } else {
          box.innerHTML = '<div class="vazio"><p>Este tipo de arquivo não abre dentro do app.</p><p class="sub">Use Baixar para salvar no aparelho.</p></div>';
        }
      }catch(err){
        if(err && err.name === 'AbortError') return;
        mkVisorErro(doc, 'Não consegui abrir o arquivo agora.');
      }
    }
    async function mkPdfDesenhar(doc, box){
      const L = await mkPdfLib();
      const pdf = await L.getDocument({data: new Uint8Array(await doc.blob.arrayBuffer())}).promise;
      if(mk.doc !== doc){ try{ pdf.destroy(); }catch(err){} return; }
      doc.pdf = pdf;
      const v1 = (await pdf.getPage(1)).getViewport({scale: 1});
      doc.ratio = v1.height / v1.width;
      box.innerHTML = '<div class="mk-visor-barra"><span class="sub">' + esc(plural(pdf.numPages, 'página', 'páginas')) + '</span><span class="mk-zoom">' +
        '<button type="button" class="ico-btn" data-acao="mk-doc-zoom" data-z="-1" aria-label="Diminuir">−</button><span class="num" id="mk-zoom-v">100%</span>' +
        '<button type="button" class="ico-btn" data-acao="mk-doc-zoom" data-z="1" aria-label="Aumentar">+</button></span></div><div class="mk-pags" id="mk-pags"></div>';
      const pags = $('#mk-pags');
      for(let i = 1; i <= pdf.numPages; i++){ const c = document.createElement('canvas'); c.className = 'mk-pag'; c.dataset.p = i; c.setAttribute('aria-label', 'Página ' + i); pags.appendChild(c); }
      doc.io = new IntersectionObserver(es => es.forEach(x => {
        if(x.isIntersecting) mkPdfPagina(doc, x.target);
        else if(x.target.dataset.feito === '1'){ x.target.width = 0; x.target.height = 0; x.target.dataset.feito = ''; }   // longe da tela: solta a memória
      }), {root: box.closest('.folha-corpo'), rootMargin: '900px 0px'});
      mkPdfMedir(doc);
    }
    function mkPdfMedir(doc){
      const pags = $('#mk-pags'); if(!pags || !doc.io) return;
      doc.io.disconnect();
      const w = Math.round((pags.clientWidth || 340) * doc.zoom);
      $$('.mk-pag', pags).forEach(c => { c.style.width = w + 'px'; c.style.height = Math.round(w * doc.ratio) + 'px'; c.width = 0; c.height = 0; c.dataset.feito = ''; c.dataset.w = w; doc.io.observe(c); });
      const z = $('#mk-zoom-v'); if(z) z.textContent = Math.round(doc.zoom * 100) + '%';
    }
    async function mkPdfPagina(doc, c){
      if(!doc.pdf || c.dataset.feito === '1' || c.dataset.feito === 'em') return;
      c.dataset.feito = 'em';
      const w = +c.dataset.w || 340;
      try{
        const pg = await doc.pdf.getPage(+c.dataset.p);
        if(+c.dataset.w !== w || mk.doc !== doc){ c.dataset.feito = ''; return; }
        const dpr = Math.min(2, window.devicePixelRatio || 1), v = pg.getViewport({scale: 1}), vp = pg.getViewport({scale: w / v.width * dpr});
        c.width = Math.round(vp.width); c.height = Math.round(vp.height); c.style.height = Math.round(vp.height / dpr) + 'px';
        await pg.render({canvasContext: c.getContext('2d'), viewport: vp}).promise;
        c.dataset.feito = +c.dataset.w === w ? '1' : '';
      }catch(err){ c.dataset.feito = ''; }
    }
    // volta do login da Órulo: o token fica guardado no servidor (10 min) e sai uma vez só para quem tem o estado
    async function mkPegarPendente(){
      const p = mkPendente();
      if(!p){ if(LS.get(MK_K_OR_P)) LS.del(MK_K_OR_P); return; }
      if(mk.pegando || !S.cod) return;
      mk.pegando = true;
      try{
        const r = await mkFn({acao: 'pegar', s: p.s});
        if(r.ok && r.t){
          LS.set(MK_K_OR, JSON.stringify({t: r.t, r: r.r || null, e: r.e || null})); LS.del(MK_K_OR_P); mk.mats.clear();
          toast('Sua Órulo está conectada. O book, a tabela e o contato aparecem na ficha de cada empreendimento.', 6000);
          const f = mkFichaAberta();
          if(f) mkRepintarMaterial();
          else if(p.id != null) location.hash = '#/mercado/' + encodeURIComponent(p.id);
        }
      }catch(e){ /* tenta de novo quando o app voltar para a frente */ }
      finally{ mk.pegando = false; }
    }
    function mkAbrirOk(){   // voltou numa janela do navegador (ex.: iPhone com o app instalado: o login abre no Safari)
      abrirFolha('mk-ok', 'Órulo conectada', '<div class="aviso ok" role="status">' + ICO.ok + '<p>Agora é só voltar para o app dos Espelhos: feche esta janela (botão OK ou Concluído, no canto da tela). O book, a tabela e o contato aparecem na ficha de cada empreendimento.</p></div>',
        '<button type="button" class="btn btn-pri" data-acao="fechar-folha">Entendi</button>');
    }
    function mkRetorno(h){
      if(/^#orulo_erro=/.test(h)){
        LS.del(MK_K_OR_P);
        const m = /^#orulo_erro=([\w%.-]{1,60})$/.exec(h); let c = '';
        if(m){ try{ c = decodeURIComponent(m[1]); }catch(e){} }
        setTimeout(() => toast(c === 'access_denied' ? 'Conexão com a Órulo cancelada.' : c === 'indisponivel' ? 'A integração com a Órulo ainda não está ligada.' : 'Não consegui conectar a sua Órulo agora. Tente de novo.', 5000), 500);
        return;
      }
      if(mkPendente()) mkPegarPendente();
      else setTimeout(mkAbrirOk, 400);
    }

    // ---------- Perfil > Integração Órulo (só com o código de administrador) ----------
    function mkEtapaTxt(s){
      const n = v => (+v || 0).toLocaleString('pt-BR');
      switch(s.etapa){
        case 'testando': return 'Testando a chave com a Órulo…';
        case 'conferindo': return 'Conferindo a chave nova com a Órulo…';
        case 'erro_credenciais': return 'A Órulo recusou a chave. Confira se copiou certinho, sem espaços, e cole de novo.';
        case 'aguardando_orulo': return 'A chave está certa, mas a Órulo ainda não ativou a aplicação da imobiliária. O sistema tenta de novo sozinho a cada hora.';
        case 'erro_temporario': return 'A Órulo não respondeu agora. O sistema tenta de novo sozinho em alguns minutos.';
        case 'listando': return 'Chave aprovada. Buscando a lista de empreendimentos na Órulo…';
        case 'carregando': return 'Carregando o mercado: ' + n(s.gravados) + (s.ativos ? ' de ' + n(s.ativos) : '') + ' empreendimentos lidos' + (s.fila ? ' (faltam ' + n(s.fila) + ')' : '') + '. O Mercado aparece no menu do time quando terminar.';
        case 'no_ar': return 'No ar: ' + n(s.total) + ' empreendimentos no Mercado' + (mkQuando(s.versao) ? ', atualizado ' + mkQuando(s.versao) : '') + '. Atualiza sozinho toda madrugada.';
        case 'sem_empreendimentos': return 'A chave funciona, mas a Órulo não liberou nenhum empreendimento para a sua conta. Na Área do Cliente da Órulo, escolha as regiões que quer receber. O sistema confere de novo toda madrugada.';
        default: return 'Esperando a chave da Órulo chegar por e-mail.';
      }
    }
    function mkAdmHtml(){
      return '<section class="caixa mk-adm" id="mk-adm" aria-labelledby="mk-adm-t"><h2 class="t-3" id="mk-adm-t">Integração Órulo</h2>' +
        '<p class="texto-2" id="mk-or-status">Conferindo a integração…</p><p class="nota" id="mk-or-det" hidden></p>' +
        '<form id="mk-or-form" class="mk-or-form" autocomplete="off" hidden><p class="texto-2">Cole a chave que a Órulo mandou por e-mail. É uma vez só: o sistema testa, liga e carrega o mercado sozinho, e o Mercado aparece no menu do time quando terminar.</p>' +
        '<label class="campo">client_id<input id="mk-or-id" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" required></label>' +
        '<label class="campo">client_secret<input id="mk-or-sec" type="password" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false" required></label>' +
        '<div class="mk-acoes"><button class="btn btn-pri" type="submit" id="mk-or-salvar">Salvar e ligar</button><button class="btn" type="button" data-acao="mk-or-cancelar" id="mk-or-cancelar" hidden>Cancelar</button></div></form>' +
        '<div class="mk-acoes"><button class="btn" type="button" data-acao="mk-or-trocar" id="mk-or-trocar" hidden>Trocar a chave</button></div>' +
        '<div class="aviso" id="mk-or-msg" role="status" hidden></div></section>';
    }
    function mkAdmMsg(t, tipo){ const m = $('#mk-or-msg'); if(!m) return; m.hidden = !t; m.className = 'aviso' + (tipo ? ' ' + tipo : ''); m.textContent = t || ''; }
    function mkAdmPintar(s){
      const sec = $('#mk-adm'); if(!sec) return;
      if(s && s.admin === false){ sec.hidden = true; return; }
      sec.hidden = false;
      const stt = $('#mk-or-status'); if(stt) stt.textContent = s ? mkEtapaTxt(s) : 'Não consegui conferir a integração agora. Tente de novo em instantes.';
      if(!s) return;
      const det = [];
      if(s.erro && /^erro_|aguardando_orulo/.test(s.etapa || '')) det.push('Detalhe: ' + s.erro);
      if(s.chave) det.push('Chave ' + s.chave + (mkQuando(s.chave_em) ? ' colada ' + mkQuando(s.chave_em) : '') + '.');
      if(s.ativo) det.push(s.login ? 'Login dos corretores na Órulo: liberado. Cada um conecta a própria conta na ficha do empreendimento.'
        : s.login_motivo === 'retorno_diferente' ? 'Login dos corretores: a Órulo cadastrou outro endereço de retorno. Enquanto isso, o botão abre o empreendimento no site da Órulo.'
        : 'Login dos corretores: aguardando a Órulo cadastrar o endereço de retorno. Enquanto isso, o botão abre o empreendimento no site da Órulo.');
      const dt = $('#mk-or-det'); if(dt){ dt.hidden = !det.length; dt.innerHTML = det.map(esc).join('<br>'); }
      const pede = !s.chave || s.etapa === 'aguardando_chave' || s.etapa === 'erro_credenciais';
      const f = $('#mk-or-form'), cn = $('#mk-or-cancelar'), tr = $('#mk-or-trocar');
      if(f) f.hidden = !(pede || mk.admForm);
      if(cn) cn.hidden = pede || !mk.admForm;
      if(tr) tr.hidden = !(f && f.hidden) || !s.chave;
    }
    async function mkAdmAtualizar(){
      clearTimeout(mk.admT);
      if(!$('#mk-adm')) return;
      if(mk.ST && mk.ST._cod === S.cod) mkAdmPintar(mk.ST);
      const s = await mkStatus(true);
      if(!$('#mk-adm')) return;
      const m = $('#mk-or-msg');
      if(s && !['testando', 'conferindo'].includes(s.etapa) && m && /Testando/.test(m.textContent || '')) mkAdmMsg('');
      mkAdmPintar(s);
      mkAplicarStatus(s);
      if(s && MK_CARREGANDO.includes(s.etapa)) mk.admT = setTimeout(mkAdmAtualizar, 5000);
    }
    function mkAdmSecao(){   // seção do Perfil: só aparece com S.admin (ehAdmin); enquanto não se sabe, fica um lugar guardado
      if(S.admin !== true){
        if(S.admin == null && S.cod) pos.push(() => ehAdmin().then(a => {
          if(!a || location.hash !== '#/perfil') return;
          const slot = $('#mk-adm-slot'); if(slot){ slot.outerHTML = mkAdmHtml(); mkAdmAtualizar(); }
        }).catch(() => {}));
        return S.admin == null ? '<div id="mk-adm-slot" hidden></div>' : '';
      }
      pos.push(mkAdmAtualizar);
      return mkAdmHtml();
    }

    // ---------- partida: situação da base logo depois do resumo (sem atrasar a primeira tela) ----------
    function mkAposResumo(){
      if(!S.cod) return;
      if(mk.cod !== S.cod){   // código novo (ou a primeira leitura): nada do código anterior vale
        const trocou = mk.cod != null;
        mk.cod = S.cod; mk.ST = null; mk.IDX = null; mk.porId = new Map(); mk.bairros = null; mk.rs = null; mk.erro = null; mk.stTentou = 0;
        mk.fichas.clear(); mk.mats.clear();
        if(trocou && S.mercadoPronto){ S.mercadoPronto = false; atualizarLateral(); }
        setTimeout(mkPegarPendente, 800);
      }
      const velho = !mk.ST || Date.now() - mk.ST._t > MK_ST_VALE;
      if(velho && !mk.stPedido && Date.now() - mk.stTentou > 60e3){ mk.stTentou = Date.now(); setTimeout(() => { mkConferir().catch(() => {}); }, mk.ST ? 0 : 1500); }
    }
    const mkAplicarResumoOrig = aplicarResumo;
    aplicarResumo = function(r){ const v = mkAplicarResumoOrig.apply(this, arguments); try{ mkAposResumo(); }catch(e){ console.error(e); } return v; };
    document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') mkPegarPendente(); });

    // ---------- registros ----------
    ROTAS.push([/^#\/mercado(?:\/([A-Za-z0-9_.%-]{1,80}))?$/, 'mercado', arg => telaMercado(arg)]);
    HASH_X.push(h => {
      if(/^#mercado$/.test(h)) return '#/mercado';
      if(/^#orulo_(ok$|erro=)/.test(h)){ mkRetorno(h); return '#/mercado'; }
      return null;
    });
    PERFIL_X.push(mkAdmSecao);

    Object.assign(ACOES_X, {
      'mk-filtros': (el, ev) => {
        if(largo()){ const p = $('#mk-painel'); if(p) p.scrollIntoView({block: 'start', behavior: menosMov() ? 'auto' : 'smooth'}); return; }
        abrirFolha('mk-filtros', 'Filtros', mkPainelHtml(), '<button type="button" class="btn" data-acao="mk-limpar">Limpar</button><button type="button" class="btn btn-pri" data-acao="fechar-folha" id="mk-ver-n">' + esc(mkVerTxt()) + '</button>', 'folha-alta');
      },
      'mk-f': el => { const s = MF[el.dataset.g], v = el.dataset.v; if(!(s instanceof Set)) return; if(s.has(v)) s.delete(v); else s.add(v); mkMudou(); },
      'mk-f1': el => {
        const g = el.dataset.g, v = el.dataset.v;
        if(g === 'ent') MF.ent = MF.ent === v ? '' : v;
        else if(g === 'vagas') MF.vagas = +v || 0;
        else if(g === 'est') MF.est = v === '1';
        else return;
        mkMudou();
      },
      'mk-preco': el => { const v = +el.dataset.v; MF.preco = MF.preco === v ? null : v; mkMudou(); },
      'mk-tirar': el => { const k = el.dataset.v || ''; mkTirar(k); mkMudou(); if(/^(bairros|inc|preco|area):?/.test(k)) mkRepintarPainel(); },
      'mk-limpar': () => {
        const o = MF.ordem; MF = mkNovoF(); MF.ordem = o; mk.q = ''; mk.bq = '';
        const i = $('#mk-q'); if(i) i.value = ''; const l = $('#mk-q-x'); if(l) l.hidden = true;
        mkRepintarPainel(); mkMudou();
      },
      'mk-limpar-q': el => { mk.q = ''; const i = $('#mk-q'); if(i){ i.value = ''; i.focus(); } el.hidden = true; mk.mostra = MK_PASSO; mkAtualizar(); },
      'mk-mais': () => mkMais(),
      'mk-recarregar': () => { mk.erro = null; render(); },
      'mk-ver-imoveis': () => {   // leva o mesmo perfil para o filtro de Imóveis (os nossos projetos, ao vivo)
        const bs = [...new Set(S.P.map(p => p.bairro).filter(b => b && [...MF.bairros].some(x => mkNorm(x) === mkNorm(b))))];
        const ent = MF.ent === 'pronto' ? 'pronto' : MF.ent ? MF.ent.slice(0, 4) : '';
        Object.assign(S.f, F0(), {pmax: MF.preco || 0, amin: MF.a1 || 0, amax: MF.a2 || 0, tipos: [...new Set([...MF.dorm].map(k => MK_TIPO_BASE[k]).filter(Boolean))],
          zonas: [...MF.zona], bairros: bs, fases: [...MF.fase], ent, ver: 'projetos'});
        S.scroll['#/imoveis'] = 0; salvarF();
      },
      'mk-enviar': el => mkAbrirEnvio(el.dataset.id),
      'mk-env-val': el => { if(!mk.env) return; mk.env.valores = el.dataset.v === '1'; $$('[data-acao="mk-env-val"]').forEach(b => b.setAttribute('aria-pressed', b === el)); },
      'mk-env-copiar': () => { const m = $('#mk-env-msg'); if(m) copiar(m.value, 'Mensagem com o link copiada.'); },
      'mk-env-wa': el => { const m = $('#mk-env-msg'); if(m) el.href = 'https://wa.me/?text=' + encodeURIComponent(m.value); },
      'mk-material': el => mkAbrirMaterial(el.dataset.id),
      'mk-doc-baixar': () => { const d = mk.doc; if(d && d.blob) salvarBlob(d.blob, mkNomeArq(d)); },
      'mk-doc-enviar': () => {   // direto do toque: o compartilhamento do aparelho exige o gesto
        const d = mk.doc; if(!d || !d.blob) return;
        const f = new File([d.blob], mkNomeArq(d), {type: d.mime || 'application/octet-stream'});
        let ok = false; try{ ok = !!(navigator.share && navigator.canShare && navigator.canShare({files: [f]})); }catch(err){ ok = false; }
        if(ok){ compartilhar([f], ''); return; }
        salvarBlob(d.blob, f.name); toast('O arquivo foi salvo no aparelho. Anexe na conversa com o cliente.', 5000);
      },
      'mk-doc-zoom': el => { const d = mk.doc; if(!d || !d.pdf) return; const Z = [1, 1.5, 2, 3]; const i = Z.indexOf(d.zoom); const j = Math.max(0, Math.min(Z.length - 1, (i < 0 ? 0 : i) + (+el.dataset.z || 0))); if(Z[j] === d.zoom) return; d.zoom = Z[j]; mkPdfMedir(d); },
      'mk-doc-tentar': () => { const d = mk.doc; if(d) mkVerArquivo(d.e, d.arq, d.tipo, d.nome); },
      'mk-or-conectar': el => mkConectar(el.dataset.id),
      'mk-or-sair': () => { LS.del(MK_K_OR); mk.mats.clear(); mkRepintarMaterial(); toast('Órulo desconectada deste aparelho.'); },
      'mk-arq': el => mkAbrirArquivo(el),
      'mk-mat-tentar': el => { mk.mats.delete(String(el.dataset.id)); const c = $('#mk-mat-c'); if(c) c.innerHTML = mkMatEspera; const e = mk.porId.get(String(el.dataset.id)); if(e) mkMaterialCarregar(e); },
      'mk-ficha-tentar': el => { mk.fichas.delete(String(el.dataset.id)); render(); },
      'mk-or-trocar': () => { mk.admForm = true; mkAdmMsg(''); mkAdmPintar(mk.ST); const i = $('#mk-or-id'); if(i) i.focus(); },
      'mk-or-cancelar': () => { mk.admForm = false; const a = $('#mk-or-id'), b = $('#mk-or-sec'); if(a) a.value = ''; if(b) b.value = ''; mkAdmPintar(mk.ST); }
    });
    Object.assign(INPUTS_X, {
      'mk-q': (el, ev, tipo) => {
        if(tipo !== 'input') return;
        mk.q = el.value; const l = $('#mk-q-x'); if(l) l.hidden = !el.value;
        mkDepois('q', 160, () => { mk.mostra = MK_PASSO; mkAtualizar(); });
      },
      'mk-num': (el, ev, tipo) => {
        const ler = () => {
          const c = el.dataset.campo, v = c === 'preco' ? mkNumPreco(el.value) : mkNumArea(el.value);
          if(!['preco', 'a1', 'a2'].includes(c) || MF[c] === v) return false;
          MF[c] = v;
          if(MF.a1 && MF.a2 && MF.a1 > MF.a2){ const x = MF.a1; MF.a1 = MF.a2; MF.a2 = x; }
          mkMudou(); return true;
        };
        if(tipo === 'input'){ mkDepois('num', 450, ler); return; }
        clearTimeout(mkT.num); ler();
        if(el.dataset.campo === 'preco' && MF.preco) el.value = MF.preco.toLocaleString('pt-BR');
        if(el.dataset.campo !== 'preco') mkMarcarPainel();
      },
      'mk-inc': (el, ev, tipo) => {
        const ler = () => { const v = el.value.trim(); if(MF.inc === v) return; MF.inc = v; mkMudou(); };
        if(tipo === 'input') mkDepois('inc', 300, ler); else { clearTimeout(mkT.inc); ler(); }
      },
      'mk-bq': (el, ev, tipo) => {
        if(tipo !== 'input') return;
        mk.bq = el.value;
        mkDepois('bq', 120, () => $$('[data-mk="bairros"]').forEach(b => { b.innerHTML = mkBairrosChips(); }));
      },
      'mk-ordem': el => { if(MF.ordem === el.value) return; MF.ordem = el.value; mkGravarF(); mk.mostra = MK_PASSO; mkAtualizar(); }
    });
    Object.assign(SUBMITS_X, {
      'mk-env-form': () => mkCriarLink(),
      'mk-or-form': async () => {
        const idI = $('#mk-or-id'), secI = $('#mk-or-sec'); if(!idI || !secI) return;
        const id = idI.value.trim(), sec = secI.value.trim();
        if(!id || !sec){ mkAdmMsg('Cole o client_id e o client_secret.', 'erro'); return; }
        const b = $('#mk-or-salvar'); if(b) b.disabled = true;
        mkAdmMsg('');
        try{
          const r = await rpc('mercado_credenciais', {p_codigo: S.cod, p_client_id: id, p_client_secret: sec});
          if(r && r.ok){ idI.value = ''; secI.value = ''; mk.admForm = false; mkAdmMsg('Chave salva. Testando com a Órulo…', 'ok'); mkAdmAtualizar(); }
          else mkAdmMsg(r && r.erro === 'formato' ? 'Confira: o client_id e o client_secret não têm espaços e têm pelo menos 6 caracteres.' : 'Não consegui salvar agora. Tente de novo.', 'erro');
        }catch(e){
          if(mkSair(e)) return;
          mkAdmMsg(e && e.body && /sem_permissao/.test(e.body) ? 'Só o código de administrador pode colar a chave.' : 'Não consegui salvar agora. Tente de novo.', 'erro');
        }finally{ const bt = $('#mk-or-salvar'); if(bt) bt.disabled = false; }
      }
    });

    // volta do login da Órulo aberta direto no app (#orulo_ok ou #orulo_erro=...): trata já na partida e segue para o Mercado
    if(/^#orulo_(ok$|erro=)/.test(location.hash)){
      const h = location.hash;
      try{ history.replaceState(null, '', location.pathname + location.search + '#/mercado'); }catch(e){}
      mkRetorno(h);
    }
  }

  // ---------------- x_escritorio.js ----------------
  // ================= ESCRITÓRIO (só o código de administrador) =================
  // A sala de vendas em pixel art do app anterior (06/10/2026), agora na página #/escritorio. O diário real
  // (escritorio_atividade, lido a cada 8 s com cursor) aparece no balão dourado e na lista; conversas, gritos e buzina
  // são clima de escritório. A TV da sala do Espelho mostra o estoque dos espelhos pelo resumo (S.P) e as vendas de
  // hoje (S.M). Para de ler e de animar ao sair da página ou com a aba escondida. Resposta 'so_admin' fecha o acesso.
  // Tudo fica dentro desta função, para nenhum nome colidir com o app ou com os outros módulos.
  (() => {
    const K_SOM = 'espelhos-ec-som';   // mesma chave do app anterior: '0' desliga a buzina e a torcida
    const EQUIPE = [
      {id: 'genio', nome: 'Gênio', papel: 'Recepção', sala: 0, desc: 'Recebe os pedidos do WhatsApp e encaminha à equipe.'},
      {id: 'mila', nome: 'Mila', papel: 'Material', sala: 0, desc: 'Espelho, fotos, plantas, book e link para o cliente.'},
      {id: 'flavia', nome: 'Flávia', papel: 'Fluxo', sala: 0, desc: 'Fluxo de pagamento, card da proposta e rentabilidade.'},
      {id: 'sergio', nome: 'Sérgio', papel: 'Secretário', sala: 0, desc: 'Compromissos, avisos no WhatsApp e Google Agenda.'},
      {id: 'julia', nome: 'Júlia', papel: 'Jurídico', sala: 0, desc: 'Contrato, distrato, escritura e SCP. Orienta o corretor, não substitui advogado.'},
      {id: 'caio', nome: 'Caio', papel: 'Financeiro', sala: 0, desc: 'Financiamento, taxas, impostos e as contas para o cliente.'},
      {id: 'bento', nome: 'Bento', papel: 'Imobiliário', sala: 0, desc: 'Negociação, objeções e leitura do mercado e do bairro.'},
      {id: 'otto', nome: 'Otto', papel: 'Organização', sala: 1, desc: 'Confere os projetos, avisa buscas salvas e conta o que mudou.'},
      {id: 'teo', nome: 'Téo', papel: 'Tabelas', sala: 1, desc: 'Carrega tabelas novas de preço, confere as somas e atualiza a revenda One todo dia.'},
      {id: 'ro', nome: 'Rô', papel: 'Robô de status', sala: 1, desc: 'Acompanha disponível, reservada e vendida nos sistemas das construtoras.'},
      {id: 'murilo', nome: 'Murilo', papel: 'Mercado', sala: 1, desc: 'Recebe a Órulo e atualiza as outras incorporadoras.'},
      {id: 'dora', nome: 'Dora', papel: 'Documentos', sala: 1, desc: 'Fichas, plantas, books, central de documentação e leitura de PDF e foto.'},
      {id: 'lia', nome: 'Lia', papel: 'Lupa', sala: 1, desc: 'Busca para o cliente e links de seleção.'},
      {id: 'hugo', nome: 'Hugo', papel: 'Construtoras', sala: 1, desc: 'Histórico e números das construtoras, com a fonte de cada um.'},
      {id: 'nina', nome: 'Nina', papel: 'Notícias', sala: 1, desc: 'Notícias do mercado toda manhã, com fonte, para encaminhar ao cliente.'},
      {id: 'rafa', nome: 'Rafa', papel: 'CRM', sala: 1, desc: 'Tarefas, visitas, esteira e o resumo do dia de cada corretor no CRM.'}
    ];
    const AG = Object.fromEntries(EQUIPE.map((a, i) => [a.id, Object.assign({}, a, {index: i, count: 0, last: null})]));
    const reduzido = matchMedia('(prefers-reduced-motion: reduce)');
    const estreito = matchMedia('(max-width: 820px)');
    const st = {montado: false, epoch: 0, cod: null, revogado: null, adminCod: null, inFlight: null, poll: null, ro: null, rede: ['carregando', 'Consultando o diário…'],
      events: [], seen: new Set(), cursor: null, loaded: false, erro: false, selected: 'genio', lastSignal: null, countDay: diaKey(Date.now()),
      queue: [], active: null, raf: null, view: estreito.matches ? 'genio' : 'geral', est: null, estSig: '', tvPisca: 0,
      r: 1, k: 1, cam: null, camChave: '', camDe: null, camAlvo: null, camT0: 0, last: 0, drawn: 0, baloes: [], confete: [], agenda: [], aviao: null, festa: null,
      nextTalk: 0, nextShout: 0, nextHorn: 0, nextReal: 0, indoBuzinar: null, buzinaAte: 0, audio: null, som: LS.get(K_SOM) !== '0'};
    let canvas = null, ctx = null, cena = null, pontos = [], cenaPronta = false, recursos = null;
    const naRota = () => location.hash === '#/escritorio';
    const visivel = () => document.visibilityState === 'visible';
    const ativo = () => st.montado && !!canvas && canvas.isConnected && visivel() && naRota();
    const hojeK = () => diaKey(Date.now());
    const diaDe = iso => diaKey(Date.parse(iso));
    const quando = iso => quandoMontado(Date.parse(iso));
    const safe = (s, max) => typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max || 160) : '';
    const keyOf = e => [e.a, e.t, e.em, e.p || '', e.n == null ? '' : e.n].join('|');

    // ---------- o que cada registro do diário quer dizer ----------
    function textoEv(e){
      const p = e.p ? ' (' + e.p + ')' : '', n = e.n || 1;
      let s;
      switch(e.a){
        case 'genio': s = e.t === 'esclarecimento' ? 'Explicou a última resposta' : e.t === 'ajuda' ? 'Explicou como usar o Gênio' : e.t === 'nome_cliente' ? 'Anotou o nome do cliente' : 'Respondeu uma conversa no WhatsApp'; break;
        case 'mila': s = /^(sugerir|buscar|unidades|mais)$/.test(e.t) ? 'Enviou unidades no WhatsApp' : e.t === 'comparar' ? 'Comparou unidades' : e.t === 'link' ? 'Montou um link de seleção' : e.t === 'material' ? 'Guardou material novo' : 'Enviou informação de projeto'; break;
        case 'flavia': s = e.t === 'card' ? 'Fez o card da proposta' : e.t === 'rentabilidade' ? 'Fez um estudo de rentabilidade' : 'Montou um fluxo de pagamento'; break;
        case 'sergio': s = e.t === 'google' ? 'Cuidou da conexão com Google Agenda' : e.t === 'visita' ? 'Registrou uma visita' : 'Anotou um compromisso'; break;
        case 'otto': s = e.t === 'conferencia' ? 'Conferiu ' + (n === 1 ? 'um projeto' : n + ' projetos') : e.t === 'aviso' ? 'Avisou uma busca salva' : e.t === 'mudancas' ? 'Contou o que mudou nos projetos' : e.t === 'relatorio' ? 'Montou o relatório da curadoria' : 'Anotou um ajuste para a curadoria'; break;
        case 'teo': s = e.t === 'revenda' ? 'Atualizou a revenda One' : 'Carregou uma tabela nova'; break;
        case 'ro': s = 'Registrou ' + n + (n === 1 ? ' mudança de status' : ' mudanças de status'); break;
        case 'murilo': s = e.t === 'mercado' ? 'Respondeu sobre o Mercado' : e.t === 'webhook' ? 'Recebeu aviso da Órulo' : 'Atualizou o Mercado com a Órulo'; break;
        case 'dora': s = e.t === 'documento' ? 'Enviou documento da central' : e.t === 'leitura' ? 'Leu um PDF ou foto para o corretor' : 'Atualizou a central de documentos'; break;
        case 'lia': s = e.t === 'abriu' ? 'Registrou a abertura de um link' : 'Criou um link para cliente'; break;
        case 'julia': s = e.t === 'scp' ? 'Explicou a compra pela SCP' : 'Respondeu uma dúvida de contrato'; break;
        case 'caio': s = 'Fez a conta de financiamento ou imposto'; break;
        case 'bento': s = 'Ajudou numa negociação'; break;
        case 'hugo': s = 'Contou o histórico de uma construtora'; break;
        case 'nina': s = 'Mandou as notícias do mercado'; break;
        case 'rafa': s = e.t === 'manha' ? 'Mandou o resumo da manhã' : 'Trouxe os números do CRM'; break;
        default: s = 'Registrou uma atividade';
      }
      return (e.ok === false ? 'Registro com falha: ' : '') + s + p;
    }
    function normalize(raw){
      if(!raw || !AG[raw.a] || typeof raw.em !== 'string') return null;
      const ms = Date.parse(raw.em);
      if(!Number.isFinite(ms)) return null;
      return {a: raw.a, t: safe(raw.t, 50), em: new Date(ms).toISOString(), p: safe(raw.p, 160),
        n: Number.isFinite(Number(raw.n)) && Number(raw.n) >= 0 ? Math.min(10000000, Math.floor(Number(raw.n))) : null, o: raw.o === 'w' ? 'w' : '', ok: raw.ok !== false};
    }
    function zerar(){
      Object.assign(st, {events: [], seen: new Set(), cursor: null, loaded: false, erro: false, lastSignal: null, countDay: hojeK(), queue: [], active: null, est: null, estSig: '', rede: ['carregando', 'Consultando o diário…']});
      for(const a of Object.values(AG)){ a.count = 0; a.last = null; }
    }
    function virarDia(){   // contagem de hoje recomeça à meia-noite (horário de São Paulo)
      if(st.countDay === hojeK()) return false;
      st.countDay = hojeK();
      for(const a of Object.values(AG)) a.count = 0;
      for(const e of st.events) if(diaDe(e.em) === st.countDay) AG[e.a].count++;
      return true;
    }
    function queueEvents(events, first){
      if(reduzido.matches || !ativo()) return;
      let latest = events.filter(e => Date.now() - Date.parse(e.em) < 600000 && Date.parse(e.em) <= Date.now() + 60000).sort((a, b) => Date.parse(a.em) - Date.parse(b.em));
      if(first) latest = latest.slice(-3);
      else{
        const groups = [];
        for(const e of latest){
          const last = groups[groups.length - 1];
          if(e.o !== 'w' && last && last.a === e.a && last.t === e.t && last.o === e.o) groups[groups.length - 1] = e;
          else groups.push(e);
        }
        latest = groups.slice(-10);
      }
      st.queue.push(...latest); st.queue = st.queue.slice(-10); animate();
    }

    // ---------- diário (servidor) ----------
    async function buscar(){
      if(!st.montado) return;
      if(!(canvas && canvas.isConnected) || !naRota()){ desmontar(); return; }
      if(!visivel() || st.inFlight || !S.cod) return;
      const cod = S.cod, epoch = st.epoch, ticket = {}; st.inFlight = ticket;
      if(!st.loaded) rede('carregando', 'Consultando o diário…');
      try{
        const args = {p_codigo: cod}; if(st.cursor) args.p_desde = st.cursor;
        const r = await rpc('escritorio_atividade', args);
        if(epoch !== st.epoch || cod !== S.cod || !st.montado) return;
        if(r && (r.erro === 'so_admin' || r.error === 'so_admin')){ revogar(cod); return; }
        if(!r || r.ok !== true || !Array.isArray(r.eventos)) throw new Error('diario_indisponivel');
        const validos = r.eventos.map(normalize).filter(Boolean), invalidos = r.eventos.length - validos.length;
        if(invalidos && !validos.length) throw new Error('diario_invalido');
        const novos = [], first = !st.loaded;
        virarDia();
        for(const e of validos){
          const k = keyOf(e); if(st.seen.has(k)) continue;
          st.seen.add(k); novos.push(e); st.events.push(e);
          const a = AG[e.a]; if(!a.last || Date.parse(e.em) > Date.parse(a.last.em)) a.last = e;
          if(diaDe(e.em) === hojeK()) a.count++;
        }
        st.events.sort((x, y) => Date.parse(y.em) - Date.parse(x.em)); st.events = st.events.slice(0, 60);
        // o cursor volta 2 s para não perder registro na virada; as chaves vistas evitam contar duas vezes
        if(st.seen.size > 3000) st.seen = new Set(st.events.map(keyOf));
        if(validos.length){ const max = Math.max(...validos.map(e => Date.parse(e.em)), st.cursor ? Date.parse(st.cursor) + 2000 : 0); st.cursor = new Date(max - 2000).toISOString(); }
        const sinais = (Array.isArray(r.robos) ? r.robos : []).map(x => Date.parse(x && x.visto_em)).filter(Number.isFinite);
        if(sinais.length) st.lastSignal = new Date(Math.max(...sinais)).toISOString();
        st.loaded = true; st.erro = false; update(); if(!st.raf) draw();
        rede('ok', invalidos ? 'Diário em dia, menos alguns registros com defeito, que ficaram de fora' : 'Diário em dia', ', lido às ' + hora(Date.now()));
        queueEvents(novos, first);
      }catch(e){
        if(codigoInvalido(e)){ desmontar(); sair('Esse código não vale mais. Digite o código novo do time.'); return; }
        if(epoch === st.epoch && cod === S.cod && st.montado){
          st.erro = true;
          rede('erro', st.loaded ? 'Sem conexão com o diário. A lista mostra os últimos registros.' : 'Não consegui ler o diário agora.');
          update();
        }
      }finally{ if(st.inFlight === ticket) st.inFlight = null; }
    }
    function revogar(cod){   // o servidor respondeu so_admin: some o menu e a página explica
      st.revogado = cod; S.admin = false;
      try{ adminP = null; }catch(e){}   // a próxima pergunta ao servidor vale (x_core guarda a resposta)
      desmontar(); zerar();
      atualizarLateral();
      const raiz = $('#ec-raiz'); if(raiz) raiz.innerHTML = semAcessoHtml(true);
      const ac = $('#ec-acoes'); if(ac) ac.innerHTML = '';
    }
    function rede(estado, txt, quandoTxt){   // só a frase do estado fica na região viva; a hora muda em silêncio
      st.rede = [estado, txt, quandoTxt || ''];
      const r = $('#ec-rede'); if(!r) return;
      r.dataset.estado = estado;
      const t = $('#ec-rede-t'); if(t && t.textContent !== txt) t.textContent = txt;
      const h = $('#ec-rede-h'); if(h && h.textContent !== (quandoTxt || '')) h.textContent = quandoTxt || '';
      const b = $('#ec-tentar'); if(b) b.hidden = estado !== 'erro';
    }

    // ---------- cena em pixel art, no estilo Habbo (o desenho do app anterior) ----------
    // Diário real: balão dourado (tipo 'real') e lista. Conversas, gritos e buzina: clima de escritório.
    const BW = 640, BH = 360, TW = 28, TH = 14, OX = 215, OY = 82, GW = 26, GH = 11, PAREDE = 64, VIDRO = 44, DIV = 12, PORTA = [5, 6], VEL = 2.2;
    const OURO = '#c8a24a', OURO_CLARO = '#e3bc77', CONTORNO = '#13202f', CREME = '#f4f1e9', FUNDO_CENA = '#0b1522';
    const F_ESTREITA = '"Mona Estreita", "Mona Sans", system-ui, sans-serif', F_TEXTO = '"Mona Sans", system-ui, sans-serif';
    const iso = (gx, gy, z = 0) => [OX + (gx - gy) * TW / 2, OY + (gx + gy) * TH / 2 - z];
    const novaTela = () => { const c = document.createElement('canvas'); c.width = BW; c.height = BH; return c; };
    let buf = null, bx = null, fundo = null, fx = null, semente = 7;
    const sorte = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);
    const sorteia = lista => lista.length ? lista[Math.floor(Math.random() * lista.length)] : null;

    const GERAL = ['Cliente quer visitar amanhã', 'Manda o espelho pra ele', 'Tem studio até 400 mil?', 'Liga pro cliente agora', 'Proposta saiu',
      'Quem tem a planta do 2 dorms?', 'Ele quer com vaga', 'Cadê a tabela nova?', 'Hoje sai venda', 'Entrada parcelada ajuda', 'Fechou a reserva?',
      'Chegou lead novo', 'Partiu visita', 'Ele aceitou o fluxo', 'Bora bater a meta', 'Cliente no WhatsApp', 'Andar alto ainda tem?', 'Vou mandar o book'];
    const FALAS = {genio: ['Pedido novo no WhatsApp', 'Já encaminhei', 'Bom dia, time', 'Cliente esperando resposta'],
      mila: ['Book enviado', 'Separei as fotos', 'Link pronto pro cliente', 'Planta na mão'],
      flavia: ['Fluxo montado', 'Card da proposta pronto', 'A rentabilidade fechou', 'Ato mais baixo cabe'],
      sergio: ['Visita marcada', 'Agenda lotada hoje', 'Lembrete enviado', 'Confirma o horário?'],
      otto: ['Conferi os projetos', 'Busca salva avisada', 'Mudou status agora', 'Lista organizada'],
      teo: ['Tabela nova carregada', 'Somas batendo', 'Revenda atualizada', 'Preço novo chegou'],
      ro: ['Status atualizado', 'Reservaram uma agora', 'Robô rodando', 'Voltou pra disponível'],
      murilo: ['Órulo atualizou', 'O mercado mexeu hoje', 'Lançamento novo na praça', 'Concorrente subiu preço'],
      dora: ['Documento na central', 'Planta nova chegou', 'Memorial atualizado', 'Ficha pronta'],
      lia: ['Seleção montada', 'Link aberto agora', 'Busca do cliente pronta', 'Separei três opções'],
      julia: ['Cláusula conferida', 'Distrato tem regra', 'Olha o registro', 'SCP explicada'],
      caio: ['Taxa de hoje na mão', 'Conta da parcela pronta', 'ITBI calculado', 'Cabe na renda'],
      bento: ['Objeção respondida', 'Bora negociar', 'Argumento pronto', 'Cliente esquentou'],
      hugo: ['Histórico conferido', 'Entregas da construtora', 'Fonte na mão', 'Reclame Aqui olhado'],
      nina: ['Notícia do dia', 'Boletim pronto', 'Dado novo do FipeZap', 'Pode encaminhar'],
      rafa: ['Tarefas do dia', 'Lead novo no CRM', 'Esteira atualizada', 'Retorno atrasado']};
    const RESPOSTAS = ['Fechado', 'Já mando', 'Bora', 'Deixa comigo', 'Agora mesmo', 'Boa', 'Tô vendo aqui', 'Show', 'Manda ver'];
    const GRITOS = ['FECHOOOU', 'VENDEEEU', 'BORA, TIME', 'UHUUUL', 'É FORTAL', 'MAIS UMA', 'TÁ ON', 'ASSINOU'];
    const PAUSA = ['Café?', 'Mais um café', 'Água, alguém?', 'Pausa rápida'];
    const NA_TV = ['Olha o quadro', 'Disponível caindo', 'Bora vender mais'];

    const LOOK = {
      genio: {pele: '#c68c5c', cabelo: '#2b1d14', estilo: 'curto', roupa: '#1f3b6b', calca: '#1b2433', extra: 'gravata'},
      mila: {pele: '#e3b48c', cabelo: '#6b3f22', estilo: 'longo', roupa: '#2a9d8f', calca: '#2b3245'},
      flavia: {pele: '#d9a173', cabelo: '#1e1410', estilo: 'longo', roupa: '#3f8f5a', calca: '#26303f'},
      sergio: {pele: '#c98f62', cabelo: '#1f1712', estilo: 'curto', roupa: '#7a2635', calca: '#1e2430', extra: 'barba'},
      otto: {pele: '#e6bc96', cabelo: '#3a2a1d', estilo: 'curto', roupa: '#3d6fb6', calca: '#252c38', extra: 'oculos'},
      teo: {pele: '#d7a77d', cabelo: '#7a5a3a', estilo: 'curto', roupa: '#b08a52', calca: '#2a2f3a'},
      ro: {pele: '#e8c3a0', cabelo: '#b9b9bd', estilo: 'chanel', roupa: '#8a8f98', calca: '#2c3340', extra: 'fone'},
      murilo: {pele: '#b77b52', cabelo: '#17110d', estilo: 'curto', roupa: '#6b3a7a', calca: '#232a36'},
      dora: {pele: '#e9c09a', cabelo: '#8a5a33', estilo: 'longo', roupa: '#d98a8a', calca: '#2b3142'},
      lia: {pele: '#8d5a3b', cabelo: '#120d0a', estilo: 'cacheado', roupa: '#2f6fd1', calca: '#262d3a'},
      julia: {pele: '#e7b993', cabelo: '#2a1a12', estilo: 'chanel', roupa: '#2b2d42', calca: '#1f2430', extra: 'oculos'},
      caio: {pele: '#c7956a', cabelo: '#1c140f', estilo: 'curto', roupa: '#2f7a4e', calca: '#232a36'},
      bento: {pele: '#9a6643', cabelo: '#0f0b08', estilo: 'curto', roupa: '#c0782f', calca: '#2a2f3a', extra: 'barba'},
      hugo: {pele: '#e2b58c', cabelo: '#5a3b24', estilo: 'curto', roupa: '#4b5d73', calca: '#1e2430'},
      nina: {pele: '#d6a07a', cabelo: '#3b2416', estilo: 'longo', roupa: '#b04a6b', calca: '#2b3142'},
      rafa: {pele: '#b9835a', cabelo: '#16100c', estilo: 'cacheado', roupa: '#1f8a8a', calca: '#252c38', extra: 'fone'}};
    // mesa de cada um (x, y, largura em ladrilhos); o lugar fica atrás da mesa, virado para a frente
    const MESA = {genio: {x: 3, y: 7, w: 3, rec: 1}, mila: {x: 2, y: 3, w: 2}, flavia: {x: 6, y: 3, w: 2}, sergio: {x: 8, y: 7, w: 2},
      otto: {x: 14, y: 3, w: 2}, teo: {x: 18, y: 3, w: 2}, ro: {x: 22, y: 3, w: 2}, murilo: {x: 14, y: 7, w: 2}, dora: {x: 18, y: 7, w: 2}, lia: {x: 22, y: 7, w: 2},
      julia: {x: 9, y: 3, w: 2}, caio: {x: 2, y: 10, w: 2}, bento: {x: 7, y: 10, w: 2}, rafa: {x: 14, y: 10, w: 2}, hugo: {x: 20, y: 10, w: 2}, nina: {x: 23, y: 10, w: 2}};
    const ASSENTO = Object.fromEntries(Object.entries(MESA).map(([id, m]) => [id, [m.x + (m.rec ? 1 : 0), m.y - 1]]));
    const PONTOS = {cafe: [[9, 1], [10, 1]], agua: [[13, 1], [14, 1]], tv: [[16, 1], [17, 1]], buzina: [[24, 0], [24, 1]], sofa: [[16, 9], [17, 9], [18, 9]],
      janela: [[1, 4], [1, 6]], recepcao: [[4, 8], [5, 8]]};

    function poli(c, pts, cor){ c.fillStyle = cor; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for(let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fill(); }
    function linha(c, p, q, cor, w = 1){ c.strokeStyle = cor; c.lineWidth = w; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
    function caixa(c, gx, gy, w, d, h, topo, esq, dir, z0 = 0){
      poli(c, [iso(gx, gy + d, z0 + h), iso(gx + w, gy + d, z0 + h), iso(gx + w, gy + d, z0), iso(gx, gy + d, z0)], esq);
      poli(c, [iso(gx + w, gy, z0 + h), iso(gx + w, gy + d, z0 + h), iso(gx + w, gy + d, z0), iso(gx + w, gy, z0)], dir);
      poli(c, [iso(gx, gy, z0 + h), iso(gx + w, gy, z0 + h), iso(gx + w, gy + d, z0 + h), iso(gx, gy + d, z0 + h)], topo);
    }
    const paredeD = (c, g1, g2, z1, z2, cor) => poli(c, [iso(g1, 0, z2), iso(g2, 0, z2), iso(g2, 0, z1), iso(g1, 0, z1)], cor);
    const paredeE = (c, g1, g2, z1, z2, cor) => poli(c, [iso(0, g2, z2), iso(0, g1, z2), iso(0, g1, z1), iso(0, g2, z1)], cor);
    function janela(c, lado, g1, g2, z1, z2){
      const plano = lado === 'd' ? paredeD : paredeE;
      plano(c, g1 - .1, g2 + .1, z1 - 2, z2 + 2, '#33475e'); plano(c, g1, g2, z1, z2, '#0d1828');
      for(let g = g1; g < g2 - .01; g += .22){
        const larg = Math.min(.22, g2 - g), alto = z1 + 4 + sorte() * (z2 - z1 - 12);
        plano(c, g, g + larg, z1, alto, sorte() < .5 ? '#172840' : '#1d3150');
        for(let z = z1 + 3; z < alto - 2; z += 4) if(sorte() < .35){ const p = lado === 'd' ? iso(g + larg * .5, 0, z) : iso(0, g + larg * .5, z); c.fillStyle = sorte() < .8 ? '#f2cc8c' : '#bfe3ff'; c.fillRect(Math.round(p[0]), Math.round(p[1]), 1, 1); }
      }
      const m = (g1 + g2) / 2; linha(c, lado === 'd' ? iso(m, 0, z1) : iso(0, m, z1), lado === 'd' ? iso(m, 0, z2) : iso(0, m, z2), '#33475e');
    }
    function faixaLogo(c, lado, g1, g2, z1, z2){   // o logo de verdade (img/logo-fortal.png) nas paredes
      const plano = lado === 'd' ? paredeD : paredeE;
      plano(c, g1 - .1, g2 + .1, z1 - 2, z2 + 2, OURO); plano(c, g1, g2, z1, z2, '#0f1c2e');
      if(!logoImg) return;
      const [x0, y0] = lado === 'd' ? iso(g1, 0, z2) : iso(0, g2, z2), larg = (g2 - g1) * TW / 2, alt = z2 - z1;
      const s = Math.min((larg - 4) / 93, (alt - 4) / 96), w = 93 * s, h = 96 * s;
      c.save(); c.setTransform(1, lado === 'd' ? .5 : -.5, 0, 1, x0, y0); c.imageSmoothingEnabled = true; c.drawImage(logoImg, (larg - w) / 2, (alt - h) / 2, w, h); c.restore();
    }
    function montarFundo(){
      if(!fx) return;
      const c = fx; semente = 7;
      c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = FUNDO_CENA; c.fillRect(0, 0, BW, BH);
      poli(c, [iso(0, 0, PAREDE), iso(GW, 0, PAREDE), iso(GW, 0, 0), iso(0, 0, 0)], '#1a2b42');
      poli(c, [iso(0, 0, PAREDE), iso(0, GH, PAREDE), iso(0, GH, 0), iso(0, 0, 0)], '#21365a');
      poli(c, [iso(0, 0, PAREDE + 3), iso(GW, 0, PAREDE + 3), iso(GW, 0, PAREDE), iso(0, 0, PAREDE)], '#2c4466');
      poli(c, [iso(0, 0, PAREDE + 3), iso(0, GH, PAREDE + 3), iso(0, GH, PAREDE), iso(0, 0, PAREDE)], '#35507a');
      janela(c, 'd', .5, 3.4, 16, 50); janela(c, 'd', 12.3, 13.8, 16, 50); janela(c, 'd', 24.4, 25.7, 16, 50);
      janela(c, 'e', 1, 4.2, 16, 50); janela(c, 'e', 5, 8.2, 16, 50);
      paredeD(c, 4.1, 8.9, 37, 47, '#0f1c2e'); paredeD(c, 4.1, 8.9, 46, 47, OURO); paredeD(c, 4.1, 8.9, 37, 38, OURO);
      paredeD(c, 14.6, 18.9, 45, 54, '#0f1c2e'); paredeD(c, 14.6, 18.9, 53, 54, OURO); paredeD(c, 14.6, 18.9, 45, 46, OURO);
      paredeD(c, 9.3, 11.5, 24, 36, '#2a1d14'); paredeD(c, 9.3, 11.5, 35, 36, OURO);
      faixaLogo(c, 'd', 5.2, 7.8, 9, 33); faixaLogo(c, 'd', 19.6, 23.9, 12, 56); faixaLogo(c, 'e', 8.8, 10.6, 14, 48);
      linha(c, iso(0, 0, 1), iso(GW, 0, 1), OURO); linha(c, iso(0, 0, 1), iso(0, GH, 1), OURO);
      // piso: base de cada sala e ladrilhos alternados por cima, sem fresta
      poli(c, [iso(0, 0), iso(DIV, 0), iso(DIV, GH), iso(0, GH)], '#ccb48e');
      poli(c, [iso(DIV, 0), iso(GW, 0), iso(GW, GH), iso(DIV, GH)], '#bac3cd');
      for(let gx = 0; gx < GW; gx++) for(let gy = 0; gy < GH; gy++) if((gx + gy) % 2 === 0) poli(c, [iso(gx, gy), iso(gx + 1, gy), iso(gx + 1, gy + 1), iso(gx, gy + 1)], gx < DIV ? '#d8c4a1' : '#c8d0d9');
      poli(c, [iso(2, 8), iso(7, 8), iso(7, 11), iso(2, 11)], OURO); poli(c, [iso(2.12, 8.12), iso(6.88, 8.12), iso(6.88, 10.88), iso(2.12, 10.88)], '#1d3354');
      poli(c, [iso(0, GH), iso(GW, GH), iso(GW, GH, -6), iso(0, GH, -6)], '#0f1a29');
      poli(c, [iso(GW, 0), iso(GW, GH), iso(GW, GH, -6), iso(GW, 0, -6)], '#14233a');
    }
    // TV da sala do Espelho: estoque de todos os espelhos pelo resumo (S.P) e as vendas de hoje pelo movimento (S.M)
    function estoque(){
      const sig = S.carregado ? S.geradoEm + ':' + S.P.length + ':' + S.M.length + ':' + hojeK() : '';
      if(st.est && st.estSig === sig) return st.est;
      const t = {ok: !!sig && S.P.length > 0, d: 0, r: 0, v: 0, o: 0, vh: 0, rh: 0};
      for(const p of S.P){ const d = +p.livres || 0, r = +p.reservadas || 0, v = +p.vendidas || 0; t.d += d; t.r += r; t.v += v; t.o += Math.max(0, (+p.total || 0) - d - r - v); }
      const hoje = hojeK();
      for(const m of S.M){ if(diaKey(m.em) !== hoje) continue; if(m.tipo === 'venda') t.vh++; else if(m.tipo === 'reserva') t.rh++; }
      if(st.est && st.est.ok && t.vh > st.est.vh) st.tvPisca = performance.now() + 2200;   // venda nova enquanto a página está aberta: a TV pisca
      st.est = t; st.estSig = sig;
      return t;
    }
    function legendaTv(){
      const el = $('#ec-tv-txt'); if(!el) return;
      const s = estoque(), total = s.d + s.r + s.v + s.o, n = x => x.toLocaleString('pt-BR');
      const txt = !s.ok ? 'Quadro da TV: os espelhos ainda não carregaram.' : !total ? 'Quadro da TV: nenhuma unidade nos espelhos.' :
        'Quadro da TV: ' + n(s.d) + (s.d === 1 ? ' livre, ' : ' livres, ') + n(s.r) + (s.r === 1 ? ' reservada e ' : ' reservadas e ') + n(s.v) + (s.v === 1 ? ' vendida' : ' vendidas') + ' nos espelhos' + (s.o ? ', mais ' + n(s.o) + ' em processo ou outra situação' : '') +
        '. Hoje, ' + plural(s.vh, 'venda', 'vendas') + ' e ' + plural(s.rh, 'reserva', 'reservas') + '.';
      if(el.textContent !== txt) el.textContent = txt;
    }
    function tv(c, now){
      const g1 = 14.6, g2 = 18.9, z1 = 18, z2 = 42, f = st.festa;
      const pisca = (f && now - f.t0 < 2200 && Math.floor((now - f.t0) / 180) % 2 === 0) || (st.tvPisca > now && Math.floor(now / 180) % 2 === 0);
      paredeD(c, g1 - .12, g2 + .12, z1 - 2, z2 + 2, pisca ? OURO_CLARO : '#33475e'); paredeD(c, g1, g2, z1, z2, '#08111c');
      const s = estoque(), total = s.d + s.r + s.v + s.o;
      [['d', '#86c6a5'], ['r', '#dfb56e'], ['v', '#c98280']].forEach(([k, cor], i) => {   // livres, reservadas, vendidas
        const frac = total ? s[k] / total : 0, zb = z2 - 10 - i * 5;
        paredeD(c, g1 + .25, g2 - .25, zb - 3, zb, '#132235'); paredeD(c, g1 + .25, g1 + .25 + (g2 - g1 - .5) * Math.max(.02, frac), zb - 3, zb, cor);
      });
    }
    function bandeirinhas(c, now){
      const z = PAREDE - 2, mexe = reduzido.matches ? 0 : 1;
      for(let g = .3, i = 0; g < GW - .3; g += .55, i++){ const s = Math.sin(now / 420 + i) * .07 * mexe; poli(c, [iso(g, 0, z), iso(g + .42, 0, z), iso(g + .21 + s, 0, z - 7)], i % 2 ? OURO : CREME); }
      for(let g = .3, i = 0; g < GH - .3; g += .55, i++){ const s = Math.sin(now / 420 + i) * .07 * mexe; poli(c, [iso(0, g + .42, z), iso(0, g, z), iso(0, g + .21 + s, z - 7)], i % 2 ? CREME : OURO); }
      linha(c, iso(0, 0, z), iso(GW, 0, z), FUNDO_CENA); linha(c, iso(0, 0, z), iso(0, GH, z), FUNDO_CENA);
    }

    // móveis que podem ficar na frente ou atrás das pessoas: desenhados por profundidade
    const OBJETOS = [], BLOQ = new Set(), cel = (x, y) => x + ',' + y;
    const bloquear = (x, y, w = 1, d = 1) => { for(let i = 0; i < w; i++) for(let j = 0; j < d; j++) BLOQ.add(cel(x + i, y + j)); };
    const movel = (prof, fn) => OBJETOS.push({prof, fn});
    function planta(x, y){
      bloquear(x, y);
      movel(x + y + 1, c => { caixa(c, x + .3, y + .3, .4, .4, 6, '#6b4f35', '#4a3624', '#5a422c'); const [p, q] = iso(x + .5, y + .5, 6);
        c.fillStyle = '#2f7a4a'; c.fillRect(p - 5, q - 12, 10, 10); c.fillStyle = '#3f9a5e'; c.fillRect(p - 7, q - 9, 4, 6); c.fillRect(p + 3, q - 10, 4, 7);
        c.fillStyle = '#57b874'; c.fillRect(p - 3, q - 15, 6, 5); c.fillRect(p - 1, q - 17, 2, 3); });
    }
    function buzinaPoste(c, now){
      const [x0, y0] = iso(25.5, .5), f = st.festa, t = f ? now - f.t0 : 9999, tr = t < 1800 ? (Math.floor(t / 50) % 2 ? 1 : -1) : 0, x = Math.round(x0), y = Math.round(y0);
      c.fillStyle = '#4b5563'; c.fillRect(x - 1, y - 16, 2, 16); c.fillStyle = CONTORNO; c.fillRect(x - 4, y - 26, 8, 11);
      c.fillStyle = '#1d3354'; c.fillRect(x - 3 + tr, y - 25, 6, 9); c.fillStyle = OURO; c.fillRect(x + 3 + tr, y - 28, 3, 5); c.fillRect(x + 5 + tr, y - 32, 4, 9);
      c.fillStyle = OURO_CLARO; c.fillRect(x + 8 + tr, y - 31, 1, 7);
    }
    function montarObjetos(){
      for(const [id, m] of Object.entries(MESA)){
        const [sx, sy] = ASSENTO[id];
        bloquear(m.x, m.y, m.w, 1); bloquear(sx, sy);
        movel(sx + sy + .6, c => { caixa(c, sx + .22, sy + .1, .56, .12, 21, '#2f4b78', '#1d3354', '#26406b'); caixa(c, sx + .2, sy + .22, .6, .56, 8, '#2f4b78', '#1d3354', '#26406b'); });
        movel(m.x + m.w + m.y - .1, c => {
          let top = 11;
          if(m.rec){ top = 14; caixa(c, m.x, m.y, m.w, 1, 13, '#2a4a78', '#1d3354', '#24406a');
            linha(c, iso(m.x, m.y + 1, 8), iso(m.x + m.w, m.y + 1, 8), OURO); linha(c, iso(m.x + m.w, m.y, 8), iso(m.x + m.w, m.y + 1, 8), OURO);
            caixa(c, m.x - .05, m.y - .05, m.w + .1, 1.1, 1, '#e0cba6', '#b89a6c', '#c9ad80', 13);
          }else caixa(c, m.x, m.y + .1, m.w, .8, 11, '#c08a55', '#8b5d35', '#a87445');
          const mx = m.x + m.w - .55;
          caixa(c, mx, m.y + .2, .42, .1, 8, '#1f2937', '#111827', '#1f2937', top); linha(c, iso(mx, m.y + .2, top + 8), iso(mx + .42, m.y + .2, top + 8), '#7fd3ff');
          caixa(c, m.x + .22, m.y + .3, .52, .3, 1, '#e5e7eb', '#9ca3af', '#cbd5e1', top);
        });
      }
      bloquear(9, 0, 2, 1); movel(10.9, c => { caixa(c, 9, .1, 2, .8, 12, '#c08a55', '#8b5d35', '#a87445'); caixa(c, 9.2, .2, .6, .5, 14, '#4b5563', '#374151', '#6b7280', 12);
        const [p, q] = iso(10.3, .6, 12); c.fillStyle = CREME; c.fillRect(Math.round(p), Math.round(q) - 3, 3, 3); c.fillRect(Math.round(p) + 5, Math.round(q) - 1, 3, 3); });
      bloquear(13, 0); movel(14, c => { caixa(c, 13.25, .25, .5, .5, 12, '#e5e7eb', '#9ca3af', '#cbd5e1'); caixa(c, 13.32, .32, .36, .36, 9, '#9fd8ff', '#5fb6e8', '#7fc8f8', 12); });
      bloquear(25, 0); movel(26, (c, now) => buzinaPoste(c, now));
      bloquear(16, 10, 3, 1); movel(28.9, c => { caixa(c, 16, 10.12, 3, .7, 7, '#26406b', '#16294a', '#1d3354'); caixa(c, 16, 10.62, 3, .3, 15, '#2f4b78', '#16294a', '#1d3354');
        caixa(c, 16.3, 10.3, .5, .3, 3, OURO_CLARO, OURO, OURO, 7); caixa(c, 18.2, 10.3, .5, .3, 3, OURO_CLARO, OURO, OURO, 7); });
      [[0, 0], [11, 0], [0, 10], [11, 10], [12, 10], [25, 10], [25, 5]].forEach(([x, y]) => planta(x, y));
      for(let gy = 0; gy < GH; gy++){
        if(PORTA.includes(gy)) continue;
        movel(DIV + gy + .5, c => { poli(c, [iso(DIV, gy, VIDRO), iso(DIV, gy + 1, VIDRO), iso(DIV, gy + 1, 0), iso(DIV, gy, 0)], 'rgba(150,200,235,0.2)');
          linha(c, iso(DIV, gy, VIDRO), iso(DIV, gy + 1, VIDRO), OURO); linha(c, iso(DIV, gy, 0), iso(DIV, gy, VIDRO), '#9fb3c6'); });
      }
      movel(DIV + PORTA[0] + .5, c => linha(c, iso(DIV, PORTA[0], 0), iso(DIV, PORTA[0], VIDRO + 4), '#c9d4df', 2));
      movel(DIV + PORTA[1] + 1.5, c => { linha(c, iso(DIV, PORTA[1] + 1, 0), iso(DIV, PORTA[1] + 1, VIDRO + 4), '#c9d4df', 2); linha(c, iso(DIV, PORTA[0], VIDRO + 4), iso(DIV, PORTA[1] + 1, VIDRO + 4), OURO, 2); });
    }

    // pessoas
    const ATOR = {};
    function iniciarAtores(){
      EQUIPE.forEach((a, i) => { const [sx, sy] = ASSENTO[a.id]; ATOR[a.id] = {id: a.id, ix: i, x: sx + .5, y: sy + .5, cx: sx, cy: sy, modo: 'sentado', rota: [], destino: null,
        ate: 0, prox: 0, costas: false, espelho: i % 2 === 1, passo: 0, pulo: 0, fala: 0}; });
    }
    function boneco(c, at, now){
      const L = LOOK[at.id], sentado = at.modo === 'sentado' && !at.rota.length, pulando = at.pulo > now;
      let [x, y] = iso(at.x, at.y); x = Math.round(x); y = Math.round(y);
      if(st.selected === at.id){ c.strokeStyle = OURO; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + 9, y); c.lineTo(x, y + 4); c.lineTo(x - 9, y); c.closePath(); c.stroke(); }
      const pulo = pulando && !reduzido.matches ? Math.round(Math.abs(Math.sin((at.pulo - now) / 140)) * 5) : 0;
      if(!sentado){ c.fillStyle = 'rgba(5,10,18,.28)'; c.fillRect(x - 6, y - 1, 12, 2); c.fillRect(x - 4, y - 2, 8, 4); }
      if(sentado) y += 1;
      y -= pulo;
      const esp = at.espelho ? -1 : 1, costas = at.costas && !sentado;
      const R = (dx, dy, w, h, cor) => { c.fillStyle = cor; c.fillRect(esp > 0 ? x + dx : x - dx - w, y + dy, w, h); };
      const andando = at.rota.length > 0, fase = andando ? Math.floor(at.passo) % 4 : 0, perna = [0, 1, 0, -1][fase];
      if(!sentado){
        R(-4, -9 + (perna > 0 ? -1 : 0), 3, 8, L.calca); R(1, -9 + (perna < 0 ? -1 : 0), 3, 8, L.calca);
        R(-5, -2 + (perna > 0 ? -1 : 0), 4, 2, '#141414'); R(1, -2 + (perna < 0 ? -1 : 0), 4, 2, '#141414');
      }
      R(-7, -21, 14, 12, CONTORNO); R(-6, -21, 12, 11, L.roupa); R(-6, -10, 12, 1, L.calca);
      if(pulando){ R(-9, -30, 3, 10, L.roupa); R(6, -30, 3, 10, L.roupa); R(-9, -32, 3, 2, L.pele); R(6, -32, 3, 2, L.pele); }
      else if(sentado){ const t = Math.floor(now / 180 + at.ix) % 2; R(-8, -20, 3, 6, L.roupa); R(5, -20, 3, 6, L.roupa); R(-6 + t, -14, 3, 2, L.pele); R(3 - t, -14, 3, 2, L.pele); }
      else{ const b = andando ? perna : 0; R(-9, -20 + b, 3, 9, L.roupa); R(6, -20 - b, 3, 9, L.roupa); R(-9, -11 + b, 3, 2, L.pele); R(6, -11 - b, 3, 2, L.pele); }
      R(-1, -23, 2, 2, L.pele); R(-6, -34, 12, 12, CONTORNO); R(-5, -33, 10, 10, L.pele);
      if(!costas){
        const pisca = Math.floor(now / 97 + at.ix * 31) % 40 === 0, fala = at.fala > now && Math.floor(now / 120) % 2 === 0;
        R(-3, -29, 1, pisca ? 1 : 2, '#1b1b1b'); R(2, -29, 1, pisca ? 1 : 2, '#1b1b1b'); R(-1, -25, 2, fala ? 2 : 1, fala ? '#7a2e24' : '#9a5a48');
      }
      const h = L.cabelo;
      if(L.estilo === 'curto'){ R(-6, -35, 12, 4, h); if(costas) R(-6, -31, 12, 6, h); else{ R(-6, -31, 1, 3, h); R(5, -31, 1, 3, h); } }
      else if(L.estilo === 'longo'){ R(-7, -35, 14, 5, h); R(-7, -30, 2, 11, h); R(5, -30, 2, 11, h); if(costas) R(-5, -30, 10, 12, h); }
      else if(L.estilo === 'chanel'){ R(-7, -35, 14, 5, h); R(-7, -30, 2, 6, h); R(5, -30, 2, 6, h); if(costas) R(-5, -30, 10, 6, h); }
      else if(L.estilo === 'cacheado'){ R(-8, -38, 16, 7, h); R(-8, -31, 3, 7, h); R(5, -31, 3, 7, h); for(let i = -7; i < 8; i += 3) R(i, -39, 2, 1, h); if(costas) R(-5, -31, 10, 7, h); }
      if(!costas){
        if(L.extra === 'gravata'){ R(-2, -21, 4, 1, CREME); R(-1, -20, 2, 7, OURO); }
        if(L.extra === 'barba'){ R(-4, -26, 8, 3, h); R(-1, -25, 2, 1, '#9a5a48'); }
        if(L.extra === 'oculos'){ R(-4, -30, 3, 3, '#1b1b1b'); R(1, -30, 3, 3, '#1b1b1b'); R(-3, -29, 1, 1, '#bfe3ff'); R(2, -29, 1, 1, '#bfe3ff'); R(-1, -29, 2, 1, '#1b1b1b'); }
      }
      if(L.extra === 'fone'){ R(-7, -36, 14, 1, '#1b1b1b'); R(-8, -31, 2, 4, '#1b1b1b'); if(!costas) R(-7, -27, 4, 1, '#1b1b1b'); }
    }

    // caminhos: ladrilhos livres, com a passagem entre as salas só pela porta
    const livre = (x, y, alvo) => x >= 0 && y >= 0 && x < GW && y < GH && (!BLOQ.has(cel(x, y)) || !!(alvo && x === alvo[0] && y === alvo[1]));
    const passa = (x1, y1, x2, y2) => !(((x1 === DIV - 1 && x2 === DIV) || (x1 === DIV && x2 === DIV - 1)) && !(PORTA.includes(y1) && PORTA.includes(y2)));
    function rota(de, para){
      const k = p => p[0] + ',' + p[1], ini = k(de), fim = k(para);
      if(ini === fim) return [];
      const vem = new Map([[ini, null]]), fila = [de], viz = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      while(fila.length){
        const p = fila.shift();
        for(const [dx, dy] of viz){
          const q = [p[0] + dx, p[1] + dy], kq = k(q);
          if(vem.has(kq) || !livre(q[0], q[1], para) || !passa(p[0], p[1], q[0], q[1])) continue;
          if(dx && dy && (!livre(p[0] + dx, p[1], para) || !livre(p[0], p[1] + dy, para) || !passa(p[0], p[1], p[0] + dx, p[1]) || !passa(p[0], p[1], p[0], p[1] + dy))) continue;
          vem.set(kq, p);
          if(kq === fim){ const out = []; let c = q; while(c && k(c) !== ini){ out.unshift(c); c = vem.get(k(c)); } return out; }
          fila.push(q);
        }
      }
      return null;
    }
    function ir(at, alvo, destino){
      if(!alvo) return false;
      const r = rota([at.cx, at.cy], alvo);
      if(!r || !r.length) return false;
      at.rota = r; at.destino = destino; at.modo = 'andando'; return true;
    }
    function falar(id, texto, now, tipo = 'fala', dur){
      st.baloes = st.baloes.filter(b => b.id !== id || b.tipo === 'real');
      st.baloes.push({id, texto, tipo, nasce: now, ate: now + (dur || (tipo === 'real' ? 5200 : tipo === 'grito' ? 2200 : 3000))});
      if(ATOR[id]) ATOR[id].fala = now + (tipo === 'grito' ? 1200 : 1600);
      if(st.baloes.length > 8) st.baloes.splice(0, st.baloes.length - 8);
    }
    const agenda = (t, fn) => st.agenda.push({t, fn});
    function decidir(at, now){
      if(Object.values(ATOR).filter(o => o.modo !== 'sentado').length >= 5){ at.prox = now + 2000 + Math.random() * 3000; return; }
      let destino = null, alvo = null;
      if(Math.random() < .38){
        const mesmaSala = Math.random() < .75;
        const o = sorteia(EQUIPE.filter(e => e.id !== at.id && ATOR[e.id].modo === 'sentado' && (!mesmaSala || e.sala === AG[at.id].sala)));
        if(o){ const [sx, sy] = ASSENTO[o.id]; alvo = [[sx - 1, sy], [sx + 1, sy], [sx, sy - 1], [sx - 1, sy - 1]].find(p => livre(p[0], p[1])); destino = {tipo: 'visita', quem: o.id}; }
      }
      if(!alvo){ const tipo = sorteia(['cafe', 'cafe', 'agua', 'tv', 'sofa', 'janela', AG[at.id].sala ? 'tv' : 'recepcao']); alvo = sorteia(PONTOS[tipo]); destino = {tipo}; }
      if(!ir(at, alvo, destino)) at.prox = now + 2500 + Math.random() * 2500;
    }
    function chegou(at, now){
      const d = at.destino || {};
      if(d.tipo === 'casa'){ at.modo = 'sentado'; at.costas = false; at.espelho = Math.random() < .5; at.destino = null; at.prox = now + 5000 + Math.random() * 11000; return; }
      at.modo = 'parado'; at.ate = now + 2400 + Math.random() * 2600;
      at.costas = ['tv', 'janela', 'cafe', 'agua', 'buzina'].includes(d.tipo);
      if(d.tipo === 'visita' && d.quem){
        const o = ATOR[d.quem]; at.espelho = o.x < at.x;
        falar(at.id, sorteia(Math.random() < .5 ? GERAL : FALAS[at.id]), now);
        agenda(now + 1400, t => falar(d.quem, sorteia(RESPOSTAS), t));
      }else if(d.tipo === 'buzina') festa(now, at);
      else if(Math.random() < .6) falar(at.id, sorteia(d.tipo === 'tv' ? NA_TV : d.tipo === 'cafe' || d.tipo === 'agua' ? PAUSA : GERAL), now);
    }
    function voltar(at, now){
      const casa = ASSENTO[at.id];
      if(!ir(at, casa, {tipo: 'casa'})){ at.x = casa[0] + .5; at.y = casa[1] + .5; at.cx = casa[0]; at.cy = casa[1]; at.rota = []; at.modo = 'sentado'; at.costas = false; at.prox = now + 6000; }
    }
    function mover(at, dt, now){
      if(!at.rota.length) return;
      const [cx, cy] = at.rota[0], tx0 = cx + .5, ty0 = cy + .5, dx = tx0 - at.x, dy = ty0 - at.y, dist = Math.hypot(dx, dy), passo = VEL * dt / 1000;
      const sx = dx - dy, sy = dx + dy;
      if(Math.abs(sx) > .01 || Math.abs(sy) > .01){ at.costas = sy < -.01; at.espelho = sx < -.01; }
      if(dist <= passo){ at.x = tx0; at.y = ty0; at.cx = cx; at.cy = cy; at.rota.shift(); if(!at.rota.length) chegou(at, now); }
      else{ at.x += dx / dist * passo; at.y += dy / dist * passo; }
      at.passo += passo * 4;
    }
    function festa(now, at){
      st.indoBuzinar = null;
      const [hx, hy] = iso(25.5, .5, 30);
      st.festa = {t0: now, x: hx, y: hy};
      if(at) at.pulo = now + 1200;
      Object.values(ATOR).filter(o => !at || o.id !== at.id).sort(() => Math.random() - .5).slice(0, 4)
        .forEach((o, i) => agenda(now + 350 + i * 280, t => { falar(o.id, sorteia(GRITOS), t, 'grito'); o.pulo = t + 1300; }));
      for(let i = 0; i < 70; i++) st.confete.push({x: hx + (Math.random() - .5) * 10, y: hy, vx: (Math.random() - .5) * 150, vy: -60 - Math.random() * 130,
        cor: [OURO, CREME, '#2f6fd1', '#87d5ad', OURO_CLARO][i % 5], ate: now + 1600 + Math.random() * 900});
      somBuzina(); agenda(now + 500, () => somTorcida());
    }
    function chamarBuzina(now){
      st.nextHorn = now + 30000 + Math.random() * 15000;
      const at = sorteia(EQUIPE.filter(a => a.sala === 1 && ATOR[a.id].modo === 'sentado').map(a => ATOR[a.id]));
      if(at && ir(at, sorteia(PONTOS.buzina), {tipo: 'buzina'})){ st.indoBuzinar = at.id; st.buzinaAte = now + 9000; }
      else festa(now, null);
    }
    function ambiente(now, dt){
      if(!st.nextTalk){ st.nextTalk = now + 1200; st.nextShout = now + 7000; st.nextHorn = now + 15000; }
      for(const at of Object.values(ATOR)){
        if(at.modo === 'sentado' && !at.rota.length && now > at.prox) decidir(at, now);
        else if(at.modo === 'parado' && now > at.ate) voltar(at, now);
        mover(at, dt, now);
      }
      if(now > st.nextTalk){ const at = sorteia(Object.values(ATOR).filter(o => o.fala < now)); if(at) falar(at.id, sorteia(Math.random() < .55 ? FALAS[at.id] : GERAL), now); st.nextTalk = now + 1800 + Math.random() * 2200; }
      if(now > st.nextShout){ const at = sorteia(Object.values(ATOR)); if(at){ falar(at.id, sorteia(GRITOS), now, 'grito'); at.pulo = now + 900; } st.nextShout = now + 8000 + Math.random() * 7000; }
      if(st.indoBuzinar && now > st.buzinaAte) festa(now, null);
      else if(!st.indoBuzinar && now > st.nextHorn) chamarBuzina(now);
      const vencidos = st.agenda.filter(a => a.t <= now); st.agenda = st.agenda.filter(a => a.t > now); for(const a of vencidos) a.fn(now);
      const s = dt / 1000; for(const p of st.confete){ p.vy += 220 * s; p.x += p.vx * s; p.y += p.vy * s; }
    }
    const curto = s => s.length > 46 ? s.slice(0, 44).trimEnd() + '…' : s;
    function eventosReais(now){
      if(!st.queue.length || now < st.nextReal) return;
      const e = st.queue.shift(), alvo = ATOR[e.a];
      if(!alvo) return;
      st.active = {event: e, agent: AG[e.a], ate: now + 5200};
      if(e.o === 'w' && e.a !== 'genio'){
        falar('genio', 'Pedido do WhatsApp para ' + AG[e.a].nome, now, 'real', 2800);
        st.aviao = {de: iso(ATOR.genio.x, ATOR.genio.y, 34), para: iso(alvo.x, alvo.y, 34), t0: now, dur: 1100};
        agenda(now + 1100, t => { falar(e.a, curto(textoEv(e)), t, 'real', 5200); alvo.pulo = t + 600; });
        st.nextReal = now + 3800;
      }else{ falar(e.a, curto(textoEv(e)), now, 'real', 5200); alvo.pulo = now + 600; st.nextReal = now + 2600; }
      update();
    }

    // som da buzina e da torcida, gerado na hora (sem arquivo de áudio); o botão Som liga e desliga
    function audio(){
      if(!st.som) return null;
      const ua = navigator.userActivation; if(!st.audio && ua && !ua.hasBeenActive) return null;   // sem toque na página, o navegador não deixa tocar
      try{
        const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
        if(!st.audio) st.audio = new AC();
        if(st.audio.state === 'suspended') st.audio.resume().catch(() => {});
        return st.audio;
      }catch(e){ return null; }
    }
    function somBuzina(){
      const ac = audio(); if(!ac) return;
      try{
        const t0 = ac.currentTime + .03, saida = ac.createGain(), filtro = ac.createBiquadFilter();
        saida.gain.value = .3; filtro.type = 'lowpass'; filtro.frequency.value = 2600; filtro.connect(saida); saida.connect(ac.destination);
        const toque = (ini, dur) => { const g = ac.createGain(); g.gain.setValueAtTime(.0001, ini); g.gain.exponentialRampToValueAtTime(1, ini + .03);
          g.gain.setValueAtTime(1, ini + dur - .06); g.gain.exponentialRampToValueAtTime(.0001, ini + dur); g.connect(filtro);
          for(const f of [220, 440, 466]){ const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * .96, ini); o.frequency.linearRampToValueAtTime(f, ini + .06); o.connect(g); o.start(ini); o.stop(ini + dur + .02); } };
        toque(t0, .28); toque(t0 + .38, .28); toque(t0 + .76, .95);
      }catch(e){}
    }
    function somTorcida(){
      const ac = audio(); if(!ac) return;
      try{
        const dur = 1.8, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
        for(let i = 0; i < n; i++){ const t = i / ac.sampleRate, env = Math.min(1, t / .25) * Math.max(0, 1 - Math.max(0, t - .9) / .9); d[i] = (Math.random() * 2 - 1) * env * (.6 + .4 * Math.sin(t * 2 * Math.PI * 7 + Math.sin(t * 13))); }
        const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
        src.buffer = b; bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = .6; g.gain.value = .14;
        src.connect(bp); bp.connect(g); g.connect(ac.destination); src.start();
      }catch(e){}
    }
    function calarSom(){ if(st.audio && st.audio.state === 'running' && st.audio.suspend) st.audio.suspend().catch(() => {}); }

    // desenho: buffer em pixel (640 x 360) ampliado sem suavizar; textos e balões por cima, nítidos
    function caixaArred(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
    function largura(s, fs){ const m = ctx.measureText(s); return m && m.width ? m.width : s.length * fs * .56; }
    function textoParede(g1, g2, z, texto, cor, tam){
      const k = st.k, [x0, y0] = iso(g1, 0, z), larg = (g2 - g1) * TW / 2;
      ctx.save(); ctx.setTransform(k, k * .5, 0, k, tx(x0), ty(y0)); ctx.font = '700 ' + tam + 'px ' + F_ESTREITA;
      ctx.fillStyle = cor; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(texto, larg / 2, 0); ctx.restore();
    }
    function baloes(now){
      const r = st.r || 1, usados = [];
      st.baloes = st.baloes.filter(b => now < b.ate);
      for(const bl of st.baloes.slice().sort((p, q) => q.nasce - p.nasce)){
        const at = ATOR[bl.id]; if(!at) continue;
        const [x, y] = iso(at.x, at.y), topo = ty(y - (at.modo === 'sentado' && !at.rota.length ? 36 : 42)), sx = tx(x);
        if(sx < -10 * r || sx > canvas.width + 10 * r || topo < -20 * r || topo > canvas.height + 60 * r) continue;
        const grito = bl.tipo === 'grito', real = bl.tipo === 'real', fs = Math.round((grito ? 15 : 12) * r), pad = 7 * r;
        const fonte = p => p + ' ' + fs + 'px ' + (grito ? F_ESTREITA : F_TEXTO);
        const nome = grito ? '' : AG[bl.id].nome + ': ';
        ctx.font = fonte(700); const wn = nome ? largura(nome, fs) : 0; ctx.font = fonte(grito ? 700 : 500); const wt = largura(bl.texto, fs);
        const w = Math.min(canvas.width - 8 * r, wn + wt + pad * 2), h = fs + pad * 1.3, vida = (now - bl.nasce) / Math.max(1, bl.ate - bl.nasce);
        let x0 = Math.max(4 * r, Math.min(canvas.width - w - 4 * r, sx - w / 2)), y0 = Math.max(2 * r, topo - h - 6 * r - vida * 10 * r);
        if(grito && now - bl.nasce < 600) x0 += (Math.floor(now / 60) % 2 ? 1 : -1) * r;
        for(const u of usados) if(x0 < u.x + u.w && x0 + w > u.x && y0 < u.y + u.h && y0 + h > u.y) y0 = u.y - h - 4 * r;
        usados.push({x: x0, y: y0, w, h});
        ctx.globalAlpha = Math.max(0, Math.min(1, (bl.ate - now) / 400));
        ctx.fillStyle = real ? '#101d2b' : grito ? OURO : '#fbfaf6'; ctx.strokeStyle = real ? OURO_CLARO : CONTORNO; ctx.lineWidth = Math.max(1, (real || grito ? 2 : 1.5) * r);
        caixaArred(x0, y0, w, h, 4 * r); ctx.fill(); ctx.stroke();
        const cx = Math.max(x0 + 8 * r, Math.min(x0 + w - 8 * r, sx));
        ctx.beginPath(); ctx.moveTo(cx - 4 * r, y0 + h - 1); ctx.lineTo(cx, y0 + h + 5 * r); ctx.lineTo(cx + 4 * r, y0 + h - 1); ctx.closePath(); ctx.fill();
        ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        if(nome){ ctx.font = fonte(700); ctx.fillStyle = real ? OURO_CLARO : CONTORNO; ctx.fillText(nome, x0 + pad, y0 + h / 2 + .5); }
        ctx.font = fonte(grito ? 700 : 500); ctx.fillStyle = real ? CREME : CONTORNO; ctx.fillText(bl.texto, x0 + pad + wn, y0 + h / 2 + .5);
        ctx.globalAlpha = 1;
      }
    }
    function nomeSelecionado(){
      const at = ATOR[st.selected]; if(!at) return;
      const r = st.r || 1, [bxv, byv] = iso(at.x, at.y), x = tx(bxv), y = ty(byv), fs = Math.round(11 * r), s = AG[at.id].nome;
      ctx.font = '600 ' + fs + 'px ' + F_TEXTO;
      const w = largura(s, fs) + 10 * r, px = x - w / 2, py = y + 5 * r;
      ctx.fillStyle = 'rgba(16,29,43,.9)'; caixaArred(px, py, w, fs + 6 * r, 4 * r); ctx.fill();
      ctx.fillStyle = OURO_CLARO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, py + (fs + 6 * r) / 2);
    }
    function efeitoBuzina(now){
      const f = st.festa; if(!f) return;
      const t = now - f.t0; if(t > 2600){ st.festa = null; return; }
      const k = st.k, r = st.r || 1, x = tx(f.x), y = ty(f.y), some = t < 1900 ? 1 : Math.max(0, (2600 - t) / 700);
      ctx.strokeStyle = OURO_CLARO; ctx.lineWidth = 2 * r;
      for(let i = 0; i < 3; i++){ const p = ((t / 700) + i / 3) % 1; ctx.globalAlpha = (1 - p) * some; ctx.beginPath(); ctx.arc(x + 6 * k, y, (6 + p * 30) * k, -1.25, .35); ctx.stroke(); }
      ctx.globalAlpha = 1;
      if(t < 1900){ const fs = Math.round(24 * r), sx = x - 34 * r + (Math.floor(t / 50) % 2 ? 2 : -2) * r, sy = y - 10 * r;
        ctx.font = '700 ' + fs + 'px ' + F_ESTREITA; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.lineWidth = 4 * r; ctx.strokeStyle = CONTORNO; ctx.strokeText('BÓÓÓÓ', sx, sy); ctx.fillStyle = OURO; ctx.fillText('BÓÓÓÓ', sx, sy); }
      // faixa Fortal que desce no alto da cena
      const desce = Math.min(1, t / 300) * (t > 2200 ? Math.max(0, (2600 - t) / 400) : 1), fw = Math.min(canvas.width * .42, 320 * r), fh = 36 * r, fy = -fh + desce * (fh + 12 * r), fxx = (canvas.width - fw) / 2;
      ctx.fillStyle = '#0f1c2e'; ctx.strokeStyle = OURO; ctx.lineWidth = 3 * r; ctx.fillRect(fxx, fy, fw, fh); ctx.strokeRect(fxx, fy, fw, fh);
      ctx.font = '700 ' + Math.round(22 * r) + 'px ' + F_ESTREITA; ctx.fillStyle = OURO_CLARO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('É FORTAL', canvas.width / 2, fy + fh / 2 + 1);
    }
    const CAM = {geral: [0, 0, BW, BH], genio: [46, 6, 398, 262], espelho: [214, 90, 598, 354]};
    function alvoCam(){
      const [x1, y1, x2, y2] = CAM[st.view] || CAM.geral, A = canvas.width / Math.max(1, canvas.height);
      let w = x2 - x1, h = y2 - y1; if(w / h < A) w = h * A; else h = w / A;
      let x = (x1 + x2) / 2 - w / 2, y = (y1 + y2) / 2 - h / 2;
      x = w >= BW ? (BW - w) / 2 : Math.max(0, Math.min(BW - w, x)); y = h >= BH ? (BH - h) / 2 : Math.max(0, Math.min(BH - h, y));
      return {x, y, w, h};
    }
    function camera(now){
      const alvo = alvoCam(), chave = [alvo.x, alvo.y, alvo.w, alvo.h].map(v => v.toFixed(1)).join();
      if(!st.cam || !st.raf || reduzido.matches){ if(chave !== st.camChave || !st.cam){ st.cam = alvo; st.camChave = chave; st.camDe = null; } }
      else if(chave !== st.camChave){ st.camChave = chave; st.camDe = Object.assign({}, st.cam); st.camAlvo = alvo; st.camT0 = now; }
      if(st.camDe){ const p = Math.min(1, (now - st.camT0) / 350), e = 1 - Math.pow(1 - p, 3), d = st.camDe, a = st.camAlvo;
        st.cam = {x: d.x + (a.x - d.x) * e, y: d.y + (a.y - d.y) * e, w: d.w + (a.w - d.w) * e, h: d.h + (a.h - d.h) * e}; if(p >= 1) st.camDe = null; }
      const c = st.cam; st.k = canvas.width / c.w; return c;
    }
    const tx = bxv => (bxv - st.cam.x) * st.k, ty = byv => (byv - st.cam.y) * st.k;
    function posicionarPontos(){
      const c = st.cam || {x: 0, y: 0, w: BW, h: BH};
      for(const h of pontos){ const at = ATOR[h.dataset.v]; if(!at) continue; const [x, y] = iso(at.x, at.y, 18);
        const l = ((x - c.x) / c.w * 100).toFixed(2) + '%', t = ((y - c.y) / c.h * 100).toFixed(2) + '%'; if(h.style.left !== l) h.style.left = l; if(h.style.top !== t) h.style.top = t; }
    }
    function draw(now = performance.now()){
      if(!ctx || !buf || !canvas || !canvas.isConnected) return;
      const b = bx;
      b.setTransform(1, 0, 0, 1, 0, 0); b.imageSmoothingEnabled = false; b.drawImage(fundo, 0, 0);
      tv(b, now); bandeirinhas(b, now);
      const itens = OBJETOS.slice();
      for(const at of Object.values(ATOR)) itens.push({prof: at.x + at.y + (at.modo === 'sentado' && !at.rota.length ? 0 : .02), fn: c => boneco(c, at, now)});
      itens.sort((p, q) => p.prof - q.prof);
      for(const it of itens) it.fn(b, now);
      st.confete = st.confete.filter(p => now < p.ate);
      for(const p of st.confete){ b.fillStyle = p.cor; b.fillRect(Math.round(p.x), Math.round(p.y), 2, (Math.floor(now / 90 + p.x) % 2) ? 2 : 1); }
      const a = st.aviao;
      if(a){ const p = (now - a.t0) / a.dur; if(p >= 1) st.aviao = null; else{ const x = Math.round(a.de[0] + (a.para[0] - a.de[0]) * p), y = Math.round(a.de[1] + (a.para[1] - a.de[1]) * p - Math.sin(p * Math.PI) * 30);
        b.fillStyle = CREME; b.fillRect(x - 3, y - 1, 6, 2); b.fillRect(x - 1, y - 3, 2, 2); b.fillStyle = '#9fb3c6'; b.fillRect(x - 3, y + 1, 4, 1); } }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = FUNDO_CENA; ctx.fillRect(0, 0, canvas.width, canvas.height);   // tela cheia fora de 16:9 fica com a cor da cena
      const cam = camera(now); ctx.drawImage(buf, cam.x, cam.y, cam.w, cam.h, 0, 0, canvas.width, canvas.height);
      const s = estoque();
      textoParede(4.1, 8.9, 39.5, 'SALA DO GÊNIO', OURO_CLARO, 7); textoParede(14.6, 18.9, 47.5, 'SALA DO ESPELHO', OURO_CLARO, 7);
      textoParede(14.6, 18.9, 36, s.vh ? (s.vh === 1 ? '1 VENDA HOJE' : s.vh + ' VENDAS HOJE') : 'ESPELHO DE VENDAS', s.vh ? OURO_CLARO : '#cfd8e3', 5);
      textoParede(9.3, 11.5, 28, 'CAFÉ', CREME, 6);
      nomeSelecionado(); baloes(now); efeitoBuzina(now); posicionarPontos(); legendaTv();
    }
    function prepararCena(){   // só na primeira vez que um administrador abre a página
      if(cenaPronta) return;
      cenaPronta = true;
      buf = novaTela(); bx = buf.getContext('2d'); fundo = novaTela(); fx = fundo.getContext('2d');
      iniciarAtores(); montarObjetos(); montarFundo();
    }
    function carregarRecursos(){   // Mona Sans estreita para gritos e placas (no lugar da Barlow Condensed) e o logo
      if(!recursos) recursos = (async () => {
        try{
          if(typeof FontFace !== 'undefined'){
            const ff = new FontFace('Mona Estreita', 'url(' + FONTE_URL + ') format("woff2")', {weight: '200 900', stretch: '80%', style: 'normal'});
            document.fonts.add(ff); await ff.load();
          }
        }catch(e){}
        try{ await Promise.all(['500 12px "Mona Sans"', '600 12px "Mona Sans"', '700 12px "Mona Sans"'].map(f => document.fonts.load(f))); }catch(e){}
        try{ if(!logoImg) logoImg = await carregarImg('img/logo-fortal.png', false); }catch(e){}
        montarFundo();
      })();
      recursos.then(() => { if(st.montado && !st.raf) draw(); });
    }

    // ---------- tela ----------
    function medir(){
      if(!canvas || !cena || !canvas.isConnected) return;
      const rect = cena.getBoundingClientRect(), width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height || width * BH / BW));
      const ratio = Math.min(devicePixelRatio || 1, 3);
      const pixels = Math.min(3200, Math.round(width * ratio)), alto = Math.max(1, Math.round(pixels * height / width));
      if(canvas.width !== pixels || canvas.height !== alto){ canvas.width = pixels; canvas.height = alto; }
      st.r = canvas.width / width;
      draw();
    }
    function setView(view){
      st.view = CAM[view] ? view : 'geral';
      if(cena) cena.dataset.view = st.view;
      $$('[data-acao="ec-sala"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === st.view ? 'true' : 'false'));
      requestAnimationFrame(medir);
    }
    function escolher(id, daLista){
      if(!AG[id]) return;
      st.selected = id;
      if(daLista && estreito.matches){
        setView(AG[id].sala ? 'espelho' : 'genio');
        requestAnimationFrame(() => { const s = $('#ec-sel'); if(s) s.scrollIntoView({behavior: menosMov() ? 'auto' : 'smooth', block: 'center'}); });
      }
      atualizarEscolhido();
      if(!st.raf) draw();
    }
    function atualizarEscolhido(){
      const a = AG[st.selected]; if(!a) return;
      const pon = (sel, t) => { const el = $(sel); if(el && el.textContent !== t) el.textContent = t; };
      pon('#ec-sel-ini', a.nome.charAt(0)); pon('#ec-sel-nome', a.nome); pon('#ec-sel-papel', a.papel);
      pon('#ec-sel-desc', a.last ? textoEv(a.last) : a.desc);
      pon('#ec-sel-quando', a.last ? 'Último registro ' + quando(a.last.em) + (a.last.o === 'w' ? ', pedido do WhatsApp.' : ', rotina do Espelho.')
        : a.id === 'ro' && st.lastSignal ? 'Último sinal do robô ' + quando(st.lastSignal) + '.' : st.loaded ? 'Sem registro no diário recebido.' : 'Esperando o diário.');
      $$('[data-acao="ec-ag"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === st.selected ? 'true' : 'false'));
    }
    function update(){
      if(virarDia()) st.est = null;
      $$('.ec-ag').forEach(b => {
        const a = AG[b.dataset.v]; if(!a) return;
        const n = b.querySelector('.ec-n');
        if(n){ const h = st.loaded ? '<span aria-hidden="true">' + a.count + '</span><span class="sr">, ' + esc(plural(a.count, 'registro hoje', 'registros hoje')) + '</span>' : ''; if(n.innerHTML !== h) n.innerHTML = h; }
        b.classList.toggle('ativo', !!st.active && (st.active.agent.id === a.id || st.active.event.a === a.id));
        b.title = a.last ? 'Último registro: ' + textoEv(a.last) + ', ' + quando(a.last.em) : a.desc;
      });
      atualizarEscolhido();
      const feed = $('#ec-feed');
      if(feed){
        const hoje = hojeK(), ontem = diaKey(Date.now() - 864e5);
        const h = st.events.slice(0, 12).map(e => {
          const ms = Date.parse(e.em), d = diaKey(ms), dia = d === hoje ? '' : d === ontem ? 'ontem' : fDM.format(ms);
          return '<li><span class="h num"><time datetime="' + esc(e.em) + '">' + esc(hora(ms)) + '</time>' + (dia ? '<small>' + esc(dia) + '</small>' : '') + '</span>' +
            '<span class="meio"><b>' + esc(AG[e.a].nome) + '</b><span class="ec-txt">' + esc(textoEv(e)) + '</span><small>' + (e.o === 'w' ? 'Pedido do WhatsApp' : 'Rotina do Espelho') + '</small></span></li>';
        }).join('');
        if(feed.dataset.v !== h){ feed.innerHTML = h; feed.dataset.v = h; }
      }
      const vz = $('#ec-vazio');
      if(vz) vz.textContent = st.events.length ? '' : !st.loaded ? (st.erro ? 'O diário não abriu. Toque em Tentar de novo, lá em cima.' : 'Consultando o diário…') : 'Nenhum movimento registrado ainda. Os novos aparecem aqui.';
      const total = Object.values(AG).reduce((s, a) => s + a.count, 0), sub = $('#ec-di-sub');
      if(sub) sub.textContent = st.loaded ? plural(total, 'registro hoje', 'registros hoje') + (st.events.length > 12 ? ', os 12 mais recentes aqui' : '') : 'Diário da equipe';
      legendaTv();
    }
    function notaMov(){
      const n = $('#ec-mov-nota'); if(!n) return;
      n.textContent = reduzido.matches ? 'Movimento reduzido ligado neste aparelho: a cena fica parada. O que aconteceu de verdade está na lista de movimentos.'
        : 'Conversas, gritos e buzina são clima de escritório. O que aconteceu de verdade aparece no balão dourado e na lista de movimentos.';
    }

    // som e tela cheia
    const I_SOM = svg('<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>');
    const I_MUDO = svg('<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5z"/><path d="M16 10l5 5M21 10l-5 5"/>');
    const I_SAIR = svg('<path d="M9 3v6H3M15 21v-6h6M3 3l6 6M21 21l-6-6"/>');
    const telaCheiaOk = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    const emTelaCheia = () => document.fullscreenElement || document.webkitFullscreenElement || null;
    function sairTelaCheia(){
      const f = document.exitFullscreen || document.webkitExitFullscreen;
      if(f){ try{ const r = f.call(document); if(r && r.catch) r.catch(() => {}); }catch(e){} }
    }
    function alternarTela(){
      const alvo = $('#ec-palco'); if(!alvo) return;
      if(emTelaCheia()) return sairTelaCheia();
      const pedir = alvo.requestFullscreen || alvo.webkitRequestFullscreen;
      if(!pedir) return;
      try{ const r = pedir.call(alvo); if(r && r.catch) r.catch(() => toast('Não deu para abrir em tela cheia neste aparelho.')); }catch(e){}
    }
    function mostrarSom(){
      const b = $('#ec-som'); if(!b) return;
      b.setAttribute('aria-pressed', st.som ? 'true' : 'false');
      b.title = st.som ? 'Buzina e torcida com som' : 'Buzina e torcida sem som';
      b.innerHTML = (st.som ? I_SOM : I_MUDO) + 'Som';
    }
    function mostrarTela(){
      const b = $('#ec-tela'); if(!b) return;
      const on = !!emTelaCheia();
      b.innerHTML = (on ? I_SAIR : ICO.ampliar) + (on ? 'Sair da tela cheia' : 'Tela cheia');
    }

    // ---------- ciclo: entra na página, lê e anima; sai ou esconde, para ----------
    function frame(now){
      st.raf = null;
      if(!ativo() || reduzido.matches){ draw(now); return; }
      const dt = Math.min(100, st.last ? now - st.last : 16); st.last = now;
      ambiente(now, dt); eventosReais(now);
      if(st.active && now > st.active.ate){ st.active = null; update(); }
      if(now - st.drawn >= 32 || now < st.drawn){ st.drawn = now; draw(now); }
      st.raf = requestAnimationFrame(frame);
    }
    function animate(){ if(!st.raf && ativo() && !reduzido.matches){ st.last = 0; st.raf = requestAnimationFrame(frame); } }
    function pararAnimacao(){
      if(st.raf) cancelAnimationFrame(st.raf);
      Object.assign(st, {raf: null, active: null, queue: [], baloes: [], confete: [], aviao: null, festa: null, agenda: [], indoBuzinar: null, nextTalk: 0, nextReal: 0, last: 0});
      if(cenaPronta) iniciarAtores();
      if(canvas && canvas.isConnected){ draw(); update(); }
    }
    function retomar(){
      if(!ativo()) return;
      medir();
      clearInterval(st.poll); st.poll = setInterval(buscar, 8000);
      buscar(); animate();
    }
    function pausar(){
      clearInterval(st.poll); st.poll = null; st.inFlight = null; st.epoch++;
      pararAnimacao(); calarSom();
    }
    function desmontar(){
      const tinha = st.montado;
      pausar(); st.montado = false;
      if(st.ro){ try{ st.ro.disconnect(); }catch(e){} st.ro = null; }
      const f = emTelaCheia(); if(tinha && f && f.id === 'ec-palco') sairTelaCheia();
      canvas = null; ctx = null; cena = null; pontos = [];
    }
    function montar(){
      canvas = $('#ec-canvas'); cena = $('#ec-cena'); if(!canvas || !cena) return;
      ctx = canvas.getContext('2d');
      pontos = $$('.ec-ponto', cena);
      if(st.cod !== S.cod){ zerar(); st.cod = S.cod; }
      prepararCena();
      st.montado = true; st.epoch++;
      st.som = LS.get(K_SOM) !== '0';
      mostrarSom(); mostrarTela(); notaMov(); rede(st.rede[0], st.rede[1], st.rede[2]);
      carregarRecursos();
      if(typeof ResizeObserver === 'function'){ st.ro = new ResizeObserver(() => { if(st.montado) medir(); }); st.ro.observe(cena); }
      medir(); update();
      retomar();
    }
    async function entrar(){
      const raiz = $('#ec-raiz'); if(!raiz) return;
      if(st.montado) desmontar();
      const cod = S.cod;
      let ok = false;
      if(cod && st.adminCod !== cod){ try{ adminP = null; }catch(e){} }   // código trocado: a resposta guardada era do código anterior
      if(cod && st.revogado !== cod){ try{ ok = await ehAdmin(); st.adminCod = cod; }catch(e){ ok = false; } }
      if(!raiz.isConnected || cod !== S.cod || !naRota()) return;
      const ac = $('#ec-acoes');
      if(!ok){
        if(ac) ac.innerHTML = '';
        raiz.innerHTML = st.revogado === cod ? semAcessoHtml(true) : S.admin === false ? semAcessoHtml(false) : semRedeHtml();
        return;
      }
      if(ac) ac.innerHTML = acoesHtml();
      raiz.innerHTML = corpoHtml();
      montar();
    }

    // ---------- HTML ----------
    function acoesHtml(){
      return '<button type="button" class="btn btn-peq ec-som" id="ec-som" data-acao="ec-som" aria-pressed="' + st.som + '">' + (st.som ? I_SOM : I_MUDO) + 'Som</button>' +
        (telaCheiaOk() ? '<button type="button" class="btn btn-peq" id="ec-tela" data-acao="ec-tela">' + ICO.ampliar + 'Tela cheia</button>' : '');
    }
    function semAcessoHtml(revogado){
      return '<div class="vazio ec-aviso"><h2 class="t-3">' + (revogado ? 'O diário fechou para este código' : 'O Escritório é só do administrador') + '</h2>' +
        '<p class="texto-2 ler">' + (revogado ? 'O servidor parou de liberar o diário dos agentes para o código deste aparelho. Se o código de administrador mudou, entre de novo com o código novo pelo Perfil.'
          : 'O diário dos agentes do Gênio e do Espelho só abre com o código de administrador. Com o código do time, o resto do app funciona igual.') + '</p>' +
        '<a class="btn" href="#/">Ir para o início</a></div>';
    }
    function semRedeHtml(){
      return '<div class="vazio ec-aviso"><h2 class="t-3">Não consegui abrir o Escritório</h2><p class="texto-2">O servidor não respondeu agora. Confira a internet e tente de novo.</p>' +
        '<button type="button" class="btn" data-acao="ec-entrar">Tentar de novo</button></div>';
    }
    function corpoHtml(){
      const ag = a => '<button type="button" class="ec-ag" data-acao="ec-ag" data-v="' + a.id + '" aria-pressed="' + (a.id === st.selected) + '"><span class="ec-ini" aria-hidden="true">' + esc(a.nome.charAt(0)) + '</span>' +
        '<span class="ec-ag-t"><b>' + esc(a.nome) + '</b><small>' + esc(a.papel) + '</small></span><span class="ec-n num"></span></button>';
      const salas = [0, 1].map(s => '<p class="rotulo ec-sala-t">' + (s ? 'Sala do Espelho' : 'Sala do Gênio') + '</p><div class="ec-equipe">' + EQUIPE.filter(a => a.sala === s).map(ag).join('') + '</div>').join('');
      const vistas = [['geral', 'Visão geral'], ['genio', '<span class="so-largo">Sala do </span>Gênio'], ['espelho', '<span class="so-largo">Sala do </span>Espelho']];
      return '<div class="ec-topo"><div class="seg ec-salas" role="group" aria-label="Qual sala mostrar">' +
          vistas.map(x => '<button type="button" data-acao="ec-sala" data-v="' + x[0] + '" aria-pressed="' + (st.view === x[0]) + '">' + x[1] + '</button>').join('') + '</div>' +
          '<p class="ec-rede" id="ec-rede" data-estado="carregando"><span class="ec-ponto-st" aria-hidden="true"></span><span><span id="ec-rede-t" role="status" aria-live="polite">Consultando o diário…</span><span id="ec-rede-h"></span></span>' +
          '<button type="button" class="link-mais" data-acao="ec-tentar" id="ec-tentar" hidden>Tentar de novo</button></p></div>' +
        '<div class="ec-grade"><div class="ec-a">' +
          '<div class="ec-palco" id="ec-palco"><div class="ec-cena" id="ec-cena" data-view="' + esc(st.view) + '">' +
            '<canvas id="ec-canvas" width="1280" height="720" role="img" aria-label="Escritório Fortal em pixel art, com duas salas separadas por vidro. Gênio, Mila, Flávia, Sérgio, Júlia, Caio e Bento na sala do Gênio; Otto, Téo, Rô, Murilo, Dora, Lia, Hugo, Nina e Rafa na sala do Espelho, andando, conversando e tocando a buzina."></canvas>' +
            '<div class="ec-pontos">' + EQUIPE.map(a => '<button type="button" class="ec-ponto" tabindex="-1" data-acao="ec-ag" data-v="' + a.id + '" aria-label="' + esc(a.nome + ', ' + a.papel.toLowerCase()) + '" aria-pressed="' + (a.id === st.selected) + '"><span>' + esc(a.nome) + '</span></button>').join('') + '</div>' +
            '</div><button type="button" class="btn btn-peq ec-sair" data-acao="ec-tela">' + I_SAIR + 'Sair da tela cheia</button></div>' +
          '<p class="nota ec-nota" id="ec-mov-nota"></p><p class="nota ec-nota" id="ec-tv-txt"></p>' +
          '<section class="caixa ec-sel" id="ec-sel" aria-label="Agente escolhido"><span class="ec-sel-ini" id="ec-sel-ini" aria-hidden="true"></span>' +
            '<div class="ec-sel-txt"><h2 class="t-3"><span id="ec-sel-nome"></span> <small id="ec-sel-papel"></small></h2><p class="texto-2" id="ec-sel-desc"></p><p class="nota" id="ec-sel-quando"></p></div></section>' +
        '</div>' +
        '<section class="caixa ec-diario" aria-labelledby="ec-di-t"><div class="sec-cab"><h2 class="t-3" id="ec-di-t">Últimos movimentos</h2><span class="sub" id="ec-di-sub">Diário da equipe</span></div>' +
          '<ul class="feed ec-feed" id="ec-feed"></ul><p class="texto-2 ec-vazio" id="ec-vazio">Consultando o diário…</p></section>' +
        '<aside class="caixa ec-time" aria-labelledby="ec-time-t"><div class="sec-cab"><h2 class="t-3" id="ec-time-t">Agora</h2><span class="sub">16 agentes</span></div>' + salas +
          '<p class="nota">Os números são os registros recebidos hoje, não tarefas em andamento.</p></aside></div>';
    }
    function telaEscritorio(){
      pos.push(() => entrar());
      return '<header class="pg-cab"><div><h1 class="t-1">Escritório</h1><p class="sub">O Gênio e o Espelho trabalhando ao vivo, em duas salas.</p></div><div class="cab-acoes ec-acoes" id="ec-acoes"></div></header>' +
        '<div class="ec-raiz" id="ec-raiz"><div class="esqueleto" aria-busy="true"><div class="brilho" style="height:46px;max-width:460px"></div><div class="brilho ec-brilho-cena"></div><p class="sub">Abrindo o escritório…</p></div></div>';
    }

    // ---------- registros ----------
    ROTAS.push([/^#\/escritorio$/, 'escritorio', () => telaEscritorio()]);
    HASH_X.push(h => /^#escritorio$/.test(h) ? '#/escritorio' : null);
    ACOES_X['ec-ag'] = el => escolher(el.dataset.v, !el.classList.contains('ec-ponto'));
    ACOES_X['ec-sala'] = el => setView(el.dataset.v);
    ACOES_X['ec-som'] = () => {
      st.som = !st.som; LS.set(K_SOM, st.som ? '1' : '0'); mostrarSom();
      if(st.som) audio(); else calarSom();
    };
    ACOES_X['ec-tela'] = () => alternarTela();
    ACOES_X['ec-tentar'] = () => { if(st.montado){ st.inFlight = null; buscar(); } };
    ACOES_X['ec-entrar'] = () => entrar();
    document.addEventListener('visibilitychange', () => {
      if(!st.montado) return;
      if(!visivel()) pausar();
      else if(canvas && canvas.isConnected && naRota()) retomar();
      else desmontar();
    });
    window.addEventListener('hashchange', () => { if(st.montado && !naRota()) desmontar(); });
    window.addEventListener('resize', () => { if(st.montado) medir(); });
    reduzido.addEventListener('change', () => { if(!st.montado) return; pararAnimacao(); notaMov(); animate(); });
    estreito.addEventListener('change', () => { const v = estreito.matches ? 'genio' : 'geral'; if(st.montado) setView(v); else st.view = v; });
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(t => document.addEventListener(t, () => { if(st.montado){ mostrarTela(); requestAnimationFrame(medir); } }));
    // o navegador só libera o áudio depois de um toque na página
    document.addEventListener('pointerdown', ev => { if(st.montado && st.som && ev.target && ev.target.closest && ev.target.closest('.pg-escritorio')) audio(); }, true);
  })();

  // ---------------- x_proposta.js ----------------
  // ================= PROPOSTA EM IMAGEM (folha da unidade livre) =================
  // O cartão PNG do app anterior (1080 px de largura, no mínimo 1350 de altura) no visual do app: o fluxo da tabela,
  // o fluxo personalizado da unidade (nex-fluxos), "Montar fluxo" (entrada em R$ ou %, mensais, anuais e como o saldo
  // é pago), à vista ou só os valores. A unidade é conferida de novo no servidor (detalhe com forcar) ao abrir, a cada
  // 45 s e ao voltar para a aba; mandar, copiar e baixar só saem com a conferência recente, e se a unidade mudou de
  // situação a proposta trava. O "Montar fluxo" fica guardado por projeto em 'espelhos-fluxo-<projeto>', como antes.
  (() => {
    const K_FX = pid => 'espelhos-fluxo-' + pid;
    const FRESCO = 60000, REVER = 45000;
    const I_PROP = svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7.5h6M9 11.5h6M9 15.5h3.5"/>');
    // cores do cartão: as do tema escuro do app (fundo, superfícies, creme, apoio, ouro só no dinheiro, verde de livre)
    const COR = {fundo: '#0E0C09', sup: '#18150F', sup2: '#221E17', linha: '#2F2A21', texto: '#F3EEE4', apoio: '#A89F8E', apoio2: '#CFC6B4', ouro: '#C8A24A', livre: '#2F6B35', livreT: '#EAF7E4', verde: '#4C9A52'};
    const F_LARGA = '"Mona Larga", "Mona Sans", system-ui, sans-serif', F_TXT = '"Mona Sans", system-ui, sans-serif';
    const SALDO = {fin: {rot: 'Financiamento bancário', t: 'Financiamento bancário', sub: 'saldo final'},
      construtora: {rot: 'Direto com a construtora', t: '', sub: ''}, chaves: {rot: 'Na entrega das chaves', t: 'Chaves', sub: 'saldo na entrega das chaves'}};
    let pr = null;   // folha aberta: {pid, n, det, a, ops, modo, fx, val, conf, bloqueio, blob, vez, timer, conferindo}
    const r2 = v => Math.round(v * 100) / 100;
    const visivel = () => document.visibilityState === 'visible';
    const acharU = (det, n) => ((det && det.dados && det.dados.unidades) || []).find(x => String(x[0]) === String(n)) || null;
    const minusc = t => { t = String(t || ''); return /^[A-ZÀ-Ú][a-zà-ú]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; };
    const dataBR = iso => /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.split('-').reverse().join('/') : '';
    const dataLonga = () => { const [y, m, d] = diaKey(Date.now()).split('-'); return +d + ' de ' + MESES[+m - 1] + ' de ' + y; };
    const proxMesISO = () => { const [y, m] = diaKey(Date.now()).split('-').map(Number); return m === 12 ? (y + 1) + '-01' : y + '-' + String(m + 1).padStart(2, '0'); };
    const precosUn = (det, a) => precosCampos(det).map(x => ({k: x.k, label: x.label, v: precoU(a, x.k)})).filter(x => x.v);
    const nomeArq = () => 'proposta-' + pr.pid + '-' + slug(pr.n) + '.png';

    // ---------- fluxos da tabela da unidade (mesma regra do app anterior, nos dados do app) ----------
    const rotLinha = l => l.rot ? String(l.rot) : l.fin ? (l.m === 'assoc' ? 'Financiamento associativo' : 'Financiamento bancário') : (ROT_FLUXO[l.t] || 'Parcela');
    function fluxosTabela(det, a){
      const ex = exDe(a), F = det.dados.tabela && det.dados.tabela.fluxos, pc = precosCampos(det), out = [];
      if(F){   // tabela com fluxo por unidade: um por coluna de preço (fs no parcelado, fa na outra)
        for(const c of pc){
          const f = ex[c.k === 'pa' ? 'fa' : c.k === 'pp' ? 'fs' : ''], T = Array.isArray(f) ? F[f[0]] : null;
          if(!T || !Array.isArray(T.cols)) continue;
          const L = [];
          T.cols.forEach((col, i) => { const v = +f[i + 1]; if(v > 0) L.push({n: +col.n || 1, v, d: col.d, t: col.t, rot: col.rot, m: col.m, fin: col.t === 'fin'}); });
          if(L.length) out.push({k: c.k, rotulo: c.label, linhas: L, total: precoU(a, c.k) || r2(L.reduce((s, l) => s + l.v * l.n, 0))});
        }
        return out;
      }
      const fx = fluxoDe(det, a);   // fluxo em % da tabela (info.fluxo): cada parcela sai do preço da unidade
      if(fx && fx.src === 'I' && fx.linhas.length){
        const fin = (fx.T.cols || []).find(c => c.t === 'fin'), k = (det.info && det.info.fluxo && det.info.fluxo.base) || 'pp';
        out.push({k, rotulo: (pc.find(x => x.k === k) || {}).label || 'Tabela', linhas: fx.linhas.map(l => Object.assign({}, l, {m: l.fin && fin ? fin.m : null})), total: r2(fx.total)});
      }
      return out;
    }
    function linhaTab(l){
      const ym = l.d ? String(l.d).slice(0, 7) : '', t = rotLinha(l), v = fmtV(l.v), n = l.n || 1;
      const qd = l.fin ? (ym ? 'previsto para ' + mesAnoCurto(ym) : 'na entrega das chaves') : ym ? (n > 1 ? 'a partir de ' : 'em ') + mesAnoCurto(ym) : (/^(ato|sinal)$/.test(l.t || '') ? 'na assinatura' : '');
      return {t, dir: n > 1 ? n + 'x de ' + v : v, sub: [qd, n > 1 && !ym ? 'total de ' + fmtV(r2(l.v * n)) : ''].filter(Boolean).join(', '), saldo: !!l.fin,
        txt: t + ': ' + (n > 1 ? n + 'x de ' : '') + v + (qd ? ' (' + qd + ')' : '')};
    }
    function linhaPers(l){
      const q = +l.q || 1, t = maiusc1(String(l.nome || '').trim() || 'Parcela'), v = fmtV(+l.valor || 0), qd = String(l.quando || '').trim();
      return {t, dir: q > 1 ? q + 'x de ' + v : v, sub: qd, saldo: ehFin(l), txt: t + ': ' + (q > 1 ? q + 'x de ' : '') + v + (qd ? ' (' + qd + ')' : '')};
    }
    function modos(det, a, pid, n){
      const ops = [], fxs = fluxosTabela(det, a), ps = precosUn(det, a), soPv = ps.length === 1 && ps[0].k === 'pv';
      if(persAtual(det, a, persDe(pid, n))) ops.push(['pers', 'Fluxo personalizado']);
      fxs.forEach(f => ops.push(['tab:' + f.k, fxs.length > 1 ? 'Tabela ' + minusc(f.rotulo) : 'Fluxo da tabela']));
      if(!fxs.length) ops.push(['fluxo', 'Montar fluxo']);
      if(precoU(a, 'pv')) ops.push(['avista', 'À vista']);
      if(ps.length && !soPv && !(fxs.length === 1 && ps.length === 1)) ops.push(['tabela', fxs.length ? 'Só os valores' : 'Valores da tabela']);
      if(fxs.length) ops.push(['fluxo', 'Montar fluxo']);
      return ops;
    }

    // ---------- Montar fluxo ----------
    function fxSalvo(pid, det, a){
      let f = {}; try{ f = JSON.parse(LS.get(K_FX(pid)) || '{}') || {}; }catch(e){}
      const base = precoU(a, 'pp') || (precosUn(det, a)[0] || {}).v || null, s = v => v == null ? '' : String(v);
      return {base, total: base ? numTxt(base) : '', ent: s(f.ent) || '10%', entq: s(f.entq), mq: s(f.mq), mv: s(f.mv), mi: proxMesISO(),
        an: !!f.an, aq: s(f.aq), av: s(f.av), am: s(f.am) || '12', sl: SALDO[f.sl] ? f.sl : 'fin'};
    }
    function lerFx(){
      const v = id => { const el = $('#' + id); return el ? el.value : ''; }, ck = $('#fx-an');
      Object.assign(pr.fx, {total: v('fx-total'), ent: v('fx-ent'), entq: v('fx-entq'), mq: v('fx-mq'), mv: v('fx-mv'), mi: v('fx-mi'),
        an: !!(ck && ck.checked), aq: v('fx-aq'), av: v('fx-av'), am: v('fx-am') || '12', sl: v('fx-sl') || 'fin'});
    }
    function guardarFx(){ const f = pr.fx; LS.set(K_FX(pr.pid), JSON.stringify({ent: f.ent, entq: f.entq, mq: f.mq, mv: f.mv, an: f.an, aq: f.aq, av: f.av, am: f.am, sl: f.sl})); }
    function calcFluxo(f){
      const total = numBR(f.total) || 0, es = String(f.ent || '').trim();
      let ent = 0;
      if(/%$/.test(es)){ const p = Number(es.replace('%', '').replace(',', '.').trim()); ent = isFinite(p) && p > 0 ? r2(total * p / 100) : 0; }
      else ent = numBR(es) || 0;
      const entq = Math.max(1, parseInt(f.entq, 10) || 1), mq = Math.max(0, parseInt(f.mq, 10) || 0);
      const an = !!f.an, aq = an ? Math.max(0, parseInt(f.aq, 10) || 0) : 0, av = an ? (numBR(f.av) || 0) : 0;
      const sl = SALDO[f.sl] ? f.sl : 'fin', direto = sl === 'construtora';
      let mv = numBR(f.mv) || 0;
      // direto com a construtora: a mensal sai sozinha para o saldo ficar zero (arredondada para baixo no centavo, como antes)
      if(direto && mq > 0) mv = Math.max(0, Math.floor((total - ent - aq * av) / mq * 100) / 100);
      const mi = /^\d{4}-\d{2}$/.test(f.mi || '') ? f.mi : '', am = Math.min(12, Math.max(1, parseInt(f.am, 10) || 12));
      let resto = r2(total - ent - mq * mv - aq * av);
      if(Math.abs(resto) < (direto ? Math.max(1, mq * 0.01) : 1)) resto = 0;
      const linhas = [];
      if(ent > 0) linhas.push({t: 'Entrada', dir: entq > 1 ? entq + 'x de ' + fmtV(r2(ent / entq)) : fmtV(ent), sub: entq > 1 ? 'total de ' + fmtV(ent) : 'no fechamento',
        txt: 'Entrada: ' + (entq > 1 ? entq + 'x de ' + fmtV(r2(ent / entq)) + ' (total de ' + fmtV(ent) + ')' : fmtV(ent))});
      if(mq > 0 && mv > 0){ const qd = mi ? 'a partir de ' + mesAnoCurto(mi) : '';
        linhas.push({t: mq > 1 ? 'Mensais' : 'Mensal', dir: mq + 'x de ' + fmtV(mv), sub: qd, txt: (mq > 1 ? 'Mensais: ' : 'Mensal: ') + mq + 'x de ' + fmtV(mv) + (qd ? ' (' + qd + ')' : '')}); }
      if(aq > 0 && av > 0){ const t = aq > 1 ? 'Intermediárias anuais' : 'Intermediária anual', qd = 'em ' + MESES[am - 1] + ' de cada ano';
        linhas.push({t, dir: aq + 'x de ' + fmtV(av), sub: qd, txt: t + ': ' + aq + 'x de ' + fmtV(av) + ' (' + qd + ')'}); }
      if(!direto){ const x = SALDO[sl], v = fmtV(Math.max(0, resto)); linhas.push({t: x.t, dir: v, sub: x.sub, saldo: true, txt: x.t + ': ' + v + ' (' + x.sub + ')'}); }
      return {total, ent, entq, mq, mv, aq, av, resto, direto, linhas};
    }
    function avaliaFx(c){
      if(!c.total) return {erro: 'Informe o valor do imóvel.'};
      if(c.resto < 0) return {erro: 'As parcelas passam do valor do imóvel em ' + fmtV(-c.resto) + '. Ajuste antes de mandar.'};
      if(c.direto && !c.mq) return {erro: 'Direto com a construtora: diga quantas mensais, que o app calcula o valor de cada uma.'};
      if(c.direto && c.resto > 0) return {erro: 'Ainda sobram ' + fmtV(c.resto) + '. Aumente as mensais ou as anuais.'};
      return {ok: 'Conferido: o fluxo soma ' + fmtV(c.total) + '.'};
    }
    function resumoFx(){
      const box = $('#fx-resumo'); if(!box || !pr) return;
      const c = calcFluxo(pr.fx), av = avaliaFx(c), mv = $('#fx-mv');
      if(mv){ mv.readOnly = c.direto; if(c.direto && c.mq > 0) mv.value = numTxt(c.mv); }
      box.innerHTML = c.linhas.map(l => '<div class="pr-ln"><span>' + esc(l.t) + (l.sub ? '<small>' + esc(l.sub) + '</small>' : '') + '</span><b class="num">' + esc(l.dir) + '</b></div>').join('') +
        '<p class="' + (av.erro ? 'pr-erro' : 'pr-ok') + '">' + esc(av.erro || av.ok) + '</p>';
    }

    // ---------- o que vai na imagem e no texto ----------
    function detalhes(det, a){
      const tl = tipologiaU(det, a), ar = areaU(a), vg = vagaDe(det, a), pl = a[1] ? String(a[1]).trim() : '';
      return maiusc1([tl, ar ? fmtM2(ar) : '', andarTxt(a[4]), vg != null ? vagaRot(vg).toLowerCase() : '', pl ? 'planta ' + pl.replace(/^TIPO\b/i, 'tipo') : ''].filter(Boolean).join(', '));
    }
    function desconto(ps){
      const pv = ps.find(x => x.k === 'pv'), pp = ps.find(x => x.k === 'pp');
      return pv && pp && pp.v > pv.v ? pctTxt(Math.round((1 - pv.v / pp.v) * 1000) / 10) + ' a menos à vista' : '';
    }
    function modelo(){
      const s = pr, p = S.byId.get(s.pid) || {id: s.pid, nome: s.pid}, det = s.det, a = s.a, pf = perfil(), info = det.info || {}, d = det.dados || {}, tab = d.tabela || {};
      const v = id => { const el = $('#' + id); return el ? String(el.value || '').trim() : ''; };
      const end = String(info.endereco || d.endereco || p.endereco || '').trim();
      const m = {nome: p.nome || s.pid, n: s.n, detalhes: detalhes(det, a), status: stLabel(det, 'disponivel'),
        end: end ? end + (p.cidade && p.cidade !== 'São Paulo' ? ', ' + p.cidade : '') : [p.bairro, quemDe(p)].filter(Boolean).join(', '),
        cli: v('pr-cli'), obs: v('pr-obs'), val: v('pr-val'),
        cor: {nome: v('pr-cor') || String(pf.nome || '').trim(), tel: v('pr-tel') || String(pf.tel || '').trim(), creci: String(pf.creci || '').trim()},
        fluxo: null, precos: [], nota: '', tabela: [tab.nome ? nomeTabela(tab.nome) : 'Tabela vigente', 'consultada em ' + dataBR(diaKey(Date.now()))]};
      if(s.modo === 'pers'){
        const pz = persAtual(det, a, persDe(s.pid, s.n));
        if(pz){ m.fluxo = {titulo: 'Condição personalizada', total: totalDe(pz.linhas), linhas: pz.linhas.map(linhaPers)}; m.nota = 'Condição sujeita à aprovação da construtora.'; }
      }else if(s.modo.startsWith('tab:')){
        const f = fluxosTabela(det, a).find(x => x.k === s.modo.slice(4));
        if(f){
          m.fluxo = {titulo: 'Fluxo da tabela, ' + minusc(f.rotulo), total: f.total, linhas: f.linhas.map(linhaTab)};
          const corr = corta(String((info.fluxo && info.fluxo.correcao) || tab.correcao || ''), 160);
          m.nota = corr && !/[.?]$/.test(corr) ? corr + '.' : corr;
        }
      }else if(s.modo === 'fluxo'){
        const c = calcFluxo(s.fx); m.fluxo = {titulo: c.direto ? 'Fluxo de pagamento, direto com a construtora' : 'Fluxo de pagamento', total: c.total, linhas: c.linhas};
      }
      if(!m.fluxo){
        const ps = precosUn(det, a);
        m.precos = s.modo === 'avista' ? ps.filter(x => x.k === 'pv').map(x => Object.assign({}, x, {label: 'À vista'})) : ps.sort((x, y) => (x.k === 'pv' ? 0 : 1) - (y.k === 'pv' ? 0 : 1));
      }
      m.rodape = [m.val ? 'Válida até ' + dataBR(m.val) + '.' : '', 'Valores sujeitos à disponibilidade da unidade no momento da reserva.', m.nota].filter(Boolean).join(' ');
      return m;
    }
    function texto(){   // para o WhatsApp: negrito com *, sem travessão
      const m = modelo(), L = ['*' + m.nome + '*, unidade ' + m.n];
      if(m.detalhes) L.push(m.detalhes);
      L.push('');
      if(m.fluxo){
        L.push('Valor do imóvel: *' + fmtV(m.fluxo.total || 0) + '*', '', '*' + m.fluxo.titulo + '*');
        m.fluxo.linhas.forEach(l => L.push('• ' + l.txt));
      }else if(m.precos.length){
        m.precos.forEach(x => L.push(x.label + ': *' + fmtV(x.v) + '*'));
        const d = desconto(m.precos); if(d) L.push(maiusc1(d) + '.');
      }else L.push('Valores e condições sob consulta.');
      L.push('');
      if(m.obs) L.push(m.obs);
      if(m.cli || m.val) L.push((m.cli ? 'Proposta para ' + m.cli : 'Proposta') + (m.val ? ', válida até ' + dataBR(m.val) : '') + '.');
      L.push('Valores sujeitos à disponibilidade da unidade no momento da reserva.');
      if(m.nota) L.push(m.nota);
      const ass = [[m.cor.nome, m.cor.tel].filter(Boolean).join(', '), m.cor.creci ? 'CRECI ' + m.cor.creci : ''].filter(Boolean);
      if(ass.length) L.push('', ...ass);
      return L.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    // ---------- o cartão (canvas de 1080 px) ----------
    const rr = (g, x, y, w, h, r) => { g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, h, r); else{ g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); } };
    const escreve = (g, t, x, y, fonte, cor) => { g.font = fonte; g.fillStyle = cor; g.fillText(t, x, y); };
    function cabe(g, t, max, px, min, peso, fam){ let s = px; g.font = peso + ' ' + s + 'px ' + fam; while(s > min && g.measureText(t).width > max){ s -= 2; g.font = peso + ' ' + s + 'px ' + fam; } return s; }
    function corta1(g, t, fonte, max){ g.font = fonte; t = String(t || ''); if(g.measureText(t).width <= max) return t; while(t.length > 1 && g.measureText(t + '…').width > max) t = t.slice(0, -1); return t.trimEnd() + '…'; }
    function quebra(g, t, fonte, max, n){
      g.font = fonte; const pal = String(t || '').split(/\s+/).filter(Boolean), L = []; let lin = '';
      for(const w of pal){ const c = lin ? lin + ' ' + w : w; if(lin && g.measureText(c).width > max){ L.push(lin); lin = w; } else lin = c; }
      if(lin) L.push(lin);
      if(L.length > n){ const r = L.slice(0, n - 1); r.push(corta1(g, L.slice(n - 1).join(' '), fonte, max)); return r; }
      return L.map(l => corta1(g, l, fonte, max));
    }
    function linhaCard(g, l, X, XR, top){
      const C = COR, h = 100;
      rr(g, X - 20, top, XR - X + 40, h, 18);
      if(l.saldo){ g.fillStyle = 'rgba(200,162,74,0.12)'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(200,162,74,0.6)'; g.stroke(); }
      else{ g.fillStyle = C.sup2; g.fill(); }
      const sv = cabe(g, l.dir, (XR - X) * .52, 38, 26, '700', F_TXT), wv = g.measureText(l.dir).width;
      g.textAlign = 'right'; escreve(g, l.dir, XR, top + (h - sv) / 2 - 2, '700 ' + sv + 'px ' + F_TXT, l.saldo ? C.ouro : C.texto); g.textAlign = 'left';
      const max = XR - X - wv - 28, stt = cabe(g, l.t, max, 34, 24, '600', F_TXT), ft = '600 ' + stt + 'px ' + F_TXT;
      if(l.sub){ escreve(g, corta1(g, l.t, ft, max), X, top + 15, ft, C.texto); escreve(g, corta1(g, l.sub, '400 26px ' + F_TXT, max), X, top + 58, '400 26px ' + F_TXT, C.apoio); }
      else escreve(g, corta1(g, l.t, ft, max), X, top + (h - stt) / 2 - 2, ft, C.texto);
    }
    // duas passagens: a primeira mede (L = null) e devolve a altura; a segunda desenha com a altura certa
    function card(g, m, L){
      const D = !!L, W = 1080, P = 72, X0 = P, X1 = W - P, X = X0 + 48, XR = X1 - 48, C = COR, R = {};
      g.textBaseline = 'top'; g.textAlign = 'left';
      if(D){ g.fillStyle = C.fundo; g.fillRect(0, 0, W, L.H); }
      let y = 64;
      const lh = 128;
      if(D && logoImg){ const lw = lh * (logoImg.naturalWidth || logoImg.width) / (logoImg.naturalHeight || logoImg.height); g.drawImage(logoImg, X0, y, lw, lh); }
      if(D){ g.textAlign = 'right'; escreve(g, 'Proposta', X1, y + 18, '600 34px ' + F_TXT, C.texto); escreve(g, dataLonga(), X1, y + 64, '400 26px ' + F_TXT, C.apoio); g.textAlign = 'left'; }
      y += lh + 48;
      let tn = null;   // nome do projeto: uma linha na largura, ou duas
      for(let s = 84; s >= 62 && !tn; s -= 2){ g.font = '700 ' + s + 'px ' + F_LARGA; if(g.measureText(m.nome).width <= X1 - X0) tn = {s, L: [m.nome]}; }
      if(!tn) tn = {s: 62, L: quebra(g, m.nome, '700 62px ' + F_LARGA, X1 - X0, 2)};
      const lhn = Math.round(tn.s * 1.1);
      if(D) tn.L.forEach((t, i) => escreve(g, t, X0, y + i * lhn, '700 ' + tn.s + 'px ' + F_LARGA, C.texto));
      y += tn.L.length * lhn + 10;
      if(m.end){ if(D) escreve(g, corta1(g, m.end, '400 30px ' + F_TXT, X1 - X0), X0, y, '400 30px ' + F_TXT, C.apoio2); y += 42; }
      y += 30;
      const pTop = y;   // painel da unidade
      if(D){ rr(g, X0, pTop, X1 - X0, L.pBot - pTop, 32); g.fillStyle = C.sup; g.fill(); g.lineWidth = 2; g.strokeStyle = C.linha; g.stroke(); }
      let py = pTop + 44;
      if(D){
        escreve(g, 'Unidade', X, py, '600 28px ' + F_TXT, C.apoio);
        g.font = '700 26px ' + F_TXT; const sw = g.measureText(m.status).width + 44, sh = 52;
        rr(g, XR - sw, py - 10, sw, sh, sh / 2); g.fillStyle = C.livre; g.fill();
        escreve(g, m.status, XR - sw + 22, py + 4, '700 26px ' + F_TXT, C.livreT);
      }
      py += 46;
      const sn = cabe(g, m.n, XR - X, 148, 80, '700', F_LARGA);
      if(D) escreve(g, m.n, X - 4, py, '700 ' + sn + 'px ' + F_LARGA, C.texto);
      py += Math.round(sn * 1.06);
      if(m.detalhes){ const dl = quebra(g, m.detalhes, '400 34px ' + F_TXT, XR - X, 2); if(D) dl.forEach((t, i) => escreve(g, t, X, py + 6 + i * 46, '400 34px ' + F_TXT, C.apoio2)); py += 6 + dl.length * 46; }
      py += 28;
      if(D){ g.fillStyle = C.linha; g.fillRect(X, py, XR - X, 2); }
      py += 40;
      if(m.fluxo){
        if(D) escreve(g, 'Valor do imóvel', X, py, '600 28px ' + F_TXT, C.apoio);
        py += 42;
        const tv = fmtV(m.fluxo.total || 0), st = cabe(g, tv, XR - X, 104, 60, '700', F_LARGA);
        if(D) escreve(g, tv, X - 3, py, '700 ' + st + 'px ' + F_LARGA, C.ouro);
        py += Math.round(st * 1.08) + 28;
        if(D) escreve(g, corta1(g, m.fluxo.titulo, '600 30px ' + F_TXT, XR - X), X, py, '600 30px ' + F_TXT, C.texto);
        py += 54;
        for(const l of m.fluxo.linhas){ if(D) linhaCard(g, l, X, XR, py); py += 110; }
        py += 12;
      }else if(m.precos.length === 1){
        const x = m.precos[0], v = fmtV(x.v);
        if(D) escreve(g, corta1(g, x.label, '600 28px ' + F_TXT, XR - X), X, py, '600 28px ' + F_TXT, C.apoio);
        py += 42;
        const s1 = cabe(g, v, XR - X, 150, 72, '700', F_LARGA);
        if(D) escreve(g, v, X - 4, py, '700 ' + s1 + 'px ' + F_LARGA, C.ouro);
        py += Math.round(s1 * 1.08) + 24;
      }else if(m.precos.length === 2){
        const col = (XR - X) / 2, s2 = Math.min(...m.precos.map(x => cabe(g, fmtV(x.v), col - 28, 96, 48, '700', F_LARGA)));
        if(D) m.precos.forEach((x, i) => { const x0 = X + i * col;
          escreve(g, corta1(g, x.label, '600 28px ' + F_TXT, col - 28), x0, py, '600 28px ' + F_TXT, C.apoio);
          escreve(g, fmtV(x.v), x0 - 3, py + 42, '700 ' + s2 + 'px ' + F_LARGA, i === 0 ? C.ouro : C.texto); });
        py += 42 + Math.round(s2 * 1.08) + 18;
        const dc = desconto(m.precos);
        if(dc){ if(D) escreve(g, dc, X, py, '600 28px ' + F_TXT, C.verde); py += 46; }
      }else if(m.precos.length > 2){
        for(const x of m.precos){ if(D) linhaCard(g, {t: x.label, dir: fmtV(x.v), sub: '', saldo: false}, X, XR, py); py += 110; }
        py += 12;
      }else{
        if(D) escreve(g, 'Valores e condições sob consulta', X, py, '600 42px ' + F_TXT, C.texto);
        py += 66;
      }
      if(m.cli){ if(D) escreve(g, corta1(g, 'Proposta para ' + m.cli, '600 36px ' + F_TXT, XR - X), X, py + 4, '600 36px ' + F_TXT, C.texto); py += 56; }
      if(m.obs){ const ol = quebra(g, m.obs, '400 30px ' + F_TXT, XR - X, 2); if(D) ol.forEach((t, i) => escreve(g, t, X, py + i * 40, '400 30px ' + F_TXT, C.apoio2)); py += ol.length * 40 + 10; }
      py += 14;
      const nl = quebra(g, m.rodape, '400 24px ' + F_TXT, XR - X, 3);
      if(D) nl.forEach((t, i) => escreve(g, t, X, py + i * 32, '400 24px ' + F_TXT, C.apoio));
      py += nl.length * 32 + 40;
      R.pBot = py;
      // corretor no pé da imagem; a tabela de referência à direita
      const temTel = !!m.cor.tel, temCreci = !!m.cor.creci, fh = 48 + (temTel ? 48 : 0) + (temCreci ? 40 : 0);
      R.H = py + 64 + fh + 60;
      if(D){
        const fy = Math.max(py + 64, L.H - 60 - fh);
        g.fillStyle = C.linha; g.fillRect(X0, fy - 32, X1 - X0, 2);
        let yy = fy;
        escreve(g, corta1(g, m.cor.nome || 'Corretor Fortal', '700 38px ' + F_TXT, 580), X0, yy, '700 38px ' + F_TXT, C.texto); yy += 50;
        if(temTel){ escreve(g, corta1(g, m.cor.tel, '600 32px ' + F_TXT, 580), X0, yy, '600 32px ' + F_TXT, C.apoio2); yy += 46; }
        if(temCreci) escreve(g, corta1(g, 'CRECI ' + m.cor.creci, '400 26px ' + F_TXT, 580), X0, yy, '400 26px ' + F_TXT, C.apoio);
        g.textAlign = 'right';
        m.tabela.forEach((t, i) => escreve(g, corta1(g, t, '400 24px ' + F_TXT, 330), X1, fy + 8 + i * 32, '400 24px ' + F_TXT, C.apoio));
        g.textAlign = 'left';
      }
      return R;
    }
    async function desenhar(){
      const s = pr; if(!s) return;
      const vez = s.vez = s.vez + 1;
      s.blob = null;
      await carregarFontesPost();
      try{ if(!logoImg) logoImg = await carregarImg('img/logo-fortal.png', false); }catch(e){}
      const cv = $('#pr-cv');
      if(pr !== s || vez !== s.vez || !cv) return;
      const g = cv.getContext('2d'), m = modelo(), L = card(g, m, null);
      L.H = Math.max(1350, Math.ceil(L.H));
      if(cv.width !== 1080) cv.width = 1080;
      if(cv.height !== L.H) cv.height = L.H;
      card(g, m, L);
      try{ const b = await new Promise(res => cv.toBlob(res, 'image/png')); if(pr === s && vez === s.vez) s.blob = b; }catch(e){}
    }
    const redesenhar = () => depois('pr-desenho', 140, desenhar);

    // ---------- conferência da unidade no servidor ----------
    function estado(txt, erro){
      const el = $('#pr-st'); if(!el) return;
      el.classList.toggle('pr-st-erro', !!erro);
      el.innerHTML = esc(txt) + (erro ? ' <button type="button" class="link-mais" data-acao="pr-conferir">Tentar de novo</button>' : '');
    }
    function bloquear(rot){
      const s = pr; if(!s) return;
      s.bloqueio = 'A unidade ' + s.n + (rot ? ' mudou para ' + rot.toLowerCase() + ' no espelho.' : ' saiu do espelho.') + ' A proposta ficou travada: confira com a construtora antes de oferecer.';
      const al = $('#pr-alerta'); if(al) al.innerHTML = '<div class="aviso erro" role="alert"><p>' + esc(s.bloqueio) + '</p></div>';
      const pv = $('#folha-pr .pr-prev'); if(pv) pv.classList.add('pr-travada');   // a prévia ainda diz "Disponível": fica apagada
      estado('');
      $$('#folha-pr .folha-pe .btn').forEach(b => { if(b.tagName === 'BUTTON') b.disabled = true; else{ b.setAttribute('aria-disabled', 'true'); b.removeAttribute('href'); } });
    }
    function atualizarModos(){   // valores novos da unidade: refaz as opções e o valor do "Montar fluxo" (se o corretor não mexeu)
      const s = pr; s.ops = modos(s.det, s.a, s.pid, s.n);
      if(!s.ops.some(o => o[0] === s.modo)) s.modo = s.ops[0][0];
      const box = $('#pr-modos'); if(box) box.innerHTML = modosHtml();
      const fxb = $('#pr-fx'); if(fxb) fxb.hidden = s.modo !== 'fluxo';
      const nt = $('#pr-modo-nota'); if(nt) nt.textContent = notaModo();
      const base = precoU(s.a, 'pp') || (precosUn(s.det, s.a)[0] || {}).v || null, inp = $('#fx-total');
      if(base && inp && s.fx.base && numBR(inp.value) === s.fx.base){ inp.value = numTxt(base); s.fx.total = inp.value; }
      s.fx.base = base;
      resumoFx();
    }
    function conferir(silencioso){
      const s = pr; if(!s) return Promise.resolve(null);
      if(s.conferindo) return s.conferindo;
      s.conferindo = (async () => {
        if(!silencioso || !s.conf) estado('Conferindo se a unidade continua livre…');
        const t0 = Date.now();
        let det = null;
        try{ det = await detalhe(s.pid, true); }
        catch(e){ if(codigoInvalido(e)){ fecharFolhas(); sair('Esse código não vale mais. Digite o código novo do time.'); return null; } }
        if(pr !== s) return null;
        const ch = S.det.get(s.pid);
        if(!det || !ch || !(ch.em >= t0)){   // sem resposta nova (o detalhe devolve o que já tinha quando a rede falha)
          s.conf = {em: Date.now(), ok: null};
          estado('Não consegui conferir agora se a unidade continua livre. Confira a internet.', true);
          return null;
        }
        const a = acharU(det, s.n);
        s.det = det;
        if(!a || a[6] !== 'disponivel'){ s.conf = {em: Date.now(), ok: false}; bloquear(a ? stLabel(det, a[6]) : ''); return false; }
        const mudou = JSON.stringify(exDe(a)) !== JSON.stringify(exDe(s.a));
        s.a = a; s.conf = {em: Date.now(), ok: true};
        estado('Conferida às ' + hora(Date.now()) + ': a unidade continua livre.');
        if(mudou){ atualizarModos(); desenhar(); toast('Os valores da unidade mudaram na tabela. A proposta já está com os novos.', 4500); }
        return true;
      })().finally(() => { s.conferindo = null; });
      return s.conferindo;
    }
    // mandar, copiar e baixar: só com a unidade conferida há menos de 1 minuto (o arquivo já pronto, para o toque abrir o envio)
    function liberado(ev, arquivo){
      const s = pr; if(!s) return false;
      const parar = msg => { if(ev && ev.preventDefault) ev.preventDefault(); if(msg) toast(msg, 5000); return false; };
      if(s.bloqueio) return parar(s.bloqueio);
      if(s.modo === 'fluxo'){ const er = avaliaFx(calcFluxo(s.fx)).erro; if(er) return parar(er); }
      if(!(s.conf && s.conf.ok === true && Date.now() - s.conf.em < FRESCO)){
        parar('Conferindo a unidade antes de mandar…');
        conferir().then(ok => {
          if(pr !== s) return;
          if(ok === true) toast('A unidade continua livre. Toque de novo para mandar.', 4500);
          else if(ok === false) toast(s.bloqueio, 5000);
          else toast('Não consegui conferir a unidade agora. Confira a internet e tente de novo.', 5000);
        });
        return false;
      }
      if(arquivo && !s.blob){ desenhar(); return parar('A imagem ainda está sendo montada. Tente de novo em um instante.'); }
      return true;
    }
    function mandar(el, ev){
      if(!liberado(ev, true)) return;
      const s = pr, txt = texto(), arq = new File([s.blob], nomeArq(), {type: 'image/png'});
      if(el.tagName === 'BUTTON' && podeCompartilharArquivos()){   // celular: a imagem e o texto pelo compartilhar do aparelho
        try{ if(navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {}); }catch(e){}
        navigator.share({files: [arq], text: txt}).then(() => toast('O texto também foi copiado. Se não aparecer na conversa, é só colar.', 4500))
          .catch(e => { if(!(e && e.name === 'AbortError')) toast('Não deu para abrir o compartilhamento. Use o Baixar e mande pelo WhatsApp.', 5000); });
        return;
      }
      salvarBlob(arq, arq.name);   // computador: baixa a imagem e o link abre o WhatsApp com o texto
      el.href = 'https://wa.me/?text=' + encodeURIComponent(txt);
      toast('Imagem baixada. Anexe no WhatsApp, junto com o texto.', 5000);
    }

    // ---------- folha ----------
    function modosHtml(){ return pr.ops.map(o => '<button type="button" class="pilula peq" data-acao="pr-modo" data-v="' + esc(o[0]) + '" aria-pressed="' + (pr.modo === o[0]) + '">' + esc(o[1]) + '</button>').join(''); }
    function notaModo(){
      const m = pr.modo;
      return m === 'pers' ? 'O fluxo que você montou na ficha da unidade, guardado neste aparelho.' : m.startsWith('tab:') ? 'As parcelas que a tabela da construtora dá para esta unidade.'
        : m === 'fluxo' ? 'Você monta a entrada, as mensais e as anuais e escolhe como o saldo é pago.' : m === 'avista' ? 'Só o valor à vista da tabela.' : 'Os valores da tabela, sem as parcelas.';
    }
    function fxHtml(){
      const f = pr.fx, op = (v, t, sel) => '<option value="' + v + '"' + (sel ? ' selected' : '') + '>' + esc(t) + '</option>';
      const campo = (cls, rot, id, val, extra) => '<label class="campo' + (cls ? ' ' + cls : '') + '">' + rot + '<input id="' + id + '" autocomplete="off" value="' + esc(val) + '" data-input="pr-fx"' + (extra || '') + '></label>';
      return campo('', 'Valor do imóvel', 'fx-total', f.total, ' inputmode="decimal" placeholder="R$"') +
        '<div class="pr-linha">' + campo('', 'Entrada (R$ ou %)', 'fx-ent', f.ent, ' placeholder="Ex.: 13.600 ou 10%"') + campo('pr-curto', 'Em quantas vezes', 'fx-entq', f.entq, ' inputmode="numeric" placeholder="1"') + '</div>' +
        '<div class="pr-linha">' + campo('pr-curto', 'Mensais', 'fx-mq', f.mq, ' inputmode="numeric" placeholder="Qtd."') + campo('', 'Valor da mensal', 'fx-mv', f.mv, ' inputmode="decimal" placeholder="R$"') +
        campo('pr-mes', 'Primeira mensal', 'fx-mi', f.mi, ' type="month"') + '</div>' +
        '<label class="pr-ck"><input type="checkbox" id="fx-an" data-input="pr-fx"' + (f.an ? ' checked' : '') + '><span>Tem anuais (balões)</span></label>' +
        '<div class="pr-linha" id="fx-an-c"' + (f.an ? '' : ' hidden') + '>' + campo('pr-curto', 'Anuais', 'fx-aq', f.aq, ' inputmode="numeric" placeholder="Qtd."') + campo('', 'Valor da anual', 'fx-av', f.av, ' inputmode="decimal" placeholder="R$"') +
        '<label class="campo pr-mes">Mês<select id="fx-am" data-input="pr-fx">' + MESES.map((m, i) => op(i + 1, maiusc1(m), String(i + 1) === String(f.am))).join('') + '</select></label></div>' +
        '<label class="campo">Como o saldo é pago<select id="fx-sl" data-input="pr-fx">' + Object.keys(SALDO).map(k => op(k, SALDO[k].rot, f.sl === k)).join('') + '</select>' +
        '<small id="fx-sl-nota"' + (f.sl === 'construtora' ? '' : ' hidden') + '>O app calcula a mensal para o saldo ficar zero.</small></label>' +
        '<div class="pr-resumo" id="fx-resumo" aria-live="polite"></div>';
    }
    function corpoHtml(){
      const s = pr, pf = perfil();
      return '<button type="button" class="link-mais pr-voltar" data-acao="pr-voltar">' + ICO.voltar + 'Voltar à unidade</button>' +
        '<div class="pr-grade"><div class="pr-prev-col">' +
          '<button type="button" class="pr-prev" data-acao="pr-zoom" aria-pressed="false" aria-label="Ver a imagem maior"><canvas id="pr-cv" width="1080" height="1350" role="img" aria-label="' + esc('Prévia da proposta da unidade ' + s.n) + '"></canvas></button>' +
          '<p class="sub pr-st" id="pr-st" role="status" aria-live="polite">Conferindo se a unidade continua livre…</p></div>' +
        '<div class="pr-form"><div id="pr-alerta"></div>' +
          '<fieldset><legend>O que vai na proposta</legend><div class="pilulas" id="pr-modos" role="group" aria-label="O que vai na proposta">' + modosHtml() + '</div>' +
          '<p class="nota" id="pr-modo-nota">' + esc(notaModo()) + '</p></fieldset>' +
          '<div class="pr-fx" id="pr-fx"' + (s.modo === 'fluxo' ? '' : ' hidden') + '>' + fxHtml() + '</div>' +
          '<div class="campos-2"><label class="campo">Cliente<input id="pr-cli" maxlength="50" autocomplete="off" placeholder="Ex.: Maria" data-input="pr-campo"></label>' +
          '<label class="campo">Válida até<input id="pr-val" type="date" value="' + esc(s.val) + '" data-input="pr-campo"></label></div>' +
          '<label class="campo">Observação<input id="pr-obs" maxlength="90" autocomplete="off" placeholder="Ex.: parcelas corrigidas pelo INCC" data-input="pr-campo"><small>Opcional. Sai na imagem e no texto.</small></label>' +
          '<fieldset><legend>Sua assinatura</legend><div class="campos-2"><label class="campo">Seu nome<input id="pr-cor" maxlength="40" autocomplete="name" value="' + esc(pf.nome || '') + '" data-input="pr-campo"></label>' +
          '<label class="campo">Seu WhatsApp<input id="pr-tel" maxlength="20" inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000" value="' + esc(pf.tel || '') + '" data-input="pr-campo"></label></div>' +
          '<p class="nota">' + (pf.creci ? 'O CRECI sai do seu Perfil.' : 'Sem CRECI no Perfil, o rodapé sai só com nome e WhatsApp.') + '</p></fieldset>' +
        '</div></div>';
    }
    function peHtml(){
      return '<button type="button" class="btn" data-acao="pr-copiar">' + ICO.copiar + 'Copiar</button><button type="button" class="btn" data-acao="pr-baixar">' + ICO.baixar + 'Baixar</button>' +
        (podeCompartilharArquivos() ? '<button type="button" class="btn btn-pri" data-acao="pr-mandar">' + ICO.zap + 'Mandar</button>'
          : '<a class="btn btn-pri" data-acao="pr-mandar" href="https://wa.me/" target="_blank" rel="noopener">' + ICO.zap + 'Mandar</a>');
    }
    async function abrir(pid, n){
      n = String(n);
      const p = S.byId.get(pid); if(!p) return;
      if(!feAntesDeMandar(pid, n)){ toast('Confira o fluxo personalizado antes de montar a proposta.'); return; }
      const ch = S.det.get(pid); let det = ch && ch.v;
      if(!det){
        try{ det = await detalhe(pid); }
        catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais. Digite o código novo do time.'); toast('Não consegui abrir a unidade agora. Confira a internet.'); return; }
      }
      const a = acharU(det, n);
      if(!a || a[6] !== 'disponivel'){ toast('A unidade ' + n + ' não está mais livre no espelho.'); return; }
      const ops = modos(det, a, pid, n);
      const s = pr = {pid, n, det, a, ops, modo: ops[0][0], fx: fxSalvo(pid, det, a), val: diaKey(Date.now() + 3 * 864e5), conf: null, bloqueio: '', blob: null, vez: 0, timer: null, conferindo: null};
      abrirFolha('pr', 'Proposta da unidade ' + n, corpoHtml(), peHtml(), 'folha-pr');
      const dlg = $('#folha-pr'); if(!dlg){ pr = null; return; }
      dlg.addEventListener('close', () => { clearInterval(s.timer); if(pr === s) pr = null; });
      s.timer = setInterval(() => { if(pr !== s || !dlg.isConnected){ clearInterval(s.timer); if(pr === s) pr = null; return; } if(visivel()) conferir(true); }, REVER);
      resumoFx();
      desenhar();
      conferir();
    }

    // ---------- registros ----------
    UNIDADE_X.push((p, a) => a && a[6] === 'disponivel' ? '<button type="button" class="btn pr-un" data-acao="pr-abrir" data-id="' + esc(p.id) + '" data-n="' + esc(String(a[0])) + '">' + I_PROP + 'Proposta</button>' : '');
    ACOES_X['pr-abrir'] = el => abrir(el.dataset.id, el.dataset.n);
    ACOES_X['pr-modo'] = el => {
      const s = pr; if(!s || !s.ops.some(o => o[0] === el.dataset.v)) return;
      s.modo = el.dataset.v;
      $$('[data-acao="pr-modo"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === s.modo ? 'true' : 'false'));
      const fxb = $('#pr-fx'); if(fxb) fxb.hidden = s.modo !== 'fluxo';
      const nt = $('#pr-modo-nota'); if(nt) nt.textContent = notaModo();
      if(s.modo === 'fluxo') resumoFx();
      desenhar();
    };
    ACOES_X['pr-zoom'] = el => { if(largo()) return; el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); };
    ACOES_X['pr-voltar'] = () => { const s = pr; if(!s) return; fecharFolhas(); abrirUnidadeEsp(s.pid, s.n); };
    ACOES_X['pr-conferir'] = () => { conferir(); };
    ACOES_X['pr-copiar'] = (el, ev) => { if(liberado(ev, false)) copiar(texto(), 'Texto copiado. É só colar no WhatsApp.'); };
    ACOES_X['pr-baixar'] = (el, ev) => { if(liberado(ev, true)){ salvarBlob(pr.blob, nomeArq()); toast('Imagem salva.'); } };
    ACOES_X['pr-mandar'] = (el, ev) => mandar(el, ev);
    INPUTS_X['pr-fx'] = el => {
      if(!pr) return;
      lerFx();
      if(el.id === 'fx-an'){ const c = $('#fx-an-c'); if(c) c.hidden = !el.checked; }
      if(el.id === 'fx-sl'){ const nt = $('#fx-sl-nota'); if(nt) nt.hidden = el.value !== 'construtora'; }
      guardarFx(); resumoFx(); redesenhar();
    };
    INPUTS_X['pr-campo'] = (el, ev, tipo) => {
      if(!pr) return;
      if((el.id === 'pr-cor' || el.id === 'pr-tel') && tipo === 'input') depois('pr-perfil', 500, () => {
        const c = $('#pr-cor'), t = $('#pr-tel'); if(c && t){ salvarPerfil({nome: c.value.trim(), tel: t.value.trim()}); atualizarLateral(); }
      });
      redesenhar();
    };
    document.addEventListener('visibilitychange', () => { if(pr && visivel() && (!pr.conf || Date.now() - pr.conf.em > REVER)) conferir(true); });
  })();

  // ---------------- x_perfil.js ----------------
  // ================= PERFIL: instalar o app, leitura dos robôs e importar espelhos (administrador) =================
  const PF = {prompt: null, imp: null, msg: '', tipo: '', adminEm: 0};
  const PF_FONTES = {bll: 'BLL', cv: 'CV CRM', cvcambur: 'CV da Cambur', cvmaskan: 'CV da Maskan', cvvitacon: 'CV da Vitacon', dommus: 'Dommus', lior: 'Lior da Lavvi', one: 'Portal da ONE'};
  const pfStandalone = () => { try{ return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }catch(e){ return false; } };
  const pfIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); PF.prompt = e; const b = $('#pf-inst'); if(b) b.innerHTML = pfInstalarHtml(); });
  window.addEventListener('appinstalled', () => { PF.prompt = null; toast('App instalado. Abra pelo ícone novo na tela inicial.'); const b = $('#pf-inst'); if(b) b.innerHTML = pfInstalarHtml(); });

  function pfInstalarHtml(){
    const h = '<h2 class="t-3">App na tela inicial</h2>';
    if(pfStandalone()) return h + '<p class="texto-2">Você já está usando o app instalado.</p>';
    if(pfIOS()) return h + '<p class="texto-2">No iPhone, abra este endereço no Safari e:</p><ol class="pf-passos"><li>Toque em <b>Compartilhar</b>, o quadrado com a seta para cima.</li><li>Escolha <b>Adicionar à Tela de Início</b> e depois <b>Adicionar</b>.</li><li>Abra pelo ícone novo e ligue os avisos na aba Avisos.</li></ol>';
    if(PF.prompt) return h + '<p class="texto-2">Instalado, o app abre direto da tela inicial e recebe os avisos de venda.</p><div class="btn-linha"><button type="button" class="btn btn-pri" data-acao="pf-instalar">Instalar o app</button></div>';
    return h + '<p class="texto-2">' + (largo() ? 'No Chrome do computador, clique no ícone de instalar, no fim da barra de endereço.' : 'No Chrome, toque no menu de três pontinhos e escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.') + '</p>';
  }
  PERFIL_X.push(() => '<section class="caixa" id="pf-inst">' + pfInstalarHtml() + '</section>');

  // última leitura de cada robô (o resumo do app já traz a hora de cada fonte)
  PERFIL_X.push(() => {
    const robo = (S.resumo && S.resumo.robo) || {};
    const ks = Object.keys(robo).filter(k => Date.parse(robo[k])).sort((a, b) => String(PF_FONTES[a] || a).localeCompare(String(PF_FONTES[b] || b), 'pt-BR'));
    if(!ks.length) return '';
    return '<section class="caixa"><h2 class="t-3">Leitura dos espelhos</h2><p class="texto-2">Os robôs leem o sistema de cada construtora o dia todo. Esta é a última leitura de cada um.</p><ul class="pf-robos">' +
      ks.map(k => { const t = Date.parse(robo[k]), min = (Date.now() - t) / 60000, vivo = min <= 5;
        return '<li><span>' + esc(PF_FONTES[k] || k) + '</span><span class="' + (vivo ? 'pf-vivo' : 'pf-atraso') + '">' + (vivo ? '<i aria-hidden="true"></i>' : '') + esc(vivo ? 'Ao vivo, ' + hora(t) : 'Última leitura ' + (/^\d/.test(quandoTxt(t)) ? 'às ' : '') + quandoTxt(t)) + '</span></li>'; }).join('') + '</ul></section>';
  });

  // ---- importar espelhos (só o código de administrador; mesma função do app anterior)
  function pfImpHtml(){
    return '<h2 class="t-3">Importar espelhos</h2><p class="texto-2">Para o arquivo .json de espelhos no formato do app. O projeto que já existe é substituído.</p>' +
      (PF.imp ? '<p class="texto-2">' + PF.imp.resumo + '</p><div class="btn-linha"><button type="button" class="btn btn-pri" data-acao="pf-imp-ok">Importar</button><button type="button" class="btn" data-acao="pf-imp-cancelar">Cancelar</button></div>'
        : '<div class="btn-linha"><label class="btn pf-arq">' + ICO.arquivo + 'Escolher arquivo<input type="file" class="sr" accept=".json,application/json" data-input="pf-imp-arq"></label></div>') +
      (PF.msg ? '<div class="aviso' + (PF.tipo === 'erro' ? ' erro' : PF.tipo === 'ok' ? ' ok' : '') + '" role="status">' + (PF.tipo === 'ok' ? ICO.ok : PF.tipo === 'erro' ? ICO.nuvem : ICO.relogio) + '<p>' + esc(PF.msg) + '</p></div>' : '');
  }
  const pfImpPintar = () => { const b = $('#pf-imp'); if(b) b.innerHTML = pfImpHtml(); };
  const pfImpMsg = (msg, tipo) => { PF.msg = msg || ''; PF.tipo = tipo || ''; pfImpPintar(); };
  PERFIL_X.push(() => S.admin ? '<section class="caixa" id="pf-imp">' + pfImpHtml() + '</section>' : '');
  INPUTS_X['pf-imp-arq'] = async (el, ev, tipo) => {
    if(tipo !== 'change') return;
    const f = el.files && el.files[0]; el.value = ''; PF.imp = null;
    if(!f) return pfImpMsg('');
    if(f.size > 12e6) return pfImpMsg('Arquivo grande demais para importar. O máximo é 12 MB.', 'erro');
    let j = null; try{ j = JSON.parse(await f.text()); }catch(e){ return pfImpMsg('Esse arquivo não abriu como JSON, então não é um espelho do app.', 'erro'); }
    const itens = Array.isArray(j) ? j : (j && Array.isArray(j.projetos) ? j.projetos : null);
    const ok = itens && itens.length > 0 && itens.every(x => x && /^[a-z0-9-]{3,60}$/.test(x.id || '') && x.dados && x.dados.id === x.id &&
      Array.isArray(x.dados.unidades) && /^[a-z0-9-]{2,40}$/.test(x.dados.grupo || '') && x.dados.nome);
    if(!ok) return pfImpMsg('Esse arquivo não tem espelhos no formato do app.', 'erro');
    const grupos = [...new Set(itens.map(x => x.dados.grupo_nome || nomeGrupo(x.dados.grupo) || x.dados.grupo))];
    const disp = itens.reduce((t, x) => t + x.dados.unidades.filter(u => u[6] === 'disponivel').length, 0);
    const ja = itens.filter(x => S.byId.has(x.id)).length;
    PF.imp = {itens, resumo: '<b>' + esc(plural(itens.length, 'projeto', 'projetos')) + '</b> da ' + esc(grupos.join(', ')) + ', com ' + esc(disp.toLocaleString('pt-BR') + (disp === 1 ? ' unidade disponível. ' : ' unidades disponíveis. ')) +
      esc(ja ? ja + (ja === 1 ? ' já está no app e vai ser substituído.' : ' já estão no app e vão ser substituídos.') : 'Todos entram como novos.')};
    pfImpMsg('');
  };
  ACOES_X['pf-imp-cancelar'] = () => { PF.imp = null; pfImpMsg(''); };
  ACOES_X['pf-imp-ok'] = async el => {
    if(!PF.imp || !S.admin) return;
    const itens = PF.imp.itens; el.disabled = true;
    // lotes de até uns 300 KB, para não estourar o limite de uma chamada
    const lotes = []; let atual = [], tam = 0;
    for(const x of itens){ const t = JSON.stringify(x).length; if(atual.length && (tam + t > 300000 || atual.length >= 25)){ lotes.push(atual); atual = []; tam = 0; } atual.push(x); tam += t; }
    if(atual.length) lotes.push(atual);
    let feitos = 0;
    try{
      for(const l of lotes){
        pfImpMsg('Importando, ' + feitos + ' de ' + plural(itens.length, 'projeto', 'projetos') + '.');
        const r = await rpc('importar_espelhos', {p_codigo: S.cod, p_itens: l}, 60000);
        feitos += (r && r.projetos) || 0;
      }
      PF.imp = null; pfImpMsg('Pronto: ' + plural(feitos, 'projeto importado', 'projetos importados') + '. Atualizando o app.', 'ok');
      await carregar('importar');
      pfImpMsg('Pronto: ' + plural(feitos, 'projeto importado', 'projetos importados') + ', já aparecendo no app.', 'ok');
    }catch(e){
      const t = String((e && (e.body || e.message)) || '');
      PF.imp = null;
      pfImpMsg(codigoInvalido(e) ? 'Só o código de administrador pode importar.' : /outro_grupo/.test(t) ? 'Um dos projetos do arquivo é de outra construtora no app, e nada desse lote foi gravado.'
        : 'Parou depois de ' + feitos + ' de ' + plural(itens.length, 'projeto', 'projetos') + '. Tente de novo: o que já entrou fica salvo.', 'erro');
    }
  };
  ACOES_X['pf-instalar'] = async () => {
    if(!PF.prompt) return;
    const p = PF.prompt; PF.prompt = null;
    try{ p.prompt(); await p.userChoice; }catch(e){}
    const b = $('#pf-inst'); if(b) b.innerHTML = pfInstalarHtml();
  };

  // ---- a tela de Perfil do corretor, com as seções a mais e o link para a versão anterior
  const _telaPerfil = telaPerfil;
  telaPerfil = function(){
    let h = _telaPerfil();
    h = h.replace('O app usa o mesmo código do app dos Espelhos. Se o código mudar, entre de novo.', 'Se o código do time mudar, entre de novo com o código novo.');
    h = h.replace('<a class="btn" href="' + esc(ESP) + '" target="_blank" rel="noopener">App dos Espelhos</a>', '<a class="btn" href="' + ESPELHO_ANTIGO + '">Versão anterior</a>');
    const extra = PERFIL_X.map(f => { try{ return f() || ''; }catch(e){ console.error(e); return ''; } }).join('');
    const i = h.lastIndexOf('<p class="nota">Versão ');
    return i >= 0 ? h.slice(0, i) + extra + h.slice(i) : h + extra;
  };

  // ---- administrador: confere depois de ler os espelhos; troca de código zera
  const _aplicarResumo = aplicarResumo;
  aplicarResumo = function(r){
    _aplicarResumo(r);
    if(S.cod && !adminP && Date.now() - PF.adminEm > 10 * 60e3){ PF.adminEm = Date.now(); ehAdmin().then(a => { if(a && location.hash === '#/perfil' && !$('#pf-imp')) render(); }); }
  };
  const _sair = sair;
  sair = function(msg){ adminP = null; S.admin = false; PF.adminEm = 0; PF.imp = null; PF.msg = ''; _sair(msg); };

  // o cache antigo do espelho inteiro (uns 5 MB) não é mais usado aqui e só ocupa o espaço do navegador
  LS.del('espelhos-cache');

  // ---------------- x_bolso.js ----------------
  // Busca pelo bolso: o corretor diz quanto o cliente tem de entrada, quanto paga por mês e (se quiser) quanto financia,
  // e o filtro de Imóveis mostra só as unidades em que o fluxo da tabela cabe. O resumo do fluxo de cada unidade vem
  // do servidor em corretor_bolso, chamada só quando o filtro é ligado (u.bo = {e, m, nm, r, fi}):
  //   e  = entrada: ato, sinal e as parcelas curtas do começo (60/90 dias, 30/60/90)
  //   m  = valor de uma mensal (somando as séries de mensais que correm juntas)
  //   nm = número de mensais
  //   r  = reforços: anuais, semestrais, parcela única e intermediárias
  //   fi = saldo no financiamento
  // Unidade sem fluxo na tabela fica de fora enquanto o filtro estiver ligado.
  CAMPO_F['f-be'] = 'be'; CAMPO_F['f-bm'] = 'bm'; CAMPO_F['f-bf'] = 'bf';
  const _lerValorBase = lerValor;
  lerValor = function(s, campo){
    let n = _lerValorBase(s, campo);
    const cru = String(s || '').toLowerCase();
    if(n > 0 && !/mil|mi\b|milh|m$/.test(cru.replace(/\s/g, ''))){
      if((campo === 'f-be' || campo === 'f-bf') && n < 1000) n *= 1e3;        // "50" = 50 mil
      if(campo === 'f-bm' && n < 50) n = Math.round(n * 1e3);                  // "3" ou "3,5" = 3 mil ou 3,5 mil por mês
    }
    return n;
  };
  const bolsoLigado = f => !!(f && (f.be || f.bm || f.bf));
  // resumo do fluxo vem de corretor_bolso (só quando o filtro é ligado) e é pendurado nas unidades de S.U
  function pendurarBolso(){
    if(!S.U || !S.B) return;
    for(const [pid, us] of S.U){ const m = S.B.get(pid); for(const u of us) u.bo = m ? m.get(String(u.n)) || null : null; }
  }
  async function carregarBolso(forcar){
    if(!S.cod) return null;
    if(S.Bcarregando) return S.Bcarregando;
    if(S.B && !forcar && Date.now() - S.Bem < 300000) return S.B;
    S.Bcarregando = (async () => {
      try{
        const r = await rpc('corretor_bolso', {p_codigo: S.cod}, 40000), mapa = new Map();
        for(const pid in (r.u || {})){
          const m = new Map();
          for(const lin of String(r.u[pid]).split(';')){
            if(!lin) continue;
            const c = lin.split('|');
            m.set(c[0], {e: +c[1] || 0, m: +c[2] || 0, nm: +c[3] || 0, r: +c[4] || 0, fi: +c[5] || 0});
          }
          mapa.set(pid, m);
        }
        S.B = mapa; S.Bem = Date.now(); S.Berro = false; pendurarBolso();
      }catch(e){ if(codigoInvalido(e)){ sair('Esse código não vale mais. Digite o código novo do time.'); return null; } S.Berro = true; S.Bfalhou = Date.now(); }
      finally{ S.Bcarregando = null; }
      if(location.hash === '#/imoveis' && !document.querySelector('dialog[open]:not(#folha-filtros)')) atualizarImoveis();
      return S.B;
    })();
    return S.Bcarregando;
  }
  const _aplicarUnidadesBase = aplicarUnidades;
  aplicarUnidades = function(r){ _aplicarUnidadesBase(r); pendurarBolso(); };
  function cabeNoBolso(u, f){
    if(!S.B){ if(!S.Berro || Date.now() - (S.Bfalhou || 0) > 30000) carregarBolso(); return true; }   // enquanto carrega (ou sem rede), não esconde nada; o aviso diz
    const b = u.bo; if(!b) return false;
    if(f.be && b.e > f.be) return false;
    if(f.bm && !(b.m > 0 && b.m <= f.bm)) return false;   // sem mensal (pronto, à vista) não cabe em "por mês até"
    if(f.bf && b.fi > f.bf) return false;
    return true;
  }
  const brlCurto = v => v >= 1e6 ? BRLc(v) : v >= 1e4 ? 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil' : BRL(v);
  function bolsoChip(f){
    const p = [];
    if(f.be) p.push('Entrada até ' + milTxt(f.be));
    if(f.bm) p.push((p.length ? 'até ' : 'Até ') + (f.bm >= 1e4 ? milTxt(f.bm) : BRL(f.bm)) + ' por mês');
    if(f.bf) p.push((p.length ? 'financia até ' : 'Financia até ') + milTxt(f.bf));
    return p.join(', ');
  }
  function bolsoFrase(f){   // para o texto da seleção do cliente
    const p = [];
    if(f.be) p.push('entrada até ' + brlCurto(f.be));
    if(f.bm) p.push('parcelas até ' + brlCurto(f.bm) + ' por mês');
    if(f.bf) p.push('financiamento até ' + brlCurto(f.bf));
    return p.length ? 'com ' + (p.length > 1 ? p.slice(0, -1).join(', ') + ' e ' + p[p.length - 1] : p[0]) : '';
  }
  function bolsoCurto(b){   // linha de apoio na lista de unidades
    if(!b) return 'sem fluxo na tabela';
    const p = [];
    if(b.e) p.push('entrada ' + brlCurto(b.e));
    if(b.m) p.push(b.nm + 'x ' + brlCurto(b.m));
    if(b.r) p.push('reforços ' + brlCurto(b.r));
    if(b.fi) p.push('financia ' + brlCurto(b.fi));
    return p.join(', ');
  }
  function bolsoCampos(f){
    return '<div class="campos-2">' + campoNum('f-be', 'Entrada até', f.be, 'R$ 0') + campoNum('f-bm', 'Por mês até', f.bm, 'R$ 0') + '</div>' +
      '<div class="campos-2">' + campoNum('f-bf', 'Financia até', f.bf, 'Sem limite') + '</div>' +
      '<p class="nota">Entrada é o ato, o sinal e as parcelas dos primeiros meses. Por mês é a mensal paga até as chaves: com ele preenchido, unidade sem mensal (pronta ou à vista) fica de fora. Reforços e financiamento aparecem em cada unidade.</p>';
  }
  function bolsoVazio(f){   // nada no filtro: o menor valor que existe hoje nos espelhos, para o corretor saber até onde dá para descer
    if(!S.B) return '';
    let me = Infinity, mm = Infinity;
    for(const m of S.B.values()) for(const b of m.values()){ if(b.e > 0 && b.e < me) me = b.e; if(b.m > 0 && b.m < mm) mm = b.m; }
    const p = [];
    if(f.be && me < Infinity && f.be < me) p.push('a menor entrada nos espelhos é de ' + brlCurto(me));
    if(f.bm && mm < Infinity && f.bm < mm) p.push((p.length ? 'a menor mensal, de ' : 'a menor mensal nos espelhos é de ') + brlCurto(mm));
    return p.length ? '<p class="texto-2">Hoje ' + esc(p.join(' e ')) + '.</p>' : '';
  }
  function bolsoCard(r){   // linha do cartão do projeto com o filtro ligado
    if(!bolsoLigado(S.f) || !r || !r.us || !r.us.length) return '';
    let be = null, bm = null;
    for(const u of r.us){
      if(!u.bo) continue;
      if(be == null || u.bo.e < be) be = u.bo.e;
      if(u.bo.m > 0 && (bm == null || u.bo.m < bm)) bm = u.bo.m;
    }
    if(be == null) return '';
    return 'Entrada a partir de ' + brlCurto(be) + (bm != null ? ', mensais a partir de ' + brlCurto(bm) : '');
  }

  // ---------------- x_dados.js ----------------
  // ================= DADOS AO VIVO E SEM INTERNET =================
  // 1. Espelho aberto ao vivo: quando o resumo de cada minuto mostra mudança no projeto aberto (Tabela ou ficha),
  //    o app busca o espelho dele de novo e repinta, como o app anterior fazia.
  // 2. Sem internet: o último espelho de cada projeto aberto e a lista de unidades ficam guardados no aparelho
  //    (Cache Storage, fora do localStorage), e a Tabela, a ficha e o Imóveis abrem com o que ficou salvo.
  // 3. Fotos do Drive: quando o cadastro já tem 6 fotos ou mais, o servidor não junta as da pasta do Drive na ficha;
  //    o app anterior juntava (função projeto_fotos), então aqui elas entram depois, sem atrasar a abertura.
  const DD = {sig: new Map(), gravado: new Map(), fotosPedidas: new Set(), busy: false, pend: null};
  const DD_CACHE = 'dados-espelhos-v1';   // nome fora do prefixo "espelhos-", que o service worker limpa a cada versão
  const DD_MAX = 20;
  const ddReq = k => new Request(ESP + '__dados__/' + encodeURIComponent(k));
  async function ddGuardar(k, v){
    try{
      if(!('caches' in window)) return;
      const c = await caches.open(DD_CACHE);
      await c.put(ddReq(k), new Response(JSON.stringify(v), {headers: {'content-type': 'application/json'}}));
      let idx = []; try{ idx = JSON.parse(LS.get('espelhos-dados-idx') || '[]'); }catch(e){}
      idx = idx.filter(x => x && x.k !== k); idx.push({k, em: Date.now()});
      const proj = idx.filter(x => /^p-/.test(x.k));
      for(const x of proj.slice(0, Math.max(0, proj.length - DD_MAX))){ await c.delete(ddReq(x.k)); idx = idx.filter(y => y.k !== x.k); }
      LS.set('espelhos-dados-idx', JSON.stringify(idx));
    }catch(e){}
  }
  async function ddLer(k){
    try{ if(!('caches' in window)) return null; const c = await caches.open(DD_CACHE); const r = await c.match(ddReq(k)); return r ? await r.json() : null; }catch(e){ return null; }
  }
  // assinatura do projeto no resumo: muda quando vende, reserva, libera ou o preço muda
  const ddSig = id => { const p = S.byId.get(id); if(!p) return ''; const m = S.M.find(x => x.p === id); return [p.livres, p.reservadas, p.processo, p.vendidas, p.preco, m ? m.em + ':' + m.n + ':' + m.para : ''].join('|'); };
  const ddUnSig = v => ((v && v.dados && v.dados.unidades) || []).map(a => a[0] + a[6] + JSON.stringify(a[7] || '')).join(';');

  // ---- detalhe do projeto: guarda o último, usa o guardado sem internet, junta as fotos do Drive
  const _detalheDD = detalhe;
  detalhe = function(id, forcar){
    const r = _detalheDD(id, forcar);
    if(!r || typeof r.then !== 'function') return r;   // já estava na memória
    return r.then(v => {
      if(v && v.dados){
        DD.sig.set(id, ddSig(id));
        const us = ddUnSig(v), g = DD.gravado.get(id);
        if(!g || g.us !== us || Date.now() - g.em > 5 * 60e3){ DD.gravado.set(id, {us, em: Date.now()}); ddGuardar('p-' + id, v); }
        ddFotosDrive(id, v);
      }
      return v;
    }, async e => {
      if(codigoInvalido(e)) throw e;
      const v = await ddLer('p-' + id);
      if(v && v.dados){ S.det.set(id, {v, em: Date.now() - 50000}); return v; }
      throw e;
    });
  };
  function ddFotosDrive(id, v){
    const i = v.info || {};
    if(DD.fotosPedidas.has(id) || !(i.drive && i.drive.fotos) || !Array.isArray(i.fotos) || i.fotos.length < 6 || !S.cod) return;
    DD.fotosPedidas.add(id);
    rpc('projeto_fotos', {p_codigo: S.cod, p_id: id}).then(r => {
      const novas = r && Array.isArray(r.fotos) ? r.fotos.filter(f => f && urlImg(f.u)) : [];
      const ch = S.det.get(id), alvo = ch && ch.v; if(!alvo || !novas.length) return;
      const tem = new Set((alvo.fotos || []).map(f => f && original(urlImg(f.u) || '')));
      const add = novas.filter(f => !tem.has(original(urlImg(f.u))));
      if(!add.length) return;
      alvo.fotos = (alvo.fotos || []).concat(add);
      if(location.hash === '#/p/' + id && !document.querySelector('dialog[open]')) render();
    }).catch(() => { DD.fotosPedidas.delete(id); });
  }

  // ---- unidades de todos os projetos (Imóveis): guarda a última lista e usa sem internet
  const _aplicarUnidadesDD = aplicarUnidades;
  aplicarUnidades = function(r){
    _aplicarUnidadesDD(r);
    const g = DD.gravado.get('u');
    if(!g || g.v !== r.versao || Date.now() - g.em > 10 * 60e3){ DD.gravado.set('u', {v: r.versao, em: Date.now()}); ddGuardar('u', r); }
  };
  const _carregarUnidadesDD = carregarUnidades;
  carregarUnidades = async function(forcar){
    const r = await _carregarUnidadesDD(forcar);
    if(S.U || !S.Uerro) return r;
    const c = await ddLer('u');
    if(c && c.u){ _aplicarUnidadesDD(c); S.Uerro = true; if(location.hash === '#/imoveis' && !document.querySelector('dialog[open]:not(#folha-filtros)')) atualizarImoveis(); }
    return S.U;
  };

  // ---- espelho aberto ao vivo
  async function ddAoVivo(){
    const m = /^#\/(tabelas|p)\/([a-z0-9-]+)$/.exec(location.hash || '');
    if(!m || !S.carregado || !S.cod || DD.busy || S.offline) return;
    const id = m[2], ch = S.det.get(id);
    if(!ch || !ch.v || ch.pr) return;
    if(DD.sig.get(id) === ddSig(id)) return;
    DD.busy = true;
    try{
      const antes = ddUnSig(ch.v);
      const v = await detalhe(id, true);
      if(location.hash !== '#/' + m[1] + '/' + id || !v) return;
      if(ddUnSig(v) === antes) return;
      if(document.querySelector('dialog[open]')){ DD.pend = location.hash; return; }
      ddRepintar(m[1]);
    }catch(e){ /* sem internet: fica o que está na tela */ }
    finally{ DD.busy = false; }
  }
  function ddRepintar(rota){
    if(rota === 'tabelas') atualizarTabela();
    else{ const ae = document.activeElement; if(!(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))) render(); }
  }
  const _refrescarDD = refrescar;
  refrescar = function(){ const r = _refrescarDD(); ddAoVivo(); return r; };
  // folha fechada depois de uma mudança: repinta o que ficou para trás
  document.addEventListener('close', ev => {
    if(!DD.pend || !(ev.target instanceof HTMLDialogElement)) return;
    setTimeout(() => {
      if(!DD.pend || document.querySelector('dialog[open]')) return;
      const h = DD.pend; DD.pend = null;
      const m = /^#\/(tabelas|p)\/([a-z0-9-]+)$/.exec(h);
      if(m && location.hash === h) ddRepintar(m[1]);
    }, 60);
  }, true);

  // ---- quando cada projeto foi conferido no sistema (o robô relê mesmo quando nada muda)
  // O resumo só traz a data da última mudança; a leitura por projeto vem do espelho_versao (leve), uma vez por minuto
  // no máximo e só nas telas de Tabela e ficha. Projeto sem robô mostra de onde vem (PDF, tabela, anúncios) e o aviso.
  DD.robo = null; DD.roboEm = 0; DD.roboPr = null;
  function ddRobo(){
    if(DD.roboPr || Date.now() - DD.roboEm < 60e3 || !S.cod) return DD.roboPr || Promise.resolve(DD.robo);
    DD.roboPr = rpc('espelho_versao', {p_codigo: S.cod}).then(r => {
      const m = {};
      for(const [f, o] of Object.entries((r && r.robo) || {})){
        const inf = o && o.info && typeof o.info === 'object' ? o.info : {};
        for(const [pid, x] of Object.entries(inf)) if(x && x.em && Date.parse(x.em)) m[pid] = {em: x.em, f, visto: o.visto_em};
      }
      DD.robo = m; DD.roboEm = Date.now(); return m;
    }).catch(() => DD.robo).finally(() => { DD.roboPr = null; });
    return DD.roboPr;
  }
  function ddFrescor(id, det){
    const r = DD.robo && DD.robo[id], d = (det && det.dados) || {}, mm = d.manual && typeof d.manual === 'object' ? d.manual : null;
    if(r){
      // ao vivo: o robô respondeu nos últimos minutos e o projeto entrou no rodízio dele (a ONE relê cada projeto a cada meia hora)
      const t = Date.parse(r.em), min = (Date.now() - t) / 60000, robo = (Date.now() - Date.parse(r.visto || '')) / 60000;
      const vivo = robo <= 6 && min <= (r.f === 'one' ? 75 : 25);
      return {txt: 'Conferido no sistema ' + (diaKey(t) === diaKey(Date.now()) ? 'às ' + hora(t) : quandoTxt(t)), vivo, aviso: ''};
    }
    if(mm && mm.rotulo) return {txt: String(mm.rotulo) + (mm.valor ? ' ' + String(mm.valor) : ''), vivo: false, aviso: mm.titulo ? String(mm.titulo) : ''};
    return null;
  }
  const ddFrescorHtml = (id, det) => {
    const f = ddFrescor(id, det); if(!f) return '';
    return '<p class="dd-frescor' + (f.vivo ? ' vivo' : '') + '">' + (f.vivo ? '<i aria-hidden="true"></i>' : '') + esc(f.txt) + (f.vivo ? ', ao vivo' : '') + '</p>' + (f.aviso ? '<p class="nota dd-aviso">' + esc(f.aviso) + '</p>' : '');
  };
  const _tabListaHtmlDD = tabListaHtml;
  tabListaHtml = function(p, det){ return ddFrescorHtml(p.id, det) + _tabListaHtmlDD(p, det); };
  const _painelProjDD = painelProj;
  painelProj = function(p, det, c){
    let h = _painelProjDD(p, det, c);
    const f = ddFrescor(p.id, det);
    if(f){
      h = h.replace(/, espelho lido [^.<]*\./, '.').replace(/<p class="nota">espelho lido [^.<]*\.<\/p>/, '');
      const i = h.lastIndexOf('</section>');
      if(i >= 0) h = h.slice(0, i) + ddFrescorHtml(p.id, det) + h.slice(i);
    }
    return h;
  };
  // ao entrar na Tabela ou na ficha, busca as leituras e repinta se mudou o que aparece
  window.addEventListener('hashchange', () => { if(/^#\/(tabelas|p)\/[a-z0-9-]+$/.test(location.hash)) ddRoboTela(); });
  async function ddRoboTela(){
    const m = /^#\/(tabelas|p)\/([a-z0-9-]+)$/.exec(location.hash || ''); if(!m || !S.cod) return;
    const ch = S.det.get(m[2]), antes = JSON.stringify(ddFrescor(m[2], ch && ch.v));
    await ddRobo();
    if(location.hash !== '#/' + m[1] + '/' + m[2]) return;
    const c2 = S.det.get(m[2]); if(!c2 || !c2.v) return;
    if(JSON.stringify(ddFrescor(m[2], c2.v)) === antes || document.querySelector('dialog[open]')) return;
    const ae = document.activeElement; if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    render();   // a linha de cima da Tabela fica fora da lista, então repinta a tela toda (a rolagem fica onde está)
  }
  setTimeout(() => { if(S.cod) ddRobo(); }, 3000);   // já chega na Tabela sabendo a hora de cada leitura
  const _refrescarDD2 = refrescar;
  refrescar = function(){ const r = _refrescarDD2(); if(/^#\/(tabelas|p)\/[a-z0-9-]+$/.test(location.hash)) ddRoboTela(); return r; };
  if(/^#\/(tabelas|p)\/[a-z0-9-]+$/.test(location.hash)) setTimeout(ddRoboTela, 1500);
  // a Tabela deixa de dizer "Espelho lido <última mudança>" quando sabe a hora da conferência no sistema
  const _tabelaHtmlDD = tabelaHtml;
  tabelaHtml = function(p, det){
    const h = _tabelaHtmlDD(p, det);
    return ddFrescor(p.id, det) ? h.replace(/\. Espelho lido [^.<]*\.<\/p>/, '.</p>') : h;
  };

  // ---------------- x_movel.js ----------------
  // ================= CELULAR: folhas inteiras, arrastar para fechar e o botão voltar =================
  // 1. No iPhone, o corpo da folha (flex-basis 0%) encolhia até sobrar só o cabeçalho: a folha abria "presa" no pé da tela.
  //    A correção está no x_movel.css (o corpo cresce a partir do conteúdo).
  // 2. Arrastar o cabeçalho da folha para baixo fecha a folha; soltar antes do ponto devolve a folha para o lugar.
  // 3. O botão voltar do celular (Android) fecha a folha aberta em vez de sair da tela.
  const mvCelular = () => !matchMedia('(min-width: 1024px)').matches;
  let mvSeq = 0;
  function mvArrastar(d){
    const cab = d.querySelector('.folha-cab'); if(!cab || d.dataset.arrasta) return;
    d.dataset.arrasta = '1';
    let y0 = 0, t0 = 0, dy = 0, ativo = false;
    cab.addEventListener('touchstart', ev => {
      if(!mvCelular() || ev.touches.length !== 1 || (ev.target.closest && ev.target.closest('button, a, input, select, textarea'))) return;
      ativo = true; y0 = ev.touches[0].clientY; t0 = Date.now(); dy = 0;
      d.style.animation = 'none'; d.style.transition = 'none';
    }, {passive: true});
    cab.addEventListener('touchmove', ev => {
      if(!ativo) return;
      dy = Math.max(0, ev.touches[0].clientY - y0);
      d.style.transform = dy ? 'translateY(' + dy + 'px)' : '';
      if(ev.cancelable) ev.preventDefault();
    }, {passive: false});
    const soltar = () => {
      if(!ativo) return; ativo = false;
      const v = dy / Math.max(1, Date.now() - t0);
      if(dy > 110 || (dy > 36 && v > 0.55)){
        d.style.transition = 'transform .18s ease-in'; d.style.transform = 'translateY(105%)';
        setTimeout(() => { try{ d.close(); }catch(e){} }, 170);
      } else {
        d.style.transition = 'transform .2s ease-out'; d.style.transform = '';
        setTimeout(() => { d.style.transition = ''; }, 230);
      }
    };
    cab.addEventListener('touchend', soltar, {passive: true});
    cab.addEventListener('touchcancel', soltar, {passive: true});
  }
  const _abrirFolhaMV = abrirFolha;
  abrirFolha = function(id, titulo, corpo, pe, cls){
    // trocando uma folha por outra (da unidade para a proposta, por exemplo): o voltar continua valendo para a folha nova
    const trocando = !!(document.querySelector('#folhas dialog.folha[open]') && history.state && history.state.mvFolha);
    _abrirFolhaMV(id, titulo, corpo, pe, cls);
    const d = document.querySelector('#folhas dialog.folha'); if(!d) return;
    mvArrastar(d);
    if(!mvCelular()) return;
    const marca = 'f' + Date.now().toString(36) + (++mvSeq);
    d.dataset.mv = marca;
    try{
      const st = Object.assign({}, history.state || {}, {mvFolha: marca});
      if(trocando) history.replaceState(st, ''); else history.pushState(st, '');
    }catch(e){ return; }
    // fechou pelo X, pelo fundo ou arrastando: tira do histórico o passo que a folha pôs
    d.addEventListener('close', () => { if(history.state && history.state.mvFolha === marca) history.back(); });
  };
  window.addEventListener('popstate', () => {
    const d = document.querySelector('#folhas dialog.folha[open]');
    if(d && d.dataset.mv && !(history.state && history.state.mvFolha === d.dataset.mv)) d.close();
  });

  // ---------------- x_plantas.js ----------------
  // ================= PLANTA DA UNIDADE: mais fontes =================
  // 1. Fotos com título de planta ("Planta 24,59 m² (final 4)", "Planta studio 18,14 m²", "Planta 32,9 m² (final 13, 2º ao 14º andar)",
  //    "Planta do 13º pavimento"), como as que vieram do site da Vitacon, contam como planta mesmo sem k "planta".
  // 2. Quando nenhuma planta marcada serve, a busca segue para as outras fontes em vez de parar.
  // tipologia escrita no título ("studio", "1 dorm", "2 dormitórios"); número solto não conta (24,59 m² não é 2 dorms)
  const plTipoK = s => { const t = norm(String(s || '')); if(/stud|kitn/.test(t)) return 'S'; const m = /(\d)\s*(?:dorm|quarto|suite)/.exec(t); if(m) return +m[1] >= 3 ? '3' : m[1]; return /\bloja/.test(t) ? 'L' : null; };
  const plAreaTit = t => { const m = /(\d{1,3}(?:[.,]\d{1,2})?)\s*m²/i.exec(String(t || '')); return m ? +m[1].replace(',', '.') : null; };
  function plFinaisTit(t){
    const m = /\bfina(?:l|is)\s+(\d{1,3}(?![\dº°])(?:\s*(?:,|\be\b|\ba\b|\bao\b)\s*\d{1,3}(?![\dº°]))*)/i.exec(String(t || '')); if(!m) return [];   // "final 13, 2º ao 14º andar": o 2º é andar
    const out = []; const ts = m[1].split(/\s*(,|\be\b|\ba\b|\bao\b)\s*/i).filter(Boolean);
    for(let i = 0; i < ts.length; i++){
      if(/^\d+$/.test(ts[i])){ if(/^(a|ao)$/i.test(ts[i + 1] || '') && /^\d+$/.test(ts[i + 2] || '')){ const x = +ts[i], y = +ts[i + 2]; if(y >= x && y - x <= 60) for(let k = x; k <= y; k++) out.push(k); i += 2; } else out.push(+ts[i]); }
    }
    return out;
  }
  function plAndaresTit(t){
    const s = String(t || ''), out = andaresDoTitulo(s);
    const m = /(\d{1,2})[º°]\s*(?:ao|a)\s*(\d{1,2})[º°]\s*(?:pavimentos?|andar)/i.exec(s) || null;
    if(!out.length && m) out.push([+m[1], +m[2]]);
    const p = /(\d{1,2})[º°]\s*pavimento/i.exec(s); if(!out.length && p) out.push([+p[1], +p[1]]);
    return out;
  }
  // todas as plantas que o cadastro tem, num formato só: {src, t, sub, as, fins, andares, pav, opc, tec}
  function plantasTodas(det, c){
    const out = [], vistos = new Set();
    const add = (src, tt, as, fins, andares) => {
      if(!src || vistos.has(src)) return; vistos.add(src);
      const partes = String(tt || 'Planta').split(/\s+·\s+/);
      out.push({src, t: partes[0], sub: partes.slice(1).join(', '), tt: String(tt || ''), as, fins, andares,
        pav: /pavimento|andar tipo|planta do andar/i.test(tt), opc: /op[cç][aã]o|ampliad|outra vers/i.test(tt), tec: /t[eé]cnica/i.test(tt)});
    };
    for(const x of plantasFotos(det)) add(x.src, x.tt, x.as.length ? x.as : (plAreaTit(x.tt) ? [plAreaTit(x.tt)] : []), x.fins.length ? x.fins : plFinaisTit(x.tt), x.andares.length ? x.andares : plAndaresTit(x.tt));
    for(const f of (det && det.fotos) || []){
      if(!f || f.k === 'planta' || !/^\s*planta\b/i.test(String(f.t || '')) || /implanta/i.test(String(f.t || ''))) continue;
      const src = urlImg(f.u), tt = String(f.t); if(!src) continue;
      add(src, tt, plAreaTit(tt) ? [plAreaTit(tt)] : [], plFinaisTit(tt), plAndaresTit(tt));
    }
    const info = (det && det.info) || {};
    for(const x of (Array.isArray(info.plantas) ? info.plantas : [])){
      const src = urlImg(x && x.u), tt = String((x && x.t) || 'Planta'); if(!src || /implanta/i.test(tt)) continue;
      const as = Array.isArray(x.a) ? x.a.map(Number).filter(v => v > 0) : (plAreaTit(tt) ? [plAreaTit(tt)] : []);
      add(src, tt, as, plFinaisTit(tt), plAndaresTit(tt));
    }
    for(const m of (Array.isArray(info.material) ? info.material : [])) if(m && m.tipo === 'planta' && urlSegura(m.u)) add(m.u, m.t || 'Planta', plAreaTit(m.t) ? [plAreaTit(m.t)] : [], plFinaisTit(m.t), plAndaresTit(m.t));
    return out;
  }
  // final da unidade: o rótulo da coluna do espelho ou, sem ele, o fim do número ("1507" no 15º andar é o final 07)
  function plFinalU(det, a){
    const f = finalNum(det, a); if(f != null) return f;
    const n = String(a[0] || ''), an = String(a[4] == null ? '' : a[4]);
    if(/^\d{3,5}$/.test(n) && /^\d{1,2}$/.test(an) && n.startsWith(an) && n.length - an.length >= 1 && n.length - an.length <= 2) return +n.slice(an.length);
    return null;
  }
  function plantaReserva(det, c, a){
    const ar = areaU(a), fin = plFinalU(det, a), an = andarNum(a), tk = tipoKDe(tipologiaU(det, a) || '');
    const todas = plantasTodas(det, c).filter(x => !x.pav).map(x => {
      const fOk = x.fins.length && fin != null ? x.fins.includes(fin) : null;
      const inteira = x.as.length === 1 && Number.isInteger(x.as[0]);
      const d = ar > 0 && x.as.length ? Math.min(...x.as.map(v => Math.abs(v - ar))) : 99;
      const faixa = ar > 0 && x.as.length >= 2 && ar >= Math.min(...x.as) - 0.3 && ar <= Math.max(...x.as) + 0.3;
      const andarOk = !x.andares.length || an == null || x.andares.some(([de, ate]) => an >= de && an <= ate);
      const dAndar = an == null || !x.andares.length ? 0 : Math.min(...x.andares.map(([de, ate]) => an < de ? de - an : an > ate ? an - ate : 0));
      const tOk = !tk || !plTipoK(x.tt) || plTipoK(x.tt) === tk;
      return {x, fOk, d, aOk: d <= (inteira ? 1 : 0.6) || faixa, andarOk, dAndar, tOk};
    }).filter(o => o.tOk);
    const ordem = (p, q) => (q.fOk === true) - (p.fOk === true) || p.x.opc - q.x.opc || p.x.tec - q.x.tec || p.dAndar - q.dAndar || p.d - q.d;
    // 1. a planta do final e do andar da unidade (ou sem final, pela metragem); planta sem metragem ("Planta studio (final 1)") vale pelo final e pelo tipo
    let cands = todas.filter(o => o.andarOk && o.fOk !== false && (o.aOk || (o.fOk === true && (o.d <= 3 || !o.x.as.length))));
    let exataOk = true;
    // 2. o mesmo final em outro andar, com a mesma metragem: planta da tipologia (o material não trouxe a do andar)
    if(!cands.length){ cands = todas.filter(o => o.fOk === true && !o.andarOk && (o.d <= 0.3 || !o.x.as.length)); exataOk = false; }
    // 3. outro final com a mesma metragem, só quando o material não tem planta do final da unidade para aquele andar (a do garden não conta para os andares de cima)
    if(!cands.length && !todas.some(o => o.fOk === true && o.andarOk)){ cands = todas.filter(o => o.fOk === false && o.andarOk && o.d <= 0.3); exataOk = false; }
    if(!cands.length) return null;
    cands.sort(ordem);
    const m = cands[0], op = cands.find(o => o !== m && o.x.opc && !o.x.tec && Math.abs(o.d - m.d) < 0.6 && o.fOk === m.fOk && o.andarOk === m.andarOk);
    return {src: m.x.src, t: m.x.t, sub: m.x.sub, exata: exataOk && ((m.fOk === true && m.x.as.length > 0) || (m.fOk !== false && m.d <= 0.05)), opcao: op ? {src: op.x.src, t: op.x.t + (op.x.sub ? ', ' + op.x.sub : '')} : null};
  }
  const _andaresDoTituloX = andaresDoTitulo;
  andaresDoTitulo = function(t){ const r = _andaresDoTituloX(t); if(/(^|\s|·)t[ée]rreo\b/i.test(String(t || ''))) r.push([0, 0]); return r; };
  const _plantaDaUnidadeX = plantaDaUnidade;
  plantaDaUnidade = function(det, c, a){ return _plantaDaUnidadeX(det, c, a) || plantaReserva(det, c, a); };
  // planta do andar inteiro também pelos títulos ("Planta do 13º pavimento")
  const _pavimentoDaUnidadeX = pavimentoDaUnidade;
  pavimentoDaUnidade = function(det, a){
    const r = _pavimentoDaUnidadeX(det, a); if(r) return r;
    const an = andarNum(a); if(an == null) return null;
    const ps = plantasTodas(det, null).filter(x => x.pav && x.andares.some(([de, ate]) => an >= de && an <= ate));
    return ps.length ? {src: ps[0].src, t: ps[0].t, sub: ps[0].sub} : null;
  };
  // na galeria, as fotos que são plantas saem das fotos e ficam na seção Plantas
  const _plantasDoProjetoX = plantasDoProjeto;
  plantasDoProjeto = function(det, c){
    const base = _plantasDoProjetoX(det, c);
    const tem = new Set(base.map(x => x.src));
    const extra = plantasTodas(det, c).filter(x => !tem.has(x.src)).sort((p, q) => p.pav - q.pav || (p.as[0] || 0) - (q.as[0] || 0)).map(x => ({src: x.src, t: x.t, sub: x.sub}));
    const lista = base.concat(extra);
    if(lista.length <= 24) return lista;
    // uma planta por final e por andar (Nurban: 127 no Rua das Palmeiras): na ficha do projeto fica uma por final,
    // a que vale para mais andares; a folha da unidade continua com a planta exata do andar dela
    const info = new Map(plantasTodas(det, c).map(x => [x.src, x]));
    const vao = x => (x.andares.length ? x.andares.reduce((s, [de, ate]) => s + ate - de + 1, 0) : 0);
    const melhor = new Map();
    for(const x of lista){ const y = info.get(x.src); if(!y || !y.fins.length || y.pav || y.opc) continue; const k = y.fins.join(','); const m = melhor.get(k); if(!m || vao(y) > vao(m)) melhor.set(k, y); }
    if(!melhor.size) return lista;
    const fica = new Set([...melhor.values()].map(y => y.src));
    const out = lista.filter(x => { const y = info.get(x.src); return !y || !y.fins.length || y.pav ? true : fica.has(x.src); });
    return out.length < lista.length ? out : lista;
  };
  const _fotosDoProjetoX = fotosDoProjeto;
  fotosDoProjeto = function(det, c){
    const pls = new Set(plantasTodas(det, c).map(x => original(x.src)));
    return _fotosDoProjetoX(det, c).filter(f => !pls.has(original(f.src)));
  };

  // ================= início =================
  aplicarTema(LS.get(K.tema) || 'escuro');
  try{ matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if((LS.get(K.tema) || 'escuro') === 'sistema') aplicarTema('sistema'); }); }catch(e){}
  if(S.cod){
    const c = cacheLido();
    if(c && Date.now() - c.em < 6 * 3600e3){ aplicarResumo(c.r); S.cacheEm = c.em; render(); }
    carregar('inicio');
  }else render();
  setInterval(() => { if(document.visibilityState === 'visible' && S.cod && navigator.onLine !== false) carregar('auto'); }, 60000);
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible' && S.cod && Date.now() - (S.geradoEm || 0) > 45000) carregar('auto'); });
  window.addEventListener('online', () => { if(S.cod) carregar('auto'); });

  if('serviceWorker' in navigator && location.protocol === 'https:'){
    navigator.serviceWorker.register('sw.js').then(reg => { reg.update().catch(() => {}); }).catch(() => {});
    const tinha = !!navigator.serviceWorker.controller;
    let recarregou = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(!tinha || recarregou) return;
      const ae = document.activeElement;
      if(document.querySelector('dialog[open]') || S.baixa || /^#\/posts\//.test(location.hash) || (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName))) return;
      recarregou = true; location.reload();
    });
  }
})();
