(function(){
'use strict';
const C = window.AZUL;
const sb = window.supabase.createClient(C.url, C.key, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true } });
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pub = p => p ? sb.storage.from(C.bucket).getPublicUrl(p).data.publicUrl : '';
const money = c => c.price ? (c.currency === 'USD' ? 'US$ ' : '$ ') + Number(c.price).toLocaleString('es-AR') : 'Consultar';
const LABEL = { published: ['Publicado','s-pub'], paused: ['Pausado','s-paused'], sold: ['Vendido','s-sold'] };

let user = null, isAdmin = false, agencies = [], current = null, newPhotos = [], editingPhotos = [];

function toast(t, bad){ const el = $('#toast'); el.textContent = t; el.className = 'toast' + (bad ? ' bad' : ''); el.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => el.hidden = true, 3500); }
function msg(sel, t, bad){ const el = $(sel); el.textContent = t || ''; el.className = 'msg' + (bad ? ' bad' : ''); }
function show(id){ ['login','noAgency','app'].forEach(x => $('#' + x).hidden = x !== id); }
function tab(t){ $$('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== t); $$('#tabs [data-tab]').forEach(b => b.setAttribute('aria-current', String(b.dataset.tab === t))); scrollTo(0, 0); if (t === 'cargar' && !$('#carId').value) resetForm(); }
function errText(e){ const m = (e && (e.message || e.error_description)) || String(e); if (/límite/.test(m)) return m; if (/row-level security|permission/i.test(m)) return 'No tenés permiso para hacer esto.'; return 'Ocurrió un error: ' + m; }

// ===== Sesión =====
async function start(){
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { show('login'); $('#logout').hidden = true; $('#who').textContent = ''; return; }
  user = session.user;
  $('#who').textContent = user.email; $('#logout').hidden = false;
  const { data: adm } = await sb.rpc('is_admin'); isAdmin = !!adm;
  if (isAdmin) {
    const { data } = await sb.from('agencies').select('*').order('name'); agencies = data || [];
  } else {
    const { data } = await sb.from('agency_members').select('role, agencies(*)').eq('user_id', user.id); agencies = (data || []).map(r => r.agencies).filter(Boolean);
  }
  $('#adminTab').hidden = !isAdmin;
  if (!agencies.length && !isAdmin) { show('noAgency'); return; }
  show('app');
  const sw = $('#agencySwitch');
  sw.innerHTML = agencies.map(a => `<option value="${a.id}">${esc(a.name)}${a.status !== 'active' ? ' (' + esc(a.status) + ')' : ''}</option>`).join('');
  $('#agencySwitchWrap').hidden = agencies.length < 2;
  const saved = localStorageGet('azul-agency');
  current = agencies.find(a => a.id === saved) || agencies[0] || null;
  if (current) sw.value = current.id;
  await loadAll();
  tab(isAdmin && !current ? 'admin' : 'inicio');
}
function localStorageGet(k){ try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k, v){ try { localStorage.setItem(k, v); } catch {} }

async function loadAll(){ if (current) { fillAgency(); await Promise.all([loadStats(), loadCars()]); } if (isAdmin) loadAdmin(); }

$('#agencySwitch').addEventListener('change', async e => { current = agencies.find(a => a.id === e.target.value); localStorageSet('azul-agency', current.id); await loadAll(); });

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#email').value.trim();
  $('#loginBtn').disabled = true; msg('#loginMsg', 'Enviando…');
  const redirect = location.origin + location.pathname;
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirect } });
  $('#loginBtn').disabled = false;
  // Mismo mensaje exista o no la cuenta (no revelar quién está registrado)
  if (error && !/signups not allowed|not found|Signups/i.test(error.message)) { msg('#loginMsg', 'No pudimos enviar el enlace. Probá de nuevo en un minuto.', true); return; }
  msg('#loginMsg', 'Si tu correo está habilitado, te llegó un enlace. Abrilo desde este mismo dispositivo.');
});
$('#logout').addEventListener('click', async () => { await sb.auth.signOut(); location.reload(); });
sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_IN' && !user) start(); });

