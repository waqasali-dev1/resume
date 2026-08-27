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

  var crowdColors=[0xc9502e,0x3a6ea5,0xe0c14a,0x8a4a8a,0x5a8f5a,0xd08a3a,0x4a4ac9];
  var dotGeo=new THREE.SphereGeometry(0.42,6,6);
  function scatter(x0,z0,w,d,n){
  for(var i=0;i<n;i++){
  var c=crowdColors[i%crowdColors.length];
  var mat=new THREE.MeshStandardMaterial({color:c});
  var m=new THREE.Mesh(dotGeo,mat);
  m.position.set(x0+(Math.random()-0.5)*w, 4.2+Math.random()*2.2, z0+(Math.random()-0.5)*d);
  scene.add(m);
  }
  }
  scatter(0,-58,110,3,70);
  scatter(0,58,110,3,70);
  scatter(-62,0,3,100,60);
  scatter(62,0,3,100,60);

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

  /* ---------- Fighting-game style characters (original designs, inspired by classic arcade fighters — not likenesses of any copyrighted character) ---------- */
  function makeFighter(cfg){
  var g=new THREE.Group();

  var torso=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.95,0.36),new THREE.MeshStandardMaterial({color:cfg.shirt}));
  torso.position.y=1.15;g.add(torso);

  var chestLine=new THREE.Mesh(new THREE.BoxGeometry(0.64,0.05,0.38),new THREE.MeshStandardMaterial({color:cfg.accent||0x000000}));
  chestLine.position.y=1.0;g.add(chestLine);

  var belt=new THREE.Mesh(new THREE.BoxGeometry(0.68,0.14,0.42),new THREE.MeshStandardMaterial({color:cfg.belt||0x1a1a1a}));
  belt.position.y=0.84;g.add(belt);

  var shL=new THREE.Mesh(new THREE.SphereGeometry(0.17,10,10),new THREE.MeshStandardMaterial({color:cfg.shirt}));
  shL.position.set(-0.36,1.55,0);g.add(shL);
  var shR=shL.clone();shR.position.x=0.36;g.add(shR);

  function arm(sideSign){
  var grp=new THREE.Group();
  var upper=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.1,0.42,8),new THREE.MeshStandardMaterial({color:cfg.skin}));
  upper.position.set(sideSign*0.42,1.42,0);upper.rotation.z=sideSign*0.12;grp.add(upper);
  var fore=new THREE.Mesh(new THREE.CylinderGeometry(0.095,0.09,0.4,8),new THREE.MeshStandardMaterial({color:cfg.skin}));
  fore.position.set(sideSign*0.48,1.02,0.1);fore.rotation.x=-0.35;grp.add(fore);
  var glove=new THREE.Mesh(new THREE.SphereGeometry(0.14,10,10),new THREE.MeshStandardMaterial({color:cfg.gloves||0xcc2222}));
  glove.position.set(sideSign*0.5,0.8,0.2);grp.add(glove);
  grp.userData.side=sideSign;
  return grp;
  }
  var armL=arm(-1);g.add(armL);
  var armR=arm(1);g.add(armR);

  function leg(sideSign){
  var grp=new THREE.Group();
  var thigh=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.14,0.42,8),new THREE.MeshStandardMaterial({color:cfg.pants}));
  thigh.position.set(sideSign*0.16,0.58,0);grp.add(thigh);
  var shin=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.1,0.4,8),new THREE.MeshStandardMaterial({color:cfg.pants}));
  shin.position.set(sideSign*0.16,0.2,0);grp.add(shin);
  var shoe=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.12,0.28),new THREE.MeshStandardMaterial({color:cfg.shoe||0x111111}));
  shoe.position.set(sideSign*0.16,0.02,0.06);grp.add(shoe);
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

  g.userData.phase=Math.random()*Math.PI*2;
  g.userData.armL=armL;g.userData.armR=armR;g.userData.legL=legL;g.userData.legR=legR;
  return g;
  }

  var fighterConfigs=[
  {shirt:0xdedede,pants:0xdedede,skin:0xd9a066,gloves:0xcc2222,belt:0x111111,hair:0x1a1108,hairStyle:'spiky',headband:0xcc2222,x:-30,z:-6},
  {shirt:0x1e2a44,pants:0x1e2a44,skin:0xc9986a,gloves:0xffffff,belt:0xffffff,hair:0x0c0c0c,hairStyle:'ponytail',x:-18,z:-4},
  {shirt:0x111111,pants:0x111111,skin:0xb06a4d,gloves:0x8a1c1c,belt:0x8a1c1c,hair:0x000000,hairStyle:'cap',x:10,z:-8},
  {shirt:0x7a1f1f,pants:0x2b2b2b,skin:0xa06a4a,gloves:0xd4af37,belt:0xd4af37,hair:0x2a1a10,hairStyle:'mohawk',x:26,z:-5},
  {shirt:0x2f6d3a,pants:0x1c3d22,skin:0xd9b088,gloves:0xffffff,belt:0xffffff,hair:0x3a2a1a,hairStyle:'ponytail',x:-8,z:20},
  {shirt:0xc9a227,pants:0x3a2a10,skin:0x8a5a3a,gloves:0x111111,belt:0x111111,hair:0x0c0c0c,hairStyle:'cap',x:18,z:24},
  {shirt:0x3a3a8a,pants:0x1a1a3a,skin:0xc9986a,gloves:0xffe066,belt:0xffe066,hair:0x1a1a1a,hairStyle:'spiky',x:4,z:-30},
  {shirt:0x8a2a8a,pants:0x2b2b2b,skin:0xd9a066,gloves:0x2b2b2b,belt:0x2b2b2b,hair:0xffffff,hairStyle:'mohawk',headband:0x8a2a8a,x:-20,z:15}
  ];
  var fighters=[];
  for(var i=0;i<fighterConfigs.length;i++){
  var c=fighterConfigs[i];
  var ch=makeFighter(c);
  ch.position.set(c.x,0,c.z);
  ch.rotation.y=Math.random()*Math.PI*2;
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

  function resetBall(){
  ball.mesh.position.set(0,ball.radius,0);
  ball.velocity.set(0,0,0);
  ball.mesh.rotation.set(0,0,0);
  lastBallZ=ball.mesh.position.z;
  }
  function scoreGoal(){
  score++;
  goalCountEl.textContent=score;
  goalMsgEl.style.opacity='1';
  goalMsgEl.style.transform='translate(-50%,-50%) scale(1)';
  goalTimer=1.4;
  }
  function hideGoalMsg(){
  goalMsgEl.style.opacity='0';
  goalMsgEl.style.transform='translate(-50%,-50%) scale(0.8)';
  }

  var yaw=Math.PI,pitch=-0.05;
  var pos=new THREE.Vector3(-2,2.3,10);
  camera.rotation.order='YXZ';

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

  var move={f:false,b:false,l:false,r:false};
  window.addEventListener('keydown',function(e){
  if(window.__stadiumGamePaused)return;
  var k=e.key.toLowerCase();
  if(k==='w'||k==='arrowup')move.f=true;
  if(k==='s'||k==='arrowdown')move.b=true;
  if(k==='a'||k==='arrowleft')move.l=true;
  if(k==='d'||k==='arrowright')move.r=true;
  if(k===' '||e.code==='Space'){e.preventDefault();tryKick();}
  });
  window.addEventListener('keyup',function(e){
  if(window.__stadiumGamePaused)return;
  var k=e.key.toLowerCase();
  if(k==='w'||k==='arrowup')move.f=false;
  if(k==='s'||k==='arrowdown')move.b=false;
  if(k==='a'||k==='arrowleft')move.l=false;
  if(k==='d'||k==='arrowright')move.r=false;
  });
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
  var speed=9*dt;
  var fx=-Math.sin(yaw),fz=-Math.cos(yaw);
  var rx=Math.cos(yaw),rz=-Math.sin(yaw);
  if(move.f){pos.x+=fx*speed;pos.z+=fz*speed;}
  if(move.b){pos.x-=fx*speed;pos.z-=fz*speed;}
  if(move.l){pos.x-=rx*speed;pos.z-=rz*speed;}
  if(move.r){pos.x+=rx*speed;pos.z+=rz*speed;}
  pos.x=Math.max(-58,Math.min(58,pos.x));
  pos.z=Math.max(-58,Math.min(58,pos.z));
  camera.position.set(pos.x,pos.y,pos.z);
  camera.rotation.set(pitch,yaw,0);

  var t=clock.elapsedTime;
  for(var i=0;i<fighters.length;i++){
  fighters[i].position.y=Math.sin(t*1.5+fighters[i].userData.phase)*0.03;
  var swing=Math.sin(t*2+fighters[i].userData.phase)*0.12;
  fighters[i].userData.armL.rotation.x=swing;
  fighters[i].userData.armR.rotation.x=-swing;
  }

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
  if(ball.mesh.position.z>58){ball.mesh.position.z=58;ball.velocity.z*=-0.4;}
  if(ball.mesh.position.z<-58){ball.mesh.position.z=-58;ball.velocity.z*=-0.4;}

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
