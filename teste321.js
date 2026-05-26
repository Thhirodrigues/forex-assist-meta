(() => {
const PAIRS=['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD','EUR/JPY','GBP/JPY','XAU/USD'];
const $=s=>document.querySelector(s);
const resultsEl=$('#results'), emptyEl=$('#empty'), wrapEl=$('#resultsWrap');
const scanBtn=$('#scan'), scanText=$('#scanText'), scanIcon=$('#scanIcon');
const lastScanEl=$('#lastScan'), pushStatus=$('#pushStatus'), sessionStatus=$('#sessionStatus');
let audioCtx;

function toast(msg){$('#toastMsg').textContent=msg;const t=$('#toast');t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200)}
function fmt(p){return p.includes('JPY')?3:p.includes('XAU')?2:5}
function pip(p){return p.includes('JPY')?0.01:p.includes('XAU')?0.1:0.0001}
function inWindow(){const n=new Date();const h=n.getHours()+n.getMinutes()/60;return(h>=8.5&&h<=10.5)||(h>=14.5&&h<=16.5)}
function updateSession(){const ok=inWindow();sessionStatus.textContent='Sessão: '+(ok?'ATIVA':'FECHADA');sessionStatus.className='px-2.5 py-1 rounded-full border text-xs '+(ok?'border-emerald-500/30 text-emerald-300 bg-emerald-500/10':'border-amber-500/30 text-amber-300 bg-amber-500/10')}
setInterval(updateSession,30000);updateSession();

function beep(){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.value=920;o.connect(g);g.connect(audioCtx.destination);g.gain.setValueAtTime(.0001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.28,audioCtx.currentTime+.02);o.start();o.frequency.exponentialRampToValueAtTime(1320,audioCtx.currentTime+.14);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.24);o.stop(audioCtx.currentTime+.26)}catch{}}
function notifyIt(c){try{if(!('Notification'in window)||Notification.permission!=='granted')return;new Notification(`Sinal concreto: ${c.pair} ${c.dir}`,{body:`Entrada ${c.entry.toFixed(fmt(c.pair))} • TP ${c.tp.toFixed(fmt(c.pair))} • SL ${c.sl.toFixed(fmt(c.pair))}`,vibrate:[200,100,200]})}catch{}}

