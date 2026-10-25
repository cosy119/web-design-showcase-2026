import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {themes} from './data.js';
import {plushify} from './fur.js';

const $ = s => document.querySelector(s);
const host = $('#canvas-host');
const state = { ready:false, drawing:false, complete:false, time:0, reduced:false, sound:true, theme:'study', error:null, collisions:0, stage:'loading',section:'welcome',story:0 };
let renderer,scene,camera,controls,model,mixer,drawAction,drawClip,clock=0,lastNow=0,drawPhase=-1;
let plush;
let held=false,holdTimer=null,pointerDown=null,dragged=null,waveUntil=0,frameId=0;
const nodes={}, bases=new Map(), springs=new Map();
const floatingNames=['CloudRoot','StarRoot','FlyingCardA','FlyingCardB','FlyingCardC'];
const collisionNames=[...floatingNames,'MascotRoot'];
const raycaster=new THREE.Raycaster();
const mouse=new THREE.Vector2(9,9);
let hovered=null,lastPointer={x:0,y:0,t:0};
let toastTimer=null;
const live = text => {$('#live-status').textContent=text;$('#live-status').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#live-status').classList.remove('visible'),3400);};
function toast(text) {live(text);}
function motion(value) {state.reduced=value;document.body.classList.toggle('reduced',value);$('#motion').setAttribute('aria-pressed',String(value));$('#motion').textContent=value?'动效：简洁':'动效：完整';$('#motion-note').hidden=!value;$('#enable-motion').hidden=!value;window.dispatchEvent(new CustomEvent('fortune:motion',{detail:value}));}
motion(state.reduced);
$('#motion').addEventListener('click',()=>{motion(!state.reduced);if(state.reduced&&state.drawing)skip();});
$('#enable-motion').addEventListener('click',()=>motion(false));
$('#sound').textContent='声音：开';$('#sound').setAttribute('aria-pressed','true');
let audio,audioUnlocked=false;
function unlockAudio(){if(audioUnlocked)return;audioUnlocked=true;if(state.sound){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();}catch{}}}
document.addEventListener('pointerdown',unlockAudio,{capture:true,once:true});document.addEventListener('keydown',unlockAudio,{capture:true,once:true});
window.addEventListener('fortune:toy-tone',e=>tone(e.detail?.frequency||660,.16));
function tone(freq=500,duration=.12) {
  if(!state.sound||!audioUnlocked)return;
  try {
    audio ??= new (window.AudioContext||window.webkitAudioContext)();audio.resume();
    const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*1.25,audio.currentTime+duration);
    gain.gain.setValueAtTime(0,audio.currentTime);gain.gain.linearRampToValueAtTime(.045,audio.currentTime+.015);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);
    osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);
  } catch (_) {}
}
$('#sound').addEventListener('click',()=>{state.sound=!state.sound;$('#sound').textContent=`声音：${state.sound?'开':'关'}`;$('#sound').setAttribute('aria-pressed',String(state.sound));tone(620);});

function fallback(error) {
  state.error=String(error);state.stage='fallback';$('#loading').hidden=true;
  $('#fallback-image').src=__FALLBACK_IMAGE__;$('#fallback').hidden=false;
  $('#stage-mode').textContent='静态小店 · 仍然可以抽签';$('#play-label').textContent='抽取今天的一张签';$('#play').disabled=false;
  window.dispatchEvent(new Event('fortune:ready'));console.error('3D scene:',error);
}
$('#fallback-reveal').addEventListener('click',()=>document.querySelector('#draw').scrollIntoView({behavior:'instant'}));

