/* Factory Sale: isolated duplicate of Shoe Sole Suppliers. No supplier data is imported. */
const factorySaleServices={
  read:()=>settings.factorySale,
  common:()=>({factoryName:settings.factoryName,address:settings.address,receiptFooter:settings.receiptFooter,thankYou:settings.thankYou}),
  exists:()=>Object.prototype.hasOwnProperty.call(settings,'factorySale'),
  publish:value=>{settings={...settings,factorySale:value};},
  restore:(value,exists)=>{const next={...settings};if(exists)next.factorySale=value;else delete next.factorySale;settings=next;},
  critical:()=>saveCriticalCloudState(),persist:()=>persistAll(),reconcile:()=>reconcileCloudAfterCriticalRollback(),navigate:(...args)=>goto(...args),render:()=>render(),back:()=>goBack()
};
const factorySaleModule=(()=>{
let settings={},currentPage='factorySale',writeDepth=0;
const ui={},window=new Proxy(globalThis.window,{get(target,key){if(String(key).startsWith('__'))return ui[key];const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;},set(target,key,value){if(String(key).startsWith('__')){ui[key]=value;return true;}return Reflect.set(target,key,value);}});
function load(){if(writeDepth)return;settings=JSON.parse(JSON.stringify(factorySaleServices.read()||factorySaleServices.common()));normalizeShoeSoleSuppliers();normalizeShoeSoleReceiveVoucherFields();}
function persistAll(){factorySaleServices.publish(JSON.parse(JSON.stringify(settings)));return factorySaleServices.persist();}
async function saveCriticalCloudState(){const previous=factorySaleServices.read(),existed=factorySaleServices.exists();writeDepth++;factorySaleServices.publish(JSON.parse(JSON.stringify(settings)));try{const ok=await factorySaleServices.critical();if(!ok)factorySaleServices.restore(previous,existed);return ok;}catch(error){factorySaleServices.restore(previous,existed);throw error;}finally{writeDepth--;}}
function reconcileCloudAfterCriticalRollback(){return factorySaleServices.reconcile();}
function goto(...args){return factorySaleServices.navigate(...args);}function render(){return factorySaleServices.render();}function goBack(){return factorySaleServices.back();}
function getUpperWorkWeekRange(baseDate=new Date()){const start=new Date(baseDate);start.setHours(0,0,0,0);start.setDate(start.getDate()-(start.getDay()+1)%7);const end=new Date(start);end.setDate(end.getDate()+6);return {start,end};}
function upperLocalDateKey(date){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
const FACTORY_SALE_CSS="<style id=\"fs_sole-shopkeeper-dynamic-layout\">\n@media screen{\n  body:has(.fs_sole-shopkeeper-page) #topFactoryName{color:var(--ink);}\n  .fs_sole-shopkeeper-page{min-width:0;}\n  .fs_sole-shopkeeper-page .card{padding:10px!important;margin:0 0 8px!important;}\n  .fs_sole-shopkeeper-page h3{font-size:15px;margin:0 0 8px;}\n  .fs_sole-shopkeeper-page .fs_sole-shopkeeper-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap;}\n  .fs_sole-shopkeeper-page .fs_sole-shopkeeper-actions h3{margin:0;}\n  .fs_sole-shopkeeper-page .btn{min-height:32px;padding:5px 9px;font-size:11px;}\n  .fs_sole-shopkeeper-page .fs_sole-shopkeeper-grid{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px;}\n  .fs_sole-shopkeeper-page .fs_sole-shopkeeper-grid>.empty{grid-column:1/-1;}\n  .fs_sole-shopkeeper-page .fs_sole-shopkeeper-card{min-width:0;min-height:88px;padding:7px 4px;border:2px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;font-family:inherit;}\n  .fs_sole-shopkeeper-page .fs_sole-shopkeeper-card.selected{border-color:var(--brass);background:#edf7ef;}\n  .fs_sole-shopkeeper-page .fs_sole-shopkeeper-card strong{font-size:11px;max-width:100%;overflow-wrap:anywhere;}\n  .fs_sole-shopkeeper-page .fs_sole-shopkeeper-card span{font-size:10px;}\n  .fs_sole-shopkeeper-page .fs_sole-shopkeeper-completed{color:#23785c;font-weight:800;}\n  .fs_sole-shopkeeper-page .fs_sole-entry-heading{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:7px;}\n  .fs_sole-shopkeeper-page .fs_sole-entry-heading h3{margin:0;}\n  .fs_sole-shopkeeper-page .fs_sole-dispatch-entry{display:grid;grid-template-columns:minmax(130px,.8fr) minmax(0,2fr) minmax(90px,1fr) auto;gap:7px;align-items:end;}\n  .fs_sole-shopkeeper-page .fs_sole-dispatch-entry label{display:block;font-size:11px;margin:0 0 3px;}\n  .fs_sole-shopkeeper-page .fs_sole-dispatch-entry input,.fs_sole-shopkeeper-page .fs_sole-dispatch-entry select{height:34px;padding:5px 7px;font-size:12px;}\n  .fs_sole-shopkeeper-page .fs_sole-entry-hint{font-size:12px;margin-top:7px;}\n  .fs_sole-shopkeeper-page .fs_sole-dispatch-today{overflow-x:auto;}\n  .fs_sole-shopkeeper-page .fs_sole-dispatch-today table{min-width:660px!important;table-layout:auto!important;}\n  .fs_sole-shopkeeper-page .fs_sole-dispatch-today th,.fs_sole-shopkeeper-page .fs_sole-dispatch-today td{padding:5px 6px;font-size:11px;}\n  @media(max-width:1100px){.fs_sole-shopkeeper-page .fs_sole-shopkeeper-grid{grid-template-columns:repeat(5,minmax(0,1fr));}}\n  @media(max-width:700px){\n    .fs_sole-shopkeeper-page .fs_sole-shopkeeper-grid{grid-template-columns:repeat(2,minmax(0,1fr));}\n    .fs_sole-shopkeeper-page .fs_sole-dispatch-entry{grid-template-columns:1fr;}\n    .fs_sole-shopkeeper-page .fs_sole-dispatch-entry input,.fs_sole-shopkeeper-page .fs_sole-dispatch-entry select{height:42px;font-size:16px;}\n    .fs_sole-shopkeeper-page .btn{min-height:40px;}\n  }\n}\n</style><style>  .fs_sss-item-cell{font-size:11px;line-height:1.15;text-align:center;border:1px solid var(--line);border-radius:7px;padding:10px 3px;min-height:88px;height:88px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;}.fs_sss-item-cell span{font-size:10px!important;font-weight:900!important;letter-spacing:.3px;line-height:1.15;}.fs_sss-item-cell strong{font-size:15px;line-height:1.2;white-space:nowrap;}.fs_sss-item-opening{background:#f4f1e8;cursor:pointer;}.fs_sss-item-new{background:#edf5ef;color:#2f6d4f;}.fs_sss-item-pay{background:#eef4fb;color:#315b86;cursor:pointer;font:inherit;}.fs_sss-item-remaining{background:#fff7e8;color:#7b5b18;}.fs_sss-item-advance{background:#f7eef8;color:#74457b;}\n  .fs_sss-product-list{display:grid;gap:4px;width:100%;}.fs_sss-product-row{min-width:0;}.fs_sss-product-row .btn{white-space:nowrap;}.fs_sss-product-photo img{width:100%;height:100%;object-fit:cover;}\n  @media(max-width:700px){.fs_sss-product-list{overflow-x:hidden;}.fs_sss-product-row{grid-template-columns:34px minmax(0,1fr) minmax(48px,.65fr) minmax(72px,.9fr)!important;gap:5px!important;padding:4px!important;}.fs_sss-product-photo{width:34px!important;height:34px!important;}.fs_sss-product-row .btn{padding:4px 6px!important;font-size:10px!important;}.fs_sss-product-row>div:nth-child(2) div:first-child{font-size:12px;}.fs_sss-product-row>div:nth-child(2) div:last-child,.fs_sss-product-row>div:nth-child(3) div:last-child,.fs_sss-product-row>div:nth-child(4) div:last-child{font-size:8px!important;}.fs_sss-product-row>div:last-child{grid-column:2/-1;justify-content:flex-start!important;}}\n  @media(max-width:430px){.fs_sss-product-row{grid-template-columns:32px minmax(0,1fr) minmax(55px,.8fr)!important;}.fs_sss-product-row>div:nth-child(4){grid-column:2/-1;}.fs_sss-product-row>div:last-child{grid-column:2/-1;}}</style>";
function normalizeShoeSoleSuppliers(){
  // Dynamic shopkeepers keep their identities, nested records and live object references.
  if(!Array.isArray(settings.shopkeepers)) settings.shopkeepers=[];
  return settings.shopkeepers;
}
const SHOE_SOLE_RECEIVE_VOUCHER_FIELDS = [
  {id:'shopkeeperName',label:'Shopkeeper Name',builtin:true},
  {id:'voucherNo',label:'Voucher Number',builtin:true},
  {id:'date',label:'Date',builtin:true},
  {id:'time',label:'Time',builtin:true},
  {id:'articleName',label:'Article Name',builtin:true},
  {id:'atoms',label:'Sent Quantity',builtin:true},
  {id:'totalAtoms',label:'Total Quantity',builtin:true},
  {id:'receivingSummary',label:'Dispatch Summary',builtin:true}
];
function normalizeShoeSoleReceiveVoucherFields(){
  const current = settings.dispatchVoucherFields && typeof settings.dispatchVoucherFields==='object'
    ? settings.dispatchVoucherFields : {};
  const removed = new Set(Array.isArray(settings.dispatchVoucherRemovedBuiltins) ? settings.dispatchVoucherRemovedBuiltins.map(String) : []);
  const next = {};
  SHOE_SOLE_RECEIVE_VOUCHER_FIELDS.forEach(f=>{
    if(removed.has(f.id)) return;
    const src=current[f.id] && typeof current[f.id]==='object' ? current[f.id] : {};
    next[f.id] = {
      show: src.show!==false,
      label: String(src.label || f.label),
      bold: src.bold===true,
      builtin:true
    };
  });
  Object.keys(current).forEach(id=>{
    const src=current[id];
    if(src && src.custom && !SHOE_SOLE_RECEIVE_VOUCHER_FIELDS.some(f=>f.id===id)){
      next[id]={show:src.show!==false,label:String(src.label||'Custom Field'),value:String(src.value||''),bold:src.bold===true,custom:true};
    }
  });
  settings.dispatchVoucherFields = next;
  settings.dispatchVoucherRemovedBuiltins = Array.from(removed).filter(id=>SHOE_SOLE_RECEIVE_VOUCHER_FIELDS.some(f=>f.id===id));
}
function getShoeSoleSuppliers(){
  return normalizeShoeSoleSuppliers();
}

function shoeSoleSupplierDisplayName(shopkeeper, index){
  return (shopkeeper && shopkeeper.name) ? shopkeeper.name : `Shopkeeper ${index+1}`;
}

function shoeSoleProductDisplayUnit(product){
  const unit=String(product?.unit||'Box');
  return unit==='Custom' ? (String(product?.customUnit||'Custom')||'Custom') : unit;
}
function shoeSolePurchaseItems(purchase){
  const direct=Number(purchase?.items);
  if(Number.isFinite(direct) && direct>=0) return direct;
  return Math.max(0,Number(purchase?.boxes)||0);
}
function shoeSoleProductStockItems(product){
  const direct=Number(product?.stockItems);
  if(Number.isFinite(direct) && direct>=0) return direct;
  return Math.max(0,Number(product?.stockBoxes)||0);
}
function shoeSoleProductStockDisplay(product){
  const items=shoeSoleProductStockItems(product);
  return `${Math.round(items*100)/100} Items`;
}
function shoeSoleProductAtomBalanceForSupplier(shopkeeper,product){
  const dispatches=(Array.isArray(shopkeeper?.dispatches)?shopkeeper.dispatches:[]).filter(p=>String(p.articleId||'')===String(product?.id||''));
  const stored=(product?.atomBalance&&typeof product.atomBalance==='object')?product.atomBalance:(product?.itemBalance&&typeof product.itemBalance==='object'?product.itemBalance:{});
  const opening=Math.max(0,Number(stored.openingAtom ?? stored.openingItem)||0);
  const settledIds=new Set(Array.isArray(stored.settledPurchaseIds)?stored.settledPurchaseIds.map(String):[]);
  // New Atoms are only dispatch records that have not already been settled.
  // The dispatch quantity is used exactly as saved; there is no box/pack/carton conversion.
  const newAtom=dispatches.filter(p=>!settledIds.has(String(p.id))).reduce((sum,p)=>{
    const n=Number(p.atoms ?? p.items);
    return sum+(Number.isFinite(n)&&n>=0?n:0);
  },0);
  const advance=Math.max(0,Number(stored.advanceAtom ?? stored.advanceItem)||0);
  const remaining=Math.max(0,opening+newAtom);
  return {
    opening,
    newAtom,
    pay:0,
    remaining,
    advance,
    settledPurchaseIds:Array.from(settledIds)
  };
}
function shoeSoleQuantityDisplay(value){if(typeof value==='string'&&!Number.isFinite(Number(value)))return value;const n=Number(value)||0;return Number.isInteger(n)?String(n):String(Math.round(n*100)/100);}
function openShoeSoleProductAtomOpeningModal(supplierIndex,articleId){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex],product=factorySaleShopArticles(shopkeeper).find(p=>String(p.id)===String(articleId)); if(!shopkeeper||!product)return;
  const b=shoeSoleProductAtomBalanceForSupplier(shopkeeper,product);
  modal(`<h3>${esc(product.name)} — Opening Atoms</h3><label>Opening Atoms</label><input id="fs_ssAtomOpeningOnly" type="number" min="0" step="any" value="${b.opening}"><div style="font-size:12px;color:var(--muted);margin-top:8px;">یہ quantity صرف اسی Article کے Opening Atoms کو تبدیل کرے گی۔</div><div class="modal-actions"><button type="button" class="btn brass" id="fs_ssAtomOpeningSave">Save</button><button type="button" class="btn ghost" id="fs_ssAtomOpeningCancel">Cancel</button></div>`);
  document.getElementById('fs_ssAtomOpeningCancel').onclick=closeModal;
  document.getElementById('fs_ssAtomOpeningSave').onclick=()=>{const value=Math.max(0,Number(document.getElementById('fs_ssAtomOpeningOnly').value)||0);const existing=(product.atomBalance&&typeof product.atomBalance==='object')?product.atomBalance:{};product.atomBalance={...existing,openingAtom:value,settledPurchaseIds:Array.isArray(existing.settledPurchaseIds)?existing.settledPurchaseIds:[]};persistAll();closeModal();render();toast(`${product.name} Opening Atoms saved`);};
}
function openShoeSoleProductAtomPayModal(supplierIndex,articleId){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex];
  const product=factorySaleShopArticles(shopkeeper).find(p=>String(p.id)===String(articleId));
  if(!shopkeeper||!product)return;
  const b=shoeSoleProductAtomBalanceForSupplier(shopkeeper,product);
  const payable=Math.max(0,b.opening+b.newAtom);

  modal(`<h3>${esc(product.name)} — Pay Atoms</h3>
    <div style="display:grid;gap:5px;font-size:13px;margin-bottom:10px;">
      <div>Opening Atoms: <strong>${shoeSoleQuantityDisplay(b.opening)}</strong></div>
      <div>New Atoms: <strong>${shoeSoleQuantityDisplay(b.newAtom)}</strong></div>
      <div>Total Payable: <strong>${shoeSoleQuantityDisplay(payable)} Atoms</strong></div>
    </div>
    <label>Pay Atoms</label>
    <input id="fs_ssAtomPayOnly" type="number" min="0" step="any" value="0" autofocus>
    <div id="fs_ssAtomPayPreview" style="font-size:13px;font-weight:800;margin-top:9px;">Remaining: ${shoeSoleQuantityDisplay(payable)} Atoms</div>
    <div id="fs_ssAtomAdvancePreview" style="font-size:12px;color:var(--muted);margin-top:5px;"></div>
    <div class="modal-actions">
      <button type="button" class="btn brass" id="fs_ssAtomPaySave">Save Payment</button>
      <button type="button" class="btn ghost" id="fs_ssAtomPayCancel">Cancel</button>
    </div>`);

  const input=document.getElementById('fs_ssAtomPayOnly');
  const preview=document.getElementById('fs_ssAtomPayPreview');
  const advancePreview=document.getElementById('fs_ssAtomAdvancePreview');

  const update=()=>{
    const pay=Math.max(0,Number(input.value)||0);
    const remaining=Math.max(0,payable-pay);
    const extra=Math.max(0,pay-payable);
    preview.textContent=`Remaining: ${shoeSoleQuantityDisplay(remaining)} Atoms`;
    advancePreview.textContent=extra>0?`Advance Atoms: ${shoeSoleQuantityDisplay(extra)} Atoms`:'';
  };
  input.addEventListener('input',update);
  document.getElementById('fs_ssAtomPayCancel').onclick=closeModal;

  document.getElementById('fs_ssAtomPaySave').onclick=()=>{
    const pay=Math.max(0,Number(input.value)||0);
    if(pay<=0){toast('Enter Pay Atoms');return;}

    // Settle the current Opening + New balance exactly once.
    // After payment, New Atoms are consumed into the settlement and only
    // the unpaid remainder becomes the next Opening Atoms.
    const remaining=Math.max(0,payable-pay);
    const advance=Math.max(0,pay-payable);
    const dispatchIds=(Array.isArray(shopkeeper.dispatches)?shopkeeper.dispatches:[])
      .filter(p=>String(p.articleId||'')===String(product.id))
      .map(p=>String(p.id));

    product.atomBalance={
      openingAtom:remaining,
      advanceAtom:advance,
      payAtom:0,
      settledPurchaseIds:dispatchIds,
      lastSettlementAt:new Date().toISOString()
    };

    persistAll();
    closeModal();
    render();
    toast(`${product.name} payment settled`);
  };
  setTimeout(()=>input.focus(),50);
}

function factorySaleArticles(){const catalog=new Map();(settings.articles||[]).forEach(article=>catalog.set(String(article.id),article));getShoeSoleSuppliers().forEach(shopkeeper=>(shopkeeper.articles||[]).forEach(article=>{if(!catalog.has(String(article.id)))catalog.set(String(article.id),article);}));return [...catalog.values()];}
function factorySaleShopArticles(shopkeeper){return factorySaleArticles().map(article=>{const own=(shopkeeper?.articles||[]).find(a=>String(a.id)===String(article.id));if(own===article)return own;const sent=(shopkeeper?.dispatches||[]).filter(row=>String(row.articleId)===String(article.id)).reduce((sum,row)=>sum+(Number(row.atoms??row.items??row.boxes)||0),0);return {...article,stockItems:sent,stockBoxes:sent};});}
function factorySaleGlobalArticleModal(articleId=''){const original=factorySaleArticles().find(article=>String(article.id)===String(articleId));const savedUnit=original?shoeSoleProductDisplayUnit(original):'ATOMS',unitType=['ATOMS','SET'].includes(savedUnit)?savedUnit:'Custom';let saving=false;modal('<h3>'+ (original?'Edit Global Article':'Add Global Article')+'</h3><label>Article Name<input id="fsGlobalArticleName" value="'+esc(original?.name||'')+'"></label><label>Unit<select id="fsGlobalArticleUnit"><option value="ATOMS" '+(unitType==='ATOMS'?'selected':'')+'>ATOMS</option><option value="SET" '+(unitType==='SET'?'selected':'')+'>SET</option><option value="Custom" '+(unitType==='Custom'?'selected':'')+'>Custom Unit</option></select></label><label id="fsGlobalCustomUnitLabel" style="display:'+(unitType==='Custom'?'block':'none')+'">Custom Unit<input id="fsGlobalCustomUnit" value="'+esc(unitType==='Custom'?savedUnit:'')+'"></label><label>Unit Price<input id="fsGlobalArticleRate" type="number" min="0" step="any" value="'+esc(original?.ratePerUnit??0)+'"></label><div class="modal-actions"><button class="btn brass" id="fsGlobalArticleSave">Save Article</button><button class="btn ghost" id="fsGlobalArticleCancel">Cancel</button></div>');document.getElementById('fsGlobalArticleUnit').onchange=()=>{document.getElementById('fsGlobalCustomUnitLabel').style.display=document.getElementById('fsGlobalArticleUnit').value==='Custom'?'block':'none';};document.getElementById('fsGlobalArticleCancel').onclick=closeModal;document.getElementById('fsGlobalArticleSave').onclick=async()=>{if(saving)return;const name=document.getElementById('fsGlobalArticleName').value.trim(),selectedUnit=document.getElementById('fsGlobalArticleUnit').value,unit=selectedUnit==='Custom'?document.getElementById('fsGlobalCustomUnit').value.trim():selectedUnit,raw=document.getElementById('fsGlobalArticleRate').value,ratePerUnit=Number(raw);if(!name||!unit||raw===''||!Number.isFinite(ratePerUnit)||ratePerUnit<0){toast('Enter Article Name, Unit and valid Unit Price.');return;}if(factorySaleArticles().some(a=>String(a.id)!==String(original?.id)&&a.name.trim().toLowerCase()===name.toLowerCase()&&shoeSoleProductDisplayUnit(a).toLowerCase()===unit.toLowerCase())){toast('This Article and Unit already exist.');return;}const previous=settings.articles,existed=Object.prototype.hasOwnProperty.call(settings,'articles'),article={...original,id:original?.id||uid(),name,unit:selectedUnit,customUnit:selectedUnit==='Custom'?unit:'',ratePerUnit};saving=true;document.getElementById('fsGlobalArticleSave').disabled=true;settings.articles=original?(previous||[]).filter(a=>String(a.id)!==String(original.id)).concat(article):[...(previous||[]),article];try{if(!await saveCriticalCloudState())throw Error('Save failed');}catch(error){if(existed)settings.articles=previous;else delete settings.articles;try{await reconcileCloudAfterCriticalRollback();}catch(rollbackError){}saving=false;document.getElementById('fsGlobalArticleSave')?.removeAttribute('disabled');toast('Global Article was not saved.');return;}closeModal();render();toast('Global Article saved.');};}

function factorySaleRowUnit(row,shopkeeper){const product=factorySaleShopArticles(shopkeeper).find(p=>String(p.id)===String(row.articleId));return row.unit==='Custom'?String(row.customUnit||shoeSoleProductDisplayUnit(product)):String(row.unit||shoeSoleProductDisplayUnit(product));}
function factorySaleQuantity(row,shopkeeper){return shoeSoleQuantityDisplay(row.atoms??row.items??row.boxes)+' '+factorySaleRowUnit(row,shopkeeper);}
function factorySaleTotals(rows,shopkeeper){const totals=new Map();rows.forEach(row=>{const unit=factorySaleRowUnit(row,shopkeeper);totals.set(unit,(totals.get(unit)||0)+(Number(row.atoms??row.items??row.boxes)||0));});return [...totals].map(([unit,qty])=>shoeSoleQuantityDisplay(qty)+' '+unit).join(' / ')||'0';}
function shoeSoleDateKey(value){
  if(!value) return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return String(value).slice(0,10);
  return d.toISOString().slice(0,10);
}
function formatMoney(amount){
  return 'Rs. '+(Math.round((Number(amount)||0)*100)/100).toLocaleString('en-PK');
}
function shoeSoleSelectedIndex(){
  return getShoeSoleSuppliers().findIndex(s=>String(s.id)===String(window.__soleSelectedId||''));
}
function shoeSoleRouteIndex(){
  if(currentPage==='factorySaleShopkeeper1'||currentPage==='factorySaleDispatch1')return 0;
  if(currentPage==='factorySaleShopkeeper2'||currentPage==='factorySaleDispatch2')return 1;
  return shoeSoleSelectedIndex();
}
function shoeSoleTodayRows(shopkeeper,now=new Date()){
  const start=new Date(now);start.setHours(0,0,0,0);
  const end=new Date(start);end.setDate(end.getDate()+1);
  return (shopkeeper?.dispatches||[]).filter(p=>{
    const date=new Date(p.date),qty=Number(p.atoms??p.items??p.boxes);
    return p.id&&p.articleId&&p.deleted!==true&&!p.deletedAt&&!p.voided&&Number.isFinite(qty)&&qty>0&&date>=start&&date<end;
  });
}

function pageShoeSoleSuppliers(){
  const shopkeepers=getShoeSoleSuppliers(),index=shoeSoleSelectedIndex(),selected=shopkeepers[index];
  const now=new Date(),supplierCards=shopkeepers.map((shopkeeper,i)=>({shopkeeper,i,rows:shoeSoleTodayRows(shopkeeper,now)})).sort((a,b)=>Number(b.rows.length>0)-Number(a.rows.length>0)||a.i-b.i),todayTotal=factorySaleTotals(shopkeepers.flatMap(s=>shoeSoleTodayRows(s,now)));
  return `<div class="fs_sole-shopkeeper-page">
    <div class="card fs_sole-shopkeeper-actions"><button class="btn ghost small" id="fs_soleBack">Back</button><button class="btn ghost small" id="fs_soleDashboard">Back to Dashboard</button><button class="btn brass small" id="fs_soleAddSupplier">+ Add Shopkeeper</button><button class="btn brass small" id="fs_soleAddArticle">+ Add Article</button><button class="btn ghost small" id="fs_soleToday">Today Dispatch Articles <strong>${esc(todayTotal)}</strong></button><button type="button" class="btn brass small" id="fsManualCreate">Manual Create Bill</button><button type="button" class="btn ghost small" id="fsManualBills">Manual Bill History</button></div>
    <div class="card"><h3>Select Shopkeeper</h3><div class="fs_sole-shopkeeper-grid">${shopkeepers.length?supplierCards.map(({shopkeeper,i,rows})=>{const qty=factorySaleTotals(rows,shopkeeper);return `<div style="min-width:0;display:flex;flex-direction:column;gap:4px;"><button type="button" class="fs_sole-shopkeeper-card ${i===index?'selected':''}" data-fs_sole-select="${esc(shopkeeper.id)}" aria-pressed="${i===index}"><strong title="${esc(shoeSoleSupplierDisplayName(shopkeeper,i))}">${esc(shoeSoleSupplierDisplayName(shopkeeper,i))}</strong><span>Today: ${esc(qty)}</span>${rows.length?'<span class="fs_sole-shopkeeper-completed">Completed</span>':''}</button><button type="button" class="btn ghost small" data-fs_sole-create-bill="${esc(shopkeeper.id)}">Create Bill</button></div>`;}).join(''):'<div class="empty">Add a Shopkeeper to begin.</div>'}</div></div>
    ${selected?`<div class="card"><div class="fs_sole-entry-heading"><h3>Dispatch Articles - ${esc(shoeSoleSupplierDisplayName(selected,index))}</h3><button class="btn ghost small" id="fs_soleShopkeeperDetails">Shopkeeper Details / History</button></div><div class="fs_sole-dispatch-entry"><div><label for="fs_soleReceiveDate">Date</label><input id="fs_soleReceiveDate" type="date" value="${shoeSoleReportDateKey()}"></div><div><label for="fs_soleArticle">Select Article</label><select id="fs_soleArticle"><option value="">Select Article</option>${factorySaleShopArticles(selected).map(p=>`<option value="${esc(p.id)}">${esc(p.name)} - ${shoeSoleQuantityDisplay(shoeSoleProductStockItems(p))} ${esc(shoeSoleProductDisplayUnit(p))} sent</option>`).join('')}</select></div><div><label for="fs_soleQuantity" id="fs_soleReceiveUnitLabel">Quantity / saved unit</label><input id="fs_soleQuantity" type="number" min="0" step="any" placeholder="Quantity"></div><button class="btn brass" id="fs_soleReceive">Dispatch / Save</button></div>${factorySaleShopArticles(selected).length?'':'<div class="fs_sole-entry-hint">Add Global Articles before dispatch.</div>'}</div>`:'<div class="card empty">Select a shopkeeper to dispatch fs_soles.</div>'}
  </div>`;
}
let shoeSoleReportRange=null;
function shoeSoleReportDateKey(date=new Date()){return String(date.getFullYear()).padStart(4,'0')+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')}
function shoeSoleReportDay(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const [y,m,d]=value.split('-').map(Number),date=new Date(y,m-1,d);return shoeSoleReportDateKey(date)===value?date:null}
function shoeSoleReportRows(shopkeepers,from,to){const start=shoeSoleReportDay(from),last=shoeSoleReportDay(to);if(!start||!last||start>last)return null;const end=new Date(last);end.setDate(end.getDate()+1);const manual=(settings.manualBills||[]).filter(bill=>bill.dispatchSnapshot).map(bill=>({id:'manual:'+bill.id,name:bill.shopkeeperName,dispatches:bill.dispatchSnapshot.lines}));return [...shopkeepers,...manual].flatMap((shopkeeper,index)=>(shopkeeper.dispatches||[]).filter(p=>{const date=new Date(p.date),qty=Number(p.atoms??p.items??p.boxes);return p.id&&p.articleId&&p.deleted!==true&&!p.deletedAt&&!p.voided&&Number.isFinite(qty)&&qty>0&&date>=start&&date<end;}).map(p=>({shopkeeper,index,p}))).sort((a,b)=>new Date(b.p.date)-new Date(a.p.date))}
function shoeSoleReportTable(rows,total,actions=false){const supplierNumbers=new Map(),supplierNumber=(shopkeeper,index)=>{const key=shopkeeper.id!==undefined&&shopkeeper.id!==null&&String(shopkeeper.id)!==''?'id:'+String(shopkeeper.id):'index:'+String(index);if(!supplierNumbers.has(key))supplierNumbers.set(key,supplierNumbers.size+1);return supplierNumbers.get(key)};const table='<table style="width:100%;table-layout:fixed;border-collapse:collapse"><colgroup><col style="width:34%"><col style="width:41%"><col style="width:25%"></colgroup><thead><tr><th style="text-align:left">Shopkeeper Name</th><th style="text-align:center">Article</th><th style="text-align:center">Quantity</th></tr></thead><tbody>'+ (rows.length?rows.map(({shopkeeper,index,p})=>'<tr><td style="overflow-wrap:anywhere;text-align:left">'+supplierNumber(shopkeeper,index)+'. '+esc(shoeSoleSupplierDisplayName(shopkeeper,index))+'</td><td style="overflow-wrap:anywhere;text-align:center">'+esc(p.articleName||factorySaleShopArticles(shopkeeper).find(a=>String(a.id)===String(p.articleId))?.name||'Article')+(actions?'<div><button class="btn ghost small" data-fs_sole-view="'+esc(p.id)+'" data-fs_sole-shopkeeper="'+esc(shopkeeper.id)+'">View</button> <button class="btn red small" data-fs_sole-delete="'+esc(p.id)+'" data-fs_sole-shopkeeper="'+esc(shopkeeper.id)+'">Delete</button></div>':'')+'</td><td style="text-align:center">'+esc(factorySaleQuantity(p,shopkeeper))+'</td></tr>').join(''):'<tr><td colspan="3">No dispatches in this range.</td></tr>')+'</tbody></table>';if(actions)return table.replace('</tbody></table>','</tbody><tfoot><tr><th colspan="2" style="text-align:left">Total Quantity</th><th style="text-align:center">'+esc(total)+'</th></tr></tfoot></table>');return table.replace('>Shopkeeper Name</th>','>SUPPLIER</th>').replace('>Article</th>','>ARTICLE</th>').replace('>Quantity</th>','>QUANTITY</th>')+'<table style="width:100%;table-layout:fixed;border-collapse:collapse;font-family:inherit;font-size:inherit;margin-top:5px;"><colgroup><col style="width:60%"><col style="width:40%"></colgroup><tbody><tr style="font-weight:900;"><th style="text-align:left;">TOTAL QUANTITY</th><th style="text-align:center;">'+shoeSoleQuantityDisplay(total)+' ATOMS</th></tr></tbody></table>'}
function shoeSoleReportPeriod(mode,now=new Date()){
  const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()),end=new Date(start);
  if(mode==='week'){start.setDate(start.getDate()-(start.getDay()+1)%7);end.setTime(start.getTime());end.setDate(end.getDate()+5);}
  else if(mode==='month'){start.setDate(1);end.setMonth(end.getMonth()+1,0);}
  const previous=shoeSoleReportRange||{};
  return {from:mode==='custom'?(previous.from||shoeSoleReportDateKey(start)):shoeSoleReportDateKey(start),to:mode==='custom'?(previous.to||shoeSoleReportDateKey(end)):shoeSoleReportDateKey(end),mode,shopkeeper:previous.shopkeeper||''};
}
function pageShoeSoleToday(){
  const today=shoeSoleReportDateKey(),range=shoeSoleReportRange||{from:today,to:today},filtered=shoeSoleReportRows(getShoeSoleSuppliers(),range.from,range.to),rows=(filtered||[]).filter(row=>shoeSoleSupplierDisplayName(row.shopkeeper,row.index).toLocaleLowerCase().includes(String(range.shopkeeper||'').trim().toLocaleLowerCase())),total=factorySaleTotals(rows.map(r=>r.p));
  return '<div class="fs_sole-shopkeeper-page"><div class="card fs_sole-shopkeeper-actions"><button class="btn ghost small" id="fs_soleTodayBack">Back to Shopkeepers</button><h3>Today Dispatch Articles</h3><button class="btn small" id="fs_soleReportToday">Today</button><button class="btn small" id="fs_soleReportWeek" aria-pressed="'+((range.mode||'today')==='week')+'">This Week</button><button class="btn small" id="fs_soleReportMonth" aria-pressed="'+((range.mode||'today')==='month')+'">This Month</button><button class="btn small" id="fs_soleReportCustom" aria-pressed="'+((range.mode||'today')==='custom')+'">Custom Date</button><label style="font-size:11px;min-width:0">Shopkeeper search <input type="text" id="fs_soleReportSupplier" placeholder="Search shopkeeper name" value="'+esc(range.shopkeeper||'')+'" style="width:180px;max-width:100%;padding:4px"></label><label style="font-size:11px">From Date <input type="date" id="fs_soleReportFrom" value="'+esc(range.from)+'" style="width:140px;padding:4px"></label><label style="font-size:11px">To Date <input type="date" id="fs_soleReportTo" value="'+esc(range.to)+'" style="width:140px;padding:4px"></label><button class="btn brass small" id="fs_soleReportPrint" '+(filtered?'':'disabled')+'>Print</button></div>'+(filtered?'':'<div class="card">Choose valid dates with From Date on or before To Date.</div>')+'<div class="card fs_sole-dispatch-today">'+shoeSoleReportTable(rows,total,true)+'</div><div hidden><div id="fs_soleAggregatePrintArea" class="receipt-paper"><style>#fs_soleAggregatePrintArea{font-family:Arial,sans-serif;}#fs_soleAggregatePrintArea h3{font-size:18px;margin:4px 0;}#fs_soleAggregatePrintArea>p{font-size:12px;margin:4px 0 6px;}#fs_soleAggregatePrintArea th{font-size:13px;font-weight:800;}#fs_soleAggregatePrintArea td{font-size:13px;font-weight:700;}#fs_soleAggregatePrintArea th,#fs_soleAggregatePrintArea td{padding:3px 2px;line-height:1.2;border:1px solid #000;}#fs_soleAggregatePrintArea thead th{text-align:center!important;}#fs_soleAggregatePrintArea{writing-mode:horizontal-tb;transform:none;}@media print{#fs_soleAggregatePrintArea,#fs_soleAggregatePrintArea table,#fs_soleAggregatePrintArea tr{break-before:auto!important;break-after:auto!important;break-inside:auto!important;page-break-before:auto!important;page-break-after:auto!important;page-break-inside:auto!important;height:auto!important;min-height:0!important;max-height:none!important;min-width:0!important;max-width:100%!important;overflow:visible!important;}}#fs_soleAggregatePrintArea tfoot th{font-size:14px;font-weight:900;}#fs_soleAggregatePrintArea thead th+th,#fs_soleAggregatePrintArea tbody td+td{border-left:1px solid #555;}#fs_soleAggregatePrintArea th,#fs_soleAggregatePrintArea td{white-space:normal;overflow-wrap:anywhere;word-break:normal;vertical-align:top;}#fs_soleAggregatePrintArea thead th:nth-child(1){width:34%;}#fs_soleAggregatePrintArea thead th:nth-child(2){width:41%;}#fs_soleAggregatePrintArea thead th:nth-child(3){width:25%;}#fs_soleAggregatePrintArea h3,#fs_soleAggregatePrintArea>p{font-weight:800;}#fs_soleAggregatePrintArea tbody td:first-child{text-align:left!important;}#fs_soleAggregatePrintArea thead th:nth-child(2),#fs_soleAggregatePrintArea thead th:nth-child(3),#fs_soleAggregatePrintArea tbody td:nth-child(2),#fs_soleAggregatePrintArea tbody td:nth-child(3){text-align:center!important;}</style><h3>Factory Sale Dispatch Report</h3><p>'+esc(range.from)+' to '+esc(range.to)+'</p>'+shoeSoleReportTable(rows,total)+'</div></div></div>';
}
async function saveShoeSoleReceiving(shopkeeperId,articleId,atoms,date,notes='',time=date,request={}){
  if(request.saved||request.saving||window.__soleReceiveSaving)return null;
  const shopkeeper=getShoeSoleSuppliers().find(s=>String(s.id)===String(shopkeeperId)),product=factorySaleShopArticles(shopkeeper).find(p=>String(p.id)===String(articleId));
  if(!product||!Number.isFinite(atoms)||atoms<=0||!Number.isFinite(new Date(date).getTime())){toast('Select an article and enter a valid positive quantity.');return null;}
  request.saving=true;window.__soleReceiveSaving=true;
  const before=JSON.stringify(settings);
  try{
    const voucherNo=`FS-${String(settings.nextDispatchVoucherNo||1001).padStart(4,'0')}`;
    product.stockItems=shoeSoleProductStockItems(product)+atoms;
    product.stockBoxes=Math.max(0,Number(product.stockBoxes)||0)+atoms;
    const purchase={id:uid(),articleId:product.id,articleName:product.name,unit:shoeSoleProductDisplayUnit(product),ratePerUnit:product.ratePerUnit,date,items:atoms,atoms,boxes:atoms,voucherNo,notes,time};
    shopkeeper.dispatches=shopkeeper.dispatches||[];shopkeeper.dispatchVouchers=shopkeeper.dispatchVouchers||[];
    shopkeeper.dispatches.push(purchase);
    shopkeeper.dispatchVouchers.push({id:uid(),voucherNo,date,dispatchIds:[String(purchase.id)],notes,createdAt:time});
    settings.nextDispatchVoucherNo=(Number(settings.nextDispatchVoucherNo)||1001)+1;
    if(!await saveCriticalCloudState()){
      settings=JSON.parse(before);await reconcileCloudAfterCriticalRollback();toast('Dispatch was not saved. Stock and receipt were restored.');return null;
    }
    request.saved=true;
    return {supplierIndex:getShoeSoleSuppliers().findIndex(s=>String(s.id)===String(shopkeeperId)),purchaseId:String(purchase.id),voucherNo};
  }finally{request.saving=false;window.__soleReceiveSaving=false;}
}
function bindShoeSoleLanding(){
  document.getElementById('fs_soleBack')?.addEventListener('click',()=>goBack());
  document.getElementById('fs_soleDashboard')?.addEventListener('click',()=>goto('dashboard'));
  document.getElementById('fs_soleAddSupplier')?.addEventListener('click',()=>openShoeSoleSupplierModal());
  document.getElementById('fs_soleAddArticle')?.addEventListener('click',()=>factorySaleGlobalArticleModal());
  document.getElementById('fs_soleToday')?.addEventListener('click',()=>{shoeSoleReportRange=null;goto('factorySaleToday');});
  document.getElementById('fs_soleTodayBack')?.addEventListener('click',()=>{shoeSoleReportRange=null;goto('factorySale');});
  document.getElementById('fs_soleReportToday')?.addEventListener('click',()=>{shoeSoleReportRange=shoeSoleReportPeriod('today');render();});
  [['Week','week'],['Month','month'],['Custom','custom']].forEach(([label,mode])=>document.getElementById('fs_soleReport'+label)?.addEventListener('click',()=>{shoeSoleReportRange=shoeSoleReportPeriod(mode);render();}));
  document.getElementById('fs_soleReportSupplier')?.addEventListener('input',event=>{const value=event.target.value,start=event.target.selectionStart,end=event.target.selectionEnd;shoeSoleReportRange={...(shoeSoleReportRange||shoeSoleReportPeriod('today')),shopkeeper:value};render();const input=document.getElementById('fs_soleReportSupplier');input?.focus();input?.setSelectionRange(start,end);});
  ['fs_soleReportFrom','fs_soleReportTo'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>{shoeSoleReportRange={...(shoeSoleReportRange||{}),mode:'custom',from:document.getElementById('fs_soleReportFrom').value,to:document.getElementById('fs_soleReportTo').value};render();}));
  document.getElementById('fs_soleReportPrint')?.addEventListener('click',()=>printAggregateThermal(document.getElementById('fs_soleAggregatePrintArea')?.outerHTML,'Factory Sale Dispatch Report','element',{portraitSafe:true}));
  document.getElementById('fs_soleShopkeeperDetails')?.addEventListener('click',()=>goto('factorySaleShopkeeperDetail'));
  document.querySelectorAll('[data-fs_sole-select]').forEach(b=>b.addEventListener('click',()=>{window.__soleSelectedId=b.dataset.fs_soleSelect;render();}));
  document.querySelectorAll('[data-fs_sole-create-bill]').forEach(button=>button.addEventListener('click',()=>{window.__soleSelectedId=button.dataset.fs_soleCreateBill;shoeSoleBillingModule.open(button.dataset.fs_soleCreateBill);}));
  document.getElementById('fs_soleArticle')?.addEventListener('change',()=>{const shopkeeper=getShoeSoleSuppliers()[shoeSoleSelectedIndex()],product=factorySaleShopArticles(shopkeeper).find(p=>String(p.id)===String(document.getElementById('fs_soleArticle').value));document.getElementById('fs_soleReceiveUnitLabel').textContent='Quantity / '+(product?shoeSoleProductDisplayUnit(product):'saved unit');});
  const request={};
  document.getElementById('fs_soleReceive')?.addEventListener('click',async()=>{
    const shopkeeperId=window.__soleSelectedId,articleId=document.getElementById('fs_soleArticle')?.value,atoms=Number(document.getElementById('fs_soleQuantity')?.value),now=new Date().toISOString();
    const selectedDate=shoeSoleReportDay(document.getElementById('fs_soleReceiveDate')?.value||'');
    if(!selectedDate){toast('Select a valid dispatch date.');return;}
    const clock=new Date(now);selectedDate.setHours(clock.getHours(),clock.getMinutes(),clock.getSeconds(),clock.getMilliseconds());
    const result=await saveShoeSoleReceiving(shopkeeperId,articleId,atoms,selectedDate.toISOString(),'',now,request);
    if(result){render();openShoeSoleReceiveVoucherModal(result.supplierIndex,[result.purchaseId]);toast(result.voucherNo+' saved');}
  });
  document.querySelectorAll('[data-fs_sole-view],[data-fs_sole-delete]').forEach(b=>b.addEventListener('click',()=>{
    if(String(b.dataset.fs_soleShopkeeper).startsWith('manual:')){const id=b.dataset.fs_soleShopkeeper.slice(7),bill=(settings.manualBills||[]).find(bill=>bill.id===id);if(!bill)return;if(b.dataset.fs_soleDelete)openConfirmModal('Delete Manual Bill #'+bill.voucherNo+' and its dispatch?',()=>factorySaleManualDelete(id,JSON.stringify(bill)));else factorySaleManualView(id);return;}const i=getShoeSoleSuppliers().findIndex(s=>String(s.id)===String(b.dataset.fs_soleShopkeeper));if(i<0)return;
    if(b.dataset.fs_soleDelete)deleteShoeSoleReceiving(i,b.dataset.fs_soleDelete);else openShoeSoleReceiveVoucherModal(i,[b.dataset.fs_soleView]);
  }));

}

