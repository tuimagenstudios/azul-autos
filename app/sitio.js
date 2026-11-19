(function(){
'use strict';
const C = window.AZUL;
const sb = window.supabase.createClient(C.url, C.key, { auth: { persistSession: false, autoRefreshToken: false } });
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pub = p => p ? sb.storage.from(C.bucket).getPublicUrl(p).data.publicUrl : 'vehicle-placeholder.svg';
const money = c => c.price ? (c.currency === 'USD' ? 'US$ ' : '$ ') + Number(c.price).toLocaleString('es-AR') : 'Consultar precio';
const initials = n => n.split(/\s+/).filter(w => w.length > 2).map(w => w[0]).join('').slice(0, 3).toUpperCase() || n[0].toUpperCase();
const waNice = n => n ? '+' + String(n).replace(/^54(9?)(\d{4})(\d{2})(\d{4})$/, '54 $1$2 $3-$4').replace('  ', ' ') : '';
const COLORS = ['#184fe5', '#0f8a5f', '#c2410c', '#1e40af', '#0e7490', '#b45309'];

let AG = [], CARS = [];
const ag = slug => AG.find(a => a.slug === slug);
const mark = a => a.logo_path ? `<span class="agency-mark has-logo"><img src="${esc(pub(a.logo_path))}" alt="Logo de ${esc(a.name)}"></span>` : `<span class="agency-mark" data-color="${a._c}">${esc(initials(a.name))}</span>`;
const firstPhoto = c => (c.car_photos || []).slice().sort((a, b) => a.position - b.position)[0];

// ===== Registro de visitas (sin datos del visitante; una vez por sesión y elemento) =====
function track(kind, agencyId, carId){
  const key = 'azul-ev:' + kind + ':' + (carId || agencyId);
  try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch {}
  sb.from('events').insert({ kind, agency_id: agencyId, car_id: carId || null }).then(() => {}, () => {});
}

// ===== Carga =====
async function load(){
  const [{ data: ags, error: e1 }, { data: cars, error: e2 }] = await Promise.all([
    sb.from('agencies').select('id,slug,name,logo_path,address,hours,about,whatsapp,instagram,perks,founder').eq('status', 'active').order('name'),
    sb.from('cars').select('id,agency_id,brand,model,version,year,km,currency,price,fuel,gearbox,owners,vtv,swap,finance,description,featured,created_at,car_photos(path,position)').eq('status', 'published').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false })
  ]);
  if (e1 || e2) { $('#count').textContent = 'No pudimos cargar los autos. Probá recargar la página.'; return; }
  AG = (ags || []).map((a, i) => ({ ...a, _c: i % COLORS.length }));
  const byId = Object.fromEntries(AG.map(a => [a.id, a]));
  CARS = (cars || []).filter(c => byId[c.agency_id]).map(c => ({ ...c, agency: byId[c.agency_id].slug, name: c.brand + ' ' + c.model }));
  strip(); render(); route();
  const sa = $('#sAg'), sc = $('#sCars'); if (sa) sa.dataset.count = AG.length; if (sc) sc.dataset.count = CARS.length;
}

// ===== Tarjetas =====
// ===== Tipo de vehículo (por modelo) y favoritos =====
const PICKUP = /hilux|ranger|amarok|s10|s-10|frontier|toro|strada|saveiro|montana|alaskan|maverick|oroch|l200|ram|tacoma|f-?150|d-max|navara|ranchero/i;
const SUV = /duster|renegade|compass|kicks|hr-?v|cr-?v|tracker|ecosport|territory|bronco|t-?cross|taos|tiguan|nivus|2008|3008|5008|c4 cactus|c3 aircross|captur|koleos|sportage|seltzer|creta|tucson|rav4|corolla cross|sw4|pulse|fastback|commander|x-?trail|qashqai|outlander|jimny|vitara|q3|q5|x1|x3|gla|glc|wrangler|grand cherokee|kuga|equinox|trailblazer|cherokee|stepway/i;
const type = c => PICKUP.test(c.model) ? 'pickup' : SUV.test(c.model + ' ' + (c.version || '')) ? 'suv' : 'auto';
window.AZUL_TYPE = type;
let FAVS = []; try { FAVS = JSON.parse(localStorage.getItem('azul-favs') || '[]'); } catch {}
const isFav = id => FAVS.includes(id);
function toggleFav(id){ FAVS = isFav(id) ? FAVS.filter(x => x !== id) : [...FAVS, id].slice(-30); try { localStorage.setItem('azul-favs', JSON.stringify(FAVS)); } catch {} document.querySelectorAll(`[data-fav="${id}"]`).forEach(b => b.setAttribute('aria-pressed', String(isFav(id)))); }