async function init() {
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:false});
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
  const gpu=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'';
  const software=/swiftshader|llvmpipe|software/i.test(gpu);
  state.quality=software?'compatibility':'full';
  renderer.setPixelRatio(software?.8:Math.min(devicePixelRatio,1.65));renderer.setClearColor(0x000000,0);
  renderer.shadowMap.enabled=!software;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;
  renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frameId);fallback(new Error('浏览器暂停了 3D 上下文'));});
  scene=new THREE.Scene();
  camera=new THREE.OrthographicCamera(-4,4,3,-3,.1,60);camera.position.set(5.3,4.2,11.5);
  controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.8,0);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.08;
  controls.minPolarAngle=.65;controls.maxPolarAngle=1.47;controls.minZoom=.85;controls.maxZoom=1.75;controls.rotateSpeed=.65;controls.enableZoom=false;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfcf7ef,0x8e80ac,.65));
  const key=new THREE.DirectionalLight(0xfff4df,2.3);key.position.set(-3,7,6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=6;key.shadow.camera.bottom=-3;key.shadow.normalBias=.035;key.shadow.bias=-.0001;key.shadow.radius=4;scene.add(key);
  const fill=new THREE.DirectionalLight(0xc4c4ff,.9);fill.position.set(5,3,-3);scene.add(fill);
  const face=new THREE.DirectionalLight(0xfff7ed,.4);face.position.set(1,2,8);scene.add(face);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(4.6,96),new THREE.MeshStandardMaterial({color:0xe5dfef,roughness:1,metalness:0}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const shadowCtx=shadowCanvas.getContext('2d'),gradient=shadowCtx.createRadialGradient(64,64,4,64,64,64);
  gradient.addColorStop(0,'rgba(65,45,100,.28)');gradient.addColorStop(.45,'rgba(65,45,100,.15)');gradient.addColorStop(1,'rgba(65,45,100,0)');shadowCtx.fillStyle=gradient;shadowCtx.fillRect(0,0,128,128);
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(3.25,2.7),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.004;scene.add(contact);
  const floorRing=new THREE.Mesh(new THREE.RingGeometry(2.78,2.79,128),new THREE.MeshBasicMaterial({color:0xc9bcd9,transparent:true,opacity:.6,side:THREE.DoubleSide}));floorRing.rotation.x=-Math.PI/2;floorRing.position.y=-.007;scene.add(floorRing);
  $('#load-text').textContent='正在点亮签机';
  const binary=Uint8Array.from(atob(__MODEL_BASE64__),c=>c.charCodeAt(0));
  const gltf=await new GLTFLoader().parseAsync(binary.buffer,'');
  model=gltf.scene;scene.add(model);
  model.traverse(o=>{
    if(o.name)nodes[o.name]=o;
    if(o.isMesh){o.castShadow=!o.name.includes('Glass');o.receiveShadow=true;
      if(o.material){o.material.envMapIntensity=.7;if(o.name==='ChamberGlass'){o.material.transparent=true;o.material.opacity=.17;o.material.depthWrite=false;o.material.side=THREE.FrontSide;o.castShadow=false;}}
    }
  });
  for(const name of ['MachineRoot','MascotRoot',...floatingNames,'MascotHead','MascotArmL','MascotArmR','MascotEyeL','MascotEyeR','ButtonCap']){
    const node=nodes[name];if(node)bases.set(name,{position:node.position.clone(),quaternion:node.quaternion.clone(),scale:node.scale.clone()});
  }
  for(const name of collisionNames)springs.set(name,{offset:new THREE.Vector3(),velocity:new THREE.Vector3(),twist:0,spin:0,squash:0,squashV:0,last:-10});
  plush=plushify(model,software);state.fur={fibers:plush.count,parts:plush.parts,bend:[0,0]};
  const tracks=new Map();gltf.animations.flatMap(clip=>clip.tracks).forEach(track=>tracks.set(track.name,track));
  drawClip=new THREE.AnimationClip('Draw performance',-1,[...tracks.values()]);
  if(drawClip.tracks.length===0)throw new Error('模型缺少抽签动画');
  mixer=new THREE.AnimationMixer(model);drawAction=mixer.clipAction(drawClip);drawAction.setLoop(THREE.LoopOnce,1);drawAction.clampWhenFinished=true;
  mixer.addEventListener('finished',()=>finishDraw());
  resize();new ResizeObserver(resize).observe(host);
  state.ready=true;state.stage='idle';$('#stage-mode').textContent='店长正在营业';$('#loading').hidden=true;$('#play').disabled=false;$('#play-label').textContent='按下星星 · 抽一张签';
  document.body.dataset.ready='true';window.dispatchEvent(new Event('fortune:ready'));
  requestAnimationFrame(render);
}

function resize(){
  if(!renderer)return;const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const aspect=rect.width/rect.height;const viewHeight=Math.max(6.25,9.4/aspect);
  camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height,false);
}