function pageShoeSoleSupplierDetail(index){
  const shopkeepers=getShoeSoleSuppliers();
  const shopkeeper=shopkeepers[index];
  if(!shopkeeper) return pageShoeSoleSuppliers();
  const displayName=shoeSoleSupplierDisplayName(shopkeeper,index);
  const articles=factorySaleShopArticles(shopkeeper);
  return `<div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;">
      <div><h2 class="page-title" style="margin-bottom:4px;">📦 ${esc(displayName)}</h2><div style="font-size:12px;color:var(--muted);">Shopkeeper ${index+1} — complete Shopkeeper details, articles and dispatch.</div></div>
      <button type="button" class="btn blue small" data-fs_editsss="${index}">✏️ Edit Shopkeeper</button>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;gap:16px;align-items:flex-start;min-width:0;flex-wrap:wrap;">
        <div class="entity-photo ${shopkeeper.photo?'zoomable':''}" data-lightboxphoto="shoeSoleSupplier" data-fs_sssindex="${index}" style="width:110px;height:110px;font-size:28px;border-radius:12px;flex:0 0 110px;cursor:${shopkeeper.photo?'zoom-in':'default'};">${shopkeeper.photo?`<img src="${shopkeeper.photo}" alt="${esc(displayName)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`:`<span>${esc(initials(displayName)||'SB')}</span>`}</div>
        <div style="flex:1;min-width:240px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px;font-size:13px;line-height:1.5;">
          <div><strong>Shopkeeper Name:</strong> ${esc(shopkeeper.name||'—')}</div>
          <div><strong>Owner / Contact Person:</strong> ${esc(shopkeeper.ownerName||'—')}</div>
          <div><strong>Mobile:</strong> ${esc(shopkeeper.mobile||'—')}</div>
          <div><strong>WhatsApp:</strong> ${esc(shopkeeper.whatsapp||'—')}</div>
          <div><strong>Shop / Business Address:</strong> ${esc(shopkeeper.address||'—')}</div>
          <div><strong>Location:</strong> ${esc(shopkeeper.location||'—')}</div>
          <div style="grid-column:1/-1;"><strong>Notes:</strong> ${esc(shopkeeper.notes||'—')}</div>
        </div>
      </div>
      <div style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
        <div style="font-size:12px;color:var(--muted);">${Array.isArray(shopkeeper.customFields)?shopkeeper.customFields.length:0} Custom Field${(Array.isArray(shopkeeper.customFields)?shopkeeper.customFields.length:0)===1?'':'s'}</div>
        <button class="btn ghost small" type="button" data-fs_customsss="${index}">⚙️ Custom Fields</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <h3 style="margin:0;font-size:17px;">Article List</h3>
        <div style="display:flex;gap:7px;flex-wrap:wrap;">
          <button class="btn brass small" type="button" data-fs_createssreceive="${index}">＋ Create Dispatch Voucher</button>
          <button class="btn ghost small" type="button" data-fs_addssproduct="${index}">＋ Add Global Article</button>
        </div>
      </div>
      ${articles.length?`<div class="fs_sss-product-list" style="display:grid;gap:5px;overflow-x:auto;"><div style="display:grid;grid-template-columns:minmax(145px,1.5fr) 82px 82px 82px 92px 86px minmax(115px,auto);align-items:center;gap:5px;padding:4px 5px;font-size:9px;color:var(--muted);font-weight:800;white-space:nowrap;min-width:750px;"><div>Article</div><div>Opening Atoms</div><div>New Atoms</div><div>Pay Atoms</div><div>Remaining Atoms</div><div>Advance Atoms</div><div>Actions</div></div>${articles.map((product,productIndex)=>{const b=shoeSoleProductAtomBalanceForSupplier(shopkeeper,product);const isFootprint=/footprint/i.test(String(product.name||''));return `<div class="entity-card fs_sss-product-row" data-fs_opensoleproductactions="${index}" data-productid="${esc(product.id)}" style="display:grid;grid-template-columns:minmax(145px,1.5fr) 82px 82px 82px 92px 86px minmax(115px,auto);align-items:center;gap:5px;text-align:left;padding:5px;min-width:750px;cursor:pointer;">
        <div style="display:flex;align-items:center;gap:5px;min-width:0;"><span style="font-size:11px;font-weight:800;line-height:1;min-width:16px;text-align:center;flex-shrink:0;">${productIndex+1}.</span><div class="fs_sss-product-photo" style="width:${isFootprint?'40px':'32px'};height:${isFootprint?'40px':'32px'};border-radius:6px;overflow:hidden;background:#f4f1e8;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:${product.photo?'zoom-in':'default'};" ${product.photo?`data-fs_sssproductphoto="${esc(product.id)}"`:''}>${product.photo?`<img src="${product.photo}" alt="${esc(product.name)}" style="width:100%;height:100%;object-fit:cover;">`:'📦'}</div><div style="min-width:0;"><div style="font-weight:900;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(product.name)}</div><div style="font-size:9px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(shoeSoleProductDisplayUnit(product))}</div></div></div>
        <button type="button" class="fs_sss-item-cell fs_sss-item-opening" data-fs_openingsoleproductatom="${index}" data-productid="${esc(product.id)}"><span>OPENING ATOMS</span><strong>${shoeSoleQuantityDisplay(b.opening)} Atoms</strong></button>
        <div class="fs_sss-item-cell fs_sss-item-new"><span>NEW ATOMS</span><strong>${shoeSoleQuantityDisplay(b.newAtom)} Atoms</strong></div>
        <button type="button" class="fs_sss-item-cell fs_sss-item-pay" data-fs_paysoleproductatom="${index}" data-productid="${esc(product.id)}"><span>PAY ATOMS</span><strong>0 Atoms</strong></button>
        <div class="fs_sss-item-cell fs_sss-item-remaining"><span>REMAINING ATOMS</span><strong>${shoeSoleQuantityDisplay(b.remaining)} Atoms</strong></div>
        <div class="fs_sss-item-cell fs_sss-item-advance"><span>ADVANCE ATOMS</span><strong>${shoeSoleQuantityDisplay(b.advance)} Atoms</strong></div>
        <div style="font-size:10px;color:var(--muted);text-align:center;line-height:1.2;">Click Article for actions</div>
      </div>`;}).join('')}</div>`:'<div class="empty">No articles added yet. Add the shopkeeper’s first product.</div>'}
    </div>

    <div class="card" style="margin-bottom:16px;cursor:pointer;" data-open-fs_sss-dispatch="${index}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
        <div>
          <h3 style="margin:0;font-size:17px;">📥 Today Dispatch Article</h3>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">Open today’s dispatch, filters, summary, print and dispatch vouchers.</div>
        </div>
        <span style="font-size:24px;">→</span>
      </div>
    </div>
  </div>`;
}

function shoeSoleReceiveDateRange(filter, customStart='', customEnd=''){
  const now=new Date();
  now.setHours(0,0,0,0);
  let start=new Date(now), end=new Date(now);
  end.setHours(23,59,59,999);
  if(filter==='weekly') start.setDate(start.getDate()-6);
  else if(filter==='monthly') start=new Date(now.getFullYear(),now.getMonth(),1);
  else if(filter==='custom'){
    if(customStart) start=new Date(customStart+'T00:00:00');
    if(customEnd) end=new Date(customEnd+'T23:59:59');
  }
  return {start,end};
}
function shoeSoleReceiveRows(shopkeeper,filter='today',customStart='',customEnd=''){
  const {start,end}=shoeSoleReceiveDateRange(filter,customStart,customEnd);
  const rows=(shopkeeper?.dispatches||[]).filter(p=>{
    const d=new Date(p.date);
    return !Number.isNaN(d.getTime()) && d>=start && d<=end;
  }).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  return rows;
}
function shoeSoleReceiveSummary(rows){
  return {
    totalAtoms:rows.reduce((sum,p)=>sum+(Number(p.atoms ?? p.items)||0),0)
  };
}
function shoeSoleReceiveGroupedRows(shopkeeper,rows){
  const map=new Map();
  rows.forEach(p=>{
    const key=String(p.articleId||p.articleName||'');
    const product=factorySaleShopArticles(shopkeeper).find(x=>String(x.id)===String(p.articleId));
    const old=map.get(key)||{articleId:p.articleId,articleName:p.articleName||product?.name||'Article',items:0};
    old.items+=shoeSolePurchaseItems(p);
    map.set(key,old);
  });
  return Array.from(map.values());
}
function shoeSoleReceivePeriodLabel(filter,start='',end=''){
  if(filter==='today') return 'Today';
  if(filter==='weekly') return 'Last 7 Days';
  if(filter==='monthly') return 'This Month';
  if(filter==='custom') return `${start||'—'} to ${end||'—'}`;
  return '';
}
function printShoeSoleReceiveSummary(supplierIndex,filter,customStart='',customEnd=''){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex]; if(!shopkeeper)return;
  const rows=shoeSoleReceiveRows(shopkeeper,filter,customStart,customEnd);
  const vouchers=shoeSoleReceiveVoucherGroups(shopkeeper,rows);
  const totals=shoeSoleReceiveSummary(rows);
  const range=shoeSoleReceivePeriodLabel(filter,customStart,customEnd);
  const win=window.open('','_blank','width=420,height=700');
  if(!win){toast('Please allow popups to print');return;}
  const voucherBlocks=vouchers.map(v=>{
    const rs=(shopkeeper.dispatches||[]).filter(p=>v.dispatchIds.includes(String(p.id)));
    return `<div class="voucher"><div class="center bold">${esc(v.voucherNo)}</div><div class="meta">Shopkeeper: ${esc(shoeSoleSupplierDisplayName(shopkeeper,supplierIndex))}</div><div class="meta">Date: ${esc(fmtDate(v.date))}</div><div class="meta">Time: ${v.date?new Date(v.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):''}</div><hr>${rs.map(p=>`<div class="row"><span>${esc(p.articleName)}</span><span>${esc(factorySaleQuantity(p,shopkeeper))}</span></div>`).join('')}<hr><div class="row bold"><span>Total Quantity</span><span>${esc(factorySaleTotals(rs,shopkeeper))}</span></div></div>`;
  }).join('<div class="cut"></div>');
  win.document.write(`<!doctype html><html><head><title>Dispatch Summary</title><style>@page{size:80mm auto;margin:0}*{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;padding:4mm;color:#111;width:80mm;box-sizing:border-box;font-size:11px}.head{text-align:center;margin-bottom:8px}.head h2{font-size:15px;margin:0 0 3px}.meta{font-size:10px;margin:2px 0}.row{display:flex;justify-content:space-between;gap:8px;margin:3px 0}.small{font-size:10px}.bold{font-weight:700}.center{text-align:center}.voucher{margin-bottom:8px}.cut{border-top:1px dashed #777;margin:8px 0}@media print{body{width:80mm;padding:5px}}</style></head><body><div class="head"><h2>${esc(settings.factoryName||'Leather Right Shoes')}</h2><div class="meta">FACTORY SALE DISPATCH SUMMARY</div><div class="meta">${esc(range)}</div></div>${voucherBlocks||'<div>No dispatch found.</div>'}<div class="cut"></div><div class="row bold"><span>Period Total Quantity</span><span>${esc(factorySaleTotals(rows,shopkeeper))}</span></div><script>window.onload=function(){window.print();};<\/script></body></html>`);
  win.document.close();
}


