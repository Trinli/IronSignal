import Cocoa
import SpriteKit

struct WarpLink {
    let name:String
    // Endpoints are safe standing positions for the player, not pad origins.
    let a:CGPoint
    let b:CGPoint
}
struct Mission {
    let name:String
    let subtitle:String
    let width:CGFloat
    let height:CGFloat
    let spawn:CGPoint
    let exit:CGPoint
    let accent:UInt32
    let platforms:[CGRect]
    let cells:[CGPoint]
    let guards:[CGPoint]
    let boss:CGPoint
    let supplies:[CGPoint]
    let meds:[CGPoint]
    let warps:[WarpLink]
}
func point(_ x:CGFloat,_ y:CGFloat)->CGPoint {CGPoint(x:x,y:y)}
func ledge(_ x:CGFloat,_ y:CGFloat,_ w:CGFloat,_ h:CGFloat=20)->CGRect {CGRect(x:x,y:y,width:w,height:h)}

let missions:[Mission] = [
    Mission(name:"IRON DOCKS",subtitle:"Break through the factory and disable the security core.",width:6800,height:540,
            spawn:point(120,102),exit:point(6600,160),accent:0x65eee8,platforms:[],cells:[],guards:[],boss:point(6180,175),supplies:[],meds:[],warps:[]),
    Mission(name:"FROZEN UPLINK",subtitle:"Climb the antenna. Warp into the lab. Descend to extraction.",width:3200,height:1400,
            spawn:point(120,102),exit:point(3050,160),accent:0x8fdcff,
            platforms:[ledge(0,0,3200,78),ledge(330,150,200),ledge(550,230,200),ledge(770,310,200),
                       ledge(990,390,200),ledge(1210,470,200),ledge(1430,550,200),ledge(1650,630,260),
                       ledge(2170,990,340),ledge(2550,900,200),ledge(2780,810,210),ledge(2550,720,200),
                       ledge(2780,630,210),ledge(2550,540,200),ledge(2780,450,210),ledge(2550,360,200),
                       ledge(2780,270,210),ledge(2550,180,200)],
            cells:[point(430,204),point(1090,444),point(1750,684),point(2340,1044),point(2880,864),point(2650,594)],
            guards:[point(710,112),point(1320,514),point(1780,674),point(2390,1034),point(2850,674),point(2640,404)],
            boss:point(2830,146),supplies:[point(570,97),point(1530,589),point(2230,1029),point(2600,219)],
            meds:[point(1060,442),point(2440,1040),point(2680,410),point(2430,110)],
            warps:[WarpLink(name:"UPLINK",a:point(1830,671),b:point(2280,1031))]),
    Mission(name:"MAGMA VAULT",subtitle:"Descend into the vault, then climb the reactor tower.",width:3900,height:1600,
            spawn:point(120,1051),exit:point(3710,1132),accent:0xffa16a,
            platforms:[ledge(0,0,3900,78),ledge(0,1010,260),ledge(300,920,200),ledge(540,830,200),
                       ledge(780,740,200),ledge(1020,650,200),ledge(1260,560,300),
                       ledge(2000,150,200),ledge(2230,230,200),ledge(2460,310,200),ledge(2690,390,200),
                       ledge(2460,470,200),ledge(2230,550,200),ledge(2000,630,200),ledge(2230,710,200),
                       ledge(2460,790,200),ledge(2690,870,200),ledge(2920,950,200),ledge(3150,1030,740)],
            cells:[point(400,974),point(880,794),point(1410,614),point(2100,204),point(2560,844),point(3310,1084)],
            guards:[point(660,874),point(1130,694),point(1510,604),point(2130,194),point(2800,434),point(2090,674),point(2800,914)],
            boss:point(3540,1118),supplies:[point(200,1049),point(1380,599),point(1930,97),point(2530,509),point(3200,1069)],
            meds:[point(590,880),point(1450,610),point(2330,600),point(3390,1080)],
            warps:[WarpLink(name:"VAULT",a:point(1490,601),b:point(1880,99)),
                   WarpLink(name:"RETURN",a:point(120,99),b:point(120,1051))])
] + [gardenMission(),orbitalMission()]