function busy(value){
  state.drawing=value;$('#play').disabled=value;$('#performance').hidden=!value;
  document.querySelectorAll('[data-theme],[data-view],#slow').forEach(b=>b.disabled=value);
  $('.view-controls').hidden=value;$('#stage-hint').hidden=value;
  if(controls)controls.enabled=!value;
}
function reset(keepView=false){
  clearTimeout(holdTimer);held=false;drawAction?.stop();mixer?.stopAllAction();state.time=0;state.complete=false;state.stage='idle';drawPhase=-1;
  busy(false);$('#play-label').textContent='按下星星 · 抽一张签';$('#progress').style.width='0%';
  $('#stage-mode').textContent='店长正在营业';
  for(const [name,base] of bases){const n=nodes[name];n.position.copy(base.position);n.quaternion.copy(base.quaternion);n.scale.copy(base.scale);}
  for(const spring of springs.values()){spring.offset.set(0,0,0);spring.velocity.set(0,0,0);spring.twist=0;spring.spin=0;spring.squash=0;spring.squashV=0;}
  if(!keepView)setView('front');live('签机已归位');
}
function requestDraw(){window.dispatchEvent(new Event('fortune:request'));}
function play(options={}){
  if(state.error){state.complete=true;window.dispatchEvent(new Event('fortune:complete'));return;}
  if(!state.ready||state.drawing)return;
  reset(true);busy(true);state.stage='drawing';drawPhase=-1;hovered=null;$('#hover-label').classList.remove('visible');
  $('#stage-mode').textContent='签机忙碌中 · 小纸条在路上';
  setView('front');drawAction.reset();drawAction.setEffectiveTimeScale(drawClip.duration/(options.duration||8));drawAction.play();
  if(state.reduced){drawAction.time=drawClip.duration;mixer.update(0);finishDraw();return;}
  live('按下、摇签、出签——小纸条正在路上');tone(420,.16);
}
function phase(t){
  const ratio=t/drawClip.duration;let n=ratio<.19?0:ratio<.56?1:ratio<.80?2:3;
  if(n!==drawPhase){drawPhase=n;$('#phase-label').textContent=['积攒一点好奇，星星正在发光','签条摇起来了，店长正在偷看','找到一张属于此刻的小纸条','接住它，有句话想说给你听'][n];document.querySelectorAll('.phase-steps span').forEach((el,i)=>el.classList.toggle('active',i===n));tone([420,550,680,880][n],.17);}
  $('#progress').style.width=`${Math.min(100,ratio*100)}%`;
}
function finishDraw(){
  if(!state.drawing)return;state.time=drawClip.duration;state.complete=true;state.stage='revealed';busy(false);
  $('#play-label').textContent='再遇见一张签';$('#stage-mode').textContent='纸条已抵达';tone(960,.28);window.dispatchEvent(new Event('fortune:complete'));
}
function skip(){if(!state.drawing)return;drawAction.time=drawClip.duration;mixer.update(0);finishDraw();}
$('#play').addEventListener('click',requestDraw);$('#skip').addEventListener('click',skip);$('#reset').addEventListener('click',()=>reset());

