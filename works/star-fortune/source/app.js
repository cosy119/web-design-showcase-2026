import './scene.js';
import './oracle.js';
import './atmosphere.js';
import './toys.js';
import './companions.js';
import {themes,types,fortunes,byId} from './data.js';
import {load,save,fresh,take} from './store.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const engine=()=>window.__fortuneScene;
let data=load(),theme='study',current=null,asked='',pending=false,opened=false,alternative=false,mode='favorites',page=0,role='MascotRoot',storageWarned=false;
const dialog=$('#result-dialog');
function toast(message){engine()?.toast(message);}
function persist(){if(!save(data)&&!storageWarned){storageWarned=true;toast('浏览器暂时无法保存记录，本次抽签仍然可以进行。');}}
window.addEventListener('fortune:motion',e=>{data.motion=e.detail;persist();});
engine().setMotion(false);
const symbols=['✎','⌘','☼','✧'];
function themeButtons(){
  $('#theme-cards').replaceChildren();$('#draw-themes').replaceChildren();
  Object.entries(themes).forEach(([id,t],index)=>{
    const card=document.createElement('button');card.type='button';card.className='theme-card';card.dataset.theme=id;card.style.setProperty('--card-color',t.color);card.style.setProperty('--angle',`${[-4,-1.5,1.5,4][index]}deg`);
    card.innerHTML=`<small>${t.en}</small><span class="theme-number">0${index+1}</span><strong>${t.name}</strong><p>${t.blurb}</p><span class="theme-selected"></span><span class="theme-symbol" aria-hidden="true">${symbols[index]}</span>`;
    card.addEventListener('click',()=>selectTheme(id,true,card));$('#theme-cards').append(card);
    const small=document.createElement('button');small.type='button';small.dataset.theme=id;small.textContent=t.name;small.addEventListener('click',()=>selectTheme(id,true));$('#draw-themes').append(small);
  });
}
function refreshTheme(){
  $$('[data-theme]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.theme===theme));const selected=b.querySelector('.theme-selected');if(selected)selected.textContent=b.dataset.theme===theme?'已选中 · 6 张签':'选择这个主题 ↗';});
  $('#theme-caption').textContent=`当前选择：${themes[theme].name} — ${themes[theme].blurb}`;
  const select=$('#question-select');select.replaceChildren();
  for(const text of ['什么都不问，随心抽一张',...themes[theme].questions]){const option=document.createElement('option');option.value=text===themes[theme].questions[0]||themes[theme].questions.includes(text)?text:'';option.textContent=text;select.append(option);}
  $('#deck-status').textContent=data.decks[theme]?.length===0?'本轮已集齐 · 下次重新洗牌':`本轮还有 ${data.decks[theme]?.length??6} 张待遇见`;
}
function selectTheme(id,notify=false,source=null){
  if(pending)return;if(!themes[id])return;theme=id;engine()?.setTheme(id);refreshTheme();
  if(notify){toast(`已选${themes[id].name}，带着这个主题去抽一张吧。`);if(source)flyTheme(source);}
}
function flyTheme(source){
  if(engine().getState().reduced)return;const rect=source.getBoundingClientRect(),target=engine().project('ChamberSeat');if(!target)return;
  const ghost=document.createElement('div');ghost.className='theme-flight';ghost.textContent='✦';Object.assign(ghost.style,{position:'fixed',left:`${rect.left+rect.width/2}px`,top:`${rect.top+rect.height/2}px`,width:'58px',height:'75px',display:'grid',placeItems:'center',background:themes[theme].color,color:'white',borderRadius:'5px',fontSize:'25px',pointerEvents:'none',zIndex:45});document.body.append(ghost);
  const dx=target.x-rect.left-rect.width/2,dy=target.y-rect.top-rect.height/2;
  ghost.animate([{transform:'translate(-50%,-50%) rotate(0) scale(1)',opacity:1},{transform:`translate(calc(-50% + ${dx*.45}px),calc(-50% + ${dy*.45-80}px)) rotate(-25deg) scale(.7)`,clipPath:'polygon(0 0,100% 40%,35% 55%,20% 100%)',opacity:1},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(-45deg) scale(.05)`,clipPath:'polygon(0 0,100% 40%,35% 55%,20% 100%)',opacity:0}],{duration:900,easing:'cubic-bezier(.2,.7,.3,1)'}).finished.finally(()=>ghost.remove());
}
themeButtons();selectTheme(theme);
window.addEventListener('fortune:ready',()=>engine()?.setTheme(theme));

function requestDraw(){
  if(window.__oracle&&['shuffling','selecting','revealing'].includes(window.__oracle.getState().phase)){toast('先完成当前牌阵，再开始经典单签。');return;}
  if(pending)return;const s=engine().getState();if(!s.ready&&!s.error){toast('店长还在布置小店，请稍等一会儿。');return;}
  if(dialog.open)dialog.close();$('#draw').scrollIntoView({behavior:'instant',block:'start'});
  const full=data.history.length===0||$('#slow').checked;asked=$('#question-select').value;
  current=take(data,theme,asked);pending=true;opened=false;alternative=false;persist();refreshTheme();renderCollection();
  engine().play({duration:full?8:4.5});
}
window.addEventListener('fortune:request',requestDraw);
window.addEventListener('fortune:complete',()=>{if(!pending||!current)return;pending=false;$('#last-open').hidden=false;$('#last-open').textContent=`重新打开「${current.title}」↗`;showFortune(current,false,asked);});
function showFortune(f,revealed=false,question=''){
  current=f;asked=question;opened=false;alternative=false;
  const t=types[f.type],topic=`${themes[f.theme].name} / ${t.name}签`;
  dialog.dataset.signType=f.type;
  let edition=dialog.querySelector('.card-edition');if(!edition){edition=document.createElement('span');edition.className='card-edition';$('#fortune-card .card-front').append(edition);}edition.textContent=`星签收藏 · ${String(fortunes.findIndex(item=>item.id===f.id)+1).padStart(2,'0')} / 24`;
  let caption=dialog.querySelector('.letter-caption');if(!caption){caption=document.createElement('p');caption.className='letter-caption';caption.textContent='接住这一刻的小灵感。';dialog.querySelector('.letter-area').append(caption);}
  dialog.style.setProperty('--type',t.color);dialog.style.setProperty('--accent',themes[f.theme].color);dialog.style.setProperty('--sign-glow',{start:'#f2e6c9',grow:'#e7def2',together:'#f3dce5',turn:'#dcebed',find:'#f2e4d4',rest:'#e4e2f1'}[f.type]);
  $('#card-topic').textContent=topic;$('#card-title').textContent=f.title;$('#card-symbol').textContent=t.icon;$('#card-line').textContent=f.line;
  $('#result-topic').textContent=topic;$('#result-title').textContent=f.title;$('#result-line').textContent=f.line;$('#result-meaning').textContent=f.meaning;$('#result-action').textContent=f.action;$('#result-question').textContent=f.question;
  $('#asked-question').textContent=question?`你想问：${question}`:'';$('#asked-question').hidden=!question;
  $('#reading-closed').hidden=false;$('#reading-open').hidden=true;$('#fortune-card').classList.remove('opened');$('#fortune-card').setAttribute('aria-label','拆开封签，查看签文');$('#unseal').hidden=false;
  $('#alternate').setAttribute('aria-pressed','false');$('#alternate').textContent='换个角度看看 ↻';$('#meaning-label').textContent='此刻提醒';
  updateResultActions();if(!dialog.open)dialog.showModal();if(revealed)unseal();
}
function unseal(){if(!current||opened)return;opened=true;$('#fortune-card').classList.add('opened');$('#fortune-card').setAttribute('aria-label',`${current.title}：${current.line}`);$('#reading-closed').hidden=true;$('#reading-open').hidden=false;$('#unseal').hidden=true;}
$('#fortune-card').addEventListener('click',unseal);$('#unseal').addEventListener('click',unseal);$('#close-result').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('#last-open').addEventListener('click',()=>{if(current)showFortune(current,true,asked);});
$('#again').addEventListener('click',()=>{const next=current?.theme||theme;dialog.close();selectTheme(next);requestDraw();});
$('#alternate').addEventListener('click',()=>{if(!current)return;alternative=!alternative;$('#result-meaning').textContent=alternative?current.alternative:current.meaning;$('#meaning-label').textContent=alternative?'另一个角度':'此刻提醒';$('#alternate').setAttribute('aria-pressed',String(alternative));$('#alternate').textContent=alternative?'回到原来的提醒 ↻':'换个角度看看 ↻';});
function updateResultActions(){
  if(current){const favorite=data.favorites.includes(current.id),hit=data.hits.includes(current.id);$('#favorite').textContent=favorite?'已收入签匣 ✓':'收入签匣 +';$('#favorite').setAttribute('aria-pressed',String(favorite));$('#hit').textContent=hit?'已记下这句回应 ✓':'这句说中了';$('#hit').setAttribute('aria-pressed',String(hit));}
  $$('[data-skin]').forEach(b=>{const locked=b.dataset.skin==='night'&&data.stars.length<3;b.disabled=locked;b.setAttribute('aria-pressed',String(b.dataset.skin===data.skin));if(b.dataset.skin==='night')b.textContent=locked?'星河夜色 · 待解锁':'星河夜色';});
}
$('#hit').addEventListener('click',()=>{if(!current)return;data.hits=data.hits.includes(current.id)?data.hits.filter(id=>id!==current.id):[...data.hits,current.id];persist();updateResultActions();});
$('#favorite').addEventListener('click',()=>{
  if(!current)return;const was=data.favorites.includes(current.id);data.favorites=was?data.favorites.filter(id=>id!==current.id):[current.id,...data.favorites];persist();updateResultActions();renderCollection();
  if(!was){flyFavorite();toast(`「${current.title}」已收入签匣。`);}else toast('已取消收藏，抽签历史仍然保留。');
});
function flyFavorite(){
  if(engine().getState().reduced)return;const r=$('#fortune-card').getBoundingClientRect(),target=$('#nav-count').getBoundingClientRect(),ghost=document.createElement('div');
  ghost.className='favorite-flight';ghost.textContent='✦';Object.assign(ghost.style,{position:'fixed',left:`${r.left+r.width/2}px`,top:`${r.top+r.height/2}px`,width:'52px',height:'70px',display:'grid',placeItems:'center',background:'#e7d7ee',border:'3px solid #fffaf3',borderRadius:'6px',color:'#ae8bbb',fontSize:'25px',zIndex:999,pointerEvents:'none'});
  if(typeof ghost.showPopover==='function'){ghost.setAttribute('popover','manual');ghost.style.margin='0';document.body.append(ghost);ghost.showPopover();}else dialog.append(ghost);
  const dx=target.left-r.left-r.width/2,dy=target.top-r.top-r.height/2;
  ghost.animate([{transform:'translate(-50%,-50%) rotate(0deg)',opacity:1},{transform:`translate(${dx}px,${dy}px) rotate(18deg) scale(.15)`,opacity:0}],{duration:900,easing:'cubic-bezier(.2,.7,.2,1)'}).finished.finally(()=>ghost.remove());
}

function typeCards(){Object.entries(types).forEach(([id,t],index)=>{const button=document.createElement('button');button.type='button';button.className='type-card';button.dataset.type=id;button.style.setProperty('--type',t.color);button.style.setProperty('--angle',`${[-11,-7,-3,3,7,11][index]}deg`);button.innerHTML=`<span class="card-no">0${index+1} / LITTLE SIGN</span><span class="type-symbol" aria-hidden="true">${t.icon}</span><b>${t.name}签</b><small>${t.hint}</small>`;button.addEventListener('click',()=>selectType(id));$('#type-fan').append(button);});selectType('start');}
function selectType(id){const t=types[id];$$('[data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===id)));$('#type-detail').style.setProperty('--type',t.color);$('#type-icon').textContent=t.icon;$('#type-title').textContent=`${t.name}签 · ${t.hint}`;$('#type-description').textContent=t.description;}
typeCards();
const roles={MascotRoot:{tag:'认真营业 / 偶尔顽皮',title:'负责接住你的小小心事。',description:'喜欢凑近签仓偷看，也会在出签时替你高兴。轻碰会弹起，点击会挥手。',action:'和店长打个招呼 ↗'},CloudRoot:{tag:'慢半拍 / 柔软担当',title:'你歇一歇，它来托住纸条。',description:'休憩签的专属小伙伴。看起来在发呆，其实很会照顾节奏；碰一下会软软地弹回来。',action:'轻轻叫醒云朵 ↗'},StarRoot:{tag:'好奇心雷达 / 小店领航员',title:'负责发现那些小小的闪光。',description:'喜欢绕着签仓飞，也喜欢给新想法带路。点击它，会收到一颗星星的问候。',action:'和星星打个招呼 ↗'}};
$$('[data-role]').forEach(b=>b.addEventListener('click',()=>{role=b.dataset.role;const r=roles[role];$$('[data-role]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));$('#role-tag').textContent=r.tag;$('#role-title').textContent=r.title;$('#role-description').textContent=r.description;$('#greet').textContent=r.action;engine()?.greet(role);}));
$('#greet').addEventListener('click',()=>{engine()?.greet(role);toast(role==='MascotRoot'?'店长：很高兴遇见你。':role==='CloudRoot'?'云朵：不着急，慢慢来。':'星星：给今天留一点好奇。');});
$$('[data-highlight]').forEach(el=>{el.addEventListener('pointerenter',()=>engine()?.highlight(el.dataset.highlight));if(el.tagName==='BUTTON')el.addEventListener('click',()=>{engine()?.highlight(el.dataset.highlight);toast({ChamberSeat:'六支签条，各自等待被选中的时刻。',ButtonTouch:'这颗星可以点按，也可以长按蓄能。',SlotBezel:'纸条会沿着导轨滑出来，再来到你面前。'}[el.dataset.highlight]||'小店员正在向你打招呼。');});});

function renderCollection(){
  $('#nav-count').textContent=data.favorites.length;$('#collected-count').textContent=String(data.seen.length).padStart(2,'0');$('#favorites-count').textContent=`${data.favorites.length} 张主动收藏`;$('#collection-progress').style.width=`${data.seen.length/24*100}%`;
  const filter=$('#collection-theme').value;let entries=mode==='history'?data.history.map(r=>({f:byId[r.id],record:r})):mode==='all'?fortunes.map(f=>({f,locked:!data.seen.includes(f.id)})):data.favorites.map(id=>({f:byId[id]}));
  if(filter!=='all')entries=entries.filter(v=>v.f.theme===filter);const maxPages=Math.max(1,Math.ceil(entries.length/12));page=Math.min(page,maxPages-1);
  const grid=$('#collection-grid');grid.replaceChildren();
  if(!entries.length){const empty=document.createElement('div');empty.className='collection-empty';empty.innerHTML=`<span aria-hidden="true">✧</span><h3>${mode==='favorites'?'签匣留好了，等你放进第一张喜欢的签。':'这里还没有遇见的纸条。'}</h3><p>${filter==='all'?'去抽一张，给今天留下一个提醒。':'可以切换主题，或遇见一张这个主题的签。'}</p><a href="#draw">去抽一张 ↗</a>`;grid.append(empty);}
  for(const entry of entries.slice(page*12,page*12+12)){
    const {f,locked,record}=entry,t=types[f.type],button=document.createElement('button');button.type='button';button.className=`saved-card${locked?' locked':''}`;button.style.setProperty('--type',t.color);button.dataset.fortune=f.id;
    if(locked)button.disabled=true;button.innerHTML='<span class="saved-icon"></span><small></small><strong></strong><p></p><span class="favorite-mark"></span>';
    button.querySelector('.saved-icon').textContent=locked?'✧':t.icon;button.querySelector('small').textContent=`${themes[f.theme].name} / ${t.name}签${record?' · '+new Date(record.at).toLocaleDateString('zh-CN',{month:'numeric',day:'numeric'}):''}`;
    button.querySelector('strong').textContent=locked?'还在来的路上':f.title;button.querySelector('p').textContent=locked?'遇见后，在这里重新阅读。':f.line;button.querySelector('.favorite-mark').textContent=data.favorites.includes(f.id)?'♡':'';
    if(!locked)button.addEventListener('click',()=>showFortune(f,true,record?.question||''));grid.append(button);
  }
  if(maxPages>1){const pagination=document.createElement('div');pagination.className='pagination';const prev=document.createElement('button'),next=document.createElement('button'),text=document.createElement('span');prev.textContent='上一页';next.textContent='下一页';text.textContent=`${page+1} / ${maxPages}`;prev.disabled=page===0;next.disabled=page===maxPages-1;prev.addEventListener('click',()=>{page--;renderCollection();});next.addEventListener('click',()=>{page++;renderCollection();});pagination.append(prev,text,next);grid.append(pagination);}
  $('#collection-caption').textContent=mode==='history'?'保留最近 60 次相遇，重复签仍会记录；收集进度按不同签卡计数。':mode==='all'?'24 个卡位，每个主题各有六种性格。未遇见的签会保留神秘感。':'喜欢一张签时，点击“收入签匣”，就会在这里再次相遇。';
}
$$('[data-collection]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.collection;page=0;$$('[data-collection]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));renderCollection();}));
$('#collection-theme').addEventListener('change',()=>{page=0;renderCollection();});
$('#clear-records').addEventListener('click',()=>{if(!confirm('清空这台浏览器的抽签进度、牌阵历史、收藏和隐藏星星？动效偏好会保留。'))return;const motion=data.motion;data=fresh();data.motion=motion;current=null;pending=false;page=0;$('#last-open').hidden=true;persist();refreshTheme();renderCollection();refreshStars();engine()?.reset();window.dispatchEvent(new Event('fortune:clear-records'));toast('本机签匣已清空，下一次相遇从这里开始。');});
renderCollection();
function refreshStars(){
  $$('[data-secret]').forEach(b=>{const found=data.stars.includes(b.dataset.secret);b.classList.toggle('found',found);b.disabled=found;b.setAttribute('aria-label',found?'这颗小星星已经收集':'收集这里的小星星');});
  $('#star-count').textContent=`✧ ${data.stars.length} / 3 颗小星星`;$('#star-hint').textContent=data.stars.length===3?'三颗星已集齐！保存签卡时，可以选择“星河夜色”背景。':'小店藏着三颗可以点击的小星星。找齐后，解锁“星河夜色”分享卡背景。';updateResultActions();
}
$$('[data-secret]').forEach(b=>b.addEventListener('click',()=>{if(data.stars.includes(b.dataset.secret))return;data.stars.push(b.dataset.secret);persist();refreshStars();toast(data.stars.length===3?'找齐啦！已解锁“星河夜色”分享卡背景。':`收下一颗小星星，已经找到 ${data.stars.length} / 3 颗。`);}));
$$('[data-skin]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.skin==='night'&&data.stars.length<3)return;data.skin=b.dataset.skin;persist();updateResultActions();}));refreshStars();

function wrap(ctx,text,x,y,maxWidth,lineHeight){let line='';for(const c of text){if(ctx.measureText(line+c).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;line='';}line+=c;}if(line)ctx.fillText(line,x,y);return y+lineHeight;}
function cardData(f){
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1440;const ctx=canvas.getContext('2d'),night=data.skin==='night';
  const gradient=ctx.createLinearGradient(0,0,1080,1440);gradient.addColorStop(0,night?'#292840':'#e8deed');gradient.addColorStop(1,night?'#53426c':'#f7eddb');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1440);
  ctx.fillStyle=night?'#f7e7ac99':'#b99bc066';for(let i=0;i<45;i++){const x=(i*173+37)%1080,y=(i*281+61)%1440;ctx.beginPath();ctx.arc(x,y,i%3+1.5,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle=night?'#302c45':'#fffaf1';ctx.beginPath();ctx.roundRect(65,65,950,1310,35);ctx.fill();ctx.strokeStyle=night?'#9177a6':'#d6bddf';ctx.lineWidth=2;ctx.stroke();ctx.textAlign='center';ctx.fillStyle=night?'#cbb0de':'#a182b3';ctx.font='bold 32px sans-serif';ctx.fillText('✦ 星签事务所 ✦',540,154);ctx.font='26px sans-serif';ctx.fillText(`${themes[f.theme].name} / ${types[f.type].name}签`,540,222);
  ctx.fillStyle=night?'#fff2d8':'#483a54';ctx.font='bold 72px sans-serif';ctx.fillText(f.title,540,356);ctx.fillStyle=types[f.type].color;ctx.font='90px sans-serif';ctx.fillText(types[f.type].icon,540,480);ctx.font='36px sans-serif';ctx.fillStyle=night?'#e6cdea':'#9372a3';wrap(ctx,f.line,540,572,760,56);
  ctx.textAlign='left';ctx.font='bold 28px sans-serif';ctx.fillStyle=night?'#c9a3da':'#a17ab1';ctx.fillText('此刻提醒',150,740);ctx.font='30px sans-serif';ctx.fillStyle=night?'#ebdced':'#796582';wrap(ctx,f.meaning,150,800,780,49);ctx.font='bold 28px sans-serif';ctx.fillStyle=night?'#c9a3da':'#a17ab1';ctx.fillText('可以试试',150,1060);ctx.font='30px sans-serif';ctx.fillStyle=night?'#ebdced':'#796582';wrap(ctx,f.action,150,1120,780,49);ctx.textAlign='center';ctx.font='23px sans-serif';ctx.fillStyle=night?'#a48bb7':'#b09aba';ctx.fillText('趣味启发 · 决定仍在你手里',540,1310);return canvas.toDataURL('image/png');
}
$('#save-card').addEventListener('click',()=>{if(!current)return;const a=document.createElement('a');a.download=`星签事务所_${current.title}.png`;a.href=cardData(current);document.body.append(a);a.click();a.remove();toast('签卡图片已生成，愿这句提醒陪你过好今天。');});

const sections=$$('[data-scene]');let scrollQueued=false;
function onScroll(){
  scrollQueued=false;const max=document.documentElement.scrollHeight-innerHeight;$('#page-progress').style.width=`${max>0?scrollY/max*100:0}%`;
  let active=sections[0];for(const section of sections){const rect=section.getBoundingClientRect();if(rect.top<innerHeight*.42)active=section;const reveal=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight*.8)));section.style.setProperty('--reveal',reveal);if(rect.top<innerHeight*.85)section.classList.add('entered');}
  $$('[data-rail]').forEach(a=>a.classList.toggle('active',a.dataset.rail===active.id));$$('.topbar nav a').forEach(a=>a.toggleAttribute('aria-current',a.getAttribute('href')===`#${active.id}`));$$('.topbar nav a[aria-current]').forEach(a=>a.setAttribute('aria-current','location'));
  $('#stage-hint').hidden=!['welcome','features','roles'].includes(active.id)||engine().getState().drawing;
  if(engine().getState().error)$('#fallback').style.opacity=['welcome','features','roles','draw'].includes(active.id)?'1':'0';
}
addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(onScroll);}},{passive:true});addEventListener('resize',onScroll);onScroll();
window.__fortuneApp={getState:()=>({theme,pending,current:current?.id,opened,mode,records:JSON.parse(JSON.stringify(data)),total:fortunes.length}),draw:requestDraw,open:id=>{if(byId[id])showFortune(byId[id],true);},cardData:()=>current?cardData(current):null};
