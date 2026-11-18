(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=c=>(c.currency==='USD'?'US$ ':'$ ')+c.price.toLocaleString('es-AR');
const mine=CARS.filter(c=>c.agency==='centro').map((c,i)=>({...c,views:[412,288,201,156,97][i]||60,state:i===3?'sold':i===4?'exp':'pub'}));
const label={pub:['Publicado','s-pub'],sold:['Vendido','s-sold'],paused:['Pausado','s-paused'],exp:['Vence en 5 días','s-exp']};

function rows(){
  $('#myCars').innerHTML=mine.map((c,i)=>`<tr><td><img src="images/auto-${c.photo}.jpg" alt=""></td><td><b>${esc(c.name)}</b><br><span class="muted">${c.year} · ${c.km.toLocaleString('es-AR')} km</span></td><td>${money(c)}</td><td class="c-views">${c.views}</td><td><span class="state ${label[c.state][1]}">${label[c.state][0]}</span></td><td class="c-act"><div class="row-actions">${c.state==='sold'?'<button data-i="'+i+'" data-a="pub">Volver a publicar</button>':`<button data-fake>Editar</button><button data-i="${i}" data-a="${c.state==='paused'?'pub':'paused'}">${c.state==='paused'?'Reactivar':'Pausar'}</button><button data-i="${i}" data-a="sold">Vendido</button>`}${c.state==='exp'?'<button data-i="'+i+'" data-a="pub">Renovar</button>':''}</div></td></tr>`).join('');
  $('#stPub').textContent=mine.filter(c=>c.state!=='sold').length;
  $('#topCars').innerHTML=[...mine].sort((a,b)=>b.views-a.views).slice(0,3).map(c=>`<tr><td><img src="images/auto-${c.photo}.jpg" alt=""></td><td><b>${esc(c.name)}</b><br><span class="muted">${c.views} visitas</span></td></tr>`).join('');
}
function admin(){
  $('#stAll').textContent=CARS.length;
  $('#agencyRows').innerHTML=AGENCIES.map(a=>`<tr><td><span class="agency-mark ag-${a.id}">${esc(a.initials)}</span></td><td><b>${esc(a.name)}</b><br><span class="muted">${esc(a.address)}</span></td><td>${CARS.filter(c=>c.agency===a.id).length}</td><td class="c-views">${a.since}</td><td><span class="state s-pub">Activa</span></td><td class="c-act"><div class="row-actions"><button data-fake>Ver</button><button data-fake>Suspender</button></div></td></tr>`).join('')+'<tr><td><span class="agency-mark ag-new">?</span></td><td><b>Agencia nueva (demo)</b><br><span class="muted">Esperando que cargue su logo</span></td><td>0</td><td class="c-views">—</td><td><span class="state s-paused">En alta</span></td><td class="c-act"><div class="row-actions"><button data-fake>Reenviar invitación</button></div></td></tr>';
}
function tab(t){
  $$('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==t);
  $$('[data-tab]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.tab===t)));
  scrollTo(0,0);
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-tab],[data-go]');if(t){tab(t.dataset.tab||t.dataset.go);return}
  const a=e.target.closest('[data-a]');if(a){mine[a.dataset.i].state=a.dataset.a;rows();return}
  const f=e.target.closest('[data-fake]');if(f){f.textContent='✓ (boceto, no guarda)'}
});
$('#carForm').addEventListener('submit',e=>{e.preventDefault();$('#formStatus').innerHTML='<div class="notice">✓ En la web real el auto saldría publicado ahora con el nombre de tu agencia. En el boceto no se guarda nada.</div>'});
$$('.slot input').forEach(i=>i.addEventListener('change',()=>{if(i.files[0]){i.parentElement.firstChild.textContent='✓ ';i.parentElement.classList.add('done')}}));
if(window.AGENCY_CUSTOM){
  const n=AGENCY_CUSTOM.name;
  document.querySelectorAll('.side .who,[data-panel=inicio] .eyebrow').forEach(e=>{e.innerHTML=e.innerHTML.replace('Facundo Gomez Automotores',esc(n)).replace('FACUNDO GOMEZ AUTOMOTORES',esc(n.toUpperCase()))});
  document.querySelectorAll('[data-panel=agencia] input').forEach(i=>{if(i.value==='Facundo Gomez Automotores')i.value=n});
  document.querySelectorAll('a[href="informe.html"]').forEach(l=>l.href='informe.html'+location.search);
}
rows();admin();
})();
