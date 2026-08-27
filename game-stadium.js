  (function(){
  var holder=document.getElementById('game-canvas-holder');
  var stage=document.getElementById('game-stage');
  function init(){
  var W=stage.clientWidth,H=stage.clientHeight;
  var scene=new THREE.Scene();
  scene.background=new THREE.Color(0x8fb6de);
  scene.fog=new THREE.Fog(0x8fb6de,40,180);
  var camera=new THREE.PerspectiveCamera(62,W/H,0.1,500);
  var renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(W,H);
  holder.appendChild(renderer.domElement);

  var hemi=new THREE.HemisphereLight(0xffffff,0x4a6a3a,0.9);
  scene.add(hemi);
  var sun=new THREE.DirectionalLight(0xfff2d0,0.9);
  sun.position.set(40,60,20);
  scene.add(sun);

  var grass=new THREE.Mesh(new THREE.PlaneGeometry(240,240),new THREE.MeshStandardMaterial({color:0x4a9e5c}));
  grass.rotation.x=-Math.PI/2;
  scene.add(grass);
  var track=new THREE.Mesh(new THREE.PlaneGeometry(90,140),new THREE.MeshStandardMaterial({color:0x3d8a4c}));
  track.rotation.x=-Math.PI/2;track.position.y=0.01;
  scene.add(track);
  var line=new THREE.Mesh(new THREE.RingGeometry(11.7,12,48),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));
  line.rotation.x=-Math.PI/2;line.position.y=0.02;
  scene.add(line);

  function standSide(x,z,w,d,ry){
  var g=new THREE.Group();
  var base=new THREE.Mesh(new THREE.BoxGeometry(w,7,d),new THREE.MeshStandardMaterial({color:0xcfc7b3}));
  base.position.y=3.5;g.add(base);
  var roof=new THREE.Mesh(new THREE.BoxGeometry(w+2,0.6,d+2),new THREE.MeshStandardMaterial({color:0xb8ae94}));
  roof.position.y=7.3;g.add(roof);
  g.position.set(x,0,z);g.rotation.y=ry;
  scene.add(g);
  return g;
  }
  standSide(0,-58,120,10,0);
  standSide(0,58,120,10,0);
  standSide(-62,0,10,110,0);
  standSide(62,0,10,110,0);

  /* ---------- crowd: instanced, tiered, bobbing, cheers on goals ---------- */
  var crowdColors=[0xc9502e,0x3a6ea5,0xe0c14a,0x8a4a8a,0x5a8f5a,0xd08a3a,0x4a4ac9,0xe08fae,0x5ac8c8];
  var crowdSkinTones=[0xd9a066,0xc9986a,0xb06a4d,0xa06a4a,0x8a5a3a,0x6b4a34,0xf0c8a0];
  var crowdData=[];
  var crowdDummy=new THREE.Object3D();
  var crowdColorObj=new THREE.Color();
  (function buildCrowd(){
  var sides=[
  {x0:0,z0:-58,along:'x',len:112},
  {x0:0,z0:58,along:'x',len:112},
  {x0:-62,z0:0,along:'z',len:100},
  {x0:62,z0:0,along:'z',len:100}
  ];
  var ROWS=3,PER_ROW=42;
  for(var s=0;s<sides.length;s++){
  var side=sides[s];
  for(var row=0;row<ROWS;row++){
  var rowT=row/(ROWS-1);
  var rowY=4.0+rowT*3.1;
  var rowScale=1-rowT*0.14;
  var rowOffset=(row-1)*1.15;
  for(var p=0;p<PER_ROW;p++){
  var alongT=(p+0.5)/PER_ROW-0.5;
  var jitter=(Math.random()-0.5);
  var lx,lz;
  if(side.along==='x'){lx=side.x0+alongT*side.len+jitter*0.6;lz=side.z0+rowOffset+jitter*0.35;}
  else{lx=side.x0+rowOffset+jitter*0.35;lz=side.z0+alongT*side.len+jitter*0.6;}
  crowdData.push({
  x:lx,y:rowY,z:lz,scale:rowScale,
  ry:Math.random()*Math.PI*2,
  phase:Math.random()*Math.PI*2,
  shirt:crowdColors[(s*7+row*3+p)%crowdColors.length],
  skin:crowdSkinTones[(s*5+p)%crowdSkinTones.length]
  });
  }
  }
  }
  })();
  var CROWD_COUNT=crowdData.length;
  var crowdBodyGeo=new THREE.BoxGeometry(0.34,0.5,0.28);
  var crowdHeadGeo=new THREE.SphereGeometry(0.17,7,7);
  var crowdBodies=new THREE.InstancedMesh(crowdBodyGeo,new THREE.MeshStandardMaterial({color:0xffffff}),CROWD_COUNT);
  var crowdHeads=new THREE.InstancedMesh(crowdHeadGeo,new THREE.MeshStandardMaterial({color:0xffffff}),CROWD_COUNT);
  for(var ci=0;ci<CROWD_COUNT;ci++){
  var cd=crowdData[ci];
  crowdDummy.position.set(cd.x,cd.y,cd.z);
  crowdDummy.rotation.set(0,cd.ry,0);
  crowdDummy.scale.set(cd.scale,cd.scale,cd.scale);
  crowdDummy.updateMatrix();
  crowdBodies.setMatrixAt(ci,crowdDummy.matrix);
  crowdBodies.setColorAt(ci,crowdColorObj.setHex(cd.shirt));
  crowdDummy.position.set(cd.x,cd.y+0.42*cd.scale,cd.z);
  crowdDummy.updateMatrix();
  crowdHeads.setMatrixAt(ci,crowdDummy.matrix);
  crowdHeads.setColorAt(ci,crowdColorObj.setHex(cd.skin));
  }
  crowdBodies.instanceMatrix.needsUpdate=true;
  crowdHeads.instanceMatrix.needsUpdate=true;
  if(crowdBodies.instanceColor)crowdBodies.instanceColor.needsUpdate=true;
  if(crowdHeads.instanceColor)crowdHeads.instanceColor.needsUpdate=true;
  scene.add(crowdBodies);
  scene.add(crowdHeads);
  var cheerPulse=0;

  function pole(x,z){
  var g=new THREE.Group();
  var p=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,22,8),new THREE.MeshStandardMaterial({color:0x888888}));
  p.position.y=11;g.add(p);
  var head=new THREE.Mesh(new THREE.BoxGeometry(6,3,1.2),new THREE.MeshStandardMaterial({color:0xfff3b0,emissive:0xfff3b0,emissiveIntensity:0.4}));
  head.position.y=21;g.add(head);
  g.position.set(x,0,z);
  scene.add(g);
  }
  pole(-58,-50);pole(58,-50);pole(-58,50);pole(58,50);

  /* ---------- Ground-level extras: referee, ball boys, corner flags, sideline ad boards ---------- */
  function cornerFlag(x,z){
  var g=new THREE.Group();
  var flagPole=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,1.5,6),new THREE.MeshStandardMaterial({color:0xffffff}));
  flagPole.position.y=0.75;g.add(flagPole);
  var flag=new THREE.Mesh(new THREE.PlaneGeometry(0.32,0.22),new THREE.MeshBasicMaterial({color:0xff5533,side:THREE.DoubleSide}));
  flag.position.set(0.17,1.35,0);g.add(flag);
  g.position.set(x,0,z);
  scene.add(g);
  }
  cornerFlag(-54,-50);cornerFlag(54,-50);cornerFlag(-54,50);cornerFlag(54,50);

  function makeGroundPerson(shirt,pants,skin,scale){
  scale=scale||1;
  var g=new THREE.Group();
  var legs=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.46,0.26),new THREE.MeshStandardMaterial({color:pants}));
  legs.position.y=0.23;g.add(legs);
  var body=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.56,0.3),new THREE.MeshStandardMaterial({color:shirt}));
  body.position.y=0.74;g.add(body);
  var head=new THREE.Mesh(new THREE.SphereGeometry(0.18,10,10),new THREE.MeshStandardMaterial({color:skin}));
  head.position.y=1.14;g.add(head);
  g.scale.set(scale,scale,scale);
  g.userData.phase=Math.random()*Math.PI*2;
  return g;
  }
  var groundPeople=[];
  var referee=makeGroundPerson(0x1a1a1a,0x1a1a1a,0xc9986a,1.05);
  referee.position.set(3,0,2.5);referee.rotation.y=0.6;
  scene.add(referee);groundPeople.push(referee);

  var ballBoySkins=[0xd9a066,0xc9986a,0xb06a4d,0x8a5a3a];
  var ballBoySpots=[[-53,-36],[53,-24],[-53,6],[53,36]];
  for(var bb=0;bb<ballBoySpots.length;bb++){
  var boy=makeGroundPerson(0xdd5522,0x222222,ballBoySkins[bb%ballBoySkins.length],0.85);
  boy.position.set(ballBoySpots[bb][0],0,ballBoySpots[bb][1]);
  boy.rotation.y=ballBoySpots[bb][0]<0?Math.PI/2:-Math.PI/2;
  scene.add(boy);groundPeople.push(boy);
  }

  /* ---------- Fighting-game style characters (original designs, inspired by classic arcade fighters — not likenesses of any copyrighted character) ---------- */
  function makeFighter(cfg){
  var g=new THREE.Group();
  var enemy=!!cfg.enemy;
  var armorColor=cfg.armor||0x2a2a2a;

  var torsoW=enemy?0.8:0.62,torsoH=enemy?1.08:0.95,torsoD=enemy?0.5:0.36;
  var armX=enemy?0.48:0.42,shoulderX=enemy?0.44:0.36,gloveX=enemy?0.56:0.5,legX=enemy?0.19:0.16;

  var torso=new THREE.Mesh(new THREE.BoxGeometry(torsoW,torsoH,torsoD),new THREE.MeshStandardMaterial({color:cfg.shirt}));
  torso.position.y=1.15;g.add(torso);

  var chestLine=new THREE.Mesh(new THREE.BoxGeometry(torsoW+0.02,0.05,torsoD+0.02),new THREE.MeshStandardMaterial({color:cfg.accent||0x000000}));
  chestLine.position.y=1.0;g.add(chestLine);

  var belt=new THREE.Mesh(new THREE.BoxGeometry(torsoW+0.06,0.14,torsoD+0.06),new THREE.MeshStandardMaterial({color:cfg.belt||0x1a1a1a}));
  belt.position.y=0.84;g.add(belt);

  var shL=new THREE.Mesh(new THREE.SphereGeometry(0.17,10,10),new THREE.MeshStandardMaterial({color:cfg.shirt}));
  shL.position.set(-shoulderX,1.55,0);g.add(shL);
  var shR=shL.clone();shR.position.x=shoulderX;g.add(shR);

  if(enemy){
  function shoulderSpike(sideSign){
  var spike=new THREE.Mesh(new THREE.ConeGeometry(0.1,0.34,6),new THREE.MeshStandardMaterial({color:armorColor}));
  spike.position.set(sideSign*shoulderX,1.74,-0.03);
  spike.rotation.z=sideSign*0.55;spike.rotation.x=-0.15;
  g.add(spike);
  }
  shoulderSpike(-1);shoulderSpike(1);
  for(var bsi=-1;bsi<=1;bsi++){
  var bspike=new THREE.Mesh(new THREE.ConeGeometry(0.04,0.12,5),new THREE.MeshStandardMaterial({color:armorColor}));
  bspike.position.set(bsi*(torsoW*0.35),0.84,torsoD/2+0.05);
  bspike.rotation.x=1.2;
  g.add(bspike);
  }
  }

  function arm(sideSign){
  var grp=new THREE.Group();
  var upper=new THREE.Mesh(new THREE.CylinderGeometry(enemy?0.13:0.11,enemy?0.12:0.1,0.42,8),new THREE.MeshStandardMaterial({color:cfg.skin}));
  upper.position.set(sideSign*armX,1.42,0);upper.rotation.z=sideSign*0.12;grp.add(upper);
  var fore=new THREE.Mesh(new THREE.CylinderGeometry(enemy?0.11:0.095,enemy?0.1:0.09,0.4,8),new THREE.MeshStandardMaterial({color:cfg.skin}));
  fore.position.set(sideSign*gloveX*0.96,1.02,0.1);fore.rotation.x=-0.35;grp.add(fore);
  if(enemy){
  var gauntlet=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.16,0.22),new THREE.MeshStandardMaterial({color:armorColor}));
  gauntlet.position.set(sideSign*gloveX,0.82,0.18);grp.add(gauntlet);
  for(var ck=0;ck<3;ck++){
  var clawMesh=new THREE.Mesh(new THREE.ConeGeometry(0.032,0.2,5),new THREE.MeshStandardMaterial({color:0x1a1a1a}));
  clawMesh.position.set(sideSign*gloveX+(ck-1)*0.065,0.74,0.32);
  clawMesh.rotation.x=1.15;
  grp.add(clawMesh);
  }
  }else{
  var glove=new THREE.Mesh(new THREE.SphereGeometry(0.14,10,10),new THREE.MeshStandardMaterial({color:cfg.gloves||0xcc2222}));
  glove.position.set(sideSign*gloveX,0.8,0.2);grp.add(glove);
  }
  grp.userData.side=sideSign;
  return grp;
  }
  var armL=arm(-1);g.add(armL);
  var armR=arm(1);g.add(armR);

  function leg(sideSign){
  var grp=new THREE.Group();
  var thigh=new THREE.Mesh(new THREE.CylinderGeometry(legX,legX-0.02,0.42,8),new THREE.MeshStandardMaterial({color:cfg.pants}));
  thigh.position.set(sideSign*legX,0.58,0);grp.add(thigh);
  var shin=new THREE.Mesh(new THREE.CylinderGeometry(legX-0.04,legX-0.06,0.4,8),new THREE.MeshStandardMaterial({color:cfg.pants}));
  shin.position.set(sideSign*legX,0.2,0);grp.add(shin);
  var shoe=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.12,0.28),new THREE.MeshStandardMaterial({color:cfg.shoe||0x111111}));
  shoe.position.set(sideSign*legX,0.02,0.06);grp.add(shoe);
  return grp;
  }
  var legL=leg(-1);g.add(legL);
  var legR=leg(1);g.add(legR);

  var head=new THREE.Mesh(new THREE.SphereGeometry(0.28,14,14),new THREE.MeshStandardMaterial({color:cfg.skin}));
  head.position.y=2.0;g.add(head);

  if(cfg.hairStyle==='spiky'){
  for(var i=0;i<5;i++){
  var spike=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.22,6),new THREE.MeshStandardMaterial({color:cfg.hair}));
  var ang=(i/5)*Math.PI*2;
  spike.position.set(Math.cos(ang)*0.14,2.22,Math.sin(ang)*0.14);
  spike.rotation.x=Math.sin(ang)*0.3;spike.rotation.z=Math.cos(ang)*0.3;
  g.add(spike);
  }
  }else if(cfg.hairStyle==='mohawk'){
  var mo=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.26,0.4),new THREE.MeshStandardMaterial({color:cfg.hair}));
  mo.position.y=2.24;g.add(mo);
  }else if(cfg.hairStyle==='ponytail'){
  var cap=new THREE.Mesh(new THREE.SphereGeometry(0.29,12,12,0,Math.PI*2,0,Math.PI*0.5),new THREE.MeshStandardMaterial({color:cfg.hair}));
  cap.position.y=2.08;g.add(cap);
  var tail=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.03,0.5,8),new THREE.MeshStandardMaterial({color:cfg.hair}));
  tail.position.set(0,1.9,-0.28);tail.rotation.x=0.5;g.add(tail);
  }else if(cfg.hairStyle==='cap'){
  var cap2=new THREE.Mesh(new THREE.SphereGeometry(0.3,12,12,0,Math.PI*2,0,Math.PI*0.55),new THREE.MeshStandardMaterial({color:cfg.hair}));
  cap2.position.y=2.08;g.add(cap2);
  }

  if(cfg.headband){
  var band=new THREE.Mesh(new THREE.TorusGeometry(0.29,0.04,6,16),new THREE.MeshStandardMaterial({color:cfg.headband}));
  band.rotation.x=Math.PI/2;band.position.y=2.02;g.add(band);
  }

  if(enemy&&cfg.horns){
  for(var hs=-1;hs<=1;hs+=2){
  var horn=new THREE.Mesh(new THREE.ConeGeometry(0.055,0.36,6),new THREE.MeshStandardMaterial({color:cfg.hornColor||0x2a2620}));
  horn.position.set(hs*0.17,2.22,-0.06);
  horn.rotation.z=hs*0.4;horn.rotation.x=-0.3;
  g.add(horn);
  }
  }
  if(enemy&&cfg.mask){
  var maskPlate=new THREE.Mesh(new THREE.BoxGeometry(0.36,0.24,0.14),new THREE.MeshStandardMaterial({color:armorColor}));
  maskPlate.position.set(0,1.94,0.22);g.add(maskPlate);
  var eyeMat=new THREE.MeshBasicMaterial({color:cfg.eyeGlow||0xff3300});
  var eyeGeo=new THREE.BoxGeometry(0.08,0.03,0.03);
  var eyeL=new THREE.Mesh(eyeGeo,eyeMat);eyeL.position.set(-0.09,2.02,0.29);g.add(eyeL);
  var eyeR=eyeL.clone();eyeR.position.x=0.09;g.add(eyeR);
  }

  g.userData.phase=Math.random()*Math.PI*2;
  g.userData.armL=armL;g.userData.armR=armR;g.userData.legL=legL;g.userData.legR=legR;
  return g;
  }

  var fighterConfigs=[
  {shirt:0xdedede,pants:0xdedede,skin:0xd9a066,gloves:0xcc2222,belt:0x111111,hair:0x1a1108,hairStyle:'spiky',headband:0xcc2222,x:-30,z:-6,enemy:true,armor:0x2a2a2a,horns:true,hornColor:0x1a1610},
  {shirt:0x1e2a44,pants:0x1e2a44,skin:0xc9986a,gloves:0xffffff,belt:0xffffff,hair:0x0c0c0c,hairStyle:'ponytail',x:-18,z:-4,enemy:true,armor:0x1a1a2a,mask:true,eyeGlow:0x33ccff},
  {shirt:0x111111,pants:0x111111,skin:0xb06a4d,gloves:0x8a1c1c,belt:0x8a1c1c,hair:0x000000,hairStyle:'cap',x:10,z:-8,enemy:true,armor:0x3a1414,horns:true,hornColor:0x1a0a0a},
  {shirt:0x7a1f1f,pants:0x2b2b2b,skin:0xa06a4a,gloves:0xd4af37,belt:0xd4af37,hair:0x2a1a10,hairStyle:'mohawk',x:26,z:-5,enemy:true,armor:0x3a2a10,mask:true,eyeGlow:0xffaa00},
  {shirt:0x2f6d3a,pants:0x1c3d22,skin:0xd9b088,gloves:0xffffff,belt:0xffffff,hair:0x3a2a1a,hairStyle:'ponytail',x:-8,z:20,enemy:true,armor:0x14251a,horns:true,hornColor:0x0a1a10},
  {shirt:0xc9a227,pants:0x3a2a10,skin:0x8a5a3a,gloves:0x111111,belt:0x111111,hair:0x0c0c0c,hairStyle:'cap',x:18,z:24,enemy:true,armor:0x2a1a08,mask:true,eyeGlow:0xff3300},
  {shirt:0x3a3a8a,pants:0x1a1a3a,skin:0xc9986a,gloves:0xffe066,belt:0xffe066,hair:0x1a1a1a,hairStyle:'spiky',x:4,z:-30,enemy:true,armor:0x14142a,horns:true,hornColor:0x0a0a1a},
  {shirt:0x8a2a8a,pants:0x2b2b2b,skin:0xd9a066,gloves:0x2b2b2b,belt:0x2b2b2b,hair:0xffffff,hairStyle:'mohawk',headband:0x8a2a8a,x:-20,z:15,enemy:true,armor:0x2b2b2b,mask:true,eyeGlow:0x9933ff}
  ];
  var fighters=[];
  for(var i=0;i<fighterConfigs.length;i++){
  var c=fighterConfigs[i];
  var ch=makeFighter(c);
  ch.position.set(c.x,0,c.z);
  ch.rotation.y=Math.random()*Math.PI*2;
  ch.userData.homeX=c.x;ch.userData.homeZ=c.z;ch.userData.kickCooldown=0;
  scene.add(ch);fighters.push(ch);
  }

  var bench=new THREE.Group();
  var seat=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.25,0.7),new THREE.MeshStandardMaterial({color:0xd8d0b0}));
  seat.position.y=0.55;bench.add(seat);
  var back=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.9,0.2),new THREE.MeshStandardMaterial({color:0xd8d0b0}));
  back.position.set(0,1.0,-0.28);bench.add(back);
  bench.position.set(-2,0,6);
  scene.add(bench);

  var heroConfig={shirt:0xf4f1ea,pants:0x2f4a6d,skin:0xc9986a,gloves:0xcc2222,belt:0xcc2222,hair:0x1a1108,hairStyle:'spiky',headband:0xcc2222,accent:0x2f4a6d};
  var hero=makeFighter(heroConfig);
  hero.scale.set(1,0.72,1);
  hero.position.set(-2,0.42,6.3);
  hero.rotation.y=Math.PI;
  scene.add(hero);

  /* ---------- "Hire Waqas Ali" billboards — one per fighter, always facing the viewer ---------- */
  function wrapText(ctx,text,x,y,maxWidth,lineHeight){
  var words=text.split(' ');var line='';var lines=[];
  for(var n=0;n<words.length;n++){
  var testLine=line+words[n]+' ';
  if(ctx.measureText(testLine).width>maxWidth&&n>0){lines.push(line);line=words[n]+' ';}
  else line=testLine;
  }
  lines.push(line);
  var startY=y-((lines.length-1)*lineHeight)/2;
  for(var i=0;i<lines.length;i++){ctx.fillText(lines[i].trim(),x,startY+i*lineHeight);}
  return lines.length;
  }
  function fitFontSize(ctx,text,maxWidth,startSize,minSize){
  var size=startSize;
  ctx.font='bold '+size+'px Arial';
  while(ctx.measureText(text).width>maxWidth&&size>minSize){
  size-=2;
  ctx.font='bold '+size+'px Arial';
  }
  return size;
  }
  function createSignTexture(headline,sub,accent){
  var w=512,h=300;
  var cnv=document.createElement('canvas');cnv.width=w;cnv.height=h;
  var ctx=cnv.getContext('2d');
  var grad=ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'#141926');grad.addColorStop(1,'#232b3d');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=accent;ctx.lineWidth=10;ctx.strokeRect(9,9,w-18,h-18);
  ctx.fillStyle='#ffffff';
  ctx.textAlign='center';ctx.textBaseline='middle';
  var maxTextWidth=w-64;
  var hSize=fitFontSize(ctx,headline,maxTextWidth,46,24);
  ctx.font='bold '+hSize+'px Arial';
  ctx.fillText(headline,w/2,h*0.32);
  ctx.fillStyle=accent;
  ctx.font='bold 27px Arial';
  wrapText(ctx,sub,w/2,h*0.68,maxTextWidth,33);
  var tex=new THREE.CanvasTexture(cnv);
  return tex;
  }
  function createSign(x,z,headline,sub,accent,scale){
  scale=scale||1;
  var g=new THREE.Group();
  var poleH=2.3+0.55*scale;
  var pole=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,poleH,6),new THREE.MeshStandardMaterial({color:0x555555}));
  pole.position.y=poleH/2;g.add(pole);
  var boardW=1.9*scale,boardH=1.1*scale;
  var board=new THREE.Mesh(new THREE.PlaneGeometry(boardW,boardH),new THREE.MeshBasicMaterial({map:createSignTexture(headline,sub,accent)}));
  board.position.y=poleH+0.12+boardH/2;
  g.add(board);
  g.userData.board=board;
  g.position.set(x,0,z);
  scene.add(g);
  return g;
  }
  function hexStr(n){return '#'+('000000'+n.toString(16)).slice(-6);}
  function readableAccent(n){
  var r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  var lum=(0.299*r+0.587*g+0.114*b)/255;
  if(lum<0.5){
  var mix=0.6;
  r=Math.round(r+(255-r)*mix);
  g=Math.round(g+(255-g)*mix);
  b=Math.round(b+(255-b)*mix);
  }
  return (r<<16)|(g<<8)|b;
  }

  var hireMessages=[
  'Debugs faster than he breaks boards.',
  'You won’t see his bugs coming — he fixes them in silence.',
  'Pins down deadlines, not opponents.',
  'Codes clean. The mohawk is optional.',
  'Delivers knockout code every single sprint.',
  'Solid as gold. Ships like a champion.',
  'Sparks ideas, never drops the ball.',
  'Old-school discipline, next-gen code.'
  ];
  var signs=[];
  for(var i=0;i<fighterConfigs.length;i++){
  var fc=fighterConfigs[i];
  var accent=hexStr(readableAccent(fc.headband!==undefined?fc.headband:fc.gloves));
  signs.push(createSign(fc.x,fc.z,'HIRE WAQAS ALI',hireMessages[i%hireMessages.length],accent,0.85));
  }
  signs.push(createSign(-2,8.1,'NOW HIRING: WAQAS ALI','Kicks bugs. Passes deadlines. Rarely loses the ball.',hexStr(readableAccent(0xcc2222)),1.35));

  /* ---------- sideline advertising boards, for a fuller pitch-side crowd ---------- */
  var adTextures=[
  createSignTexture('HIRE WAQAS ALI','Backend engineer. Ships fast.','#ffcc33'),
  createSignTexture('OPEN TO WORK','Senior / Platform / Lead roles','#5ac8fa'),
  createSignTexture('WAQAS ALI','APIs. Infra. Production scale.','#4cd787')
  ];
  function adBoard(x,z,ry,tex){
  var board=new THREE.Mesh(new THREE.PlaneGeometry(3.1,0.85),new THREE.MeshBasicMaterial({map:tex}));
  board.position.set(x,0.9,z);board.rotation.y=ry;
  scene.add(board);
  }
  var adZs=[-42,-30,-18,18,30,42];
  for(var az=0;az<adZs.length;az++){
  adBoard(-54.5,adZs[az],Math.PI/2,adTextures[az%adTextures.length]);
  adBoard(54.5,adZs[az],-Math.PI/2,adTextures[(az+1)%adTextures.length]);
  }

  /* ---------- Football: gravity, bouncing, rolling, kicking, goals ---------- */
  function createFootballTexture(){
  var size=256;
  var cnv=document.createElement('canvas');cnv.width=size;cnv.height=size;
  var ctx=cnv.getContext('2d');
  ctx.fillStyle='#f5f5f0';ctx.fillRect(0,0,size,size);
  ctx.fillStyle='#1a1a1a';
  function pentagon(cx,cy,r,rot){
  ctx.beginPath();
  for(var i=0;i<5;i++){
  var a=rot+i*(Math.PI*2/5)-Math.PI/2;
  var x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
  if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();ctx.fill();
  }
  pentagon(size*0.5,size*0.2,size*0.11,0);
  pentagon(size*0.18,size*0.48,size*0.11,0.6);
  pentagon(size*0.82,size*0.48,size*0.11,-0.6);
  pentagon(size*0.3,size*0.82,size*0.11,1.1);
  pentagon(size*0.7,size*0.82,size*0.11,-1.1);
  pentagon(size*0.5,size*0.5,size*0.13,0.3);
  var tex=new THREE.CanvasTexture(cnv);
  tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
  return tex;
  }

  var ballRadius=0.32;
  var ballMesh=new THREE.Mesh(new THREE.SphereGeometry(ballRadius,20,20),new THREE.MeshStandardMaterial({map:createFootballTexture(),roughness:0.55}));
  ballMesh.position.set(0,ballRadius,0);
  scene.add(ballMesh);

  var ballShadow=new THREE.Mesh(new THREE.CircleGeometry(ballRadius*1.15,16),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.35}));
  ballShadow.rotation.x=-Math.PI/2;
  ballShadow.position.set(0,0.02,0);
  scene.add(ballShadow);

  var ball={mesh:ballMesh,shadow:ballShadow,velocity:new THREE.Vector3(0,0,0),radius:ballRadius};
  var GRAVITY=-16,REST=0.5,GROUND_FRICTION=0.9,AIR_DRAG=0.999,MIN_BOUNCE_VEL=1.1;
  var lastBallZ=ball.mesh.position.z;
  var goalTimer=0,score=0;
  var goalCountEl=document.getElementById('game-goalCount');
  var goalMsgEl=document.getElementById('game-goalMsg');

  function goalFrame(z){
  var g=new THREE.Group();
  var mat=new THREE.MeshStandardMaterial({color:0xffffff});
  var postGeo=new THREE.CylinderGeometry(0.08,0.08,2.6,8);
  var pL=new THREE.Mesh(postGeo,mat);pL.position.set(-4,1.3,0);g.add(pL);
  var pR=pL.clone();pR.position.x=4;g.add(pR);
  var bar=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,8,8),mat);
  bar.rotation.z=Math.PI/2;bar.position.set(0,2.6,0);g.add(bar);
  var net=new THREE.Mesh(new THREE.PlaneGeometry(8,2.6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.15,side:THREE.DoubleSide}));
  net.position.set(0,1.3,z<0?-0.6:0.6);g.add(net);
  g.position.set(0,0,z);
  scene.add(g);
  }
  var GOAL_Z=51,GOAL_HALF_W=4,GOAL_H=2.6;
  goalFrame(-GOAL_Z);goalFrame(GOAL_Z);

  /* ---------- confetti burst on goals ---------- */
  var CONFETTI_COUNT=70;
  var confettiGeo=new THREE.PlaneGeometry(0.22,0.22);
  var confettiMat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  var confetti=new THREE.InstancedMesh(confettiGeo,confettiMat,CONFETTI_COUNT);
  var confettiDummy=new THREE.Object3D();
  var confettiColorObj=new THREE.Color();
  var confettiPalette=[0xf5a623,0xffffff,0x6fa8dc,0x4cd787,0xff6b6b,0xffe066];
  var confettiState=[];
  for(var cfi=0;cfi<CONFETTI_COUNT;cfi++){
  confettiDummy.position.set(0,-50,0);
  confettiDummy.scale.set(0.001,0.001,0.001);
  confettiDummy.updateMatrix();
  confetti.setMatrixAt(cfi,confettiDummy.matrix);
  confettiState.push({active:false,x:0,y:-50,z:0,vx:0,vy:0,vz:0,life:0,rot:0,spin:0});
  }
  confetti.instanceMatrix.needsUpdate=true;
  scene.add(confetti);
  function spawnConfetti(atX,atZ){
  for(var i=0;i<CONFETTI_COUNT;i++){
  var cs=confettiState[i];
  cs.active=true;
  cs.x=atX+(Math.random()-0.5)*4;
  cs.y=4.5+Math.random()*2.5;
  cs.z=atZ+(Math.random()-0.5)*4;
  cs.vx=(Math.random()-0.5)*6.5;
  cs.vy=4.5+Math.random()*4;
  cs.vz=(Math.random()-0.5)*6.5;
  cs.life=1.1+Math.random()*0.5;
  cs.rot=Math.random()*Math.PI;
  cs.spin=(Math.random()-0.5)*11;
  confetti.setColorAt(i,confettiColorObj.setHex(confettiPalette[i%confettiPalette.length]));
  }
  if(confetti.instanceColor)confetti.instanceColor.needsUpdate=true;
  }

  function resetBall(){
  ball.mesh.position.set(0,ball.radius,0);
  ball.velocity.set(0,0,0);
  ball.mesh.rotation.set(0,0,0);
  lastBallZ=ball.mesh.position.z;
  }
  var camShake=0;
  function scoreGoal(){
  score++;
  goalCountEl.textContent=score;
  goalMsgEl.style.opacity='1';
  goalMsgEl.style.transform='translate(-50%,-50%) scale(1)';
  goalTimer=1.4;
  cheerPulse=1;
  camShake=0.35;
  spawnConfetti(ball.mesh.position.x,ball.mesh.position.z);
  playGoalSound();
  }
  function hideGoalMsg(){
  goalMsgEl.style.opacity='0';
  goalMsgEl.style.transform='translate(-50%,-50%) scale(0.8)';
  }

  var yaw=Math.PI,pitch=-0.05;
  var pos=new THREE.Vector3(-2,2.3,10);
  camera.rotation.order='YXZ';

  /* ---------- sound effects: synthesized, no audio files needed ---------- */
  var soundEnabled=true;
  var audioCtx=null;
  function getAudioCtx(){
  var AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)return null;
  if(!audioCtx)audioCtx=new AC();
  if(audioCtx.state==='suspended')audioCtx.resume();
  return audioCtx;
  }
  function playKickSound(){
  if(!soundEnabled)return;
  var ctx=getAudioCtx();if(!ctx)return;
  var t=ctx.currentTime;
  var osc=ctx.createOscillator();
  var gain=ctx.createGain();
  osc.type='triangle';
  osc.frequency.setValueAtTime(190,t);
  osc.frequency.exponentialRampToValueAtTime(55,t+0.12);
  gain.gain.setValueAtTime(0.32,t);
  gain.gain.exponentialRampToValueAtTime(0.001,t+0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);osc.stop(t+0.16);
  }
  function playCrowdRoar(){
  if(!soundEnabled)return;
  var ctx=getAudioCtx();if(!ctx)return;
  var t=ctx.currentTime;
  var bufferSize=Math.floor(ctx.sampleRate*1.2);
  var buffer=ctx.createBuffer(1,bufferSize,ctx.sampleRate);
  var data=buffer.getChannelData(0);
  for(var i=0;i<bufferSize;i++){data[i]=(Math.random()*2-1)*Math.pow(1-i/bufferSize,0.6);}
  var noise=ctx.createBufferSource();
  noise.buffer=buffer;
  var filter=ctx.createBiquadFilter();
  filter.type='bandpass';filter.frequency.value=1100;filter.Q.value=0.55;
  var gain=ctx.createGain();
  gain.gain.setValueAtTime(0.0001,t);
  gain.gain.exponentialRampToValueAtTime(0.45,t+0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001,t+1.15);
  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(t);
  }
  function playGoalSound(){
  if(!soundEnabled)return;
  var ctx=getAudioCtx();if(!ctx)return;
  var t=ctx.currentTime;
  var notes=[523.25,659.25,783.99,1046.5];
  for(var ni=0;ni<notes.length;ni++){
  var osc=ctx.createOscillator();
  var gain=ctx.createGain();
  osc.type='square';
  osc.frequency.value=notes[ni];
  var startT=t+ni*0.09;
  gain.gain.setValueAtTime(0.0001,startT);
  gain.gain.exponentialRampToValueAtTime(0.2,startT+0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001,startT+0.28);
  osc.connect(gain).connect(ctx.destination);
  osc.start(startT);osc.stop(startT+0.3);
  }
  playCrowdRoar();
  }
  var muteBtn=document.getElementById('game-mute-btn');
  function setMuteUI(){
  if(!muteBtn)return;
  muteBtn.textContent=soundEnabled?'🔊':'🔇';
  muteBtn.setAttribute('aria-label',soundEnabled?'Mute sound effects':'Unmute sound effects');
  }
  if(muteBtn){
  setMuteUI();
  muteBtn.addEventListener('click',function(){
  soundEnabled=!soundEnabled;
  setMuteUI();
  if(soundEnabled)getAudioCtx();
  });
  }

  var kickCooldown=0;
  function tryKick(){
  if(kickCooldown>0||goalTimer>0)return;
  var dx=ball.mesh.position.x-pos.x,dz=ball.mesh.position.z-pos.z;
  var dist=Math.sqrt(dx*dx+dz*dz);
  if(dist>2.4)return;
  var fx=-Math.sin(yaw),fz=-Math.cos(yaw);
  var power=13+Math.random()*2.5;
  ball.velocity.set(fx*power,7+Math.random()*2,fz*power);
  kickCooldown=0.45;
  playKickSound();
  }

  var dragging=false,lastX=0,lastY=0;
  function onDown(x,y){dragging=true;lastX=x;lastY=y;stage.style.cursor='grabbing';}
  function onMove(x,y){
  if(!dragging)return;
  var dx=x-lastX,dy=y-lastY;
  lastX=x;lastY=y;
  yaw-=dx*0.005;
  pitch=Math.max(-0.9,Math.min(0.9,pitch-dy*0.005));
  }
  function onUp(){dragging=false;stage.style.cursor='grab';}
  stage.addEventListener('mousedown',function(e){if(e.target.closest('#game-pad')||e.target.closest('#game-lock-btn'))return;onDown(e.clientX,e.clientY);});
  window.addEventListener('mouseup',onUp);
  stage.addEventListener('touchstart',function(e){if(e.target.closest('#game-pad')||e.target.closest('#game-lock-btn'))return;onDown(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
  stage.addEventListener('touchmove',function(e){if(dragging)onMove(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
  stage.addEventListener('touchend',onUp);

  /* ---------- pointer lock: mouse-look without drag ---------- */
  var lockBtn=document.getElementById('game-lock-btn');
  var plSupported=!!(stage.requestPointerLock||stage.mozRequestPointerLock||stage.webkitRequestPointerLock);
  var pointerLocked=false;
  function setLockUI(on){
  pointerLocked=on;
  if(!lockBtn)return;
  lockBtn.textContent=on?'🔒 Press Esc to unlock':'🖱️ Lock camera';
  lockBtn.classList.toggle('is-locked',on);
  }
  function requestLock(){
  var fn=stage.requestPointerLock||stage.mozRequestPointerLock||stage.webkitRequestPointerLock;
  if(fn)fn.call(stage);
  }
  function exitLock(){
  var fn=document.exitPointerLock||document.mozExitPointerLock||document.webkitExitPointerLock;
  if(fn&&(document.pointerLockElement||document.mozPointerLockElement||document.webkitPointerLockElement))fn.call(document);
  }
  window.__stadiumGameExitLock=exitLock;
  if(plSupported&&lockBtn){
  lockBtn.addEventListener('click',function(){
  if(pointerLocked)exitLock();else requestLock();
  });
  document.addEventListener('pointerlockchange',function(){
  var locked=(document.pointerLockElement===stage);
  if(pointerLocked&&!locked){
  window.__stadiumPointerRecentlyUnlocked=true;
  setTimeout(function(){window.__stadiumPointerRecentlyUnlocked=false;},400);
  }
  setLockUI(locked);
  dragging=false;
  });
  document.addEventListener('pointerlockerror',function(){
  setLockUI(false);
  });
  }else if(lockBtn){
  lockBtn.style.display='none';
  }

  window.addEventListener('mousemove',function(e){
  if(pointerLocked){
  yaw-=(e.movementX||0)*0.0025;
  pitch=Math.max(-0.9,Math.min(0.9,pitch-(e.movementY||0)*0.0025));
  return;
  }
  onMove(e.clientX,e.clientY);
  });

  var move={f:false,b:false,l:false,r:false,sprint:false};
  window.addEventListener('keydown',function(e){
  if(window.__stadiumGamePaused)return;
  var k=e.key.toLowerCase();
  if(k==='w'||k==='arrowup')move.f=true;
  if(k==='s'||k==='arrowdown')move.b=true;
  if(k==='a'||k==='arrowleft')move.l=true;
  if(k==='d'||k==='arrowright')move.r=true;
  if(k==='shift')move.sprint=true;
  if(k===' '||e.code==='Space'){e.preventDefault();tryKick();}
  });
  window.addEventListener('keyup',function(e){
  if(window.__stadiumGamePaused)return;
  var k=e.key.toLowerCase();
  if(k==='w'||k==='arrowup')move.f=false;
  if(k==='s'||k==='arrowdown')move.b=false;
  if(k==='a'||k==='arrowleft')move.l=false;
  if(k==='d'||k==='arrowright')move.r=false;
  if(k==='shift')move.sprint=false;
  });
  window.addEventListener('blur',function(){move.f=move.b=move.l=move.r=move.sprint=false;});
  document.querySelectorAll('.game-padbtn[data-k]').forEach(function(btn){
  var k=btn.getAttribute('data-k');
  var keyMap={f:'f',b:'b',l:'l',r:'r'};
  function s(v){move[keyMap[k]]=v;}
  btn.addEventListener('mousedown',function(){s(true);});
  btn.addEventListener('mouseup',function(){s(false);});
  btn.addEventListener('mouseleave',function(){s(false);});
  btn.addEventListener('touchstart',function(e){e.preventDefault();s(true);},{passive:false});
  btn.addEventListener('touchend',function(e){e.preventDefault();s(false);},{passive:false});
  });
  var shootBtn=document.getElementById('game-shootBtn');
  shootBtn.addEventListener('mousedown',function(){tryKick();});
  shootBtn.addEventListener('touchstart',function(e){e.preventDefault();tryKick();},{passive:false});

  var clock=new THREE.Clock();
  function animate(){
  requestAnimationFrame(animate);
  var dt=Math.min(clock.getDelta(),0.033);
  if(window.__stadiumGamePaused)return;
  var speed=(move.sprint?9*1.85:9)*dt;
  var fx=-Math.sin(yaw),fz=-Math.cos(yaw);
  var rx=Math.cos(yaw),rz=-Math.sin(yaw);
  if(move.f){pos.x+=fx*speed;pos.z+=fz*speed;}
  if(move.b){pos.x-=fx*speed;pos.z-=fz*speed;}
  if(move.l){pos.x-=rx*speed;pos.z-=rz*speed;}
  if(move.r){pos.x+=rx*speed;pos.z+=rz*speed;}
  pos.x=Math.max(-58,Math.min(58,pos.x));
  pos.z=Math.max(-58,Math.min(58,pos.z));
  camShake=Math.max(0,camShake-dt*1.6);
  var shk=camShake>0?camShake*0.5:0;
  camera.position.set(
  pos.x+(shk?(Math.random()-0.5)*shk:0),
  pos.y+(shk?(Math.random()-0.5)*shk:0),
  pos.z+(shk?(Math.random()-0.5)*shk:0)
  );
  camera.rotation.set(pitch,yaw,0);

  var t=clock.elapsedTime;
  var nearestFighterIdx=-1,nearestFighterDist=Infinity;
  for(var ni=0;ni<fighters.length;ni++){
  var np=fighters[ni].position;
  var ndx=ball.mesh.position.x-np.x,ndz=ball.mesh.position.z-np.z;
  var nd=Math.sqrt(ndx*ndx+ndz*ndz);
  if(nd<nearestFighterDist){nearestFighterDist=nd;nearestFighterIdx=ni;}
  }
  var FIGHTER_STOP_DIST=1.4,FIGHTER_CHASE_SPEED=3.2,FIGHTER_HOME_SPEED=2.0;
  var FIGHTER_KICK_RANGE=FIGHTER_STOP_DIST+0.2,FIGHTER_KICK_POWER_MIN=5,FIGHTER_KICK_POWER_MAX=8,FIGHTER_KICK_COOLDOWN_MIN=1.1,FIGHTER_KICK_COOLDOWN_MAX=1.7;
  for(var i=0;i<fighters.length;i++){
  var fgt=fighters[i];
  var isNearest=(i===nearestFighterIdx);
  var tx,tz,fspeed,arrive;
  if(isNearest){tx=ball.mesh.position.x;tz=ball.mesh.position.z;fspeed=FIGHTER_CHASE_SPEED;arrive=FIGHTER_STOP_DIST;}
  else{tx=fgt.userData.homeX;tz=fgt.userData.homeZ;fspeed=FIGHTER_HOME_SPEED;arrive=0.05;}
  var fdx=tx-fgt.position.x,fdz=tz-fgt.position.z;
  var fdist=Math.sqrt(fdx*fdx+fdz*fdz);
  var walking=false;
  if(fdist>arrive){
  walking=true;
  var step=Math.min(fspeed*dt,fdist-arrive*0.5);
  fgt.position.x+=(fdx/fdist)*step;
  fgt.position.z+=(fdz/fdist)*step;
  fgt.rotation.y=Math.atan2(fdx,fdz);
  }else if(isNearest&&fdist>0.02){
  fgt.rotation.y=Math.atan2(fdx,fdz);
  }
  fgt.position.y=Math.sin(t*1.5+fgt.userData.phase)*0.03;
  if(walking){
  var walkSwing=Math.sin(t*9)*0.5;
  fgt.userData.legL.rotation.x=walkSwing;
  fgt.userData.legR.rotation.x=-walkSwing;
  fgt.userData.armL.rotation.x=-walkSwing*0.6;
  fgt.userData.armR.rotation.x=walkSwing*0.6;
  }else{
  fgt.userData.legL.rotation.x=0;
  fgt.userData.legR.rotation.x=0;
  var idleSwing=Math.sin(t*2+fgt.userData.phase)*0.12;
  fgt.userData.armL.rotation.x=idleSwing;
  fgt.userData.armR.rotation.x=-idleSwing;
  }
  fgt.userData.kickCooldown=Math.max(0,fgt.userData.kickCooldown-dt);
  if(isNearest&&goalTimer<=0&&fgt.userData.kickCooldown<=0&&ball.mesh.position.y<1.0){
  var bdx=ball.mesh.position.x-fgt.position.x,bdz=ball.mesh.position.z-fgt.position.z;
  var bdist=Math.sqrt(bdx*bdx+bdz*bdz);
  if(bdist<FIGHTER_KICK_RANGE){
  var kpower=FIGHTER_KICK_POWER_MIN+Math.random()*(FIGHTER_KICK_POWER_MAX-FIGHTER_KICK_POWER_MIN);
  ball.velocity.set((bdx/bdist)*kpower,2.6+Math.random()*1.4,(bdz/bdist)*kpower);
  fgt.userData.kickCooldown=FIGHTER_KICK_COOLDOWN_MIN+Math.random()*(FIGHTER_KICK_COOLDOWN_MAX-FIGHTER_KICK_COOLDOWN_MIN);
  playKickSound();
  }
  }
  }

  for(var gp=0;gp<groundPeople.length;gp++){
  var person=groundPeople[gp];
  person.position.y=Math.sin(t*1.4+person.userData.phase)*0.02;
  }

  cheerPulse=Math.max(0,cheerPulse-dt*1.1);
  var crowdAmp=0.1+cheerPulse*0.85;
  var crowdFreq=1.6+cheerPulse*6.5;
  for(var cj=0;cj<CROWD_COUNT;cj++){
  var ccd=crowdData[cj];
  var bob=Math.sin(t*crowdFreq+ccd.phase)*crowdAmp;
  crowdDummy.position.set(ccd.x,ccd.y+bob,ccd.z);
  crowdDummy.rotation.set(0,ccd.ry,0);
  crowdDummy.scale.set(ccd.scale,ccd.scale,ccd.scale);
  crowdDummy.updateMatrix();
  crowdBodies.setMatrixAt(cj,crowdDummy.matrix);
  crowdDummy.position.set(ccd.x,ccd.y+0.42*ccd.scale+bob,ccd.z);
  crowdDummy.updateMatrix();
  crowdHeads.setMatrixAt(cj,crowdDummy.matrix);
  }
  crowdBodies.instanceMatrix.needsUpdate=true;
  crowdHeads.instanceMatrix.needsUpdate=true;

  for(var si=0;si<signs.length;si++){
  var sgn=signs[si];
  var sdx=camera.position.x-sgn.position.x,sdz=camera.position.z-sgn.position.z;
  sgn.userData.board.rotation.y=Math.atan2(sdx,sdz);
  }

  kickCooldown=Math.max(0,kickCooldown-dt);

  ball.velocity.y+=GRAVITY*dt;
  ball.velocity.x*=AIR_DRAG;ball.velocity.z*=AIR_DRAG;
  ball.mesh.position.x+=ball.velocity.x*dt;
  ball.mesh.position.y+=ball.velocity.y*dt;
  ball.mesh.position.z+=ball.velocity.z*dt;

  if(ball.mesh.position.y<=ball.radius){
  ball.mesh.position.y=ball.radius;
  if(ball.velocity.y<0){
  if(Math.abs(ball.velocity.y)>MIN_BOUNCE_VEL){ball.velocity.y=-ball.velocity.y*REST;}
  else{ball.velocity.y=0;}
  }
  ball.velocity.x*=GROUND_FRICTION;ball.velocity.z*=GROUND_FRICTION;
  }

  var nearGoalMouth=Math.abs(ball.mesh.position.x)<GOAL_HALF_W+0.5&&(ball.mesh.position.z<-GOAL_Z+3||ball.mesh.position.z>GOAL_Z-3);
  if(!nearGoalMouth){
  if(ball.mesh.position.x>56){ball.mesh.position.x=56;ball.velocity.x*=-0.4;}
  if(ball.mesh.position.x<-56){ball.mesh.position.x=-56;ball.velocity.x*=-0.4;}
  }
  if(ball.mesh.position.z>52){ball.mesh.position.z=52;ball.velocity.z*=-0.4;}
  if(ball.mesh.position.z<-52){ball.mesh.position.z=-52;ball.velocity.z*=-0.4;}

  var hSpeed=Math.sqrt(ball.velocity.x*ball.velocity.x+ball.velocity.z*ball.velocity.z);
  if(hSpeed>0.01){
  var axis=new THREE.Vector3(-ball.velocity.z,0,ball.velocity.x).normalize();
  ball.mesh.rotateOnWorldAxis(axis,hSpeed*dt/ball.radius);
  }

  ball.shadow.position.set(ball.mesh.position.x,0.02,ball.mesh.position.z);
  var shadowScale=Math.max(0.3,1-ball.mesh.position.y*0.15);
  ball.shadow.scale.set(shadowScale,shadowScale,shadowScale);
  ball.shadow.material.opacity=0.35*shadowScale;

  if(goalTimer<=0){
  if(lastBallZ>-GOAL_Z&&ball.mesh.position.z<=-GOAL_Z&&Math.abs(ball.mesh.position.x)<GOAL_HALF_W&&ball.mesh.position.y<GOAL_H){
  scoreGoal();
  }else if(lastBallZ<GOAL_Z&&ball.mesh.position.z>=GOAL_Z&&Math.abs(ball.mesh.position.x)<GOAL_HALF_W&&ball.mesh.position.y<GOAL_H){
  scoreGoal();
  }
  }
  lastBallZ=ball.mesh.position.z;
  if(goalTimer>0){
  goalTimer-=dt;
  if(goalTimer<=0){resetBall();hideGoalMsg();}
  }

  var confettiActive=false;
  for(var pi=0;pi<CONFETTI_COUNT;pi++){
  var cs=confettiState[pi];
  if(!cs.active){
  confettiDummy.position.set(0,-50,0);
  confettiDummy.scale.set(0.001,0.001,0.001);
  confettiDummy.updateMatrix();
  confetti.setMatrixAt(pi,confettiDummy.matrix);
  continue;
  }
  confettiActive=true;
  cs.vy+=GRAVITY*0.35*dt;
  cs.x+=cs.vx*dt;cs.y+=cs.vy*dt;cs.z+=cs.vz*dt;
  cs.rot+=cs.spin*dt;
  cs.life-=dt;
  if(cs.life<=0||cs.y<0.05){cs.active=false;continue;}
  confettiDummy.position.set(cs.x,cs.y,cs.z);
  confettiDummy.rotation.set(cs.rot*0.7,cs.rot,cs.rot*0.4);
  confettiDummy.scale.set(1,1,1);
  confettiDummy.updateMatrix();
  confetti.setMatrixAt(pi,confettiDummy.matrix);
  }
  if(confettiActive)confetti.instanceMatrix.needsUpdate=true;

  renderer.render(scene,camera);
  }
  animate();

  var ro=new ResizeObserver(function(){
  var w=stage.clientWidth,h=stage.clientHeight;
  camera.aspect=w/h;camera.updateProjectionMatrix();
  renderer.setSize(w,h);
  });
  ro.observe(stage);
  }
  window.__stadiumGameInit=init;
  })();
