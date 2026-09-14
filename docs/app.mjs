import data from './campaign.mjs';
import {Game,STEP} from './engine.mjs';
import {Renderer} from './render.mjs';
import {MUSIC_URL} from './config.mjs';
const $=id=>document.getElementById(id),canvas=$('game');
export const game=new Game(data.levels);
const renderer=new Renderer(canvas,data),audio=new Audio();audio.loop=true;audio.volume=.55;
let audioContext,muted=false,objectURL=null,hasMusic=false,lastMenu='',lastState='',musicPending=false;
try{muted=localStorage.getItem('iron-signal-muted')==='true';}catch{}
function sound(name){if(muted||!audioContext)return;const values={shot:[160,.035],jump:[420,.08],hurt:[90,.12],pickup:[880,.1],warp:[640,.12],explode:[70,.16]};const [freq,duration]=values[name]||values.shot;
  const t=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='square';osc.frequency.setValueAtTime(freq,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.035,t+.004);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+duration+.01);osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
function unlock(){try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});}catch{} }
function syncMusic(){audio.muted=muted;if(game.state!=='playing'){audio.pause();return;}
  if(hasMusic&&audio.paused&&!musicPending){musicPending=true;audio.play().then(()=>{if(game.state!=='playing')audio.pause();}).catch(()=>{$('audio-status').textContent='Musiken kunde inte starta. Välj en ljudfil med M och fortsätt spelet.';}).finally(()=>{musicPending=false;});}
}
function setMusic(url,name){audio.pause();audio.src=url;hasMusic=true;$('audio-status').textContent=`Musik: ${name} · loopas under spelet`;syncMusic();}
audio.addEventListener('error',()=>{hasMusic=false;$('audio-status').textContent='Ljudfilen kunde inte läsas. Välj MP3, WAV eller M4A med M.';});
function mute(){muted=!muted;try{localStorage.setItem('iron-signal-muted',String(muted));}catch{}syncUI();syncMusic();}
function pickMusic(){if(game.state==='playing')game.pause();syncUI();$('audio-file').click();}
$('audio-file').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(file);setMusic(objectURL,file.name);e.target.value='';});
function button(text,action,primary=false){const b=document.createElement('button');b.textContent=text;if(primary)b.className='primary';b.addEventListener('click',()=>{unlock();action();syncUI();if(game.state==='playing')canvas.focus();});return b;}
function syncUI(){
  $('mute').textContent=muted?'Ljud av · X':'Ljud på · X';$('mute').setAttribute('aria-pressed',String(muted));
  $('pause').textContent=game.state==='paused'?'Fortsätt · Esc':'Pausa · Esc';$('map').textContent=game.state==='map'?'Stäng karta · Tab':'Karta · Tab';
  $('pause').disabled=!['playing','paused','map'].includes(game.state);$('map').disabled=!['playing','map'].includes(game.state);
  const menuKey=`${game.state}:${game.levelIndex}`;
  if(menuKey!==lastMenu){
    lastMenu=menuKey;const menu=$('menu');menu.hidden=['playing','map'].includes(game.state);document.documentElement.style.setProperty('--accent',game.level.accent);
    $('mission-number').textContent=`IRON SIGNAL / SECTOR ${game.levelIndex+1} OF ${data.levels.length}`;
    $('mission-list').replaceChildren();$('menu-actions').replaceChildren();$('menu-help').textContent='';
    let title=game.level.name,copy=game.level.subtitle,actions=[];
    if(game.state==='title'){
      data.levels.forEach((level,i)=>{const b=button(`${i+1} · ${level.name}`,()=>game.choose(i));b.setAttribute('aria-pressed',String(i===game.levelIndex));$('mission-list').append(b);});
      actions=[button('Starta uppdraget · Enter',()=>game.enter(),true)];$('menu-help').textContent=game.levelIndex>=3?'Hitta färgade nyckelkort. E öppnar portar. Spruckna paneler döljer förråd.':'Samla 6 kapslar. Besegra kärnan. Nå EXTRACT. Välj bana med 1–5.';
    }else if(game.state==='paused'){
      title='PAUS';copy='Uppdraget väntar. Fortsätt där du var eller börja om.';
      actions=[button('Fortsätt · Esc',()=>game.start(),true),button('Startmeny · T',()=>game.title()),button('Försök igen · R',()=>game.retry())];$('menu-help').textContent='Till startmenyn återställer den aktuella banan.';
    }else if(game.state==='cleared'){
      title='SEKTORN SÄKRAD';copy=`${game.score} poäng · ${game.cells}/${game.totalCells} kapslar · ${game.discovered.size} hemligheter`;
      actions=[button(`Nästa: ${data.levels[game.levelIndex+1].name} · Enter`,()=>game.enter(),true),button('Startmeny',()=>game.title())];
    }else if(game.state==='won'||game.state==='dead'){
      title=game.state==='won'?'UPPDRAGET SLUTFÖRT':'SIGNAL FÖRLORAD';copy=`${game.score} poäng · ${game.cells}/${game.totalCells} kapslar · ${game.discovered.size} hemligheter`;
      actions=[button('Försök igen · R',()=>game.retry(),true),button('Startmeny · Esc',()=>game.title())];
    }
    $('menu-title').textContent=title;$('menu-copy').textContent=copy;for(const a of actions)$('menu-actions').append(a);
    $('announcement').textContent=game.state==='playing'?`${game.level.name}. Spelet pågår.`:game.state==='map'?'Karta. Tab fortsätter.':`${title}. ${copy}`;
    if(!menu.hidden)$('menu-actions').querySelector('button')?.focus({preventScroll:true});
  }
  if(lastState!==game.state){lastState=game.state;syncMusic();}
}
const controls={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',KeyJ:'fire',KeyK:'fire',KeyW:'up',ArrowUp:'up'};
const heldCodes=new Set();
window.addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey||e.target.matches('input,select,textarea'))return;
  if(['Space','Enter'].includes(e.code)&&e.target.closest('button'))return;
  if(e.code==='Tab'&&game.state!=='map'&&document.activeElement!==canvas)return;
  const handled=controls[e.code]||['Escape','Enter','Tab','KeyP','KeyT','KeyR','KeyE','KeyM','KeyX','Digit1','Digit2','Digit3','Digit4','Digit5'].includes(e.code);
  if(!handled)return;e.preventDefault();if(e.repeat)return;unlock();
  if(controls[e.code]){heldCodes.add(e.code);game.press(controls[e.code]);}
  else switch(e.code){case'Escape':game.escape();break;case'Enter':game.enter();break;case'Tab':game.map();break;case'KeyP':game.state==='paused'?game.start():game.pause();break;case'KeyT':if(['paused','dead','won','cleared'].includes(game.state))game.title();break;case'KeyR':game.retry();break;case'KeyE':game.interact();break;case'KeyM':pickMusic();break;case'KeyX':mute();break;default:game.choose(Number(e.code.slice(-1))-1);}
  syncUI();if(game.state==='playing')canvas.focus();
});
window.addEventListener('keyup',e=>{heldCodes.delete(e.code);const key=controls[e.code];if(key&&![...heldCodes].some(code=>controls[code]===key))game.release(key);});
function focusPause(){heldCodes.clear();game.keys.clear();game.pause();syncUI();}
window.addEventListener('blur',focusPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)focusPause();});
$('pause').onclick=()=>{unlock();game.state==='paused'?game.start():game.pause();syncUI();if(game.state==='playing')canvas.focus();};
$('map').onclick=()=>{unlock();game.map();syncUI();canvas.focus();};$('music').onclick=pickMusic;$('mute').onclick=()=>{unlock();mute();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('cabinet').requestFullscreen();}catch{$('announcement').textContent='Helskärm stöds inte i den här webbläsaren.';}canvas.focus();};
canvas.addEventListener('pointerdown',()=>{canvas.focus();unlock();});
const pointers=new Map();
for(const b of document.querySelectorAll('.touch button')){
  b.addEventListener('pointerdown',e=>{e.preventDefault();unlock();b.setPointerCapture(e.pointerId);if(b.dataset.key){pointers.set(e.pointerId,b.dataset.key);game.press(b.dataset.key);}else game.interact();});
  const end=e=>{const key=pointers.get(e.pointerId);pointers.delete(e.pointerId);if(key&&![...pointers.values()].includes(key))game.release(key);};
  b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);b.addEventListener('lostpointercapture',end);
}
syncUI();
if(MUSIC_URL)setMusic(MUSIC_URL,MUSIC_URL.split('/').pop());
let previous=0,accumulator=0;
function frame(now){const dt=previous?Math.min(.1,(now-previous)/1000):0;previous=now;
  if(game.state==='playing'){accumulator+=dt;while(accumulator>=STEP){game.tick(STEP);accumulator-=STEP;}}else accumulator=0;
  for(const e of game.events.splice(0))sound(e);syncUI();renderer.render(game);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