function card(c, opts = {}){
  const a = ag(c.agency), ph = firstPhoto(c);
  const ribbon = opts.ribbon || (c.featured ? 'DESTACADO' : '');
  return `<article class="card car2${ribbon ? ' is-feat' : ''}"><button class="card-open" data-car="${c.id}"><div class="photo"><img src="${esc(pub(ph && ph.path))}" alt="${esc(c.name)}" loading="lazy">${ribbon ? `<span class="ribbon">${esc(ribbon)}</span>` : ''}</div><div class="body"><h3>${esc(c.name)}${c.version ? ` <small>- ${esc(c.version)}</small>` : ''}</h3><div class="specs">${c.year} · ${Number(c.km).toLocaleString('es-AR')} km · ${esc(c.gearbox)}</div><div class="price">${esc(money(c))}</div><div class="pills">${c.finance ? '<span class="pill">Financiación</span>' : ''}${c.swap ? '<span class="pill">Permuta</span>' : ''}${c.vtv ? '<span class="pill">VTV al día</span>' : ''}</div><div class="loc">📍 Azul, Buenos Aires</div></div></button><button type="button" class="fav" data-fav="${c.id}" aria-pressed="${isFav(c.id)}" aria-label="Guardar en favoritos">♥</button><a class="ag-badge" href="#agencia/${esc(a.slug)}" title="${esc(a.name)}" aria-label="Ver ${esc(a.name)}">${mark(a)}</a></article>`;
}
window.AZUL_CARD = card;
function list(rows){ return rows.length ? rows.map(card).join('') : '<div class="empty"><h3>No hay autos con esos filtros</h3><p>Probá otra marca o quitá el precio máximo.</p></div>'; }

function render(){
  const q = $('#query').value.trim().toLowerCase(), cur = $('#currency').value, max = Number($('#max').value), b = $('#fBrand').value;
  let rows = CARS.filter(c => (!q || (c.name + ' ' + (c.version || '')).toLowerCase().includes(q)) && (!cur || c.currency === cur) && (!max || (c.price && c.price <= max))
    && (!b || c.brand === b) && (!$('#fType').value || type(c) === $('#fType').value) && (!$('#fFuel').value || c.fuel === $('#fFuel').value) && (!$('#fBox').value || c.gearbox === $('#fBox').value) && (!$('#fFinance').checked || c.finance) && (!$('#fFav').checked || isFav(c.id)));
  const s = $('#sort').value;
  rows.sort(s === 'year' ? (x, y) => y.year - x.year : s === 'km' ? (x, y) => x.km - y.km : s === 'pmin' ? (x, y) => (x.price || 9e15) - (y.price || 9e15) : (x, y) => (y.featured - x.featured) || (new Date(y.created_at) - new Date(x.created_at)));
  const n = rows.length, g = new Set(rows.map(r => r.agency)).size;
  $('#count').textContent = n + (n === 1 ? ' auto' : ' autos') + ' de ' + g + (g === 1 ? ' agencia' : ' agencias') + ' · Azul, Buenos Aires';
  $('#cars').innerHTML = list(rows);
  const box = $('#brandAgencies');
  if (!b) { box.hidden = true; return; }
  const counts = {}; rows.forEach(r => counts[r.agency] = (counts[r.agency] || 0) + 1);
  const ags = AG.filter(a => counts[a.slug]).sort((x, y) => x.name.localeCompare(y.name, 'es'));
  box.hidden = false;
  box.innerHTML = ags.length ? `<p><b>${esc(b)}</b> en ${ags.length} ${ags.length === 1 ? 'agencia' : 'agencias'} de Azul:</p><div class="ba-list">${ags.map(a => `<a href="#agencia/${esc(a.slug)}" class="ba">${mark(a)}<span>${esc(a.name)}<small>${counts[a.slug]} ${counts[a.slug] === 1 ? 'auto' : 'autos'}</small></span></a>`).join('')}</div>` : `<p>Ninguna agencia tiene <b>${esc(b)}</b> con esos filtros.</p>`;
}