let viewTween=null;
function setView(view){
  if(!camera)return;
  manualOrbit=true;
  const radius=12.67,y=4.2;const angles={front:.43,side:Math.PI/2,back:Math.PI+.2};const a=angles[view]??.43;
  viewTween={from:camera.position.clone(),to:new THREE.Vector3(Math.sin(a)*radius,y,Math.cos(a)*radius),t:0};
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
function setTheme(theme){
  if(state.drawing||!themes[theme])return;state.theme=theme;document.documentElement.style.setProperty('--accent',themes[state.theme].color);
  for(const name of ['ButtonTouch','ChamberSeat','DisplayBezel'])if(nodes[name]){const node=nodes[name];if(!node.userData.themeMaterial){node.material=node.material.clone();node.userData.themeMaterial=true;}node.material.color.set(themes[state.theme].color);}
  tone(620,.1);
}

function pick(event){
  if(!model||state.drawing)return null;const r=host.getBoundingClientRect();mouse.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);
  const hits=raycaster.intersectObjects(model.children,true);
  for(const hit of hits){let o=hit.object;while(o&&o!==model){if(o.name==='ButtonCap')return o.name;if(collisionNames.includes(o.name))return o.name;o=o.parent;}}
  // Small floating meshes are easy to miss: use a bounded screen-space hit area.
  let nearest=null,distance=46;
  for(const name of collisionNames){const n=nodes[name];if(!n)continue;const v=new THREE.Vector3();n.getWorldPosition(v);v.project(camera);const d=Math.hypot(event.clientX-r.left-(v.x+1)*r.width/2,event.clientY-r.top-(1-v.y)*r.height/2);if(v.z>=-1&&v.z<=1&&d<distance){nearest=name;distance=d;}}
  return nearest;
}
function bump(name,strength=1,dx=1){
  const spring=springs.get(name);if(!spring||state.reduced||clock-spring.last<.27)return;
  spring.last=clock;state.collisions++;
  if(name==='MascotRoot'||name==='CloudRoot'){spring.velocity.y+=4.8*strength;spring.squashV+=2.5*strength;spring.spin+=dx*1.3;}
  else{spring.velocity.x+=dx*1.3*strength;spring.velocity.y+=2.6*strength;spring.spin+=dx*4.8*strength;}
}
const labels={MascotRoot:'轻碰会弹，点击会挥手',CloudRoot:'嘘，云朵也会害羞',StarRoot:'一颗正在营业的小星星',FlyingCardA:'拨一拨，再松手',FlyingCardB:'给好奇心留个位置',FlyingCardC:'今天也有小小的惊喜',ButtonCap:'按下这颗星，开始抽签'};
host.addEventListener('pointermove',event=>{
  const now=performance.now(),elapsed=Math.max(.016,(now-lastPointer.t)/1000),dx=event.clientX-lastPointer.x,dy=event.clientY-lastPointer.y;
  const speed=Math.hypot(dx,dy)/elapsed;const hit=pick(event);
  if(dragged&&pointerDown){
    const r=host.getBoundingClientRect(),s=springs.get(dragged);const x=(event.clientX-pointerDown.x)/r.width*(camera.right-camera.left),y=-(event.clientY-pointerDown.y)/r.height*(camera.top-camera.bottom);
    s.offset.x=THREE.MathUtils.clamp(x,-.75,.75);s.offset.y=THREE.MathUtils.clamp(y,-.6,.6);s.velocity.set(0,0,0);s.twist=THREE.MathUtils.clamp(x*.5,-.5,.5);
  }else if(hit&&hit!==hovered){bump(hit,THREE.MathUtils.clamp(speed/1200,.4,1.1),Math.sign(dx)||1);}
  hovered=hit;
  const tooltip=$('#hover-label'),rect=host.getBoundingClientRect();
  if(hit&&!state.drawing&&!dragged){tooltip.textContent=labels[hit]||'';tooltip.style.transform=`translate(${Math.min(rect.width-185,Math.max(6,event.clientX-rect.left+13))}px,${Math.max(10,event.clientY-rect.top-35)}px)`;tooltip.classList.add('visible');}
  else tooltip.classList.remove('visible');
  if(held&&hit!=='ButtonCap'){clearTimeout(holdTimer);held=false;}
  lastPointer={x:event.clientX,y:event.clientY,t:now};
});
host.addEventListener('pointerleave',()=>{hovered=null;$('#hover-label').classList.remove('visible');});
host.addEventListener('pointerdown',event=>{
  if(state.drawing)return;const hit=pick(event);pointerDown={x:event.clientX,y:event.clientY,name:hit};
  state.lastPointerDown=hit;
  if(hit?.startsWith('FlyingCard')){dragged=hit;controls.enabled=false;host.setPointerCapture(event.pointerId);}
  if(hit==='ButtonCap'){held=true;controls.enabled=false;holdTimer=setTimeout(()=>{held=false;requestDraw();},800);}
  if(hit==='MascotRoot'||hit==='CloudRoot')bump(hit,1);
  host.classList.add('dragging');viewTween=null;manualOrbit=true;
},true);
function pointerEnd(event,cancelled=false){
  clearTimeout(holdTimer);held=false;host.classList.remove('dragging');
  if(!cancelled&&pointerDown&&Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)<7){
    const name=pointerDown.name;
    if(name==='ButtonCap')requestDraw();
    if(name==='MascotRoot'){waveUntil=clock+2.1;bump(name,1.15);toast('店长：欢迎来到星签事务所！');tone(760,.1);}
    if(name?.startsWith('FlyingCard')){const spring=springs.get(name);spring.spin+=6;toast('卡片说：先试试，惊喜才会出现。');}
    if(name==='CloudRoot'){bump(name,1.5);highlight(name);toast('云朵团子：歇一小会儿，我帮你托住心事。');tone(480,.15);}
    if(name==='StarRoot'){bump(name,1.5);highlight(name);toast('收到一颗星星的问候。');tone(1100,.12);}
  }
  dragged=null;pointerDown=null;if(controls)controls.enabled=!state.drawing;
}
host.addEventListener('pointerup',event=>pointerEnd(event));host.addEventListener('pointercancel',event=>pointerEnd(event,true));
host.addEventListener('keydown',event=>{
  if(event.target!==host)return;
  if(event.code==='Space'||event.key==='Enter'){event.preventDefault();requestDraw();}
  if(['ArrowLeft','ArrowRight'].includes(event.key)&&!state.drawing){event.preventDefault();viewTween=null;const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),event.key==='ArrowLeft'?-.14:.14);camera.position.copy(controls.target).add(offset);}
});