// ===== Inicio =====
async function loadStats(){
  $('#agName').textContent = current.name.toUpperCase();
  const month = new Date(); month.setDate(1); month.setHours(0,0,0,0);
  const [{ data: st }, { count }] = await Promise.all([
    sb.from('agency_stats').select('*').eq('agency_id', current.id).gte('month', month.toISOString()),
    sb.from('cars').select('id', { count: 'exact', head: true }).eq('agency_id', current.id).eq('status', 'published')
  ]);
  const s = (st && st[0]) || {};
  $('#stPub').textContent = count ?? 0; $('#stViews').textContent = s.car_views || 0; $('#stWa').textContent = s.whatsapp_clicks || 0; $('#stAgency').textContent = s.agency_views || 0;
}

// ===== Autos =====
let cars = [];
async function loadCars(){
  const { data, error } = await sb.from('cars').select('*, car_photos(id,path,position), car_private(plate)').eq('agency_id', current.id).order('created_at', { ascending: false });
  if (error) { toast(errText(error), true); return; }
  cars = data || [];
  const soon = cars.filter(c => c.status === 'published' && new Date(c.expires_at) - Date.now() < 7 * 864e5);
  const fewPh = cars.filter(c => c.status === 'published' && (c.car_photos || []).length < 4);
  $('#alerts').innerHTML = '<h2>Para revisar</h2>' + (soon.length || fewPh.length || !cars.length ? '' : '<p class="muted">Todo en orden ✓</p>')
    + (soon.length ? `<p>⚠ <b>${soon.length} ${soon.length === 1 ? 'auto vence' : 'autos vencen'} en menos de 7 días.</b> Renovalos para que sigan visibles.</p>` : '')
    + (fewPh.length ? `<p>📷 <b>${fewPh.length} ${fewPh.length === 1 ? 'auto tiene' : 'autos tienen'} menos de 4 fotos.</b> Con más fotos reciben más consultas.</p>` : '')
    + (cars.length ? '' : '<p>Todavía no cargaste autos. <button class="btn small" data-go="cargar">Cargar el primero</button></p>');
  $('#carList').innerHTML = cars.length ? cars.map(c => {
    const ph = (c.car_photos || []).sort((a, b) => a.position - b.position)[0];
    const expired = new Date(c.expires_at) < new Date();
    const lab = expired && c.status === 'published' ? ['Vencido','s-exp'] : LABEL[c.status];
    const days = Math.ceil((new Date(c.expires_at) - Date.now()) / 864e5);
    return `<article class="car-row"><div class="ph">${ph ? `<img src="${esc(pub(ph.path))}" alt="" loading="lazy">` : '<span>Sin foto</span>'}</div>
      <div class="info"><b>${esc(c.brand)} ${esc(c.model)}</b> <span class="muted">${esc(c.version || '')}</span><br><span class="muted">${c.year} · ${Number(c.km).toLocaleString('es-AR')} km · ${esc(money(c))}</span><br>
      <span class="state ${lab[1]}">${lab[0]}</span>${c.status === 'published' && !expired ? ` <small class="muted">vence en ${days} días</small>` : ''}</div>
      <div class="acts">
        <button data-act="edit" data-id="${c.id}">Editar</button>
        ${c.status === 'published' && !expired ? `<button data-act="paused" data-id="${c.id}">Pausar</button>` : ''}
        ${c.status === 'paused' ? `<button data-act="published" data-id="${c.id}">Reactivar</button>` : ''}
        ${c.status !== 'sold' ? `<button data-act="sold" data-id="${c.id}">Vendido</button>` : `<button data-act="published" data-id="${c.id}">Volver a publicar</button>`}
        ${c.status === 'published' ? `<button data-act="renew" data-id="${c.id}">Renovar</button>` : ''}
        <button data-act="delete" data-id="${c.id}" class="danger">Borrar</button>
      </div></article>`;
  }).join('') : '<p class="muted card">No hay autos cargados todavía.</p>';
}