function shoeSoleReceiveVoucherGroups(shopkeeper,rows){
  const purchasesById=new Map((shopkeeper?.dispatches||[]).map(p=>[String(p.id),p]));
  const groups=[];
  const used=new Set();
  const vouchers=Array.isArray(shopkeeper?.dispatchVouchers)?shopkeeper.dispatchVouchers:[];
  vouchers.forEach(v=>{
    const ids=(v.dispatchIds||[]).map(String);
    const groupRows=ids.map(id=>purchasesById.get(id)).filter(Boolean).filter(p=>rows.some(r=>String(r.id)===String(p.id)));
    if(!groupRows.length) return;
    groupRows.forEach(p=>used.add(String(p.id)));
    groups.push({id:String(v.id||uid()),voucherNo:String(v.voucherNo||groupRows[0].voucherNo||'—'),date:String(v.date||groupRows[0].date||''),dispatchIds:groupRows.map(p=>String(p.id)),notes:String(v.notes||''),totalAtoms:groupRows.reduce((sum,p)=>sum+shoeSolePurchaseItems(p),0)});
  });
  rows.forEach(p=>{
    if(used.has(String(p.id))) return;
    groups.push({id:`legacy-${p.id}`,voucherNo:String(p.voucherNo||'—'),date:String(p.date||''),dispatchIds:[String(p.id)],notes:String(p.notes||''),totalAtoms:shoeSolePurchaseItems(p)});
  });
  return groups.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
function pageShoeSoleReceiveDetail(index){
  const shopkeeper=getShoeSoleSuppliers()[index];
  if(!shopkeeper) return pageShoeSoleSuppliers();
  const filter=(window.__shoeSoleReceiveFilters||{})[index] || {filter:'today',start:'',end:''};
  const rows=shoeSoleReceiveRows(shopkeeper,filter.filter,filter.start,filter.end);
  const vouchers=shoeSoleReceiveVoucherGroups(shopkeeper,rows);
  const totals=shoeSoleReceiveSummary(rows);
  const displayName=shoeSoleSupplierDisplayName(shopkeeper,index);
  const range=shoeSoleReceivePeriodLabel(filter.filter,filter.start,filter.end);
  return `<div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
      <div><h2 class="page-title" style="margin-bottom:4px;">📥 Today Dispatch Article</h2><div style="font-size:12px;color:var(--muted);">${esc(displayName)} • ${esc(range)}</div></div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;"><button class="btn blue small" id="fs_sssPrintReceiveSummary">🖨️ Print</button><button class="btn brass small" id="fs_sssCreateReceiveVoucher">＋ Create Dispatch Voucher</button></div>
    </div>
    <div class="card" style="margin-bottom:14px;"><div style="display:flex;gap:6px;flex-wrap:wrap;">
      <button class="btn ${filter.filter==='today'?'brass':'ghost'} small" id="fs_sssReceiveToday">Today</button><button class="btn ${filter.filter==='weekly'?'brass':'ghost'} small" id="fs_sssReceiveWeekly">Weekly</button><button class="btn ${filter.filter==='monthly'?'brass':'ghost'} small" id="fs_sssReceiveMonthly">Monthly</button><button class="btn ${filter.filter==='custom'?'brass':'ghost'} small" id="fs_sssReceiveCustom">Custom Date</button>
    </div>${filter.filter==='custom'?`<div class="row" style="margin-top:10px;"><div><label>Start Date</label><input id="fs_sssReceiveStart" type="date" value="${esc(filter.start||'')}"></div><div><label>End Date</label><input id="fs_sssReceiveEnd" type="date" value="${esc(filter.end||'')}"></div><div style="display:flex;align-items:flex-end;"><button class="btn blue small" id="fs_sssReceiveApply">Apply</button></div></div>`:''}</div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;"><h3 style="margin:0;font-size:17px;">Dispatch Summary</h3><span style="font-size:12px;color:var(--muted);">${vouchers.length} Voucher${vouchers.length===1?'':'s'}</span></div>
      <div style="display:grid;gap:8px;">${vouchers.length?vouchers.map(v=>`<div class="entity-card" style="padding:11px;display:grid;grid-template-columns:minmax(0,1.6fr) minmax(90px,.7fr) minmax(110px,.8fr) auto;gap:10px;align-items:center;">
        <div><div style="font-weight:800;">${esc(v.voucherNo)}</div><div style="font-size:11px;color:var(--muted);margin-top:3px;">${fmtDate(v.date)} • ${esc(displayName)}</div></div>
        <div><div style="font-size:11px;color:var(--muted);">Total Quantity</div><strong>${esc(factorySaleTotals(rows.filter(p=>v.dispatchIds.includes(String(p.id))),shopkeeper))}</strong></div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;"><button type="button" class="btn ghost small" data-fs_sssreceivevoucher-group="${esc(v.id)}" data-purchaseids="${esc(v.dispatchIds.join(','))}">View</button><button type="button" class="btn blue small" data-fs_sssprintvoucher="${esc(v.id)}" data-purchaseids="${esc(v.dispatchIds.join(','))}">Print</button><button type="button" class="btn red small" data-fs_sssdeletevoucher="${esc(v.id)}" data-purchaseids="${esc(v.dispatchIds.join(','))}">Delete</button></div>
      </div>`).join(''):'<div class="empty">No dispatch found for the selected period.</div>'}</div>
      <div style="display:flex;justify-content:flex-end;gap:18px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid var(--line);font-size:13px;"><strong>Total Quantity: ${esc(factorySaleTotals(rows,shopkeeper))}</strong></div>
    </div>
  </div>`;
}


function shoeSoleVoucherFieldConfig(){
  normalizeShoeSoleReceiveVoucherFields();
  return settings.dispatchVoucherFields;
}
function openShoeSoleReceiveVoucherCustomizeModal(onDone){
  const saved=shoeSoleVoucherFieldConfig();
  const config=JSON.parse(JSON.stringify(saved));
  const removedBuiltins=new Set(Array.isArray(settings.dispatchVoucherRemovedBuiltins)?settings.dispatchVoucherRemovedBuiltins.map(String):[]);
  const renderRows=()=>Object.keys(config).map(id=>{
    const f=SHOE_SOLE_RECEIVE_VOUCHER_FIELDS.find(x=>x.id===id);
    const item=config[id];
    return `<div style="display:grid;grid-template-columns:28px minmax(110px,1fr) minmax(140px,1fr) minmax(130px,1fr) auto;gap:7px;align-items:center;padding:7px;border:1px solid var(--line);border-radius:7px;">
      <input type="checkbox" data-fs_ssv-cfg-show="${esc(id)}" ${item.show?'checked':''}>
      <span>${esc(f?.label||item.label||'Custom Field')}</span>
      <input data-fs_ssv-cfg-label="${esc(id)}" value="${esc(item.label||'')}" placeholder="Label">
      ${item.custom?`<input data-fs_ssv-cfg-value="${esc(id)}" value="${esc(item.value||'')}" placeholder="Value">`:'<span style="font-size:11px;color:var(--muted);">Built-in</span>'}
      <label style="display:flex;align-items:center;gap:3px;font-size:10px;color:var(--muted);white-space:nowrap;">
        <input type="checkbox" data-fs_ssv-cfg-bold="${esc(id)}" ${item.bold===true?'checked':''}> Bold
      </label>
      <button type="button" class="btn red small" data-fs_ssv-cfg-delete="${esc(id)}">Delete</button>
    </div>`;
  }).join('');
  modal(`<h3>Customize Voucher</h3>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px;">Add, select/show, rename, or delete voucher fields. Saved customization is used by the generated voucher and its print output.</div>
    <div id="fs_ssvCustomizeRows" style="display:grid;gap:8px;max-height:360px;overflow:auto;">${renderRows()}</div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;">
      <button type="button" class="btn ghost small" id="fs_ssvCustomizeAdd">＋ Add Field</button>
    </div>
    <div class="modal-actions"><button class="btn brass" id="fs_ssvCustomizeSave">Save</button><button class="btn ghost" id="fs_ssvCustomizeCancel">Cancel</button></div>`);
  const mountRows=()=>{
    const box=document.getElementById('fs_ssvCustomizeRows');
    if(box) box.innerHTML=renderRows();
    document.querySelectorAll('[data-fs_ssv-cfg-delete]').forEach(btn=>btn.onclick=()=>{
      const id=String(btn.dataset.fs_ssvCfgDelete);
      if(SHOE_SOLE_RECEIVE_VOUCHER_FIELDS.some(x=>x.id===id)) removedBuiltins.add(id);
      delete config[id];
      mountRows();
    });
  };
  mountRows();
  document.getElementById('fs_ssvCustomizeAdd').onclick=()=>{
    const label=prompt('Field name / label');
    if(label===null)return;
    const clean=String(label).trim();
    if(!clean){toast('Enter a field name');return;}
    const value=prompt('Field value to show on the voucher',clean);
    if(value===null)return;
    const id='custom_'+uid();
    config[id]={show:true,label:clean,value:String(value).trim(),bold:false,custom:true};
    mountRows();
  };
  document.getElementById('fs_ssvCustomizeCancel').onclick=closeModal;
  document.getElementById('fs_ssvCustomizeSave').onclick=()=>{
    Object.keys(config).forEach(id=>{
      const showEl=document.querySelector(`[data-fs_ssv-cfg-show="${CSS.escape(id)}"]`);
      const labelEl=document.querySelector(`[data-fs_ssv-cfg-label="${CSS.escape(id)}"]`);
      const valueEl=document.querySelector(`[data-fs_ssv-cfg-value="${CSS.escape(id)}"]`);
      const boldEl=document.querySelector(`[data-fs_ssv-cfg-bold="${CSS.escape(id)}"]`);
      if(showEl) config[id].show=showEl.checked;
      if(labelEl) config[id].label=labelEl.value.trim()||config[id].label||'Field';
      if(valueEl) config[id].value=valueEl.value.trim();
      config[id].bold=!!boldEl?.checked;
    });
    settings.dispatchVoucherFields=config;
    settings.dispatchVoucherRemovedBuiltins=Array.from(removedBuiltins);
    persistAll(); closeModal(); toast('Dispatch Voucher customization saved'); if(onDone) onDone();
  };
}
function shoeSoleVoucherLine(field,row,shopkeeper,voucherNo){
  const cfg=shoeSoleVoucherFieldConfig()[field]; if(!cfg?.show)return '';
  let value='';
  if(field==='shopkeeperName') value=shoeSoleSupplierDisplayName(shopkeeper,row.supplierIndex);
  else if(field==='voucherNo') value=voucherNo;
  else if(field==='date') value=fmtDate(row.date);
  else if(field==='time') value=row.date?new Date(row.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'';
  else if(field==='articleName') value=row.articleName;
  else if(field==='atoms') value=factorySaleQuantity(row,shopkeeper);
  else if(field==='totalAtoms') value=row.totalQuantity||factorySaleQuantity({...row,atoms:row.totalAtoms},shopkeeper);
  else if(cfg.custom) value=cfg.value||'';
  return value?`<div class="rline" style="${cfg.bold===true?'font-weight:900;':''}"><span>${esc(cfg.label)}:</span><span>${esc(value)}</span></div>`:'';
}
function shoeSoleVoucherText(field,row,shopkeeper,voucherNo){
  const cfg=shoeSoleVoucherFieldConfig()[field]; if(!cfg?.show)return '';
  let value='';
  if(field==='shopkeeperName') value=shoeSoleSupplierDisplayName(shopkeeper,row.supplierIndex);
  else if(field==='voucherNo') value=voucherNo;
  else if(field==='date') value=fmtDate(row.date);
  else if(field==='time') value=row.date?new Date(row.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'';
  else if(field==='articleName') value=row.articleName;
  else if(field==='atoms') value=factorySaleQuantity(row,shopkeeper);
  else if(field==='totalAtoms') value=row.totalQuantity||factorySaleQuantity({...row,atoms:row.totalAtoms},shopkeeper);
  else if(cfg.custom) value=cfg.value||'';
  return value?`${cfg.label}: ${value}`:'';
}
function shoeSoleCurrentProductTotalAtoms(shopkeeper,product){
  if(!shopkeeper||!product)return 0;
  const b=shoeSoleProductAtomBalanceForSupplier(shopkeeper,product);
  return Math.max(0,Number(b.opening)||0)+Math.max(0,Number(b.newAtom)||0);
}
function renderShoeSoleVoucherPreview(supplierIndex,dispatchIds,notes=''){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex]; const ids=dispatchIds.map(String); const rows=(shopkeeper?.dispatches||[]).filter(p=>ids.includes(String(p.id))); if(!shopkeeper||!rows.length)return '';
  const voucher=Array.isArray(shopkeeper.dispatchVouchers)?shopkeeper.dispatchVouchers.find(v=>(v.dispatchIds||[]).some(id=>ids.includes(String(id)))):null;
  const voucherNo=String(voucher?.voucherNo||rows[0].voucherNo||'—');
  const totalAtoms=rows.reduce((sum,p)=>sum+(Number(p.atoms ?? p.items)||0),0);
  const row0={...rows[0],supplierIndex,totalAtoms,totalQuantity:factorySaleTotals(rows,shopkeeper)};
  const cfg=shoeSoleVoucherFieldConfig();
  const lines=Object.keys(cfg).filter(f=>!['articleName','atoms','totalAtoms','receivingSummary'].includes(f)).map(f=>shoeSoleVoucherLine(f,row0,shopkeeper,voucherNo)).join('');
  const showProduct=cfg.articleName?.show!==false;
  const showReceived=cfg.atoms?.show!==false;
  const productHeader=cfg.articleName?.label||'Article Name';
  const receivedHeader=cfg.atoms?.label||'Sent Quantity';
  const productRows=(showProduct||showReceived)?rows.map(p=>`<tr>${showProduct?`<td style="${cfg.articleName?.bold===true?'font-weight:900;':''}">${esc(p.articleName)}</td>`:''}${showReceived?`<td style="text-align:right;${cfg.atoms?.bold===true?'font-weight:900;':''}">${esc(factorySaleQuantity(p,shopkeeper))}</td>`:''}</tr>`).join(''):'';
  const header=(showProduct||showReceived)?`<table style="width:100%;font-size:11px;border-collapse:collapse;"><thead><tr>${showProduct?`<th style="text-align:left;${cfg.articleName?.bold===true?'font-weight:900;':''}">${esc(productHeader)}</th>`:''}${showReceived?`<th style="text-align:right;${cfg.atoms?.bold===true?'font-weight:900;':''}">${esc(receivedHeader)}</th>`:''}</tr></thead><tbody>${productRows}</tbody></table>`:'';
  const totalLine=cfg.totalAtoms?.show!==false?`<div class="rline" style="${cfg.totalAtoms?.bold===true?'font-weight:900;':''}"><span>${esc(cfg.totalAtoms?.label||'Total Quantity')}:</span><span>${esc(factorySaleTotals(rows,shopkeeper))}</span></div>`:'';
  const summaryByProduct=new Map();
  rows.forEach(p=>{
    const pid=String(p.articleId||'');
    if(summaryByProduct.has(pid))return;
    const product=factorySaleShopArticles(shopkeeper).find(x=>String(x.id)===pid);
    const total=shoeSoleCurrentProductTotalAtoms(shopkeeper,product);
    summaryByProduct.set(pid,{name:p.articleName||product?.name||'Article',total,unit:factorySaleRowUnit(p,shopkeeper)});
  });
  const summary=cfg.receivingSummary?.show!==false?`<div style="margin-top:10px;padding-top:8px;border-top:1px dashed #777;"><div style="font-weight:800;text-align:center;margin-bottom:5px;${cfg.receivingSummary?.bold===true?'font-weight:900;':''}">${esc(cfg.receivingSummary?.label||'DISPATCH SUMMARY')}</div>${Array.from(summaryByProduct.values()).map(x=>`<div class="rline" style="${cfg.receivingSummary?.bold===true?'font-weight:900;':''}"><span>${esc(x.name)}</span><span>TOTAL QUANTITY: ${shoeSoleQuantityDisplay(x.total)} ${esc(x.unit)}</span></div>`).join('')}</div>`:'';
  return `<div id="fs_sssReceiveVoucherPrint" class="receipt-paper" style="width:80mm;margin:auto;"><h3 style="text-align:center;margin:0;">${esc(settings.factoryName||'Leather Right Shoes')}</h3>${settings.address?`<div class="sub">${esc(settings.address)}</div>`:''}<div class="sub" style="font-weight:700;margin-top:3px;">FACTORY SALE DISPATCH VOUCHER</div><hr>${lines}<hr>${header}${totalLine}${summary}</div>`;
}
function shoeSoleVoucherLine(field,row,shopkeeper,voucherNo){
  const cfg=shoeSoleVoucherFieldConfig()[field]; if(!cfg?.show)return '';
  let value='';
  if(field==='shopkeeperName') value=shoeSoleSupplierDisplayName(shopkeeper,row.supplierIndex);
  else if(field==='voucherNo') value=voucherNo;
  else if(field==='date') value=fmtDate(row.date);
  else if(field==='time') value=row.date?new Date(row.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'';
  else if(field==='articleName') value=row.articleName;
  else if(field==='atoms') value=factorySaleQuantity(row,shopkeeper);
  else if(field==='totalAtoms') value=row.totalQuantity||factorySaleQuantity({...row,atoms:row.totalAtoms},shopkeeper);
  return `<div class="rline"><span>${esc(cfg.label)}:</span><span>${esc(value)}</span></div>`;
}
function shoeSoleVoucherText(field,row,shopkeeper,voucherNo){
  const cfg=shoeSoleVoucherFieldConfig()[field]; if(!cfg?.show)return '';
  let value='';
  if(field==='shopkeeperName') value=shoeSoleSupplierDisplayName(shopkeeper,row.supplierIndex);
  else if(field==='voucherNo') value=voucherNo;
  else if(field==='date') value=fmtDate(row.date);
  else if(field==='time') value=row.date?new Date(row.date).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):'';
  else if(field==='articleName') value=row.articleName;
  else if(field==='atoms') value=factorySaleQuantity(row,shopkeeper);
  else if(field==='totalAtoms') value=row.totalQuantity||factorySaleQuantity({...row,atoms:row.totalAtoms},shopkeeper);
  return `${cfg.label}: ${value}`;
}
function openShoeSoleReceiveVoucherBuilder(supplierIndex,initialPurchaseIds){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex]; if(!shopkeeper)return;
  const filter=(window.__shoeSoleReceiveFilters||{})[supplierIndex] || {filter:'today',start:'',end:''};
  const rows=shoeSoleReceiveRows(shopkeeper,filter.filter,filter.start,filter.end);
  let selected=new Set((initialPurchaseIds&&initialPurchaseIds.length?initialPurchaseIds:rows.map(p=>String(p.id))).map(String));
  let notes='';
  const renderBuilder=()=>{
    const totalSelected=rows.filter(p=>selected.has(String(p.id))).reduce((sum,p)=>sum+(Number(p.atoms ?? p.items)||0),0);
    modal(`<h3>Create Dispatch Voucher</h3><div style="font-size:12px;color:var(--muted);margin-bottom:8px;">${esc(shoeSoleSupplierDisplayName(shopkeeper,supplierIndex))} • Select sent items to include.</div><div style="max-height:300px;overflow:auto;">${rows.length?rows.map(p=>`<label style="display:grid;grid-template-columns:24px 1fr auto;gap:8px;align-items:center;padding:8px;border-bottom:1px solid var(--line);cursor:pointer;"><input type="checkbox" data-fs_ssvrow="${esc(p.id)}" ${selected.has(String(p.id))?'checked':''}><span><strong>${esc(p.articleName)}</strong><br><small>${esc(factorySaleQuantity(p,shopkeeper))} • ${fmtDate(p.date)}</small></span><span>${esc(p.voucherNo||'')}</span></label>`).join(''):'<div class="empty">No dispatch entries in the selected period.</div>'}</div><div style="margin-top:10px;"><strong>Selected Atoms: ${shoeSoleQuantityDisplay(totalSelected)} Atoms</strong></div><label style="margin-top:10px;">Notes</label><textarea id="fs_ssvBuilderNotes" rows="2" placeholder="Optional voucher notes">${esc(notes)}</textarea><div class="modal-actions"><button class="btn ghost" id="fs_ssvBuilderCustomize">⚙️ Customize Voucher</button><button class="btn brass" id="fs_ssvBuilderCreate">Create Voucher</button><button class="btn ghost" id="fs_ssvBuilderCancel">Cancel</button></div>`);
    document.querySelectorAll('[data-fs_ssvrow]').forEach(cb=>cb.addEventListener('change',()=>{if(cb.checked)selected.add(String(cb.dataset.fs_ssvrow));else selected.delete(String(cb.dataset.fs_ssvrow));renderBuilder();}));
    document.getElementById('fs_ssvBuilderNotes').addEventListener('input',e=>{notes=e.target.value;});
    document.getElementById('fs_ssvBuilderCancel').onclick=closeModal;
    document.getElementById('fs_ssvBuilderCustomize').onclick=()=>openShoeSoleReceiveVoucherCustomizeModal(renderBuilder);
    document.getElementById('fs_ssvBuilderCreate').onclick=()=>{
      if(!selected.size){toast('Select at least one dispatch entry');return;}
      const ids=Array.from(selected);
      const now=new Date().toISOString();
      const voucherNo=String(settings.nextDispatchVoucherNo||1001);
      settings.nextDispatchVoucherNo=(Number(settings.nextDispatchVoucherNo)||1001)+1;
      shopkeeper.dispatchVouchers=shopkeeper.dispatchVouchers||[];
      shopkeeper.dispatchVouchers.push({id:uid(),voucherNo,date:now,dispatchIds:ids,notes});
      persistAll();
      closeModal();
      openShoeSoleReceiveVoucherModal(supplierIndex,ids);
    };
  };
  renderBuilder();
}
function openShoeSoleReceiveVoucherModal(supplierIndex,dispatchIds,autoPrint=false){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex];
  if(!shopkeeper) return;
  const ids=(dispatchIds||[]).map(String);
  const voucher=(Array.isArray(shopkeeper.dispatchVouchers)?shopkeeper.dispatchVouchers:[]).find(v=>(v.dispatchIds||[]).some(id=>ids.includes(String(id))));
  const rows=(shopkeeper.dispatches||[]).filter(p=>ids.includes(String(p.id)));
  if(!rows.length){toast('Dispatch entry not found');return;}
  const voucherNo=String(voucher?.voucherNo || rows[0].voucherNo || settings.nextDispatchVoucherNo || '—');
  const voucherDate=String(voucher?.date || rows[0].date || new Date().toISOString());
  const rowData={...rows[0],supplierIndex,date:voucherDate,totalAtoms:rows.reduce((sum,p)=>sum+(Number(p.atoms ?? p.items)||0),0),notes:voucher?.notes||rows[0].notes||''};
  const html=renderShoeSoleVoucherPreview(supplierIndex,rows.map(p=>String(p.id)),rowData.notes);
  modal(`<h3>${esc(shoeSoleSupplierDisplayName(shopkeeper,supplierIndex))} — Dispatch Voucher</h3>
    <div style="max-height:520px;overflow:auto;background:#f5f5f5;padding:10px;border-radius:8px;">${html}</div>
    <div class="modal-actions"><button type="button" class="btn blue" id="fs_sssVoucherPrint">🖨️ Print</button><button type="button" class="btn ghost" id="fs_sssVoucherClose">Close</button></div>`);
  document.getElementById('fs_sssVoucherClose').onclick=closeModal;
  document.getElementById('fs_sssVoucherPrint').onclick=()=>{
    const win=window.open('','_blank','width=420,height=700');
    if(!win){toast('Please allow popups to print');return;}
    win.document.write(`<!doctype html><html><head><title>Dispatch Voucher ${esc(voucherNo)}</title><style>@page{size:80mm auto;margin:0}body{font-family:Arial,sans-serif;margin:0;padding:4mm;width:80mm;box-sizing:border-box;}.receipt-paper{width:100%;margin:auto}.rline{display:flex;justify-content:space-between;gap:8px;font-size:10px;margin:3px 0}.sub{font-size:10px;text-align:center}.footer{font-size:10px}table{width:100%;font-size:9px}th,td{padding:2px 1px}hr{border:0;border-top:1px dashed #777;margin:6px 0}@media print{body{width:80mm;padding:4px}}</style></head><body>${html}<script>window.onload=function(){window.print();};<\/script></body></html>`);
    win.document.close();
  };
  if(autoPrint) setTimeout(()=>document.getElementById('fs_sssVoucherPrint')?.click(),120);
}

