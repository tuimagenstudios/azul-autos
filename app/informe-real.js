(function(){
'use strict';
const C = window.AZUL;
const sb = window.supabase.createClient(C.url, C.key, { auth: { persistSession: true, flowType: 'pkce' } });
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pub = p => p ? sb.storage.from(C.bucket).getPublicUrl(p).data.publicUrl : '';
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const money = c => c.price ? (c.currency === 'USD' ? 'US$ ' : '$ ') + Number(c.price).toLocaleString('es-AR') : 'Consultar';
const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : 0;
const fmtPct = n => n.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

function delta(el, now, prev, unit){
  if (!prev && !now) { el.textContent = 'sin movimiento todavía'; el.className = 'flat'; return; }
  if (!prev) { el.textContent = 'primer mes con datos'; el.className = 'up'; return; }
  const d = now - prev, p = Math.round(d / prev * 100);
  el.textContent = d === 0 ? '= igual que el mes anterior' : (d > 0 ? '▲ ' : '▼ ') + Math.abs(p) + '% vs. mes anterior';
  el.className = d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
}

async function main(){
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { $('#state').innerHTML = 'Tenés que <a href="panel.html">ingresar al panel</a> para ver el informe.'; return; }
  const params = new URLSearchParams(location.search);
  const agencyId = params.get('agencia');
  const { data: agency, error } = await sb.from('agencies').select('*').eq('id', agencyId).single();
  if (error || !agency) { $('#state').textContent = 'No encontramos la agencia o no tenés acceso a ella.'; return; }

  // Selector de meses: desde el alta de la agencia hasta hoy
  const now = new Date(), start = new Date(agency.created_at);
  const opts = []; for (let d = new Date(now.getFullYear(), now.getMonth(), 1); d >= new Date(start.getFullYear(), start.getMonth(), 1); d.setMonth(d.getMonth() - 1)) opts.push(new Date(d));
  const sel = $('#month');
  sel.innerHTML = opts.map(d => `<option value="${d.getFullYear()}-${d.getMonth()}">${MESES[d.getMonth()]} ${d.getFullYear()}</option>`).join('');
  const want = params.get('mes'); if (want && [...sel.options].some(o => o.value === want)) sel.value = want;
  sel.onchange = () => { const u = new URL(location.href); u.searchParams.set('mes', sel.value); location.href = u; };
  const [yy, mm] = sel.value.split('-').map(Number);
  const m0 = new Date(yy, mm, 1), m1 = new Date(yy, mm + 1, 1), p0 = new Date(yy, mm - 1, 1);
  const isCurrent = m0.getFullYear() === now.getFullYear() && m0.getMonth() === now.getMonth();

  const [{ data: ev }, { data: cars }] = await Promise.all([
    sb.from('events').select('car_id,kind,created_at').eq('agency_id', agency.id).gte('created_at', p0.toISOString()).lt('created_at', m1.toISOString()),
    sb.from('cars').select('id,brand,model,year,currency,price,status,expires_at,updated_at,car_photos(path,position)').eq('agency_id', agency.id)
  ]);
  const evs = ev || [];
  const inM = e => new Date(e.created_at) >= m0, inP = e => new Date(e.created_at) < m0;
  const count = (f, kind) => evs.filter(e => f(e) && e.kind === kind).length;
  const k = { views: count(inM, 'view_car'), wa: count(inM, 'whatsapp'), ag: count(inM, 'view_agency') };
  const pk = { views: count(inP, 'view_car'), wa: count(inP, 'whatsapp'), ag: count(inP, 'view_agency') };
  const soldNow = (cars || []).filter(c => c.status === 'sold' && new Date(c.updated_at) >= m0 && new Date(c.updated_at) < m1).length;
  const soldPrev = (cars || []).filter(c => c.status === 'sold' && new Date(c.updated_at) >= p0 && new Date(c.updated_at) < m0).length;

  // Encabezado
  $('#agName').textContent = agency.name;
  $('#agMark').innerHTML = agency.logo_path ? `<img src="${esc(pub(agency.logo_path))}" alt="">` : esc(agency.name.split(/\s+/).filter(w => w.length > 2).map(w => w[0]).join('').slice(0, 3).toUpperCase());
  const last = isCurrent ? now.getDate() : new Date(yy, mm + 1, 0).getDate();
  $('#periodTxt').textContent = MESES[mm][0].toUpperCase() + MESES[mm].slice(1) + ' ' + yy;
  $('#heroTxt').textContent = `Así se movieron tus autos del 1 al ${last} de ${MESES[mm]} de ${yy}${isCurrent ? ' (mes en curso)' : ''}.`;
  $('#kViews').textContent = k.views.toLocaleString('es-AR'); $('#kWa').textContent = k.wa; $('#kSold').textContent = soldNow; $('#kAg').textContent = k.ag;
  delta($('#dViews'), k.views, pk.views); delta($('#dWa'), k.wa, pk.wa); delta($('#dSold'), soldNow, soldPrev); delta($('#dAg'), k.ag, pk.ag);

  // Semanas
  const weeks = []; for (let d = 1; d <= new Date(yy, mm + 1, 0).getDate(); d += 7) weeks.push([d, Math.min(d + 6, new Date(yy, mm + 1, 0).getDate())]);
  if (weeks.length > 4) { weeks[3][1] = weeks[4][1]; weeks.length = 4; }
  const wc = weeks.map(([a, b]) => evs.filter(e => e.kind === 'whatsapp' && inM(e) && new Date(e.created_at).getDate() >= a && new Date(e.created_at).getDate() <= b).length);
  const mx = Math.max(1, ...wc), mes3 = MESES[mm].slice(0, 3);
  $('#bars').innerHTML = weeks.map(([a, b], i) => `<div class="bar"><b>${wc[i]}</b><i data-h="${Math.round(wc[i] / mx * 100)}"></i><span>${a}–${b} ${mes3}</span></div>`).join('');
  document.querySelectorAll('.bar i').forEach(i => { i.style.height = Math.max(2, +i.dataset.h) + '%'; });
  const best = wc.indexOf(Math.max(...wc));
  $('#barsNote').textContent = k.wa ? `La semana con más consultas fue la del ${weeks[best][0]} al ${weeks[best][1]} de ${MESES[mm]}.` : 'Todavía no hubo consultas por WhatsApp este mes.';

  // Tabla de autos
  const rows = (cars || []).filter(c => c.status !== 'sold' || (new Date(c.updated_at) >= m0)).map(c => {
    const v = evs.filter(e => inM(e) && e.car_id === c.id && e.kind === 'view_car').length;
    const w = evs.filter(e => inM(e) && e.car_id === c.id && e.kind === 'whatsapp').length;
    return { ...c, v, w, conv: pct(w, v), photos: (c.car_photos || []).length };
  }).sort((a, b) => b.v - a.v);
  const est = c => c.status === 'sold' ? 'Vendido ✓' : c.status === 'paused' ? 'Pausado' : new Date(c.expires_at) < now ? 'Vencido' : 'Publicado';
  const ph = c => { const p = (c.car_photos || []).sort((a, b) => a.position - b.position)[0]; return p ? `<img src="${esc(pub(p.path))}" alt="">` : ''; };
  $('#carsTable').innerHTML = `<table><thead><tr><th>Auto</th><th>Visitas</th><th>WhatsApp</th><th>Conversión</th><th>Estado</th></tr></thead><tbody>${rows.length ? rows.map(c => `<tr><td class="car">${ph(c)}<span><b>${esc(c.brand)} ${esc(c.model)} ${c.year}</b><br>${esc(money(c))}</span></td><td>${c.v}</td><td>${c.w}</td><td><span class="pill ${c.v < 10 ? 'mid' : c.conv >= 5 ? 'good' : c.conv >= 2 ? 'mid' : 'bad'}">${c.v < 10 ? '—' : fmtPct(c.conv)}</span></td><td>${est(c)}</td></tr>`).join('') : '<tr class="empty-row"><td colspan="5">Todavía no hay autos cargados.</td></tr>'}</tbody></table>`;

  // Recomendaciones automáticas (reglas fijas)
  const tips = [];
  const pub0 = rows.filter(c => c.status === 'published');
  pub0.filter(c => c.v >= 30 && c.conv < 2).slice(0, 2).forEach(c => tips.push(['warn', `${c.brand} ${c.model}: mucha visita, pocas consultas`, `${c.v} personas lo vieron y ${c.w} escribieron. Suele pasar cuando el precio está por encima de autos parecidos. Revisá el precio o sumá «acepta permuta».`]));
  pub0.filter(c => c.photos < 4).slice(0, 2).forEach(c => tips.push(['', `Sumá fotos al ${c.brand} ${c.model}`, `Tiene ${c.photos} ${c.photos === 1 ? 'foto' : 'fotos'}. Los autos con 4 fotos o más reciben más consultas.`]));
  pub0.filter(c => new Date(c.expires_at) - now < 10 * 864e5 && new Date(c.expires_at) > now).slice(0, 2).forEach(c => tips.push(['', `Renová el ${c.brand} ${c.model}`, `Vence el ${new Date(c.expires_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}. Renovalo desde «Mis autos» para que siga visible.`]));
  pub0.filter(c => !c.price).slice(0, 1).forEach(c => tips.push(['', `Poné precio al ${c.brand} ${c.model}`, 'Los autos con precio visible reciben más consultas que los que dicen «Consultar».']));
  const top = rows.filter(c => c.w > 0).sort((a, b) => b.w - a.w)[0];
  if (top) tips.push(['good', 'Lo que funcionó', `El ${top.brand} ${top.model} fue tu auto con más consultas: ${top.w} por WhatsApp.`]);
  if (!pub0.length) tips.push(['', 'Cargá tus autos', 'Todavía no tenés autos publicados. Desde «Cargar auto» lo hacés en 2 minutos desde el celular.']);
  if (!tips.length) tips.push(['good', 'Todo en orden', 'No encontramos nada para corregir este mes. ¡Seguí así!']);
  $('#tipsTitle').textContent = 'Recomendaciones para ' + MESES[(mm + 1) % 12];
  $('#tips').innerHTML = tips.slice(0, 4).map(([cls, t, p]) => `<div class="tip ${cls}"><b>${esc(t)}</b><p>${esc(p)}</p></div>`).join('');

  $('#state').hidden = true; $('#report').hidden = false;
  document.title = 'Informe ' + MESES[mm] + ' ' + yy + ' — ' + agency.name;
}
$('#print').addEventListener('click', () => window.print());
main();
})();
