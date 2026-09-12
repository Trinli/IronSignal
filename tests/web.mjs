import assert from 'node:assert/strict';
import fs from 'node:fs';
import data from '../docs/data.mjs';
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
for(let level=1;level<data.levels.length;level++){
  g.levelIndex=level;g.reset();g.start();
  const support=([x,y])=>g.level.platforms.findIndex(([a,b,w,h])=>Math.abs(b+h-(y-21))<4&&x>a+12&&x<a+w-12);
  assert(support(g.level.spawn)>=0);
  for(const w of g.level.warps){for(const p of [w.a,w.b])assert(support(p)>=0);[g.x,g.y]=w.a;g.warpCooldown=0;assert(g.warp());assert.deepEqual([g.x,g.y],w.b);assert(!g.warp());g.warpCooldown=0;assert(g.warp());assert.deepEqual([g.x,g.y],w.a);g.pause();g.warpCooldown=0;assert(!g.warp());g.start();}
  [g.x,g.y]=[g.level.exit[0],g.level.exit[1]-61];assert(g.atExit);if(g.level.exit[1]>300){g.y=99;assert(!g.atExit);}
  const edges=g.level.platforms.map(()=>new Set());
  for(const [source,p] of g.level.platforms.entries()){
    const starts=new Set([p[0]+13,p[0]+p[2]-13,p[0]+p[2]/2]);
    for(const t of g.level.platforms)for(const x of [t[0]-15,t[0]+t[2]/2,t[0]+t[2]+15])starts.add(Math.min(p[0]+p[2]-13,Math.max(p[0]+13,x)));
    for(const x of starts)for(const direction of [-1,0,1])for(const jump of [false,true]){
      g.x=x;g.y=p[1]+p[3]+21;g.vx=g.vy=0;g.grounded=true;g.coyote=.1;g.jumpBuffer=jump?.14:0;g.keys=new Set(direction<0?['left']:direction>0?['right']:[]);
      for(let frame=0;frame<130;frame++){g.jumpBuffer-=STEP;g.move(STEP);g.events=[];if(g.y< -70)break;const target=support([g.x,g.y]);if(frame>2&&g.grounded&&target>=0){edges[source].add(target);if(target!==source||jump||!direction)break;}}
    }
  }
  for(const w of g.level.warps){const a=support(w.a),b=support(w.b);edges[a].add(b);edges[b].add(a);}
  const reachable=start=>{const seen=new Set([start]),queue=[start];while(queue.length)for(const n of edges[queue.shift()])if(!seen.has(n)){seen.add(n);queue.push(n);}return seen;};
  const visited=reachable(support(g.level.spawn)),exit=support([g.level.exit[0],g.level.exit[1]-61]);assert(visited.has(exit));
  for(const p of g.level.pickups.filter(p=>p.kind===0))assert(visited.has(support([p.x,p.y-13])),`Unreachable cell ${p.x},${p.y}`);
  for(const p of visited)assert(reachable(p).has(exit),`No return from ${p}`);
  console.log(`PASS ${g.level.name}: ${visited.size}/${edges.length} platforms, objectives, teleports and return routes`);
}
g.levelIndex=0;g.entryScore=0;g.reset();g.score=4200;
for(let i=1;i<data.levels.length;i++){g.finish(true);assert.equal(g.state,'cleared');g.enter();assert.equal(g.levelIndex,i);assert.equal(g.score,4200);assert.equal(g.health,5);assert.equal(g.cells,0);}
g.finish(true);assert.equal(g.state,'won');g.escape();assert.equal(g.levelIndex,0);assert.equal(g.state,'title');
g.choose(4);g.start();g.pause();g.title();assert.equal(g.levelIndex,4);assert.equal(g.score,0);
const publicFiles=fs.readdirSync(new URL('../docs/',import.meta.url));assert(!publicFiles.some(f=>/\.(mp3|flac|wav|m4a)$/i.test(f)));
console.log('PASS campaign transitions, mission selection and public bundle');
