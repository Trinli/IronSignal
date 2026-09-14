import assert from 'node:assert/strict';
import fs from 'node:fs';
import data from '../docs/campaign.mjs';
import {Game,STEP} from '../docs/engine.mjs';
const g=new Game(data.levels),advance=n=>{for(let i=0;i<n;i++)g.tick(STEP);};
assert.equal(data.levels.length,5);g.start();advance(20);assert.equal(g.y,99);assert(g.grounded);
g.press('right');advance(55);g.press('jump');advance(28);g.release('right');advance(40);assert.equal(g.y,186);assert.equal(g.cells,1);
const e=g.enemies[0],hp=e.hp;g.shoot(e.x,e.y+20,0,-720);advance(3);assert.equal(e.hp,hp-1);
g.invincible=0;const health=g.health;g.hurt();g.hurt();assert.equal(g.health,health-1);
g.escape();const x=g.x;advance(30);assert.equal(g.x,x);assert.equal(g.state,'paused');g.escape();assert.equal(g.state,'playing');
g.map();g.escape();assert.equal(g.state,'paused');g.title();assert.equal(g.state,'title');
g.start();g.invincible=1000;const crate=g.supplies[0];for(let i=0;i<2;i++){g.shoot(crate.x-32,crate.y,720,0);advance(3);}assert(!g.supplies.includes(crate));
const upgrade=g.pickups.find(p=>p.kind===2);assert(upgrade);g.x=upgrade.x;g.y=upgrade.y;advance(1);assert(g.overdrive>11);g.overdrive=.01;advance(2);assert.equal(g.overdrive,0);
console.log('PASS movement, landing, collection, combat, damage, pause and weapon upgrades');
// Build reachable surfaces with closed gates and secret walls cutting the floor.
// Edges use the real player physics, including collisions and jump clearance.
function routes(g){
  const surfaces=[];
  for(const [x,y,w,h] of g.level.platforms){
    const top=y+h;let pieces=[[x,x+w]];
    for(const [a,b,c,d] of g.solids)if(b<top+42&&b+d>top+1){
      pieces=pieces.flatMap(([left,right])=>a>=right||a+c<=left?[[left,right]]:[[left,Math.min(right,a)],[Math.max(left,a+c),right]].filter(([l,r])=>r-l>26));
    }
    for(const [left,right] of pieces)if(right-left>26)surfaces.push([left,top,right-left]);
  }
  const support=([x,y])=>surfaces.findIndex(([a,b,w])=>Math.abs(b-(y-21))<4&&x>a+11&&x<a+w-11);
  const edges=surfaces.map(()=>new Set());
  for(const [source,p] of surfaces.entries()){
    const starts=new Set([p[0]+13,p[0]+p[2]-13,p[0]+p[2]/2]);
    for(const t of surfaces)for(const x of [t[0]-130,t[0]-80,t[0]-15,t[0]+t[2]/2,t[0]+t[2]+15,t[0]+t[2]+80,t[0]+t[2]+130])starts.add(Math.min(p[0]+p[2]-13,Math.max(p[0]+13,x)));
    for(const x of starts)for(const direction of [-1,0,1])for(const jump of [false,true]){
      g.x=x;g.y=p[1]+21;g.vx=g.vy=0;g.grounded=true;g.coyote=.1;g.jumpBuffer=jump?.14:0;g.keys=new Set(direction<0?['left']:direction>0?['right']:[]);
      for(let frame=0;frame<130;frame++){g.jumpBuffer-=STEP;g.move(STEP);g.events=[];if(g.y< -70)break;const target=support([g.x,g.y]);if(frame>2&&g.grounded&&target>=0){edges[source].add(target);if(target!==source||jump||!direction)break;}}
    }
  }
  for(const w of g.level.warps)if(!w.requires||g.cards.has(w.requires)){const a=support(w.a),b=support(w.b);assert(a>=0&&b>=0);edges[a].add(b);edges[b].add(a);}
  const reachable=start=>{assert(start>=0);const seen=new Set([start]),queue=[start];while(queue.length)for(const n of edges[queue.shift()])if(!seen.has(n)){seen.add(n);queue.push(n);}return seen;};
  const visited=reachable(support(g.level.spawn));
  return {surfaces,edges,support,visited,reachable,exit:support([g.level.exit[0],g.level.exit[1]-61])};
}
for(let level=0;level<data.levels.length;level++){
  g.levelIndex=level;g.reset();g.start();
  for(const w of g.level.warps){if(w.requires){[g.x,g.y]=w.a;assert(!g.warp());g.cards.add(w.requires);}[g.x,g.y]=w.a;g.warpCooldown=0;assert(g.warp());assert.deepEqual([g.x,g.y],w.b);assert(!g.warp());g.warpCooldown=0;assert(g.warp());assert.deepEqual([g.x,g.y],w.a);}
  g.cards.clear();
  for(const door of g.doors){
    const r=routes(g);assert(!r.visited.has(r.exit),'Exit reachable before opening gates');
    const card=g.pickups.find(p=>p.kind===5&&p.key===door.key);
    assert(r.visited.has(r.support([card.x,card.y-13])),`Unreachable ${card.key} card in ${g.level.name}`);
    g.x=door.box[0]-35;g.y=99;assert(!g.interact());g.cards.add(card.key);assert(g.interact());assert(door.open);
  }
  const r=routes(g);assert(r.visited.has(r.exit),`Exit unreachable in ${g.level.name}`);
  for(const p of g.level.pickups.filter(p=>p.kind===0))assert(r.visited.has(r.support([p.x,p.y-13])),`Unreachable cell ${p.x},${p.y} in ${g.level.name}`);
  for(const p of r.visited)assert(r.reachable(p).has(r.exit),`No return from ${p} in ${g.level.name}`);
  if(g.panels.length){g.panels=[];const secretRoutes=routes(g);for(const p of g.level.pickups.filter(p=>p.secret))assert(secretRoutes.visited.has(secretRoutes.support([p.x,p.y-13])),`Unreachable secret loot in ${g.level.name}`);}
  console.log(`PASS ${g.level.name}: objectives, ordered key routes, exit, secrets and return paths`);
}
// Verify actual collisions, combat rewards and retry behavior separately from route search.
g.levelIndex=3;g.reset();g.start();g.enemies=[];g.invincible=100;
const gate=g.doors[0];g.x=gate.box[0]-40;g.y=99;g.press('right');advance(60);assert(g.x<=gate.box[0]-12);g.release('right');
g.cards.add(gate.key);assert(g.interact());g.press('right');advance(30);assert(g.x>gate.box[0]+gate.box[2]);g.release('right');
const panel=g.panels[0];g.x=panel.box[0]-60;g.y=99;g.shots=[];g.press('fire');advance(40);g.release('fire');assert.equal(g.panels.length,0);assert(g.discovered.has(panel.secret));
const hiddenGun=g.pickups.find(p=>p.kind===4&&p.secret);g.x=hiddenGun.x;g.y=hiddenGun.y;advance(1);assert.equal(g.weaponTier,3);assert.equal(g.weapon.damage,4);
g.invincible=0;g.armor=2;g.hurt();assert.equal(g.armor,1);assert.equal(g.health,5);
const spring=g.level.springs[0];g.x=spring.x;g.y=spring.y+21;g.vy=0;advance(1);assert.equal(g.vy,800);advance(20);assert(g.y>spring.y+200,'Boost needs overhead clearance');
g.shots=[];g.barrels=[{x:100,y:96,hp:2},{x:180,y:96,hp:2}];g.enemies=[{x:220,y:100,hp:25,maxHP:25}];g.x=500;g.explode(g.barrels[0]);assert.equal(g.barrels.length,0);assert.equal(g.enemies.length,0);
g.shots=[];g.barrels=[];g.enemies=[150,190].map(x=>({x,y:100,home:x,hp:12,maxHP:12,type:'turret',cooldown:99,direction:1}));g.shoot(100,100,720,0);advance(20);assert.deepEqual(g.enemies.map(e=>e.hp),[8,8]);
g.retry();assert.equal(g.cards.size,0);assert.equal(g.discovered.size,0);assert(g.doors.every(d=>!d.open));assert.equal(g.panels.length,1);assert.equal(g.weaponTier,2);
const hpProgress=data.levels.map((_,i)=>{g.levelIndex=i;g.reset();return g.enemies.find(e=>!e.boss).hp;});assert(hpProgress.every((hp,i)=>!i||hp>hpProgress[i-1]));
console.log('PASS gates, breakable secret panels, rail upgrade, armor, jump boost, barrel chains and reset');
g.levelIndex=0;g.entryScore=0;g.reset();g.score=4200;
for(let i=1;i<data.levels.length;i++){g.finish(true);assert.equal(g.state,'cleared');g.enter();assert.equal(g.levelIndex,i);assert.equal(g.score,4200);assert.equal(g.health,5);assert.equal(g.cells,0);}
g.finish(true);assert.equal(g.state,'won');g.escape();assert.equal(g.levelIndex,0);assert.equal(g.state,'title');
g.choose(4);g.start();g.pause();g.title();assert.equal(g.levelIndex,4);assert.equal(g.score,0);
const publicFiles=fs.readdirSync(new URL('../docs/',import.meta.url));assert(!publicFiles.some(f=>/\.(mp3|flac|wav|m4a)$/i.test(f)));
console.log('PASS campaign transitions, mission selection and public bundle');
