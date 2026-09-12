import Cocoa
import SpriteKit

func testCampaign() {
    let g=Game(size:CGSize(width:W,height:H));g.muted=true
    for level in 1..<missions.count {
        g.levelIndex=level;g.reset();g.startPlaying()
        precondition(g.pickups.filter{$0.kind==0}.count==g.totalCells,"Mission objectives")
        func support(_ standing:CGPoint)->Int? {
            g.platforms.firstIndex {abs($0.r.maxY-(standing.y-21))<4 && standing.x>$0.r.minX+12 && standing.x<$0.r.maxX-12}
        }
        precondition(support(g.mission.spawn) != nil,"Safe mission spawn")
        g.toggleMap();let beforeMap=point(g.px,g.py);g.keys=[2];g.update(g.last+0.02)
        precondition(g.state=="map" && point(g.px,g.py)==beforeMap,"Map pauses movement")
        g.toggleMap();precondition(g.state=="playing" && g.keys.isEmpty,"Map resumes without stuck movement")
        for link in g.mission.warps {
            precondition(support(link.a) != nil && support(link.b) != nil,"Both teleport endpoints have solid footing")
            g.px=link.a.x;g.py=link.a.y;g.warpCooldown=0;g.activateWarp()
            precondition(g.px==link.b.x && g.py==link.b.y,"Outbound teleport")
            g.activateWarp();precondition(g.px==link.b.x,"Cooldown stops immediate return")
            g.warpCooldown=0;g.activateWarp()
            precondition(g.px==link.a.x && g.py==link.a.y,"Return teleport")
            g.togglePause();g.warpCooldown=0;g.activateWarp()
            precondition(g.px==link.a.x,"Cannot teleport while paused");g.togglePause()
        }
        g.px=g.mission.exit.x;g.py=99
        if g.mission.exit.y>300 {precondition(!g.atExit,"Standing below exit does not finish mission")}
        g.py=g.mission.exit.y-61;precondition(g.atExit,"Exit respects both coordinates")
        g.syncPlayer();precondition(g.cameraNode.position.y>H/2 || g.mission.exit.y<300,"Camera follows upper exit")

        // Build traversal edges by running the game's actual update/collision code.
        // Try jumping and walking off each platform from useful departure points.
        // This checks falls, head collisions and jump range rather than assuming
        // that neighboring rectangles are connected.
        g.enemies=[];g.shots=[];g.pickups=[];g.supplies=[]
        var edges=Array(repeating:Set<Int>(),count:g.platforms.count)
        var clock=g.last
        for (source,p) in g.platforms.enumerated() {
            var departures:Set<CGFloat>=[p.r.minX+13,p.r.maxX-13,p.r.midX]
            for target in g.platforms {
                for x in [target.r.minX-15,target.r.midX,target.r.maxX+15] {
                    departures.insert(min(p.r.maxX-13,max(p.r.minX+13,x)))
                }
            }
            for x in departures {
                for direction in [-1,0,1] {
                    for jumping in [false,true] {
                        g.px=x;g.py=p.r.maxY+21;g.vx=0;g.vy=0;g.grounded=true;g.coyote=0.1
                        g.jumpBuffer=jumping ? 0.14:0;g.invincible=10000;g.state="playing"
                        g.keys=direction<0 ? [0]:direction>0 ? [2]:[]
                        for frame in 0..<130 {
                            clock+=1.0/60;g.update(clock)
                            if g.state != "playing" {break}
                            if frame>2 && g.grounded,let target=support(point(g.px,g.py)) {
                                edges[source].insert(target)
                                // A non-jumping walk must have time to leave its source.
                                if target != source || jumping || direction==0 {break}
                            }
                        }
                    }
                }
            }
        }
        for link in g.mission.warps {
            let a=support(link.a)!,b=support(link.b)!;edges[a].insert(b);edges[b].insert(a)
        }
        func reachable(_ start:Int)->Set<Int> {
            var seen:Set<Int>=[start],queue=[start]
            while !queue.isEmpty {
                let current=queue.removeFirst()
                for next in edges[current] where !seen.contains(next) {seen.insert(next);queue.append(next)}
            }
            return seen
        }
        let visited=reachable(support(g.mission.spawn)!)
        for cell in g.mission.cells {
            let platform=support(point(cell.x,cell.y-13))!
            precondition(visited.contains(platform),"Unreachable cell at \(cell) in \(g.mission.name)")
        }
        let exit=support(point(g.mission.exit.x,g.mission.exit.y-61))!
        precondition(visited.contains(exit),"Exit reachable")
        for platform in visited {
            precondition(reachable(platform).contains(exit),"No softlock after falling onto platform \(platform)")
        }
        print("PASS: \(g.mission.name) — \(visited.count)/\(g.platforms.count) platforms reachable, all cells, exit, return routes and teleports")
    }
    g.levelIndex=0;g.entryScore=0;g.reset();g.score=4200;g.finish(true)
    precondition(g.state=="cleared","First mission offers continuation")
    g.nextMission();precondition(g.levelIndex==1 && g.score==4200 && g.health==5 && g.cells==0,"Next mission preserves score and resets health/objectives")
    g.score+=100;g.reset();precondition(g.score==4200,"Retry restores entry score")
    for index in 2..<missions.count {g.finish(true);g.nextMission();precondition(g.levelIndex==index,"Campaign transition")}
    g.finish(true);g.nextMission();precondition(g.levelIndex==missions.count-1 && g.state=="won","Final victory does not overflow campaign")
    g.handleEscape();precondition(g.state=="title" && g.levelIndex==0,"Escape from victory returns to title")
    g.chooseMission(missions.count-1);precondition(g.levelIndex==missions.count-1,"Newest mission is selectable")
    g.startPlaying();g.keys=[2];let position=point(g.px,g.py)
    g.handleEscape();g.update(g.last+0.02)
    precondition(g.state=="paused" && g.keys.isEmpty && point(g.px,g.py)==position,"Escape pauses without movement")
    g.handleEscape();precondition(g.state=="playing" && !g.world.isPaused,"Escape resumes")
    g.toggleMap();g.handleEscape();precondition(g.state=="paused","Escape from map opens pause menu")
    g.returnToTitle();precondition(g.state=="title" && g.score==g.entryScore,"Title resets current mission")
    g.handleEscape();precondition(g.state=="title","Escape from title does not quit")
    print("PASS: campaign transitions, retries, final victory and Escape/title navigation")
    let directory=URL(fileURLWithPath:FileManager.default.currentDirectoryPath).appendingPathComponent("music")
    if let url=defaultMusicURL(in:directory) {
        g.loadMusic(url)
        precondition(g.lastMusicError==nil && (g.music?.duration ?? 0)>0,"Default Commando audio decodes")
        precondition(g.music?.numberOfLoops == -1 && g.music?.isPlaying==false,"Music loops during play and stays paused on title")
        print("PASS: default soundtrack loaded — \(url.lastPathComponent), \(Int(g.music!.duration)) seconds")
    }
}