func gardenMission()->Mission {
    Mission(name:"NEON GARDEN",subtitle:"Explore the overgrown towers and warp through the canopy.",width:3500,height:1450,
        spawn:point(120,102),exit:point(3300,160),accent:0x91ee92,
        platforms:[ledge(0,0,3500,78),ledge(330,150,200),ledge(550,230,200),ledge(770,310,200),ledge(990,390,200),
                   ledge(1210,470,200),ledge(1430,550,420),ledge(2200,950,330),ledge(2570,860,200),ledge(2800,770,210),
                   ledge(2570,680,200),ledge(2800,590,210),ledge(2570,500,200),ledge(2800,410,210),ledge(2570,320,200),
                   ledge(2800,230,210),ledge(2570,140,200)],
        cells:[point(430,204),point(1090,444),point(1540,604),point(2360,1004),point(2900,824),point(2670,554)],
        guards:[point(690,274),point(1320,514),point(1700,594),point(2400,994),point(2880,634),point(2690,364)],
        boss:point(3100,146),supplies:[point(550,97),point(1640,589),point(2240,989),point(2870,269)],
        meds:[point(830,360),point(1810,600),point(2490,1000),point(3100,110)],
        warps:[WarpLink(name:"CANOPY",a:point(1770,591),b:point(2300,991)),
               WarpLink(name:"ROOTS",a:point(2010,99),b:point(1500,591))])
}
func orbitalMission()->Mission {
    Mission(name:"ORBITAL CITADEL",subtitle:"Cross the satellite decks and storm the command bridge.",width:4200,height:1750,
        spawn:point(120,1291),exit:point(4000,1292),accent:0xd8acff,
        platforms:[ledge(0,0,4200,78),ledge(0,1250,260),ledge(300,1160,200),ledge(540,1070,200),ledge(780,980,200),
                   ledge(1020,890,200),ledge(1260,800,300),ledge(2000,150,200),ledge(2230,230,200),ledge(2460,310,200),
                   ledge(2690,390,200),ledge(2460,470,200),ledge(2230,550,200),ledge(2000,630,200),ledge(2230,710,200),
                   ledge(2460,790,200),ledge(2690,870,200),ledge(2920,950,200),ledge(3150,1030,200),ledge(3380,1110,200),ledge(3610,1190,550)],
        cells:[point(400,1214),point(880,1034),point(1410,854),point(2100,204),point(2560,844),point(3720,1244)],
        guards:[point(670,1114),point(1130,934),point(1460,844),point(2140,194),point(2790,434),point(2100,674),point(2800,914),point(3500,1154)],
        boss:point(3880,1278),supplies:[point(210,1289),point(1330,839),point(1900,97),point(2330,589),point(3650,1229)],
        meds:[point(600,1120),point(1510,850),point(2550,520),point(3230,1080),point(3790,1240)],
        warps:[WarpLink(name:"AIRLOCK",a:point(1490,841),b:point(1870,99)),
               WarpLink(name:"RESCUE",a:point(120,99),b:point(120,1291))])
}

