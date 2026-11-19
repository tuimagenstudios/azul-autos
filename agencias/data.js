// Datos de ejemplo. Agencias y autos ficticios: no son avisos reales.
const AGENCIES = [
  {id:'centro', name:'Facundo Gomez Automotores', initials:'FG', logo:'images/agencias/fg-logo.webp', color:'#13234d', address:'Lavalle 539, Azul', hours:'Consultá horarios por WhatsApp', since:null, verified:true, wa:'542281579090', ig:'automotoresfg', about:'Tu próxima oportunidad está acá. Venta, compra y consignación de autos, con gestoría del automotor.', perks:['Venta y compra','Consignación','Gestoría del automotor']},
  {id:'ruta3', name:'Pampa Pick-ups (demo)', initials:'PP', color:'#0f8a5f', address:'Calle de ejemplo 900, Azul', hours:'Lun a sáb 8–18', since:2015, verified:true, about:'Especialistas en pick-ups y utilitarios para el campo.', perks:['Pick-ups y 4x4','Toma de usados','Gestoría propia']},
  {id:'norte', name:'Norte Usados (demo)', initials:'NU', color:'#c2410c', address:'Calle de ejemplo 450, Azul', hours:'Lun a vie 9–19', since:2018, verified:true, about:'Autos chicos y económicos, ideales para el primer auto.', perks:['Primer auto','Financiación','Revisión en taller']},
  {id:'plaza', name:'Plaza Motors (demo)', initials:'PM', color:'#7c3aed', address:'Frente a la plaza de ejemplo, Azul', hours:'Lun a sáb 9–20', since:2012, verified:true, about:'SUV y autos con pocos kilómetros. Unidades revisadas antes de publicarse.', perks:['SUV','0 a 50.000 km','Garantía 6 meses']}
];
const CARS = [
  {id:1,agency:'centro',name:'Toyota Corolla',version:'1.8 XEi CVT',year:2021,km:48500,price:22500,currency:'USD',fuel:'Nafta',box:'Automática',photo:1,vtv:true,owners:1,swap:true,finance:true,featured:true},
  {id:2,agency:'centro',name:'Volkswagen Golf',version:'1.4 TSI Comfortline',year:2018,km:82000,price:19500000,currency:'ARS',fuel:'Nafta',box:'Manual',photo:2,vtv:true,owners:2,swap:true,finance:true},
  {id:3,agency:'norte',name:'Ford Focus',version:'2.0 SE Plus',year:2017,km:96000,price:16800000,currency:'ARS',fuel:'Nafta',box:'Manual',photo:3,vtv:true,owners:2,swap:false,finance:true},
  {id:4,agency:'plaza',name:'Peugeot 208',version:'1.6 Allure',year:2022,km:31000,price:21900000,currency:'ARS',fuel:'Nafta',box:'Manual',photo:4,vtv:true,owners:1,swap:true,finance:true,featured:true},
  {id:5,agency:'norte',name:'Fiat Cronos',version:'1.3 Drive',year:2020,km:61000,price:15900000,currency:'ARS',fuel:'Nafta',box:'Manual',photo:5,vtv:true,owners:1,swap:true,finance:true},
  {id:6,agency:'norte',name:'Renault Sandero',version:'1.6 Life',year:2019,km:74000,price:13500000,currency:'ARS',fuel:'Nafta / GNC',box:'Manual',photo:6,vtv:false,owners:2,swap:true,finance:false},
  {id:7,agency:'centro',name:'Chevrolet Onix',version:'1.0 Turbo LTZ',year:2022,km:28000,price:20500000,currency:'ARS',fuel:'Nafta',box:'Automática',photo:7,vtv:true,owners:1,swap:false,finance:true},
  {id:8,agency:'ruta3',name:'Toyota Hilux',version:'2.8 SRV 4x4',year:2020,km:110000,price:36000,currency:'USD',fuel:'Diésel',box:'Manual',photo:8,vtv:true,owners:1,swap:true,finance:true,featured:true},
  {id:9,agency:'ruta3',name:'Ford Ranger',version:'3.2 XLT 4x4',year:2019,km:128000,price:31000,currency:'USD',fuel:'Diésel',box:'Automática',photo:9,vtv:true,owners:2,swap:true,finance:false},
  {id:10,agency:'ruta3',name:'Volkswagen Amarok',version:'2.0 Highline',year:2018,km:142000,price:27500,currency:'USD',fuel:'Diésel',box:'Manual',photo:10,vtv:true,owners:2,swap:true,finance:true},
  {id:11,agency:'plaza',name:'Renault Duster',version:'1.6 Intens',year:2021,km:45000,price:24800000,currency:'ARS',fuel:'Nafta',box:'Manual',photo:11,vtv:true,owners:1,swap:true,finance:true},
  {id:12,agency:'plaza',name:'Jeep Renegade',version:'1.8 Sport',year:2019,km:68000,price:23900000,currency:'ARS',fuel:'Nafta',box:'Automática',photo:12,vtv:true,owners:1,swap:false,finance:true},
  {id:13,agency:'plaza',name:'Nissan Kicks',version:'1.6 Advance',year:2023,km:18000,price:26500,currency:'USD',fuel:'Nafta',box:'Automática',photo:13,vtv:true,owners:1,swap:true,finance:true},
  {id:14,agency:'norte',name:'Citroën C3',version:'1.2 Feel',year:2021,km:39000,price:17200000,currency:'ARS',fuel:'Nafta',box:'Manual',photo:14,vtv:true,owners:1,swap:true,finance:true},
  {id:15,agency:'centro',name:'Honda HR-V',version:'1.8 EXL CVT',year:2020,km:57000,price:25900,currency:'USD',fuel:'Nafta',box:'Automática',photo:15,vtv:true,owners:1,swap:true,finance:false}
];

// Personalizar la agencia principal con ?agencia=Nombre (para propuestas)
(function(){
  const n=(new URLSearchParams(location.search).get('agencia')||'').trim().slice(0,60);
  if(!n)return;
  const a=AGENCIES[0];
  a.name=n;
  a.initials=n.split(/\s+/).filter(w=>w.length>2).map(w=>w[0]).join('').slice(0,3).toUpperCase()||n[0].toUpperCase();
  window.AGENCY_CUSTOM=a;
})();
