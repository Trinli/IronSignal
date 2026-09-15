import base from './data.mjs';
const cell=(x,y)=>({x,y,kind:0}),loot=(x,y,kind,extra={})=>({x,y,kind,...extra});
const ledge=(x,y,w,h=20)=>[x,y,w,h];
const garden={
  name:'NEON GARDEN',subtitle:'Find the amber and blue access cards. Explore the arboretum and its sealed laboratory.',
  width:3200,height:1200,accent:'#91ee92',spawn:[120,102],exit:[3070,160],
  platforms:[ledge(0,0,3200,78),ledge(0,1176,3200,24),ledge(300,150,180),ledge(510,230,180),ledge(720,310,180),ledge(930,390,180),ledge(1140,470,240),
    ledge(620,210,334),ledge(930,78,24,132),ledge(1900,150,180),ledge(2110,230,180),ledge(2320,310,180),ledge(2530,390,210)],
  pickups:[cell(420,204),cell(1030,444),cell(1470,112),cell(2200,284),cell(2630,444),cell(3020,112),
    loot(1240,524,5,{key:'amber'}),loot(2650,444,5,{key:'blue'}),loot(200,112,4,{tier:2}),loot(1510,112,3),loot(2370,364,1),
    loot(770,112,4,{tier:3,secret:'nursery'}),loot(850,112,3,{secret:'nursery'}),loot(895,112,6,{secret:'nursery'})],
  enemies:[{x:1040,y:434,type:'heavy'},{x:1570,y:112,type:'turret'},{x:2220,y:274,type:'heavy'},{x:2580,y:434,type:'turret'},{x:2940,y:146,boss:true}],
  supplies:[[520,97],[1430,97],[2110,97]],warps:[],
  doors:[{id:'amber-lab',key:'amber',label:'RESEARCH LAB',box:[1700,78,32,1098]},{id:'blue-core',key:'blue',label:'CORE ACCESS',box:[2780,78,32,1098]}],
  panels:[{id:'nursery-wall',secret:'nursery',box:[620,78,24,132],hp:5}],
  secrets:[{id:'nursery',name:'THE LOST NURSERY',box:[644,78,286,132]}],
  springs:[{x:1810,y:78}],barrels:[{x:1530,y:96},{x:2460,y:96}],
  signs:[['ARBORETUM / AMBER CARD ABOVE',850,610],['RESEARCH LAB / BLUE CARD ABOVE',2280,545],['CRACKED PANELS CAN BE SHOT',480,120],['JUMP BOOST',1810,180]],
};
const station={
  name:'ORBITAL CITADEL',subtitle:'Infiltrate three sealed decks. Recover two cards and assault the command bridge.',
  width:3900,height:1450,accent:'#d8acff',spawn:[120,102],exit:[3770,160],
  platforms:[ledge(0,0,3900,78),ledge(0,1426,3900,24),ledge(260,150,180),ledge(460,230,180),ledge(660,310,180),ledge(460,390,180),ledge(660,470,180),ledge(860,550,210),
    ledge(1280,150,200),ledge(1500,230,200),ledge(1720,310,200),ledge(1940,390,200),ledge(1720,470,200),ledge(1500,550,200),ledge(1720,630,200),ledge(1940,710,260),
    ledge(1550,210,324),ledge(1854,78,20,132),ledge(2540,150,200),ledge(2760,230,200),ledge(2980,310,200),ledge(3200,390,300)],
  pickups:[cell(360,204),cell(960,604),cell(1820,364),cell(2100,764),cell(3080,364),cell(3700,112),
    loot(980,604,5,{key:'violet'}),loot(2140,764,5,{key:'blue'}),loot(180,112,4,{tier:3}),loot(420,112,3),loot(1170,112,1),loot(2300,112,3),loot(3420,444,3),
    loot(1660,112,3,{secret:'armory'}),loot(1740,112,2,{secret:'armory'}),loot(1810,112,6,{secret:'armory'})],
  enemies:[{x:750,y:354,type:'heavy'},{x:990,y:594,type:'turret'},{x:1350,y:194,type:'heavy'},{x:1800,y:514,type:'turret'},{x:2050,y:754,type:'heavy'},{x:2930,y:112,type:'heavy'},{x:3300,y:434,type:'turret'},{x:3530,y:156,boss:true}],
  supplies:[[340,97],[1300,97],[2800,97],[3310,97]],
  warps:[{name:'MAINTENANCE',a:[2090,751],b:[1440,99],requires:'blue'}],
  doors:[{id:'violet-deck',key:'violet',label:'SCIENCE DECK',box:[1100,78,32,1348]},{id:'blue-bridge',key:'blue',label:'COMMAND BRIDGE',box:[2360,78,32,1348]}],
  panels:[{id:'armory-wall',secret:'armory',box:[1550,78,24,132],hp:7}],secrets:[{id:'armory',name:'ABANDONED ARMORY',box:[1574,78,280,132]}],
  springs:[{x:2460,y:78}],barrels:[{x:2820,y:96},{x:3450,y:96}],
  signs:[['OBSERVATORY / VIOLET CARD ABOVE',630,720],['SCIENCE DECK / BLUE CARD ABOVE',1780,860],['COMMAND BRIDGE',3070,600]],
};

