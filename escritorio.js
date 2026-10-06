/* Escritório Fortal: apresentação do diário existente, sem produzir atividade. */
(function () {
  'use strict';
  const A = window.APP;
  const $ = id => document.getElementById(id);
  const dialog = $('escritorio');
  if (!A || !dialog) return;
  const W = 1672, H = 941;
  const EQUIPE = [
    {id:'genio', nome:'Gênio', papel:'Recepção', sala:0, desc:'Recebe os pedidos do WhatsApp e encaminha à equipe.', box:[224,300,132,124], home:[442,551], exit:[[450,605],[559,661]]},
    {id:'mila', nome:'Mila', papel:'Material', sala:0, desc:'Espelho, fotos, plantas, book e link para o cliente.', box:[398,214,83,93], home:[566,406], exit:[[450,427],[450,605],[559,661]]},
    {id:'flavia', nome:'Flávia', papel:'Fluxo', sala:0, desc:'Fluxo de pagamento, card da proposta e rentabilidade.', box:[648,227,71,94], home:[767,441], exit:[[777,593],[783,665]]},
    {id:'sergio', nome:'Sérgio', papel:'Secretário', sala:0, desc:'Compromissos, avisos no WhatsApp e Google Agenda.', box:[570,336,115,110], home:[753,581], exit:[[783,665]]},
    {id:'otto', nome:'Otto', papel:'Organização', sala:1, desc:'Confere os projetos, avisa buscas salvas e conta o que mudou.', box:[1024,239,88,95], home:[1142,445], exit:[[1143,514],[1120,669],[1040,686]]},
    {id:'teo', nome:'Téo', papel:'Tabelas', sala:1, desc:'Carrega tabelas novas de preço e confere as somas.', box:[1205,248,106,94], home:[1357,463], exit:[[1351,534],[1350,672],[1040,686]]},
    {id:'ro', nome:'Rô', papel:'Robô de status', sala:1, desc:'Acompanha disponível, reservada e vendida nos sistemas das construtoras.', box:[1425,269,103,92], home:[1587,490], exit:[[1593,602],[1562,698],[1350,692],[1040,686]]},
    {id:'murilo', nome:'Murilo', papel:'Mercado', sala:1, desc:'Recebe a Órulo e atualiza as outras incorporadoras.', box:[953,357,118,121], home:[1117,593], exit:[[1120,669],[1040,686]]},
    {id:'dora', nome:'Dora', papel:'Documentos', sala:1, desc:'Fichas, plantas, books e central de documentação.', box:[1192,383,102,119], home:[1351,633], exit:[[1350,681],[1040,686]]},
    {id:'lia', nome:'Lia', papel:'Lupa', sala:1, desc:'Busca para o cliente e links de seleção.', box:[1430,400,129,136], home:[1580,670], exit:[[1546,707],[1350,692],[1040,686]]}
  ];
  const AG = Object.fromEntries(EQUIPE.map((a,i) => [a.id,{...a,index:i,count:0,last:null}]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 820px)');
  const canvas = $('ec-canvas'), ctx = canvas.getContext('2d');
  const scene = $('ec-cena'), viewport = $('ec-rolagem');
  const state = {open:false, epoch:0, code:null, revoked:null, inFlight:null, poll:null, authTimer:null,
    events:[], seen:new Set(), cursor:null, loaded:false, selected:'genio', lastSignal:null, countDay:new Date().toLocaleDateString('en-CA'),
    queue:[], active:null, raf:null, view:mobile.matches?'genio':'geral', focus:null, pushed:false,
    images:null, imagePromise:null, imageError:false, motionReady:false, stock:null, stockAt:0};
  const scriptURL = document.currentScript && document.currentScript.src || location.href;
  const asset = name => new URL(name, scriptURL).href;
  const visible = () => document.visibilityState === 'visible';
  const currentCode = () => typeof A.codigo === 'function' ? String(A.codigo() || '') : '';
  const authorized = () => !!currentCode() && typeof A.nivel === 'function' && A.nivel() === 'admin' && state.revoked !== currentCode();
  const day = d => new Date(d).toLocaleDateString('en-CA');
  const clock = d => new Date(d).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const stamp = d => new Date(d).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const safe = (s, max=160) => typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max) : '';
  const keyOf = e => [e.a,e.t,e.em,e.p || '',e.n == null ? '' : e.n].join('|');

  function text(e) {
    const p = e.p ? ' · '+e.p : '', n = e.n || 1;
    let s;
    switch (e.a) {
      case 'genio': s=e.t==='esclarecimento'?'Explicou a última resposta':e.t==='ajuda'?'Explicou como usar o Gênio':e.t==='nome_cliente'?'Anotou o nome do cliente':'Respondeu uma conversa no WhatsApp'; break;
      case 'mila': s=/^(sugerir|buscar|unidades|mais)$/.test(e.t)?'Enviou unidades no WhatsApp':e.t==='comparar'?'Comparou unidades':e.t==='link'?'Montou um link de seleção':e.t==='material'?'Guardou material novo':'Enviou informação de projeto'; break;
      case 'flavia': s=e.t==='card'?'Fez o card da proposta':e.t==='rentabilidade'?'Fez um estudo de rentabilidade':'Montou um fluxo de pagamento'; break;
      case 'sergio': s=e.t==='google'?'Cuidou da conexão com Google Agenda':e.t==='visita'?'Registrou uma visita':'Anotou um compromisso'; break;
      case 'otto': s=e.t==='conferencia'?'Conferiu '+(n===1?'um projeto':n+' projetos'):e.t==='aviso'?'Avisou uma busca salva':e.t==='mudancas'?'Contou o que mudou nos projetos':e.t==='relatorio'?'Montou o relatório da curadoria':'Anotou um ajuste para a curadoria'; break;
      case 'teo': s='Carregou uma tabela nova'; break;
      case 'ro': s='Registrou '+n+(n===1?' mudança de status':' mudanças de status'); break;
      case 'murilo': s=e.t==='mercado'?'Respondeu sobre o Mercado':e.t==='webhook'?'Recebeu aviso da Órulo':'Atualizou o Mercado com a Órulo'; break;
      case 'dora': s=e.t==='documento'?'Enviou documento da central':'Atualizou a central de documentos'; break;
      case 'lia': s=e.t==='abriu'?'Registrou a abertura de um link':'Criou um link para cliente'; break;
      default: s='Registrou uma atividade';
    }
    return (e.ok===false?'Registro com falha: ':'')+s+p;
  }
  function network(status, message) {
    $('ec-network').dataset.state=status;
    $('ec-sub').textContent=message;
    $('ec-retry').hidden=status!=='error';
  }
  function resetData() {
    state.events=[]; state.seen.clear(); state.cursor=null; state.loaded=false; state.lastSignal=null; state.countDay=day(Date.now());
    state.queue=[]; state.active=null; state.stock=null; state.stockAt=0;
    for (const a of Object.values(AG)) { a.count=0; a.last=null; }
    update(); draw();
  }
  function checkAccess() {
    const code=currentCode();
    if (!authorized()) { closeUI(); resetData(); document.querySelector('#tabs .ec-tab')?.remove(); state.code=null; return false; }
    if (state.code && state.code!==code) { closeUI(); resetData(); state.code=code; return false; }
    state.code=code;
    if (rollDay()) update();
    return true;
  }
  function rollDay() {
    if (state.countDay===day(Date.now())) return false;
    state.countDay=day(Date.now());
    for (const a of Object.values(AG)) a.count=0;
    for (const e of state.events) if (day(e.em)===state.countDay) AG[e.a].count++;
    return true;
  }
  function buildTeam() {
    const list=$('ec-equipe'), hotspots=$('ec-hotspots');
    for (let sala=0;sala<2;sala++) {
      const h=document.createElement('h4'); h.className='ec-team-room'; h.textContent=sala?'Sala do Espelho':'Sala do Gênio'; list.append(h);
      for (const a of EQUIPE.filter(a=>a.sala===sala)) {
        const b=document.createElement('button'); b.type='button'; b.className='ec-ag'; b.dataset.agent=a.id; b.setAttribute('aria-pressed',a.id===state.selected?'true':'false');
        const initial=document.createElement('span'); initial.className='ec-initial'; initial.textContent=a.nome[0]; initial.setAttribute('aria-hidden','true');
        const body=document.createElement('span'), name=document.createElement('strong'), role=document.createElement('small'), count=document.createElement('span');
        name.textContent=a.nome; role.textContent=a.papel; count.className='ec-count'; count.textContent='—'; body.append(name,role); b.append(initial,body,count); b.addEventListener('click',()=>select(a.id,true)); list.append(b);
        const hot=document.createElement('button'); hot.type='button'; hot.className='ec-hotspot'; hot.dataset.agent=a.id; hot.setAttribute('aria-label',a.nome+' · '+a.papel); hot.setAttribute('aria-pressed',a.id===state.selected?'true':'false');
        hot.style.left=(a.box[0]+a.box[2]/2)/W*100+'%'; hot.style.top=(a.box[1]+a.box[3]/2)/H*100+'%';
        const label=document.createElement('span'); label.textContent=a.nome; hot.append(label); hot.addEventListener('click',()=>select(a.id,false)); hotspots.append(hot);
      }
    }
  }
  function select(id, focusRoom) {
    if (!AG[id]) return;
    state.selected=id;
    if (focusRoom && mobile.matches) {
      setView(AG[id].sala?'espelho':'genio');
      requestAnimationFrame(()=>dialog.querySelector('.ec-selected').scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'center'}));
    }
    updateSelection();
  }
  function updateSelection() {
    const a=AG[state.selected];
    $('ec-selected-name').textContent=a.nome; $('ec-selected-role').textContent=a.papel; $('ec-selected-mark').textContent=a.nome[0];
    $('ec-selected-text').textContent=a.last?text(a.last):a.desc;
    const t=$('ec-selected-time');
    if (a.last) { t.dateTime=a.last.em; t.textContent='Último registro · '+stamp(a.last.em); }
    else if (a.id==='ro' && state.lastSignal) { t.dateTime=state.lastSignal; t.textContent='Último sinal do robô · '+stamp(state.lastSignal); }
    else { t.removeAttribute('datetime'); t.textContent=state.loaded?'Sem atividade registrada no diário recebido.':'Aguardando o diário de atividade.'; }
    for (const b of dialog.querySelectorAll('[data-agent]')) b.setAttribute('aria-pressed',b.dataset.agent===state.selected?'true':'false');
  }
  function update() {
    for (const b of dialog.querySelectorAll('.ec-ag')) {
      const a=AG[b.dataset.agent];
      b.querySelector('.ec-count').textContent=state.loaded?String(a.count):'—';
      b.querySelector('.ec-count').setAttribute('aria-label',a.count+' registros hoje');
      b.classList.toggle('is-active',!!state.active && (state.active.agent.id===a.id || state.active.event.a===a.id));
      b.title=a.last?'Último registro: '+text(a.last)+' · '+stamp(a.last.em):a.desc;
    }
    updateSelection();
    const feed=$('ec-mov'); feed.replaceChildren();
    for (const e of state.events.slice(0,12)) {
      const li=document.createElement('li'); li.dataset.eventKey=keyOf(e);
      const time=document.createElement('time'); time.dateTime=e.em; time.textContent=day(e.em)===day(Date.now())?clock(e.em):stamp(e.em); time.title=stamp(e.em);
      const line=document.createElement('div'); line.className='ec-event-line';
      const name=document.createElement('strong'); name.textContent=AG[e.a].nome+' · ';
      const origin=document.createElement('span'); origin.className='ec-origin'; origin.textContent=e.o==='w'?'Pedido do WhatsApp':'Rotina do Espelho';
      line.append(name,document.createTextNode(text(e)),origin); li.append(time,line); feed.append(li);
    }
    $('ec-vazio').hidden=state.events.length>0;
    if (state.loaded && !state.events.length) $('ec-vazio').textContent='Nenhum movimento registrado por enquanto. Os novos registros aparecerão aqui.';
    const count=Object.values(AG).reduce((n,a)=>n+a.count,0);
    $('ec-journal-summary').textContent=state.loaded?count.toLocaleString('pt-BR')+' registros recebidos hoje · últimos 12':'Diário da equipe';
    const tab=document.querySelector('#tabs .ec-tab');
    if (tab) tab.querySelector('small').textContent=state.loaded?count.toLocaleString('pt-BR')+' registros hoje':'Gênio e Espelho';
  }
  function normalize(raw) {
    if (!raw || !AG[raw.a] || typeof raw.em!=='string') return null;
    const ms=Date.parse(raw.em);
    if (!Number.isFinite(ms)) return null;
    return {a:raw.a,t:safe(raw.t,50),em:new Date(ms).toISOString(),p:safe(raw.p,160),
      n:Number.isFinite(Number(raw.n)) && Number(raw.n)>=0?Math.min(10000000,Math.floor(Number(raw.n))):null,o:raw.o==='w'?'w':'',ok:raw.ok!==false};
  }
  function queueEvents(events, first) {
    if (reduced.matches || !state.open || !visible()) return;
    let latest=events.filter(e=>Date.now()-Date.parse(e.em)<600000 && Date.parse(e.em)<=Date.now()+60000).sort((a,b)=>Date.parse(a.em)-Date.parse(b.em));
    if (first) latest=latest.slice(-3);
    else {
      const groups=[];
      for (const e of latest) {
        const last=groups[groups.length-1];
        if (e.o!=='w' && last && last.a===e.a && last.t===e.t && last.o===e.o) groups[groups.length-1]=e;
        else groups.push(e);
      }
      latest=groups.slice(-10);
    }
    state.queue.push(...latest); state.queue=state.queue.slice(-10); animate();
  }
  async function fetchActivity() {
    if (!state.open || !visible() || !checkAccess() || state.inFlight) return;
    const code=state.code, epoch=state.epoch, ticket={}; state.inFlight=ticket;
    if (!state.loaded) network('loading','Consultando o diário…');
    try {
      const args={p_codigo:code}; if (state.cursor) args.p_desde=state.cursor;
      const result=await A.rpc('escritorio_atividade',args);
      if (!state.open || epoch!==state.epoch || code!==currentCode()) return;
      if (!checkAccess()) return;
      if (result && (result.erro==='so_admin' || result.error==='so_admin')) { state.revoked=code; checkAccess(); return; }
      if (!result || result.ok!==true || !Array.isArray(result.eventos)) throw new Error('unavailable');
      const valid=result.eventos.map(normalize).filter(Boolean);
      const invalid=result.eventos.length-valid.length;
      if (invalid && !valid.length) throw new Error('invalid events');
      const fresh=[], first=!state.loaded;
      rollDay();
      for (const e of valid) {
        const key=keyOf(e); if (state.seen.has(key)) continue;
        state.seen.add(key); fresh.push(e); state.events.push(e);
        const a=AG[e.a]; if (!a.last || Date.parse(e.em)>Date.parse(a.last.em)) a.last=e;
        if (day(e.em)===day(Date.now())) a.count++;
      }
      state.events.sort((a,b)=>Date.parse(b.em)-Date.parse(a.em)); state.events=state.events.slice(0,60);
      // Cursor overlap is two seconds. Older keys can be evicted without recounting that overlap.
      if (state.seen.size>3000) state.seen=new Set(state.events.map(keyOf));
      if (valid.length) { const max=Math.max(...valid.map(e=>Date.parse(e.em)),state.cursor?Date.parse(state.cursor)+2000:0); state.cursor=new Date(max-2000).toISOString(); }
      const signals=(Array.isArray(result.robos)?result.robos:[]).map(r=>Date.parse(r?.visto_em)).filter(Number.isFinite);
      if (signals.length) state.lastSignal=new Date(Math.max(...signals)).toISOString();
      state.loaded=true; update(); draw();
      network(invalid?'error':'ok',invalid?'Alguns registros não puderam ser lidos.':'Diário atualizado às '+clock(Date.now()));
      queueEvents(fresh,first);
    } catch (_) {
      if (state.open && epoch===state.epoch && code===currentCode()) {
        network('error',state.loaded?'Sem conexão com o diário. Exibindo os últimos registros.':'Não foi possível consultar o diário.');
        if (!state.events.length) $('ec-vazio').textContent='O diário está indisponível. Tente novamente para consultar a atividade da equipe.';
      }
    } finally { if (state.inFlight===ticket) state.inFlight=null; }
  }

  // The panorama is lazy-loaded. Original seated people are restored when a movement ends.
  function loadImage(name) { return new Promise((resolve,reject)=>{const i=new Image(); i.onload=()=>resolve(i); i.onerror=reject; i.src=asset(name);}); }
  async function loadScene() {
    if (state.imagePromise) return state.imagePromise;
    state.imagePromise=(async()=>{
      try {
        const base=await loadImage('escritorio-cenario.png'); state.images={base}; $('ec-scene-loading').hidden=true; draw();
        try {
          const [empty,people]=await Promise.all([loadImage('escritorio-vazio.png'),loadImage('escritorio-agentes.png')]);
          if (base.naturalWidth!==empty.naturalWidth || base.naturalHeight!==empty.naturalHeight) throw new Error('alignment');
          state.images.empty=empty; state.images.people=people; state.motionReady=true; motionNote(); animate();
        } catch (_) { state.imageError=true; state.queue=[]; motionNote(); }
      } catch (_) { state.imageError=true; $('ec-scene-loading').textContent='O cenário não carregou. A atividade continua disponível na lista.'; }
    })();
    return state.imagePromise;
  }
  function motionNote() {
    $('ec-motion-note').textContent=reduced.matches?'Movimento reduzido ativo. Acompanhe os registros no diário abaixo.':state.imageError?'Movimento indisponível. Os registros continuam disponíveis na lista.':'Movimentos representam registros do diário, sem reproduzir a duração real das tarefas.';
  }
  function measure() {
    const width=Math.max(1,Math.round(scene.getBoundingClientRect().width));
    const ratio=Math.min(devicePixelRatio || 1,2);
    const pixels=Math.min(3840,Math.round(width*ratio));
    if (canvas.width!==pixels) { canvas.width=pixels; canvas.height=Math.round(pixels*H/W); }
    draw();
  }
  function setView(view) {
    state.view=view; scene.dataset.view=view;
    for (const b of dialog.querySelectorAll('[data-room]')) b.setAttribute('aria-pressed',b.dataset.room===view?'true':'false');
    requestAnimationFrame(()=>{measure(); viewport.scrollTo({left:view==='espelho'?viewport.scrollWidth:0,behavior:reduced.matches?'auto':'smooth'});});
  }
  const DOOR=[813,719], HUB=[1040,686];
  function deliveryRoute(target) {
    const start=AG.genio;
    if (target.id==='genio') return [start.home,[463,580],start.home];
    const route=[start.home,...start.exit];
    if (target.sala===1) route.push(DOOR,[932,701],HUB);
    else route.push([783,665]);
    route.push(...target.exit.slice().reverse(),target.home);
    return [...route,...route.slice(0,-1).reverse()];
  }
  function routineRoute(a) {
    // Explicit aisle routes follow the approved floor perspective, never the former tile map.
    const stop=a.exit[Math.min(1,a.exit.length-1)] || a.home;
    return [a.home,...a.exit.slice(0,2),stop,...a.exit.slice(0,2).reverse(),a.home];
  }
  function beginEvent(event, now) {
    const target=AG[event.a], agent=event.o==='w'?AG.genio:target;
    const route=event.o==='w'?deliveryRoute(target):routineRoute(target);
    state.active={event,agent,route,started:now,duration:event.o==='w'?6400:3200}; update();
  }
  function pointOnPath(route, progress) {
    const lengths=[]; let total=0;
    for (let i=1;i<route.length;i++) { const d=Math.hypot(route[i][0]-route[i-1][0],route[i][1]-route[i-1][1]); lengths.push(d); total+=d; }
    let rest=total*Math.max(0,Math.min(1,progress));
    for (let i=0;i<lengths.length;i++) { if (rest<=lengths[i] || i===lengths.length-1) {const t=lengths[i]?rest/lengths[i]:0;return [route[i][0]+(route[i+1][0]-route[i][0])*t,route[i][1]+(route[i+1][1]-route[i][1])*t];} rest-=lengths[i]; }
    return route[0];
  }
  function maskPerson(a) {
    const [x,y,w,h]=a.box;
    ctx.save(); ctx.beginPath();
    // Soft corners keep the clean plate local to the seated silhouette and its chair.
    ctx.roundRect(x-3,y-3,w+6,h+7,Math.min(18,w/5)); ctx.clip();
    ctx.drawImage(state.images.empty,0,0,W,H); ctx.restore();
  }
  function stockData() {
    if (!authorized() || state.code!==currentCode()) return {available:false,d:0,r:0,v:0,o:0};
    if (state.stock && Date.now()-state.stockAt<60000) return state.stock;
    let data;
    try { data=typeof A.dados==='function'?A.dados():null; } catch (_) {}
    const totals={available:Array.isArray(data?.projetos),d:0,r:0,v:0,o:0};
    for (const p of Array.isArray(data?.projetos)?data.projetos:[]) for (const u of Array.isArray(p?.unidades)?p.unidades:[]) {
      if (!Array.isArray(u)) continue;
      if (u[6]==='disponivel') totals.d++;
      else if (u[6]==='reservada') totals.r++;
      else if (u[6]==='vendida') totals.v++;
      else totals.o++;
    }
    state.stock=totals; state.stockAt=Date.now();
    return totals;
  }
  function stockBoard() {
    const s=stockData(), total=s.d+s.r+s.v+s.o;
    const caption=$('ec-stock');
    const label=!s.available?'Quadro de estoque: base ainda não carregada.':!total?'Quadro de estoque: nenhuma unidade na base carregada.':'Base carregada · '+s.d.toLocaleString('pt-BR')+' disponíveis · '+s.r.toLocaleString('pt-BR')+' reservadas · '+s.v.toLocaleString('pt-BR')+' vendidas'+(s.o?' · '+s.o.toLocaleString('pt-BR')+' em outros status':'')+'. Quadro proporcional.';
    if (caption && caption.textContent!==label) caption.textContent=label;
    ctx.save();
    // Cover every illustrated status cell, preserving the TV frame and right skyline screen.
    ctx.beginPath(); ctx.moveTo(1125,124);ctx.lineTo(1368,137);ctx.lineTo(1364,255);ctx.lineTo(1120,232);ctx.closePath();ctx.clip();
    ctx.fillStyle='#13283c';ctx.fillRect(1118,120,255,139);
    ctx.transform(1,.060,-.045,1,1128,128);
    ctx.fillStyle='#e8c387';ctx.font='600 12px system-ui';ctx.fillText('ESPELHO DE VENDAS',10,17);
    if (!s.available || !total) {
      ctx.fillStyle='#d0dbe4';ctx.font='13px system-ui';ctx.fillText(!s.available?'Base sem dados':'Sem unidades',10,51);
      ctx.fillStyle='#99adbd';ctx.font='11px system-ui';ctx.fillText('Aguardando a base carregada',10,71);
    } else {
      const nd=Math.round(78*s.d/total),nr=Math.round(78*s.r/total),nv=Math.round(78*s.v/total);
      for (let i=0;i<78;i++) {ctx.fillStyle=i<nd?'#86c6a5':i<nd+nr?'#dfb56e':i<nd+nr+nv?'#c98280':'#697e8e';ctx.fillRect(10+(i%13)*16.5,27+Math.floor(i/13)*9,14,7);}
      ctx.fillStyle='#d1dde6';ctx.font='11px system-ui';ctx.fillText('Proporção da base carregada',10,96);
    }
    ctx.restore();
  }
  const CROPS=[
    [99,0,199,498],[438,0,185,498],[746,0,185,498],[1054,0,199,498],[1390,0,201,498],
    [91,499,203,442],[441,499,200,442],[741,499,202,442],[1070,499,206,442],[1390,499,203,442]
  ];
  function drawPerson(a, position, now) {
    const [sx,sy,sw,sh]=CROPS[a.index], [x,y]=position;
    const height=225+(y-400)*.22, width=height*sw/sh;
    const bob=Math.sin(now/94)*1.0;
    ctx.save(); ctx.translate(x,y); ctx.fillStyle='rgba(6,12,20,.24)'; ctx.beginPath(); ctx.ellipse(0,-2,width*.37,5,0,0,Math.PI*2); ctx.fill();
    ctx.rotate(Math.sin(now/188)*.009); ctx.drawImage(state.images.people,sx,sy,sw,sh,-width/2,-height+bob,width,height); ctx.restore();
  }
  function envelope(progress) {
    const x=96+(437-96)*progress, y=650+(520-650)*progress-Math.sin(progress*Math.PI)*70;
    ctx.save(); ctx.translate(x,y);ctx.rotate(-.2);ctx.fillStyle='#fff1d4';ctx.strokeStyle='#bd914c';ctx.lineWidth=1.3;ctx.fillRect(-11,-7,22,14);ctx.strokeRect(-11,-7,22,14);ctx.beginPath();ctx.moveTo(-11,-7);ctx.lineTo(0,2);ctx.lineTo(11,-7);ctx.stroke();ctx.restore();
  }
  function draw(now=performance.now()) {
    if (!ctx || !state.images?.base) return;
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.clearRect(0,0,W,H); ctx.drawImage(state.images.base,0,0,W,H);
    const job=state.active;
    if (!job || !state.motionReady || reduced.matches) {stockBoard();return;}
    const p=Math.min(1,(now-job.started)/job.duration);
    if (job.event.o==='w' && p<.1) { stockBoard();envelope(p/.1);return; }
    const progress=job.event.o==='w'?(p-.1)/.9:p;
    maskPerson(job.agent); stockBoard();drawPerson(job.agent,pointOnPath(job.route,progress),now);
  }
  function frame(now) {
    state.raf=null;
    if (!state.open || !visible() || !authorized() || reduced.matches || !state.motionReady) {state.active=null;draw();return;}
    if (!state.active && state.queue.length) beginEvent(state.queue.shift(),now);
    if (state.active && now-state.active.started>=state.active.duration) { state.active=null; update(); }
    draw(now);
    if (state.active || state.queue.length) state.raf=requestAnimationFrame(frame);
  }
  function animate() { if (!state.raf && state.open && visible() && state.motionReady && !reduced.matches && (state.queue.length || state.active)) state.raf=requestAnimationFrame(frame); }
  function stopAnimation() { if (state.raf) cancelAnimationFrame(state.raf);state.raf=null;state.active=null;state.queue=[];draw();update(); }
  function addTab() {
    if (!authorized()) { document.querySelector('#tabs .ec-tab')?.remove(); if (state.open) checkAccess(); return; }
    const nav=$('tabs'); if (!nav || nav.querySelector('.ec-tab')) return;
    const b=document.createElement('button'); b.type='button'; b.className='tab ec-tab';
    const title=document.createElement('b');title.textContent='Escritório'; const sub=document.createElement('small');sub.textContent='Gênio e Espelho';b.append(title,sub);b.addEventListener('click',open);nav.append(b);nav.hidden=false;update();
  }
  function open() {
    if (!checkAccess() || state.open) return;
    state.open=true; state.epoch++; state.focus=document.activeElement;
    dialog.hidden=false; document.body.classList.add('ec-aberto');
    if (location.hash!=='#escritorio') {try{history.pushState({ec:1},'','#escritorio');state.pushed=true;}catch(_){}}
    setView(state.view); loadScene(); motionNote(); $('ec-voltar').focus();
    $('ec-tv').hidden=!(document.fullscreenEnabled && dialog.requestFullscreen);
    fetchActivity(); state.poll=setInterval(fetchActivity,8000);state.authTimer=setInterval(checkAccess,1000);
  }
  function closeUI() {
    if (!state.open) return;
    state.open=false;state.epoch++;state.inFlight=null;dialog.hidden=true;document.body.classList.remove('ec-aberto');
    clearInterval(state.poll);clearInterval(state.authTimer);state.poll=null;state.authTimer=null;stopAnimation();
    if (document.fullscreenElement===dialog && document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    if (state.focus?.isConnected) state.focus.focus();
  }
  function close() {
    const pushed=state.pushed;state.pushed=false;closeUI();
    if (pushed && location.hash==='#escritorio') history.back();
    else if (location.hash==='#escritorio') {try{history.replaceState(null,'',location.pathname+location.search);}catch(_){}}
  }
  const stockCaption=document.createElement('p');stockCaption.id='ec-stock';stockCaption.className='ec-stock';stockCaption.textContent='Quadro de estoque: aguardando a base carregada.';dialog.querySelector('.ec-scene-footer').append(stockCaption);
  buildTeam(); setView(state.view);
  $('ec-voltar').addEventListener('click',close);$('ec-retry').addEventListener('click',fetchActivity);
  $('ec-tv').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else dialog.requestFullscreen?.().catch(()=>{});});
  for (const b of dialog.querySelectorAll('[data-room]')) b.addEventListener('click',()=>setView(b.dataset.room));
  let drag=null;
  viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='touch' || e.button!==0 || e.target.closest('button'))return;drag={x:e.clientX,left:viewport.scrollLeft};viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');});
  viewport.addEventListener('pointermove',e=>{if(drag)viewport.scrollLeft=drag.left-(e.clientX-drag.x);});
  for(const type of ['pointerup','pointercancel','lostpointercapture']) viewport.addEventListener(type,()=>{drag=null;viewport.classList.remove('is-dragging');});
  viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();viewport.scrollBy({left:(e.key==='ArrowRight'?1:-1)*viewport.clientWidth*.65,behavior:reduced.matches?'auto':'smooth'});}});
  dialog.addEventListener('keydown',e=>{
    if(e.key==='Escape' && !document.fullscreenElement){e.preventDefault();close();}
    if(e.key==='Tab') {const targets=[...dialog.querySelectorAll('button:not([hidden]),[tabindex="0"]')].filter(n=>n.getClientRects().length);const first=targets[0],last=targets[targets.length-1];if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}}
  });
  document.addEventListener('visibilitychange',()=>{if(!state.open)return;if(!visible())stopAnimation();else if(checkAccess()){measure();fetchActivity();}});
  window.addEventListener('resize',()=>{if(state.open)measure();});
  if (typeof ResizeObserver==='function') new ResizeObserver(()=>{if(state.open)measure();}).observe(scene);
  reduced.addEventListener('change',()=>{stopAnimation();motionNote();});
  mobile.addEventListener('change',()=>setView(mobile.matches?'genio':'geral'));
  window.addEventListener('popstate',()=>{if(state.open && location.hash!=='#escritorio'){state.pushed=false;closeUI();}});
  window.addEventListener('hashchange',()=>{if(location.hash==='#escritorio' && !state.open)open();else if(location.hash!=='#escritorio' && state.open)closeUI();});
  const previous=window.__onProjeto;
  window.__onProjeto=function(...args){try{if(typeof previous==='function')previous.apply(this,args);}catch(_){}state.stock=null;state.stockAt=0;addTab();if(state.open){checkAccess();draw();}};
  let attempts=0;
  (function whenReady(){addTab();if(authorized()){if(location.hash==='#escritorio')open();return;}if(++attempts<20)setTimeout(whenReady,1500);})();
  window.ESCRITORIO={abrir:open,fechar:close};
})();
