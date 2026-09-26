// ==UserScript==
// @name         Robô do Espelho de Vendas
// @namespace    https://luizmiguel08.github.io/espelhos/
// @version      1.0.0
// @description  Lê a disponibilidade na BLL (RAJ MENDES) e no CV CRM (Nurban Consolação e Sumaré) a cada minuto e atualiza o app Espelhos de Vendas. Só lê; não altera nada nos sistemas.
// @match        https://app.blladv.com.br/*
// @match        https://vitaurbana.cvcrm.com.br/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @noframes
// @updateURL    https://luizmiguel08.github.io/espelhos/robo.user.js
// @downloadURL  https://luizmiguel08.github.io/espelhos/robo.user.js
// ==/UserScript==

(function () {
  'use strict';
  const API = 'https://dptchfjbotmddaniuzvr.supabase.co/rest/v1/rpc/';
  const KEY = 'sb_publishable_K9--vOhW8y5ldlbwzo6m_Q_g_gB9rYP';
  const host = location.hostname;
  const FONTE = host.includes('blladv') ? 'bll' : host.includes('cvcrm') ? 'cv' : null;
  if (!FONTE) return;
  const INTERVALO = FONTE === 'bll' ? 60000 : 90000;
  const ID = Math.random().toString(36).slice(2);
  const st = { fase: 'iniciando', ultimo: null, mudancas: 0, erro: null, sessao: false };

  // ---------- armazenamento (compartilhado entre as abas do robô) ----------
  const gget = (k, d) => { try { return GM_getValue(k, d); } catch (e) { return d; } };
  const gset = (k, v) => { try { GM_setValue(k, v); } catch (e) {} };
  const chave = () => (gget('chave', '') || '').trim();
  function batimento() {
    const hb = { id: ID, t: Date.now() };
    gset('hb:' + FONTE, hb);
    try { localStorage.setItem('roboEspelho:hb', JSON.stringify(hb)); } catch (e) {}
  }
  function outroVivo() { const hb = gget('hb:' + FONTE, null); return hb && hb.id !== ID && (Date.now() - hb.t) < 150000; }

  // ---------- selo na tela ----------
  const host$ = document.createElement('div');
  host$.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:2147483646';
  const sh = host$.attachShadow({ mode: 'open' });
  sh.innerHTML = `<style>
    .b{font:12px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#182030;color:#eef1f7;border-radius:10px;padding:7px 10px;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:300px;display:flex;flex-direction:column;gap:6px}
    .l{display:flex;align-items:center;gap:7px;cursor:pointer}
    .d{width:8px;height:8px;border-radius:50%;background:#8b94a6;flex:none}
    .ok .d{background:#34b233}.warn .d{background:#e0a100}.bad .d{background:#e8473a}
    .f{display:none;gap:6px}.aberto .f{display:flex}
    input{flex:1;min-width:0;border:0;border-radius:6px;padding:5px 7px;font:inherit;color:#182030}
    button{border:0;border-radius:6px;padding:5px 9px;font:inherit;font-weight:600;background:#7d97ff;color:#0b1230;cursor:pointer}
    small{opacity:.75}
  </style><div class="b" id="b"><div class="l" id="l"><span class="d"></span><span id="t">Robô do Espelho</span></div>
  <div class="f"><input id="k" type="password" placeholder="Cole a chave do robô (ROBO-...)" autocomplete="off"><button id="s">Salvar</button></div></div>`;
  const $ = id => sh.getElementById(id);
  const montar = () => { if (document.body && !host$.isConnected) document.body.appendChild(host$); };
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
    else if (st.fase === 'espera') { b.classList.add('ok'); txt = 'Robô do Espelho: outra aba já está atualizando'; }
    else if (st.ultimo) { b.classList.add('ok'); txt = 'Robô do Espelho · ao vivo · ' + hora(st.ultimo) + (st.mudancas ? ' · ' + st.mudancas + ' mudança(s)' : ''); }
    else txt = 'Robô do Espelho · iniciando…';
    $('t').textContent = txt;
  }

  // ---------- leitura ----------
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
  async function rpc(fn, args) {
    const r = await fetch(API + fn, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
    const t = await r.text();
    if (!r.ok) { const e = new Error(t); e.status = r.status; throw e; }
    return t ? JSON.parse(t) : null;
  }

  // ---------- ciclo ----------
  let rodando = false, timer = null;
  async function ciclo() {
    clearTimeout(timer); timer = setTimeout(ciclo, INTERVALO);
    if (rodando) return; rodando = true;
    try {
      if (!chave()) { st.fase = 'sem-chave'; return; }
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
  setTimeout(ciclo, 3000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && st.ultimo && Date.now() - st.ultimo > INTERVALO) ciclo(); });
})();