async function carAction(act, id){
  const c = cars.find(x => x.id === id); if (!c) return;
  if (act === 'edit') return editCar(c);
  if (act === 'delete') {
    if (!confirm(`¿Borrar ${c.brand} ${c.model}? Se eliminan sus fotos y no se puede deshacer.`)) return;
    const paths = (c.car_photos || []).map(p => p.path);
    if (paths.length) await sb.storage.from(C.bucket).remove(paths);
    const { error } = await sb.from('cars').delete().eq('id', id);
    if (error) return toast(errText(error), true);
    toast('Auto borrado'); return refresh();
  }
  const patch = act === 'renew' ? { expires_at: new Date(Date.now() + 60 * 864e5).toISOString() } : { status: act };
  if (act === 'published') patch.expires_at = new Date(Date.now() + 60 * 864e5).toISOString();
  const { error } = await sb.from('cars').update(patch).eq('id', id);
  if (error) return toast(errText(error), true);
  toast({ paused: 'Auto pausado', published: 'Auto publicado', sold: '¡Vendido! Salió del catálogo', renew: 'Renovado por 60 días' }[act]);
  refresh();
}
async function refresh(){ await Promise.all([loadCars(), loadStats()]); }

// ===== Formulario de auto =====
function resetForm(){
  $('#carForm').reset(); $('#carId').value = ''; newPhotos = []; editingPhotos = []; renderThumbs();
  $('#formTitle').textContent = 'Cargar un auto'; $('#saveCar').textContent = 'Publicar auto'; msg('#carMsg', '');
}
function editCar(c){
  tab('cargar'); resetForm();
  $('#carId').value = c.id; $('#formTitle').textContent = 'Editar ' + c.brand + ' ' + c.model; $('#saveCar').textContent = 'Guardar cambios';
  ['brand','model','version','year','km','fuel','gearbox','currency','price','description'].forEach(k => $('#f_' + k).value = c[k] ?? '');
  $('#f_owners').value = c.owners ?? ''; ['vtv','swap','finance'].forEach(k => $('#f_' + k).checked = !!c[k]);
  $('#f_plate').value = (c.car_private && (c.car_private.plate || (c.car_private[0] && c.car_private[0].plate))) || '';
  editingPhotos = (c.car_photos || []).sort((a, b) => a.position - b.position);
  renderThumbs();
}
function renderThumbs(){
  const old = editingPhotos.map((p, i) => `<div class="th"><img src="${esc(pub(p.path))}" alt=""><button type="button" data-delph="${i}" aria-label="Quitar foto">✕</button></div>`);
  const nw = newPhotos.map((p, i) => `<div class="th new"><img src="${p.url}" alt=""><button type="button" data-delnew="${i}" aria-label="Quitar foto">✕</button></div>`);
  $('#thumbs').innerHTML = old.concat(nw).join('');
}
async function resize(file){
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Solo fotos JPG, PNG o WebP');
  if (file.size > 25 * 1024 * 1024) throw new Error('La foto es demasiado grande');
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const max = 1600, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close && bmp.close();
  // Re-codificar en JPEG elimina metadatos (EXIF/GPS)
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.82));
  return { blob, url: URL.createObjectURL(blob) };
}
$('#photos').addEventListener('change', async e => {
  const files = [...e.target.files]; e.target.value = '';
  for (const f of files) {
    if (editingPhotos.length + newPhotos.length >= 12) { toast('Máximo 12 fotos', true); break; }
    try { newPhotos.push(await resize(f)); } catch (err) { toast(err.message, true); }
  }
  renderThumbs();
});
$('#thumbs').addEventListener('click', async e => {
  const n = e.target.closest('[data-delnew]'); if (n) { URL.revokeObjectURL(newPhotos[n.dataset.delnew].url); newPhotos.splice(n.dataset.delnew, 1); return renderThumbs(); }
  const o = e.target.closest('[data-delph]'); if (o) {
    const p = editingPhotos[o.dataset.delph]; if (!confirm('¿Quitar esta foto?')) return;
    await sb.storage.from(C.bucket).remove([p.path]); await sb.from('car_photos').delete().eq('id', p.id);
    editingPhotos.splice(o.dataset.delph, 1); renderThumbs();
  }
});

