(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ag=id=>AGENCIES.find(a=>a.id===id);
const money=c=>(c.currency==='USD'?'US$ ':'$ ')+c.price.toLocaleString('es-AR');
const img=c=>'images/auto-'+c.photo+'.jpg';
const type=c=>/Hilux|Ranger|Amarok/.test(c.name)?'pickup':/Duster|Renegade|Kicks|HR-V/.test(c.name)?'suv':'auto';
const mark=a=>a.logo?`<span class="agency-mark has-logo"><img src="${esc(a.logo)}" alt="Logo de ${esc(a.name)}"></span>`:`<span class="agency-mark ag-${a.id}">${esc(a.initials)}</span>`;
const waText=a=>a.wa?'+'+a.wa.replace(/^54(\d{4})(\d{2})(\d{4})$/,'54 $1 $2-$3'):'';

function card(c){const a=ag(c.agency);return `<article class="card"><button class="card-open" data-car="${c.id}"><div class="photo"><img src="${img(c)}" alt="${esc(c.name)} de ejemplo" loading="lazy">${c.featured?'<span class="featured-tag">Destacado</span>':''}<span class="tag">${c.year} · ${c.km.toLocaleString('es-AR')} km</span></div><div class="body"><h3>${esc(c.name)}</h3><div class="specs">${esc(c.version)} · ${esc(c.box)} · ${esc(c.fuel)}</div><div class="price">${money(c)}</div><div class="pills">${c.vtv?'<span class="pill">VTV al día</span>':''}${c.owners===1?'<span class="pill">Único dueño</span>':''}${c.finance?'<span class="pill">Financiación</span>':''}${c.swap?'<span class="pill">Permuta</span>':''}</div></div></button><div class="seller">${mark(a)}<span><b>${esc(a.name)}</b><br><span class="badge-ok">✓ Agencia verificada</span></span></div></article>`}

function list(rows){return rows.length?rows.map(card).join(''):'<div class="empty"><h3>No hay autos con esos filtros</h3><p>Probá con otra agencia o quitá el precio máximo.</p></div>'}

function render(){
  const q=$('#query').value.trim().toLowerCase(),cur=$('#currency').value,max=Number($('#max').value);
  let rows=CARS.filter(c=>(!q||(c.name+' '+c.version).toLowerCase().includes(q))&&(!cur||c.currency===cur)&&(!max||c.price<=max)&&(!$('#fAgency').value||c.agency===$('#fAgency').value)&&(!$('#fType').value||type(c)===$('#fType').value)&&(!$('#fFuel').value||c.fuel===$('#fFuel').value)&&(!$('#fFinance').checked||c.finance));
  const s=$('#sort').value;
  rows.sort(s==='year'?(a,b)=>b.year-a.year:s==='km'?(a,b)=>a.km-b.km:(a,b)=>(b.featured?1:0)-(a.featured?1:0));
  $('#count').textContent=rows.length+' autos de '+new Set(rows.map(r=>r.agency)).size+' agencias · Azul, Buenos Aires';
  $('#cars').innerHTML=list(rows);
}

function strip(){
  $('#agencyStrip').innerHTML=AGENCIES.map(a=>`<a class="agency-card" href="#agencia/${a.id}">${mark(a)}<div><strong>${esc(a.name)}</strong><span>${CARS.filter(c=>c.agency===a.id).length} autos${a.since?' · desde '+a.since:' · Azul'}</span></div></a>`).join('');
  $('#stories').innerHTML=AGENCIES.map(a=>`<a class="story" href="#agencia/${a.id}"><span class="ring">${a.logo?`<img src="${esc(a.logo)}" alt="">`:`<span class="ini ag-${a.id}">${esc(a.initials)}</span>`}</span><b>${esc(a.name.replace(/\s*\(demo\)/,''))}</b><small>${CARS.filter(c=>c.agency===a.id).length} autos</small></a>`).join('')+`<a class="story join-story" href="#sumate"><span class="ring"><span class="ini plus">+</span></span><b>Tu agencia</b><small>Sumate</small></a>`;
  $('#fAgency').innerHTML+=AGENCIES.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('');
  $('#heroCount').textContent='↗ '+CARS.length+' autos · '+AGENCIES.length+' agencias';
}

function agencyPage(id){
  const a=ag(id);if(!a){location.hash='';return}
  const rows=CARS.filter(c=>c.agency===id);
  $('#agencyPage').innerHTML=`<a class="back" href="#agencias">← Todas las agencias</a><section class="agency-hero">${mark(a)}<div><span class="badge-ok">✓ Agencia verificada por Azul Autos</span><h1>${esc(a.name)}</h1><p>${esc(a.about)}</p></div></section><div class="agency-info"><div><b>Dirección</b>${esc(a.address)}</div><div><b>Horarios</b>${esc(a.hours)}</div><div><b>Trabaja con</b>${a.perks.map(esc).join(' · ')}</div>${a.wa?`<div><b>WhatsApp</b>${esc(waText(a))}</div>`:''}${a.ig?`<div><b>Instagram</b><a class="link" href="https://www.instagram.com/${esc(a.ig)}/" target="_blank" rel="noopener">@${esc(a.ig)}</a></div>`:''}</div><div class="section-head"><div><h2>${rows.length} autos disponibles</h2><p class="muted">Consultá directo por WhatsApp a la agencia.</p></div><a class="btn wa" href="#" data-wa-agency="${a.id}">WhatsApp de la agencia</a></div><div class="grid">${list(rows)}</div>`;
}

function route(){
  const m=location.hash.match(/^#agencia\/(\w+)/);
  $('#home').hidden=!!m;$('#agencyPage').hidden=!m;
  if(m){agencyPage(m[1]);scrollTo(0,0)}
}

function detail(id){
  const c=CARS.find(x=>x.id===id),a=ag(c.agency);
  $('#detailBody').innerHTML=`<div class="eyebrow link">FICHA · EJEMPLO</div><h2 id="detailTitle">${esc(c.name)} ${esc(c.version)}</h2><img class="detail-img" src="${img(c)}" alt="${esc(c.name)} de ejemplo"><div class="price">${money(c)}</div><div class="details"><div><b>Año</b><br>${c.year}</div><div><b>Kilómetros</b><br>${c.km.toLocaleString('es-AR')}</div><div><b>Caja</b><br>${esc(c.box)}</div><div><b>Combustible</b><br>${esc(c.fuel)}</div><div><b>Dueños</b><br>${c.owners}</div><div><b>VTV</b><br>${c.vtv?'Al día':'A consultar'}</div></div><div class="checks"><span>${c.finance?'✓':'✕'} Financiación</span><span>${c.swap?'✓':'✕'} Acepta permuta</span><span>✓ Transferencia gestionada por la agencia</span><span>✓ Se puede ver en el local</span></div><div class="seller" data-pad>${mark(a)}<span><b>${esc(a.name)}</b><br><span class="muted">${esc(a.address)} · ${esc(a.hours)}</span></span></div><a class="btn wa" href="#" data-wa-car="${c.id}" data-full>Consultar por WhatsApp</a><p class="mt10"><a class="link" href="#agencia/${a.id}" data-close>Ver todos los autos de ${esc(a.name)} →</a></p><div class="notice">En la web real este botón abre WhatsApp de la agencia con el mensaje: «Hola, vi el ${esc(c.name)} ${c.year} en Azul Autos y quiero consultar».</div>`;
  $('#detail').showModal();
}

document.addEventListener('click',e=>{
  const open=e.target.closest('[data-car]');if(open){detail(Number(open.dataset.car));return}
  if(e.target.closest('[data-close]')){$('#detail').close()}
  const wa=e.target.closest('[data-wa-car],[data-wa-agency]');if(wa){e.preventDefault();wa.textContent='Abriría WhatsApp (boceto)'}
});
['#query','#currency','#max','#fAgency','#fType','#fFuel','#sort','#fFinance'].forEach(s=>$(s).addEventListener('input',render));
$('#search').addEventListener('submit',e=>{e.preventDefault();render();$('#catalogo').scrollIntoView({behavior:'smooth'})});
window.addEventListener('hashchange',route);
strip();render();route();
})();
