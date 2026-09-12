import Cocoa
import SpriteKit

// A static software-rendered art proof, without opening a game window.
// SpriteKit animation and GPU effects are intentionally not simulated here.
func exportPreview(_ game:Game,to path:String) throws {
    let bitmap=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:Int(W),pixelsHigh:Int(H),bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
    let graphics=NSGraphicsContext(bitmapImageRep:bitmap)!
    NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=graphics
    let ctx=graphics.cgContext;ctx.setShouldAntialias(false)
    ctx.setFillColor(ink.cgColor);ctx.fill(CGRect(x:0,y:0,width:W,height:H))
    func draw(_ node:SKNode,_ alpha:CGFloat=1) {
        if node.isHidden {return}
        ctx.saveGState();ctx.translateBy(x:node.position.x,y:node.position.y)
        ctx.rotate(by:node.zRotation);ctx.scaleBy(x:node.xScale,y:node.yScale)
        ctx.setAlpha(alpha*node.alpha)
        if let sprite=node as? SKSpriteNode {
            ctx.setFillColor(sprite.color.cgColor)
            ctx.fill(CGRect(x:-sprite.size.width*sprite.anchorPoint.x,y:-sprite.size.height*sprite.anchorPoint.y,width:sprite.size.width,height:sprite.size.height))
        } else if let text=node as? SKLabelNode,let value=text.text {
            let s=NSAttributedString(string:value,attributes:[.font:NSFont(name:text.fontName ?? "Menlo-Bold",size:text.fontSize)!, .foregroundColor:text.fontColor ?? .white])
            let width=s.size().width
            let x:CGFloat=text.horizontalAlignmentMode == .left ? 0:text.horizontalAlignmentMode == .right ? -width:-width/2
            s.draw(at:CGPoint(x:x,y:-text.fontSize*0.22))
        }
        for (_,child) in node.children.enumerated().sorted(by:{$0.element.zPosition == $1.element.zPosition ? $0.offset<$1.offset:$0.element.zPosition<$1.element.zPosition}) {draw(child,alpha*node.alpha)}
        ctx.restoreGState()
    }
    ctx.saveGState();ctx.translateBy(x:W/2-game.cameraNode.position.x,y:H/2-game.cameraNode.position.y)
    draw(game.sky);draw(game.backdrop);draw(game.world);ctx.restoreGState()
    draw(rect(W,48,color(0x101c2c),W/2,H-24));draw(rect(W,2,cyan,W/2,H-48))
    let title=label("IRON SIGNAL / \(game.levelIndex+1)-\(missions.count) \(game.mission.name)",16,color(game.mission.accent),26,H-33);title.horizontalAlignmentMode = .left;draw(title)
    draw(rect(W,48,color(0x101c2c),W/2,24));draw(label("A/D MOVE   SPACE JUMP   J FIRE   E TELEPORT   M MUSIC",12,cyan,W/2,20))
    NSGraphicsContext.restoreGraphicsState()
    try bitmap.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:path))
}
