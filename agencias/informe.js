document.getElementById('print').addEventListener('click',()=>window.print());
// Personalizar con ?agencia=Nombre de la agencia (iniciales automáticas, o &ini=AB)
(function(){
  const p=new URLSearchParams(location.search);
  const name=(p.get('agencia')||'').trim().slice(0,60);
  if(!name)return;
  const ini=((p.get('ini')||'').trim()||name.split(/\s+/).filter(w=>w.length>2||/^\d/.test(w)).map(w=>w[0]).join('')).slice(0,3).toUpperCase();
  document.getElementById('agName').textContent=name;
  document.getElementById('agMark').textContent=ini||name[0].toUpperCase();
  document.title='Informe mensual — '+name;
})();
