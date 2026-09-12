import Cocoa
import SpriteKit
import AVFoundation
import UniformTypeIdentifiers

let W: CGFloat = 960
let H: CGFloat = 540
func color(_ hex: UInt32) -> NSColor {
    NSColor(red: CGFloat((hex >> 16) & 255)/255, green: CGFloat((hex >> 8) & 255)/255, blue: CGFloat(hex & 255)/255, alpha: 1)
}
let cyan = color(0x65eee8), orange = color(0xffb34f), ink = color(0x080e19)
func rect(_ w: CGFloat, _ h: CGFloat, _ c: NSColor, _ x: CGFloat = 0, _ y: CGFloat = 0) -> SKSpriteNode {
    let n = SKSpriteNode(color: c, size: CGSize(width: w, height: h)); n.position = CGPoint(x:x,y:y); return n
}
func label(_ text: String, _ size: CGFloat, _ c: NSColor, _ x: CGFloat = 0, _ y: CGFloat = 0) -> SKLabelNode {
    let n = SKLabelNode(fontNamed:"Menlo-Bold"); n.text=text; n.fontSize=size; n.fontColor=c; n.position=CGPoint(x:x,y:y); return n
}
func pixelSprite(_ rows: [String], _ palette: [Character:NSColor], scale: CGFloat = 3) -> SKNode {
    let node=SKNode()
    for (y,row) in rows.enumerated() {
        for (x,char) in row.enumerated() {
            if let c=palette[char] { node.addChild(rect(scale,scale,c,(CGFloat(x)-CGFloat(row.count-1)/2)*scale,(CGFloat(rows.count-1)/2-CGFloat(y))*scale)) }
        }
    }
    return node
}
func heroArt() -> SKNode {
    pixelSprite(["...yyyy...","..yyyyyy..","..ssssss..","..sKKsss..","...ssss...","..RRRRRR..",".RRRRRRRR.",".sRRRRRsgg",".ssRRRRggg","...bbbb...","...bbbb...","...b..b...","...b..b...","..KK..KK.."], ["y":orange,"s":color(0xf1b88e),"K":color(0x152032),"R":color(0xe84e52),"b":color(0x6198bd),"g":color(0xa5d9dd)])
}
func droneArt() -> SKNode {
    pixelSprite([".gg....gg.","gggggggggg","gddddddddg","ddRRRRRRdd","gddddddddg",".gggggggg.","..g....g.."], ["g":color(0x7391a6),"d":color(0x33465c),"R":color(0xff5964)])
}
struct Platform { let r: CGRect }
struct Shot { let node: SKSpriteNode; var velocity: CGVector; let hostile: Bool; var life: Double }
struct Pickup { let node: SKNode; let kind: Int; let box: CGRect }
struct Supply { let node: SKNode; let box: CGRect; var hp: Int = 2 }
final class Enemy {
    let node: SKNode
    var x: CGFloat; var y: CGFloat; let home: CGFloat; let range: CGFloat
    var direction: CGFloat = -1; var hp: Int; var cooldown: Double; let boss: Bool
    init(x:CGFloat,y:CGFloat,boss:Bool=false) {
        self.x=x; self.y=y; home=x; range=boss ? 110:75; self.boss=boss; hp=boss ? 45:3; cooldown=1
        node=boss ? bossArt():droneArt(); node.position=CGPoint(x:x,y:y)
    }
    var box: CGRect { CGRect(x:x-(boss ? 45:17),y:y-(boss ? 32:13),width:boss ? 90:34,height:boss ? 64:26) }
}
final class Game: SKScene {
    var levelIndex=0, entryScore=0
    var mission:Mission {missions[levelIndex]}
    var worldWidth:CGFloat {mission.width}
    var warpCooldown:Double=0
    let cameraNode=SKCameraNode(), world=SKNode(), backdrop=SKNode(), sky=SKNode(), hud=SKNode()
    var player=SKNode(), overlay=SKNode(), gate=SKNode()
    var platforms=[Platform](), enemies=[Enemy](), shots=[Shot](), pickups=[Pickup]()
    var supplies=[Supply](), overdrive:Double=0
    var keys=Set<UInt16>()
    var px:CGFloat=120, py:CGFloat=101, vx:CGFloat=0, vy:CGFloat=0, facing:CGFloat=1
    var grounded=false, coyote:Double=0, jumpBuffer:Double=0, invincible:Double=0, fireCooldown:Double=0
    var health=5, score=0, cells=0, totalCells=6, state="title", elapsed:Double=0, last:Double=0
    var music:AVAudioPlayer?, musicURL:URL?, effects=[AVAudioPlayer](), muted=false
    let status=label("",16,cyan,-446,228), scoreLabel=label("",14,orange,446,228)
    let hint=label("",11,color(0x8cabbc),0,-248)
    let bossLabel=label("",13,color(0xff7278),0,196)
    let musicLabel=label("",10,color(0x90a9b7),-446,-226)
    var lastMusicError: String?
    override func didMove(to view:SKView) {
        backgroundColor=ink; sky.zPosition = -30; backdrop.zPosition = -20
        addChild(sky); addChild(backdrop); addChild(world); addChild(cameraNode); camera=cameraNode
        cameraNode.addChild(hud); hud.zPosition=500
        hud.addChild(rect(W,48,color(0x101c2c),0,246)); hud.addChild(rect(W,2,cyan,0,222))
        hud.addChild(rect(W,48,color(0x101c2c),0,-246))
        status.horizontalAlignmentMode = .left; scoreLabel.horizontalAlignmentMode = .right
        musicLabel.horizontalAlignmentMode = .left
        for n in [status,scoreLabel,hint,bossLabel,musicLabel] { hud.addChild(n) }
        reset()
        if let index=CommandLine.arguments.firstIndex(of:"--music"), index+1<CommandLine.arguments.count {
            loadMusic(URL(fileURLWithPath:CommandLine.arguments[index+1]))
        } else if let url=defaultMusicURL(in:URL(fileURLWithPath:FileManager.default.currentDirectoryPath).appendingPathComponent("music")) {loadMusic(url)}
        updateHUD()
    }
    func reset() {
        world.removeAllChildren(); backdrop.removeAllChildren(); sky.removeAllChildren(); overlay.removeFromParent()
        world.isPaused=false;platforms=[]; enemies=[]; shots=[]; pickups=[]; supplies=[]; keys=[];overdrive=0
        px=mission.spawn.x;py=mission.spawn.y;vx=0;vy=0;health=5;score=entryScore;cells=0;elapsed=0;invincible=0;fireCooldown=0;coyote=0;jumpBuffer=0;grounded=false;facing=1;warpCooldown=0
        totalCells=levelIndex==0 ? 6:mission.cells.count
        state="title"; music?.pause()
        if levelIndex==0 {
        // Layered industrial skyline, lit windows and repeated structural ribs.
        for i in 0..<42 {
            let x=CGFloat(i)*210, height=CGFloat(110+(i*71)%230)
            backdrop.addChild(rect(150,height,color(i%2==0 ? 0x12263a:0x162d41),x,height/2+45))
            for r in 0..<5 { for c in 0..<4 {
                if (i+r+c)%3 != 0 { backdrop.addChild(rect(6,12,color(0x245666),x-52+CGFloat(c)*30,80+CGFloat(r)*38)) }
            }}
            backdrop.addChild(rect(4,370,color(0x234152),x+88,225))
        }
        for x in stride(from:CGFloat(0),to:worldWidth,by:320) {
            world.addChild(rect(4,360,color(0x1d3546),x,242))
            world.addChild(rect(120,5,color(0x294354),x,396))
            let lamp=rect(48,4,cyan,x,389); lamp.alpha=0.6; world.addChild(lamp)
        }
        decorateWorld()
        addPlatform(0,0,1750,78); addPlatform(1910,0,1440,78); addPlatform(3510,0,1450,78); addPlatform(5120,0,1680,78)
        for (x,y,w) in [(390,145,170),(740,218,190),(1110,155,180),(1510,160,160),(1710,150,210),(2070,150,200),(2400,220,190),(2740,145,220),(3150,150,200),(3350,145,210),(3720,150,180),(4050,222,220),(4420,150,170),(4780,148,190),(4970,145,210),(5400,150,170)] {
            addPlatform(CGFloat(x),CGFloat(y),CGFloat(w),20)
        }
        for x in [620,1260,2150,2670,3030,3810,4360,4670,5510] {
            let e=Enemy(x:CGFloat(x),y:112); enemies.append(e);world.addChild(e.node)
        }
        for (x,y) in [(840,265),(2470,265),(4170,266)] {
            let e=Enemy(x:CGFloat(x),y:CGFloat(y));enemies.append(e);world.addChild(e.node)
        }
        let boss=Enemy(x:6180,y:175,boss:true); enemies.append(boss);world.addChild(boss.node)
        for (x,y) in [(460,199),(1180,210),(2200,204),(2830,199),(4140,276),(4850,202)] { addPickup(CGFloat(x),CGFloat(y),0) }
        for x in [1370,2910,4620,5600] { addPickup(CGFloat(x),110,1) }
        for x:CGFloat in [550,1570,2540,3910,5230,5790] {
            let n=supplyArt();n.position=CGPoint(x:x,y:97);n.zPosition=10;world.addChild(n)
            supplies.append(Supply(node:n,box:CGRect(x:x-22,y:78,width:44,height:38)))
        }
        world.addChild(label("SHOOT TO OPEN",9,orange,550,133))
        } else {decorateVerticalWorld();buildMission()}
        gate=SKNode(); gate.position=mission.exit
        gate.addChild(rect(100,164,color(0x294152))); gate.addChild(rect(76,144,color(0x0a1625)))
        for i in 0..<7 { gate.addChild(rect(64,3,cyan,0,CGFloat(i)*18-53)) }
        for x:CGFloat in [-43,43] {
            gate.addChild(rect(8,151,color(0x819ba9),x,0))
            for y:CGFloat in [-66,-30,6,42,66] {gate.addChild(rect(9,7,orange,x,y))}
        }
        let field=rect(69,138,cyan);field.alpha=0.1;gate.addChild(field)
        field.run(.repeatForever(.sequence([.fadeAlpha(to:0.25,duration:1),.fadeAlpha(to:0.08,duration:1)])))
        gate.addChild(label("EXTRACT",11,cyan,0,96));world.addChild(gate)
        if levelIndex==0 {for (x,title) in [(160,"SECTOR 07 / INFILTRATION"),(2110,"ASSEMBLY LINE"),(3710,"REACTOR APPROACH"),(5840,"SECURITY CORE")] {
            world.addChild(label(title,12,color(0x9db9c9),CGFloat(x)+190,430))
        }}
        player=heroArt();player.zPosition=20;world.addChild(player);syncPlayer()
        showOverlay(mission.name, "IRON SIGNAL / MISSION \(levelIndex+1) OF \(missions.count)", [mission.subtitle,"Collect \(totalCells) cells. Destroy the core. Reach EXTRACT.","", "A/D MOVE   SPACE JUMP   J FIRE   W AIM UP", "E TELEPORT   TAB MAP   ESC PAUSE   M MUSIC", "", "1-\(missions.count) SELECT MISSION     ENTER TO DEPLOY"])
        updateHUD()
    }
    func addPlatform(_ x:CGFloat,_ y:CGFloat,_ w:CGFloat,_ h:CGFloat) {
        platforms.append(Platform(r:CGRect(x:x,y:y,width:w,height:h)))
        world.addChild(rect(w,h,color(levelIndex==2 ? 0x594047:levelIndex==1 ? 0x354e6a:0x283d50),x+w/2,y+h/2))
        world.addChild(rect(w,4,color(levelIndex==1 ? 0xc8f0ff:0x7293a0),x+w/2,y+h-2))
        for dx in stride(from:CGFloat(12),to:w,by:32) {
            world.addChild(rect(13,5,color(0x465c68),x+dx,y+h-12))
        }
        if h<=30 {
            for dx in stride(from:CGFloat(14),to:w-8,by:30) {
                let strut=rect(19,3,color(0x7293a0),x+dx,y+7);strut.zRotation = .pi/5;world.addChild(strut)
            }
            world.addChild(rect(w-8,2,cyan.withAlphaComponent(0.45),x+w/2,y+1))
        }
        if h>30 {
            for dx in stride(from:CGFloat(0),to:w,by:48) {
                world.addChild(rect(21,7,orange,x+dx+12,y+h-23))
                world.addChild(rect(2,36,color(0x172938),x+dx,y+22))
            }
        }
    }
    func addPickup(_ x:CGFloat,_ y:CGFloat,_ kind:Int) {
        let n=SKNode(); n.position=CGPoint(x:x,y:y); n.zPosition=12
        n.addChild(kind==0 ? cellArt():kind==1 ? medkitArt():weaponArt());world.addChild(n)
        n.run(.repeatForever(.sequence([.moveBy(x:0,y:5,duration:0.55),.moveBy(x:0,y:-5,duration:0.55)])))
        pickups.append(Pickup(node:n,kind:kind,box:CGRect(x:x-16,y:y-18,width:32,height:42)))
    }
    func showOverlay(_ title:String,_ subtitle:String,_ lines:[String]) {
        overlay.removeFromParent();overlay=SKNode();overlay.zPosition=1000;cameraNode.addChild(overlay)
        overlay.addChild(rect(W,H,NSColor.black.withAlphaComponent(0.72)))
        overlay.addChild(rect(764,352,color(0x101f30),0,7));overlay.addChild(rect(764,3,orange,0,183))
        overlay.addChild(label(title,46,orange,0,106));overlay.addChild(label(subtitle,12,cyan,0,72))
        for (i,line) in lines.enumerated() { overlay.addChild(label(line,13,color(0xc0d2db),0,26-CGFloat(i)*23)) }
    }
    override func keyDown(with event:NSEvent) {
        let k=event.keyCode
        if event.isARepeat { return }
        keys.insert(k)
        if k==53 {handleEscape();return}
        if k==46 { chooseMusic();return }
        if k==7 { muted.toggle();music?.volume=muted ? 0:0.55;updateHUD();return }
        if k==15 {if state=="won" {levelIndex=0;entryScore=0};reset();return}
        if state=="title",let index=[UInt16(18),19,20,21,23].firstIndex(of:k) {chooseMission(index);return}
        if k==17 {returnToTitle();return}
        if k==36 && state=="paused" {startPlaying();return}
        if k==36 && state=="cleared" {nextMission();return}
        if k==36 && state=="title" {startPlaying();return}
        if k==14 {activateWarp();return}
        if k==48 {toggleMap();return}
        if k==35 { togglePause();return }
        if k==49 && state=="playing" { jumpBuffer=0.14 }
    }
    override func keyUp(with event:NSEvent) { keys.remove(event.keyCode); if event.keyCode==49 && vy>150 {vy *= 0.5} }
    func togglePause() {
        if state=="paused" {startPlaying()} else {pauseGame()}
    }
    func focusLost() { keys=[];if state=="playing" {togglePause()} }
    func chooseMusic() {
        if state=="playing" {togglePause()}
        let panel=NSOpenPanel();panel.title="Choose Commando music (MP3, WAV, M4A or AIFF)";panel.allowedContentTypes=[.audio]
        if panel.runModal() == .OK, let url=panel.url {loadMusic(url)}
        keys=[]
    }
    func loadMusic(_ url:URL) {
        do {
            let audio=try AVAudioPlayer(contentsOf:url);audio.numberOfLoops = -1;audio.volume=muted ? 0:0.55;audio.prepareToPlay()
            music?.stop();music=audio;musicURL=url;lastMusicError=nil
            if state=="playing" {audio.play()}
        } catch { lastMusicError="Could not load audio. Choose another file with M." }
        updateHUD()
    }
    func updateHUD() {
        status.text="HP \(String(repeating:"■",count:max(0,health)))\(String(repeating:"·",count:max(0,5-health)))   CELLS \(cells)/\(totalCells)"
        scoreLabel.text=overdrive>0 ? String(format:"%06d / OVERDRIVE %02ds",score,Int(ceil(overdrive))):String(format:"%06d / %d-%d %@",score,levelIndex+1,missions.count,mission.name)
        hint.text="A/D MOVE  SPACE JUMP  J FIRE  W AIM UP  E WARP  TAB MAP  ESC PAUSE  M MUSIC  R RESET"
        musicLabel.text=lastMusicError ?? (musicURL.map {"MUSIC: \($0.lastPathComponent)\(muted ? " [MUTED]":"")"} ?? "MUSIC: PRESS M TO LOAD YOUR COMMANDO AUDIO FILE")
        if let b=enemies.first(where:{$0.boss}),hypot(px-b.x,py-b.y)<650 {bossLabel.text="SECURITY CORE  \(b.hp)/45"} else {bossLabel.text=nil}
        if nearbyWarp() != nil {hint.text=warpCooldown>0 ? "TELEPORT RECHARGING...":"[E] TELEPORT — TWO-WAY LINK"}
        if atExit && state=="playing" {hint.text="EXTRACTION LOCKED: COLLECT ALL \(totalCells) CELLS AND DESTROY THE CORE"}
    }
    var playerBox:CGRect {CGRect(x:px-12,y:py-21,width:24,height:42)}
    func syncPlayer() {
        player.position=CGPoint(x:px,y:py);player.xScale=facing
        player.alpha=invincible>0 && Int(invincible*14)%2==0 ? 0.35:1
        player.zRotation=grounded && abs(vx)>10 ? sin(elapsed*19)*0.035:0
        cameraNode.position=CGPoint(x:min(worldWidth-W/2,max(W/2,px+90)),y:min(mission.height-H/2,max(H/2,py+65)))
        backdrop.position.x=cameraNode.position.x*0.55
        sky.position.x=cameraNode.position.x*0.82
        backdrop.position.y=(cameraNode.position.y-H/2)*0.25
        sky.position.y=(cameraNode.position.y-H/2)*0.65
    }
    override func update(_ currentTime:TimeInterval) {
        let dt=min(1.0/30,max(0,currentTime-last));last=currentTime
        guard state=="playing" else {return}
        elapsed+=dt;invincible=max(0,invincible-dt);fireCooldown-=dt;jumpBuffer-=dt;overdrive=max(0,overdrive-dt);warpCooldown=max(0,warpCooldown-dt)
        let step=CGFloat(dt), left=keys.contains(0)||keys.contains(123), right=keys.contains(2)||keys.contains(124)
        vx=(left ? -245:0)+(right ? 245:0);if vx != 0 {facing=vx>0 ? 1:-1}
        coyote=grounded ? 0.10:max(0,coyote-dt)
        if jumpBuffer>0 && coyote>0 {vy=580;grounded=false;coyote=0;jumpBuffer=0;tone(420,0.08)}
        let old=playerBox
        px=min(worldWidth-20,max(20,px+vx*step))
        for p in platforms where playerBox.intersects(p.r) && old.minY<p.r.maxY-2 {
            if vx>0 {px=p.r.minX-12} else if vx<0 {px=p.r.maxX+12}
        }
        let previous=playerBox;vy-=1450*step;py+=vy*step;grounded=false
        for p in platforms where playerBox.intersects(p.r) {
            if vy<=0 && previous.minY>=p.r.maxY-1 {py=p.r.maxY+21;vy=0;grounded=true}
            else if vy>0 && previous.maxY<=p.r.minY+1 {py=p.r.minY-21;vy=0}
        }
        if py < -70 {health=0;finish(false);return}
        if (keys.contains(38)||keys.contains(40)) && fireCooldown<=0 {
            let up=keys.contains(13)||keys.contains(126)
            shoot(px+(up ? 0:facing*24),py+5,up ? 0:facing*720,up ? 720:0,false)
            fireCooldown=overdrive>0 ? 0.065:0.15;tone(overdrive>0 ? 240:160,0.035)
            let flash=rect(12,12,orange,px+(up ? 0:facing*25),py+(up ? 19:5));flash.zPosition=25;world.addChild(flash)
            flash.run(.sequence([.fadeOut(withDuration:0.065),.removeFromParent()]))
        }
        for e in enemies where abs(e.x-px)<850 && abs(e.y-py)<500 {
            e.x+=e.direction*(e.boss ? 55:48)*step
            if abs(e.x-e.home)>e.range {e.direction = e.x>e.home ? -1:1}
            e.node.position=CGPoint(x:e.x,y:e.y+sin(elapsed*3+Double(e.home))*3)
            e.cooldown-=dt
            if e.cooldown<=0 && hypot(e.x-px,e.y-py)<650 {
                let dx=px-e.x,dy=py-e.y,d=max(1,hypot(dx,dy)),speed:CGFloat=e.boss ? 250:205
                shoot(e.x,e.y,dx/d*speed,dy/d*speed,true)
                if e.boss {shoot(e.x,e.y,dx/d*speed,dy/d*speed+70,true);shoot(e.x,e.y,dx/d*speed,dy/d*speed-70,true)}
                e.cooldown=e.boss ? 0.9:1.8
            }
            if playerBox.intersects(e.box) {hurt()}
        }
        for i in shots.indices.reversed() {
            shots[i].life-=dt;let n=shots[i].node
            n.position.x+=shots[i].velocity.dx*step;n.position.y+=shots[i].velocity.dy*step
            let box=n.frame
            var remove=shots[i].life<=0 || platforms.contains(where:{$0.r.intersects(box)})
            if !remove && shots[i].hostile && playerBox.intersects(box) {hurt();remove=true}
            if !remove && !shots[i].hostile {
                if let index=supplies.firstIndex(where:{$0.box.intersects(box)}) {
                    supplies[index].hp-=1;remove=true;sparks(n.position,orange)
                    if supplies[index].hp<=0 {
                        let p=supplies[index].node.position
                        supplies[index].node.removeFromParent();supplies.remove(at:index)
                        addPickup(p.x,p.y+10,2);score+=100;sparks(p,orange,count:18)
                        popup("SUPPLY OPEN",p,orange)
                    }
                }
            }
            if !remove && !shots[i].hostile {
                if let e=enemies.first(where:{$0.box.intersects(box)}) {
                    e.hp-=1;remove=true;sparks(n.position,cyan)
                    if e.hp<=0 {score+=e.boss ? 2500:150;sparks(e.node.position,orange,count:e.boss ? 45:14);e.node.removeFromParent();enemies.removeAll(where:{$0===e});tone(70,0.16)}
                }
            }
            if remove {n.removeFromParent();shots.remove(at:i)}
        }
        for i in pickups.indices.reversed() where playerBox.intersects(pickups[i].box) {
            if pickups[i].kind==1 && health==5 {continue}
            if pickups[i].kind==0 {cells+=1;score+=250;popup("CELL \(cells)/\(totalCells)  +250",pickups[i].node.position,cyan)}
            else if pickups[i].kind==1 {health=min(5,health+2);popup("HEALTH +2",pickups[i].node.position,color(0x9be4aa))}
            else {overdrive=12;popup("OVERDRIVE / 12 SEC",pickups[i].node.position,orange)}
            sparks(pickups[i].node.position,cyan);pickups[i].node.removeFromParent();pickups.remove(at:i);tone(880,0.1)
        }
        if state=="playing" && atExit && cells==totalCells && !enemies.contains(where:{$0.boss}) {finish(true)}
        effects.removeAll(where:{!$0.isPlaying});syncPlayer();updateHUD()
    }
    func shoot(_ x:CGFloat,_ y:CGFloat,_ dx:CGFloat,_ dy:CGFloat,_ hostile:Bool) {
        let n=rect(hostile ? 9:14,hostile ? 9:5,hostile ? color(0xff6565):cyan,x,y)
        n.addChild(rect(hostile ? 4:8,3,color(0xfff2d6)))
        n.zPosition=15;world.addChild(n);shots.append(Shot(node:n,velocity:CGVector(dx:dx,dy:dy),hostile:hostile,life:2.2))
    }
    func popup(_ text:String,_ p:CGPoint,_ tint:NSColor) {
        let n=label(text,10,tint,p.x,p.y+26);n.zPosition=40;world.addChild(n)
        n.run(.sequence([.group([.moveBy(x:0,y:32,duration:1),.sequence([.wait(forDuration:0.5),.fadeOut(withDuration:0.5)])]),.removeFromParent()]))
    }
    func hurt() {
        if invincible>0 || state != "playing" {return}
        health-=1;invincible=1.4;sparks(player.position,color(0xff5964));tone(90,0.12)
        if health<=0 {finish(false)}
    }
    func finish(_ won:Bool) {
        state=won ? (levelIndex+1<missions.count ? "cleared":"won"):"dead";keys=[];music?.pause();world.isPaused=true
        let next=state=="cleared" ? "ENTER: NEXT MISSION — \(missions[levelIndex+1].name)":"R TO RESTART     ESC FOR TITLE"
        showOverlay(won ? (state=="won" ? "CAMPAIGN COMPLETE":"SECTOR SECURED"):"SIGNAL LOST",mission.name,["SCORE \(score)     CELLS \(cells)/\(totalCells)","",won ? "Extraction successful.":"R retries this mission.","",next])
    }
    func sparks(_ p:CGPoint,_ c:NSColor,count:Int=8) {
        for _ in 0..<count {
            let n=rect(4,4,c,p.x,p.y);n.zPosition=30;world.addChild(n)
            n.run(.sequence([.group([.moveBy(x:CGFloat.random(in:-65...65),y:CGFloat.random(in:-35...65),duration:0.35),.fadeOut(withDuration:0.35)]),.removeFromParent()]))
        }
    }
    func tone(_ frequency:Double,_ duration:Double) {
        if muted {return}
        let rate=22050, count=Int(Double(rate)*duration)
        var data=Data()
        func str(_ s:String) {data.append(s.data(using:.ascii)!)}
        func u16(_ v:UInt16) {var v=v.littleEndian;withUnsafeBytes(of:&v){data.append(contentsOf:$0)}}
        func u32(_ v:UInt32) {var v=v.littleEndian;withUnsafeBytes(of:&v){data.append(contentsOf:$0)}}
        str("RIFF");u32(UInt32(36+count*2));str("WAVEfmt ");u32(16);u16(1);u16(1);u32(UInt32(rate));u32(UInt32(rate*2));u16(2);u16(16);str("data");u32(UInt32(count*2))
        for i in 0..<count {
            let t=Double(i)/Double(rate),env=(1-Double(i)/Double(count))*min(1,Double(i)/60)
            let sample=Int16((sin(t*frequency*2*Double.pi)>0 ? 1.0:-1.0)*env*1800)
            u16(UInt16(bitPattern:sample))
        }
        if let p=try? AVAudioPlayer(data:data) {p.play();effects.append(p)}
    }
}