function strip(){
  const cnt = slug => CARS.filter(c => c.agency === slug).length;
  $('#stories').innerHTML = AG.map(a => `<a class="story" href="#agencia/${esc(a.slug)}"><span class="ring">${a.logo_path ? `<img src="${esc(pub(a.logo_path))}" alt="">` : `<span class="ini" data-color="${a._c}">${esc(initials(a.name))}</span>`}</span><b>${esc(a.name)}</b><small>${cnt(a.slug)} ${cnt(a.slug) === 1 ? 'auto' : 'autos'}</small></a>`).join('')
    + `<a class="story join-story" href="#sumate"><span class="ring"><span class="ini plus">+</span></span><b>Tu agencia</b><small>Sumate</small></a>`;
  const brands = [...new Set(CARS.map(c => c.brand))].sort((x, y) => x.localeCompare(y, 'es'));
  $('#fBrand').innerHTML = '<option value="">Todas</option>' + brands.map(x => `<option>${esc(x)}</option>`).join('');
  $('#heroCount').textContent = CARS.length + (CARS.length === 1 ? ' auto publicado · ' : ' autos publicados · ') + AG.length + (AG.length === 1 ? ' agencia verificada' : ' agencias verificadas');
  const hb = $('#hBrand'); if (hb) hb.innerHTML = '<option value="">Todas las marcas</option>' + brands.map(x => `<option>${esc(x)}</option>`).join('');
  window.dispatchEvent(new CustomEvent('azul:data', { detail: { AG, CARS } }));
}
// Filtros que llegan desde la portada (buscador, tarjetas, marcas)
window.addEventListener('azul:filter', e => {
  const f = e.detail || {};
  if ('brand' in f) { if (f.brand && ![...$('#fBrand').options].some(o => o.value === f.brand)) $('#fBrand').insertAdjacentHTML('beforeend', `<option>${esc(f.brand)}</option>`); $('#fBrand').value = f.brand || ''; }
  if ('type' in f) $('#fType').value = f.type || '';
  if ('max' in f) { $('#max').value = f.max || ''; if (f.max) $('#currency').value = 'ARS'; }
  render(); $('#catalogo').scrollIntoView({ behavior: 'smooth' });
});