function deleteShoeSoleReceiveVoucher(supplierIndex,voucherId,dispatchIds){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex];
  if(!shopkeeper) return;
  const ids=(dispatchIds||[]).map(String);
  const vouchers=Array.isArray(shopkeeper.dispatchVouchers)?shopkeeper.dispatchVouchers:[];
  const voucher=vouchers.find(v=>String(v.id)===String(voucherId));
  const finalIds=(voucher?.dispatchIds||ids).map(String);
  const dispatches=Array.isArray(shopkeeper.dispatches)?shopkeeper.dispatches:[];
  const rows=dispatches.filter(p=>finalIds.includes(String(p.id)));
  if(!rows.length){toast('Dispatch voucher not found');return;}
  const totalAtoms=rows.reduce((sum,p)=>sum+(Number(p.atoms ?? p.items)||0),0);
  const voucherNo=voucher?.voucherNo||rows[0].voucherNo||'Dispatch Voucher';
  if(!confirm(`Delete ${voucherNo}?\n\nAtoms: ${shoeSoleQuantityDisplay(totalAtoms)} Atoms\n\nAll stock effects of this voucher will be reversed.`)) return;
  if((settings.billing?.bills||[]).some(b=>String(b.shopkeeperId)===String(shopkeeper.id)&&(b.sourceRecordIds||[]).some(id=>finalIds.includes(String(id))))){toast('Reverse the linked bill before deleting this dispatch.');return;}
  rows.forEach(p=>{
    const product=factorySaleShopArticles(shopkeeper).find(x=>String(x.id)===String(p.articleId));
    const atoms=Math.max(0,Number(p.atoms ?? p.items)||0);
    if(product){
      product.stockItems=Math.max(0,shoeSoleProductStockItems(product)-atoms);
      product.stockBoxes=Math.max(0,(Number(product.stockBoxes)||0)-Math.max(0,Number(p.boxes)||atoms));
    }
  });
  const idSet=new Set(finalIds);
  shopkeeper.dispatches=dispatches.filter(p=>!idSet.has(String(p.id)));
  shopkeeper.dispatchVouchers=vouchers.filter(v=>String(v.id)!==String(voucherId));
  persistAll(); render(); toast(`${voucherNo} deleted — stock and dispatch effects reversed`);
}

function deleteShoeSoleReceiving(supplierIndex,purchaseId){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex];
  if(!shopkeeper) return;
  const dispatches=Array.isArray(shopkeeper.dispatches)?shopkeeper.dispatches:[];
  const purchase=dispatches.find(p=>String(p.id)===String(purchaseId));
  if(!purchase){toast('Dispatch entry not found');return;}
  if((settings.billing?.bills||[]).some(b=>String(b.shopkeeperId)===String(shopkeeper.id)&&(b.sourceRecordIds||[]).includes(String(purchaseId)))){toast('Reverse the linked bill before deleting this dispatch.');return;}
  const product=factorySaleShopArticles(shopkeeper).find(p=>String(p.id)===String(purchase.articleId));
  const atoms=Math.max(0,Number(purchase.atoms ?? purchase.items)||0);
  const label=`${purchase.articleName||product?.name||'Article'} — ${shoeSoleQuantityDisplay(atoms)} Atoms`;
  if(!confirm(`Delete this dispatch entry?\n\n${label}\n\nStock and dispatch effects will be reversed.`)) return;

  if(product){
    product.stockItems=Math.max(0,shoeSoleProductStockItems(product)-atoms);
    product.stockBoxes=Math.max(0,(Number(product.stockBoxes)||0)-Math.max(0,Number(purchase.boxes)||atoms));
  }
  shopkeeper.dispatches=dispatches.filter(p=>String(p.id)!==String(purchaseId));

  // Remove the deleted dispatch from any generated dispatch voucher. Empty
  // vouchers are removed because they no longer represent a real receipt.
  if(Array.isArray(shopkeeper.dispatchVouchers)){
    shopkeeper.dispatchVouchers=shopkeeper.dispatchVouchers
      .map(v=>({...v,dispatchIds:(v.dispatchIds||[]).map(String).filter(id=>id!==String(purchaseId))}))
      .filter(v=>(v.dispatchIds||[]).length>0);
  }

  persistAll();
  render();
  toast('Dispatch deleted — stock and shopkeeper account reversed');
}

