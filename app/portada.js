(function(){
'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const filter = d => window.dispatchEvent(new CustomEvent('azul:filter', { detail: d }));

// Barra superior: transparente sobre la portada, sólida al bajar
const bar = $('#topbar');
const onScroll = () => bar && bar.classList.toggle('solid', scrollY > 60 || !$('#agencyPage').hidden);
addEventListener('scroll', onScroll, { passive: true }); addEventListener('hashchange', onScroll); onScroll();

// Buscador de la portada
$('#heroSearch').addEventListener('submit', e => { e.preventDefault(); filter({ brand: $('#hBrand').value, type: $('#hType').value, max: $('#hMax').value }); });

// Cinta de marcas (en loop)
const MARCAS = [['toyota','Toyota'],['volkswagen','Volkswagen'],['ford','Ford'],['fiat','Fiat'],['chevrolet','Chevrolet'],['renault','Renault'],['peugeot','Peugeot'],['citroen','Citroën'],['nissan','Nissan'],['honda','Honda'],['jeep','Jeep'],['hyundai','Hyundai'],['kia','Kia'],['mercedes','Mercedes-Benz'],['bmw','BMW'],['audi','Audi'],['ram','RAM'],['suzuki','Suzuki'],['mitsubishi','Mitsubishi']];
const item = ([f, n]) => `<button type="button" class="mq-item" data-brand="${esc(n)}" title="Ver ${esc(n)}"><img src="marcas/${f}.svg" alt="" width="40" height="40"><span>${esc(n)}</span></button>`;
$('#marquee').innerHTML = MARCAS.map(item).join('') + MARCAS.map(item).join('').replace(/class="mq-item"/g, 'class="mq-item" aria-hidden="true" tabindex="-1"');
$('#marquee').addEventListener('click', e => { const b = e.target.closest('[data-brand]'); if (b) filter({ brand: b.dataset.brand, type: '', max: '' }); });

// Flechas de los carruseles
document.addEventListener('click', e => {
  const b = e.target.closest('[data-scroll]'); if (!b) return;
  const rail = document.getElementById(b.dataset.scroll); rail.scrollBy({ left: rail.clientWidth * 0.85 * Number(b.dataset.dir), behavior: 'smooth' });
});

window.addEventListener('azul:data', async ({ detail: { CARS } }) => {
  const type = window.AZUL_TYPE, card = window.AZUL_CARD;
  // Lo que más se busca
  const cats = [
    { k: 'auto', t: 'AUTOS', img: 'portada/autos.jpg', sub: 'para el día a día', ic: '🚗', cls: 'c-blue' },
    { k: 'suv', t: 'SUV', img: 'portada/suv.jpg', sub: 'espacio para la familia', ic: '👨‍👩‍👧', cls: 'c-green' },
    { k: 'pickup', t: 'PICKUPS', img: 'portada/pickups.jpg', sub: 'Hilux, Ranger, Amarok y más', ic: '🔥', cls: 'c-blue' }
  ];
  $('#popGrid').innerHTML = cats.map(c => {
    const list = CARS.filter(x => type(x) === c.k);
    const ars = list.filter(x => x.currency === 'ARS' && x.price).map(x => +x.price);
    const desde = ars.length ? '$ ' + Math.min(...ars).toLocaleString('es-AR') : (list.length ? 'Consultá precios' : '—');
    return `<button type="button" class="pop ${c.cls}" data-type="${c.k}"><span class="pop-tag">${c.t}</span><img src="${c.img}" alt="" loading="lazy"><span class="pop-l">${ars.length ? 'Desde' : '&nbsp;'}</span><b class="pop-p">${esc(desde)}</b><span class="pop-s">${c.ic} ${esc(c.sub)}</span><span class="pop-n"><b>${list.length}</b> ${list.length === 1 ? 'vehículo disponible' : 'vehículos disponibles'}</span><span class="pop-go">→</span></button>`;
  }).join('');
  $('#popGrid').onclick = e => { const b = e.target.closest('[data-type]'); if (b) filter({ type: b.dataset.type, brand: '', max: '' }); };

  // Destacados: los marcados por el admin; si no hay, los más nuevos
  let dest = CARS.filter(c => c.featured);
  const label = dest.length ? 'DESTACADO' : 'NUEVO';
  if (!dest.length) dest = CARS.slice(0, 8);
  $('#destacadosSec').hidden = !dest.length;
  $('#destacados').innerHTML = dest.slice(0, 10).map(c => card(c, { ribbon: label })).join('');

  // Los más vistos (últimos 30 días, desde la base)
  try {
    const sb = window.supabase.createClient(window.AZUL.url, window.AZUL.key, { auth: { persistSession: false } });
    const { data } = await sb.rpc('top_viewed', { p_limit: 8 });
    const ids = (data || []).filter(r => r.views >= 3).map(r => r.car_id);
    const vis = ids.map(id => CARS.find(c => c.id === id)).filter(Boolean);
    $('#vistosSec').hidden = vis.length < 3;
    $('#vistos').innerHTML = vis.map(c => card(c, { ribbon: '🔥 MÁS VISTO' })).join('');
  } catch { $('#vistosSec').hidden = true; }
});
})();
