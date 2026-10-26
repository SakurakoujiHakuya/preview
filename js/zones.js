/* Active-zone tracker: writes html[data-active-zone] from the section crossing the viewport's upper-middle band, and highlights the nav item. */
(function(){
'use strict';
const root=document.documentElement;
const sections=[...document.querySelectorAll('main>section[data-zone]')];
const links=[...document.querySelectorAll('.topbar nav a')];
function activate(sec){
  if(!sec)return;
  if(root.dataset.activeZone!==sec.dataset.zone)root.dataset.activeZone=sec.dataset.zone;
  const id=sec.id||'';
  links.forEach(a=>{const on=!!id&&a.hash==='#'+id;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});
}
function fromHash(){let h='';try{h=decodeURIComponent(location.hash.slice(1))}catch{}const t=h&&document.getElementById(h);return t?t.closest('main>section[data-zone]'):null}
function fromScroll(){const y=innerHeight*0.42;return sections.find(s=>{const r=s.getBoundingClientRect();return r.top<=y&&r.bottom>y})||null}
activate(fromHash()||fromScroll()||sections[0]);
requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.remove('zone-init')));
/* Keep a deep link (#psyche, #lab…) anchored while async content above it (gallery catalog) changes height; stops on first user input or after 4s. */
(function pin(){const t=fromHash()&&document.getElementById(decodeURIComponent(location.hash.slice(1)));if(!t||!('ResizeObserver' in window))return;let on=true;const stop=()=>{on=false;ro.disconnect()};const ro=new ResizeObserver(()=>{if(on){t.scrollIntoView({block:'start',behavior:'instant'});activate(t.closest('main>section[data-zone]'))}});ro.observe(document.querySelector('main')||document.body);['wheel','touchstart','keydown','pointerdown'].forEach(e=>addEventListener(e,stop,{once:true,passive:true}));setTimeout(stop,4000)})();
if(!('IntersectionObserver' in window))return;
const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))activate(fromScroll())},{rootMargin:'-42% 0px -57% 0px'});
sections.forEach(s=>io.observe(s));
let raf=0;addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;const s=fromScroll();if(s)activate(s)})},{passive:true});
addEventListener('hashchange',()=>activate(fromHash()||fromScroll()));
})();