function openShoeSoleSupplierModal(index=null){
  const shopkeepers = getShoeSoleSuppliers(),isNew=index===null;
  const shopkeeper = isNew?{id:uid(),name:'',ownerName:'',mobile:'',whatsapp:'',address:'',location:'',photo:'',notes:'',customFields:[],articles:[],dispatches:[],dispatchVouchers:[],account:{openingAmount:0,currentPaid:0,cycleStart:'',advanceBalance:0,payments:[]}}:shopkeepers[index];
  if(!shopkeeper) return;
  let pendingPhoto = shopkeeper.photo || '';
  const title = isNew?'Add Shopkeeper':`Edit Shopkeeper ${index+1}`;
  modal(`
    <h3 style="margin-top:0;">${esc(title)}</h3>
    <div class="row">
      <div><label>Shopkeeper Name</label><input id="fs_sssName" value="${esc(shopkeeper.name||'')}" placeholder="e.g. ABC Shopkeeper"></div>
      <div><label>Owner / Contact Person</label><input id="fs_sssOwner" value="${esc(shopkeeper.ownerName||'')}" placeholder="Owner / Contact Person"></div>
      <div><label>Mobile Number</label><input id="fs_sssMobile" value="${esc(shopkeeper.mobile||'')}" placeholder="0300-1234567"></div>
    </div>
    <div class="row">
      <div><label>WhatsApp Number</label><input id="fs_sssWhatsapp" value="${esc(shopkeeper.whatsapp||'')}" placeholder="0300-1234567"></div>
      <div><label>Shop / Business Address</label><input id="fs_sssAddress" value="${esc(shopkeeper.address||'')}" placeholder="Shop / Business Address"></div>
      <div><label>Location</label><input id="fs_sssLocation" value="${esc(shopkeeper.location||'')}" placeholder="e.g. Main Market"></div>
    </div>
    <label>Notes</label>
    <textarea id="fs_sssNotes" rows="3" placeholder="Any notes about this shopkeeper">${esc(shopkeeper.notes||'')}</textarea>
    <label>Shopkeeper Photo</label>
    <input type="file" id="fs_sssPhoto" accept="image/*">
    <div id="fs_sssPhotoPreviewWrap" style="margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      ${pendingPhoto ? `<img src="${pendingPhoto}" class="settings-logo-preview zoomable" style="max-width:120px;max-height:120px;object-fit:cover;border-radius:8px;">` : '<div style="font-size:12px;color:var(--muted);">No photo selected</div>'}
      ${pendingPhoto ? '<button type="button" class="btn red small" id="fs_sssRemovePhoto">Remove Photo</button>' : ''}
    </div>
    <div class="modal-actions">
      <button class="btn brass" id="fs_sssSave">Save</button>
      <button class="btn ghost" id="fs_sssCancel">Cancel</button>
    </div>
  `);

  document.getElementById('fs_sssCancel').onclick=closeModal;
  document.getElementById('fs_sssPhotoPreviewWrap')?.addEventListener('click',(e)=>{
    if(e.target.tagName==='IMG' && pendingPhoto) openImageLightbox(pendingPhoto);
  });
  document.getElementById('fs_sssPhoto')?.addEventListener('change',(e)=>{
    const file=e.target.files[0];
    if(!file) return;
    openImageCropper(file, async (cropped)=>{
      if(!cropped) return;
      pendingPhoto = await compressImageDataUrl(cropped,700,.78);
      document.getElementById('fs_sssPhotoPreviewWrap').innerHTML = `<img src="${pendingPhoto}" class="settings-logo-preview zoomable" style="max-width:120px;max-height:120px;object-fit:cover;border-radius:8px;"><button type="button" class="btn red small" id="fs_sssRemovePhoto">Remove Photo</button>`;
      document.getElementById('fs_sssRemovePhoto').onclick=()=>{
        pendingPhoto='';
        document.getElementById('fs_sssPhotoPreviewWrap').innerHTML='<div style="font-size:12px;color:var(--muted);">No photo selected</div>';
        document.getElementById('fs_sssPhoto').value='';
      };
    });
  });
  document.getElementById('fs_sssRemovePhoto')?.addEventListener('click',()=>{
    pendingPhoto='';
    document.getElementById('fs_sssPhotoPreviewWrap').innerHTML='<div style="font-size:12px;color:var(--muted);">No photo selected</div>';
    document.getElementById('fs_sssPhoto').value='';
  });
  document.getElementById('fs_sssSave').onclick=()=>{
    const name=document.getElementById('fs_sssName').value.trim();if(!name){toast('Enter shopkeeper name');return;}
    if(isNew&&getShoeSoleSuppliers().some(s=>String(s.id)===String(shopkeeper.id)))return;
    shopkeeper.name=name;
    shopkeeper.ownerName=document.getElementById('fs_sssOwner').value.trim();
    shopkeeper.mobile=document.getElementById('fs_sssMobile').value.trim();
    shopkeeper.whatsapp=document.getElementById('fs_sssWhatsapp').value.trim();
    shopkeeper.address=document.getElementById('fs_sssAddress').value.trim();
    shopkeeper.location=document.getElementById('fs_sssLocation').value.trim();
    shopkeeper.notes=document.getElementById('fs_sssNotes').value.trim();
    shopkeeper.photo=pendingPhoto;
    if(isNew)getShoeSoleSuppliers().push(shopkeeper);
    window.__soleSelectedId=shopkeeper.id;
    persistAll();
    closeModal();
    render();
    toast(`${shoeSoleSupplierDisplayName(shopkeeper,index)} saved`);
  };
}

function openShoeSoleProductModal(supplierIndex,articleId){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex]; if(!shopkeeper) return;
  return factorySaleGlobalArticleModal(articleId||'');
  const product=articleId ? shopkeeper.articles.find(p=>String(p.id)===String(articleId)) : null;
  let pendingPhoto=product?.photo||'';
  let customUnit=product?.customUnit||'';
  modal(`<h3>${product?'Edit':'Add'} Article — ${esc(shoeSoleSupplierDisplayName(shopkeeper,supplierIndex))}</h3>
    <div class="row"><div><label>Article Name</label><input id="fs_sspName" value="${esc(product?.name||'')}" placeholder="e.g. Footprint"></div><div><label>Article Stock (Items)</label><input id="fs_sspStock" type="number" min="0" step="any" value="${product?Math.round(shoeSoleProductStockItems(product)*100)/100:0}"></div><div><label>Article Unit</label><select id="fs_sspUnit"><option value="Box" ${(product?.unit||'Box')==='Box'?'selected':''}>Box</option><option value="Atom" ${(product?.unit||'')==='Atom'?'selected':''}>Atom</option><option value="Piece" ${(product?.unit||'')==='Piece'?'selected':''}>Piece</option><option value="Custom" ${(product?.unit||'')==='Custom'?'selected':''}>Custom Unit</option></select></div></div>
    <div id="fs_sspCustomUnitWrap" style="display:none;"><label>Custom Unit</label><input id="fs_sspCustomUnit" value="${esc(customUnit)}" placeholder="e.g. Packet"></div>
    <label>Rate Per Unit</label><input id="fs_soleRatePerUnit" type="number" min="0" step="any" value="${esc(String(product?.ratePerUnit??0))}">
    <label>Notes / Article Details</label><textarea id="fs_sspNotes" rows="3" placeholder="Article details">${esc(product?.notes||'')}</textarea>
    <label>Article Photo</label><input type="file" id="fs_sspPhoto" accept="image/*">
    <div id="fs_sspPhotoPreview" style="margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">${pendingPhoto?`<img src="${pendingPhoto}" class="settings-logo-preview zoomable" style="max-width:120px;max-height:120px;object-fit:cover;border-radius:8px;"><button type="button" class="btn red small" id="fs_sspRemovePhoto">Remove Photo</button>`:'<div style="font-size:12px;color:var(--muted);">No photo selected</div>'}</div>
    <div class="modal-actions"><button type="button" class="btn brass" id="fs_sspSave">Save Article</button><button type="button" class="btn ghost" id="fs_sspCancel">Cancel</button></div>`);
  const unitEl=document.getElementById('fs_sspUnit'), customWrap=document.getElementById('fs_sspCustomUnitWrap');
  const syncUnit=()=>{customWrap.style.display=unitEl.value==='Custom'?'block':'none';}; syncUnit(); unitEl.onchange=syncUnit;
  document.getElementById('fs_sspCancel').onclick=closeModal;
  document.getElementById('fs_sspPhotoPreview').onclick=e=>{if(e.target.tagName==='IMG'&&pendingPhoto)openImageLightbox(pendingPhoto);};
  document.getElementById('fs_sspPhoto').onchange=e=>{const file=e.target.files[0];if(!file)return;openImageCropper(file,async cropped=>{if(!cropped)return;pendingPhoto=await compressImageDataUrl(cropped,700,.78);document.getElementById('fs_sspPhotoPreview').innerHTML=`<img src="${pendingPhoto}" class="settings-logo-preview zoomable" style="max-width:120px;max-height:120px;object-fit:cover;border-radius:8px;"><button type="button" class="btn red small" id="fs_sspRemovePhoto">Remove Photo</button>`;document.getElementById('fs_sspRemovePhoto').onclick=()=>{pendingPhoto='';document.getElementById('fs_sspPhotoPreview').innerHTML='<div style="font-size:12px;color:var(--muted);">No photo selected</div>';document.getElementById('fs_sspPhoto').value='';};});};
  document.getElementById('fs_sspRemovePhoto')?.addEventListener('click',()=>{pendingPhoto='';document.getElementById('fs_sspPhotoPreview').innerHTML='<div style="font-size:12px;color:var(--muted);">No photo selected</div>';document.getElementById('fs_sspPhoto').value='';});
  document.getElementById('fs_sspSave').onclick=()=>{
    const name=document.getElementById('fs_sspName').value.trim(); if(!name){toast('Enter product name');return;}
    const unit=unitEl.value, cu=document.getElementById('fs_sspCustomUnit').value.trim(); if(unit==='Custom'&&!cu){toast('Enter custom unit');return;}
    const ratePerUnit=Number(document.getElementById('fs_soleRatePerUnit').value);if(!Number.isFinite(ratePerUnit)||ratePerUnit<0){toast('Enter a valid Rate Per Unit');return;}
    const stockItems=Math.max(0,Number(document.getElementById('fs_sspStock').value)||0);
    if(product){
      product.name=name;product.ratePerUnit=ratePerUnit;
      product.unit=unit;
      product.customUnit=cu;
      product.stockItems=stockItems;
      product.stockBoxes=stockItems;
      product.notes=document.getElementById('fs_sspNotes').value.trim();
      product.photo=pendingPhoto;
    }
    else shopkeeper.articles.push({id:uid(),name,photo:pendingPhoto,ratePerUnit,unit,customUnit:cu,stockItems,stockBoxes:stockItems,notes:document.getElementById('fs_sspNotes').value.trim(),customFields:[]});
    persistAll();closeModal();render();toast(product?'Article updated':'Article added');
  };
}
function openShoeSoleProductActionModal(supplierIndex,articleId){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex];
  const product=factorySaleShopArticles(shopkeeper).find(p=>String(p.id)===String(articleId));
  if(!shopkeeper||!product) return;
  const b=shoeSoleProductAtomBalanceForSupplier(shopkeeper,product);
  modal(`<h3>${esc(product.name)} — Article Actions</h3>
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px;">
      <div style="width:58px;height:58px;border-radius:8px;overflow:hidden;background:#f4f1e8;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        ${product.photo?`<img src="${product.photo}" alt="${esc(product.name)}" style="width:100%;height:100%;object-fit:cover;">`:'📦'}
      </div>
      <div style="min-width:0;">
        <div style="font-weight:900;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(product.name)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px;">Opening ${shoeSoleQuantityDisplay(b.opening)} Atoms · New ${shoeSoleQuantityDisplay(b.newAtom)} Atoms · Remaining ${shoeSoleQuantityDisplay(b.remaining)} Atoms</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">
      <button type="button" class="btn blue" id="ssProductActionEdit">✏️ Edit</button>
      <button type="button" class="btn ghost" id="ssProductActionFields">⚙️ Fields</button>
      <button type="button" class="btn brass" id="ssProductActionReceive">＋ Dispatch</button>
      <button type="button" class="btn red" id="ssProductActionDelete">🗑️ Delete</button>
    </div>
    <div class="modal-actions"><button type="button" class="btn ghost" id="ssProductActionClose">Close</button></div>`);
  document.getElementById('ssProductActionClose').onclick=closeModal;
  document.getElementById('ssProductActionEdit').onclick=()=>{closeModal();openShoeSoleProductModal(supplierIndex,articleId);};
  document.getElementById('ssProductActionFields').onclick=()=>{closeModal();openShoeSoleProductCustomFieldsModal(supplierIndex,articleId);};
  document.getElementById('ssProductActionReceive').onclick=()=>{closeModal();openShoeSolePurchaseModal(supplierIndex,articleId);};
  document.getElementById('ssProductActionDelete').onclick=()=>{
    if(!confirm(`کیا آپ اس Article کو Delete کرنا چاہتے ہیں؟\n\n${product.name}`)) return;
    const globalIndex=(settings.articles||[]).findIndex(article=>String(article.id)===String(articleId));
    if(globalIndex>=0){if(getShoeSoleSuppliers().some(shop=>(shop.articles||[]).some(article=>String(article.id)===String(articleId))||(shop.dispatches||[]).some(row=>String(row.articleId)===String(articleId)))||(settings.manualBills||[]).some(bill=>(bill.lines||[]).some(line=>String(line.articleId)===String(articleId)))){toast('This Global Article has saved sales/bills and cannot be deleted.');return;}settings.articles=settings.articles.filter(article=>String(article.id)!==String(articleId));persistAll();closeModal();render();return;}
    const liveSupplier=getShoeSoleSuppliers()[supplierIndex];
    if(!liveSupplier) return;
    const idx=(Array.isArray(liveSupplier.articles)?liveSupplier.articles:[]).findIndex(p=>String(p.id)===String(articleId));
    if(idx<0) return;
    liveSupplier.articles.splice(idx,1);
    persistAll();
    closeModal();
    render();
    toast(`${product.name} deleted`);
  };
}

function openShoeSoleProductCustomFieldsModal(supplierIndex,articleId){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex], product=factorySaleArticles().find(p=>String(p.id)===String(articleId)); if(!product)return;
  const fields=Array.isArray(product.customFields)?product.customFields:[];
  modal(`<h3>${esc(product.name)} — Custom Fields</h3><div style="font-size:12px;color:var(--muted);margin-bottom:12px;">Create additional fields for this product.</div><div style="max-height:360px;overflow:auto;">${fields.length?fields.map(f=>`<div class="card" style="padding:10px;margin-bottom:8px;"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;"><div><div style="font-weight:800;">${esc(f.name)}</div><div style="font-size:12px;color:var(--muted);margin-top:3px;white-space:pre-wrap;">${esc(f.value||'—')}</div></div><div style="display:flex;gap:5px;"><button type="button" class="btn blue small" data-editsspcf="${esc(f.id)}">✏️ Edit</button><button type="button" class="btn red small" data-delsspcf="${esc(f.id)}">Delete</button></div></div></div>`).join(''):'<div class="empty">No custom fields added yet.</div>'}</div><div class="modal-actions"><button type="button" class="btn brass" id="fs_sspAddCf">＋ Add Custom Field</button><button type="button" class="btn ghost" id="fs_sspCfClose">Close</button></div>`);
  document.getElementById('fs_sspCfClose').onclick=closeModal;
  document.getElementById('fs_sspAddCf').onclick=()=>openShoeSoleProductCustomFieldModal(supplierIndex,articleId,null);
  document.querySelectorAll('[data-editsspcf]').forEach(b=>b.onclick=()=>openShoeSoleProductCustomFieldModal(supplierIndex,articleId,b.dataset.editsspcf));
  document.querySelectorAll('[data-delsspcf]').forEach(b=>b.onclick=()=>{if(!confirm('Delete this product custom field?'))return;product.customFields=product.customFields.filter(f=>String(f.id)!==String(b.dataset.delsspcf));persistAll();openShoeSoleProductCustomFieldsModal(supplierIndex,articleId);});
}
function openShoeSoleProductCustomFieldModal(supplierIndex,articleId,fieldId){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex], product=factorySaleArticles().find(p=>String(p.id)===String(articleId)); if(!product)return;
  const field=fieldId?product.customFields.find(f=>String(f.id)===String(fieldId)):null;
  modal(`<h3>${field?'Edit':'Add'} Article Custom Field</h3><label>Field Name</label><input id="fs_sspcfName" value="${esc(field?.name||'')}" placeholder="e.g. Size"><label>Field Value</label><textarea id="fs_sspcfValue" rows="3">${esc(field?.value||'')}</textarea><div class="modal-actions"><button type="button" class="btn brass" id="fs_sspcfSave">Save</button><button type="button" class="btn ghost" id="fs_sspcfCancel">Cancel</button></div>`);
  document.getElementById('fs_sspcfCancel').onclick=()=>openShoeSoleProductCustomFieldsModal(supplierIndex,articleId);
  document.getElementById('fs_sspcfSave').onclick=()=>{const name=document.getElementById('fs_sspcfName').value.trim(),value=document.getElementById('fs_sspcfValue').value.trim();if(!name){toast('Enter a field name');return;}if(product.customFields.some(f=>String(f.id)!==String(fieldId||'')&&String(f.name).toLowerCase()===name.toLowerCase())){toast('This field name already exists');return;}if(field){field.name=name;field.value=value;}else product.customFields.push({id:uid(),name,value});persistAll();openShoeSoleProductCustomFieldsModal(supplierIndex,articleId);};
}
function openShoeSoleReceiveSession(supplierIndex){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex];
  if(!shopkeeper) return;
  const articles=factorySaleShopArticles(shopkeeper);
  if(!articles.length){toast('Add at least one product first');return;}
  const selected={};
  let notes='';
  const today=new Date();
  const defaultDate=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const renderSession=()=>{
    const chosen=articles.filter(p=>selected[String(p.id)]);
    const totalAtoms=chosen.reduce((sum,p)=>sum+(Math.max(0,Number(selected[String(p.id)].atoms)||0)),0);
    modal(`<h3>Create Dispatch Voucher</h3>
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px;">${esc(shoeSoleSupplierDisplayName(shopkeeper,supplierIndex))} • One session will create one voucher for all selected articles.</div>
      <div style="max-height:360px;overflow:auto;border:1px solid var(--line);border-radius:8px;">
        ${articles.map(p=>{
          const key=String(p.id), row=selected[key], checked=!!row, qty=row?.atoms||0;
          return `<div style="display:grid;grid-template-columns:26px minmax(0,1fr) 110px;gap:8px;align-items:center;padding:9px;border-bottom:1px solid var(--line);">
            <input type="checkbox" data-fs_rscheck="${esc(key)}" ${checked?'checked':''}>
            <div style="min-width:0;"><strong>${esc(p.name)}</strong><div style="font-size:11px;color:var(--muted);">${esc(shoeSoleProductDisplayUnit(p))}</div></div>
            <input type="number" min="0" step="any" data-fs_rsqty="${esc(key)}" value="${qty}" ${checked?'':'disabled'} placeholder="Quantity">
          </div>`;
        }).join('')}
      </div>
      <label style="margin-top:10px;">Dispatch Date</label><input id="fs_rsDate" type="date" value="${defaultDate}">
      <label>Notes / Dispatch Details</label><textarea id="fs_rsNotes" rows="2" placeholder="Optional dispatch notes">${esc(notes)}</textarea>
      <div style="display:flex;justify-content:flex-end;gap:18px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid var(--line);font-size:13px;"><strong>Total Atoms: ${shoeSoleQuantityDisplay(totalAtoms)} Atoms</strong></div>
      <div class="modal-actions"><button type="button" class="btn ghost" id="fs_rsCustomize">⚙️ Customize Voucher</button><button type="button" class="btn brass" id="fs_rsSave">Save / Generate Dispatch Voucher</button><button type="button" class="btn ghost" id="fs_rsCancel">Cancel</button></div>`);
    document.querySelectorAll('[data-fs_rscheck]').forEach(cb=>cb.onchange=()=>{
      const key=String(cb.dataset.fs_rscheck);
      if(cb.checked) selected[key]=selected[key]||{atoms:0}; else delete selected[key];
      renderSession();
    });
    document.querySelectorAll('[data-fs_rsqty]').forEach(inp=>inp.onchange=()=>{
      const key=String(inp.dataset.fs_rsqty);
      if(!selected[key]) selected[key]={atoms:0};
      selected[key].atoms=Math.max(0,Number(inp.value)||0);
      renderSession();
    });
    document.getElementById('fs_rsNotes').oninput=e=>{notes=e.target.value;};
    document.getElementById('fs_rsCancel').onclick=closeModal;
    document.getElementById('fs_rsCustomize').onclick=()=>openShoeSoleReceiveVoucherCustomizeModal(renderSession);
    document.getElementById('fs_rsSave').onclick=()=>{
      const chosenNow=articles.filter(p=>selected[String(p.id)] && Math.max(0,Number(selected[String(p.id)].atoms)||0)>0);
      if(!chosenNow.length){toast('Select at least one product and enter Atoms');return;}
      const dateValue=document.getElementById('fs_rsDate').value;
      if(!dateValue){toast('Select dispatch date');return;}
      const now=new Date();
      const parts=dateValue.split('-').map(Number);
      const localReceiveDate=new Date(parts[0],parts[1]-1,parts[2],now.getHours(),now.getMinutes(),now.getSeconds(),now.getMilliseconds());
      const iso=localReceiveDate.toISOString();
      const voucherNo=`FS-${String(settings.nextDispatchVoucherNo||1001).padStart(4,'0')}`;
      settings.nextDispatchVoucherNo=(Number(settings.nextDispatchVoucherNo)||1001)+1;
      const dispatchIds=[];
      chosenNow.forEach(p=>{
        const atoms=Math.max(0,Number(selected[String(p.id)].atoms)||0);
        const currentItems=shoeSoleProductStockItems(p);
        p.stockItems=currentItems+atoms;
        p.stockBoxes=Math.max(0,Number(p.stockBoxes)||0)+atoms;
        const purchase={id:uid(),articleId:p.id,articleName:p.name,unit:shoeSoleProductDisplayUnit(p),ratePerUnit:p.ratePerUnit,date:iso,items:atoms,atoms,boxes:atoms,voucherNo,notes:document.getElementById('fs_rsNotes').value.trim(),time:iso};
        shopkeeper.dispatches.push(purchase); dispatchIds.push(String(purchase.id));
      });
      shopkeeper.dispatchVouchers=shopkeeper.dispatchVouchers||[];
      shopkeeper.dispatchVouchers.push({id:uid(),voucherNo,date:iso,dispatchIds,notes:document.getElementById('fs_rsNotes').value.trim(),createdAt:iso});
      persistAll();
      closeModal();
      render();
      openShoeSoleReceiveVoucherModal(supplierIndex,dispatchIds);
      setTimeout(()=>{
        const shouldPrint=confirm('کیا آپ یہ Voucher Thermal Printer سے Print کرنا چاہتے ہیں؟');
        if(shouldPrint) document.getElementById('fs_sssVoucherPrint')?.click();
      },180);
      toast(`${voucherNo} saved — ${chosenNow.length} articles sent`);
    };
  };
  renderSession();
}

