"""Original chiptune: Pixelpromenad. Run with Python 3 and numpy."""
from pathlib import Path
import struct
import wave
import numpy as np

OUT = Path(__file__).resolve().parent
SR, BPM, PPQ = 44100, 136, 480
BEAT = 60 / BPM
events = [[], [], [], []]

def note(track, start, length, pitch, velocity=90):
    events[track].append((start, length, pitch, velocity))

# Newly composed melodies; each phrase occupies four beats.
phrases = [
 [(76,.5),(79,.5),(81,.75),(79,.25),(76,.5),(74,.5),(72,1)],
 [(74,.5),(76,.5),(79,1),(76,.5),(74,.5),(71,1)],
 [(72,.5),(76,.5),(77,.75),(81,.25),(79,.5),(77,.5),(76,1)],
 [(74,.75),(71,.25),(67,.5),(71,.5),(74,1),(79,1)],
 [(81,.5),(84,.5),(83,.5),(81,.5),(79,.75),(76,.25),(74,1)],
 [(76,.5),(79,.5),(83,.75),(81,.25),(79,.5),(76,.5),(71,1)],
 [(77,.5),(81,.5),(84,1),(83,.5),(81,.5),(77,1)],
 [(79,.5),(77,.5),(74,.5),(71,.5),(72,1.5),(0,.5)],
 [(84,1),(83,.5),(79,.5),(81,.75),(79,.25),(76,1)],
 [(83,.75),(86,.25),(83,.5),(79,.5),(74,1),(79,1)],
 [(81,.5),(77,.5),(76,.5),(72,.5),(77,.75),(79,.25),(81,1)],
 [(83,.5),(81,.5),(79,1),(74,.5),(76,.5),(79,1)],
 [(84,.5),(88,.5),(86,.75),(84,.25),(83,.5),(81,.5),(79,1)],
 [(83,.5),(79,.5),(76,.5),(74,.5),(71,1),(74,1)],
 [(77,.75),(81,.25),(84,.5),(81,.5),(79,.5),(77,.5),(76,1)],
 [(74,.5),(79,.5),(83,.5),(86,.5),(84,1.5),(0,.5)],
]
chords = [(45,[69,72,76]),(40,[67,71,76]),(41,[65,69,72]),(43,[67,71,74])]
# Four-bar introduction, two eight-bar themes, an eight-bar reprise and ending.
for bar in range(32):
    root, chord = chords[bar % 4]
    if bar >= 28:
        root, chord = [(41,[65,69,72]),(43,[67,71,74]),(45,[69,72,76]),(45,[69,72,76])][bar-28]
    for step in range(16):
        note(2,bar*4+step/4,.20,chord[[0,1,2,1,0,2,1,2][step%8]],52 if bar>=4 else 65)
    for step in range(8):
        note(1,bar*4+step/2,.36,root+(12 if step%4==3 else 0),95 if step%2==0 else 78)
    for beat in range(4):
        note(3,bar*4+beat,.12,36 if beat%2==0 else 38,100)
        note(3,bar*4+beat+.5,.08,42,55)
    if 4 <= bar < 28:
        idx=(bar-4)%16
        t=bar*4
        for pitch,duration in phrases[idx]:
            if pitch:
                note(0,t,duration*.9,pitch,98)
            t+=duration
    elif bar>=28:
        ending=[[(77,1),(81,1),(84,2)],[(83,1),(79,1),(74,2)],[(76,.5),(79,.5),(81,3)],[(81,3.7)]]
        t=bar*4
        for pitch,duration in ending[bar-28]:
            note(0,t,duration*.95,pitch,94)
            t+=duration

def vlq(value):
    data=[value&127]
    while value>>7:
        value>>=7
        data.insert(0,(value&127)|128)
    return bytes(data)

def chunk(data):
    return b'MTrk'+struct.pack('>I',len(data))+data