extension Game {
    func buildMission() {
        for r in mission.platforms {addPlatform(r.minX,r.minY,r.width,r.height)}
        for p in mission.cells {addPickup(p.x,p.y,0)}
        for p in mission.meds {addPickup(p.x,p.y,1)}
        for p in mission.guards+[mission.boss] {
            let e=Enemy(x:p.x,y:p.y,boss:p==mission.boss);enemies.append(e);world.addChild(e.node)
        }
        for p in mission.supplies {
            let n=supplyArt();n.position=p;n.zPosition=10;world.addChild(n)
            supplies.append(Supply(node:n,box:CGRect(x:p.x-22,y:p.y-19,width:44,height:38)))
        }
        for link in mission.warps {
            addWarpPad(link.a,link.name);addWarpPad(link.b,link.name)
        }
        let signs:[(String,CGPoint)] = levelIndex>=3
            ? [(mission.name,point(mission.spawn.x+260,mission.spawn.y+130))]+mission.warps.map{("[E] \($0.name) / TWO-WAY",point($0.a.x,$0.a.y+130))}
            : levelIndex==1
            ? [("ANTENNA / ASCEND  >>>",point(770,550)),("E: UPLINK TO LAB",point(1780,755)),("COOLANT SHAFT / DESCEND",point(2690,1120))]
            : [("VAULT ACCESS / DESCEND  >>>",point(700,1110)),("E: TRANSFER TO REACTOR",point(1390,705)),("REACTOR / ASCEND",point(2390,1190)),("RETURN PAD / E",point(120,204))]
        for (text,p) in signs {world.addChild(label(text,12,color(mission.accent),p.x,p.y))}
    }
    func addWarpPad(_ p:CGPoint,_ title:String) {
        let n=SKNode();n.position=point(p.x,p.y-21);n.zPosition=8
        n.addChild(rect(70,10,color(0x3b506a),0,2));n.addChild(rect(58,4,color(mission.accent),0,8))
        for x:CGFloat in [-31,31] {
            n.addChild(rect(7,70,color(0x637992),x,40));n.addChild(rect(3,54,color(mission.accent),x,41))
        }
        n.addChild(rect(69,8,color(0x718499),0,76))
        let field=SKNode()
        for y in stride(from:CGFloat(16),through:67,by:9) {field.addChild(rect(52,3,color(mission.accent).withAlphaComponent(0.5),0,y))}
        field.run(.repeatForever(.sequence([.fadeAlpha(to:0.2,duration:0.5),.fadeAlpha(to:1,duration:0.7)])));n.addChild(field)
        n.addChild(label("[E] \(title)",9,color(mission.accent),0,93));world.addChild(n)
    }
    func nearbyWarp()->(CGPoint,CGPoint)? {
        for warp in mission.warps {
            for (source,destination) in [(warp.a,warp.b),(warp.b,warp.a)] {
                if abs(px-source.x)<37 && abs(py-source.y)<45 {return(source,destination)}
            }
        }
        return nil
    }
    func activateWarp() {
        guard state=="playing",warpCooldown<=0,let (source,destination)=nearbyWarp() else {return}
        sparks(source,color(mission.accent),count:22)
        px=destination.x;py=destination.y;vx=0;vy=0;grounded=false;coyote=0;jumpBuffer=0
        warpCooldown=0.8;invincible=max(invincible,1.0);keys=[]
        sparks(destination,color(mission.accent),count:22);tone(640,0.12);syncPlayer()
        popup("TRANSFER COMPLETE",destination,color(mission.accent))
    }
    func startPlaying() {
        state="playing";world.isPaused=false;overlay.removeFromParent();keys=[];music?.play()
    }
    func nextMission() {
        guard state=="cleared",levelIndex+1<missions.count else {return}
        levelIndex+=1;entryScore=score;reset()
    }
    func chooseMission(_ index:Int) {
        guard state=="title",missions.indices.contains(index) else {return}
        levelIndex=index;entryScore=0;reset()
    }
    func toggleMap() {
        if state=="map" {startPlaying();return}
        guard state=="playing" else {return}
        state="map";keys=[];world.isPaused=true;music?.pause()
        showOverlay("MISSION MAP",mission.name,[])
        let scale=min(720/mission.width,195/mission.height)
        func project(_ p:CGPoint)->CGPoint {point((p.x-mission.width/2)*scale,(p.y-mission.height/2)*scale-25)}
        for p in platforms {
            let center=project(point(p.r.midX,p.r.midY))
            overlay.addChild(rect(max(3,p.r.width*scale),max(2,p.r.height*scale),color(0x6c859e),center.x,center.y))
        }
        for link in mission.warps {
            let a=project(link.a),b=project(link.b)
            let line=rect(hypot(b.x-a.x,b.y-a.y),1,color(0x725d99),(a.x+b.x)/2,(a.y+b.y)/2)
            line.zRotation=atan2(b.y-a.y,b.x-a.x);overlay.addChild(line)
            for p in [a,b] {overlay.addChild(rect(7,7,color(0xc9a2ff),p.x,p.y))}
        }
        for pickup in pickups where pickup.kind==0 {
            let p=project(point(pickup.box.midX,pickup.box.midY));overlay.addChild(rect(5,5,cyan,p.x,p.y))
        }
        let exit=project(mission.exit);overlay.addChild(rect(8,9,color(0x86e49d),exit.x,exit.y))
        let p=project(point(px,py)),marker=rect(8,8,orange,p.x,p.y);overlay.addChild(marker)
        marker.run(.repeatForever(.sequence([.fadeAlpha(to:0.3,duration:0.35),.fadeAlpha(to:1,duration:0.35)])))
        overlay.addChild(label("ORANGE: YOU  CYAN: CELLS  PURPLE: WARP  GREEN: EXIT",10,color(0xc0d2db),0,-144))
        overlay.addChild(label("TAB TO RESUME",10,orange,0,-162))
    }
    var atExit:Bool {abs(px-mission.exit.x)<65 && abs(py-(mission.exit.y-61))<85}
}