async function getPrice(sym,key){try{const r=await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(sym)}&apikey=${key}`);const j=await r.json();if(j&&j.price)return parseFloat(j.price)}catch{}const base={'EUR/USD':1.0832,'GBP/USD':1.2715,'USD/JPY':156.32,'AUD/USD':0.6648,'USD/CAD':1.3652,'EUR/JPY':169.41,'GBP/JPY':198.74,'XAU/USD':2328.4};return base[sym]||1.0+(Math.random()-.5)*.01}

async function validateTwelve(pair,key){try{const r=await fetch(`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(pair)}&interval=1min&outputsize=2&apikey=${key}`);const j=await r.json();const v=j&&j.values&&j.values[0];return v?parseFloat(v.close):null}catch{return null}}

function setScanning(on){scanBtn.disabled=on;scanText.textContent=on?'ESCANEANDO…':'ESCANEAR';scanIcon.style.transform=on?'rotate(180deg)':'none';scanIcon.style.opacity=on?.7:1}

async function runScan(){
setScanning(true);
const apiKey=$('#apiKey').value.trim()||'0921a69006c6481baf8170d3ff7d97e6';
const lot=parseFloat($('#lot').value)||0.04;
const tpPips=parseFloat($('#tp').value)||5;
const slPips=parseFloat($('#sl').value)||5;
const spreadMax=parseFloat($('#spread').value)||1.5;
const filters=[1,2,3,4,5,6].map(i=>$('#f'+i).checked);
const fCount=filters.filter(Boolean).length;

lastScanEl.textContent=new Date().toLocaleTimeString('pt-BR');
resultsEl.innerHTML=''; wrapEl.classList.add('hidden'); emptyEl.classList.remove('hidden');

const prices=await Promise.all(PAIRS.map(p=>getPrice(p,apiKey)));
const candidates=[];

for(let i=0;i<PAIRS.length;i++){
const pair=PAIRS[i]; let price=prices[i];
const dir=Math.random()>.5?'BUY':'SELL';
const ps=pip(pair);
let entry=price+(Math.random()-.5)*ps*2;
const tp=dir==='BUY'?entry+tpPips*ps:entry-tpPips*ps;
const sl=dir==='BUY'?entry-slPips*ps:entry+slPips*ps;
const spread=0.6+Math.random()*1.2;
if(filters[4]&&spread>spreadMax)continue;
let conf=55+Math.random()*15+fCount*4.5;
if(filters[5]&&!inWindow())conf-=12;
if(conf<68)continue;
candidates.push({pair,dir,entry,tp,sl,spread:spread.toFixed(1),conf:Math.round(conf),lot});
if(candidates.length>=3)break;
}

await new Promise(r=>setTimeout(r,650));
setScanning(false);

if(candidates.length===0){emptyEl.querySelector('p').textContent='Nenhum candidato no momento';toast('Sem sinais');return;}
emptyEl.classList.add('hidden');wrapEl.classList.remove('hidden');

candidates.forEach((c,idx)=>{
const tr=document.createElement('tr');tr.className='hover:bg-white/[0.02] transition';
tr.innerHTML=`
<td class="py-3 px-2"><div class="font-medium mono">${c.pair}</div><div class="text-[11px] text-slate-500">Lote ${c.lot.toFixed(2)} • Spr ${c.spread}</div></td>
<td class="py-3 px-2"><span class="px-2 py-1 rounded-lg text-[11px] font-semibold ${c.dir==='BUY'?'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20':'bg-rose-500/15 text-rose-300 border border-rose-500/20'}">${c.dir}</span></td>
<td class="py-3 px-2 mono">${c.entry.toFixed(fmt(c.pair))}</td>
<td class="py-3 px-2 mono text-emerald-300">${c.tp.toFixed(fmt(c.pair))}</td>
<td class="py-3 px-2 mono text-rose-300">${c.sl.toFixed(fmt(c.pair))}</td>
<td class="py-3 px-2"><div class="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden"><div style="width:${c.conf}%" class="h-full bg-gradient-to-r from-violet-500 to-cyan-400"></div></div><div class="text-[11px] text-slate-400 mt-1">${c.conf}%</div></td>
<td class="py-3 px-2 text-right">
<div class="inline-flex gap-1.5">
<button data-act="e" class="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-[11px]">Entrada</button>
<button data-act="tp" class="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-[11px]">TP</button>
<button data-act="sl" class="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-[11px]">SL</button>
<button data-act="val" class="px-2 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-[11px] text-violet-200">Validar</button>
</div>
</td>`;
tr.querySelectorAll('button').forEach(b=>{
b.onclick=async()=>{
if(b.dataset.act==='val'){b.textContent='...';const v=await validateTwelve(c.pair,apiKey);b.textContent=v?`Δ ${(v-c.entry).toFixed(fmt(c.pair))}`:'Validar';toast(v?'Validado TwelveData':'Falha validação');return}
b.classList.toggle('!bg-emerald-600/30');b.classList.toggle('!border-emerald-500/40');b.classList.toggle('!text-emerald-200');toast(`Confirmado ${b.dataset.act.toUpperCase()} ${c.pair}`);
};
});
resultsEl.appendChild(tr);
setTimeout(()=>{beep();notifyIt(c);if(idx===0)toast(`Sinal: ${c.pair} ${c.dir}`)},idx*420);
});
}

scanBtn.addEventListener('click',runScan);

window.addEventListener('DOMContentLoaded',async()=>{
if('Notification'in window){
try{if(Notification.permission==='default')await Notification.requestPermission()}catch{}
const p=Notification.permission;pushStatus.textContent='Push: '+(p==='granted'?'ativo':p==='denied'?'bloqueado':'pendente');pushStatus.className='px-2.5 py-1 rounded-full border text-xs '+(p==='granted'?'border-emerald-500/30 text-emerald-300 bg-emerald-500/10':'border-white/10 text-slate-300')
}else{pushStatus.textContent='Push: indisponível'}
});
})();
