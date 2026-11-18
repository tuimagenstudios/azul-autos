(function(){
// ===== Ajustes =====
const WHATSAPP = '5492281461982';          // número sin + ni espacios, ej: 5492281123456. Vacío = abre WhatsApp para elegir contacto.
const OFFER_END = '2026-12-31'; // fin de la oferta de fundadora
const SLOTS_LEFT = 4;           // lugares de fundadora que quedan
// ====================

const $=s=>document.querySelector(s);
const p=new URLSearchParams(location.search);
const name=(p.get('agencia')||'').trim().slice(0,60)||'tu agencia';
const custom=name!=='tu agencia';
const q=custom?'?agencia='+encodeURIComponent(name):'';
document.querySelectorAll('.agName').forEach(e=>e.textContent=name);
document.title='Propuesta para '+(custom?name:'tu agencia')+' | Azul Autos';
$('#today').textContent=new Date().toLocaleDateString('es-AR',{day:'numeric',month:'long',year:'numeric'});

const days=Math.max(0,Math.ceil((new Date(OFFER_END+'T23:59:59')-new Date())/864e5));
const end=new Date(OFFER_END+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'long'});
$('#countdown').textContent='Hasta el '+end+(days?' · quedan '+days+' días':'');
$('#slots').textContent=SLOTS_LEFT;

const msg='Hola, vi la propuesta de Azul Autos y quiero sumar '+(custom?name:'mi agencia')+' como agencia fundadora.';
$('#wa').href='https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent(msg);

const views={
  publico:{url:'index.html'+q+'#agencia/centro',title:'Lo que ve el comprador',text:'Tu página dentro de Azul Autos: tus autos, tu logo, dirección y horarios. Cada auto tiene su ficha y el botón para escribirte por WhatsApp.',ticks:['Tus autos junto a los de todo Azul','Insignia de agencia verificada','Ficha con km, VTV, dueños, permuta y financiación','Consulta directa a tu WhatsApp']},
  panel:{url:'panel.html'+q,title:'Tu panel',text:'Desde el celular cargás autos, cambiás precios, pausás o marcás vendido. Y ves cuántas visitas y consultas tuvo cada auto.',ticks:['Cargar un auto en 2 minutos','Marcar vendido con un toque','Visitas y consultas en vivo','Avisos de autos por vencer']},
  informe:{url:'informe.html'+q,title:'Tu informe mensual',text:'El día 1 de cada mes te llega este informe al correo, con tus números y recomendaciones para vender más.',ticks:['Visitas y consultas por auto','Qué auto conviene revisar de precio','Comparación con el promedio de Azul','También en PDF para guardar']}
};
const base=location.href.replace(/[^/]*$/,'');
let qr=null;
function show(k){
  const v=views[k];
  $('#frame').src=v.url;
  $('#viewTitle').textContent=v.title;
  $('#viewText').textContent=v.text;
  $('#viewTicks').innerHTML='';v.ticks.forEach(t=>{const li=document.createElement('li');li.textContent=t;$('#viewTicks').appendChild(li)});
  $('#full').href=v.url;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.view===k)));
  if(window.QRCode){$('#qr').innerHTML='';qr=new QRCode($('#qr'),{text:base+v.url,width:116,height:116,colorDark:'#0b1630',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M})}
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.view)));
show('publico');
})();
