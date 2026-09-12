import Foundation

func defaultMusicURL(in directory:URL)->URL? {
    let extensions=["mp3","m4a","wav","aiff","aac"]
    let files=(try? FileManager.default.contentsOfDirectory(at:directory,includingPropertiesForKeys:nil)) ?? []
    return files.filter { $0.lastPathComponent.lowercased().contains("commando") && extensions.contains($0.pathExtension.lowercased()) }
        .sorted {
            let a=extensions.firstIndex(of:$0.pathExtension.lowercased())!,b=extensions.firstIndex(of:$1.pathExtension.lowercased())!
            return a==b ? $0.lastPathComponent<$1.lastPathComponent:a<b
        }.first
}

extension Game {
    func pauseGame() {
        guard state=="playing" || state=="map" else {return}
        state="paused";music?.pause();keys=[];world.isPaused=true
        showOverlay("PAUSED",mission.name,["ESC / ENTER / P: RESUME", "", "T: TITLE SCREEN (RESTARTS THIS MISSION)","R: RETRY THIS MISSION", "M: CHOOSE MUSIC   X: MUTE", "CMD+Q: QUIT"])
    }
    func returnToTitle() {
        guard ["paused","cleared","dead","won"].contains(state) else {return}
        if state=="won" {levelIndex=0;entryScore=0}
        reset()
    }
    func handleEscape() {
        switch state {
        case "playing","map": pauseGame()
        case "paused": startPlaying()
        case "cleared","dead","won": returnToTitle()
        default: keys=[]
        }
    }
}
