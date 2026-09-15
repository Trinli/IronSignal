// Node 18+, Playwright. Uses a fresh headless browser profile, never a personal profile.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
  let server;
  const publicTest=process.argv.includes('--public');
  let baseURL=process.env.TEST_URL||'http://127.0.0.1:8080/';
  if(publicTest){
    const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),root=path.resolve('docs');
    server=http.createServer(async(req,res)=>{
      const pathname=new URL(req.url,'http://localhost').pathname;
      if(!pathname.startsWith('/demo/')){res.writeHead(404);res.end();return;}
      const relative=pathname.slice(6)||'index.html',file=path.resolve(root,relative);
      if(!file.startsWith(root+path.sep)){res.writeHead(404);res.end();return;}
      try{const bytes=await fs.readFile(file);res.setHeader('Content-Type',({'.mjs':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(bytes);}catch{res.writeHead(404);res.end();}
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));baseURL=`http://127.0.0.1:${server.address().port}/demo/`;
  }
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  try{
    const page=await browser.newPage({viewport:{width:1200,height:950}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{window.testAudio=[];window.testTones=0;const AC=window.AudioContext||window.webkitAudioContext;const create=AC.prototype.createOscillator;AC.prototype.createOscillator=function(...args){window.testTones++;return create.apply(this,args);};const Original=window.Audio;window.Audio=class extends Original{constructor(...args){super(...args);window.testAudio.push(this);}};});
    await page.goto(baseURL);
    await page.getByRole('button',{name:'Starta uppdraget · Enter',exact:true}).waitFor();
    await page.screenshot({path:'.build/web-title.png'});
    await page.getByRole('button',{name:'Starta uppdraget · Enter',exact:true}).click();
    await page.waitForTimeout(500);
    await page.waitForFunction(()=>window.testAudio.some(a=>!a.paused&&a.duration>0&&a.currentSrc.endsWith('/music/game_music.mp3')));
    const position=await page.evaluate(async()=>{const {game}=await import('./app.mjs');return game.x;});
    await page.keyboard.down('KeyD');await page.waitForTimeout(400);await page.keyboard.up('KeyD');
    assert(await page.evaluate(async x=>(await import('./app.mjs')).game.x>x+40,position));
    await page.keyboard.press('Escape');await page.getByRole('heading',{name:'PAUS',exact:true}).waitFor();
    const stopped=await page.evaluate(async()=>(await import('./app.mjs')).game.x);await page.waitForTimeout(100);
    assert.equal(await page.evaluate(async()=>(await import('./app.mjs')).game.x),stopped);
    const musicTime=await page.evaluate(()=>window.testAudio[0].currentTime);await page.waitForTimeout(250);
    assert(await page.evaluate(t=>!window.testAudio[0].paused&&window.testAudio[0].currentTime>t,musicTime));
    await page.keyboard.press('KeyX');assert(await page.evaluate(()=>window.testAudio[0].paused&&window.testAudio[0].muted));
    await page.keyboard.press('KeyX');await page.waitForFunction(()=>!window.testAudio[0].paused&&!window.testAudio[0].muted);
    await page.keyboard.press('KeyT');await page.getByRole('button',{name:'4 · NEON GARDEN',exact:true}).click();
    await page.getByRole('button',{name:'Starta uppdraget · Enter',exact:true}).click();
    await page.evaluate(async()=>{const {game}=await import('./app.mjs');game.x=1660;game.y=99;game.invincible=100;game.camera();});
    await page.keyboard.press('KeyE');assert(await page.evaluate(async()=>!(await import('./app.mjs')).game.doors[0].open));
    await page.evaluate(async()=>{const {game}=await import('./app.mjs');game.cards.add('amber');});
    await page.keyboard.press('KeyE');assert(await page.evaluate(async()=>(await import('./app.mjs')).game.doors[0].open));
    await page.evaluate(async()=>{const {game}=await import('./app.mjs');game.x=560;game.y=99;game.camera();});
    const tones=await page.evaluate(()=>window.testTones);await page.keyboard.down('KeyJ');await page.waitForTimeout(700);await page.keyboard.up('KeyJ');
    assert(await page.evaluate(async()=>(await import('./app.mjs')).game.discovered.has('nursery')));assert(await page.evaluate(n=>window.testTones>n,tones));
    await page.screenshot({path:'.build/web-garden.png'});
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(async()=>(await import('./app.mjs')).game.state),'map');
    await page.keyboard.press('Escape');await page.getByRole('heading',{name:'PAUS',exact:true}).waitFor();
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(async()=>(await import('./app.mjs')).game.state),'playing');
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(async()=>(await import('./app.mjs')).game.state),'paused');
    assert((await page.locator('#audio-status').textContent()).includes('game_music.mp3'));
    assert.deepEqual(errors,[]);
    await page.keyboard.press('KeyT');await page.getByRole('button',{name:'5 · ORBITAL CITADEL',exact:true}).click();
    await page.getByRole('button',{name:'Starta uppdraget · Enter',exact:true}).click();
    await page.evaluate(async()=>{const {game}=await import('./app.mjs');game.cards.add('blue');game.doors[0].open=true;[game.x,game.y]=game.level.warps[0].a;game.invincible=100;game.warpCooldown=0;game.camera();});
    await page.keyboard.press('KeyE');assert(await page.evaluate(async()=>{const {game}=await import('./app.mjs');return Math.abs(game.x-game.level.warps[0].b[0])<2;}));
    await page.screenshot({path:'.build/web-orbital.png'});
    assert.deepEqual(errors,[]);
    await page.keyboard.press('Escape');await page.keyboard.press('KeyT');await page.keyboard.press('Digit6');
    await page.getByRole('button',{name:'Starta uppdraget · Enter',exact:true}).click();
    assert.equal(await page.evaluate(async()=>(await import('./app.mjs')).game.levelIndex),5);
    await page.evaluate(async()=>{const {game}=await import('./app.mjs');game.x=1360;game.y=514;game.invincible=100;game.camera();});
    await page.waitForFunction(async()=>(await import('./app.mjs')).game.fireproof>0);
    await page.waitForTimeout(200);await page.evaluate(async()=>{(await import('./app.mjs')).game.invincible=0;});await page.waitForTimeout(50);await page.screenshot({path:'.build/web-ember.png'});
    await page.evaluate(async()=>{const {game}=await import('./app.mjs');game.x=1450;game.y=321;game.vy=0;game.camera();});
    await page.keyboard.press('KeyE');await page.waitForFunction(async()=>(await import('./app.mjs')).game.discovered.has('embers'));
    await page.screenshot({path:'.build/web-ember-secret.png'});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!window.testAudio[0].paused);
    assert.deepEqual(errors,[]);
    const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await mobile.goto(baseURL);await mobile.getByRole('button',{name:'Starta uppdraget · Enter',exact:true}).click();
    await mobile.locator('.touch button[data-key="jump"]').tap();
    assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    await mobile.screenshot({path:'.build/web-mobile.png'});
    console.log(`PASS ${publicTest?'static /demo/ Pages path':'local site'} with default game_music.mp3: browser load, keyboard movement, continuous menu music, explicit mute, shot synthesis, sixth mission, fire shelter, locked gates, secret room, teleport, map, focus loss and mobile layout`);
  }finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