function scenery(l,garden){
  const r=(x,y,w,h,color,a=0)=>['r',x,y,w,h,color,a],t=(text,x,y,size=12,color=l.accent)=>['t',x,y,text,size,color,'center'];
  l.sky=[r(l.width/2,l.height/2,l.width+1600,l.height+1200,garden?'#102925':'#090d24')];
  for(let i=0;i<150;i++)l.sky.push(r(i*173%(l.width+1000),i*127%(l.height+200),2,2,garden?'#83b994':'#949ccd'));
  if(!garden)for(let i=-28;i<=28;i++){const y=i*5;l.sky.push(r(570,620+y,Math.sqrt(Math.max(0,145**2-y*y))*2,5,i%4?'#355a88':'#6b8aa5'));}
  l.backdrop=[];l.scenery=[];
  if(garden){
    // An open arboretum, a glass laboratory, then a compact core chamber.
    for(const [x,y] of [[180,400],[760,720],[1440,380]]){
      l.backdrop.push(r(x,y/2,28,y,'#2e5545'));
      for(let i=0;i<7;i++)l.backdrop.push(r(x+(i%2?1:-1)*(40+i*9),y-25*i,140-i*10,34,i%2?'#386d51':'#2a5b48',i%2?.15:-.15));
    }
    for(let x=120;x<1700;x+=160){l.scenery.push(r(x,850,3,560,'#3f6852'));for(let y=600;y<1080;y+=68)l.scenery.push(r(x+8,y,27,10,'#699467',.3));}
    for(let x=1850;x<2710;x+=180){l.scenery.push(r(x,300,136,320,'#35666a'),r(x,300,126,306,'#153c44'),r(x-43,300,4,276,'#73aaa2'));
      for(let y=180;y<430;y+=50)l.scenery.push(r(x,y,7,35,'#77b68e'),r(x+10,y+8,23,9,'#a4c176',.4));}
  }else{
    for(let x=150;x<3900;x+=400){l.scenery.push(r(x,900,280,520,'#4b526d'),r(x,900,264,504,'#0d1631'));
      for(let j=0;j<7;j++)l.scenery.push(r(x-110+j*35,930+(j*37%160),2,2,'#c4d9ee'));
      l.scenery.push(r(x,520,300,16,'#718097'),r(x,495,210,3,'#ab87d1'));
    }
    for(const x of [1270,1650,2130,2900,3350]){
      l.scenery.push(r(x,310,126,85,'#61728a'),r(x,310,110,69,'#17253d'));
      for(let j=0;j<6;j++)l.scenery.push(r(x-22+j*7,290+j*8,50-j*4,3,'#a39aca'));
    }
  }
  for(const [x,y,w,h] of l.platforms){l.scenery.push(r(x+w/2,y+h/2,w,h,garden?'#3d5a4c':'#414f68'),r(x+w/2,y+h-2,w,4,garden?'#b1c997':'#bbd1e5'));
    for(let dx=12;dx<w-4;dx+=32)l.scenery.push(r(x+dx,y+h-11,13,4,'#82929b'));}
  for(const [name,x,y] of l.signs)l.scenery.push(t(name,x,y));
  for(const w of l.warps)for(const [x,y] of [w.a,w.b])l.scenery.push(r(x,y+17,70,86,'#546982'),r(x,y+17,54,72,'#172b45'),t('[E] '+w.name,x,y+74,9));
  return l;
}
const furnace={
  name:'EMBER CROSSING',subtitle:'Leap back and forth above the furnace. Thermo Boots reveal a route beneath the flames.',
  width:3100,height:1100,accent:'#ffab58',spawn:[120,441],exit:[2890,522],
  platforms:[ledge(0,280,3100,20),ledge(0,400,260),ledge(340,470,160),ledge(560,550,170),ledge(350,630,160),ledge(580,710,180),
    ledge(810,650,180),ledge(1040,550,180),ledge(1270,460,230),ledge(1530,530,170),ledge(1750,610,180),ledge(1550,690,160),
    ledge(1770,770,180),ledge(2000,690,180),ledge(2240,600,180),ledge(2480,510,180),ledge(2720,420,300),
    ledge(1300,60,300,20),ledge(1280,60,20,220),ledge(1600,60,20,220)],
  pickups:[cell(430,684),cell(680,764),cell(1160,604),cell(1630,744),cell(1880,824),cell(2560,564),
    loot(1360,514,7),loot(650,604,3),loot(2110,744,1),loot(1390,114,6,{secret:'embers'}),loot(1530,114,3,{secret:'embers'})],
  enemies:[{x:650,y:594,type:'turret'},{x:1140,y:594,type:'turret'},{x:1840,y:814,type:'turret'},{x:2320,y:644,type:'turret'},{x:2860,y:477,boss:true}],
  supplies:[[870,689],[2590,549]],fire:[[0,300,3100,24]],
  secrets:[{id:'embers',name:'BENEATH THE EMBERS',box:[1300,80,300,190]}],
  warps:[{name:'FURNACE SHELTER',a:[1450,321],b:[1450,101],returnTo:[1360,501],requiresFire:true}],
  doors:[],panels:[],springs:[],barrels:[],
};
function furnaceArt(l){
  const r=(x,y,w,h,col)=>['r',x,y,w,h,col,0],t=(text,x,y,size=11)=>['t',x,y,text,size,l.accent,'center'];
  l.sky=[r(1550,550,6000,3200,'#201422')];l.backdrop=[];l.scenery=[];
  for(let x=80;x<3600;x+=230){l.backdrop.push(r(x,540,62,980,'#342437'),r(x+18,540,9,980,'#50323b'));
    for(let y=200;y<1000;y+=120)l.backdrop.push(r(x,y,85,12,'#68413c'));}
  for(let x=100;x<3100;x+=170){l.scenery.push(r(x,1010,5,220,'#78615b'),r(x,892,26,14,'#ffb257'));
    for(let j=0;j<4;j++)l.scenery.push(r(x-30+j*20,350+(x+j*43)%330,3,5,'#ca7245'));}
  for(const [x,y,w,h] of l.platforms){l.scenery.push(r(x+w/2,y+h/2,w,h,'#59464c'),r(x+w/2,y+h-3,w,6,'#b8a59a'));
    for(let dx=12;dx<w-6;dx+=26)l.scenery.push(r(x+dx,y+h-7,12,7,'#f1ad58'));}
  l.scenery.push(t('EMBER CROSSING / KEEP OFF THE FIRE',330,870),t('THERMO BOOTS / 12 SECONDS',1370,590),t('A SHELTER BELOW THE FLAMES',1450,405),t('[E] RETURN TO SAFETY',1450,168));
  return l;
}
// The first three layouts and artwork are kept intact; later missions are authored here.
export default {sprites:base.sprites,levels:[...base.levels.slice(0,3),scenery(garden,true),scenery(station,false),furnaceArt(furnace)]};
