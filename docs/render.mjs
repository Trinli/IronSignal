import {W,H,KEY_COLORS} from './engine.mjs';
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x-w/2,y-h/2,w,h);}
function text(c,value,x,y,size=12,color='#a9c1d0',align='center'){
  c.save();c.translate(x,y);c.scale(1,-1);c.fillStyle=color;c.font=`bold ${size}px monospace`;c.textAlign=align;c.fillText(value,0,0);c.restore();
}
function draw(c,q){
  c.save();c.translate(q[1],q[2]);
  if(q[0]==='r'){if(q[6])c.rotate(q[6]);rect(c,0,0,q[3],q[4],q[5]);}
  else text(c,q[3],0,0,q[4],q[5],q[6]);c.restore();
}
class Layer {
  constructor(commands){this.commands=commands;this.tiles=new Map();}
  tile(x,y){const key=`${x},${y}`;if(this.tiles.has(key))return this.tiles.get(key);
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.translate(-x*512,(y+1)*512);c.scale(1,-1);
    for(const q of this.commands){const rx=q[0]==='r'?Math.abs(q[3])+Math.abs(q[4]):q[3].length*q[4],ry=q[0]==='r'?Math.abs(q[3])+Math.abs(q[4]):q[4]*3;
      if(q[1]+rx/2<x*512||q[1]-rx/2>(x+1)*512||q[2]+ry/2<y*512||q[2]-ry/2>(y+1)*512)continue;draw(c,q);
    }
    if(this.tiles.size>48)this.tiles.delete(this.tiles.keys().next().value);this.tiles.set(key,canvas);return canvas;
  }
  paint(c,cx,cy,ox=0,oy=0){c.save();c.translate(ox,oy);
    for(let x=Math.floor((cx-W/2-ox)/512);x<=Math.floor((cx+W/2-ox)/512);x++)for(let y=Math.floor((cy-H/2-oy)/512);y<=Math.floor((cy+H/2-oy)/512);y++){
      c.save();c.translate(x*512,(y+1)*512);c.scale(1,-1);c.drawImage(this.tile(x,y),0,0);c.restore();
    }c.restore();
  }
}
export class Renderer {
  constructor(canvas,data){this.c=canvas.getContext('2d');this.data=data;this.index=-1;}
  sprite(name,x,y,flip=1){const c=this.c;c.save();c.translate(x,y);c.scale(flip,1);for(const q of this.data.sprites[name])draw(c,q);c.restore();}
  render(g){const c=this.c,l=g.level;if(this.index!==g.levelIndex){this.index=g.levelIndex;this.layers=[l.sky,l.backdrop,l.scenery].map(a=>new Layer(a));}
    c.imageSmoothingEnabled=false;c.fillStyle='#080e19';c.fillRect(0,0,W,H);c.save();c.translate(W/2-g.cx,H/2+g.cy);c.scale(1,-1);
    this.layers[0].paint(c,g.cx,g.cy,g.cx*.82,(g.cy-H/2)*.65);this.layers[1].paint(c,g.cx,g.cy,g.cx*.55,(g.cy-H/2)*.25);this.layers[2].paint(c,g.cx,g.cy);
    const visible=(x,y)=>Math.abs(x-g.cx)<560&&Math.abs(y-g.cy)<350;
    for(const s of g.supplies)if(visible(s.x,s.y))this.sprite('supply',s.x,s.y);
    for(const p of g.pickups)if(visible(p.x,p.y)&&(!p.secret||g.discovered.has(p.secret)))this.pickup(p,p.y+Math.sin(g.time*5+p.x)*3);
    for(const e of g.enemies)if(visible(e.x,e.y)){
      this.sprite(e.boss?'boss':'drone',e.x,e.y+Math.sin(g.time*3+e.home)*3);
      if(e.type==='heavy'){rect(c,e.x-18,e.y,8,23,'#c29560');rect(c,e.x+18,e.y,8,23,'#c29560');}
      if(e.type==='turret'){rect(c,e.x,e.y-16,30,8,'#68768f');rect(c,e.x,e.y+13,8,17,'#d8acff');}
      if(!e.boss&&e.hp<e.maxHP){rect(c,e.x,e.y+26,36,4,'#263344');rect(c,e.x-18+18*e.hp/e.maxHP,e.y+26,36*e.hp/e.maxHP,4,'#ff956a');}
    }
    this.objects(g);
    const [ex,ey]=l.exit;rect(c,ex,ey,100,164,'#294152');rect(c,ex,ey,76,144,'#0a1625');
    for(const x of [-43,43]){rect(c,ex+x,ey,8,151,'#819ba9');for(const y of [-66,-30,6,42,66])rect(c,ex+x,ey+y,9,7,'#ffb34f');}
    const unlocked=g.readyToExit;for(let i=0;i<7;i++)rect(c,ex,ey+i*18-53,64,3,unlocked?'#86e49d':'#65eee8');text(c,'EXTRACT',ex,ey+96,11,'#65eee8');
    for(const w of l.warps)for(const [x,y] of [w.a,w.b]){c.globalAlpha=.12+.08*Math.sin(g.time*5);rect(c,x,y+15,50,58,l.accent);}c.globalAlpha=1;
    for(const s of g.shots){rect(c,s.x,s.y,s.hostile?9:14,s.hostile?9:5,s.color);rect(c,s.x,s.y,s.hostile?4:8,3,'#fff2d6');}
    if(g.armor>0){for(const dx of [-19,19]){rect(c,g.x+dx,g.y,2,30,'#7caaff');rect(c,g.x+dx,g.y+15,7,2,'#7caaff');}}
    c.globalAlpha=g.invincible>0&&Math.floor(g.invincible*14)%2===0?.35:1;this.sprite('hero',g.x,g.y,g.facing);if(g.weaponTier>1)rect(c,g.x+g.facing*17,g.y+5,17,5,g.weapon.color);c.globalAlpha=1;
    for(const p of g.particles){c.globalAlpha=Math.max(0,p.life/.4);rect(c,p.x,p.y,4,4,p.color);}c.globalAlpha=1;
    for(const m of g.messages)text(c,m.text,m.x,m.y,10,l.accent);
    c.restore();this.hud(g);if(g.state==='map')this.map(g);
  }