final class AppDelegate:NSObject,NSApplicationDelegate,NSWindowDelegate {
    var window:NSWindow!
    var game:Game!
    func applicationDidFinishLaunching(_ notification:Notification) {
        let menu=NSMenu();let appItem=NSMenuItem();menu.addItem(appItem);let appMenu=NSMenu();appItem.submenu=appMenu
        appMenu.addItem(withTitle:"Quit Iron Signal",action:#selector(NSApplication.terminate(_:)),keyEquivalent:"q");NSApp.mainMenu=menu
        window=NSWindow(contentRect:NSRect(x:0,y:0,width:960,height:540),styleMask:[.titled,.closable,.miniaturizable,.resizable],backing:.buffered,defer:false)
        window.title="IRON SIGNAL — \(missions.count)-sector campaign";window.minSize=NSSize(width:768,height:455);window.center();window.delegate=self
        let view=SKView(frame:window.contentView!.bounds);view.autoresizingMask=[.width,.height];view.ignoresSiblingOrder=false;view.preferredFramesPerSecond=60
        game=Game(size:CGSize(width:W,height:H));game.scaleMode = .aspectFit
        window.contentView=view;view.presentScene(game);window.makeFirstResponder(view);window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps:true)
    }
    func windowDidResignKey(_ notification:Notification) {game?.focusLost()}
    func applicationShouldTerminateAfterLastWindowClosed(_ sender:NSApplication)->Bool {true}
}
if let index=CommandLine.arguments.firstIndex(of:"--export-web"),index+1<CommandLine.arguments.count {
    try exportWeb(to:CommandLine.arguments[index+1])
} else if let index=CommandLine.arguments.firstIndex(of:"--preview"), index+1<CommandLine.arguments.count {
    let g=Game(size:CGSize(width:W,height:H))
    if let i=CommandLine.arguments.firstIndex(of:"--level"),i+1<CommandLine.arguments.count,let value=Int(CommandLine.arguments[i+1]),missions.indices.contains(value-1) {g.levelIndex=value-1}
    g.reset()
    if let i=CommandLine.arguments.firstIndex(of:"--upper"),i>=0,let warp=g.mission.warps.first {g.px=warp.b.x;g.py=warp.b.y;g.syncPlayer()}
    try exportPreview(g,to:CommandLine.arguments[index+1])
    print("Saved static art preview")
} else if CommandLine.arguments.contains("--self-test") {
    let g=Game(size:CGSize(width:W,height:H));g.reset()
    precondition(g.platforms.count==20,"Level platform count")
    precondition(g.pickups.filter{$0.kind==0}.count==6,"Six cells required")
    precondition(g.enemies.filter{$0.boss}.count==1,"One security core")
    precondition(g.playerBox.minY>=78,"Safe spawn")
    // Maximum ballistic rise must reach every first-tier platform.
    precondition(580.0*580.0/(2*1450)>102,"Jump can reach lower platforms")
    g.muted=true;g.state="playing"
    var tick=0.0
    func advance(_ frames:Int) {for _ in 0..<frames {tick+=1.0/60;g.update(tick)}}
    advance(20)
    precondition(g.grounded && abs(g.py-99)<0.1,"Player lands on floor")
    g.keys=[2];advance(55);g.keys=[]
    precondition(g.px>330 && g.px<390,"Horizontal movement")
    g.jumpBuffer=0.14;g.keys=[2];advance(28);g.keys=[];advance(40)
    precondition(g.grounded && abs(g.py-186)<0.1,"Jump and land on raised platform")
    precondition(g.cells==1,"First cell collected during jump")
    let e=g.enemies[0],oldHP=g.enemies[0].hp
    g.shoot(e.x,e.y+20,0,-720,false);advance(3)
    precondition(e.hp==oldHP-1,"Projectile damages enemy")
    let oldHealth=g.health;g.invincible=0;g.hurt();g.hurt()
    precondition(g.health==oldHealth-1,"Invulnerability prevents consecutive damage")
    g.togglePause();let oldX=g.px;g.keys=[2];advance(20)
    precondition(g.px==oldX && g.state=="paused","Pause stops simulation")
    g.togglePause();g.keys=[];g.invincible=100
    let crate=g.supplies[0],count=g.supplies.count
    for _ in 0..<2 {g.shoot(crate.box.minX-10,crate.box.midY,720,0,false);advance(3)}
    precondition(g.supplies.count==count-1,"Supply crate breaks after two hits")
    guard let upgrade=g.pickups.first(where:{$0.kind==2}) else {fatalError("Crate drops weapon upgrade")}
    g.px=upgrade.box.midX;g.py=upgrade.box.midY;advance(1)
    precondition(g.overdrive>11,"Collecting weapon activates overdrive")
    g.overdrive=0.01;advance(2);precondition(g.overdrive==0,"Overdrive expires")
    print("PASS: level, movement, pickups, combat, pause, destructible supplies and timed weapon upgrade")
    testCampaign()
} else {
    let app=NSApplication.shared;app.setActivationPolicy(.regular);let delegate=AppDelegate();app.delegate=delegate;app.run()
}
