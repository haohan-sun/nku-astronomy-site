/* Keplerian educational propagation. J2000 heliocentric ecliptic coordinates. */
(function(root) {
  'use strict';
  const DEG=Math.PI/180, TAU=Math.PI*2, DAY=86400000, AU=149597870.7;
  const wrap=x=>((x+Math.PI)%TAU+TAU)%TAU-Math.PI;
  function solveKepler(M,e) { M=wrap(M);let E=M;for(let k=0;k<20;k++){const step=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));E-=step;if(Math.abs(step)<1e-13)break;}return E; }
  function positionAtE(el,E) {
    const x=el.a*(Math.cos(E)-el.e),y=el.a*Math.sqrt(1-el.e*el.e)*Math.sin(E);
    const w=el.w*DEG,o=el.om*DEG,i=el.i*DEG,cw=Math.cos(w),sw=Math.sin(w),co=Math.cos(o),so=Math.sin(o),ci=Math.cos(i),si=Math.sin(i);
    return [(cw*co-sw*so*ci)*x+(-sw*co-cw*so*ci)*y,(cw*so+sw*co*ci)*x+(-sw*so+cw*co*ci)*y,sw*si*x+cw*si*y];
  }
  function position(el,jd,epoch) {return positionAtE(el,solveKepler((el.ma+el.n*(jd-epoch))*DEG,el.e));}
  function interpolate(rows,jd) {
    if(!rows?.length||jd<rows[0][0]||jd>rows[rows.length-1][0])return null;
    let lo=0,hi=rows.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(rows[mid][0]<=jd)lo=mid;else hi=mid;}
    const a=rows[lo],b=rows[hi],h=b[0]-a[0],t=(jd-a[0])/h,t2=t*t,t3=t2*t;
    return [0,1,2].map(k=>(2*t3-3*t2+1)*a[k+1]+(t3-2*t2+t)*h*a[k+4]+(-2*t3+3*t2)*b[k+1]+(t3-t2)*h*b[k+4]);
  }
  const utcToJD=ms=>ms/DAY+2440587.5+69.184/86400;
  // JPL approximate-positions Table 1, 1800–2050. Earth means Earth-Moon barycenter.
  const planets=[
    {name:'地月质心',color:'#9fc7ea',v:[1.00000261,.01671123,-.00001531,100.46457166,102.93768193,0],r:[.00000562,-.00004392,-.01294668,35999.37244981,.32327364,0]},
    {name:'火星',color:'#d99a86',v:[1.52371034,.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],r:[.00001847,.00007882,-.00813131,19140.30268499,.44441088,-.29257343]},
    {name:'木星',color:'#c4b39b',v:[5.202887,.04838624,1.30439695,34.39644051,14.72847983,100.47390909],r:[-.00011607,-.00013253,-.00183714,3034.74612775,.21252668,.20469106]}
  ];
  function planetElements(p,jd){const t=(jd-2451545)/36525,v=p.v.map((x,k)=>x+p.r[k]*t);return {a:v[0],e:v[1],i:v[2],ma:v[3]-v[4],w:v[4]-v[5],om:v[5],n:0};}
  const api={interpolate,solveKepler,positionAtE,position,utcToJD,planetElements,planets,AU,DAY};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof document==='undefined')return;
  root.SuyiOrbitMath=api;
  const data=root.SuyiOrbitData,canvas=document.getElementById('suyi-canvas');if(!data||!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const stage=document.getElementById('suyi-stage'),sim=document.getElementById('suyi-simulator');
  const ephemeris=root.SuyiEphemeris;
  const el=data.elements,byId=id=>document.getElementById(id),time=byId('suyi-time'),date=byId('suyi-date'),slider=byId('suyi-timeline'),play=byId('suyi-play'),speed=byId('suyi-speed');
  let width=600,height=430,yaw=-.30,tilt=.72,zoom=1.15,ms=Date.now(),live=true,running=true,visible=false,last=0,painted=0,raf=0,drag=null,infoTick=0;
  const minMS=Date.parse('2021-06-09T00:00:00Z'),maxMS=Date.parse('2031-06-08T00:00:00Z');
  const currentPosition=jd=>interpolate(ephemeris?.rows,jd)||position(el,jd,data.epoch);
  byId('suyi-model-source').textContent=ephemeris?.rows?.length?'轨道要素 JPL SBDB #39，每日状态矢量 JPL Horizons（2021-06-09 至 2031-06-08）。':'星历文件未加载：当前使用轨道要素近似推算，不含行星摄动。刷新页面可重试。';
  const fmt=(v,n=5)=>Number(v).toFixed(n);
  byId('suyi-parameters').innerHTML=[['半长轴 a',fmt(el.a)+' AU'],['偏心率 e',fmt(el.e,6)],['轨道倾角 i',fmt(el.i,4)+'°'],['公转周期 P',fmt(el.per,2)+' 天'],['近日点 q',fmt(el.q)+' AU'],['远日点 Q',fmt(el.ad)+' AU']].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  byId('suyi-extra').innerHTML=[['升交点黄经 Ω',fmt(el.om,4)+'°'],['近心点幅角 ω',fmt(el.w,4)+'°'],['历元平近点角 M₀',fmt(el.ma,4)+'°'],['绝对星等 H',fmt(data.absoluteMagnitude,2)],['轨道解 / 使用观测数','#'+data.solution+' / '+data.observations],['最近观测日期',data.lastObservation]].map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  const asteroidPath=Array.from({length:241},(_,k)=>positionAtE(el,k/240*TAU));
  function project(v){const c=Math.cos(yaw),s=Math.sin(yaw),x=v[0]*c-v[1]*s,y=v[0]*s+v[1]*c;const scale=Math.min(width,height)*.075*zoom;return [width/2+x*scale,height/2-(y*Math.cos(tilt)+v[2]*Math.sin(tilt))*scale];}
  function path(points,color,lineWidth=1,dashed=false){ctx.beginPath();points.forEach((v,k)=>{const p=project(v);k?ctx.lineTo(...p):ctx.moveTo(...p);});ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.setLineDash(dashed?[4,5]:[]);ctx.stroke();ctx.setLineDash([]);}
  function marker(v,color,r,label,offset=10){const p=project(v);const glow=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],r*5);glow.addColorStop(0,color+'75');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(...p,r*5,0,TAU);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.arc(...p,r,0,TAU);ctx.fill();if(!label)return;let text=label;const small=width<520;if(small&&(text==='地月质心'||text==='火星'||text==='木星'))return;if(small&&text==='21272 苏宜星')text='苏宜星';ctx.font=(small?'9.5px':'11px')+' system-ui,sans-serif';ctx.textBaseline='alphabetic';const measure=ctx.measureText(text).width;let x=p[0]+offset;let y=p[1]-9;if(x+measure>width-9)x=p[0]-measure-offset;x=Math.max(8,x);y=Math.max(18,Math.min(height-10,y));ctx.lineWidth=3;ctx.strokeStyle='rgba(7,4,14,.78)';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);}
  function updateInfo(p,jd,force=false){if(!force&&performance.now()-infoTick<250)return;infoTick=performance.now();const iso=new Date(ms).toISOString();time.textContent=iso.slice(0,10)+' '+iso.slice(11,19)+' UTC';date.value=iso.slice(0,10);slider.value=String(Math.round((ms-minMS)/DAY));byId('suyi-distance').textContent=fmt(Math.hypot(...p),5)+' AU';byId('suyi-position').textContent=p.map(x=>fmt(x,6)).join(' / ');const mode=!running?'时间已暂停':live?'当前时刻推算':document.body.classList.contains('no-motion')?'动效关闭 · 模拟暂停':'模拟时刻 / '+speed.selectedOptions[0].textContent;byId('suyi-mode').textContent=mode+(ephemeris?.rows?.length?' · Horizons 星历':' · 要素近似');play.textContent=running?'暂停时间 Ⅱ':'继续播放 ▷';play.setAttribute('aria-pressed',String(!running));canvas.dataset.jd=String(jd);canvas.dataset.x=String(p[0]);canvas.dataset.y=String(p[1]);canvas.dataset.z=String(p[2]);canvas.dataset.mode=live?'live':'simulation';canvas.dataset.source=ephemeris?.rows?.length?'horizons':'kepler';canvas.setAttribute('aria-label',`苏宜星轨道模拟，${iso.slice(0,10)}，日心距离 ${fmt(Math.hypot(...p),3)} 天文单位。可拖动旋转，也可用方向键调整视角。`);}
  function draw(force=false){const jd=utcToJD(ms),p=currentPosition(jd);ctx.clearRect(0,0,width,height);const bg=ctx.createRadialGradient(width/2,height/2,5,width/2,height/2,width*.7);bg.addColorStop(0,'#1b0f2e80');bg.addColorStop(1,'#07040e00');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    for(let r=1;r<=5;r++){const ring=Array.from({length:121},(_,k)=>[r*Math.cos(k/120*TAU),r*Math.sin(k/120*TAU),0]);path(ring,'#c896e60f',.65,true);}
    const end=Math.max(el.ad,5.7);path([[-end,0,0],[end,0,0]],'#c896e618',.7);path([[0,-end,0],[0,end,0]],'#c896e618',.7);
    for(const planet of planets){const pe=planetElements(planet,jd);path(Array.from({length:181},(_,k)=>positionAtE(pe,k/180*TAU)),planet.color+'46',.85,true);marker(position(pe,jd,jd),planet.color,planet.name==='木星'?4:2.7,planet.name);}
    path(asteroidPath,'#c473d6',1.6);const start=solveKepler((el.ma+el.n*(jd-data.epoch))*DEG,el.e);const trail=Array.from({length:50},(_,k)=>positionAtE(el,start-(49-k)/49*.6));path(trail,'#e6c6f2',2.5);
    marker([0,0,0],'#ffe6ad',5,'太阳');marker(positionAtE(el,0),'#9b86b8',1.7,'近日点',6);marker(positionAtE(el,Math.PI),'#9b86b8',1.7,'远日点',6);marker(p,'#f4eefa',5,'21272 苏宜星',12);
    const scale=Math.min(width,height)*.075*zoom;ctx.strokeStyle='#80719a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(18,height-23);ctx.lineTo(18+scale,height-23);ctx.stroke();ctx.font='9px monospace';ctx.fillStyle='#b3a4c9';ctx.fillText('1 AU',18,height-31);updateInfo(p,jd,force);
  }
  function resize(){const rect=stage.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(root.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw(true);}
  function frame(ts){canvas.dataset.frameTime=String(ts);raf=0;if(!visible||document.hidden)return;const dt=last?Math.min((ts-last)/1000,.2):0;last=ts;const motion=!document.body.classList.contains('no-motion');if(running){if(live)ms=Date.now();else if(motion)ms+=dt*Number(speed.value)*1000;if(ms>maxMS){ms=maxMS;running=false;draw(true);}if(ms<minMS){ms=minMS;running=false;draw(true);}}
    if(running&&(live||motion)&&ts-painted>(live?1000:60)){painted=ts;draw();}raf=requestAnimationFrame(frame);
  }
  new MutationObserver(()=>draw(true)).observe(document.body,{attributes:true,attributeFilter:['class']});
  function start(){if(visible&&!raf&&!document.hidden){last=0;raf=requestAnimationFrame(frame);}}
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;canvas.dataset.inViewport=String(visible);if(!visible&&raf){cancelAnimationFrame(raf);raf=0;}start();},{rootMargin:'80px'}).observe(sim);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else start();});
  function now(){ms=Date.now();live=true;running=true;speed.value='1';draw(true);}
  byId('suyi-now').addEventListener('click',now);
  play.addEventListener('click',()=>{if(running){running=false;}else{if(ms>=maxMS)ms=minMS;running=true;}draw(true);});
  speed.addEventListener('change',()=>{live=speed.value==='1';running=true;if(live)ms=Date.now();draw(true);});
  function changeTime(value){if(!Number.isFinite(value)||value<minMS||value>maxMS){byId('suyi-mode').textContent='请选择 2021-06-09 至 2031-06-08';return;}ms=value;live=false;running=false;draw(true);}
  date.addEventListener('change',()=>changeTime(Date.parse(date.value+'T00:00:00Z')));
  slider.addEventListener('input',()=>changeTime(minMS+Number(slider.value)*DAY));
  byId('suyi-demo').addEventListener('click',()=>{live=false;running=true;speed.value='604800';draw(true);});
  function resetView(top=false){yaw=-.30;tilt=top?0:.72;zoom=1.15;draw(true);}
  byId('suyi-top').addEventListener('click',()=>resetView(true));byId('suyi-oblique').addEventListener('click',()=>resetView(false));
  const setZoom=value=>{zoom=Math.min(3.6,Math.max(.7,value));draw(true);};byId('suyi-zoom-in').addEventListener('click',()=>setZoom(zoom*1.2));byId('suyi-zoom-out').addEventListener('click',()=>setZoom(zoom/1.2));
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,touch:e.pointerType==='touch'};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;yaw+=(e.clientX-drag.x)*.008;if(!drag.touch)tilt=Math.min(1.5,Math.max(-1.5,tilt+(e.clientY-drag.y)*.006));drag.x=e.clientX;drag.y=e.clientY;draw(true);});
  const endDrag=e=>{if(drag?.id===e.pointerId)drag=null;};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',()=>{drag=null;});
  canvas.addEventListener('keydown',e=>{const key=e.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','r','R'].includes(key))return;e.preventDefault();if(key==='ArrowLeft')yaw-=.12;if(key==='ArrowRight')yaw+=.12;if(key==='ArrowUp')tilt=Math.min(1.5,tilt+.1);if(key==='ArrowDown')tilt=Math.max(-1.5,tilt-.1);if(key==='+'||key==='=')setZoom(zoom*1.15);if(key==='-')setZoom(zoom/1.15);if(key.toLowerCase()==='r')resetView();draw(true);});
  resize();draw(true);
})(typeof window!=='undefined'?window:globalThis);
