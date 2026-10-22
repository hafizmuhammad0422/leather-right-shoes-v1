const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../factory-sale.js'),'utf8');
const start=source.indexOf('/* Factory Sale delivery vouchers: isolated directory and immutable saved snapshots. */');
const end=source.indexOf('let factorySaleManualSaving=false;',start);
assert(start>=0&&end>start,'Factory Sale delivery block must exist');
const block=source.slice(start,end);
const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const shops=[{id:'atom-shop',name:'علی جوتے',unit:'ATOM'},{id:'set-shop',name:'احمد شوز',unit:'SET'}];
const voucher=id=>({id,date:'2026-10-21T10:30:00Z',lines:[{shopkeeperId:'atom-shop',shopkeeperName:'علی جوتے',qty:12,unit:'ATOM'}]});
function setup(initial={}){
  let raw=copy(initial),saved=copy(initial),result=true,gate=null,started=()=>{},serial=0,lostAck=false;
  const fields={},messages=[],html=[],calls={critical:0,reconcile:0,publish:0,print:[]},rows=[];
  const ctx=vm.createContext({settings:copy(initial)||{},writeDepth:0,console,Date,Number,Set,uid:()=> 'delivery-'+(++serial),esc:escape,factoryReadName:id=>fields[id]?.value||'',toast:message=>messages.push(message),closeModal(){},printFinishedMansHtml(...args){calls.print.push(copy(args));},
    factorySaleServices:{read:()=>raw,exists:()=>raw!==undefined,common:()=>({factoryName:'Leather Right',address:'Lahore'}),publish:value=>{calls.publish++;raw=value;},restore:(value,exists)=>{raw=exists?value:undefined;},critical:async()=>{calls.critical++;started();if(gate)await gate;if(result===true||lostAck)saved=copy(raw);if(result instanceof Error)throw result;return result;}},
    reconcileCloudAfterCriticalRollback:async()=>{assert.equal(ctx.writeDepth,0,'Authoritative reload must run after writeDepth unlocks');calls.reconcile++;raw=copy(saved);return true;},
    modal(markup){
      html.push(markup);for(const field of Object.values(fields))field.isConnected=false;for(const key of Object.keys(fields))delete fields[key];rows.length=0;
      for(const match of markup.matchAll(/<(?:input|select|button|tbody)\b[^>]*\bid="([^"]+)"[^>]*>/g))fields[match[1]]={value:'',disabled:/\bdisabled\b/.test(match[0]),isConnected:true,textContent:''};
      if(fields.fsDeliveryShopUnit)fields.fsDeliveryShopUnit.value='ATOM';
      for(const match of markup.matchAll(/<tr data-fs-delivery-shop="([^"]+)">([\s\S]*?)<\/tr>/g)){
        const controls={selected:{checked:/\bchecked\b/.test(match[2])},qty:{value:'',disabled:/data-fs-delivery-qty[^>]*\bdisabled\b/.test(match[2]),focus(){}}};
        rows.push({dataset:{fsDeliveryShop:match[1]},controls,querySelector:selector=>selector.includes('selected')?controls.selected:controls.qty});
      }
      if(fields.fsDeliveryRows)fields.fsDeliveryRows.querySelectorAll=()=>rows;
    },document:{getElementById:id=>fields[id],querySelectorAll:()=>[]}
  });
  vm.runInContext(block,ctx);
  return {ctx,fields,rows,html,messages,calls,read:()=>raw,saved:()=>copy(saved),result:value=>{result=value;},lostAck:()=>{lostAck=true;result=false;},hold(){gate=new Promise(resolve=>this.release=resolve);return new Promise(resolve=>{started=resolve;});}};
}
test('Delivery saves append isolated fields and preserve raw existing records across reload',async()=>{
  const original={shopkeepers:[{id:'old',stock:81,balance:250,history:[{qty:4}]}],articles:[{id:'article',rate:300}],billing:{bills:[{id:'bill',amount:1200}]},dispatchVoucherFields:{legacy:{show:false}},manualBills:[{id:'manual'}],customRaw:{keep:null}};
  const h=setup(original),before=copy(h.read());
  h.ctx.settings.shopkeepers=[];h.ctx.settings.normalizedOnly=true;
  assert.equal(await h.ctx.factorySaleDeliveryStore('deliveryShopkeepers',shops[0]),true);
  assert.equal(await h.ctx.factorySaleDeliveryStore('deliveryVouchers',voucher('voucher-1')),true);
  const after=copy(h.read());delete after.deliveryShopkeepers;delete after.deliveryVouchers;
  assert.deepEqual(after,before);
  const reload=setup(h.saved());
  assert.deepEqual(copy(reload.ctx.factorySaleDeliveryData('deliveryShopkeepers')),[shops[0]]);
  assert.deepEqual(copy(reload.ctx.factorySaleDeliveryData('deliveryVouchers')),[voucher('voucher-1')]);
  assert.equal(h.calls.critical,2);assert.equal(h.ctx.writeDepth,0);
});
test('Delivery saves create a missing Factory Sale namespace without requiring legacy records',async()=>{
  const h=setup(undefined);
  // Explicit undefined bypasses the helper default to represent an absent namespace.
  h.ctx.factorySaleServices.restore(undefined,false);
  assert.equal(await h.ctx.factorySaleDeliveryStore('deliveryShopkeepers',shops[0]),true);
  assert.deepEqual(copy(h.read()),{factoryName:'Leather Right',address:'Lahore',deliveryShopkeepers:[shops[0]]});
});
test('False and thrown saves restore old data, remove new fields, and permit one retry',async()=>{
  for(const result of [false,new Error('offline')]){
    const h=setup({deliveryShopkeepers:shops,manualBills:[{id:'keep'}]});h.result(result);
    const before=copy(h.read());assert.equal(await h.ctx.factorySaleDeliveryStore('deliveryVouchers',voucher('retry')),false);
    assert.deepEqual(copy(h.read()),before);assert.equal(Object.hasOwn(h.ctx.settings,'deliveryVouchers'),false);assert.equal(h.ctx.writeDepth,0);assert.equal(h.calls.reconcile,1);
    h.result(true);assert.equal(await h.ctx.factorySaleDeliveryStore('deliveryVouchers',voucher('retry')),true);
    assert.equal(h.read().deliveryVouchers.length,1);assert.equal(h.calls.critical,2);
  }
});
test('A failed first save preserves an absent Factory Sale namespace',async()=>{
  const h=setup();h.ctx.factorySaleServices.restore(undefined,false);h.result(false);
  // Reconciliation represents the authoritative missing namespace too.
  h.ctx.reconcileCloudAfterCriticalRollback=async()=>h.ctx.factorySaleServices.restore(undefined,false);
  assert.equal(await h.ctx.factorySaleDeliveryStore('deliveryShopkeepers',shops[0]),false);
  assert.equal(h.read(),undefined);assert.equal(Object.hasOwn(h.ctx.settings,'deliveryShopkeepers'),false);
});
test('An in-flight save blocks duplicate and cross-form writes; same draft retries never append twice',async()=>{
  const h=setup({deliveryShopkeepers:shops}),started=h.hold(),first=h.ctx.factorySaleDeliveryStore('deliveryVouchers',voucher('once'));
  await started;assert.equal(h.ctx.writeDepth,1);
  assert.equal(await h.ctx.factorySaleDeliveryStore('deliveryVouchers',voucher('once')),false);
  assert.equal(await h.ctx.factorySaleDeliveryStore('deliveryShopkeepers',{id:'another',name:'Another',unit:'ATOM'}),false);
  h.release();assert.equal(await first,true);
  assert.equal(await h.ctx.factorySaleDeliveryStore('deliveryVouchers',voucher('once')),true);
  assert.equal(h.calls.critical,1);assert.equal(h.calls.publish,1);assert.equal(h.read().deliveryVouchers.length,1);assert.equal(h.ctx.writeDepth,0);
});
test('Lost acknowledgement reconciles the committed draft and subsequent retry remains idempotent',async()=>{
  const h=setup({deliveryShopkeepers:shops});h.lostAck();
  assert.equal(await h.ctx.factorySaleDeliveryStore('deliveryVouchers',voucher('accepted')),true);
  assert.equal(h.calls.reconcile,1);assert.equal(h.read().deliveryVouchers.length,1);
  assert.equal(await h.ctx.factorySaleDeliveryStore('deliveryVouchers',voucher('accepted')),true);
  assert.equal(h.calls.critical,1);assert.equal(h.read().deliveryVouchers.length,1);
});
test('Voucher lines snapshot each selected Shopkeeper name and its saved Unit',()=>{
  const h=setup(),directory=copy(shops),lines=h.ctx.factorySaleDeliveryLines([{shopkeeperId:'atom-shop',qty:'1.25'},{shopkeeperId:'set-shop',qty:'2'}],directory);
  assert.deepEqual(copy(lines),[{shopkeeperId:'atom-shop',shopkeeperName:'علی جوتے',qty:1.25,unit:'ATOM'},{shopkeeperId:'set-shop',shopkeeperName:'احمد شوز',qty:2,unit:'SET'}]);
  directory[0].name='Changed';directory[0].unit='SET';assert.equal(lines[0].shopkeeperName,'علی جوتے');assert.equal(lines[0].unit,'ATOM');
});
test('Voucher validation rejects missing or repeated Shopkeepers, invalid Units and unsafe quantities',()=>{
  const h=setup(),lines=h.ctx.factorySaleDeliveryLines;
  assert.throws(()=>lines([],shops));assert.throws(()=>lines([{shopkeeperId:'missing',qty:1}],shops));
  assert.throws(()=>lines([{shopkeeperId:'atom-shop',qty:1},{shopkeeperId:'atom-shop',qty:2}],shops));
  assert.throws(()=>lines([{shopkeeperId:'atom-shop',qty:1}],[{...shops[0],unit:'ATOMS'}]));
  for(const qty of ['',0,-1,'wrong',Infinity,'0.0000001',Number.MAX_SAFE_INTEGER])assert.throws(()=>lines([{shopkeeperId:'atom-shop',qty}],shops));
  assert.throws(()=>lines([{shopkeeperId:'a',qty:5000000000},{shopkeeperId:'b',qty:5000000000}],[{id:'a',unit:'ATOM'},{id:'b',unit:'ATOM'}]));
});
test('Delivery totals retain fractional precision and keep ATOM and SET separate',()=>{
  const h=setup();assert.deepEqual(copy(h.ctx.factorySaleDeliveryTotals([{qty:0.1,unit:'ATOM'},{qty:0.2,unit:'ATOM'},{qty:0.000001,unit:'SET'},{qty:2,unit:'SET'}])),{ATOM:0.3,SET:2.000001});
});
test('Thermal voucher uses the weekly layout with Urdu headers, escaped names and separate Unit totals',()=>{
  const h=setup(),saved={...voucher('print'),addaName:'رحمان <em>اڈہ</em>'};saved.lines.push({shopkeeperId:'set-shop',shopkeeperName:'احمد <script>alert(1)</script>',qty:3,unit:'SET'});
  const markup=h.ctx.factorySaleDeliveryVoucherHtml(saved);
  for(const text of ['LEATHER RIGHT SHOES BY ABID','آج ڈیلیور کیا گیا مال','تمام دکاندار','دکاندار کا نام','بھیجا گیا مال','کل بھیجا گیا مال','کل دکاندار','کل ایٹم','کل سیٹ','12 ایٹم','3 سیٹ'])assert(markup.includes(text),text);
  assert.doesNotMatch(markup,/[\u0660-\u0669\u06f0-\u06f9]/);
  assert.match(markup,/width:80mm/);assert.match(markup,/lang="ur" dir="rtl"/);assert.match(markup,/class="fs-delivery-weekly-voucher"/);assert.match(markup,/<bdi dir="auto">علی جوتے<\/bdi>/);
  const header=markup.match(/<thead>([\s\S]*?)<\/thead>/)[1];assert.equal((header.match(/<th\b/g)||[]).length,2);assert.doesNotMatch(header,/نمبر|دن|وصول آئٹمز/);
  assert.match(markup,/اکتوبر 2026/);assert.match(markup,/صبح|شام/);
  assert(markup.includes('رحمان &lt;em&gt;اڈہ&lt;/em&gt;'));assert(!markup.includes('<em>'));
  assert(markup.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert(!markup.includes('<script>'));
  assert.doesNotMatch(markup,/\b(?:Article|Rate|Price|Amount|ATOM|SET)\b|FINISH MAN WEEKLY VOUCHER|Asad Ali/i);
});
test('Failed voucher UI save preserves Adda, Shopkeepers and quantities; retry saves Adda across reload',async()=>{
  const h=setup({deliveryShopkeepers:shops});h.result(false);h.ctx.factorySaleDeliveryEditor('set-shop');
  assert.equal(h.rows[1].controls.selected.checked,true);assert.equal(h.rows[1].controls.qty.disabled,false);assert(h.html[0].includes('<strong data-fs-delivery-unit>SET</strong>'));
  const addaInput=h.html[0].match(/<input\b[^>]*\bid="fsDeliveryAddaName"[^>]*>/)[0];assert.match(addaInput,/lang="ur"/);assert.match(addaInput,/dir="rtl"/);assert(h.html[0].includes('اڈے کا نام'));
  h.fields.fsDeliveryAddaName.value='  رحمان اڈہ  ';h.rows[1].controls.qty.value='2.125';h.rows[0].controls.selected.checked=true;h.rows[0].controls.qty.value='12';
  await h.fields.fsDeliverySave.onclick();
  assert.equal(h.html.length,1);assert.equal(h.fields.fsDeliveryAddaName.value,'  رحمان اڈہ  ');assert.equal(h.rows[1].controls.selected.checked,true);assert.equal(h.rows[1].controls.qty.value,'2.125');assert.equal(h.rows[0].controls.qty.value,'12');assert.equal(h.fields.fsDeliverySave.disabled,false);assert.equal(h.read().deliveryVouchers,undefined);
  h.result(true);await h.fields.fsDeliverySave.onclick();
  assert.equal(h.read().deliveryVouchers.length,1);assert.equal(h.read().deliveryVouchers[0].lines.length,2);assert.equal(h.html.length,2);assert(h.html[1].includes('آج ڈیلیور کیا گیا مال'));
  const reload=setup(h.saved()),saved=reload.ctx.factorySaleDeliveryData('deliveryVouchers')[0];assert.equal(saved.addaName,'رحمان اڈہ');
  assert.deepEqual(copy(saved.lines),[{shopkeeperId:'atom-shop',shopkeeperName:'علی جوتے',qty:12,unit:'ATOM'},{shopkeeperId:'set-shop',shopkeeperName:'احمد شوز',qty:2.125,unit:'SET'}]);
  reload.ctx.factorySaleDeliveryView(saved.id);assert(reload.html[0].includes('رحمان اڈہ'));
});
test('Legacy voucher without Adda still opens and prints without changing saved records',()=>{
  const original={deliveryShopkeepers:shops,deliveryVouchers:[voucher('legacy')],manualBills:[{id:'keep',amount:450}],customRaw:{keep:null}},h=setup(original);
  h.ctx.factorySaleDeliveryView('legacy');assert(h.html[0].includes('تمام دکاندار'));assert.doesNotMatch(h.html[0],/undefined|NaN/);
  const render=h.ctx.factorySaleDeliveryVoucherHtml,markup=render(original.deliveryVouchers[0]);let renders=0;
  h.ctx.factorySaleDeliveryVoucherHtml=saved=>{renders++;return render(saved);};
  h.fields.fsDeliveryPrint.onclick();h.fields.fsDeliveryPrint.onclick();assert.equal(renders,2);
  assert.deepEqual(h.calls.print,[[markup,'آج ڈیلیور کیا گیا مال'],[markup,'آج ڈیلیور کیا گیا مال']]);
  assert.deepEqual(copy(h.read()),original);assert.deepEqual(h.saved(),original);assert.equal(h.calls.critical,0);assert.equal(h.calls.publish,0);
});
test('Failed Shopkeeper UI save preserves name and Unit for a stable-id retry',async()=>{
  const h=setup({deliveryShopkeepers:[]});h.result(false);h.ctx.factorySaleDeliveryShopkeeperModal();
  h.fields.fsDeliveryShopName.value='نیا دکاندار';h.fields.fsDeliveryShopUnit.value='SET';await h.fields.fsDeliveryShopSave.onclick();
  assert.equal(h.html.length,1);assert.equal(h.fields.fsDeliveryShopName.value,'نیا دکاندار');assert.equal(h.fields.fsDeliveryShopUnit.value,'SET');assert.equal(h.fields.fsDeliveryShopSave.disabled,false);
  h.result(true);await h.fields.fsDeliveryShopSave.onclick();
  assert.deepEqual(copy(h.read().deliveryShopkeepers),[{id:'delivery-1',name:'نیا دکاندار',unit:'SET'}]);assert.equal(h.rows[0].controls.selected.checked,true);
});