tempo=round(60000000/BPM)
meta=b'\x00\xff\x51\x03'+tempo.to_bytes(3,'big')+b'\x00\xff\x58\x04\x04\x02\x18\x08'+b'\x00\xff\x2f\x00'
tracks=[chunk(meta)]
for tr in range(4):
    channel=9 if tr==3 else tr
    name=[b'Pulse melody',b'Triangle bass',b'Fast arpeggios',b'Drums'][tr]
    data=b'\x00\xff\x03'+vlq(len(name))+name
    if tr!=3:
        data+=bytes([0,0xc0|channel,[80,38,81][tr]])
    midi=[]
    for start,length,pitch,velocity in events[tr]:
        midi.extend([(round(start*PPQ),1,pitch,velocity),(round((start+length)*PPQ),0,pitch,0)])
    previous=0
    for tick,on,pitch,velocity in sorted(midi):
        data+=vlq(tick-previous)+bytes([(0x90 if on else 0x80)|channel,pitch,velocity])
        previous=tick
    tracks.append(chunk(data+b'\x00\xff\x2f\x00'))
(OUT/'Pixelpromenad.mid').write_bytes(b'MThd'+struct.pack('>IHHH',6,1,len(tracks),PPQ)+b''.join(tracks))

audio=np.zeros((int((128*BEAT+1.5)*SR),2),dtype=np.float64)
rng=np.random.default_rng(824)
for tr,track in enumerate(events):
    for start,length,pitch,velocity in track:
        duration=length*BEAT
        release=.045 if tr!=3 else .015
        t=np.arange(int((duration+release)*SR))/SR
        freq=440*2**((pitch-69)/12)
        phase=freq*t
        if tr==0:
            phase+=.003*np.sin(2*np.pi*5.5*t)*np.minimum(t/.18,1)
            # Finite harmonic sums keep the oscillators below Nyquist.
            width=.30+.05*np.sin(2*np.pi*1.7*t)
            signal=np.zeros(len(t))
            for h in range(1,min(28,int(SR/2/freq))):
                signal+=2/np.pi*np.sin(np.pi*h*width)/h*np.cos(2*np.pi*h*phase-np.pi*h*width)
            gain,pan=.23,-.10
        elif tr==1:
            signal=2/np.pi*np.arcsin(np.sin(2*np.pi*phase))
            gain,pan=.28,0
        elif tr==2:
            signal=np.zeros(len(t))
            for h in range(1,min(16,int(SR/2/freq)),2):
                signal+=4/np.pi*np.sin(2*np.pi*h*phase)/h
            gain,pan=.085,.30 if int(start*4)%2 else -.30
        else:
            noise=rng.uniform(-1,1,len(t))
            if pitch==36:
                signal=np.sin(2*np.pi*(48*t+7*(1-np.exp(-35*t))))*np.exp(-23*t)
            elif pitch==38:
                signal=(noise*.75+np.sin(2*np.pi*180*t)*.25)*np.exp(-30*t)
            else:
                signal=np.concatenate(([0],np.diff(noise)))*np.exp(-65*t)*.4
            gain,pan=.24,0
        env=np.minimum(t/.004,1)*np.clip((duration+release-t)/release,0,1)
        if tr in (0,2):
            env*=.7+.3*np.exp(-t*16)
        signal*=env*gain*velocity/100
        idx=round(start*BEAT*SR)
        audio[idx:idx+len(t),0]+=signal*np.sqrt((1-pan)/2)
        audio[idx:idx+len(t),1]+=signal*np.sqrt((1+pan)/2)
        if tr==0:
            delay=int(.75*BEAT*SR)
            end=min(idx+delay+len(t),len(audio))
            audio[idx+delay:end,1]+=signal[:end-idx-delay]*.16
audio*=np.minimum(np.arange(len(audio))/400,1)[:,None]
fade=int(.8*SR)
audio[-fade:]*=np.linspace(1,0,fade)[:,None]
audio=np.tanh(audio*1.25)
audio*=.94/np.max(np.abs(audio))
pcm=(audio*32767).astype('<i2')
with wave.open(str(OUT/'Pixelpromenad.wav'),'wb') as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(pcm.tobytes())
print(f'Created WAV and MIDI: {len(audio)/SR:.1f}s, {BPM} BPM; peak {np.max(np.abs(audio)):.2f}')