function openShoeSolePurchaseModal(supplierIndex,articleId){
  const shopkeeper=getShoeSoleSuppliers()[supplierIndex];
  const product=factorySaleShopArticles(shopkeeper).find(p=>String(p.id)===String(articleId));
  if(!shopkeeper||!product)return;

  modal(`<h3>Dispatch Article — ${esc(product.name)}</h3>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px;">Shopkeeper: ${esc(shoeSoleSupplierDisplayName(shopkeeper,supplierIndex))}</div>
    <label>Quantity (${esc(shoeSoleProductDisplayUnit(product))})</label>
    <input id="fs_ssPurchaseItems" type="number" min="0" step="any" value="0">
    <label>Date</label>
    <input id="fs_ssPurchaseDate" type="date" value="${(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;})()}">
    <label>Notes / Dispatch Details</label>
    <textarea id="fs_ssPurchaseNotes" rows="3" placeholder="Optional dispatch details"></textarea>
    <div style="font-size:12px;color:var(--muted);margin-top:8px;">Dispatch quantity is recorded in the saved Article unit. No box, pack, item or price conversion is used.</div>
    <div class="modal-actions">
      <button type="button" class="btn brass" id="fs_ssPurchaseSave">Save Dispatch</button>
      <button type="button" class="btn ghost" id="fs_ssPurchaseCancel">Cancel</button>
    </div>`);

  const itemsEl=document.getElementById('fs_ssPurchaseItems');
  document.getElementById('fs_ssPurchaseCancel').onclick=closeModal;

  const request={};
  document.getElementById('fs_ssPurchaseSave').onclick=async()=>{
    const atoms=Number(itemsEl.value),dateValue=document.getElementById('fs_ssPurchaseDate').value;
    if(!dateValue){toast('Select dispatch date');return;}
    const date=new Date(dateValue+'T12:00:00');if(!Number.isFinite(date.getTime())){toast('Select a valid dispatch date');return;}
    const result=await saveShoeSoleReceiving(shopkeeper.id,articleId,atoms,date.toISOString(),document.getElementById('fs_ssPurchaseNotes').value.trim(),new Date().toISOString(),request);
    if(result){closeModal();render();openShoeSoleReceiveVoucherModal(result.supplierIndex,[result.purchaseId]);toast(result.voucherNo+' saved');}
  };
}

