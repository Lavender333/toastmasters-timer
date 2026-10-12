'use strict';
const $=id=>document.getElementById(id);
const categories={'Table Topics':[60,90,120],'Evaluation':[120,150,180],'Ice Breaker':[240,300,360],'Most Other Speeches':[300,360,420],'General Evaluator':[120,180,240],'Meeting Introduction':[60,90,120],'Custom':[300,360,420]};
Object.keys(categories).filter(c=>!Array.from($('category').options).some(o=>o.value===c)).forEach(c=>{const o=document.createElement('option');o.value=o.textContent=c;$('category').append(o)});
function parseTime(v){const t=String(v).trim();let seconds;if(/^[0-9]+$/.test(t))seconds=Number(t)*60;else if(/^[0-9]+:[0-5][0-9]$/.test(t)){const [m,s]=t.split(':').map(Number);seconds=m*60+s}else return NaN;return Number.isSafeInteger(seconds)?seconds:NaN}
function currentTimes(){return running&&pmTimerV5.active?pmTimerV5.active.times||categories[pmTimerV5.active.category]:$('category').value==='Custom'?['customG','customY','customR'].map(id=>parseTime($(id).value)):categories[$('category').value]}
function entryTimes(e){return e.times||categories[e.category]}
function entryResult(e){return result(e.seconds,e.category,entryTimes(e),e.earlyGrace)}
function selectedEntries(){return pmTimerV5.entries.filter(e=>e.date===$('reportDate').value)}
let tmMeetingInfo={},pmTimerV5={entries:[],active:null},storageOK=true;
try{tmMeetingInfo=JSON.parse(localStorage.getItem('tmMeetingInfo')||'{}')||{};pmTimerV5=JSON.parse(localStorage.getItem('pmTimerV5')||'null')||pmTimerV5;if(!Array.isArray(pmTimerV5.entries))pmTimerV5.entries=[]}catch{storageOK=false}
const today=new Date();$('date').value=tmMeetingInfo.date||`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;$('timerName').value=tmMeetingInfo.timerName||'';$('participant').value=tmMeetingInfo.participant||'';
function announce(t){$('announce').textContent=t}function save(){tmMeetingInfo={date:$('date').value,timerName:$('timerName').value,participant:$('participant').value,earlyGrace:$('earlyGrace').checked,soundEnabled:$('soundEnabled').checked,keepAwake:$('keepAwake').checked,category:$('category').value,customTimes:['customG','customY','customR'].map(id=>$(id).value)};try{localStorage.setItem('tmMeetingInfo',JSON.stringify(tmMeetingInfo));localStorage.setItem('pmTimerV5',JSON.stringify(pmTimerV5))}catch{storageOK=false;document.querySelector('.local').textContent='Storage unavailable';announce('Browser storage unavailable. Export your report to keep it.')}}
['date','timerName','participant'].forEach(id=>$(id).addEventListener('input',save));
function fmt(s){s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function result(s,c,t=categories[c],early=false){const [g,y,r]=t;return s<g?(early&&s>=Math.max(0,g-30)?'Before minimum · allowed grace':'Early'):s<=r?'Within Time':s<=r+30?'30-Second Grace':'Exceeded Grace'}
if(categories[tmMeetingInfo.category])$('category').value=tmMeetingInfo.category;if(Array.isArray(tmMeetingInfo.customTimes))['customG','customY','customR'].forEach((id,i)=>{if(typeof tmMeetingInfo.customTimes[i]==='string')$(id).value=tmMeetingInfo.customTimes[i]});$('soundEnabled').checked=tmMeetingInfo.soundEnabled!==false;
let running=!!pmTimerV5.active,elapsed=0,lastState='',editing=null;
if(running){$('participant').value=pmTimerV5.active.name;$('category').value=pmTimerV5.active.category;$('date').value=pmTimerV5.active.date;$('timerName').value=pmTimerV5.active.timerName;if(pmTimerV5.active.times)['customG','customY','customR'].forEach((id,i)=>$(id).value=fmt(pmTimerV5.active.times[i]))} $('earlyGrace').checked=running?!!pmTimerV5.active.earlyGrace:!!tmMeetingInfo.earlyGrace;$('reportDate').value=$('date').value;

let audioContext=null,maximumChimed=false;
async function enableAudio(){
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){$('soundNotice').textContent='Sound is unavailable in this browser.';return false}if(!audioContext)audioContext=new Audio();if(audioContext.state!=='running')await audioContext.resume();if(audioContext.state!=='running'){$('soundNotice').textContent='Tap Test sound to enable audio.';return false}$('soundNotice').textContent='';return true}catch{$('soundNotice').textContent='Audio could not start. Visual signals remain active.';return false}
}
function gentleChime(force=false){
 if((!force&&!$('soundEnabled').checked)||!audioContext||audioContext.state!=='running')return;
 try{const now=audioContext.currentTime;[523.25,659.25].forEach((frequency,i)=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),start=now+i*.18;oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.055,start+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+.65);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(start);oscillator.stop(start+.7);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()}})}catch{$('soundNotice').textContent='Sound could not play. Visual signals remain active.'}
}
function showTimerError(message,field){$('timerError').textContent=message;$('timerError').hidden=!message;if(field){$(field).setAttribute('aria-invalid','true');$(field).focus()}}
function clearTimerError(){$('timerError').hidden=true;$('timerError').textContent='';['participant','customG','customY','customR'].forEach(id=>$(id).removeAttribute('aria-invalid'))}
function validTimes(times){return times.every(Number.isSafeInteger)&&times[0]>0&&times[0]<times[1]&&times[1]<times[2]}
$('testSound').onclick=async()=>{if(await enableAudio()){gentleChime(true);$('soundNotice').textContent='Test chime played. Check your device volume.'}};
$('soundEnabled').onchange=()=>{save();if($('soundEnabled').checked)enableAudio()};
if(running){const activeTimes=pmTimerV5.active.times||categories[pmTimerV5.active.category];maximumChimed=(Date.now()-pmTimerV5.active.startedAt)/1000>=activeTimes[2];$('soundNotice').textContent='Tap Test sound to enable audio after reloading.'}

function thresholds(){const timing=currentTimes();if(!validTimes(timing))return;const [g,y,r]=timing;$('g').textContent=fmt(g);$('y').textContent=fmt(y);$('r').textContent=fmt(r);$('progress').setAttribute('aria-valuemax',r)}
function lock(){['participant','category','date','timerName','customG','customY','customR','earlyGrace','newMeeting','restore'].forEach(id=>$(id).disabled=running);$('start').disabled=running;$('stop').disabled=!running;$('next').disabled=running}
function paint(){if(running)elapsed=Math.max(0,Math.floor((Date.now()-pmTimerV5.active.startedAt)/1000));const timing=currentTimes();if(!validTimes(timing))return;const [g,y,r]=timing;if(running&&!maximumChimed&&elapsed>=r){maximumChimed=true;gentleChime()}let color=elapsed>=r?'red':elapsed>=y?'yellow':elapsed>=g?'green':'';const state=elapsed>r+30?'exceeded':elapsed>r?'grace':color||'early';document.body.dataset.signal=color;$('clock').textContent=fmt(elapsed);$('shape').textContent=color==='green'?'●':color==='yellow'?'◆':color==='red'?'■':'—';$('signal').textContent=!running&&elapsed===0?'Ready when you are':color==='green'?'Minimum time reached':color==='yellow'?'Wrap up':color==='red'?'Official maximum reached':'Timing in progress';$('status').textContent=!running&&elapsed===0?'Press Start to begin timing':state==='exceeded'?'Exceeded Grace':state==='grace'?'30-Second Grace':elapsed>=g?'Within Time':'Before minimum time';$('over').textContent=state==='exceeded'?`Over the 30-second grace by ${fmt(elapsed-r-30)}`:state==='grace'?`Grace ends at ${fmt(r+30)}`:'';$('bar').style.width=Math.min(100,elapsed/r*100)+'%';$('progress').setAttribute('aria-valuenow',Math.min(elapsed,r));$('progress').setAttribute('aria-valuetext',`${fmt(elapsed)} elapsed; maximum ${fmt(r)}`);if(state!==lastState){if(running)announce(state==='exceeded'?'Exceeded the 30-second grace. Timer continues running.':state==='grace'?'30-second grace period.':$('signal').textContent);lastState=state}}
$('category').onchange=()=>{clearTimerError();save();elapsed=0;$('customTiming').hidden=$('category').value!=='Custom';if($('category').value==='Custom')$('timingSettings').open=true;$('presetNote').textContent=['General Evaluator','Meeting Introduction'].includes($('category').value)?'Suggested club timing. Select Custom to match your agenda.':'';thresholds();paint()};$('start').onclick=()=>{clearTimerError();if(!$('participant').value.trim()){showTimerError('Enter a participant name, then press Start timer.','participant');return}const times=currentTimes();if(!validTimes(times)){$('timingSettings').open=true;const bad=times.findIndex(t=>!Number.isSafeInteger(t)||t<=0);showTimerError('Use minutes (5) or mm:ss (5:30). Green must be earlier than Yellow, and Yellow earlier than Red.',['customG','customY','customR'][bad<0?0:bad]);return}if($('soundEnabled').checked)enableAudio();maximumChimed=false;if($('category').value==='Custom')['customG','customY','customR'].forEach((id,i)=>$(id).value=fmt(times[i]));$('timingSettings').open=false;elapsed=0;lastState='';pmTimerV5.active={name:$('participant').value.trim(),category:$('category').value,times:times.slice(),earlyGrace:$('earlyGrace').checked,startedAt:Date.now(),date:$('date').value,timerName:$('timerName').value};running=true;save();lock();paint();acquireWakeLock();if(window.matchMedia('(max-width:760px)').matches){document.body.classList.add('speaker-view');$('speaker').setAttribute('aria-pressed','true');setFocusView(true);$('timer').scrollTop=0}$('stop').focus()};
$('stop').onclick=()=>{paint();const a=pmTimerV5.active;pmTimerV5.entries.push({id:Date.now()+Math.random(),name:a.name,category:a.category,times:a.times,earlyGrace:a.earlyGrace,seconds:elapsed,date:a.date,timerName:a.timerName});running=false;releaseWakeLock();pmTimerV5.active=null;save();lock();render();announce(`Logged ${a.name}, ${fmt(elapsed)}, ${result(elapsed,a.category,a.times,a.earlyGrace)}.`);$('start').focus()};
$('reset').onclick=()=>{if(running&&!confirm('Discard the current timing without logging?'))return;running=false;releaseWakeLock();pmTimerV5.active=null;elapsed=0;lastState='';save();lock();paint();announce('Timer reset');$('start').focus()};
function cell(tr,t){const td=document.createElement('td');td.textContent=t;tr.append(td);return td}
function render(){$('rows').replaceChildren();const entries=selectedEntries();$('empty').hidden=entries.length>0;$('table').hidden=!entries.length;entries.forEach(e=>{const tr=document.createElement('tr');cell(tr,e.name);cell(tr,e.category);const allotted=entryTimes(e);cell(tr,fmt(allotted[0])+'–'+fmt(allotted[2]));const timeCell=cell(tr,fmt(e.seconds));timeCell.className='elapsed-cell';const statusCell=cell(tr,'');const badge=document.createElement('span');const outcome=entryResult(e);badge.textContent=outcome;badge.className='result-badge '+(outcome==='Within Time'?'result-within':outcome==='Exceeded Grace'?'result-exceeded':outcome.includes('Grace')||outcome.includes('grace')?'result-grace':'result-early');statusCell.append(badge);const td=cell(tr,'');const edit=document.createElement('button');edit.textContent='Edit';edit.setAttribute('aria-label',`Edit ${e.name}`);edit.onclick=()=>{editing=e.id;$('editName').value=e.name;$('editCategory').value=e.category;$('editTime').value=fmt(e.seconds);$('editDate').value=e.date;$('editTimer').value=e.timerName;$('editDialog').showModal()};const del=document.createElement('button');del.textContent='Delete';del.setAttribute('aria-label',`Delete ${e.name}`);del.onclick=()=>{if(confirm(`Delete ${e.name}'s entry?`)){pmTimerV5.entries=pmTimerV5.entries.filter(x=>x.id!==e.id);save();render();announce('Entry deleted')}};td.append(edit,del);$('rows').append(tr)});$('csv').disabled=$('jpg').disabled=!entries.length;renderReport(entries)}
$('editCategory').innerHTML=$('category').innerHTML;$('editForm').onsubmit=e=>{e.preventDefault();const entry=pmTimerV5.entries.find(x=>x.id===editing);const parts=$('editTime').value.split(':').map(Number);if(!$('editName').value.trim()||!Number.isSafeInteger(parts[0]*60+parts[1]))return;if(entry.category!==$('editCategory').value)entry.times=categories[$('editCategory').value].slice();Object.assign(entry,{date:$('editDate').value,timerName:$('editTimer').value,name:$('editName').value.trim(),category:$('editCategory').value,seconds:parts[0]*60+parts[1]});save();render();$('editDialog').close();announce('Entry updated')};$('cancel').onclick=()=>$('editDialog').close();
function download(blob,ext,suffix=''){const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=`toasty-timer-report-${$('reportDate').value||'meeting'}${suffix}.${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);announce(`${ext.toUpperCase()} report downloaded`)}
function csvField(v){let t=String(v??'');if(/^[=+@\-\t\r]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"'}
$('csv').onclick=()=>{const rows=[['Meeting Date','Timer Name','Participant','Category','Elapsed','Result','Green','Yellow','Red','Grace Ends','Before-minimum allowance'],...selectedEntries().map(e=>[e.date,e.timerName,e.name,e.category,fmt(e.seconds),entryResult(e),...entryTimes(e).map(fmt),fmt(entryTimes(e)[2]+30),e.earlyGrace?'30 seconds':'None'])];download(new Blob(['\ufeff'+rows.map(row=>row.map(csvField).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'csv')};
$('jpg').onclick=()=>{
 const entries=selectedEntries(),perPage=12,pages=Math.ceil(entries.length/perPage);
 function wrap(ctx,value,width){const words=String(value).split(/\s+/),lines=[];let line='';for(let word of words){while(ctx.measureText(word).width>width){let count=1;while(count<word.length&&ctx.measureText(word.slice(0,count+1)).width<=width)count++;if(line){lines.push(line);line=''}lines.push(word.slice(0,count));word=word.slice(count)}const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){lines.push(line);line=word}else line=next}if(line)lines.push(line);return lines.length?lines:['Not provided']}
 for(let page=0;page<pages;page++){
  const batch=entries.slice(page*perPage,(page+1)*perPage),c=document.createElement('canvas');c.width=1600;const ctx=c.getContext('2d');ctx.font='26px sans-serif';
  const timers=[...new Set(entries.map(e=>e.timerName.trim()).filter(Boolean))],timerLabel=timers.length===1?'Timer name: '+timers[0]:timers.length>1?'Multiple timers. Timer names are listed with each speech.':'Timer name: Not provided';
  const headingLines=wrap(ctx,timerLabel,1440),headerHeight=250+headingLines.length*34;
  const rows=batch.map(e=>{ctx.font='26px sans-serif';const columns=[wrap(ctx,e.name,310),wrap(ctx,e.category,300),[fmt(e.seconds)],wrap(ctx,entryResult(e),540)];const timerLines=wrap(ctx,'Timer name: '+(e.timerName.trim()||'Not provided'),1400);return {e,columns,timerLines,height:Math.max(...columns.map(x=>x.length))*34+timerLines.length*30+98}});
  c.height=headerHeight+rows.reduce((sum,row)=>sum+row.height,0)+80;
  ctx.fillStyle='#eef3f3';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#213c43';ctx.font='48px Georgia';ctx.fillText('Toasty Timer · Meeting Report',70,78);
  ctx.font='28px sans-serif';ctx.fillText('Meeting date: '+$('reportDate').value,70,132);ctx.font='26px sans-serif';headingLines.forEach((line,i)=>ctx.fillText(line,70,175+i*34));
  ctx.font='bold 22px sans-serif';const titles=['PARTICIPANT','CATEGORY','ACTUAL TIME','RESULT'],positions=[70,420,760,970];titles.forEach((title,i)=>ctx.fillText(title,positions[i],headerHeight-25));
  let y=headerHeight;rows.forEach(({e,columns,timerLines,height},i)=>{ctx.fillStyle=i%2?'#f5f8f8':'#ffffff';ctx.fillRect(50,y-5,1500,height-8);ctx.fillStyle='#213c43';ctx.font='26px sans-serif';columns.forEach((lines,col)=>lines.forEach((line,j)=>ctx.fillText(line,positions[col],y+30+j*34)));const detailY=y+Math.max(...columns.map(x=>x.length))*34+40;ctx.font='22px sans-serif';timerLines.forEach((line,j)=>ctx.fillText(line,70,detailY+j*30));const t=entryTimes(e);ctx.fillText('Allotted: '+fmt(t[0])+'–'+fmt(t[2])+'   Green: '+fmt(t[0])+'   Yellow: '+fmt(t[1])+'   Red: '+fmt(t[2])+'   Grace ends: '+fmt(t[2]+30),70,detailY+timerLines.length*30);y+=height});
  ctx.font='20px sans-serif';ctx.fillText('30-second grace after maximum · Page '+(page+1)+' of '+pages,70,c.height-30);
  c.toBlob(blob=>{if(blob)download(blob,'jpg','-page-'+(page+1));else announce('Image export failed. Please use CSV.')},'image/jpeg',.94);
 }
};
function renderReport(entries){$('reportText').replaceChildren();const intro=document.createElement('p');intro.textContent=`Timer’s report for ${$('reportDate').value}.`; $('reportText').append(intro);entries.forEach(e=>{const p=document.createElement('p'),t=entryTimes(e);p.textContent=`${e.name} — ${e.category}. Allotted time: ${fmt(t[0])} to ${fmt(t[2])}. Actual time: ${fmt(e.seconds)}. ${entryResult(e)}.`;$('reportText').append(p)})}
$('reportDate').onchange=render;
$('date').addEventListener('change',()=>{$('reportDate').value=$('date').value;render()});
$('earlyGrace').onchange=save;
['customG','customY','customR'].forEach(id=>$(id).oninput=()=>{clearTimerError();save();const t=currentTimes();if(t.every(Number.isFinite)&&t[0]>0&&t[0]<t[1]&&t[1]<t[2]){thresholds();paint()}});
$('next').onclick=()=>{elapsed=0;lastState='';$('participant').value='';clearTimerError();setFocusView(false);document.body.classList.remove('speaker-view');$('speaker').setAttribute('aria-pressed','false');save();paint();$('participant').focus();announce('Ready for the next speaker')};
$('newMeeting').onclick=()=>{elapsed=0;$('participant').value='';$('date').value=new Date().toLocaleDateString('en-CA');$('reportDate').value=$('date').value;save();paint();render();$('date').focus();announce('Meeting setup ready. Select the meeting date. Existing records are retained.')};
$('speaker').onclick=()=>{const enabled=!document.body.classList.contains('speaker-view');document.body.classList.toggle('speaker-view',enabled);$('speaker').setAttribute('aria-pressed',String(enabled));setFocusView(true)};
let focusScroll=0;
function setFocusView(enabled){
 const timer=$('timer'),button=$('fullscreen');
 if(enabled&&!document.body.classList.contains('focus-view'))focusScroll=window.scrollY;if(!enabled){document.body.classList.remove('speaker-view');$('speaker').setAttribute('aria-pressed','false')}
 document.body.classList.toggle('focus-view',enabled);
 document.querySelectorAll('header,.intro,.meeting,.guide,.logs,.app-tools,footer,.skip').forEach(el=>{el.inert=enabled;});
 button.textContent=enabled?'Exit focus view ✕':'Focus view ↗';
 button.setAttribute('aria-pressed',String(enabled));
 if(enabled){timer.scrollTop=0;button.focus();}else{window.scrollTo(0,focusScroll);button.focus();}
 announce(enabled?'Focus view opened. Press Escape or Exit focus view to return.':'Focus view closed.');
}
$('fullscreen').setAttribute('aria-pressed','false');
$('fullscreen').onclick=()=>setFocusView(!document.body.classList.contains('focus-view'));
document.addEventListener('keydown',event=>{
 if(!document.body.classList.contains('focus-view'))return;
 if(event.key==='Escape'){event.preventDefault();setFocusView(false);return;}
 if(event.key==='Tab'){
  const items=Array.from($('timer').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled)')).filter(el=>el.getClientRects().length);
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});

let wakeLock=null,wakeRequestPending=false;
$('keepAwake').checked=tmMeetingInfo.keepAwake!==false;
async function acquireWakeLock(){
 if(!running||!$('keepAwake').checked||document.visibilityState==='hidden'||wakeRequestPending||wakeLock)return;
 if(!navigator.wakeLock){$('wakeStatus').textContent='Keep awake is unavailable in this browser. Keep the screen unlocked during speeches.';return}
 wakeRequestPending=true;
 try{const sentinel=await navigator.wakeLock.request('screen');if(!running||!$('keepAwake').checked){await sentinel.release();return}wakeLock=sentinel;$('wakeStatus').textContent='Screen stays awake while this timer is visible.';sentinel.addEventListener('release',()=>{if(wakeLock===sentinel)wakeLock=null;if(running)$('wakeStatus').textContent='Screen lock released. Keep this app visible to continue.'})}
 catch{$('wakeStatus').textContent='Keep awake could not be enabled. Check your screen-lock settings.'}finally{wakeRequestPending=false}
}
function releaseWakeLock(){const sentinel=wakeLock;wakeLock=null;if(sentinel)sentinel.release().catch(()=>{});$('wakeStatus').textContent=''}
$('keepAwake').onchange=()=>{save();if($('keepAwake').checked)acquireWakeLock();else releaseWakeLock()};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){paint();if(running)acquireWakeLock()}});
function validateBackup(data){
 if(!data||data.format!=='toasty-timer-backup'||data.version!==1||!Array.isArray(data.entries)||data.entries.length>10000)throw Error('Choose a Toasty Timer backup JSON file.');
 return data.entries.map(entry=>{
  if(!entry||typeof entry.name!=='string'||!entry.name.trim()||entry.name.length>100||typeof entry.timerName!=='string'||entry.timerName.length>100||typeof entry.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)||!Object.hasOwn(categories,entry.category)||!Number.isSafeInteger(entry.seconds)||entry.seconds<0||!(typeof entry.id==='number'||typeof entry.id==='string'))throw Error('This backup contains an invalid meeting entry.');
  const times=entry.times||categories[entry.category];if(!Array.isArray(times)||times.length!==3||!validTimes(times))throw Error('This backup contains invalid timing thresholds.');
  return {id:entry.id,name:entry.name,category:entry.category,date:entry.date,timerName:entry.timerName,seconds:entry.seconds,times:times.slice(),earlyGrace:!!entry.earlyGrace};
 });
}
$('backup').onclick=()=>{const content={format:'toasty-timer-backup',version:1,createdAt:new Date().toISOString(),meetingInfo:tmMeetingInfo,entries:pmTimerV5.entries};download(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}),'json','-backup');$('backupStatus').textContent='Backup downloaded. Store it somewhere safe.'};
$('restore').onclick=()=>{if(!running)$('restoreFile').click()};
$('restoreFile').onchange=async()=>{
 const file=$('restoreFile').files[0];if(!file)return;if(running){$('backupStatus').textContent='Stop the timer before restoring a backup.';return}
 try{if(file.size>8*1024*1024)throw Error('Choose a backup smaller than 8 MB.');const entries=validateBackup(JSON.parse(await file.text())),existing=new Set(pmTimerV5.entries.map(e=>String(e.id)));let added=0;entries.forEach(e=>{if(!existing.has(String(e.id))){pmTimerV5.entries.push(e);existing.add(String(e.id));added++}});save();render();$('backupStatus').textContent=added+' meeting entries restored. Select a report date to view them.';announce($('backupStatus').textContent)}
 catch(error){$('backupStatus').textContent=error.message||'The backup could not be read.'}finally{$('restoreFile').value=''}
};
let installPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event});
$('installApp').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null}else $('installHelp').hidden=!$('installHelp').hidden};
window.addEventListener('appinstalled',()=>{$('installApp').hidden=true;announce('Toasty Timer installed')});
if(window.matchMedia('(display-mode: standalone)').matches)$('installApp').hidden=true;
if('serviceWorker' in navigator&&window.isSecureContext){
 navigator.serviceWorker.register('sw.js').then(async registration=>{await navigator.serviceWorker.ready;$('offlineStatus').textContent='Offline timer ready. Open once online to save the app on this device.';if(registration.waiting)announce('An app update is ready. Reload when convenient.')}).catch(()=>{$('offlineStatus').textContent='Offline setup could not finish. Reopen while connected to try again.'});
}else $('offlineStatus').textContent='Installation and offline support require the secure HTTPS website.';
window.addEventListener('offline',()=>{$('offlineStatus').textContent='You are offline. Timing and saved records still work if offline setup completed.'});
window.addEventListener('online',()=>{$('offlineStatus').textContent='You are online.'});
if(running)acquireWakeLock();

$('customTiming').hidden=$('category').value!=='Custom';if($('category').value==='Custom')$('timingSettings').open=true;['participant','customG','customY','customR'].forEach(id=>$(id).addEventListener('keydown',event=>{if(event.key==='Enter'&&!running){event.preventDefault();$('start').click()}}));setInterval(paint,200);thresholds();lock();paint();render();save();