  pickup(p,y){const c=this.c;if(p.kind<3){this.sprite(['cell','medkit','weapon'][p.kind],p.x,y);return;}
    if(p.kind===3){c.fillStyle='#24426d';c.beginPath();c.moveTo(p.x-13,y+15);c.lineTo(p.x+13,y+15);c.lineTo(p.x+11,y-5);c.lineTo(p.x,y-18);c.lineTo(p.x-11,y-5);c.closePath();c.fill();c.strokeStyle='#8ac8ff';c.lineWidth=2;c.stroke();rect(c,p.x,y+1,5,18,'#b2ddff');rect(c,p.x,y+1,15,5,'#b2ddff');}
    else if(p.kind===4){this.sprite('weapon',p.x,y);text(c,p.tier===3?'RAIL':'PLASMA',p.x,y+21,8,p.tier===3?'#d8acff':'#ffb34f');}
    else if(p.kind===5){rect(c,p.x,y,29,20,'#ced4cb');rect(c,p.x,y-1,23,13,KEY_COLORS[p.key]);rect(c,p.x-7,y,5,7,'#8a713e');rect(c,p.x+5,y,7,2,'#fff1c9');rect(c,p.x,y+7,9,2,'#243342');text(c,p.key.toUpperCase(),p.x,y+20,8,KEY_COLORS[p.key]);}
    else{rect(c,p.x,y,21,25,'#62517b');rect(c,p.x,y,13,17,'#f9d375');rect(c,p.x,y,5,9,'#fff7c2');}
  }
  objects(g){const c=this.c;
    for(const room of g.level.secrets||[])if(!g.discovered.has(room.id)){
      const [x,y,w,h]=room.box;rect(c,x+w/2,y+h/2,w,h,'#1c3037');for(let dx=20;dx<w;dx+=40)rect(c,x+dx,y+h/2,2,h-10,'#2b464d');
    }
    for(const p of g.panels){const [x,y,w,h]=p.box;rect(c,x+w/2,y+h/2,w,h,'#70827e');c.strokeStyle='#162931';c.lineWidth=3;c.beginPath();c.moveTo(x+w/2,y+h-8);c.lineTo(x+4,y+h*.65);c.lineTo(x+w-4,y+h*.42);c.lineTo(x+8,y+6);c.stroke();}
    for(const d of g.doors){const [x,y,w,h]=d.box,col=KEY_COLORS[d.key];rect(c,x+2,y+h/2,4,h,col);rect(c,x+w-2,y+h/2,4,h,col);
      if(!d.open){rect(c,x+w/2,y+h/2,w-8,h,'#263445');for(let dy=12;dy<h;dy+=28)rect(c,x+w/2,y+dy,w-10,6,col);const titleY=Math.max(y+55,Math.min(y+h-45,g.y+67));text(c,`[E] ${d.key.toUpperCase()}`,x+w/2,titleY,10,col);}
    }
    for(const b of g.barrels){rect(c,b.x,b.y,26,36,'#984531');rect(c,b.x,b.y,20,26,'#e38245');for(const dy of [-13,13])rect(c,b.x,b.y+dy,28,4,'#bcc3a9');text(c,'!',b.x,b.y-5,17,'#392527');}
    for(const s of g.level.springs||[]){rect(c,s.x,s.y+4,52,8,'#56758d');rect(c,s.x,s.y+10,44,4,'#7cdbff');for(const dx of [-12,0,12]){c.strokeStyle='#a6ecff';c.lineWidth=2;c.beginPath();c.moveTo(s.x+dx-4,s.y+18);c.lineTo(s.x+dx,s.y+24);c.lineTo(s.x+dx+4,s.y+18);c.stroke();}}
  }
  hud(g){const c=this.c;c.fillStyle='#101c2c';c.fillRect(0,0,W,48);c.fillRect(0,H-48,W,48);c.fillStyle=g.level.accent;c.fillRect(0,46,W,2);
    c.textAlign='left';c.font='bold 12px monospace';c.fillText(`HP ${'■'.repeat(Math.max(0,g.health))}${'·'.repeat(5-Math.max(0,g.health))}   CELLS ${g.cells}/${g.totalCells}`,24,20);
    c.fillStyle='#8abaff';c.fillText(`ARMOR ${'■'.repeat(g.armor)}${'·'.repeat(g.maxArmor-g.armor)}`,24,39);
    c.fillStyle=g.weapon.color;c.fillText(`${g.weapon.name}${g.overdrive>0?' / OVERDRIVE '+Math.ceil(g.overdrive)+'s':''}`,260,39);
    c.textAlign='right';c.fillStyle='#ffb34f';c.fillText(`${String(g.score).padStart(6,'0')} / ${g.levelIndex+1}-5 ${g.level.name}`,936,20);
    c.fillStyle='#d4dfe7';c.fillText(`CARDS: ${[...g.cards].map(k=>k.toUpperCase()).join(' / ')||'—'}   SECRETS ${g.discovered.size}/${(g.level.secrets||[]).length}`,936,39);
    c.textAlign='center';c.font='bold 11px monospace';c.fillStyle='#9bb9c8';
    let hint='A/D MOVE   SPACE JUMP   J FIRE   W AIM UP   E USE   TAB MAP   ESC PAUSE';
    if(g.nearbyWarp())hint=g.warpCooldown>0?'TELEPORT RECHARGING…':'[E] TELEPORT — TWO-WAY LINK';
    const door=g.nearDoor();if(door)hint=g.cards.has(door.key)?`[E] OPEN ${door.label}`:`FIND THE ${door.key.toUpperCase()} ACCESS CARD`;
    if(g.atExit&&!['won','cleared'].includes(g.state))hint='EXTRACTION LOCKED: ALL CELLS, OPEN GATES AND CORE REQUIRED';
    c.fillText(hint,W/2,H-19);
    const b=g.enemies.find(e=>e.boss&&Math.hypot(e.x-g.x,e.y-g.y)<650);if(b){c.fillStyle='#ff7278';c.fillText(`SECURITY CORE ${b.hp}/${b.maxHP}`,W/2,71);}
  }
  map(g){const c=this.c;c.fillStyle='rgba(4,9,19,.94)';c.fillRect(0,48,W,H-96);c.textAlign='center';c.font='bold 24px monospace';c.fillStyle=g.level.accent;c.fillText('MISSION MAP',W/2,94);
    const scale=Math.min(850/g.level.width,300/g.level.height),p=([x,y])=>[W/2+(x-g.level.width/2)*scale,290-(y-g.level.height/2)*scale];
    for(const [x,y,w,h] of g.level.platforms){const [a,b]=p([x,y+h]);c.fillStyle='#6c859e';c.fillRect(a,b,Math.max(3,w*scale),Math.max(2,h*scale));}
    for(const w of g.level.warps){const a=p(w.a),b=p(w.b);c.strokeStyle='#725d99';c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();for(const q of [a,b])rect(c,...q,7,7,'#c9a2ff');}
    for(const q of g.pickups.filter(p=>[0,5].includes(p.kind)&&(!p.secret||g.discovered.has(p.secret))))rect(c,...p([q.x,q.y]),q.kind===5?8:5,5,q.kind===5?KEY_COLORS[q.key]:'#65eee8');
    for(const d of g.doors.filter(d=>!d.open)){const [a,b]=p([d.box[0],d.box[1]+d.box[3]]);c.fillStyle=KEY_COLORS[d.key];c.fillRect(a,b,4,d.box[3]*scale);}
    rect(c,...p(g.level.exit),8,9,'#86e49d');rect(c,...p([g.x,g.y]),8,8,'#ffb34f');
    c.fillStyle='#bdced9';c.font='bold 11px monospace';c.fillText('ORANGE: YOU   CYAN: CELLS   COLORED: CARDS/GATES   GREEN: EXIT',W/2,459);c.fillText('TAB: RESUME   ESC: PAUSE MENU',W/2,480);
  }
}