function openShoeSolePurchaseHistoryModal(index){
  const shopkeeper=getShoeSoleSuppliers()[index];if(!shopkeeper)return;const rows=(shopkeeper.dispatches||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  modal(`<h3>${esc(shoeSoleSupplierDisplayName(shopkeeper,index))} — Dispatch History</h3><div style="max-height:430px;overflow:auto;"><table><thead><tr><th>Date</th><th>Article</th><th>Quantity</th><th>Notes</th></tr></thead><tbody>${rows.length?rows.map(p=>`<tr><td>${fmtDate(p.date)}</td><td>${esc(p.articleName)}</td><td>${esc(factorySaleQuantity(p,shopkeeper))}</td><td>${esc(p.notes||'')}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">No dispatch recorded.</td></tr>'}</tbody></table></div><div class="modal-actions"><button type="button" class="btn ghost" id="fs_sssPurchaseHistoryClose">Close</button></div>`);
  document.getElementById('fs_sssPurchaseHistoryClose').onclick=closeModal;
}
function openShoeSoleCustomFieldsModal(index){
  const shopkeepers=getShoeSoleSuppliers();
  const shopkeeper=shopkeepers[index];
  if(!shopkeeper) return;
  const fields=Array.isArray(shopkeeper.customFields) ? shopkeeper.customFields : [];
  const title=shoeSoleSupplierDisplayName(shopkeeper,index);
  modal(`
    <h3 style="margin-top:0;">${esc(title)} — Custom Fields</h3>
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px;">Create additional fields for this shopkeeper. Each field has a name and its own value.</div>
    <div style="max-height:360px;overflow:auto;">
      ${fields.length ? fields.map(field=>`
        <div class="card" style="padding:10px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
            <div style="min-width:0;flex:1;">
              <div style="font-weight:800;">${esc(field.name)}</div>
              <div style="font-size:12px;color:var(--muted);margin-top:3px;white-space:pre-wrap;word-break:break-word;">${esc(field.value||'—')}</div>
            </div>
            <div class="actions-cell" style="display:flex;gap:5px;flex-shrink:0;">
              <button type="button" class="btn blue small" data-editssscf="${esc(field.id)}">✏️ Edit</button>
              <button type="button" class="btn red small" data-delssscf="${esc(field.id)}">Delete</button>
            </div>
          </div>
        </div>`).join('') : '<div class="empty">No custom fields added yet.</div>'}
    </div>
    <div class="modal-actions" style="justify-content:space-between;flex-wrap:wrap;">
      <button type="button" class="btn brass" id="fs_sssAddCustomField">＋ Add Custom Field</button>
      <button type="button" class="btn ghost" id="fs_sssCustomFieldsClose">Close</button>
    </div>
  `);
  document.getElementById('fs_sssCustomFieldsClose').onclick=closeModal;
  document.getElementById('fs_sssAddCustomField').onclick=()=>openShoeSoleCustomFieldModal(index,null);
  document.querySelectorAll('[data-editssscf]').forEach(btn=>btn.addEventListener('click',()=>openShoeSoleCustomFieldModal(index,btn.dataset.editssscf)));
  document.querySelectorAll('[data-delssscf]').forEach(btn=>btn.addEventListener('click',()=>{
    const field=shopkeeper.customFields.find(f=>String(f.id)===String(btn.dataset.delssscf));
    if(!field) return;
    if(!confirm(`Delete custom field "${field.name}"?`)) return;
    shopkeeper.customFields=shopkeeper.customFields.filter(f=>String(f.id)!==String(btn.dataset.delssscf));
    persistAll();
    openShoeSoleCustomFieldsModal(index);
    toast('Custom field deleted');
  }));
}

function openShoeSoleCustomFieldModal(index,fieldId){
  const shopkeepers=getShoeSoleSuppliers();
  const shopkeeper=shopkeepers[index];
  if(!shopkeeper) return;
  const field=fieldId ? shopkeeper.customFields.find(f=>String(f.id)===String(fieldId)) : null;
  modal(`
    <h3 style="margin-top:0;">${field?'Edit':'Add'} Custom Field</h3>
    <label>Field Name</label>
    <input id="fs_sssCfName" value="${esc(field?.name||'')}" placeholder="e.g. Box Size">
    <label>Field Value</label>
    <textarea id="fs_sssCfValue" rows="3" placeholder="Enter field value">${esc(field?.value||'')}</textarea>
    <div class="modal-actions">
      <button type="button" class="btn brass" id="fs_sssCfSave">Save</button>
      <button type="button" class="btn ghost" id="fs_sssCfCancel">Cancel</button>
    </div>
  `);
  document.getElementById('fs_sssCfCancel').onclick=()=>openShoeSoleCustomFieldsModal(index);
  document.getElementById('fs_sssCfSave').onclick=()=>{
    const name=document.getElementById('fs_sssCfName').value.trim();
    const value=document.getElementById('fs_sssCfValue').value.trim();
    if(!name){toast('Enter a field name');return;}
    const duplicate=shopkeeper.customFields.some(f=>String(f.id)!==String(fieldId||'') && String(f.name).toLowerCase()===name.toLowerCase());
    if(duplicate){toast('This field name already exists for this shopkeeper');return;}
    if(field){ field.name=name; field.value=value; }
    else shopkeeper.customFields.push({id:uid(),name,value});
    persistAll();
    openShoeSoleCustomFieldsModal(index);
    toast(field?'Custom field updated':'Custom field added');
  };
}



let supplierProductionBillSaving=false;
function supplierProductionActiveWorker(){return getShoeSoleSuppliers().find(s=>String(s.id)===String(window.__soleSelectedId))||null;}
function supplierProductionBillWorker(id){return getShoeSoleSuppliers().find(s=>String(s.id)===String(id))||null;}
function supplierProductionAssignedArticles(shopkeeper){return factorySaleShopArticles(shopkeeper);}
function shoeSoleProductDisplayUnit(product){return product?.unit==='Custom'?String(product.customUnit||'Unit unavailable'):String(product?.unit||'Unit unavailable');}
function upperMoney(n){ return 'Rs. '+Number(n||0).toLocaleString('en-PK'); }
function supplierProductionBillHistoryHtml(workerId){
  const groups=new Map();
  (settings.billing?.bills||[]).filter(bill=>!bill.billingDeleted&&String(bill.shopkeeperId)===String(workerId)).forEach(bill=>{
    const date=new Date(bill.date);let key='unknown',label='Week unavailable';
    if(Number.isFinite(date.getTime())){const week=getUpperWorkWeekRange(date),thursday=new Date(week.end);thursday.setDate(thursday.getDate()-1);key=upperLocalDateKey(week.start);label='Week: '+upperLocalDateKey(week.start)+' — Jumeraat: '+upperLocalDateKey(thursday);}
    if(!groups.has(key))groups.set(key,{label,bills:[]});groups.get(key).bills.push(bill);
  });
  return `<h3>Bill History</h3>${[...groups.entries()].sort(([a],[b])=>b.localeCompare(a)).map(([,group])=>`<h4>${esc(group.label)}</h4><div style="overflow-x:auto;"><table><thead><tr><th>Bill</th><th>Date / Time</th><th>Total</th><th></th></tr></thead><tbody>${group.bills.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(bill=>`<tr><td>#${esc(String(bill.voucherNo))}<small style="display:block;">${esc(bill.shopkeeperName)}</small></td><td>${esc(bill.date)}<small style="display:block;">${esc(fmtTime(new Date(bill.date)))}</small></td><td>${upperMoney(bill.totalAmount)}</td><td><button type="button" class="btn ghost small" data-fs_solebill-shopkeeper-bill-view="${esc(String(bill.id))}">View</button><button type="button" class="btn ghost small" data-fs_solebill-shopkeeper-bill-edit="${esc(String(bill.id))}">Edit</button><button type="button" class="btn red small" data-fs_solebill-shopkeeper-bill-delete="${esc(String(bill.id))}">Delete</button></td></tr>`).join('')}</tbody></table></div>`).join('')||'<p>No weekly bills saved for this shopkeeper.</p>'}`;
}
function supplierProductionBillAmounts(lines){
 let totalCents=0;
 const calculated=lines.map(line=>{
  const qty=Number(line.qty),rate=Number(line.rate),unit=String(line.unit||'ATOMS'),cents=Math.round(qty*rate*100),fractionalAllowed=true;
  if(!Number.isFinite(qty)||qty<0||qty>Number.MAX_SAFE_INTEGER||(!fractionalAllowed&&!Number.isSafeInteger(qty)))throw Error('Invalid sent quantity for '+String(line.articleName||'article/material')+' ('+unit+').');
  if(line.rate===undefined||line.rate===null||line.rate===''||!Number.isFinite(rate)||rate<0)throw Error('Missing/invalid saved rate for '+String(line.articleName||'article/material')+'.');
  if(!Number.isSafeInteger(cents))throw Error('Bill amount is too large.');totalCents+=cents;if(!Number.isSafeInteger(totalCents))throw Error('Bill amount is too large.');
  return {articleId:String(line.articleId),articleName:String(line.articleName),unit,qty,rate,amount:cents/100};
 });
 return {lines:calculated,totalAmount:totalCents/100};
}
function supplierProductionBillAccountState(workerId){const account=settings.billing?.accounts?.[String(workerId)];return account?{exists:true,value:JSON.parse(JSON.stringify(account))}:{exists:false};}
function supplierProductionReceivedBillData(worker){
 const {start,end}=getUpperWorkWeekRange(new Date()),history=(settings.billing?.bills||[]).filter(b=>billAccountKeepsReceived(b)&&String(b.shopkeeperId)===String(worker.id)),closed=new Set(history.flatMap(b=>b.sourceRecordIds||[]).map(String)),lines=new Map(),sourceRecordIds=[];
 const released=billAccountReleasedIds(settings.billing?.bills,worker.id,'shopkeeperId');
 const records=(worker.dispatches||[]).filter(record=>{const date=new Date(record.date);return (date>=start&&date<end&&date.getDay()!==5)||released.has(String(record.id));}),unbilled=records.filter(record=>!closed.has(String(record.id))),present=value=>(typeof value==='number'||typeof value==='string')&&(typeof value!=='string'||value.trim()!==''),name=value=>String(value||'sent record');
 const add=(record,articleId,articleName,unit,rate,qty)=>{if(!record.id)throw Error('Missing saved sent-record ID for '+name(articleName));if(!unit||!String(unit).trim())throw Error('Missing saved Unit for '+name(articleName));const key=JSON.stringify([String(articleId),unit,rate]),line=lines.get(key)||{articleId:String(articleId),articleName,unit,rate,qty:0};line.qty=line.qty+qty;lines.set(key,line);if(!sourceRecordIds.includes(String(record.id)))sourceRecordIds.push(String(record.id));};
 unbilled.forEach(record=>{const rawQty=record.atoms??record.items??record.boxes;if(!present(rawQty))throw Error('Invalid/missing sent quantity for '+name(record.articleName));const qty=Number(rawQty);if(!Number.isFinite(qty)||qty<0)throw Error('Invalid/missing sent quantity for '+name(record.articleName));if(qty===0)return;
  const article=factorySaleShopArticles(worker).find(a=>String(a.id)===String(record.articleId));if(!article)throw Error('Missing saved article/material: '+name(record.articleName));
  const productUnit=shoeSoleProductDisplayUnit(article),unit=record.unit==='Custom'?String(record.customUnit||productUnit):String(record.unit||productUnit);if(!unit.trim()||unit==='Unit unavailable')throw Error('Missing saved Unit for '+name(record.articleName||article.name));
  const rawRate=record.ratePerUnit??article.ratePerUnit;if(!present(rawRate)||!Number.isFinite(Number(rawRate))||Number(rawRate)<0)throw Error('Missing/invalid saved rate for '+name(record.articleName||article.name));if(!present(record.ratePerUnit)&&unit!==productUnit)throw Error('Missing saved rate for sent Unit '+unit+' of '+name(record.articleName||article.name));
  add(record,article.id,record.articleName||article.name,unit,Number(rawRate),qty);});
 if(sourceRecordIds.length&&history.some(b=>!Array.isArray(b.sourceRecordIds)&&new Date(b.date)>=start&&new Date(b.date)<end))throw Error('This period has a legacy bill without sent-record links. Rebilling is blocked to protect history.');
 const emptyReason=lines.size?'':records.length>unbilled.length?'Already billed: sent records for this period are closed.':'No sent records for selected period.';
 return {lines:[...lines.values()],sourceRecordIds,periodFrom:upperLocalDateKey(start),periodTo:upperLocalDateKey(new Date(end.getTime()-86400000)),emptyReason};
}
function supplierProductionBillActivity(worker){return JSON.stringify({records:worker.dispatches||[],articles:worker.articles||[]});}
async function supplierProductionBillFingerprint(activity){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(activity));return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}
function supplierProductionBillReversalError(bill,fingerprint){
 const state=settings.billing,proof=bill.billReversal;if(!proof||proof.version!==1)return 'This legacy bill has no exact reversal snapshot. Nothing was changed.';
 if(String(state?.bills?.at(-1)?.id)!==String(bill.id))return 'Reverse or edit the latest bill first; later bills depend on its balance.';
 if(fingerprint!==proof.activityFingerprint||JSON.stringify(supplierProductionBillAccountState(bill.shopkeeperId))!==JSON.stringify(proof.afterAccount)||JSON.stringify(state.nextVoucherNo)!==JSON.stringify(proof.afterCounter))return 'Sent data or account changed after this bill. Exact reversal is blocked to protect newer records.';
 return '';
}
function supplierProductionAccountAdapter(workerId){const worker=supplierProductionBillWorker(workerId);if(!worker)return null;return billAccountLineAdapter({id:worker.id,name:worker.name,ownerKey:'shopkeeperId',cancelId:'fs_soleBill_supplierBillCancel',get:()=>settings.billing,set:value=>{settings={...settings,billing:value};},valid:()=>String(supplierProductionActiveWorker()?.id||'')===String(worker.id),busy:()=>supplierProductionBillSaving,lock:value=>{supplierProductionBillSaving=value;},save:()=>saveCriticalCloudState(),reconcile:()=>reconcileCloudAfterCriticalRollback(),back:()=>openSupplierProductionBill(worker.id)});}
function openSupplierProductionBill(workerId){
  if(String(supplierProductionActiveWorker()?.id||'')!==String(workerId)){toast('Select this Shopkeeper Card first.');return;}
  const worker=supplierProductionBillWorker(workerId);if(!worker)return;
  let sent;try{sent=supplierProductionReceivedBillData(worker);supplierProductionBillAmounts(sent.lines);}catch(error){toast(error.message);sent={lines:[],sourceRecordIds:[],emptyReason:error.message};}const lines=sent.lines;
  try{supplierProductionBillAmounts(lines);}catch(error){toast(error.message);return;}
  const account=(settings.billing?.accounts||{})[String(worker.id)];
  modal(`<h3>Create Bill — ${esc(worker.name)}</h3><div class="row"><div><label>Opening Amount</label><input id="fs_soleBill_supplierBillOpening" type="number" min="0" step="0.01" value="${esc(String(account?.currentBalance??account?.openingAmount??0))}" ${account?.startingBalance!=null?'readonly':''}><button type="button" class="btn ghost small" id="fs_soleBill_supplierBillSaveOpening" ${account?.startingBalance!=null?'disabled':''}>Save Opening Amount</button></div><div><label>Extra Balance</label><input id="fs_soleBill_supplierBillExtra" type="number" min="0" step="0.01" value="0"></div></div><div style="overflow-x:auto;margin-top:10px;"><table><thead><tr><th>Article Name</th><th>Quantity</th><th>Rate Per Unit</th><th>Amount</th></tr></thead><tbody>${lines.map((line,index)=>`<tr><td>${esc(line.articleName)}</td><td><input type="number" min="0" step="any" value="${esc(String(line.qty))}" readonly data-fs_solebill-shopkeeper-bill-qty="${index}" aria-label="${esc(line.articleName)} quantity ${esc(line.unit)}" style="min-width:80px;"> ${esc(line.unit)}</td><td>${upperMoney(line.rate)}</td><td data-fs_solebill-shopkeeper-bill-amount="${index}">${upperMoney(0)}</td></tr>`).join('')||`<tr><td colspan="4">${esc(sent.emptyReason||'No sent records for selected period.')}</td></tr>`}</tbody></table></div><div class="rline"><strong>Weekly Total</strong><strong id="fs_soleBill_supplierBillTotal">${upperMoney(0)}</strong></div><div class="row"><div><label>Paid Amount</label><input id="fs_soleBill_supplierBillPaid" type="number" min="0" step="0.01" value="0"></div><div><label>Remaining Balance</label><input id="fs_soleBill_supplierBillRemaining" readonly></div></div><div class="rline"><strong>Grand Total</strong><strong id="fs_soleBill_supplierBillGrand"></strong></div><div class="modal-actions"><button type="button" class="btn brass" id="fs_soleBill_supplierBillCreate" ${lines.length?'':'disabled'}>Create Bill</button><button type="button" class="btn ghost" id="fs_soleBill_supplierBillCancel">Cancel</button></div>${supplierProductionBillHistoryHtml(worker.id)}`);
  const billModal=document.querySelector('#modalRoot .modal');
  if(billModal){billModal.style.setProperty('width','min(900px, calc(100vw - 28px))','important');billModal.style.setProperty('max-width','900px','important');billModal.style.setProperty('height','85vh','important');billModal.style.setProperty('max-height','85vh','important');}
  document.querySelectorAll('[data-fs_solebill-shopkeeper-bill-view]').forEach(button=>button.addEventListener('click',()=>{const bill=(settings.billing?.bills||[]).find(v=>String(v.id)===String(button.dataset.fs_solebillShopkeeperBillView)&&String(v.shopkeeperId)===String(worker.id));if(bill)showSupplierProductionBill(bill);}));
  document.querySelectorAll('[data-fs_solebill-shopkeeper-bill-edit]').forEach(button=>button.addEventListener('click',()=>openSupplierProductionBillEditor(worker.id,button.dataset.fs_solebillShopkeeperBillEdit)));
  document.querySelectorAll('[data-fs_solebill-shopkeeper-bill-delete]').forEach(button=>button.addEventListener('click',()=>deleteSupplierProductionBill(worker.id,button.dataset.fs_solebillShopkeeperBillDelete)));
  const collect=()=>lines.map(line=>({...line}));
  const update=()=>{
    try{const calculated=supplierProductionBillAmounts(collect());calculated.lines.forEach((line,index)=>document.querySelector(`[data-fs_solebill-shopkeeper-bill-amount="${index}"]`).textContent=upperMoney(line.amount));document.getElementById('fs_soleBill_supplierBillTotal').textContent=upperMoney(calculated.totalAmount);const grand=(Math.round(calculated.totalAmount*100)+Math.round(Number(document.getElementById('fs_soleBill_supplierBillOpening').value)*100)+Math.round(Number(document.getElementById('fs_soleBill_supplierBillExtra').value)*100))/100;document.getElementById('fs_soleBill_supplierBillGrand').textContent=upperMoney(grand);document.getElementById('fs_soleBill_supplierBillRemaining').value=upperMoney((Math.round(grand*100)-Math.round(Number(document.getElementById('fs_soleBill_supplierBillPaid').value)*100))/100);}
    catch(error){document.getElementById('fs_soleBill_supplierBillTotal').textContent=error.message;}
  };
  document.querySelectorAll('[data-fs_solebill-shopkeeper-bill-qty]').forEach(input=>input.addEventListener('input',update));
  document.getElementById('fs_soleBill_supplierBillSaveOpening').onclick=()=>saveSupplierProductionBill(worker.id,null,document.getElementById('fs_soleBill_supplierBillOpening').value);
  document.getElementById('fs_soleBill_supplierBillCreate').onclick=()=>saveSupplierProductionBill(worker.id,collect(),document.getElementById('fs_soleBill_supplierBillOpening').value,document.getElementById('fs_soleBill_supplierBillPaid').value,sent,document.getElementById('fs_soleBill_supplierBillExtra').value);
  document.getElementById('fs_soleBill_supplierBillCancel').onclick=()=>{if(!supplierProductionBillSaving)closeModal();};
  ['fs_soleBill_supplierBillOpening','fs_soleBill_supplierBillExtra','fs_soleBill_supplierBillPaid'].forEach(id=>document.getElementById(id).addEventListener('input',update));update();

  mountBillAccountActions(supplierProductionAccountAdapter(worker.id),'[data-fs_solebill-shopkeeper-bill-view]',button=>button.getAttribute('data-fs_solebill-shopkeeper-bill-view'));
}
async function saveSupplierProductionBill(workerId,lines,openingValue,paidValue=0,sent=null,extraValue=0){
 if(String(supplierProductionActiveWorker()?.id||'')!==String(workerId)){toast('Select this Shopkeeper Card first.');return false;}
 const worker=supplierProductionBillWorker(workerId);if(!worker||supplierProductionBillSaving)return false;
 const openingAmount=Math.round(Number(openingValue)*100)/100,paidAmount=Math.round(Number(paidValue)*100)/100,extraBalanceAmount=Math.round(Number(extraValue)*100)/100;
 if(![Number(openingValue),Number(paidValue),Number(extraValue)].every(n=>Number.isFinite(n)&&n>=0&&Number.isSafeInteger(Math.round(n*100)))){toast('Enter valid Opening, Extra Balance and Paid Amounts.');return false;}
 const previous=settings.billing,existed=Object.prototype.hasOwnProperty.call(settings,'billing'),state=previous||{accounts:{},bills:[],nextVoucherNo:1001},account=state.accounts?.[String(worker.id)];
 if(!lines&&account?.startingBalance!=null){toast('Starting Opening Amount is already saved.');return false;}
 if(lines&&account&&openingAmount!==(account.currentBalance??account.openingAmount??0)){toast('Opening changed. Reopen Create Bill.');return false;}
 let calculated=null,current=null,remainingBalance=openingAmount;
 if(lines){try{current=supplierProductionReceivedBillData(worker);if(!sent||JSON.stringify(sent)!==JSON.stringify(current)||JSON.stringify(lines)!==JSON.stringify(current.lines))throw Error('Sent data changed. Reopen Create Bill.');calculated=supplierProductionBillAmounts(current.lines);if(!calculated.lines.some(line=>line.qty>0))throw Error('No unbilled sent quantity is available.');remainingBalance=(Math.round(openingAmount*100)+Math.round(calculated.totalAmount*100)+Math.round(extraBalanceAmount*100)-Math.round(paidAmount*100))/100;if(!Number.isSafeInteger(Math.round(remainingBalance*100))||remainingBalance<0)throw Error('Paid Amount cannot exceed Grand Total.');}catch(error){toast(error.message);return false;}}
 const stateBefore=JSON.stringify(settings.billing),activity=supplierProductionBillActivity(worker);supplierProductionBillSaving=true;
 for(const suffix of ['SaveOpening','Create','Cancel']){const button=document.getElementById('fs_soleBill_supplierBill'+suffix);if(button)button.disabled=true;}
 let bill=null;
 try{
  const fingerprint=await supplierProductionBillFingerprint(activity);if(stateBefore!==JSON.stringify(settings.billing)||activity!==supplierProductionBillActivity(worker))throw Error('Bill data changed. Reopen Create Bill.');
  const date=new Date().toISOString(),beforeAccount=supplierProductionBillAccountState(worker.id),beforeCounter={exists:!!previous&&Object.prototype.hasOwnProperty.call(previous,'nextVoucherNo'),value:previous?.nextVoucherNo},accounts={...(state.accounts||{}),[String(worker.id)]:{...(account||{}),shopkeeperId:String(worker.id),shopkeeperName:worker.name,startingBalance:account?.startingBalance??openingAmount,openingAmount:remainingBalance,currentBalance:remainingBalance,savedAt:account?.savedAt||date,updatedAt:date}};let next={...state,accounts};
  if(calculated){const voucherNo=Math.max(1001,Number(state.nextVoucherNo)||1001,...(state.bills||[]).map(v=>(Number(v.voucherNo)||0)+1));bill={billingLifecycleVersion:1,id:uid(),shopkeeperId:String(worker.id),shopkeeperName:worker.name,voucherNo,date,createdAt:date,pendingAmount:openingAmount,extraBalanceAmount,paidAmount,remainingBalance,...calculated,sourceRecordIds:current.sourceRecordIds,periodFrom:current.periodFrom,periodTo:current.periodTo};accounts[String(worker.id)].lastBillId=bill.id;bill.billReversal={version:1,beforeAccount,beforeCounter,afterAccount:{exists:true,value:JSON.parse(JSON.stringify(accounts[String(worker.id)]))},afterCounter:voucherNo+1,activityFingerprint:fingerprint};next={...next,bills:[...(state.bills||[]),bill],nextVoucherNo:voucherNo+1};}
  settings={...settings,billing:next};if(!await saveCriticalCloudState())throw Error('Bill save failed');
 }catch(error){if(existed)settings={...settings,billing:previous};else delete settings.billing;try{await reconcileCloudAfterCriticalRollback();}catch(rollbackError){console.error(rollbackError);}toast(error.message||'Bill was not saved.');return false;}
 finally{supplierProductionBillSaving=false;for(const suffix of ['SaveOpening','Create','Cancel']){const button=document.getElementById('fs_soleBill_supplierBill'+suffix);if(button)button.disabled=false;}}
 if(bill){closeModal();showSupplierProductionBill(bill);}else{openSupplierProductionBill(worker.id);toast('Opening Amount saved');}return true;
}
function openSupplierProductionBillEditor(workerId,billId){
 if(String(supplierProductionActiveWorker()?.id||'')!==String(workerId)){toast('Select this Shopkeeper Card first.');return;}
 const bill=(settings.billing?.bills||[]).find(b=>String(b.id)===String(billId)&&String(b.shopkeeperId)===String(workerId));if(!bill||supplierProductionBillSaving)return;
 modal('<h3>Edit Bill #'+esc(bill.voucherNo)+'</h3><label>Opening Amount</label><input id="fs_soleBill_supplierBillEditOpening" type="number" min="0" step="0.01" value="'+esc(bill.pendingAmount??0)+'"><label>Extra Balance</label><input id="fs_soleBill_supplierBillEditExtra" type="number" min="0" step="0.01" value="'+esc(bill.extraBalanceAmount??0)+'"><table><thead><tr><th>Article</th><th>Sent Quantity</th><th>Rate</th><th>Amount</th></tr></thead><tbody>'+(bill.lines||[]).map(line=>'<tr><td>'+esc(line.articleName)+'</td><td>'+esc(line.qty)+' '+esc(line.unit)+'</td><td>'+upperMoney(line.rate)+'</td><td>'+upperMoney(line.amount)+'</td></tr>').join('')+'</tbody></table><label>Paid Amount</label><input id="fs_soleBill_supplierBillEditPaid" type="number" min="0" step="0.01" value="'+esc(bill.paidAmount??0)+'"><div class="rline"><strong>Grand Total</strong><strong id="fs_soleBill_supplierBillEditGrand">'+upperMoney(supplierProductionBillTotals(bill).grandTotal)+'</strong></div><div class="rline"><strong>Remaining Balance</strong><strong id="fs_soleBill_supplierBillEditRemaining"></strong></div><div class="modal-actions"><button class="btn brass" id="fs_soleBill_supplierBillEditSave">Save</button><button class="btn ghost" id="fs_soleBill_supplierBillEditCancel">Cancel</button></div>');
 const update=()=>{const total=supplierProductionBillTotals({...bill,extraBalanceAmount:Number(document.getElementById('fs_soleBill_supplierBillEditExtra').value)}).grandTotal;document.getElementById('fs_soleBill_supplierBillEditGrand').textContent=upperMoney(total);document.getElementById('fs_soleBill_supplierBillEditRemaining').textContent=upperMoney((Math.round(total*100)-Math.round(Number(document.getElementById('fs_soleBill_supplierBillEditPaid').value)*100))/100);};['fs_soleBill_supplierBillEditPaid','fs_soleBill_supplierBillEditExtra'].forEach(id=>document.getElementById(id).addEventListener('input',update));update();
 document.getElementById('fs_soleBill_supplierBillEditSave').onclick=()=>saveSupplierProductionBillHistory(workerId,billId,bill.lines.map(line=>line.qty),document.getElementById('fs_soleBill_supplierBillEditPaid').value,document.getElementById('fs_soleBill_supplierBillEditExtra').value);document.getElementById('fs_soleBill_supplierBillEditCancel').onclick=()=>{if(!supplierProductionBillSaving)openSupplierProductionBill(workerId);};

 mountBillAccountEditor(supplierProductionAccountAdapter(workerId),{billId,opening:'fs_soleBill_supplierBillEditOpening',paid:'fs_soleBill_supplierBillEditPaid',save:'fs_soleBill_supplierBillEditSave',remaining:'fs_soleBill_supplierBillEditRemaining',grand:'fs_soleBill_supplierBillEditGrand',extra:'fs_soleBill_supplierBillEditExtra'});
}
function deleteSupplierProductionBill(workerId,billId){const adapter=supplierProductionAccountAdapter(workerId);if(adapter)confirmBillAccountDelete(adapter,billId);}
function showSupplierProductionBill(bill){
  if(String(supplierProductionActiveWorker()?.id||'')!==String(bill?.shopkeeperId)){toast('Select this Shopkeeper Card first.');return;}
  if(!supplierProductionBillWorker(bill.shopkeeperId))return;
  modal(`<h3 style="margin-top:0;">Weekly Voucher #${esc(String(bill.voucherNo))}</h3><div style="display:flex;flex-direction:column;align-items:center;width:100%;"><div id="fs_soleBill_soleBill_supplierBillPrintArea" class="receipt-paper" style="width:80mm;margin:auto;">${supplierProductionBillHtml(bill)}</div><div class="modal-actions" style="display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:nowrap;width:100%;clear:both;position:relative;margin-top:12px;"><button type="button" class="btn brass" id="fs_soleBill_supplierBillPrint">Print</button><button type="button" class="btn ghost" id="fs_soleBill_supplierBillShare">Share</button><button type="button" class="btn ghost" id="fs_soleBill_supplierBillClose">Close</button></div></div>`);
  document.getElementById('fs_soleBill_supplierBillPrint').onclick=()=>printElement('fs_soleBill_soleBill_supplierBillPrintArea');
  document.getElementById('fs_soleBill_supplierBillShare').onclick=async()=>{
    try{const canvas=buildSupplierProductionBillCanvas(bill);canvas.toBlob(async blob=>{try{if(!blob){toast('Could not generate voucher image');return;}await shareImageToWhatsApp(blob,`shopkeeper-weekly-voucher-${bill.voucherNo}.png`,`Weekly Voucher #${bill.voucherNo}`);}catch(error){toast('Could not share voucher image');}},'image/png');}
    catch(error){toast('Could not generate voucher image');}
  };
  document.getElementById('fs_soleBill_supplierBillClose').onclick=()=>{closeModal();render();};
}
async function saveSupplierProductionBillHistory(workerId,billId,quantities,paidValue=0,extraValue=null){
 if(String(supplierProductionActiveWorker()?.id||'')!==String(workerId)){toast('Select this Shopkeeper Card first.');return false;}
 const worker=supplierProductionBillWorker(workerId),previous=settings.billing,bill=(previous?.bills||[]).find(b=>String(b.id)===String(billId)&&String(b.shopkeeperId)===String(workerId));if(!worker||!bill||supplierProductionBillSaving)return false;
 if(quantities!==null&&JSON.stringify(quantities)!==JSON.stringify(bill.lines.map(line=>line.qty))){toast('Sent quantities cannot be manually changed.');return false;}
 const extraBalanceAmount=extraValue===null?(Number(bill.extraBalanceAmount)||0):Math.round(Number(extraValue)*100)/100,paidAmount=Math.round(Number(paidValue)*100)/100,grand=supplierProductionBillTotals({...bill,extraBalanceAmount}).grandTotal,remainingBalance=(Math.round(grand*100)-Math.round(paidAmount*100))/100;
 if(quantities!==null&&(!Number.isFinite(extraBalanceAmount)||extraBalanceAmount<0||!Number.isSafeInteger(Math.round(extraBalanceAmount*100))||!Number.isFinite(Number(paidValue))||Number(paidValue)<0||!Number.isSafeInteger(Math.round(paidAmount*100))||remainingBalance<0)){toast('Enter a Paid Amount between zero and Grand Total.');return false;}
 const stateBefore=JSON.stringify(previous),activity=supplierProductionBillActivity(worker);supplierProductionBillSaving=true;let updated=null;
 for(const suffix of ['EditSave','EditCancel']){const button=document.getElementById('fs_soleBill_supplierBill'+suffix);if(button)button.disabled=true;}
 try{
  const fingerprint=await supplierProductionBillFingerprint(activity);if(stateBefore!==JSON.stringify(settings.billing)||activity!==supplierProductionBillActivity(worker))throw Error('Bill data changed. Reopen it.');if(quantities===null||bill.billReversal){const error=supplierProductionBillReversalError(bill,fingerprint);if(error)throw Error(error);}
  const accounts={...(previous.accounts||{})};let next={...previous,accounts};
  if(quantities===null){const proof=bill.billReversal;if(proof.beforeAccount.exists)accounts[String(workerId)]=JSON.parse(JSON.stringify(proof.beforeAccount.value));else delete accounts[String(workerId)];if(proof.beforeCounter.exists)next.nextVoucherNo=proof.beforeCounter.value;else delete next.nextVoucherNo;next.bills=previous.bills.filter(b=>String(b.id)!==String(billId));}
  else{const updatedAt=new Date().toISOString();updated={...bill,extraBalanceAmount,paidAmount,remainingBalance,updatedAt};if(bill.billReversal){const account={...accounts[String(workerId)],openingAmount:remainingBalance,currentBalance:remainingBalance,updatedAt};accounts[String(workerId)]=account;updated.billReversal={...bill.billReversal,afterAccount:{exists:true,value:JSON.parse(JSON.stringify(account))}};}next.bills=previous.bills.map(b=>String(b.id)===String(billId)?updated:b);}
  settings={...settings,billing:next};if(!await saveCriticalCloudState())throw Error('Bill history save failed');
 }catch(error){settings={...settings,billing:previous};try{await reconcileCloudAfterCriticalRollback();}catch(rollbackError){console.error(rollbackError);}toast(error.message||'Bill changes were not saved.');return false;}
 finally{supplierProductionBillSaving=false;for(const suffix of ['EditSave','EditCancel']){const button=document.getElementById('fs_soleBill_supplierBill'+suffix);if(button)button.disabled=false;}}
 closeModal();if(updated)showSupplierProductionBill(updated);else openSupplierProductionBill(workerId);toast(updated?'Bill updated':'Bill reversed; sent records are eligible again');return true;
}
function supplierProductionBillTotals(bill){
  const weeklyCents=(bill.lines||[]).reduce((sum,line)=>sum+Math.round((Number(line.amount)||0)*100),0);
  const opening=settings.billing?.accounts?.[String(bill.shopkeeperId)]?.openingAmount;
  const pendingCents=Math.round((Number(bill.pendingAmount??opening??0)||0)*100);
  return {weeklyTotal:weeklyCents/100,pendingAmount:pendingCents/100,extraBalanceAmount:Number(bill.extraBalanceAmount)||0,grandTotal:(weeklyCents+pendingCents+Math.round((Number(bill.extraBalanceAmount)||0)*100))/100};
}
function supplierProductionBillHtml(bill){
  const totals=supplierProductionBillTotals(bill),date=new Date(bill.date);
  const dateText=date.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),timeText=date.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true});
  const rule='<hr style="border:0;border-top:2px solid #000;margin:4px 0;">',row='display:flex;justify-content:space-between;align-items:baseline;gap:4px;white-space:nowrap;overflow-wrap:normal;text-align:left;';
  return `<div style="width:100%;max-width:80mm;box-sizing:border-box;font-family:Arial,sans-serif;font-weight:700;font-size:11px;line-height:1.25;color:#000;overflow-wrap:anywhere;"><div style="text-align:center;font-size:14px;font-weight:1000;line-height:1.15;margin-bottom:5px;white-space:nowrap;overflow-wrap:normal;">LEATHER RIGHT SHOES BY ABID</div><div style="${row}font-size:12px;font-weight:900;"><span>${esc(bill.shopkeeperName)}</span><span style="white-space:nowrap;">VOUCHER #${esc(String(bill.voucherNo))}</span></div><div style="${row}margin-top:4px;font-weight:700;"><span>${esc(dateText)}</span><span style="white-space:nowrap;">${esc(timeText)}</span></div>${rule}<table style="width:100%;table-layout:fixed;border-collapse:collapse;"><colgroup><col style="width:36%;"><col style="width:33%;"><col style="width:31%;"></colgroup><thead><tr><th style="text-align:left;padding:3px 1px;white-space:nowrap;overflow-wrap:normal;border-bottom:1px solid #000;font-weight:800;">ARTICLE</th><th style="text-align:center;padding:3px 1px;white-space:nowrap;overflow-wrap:normal;border-bottom:1px solid #000;font-weight:800;">QUANTITY</th><th style="text-align:right;padding:3px 1px;white-space:nowrap;overflow-wrap:normal;border-bottom:1px solid #000;font-weight:800;">AMOUNT</th></tr></thead><tbody>${bill.lines.map(line=>`<tr><td style="text-align:left;padding:3px 1px;vertical-align:top;">${esc(line.articleName)}</td><td style="text-align:center;padding:3px 1px;vertical-align:top;white-space:nowrap;overflow-wrap:normal;font-size:12px;font-weight:800;">${esc(String(line.qty))} ${esc(line.unit)}</td><td style="text-align:right;padding:3px 1px;vertical-align:top;white-space:nowrap;overflow-wrap:normal;font-size:12px;font-weight:800;">${upperMoney(line.amount)}</td></tr>`).join('')}</tbody></table>${rule}<div style="${row}font-weight:800;"><span>ARTICLES TOTAL</span><span style="text-align:right;white-space:nowrap;flex-shrink:0;">${upperMoney(totals.weeklyTotal)}</span></div>${totals.pendingAmount>0?`<div style="${row}margin-top:4px;"><span>Opening Balance</span><span style="text-align:right;white-space:nowrap;flex-shrink:0;">${upperMoney(totals.pendingAmount)}</span></div>`:''}<div style="border:1px solid #000;padding:4px 5px;margin-top:5px;box-sizing:border-box;width:100%;"><div style="${row}font-size:14px;font-weight:1000;margin:3px 0;"><span>GRAND TOTAL</span><span style="text-align:right;white-space:nowrap;flex-shrink:0;">${upperMoney(totals.grandTotal)}</span></div><div style="${row}font-weight:800;margin:3px 0;"><span>PAID</span><span style="text-align:right;white-space:nowrap;flex-shrink:0;">${bill.paidAmount==null?'Not saved':upperMoney(bill.paidAmount)}</span></div><div style="${row}font-size:13px;font-weight:900;margin:3px 0;"><span>BALANCE DUE</span><span style="text-align:right;white-space:nowrap;flex-shrink:0;">${bill.remainingBalance==null?'Not saved':upperMoney(bill.remainingBalance)}</span></div></div></div>`;
}
function buildSupplierProductionBillCanvas(bill){
  const width=640,pad=24,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),items=[];let height=pad;
  const add=(text,size=21,align='left',right='')=>{
    ctx.font='900 '+size+'px monospace';const limit=width-pad*2-(right?ctx.measureText(right).width+20:0);let line='';
    for(const char of String(text)){if(ctx.measureText(line+char).width>limit&&line){items.push({text:line,size,align,right,y:height});height+=size+5;line='';right='';}line+=char;}
    items.push({text:line,size,align,right,y:height});height+=size+5;
  };
  const rule=()=>{items.push({rule:true,y:height+4});height+=12;};
  add('LEATHER RIGHT SHOES BY ABID',31,'center');add(bill.shopkeeperName+' | #'+bill.voucherNo,23,'center');add('Date: '+bill.date.slice(0,10),21,'left',fmtTime(new Date(bill.date)));rule();
  bill.lines.forEach(line=>{add(line.articleName);add('Quantity '+line.unit,21,'left',String(line.qty));add('Unit Price',21,'left',upperMoney(line.rate));add('Amount',21,'left',upperMoney(line.amount));rule();});
  const totals=supplierProductionBillTotals(bill);add('Opening Amount',25,'left',upperMoney(totals.pendingAmount));add('Current Articles Total',25,'left',upperMoney(totals.weeklyTotal));add('Grand Total',25,'left',upperMoney(totals.grandTotal));add('Paid Amount',21,'left',bill.paidAmount==null?'Not saved':upperMoney(bill.paidAmount));add('Remaining Balance',25,'left',bill.remainingBalance==null?'Not saved':upperMoney(bill.remainingBalance));rule();add('For Contact Dial 03226574565',20,'center');
  canvas.width=width*3;canvas.height=(height+pad)*3;ctx.scale(3,3);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height+pad);ctx.fillStyle='#000';ctx.strokeStyle='#000';ctx.textBaseline='top';
  items.forEach(item=>{if(item.rule){ctx.lineWidth=2;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(pad,item.y);ctx.lineTo(width-pad,item.y);ctx.stroke();return;}ctx.font='900 '+item.size+'px monospace';ctx.textAlign=item.align;ctx.fillText(item.text,item.align==='center'?width/2:pad,item.y);if(item.right){ctx.textAlign='right';ctx.fillText(item.right,width-pad,item.y);}});
  return canvas;
}


