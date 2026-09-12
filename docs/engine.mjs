// Deterministic, DOM-free simulation shared by browser and tests. Coordinates are Y-up.
export const W=960,H=540,STEP=1/60;
export const intersects=(a,b)=>a[0]<b[0]+b[2]&&a[0]+a[2]>b[0]&&a[1]<b[1]+b[3]&&a[1]+a[3]>b[1];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class Game {
  constructor(levels){this.levels=levels;this.levelIndex=0;this.entryScore=0;this.events=[];this.reset();}
  get level(){return this.levels[this.levelIndex];}
  get box(){return [this.x-12,this.y-21,24,42];}
  get atExit(){return Math.abs(this.x-this.level.exit[0])<65&&Math.abs(this.y-(this.level.exit[1]-61))<85;}
  reset(){
    const l=this.level;[this.x,this.y]=l.spawn;this.vx=0;this.vy=0;this.facing=1;this.grounded=false;
    this.health=5;this.score=this.entryScore;this.cells=0;this.totalCells=l.pickups.filter(p=>p.kind===0).length;
    this.time=0;this.invincible=0;this.cooldown=0;this.warpCooldown=0;this.overdrive=0;this.coyote=0;this.jumpBuffer=0;
    this.keys=new Set();this.state='title';this.shots=[];this.particles=[];this.messages=[];this.events=[];
    this.pickups=l.pickups.map(p=>({...p}));this.supplies=l.supplies.map(([x,y])=>({x,y,hp:2}));
    this.enemies=l.enemies.map(e=>({...e,home:e.x,hp:e.boss?45:3,direction:-1,cooldown:1}));this.camera();
  }
  camera(){this.cx=clamp(this.x+90,W/2,this.level.width-W/2);this.cy=clamp(this.y+65,H/2,this.level.height-H/2);}
  start(){if(['title','paused','map'].includes(this.state)){this.keys.clear();this.state='playing';}}
  pause(){this.keys.clear();if(['playing','map'].includes(this.state))this.state='paused';}
  escape(){if(this.state==='paused')this.start();else if(['playing','map'].includes(this.state))this.pause();else if(this.state!=='title')this.title();}
  title(){if(this.state==='won'){this.levelIndex=0;this.entryScore=0;}this.reset();}
  retry(){if(this.state==='won'){this.levelIndex=0;this.entryScore=0;}this.reset();}
  choose(index){if(this.state==='title'&&this.levels[index]){this.levelIndex=index;this.entryScore=0;this.reset();}}
  enter(){if(this.state==='cleared'){this.levelIndex++;this.entryScore=this.score;this.reset();}else this.start();}
  map(){if(this.state==='map')this.start();else if(this.state==='playing'){this.state='map';this.keys.clear();}}
  press(key){if(this.keys.has(key))return;this.keys.add(key);if(key==='jump'&&this.state==='playing')this.jumpBuffer=.14;}
  release(key){this.keys.delete(key);if(key==='jump'&&this.vy>150)this.vy*=.5;}
  nearbyWarp(){for(const w of this.level.warps)for(const [from,to] of [[w.a,w.b],[w.b,w.a]])if(Math.abs(this.x-from[0])<37&&Math.abs(this.y-from[1])<45)return {from,to,name:w.name};return null;}
  warp(){const w=this.nearbyWarp();if(this.state!=='playing'||this.warpCooldown>0||!w)return false;
    this.burst(this.x,this.y,this.level.accent,22);[this.x,this.y]=w.to;this.vx=0;this.vy=0;this.grounded=false;this.coyote=0;this.jumpBuffer=0;
    this.warpCooldown=.8;this.invincible=Math.max(1,this.invincible);this.keys.clear();this.camera();this.burst(this.x,this.y,this.level.accent,22);this.message('TRANSFER COMPLETE',this.x,this.y);this.events.push('warp');return true;
  }
  enemyBox(e){return [e.x-(e.boss?45:17),e.y-(e.boss?32:13),e.boss?90:34,e.boss?64:26];}
  shoot(x,y,dx,dy,hostile=false){this.shots.push({x,y,dx,dy,hostile,life:2.2});}
  burst(x,y,color,count=8){for(let i=0;i<count;i++)this.particles.push({x,y,dx:Math.random()*180-90,dy:Math.random()*180-30,life:.4,color});if(this.particles.length>300)this.particles.splice(0,this.particles.length-300);}
  message(text,x,y){this.messages.push({text,x,y:y+26,life:1.2});}
  hurt(){if(this.invincible>0||this.state!=='playing')return;this.health--;this.invincible=1.4;this.burst(this.x,this.y,'#ff5964');this.events.push('hurt');if(this.health<=0)this.finish(false);}
  finish(won){this.state=won?(this.levelIndex+1<this.levels.length?'cleared':'won'):'dead';this.keys.clear();}
  // Kept separately so route validation exercises the same collision code as play.
  move(dt){
    this.vx=(this.keys.has('left')?-245:0)+(this.keys.has('right')?245:0);if(this.vx)this.facing=Math.sign(this.vx);
    this.coyote=this.grounded?.10:Math.max(0,this.coyote-dt);
    if(this.jumpBuffer>0&&this.coyote>0){this.vy=580;this.grounded=false;this.coyote=0;this.jumpBuffer=0;this.events.push('jump');}
    const old=this.box;this.x=clamp(this.x+this.vx*dt,20,this.level.width-20);
    for(const p of this.level.platforms)if(intersects(this.box,p)&&old[1]<p[1]+p[3]-2){if(this.vx>0)this.x=p[0]-12;else if(this.vx<0)this.x=p[0]+p[2]+12;}
    const previous=this.box;this.vy-=1450*dt;this.y+=this.vy*dt;this.grounded=false;
    for(const p of this.level.platforms)if(intersects(this.box,p)){
      if(this.vy<=0&&previous[1]>=p[1]+p[3]-1){this.y=p[1]+p[3]+21;this.vy=0;this.grounded=true;}
      else if(this.vy>0&&previous[1]+previous[3]<=p[1]+1){this.y=p[1]-21;this.vy=0;}
    }
  }
  tick(dt=STEP){
    if(this.state!=='playing')return;
    this.time+=dt;this.invincible=Math.max(0,this.invincible-dt);this.cooldown-=dt;this.jumpBuffer-=dt;this.warpCooldown=Math.max(0,this.warpCooldown-dt);this.overdrive=Math.max(0,this.overdrive-dt);
    this.move(dt);if(this.y < -70){this.health=0;this.finish(false);return;}
    if(this.keys.has('fire')&&this.cooldown<=0){const up=this.keys.has('up');this.shoot(this.x+(up?0:this.facing*24),this.y+5,up?0:this.facing*720,up?720:0);this.cooldown=this.overdrive>0?.065:.15;this.events.push('shot');}
    for(const e of this.enemies){
      if(Math.abs(e.x-this.x)>=850||Math.abs(e.y-this.y)>=500)continue;
      e.x+=e.direction*(e.boss?55:48)*dt;if(Math.abs(e.x-e.home)>(e.boss?110:75))e.direction=e.x>e.home?-1:1;
      e.cooldown-=dt;
      if(e.cooldown<=0&&Math.hypot(e.x-this.x,e.y-this.y)<650){const dx=this.x-e.x,dy=this.y-e.y,d=Math.max(1,Math.hypot(dx,dy)),speed=e.boss?250:205;
        this.shoot(e.x,e.y,dx/d*speed,dy/d*speed,true);if(e.boss){this.shoot(e.x,e.y,dx/d*speed,dy/d*speed+70,true);this.shoot(e.x,e.y,dx/d*speed,dy/d*speed-70,true);}e.cooldown=e.boss?.9:1.8;
      }
      if(intersects(this.box,this.enemyBox(e)))this.hurt();
    }
    for(let i=this.shots.length-1;i>=0;i--){
      const s=this.shots[i];s.life-=dt;s.x+=s.dx*dt;s.y+=s.dy*dt;const box=[s.x-(s.hostile?4.5:7),s.y-(s.hostile?4.5:2.5),s.hostile?9:14,s.hostile?9:5];
      let remove=s.life<=0||this.level.platforms.some(p=>intersects(box,p));
      if(!remove&&s.hostile&&intersects(box,this.box)){this.hurt();remove=true;}
      if(!remove&&!s.hostile){const c=this.supplies.find(c=>intersects(box,[c.x-22,c.y-19,44,38]));if(c){remove=true;c.hp--;this.burst(s.x,s.y,'#ffb34f');if(c.hp<=0){this.supplies=this.supplies.filter(x=>x!==c);this.pickups.push({x:c.x,y:c.y+10,kind:2});this.score+=100;this.message('SUPPLY OPEN',c.x,c.y);}}}
      if(!remove&&!s.hostile){const e=this.enemies.find(e=>intersects(box,this.enemyBox(e)));if(e){remove=true;e.hp--;this.burst(s.x,s.y,'#65eee8');if(e.hp<=0){this.score+=e.boss?2500:150;this.burst(e.x,e.y,'#ffb34f',e.boss?45:14);this.enemies=this.enemies.filter(x=>x!==e);this.events.push('explode');}}}
      if(remove)this.shots.splice(i,1);
    }
    if(this.state!=='playing')return;
    this.pickups=this.pickups.filter(p=>{
      if(!intersects(this.box,[p.x-16,p.y-18,32,42])||(p.kind===1&&this.health===5))return true;
      if(p.kind===0){this.cells++;this.score+=250;this.message(`CELL ${this.cells}/${this.totalCells} +250`,p.x,p.y);}
      else if(p.kind===1){this.health=Math.min(5,this.health+2);this.message('HEALTH +2',p.x,p.y);}
      else{this.overdrive=12;this.message('OVERDRIVE / 12 SEC',p.x,p.y);}
      this.burst(p.x,p.y,'#65eee8');this.events.push('pickup');return false;
    });
    for(const p of this.particles){p.x+=p.dx*dt;p.y+=p.dy*dt;p.dy-=130*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
    for(const m of this.messages){m.y+=25*dt;m.life-=dt;}this.messages=this.messages.filter(m=>m.life>0);
    this.camera();if(this.atExit&&this.cells===this.totalCells&&!this.enemies.some(e=>e.boss))this.finish(true);
  }
}