function springsStep(dt){
  for(const [name,s] of springs){
    const n=nodes[name],base=bases.get(name);if(!n||!base)continue;
    if(state.drawing&&name==='MascotRoot')continue;
    if(dragged!==name){s.velocity.addScaledVector(s.offset,-65*dt);s.velocity.multiplyScalar(Math.exp(-10*dt));s.offset.addScaledVector(s.velocity,dt);}
    s.offset.x=THREE.MathUtils.clamp(s.offset.x,-.8,.8);s.offset.y=THREE.MathUtils.clamp(s.offset.y,-.55,.65);
    s.spin+=(-62*s.twist-10*s.spin)*dt;s.twist+=s.spin*dt;
    s.squashV+=(-85*s.squash-10*s.squashV)*dt;s.squash+=s.squashV*dt;
    const idle=state.reduced?0:Math.sin(clock*1.25+collisionNames.indexOf(name)*1.5)*.043;
    n.position.copy(base.position).add(s.offset);n.position.y+=idle;
    if(!state.reduced){const index=collisionNames.indexOf(name);n.position.x+=Math.sin(state.story*1.65+index)*.23;n.position.y+=Math.cos(state.story*1.4+index)*.17;}
    n.quaternion.copy(base.quaternion);n.rotateZ(s.twist);n.rotateY(name.startsWith('FlyingCard')?Math.sin(clock*.4)*.13:0);
    n.scale.copy(base.scale);n.scale.y*=1-s.squash;n.scale.x*=1+s.squash*.45;n.scale.z*=1+s.squash*.45;
  }
}
function render(now){
  frameId=requestAnimationFrame(render);const elapsed=Math.max(0,(now-(lastNow||now))/1000),dt=Math.min(.033,elapsed);lastNow=now;if(document.hidden)return;
  clock+=elapsed;
  directScene(elapsed);
  if(state.drawing){mixer.update(elapsed);state.time=drawAction.time;phase(state.time);}
  springsStep(dt);
  if(!state.drawing){
    const walking=!state.reduced&&Math.abs(state.travel||0)>.015;
    if(walking){nodes.MascotRoot.position.y+=Math.abs(Math.sin(clock*8))*.095;nodes.MascotRoot.rotateY(Math.sign(state.travel)*.32);nodes.MascotArmL.rotation.z=Math.sin(clock*8)*.3;nodes.MascotArmR.rotation.z=-Math.sin(clock*8)*.3;}
    else nodes.MascotArmL.quaternion.copy(bases.get('MascotArmL').quaternion);
    const head=nodes.MascotHead,base=bases.get('MascotHead');head.quaternion.copy(base.quaternion);head.rotation.y=Math.sin(clock*.6)*.08;head.rotation.z=Math.sin(clock*.8)*.04;
    if(!state.reduced){const blink=Math.sin(clock*.73)> .996?.14:1;for(const name of ['MascotEyeL','MascotEyeR'])nodes[name].scale.y=bases.get(name).scale.y*blink;}
    if(clock<waveUntil&&!state.reduced){nodes.MascotArmR.rotation.z=.8+Math.sin(clock*15)*.22;nodes.MascotArmR.rotation.x=.15;}
    else if(!state.complete&&!walking){nodes.MascotArmR.quaternion.copy(bases.get('MascotArmR').quaternion);}
    nodes.ButtonCap.position.z=bases.get('ButtonCap').position.z-(held?.065:0);
  }
  if(viewTween){viewTween.t=Math.min(1,viewTween.t+elapsed/(state.reduced?.01:.7));const t=1-(1-viewTween.t)**3;camera.position.lerpVectors(viewTween.from,viewTween.to,t);if(viewTween.t===1)viewTween=null;}
  controls.update();if(plush){plush.update(elapsed,clock,camera,state.reduced,state.travel||0);state.fur.bend=plush.bend.toArray();}renderer.render(scene,camera);
}
const profiles=[{id:'welcome',x:.22,zoom:1,angle:.43,alpha:1},{id:'features',x:-.22,zoom:.88,angle:-.28,alpha:1},{id:'themes',x:.28,zoom:.55,angle:.85,alpha:.65},{id:'roles',x:.23,zoom:1,angle:.43,alpha:1},{id:'draw',x:-.23,zoom:1.02,angle:-.24,alpha:1},{id:'signs',x:.27,zoom:.58,angle:1,alpha:.12},{id:'collection',x:.28,zoom:.48,angle:.43,alpha:.08},{id:'about',x:.25,zoom:.65,angle:1.4,alpha:.08}];
let manualOrbit=false,lastScroll=scrollY,scenePose={...profiles[0]},highlightUntil=0;
const highlightMaterials=new Map();
function highlight(name){if(!model)return;const parent=nodes[name];if(!parent)return;parent.traverse(o=>{if(o.isMesh&&o.material?.emissive){if(!o.userData.highlightClone){o.material=o.material.clone();o.userData.highlightClone=true;}if(!highlightMaterials.has(o.material))highlightMaterials.set(o.material,{color:o.material.emissive.clone(),intensity:o.material.emissiveIntensity});o.material.emissive.set('#bd9ce4');o.material.emissiveIntensity=.6;}});highlightUntil=clock+1.3;}
function greet(name='MascotRoot'){bump(name,1.8);highlight(name);if(name==='MascotRoot')waveUntil=clock+2.1;toast(name==='CloudRoot'?'云朵团子：接住啦，慢慢来。':name==='StarRoot'?'星星精灵：收到你的好奇心！':'店长：今天也很高兴见到你。');tone(780,.12);}
function directScene(elapsed){
  if(Math.abs(scrollY-lastScroll)>2){manualOrbit=false;viewTween=null;}lastScroll=scrollY;
  let index=0;for(let i=0;i<profiles.length;i++){if(scrollY>=document.getElementById(profiles[i].id).offsetTop)index=i;}
  const current=profiles[index],next=profiles[Math.min(index+1,profiles.length-1)],start=document.getElementById(current.id).offsetTop,end=document.getElementById(next.id).offsetTop;
  const progress=index===profiles.length-1?0:THREE.MathUtils.clamp((scrollY-start)/Math.max(1,end-start),0,1);
  state.section=current.id;state.story=THREE.MathUtils.lerp(state.story,index+progress,state.reduced?1:1-Math.exp(-elapsed*2));
  const transition=current.id==='draw'?THREE.MathUtils.clamp((scrollY-(end-innerHeight*.65))/Math.max(1,innerHeight*.65),0,1):progress;
  const blend=state.reduced?0:transition*transition*(3-2*transition),target={};for(const field of ['x','zoom','angle','alpha'])target[field]=THREE.MathUtils.lerp(current[field],next[field],blend);
  if(state.drawing)Object.assign(target,profiles[4]);
  const smoothing=state.reduced?1:1-Math.exp(-elapsed*2);const before=scenePose.x;
  for(const field of ['x','zoom','angle','alpha']){const delta=(target[field]-scenePose[field])*smoothing;scenePose[field]+=state.reduced?delta:THREE.MathUtils.clamp(delta,-elapsed*(field==='x'?.16:.65),elapsed*(field==='x'?.16:.65));}
  state.travel=elapsed>0?(scenePose.x-before)/elapsed:0;
  const rect=host.getBoundingClientRect();camera.zoom=scenePose.zoom;camera.setViewOffset(rect.width,rect.height,-rect.width*scenePose.x,0,rect.width,rect.height);
  if(!manualOrbit&&!viewTween){const a=scenePose.angle;camera.position.set(Math.sin(a)*12.67,4.2,Math.cos(a)*12.67);}
  camera.updateProjectionMatrix();host.style.opacity=scenePose.alpha;
  if(highlightMaterials.size&&clock>highlightUntil){for(const [m,base] of highlightMaterials){m.emissive.copy(base.color);m.emissiveIntensity=base.intensity;}highlightMaterials.clear();}
  for(const name of ['ButtonHalo','ChamberMintLight']){if(nodes[name]?.material)nodes[name].material.emissiveIntensity=state.drawing?.9+Math.sin(clock*10)*.4:.6;}
}
window.__fortuneScene={getState:()=>({...state,duration:drawClip?.duration,tracks:drawClip?.tracks.length,renderer:renderer?.info.render}),play,skip,reset,setView,setTheme,setMotion:motion,toast,greet,highlight,project(name){const node=nodes[name];if(!node)return null;node.updateWorldMatrix(true,false);const v=new THREE.Vector3();node.getWorldPosition(v);v.project(camera);const r=host.getBoundingClientRect();return{x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2};},node(name){const n=nodes[name];return n?{position:n.position.toArray(),scale:n.scale.toArray()}:null;}};
init().catch(fallback);
