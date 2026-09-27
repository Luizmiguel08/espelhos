// ==UserScript==
// @name         Robô do Espelho de Vendas
// @namespace    https://luizmiguel08.github.io/espelhos/
// @version      1.1.0
// @description  Lê a disponibilidade na BLL (RAJ MENDES), no CV CRM (Nurban Consolação e Sumaré) e no portal da ONE (NEX Bela Cintra) e atualiza o app Espelhos de Vendas. Só lê; não altera nada nos sistemas.
// @match        https://app.blladv.com.br/*
// @match        https://vitaurbana.cvcrm.com.br/*
// @match        https://portaldevendas.oneinnovation.com.br/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      dptchfjbotmddaniuzvr.supabase.co
// @run-at       document-idle
// @updateURL    https://luizmiguel08.github.io/espelhos/robo.user.js
// @downloadURL  https://luizmiguel08.github.io/espelhos/robo.user.js
// ==/UserScript==

(function () {
  'use strict';
  const API = 'https://dptchfjbotmddaniuzvr.supabase.co/rest/v1/rpc/';
  const KEY = 'sb_publishable_K9--vOhW8y5ldlbwzo6m_Q_g_gB9rYP';
  const VERSAO = '1.1.0';
  const host = location.hostname;
  const FONTE = host.includes('blladv') ? 'bll' : host.includes('cvcrm') ? 'cv' : host.includes('oneinnovation') ? 'one' : null;
  if (!FONTE) return;
  const TOPO = window.top === window.self;
  if (FONTE !== 'one' && !TOPO) return;          // BLL e CV: só a página principal
  let INTERVALO = FONTE === 'bll' ? 60000 : 90000;
  const ID = Math.random().toString(36).slice(2);
  const st = { fase: 'iniciando', ultimo: null, mudancas: 0, erro: null, sessao: false, aviso: null };
  let cfg = FONTE === 'one' ? { sincronizar: false, recarregar: 'nenhum', intervalo: 120 } : null;

  // ---------- armazenamento (compartilhado entre as abas do robô) ----------
  const gget = (k, d) => { try { return GM_getValue(k, d); } catch (e) { return d; } };
  const gset = (k, v) => { try { GM_setValue(k, v); } catch (e) {} };
  const chave = () => (gget('chave', '') || '').trim();
  function batimento() {
    const hb = { id: ID, t: Date.now() };
    gset('hb:' + FONTE, hb);
    try { localStorage.setItem('roboEspelho:hb', JSON.stringify(hb)); } catch (e) {}
  }
  function outroVivo() { const hb = gget('hb:' + FONTE, null); return hb && hb.id !== ID && (Date.now() - hb.t) < Math.max(150000, INTERVALO * 2.5); }

  // ---------- selo na tela ----------
  const host$ = document.createElement('div');
  host$.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:2147483646';
  const sh = host$.attachShadow({ mode: 'open' });
  sh.innerHTML = `<style>
    .b{font:12px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#182030;color:#eef1f7;border-radius:10px;padding:7px 10px;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:320px;display:flex;flex-direction:column;gap:6px}
    .l{display:flex;align-items:center;gap:7px;cursor:pointer}
    .d{width:8px;height:8px;border-radius:50%;background:#8b94a6;flex:none}
    .ok .d{background:#34b233}.warn .d{background:#e0a100}.bad .d{background:#e8473a}
    .f{display:none;gap:6px}.aberto .f{display:flex}
    input{flex:1;min-width:0;border:0;border-radius:6px;padding:5px 7px;font:inherit;color:#182030}
    button{border:0;border-radius:6px;padding:5px 9px;font:inherit;font-weight:600;background:#7d97ff;color:#0b1230;cursor:pointer}
  </style><div class="b" id="b"><div class="l" id="l"><span class="d"></span><span id="t">Robô do Espelho</span></div>
  <div class="f"><input id="k" type="password" placeholder="Cole a chave do robô (ROBO-...)" autocomplete="off"><button id="s">Salvar</button></div></div>`;
  const $ = id => sh.getElementById(id);
  let mostrar = FONTE !== 'one';                  // na ONE, o selo só aparece no quadro do espelho
  const montar = () => { if (mostrar && document.body && document.body.tagName === 'BODY' && !host$.isConnected) document.body.appendChild(host$); };
  montar();
  $('l').addEventListener('click', () => $('b').classList.toggle('aberto'));
  $('s').addEventListener('click', () => { const v = $('k').value.trim(); if (!v) return; gset('chave', v); $('k').value = ''; $('b').classList.remove('aberto'); st.erro = null; ciclo(); });
  const hora = t => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  function pintar() {
    montar();
    const b = $('b'); b.classList.remove('ok', 'warn', 'bad');
    let txt;
    if (!chave()) { b.classList.add('warn', 'aberto'); txt = 'Robô do Espelho: cole a chave para começar'; }
    else if (st.sessao) { b.classList.add('bad'); txt = 'Robô do Espelho: sessão expirada — faça login'; }
    else if (st.erro) { b.classList.add('bad'); txt = 'Robô do Espelho: ' + st.erro; }
    else if (st.aviso) { b.classList.add('warn'); txt = 'Robô do Espelho: ' + st.aviso; }
    else if (st.fase === 'espera') { b.classList.add('ok'); txt = 'Robô do Espelho: outra aba já está atualizando'; }
    else if (st.fase === 'mapeando') { b.classList.add('ok'); txt = 'Robô do Espelho · lendo o espelho da ONE (fase de teste) · ' + hora(st.ultimo || Date.now()); }
    else if (st.ultimo) { b.classList.add('ok'); txt = 'Robô do Espelho · ao vivo · ' + hora(st.ultimo) + (st.mudancas ? ' · ' + st.mudancas + ' mudança(s)' : ''); }
    else txt = 'Robô do Espelho · iniciando…';
    $('t').textContent = txt;
  }

  // ---------- servidor ----------
  function rpcGM(fn, args) {
    return new Promise((ok, falha) => {
      GM_xmlhttpRequest({ method: 'POST', url: API + fn, headers: { apikey: KEY, 'Content-Type': 'application/json' }, data: JSON.stringify(args),
        onload: r => { if (r.status >= 200 && r.status < 300) { try { ok(r.responseText ? JSON.parse(r.responseText) : null); } catch (e) { ok(null); } } else { const e = new Error(r.responseText); e.status = r.status; falha(e); } },
        onerror: () => falha(new Error('rede')), ontimeout: () => falha(new Error('tempo')) });
    });
  }
  async function rpc(fn, args) {
    let r;
    try { r = await fetch(API + fn, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(args) }); }
    catch (e) { if (typeof GM_xmlhttpRequest === 'function') return rpcGM(fn, args); throw e; }
    const t = await r.text();
    if (!r.ok) { const e = new Error(t); e.status = r.status; throw e; }
    return t ? JSON.parse(t) : null;
  }

  // ---------- leitura BLL e CV ----------
  const MAPA_BLL = { 0: 'disponivel', 1: 'reservada', 2: 'vendida', 3: 'processo_final' };
  const MAPA_CV = { disponivel: 'disponivel', reservada: 'reservada', vendida: 'vendida', processo_final: 'processo_final', emprocesso: 'processo_final' };
  class Sessao extends Error {}

  async function lerBLL() {
    let tok = '';
    try { tok = localStorage.getItem('@BLL:token') || ''; const p = JSON.parse(tok); if (typeof p === 'string') tok = p; } catch (e) {}
    if (!tok) throw new Sessao('sem login');
    const r = await fetch('/api/unidades/empreendimento/14', { headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store' });
    if (r.status === 401 || r.status === 403) throw new Sessao('401');
    if (!r.ok) throw new Error('BLL respondeu ' + r.status);
    const lista = await r.json();
    const s = {};
    for (const u of lista) { const v = MAPA_BLL[u.status]; if (v && u.numero != null) s[String(u.numero).trim()] = v; }
    return [{ projeto: 'raj-mendes', status: s }];
  }
  async function lerCV() {
    const out = [];
    for (const [id, projeto] of [['23', 'consolacao'], ['28', 'sumare']]) {
      const r = await fetch('/imobiliaria/comercial/mapadisponibilidade/' + id, { credentials: 'include', cache: 'no-store' });
      const html = await r.text();
      const d = new DOMParser().parseFromString(html, 'text/html');
      const blocos = d.querySelectorAll('.disp-bloco');
      if (!blocos.length) { if (/Acesse sua conta|Sua senha/i.test(html)) throw new Sessao('login'); throw new Error('mapa ' + projeto + ' veio vazio'); }
      const s = {};
      blocos.forEach(b => {
        const c = ([...b.classList].find(x => x.startsWith('div-')) || '').replace('div-', '');
        const sp = b.querySelector('span'); const n = sp ? sp.textContent.trim() : '';
        if (n && MAPA_CV[c]) s[n] = MAPA_CV[c];
      });
      out.push({ projeto, status: s });
    }
    return out;
  }

  // ---------- leitura ONE (portal Vimob) ----------
  // Lê o espelho que já está aberto neste quadro. Não abre outra aba (o Vimob derruba a sessão).
  const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const PALETA = { '204,255,204': 'disponivel', '204,0,0': 'vendida', '255,102,0': 'reservada', '0,204,204': 'processo_final' };
  function stTexto(linha) {
    const t = semAcento(linha);
    if (/^DISPONIVEL\b/.test(t)) return 'disponivel';
    if (/^VENDID/.test(t)) return 'vendida';
    if (/^RESERVAD/.test(t)) return 'reservada';
    if (/^(PEND|PAGAMENTO|EM PROCESSO|PROCESSO)/.test(t)) return 'processo_final';
    return null;
  }
  function cor(el) {
    const c = getComputedStyle(el).backgroundColor || '';
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
    if (!m || (m[4] !== undefined && +m[4] === 0)) return null;
    return m[1] + ',' + m[2] + ',' + m[3];
  }
  const BLOCO = /^(DIV|P|TR|TD|TH|LI|TABLE|TBODY|UL|OL|H\d|SECTION|ARTICLE|CENTER|FORM)$/;
  function linhas(el) {                           // texto em linhas, sem depender de o quadro estar visível
    const out = []; let cur = '';
    const quebra = () => { const t = cur.replace(/\s+/g, ' ').trim(); if (t) out.push(t); cur = ''; };
    (function andar(n) {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) cur += c.nodeValue;
        else if (c.nodeType === 1) {
          if (c.tagName === 'SCRIPT' || c.tagName === 'STYLE') continue;
          if (c.tagName === 'BR') { quebra(); continue; }
          const b = BLOCO.test(c.tagName); if (b) quebra();
          andar(c); if (b) quebra();
        }
      }
    })(el);
    quebra(); return out;
  }
  const RE_UNID = /^(\d{1,4})(?:\s+[A-Z0-9]{2,4})?$/i;
  function lerCelulasONE(doc) {
    const cand = [];
    const hist = {};
    for (const el of doc.querySelectorAll('td,div,span,a,li')) {
      const k = cor(el); if (k) hist[k] = (hist[k] || 0) + 1;
      const tx = el.textContent || '';
      if (tx.length > 400 || tx.length < 2) continue;
      const ls = linhas(el); if (!ls.length || ls.length > 12) continue;
      let stt = null, num = null;
      for (const l of ls) {
        if (!stt) stt = stTexto(l);
        if (!num && !/m²|m2|R\$|,/.test(l)) { const m = l.match(RE_UNID); if (m) num = String(parseInt(m[1], 10)); }
      }
      if (!stt && k && PALETA[k]) stt = PALETA[k];
      if (stt && num) cand.push({ el, num, st: stt, k, ls });
    }
    // fica só com as células mais internas
    const set = new Set(cand.map(c => c.el));
    const temFilho = new Set();
    for (const c of cand) { let p = c.el.parentElement; while (p) { if (set.has(p)) temFilho.add(p); p = p.parentElement; } }
    const status = {}; const amostra = []; let dup = 0;
    for (const c of cand) {
      if (temFilho.has(c.el)) continue;
      if (status[c.num]) { dup++; continue; }
      status[c.num] = c.st;
      if (amostra.length < 10 || (c.st !== 'disponivel' && amostra.length < 16)) amostra.push({ tag: c.el.tagName, cls: String(c.el.className || '').slice(0, 60), id: (c.el.id || '').slice(0, 40), cor: c.k, st: c.st, n: c.num, linhas: c.ls.slice(0, 7).map(x => x.slice(0, 40)), attrs: [...c.el.attributes].map(a => a.name).slice(0, 12) });
    }
    return { status, amostra, dup, hist };
  }
  const ehNex = doc => /bela\s*c[iy]ntra|\bnex\b/i.test((doc.title || '') + ' ' + ((doc.body && doc.body.textContent) || '').slice(0, 20000) + ' ' + [...doc.querySelectorAll('select')].map(s => s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : '').join(' '));

  function retrato(doc, leitura) {                // o que o robô enxerga neste quadro (para ajustar a leitura)
    const txt = s => String(s || '').replace(/\s+/g, ' ').trim();
    const trechos = [];
    for (const s of doc.scripts) {
      if (s.src) { trechos.push('src:' + s.src.replace(/\?.*$/, '').slice(-80)); continue; }
      const c = s.textContent || '';
      for (const kw of ['setInterval', 'setTimeout', 'reload', 'location', '__doPostBack', 'ajax', '.asmx', '.ashx', 'PageMethods', 'XMLHttpRequest', 'fetch(', 'window.name', 'sessionStorage']) {
        let i = c.indexOf(kw); let n = 0;
        while (i >= 0 && n < 2 && trechos.length < 40) { trechos.push(kw + ': ' + txt(c.slice(Math.max(0, i - 80), i + 120)).replace(/([?&][\w.]+=)[^&'"\s]*/g, '$1…')); i = c.indexOf(kw, i + 1); n++; }
      }
    }
    const nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    const hist = Object.entries(leitura.hist).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const cont = {}; for (const v of Object.values(leitura.status)) cont[v] = (cont[v] || 0) + 1;
    return {
      versao: VERSAO, em: new Date().toISOString(), caminho: location.pathname, params: [...new URLSearchParams(location.search).keys()],
      topo: TOPO, titulo: txt(doc.title).slice(0, 80), nav: { tipo: nav.type, redirecionamentos: nav.redirectCount },
      referencia: (document.referrer || '').replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''),
      nex: ehNex(doc), celulas: Object.keys(leitura.status).length, contagem: cont, duplicadas: leitura.dup,
      mapa: Object.entries(leitura.status).map(([n, s]) => n + ':' + s[0]).join(','),
      amostra: leitura.amostra, cores: hist,
      forms: [...doc.forms].map(f => ({ id: f.id || f.name, acao: (f.getAttribute('action') || '').replace(/\?.*$/, ''), metodo: f.method, campos: f.elements.length, ocultos: [...f.querySelectorAll('input[type=hidden]')].map(i => i.name || i.id).slice(0, 25) })),
      botoes: [...doc.querySelectorAll('input[type=submit],input[type=button],input[type=image],button,a[href^="javascript"],a[onclick],img[onclick]')].slice(0, 40).map(b => ({ tag: b.tagName, id: (b.id || b.name || '').slice(0, 50), txt: txt(b.value || b.textContent || b.title || b.alt).slice(0, 40), js: txt(b.getAttribute('onclick') || (b.getAttribute('href') || '').replace(/^javascript:/, '')).slice(0, 140) })),
      selects: [...doc.querySelectorAll('select')].slice(0, 10).map(s => ({ id: (s.id || s.name || '').slice(0, 50), sel: s.options[s.selectedIndex] ? txt(s.options[s.selectedIndex].text).slice(0, 60) : null, n: s.options.length, ops: [...s.options].slice(0, 25).map(o => txt(o.text).slice(0, 50)), js: txt(s.getAttribute('onchange')).slice(0, 120) })),
      quadros: [...doc.querySelectorAll('frame,iframe')].map(f => (f.getAttribute('src') || '').replace(/\?.*$/, '') + ' #' + (f.name || f.id || '')),
      meta: [...doc.querySelectorAll('meta[http-equiv]')].map(m => m.getAttribute('http-equiv') + '=' + (m.getAttribute('content') || '').replace(/url=.*/i, 'url=…')),
      scripts: trechos, elementos: doc.getElementsByTagName('*').length,
      inicio: txt(doc.body ? doc.body.textContent : '').slice(0, 700),
    };
  }
  let ultRetrato = 0, ultAssinatura = '';
  async function enviarRetrato(doc, leitura, forcar) {
    const r = retrato(doc, leitura);
    const ass = r.mapa + '|' + r.botoes.length + '|' + r.elementos;
    if (!forcar && ass === ultAssinatura && Date.now() - ultRetrato < 600000) return;
    ultAssinatura = ass; ultRetrato = Date.now();
    try { await rpc('diagnostico_robo', { p_chave: chave(), p_fonte: 'one', p_caminho: location.pathname + (TOPO ? ' (topo)' : ''), p_info: r }); } catch (e) {}
  }
  let recarregado = false, jaSincronizado = false;
  async function lerConfig() {
    try { const c = await rpc('robo_config', { p_chave: chave(), p_fonte: 'one' }); if (c && typeof c === 'object') { cfg = Object.assign(cfg, c); INTERVALO = Math.max(30, cfg.intervalo || 120) * 1000; } }
    catch (e) { if (e && e.status) throw e; }
  }
  function recarregarONE() {                      // só quando configurado no servidor; nunca abre outra aba
    if (!cfg || recarregado) return;
    if (cfg.recarregar === 'quadro') { recarregado = true; location.replace(location.href); }
    else if (cfg.recarregar === 'botao' && cfg.seletor) { const b = document.querySelector(cfg.seletor); if (b) { recarregado = true; b.click(); } }
  }
  async function cicloONE() {
    if (/Sair\.aspx/i.test(location.pathname)) {
      const m = new URLSearchParams(location.search).get('msg');
      if (cfg && cfg.sincronizar && (m === '1' || m === '2' || m === '5')) {
        rpc('alerta_robo', { p_chave: chave(), p_fonte: 'one', p_msg: m === '2' ? 'O portal da ONE saiu porque foi aberto em outra aba. Deixe só uma janela do portal aberta e entre de novo para o NEX Bela Cintra continuar ao vivo.' : 'A sessão do portal da ONE expirou no Chrome do computador — faça login de novo para o NEX Bela Cintra continuar ao vivo.' }).catch(() => {});
      }
      return;
    }
    if (!document.body || document.body.tagName !== 'BODY') return;
    const leitura = lerCelulasONE(document);
    const n = Object.keys(leitura.status).length;
    const espelho = /espelho/i.test(location.pathname);
    if (n < 20 && !espelho) return;               // quadros sem espelho: nada a fazer
    await lerConfig();
    if (n < 20) { mostrar = true; st.aviso = 'abra o espelho do NEX Bela Cintra nesta janela'; await enviarRetrato(document, leitura, false); return; }
    mostrar = true; st.aviso = null;
    const nex = ehNex(document);
    await enviarRetrato(document, leitura, false);
    if (!nex) { st.aviso = 'este espelho não é o do NEX Bela Cintra'; return; }
    if (!cfg || !cfg.sincronizar) { st.fase = 'mapeando'; st.ultimo = Date.now(); return; }
    if (cfg.recarregar === 'nenhum' && jaSincronizado) return;   // sem recarregar, a tela não muda: não finge conferência nova
    if (outroVivo()) { st.fase = 'espera'; return; }
    batimento(); st.fase = 'lendo';
    const res = await rpc('sincronizar', { p_chave: chave(), p_projeto: 'nex-bela-cintra', p_status: leitura.status, p_fonte: 'one' });
    if (res && res.ok === false) throw new Error('leitura incompleta (' + res.lidos + ' de ' + res.total + ')');
    st.ultimo = Date.now(); st.mudancas = res && res.mudancas ? res.mudancas.length : 0; st.fase = 'ok'; jaSincronizado = true;
    batimento();
    setTimeout(recarregarONE, Math.max(30, (cfg.intervalo || 120)) * 1000);
  }

  // ---------- ciclo ----------
  let rodando = false, timer = null;
  async function ciclo() {
    clearTimeout(timer); timer = setTimeout(ciclo, INTERVALO);
    if (rodando) return; rodando = true;
    try {
      if (!chave()) { st.fase = 'sem-chave'; return; }
      if (FONTE === 'one') {
        await cicloONE();
        st.erro = null; st.sessao = false;
        return;
      }
      if (outroVivo()) { st.fase = 'espera'; return; }
      batimento(); st.fase = 'lendo';
      const leituras = FONTE === 'bll' ? await lerBLL() : await lerCV();
      let m = 0;
      for (const l of leituras) {
        const res = await rpc('sincronizar', { p_chave: chave(), p_projeto: l.projeto, p_status: l.status, p_fonte: FONTE });
        if (res && res.ok === false) throw new Error('leitura incompleta de ' + l.projeto);
        m += (res && res.mudancas ? res.mudancas.length : 0);
      }
      st.ultimo = Date.now(); st.mudancas = m; st.erro = null; st.sessao = false; st.fase = 'ok';
      batimento();
    } catch (e) {
      if (e instanceof Sessao) {
        st.sessao = true;
        const msg = FONTE === 'bll' ? 'A sessão da BLL expirou no Chrome do computador — faça login de novo para o espelho do RAJ MENDES continuar ao vivo.'
                                    : 'A sessão do CV CRM expirou no Chrome do computador — faça login de novo para Consolação e Sumaré continuarem ao vivo.';
        rpc('alerta_robo', { p_chave: chave(), p_fonte: FONTE, p_msg: msg }).catch(() => {});
      } else if (e && (e.status === 401 || e.status === 403) && /chave_invalida/.test(e.message || '')) {
        st.erro = 'chave do robô inválida'; gset('chave', '');
      } else {
        st.erro = 'falha temporária (' + String(e && e.message || e).slice(0, 60) + ')';
      }
    } finally { rodando = false; pintar(); }
  }
  pintar();
  setTimeout(ciclo, FONTE === 'one' ? 4000 : 3000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && st.ultimo && Date.now() - st.ultimo > INTERVALO) ciclo(); });
})();
