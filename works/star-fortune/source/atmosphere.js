const sky=document.createElement('div');sky.className='meteor-sky';sky.setAttribute('aria-hidden','true');document.body.prepend(sky);
let last=0;
function meteor(){if(document.hidden||document.body.classList.contains('reduced')||sky.childElementCount>2)return;const n=document.createElement('i');n.className='meteor';n.style.left=`${15+Math.random()*65}vw`;n.style.top=`${9+Math.random()*30}vh`;sky.append(n);n.addEventListener('animationend',()=>n.remove(),{once:true});}
setInterval(meteor,6500);
addEventListener('scroll',()=>{if(performance.now()-last>4500){last=performance.now();meteor();}},{passive:true});
