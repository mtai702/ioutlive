(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ns = 'http://www.w3.org/2000/svg';
  const garden = $('garden'), titleTwigs = $('title-twigs'), reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#bc773c','#a95339','#c89c50','#8e4248','#ae6e3a','#b9a059'];
  // Broad, asymmetric leaf: stem at the bottom, pointed tip at the top.
  const leafPath = 'M60 142 C52 125 12 123 7 87 C3 58 29 17 63 3 C67 29 114 45 111 82 C109 113 78 127 60 142Z';
  let age = null, frame = 0, paused = reduce.matches, scene = null, seed = 1, selected = null, language = 'en';
  const t = (key,params={}) => Object.entries(params).reduce((text,[k,v])=>text.replace('{'+k+'}',v),window.IOUTLIVE_TEXT[language][key]);
  const nameOf = p => language==='zh' ? window.IOUTLIVE_ZH[p.id]?.name || p.name : p.name;
  const descriptionOf = p => language==='zh' ? window.IOUTLIVE_ZH[p.id]?.description || p.description : p.description;
  const kindOf = p => p.kind ? t(p.kindKey||'interval') : '';
  const ageRemark = () => window.IOUTLIVE_AGE_REMARKS.find(r=>r.below===null||age<BigInt(r.below))[language];
  const portraits = new Map();
  const years = p => { if(p.years !== undefined) return p.years; if(p.approximate) return {joan:19,shakespeare:52,beethoven:56}[p.id]; const b=p.born.split('-').map(Number),d=p.died.split('-').map(Number); return d[0]-b[0]-(d[1]<b[1] || (d[1]===b[1]&&d[2]<b[2])?1:0); };
  const records = [...window.IOUTLIVE_PEOPLE,...window.IOUTLIVE_ODDITIES].map(p=>({...p,years:years(p)}));
  const rnd = n => { const v=Math.sin(n*127.1+seed*19.7)*43758.5453; return v-Math.floor(v); };
  const clamp = n => Math.max(0,Math.min(1,n));
  const svg = (tag,attrs,parent) => {const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(parent)parent.append(e);return e;};
  const lifespan = p => (p.approximate?'≈ ':'')+p.years.toLocaleString(language==='zh'?'zh-CN':'en-US')+t('yearUnit');
  function paintLeaf(parent,color) {
    const g=svg('g',{},parent);
    svg('path',{d:leafPath,fill:color,class:'leaf-shape'},g);
    svg('path',{d:'M60 151 Q49 80 63 15 M57 115 Q33 98 22 79 M56 94 Q36 75 31 55 M59 72 L49 38 M58 112 Q84 99 99 77 M58 87 Q78 73 85 56',class:'vein'},g);
    return g;
  }
  function initials(p) {return p.name.split(' ').map(s=>s[0]).slice(0,2).join('');}
  async function portrait(p) {
    if(window.IOUTLIVE_PORTRAITS?.[p.id])return window.IOUTLIVE_PORTRAITS[p.id];
    if(portraits.has(p.id))return portraits.get(p.id);
    const promise=(async()=>{
      try {
        const article=p.article || decodeURIComponent(p.source.split('/wiki/')[1]);
        const response=await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(article),{signal:AbortSignal.timeout(8000)});
        if(!response.ok)throw Error('Portrait unavailable');
        const data=await response.json();
        const url=data.thumbnail?.source;
        if(!url || !['upload.wikimedia.org','thumb.wikimedia.org'].includes(new URL(url).hostname))return null;
        const name=decodeURIComponent(new URL(url).pathname.split('/').slice(-2,-1)[0]);
        return {url,credits:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(name)};
      } catch { return null; }
    })();
    portraits.set(p.id,promise);return promise;
  }
  function attachPortrait(container,p) {
    const fallback=document.createElement('span');fallback.className='portrait-fallback';fallback.textContent=initials(p);fallback.title=t('loading');container.append(fallback);
    portrait(p).then(photo=>{
      if(!photo){fallback.title=t('noPortrait');return;}
      const img=new Image();img.alt=t('portrait')+nameOf(p);img.decoding='async';img.referrerPolicy='no-referrer';
      img.onload=()=>{fallback.replaceWith(img);};img.onerror=()=>{fallback.title=t('noPortrait');};img.src=photo.url;
    });
  }
  async function showPerson(p) {
    selected=p; $('person-name').textContent=nameOf(p);
    $('person-eyebrow').textContent=t(p.kind?'intervalEyebrow':'detailEyebrow');
    $('person-dates').textContent=p.kind ? kindOf(p)+' · '+lifespan(p) : p.born.slice(0,4)+' — '+p.died.slice(0,4)+' · '+lifespan(p);
    $('person-description').textContent=descriptionOf(p);$('person-source').href=p.source;
    $('person-portrait').hidden=true;$('image-source').hidden=true;if(!$('person').open)$('person').showModal();
    const photo=await portrait(p);if(selected!==p||!photo)return;
    $('person-portrait').src=photo.url;$('person-portrait').alt=nameOf(p);$('person-portrait').hidden=false;
    $('image-source').href=photo.credits;$('image-source').hidden=false;
  }
  function nameButton(p){const b=document.createElement('button');b.type='button';b.addEventListener('click',()=>showPerson(p));return b;}
  function build() {
    cancelAnimationFrame(frame);scene=null;garden.replaceChildren();titleTwigs.replaceChildren();$('fallen').replaceChildren();$('names').replaceChildren();
    if(age===null){$('results').hidden=true;$('fallen').style.height='80px';$('status').textContent=t('empty');return;}
    const matches=records.filter(p=>BigInt(p.years)<age).sort((a,b)=>b.years-a.years || a.name.localeCompare(b.name));
    $('results').hidden=false;$('count').textContent=t('count',{n:matches.length});
    $('status').textContent=(matches.length?'':t('growing')+' ')+ageRemark();
    const ground=$('fallen'), width=ground.clientWidth, size=width<500?120:156;
    const columns=Math.max(1,Math.floor(width/(size*1.12))), rows=Math.ceil(matches.length/columns);
    ground.style.height=Math.max(180,rows*size*.95+size*.6+50)+'px';
    // Oldest first, reading left to right and then down; keep natural scatter within each cell.
    const cards=[];
    matches.forEach((p,i)=>{
      const b=nameButton(p);b.className='fallen-leaf';b.setAttribute('aria-label',nameOf(p)+', '+lifespan(p)+(p.kind?', '+kindOf(p):'')+'. '+t('readStory'));
      const col=i%columns,row=Math.floor(i/columns),rowCount=Math.min(columns,matches.length-row*columns),cell=Math.min(size*1.12,width/rowCount);
      const left=(width-rowCount*cell)/2+col*cell+(cell-size)/2+(rnd(i+80)-.5)*cell*.18;
      const top=15+row*size*.95+rnd(i+90)*27;
      const tilt=(rnd(i+100)-.5)*40;
      Object.assign(b.style,{left:left+'px',top:top+'px',width:size+'px',height:size*1.25+'px',transform:'none'});
      b.style.setProperty('--tilt',tilt+'deg');
      const art=svg('svg',{viewBox:'0 0 120 155','aria-hidden':'true'},b);paintLeaf(art,p.kind?'#77647f':colors[i%colors.length]);
      const face=document.createElement('div');face.className='leaf-portrait';attachPortrait(face,p);b.append(face);
      const label=document.createElement('span');label.className='leaf-name';label.textContent=nameOf(p);b.append(label);
      const caption=document.createElement('span');caption.className='leaf-age';caption.textContent=lifespan(p);b.append(caption);
      if(p.kind){const kind=document.createElement('span');kind.className='leaf-kind';kind.textContent=kindOf(p);b.append(kind);}
      ground.append(b);cards.push({b,p,tilt,row,left});
    });
    // Center the visible rotated bounds of every row, including the final partial row.
    // Jitter and tilt stay natural without pushing the whole collection to one side.
    for(let row=0;row<rows;row++){
      const group=cards.filter(c=>c.row===row);
      const bounds=group.map(c=>{
        const angle=c.tilt*Math.PI/180;
        const center=c.left+size/2+size*1.25*.2*Math.sin(angle);
        const half=(Math.abs(Math.cos(angle))*size+Math.abs(Math.sin(angle))*size*1.25)/2;
        return {left:center-half,right:center+half};
      });
      const shift=width/2-(Math.min(...bounds.map(b=>b.left))+Math.max(...bounds.map(b=>b.right)))/2;
      group.forEach(c=>c.b.style.left=(c.left+shift)+'px');
    }
    matches.forEach(p=>{const b=nameButton(p);b.append(document.createTextNode(nameOf(p)));const s=document.createElement('span');s.textContent=lifespan(p)+(p.kind?' · '+kindOf(p):'');b.append(s);$('names').append(b);});
    const main=document.querySelector('main').getBoundingClientRect(),title=document.querySelector('h1').getBoundingClientRect();
    // Keep the SVG viewport tied to the garden, not the expandable names list.
    // An auto-sized SVG with a fixed viewBox recenters when main grows taller.
    const groundRect=ground.getBoundingClientRect();
    const w=main.width,h=groundRect.bottom-main.top,cx=w/2,cy=title.bottom-main.top-20,top=title.top-main.top;
    for(const layer of [garden,titleTwigs]) {
      layer.style.height=h+'px';
      layer.setAttribute('viewBox','0 0 '+w+' '+h);
    }
    const branches=[],leaves=[],anchors=[];
    const abundance=age>10000n?1:1-Math.exp(-Number(age)/70);
    function branch(x,y,angle,length,thickness,depth,delay,key){
      const endX=x+Math.cos(angle)*length,endY=y+Math.sin(angle)*length;
      const bend=(rnd(key)-.5)*length*.6;
      const c1x=x+Math.cos(angle+.35)*length*.4,c1y=y+Math.sin(angle+.35)*length*.4;
      const c2x=endX-Math.cos(angle-.25)*length*.35+Math.sin(angle)*bend,c2y=endY-Math.sin(angle-.25)*length*.35-Math.cos(angle)*bend;
      const path=svg('path',{d:'M'+x+' '+y+' C'+c1x+' '+c1y+' '+c2x+' '+c2y+' '+endX+' '+endY,class:'branch','stroke-width':thickness},garden);
      const total=path.getTotalLength();path.style.strokeDasharray=total;path.style.strokeDashoffset=total;branches.push({path,total,delay});
      if(depth>0){
        const fork=path.getPointAtLength(total*.64);
        branch(fork.x,fork.y,angle-.65-rnd(key+2)*.35,length*.62,thickness*.57,depth-1,delay+.38,key*3+1);
        branch(endX,endY,angle+.48+rnd(key+3)*.3,length*.66,thickness*.6,depth-1,delay+.5,key*3+2);
      }
      if(depth<2){
        for(let i=0;i<2+Math.round(abundance*2);i++){
          const t=.35+i*.16,point=path.getPointAtLength(total*Math.min(.98,t));
          const a=angle*180/Math.PI+90+(i%2?65:-65),scale=.35+rnd(key+i+12)*.28;
          const outer=svg('g',{transform:'translate('+point.x+' '+point.y+') rotate('+a+')'},garden);
          const inner=svg('g',{},outer);const art=paintLeaf(inner,['#929662','#a6a16b','#b5a16a'][i%3]);art.setAttribute('transform','translate(-60 -142)');
          leaves.push({inner,scale,delay:delay+.4+i*.12});anchors.push({x:point.x,y:point.y});
        }
      }
    }
    // Six parent limbs fan up, sideways, and down; forks inherit and curl away.
    for(const side of [-1,1]){
      const originX=cx+side*Math.min(w*.19,160);
      [-1.3,-.35,.55].forEach((a,j)=>{
        const angle=side<0?Math.PI-a:a;
        branch(originX,cy-j*28,angle,Math.min(w*.24,250)*( .8+abundance*.35),5+abundance*3,2,j*.15,10+j+(side+1)*20);
      });
      // A fine curling tendril frames the title from behind its paper backing.
      const x=cx+side*Math.min(w*.27,260),y=top+title.height*.55;
      const d='M'+x+' '+(cy-5)+' C'+(x+side*110)+' '+(cy-40)+' '+(x+side*95)+' '+(y-110)+' '+(x+side*25)+' '+(y-85)+' C'+(x-side*15)+' '+(y-65)+' '+(x+side*45)+' '+(y-30)+' '+(x+side*43)+' '+(y-66);
      const p=svg('path',{d,class:'branch tendril','stroke-width':2.3},garden),total=p.getTotalLength();p.style.strokeDasharray=total;p.style.strokeDashoffset=total;branches.push({path:p,total,delay:.6});
    }
    // Fine twigs reach onto the paper, including the lower title line,
    // so they read as foreground growth without crossing the age input.
    const left=title.left-main.left,right=title.right-main.left,bottom=title.bottom-main.top;
    const twigPaths=[
      'M'+(left+12)+' '+(top+56)+' q-10 -33 8 -48 q18 -14 32 -5 q10 8 2 14 q-7 4 -11 -2 M'+(left+19)+' '+(top+26)+' q-16 -3 -19 -15',
      'M'+(right-20)+' '+(top+title.height*.4+42)+' q16 -26 3 -46 q-9 -14 -18 -5 q-7 9 3 13 M'+(right-15)+' '+(top+title.height*.4+14)+' q15 -7 17 -20',
      'M'+(cx-title.width*.14)+' '+(bottom+16)+' q-32 -5 -35 -27 q-3 -18 11 -20 q13 -1 11 10 q-2 8 -9 4 M'+(cx-title.width*.14-34)+' '+(bottom-8)+' q-17 -5 -21 -18',
      'M'+(right-76)+' '+(top+5)+' q28 -22 49 -11 q18 11 8 25 q-9 10 -17 1 q-5 -8 3 -11',
      'M'+(left+5)+' '+(top+title.height*.62)+' q24 -9 31 8 q5 15 -6 20 q-12 4 -13 -6 M'+(left+23)+' '+(top+title.height*.62+1)+' q4 -14 14 -18',
      'M'+(cx+title.width*.17)+' '+(bottom+15)+' q30 4 41 -15 q10 -18 -3 -25 q-12 -5 -16 6 q-2 9 7 10',
      'M'+(right-12)+' '+(bottom-12)+' q-19 -7 -20 -25 q-1 -18 12 -20 q13 -1 14 10 M'+(right-30)+' '+(bottom-29)+' q-14 0 -20 -10'
    ];
    // Grow each sprig at twice its original size, with a mirrored companion.
    // Scaling the whole sprig also doubles its attached leaves.
    twigPaths.flatMap((d,i)=>[{d,i,mirrored:false},{d,i:i+twigPaths.length,mirrored:true}]).forEach(({d,i,mirrored})=>{
      const sprig=svg('g',{},titleTwigs);
      sprig.style.opacity='0';
      const path=svg('path',{d,class:'foreground-twig'},sprig),total=path.getTotalLength();
      const root=path.getPointAtLength(0);
      const x=mirrored?2*cx-root.x:root.x,y=root.y+(mirrored?16:0);
      sprig.setAttribute('transform','translate('+x+' '+y+') scale('+(mirrored?-2:2)+' 2) translate('+(-root.x)+' '+(-root.y)+')');
      path.style.strokeDasharray=total;path.style.strokeDashoffset=total;
      const delay=.8+i*.12;
      branches.push({path,total,delay,duration:1.8,sprig});
      // Attach miniature leaves by their stems, alternating along each twig.
      for(let j=0;j<3;j++){
        const distance=total*(.22+j*.23);
        const point=path.getPointAtLength(distance);
        const ahead=path.getPointAtLength(Math.min(total,distance+1));
        const angle=Math.atan2(ahead.y-point.y,ahead.x-point.x)*180/Math.PI+90+(j%2?55:-55);
        const outer=svg('g',{transform:'translate('+point.x+' '+point.y+') rotate('+angle+')',class:'twig-leaf'},sprig);
        const inner=svg('g',{transform:'scale(0)'},outer);
        const art=paintLeaf(inner,['#929765','#b49a60','#a78456'][(i+j)%3]);
        art.setAttribute('transform','translate(-60 -142)');
        leaves.push({inner,scale:.07+rnd(i*7+j+600)*.035,delay:delay+(distance/total)*1.8});
      }
    });
    const particles=cards.map(({b,tilt},i)=>{
      const rect=b.getBoundingClientRect(),anchor=anchors[Math.floor(rnd(i+300)*anchors.length)];
      b.style.visibility='hidden';
      return {b,tilt,dx:anchor.x-(rect.left-main.left+rect.width/2),dy:anchor.y-(rect.top-main.top+rect.height*.7),delay:2.1+i*.13,duration:4.6};
    });
    const growthEnd=Math.max(...branches.map(b=>b.delay+(b.duration||1.1)),...leaves.map(l=>l.delay+.7));
    scene={branches,leaves,particles,growthEnd,elapsed:0,last:0};
    if(paused||reduce.matches)drawScene(1000);else {drawScene(0);frame=requestAnimationFrame(tick);}
  }
  function drawScene(t){
    if(!scene)return false;
    scene.branches.forEach(({path,total,delay,duration=1.1,sprig})=>{
      const growth=clamp((t-delay)/duration);
      path.style.strokeDashoffset=total*(1-growth);
      if(sprig)sprig.style.opacity=clamp(growth*3);
    });
    scene.leaves.forEach(({inner,scale,delay})=>inner.setAttribute('transform','scale('+scale*clamp((t-delay)/.7)+')'));
    let active=t<scene.growthEnd;
    scene.particles.forEach(p=>{
      const progress=clamp((t-p.delay)/p.duration);p.b.style.visibility=t<p.delay?'hidden':'visible';
      if(progress<1)active=true;
      const ease=progress*progress*(3-2*progress),flutter=Math.sin(progress*Math.PI*5)*30*Math.sin(progress*Math.PI);
      const dx=p.dx*(1-ease)+flutter,dy=p.dy*(1-progress*progress);
      const rotation=p.tilt+Math.sin(progress*13)*18*(1-progress);
      p.b.style.transform='translate('+dx+'px,'+dy+'px) rotate('+rotation+'deg)';
      p.b.style.pointerEvents=progress===1?'auto':'none';
      p.b.classList.toggle('landed',progress===1);
    });return active;
  }
  function tick(time){if(!scene||paused)return;if(!scene.last)scene.last=time;scene.elapsed+=Math.min((time-scene.last)/1000,.06);scene.last=time;if(drawScene(scene.elapsed))frame=requestAnimationFrame(tick);}
  function readAge(){
    const value=$('age').value.trim();
    $('age').style.width=Math.min(12,Math.max(1.9,value.length*.62+.3))+'em';
    $('age').style.fontSize=value.length>10?'0.55em':'';
    $('age').setCustomValidity(value && (!/^\d+$/.test(value)||BigInt(value)===0n)?t('invalid'):'');
    const next=/^\d+$/.test(value)&&BigInt(value)>0n?BigInt(value):null;
    if(next===age)return;age=next;build();
  }
  $('age').addEventListener('input',readAge);
  $('age-form').addEventListener('submit',e=>{e.preventDefault();readAge();});
  $('replay').addEventListener('click',()=>{seed++;build();});
  function syncMotion(){$('motion').textContent=t(paused?'resume':'pause');$('motion').setAttribute('aria-pressed',String(paused));}
  function applyLanguage(){
    document.documentElement.lang=language==='zh'?'zh-CN':'en';document.title=t('pageTitle');
    const labels={'edition':'edition','language-label':'language','intro-eyebrow':'eyebrow','title-prefix':'prefix','title-years':'years','title-outlive':'outlive','age-label':'ageLabel','names-summary':'names','replay':'replay','footer-line':'footer','person-eyebrow':'detailEyebrow','person-source':'source','image-source':'credits'};
    Object.entries(labels).forEach(([id,key])=>$(id).textContent=t(key));
    document.querySelector('.intro').setAttribute('aria-label',t('ageSection'));
    $('fallen').setAttribute('aria-label',t('ground'));
    $('person').querySelector('.close').setAttribute('aria-label',t('close'));
    syncMotion();
  }
  $('language').addEventListener('change',()=>{
    const elapsed=scene?.elapsed||0;
    language=$('language').value==='zh'?'zh':'en';applyLanguage();readAge();build();
    if(scene&&!paused&&!reduce.matches){scene.elapsed=elapsed;drawScene(elapsed);}
    if(selected&&$('person').open)showPerson(selected);
  });
  $('motion').addEventListener('click',()=>{paused=!paused;syncMotion();cancelAnimationFrame(frame);if(scene){if(paused)drawScene(1000);else{seed++;build();}}});
  reduce.addEventListener('change',()=>{paused=reduce.matches;syncMotion();build();});
  $('person').querySelector('.close').addEventListener('click',()=>$('person').close());
  $('person').addEventListener('click',e=>{if(e.target!==$('person'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();});
  let resize;window.addEventListener('resize',()=>{clearTimeout(resize);resize=setTimeout(build,150);});
  applyLanguage();build();
})();
