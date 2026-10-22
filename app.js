(() => {
const draft = document.querySelector('#draft'), preview = document.querySelector('#preview'), model = document.querySelector('#model'), count = document.querySelector('#count');
const initial = draft.value;
function update(){
 const lines = draft.value.split('\n').filter(line=>line.trim());
 const nodes=lines.map(line=>{const heading=/^#\s/.test(line);return {type:heading?'heading':'paragraph',...(heading?{attrs:{level:1}}:{}),content:[{type:'text',text:heading?line.replace(/^#\s/,''):line}]};});
 preview.replaceChildren();
 nodes.forEach(node=>{const el=document.createElement(node.type==='heading'?'h3':'p');el.textContent=node.content[0].text;preview.append(el);});
 if(!nodes.length){const el=document.createElement('p');el.className='empty';el.textContent='空白，也是一种开始。试着在左侧写下第一句话。';preview.append(el);}
 model.textContent=JSON.stringify({type:'doc',content:nodes},null,2);
 count.textContent=`${Array.from(draft.value).length} 字符 · ${nodes.length} 个节点`;
}
draft.addEventListener('input',update);document.querySelector('#reset').addEventListener('click',()=>{draft.value=initial;update();draft.focus();});
const tabs=[...document.querySelectorAll('[role=tab]')];
function selectTab(tab){tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!selected;});}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;else if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();selectTab(tabs[next]);tabs[next].focus();});});
const progress=document.querySelector('.progress');function scrollProgress(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?scrollY/max*100:0)+'%';}addEventListener('scroll',scrollProgress,{passive:true});addEventListener('resize',scrollProgress);update();scrollProgress();
})();
