import {W,H} from './engine.mjs';
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
    for(const p of g.pickups)if(visible(p.x,p.y))this.sprite(['cell','medkit','weapon'][p.kind],p.x,p.y+Math.sin(g.time*5+p.x)*3);
    for(const e of g.enemies)if(visible(e.x,e.y))this.sprite(e.boss?'boss':'drone',e.x,e.y+Math.sin(g.time*3+e.home)*3);
    const [ex,ey]=l.exit;rect(c,ex,ey,100,164,'#294152');rect(c,ex,ey,76,144,'#0a1625');
    for(const x of [-43,43]){rect(c,ex+x,ey,8,151,'#819ba9');for(const y of [-66,-30,6,42,66])rect(c,ex+x,ey+y,9,7,'#ffb34f');}
    const unlocked=g.cells===g.totalCells&&!g.enemies.some(e=>e.boss);for(let i=0;i<7;i++)rect(c,ex,ey+i*18-53,64,3,unlocked?'#86e49d':'#65eee8');text(c,'EXTRACT',ex,ey+96,11,'#65eee8');
    for(const w of l.warps)for(const [x,y] of [w.a,w.b]){c.globalAlpha=.12+.08*Math.sin(g.time*5);rect(c,x,y+15,50,58,l.accent);}c.globalAlpha=1;
    for(const s of g.shots){rect(c,s.x,s.y,s.hostile?9:14,s.hostile?9:5,s.hostile?'#ff6565':'#65eee8');rect(c,s.x,s.y,s.hostile?4:8,3,'#fff2d6');}
    c.globalAlpha=g.invincible>0&&Math.floor(g.invincible*14)%2===0?.35:1;this.sprite('hero',g.x,g.y,g.facing);c.globalAlpha=1;
    for(const p of g.particles){c.globalAlpha=Math.max(0,p.life/.4);rect(c,p.x,p.y,4,4,p.color);}c.globalAlpha=1;
    for(const m of g.messages)text(c,m.text,m.x,m.y,10,l.accent);
    c.restore();this.hud(g);if(g.state==='map')this.map(g);
  }
  hud(g){const c=this.c;c.fillStyle='#101c2c';c.fillRect(0,0,W,48);c.fillRect(0,H-48,W,48);c.fillStyle=g.level.accent;c.fillRect(0,46,W,2);
    c.textAlign='left';c.font='bold 15px monospace';c.fillText(`HP ${'■'.repeat(Math.max(0,g.health))}${'·'.repeat(5-Math.max(0,g.health))}   CELLS ${g.cells}/${g.totalCells}`,24,31);
    c.textAlign='right';c.font='bold 13px monospace';c.fillStyle='#ffb34f';c.fillText(`${String(g.score).padStart(6,'0')} / ${g.overdrive>0?'OVERDRIVE '+Math.ceil(g.overdrive)+'s':`${g.levelIndex+1}-5 ${g.level.name}`}`,936,31);
    c.textAlign='center';c.font='bold 11px monospace';c.fillStyle='#9bb9c8';
    let hint='A/D MOVE   SPACE JUMP   J FIRE   W AIM UP   E WARP   TAB MAP   ESC PAUSE';
    if(g.nearbyWarp())hint=g.warpCooldown>0?'TELEPORT RECHARGING…':'[E] TELEPORT — TWO-WAY LINK';
    if(g.atExit&&!['won','cleared'].includes(g.state))hint='EXTRACTION LOCKED: COLLECT ALL CELLS AND DESTROY THE CORE';
    c.fillText(hint,W/2,H-19);
    const b=g.enemies.find(e=>e.boss&&Math.hypot(e.x-g.x,e.y-g.y)<650);if(b){c.fillStyle='#ff7278';c.fillText(`SECURITY CORE ${b.hp}/45`,W/2,71);}
  }
  map(g){const c=this.c;c.fillStyle='rgba(4,9,19,.94)';c.fillRect(0,48,W,H-96);c.textAlign='center';c.font='bold 24px monospace';c.fillStyle=g.level.accent;c.fillText('MISSION MAP',W/2,94);
    const scale=Math.min(850/g.level.width,300/g.level.height),p=([x,y])=>[W/2+(x-g.level.width/2)*scale,290-(y-g.level.height/2)*scale];
    for(const [x,y,w,h] of g.level.platforms){const [a,b]=p([x,y+h]);c.fillStyle='#6c859e';c.fillRect(a,b,Math.max(3,w*scale),Math.max(2,h*scale));}
    for(const w of g.level.warps){const a=p(w.a),b=p(w.b);c.strokeStyle='#725d99';c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();for(const q of [a,b])rect(c,...q,7,7,'#c9a2ff');}
    for(const q of g.pickups.filter(p=>p.kind===0))rect(c,...p([q.x,q.y]),5,5,'#65eee8');rect(c,...p(g.level.exit),8,9,'#86e49d');rect(c,...p([g.x,g.y]),8,8,'#ffb34f');
    c.fillStyle='#bdced9';c.font='bold 11px monospace';c.fillText('ORANGE: YOU   CYAN: CELLS   PURPLE: WARP   GREEN: EXIT',W/2,459);c.fillText('TAB: RESUME   ESC: PAUSE MENU',W/2,480);
  }
}