const shoeSoleBillingModule={open:openSupplierProductionBill};
function bind(){
 document.getElementById('fsManualCreate')?.addEventListener('click',()=>factorySaleManualEditor());document.getElementById('fsManualBills')?.addEventListener('click',factorySaleManualHistory);

  bindShoeSoleLanding();
  document.querySelectorAll('[data-fs_opensss]').forEach(card=>card.addEventListener('click',()=>{const shopkeeper=getShoeSoleSuppliers()[parseInt(card.dataset.fs_opensss)];if(shopkeeper){window.__soleSelectedId=shopkeeper.id;goto('factorySaleShopkeeperDetail');}}));
  document.querySelectorAll('[data-fs_editsss]').forEach(b=>b.addEventListener('click',(e)=>{ e.stopPropagation(); openShoeSoleSupplierModal(parseInt(b.dataset.fs_editsss)); }));
  document.querySelectorAll('[data-fs_customsss]').forEach(b=>b.addEventListener('click',(e)=>{ e.stopPropagation(); openShoeSoleCustomFieldsModal(parseInt(b.dataset.fs_customsss)); }));
  document.getElementById('btnBackShoeSoleSuppliers')?.addEventListener('click',()=>goto('factorySale'));
  document.querySelectorAll('[data-fs_opensoleproductactions]').forEach(row=>row.addEventListener('click',(e)=>{
    if(e.target.closest('button,a,input,select,textarea')) return;
    openShoeSoleProductActionModal(parseInt(row.dataset.fs_opensoleproductactions),row.dataset.productid);
  }));

  document.querySelectorAll('[data-fs_sssproductphoto]').forEach(el=>el.addEventListener('click',(e)=>{
    e.stopPropagation();
    const supplierIndex=shoeSoleRouteIndex();
    if(supplierIndex<0) return;
    const shopkeeper=getShoeSoleSuppliers()[supplierIndex];
    const product=factorySaleShopArticles(shopkeeper).find(p=>String(p.id)===String(el.dataset.fs_sssproductphoto));
    if(product && product.photo) openImageLightbox(product.photo);
  }));

  document.querySelectorAll('[data-fs_addssproduct]').forEach(b=>b.addEventListener('click',()=>factorySaleGlobalArticleModal()));
  document.querySelectorAll('[data-fs_editssproduct]').forEach(b=>b.addEventListener('click',()=>factorySaleGlobalArticleModal(b.dataset.productid)));
  document.querySelectorAll('[data-fs_purchasessproduct]').forEach(b=>b.addEventListener('click',()=>openShoeSolePurchaseModal(parseInt(b.dataset.fs_purchasessproduct),b.dataset.productid)));
  document.querySelectorAll('[data-fs_createssreceive]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();openShoeSoleReceiveSession(parseInt(b.dataset.fs_createssreceive));}));
  document.querySelectorAll('[data-open-fs_sss-dispatch]').forEach(b=>b.addEventListener('click',(e)=>{
    if(e.target.closest('button,a,input,select,textarea')) return;
    const idx=parseInt(b.dataset.openFs_sssDispatch);
    window.__shoeSoleReceiveFilters=window.__shoeSoleReceiveFilters||{};
    window.__shoeSoleReceiveFilters[idx]={filter:'today',start:'',end:''};
    window.__soleSelectedId=getShoeSoleSuppliers()[idx]?.id||'';goto('factorySaleDispatchDetail');
  }));
  document.getElementById('btnBackShoeSoleSupplierDetail')?.addEventListener('click',()=>{
    const idx=parseInt(document.getElementById('btnBackShoeSoleSupplierDetail').dataset.receivesupplier);
    window.__soleSelectedId=getShoeSoleSuppliers()[idx]?.id||'';goto('factorySaleShopkeeperDetail');
  });
  document.getElementById('fs_sssReceiveToday')?.addEventListener('click',()=>{
    const idx=shoeSoleRouteIndex();
    window.__shoeSoleReceiveFilters=window.__shoeSoleReceiveFilters||{}; window.__shoeSoleReceiveFilters[idx]={filter:'today',start:'',end:''}; render();
  });
  document.getElementById('fs_sssReceiveWeekly')?.addEventListener('click',()=>{
    const idx=shoeSoleRouteIndex();
    window.__shoeSoleReceiveFilters=window.__shoeSoleReceiveFilters||{}; window.__shoeSoleReceiveFilters[idx]={filter:'weekly',start:'',end:''}; render();
  });
  document.getElementById('fs_sssReceiveMonthly')?.addEventListener('click',()=>{
    const idx=shoeSoleRouteIndex();
    window.__shoeSoleReceiveFilters=window.__shoeSoleReceiveFilters||{}; window.__shoeSoleReceiveFilters[idx]={filter:'monthly',start:'',end:''}; render();
  });
  document.getElementById('fs_sssReceiveCustom')?.addEventListener('click',()=>{
    const idx=shoeSoleRouteIndex();
    window.__shoeSoleReceiveFilters=window.__shoeSoleReceiveFilters||{}; window.__shoeSoleReceiveFilters[idx]={filter:'custom',start:'',end:''}; render();
  });
  document.getElementById('fs_sssReceiveApply')?.addEventListener('click',()=>{
    const idx=shoeSoleRouteIndex();
    const start=document.getElementById('fs_sssReceiveStart')?.value||'', end=document.getElementById('fs_sssReceiveEnd')?.value||'';
    if(!start||!end){toast('Select both dates');return;}
    if(start>end){toast('End Date cannot be before Start Date');return;}
    window.__shoeSoleReceiveFilters=window.__shoeSoleReceiveFilters||{}; window.__shoeSoleReceiveFilters[idx]={filter:'custom',start,end}; render();
  });
  document.getElementById('fs_sssPrintReceiveSummary')?.addEventListener('click',()=>{
    const idx=shoeSoleRouteIndex(), f=(window.__shoeSoleReceiveFilters||{})[idx]||{filter:'today',start:'',end:''};
    printShoeSoleReceiveSummary(idx,f.filter,f.start,f.end);
  });
  document.getElementById('fs_sssCreateReceiveVoucher')?.addEventListener('click',()=>{
    const idx=shoeSoleRouteIndex();
    openShoeSoleReceiveSession(idx);
  });
  document.querySelectorAll('[data-fs_sssreceivevoucher-group]').forEach(b=>b.addEventListener('click',(e)=>{
    e.stopPropagation();
    const idx=shoeSoleRouteIndex();
    const ids=String(b.dataset.purchaseids||'').split(',').filter(Boolean);
    openShoeSoleReceiveVoucherModal(idx,ids);
  }));
  document.querySelectorAll('[data-fs_sssprintvoucher]').forEach(b=>b.addEventListener('click',(e)=>{
    e.stopPropagation();
    const idx=shoeSoleRouteIndex();
    const ids=String(b.dataset.purchaseids||'').split(',').filter(Boolean);
    openShoeSoleReceiveVoucherModal(idx,ids,true);
  }));
  document.querySelectorAll('[data-fs_sssdeletevoucher]').forEach(b=>b.addEventListener('click',(e)=>{
    e.stopPropagation();
    const idx=shoeSoleRouteIndex();
    const ids=String(b.dataset.purchaseids||'').split(',').filter(Boolean);
    deleteShoeSoleReceiveVoucher(idx,String(b.dataset.fs_sssdeletevoucher),ids);
  }));
  document.querySelectorAll('[data-fs_customssproduct]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();openShoeSoleProductCustomFieldsModal(parseInt(b.dataset.fs_customssproduct),b.dataset.productid);}));
  document.querySelectorAll('[data-fs_openingsoleproductatom]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();openShoeSoleProductAtomOpeningModal(parseInt(b.dataset.fs_openingsoleproductatom),b.dataset.productid);}));
  document.querySelectorAll('[data-fs_paysoleproductatom]').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();openShoeSoleProductAtomPayModal(parseInt(b.dataset.fs_paysoleproductatom),b.dataset.productid);}));
  document.querySelectorAll('[data-fs_ssspurchasehistory]').forEach(b=>b.addEventListener('click',()=>openShoeSolePurchaseHistoryModal(parseInt(b.dataset.fs_ssspurchasehistory))));



  document.querySelectorAll('[data-lightboxphoto="shoeSoleSupplier"]').forEach(el=>el.onclick=()=>{const shopkeeper=getShoeSoleSuppliers()[Number(el.dataset.fs_sssindex)];if(shopkeeper?.photo)openImageLightbox(shopkeeper.photo);});
}


let factorySaleManualSaving=false;
function factorySaleManualArticles(){return factorySaleArticles().map(article=>({key:String(article.id),articleId:String(article.id),articleName:article.name,shopkeeperName:'Global Article',unit:shoeSoleProductDisplayUnit(article),rate:article.ratePerUnit}));}
function factorySaleManualAmounts(lines){let total=0;const calculated=lines.map(line=>{const qty=Number(line.qty),rate=Number(line.rate),cents=Math.round(qty*rate*100);if(!line.articleName||!line.unit||line.qty===''||line.rate===''||!Number.isFinite(qty)||qty<=0||!Number.isFinite(rate)||rate<0||!Number.isSafeInteger(cents))throw Error('Select an Article and enter valid Quantity and Rate.');total+=cents;if(!Number.isSafeInteger(total))throw Error('Bill amount is too large.');return {...line,qty,rate,amount:cents/100};});if(!calculated.length)throw Error('Add at least one Article.');return {lines:calculated,totalAmount:total/100};}
function factorySaleManualBillHtml(bill){const opening=Number(bill.pendingAmount??bill.openingAmount??0)||0,paid=Number(bill.paidAmount??0)||0;return supplierProductionBillHtml({...bill,pendingAmount:opening,extraBalanceAmount:0,paidAmount:paid,remainingBalance:bill.remainingBalance??Math.round((opening+(Number(bill.totalAmount)||0)-paid)*100)/100});}
function factorySaleManualPrint(bill){const area=document.createElement('div');area.id='fsManualBillPrintArea';area.className='receipt-paper';area.style.cssText='width:80mm;margin:auto;';area.innerHTML=factorySaleManualBillHtml(bill);document.body.appendChild(area);try{printElement(area.id);}finally{area.remove();}}
function factorySaleManualView(id){const bill=(settings.manualBills||[]).find(b=>b.id===id);if(!bill)return;modal('<h3>Manual Bill #'+esc(bill.voucherNo)+'</h3><div style="width:80mm;max-width:100%;margin:auto">'+factorySaleManualBillHtml(bill)+'</div><div class="modal-actions"><button class="btn brass" id="fsManualPrint">Print</button><button class="btn ghost" id="fsManualBack">Back</button></div>');document.getElementById('fsManualPrint').onclick=()=>factorySaleManualPrint(bill);document.getElementById('fsManualBack').onclick=factorySaleManualHistory;}
function factorySaleManualHistory(){modal('<h3>Manual Bill History</h3><div style="overflow-x:auto"><table><thead><tr><th>Bill</th><th>Shopkeeper</th><th>Date</th><th>Grand Total</th><th>Paid Amount</th><th>Remaining Balance</th><th>Actions</th></tr></thead><tbody>'+(settings.manualBills||[]).slice().reverse().map(b=>'<tr><td>#'+esc(b.voucherNo)+'</td><td>'+esc(b.shopkeeperName)+'</td><td>'+esc(String(b.date).slice(0,10))+'</td><td>'+upperMoney(b.totalAmount)+'</td><td>'+upperMoney(b.paidAmount??0)+'</td><td>'+upperMoney(b.remainingBalance??b.totalAmount)+'</td><td>'+ ['View','Edit','Delete','Print'].map(action=>'<button class="btn ghost small" data-fs-manual-action="'+action+'" data-fs-manual-id="'+esc(b.id)+'">'+action+'</button>').join('')+'</td></tr>').join('')+'</tbody></table></div><div class="modal-actions"><button class="btn brass" id="fsManualNew">Manual Create Bill</button><button class="btn ghost" id="fsManualClose">Close</button></div>');document.getElementById('fsManualNew').onclick=()=>factorySaleManualEditor();document.getElementById('fsManualClose').onclick=closeModal;document.querySelectorAll('[data-fs-manual-action]').forEach(button=>button.onclick=()=>{const id=button.dataset.fsManualId,bill=(settings.manualBills||[]).find(b=>b.id===id);if(!bill)return;const action=button.dataset.fsManualAction;if(action==='View')factorySaleManualView(id);else if(action==='Edit')factorySaleManualEditor(id);else if(action==='Print')factorySaleManualPrint(bill);else openConfirmModal('Delete Manual Bill #'+bill.voucherNo+'?',()=>factorySaleManualDelete(id,JSON.stringify(bill)));});}
async function factorySaleManualStore(next,number){if(factorySaleManualSaving)return false;const previous=settings.manualBills,counter=settings.nextManualBillNo,hadBills=Object.prototype.hasOwnProperty.call(settings,'manualBills'),hadCounter=Object.prototype.hasOwnProperty.call(settings,'nextManualBillNo');factorySaleManualSaving=true;settings.manualBills=next;if(number!==undefined)settings.nextManualBillNo=number;try{if(!await saveCriticalCloudState())throw Error('Save failed');return true;}catch(error){if(hadBills)settings.manualBills=previous;else delete settings.manualBills;if(hadCounter)settings.nextManualBillNo=counter;else delete settings.nextManualBillNo;try{await reconcileCloudAfterCriticalRollback();}catch(rollbackError){}toast('Manual bill was not saved.');return false;}finally{factorySaleManualSaving=false;}}
async function factorySaleManualDelete(id,expected){if(factorySaleManualSaving)return;const current=(settings.manualBills||[]).find(b=>b.id===id);if(!current||JSON.stringify(current)!==expected){toast('Manual bill changed. Reopen history.');return;}if(await factorySaleManualStore(settings.manualBills.filter(b=>b.id!==id)))factorySaleManualHistory();}
function factorySaleManualEditor(id=''){const original=(settings.manualBills||[]).find(b=>b.id===id);if(id&&!original)return;const expected=original?JSON.stringify(original):'',draftId=original?.id||uid(),articles=factorySaleManualArticles();modal('<h3>'+ (original?'Edit Manual Bill #'+esc(original.voucherNo):'Manual Create Bill')+'</h3><label>Shopkeeper Name<input type="text" id="fsManualName" value="'+esc(original?.shopkeeperName||'')+'"></label><div style="overflow-x:auto"><table><thead><tr><th>Article</th><th>Saved Unit</th><th>Quantity</th><th>Rate</th><th>Line Amount</th><th></th></tr></thead><tbody id="fsManualRows"></tbody></table></div><button class="btn ghost small" id="fsManualAdd">Add Article</button><div class="rline"><strong>Grand Total</strong><strong id="fsManualTotal">0</strong></div><label>Paid Amount<input id="fsManualPaid" type="number" min="0" step="0.01" value="'+esc(original?.paidAmount??0)+'"></label><label>Remaining Balance<input id="fsManualRemaining" readonly></label><div class="modal-actions"><button class="btn brass" id="fsManualSave">Create Bill</button><button class="btn ghost" id="fsManualHistory">History</button><button class="btn ghost" id="fsManualCancel">Cancel</button></div>');
 const host=document.getElementById('fsManualRows');const collect=()=>[...host.children].map(row=>({...row.manualLine,qty:row.querySelector('[data-manual-qty]').value,rate:row.querySelector('[data-manual-rate]').value}));
 const update=()=>{try{const calculated=factorySaleManualAmounts(collect());calculated.lines.forEach((line,i)=>host.children[i].querySelector('[data-manual-amount]').textContent=upperMoney(line.amount));document.getElementById('fsManualTotal').textContent=upperMoney(calculated.totalAmount);document.getElementById('fsManualRemaining').value=upperMoney((Math.round(calculated.totalAmount*100)-Math.round(Number(document.getElementById('fsManualPaid').value)*100))/100);}catch(error){document.getElementById('fsManualRemaining').value='';document.getElementById('fsManualTotal').textContent=error.message;[...host.children].forEach(row=>{try{row.querySelector('[data-manual-amount]').textContent=upperMoney(factorySaleManualAmounts([{...row.manualLine,qty:row.querySelector('[data-manual-qty]').value,rate:row.querySelector('[data-manual-rate]').value}]).totalAmount);}catch(e){row.querySelector('[data-manual-amount]').textContent='';}});}};
 const add=(saved={})=>{const row=document.createElement('tr');row.manualLine={...saved};row.innerHTML='<td><select data-manual-article><option value="">Select Article</option>'+articles.map(a=>'<option value="'+esc(a.key)+'">'+esc(a.articleName)+'</option>').join('')+'</select></td><td data-manual-unit>'+esc(saved.unit||'')+'</td><td><input data-manual-qty type="number" min="0" step="any" value="'+esc(saved.qty??'')+'" style="width:85px"></td><td><input data-manual-rate type="number" min="0" step="any" value="'+esc(saved.rate??'')+'" style="width:85px"></td><td data-manual-amount></td><td><button class="btn ghost small" data-manual-remove>Remove</button></td>';const select=row.querySelector('[data-manual-article]');if(saved.articleName){const option=document.createElement('option');option.value='saved';option.textContent=saved.articleName;select.appendChild(option);select.value='saved';}select.onchange=()=>{const article=articles.find(a=>a.key===select.value);row.manualLine=article?{articleKey:article.key,articleId:article.articleId,articleName:article.articleName,unit:article.unit}:{};row.querySelector('[data-manual-unit]').textContent=article?.unit||'';row.querySelector('[data-manual-rate]').value=article?.rate??'';update();};row.querySelectorAll('input').forEach(input=>input.oninput=update);row.querySelector('[data-manual-remove]').onclick=()=>{row.remove();update();};host.appendChild(row);update();};
 document.getElementById('fsManualPaid').oninput=update;(original?.lines||[{}]).forEach(add);document.getElementById('fsManualAdd').onclick=()=>add();document.getElementById('fsManualHistory').onclick=factorySaleManualHistory;document.getElementById('fsManualCancel').onclick=closeModal;document.getElementById('fsManualSave').onclick=async()=>{if(factorySaleManualSaving)return;if(!original&&(settings.manualBills||[]).some(b=>b.id===draftId)){factorySaleManualView(draftId);return;}const name=document.getElementById('fsManualName').value.trim();if(!name){toast('Enter Shopkeeper Name.');return;}let calculated;try{calculated=factorySaleManualAmounts(collect());}catch(error){toast(error.message);return;}const rawPaid=document.getElementById('fsManualPaid').value,paidAmount=Math.round(Number(rawPaid)*100)/100,remainingBalance=(Math.round(calculated.totalAmount*100)-Math.round(paidAmount*100))/100;if(rawPaid===''||!Number.isFinite(paidAmount)||paidAmount<0||!Number.isSafeInteger(Math.round(paidAmount*100))||remainingBalance<0){toast('Enter Paid Amount between zero and Grand Total.');return;}const bills=settings.manualBills||[];if(original&&JSON.stringify(bills.find(b=>b.id===id))!==expected){toast('Manual bill changed. Reopen it.');return;}const number=original?.voucherNo||Math.max(1001,Number(settings.nextManualBillNo)||1001,...bills.map(b=>(Number(b.voucherNo)||0)+1)),bill={...original,id:draftId,voucherNo:number,date:original?.date||new Date().toISOString(),...(original?{editedAt:new Date().toISOString()}:{}),shopkeeperName:name,lines:calculated.lines,totalAmount:calculated.totalAmount,paidAmount,remainingBalance};bill.dispatchSnapshot={id:'manual:'+bill.id,billId:bill.id,shopkeeperName:name,date:bill.date,lines:bill.lines.map((line,index)=>({id:'manual:'+bill.id+':'+index,manualBillId:bill.id,shopkeeperName:name,date:bill.date,articleId:line.articleId||line.articleKey||'manual-line-'+index,articleName:line.articleName,unit:line.unit,atoms:line.qty,ratePerUnit:line.rate,amount:line.amount}))};const button=document.getElementById('fsManualSave');button.disabled=true;const ok=await factorySaleManualStore(original?bills.map(b=>b.id===id?bill:b):[...bills,bill],original?undefined:number+1);if(ok)factorySaleManualView(bill.id);else if(button.isConnected)button.disabled=false;};}

function route(page){return ['factorySale','factorySaleToday','factorySaleShopkeeperDetail','factorySaleDispatchDetail','factorySaleShopkeeper1','factorySaleShopkeeper2','factorySaleDispatch1','factorySaleDispatch2'].includes(page);}
function renderPage(page){load();currentPage=page;const index=shoeSoleRouteIndex();let html;if(page==='factorySale')html=pageShoeSoleSuppliers();else if(page==='factorySaleToday')html=pageShoeSoleToday();else if(page.includes('Dispatch'))html='<button class="btn ghost small" id="btnBackShoeSoleSupplierDetail" data-receivesupplier="'+index+'">Back to Shopkeeper</button>'+pageShoeSoleReceiveDetail(index);else html='<button class="btn ghost small" id="btnBackShoeSoleSuppliers">Back to Factory Sale</button>'+pageShoeSoleSupplierDetail(index);return FACTORY_SALE_CSS+html;}
return {route,renderPage,bind};
})();
function factorySaleRoute(page){return factorySaleModule.route(page);}
function factorySaleRender(){updateTopbar();applyWallpaper();renderNav();document.getElementById('mainArea').innerHTML=factorySaleModule.renderPage(currentPage);attachPageHandlers();wireDashboardSearch();document.body.classList.remove('upper-mans-production-active');}