$('#carForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('#carId').value;
  const total = editingPhotos.length + newPhotos.length;
  if (total < 4) { msg('#carMsg', 'Subí al menos 4 fotos (frente, lateral, interior y tablero).', true); return; }
  const v = k => $('#f_' + k).value.trim();
  const row = {
    agency_id: current.id, brand: v('brand'), model: v('model'), version: v('version') || null,
    year: +v('year'), km: +v('km'), fuel: v('fuel'), gearbox: v('gearbox'), owners: v('owners') ? +v('owners') : null,
    currency: v('currency'), price: v('price') ? +v('price') : null, description: v('description') || null,
    vtv: $('#f_vtv').checked, swap: $('#f_swap').checked, finance: $('#f_finance').checked
  };
  $('#saveCar').disabled = true; msg('#carMsg', id ? 'Guardando…' : 'Publicando…');
  try {
    let carId = id;
    if (id) { const { error } = await sb.from('cars').update(row).eq('id', id); if (error) throw error; }
    else { const { data, error } = await sb.from('cars').insert(row).select('id').single(); if (error) throw error; carId = data.id; }
    const plate = v('plate').toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    if (plate) { const { error } = await sb.from('car_private').upsert({ car_id: carId, plate }); if (error) throw error; }
    let pos = editingPhotos.length;
    for (let i = 0; i < newPhotos.length; i++) {
      msg('#carMsg', `Subiendo fotos ${i + 1} de ${newPhotos.length}…`);
      const path = `${current.id}/${carId}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await sb.storage.from(C.bucket).upload(path, newPhotos[i].blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      const { error } = await sb.from('car_photos').insert({ car_id: carId, path, position: pos++ }); if (error) throw error;
    }
    newPhotos.forEach(p => URL.revokeObjectURL(p.url)); newPhotos = [];
    toast(id ? 'Cambios guardados' : '¡Auto publicado!');
    resetForm(); await refresh(); tab('autos');
  } catch (err) { msg('#carMsg', errText(err), true); }
  finally { $('#saveCar').disabled = false; }
});

// ===== Mi agencia =====
function fillAgency(){
  const a = current;
  ['name','whatsapp','instagram','address','hours','about'].forEach(k => $('#a_' + k).value = a[k] || '');
  $('#a_perks').value = (a.perks || []).join(', ');
  const img = $('#logoPrev'); if (a.logo_path) { img.src = pub(a.logo_path); img.hidden = false; } else img.hidden = true;
}
$('#agencyForm').addEventListener('submit', async e => {
  e.preventDefault();
  const v = k => $('#a_' + k).value.trim() || null;
  const patch = { name: $('#a_name').value.trim(), whatsapp: v('whatsapp'), instagram: v('instagram'), address: v('address'), hours: v('hours'), about: v('about'),
    perks: $('#a_perks').value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6) };
  const { error } = await sb.from('agencies').update(patch).eq('id', current.id);
  if (error) return msg('#agencyMsg', errText(error), true);
  Object.assign(current, patch); msg('#agencyMsg', 'Guardado ✓');
});
$('#logoFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const { blob } = await resize(f);
    const path = `${current.id}/logo-${Date.now()}.jpg`;
    const { error: upErr } = await sb.storage.from(C.bucket).upload(path, blob, { contentType: 'image/jpeg' }); if (upErr) throw upErr;
    const old = current.logo_path;
    const { error } = await sb.from('agencies').update({ logo_path: path }).eq('id', current.id); if (error) throw error;
    if (old) sb.storage.from(C.bucket).remove([old]);
    current.logo_path = path; fillAgency(); toast('Logo actualizado');
  } catch (err) { toast(errText(err), true); }
});

// ===== Admin =====
async function loadAdmin(){
  const { data } = await sb.from('agencies').select('*').order('name'); const list = data || [];
  const counts = {};
  const { data: cs } = await sb.from('cars').select('agency_id,status');
  (cs || []).forEach(c => { if (c.status !== 'sold') counts[c.agency_id] = (counts[c.agency_id] || 0) + 1; });
  $('#agencyTable').innerHTML = `<table class="table"><thead><tr><th>Agencia</th><th>Autos</th><th>Estado</th><th></th></tr></thead><tbody>${list.map(a => `<tr>
    <td><b>${esc(a.name)}</b>${a.founder ? ' <span class="state s-pub">Fundadora</span>' : ''}<br><small class="muted">/${esc(a.slug)}</small></td>
    <td>${counts[a.id] || 0} / ${a.max_cars}</td>
    <td><select data-status="${a.id}">${['pending','active','suspended'].map(s => `<option value="${s}" ${s === a.status ? 'selected' : ''}>${{ pending: 'Pendiente', active: 'Activa', suspended: 'Suspendida' }[s]}</option>`).join('')}</select></td>
    <td><button data-members="${a.id}" class="small">Miembros</button></td></tr>`).join('')}</tbody></table><div id="membersBox"></div>`;
  $('#m_agency').innerHTML = list.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('');
}
document.addEventListener('change', async e => {
  const s = e.target.closest('[data-status]'); if (!s) return;
  const { error } = await sb.rpc('admin_set_agency', { p_agency: s.dataset.status, p_status: s.value });
  if (error) return toast(errText(error), true);
  toast('Estado actualizado'); start();
});
$('#newAgency').addEventListener('submit', async e => {
  e.preventDefault();
  const { error } = await sb.from('agencies').insert({ name: $('#n_name').value.trim(), slug: $('#n_slug').value.trim(), status: 'pending' });
  if (error) return msg('#newAgencyMsg', /duplicate|unique/.test(error.message) ? 'Esa dirección ya existe.' : errText(error), true);
  msg('#newAgencyMsg', 'Agencia creada como «Pendiente». Activala cuando tenga autos.'); e.target.reset(); start();
});
$('#addMember').addEventListener('submit', async e => {
  e.preventDefault();
  const { data, error } = await sb.rpc('admin_add_member', { p_agency: $('#m_agency').value, p_email: $('#m_email').value.trim(), p_role: 'owner' });
  if (error) return msg('#memberMsg', errText(error), true);
  if (data === 'NO_USER') return msg('#memberMsg', 'Ese correo todavía no está invitado. Invitalo primero en Supabase → Authentication.', true);
  msg('#memberMsg', 'Listo: ya puede entrar al panel con ese correo.'); e.target.reset();
});

// ===== Clicks generales =====
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-tab],[data-go]'); if (t) return tab(t.dataset.tab || t.dataset.go);
  const a = e.target.closest('[data-act]'); if (a) return carAction(a.dataset.act, a.dataset.id);
  const m = e.target.closest('[data-members]'); if (m) {
    const { data } = await sb.rpc('admin_members', { p_agency: m.dataset.members });
    $('#membersBox').innerHTML = '<h3>Miembros</h3>' + ((data || []).map(r => `<p>${esc(r.email)} <small class="muted">${esc(r.role)}</small></p>`).join('') || '<p class="muted">Sin miembros todavía.</p>');
  }
});

start();
})();
