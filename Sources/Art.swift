import Cocoa
import SpriteKit

// Pixel artwork stays in the same coordinate system as the game objects.
func glow(_ width:CGFloat,_ height:CGFloat,_ tint:NSColor) -> SKNode {
    let n=SKNode()
    for i in (1...4).reversed() {
        let p=rect(width+CGFloat(i)*9,height+CGFloat(i)*7,tint)
        p.alpha=0.025; n.addChild(p)
    }
    return n
}

func cellArt() -> SKNode {
    let n=pixelSprite([
        "....dddd....", "...dwwwwd...", "..dwwsswwd..", "..dssssssd..",
        "..dsccccsd..", "..dscwwcsd..", "..dscwwcsd..", "..dsccccsd..",
        "..dscwwcsd..", "..dscwwcsd..", "..dsccccsd..", "..dssssssd..",
        "...dwwwwd...", "....dddd...."
    ],["d":color(0x0b192a),"w":color(0xd5f4ed),"s":color(0x568b9b),"c":cyan],scale:2)
    let aura=glow(16,24,cyan);aura.zPosition = -1;n.addChild(aura)
    aura.run(.repeatForever(.sequence([.fadeAlpha(to:0.4,duration:0.7),.fadeAlpha(to:1,duration:0.7)])))
    return n
}

func medkitArt() -> SKNode {
    pixelSprite([
        "....dddddd....", "....dssssd....",
        "..dddddddddd..", ".dwwwwwwwwwwd.", ".dwsssssssswd.", ".dwswwrrwwswd.",
        ".dwswwrrwwswd.", ".dwsrrrrrrswd.", ".dwsrrrrrrswd.", ".dwswwrrwwswd.",
        ".dwswwrrwwswd.", ".dwsssssssswd.", ".dwwddddddwwd.", "..dddddddddd.."
    ],["d":color(0x162c3c),"s":color(0x9eb7b6),"w":color(0xe2e9d3),"r":color(0xe95062)],scale:2)
}

func supplyArt() -> SKNode {
    let n=SKNode()
    n.addChild(rect(44,38,color(0x101926)))
    n.addChild(rect(40,34,color(0x9b643a)))
    n.addChild(rect(32,26,color(0x483b38)))
    for x:CGFloat in [-16,16] {n.addChild(rect(5,34,color(0xd6a25e),x,0))}
    for y:CGFloat in [-13,13] {n.addChild(rect(36,5,color(0xd6a25e),0,y))}
    for x:CGFloat in [-16,16] {for y:CGFloat in [-13,13] {n.addChild(rect(2,2,color(0xeff2be),x,y))}}
    let brace=rect(29,4,color(0x8c704b));brace.zRotation = .pi/5;n.addChild(brace)
    n.addChild(rect(14,18,color(0x1e3445)));n.addChild(rect(8,12,orange))
    n.addChild(rect(3,7,color(0xfff4bd),0,1))
    return n
}

func weaponArt() -> SKNode {
    let n=pixelSprite(["...........cc...","...sssssssscc...","..swwwwwwwwwwss.","sswwwwwwwwwwwwws","srrrrrrrrrrssss.","..sssssddsss....","....ss.dd.......","....ss.........."],
                      ["s":color(0x234053),"w":color(0xd7e9df),"r":orange,"d":color(0x102431),"c":cyan],scale:2)
    n.addChild(glow(24,14,orange));return n
}

func bossArt() -> SKNode {
    let n=SKNode()
    for x:CGFloat in [-37,37] {
        n.addChild(rect(22,53,color(0x1b273a),x,-1));n.addChild(rect(16,41,color(0x67788b),x,3))
        n.addChild(rect(12,8,orange,x,12));n.addChild(rect(10,18,color(0x142639),x,-20))
        for dy:CGFloat in [-28,-24] {n.addChild(rect(7,2,color(0xff7070),x,dy))}
    }
    n.addChild(rect(58,48,color(0x182638)));n.addChild(rect(50,42,color(0x8797a2)))
    n.addChild(rect(42,31,color(0x38475f)));n.addChild(rect(28,23,color(0x471b35)))
    n.addChild(rect(20,17,color(0xf45172)));n.addChild(rect(12,9,color(0xffdbc4)))
    n.addChild(glow(25,22,color(0xff4466)))
    for x:CGFloat in [-21,21] {for y:CGFloat in [-17,17] {n.addChild(rect(4,4,color(0xd1e2dc),x,y))}}
    let antenna=rect(3,13,orange,0,29);n.addChild(antenna)
    return n
}