// ===== Página de agencia =====
function waLink(num, text){ return 'https://wa.me/' + encodeURIComponent(num) + '?text=' + encodeURIComponent(text); }
function agencyPage(slug){
  const a = ag(slug); if (!a) { location.hash = ''; return; }
  const rows = CARS.filter(c => c.agency === slug);
  track('view_agency', a.id);
  $('#agencyPage').innerHTML = `<a class="back" href="#agencias">← Todas las agencias</a><section class="agency-hero">${(a.whatsapp || a.instagram) ? `<div class="hero-social">${a.whatsapp ? `<a class="soc wa-ic" href="${esc(waLink(a.whatsapp, 'Hola, vi tu agencia en Azul Autos y quiero consultar.'))}" target="_blank" rel="noopener" data-wa="${a.id}" aria-label="WhatsApp de ${esc(a.name)}" title="WhatsApp"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg></a>` : ''}${a.instagram ? `<a class="soc ig-ic" href="https://www.instagram.com/${esc(a.instagram)}/" target="_blank" rel="noopener" aria-label="Instagram de ${esc(a.name)}" title="Instagram"><svg viewBox="0 0 24 24"><path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zM17.3 5.5a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zM12 3.6c2.7 0 3 0 4.1.1 1 0 1.5.2 1.9.3.5.2.8.4 1.1.7.4.4.6.7.7 1.2.2.4.3.9.3 1.9.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c0 1-.2 1.5-.3 1.9-.2.5-.4.8-.7 1.1-.4.4-.7.6-1.2.7-.4.2-.9.3-1.9.3-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1 0-1.5-.2-1.9-.3a3 3 0 01-1.1-.7 3 3 0 01-.7-1.2c-.2-.4-.3-.9-.3-1.9C3.7 15 3.6 14.7 3.6 12s0-3 .1-4.1c0-1 .2-1.5.3-1.9.2-.5.4-.8.7-1.1.4-.4.7-.6 1.2-.7.4-.2.9-.3 1.9-.3C9 3.6 9.3 3.6 12 3.6zM12 1.8c-2.8 0-3.1 0-4.2.1-1.1 0-1.8.2-2.5.5-.7.3-1.3.6-1.8 1.2-.6.5-.9 1.1-1.2 1.8-.3.7-.4 1.4-.5 2.5C1.8 8.9 1.8 9.2 1.8 12s0 3.1.1 4.2c0 1.1.2 1.8.5 2.5.3.7.6 1.3 1.2 1.8.5.6 1.1.9 1.8 1.2.7.3 1.4.4 2.5.5 1.1.1 1.4.1 4.2.1s3.1 0 4.2-.1c1.1 0 1.8-.2 2.5-.5.7-.3 1.3-.6 1.8-1.2.6-.5.9-1.1 1.2-1.8.3-.7.4-1.4.5-2.5.1-1.1.1-1.4.1-4.2s0-3.1-.1-4.2c0-1.1-.2-1.8-.5-2.5a5 5 0 00-1.2-1.8A5 5 0 0018.7 2.4c-.7-.3-1.4-.4-2.5-.5C15.1 1.8 14.8 1.8 12 1.8z"/></svg></a>` : ''}</div>` : ''}${mark(a)}<div><span class="badge-ok">✓ Agencia verificada por Azul Autos</span><h1>${esc(a.name)}</h1>${a.about ? `<p>${esc(a.about)}</p>` : ''}</div></section>
  <div class="agency-info">${a.address ? `<div><b>Dirección</b>${esc(a.address)}</div>` : ''}<div><b>Horarios</b>${esc(a.hours || 'Consultá por WhatsApp')}</div>${(a.perks || []).length ? `<div><b>Trabaja con</b>${a.perks.map(esc).join(' · ')}</div>` : ''}${a.whatsapp ? `<div><b>WhatsApp</b>${esc(waNice(a.whatsapp))}</div>` : ''}${a.instagram ? `<div><b>Instagram</b><a class="link" href="https://www.instagram.com/${esc(a.instagram)}/" target="_blank" rel="noopener">@${esc(a.instagram)}</a></div>` : ''}</div>
  <div class="section-head"><div><h2>${rows.length} ${rows.length === 1 ? 'auto disponible' : 'autos disponibles'}</h2><p class="muted">Consultá directo por WhatsApp a la agencia.</p></div>${a.whatsapp ? `<a class="btn wa" href="${esc(waLink(a.whatsapp, 'Hola, vi tu agencia en Azul Autos y quiero consultar.'))}" target="_blank" rel="noopener" data-wa="${a.id}">WhatsApp de la agencia</a>` : ''}</div><div class="grid">${list(rows)}</div>`;
}
function route(){
  const m = location.hash.match(/^#agencia\/([a-z0-9-]+)/);
  $('#home').hidden = !!m; $('#agencyPage').hidden = !m;
  if (m) { agencyPage(m[1]); scrollTo(0, 0); }
}

// ===== Ficha =====
function detail(id){
  const c = CARS.find(x => x.id === id); if (!c) return;
  const a = ag(c.agency), photos = (c.car_photos || []).slice().sort((x, y) => x.position - y.position);
  track('view_car', a.id, c.id);
  const msg = `Hola, vi el ${c.name} ${c.year} en Azul Autos y quiero consultar.`;
  $('#detailBody').innerHTML = `<div class="eyebrow link">${esc(a.name.toUpperCase())}</div><h2 id="detailTitle">${esc(c.name)} ${esc(c.version || '')}</h2>
  <img class="detail-img" id="mainPh" src="${esc(pub(photos[0] && photos[0].path))}" alt="${esc(c.name)}">
  ${photos.length > 1 ? `<div class="gal">${photos.map((p, i) => `<button type="button" data-ph="${esc(pub(p.path))}" aria-label="Foto ${i + 1}"><img src="${esc(pub(p.path))}" alt=""></button>`).join('')}</div>` : ''}
  <div class="price">${esc(money(c))}</div>
  <div class="details"><div><b>Año</b><br>${c.year}</div><div><b>Kilómetros</b><br>${Number(c.km).toLocaleString('es-AR')}</div><div><b>Caja</b><br>${esc(c.gearbox)}</div><div><b>Combustible</b><br>${esc(c.fuel)}</div><div><b>Dueños</b><br>${c.owners || 'Consultar'}</div><div><b>VTV</b><br>${c.vtv ? 'Al día' : 'Consultar'}</div></div>
  <div class="checks"><span>${c.finance ? '✓' : '✕'} Financiación</span><span>${c.swap ? '✓' : '✕'} Acepta permuta</span></div>
  ${c.description ? `<p class="desc">${esc(c.description)}</p>` : ''}
  <div class="seller" data-pad>${mark(a)}<span><b>${esc(a.name)}</b><br><span class="muted">${esc([a.address, a.hours].filter(Boolean).join(' · '))}</span></span></div>
  ${a.whatsapp ? `<a class="btn wa" data-full href="${esc(waLink(a.whatsapp, msg))}" target="_blank" rel="noopener" data-wa="${a.id}" data-wa-car="${c.id}">Consultar por WhatsApp</a>` : ''}
  <p class="mt10"><a class="link" href="#agencia/${esc(a.slug)}" data-close>Ver todos los autos de ${esc(a.name)} →</a></p>`;
  $('#detail').showModal();
}

document.addEventListener('click', e => {
  const fv = e.target.closest('[data-fav]'); if (fv) { e.preventDefault(); toggleFav(fv.dataset.fav); if ($('#fFav').checked) render(); return; }
  const open = e.target.closest('[data-car]'); if (open) { detail(open.dataset.car); return; }
  const ph = e.target.closest('[data-ph]'); if (ph) { $('#mainPh').src = ph.dataset.ph; return; }
  const wa = e.target.closest('[data-wa]'); if (wa) { track('whatsapp', wa.dataset.wa, wa.dataset.waCar); }
  if (e.target.closest('[data-close]')) $('#detail').close();
});
['#query','#currency','#max','#fBrand','#fType','#fFuel','#fBox','#sort','#fFinance','#fFav'].forEach(s => $(s).addEventListener('input', render));
$('#search').addEventListener('submit', e => { e.preventDefault(); render(); });
window.addEventListener('hashchange', route);
load();
})();
