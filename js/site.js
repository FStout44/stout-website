(function(){
  var root=document.documentElement;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce) root.classList.add('js');

  // nav: border once scrolled, menu toggle on phones
  var nav=document.getElementById('nav');
  var menu=nav.querySelector('.menu-btn');
  menu.addEventListener('click',function(){
    var open=nav.classList.toggle('open');
    menu.setAttribute('aria-expanded',open);
    document.body.style.overflow=open?'hidden':'';
  });

  // reveal on enter
  if(!reduce&&'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
    },{threshold:.15,rootMargin:'0px 0px -5% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
  }

  // hero: slow parallax
  var hero=document.querySelector('.hero img');
  var ticking=false;
  function frame(){
    ticking=false;
    var y=scrollY;
    nav.classList.toggle('solid',y>10);
    if(hero&&!reduce&&y<innerHeight) hero.style.transform='translate3d(0,'+(y*.18).toFixed(1)+'px,0)';
  }
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(frame)}},{passive:true});
  frame();

  // carousel: keeps one photo centred, fades the rest, advances every few seconds.
  // The photo set is repeated three times so there is always something on both sides.
  var car=document.querySelector('.carousel');
  if(car){
    var track=car.querySelector('.track');
    var base=[].slice.call(track.children);
    for(var c=0;c<2;c++) base.forEach(function(sl){var k=sl.cloneNode(true);k.setAttribute('tabindex','-1');k.setAttribute('aria-hidden','true');track.appendChild(k)});
    var slides=[].slice.call(track.children), n=base.length, cur=n+(+car.dataset.start||0), timer=null;
    function go(i,instant){
      cur=i;
      if(instant) track.style.transition='none';
      var s=slides[cur];
      track.style.transform='translate3d('+(car.offsetWidth/2-(s.offsetLeft+s.offsetWidth/2))+'px,0,0)';
      slides.forEach(function(el,j){el.classList.toggle('on',j===cur)});
      if(instant){track.offsetWidth;track.style.transition=''}
    }
    // after sliding into a copy, jump back to the same photo in the middle set
    track.addEventListener('transitionend',function(e){
      if(e.target!==track) return;
      if(cur<n) go(cur+n,true); else if(cur>=2*n) go(cur-n,true);
    });
    function step(d){go(cur+d)}
    function play(){if(!reduce){clearInterval(timer);timer=setInterval(function(){step(1)},5000)}}
    car.querySelector('.prev').addEventListener('click',function(){step(-1);play()});
    car.querySelector('.next').addEventListener('click',function(){step(1);play()});
    car.addEventListener('mouseenter',function(){clearInterval(timer)});
    car.addEventListener('mouseleave',play);
    var tx=null;
    car.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;clearInterval(timer)},{passive:true});
    car.addEventListener('touchend',function(e){if(tx===null) return;var dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>40) step(dx<0?1:-1);tx=null;play()});
    function ready(){go(cur,true);play()}
    var imgs=base.map(function(sl){return sl.tagName==='IMG'?sl:sl.querySelector('img')});
    var waiting=imgs.filter(function(img){return !img.complete}).length;
    if(!waiting) ready();
    else imgs.forEach(function(img){if(!img.complete) ['load','error'].forEach(function(ev){img.addEventListener(ev,function(){if(--waiting===0) ready()})})});
    addEventListener('load',function(){go(cur,true)});
    addEventListener('resize',function(){go(cur,true)});
  }

  // project galleries: show a few, expand on request, open full size in a lightbox
  var lb=document.getElementById('lb');
  if(lb){
    var lbImg=lb.querySelector('img'), lbCap=lb.querySelector('.cap'), list=[], at=0, last=null;
    function show(i){
      at=(i+list.length)%list.length;
      var b=list[at];
      lbImg.src=b.dataset.full; lbImg.alt=b.querySelector('img').alt;
      lbCap.textContent=(b.dataset.cap?b.dataset.cap+'  ·  ':'')+(at+1)+' / '+list.length;
    }
    function close(){lb.classList.remove('on');document.body.style.overflow='';if(last) last.focus()}
    var all=[].slice.call(document.querySelectorAll('.shot[data-full]'));
    all.forEach(function(b,i){
      b.addEventListener('click',function(){
        list=all;last=b;show(i);lb.classList.add('on');document.body.style.overflow='hidden';lb.querySelector('.x').focus();
      });
    });
    lb.querySelector('.x').addEventListener('click',close);
    lb.querySelector('.prev').addEventListener('click',function(){show(at-1)});
    lb.querySelector('.next').addEventListener('click',function(){show(at+1)});
    lb.addEventListener('click',function(e){if(e.target===lb) close()});
    addEventListener('keydown',function(e){
      if(!lb.classList.contains('on')) return;
      if(e.key==='Escape') close();
      if(e.key==='ArrowLeft') show(at-1);
      if(e.key==='ArrowRight') show(at+1);
    });
    var sx=null;
    lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
    lb.addEventListener('touchend',function(e){if(sx===null) return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40) show(at+(dx<0?1:-1));sx=null});
  }

  // homes: step through each card's images with arrows or a swipe
  document.querySelectorAll('.home .ph[data-gallery]').forEach(function(ph){
    var slides=ph.querySelectorAll('.slide'), dots=ph.querySelectorAll('.dots i'), at=0;
    function go(i){
      at=(i+slides.length)%slides.length;
      slides.forEach(function(s,j){s.classList.toggle('on',j===at)});
      dots.forEach(function(d,j){d.classList.toggle('on',j===at)});
      var img=slides[at].querySelector('img'); if(img.loading==='lazy') img.loading='eager';
    }
    ph.querySelector('.gal-prev').addEventListener('click',function(){go(at-1)});
    ph.querySelector('.gal-next').addEventListener('click',function(){go(at+1)});
    var sx=null;
    ph.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
    ph.addEventListener('touchend',function(e){if(sx===null) return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>35) go(at+(dx<0?1:-1));sx=null});
  });

  // reviews: if the live Google reviews widget hasn't appeared after a few seconds, show the plain Google link
  document.querySelectorAll('.reviews-widget').forEach(function(box){
    setTimeout(function(){
      var live=box.querySelector('[id^=featurable-]');
      if(!live||live.offsetHeight<40){var fb=box.querySelector('.reviews-fallback');if(fb) fb.hidden=false}
    },7000);
  });

  // estimator: the embedded app can report its content height so the frame grows instead of scrolling inside
  var est=document.querySelector('.estimator iframe');
  if(est){
    addEventListener('message',function(e){
      if(!/^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(e.origin)) return;
      var d=e.data||{};
      if(d.type==='stout-estimator-height'&&+d.height>300) est.style.height=Math.ceil(+d.height)+'px';
    });
  }

  // forms: post to the address in data-endpoint
  document.querySelectorAll('form[data-endpoint]').forEach(function(form){
    var note=form.querySelector('.form-note');
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!form.reportValidity()) return;
      var btn=form.querySelector('button[type=submit]');
      btn.disabled=true;note.textContent='Sending...';note.className='form-note';
      var data={};new FormData(form).forEach(function(v,k){data[k]=v});
      fetch(form.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)}).then(function(r){
        return r.json().catch(function(){throw 'The form service returned an unreadable reply (code '+r.status+').'});
      }).then(function(d){
        if(String(d.success)!=='true') throw (d.message||'The form service did not accept the submission.');
        form.reset();note.textContent=form.dataset.thanks;note.className='form-note ok';
      }).catch(function(why){
        var msg=typeof why==='string'?why:'The form service could not be reached.';
        note.textContent=/activat/i.test(msg)?'This form is waiting to be switched on. An activation email has been sent to the site owner.':"That didn't send. "+msg;
        note.className='form-note warn';
      }).then(function(){btn.disabled=false});
    });
  });
})();