extension Game {
    func decorateNewWorld() {
        let garden=levelIndex==3,accent=color(mission.accent)
        sky.addChild(rect(worldWidth+1800,mission.height+1200,color(garden ? 0x101f29:0x100e26),worldWidth/2,mission.height/2))
        for i in 0..<240 {
            sky.addChild(rect(i%7==0 ? 3:2,2,color(garden ? 0x72a883:0x9c91c9),CGFloat((i*173)%Int(worldWidth+1000)),CGFloat((i*107)%Int(mission.height+300))))
        }
        if !garden {
            let planet=SKNode();planet.position=point(500,900)
            for i in -35...35 {
                let y=CGFloat(i)*5,width=sqrt(max(0,180*180-y*y))*2
                planet.addChild(rect(width,5,color(i%5==0 ? 0x638ead:0x395e85),0,y))
            }
            sky.addChild(planet)
        }
        for row in 0..<Int(mission.height/300)+1 {
            for col in 0..<Int(worldWidth/340)+1 {
                let n=SKNode();n.position=point(CGFloat(col)*340+130,CGFloat(row)*300+145);n.zPosition = -6
                n.addChild(rect(252,259,color(garden ? 0x243c3b:0x3a324f)))
                n.addChild(rect(238,245,color(garden ? 0x102f30:0x151930)))
                if garden {
                    // Glass cultivation chambers, roots, leaves and flowering vines.
                    n.addChild(rect(146,164,color(0x244e48),0,13));n.addChild(rect(134,152,color(0x153c3b),0,13))
                    n.addChild(rect(4,136,color(0x618d7a),-49,13))
                    for x:CGFloat in [-30,0,30] {
                        n.addChild(rect(4,116,color(0x5e9f68),x,0))
                        for i in 0..<5 {
                            let y=CGFloat(i)*23-48,side:CGFloat=i%2==0 ? 1:-1
                            let leaf=rect(23,10,color(i%2==0 ? 0x94c26f:0x548e60),x+side*10,y);leaf.zRotation=side*0.4;n.addChild(leaf)
                        }
                        n.addChild(rect(12,12,color(col%2==0 ? 0xffb2ce:0xe6c779),x,65))
                    }
                    n.addChild(rect(170,18,color(0x6b6350),0,-79));n.addChild(rect(152,4,color(0xb2b078),0,-70))
                    for i in 0..<8 {
                        let x=CGFloat(i)*29-102,depth=CGFloat((i*17+row*19)%75+15)
                        n.addChild(rect(3,depth,color(0x649261),x,129-depth/2))
                        n.addChild(rect(10,6,color(0x82ae66),x+3,129-depth))
                    }
                    n.addChild(label("BIODOME / \(row)-\(col)",9,accent,0,-109))
                } else {
                    // Observation windows and rotating scanner arrays.
                    for x:CGFloat in [-74,0,74] {
                        n.addChild(rect(63,122,color(0x6f7088),x,21));n.addChild(rect(55,114,color(0x080f24),x,21))
                        n.addChild(rect(3,92,color(0x424c78),x-18,24))
                        for i in 0..<5 {n.addChild(rect(2,2,color(0xc5d1ef),x+CGFloat((i*13+col*7)%39)-20,CGFloat(i)*20-20))}
                    }
                    let scanner=SKNode();scanner.position=point(0,-76)
                    scanner.addChild(rect(39,3,accent));scanner.addChild(rect(3,39,color(0x8298d7)))
                    scanner.run(.repeatForever(.rotate(byAngle:.pi*2,duration:5)));n.addChild(scanner)
                    for x:CGFloat in [-96,96] {n.addChild(rect(12,8,orange,x,-85))}
                    n.addChild(label("ORBIT / \(row)-\(col)",9,accent,0,105))
                }
                for x:CGFloat in [-119,119] {for y:CGFloat in [-121,121] {n.addChild(rect(4,4,color(0xb4c3ba),x,y))}}
                world.addChild(n)
            }
        }
    }
    func decorateVerticalWorld() {
        if levelIndex>=3 {decorateNewWorld();return}
        let frost=levelIndex==1, accent=color(mission.accent)
        let bg:UInt32=frost ? 0x0d1e3b:0x251321
        for i in 0..<Int(mission.height/30)+2 {
            sky.addChild(rect(worldWidth+1400,30,color(bg+UInt32(i%14)*0x010101),worldWidth/2,CGFloat(i)*30))
        }
        for i in 0..<180 {
            let n=rect(frost ? 3:2,frost ? 3:5,frost ? color(0x7098b3):color(0xb45a4b),CGFloat((i*163)%Int(worldWidth+900)),CGFloat((i*97)%Int(mission.height)))
            sky.addChild(n)
        }
        for i in 0..<14 {
            let x=CGFloat(i)*300, height=CGFloat(390+(i*71)%750)
            backdrop.addChild(rect(140,height,color(frost ? 0x253d5c:0x3d263a),x,height/2))
            for y in stride(from:CGFloat(80),to:height,by:80) {
                backdrop.addChild(rect(115,3,accent.withAlphaComponent(0.35),x,y))
            }
        }
        for row in 0..<Int(mission.height/300)+1 {
            for col in 0..<Int(worldWidth/340)+1 {
                let x=CGFloat(col)*340+120,y=CGFloat(row)*300+150
                let n=SKNode();n.position=point(x,y);n.zPosition = -6
                if frost {
                    n.addChild(rect(234,252,color(0x1a334e)));n.addChild(rect(222,240,color(0x10293d)))
                    n.addChild(rect(180,98,color(0x254b69),0,35))
                    for k in 0..<5 {
                        let pane=rect(27,86,color(0x365c7b),CGFloat(k)*34-68,35);n.addChild(pane)
                        let shine=rect(2,70,color(0x8cb8ce),CGFloat(k)*34-77,41);n.addChild(shine)
                    }
                    n.addChild(rect(192,7,color(0xb6d5df),0,87))
                    n.addChild(rect(150,12,color(0x536b88),0,-51))
                    for k in 0..<7 {n.addChild(rect(8,4,k%3==0 ? orange:accent,CGFloat(k)*20-60,-50))}
                    n.addChild(label("CRYO / \(row)-\(col)",9,accent,0,-84))
                    for k in 0..<5 {
                        let length=CGFloat(10+(k*13+row*7)%35)
                        n.addChild(rect(6,length,color(0xaed5e4),CGFloat(k)*37-72,120-length/2))
                        n.addChild(rect(2,7,color(0xd5f4f1),CGFloat(k)*37-72,117-length))
                    }
                } else {
                    n.addChild(rect(220,254,color(0x3c2838)))
                    for r in 0..<5 {for c in 0..<3 {
                        n.addChild(rect(62,41,color((r+c)%2==0 ? 0x503442:0x452d3e),CGFloat(c)*68-68,CGFloat(r)*46-92))
                    }}
                    n.addChild(rect(30,262,color(0x763542),0,0))
                    n.addChild(rect(16,256,color(0xc75342),0,0))
                    n.addChild(rect(6,252,color(0xf9a060),-3,0))
                    for yy:CGFloat in [-95,0,95] {
                        n.addChild(rect(234,11,color(0x6e6572),0,yy))
                        for xx:CGFloat in [-95,95] {n.addChild(rect(5,5,color(0xc4b5a6),xx,yy))}
                    }
                    let heat=rect(26,246,orange);heat.alpha=0.15;n.addChild(heat)
                    heat.run(.repeatForever(.sequence([.fadeAlpha(to:0.3,duration:0.8),.fadeAlpha(to:0.08,duration:0.6)])))
                }
                world.addChild(n)
            }
        }
    }
    func decorateWorld() {
        // A distant violet sky with a banded planet, behind the moving skyline.
        for i in 0..<18 {
            sky.addChild(rect(worldWidth+1000,30,color(UInt32(0x101326 + i*0x010101)),worldWidth/2,CGFloat(i)*30))
        }
        for i in 0..<150 {
            sky.addChild(rect(i%9==0 ? 3:2,2,color(i%3==0 ? 0x779ec0:0x41536e),CGFloat((i*137)%7800),CGFloat(160+(i*83)%320)))
        }
        let planet=SKNode();planet.position=CGPoint(x:310,y:397)
        for i in 0..<30 {
            let y=CGFloat(i-15)*4, radius:CGFloat=63
            let width=sqrt(max(0,radius*radius-y*y))*2
            planet.addChild(rect(width,4,color(i%4==0 ? 0x927897:0x6d607f),0,y))
        }
        let ring=rect(187,5,color(0xbaa0ad));ring.zRotation = -0.2;planet.addChild(ring);sky.addChild(planet)
        for i in 0..<32 {
            let x=CGFloat(i)*240+70
            let zone=i%3, tint=color(zone==0 ? 0x364967:zone==1 ? 0x3e3557:0x285654)
            let building=rect(118,CGFloat(100+(i*53)%140),tint,x,150)
            backdrop.addChild(building)
            for y in stride(from:CGFloat(130),through:250,by:26) {
                backdrop.addChild(rect(82,3,color(0x679dba),x,y))
            }
        }
        // Distinct loading bay, foundry, coolant plant and core chamber.
        for i in 0..<22 {
            let x=CGFloat(i)*310+130, zone=min(3,Int(x/1700))
            let accent=color([UInt32(0x4daabd),0xdb8b54,0x57bfa6,0xbc648f][zone])
            let panel=SKNode();panel.position=CGPoint(x:x,y:250);panel.zPosition = -5
            panel.addChild(rect(220,260,color([UInt32(0x142d40),0x362c32,0x173a3c,0x30273f][zone])))
            panel.addChild(rect(212,252,color(0x152334)))
            for y:CGFloat in [-115,115] {panel.addChild(rect(212,3,accent.withAlphaComponent(0.35),0,y))}
            for xx:CGFloat in [-99,99] {for yy:CGFloat in [-108,108] {panel.addChild(rect(4,4,color(0x6b7f89),xx,yy))}}
            if i%3==0 {
                // Rotating ventilation fan recessed in an armored wall panel.
                panel.addChild(rect(86,86,color(0x32485b),0,20));panel.addChild(rect(76,76,color(0x081624),0,20))
                let fan=SKNode();fan.position.y=20
                for j in 0..<4 {
                    let blade=rect(12,29,color(0x4a6978),0,18);let arm=SKNode();arm.zRotation=CGFloat(j) * .pi/2;arm.addChild(blade);fan.addChild(arm)
                }
                fan.addChild(rect(12,12,accent));fan.run(.repeatForever(.rotate(byAngle: .pi*2,duration:3.5)));panel.addChild(fan)
                for d in stride(from:CGFloat(-33),through:33,by:11) {panel.addChild(rect(76,2,color(0x172b3b),0,20+d))}
                panel.addChild(label("VENT / 0\(i%8+1)",9,accent,0,-42))
            } else if zone==2 || i%4==0 {
                panel.addChild(rect(54,130,color(0x47646a),0,-2));panel.addChild(rect(40,118,color(0x0a252e),0,-2))
                panel.addChild(rect(32,86,accent.withAlphaComponent(0.5),0,-12))
                for dy in stride(from:CGFloat(-48),through:34,by:17) {panel.addChild(rect(5,5,color(0x9fe6c4),-7+dy.truncatingRemainder(dividingBy:13),dy))}
                panel.addChild(rect(58,9,color(0x84979b),0,62));panel.addChild(rect(58,9,color(0x84979b),0,-66))
                let shine=rect(3,103,color(0xb4ecdf),-12,0);shine.alpha=0.4;panel.addChild(shine)
            } else {
                panel.addChild(rect(100,69,color(0x415667),0,18));panel.addChild(rect(88,55,color(0x092c36),0,19))
                for j in 0..<6 {panel.addChild(rect(CGFloat(12+(j*19)%53),3,accent,-15,36-CGFloat(j)*7))}
                for j in 0..<5 {panel.addChild(rect(7,5,j%2==0 ? orange:cyan,CGFloat(j)*14-28,-27))}
                panel.addChild(label("SYSTEM / \(i+10)",9,accent,0,-49))
            }
            // Thick overhead pipes with collars and a slowly blinking status light.
            panel.addChild(rect(235,14,color(0x40556a),0,99));panel.addChild(rect(235,3,color(0x73899a),0,104))
            for xx:CGFloat in [-85,70] {panel.addChild(rect(9,22,color(0x899695),xx,99))}
            let light=rect(8,4,accent,81,-91);panel.addChild(light)
            light.run(.repeatForever(.sequence([.fadeAlpha(to:0.25,duration:0.6),.fadeAlpha(to:1,duration:1.2)])))
            world.addChild(panel)
        }
        for x:CGFloat in [290,1000,2310,3620,4520,5700] {
            let props=SKNode();props.position=CGPoint(x:x,y:100);props.zPosition = -2
            props.addChild(rect(34,43,color(0x5a4653)));props.addChild(rect(30,35,color(0x826574)))
            for y:CGFloat in [-14,14] {props.addChild(rect(36,5,color(0xafa296),0,y))}
            props.addChild(rect(12,13,orange));props.addChild(label("!",12,ink,0,-5));world.addChild(props)
        }
        for x:CGFloat in [1810,3410,5020] {
            let pit=SKNode();pit.position=CGPoint(x:x,y:18);pit.zPosition = -3
            pit.addChild(rect(170,30,color(0x843532)));pit.addChild(rect(163,7,orange,0,15))
            for i in 0..<10 {
                let ember=rect(3,3,orange,CGFloat(i)*16-75,18)
                ember.run(.repeatForever(.sequence([.group([.moveBy(x:12,y:60,duration:1+Double(i)*0.13),.fadeOut(withDuration:1+Double(i)*0.13)]),.moveBy(x:-12,y:-60,duration:0),.fadeIn(withDuration:0)])))
                pit.addChild(ember)
            };world.addChild(pit)
        }
    }
}
