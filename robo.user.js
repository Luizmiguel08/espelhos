// ==UserScript==
// @name         Robô do Espelho de Vendas
// @namespace    https://luizmiguel08.github.io/espelhos/
// @version      1.6.0
// @description  Lê a disponibilidade na BLL, no CV CRM e no portal da ONE (a lista de projetos vem do servidor) e atualiza o app Espelhos de Vendas. Só lê; não altera nada nos sistemas (na ONE, lê os outros empreendimentos em segundo plano, sem mexer na tela).
// @match        https://app.blladv.com.br/*
// @match        https://vitaurbana.cvcrm.com.br/*
// @match        https://portaldevendas.oneinnovation.com.br/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      dptchfjbotmddaniuzvr.supabase.co
// @run-at       document-idle
// @updateURL    https://luizmiguel08.github.io/espelhos/robo.user.js
// @downloadURL  https://luizmiguel08.github.io/espelhos/robo.user.js
// ==/UserScript==

(function () {
  'use strict';
  const API = 'https://dptchfjbotmddaniuzvr.supabase.co/rest/v1/rpc/';
  const KEY = 'sb_publishable_K9--vOhW8y5ldlbwzo6m_Q_g_gB9rYP';
  const VERSAO = '1.6.0';
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

  let cfgFonte = null;
  async function lerConfigFonte() {
    try { const c = await rpc('robo_config', { p_chave: chave(), p_fonte: FONTE }); if (c && typeof c === 'object') cfgFonte = c; }
    catch (e) { if (e && (e.status === 401 || e.status === 403)) throw e; }
  }
  async function lerBLL() {
    let tok = '';
    try { tok = localStorage.getItem('@BLL:token') || ''; const p = JSON.parse(tok); if (typeof p === 'string') tok = p; } catch (e) {}
    if (!tok) throw new Sessao('sem login');
    const lista = (cfgFonte && Array.isArray(cfgFonte.empreendimentos) && cfgFonte.empreendimentos.length) ? cfgFonte.empreendimentos : [{ id: 14, projeto: 'raj-mendes' }];
    const out = [];
    for (const e of lista) {
      const r = await fetch('/api/unidades/empreendimento/' + encodeURIComponent(e.id), { headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store' });
      if (r.status === 401 || r.status === 403) throw new Sessao('401');
      if (!r.ok) { out.push({ projeto: e.projeto, erro: 'BLL respondeu ' + r.status }); continue; }
      const us = await r.json();
      const s = {};
      for (const u of us) { const v = MAPA_BLL[u.status]; if (v && u.numero != null) s[String(u.numero).trim()] = v; }
      out.push({ projeto: e.projeto, status: s });
    }
    return out;
  }
  async function lerCV() {
    const out = [];
    const mapas = (cfgFonte && Array.isArray(cfgFonte.mapas) && cfgFonte.mapas.length) ? cfgFonte.mapas.map(m => [String(m.id), m.projeto]) : [['23', 'consolacao'], ['28', 'sumare']];
    for (const [id, projeto] of mapas) {
      // um mapa com problema não derruba os outros (a lista vem do servidor e inclui os projetos da VitaUrbana em rodízio)
      let html;
      try {
        const r = await fetch('/imobiliaria/comercial/mapadisponibilidade/' + id, { credentials: 'include', cache: 'no-store' });
        html = await r.text();
      } catch (e) { out.push({ projeto, erro: 'rede' }); continue; }
      const d = new DOMParser().parseFromString(html, 'text/html');
      const blocos = d.querySelectorAll('.disp-bloco');
      if (!blocos.length) { if (/Acesse sua conta|Sua senha/i.test(html)) throw new Sessao('login'); out.push({ projeto, erro: 'mapa vazio' }); continue; }
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
  const RE_UNID = /^(?:apto\.?|apartamento|unid(?:ade)?\.?|ap\.?|loja|sala)?\s*(\d{1,4})(?:\s*[-–]?\s*[A-Z][A-Z0-9]{1,3})?$/i;
  function acharNumero(ls) {
    for (const l of ls) {
      if (/m²|m2\b|R\$/i.test(l) || /\d[.,]\d/.test(l)) continue;
      const m = l.match(RE_UNID); if (m) return String(parseInt(m[1], 10));
    }
    return null;
  }
  function linhasVis(el) {                        // texto visível (innerText); se o quadro estiver oculto, cai no texto bruto
    const it = (el.innerText || '').split('\n').map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
    return it.length ? it : linhas(el);
  }
  const semValores = h => h.replace(/="[^"]{40,}"/g, '="…"').replace(/='[^']{40,}'/g, "='…'");
  // linhas úteis da célula (status, número/tipo, m², preço, tipologia): as visíveis e depois as ocultas, no máximo 8.
  // Outras linhas (ex.: quem está com a reserva) não são enviadas.
  const UTIL = /m²|m2\b|R\$|^\d|dorm|stud|su[ií]te|garden|cobert|duplex|loja|sala|vaga|\b(NR|HIS|HMP|R2V|RES|FA)\b|dispon|vend|reserv|pend|bloq|permut|indisp|process/i;
  function detalhe(el, vis) {
    const out = vis.filter(l => UTIL.test(l)).slice(0, 8);
    try { for (const l of linhas(el)) { if (out.length >= 8) break; if (UTIL.test(l) && !out.includes(l)) out.push(l); } } catch (e) {}
    return out.map(x => x.slice(0, 40));
  }
  function lerCelulasONE(doc) {
    const PAL = Object.assign({}, PALETA, (cfg && cfg.paleta) || {});
    const hist = {}, coloridos = [];
    for (const el of doc.querySelectorAll('td,div,span,a,li,button,section,article,p')) {
      const k = cor(el); if (!k) continue;
      hist[k] = (hist[k] || 0) + 1;
      if (PAL[k]) coloridos.push({ el, k });
    }
    // quantos quadradinhos coloridos cada ancestral contém (para não pegar número do vizinho)
    const conta = new Map();
    for (const c of coloridos) { let p = c.el.parentElement, i = 0; while (p && i < 4) { conta.set(p, (conta.get(p) || 0) + 1); p = p.parentElement; i++; } }
    const status = {}, det = {}, amostra = [], semNumero = []; let dup = 0;
    const dentro = new Set(coloridos.map(c => c.el));
    for (const c of coloridos) {
      // se um colorido está dentro de outro colorido da mesma cor, fica com o mais interno
      let p = c.el.parentElement, aninhado = false; for (let i = 0; p && i < 3; i++, p = p.parentElement) if (dentro.has(p)) { aninhado = true; break; }
      let ls = linhasVis(c.el), num = acharNumero(ls), stt = null;
      for (const l of ls) { stt = stTexto(l); if (stt) break; }
      if (!num) { let q = c.el.parentElement; for (let i = 0; q && i < 3 && (conta.get(q) || 0) <= 1; i++, q = q.parentElement) { const l2 = linhasVis(q); num = acharNumero(l2); if (num) { if (!stt) for (const l of l2) { stt = stTexto(l); if (stt) break; } break; } } }
      if (!stt) stt = PAL[c.k];
      if (!num) { if (semNumero.length < 4) semNumero.push({ tag: c.el.tagName, cor: c.k, linhas: ls.slice(0, 6).map(x => x.slice(0, 40)), html: semValores(c.el.outerHTML).slice(0, 500) }); continue; }
      if (status[num]) { if (!aninhado) dup++; continue; }
      status[num] = stt; det[num] = detalhe(c.el, ls);
      if (!det[num].some(l => /R\$|\d{1,3}(\.\d{3})+,\d{2}/.test(l))) {   // preço fora do quadradinho colorido?
        let q = c.el.parentElement;
        for (let i = 0; q && i < 3 && (conta.get(q) || 0) <= 1; i++, q = q.parentElement) {
          const extra = detalhe(q, linhasVis(q)).filter(l => /R\$|\d{1,3}(\.\d{3})+,\d{2}/.test(l) && !det[num].includes(l));
          if (extra.length) { det[num] = det[num].concat(extra).slice(0, 8); break; }
        }
      }
      if (amostra.length < 6 || (stt !== 'disponivel' && amostra.length < 12)) amostra.push({ tag: c.el.tagName, cls: String(c.el.className || '').slice(0, 60), cor: c.k, st: stt, n: num, linhas: ls.slice(0, 7).map(x => x.slice(0, 40)) });
    }
    // amostras cruas por cor (para ajustar a leitura se precisar)
    const cruas = [];
    for (const k of Object.keys(PAL)) {
      coloridos.filter(c => c.k === k).slice(0, 2).forEach(c => {
        const pais = []; let q = c.el.parentElement; for (let i = 0; q && i < 4; i++, q = q.parentElement) pais.push(q.tagName + '.' + String(q.className || '').slice(0, 30) + ' [' + (q.textContent || '').length + ']');
        cruas.push({ cor: k, tag: c.el.tagName, texto: (c.el.innerText || '').slice(0, 160), tamTexto: (c.el.textContent || '').length, html: semValores(c.el.outerHTML).slice(0, 700), pais });
      });
    }
    return { status, det, amostra, dup, hist, semNumero, cruas, coloridos: coloridos.length, els: coloridos.slice(0, 6).map(c => c.el) };
  }
  const ehNex = doc => (cfg && cfg.nome ? new RegExp(cfg.nome, 'i') : /bela\s*c[iy]ntra|\bnex\b/i).test((doc.title || '') + ' ' + ((doc.body && doc.body.textContent) || '').slice(0, 20000) + ' ' + [...doc.querySelectorAll('select')].map(s => s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : '').join(' '));

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
      topo: TOPO, titulo: txt(doc.title).slice(0, 80), rotulo: rotuloEspelho(doc), nav: { tipo: nav.type, redirecionamentos: nav.redirectCount },
      referencia: (document.referrer || '').replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''),
      nex: ehNex(doc), celulas: Object.keys(leitura.status).length, contagem: cont, duplicadas: leitura.dup,
      mapa: Object.entries(leitura.status).map(([n, s]) => n + ':' + s[0]).join(','),
      amostra: leitura.amostra, cores: hist, coloridos: leitura.coloridos, semNumero: leitura.semNumero, cruas: leitura.cruas,
      funcoes: funcoesPagina(), controles: controlesDX(),
      forms: [...doc.forms].map(f => ({ id: f.id || f.name, acao: (f.getAttribute('action') || '').replace(/\?.*$/, ''), metodo: f.method, campos: f.elements.length, ocultos: [...f.querySelectorAll('input[type=hidden]')].map(i => i.name || i.id).slice(0, 25) })),
      botoes: [...doc.querySelectorAll('input[type=submit],input[type=button],input[type=image],button,a[href^="javascript"],a[onclick],img[onclick]')].slice(0, 40).map(b => ({ tag: b.tagName, id: (b.id || b.name || '').slice(0, 50), txt: txt(b.value || b.textContent || b.title || b.alt).slice(0, 40), js: txt(b.getAttribute('onclick') || (b.getAttribute('href') || '').replace(/^javascript:/, '')).slice(0, 140) })),
      selects: [...doc.querySelectorAll('select')].slice(0, 10).map(s => ({ id: (s.id || s.name || '').slice(0, 50), sel: s.options[s.selectedIndex] ? txt(s.options[s.selectedIndex].text).slice(0, 60) : null, n: s.options.length, ops: [...s.options].slice(0, 25).map(o => txt(o.text).slice(0, 50)), js: txt(s.getAttribute('onchange')).slice(0, 120) })),
      quadros: [...doc.querySelectorAll('frame,iframe')].map(f => (f.getAttribute('src') || '').replace(/\?.*$/, '') + ' #' + (f.name || f.id || '')),
      meta: [...doc.querySelectorAll('meta[http-equiv]')].map(m => m.getAttribute('http-equiv') + '=' + (m.getAttribute('content') || '').replace(/url=.*/i, 'url=…')),
      scripts: trechos, elementos: doc.getElementsByTagName('*').length,
      inicio: txt(doc.body ? doc.body.textContent : '').slice(0, 700),
    };
  }
  const W = (typeof unsafeWindow !== 'undefined' && unsafeWindow) || window;
  function funcoesPagina() {
    const out = [];
    try { for (const k of Object.keys(W)) { if (out.length >= 30) break; if (!/espelho|atualiz|pesquis|refresh|recarreg|callback|mapa|filtr/i.test(k)) continue; const f = W[k]; if (typeof f === 'function') out.push(k + ': ' + String(f).replace(/\s+/g, ' ').slice(0, 220)); } } catch (e) {}
    return out;
  }
  function controlesDX() {
    const out = [];
    try { const col = W.ASPxClientControl && W.ASPxClientControl.GetControlCollection(); if (col && col.ForEachControl) col.ForEachControl(c => { if (out.length < 40 && /espelho|cbp|callback|grid|mapa/i.test(c.name || '')) out.push((c.name || '').replace(/^ctl00_RoundPanelConteudo_cphConteudo_/, '…') + ' :: ' + (c.constructor && c.constructor.name || typeof c) + (typeof c.PerformCallback === 'function' ? ' [callback]' : '')); }); } catch (e) { out.push('erro: ' + String(e).slice(0, 80)); }
    return out;
  }
  // ---------- ONE: rótulo do espelho, descoberta e rodízio dos empreendimentos (só leitura, mesma janela) ----------
  const limpa = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const semSegredo = s => s.replace(/([?&][\w.]+=)[^&'"\s]*/g, '$1…').replace(/[A-Za-z0-9+/=_-]{40,}/g, '…');
  const dormir = ms => new Promise(r => setTimeout(r, ms));
  function dxCol() { try { return W.ASPxClientControl && W.ASPxClientControl.GetControlCollection(); } catch (e) { return null; } }
  function dxAchar(sufixo) {                      // controle DevExpress da página cujo nome termina com o sufixo
    const col = dxCol(); let r = null;
    try { if (col && col.ForEachControl) col.ForEachControl(c => { if (!r && c && typeof c.name === 'string' && c.name.endsWith(sufixo)) r = c; }); } catch (e) {}
    return r;
  }
  function emCallback() {                         // algum controle da página ainda carregando?
    const col = dxCol(); let ocupado = false;
    try { if (col && col.ForEachControl) col.ForEachControl(c => { try { if (!ocupado && c && typeof c.InCallback === 'function' && c.InCallback()) ocupado = true; } catch (e) {} }); } catch (e) {}
    return ocupado;
  }
  function rotuloEspelho(doc) {                   // texto que identifica qual espelho está na tela
    const sel = (cfg && cfg.rotulo_sel) || '[id$="rpnEspelho_HTC_lblEspelho"]';
    try { return [...doc.querySelectorAll(sel)].map(el => limpa(el.textContent)).filter(Boolean).join(' | ').slice(0, 250); } catch (e) { return ''; }
  }
  function eventosDX(c) {                         // funções ligadas aos eventos do controle (ex.: clique no nó da árvore)
    const out = {};
    try {
      for (const k in c) {
        let v; try { v = c[k]; } catch (e) { continue; }
        if (v && typeof v === 'object' && Array.isArray(v.handlerInfoList) && v.handlerInfoList.length)
          out[k] = v.handlerInfoList.slice(0, 3).map(h => semSegredo(limpa(String(h && h.handler))).slice(0, 600));
      }
    } catch (e) {}
    return out;
  }
  function propsDX(c) {
    const out = {};
    try {
      for (const k in c) {
        if (Object.keys(out).length >= 30) break;
        if (!/^cp|^properties$|focused|selected|^key|nodeKey|expanded/i.test(k)) continue;
        let v; try { v = c[k]; } catch (e) { continue; }
        if (v == null || typeof v === 'function' || (typeof v === 'object' && v.nodeType)) continue;
        try { out[k] = semSegredo(JSON.stringify(v)).slice(0, 800); } catch (e) {}
      }
    } catch (e) {}
    return out;
  }
  function descobrirONE(doc) {                    // o que existe na página para trocar de empreendimento (nada é clicado aqui)
    const d = { rotulo: rotuloEspelho(doc) };
    const tree = dxAchar('_treEmpBlo');
    if (tree) {
      const a = { nome: tree.name.replace(/^ctl00_RoundPanelConteudo_cphConteudo_/, '…'), eventos: eventosDX(tree), props: propsDX(tree) };
      try { a.foco = tree.GetFocusedNodeKey ? tree.GetFocusedNodeKey() : null; } catch (e) {}
      try {
        const ks = tree.GetVisibleNodeKeys ? tree.GetVisibleNodeKeys() : [];
        a.total = ks.length;
        a.nos = ks.slice(0, 400).map(k => {
          let el = null, t = null, estado = null, recuo = null;
          try { el = tree.GetNodeHtmlElement(k); } catch (e) {}
          if (el) { t = limpa(el.textContent).slice(0, 90); recuo = el.querySelectorAll('td[class*="Indent"],td[class*="dxtl__I"]').length; }
          try { estado = tree.GetNodeState ? tree.GetNodeState(k) : null; } catch (e) {}
          return [k, t, estado, recuo];
        });
        a.amostras = ks.slice(0, 3).map(k => { try { const el = tree.GetNodeHtmlElement(k); return el ? semValores(el.outerHTML).slice(0, 1500) : null; } catch (e) { return null; } });
      } catch (e) { a.erro = String(e).slice(0, 160); }
      d.arvore = a;
    }
    const elArv = doc.querySelector('[id$="_treEmpBlo"]');
    if (elArv && !(d.arvore && d.arvore.total)) d.arvoreHtml = semValores(elArv.outerHTML).slice(0, 8000);
    d.combos = {};
    for (const suf of ['_cboFiltroEmp', '_cboFaseObraEmp']) {
      const c = dxAchar(suf); if (!c) continue;
      const o = { eventos: eventosDX(c) };
      try { const n = c.GetItemCount(); o.n = n; o.itens = []; for (let i = 0; i < Math.min(n, 300); i++) { const it = c.GetItem(i); o.itens.push([limpa(it.text).slice(0, 90), it.value]); } } catch (e) { o.erro = String(e).slice(0, 120); }
      try { o.valor = c.GetValue(); o.texto = c.GetText(); } catch (e) {}
      d.combos[suf.slice(1)] = o;
    }
    d.controles = {};
    for (const suf of ['_cbpEspelho', '_btnPesquisar', '_btnLimpar', '_btnRefresh', '_hdfEspelhoVendas', '_popEspelhoEmpreendimento', '_txtFiltroPesquisa', '_rpnEspelho']) {
      const c = dxAchar(suf); if (!c) continue;
      const o = { nome: c.name.replace(/^ctl00_RoundPanelConteudo_cphConteudo_/, '…'), eventos: eventosDX(c), props: propsDX(c) };
      try { if (c.properties) o.valores = semSegredo(JSON.stringify(c.properties)).slice(0, 1500); } catch (e) {}
      d.controles[suf.slice(1)] = o;
    }
    d.rotulos = {};
    for (const suf of ['lblQtdEmpreendimentos', 'lblSemEmpreendimentos', 'lblTreeList', 'lblFiltroPesquisa', 'lblEmpreendimento', 'lblEmprendimento', 'lblLocalizacao', 'lblFaseObra', 'lblAreaM2', 'lblEspelho']) {
      const el = doc.querySelector('[id$="_' + suf + '"]'); if (el) d.rotulos[suf] = limpa(el.textContent).slice(0, 200);
    }
    const tr = [];
    for (const s of doc.scripts) {
      if (s.src) continue;
      const c = s.textContent || '';
      for (const kw of ['treEmpBlo', 'cbpEspelho', 'NodeClick', 'FocusedNodeChanged', 'PerformCallback', 'hdfEspelhoVendas', 'EspelhoVendas']) {
        let i = c.indexOf(kw), n = 0;
        while (i >= 0 && n < 3 && tr.length < 40) { tr.push(kw + ': ' + semSegredo(limpa(c.slice(Math.max(0, i - 160), i + 260)))); i = c.indexOf(kw, i + kw.length); n++; }
      }
    }
    d.trechos = tr;
    const fx = [];
    try { for (const k of Object.keys(W)) { if (fx.length >= 40) break; if (!/espelho|bloco|empreend|arvore|tree|carreg|unidade/i.test(k)) continue; let f; try { f = W[k]; } catch (e) { continue; } if (typeof f === 'function') fx.push(k + ': ' + semSegredo(limpa(String(f))).slice(0, 500)); } } catch (e) {}
    d.funcoes = fx;
    try {
      const l = lerCelulasONE(doc), am = [];
      for (const el of doc.querySelectorAll('td,div,span,a,li')) {
        if (am.length >= 2) break;
        if (cor(el) !== '204,255,204') continue;           // só disponíveis (sem nome de quem reservou)
        am.push({ html: semValores(el.outerHTML).slice(0, 1200), pai: el.parentElement ? semValores(el.parentElement.outerHTML).slice(0, 2500) : null, linhas: linhasVis(el).slice(0, 8), brutas: linhas(el).slice(0, 12) });
      }
      d.celulas = am; d.detalhe = Object.entries(l.det).slice(0, 5);
    } catch (e) { d.celulas = String(e).slice(0, 120); }
    return d;
  }
  let ultDescoberta = 0;
  async function enviarDescoberta(doc) {
    if (Date.now() - ultDescoberta < 600000) return;          // no máximo a cada 10 min
    ultDescoberta = Date.now();
    let d; try { d = descobrirONE(doc); } catch (e) { d = { erro: String(e).slice(0, 200) }; }
    try { await rpc('diagnostico_robo', { p_chave: chave(), p_fonte: 'one', p_caminho: '/descoberta', p_info: { versao: VERSAO, em: new Date().toISOString(), descoberta: d } }); } catch (e) {}
  }

  // uso do portal por uma pessoa (qualquer quadro): o rodízio pausa para não atrapalhar
  const USO = 'uso:one';
  if (FONTE === 'one') {
    let ultUso = 0;
    const marcaUso = e => { if (!e.isTrusted) return; const t = Date.now(); if (t - ultUso < 5000) return; ultUso = t; gset(USO, t); };
    ['mousedown', 'keydown', 'wheel', 'touchstart'].forEach(ev => { try { window.addEventListener(ev, marcaUso, { capture: true, passive: true }); } catch (e) {} });
  }
  const emUso = () => Date.now() - (gget(USO, 0) || 0) < Math.max(30, (cfg && cfg.pausa_uso) || 180) * 1000;

  // ações de navegação: só trocam o que aparece no espelho; nunca em botão/opção de reserva, proposta, envio etc.
  const PROIBIDO = /reserv|propost|confirm|enviar|salvar|gravar|exclu|apagar|logoff|sair|cancel|descart|recuper|vender|compr|aprov|assin|contrat|pagar|boleto/i;
  function clicar(el) {
    const o = { bubbles: true, cancelable: true };
    try { el.dispatchEvent(new MouseEvent('mousedown', o)); el.dispatchEvent(new MouseEvent('mouseup', o)); } catch (e) {}
    el.click();
  }
  async function esperarLivre(ms) { const t0 = Date.now(); await dormir(300); while (Date.now() - t0 < ms && emCallback()) await dormir(300); }
  function acharNo(tree, a) {
    if (a.chave != null) return String(a.chave);
    if (!a.texto) return null;
    const re = new RegExp(a.texto, 'i');
    try { return (tree.GetVisibleNodeKeys() || []).find(k => { const el = tree.GetNodeHtmlElement(k); return el && re.test(limpa(el.textContent)); }) || null; } catch (e) { return null; }
  }
  async function executar(a) {                    // devolve null se deu certo, ou o motivo
    if (!a || !a.tipo) return 'sem ação';
    if (a.tipo === 'no' || a.tipo === 'expandir') {
      const tree = dxAchar(a.arvore || '_treEmpBlo'); if (!tree) return 'árvore não encontrada';
      for (const k of [].concat(a.expandir || [])) { try { if (tree.GetNodeState && tree.GetNodeState(String(k)) === 'Collapsed') { tree.ExpandNode(String(k)); await esperarLivre(15000); } } catch (e) {} }
      if (a.tipo === 'expandir') return null;
      const k = acharNo(tree, a); if (k == null) return 'nó não encontrado';
      let row = null; try { row = tree.GetNodeHtmlElement(k); } catch (e) {}
      if (!row) return 'nó sem elemento';
      const el = (a.sel && row.querySelector(a.sel)) || [...row.querySelectorAll('td')].reverse().find(td => limpa(td.textContent)) || row;
      if (PROIBIDO.test(limpa(el.textContent) + ' ' + (el.id || ''))) return 'bloqueado';
      clicar(el); return null;
    }
    if (a.tipo === 'callback') {
      const c = dxAchar(a.controle || '_cbpEspelho'); if (!c || typeof c.PerformCallback !== 'function') return 'controle não encontrado';
      if (PROIBIDO.test(c.name)) return 'bloqueado';
      if (a.hdf) { const h = dxAchar(a.hdf.controle || '_hdfEspelhoVendas'); if (h && h.Set) for (const [kk, vv] of Object.entries(a.hdf.valores || {})) h.Set(kk, vv); }
      c.PerformCallback(a.arg == null ? '' : String(a.arg)); return null;
    }
    if (a.tipo === 'combo') {
      const c = dxAchar(a.controle || '_cboFiltroEmp'); if (!c) return 'combo não encontrado';
      if (a.valor != null) c.SetValue(a.valor);
      else if (a.texto) { const re = new RegExp(a.texto, 'i'); let i = -1; for (let j = 0; j < c.GetItemCount(); j++) if (re.test(c.GetItem(j).text)) { i = j; break; } if (i < 0) return 'item não encontrado'; c.SetSelectedIndex(i); }
      if (a.disparar) { try { const ev = c.SelectedIndexChanged; if (ev && ev.FireEvent) ev.FireEvent(c, {}); } catch (e) {} }
      if (a.botao) {
        const b = dxAchar(a.botao); if (!b) return 'botão não encontrado';
        let tb = ''; try { tb = b.GetText ? b.GetText() : ''; } catch (e) {}
        if (PROIBIDO.test(b.name + ' ' + tb)) return 'bloqueado';
        if (typeof b.DoClick === 'function') b.DoClick(); else { const el = document.getElementById(b.name); if (!el) return 'botão sem elemento'; clicar(el); }
      }
      return null;
    }
    if (a.tipo === 'clique') {
      let el = null; try { el = document.querySelector(a.sel); } catch (e) {}
      if (!el) return 'elemento não encontrado';
      if (PROIBIDO.test(limpa(el.textContent) + ' ' + (el.id || '') + ' ' + (el.value || '') + ' ' + (el.getAttribute('onclick') || '') + ' ' + (el.getAttribute('href') || ''))) return 'bloqueado';
      clicar(el); return null;
    }
    if (a.tipo === 'funcao') {
      if (!/^[A-Za-z_$][\w$]*$/.test(a.nome || '') || PROIBIDO.test(a.nome)) return 'bloqueado';
      const f = W[a.nome]; if (typeof f !== 'function') return 'função não encontrada';
      f.apply(W, (a.args || []).filter(x => x == null || ['string', 'number', 'boolean'].includes(typeof x))); return null;
    }
    return 'ação desconhecida';
  }
  async function esperarEspelho(antes, re, ms) {  // espera o espelho ser trocado (células antigas saem da página) e estabilizar
    const t0 = Date.now(); let ult = null;
    while (Date.now() - t0 < ms) {
      await dormir(700);
      if (emCallback()) continue;
      if (antes && antes.length && !antes.some(el => !el.isConnected)) continue;
      const rot = rotuloEspelho(document);
      if (re && !re.test(rot)) continue;
      const l = lerCelulasONE(document); const ks = Object.keys(l.status);
      if (!ks.length) continue;
      const ass = ks.length + '|' + ks.slice(0, 12).join(',') + '|' + rot;
      if (ass === ult) return { leitura: l, rotulo: rot };
      ult = ass;
    }
    return null;
  }
  async function enviarLeitura(a, l, rot, info) {
    let cel = null;
    if (l) { cel = {}; for (const [n, s] of Object.entries(l.status)) cel[n] = a.det === false ? s : [s].concat(l.det[n] || []); }
    const inf = Object.assign({ versao: VERSAO, em: new Date().toISOString() }, info || {});
    if (l) { const cont = {}; for (const v of Object.values(l.status)) cont[v] = (cont[v] || 0) + 1; inf.contagem = cont; inf.n = Object.keys(l.status).length; inf.dup = l.dup; inf.semNumero = l.semNumero; inf.cores = Object.entries(l.hist).sort((x, y) => y[1] - x[1]).slice(0, 14); }
    try { await rpc('leitura_robo', { p_chave: chave(), p_fonte: 'one', p_alvo: String(a.alvo), p_projeto: a.projeto || null, p_rotulo: rot || null, p_celulas: cel, p_info: inf }); }
    catch (e) { if (e && (e.status === 401 || e.status === 403)) throw e; }
  }
  const rodizioLigado = () => !!(cfg && Array.isArray(cfg.alvos) && cfg.alvos.length && cfg.rotulo_casa && cfg.casa);
  let navegando = false, ultRodizio = 0, ultVolta = 0;
  async function voltarCasa() {                   // volta para o espelho do NEX Bela Cintra
    const reCasa = new RegExp(cfg.rotulo_casa, 'i');
    if (reCasa.test(rotuloEspelho(document))) return true;
    const antes = lerCelulasONE(document).els;
    const err = await executar(cfg.casa).catch(e => String(e && e.message || e));
    if (err) { st.aviso = 'não consegui voltar para o NEX Bela Cintra (' + err + ')'; return false; }
    return !!(await esperarEspelho(antes, reCasa, Math.max(5, cfg.espera || 25) * 1000));
  }
  async function rodizioONE() {                   // lê alguns empreendimentos por vez e volta para o Bela Cintra
    if (!rodizioLigado() || navegando) return;
    if (Date.now() - ultRodizio < Math.max(30, cfg.rodizio_cada || 90) * 1000) return;
    if (emUso()) { st.aviso = 'outros empreendimentos: pausado enquanto alguém usa o portal'; return; }
    const alvos = cfg.alvos.filter(a => a && a.alvo && a.acao);
    if (!alvos.length) return;
    ultRodizio = Date.now(); navegando = true;
    const k = Math.min(Math.max(1, cfg.alvos_por_ciclo || 2), alvos.length);
    let pos = (+gget('pos:one', 0) || 0) % alvos.length;
    let lidos = 0;
    try {
      for (let i = 0; i < k; i++) {
        if (emUso()) break;
        const a = alvos[pos]; pos = (pos + 1) % alvos.length; gset('pos:one', pos);
        const t0 = Date.now();
        const antes = lerCelulasONE(document).els;
        const err = await executar(a.acao).catch(e => 'erro: ' + String(e && e.message || e).slice(0, 80));
        if (err) { await enviarLeitura(a, null, rotuloEspelho(document), { erro: err }); continue; }
        const r = await esperarEspelho(antes, a.rotulo ? new RegExp(a.rotulo, 'i') : null, Math.max(5, cfg.espera || 25) * 1000);
        if (!r) { await enviarLeitura(a, null, rotuloEspelho(document), { erro: 'tempo', ms: Date.now() - t0 }); continue; }
        await enviarLeitura(a, r.leitura, r.rotulo, { ms: Date.now() - t0 });
        lidos++;
        if (a.sync && a.projeto && a.rotulo) {
          try { const res = await rpc('sincronizar', { p_chave: chave(), p_projeto: a.projeto, p_status: r.leitura.status, p_fonte: 'one' }); if (res && res.mudancas) st.mudancas += res.mudancas.length; }
          catch (e) { if (e && (e.status === 401 || e.status === 403)) throw e; }
        }
      }
    } finally {
      try { await voltarCasa(); } catch (e) {}
      navegando = false;
      if (lidos) st.aviso = null;
    }
  }

  // ---------- ONE: espelho completo de outros empreendimentos, lido em segundo plano (sem mexer na tela) ----------
  // Busca a mesma página que o portal abre no botão "Espelho completo do produto" (EspelhoEmpreendimento.aspx?Emp=...),
  // só leitura, e lê as unidades do HTML. Não navega, não abre aba e não clica em nada.
  const LS_DONO = 'roboEspelho:dono:' + FONTE, LS_POSC = 'roboEspelho:posc:' + FONTE;
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  async function souDono() {                      // se houver duas cópias do robô na mesma página, só uma trabalha
    const ttl = Math.max(150000, INTERVALO * 2.5);
    let d = lsGet(LS_DONO);
    if (d && d.id !== ID && Date.now() - d.t < ttl) return false;
    if (!d || d.id !== ID) { lsSet(LS_DONO, { id: ID, t: Date.now() }); await dormir(300 + Math.random() * 900); d = lsGet(LS_DONO); if (!d || d.id !== ID) return false; }
    lsSet(LS_DONO, { id: ID, t: Date.now() }); return true;
  }
  function rgbDe(s) {
    s = String(s || '').trim().toLowerCase();
    let m = s.match(/^#([0-9a-f]{6})$/); if (m) { const v = parseInt(m[1], 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255].join(','); }
    m = s.match(/^#([0-9a-f]{3})$/); if (m) return m[1].split('').map(c => parseInt(c + c, 16)).join(',');
    m = s.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/); if (m) return m[1] + ',' + m[2] + ',' + m[3];
    return null;
  }
  function corInline(el) {                        // cor de fundo escrita no HTML (sem CSS calculado)
    if (!el || !el.getAttribute) return null;
    const b = el.getAttribute('bgcolor'); if (b) return rgbDe(b);
    const m = (el.getAttribute('style') || '').match(/background(?:-color)?\s*:\s*(#[0-9a-f]{3,6}|rgba?\([^)]*\))/i);
    return m ? rgbDe(m[1]) : null;
  }
  const RE_RS = /R\$|\d{1,3}(\.\d{3})+,\d{2}/;
  function lerCelulasDoc(doc, opt) {              // unidades de um documento sem renderização (DOMParser)
    opt = opt || {};
    const PAL = Object.assign({}, PALETA, (cfg && cfg.paleta) || {});
    const reNum = opt.num_re ? new RegExp(opt.num_re, 'i') : null;
    const numDe = ls => { if (reNum) { for (const l of ls) { const m = l.match(reNum); if (m) return String(parseInt(m[1], 10)); } return null; } return acharNumero(ls); };
    const hist = {};
    for (const el of doc.querySelectorAll('[style*="background"],[bgcolor]')) { const k = corInline(el); if (k) hist[k] = (hist[k] || 0) + 1; }
    const base = opt.celula_sel ? [...doc.querySelectorAll(opt.celula_sel)] : [...doc.querySelectorAll('td,div,span,a,li,p,section,article')];
    const cand = new Map();
    for (const el of base) {
      const tl = (el.textContent || '').length;
      if (!opt.celula_sel && (tl < 4 || tl > 400)) continue;
      const ls = linhas(el); if (!ls.length || ls.length > 25) continue;
      const num = numDe(ls); if (!num) continue;
      let stt = null; for (const l of ls) { stt = stTexto(l); if (stt) break; }
      let k = null;
      if (!stt && opt.textos) { for (const l of ls) { for (const [re, v] of Object.entries(opt.textos)) { if (new RegExp(re, 'i').test(l)) { stt = v; break; } } if (stt) break; } }
      if (!stt) { let q = el; for (let i = 0; q && i < 3 && !stt; i++, q = q.parentElement) { k = corInline(q); if (k && PAL[k]) stt = PAL[k]; } }
      if (!stt && opt.classes) { let q = el; for (let i = 0; q && i < 3 && !stt; i++, q = q.parentElement) { const cl = String(q.className || ''); for (const [c, v] of Object.entries(opt.classes)) { if (cl.includes(c)) { stt = v; break; } } } }
      if (!stt || !['disponivel', 'reservada', 'processo_final', 'vendida'].includes(stt)) continue;
      cand.set(el, { el, num, stt, ls, cor: k });
    }
    const achados = [];                            // fica com o mais interno quando um candidato contém outro
    for (const c of cand.values()) { let tem = false; for (const d of c.el.querySelectorAll('*')) { if (cand.has(d)) { tem = true; break; } } if (!tem) achados.push(c); }
    // blocos/torres: pelo seletor do servidor ou, havendo números repetidos, pelo ancestral com id "_IT<n>_"
    const grupos = new Map(); const gDe = el => {
      let g = null;
      if (opt.grupo_sel) { const a = el.closest(opt.grupo_sel); if (a) g = a; }
      if (!g) { for (let q = el.parentElement; q; q = q.parentElement) { if (q.id && /_IT\d+(_|$)/.test(q.id)) { g = q; break; } } }
      if (!g) return 0;
      if (!grupos.has(g)) grupos.set(g, { i: grupos.size, rotulo: limpa((linhas(g)[0] || '')).slice(0, 80), n: 0 });
      return grupos.get(g).i;
    };
    const vistos = {}; let dup = 0;
    for (const c of achados) { c.g = gDe(c.el); vistos[c.num] = (vistos[c.num] || 0) + 1; if (vistos[c.num] > 1) dup++; }
    const status = {}, det = {}; const porGrupo = dup > 0 || !!opt.grupo_sel;
    for (const c of achados) {
      const key = porGrupo && grupos.size > 1 ? c.g + '|' + c.num : c.num;
      if (status[key]) continue;
      status[key] = c.stt; det[key] = c.ls.filter(l => UTIL.test(l)).slice(0, 8).map(x => x.slice(0, 40));
      if (grupos.size) for (const g of grupos.values()) if (g.i === c.g) g.n++;
    }
    return { status, det, dup, hist, achados, grupos: [...grupos.values()] };
  }
  function diagCompleto(doc, html, r, l, ms) {    // retrato da página buscada (para ajustar a leitura pelo servidor)
    const anc = el => { const o = []; for (let q = el.parentElement, i = 0; q && i < 5; i++, q = q.parentElement) o.push(q.tagName + (q.id ? '#' + q.id.slice(-40) : '') + (q.className ? '.' + String(q.className).slice(0, 30) : '')); return o; };
    const cont = {}; for (const v of Object.values(l.status)) cont[v] = (cont[v] || 0) + 1;
    const cab = []; for (const el of doc.querySelectorAll('span,td,div,h1,h2,h3,a,label')) { if (cab.length >= 15) break; const t = limpa(el.textContent); if (t.length < 90 && /Livre|Bloco|Torre|Fase|Espelho/i.test(t) && !cab.includes(t)) cab.push(t); }
    return { http: r.status, caminho: (r.url || '').replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''), tam: html.length, ms,
      titulo: limpa(doc.title).slice(0, 80), elementos: doc.getElementsByTagName('*').length, n: Object.keys(l.status).length, dup: l.dup, contagem: cont,
      cores: Object.entries(l.hist).sort((a, b) => b[1] - a[1]).slice(0, 12), grupos: l.grupos.slice(0, 20), cabecalhos: cab,
      amostras: l.achados.filter(c => c.stt === 'disponivel').concat(l.achados.filter(c => c.stt !== 'disponivel')).slice(0, 3)
        .map(c => ({ st: c.stt, html: semValores(c.el.outerHTML).slice(0, 700), anc: anc(c.el), linhas: (c.stt === 'disponivel' ? c.ls : c.ls.filter(x => UTIL.test(x))).slice(0, 8).map(x => x.slice(0, 40)) })),
      inicio: l.achados.length ? undefined : limpa(doc.body ? doc.body.textContent : '').slice(0, 1200),
      html: l.achados.length ? undefined : semValores(doc.body ? doc.body.innerHTML : html).replace(/\s+/g, ' ').slice(0, 3000) };
  }
  async function lerCompletoONE(a) {
    const url = a.url || ('/Vendas/EspelhoEmpreendimento.aspx?Emp=' + encodeURIComponent(a.emp));
    const t0 = Date.now(); let r, html;
    try { r = await fetch(url, { credentials: 'include', cache: 'no-store' }); html = await r.text(); }
    catch (e) { return { info: { erro: 'rede', ms: Date.now() - t0 } }; }
    const fim = (r.url || '').replace(/^https?:\/\/[^/]+/, '');
    if (/sair\.aspx|login/i.test(fim) || /type=["']?password/i.test(html)) return { sessao: true, info: { erro: 'sessao', caminho: fim.replace(/\?.*$/, ''), http: r.status } };
    if (!r.ok) return { info: { erro: 'http ' + r.status, ms: Date.now() - t0 } };
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const l = lerCelulasDoc(doc, (cfg && cfg.completo) || {});
    const info = diagCompleto(doc, html, r, l, Date.now() - t0);
    const rot = a.rotulo_sel ? limpa((doc.querySelector(a.rotulo_sel) || {}).textContent) : (info.cabecalhos[0] || info.titulo);
    return { leitura: Object.keys(l.status).length ? l : null, rotulo: rot, info };
  }
  let ultCompleto = 0, buscando = false;
  async function completosONE() {
    const lista = ((cfg && cfg.completos) || []).filter(a => a && a.alvo && (a.emp || a.url));
    if (!lista.length || buscando) return;
    if (Date.now() - ultCompleto < Math.max(20, cfg.completos_cada || 90) * 1000) return;
    if (!(await souDono())) return;
    buscando = true; ultCompleto = Date.now();
    const k = Math.min(Math.max(1, cfg.completos_por_ciclo || 2), lista.length);
    let pos = (+lsGet(LS_POSC) || 0) % lista.length;
    try {
      for (let i = 0; i < k; i++) {
        const a = lista[pos]; pos = (pos + 1) % lista.length; lsSet(LS_POSC, pos);
        const r = await lerCompletoONE(a);
        if (r.sessao) { st.aviso = 'o portal pediu login ao ler outro empreendimento; pausado'; ultCompleto = Date.now() + 600000; await enviarLeitura(a, null, null, r.info); break; }
        if (r.info && r.info.erro === 'rede') { await enviarLeitura(a, null, null, r.info); break; }   // falha de rede: tenta no próximo ciclo
        const l = r.leitura;
        await enviarLeitura(a, l ? { status: l.status, det: l.det, dup: l.dup, semNumero: [], hist: l.hist } : null, r.rotulo || null, r.info);
        if (l && a.sync && a.projeto) {
          try { const res = await rpc('sincronizar', { p_chave: chave(), p_projeto: a.projeto, p_status: l.status, p_fonte: 'one' }); if (res && res.mudancas) st.mudancas += res.mudancas.length; }
          catch (e) { if (e && (e.status === 401 || e.status === 403)) throw e; }
        }
        await dormir(1500 + Math.random() * 1500);
      }
    } finally { buscando = false; }
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
  let tRecarga = null;
  function agendarRecarga() { clearTimeout(tRecarga); tRecarga = setTimeout(recarregarONE, Math.max(30, (cfg.intervalo || 120)) * 1000); }
  function recarregarONE() {                      // só quando configurado no servidor; nunca abre outra aba
    if (!cfg || recarregado) return;
    if (navegando) { agendarRecarga(); return; }  // no meio do rodízio: deixa para depois
    if (cfg.recarregar === 'quadro') { recarregado = true; location.replace(location.href); }
    else if (cfg.recarregar === 'botao' && cfg.seletor) { const b = document.querySelector(cfg.seletor); if (b) { recarregado = true; b.click(); } }
    else if (cfg.recarregar === 'callback' && cfg.controle) { try { const c = W.ASPxClientControl.GetControlCollection().GetByName(cfg.controle); if (c && c.PerformCallback) { recarregado = true; c.PerformCallback(cfg.arg || ''); } } catch (e) {} }
    else if (cfg.recarregar === 'funcao' && cfg.funcao && typeof W[cfg.funcao] === 'function') { recarregado = true; try { W[cfg.funcao](); } catch (e) {} }
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
    // com o rodízio ligado, o Bela Cintra é reconhecido pelo rótulo do espelho (a árvore lista todos os empreendimentos)
    const rot = rotuloEspelho(document);
    const naCasa = cfg && cfg.rotulo_casa ? new RegExp(cfg.rotulo_casa, 'i').test(rot) : null;
    if (naCasa === false && rodizioLigado() && !navegando && !emUso() && Date.now() - ultVolta > 60000) {
      ultVolta = Date.now(); navegando = true;
      try { await voltarCasa(); } finally { navegando = false; }
      return;
    }
    if (n < 20) { mostrar = true; st.aviso = 'abra o espelho do NEX Bela Cintra nesta janela'; await enviarRetrato(document, leitura, false); if (cfg && cfg.descobrir !== false) await enviarDescoberta(document); return; }
    mostrar = true; st.aviso = null;
    const nex = naCasa === null ? ehNex(document) : naCasa;
    await enviarRetrato(document, leitura, false);
    if (cfg && cfg.descobrir !== false) await enviarDescoberta(document);
    if (!nex) { st.aviso = 'este espelho não é o do NEX Bela Cintra'; return; }
    if (!cfg || !cfg.sincronizar) { st.fase = 'mapeando'; st.ultimo = Date.now(); return; }
    if (cfg.recarregar === 'nenhum' && jaSincronizado) return;   // sem recarregar, a tela não muda: não finge conferência nova
    if (outroVivo()) { st.fase = 'espera'; return; }
    batimento(); st.fase = 'lendo';
    const res = await rpc('sincronizar', { p_chave: chave(), p_projeto: cfg.projeto || 'nex-bela-cintra', p_status: leitura.status, p_fonte: 'one' });
    if (res && res.ok === false) throw new Error('leitura incompleta (' + res.lidos + ' de ' + res.total + ')');
    st.ultimo = Date.now(); st.mudancas = res && res.mudancas ? res.mudancas.length : 0; st.fase = 'ok'; jaSincronizado = true;
    batimento();
    agendarRecarga();
    if (rodizioLigado()) await rodizioONE();      // outros empreendimentos da ONE (poucos por vez) e volta para o Bela Cintra
    if (cfg && Array.isArray(cfg.completos) && cfg.completos.length) await completosONE();   // outros empreendimentos, em segundo plano
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
      await lerConfigFonte();
      const leituras = FONTE === 'bll' ? await lerBLL() : await lerCV();
      let m = 0; const falhas = [];
      for (const l of leituras) {
        if (l.erro) { falhas.push(l.projeto); continue; }
        try {
          const res = await rpc('sincronizar', { p_chave: chave(), p_projeto: l.projeto, p_status: l.status, p_fonte: FONTE });
          if (res && res.ok === false) { falhas.push(l.projeto); continue; }
          m += (res && res.mudancas ? res.mudancas.length : 0);
        } catch (e) { if (e && (e.status === 401 || e.status === 403)) throw e; falhas.push(l.projeto); }
      }
      if (falhas.length === leituras.length && leituras.length) throw new Error('não consegui ler ' + falhas.join(', '));
      st.ultimo = Date.now(); st.mudancas = m; st.erro = null; st.sessao = false; st.fase = 'ok';
      st.aviso = falhas.length ? 'não consegui ler ' + falhas.join(', ') : null;
      batimento();
    } catch (e) {
      if (e instanceof Sessao) {
        st.sessao = true;
        const msg = FONTE === 'bll' ? 'A sessão da BLL expirou no Chrome do computador — faça login de novo para o espelho do RAJ MENDES continuar ao vivo.'
                                    : 'A sessão do CV CRM expirou no Chrome do computador — faça login de novo para os projetos do CV (Consolação, Sumaré e VitaUrbana) continuarem ao vivo.';
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
  if (FONTE === 'one' && document.body && document.body.tagName === 'BODY') {
    let tMut = null, ultMut = 0;
    new MutationObserver(() => {
      clearTimeout(tMut);
      tMut = setTimeout(() => { if (Date.now() - ultMut < 15000) return; ultMut = Date.now(); jaSincronizado = false; recarregado = false; ciclo(); }, 4000);
    }).observe(document.body, { childList: true, subtree: true });
    [15000, 35000].forEach(t => setTimeout(() => { if (!st.ultimo) ciclo(); }, t));
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && st.ultimo && Date.now() - st.ultimo > INTERVALO) ciclo(); });
})();
