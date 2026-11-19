(function(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function count(el){
  const end=Number(el.dataset.count),suf=el.dataset.suffix||'';
  if(reduce||!end){el.textContent=end+suf;return}
  const t0=performance.now(),dur=1400;
  (function step(t){const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=Math.round(end*e)+suf;if(k<1)requestAnimationFrame(step)})(t0);
}
const els=document.querySelectorAll('.reveal');
if(!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));document.querySelectorAll('[data-count]').forEach(count);return}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add('in');e.target.querySelectorAll('[data-count]').forEach(count);io.unobserve(e.target)}),{threshold:.15});
els.forEach(e=>io.observe(e));
// cifras reales del catálogo
const a=document.querySelector('[data-count="4"]'),c=document.querySelector('[data-count="15"]');
if(typeof AGENCIES!=='undefined'&&a)a.dataset.count=AGENCIES.length;
if(typeof CARS!=='undefined'&&c)c.dataset.count=CARS.length;
})();
