const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const helper=source.slice(source.indexOf('/* Create Bill monetary actions:'),source.indexOf('const shoesLaminationShopsServices='));
const context=vm.createContext({console});
vm.runInContext(helper,context);
const copy=value=>JSON.parse(JSON.stringify(value));
const adapter={openingKey:'pendingAmount',weekly:context.billAccountLineWeekly};
function bill(id,opening,weekly,paid){return {id,supplierId:'a',pendingAmount:opening,totalAmount:weekly,paidAmount:paid,remainingBalance:opening+weekly-paid,extraBalanceAmount:0,lines:[{articleId:'original',articleName:'Original name',qty:5,rate:weekly/5,amount:weekly}],sourceRecordIds:['production-'+id],billReversal:{version:1,beforeAccount:{exists:true,value:{currentBalance:opening}},untouched:'original proof'}};}
function fixture(){return {account:{startingBalance:100,currentBalance:650,openingAmount:650,lastBillId:'b2'},bills:[bill('b1',100,500,100),bill('b2',500,200,50)]};}
const payment=(data,id,amount,date='2026-10-19')=>context.billAccountChange(data,adapter,{type:'payment',id,amount,date});
const correct=(data,id,opening,paid)=>context.billAccountChange(data,adapter,{type:'correction',id:'correction-'+id,billId:id,opening,paid});

test('Payment Only subtracts each payment once and preserves bill/production snapshots',()=>{
  const original=fixture(),before=copy(original);
  const first=payment(original,'p1',100),second=payment(first,'p2',50);
  assert.equal(second.account.currentBalance,500);
  assert.equal(second.account.openingAmount,500);
  assert.equal(second.account.billPayments.length,2);
  assert.equal(second.account.billPayments[0].date,'2026-10-19');
  assert.equal(second.account.billPayments[1].balanceBefore,550);
  assert.deepEqual(copy(second.bills),before.bills);
  assert.deepEqual(original,before);
  context.billAccountReplay(copy(second),adapter,true);
});

test('Payment Only works with verified saved opening and no production/bills',()=>{
  const result=payment({account:{startingBalance:900,currentBalance:900},bills:[]},'p0',200);
  assert.equal(result.account.currentBalance,700);
  assert.equal(result.bills.length,0);
  context.billAccountReplay(copy(result),adapter,true);
});

test('old Opening/Paid correction changes account by delta and recalculates later bills/payments',()=>{
  const data={account:{startingBalance:100,currentBalance:500,openingAmount:500,billPayments:[{id:'p1',afterBillId:'b1',amount:100,date:'2026-10-18',balanceBefore:500,balanceAfter:400},{id:'p2',afterBillId:'b2',amount:50,date:'2026-10-19',balanceBefore:550,balanceAfter:500}]},bills:[bill('b1',100,500,100),bill('b2',400,200,50)]};
  const original=copy(data),result=correct(data,'b1',120,130);
  assert.equal(result.account.currentBalance,490);
  assert.equal(result.bills[0].remainingBalance,490);
  assert.equal(result.bills[1].pendingAmount,390);
  assert.equal(result.bills[1].remainingBalance,540);
  assert.equal(result.account.billPayments[0].amount,100);
  assert.equal(result.account.billPayments[0].balanceAfter,400);
  assert.equal(result.account.billPayments[0].recalculatedBalanceAfter,390);
  assert.equal(result.account.billCorrections[0].delta,-10);
  assert.equal(result.account.billCorrections[0].beforeBalances[1].opening,400);
  result.bills.forEach((item,index)=>{
    for(const key of ['lines','sourceRecordIds','billReversal','totalAmount'])assert.deepEqual(copy(item[key]),original.bills[index][key]);
  });
  assert.deepEqual(data,original);
  context.billAccountReplay(copy(result),adapter,true);
  const again=correct(result,'b2',400,50);
  assert.equal(again.account.currentBalance,500);
  assert.equal(again.account.billCorrections.length,2);
  context.billAccountReplay(copy(again),adapter,true);
});

test('next bill carries post-payment balance; backdated payment date does not rebill production',()=>{
  const first=payment(fixture(),'p1',100,'2026-01-01');
  first.bills.push(bill('b3',550,80,30));first.account.currentBalance=600;first.account.openingAmount=600;
  context.billAccountReplay(copy(first),adapter,true);
  const result=correct(first,'b1',110,100);
  assert.equal(result.account.currentBalance,610);
  assert.equal(result.bills[2].pendingAmount,560);
  assert.equal(result.account.billPayments[0].date,'2026-01-01');
});

test('legacy, missing snapshots, mismatched balances, overpayment and invalid dates stop without mutation',()=>{
  const cases=[
    data=>{delete data.bills[0].billReversal;},
    data=>{delete data.bills[0].pendingAmount;},
    data=>{delete data.bills[0].paidAmount;},
    data=>{data.account.currentBalance=1;},
    data=>{data.bills[0].totalAmount=999;},
    data=>{data.bills[1].id='b1';}
  ];
  cases.forEach(mutate=>{const data=fixture();mutate(data);const before=copy(data);assert.throws(()=>correct(data,'b1',110,100));assert.deepEqual(data,before);});
  assert.throws(()=>correct(fixture(),'b1',0,1000));
  assert.throws(()=>correct(fixture(),'not-owned',100,0));
  for(const amount of [0,-1,651,'',NaN,Infinity])assert.throws(()=>payment(fixture(),'p',amount));
  assert.throws(()=>payment(fixture(),'p',1,'2026-02-30'));
  assert.throws(()=>payment({account:null,bills:[]},'p',1));
  assert.throws(()=>payment(payment(fixture(),'same',1),'same',1));
});

test('Boards/Gas replay saved monetary snapshots without changing quantities or rates',()=>{
  for(const weeklyKey of ['billTotal','gasAmount']){
    const options={openingKey:'openingAmount',weekly:item=>context.billAccountCents(item[weeklyKey])};
    const data={account:{startingBalance:100,currentBalance:450},bills:[{id:'g1',openingAmount:100,[weeklyKey]:400,paidAmount:50,remainingBalance:450,extraBalanceAmount:0,totalGasKg:7,totalItems:9,rate:123,gasBillReversal:{version:1,beforeState:{gasSupplierBillAccount:{exists:true,value:{currentBalance:100}}}}}]};
    const result=context.billAccountChange(data,options,{type:'correction',id:'c',billId:'g1',opening:120,paid:80});
    assert.equal(result.account.currentBalance,440);
    assert.equal(result.bills[0].totalGasKg,7);assert.equal(result.bills[0].totalItems,9);assert.equal(result.bills[0].rate,123);
  }
});

test('line adapter isolates suppliers and preserves unrelated state/counters',()=>{
  let store={accounts:{a:fixture().account,b:{currentBalance:999}},bills:[...fixture().bills,{...bill('other',0,999,0),supplierId:'b'}],nextVoucherNo:700,other:'keep'};
  const options=context.billAccountLineAdapter({id:'a',get:()=>store,set:value=>{store=value;}});
  const other=JSON.stringify({account:store.accounts.b,bill:store.bills[2]});
  options.write(payment(options.read(),'p',100));
  assert.equal(store.accounts.a.currentBalance,550);
  assert.equal(JSON.stringify({account:store.accounts.b,bill:store.bills[2]}),other);
  assert.equal(store.nextVoucherNo,700);assert.equal(store.other,'keep');
});

test('all nine live line forms wire the correct account store, selection guard and save boundary',()=>{
  const sources=[source,fs.readFileSync(path.join(__dirname,'../factory-sale.js'),'utf8')];
  let count=0;
  for(const text of sources)for(const line of text.split('\n').filter(item=>item.startsWith('function supplierProductionAccountAdapter('))){
    const key=line.match(/get:\(\)=>settings\.(\w+)/)[1],isSale=key==='billing',owner=isSale?'shopkeeperId':'supplierId';
    const data=fixture();data.bills.forEach(item=>{delete item.supplierId;item[owner]='a';});
    let captured;
    const sandbox=vm.createContext({console,settings:{[key]:{accounts:{a:data.account},bills:data.bills}},supplierProductionBillWorker:()=>({id:'a',name:'Account A'}),supplierProductionBillSaving:false,supplierProductionActiveWorker:()=>({id:'a'}),saveCriticalCloudState:async()=>true,reconcileCloudAfterCriticalRollback:async()=>{},openSupplierProductionBill:()=>{}});
    vm.runInContext(helper,sandbox);vm.runInContext(line,sandbox);captured=sandbox.supplierProductionAccountAdapter('a');
    assert(captured.valid());assert.equal(captured.read().bills.length,2);captured.write(sandbox.billAccountChange(captured.read(),captured,{type:'payment',id:'p',amount:10,date:'2026-10-19'}));
    assert.equal(sandbox.settings[key].accounts.a.currentBalance,640);captured.lock(true);assert(captured.busy());captured.lock(false);
    sandbox.supplierProductionActiveWorker=()=>({id:'b'});assert.equal(captured.valid(),false);count++;
  }
  assert.equal(count,9);
});

test('failed save rolls back exactly; stale/changed selection blocks before write',async()=>{
  let state=fixture(),locked=false,reconciled=0,writes=0;
  const options={...adapter,read:()=>state,write:value=>{state=value;writes++;},valid:()=>true,busy:()=>locked,lock:value=>{locked=value;},save:async()=>false,reconcile:async()=>{reconciled++;}};
  const snapshot=JSON.stringify(state),change={type:'payment',id:'p',amount:10,date:'2026-10-19'};
  await assert.rejects(context.billAccountCommit(options,snapshot,change));
  assert.equal(JSON.stringify(state),snapshot);assert.equal(locked,false);assert.equal(reconciled,1);
  options.save=async()=>{throw Error('network');};await assert.rejects(context.billAccountCommit(options,snapshot,change));assert.equal(JSON.stringify(state),snapshot);
  const beforeWrites=writes;state.account.currentBalance=10;
  await assert.rejects(context.billAccountCommit(options,snapshot,change));assert.equal(writes,beforeWrites);
  options.valid=()=>false;await assert.rejects(context.billAccountCommit(options,JSON.stringify(state),change));assert.equal(writes,beforeWrites);
});

test('Boards and Gas adapters preserve production/stock and use their own accounts',()=>{
  const supplier={id:'board-a',name:'Boards A',supplierBillAccount:fixture().account,supplierBills:fixture().bills,purchases:[{id:'purchase',qty:99}],products:[{id:'product',stock:70}]};
  const sandbox=vm.createContext({console,settings:{shoeBoxSuppliers:[supplier],gasSupplier:{id:'gas-a',name:'Gas A'},gasSupplierBillAccount:fixture().account,gasSupplierBills:fixture().bills,gasSupplierWeeks:[{remainingKg:35}],gasSupplierBilledExtraBalanceIds:['extra']},sbSupplierBillSaving:false,getShoeBoxSuppliers:()=>sandbox.settings.shoeBoxSuppliers,shoeBoxSupplierDisplayName:item=>item.name,saveCriticalCloudState:async()=>true,reconcileCloudAfterCriticalRollback:async()=>{},openShoeBoxSupplierBillModal:()=>{},openGasSupplierBillModal:()=>{}});
  vm.runInContext(helper,sandbox);
  const before=copy(sandbox.settings);
  for(const options of [sandbox.billAccountBoardsAdapter(0),sandbox.billAccountGasAdapter()]){
    assert(options.valid());const data=options.read();options.write(sandbox.billAccountChange(data,options,{type:'payment',id:'p',amount:100,date:'2026-10-19'}));assert.equal(options.read().account.currentBalance,550);options.lock(true);assert(options.busy());options.lock(false);
  }
  assert.deepEqual(copy(sandbox.settings.shoeBoxSuppliers[0].purchases),before.shoeBoxSuppliers[0].purchases);
  assert.deepEqual(copy(sandbox.settings.shoeBoxSuppliers[0].products),before.shoeBoxSuppliers[0].products);
  assert.deepEqual(copy(sandbox.settings.gasSupplierWeeks),before.gasSupplierWeeks);
  assert.deepEqual(copy(sandbox.settings.gasSupplierBilledExtraBalanceIds),before.gasSupplierBilledExtraBalanceIds);
});

test('form actions mount Payment Only and histories without a separate correction button',()=>{
  const buttons=[],host={appendChild:element=>buttons.push(element)},view={after:element=>buttons.push(element)},cancel={before:element=>buttons.push(element),closest:()=>host};
  const sandbox=vm.createContext({console,esc:value=>String(value),document:{getElementById:id=>id==='cancel'?cancel:null,createElement:()=>({}),querySelectorAll:()=>[view]}});
  vm.runInContext(helper,sandbox);
  sandbox.mountBillAccountActions({cancelId:'cancel',read:()=>fixture()},'[data-view]',()=> 'b1');
  assert.equal(buttons[0].textContent,'Payment Only');assert(buttons[1].innerHTML.includes('Payment History'));assert.equal(buttons.length,2);
  assert.equal(view.onclick,undefined);
});

test('verified selected bill corrects after older legacy history without rewriting the legacy bill',()=>{
  const legacy={id:'legacy-1002',supplierId:'a',pendingAmount:0,totalAmount:9280,lines:[{amount:9280}]};
  const selected=bill('verified-1003',0,19960,0);
  selected.billReversal.beforeAccount={exists:true,value:{openingAmount:0}};
  const data={account:{startingBalance:0,currentBalance:10000,openingAmount:10000,billPayments:[{id:'payment',date:'2026-10-19',afterBillId:'verified-1003',amount:9960,balanceBefore:19960,balanceAfter:10000}]},bills:[legacy,selected]};
  const before=copy(data),result=correct(data,'verified-1003',1000,200);
  assert.equal(result.account.currentBalance,10800);
  assert.equal(result.bills[1].remainingBalance,20760);
  assert.equal(result.account.billPayments[0].amount,9960);
  assert.equal(result.account.billPayments[0].balanceAfter,10000);
  assert.equal(result.account.billPayments[0].recalculatedBalanceAfter,10800);
  assert.deepEqual(copy(result.bills[0]),legacy);
  assert.deepEqual(data,before);
  context.billAccountReplay(copy(result),adapter,true,'verified-1003');
  const again=correct(result,'verified-1003',500,200);
  assert.equal(again.account.currentBalance,10300);
  assert.equal(again.account.billCorrections.length,2);
  context.billAccountReplay(copy(again),adapter,true,'verified-1003');
  assert.throws(()=>correct(data,'legacy-1002',1000,0));
});

test('suffix validates subsequent bills/payments and preserves earlier payments untouched',()=>{
  const first=bill('first',0,100,0),selected=bill('selected',70,200,0),later=bill('later',250,50,0);
  const prefixPayment={id:'old-payment',afterBillId:'first',amount:30,date:'2026-10-01',balanceBefore:100,balanceAfter:70};
  const data={account:{startingBalance:0,currentBalance:300,billPayments:[prefixPayment,{id:'payment',afterBillId:'selected',amount:20,date:'2026-10-19',balanceBefore:270,balanceAfter:250}]},bills:[first,selected,later]};
  const result=correct(data,'selected',80,5);
  assert.equal(result.account.currentBalance,305);assert.equal(result.bills[2].pendingAmount,255);
  assert.deepEqual(copy(result.bills[0]),first);assert.deepEqual(copy(result.account.billPayments[0]),prefixPayment);
  context.billAccountReplay(copy(result),adapter,true,'selected');
  for(const mutate of [value=>{delete value.bills[1].billReversal.beforeAccount;},value=>{value.bills[1].pendingAmount=80;},value=>{delete value.bills[2].billReversal;},value=>{value.bills[2].pendingAmount=999;},value=>{value.account.billPayments[1].afterBillId='missing';},value=>{value.account.currentBalance=999;}]){
    const unsafe=copy(data);mutate(unsafe);const before=copy(unsafe);assert.throws(()=>correct(unsafe,'selected',80,5));assert.deepEqual(unsafe,before);
  }
});

test('first bill may anchor to an explicit created-account snapshot; missing starting amount is never guessed',()=>{
  const data=fixture();data.bills[0].billReversal={version:1,beforeAccount:{exists:false},afterAccount:{exists:true,value:{startingBalance:100}}};
  assert.equal(correct(data,'b1',110,100).account.currentBalance,660);
  delete data.bills[0].billReversal.afterAccount.value.startingBalance;
  assert.throws(()=>correct(data,'b1',110,100));
});

function lifecycleFixture(marker){
  const first=bill('b1',1000,500,100),second=bill('b2',1300,200,50);
  if(marker!==undefined)first.billingLifecycleVersion=marker;
  return {account:{startingBalance:1000,currentBalance:1400,openingAmount:1400,billPayments:[{id:'p1',afterBillId:'b1',amount:100,date:'2026-10-19',balanceBefore:1400,balanceAfter:1300},{id:'p2',afterBillId:'b2',amount:50,date:'2026-10-19',balanceBefore:1450,balanceAfter:1400}]},bills:[first,second]};
}
const remove=(data,id='b1',options=adapter)=>context.billAccountChange(data,options,{type:'delete',billId:id,id:'deletion-'+id});

test('OLD/NEW deletion reconciles charges once, preserves cash payments and never guesses a missing marker',()=>{
  for(const marker of [undefined,0,'1',1]){
    const data=lifecycleFixture(marker),before=copy(data),result=remove(data);
    assert.equal(result.account.currentBalance,900);
    assert.equal(result.bills[0].paidAmount,100);
    assert.equal(result.bills[1].pendingAmount,800);
    assert.equal(result.bills[1].remainingBalance,950);
    assert.equal(result.bills[0].billingDeleted.receivedPolicy,marker===1?'release':'keep');
    assert.equal(context.billAccountKeepsReceived(result.bills[0]),marker!==1);
    assert.deepEqual(copy(result.bills[0].sourceRecordIds),data.bills[0].sourceRecordIds);
    assert.deepEqual(copy(result.bills[0].lines),data.bills[0].lines);
    assert.equal(result.account.billPayments[0].amount,100);
    assert.equal(result.account.billPayments[0].balanceAfter,1300);
    assert.equal(result.account.billPayments[1].recalculatedBalanceAfter,900);
    assert.equal(result.account.billCorrections.at(-1).type,'delete');
    context.billAccountReplay(copy(result),adapter,true,'b1');
    assert.throws(()=>remove(result));
    assert.deepEqual(data,before);
  }
});

test('NEW released sources can be rebilled once; OLD sources remain closed including legacy periods',()=>{
  const fresh=remove(lifecycleFixture(1)),old=remove(lifecycleFixture());
  assert(context.billAccountReleasedIds(fresh.bills,'a').has('production-b1'));
  assert.equal(context.billAccountReleasedIds(old.bills,'a').size,0);
  const rebill=bill('rebill',900,500,0);rebill.sourceRecordIds=['production-b1'];rebill.billingLifecycleVersion=1;
  fresh.bills.push(rebill);fresh.account.currentBalance=1400;fresh.account.openingAmount=1400;
  const closed=new Set(fresh.bills.filter(context.billAccountKeepsReceived).flatMap(item=>item.sourceRecordIds));
  assert(closed.has('production-b1'));
  context.billAccountReplay(copy(fresh),adapter,true,'rebill');
  assert.equal(context.billAccountReleasedIds(fresh.bills,'other-supplier').size,0);
});

test('unsafe deletion with missing snapshots or overpayment stops without changing data',()=>{
  for(const mutate of [data=>{delete data.bills[0].billReversal;},data=>{delete data.bills[0].paidAmount;},data=>{data.account.currentBalance++;}]){
    const data=lifecycleFixture(1);mutate(data);const before=copy(data);assert.throws(()=>remove(data));assert.deepEqual(data,before);
  }
  const data=fixture();data.bills[1].pendingAmount=499;data.bills[1].remainingBalance=649;data.account.currentBalance=649;data.account.openingAmount=649;data.account.billPayments=[{id:'p',afterBillId:'b1',amount:1,balanceBefore:500,balanceAfter:499}];const before=copy(data);assert.throws(()=>remove(data));assert.deepEqual(data,before);
});

test('top Opening adjustments preserve bills, log their difference and replay between payments in exact order',()=>{
  let data=fixture();
  data=context.billAccountChange(data,adapter,{type:'accountOpening',opening:700,id:'opening-1'});
  assert.equal(data.account.currentBalance,700);assert.equal(data.account.billBalanceAdjustments[0].deltaCents,5000);
  data=payment(data,'p1',100);
  data=context.billAccountChange(data,adapter,{type:'accountOpening',opening:620,id:'opening-2'});
  data=payment(data,'p2',20);
  assert.equal(data.account.currentBalance,600);
  context.billAccountReplay(copy(data),adapter,true);
  const corrected=correct(data,'b1',110,100);
  assert.equal(corrected.account.currentBalance,610);
  assert.equal(corrected.account.billBalanceAdjustments[0].balanceBefore,650);
  assert.equal(corrected.account.billBalanceAdjustments[0].recalculatedBalanceBefore,660);
  context.billAccountReplay(copy(corrected),adapter,true);
  const history=context.billAccountHistoryHtml;
  context.esc=value=>String(value);
  assert(history(data.account).includes('Opening Adjustment History'));
});

test('top Opening save and Create retry apply an adjustment once and keep the original bill save',async()=>{
  let state=fixture(),locked=false,created=0,saves=0;
  const opening={value:'700',readOnly:true},saveOpening={disabled:true,onclick:()=>{}},create={disabled:false,onclick:()=>{created++;}};
  const sandbox=vm.createContext({console,uid:()=> 'opening',toast:()=>{},document:{getElementById:id=>({supplierBillOpening:opening,supplierBillSaveOpening:saveOpening,supplierBillCreate:create}[id]||null)}});
  vm.runInContext(helper,sandbox);
  const options={...adapter,cancelId:'supplierBillCancel',read:()=>state,write:value=>{state=value;},valid:()=>true,busy:()=>locked,lock:value=>{locked=value;},save:async()=>{saves++;return true;},reconcile:async()=>{},back:()=>{}};
  sandbox.mountBillAccountOpening(options);assert.equal(opening.readOnly,false);assert.equal(saveOpening.disabled,false);
  await create.onclick();await create.onclick();
  assert.equal(created,2);assert.equal(saves,1);assert.equal(state.account.currentBalance,700);assert.equal(state.account.billBalanceAdjustments.length,1);
});

test('direct bill editor makes top Opening editable and saves through safe common correction',async()=>{
  let state=fixture(),locked=false;const fields={opening:{value:'110',readOnly:true,addEventListener(){}},paid:{value:'100',addEventListener(){}},save:{disabled:false,onclick:()=>{throw Error('Old reversal path used');}},remaining:{textContent:''},grand:{textContent:''}};
  const sandbox=vm.createContext({console,uid:()=> 'direct-correction',toast:()=>{},document:{getElementById:id=>fields[id]||null}});vm.runInContext(helper,sandbox);
  const options={...adapter,read:()=>state,write:value=>{state=value;},valid:()=>true,busy:()=>locked,lock:value=>{locked=value;},save:async()=>true,reconcile:async()=>{},back:()=>{}};
  sandbox.mountBillAccountEditor(options,{billId:'b1',opening:'opening',paid:'paid',save:'save',remaining:'remaining',grand:'grand'});
  assert.equal(fields.opening.readOnly,false);assert.equal(fields.remaining.textContent,'510.00');
  await fields.save.onclick();assert.equal(state.account.currentBalance,660);
});

test('delete confirmation performs no write before approval; failed commit restores tombstones and balances',async()=>{
  let state=lifecycleFixture(1),confirmation,locked=false,writes=0;
  const sandbox=vm.createContext({console,uid:()=> 'delete',toast:()=>{},openConfirmModal:(text,callback)=>{confirmation={text,callback};}});vm.runInContext(helper,sandbox);
  const options={...adapter,read:()=>state,write:value=>{state=value;writes++;},valid:()=>true,busy:()=>locked,lock:value=>{locked=value;},save:async()=>false,reconcile:async()=>{},back:()=>{}};
  const before=JSON.stringify(state);sandbox.confirmBillAccountDelete(options,'b1');assert.equal(writes,0);assert(confirmation.text.includes('NEW bill'));await confirmation.callback();assert.equal(JSON.stringify(state),before);
  options.save=async()=>true;sandbox.confirmBillAccountDelete(options,'b1');await confirmation.callback();assert.equal(state.account.currentBalance,900);
  assert.equal(state.bills[0].billingDeleted.receivedPolicy,'release');
});

function functionSource(text,name,from=0){const match=new RegExp('^(?:async )?function '+name+'\\(','gm');match.lastIndex=from;const found=match.exec(text);if(!found)throw Error('Missing '+name);const tail=text.slice(found.index+1),next=tail.search(/^(?:async )?function /m);return text.slice(found.index,next<0?text.length:found.index+1+next);}

test('all nine actual received/sent adapters release NEW deleted sources across weeks but never OLD sources',()=>{
  let count=0;
  for(const text of [source,fs.readFileSync(path.join(__dirname,'../factory-sale.js'),'utf8')])for(const match of text.matchAll(/^function supplierProductionReceivedBillData\(worker\)\{/gm)){
    const code=functionSource(text,'supplierProductionReceivedBillData',match.index),key=code.match(/history=\(settings\.(\w+)/)[1],isSale=key==='billing',owner=isSale?'shopkeeperId':'supplierId';
    const article={id:'article',name:'Saved article',rate:2,ratePerUnit:2},record={id:'r',date:'2026-09-01',workerId:'a',pressCutting:true,workflowVersion:1,atoms:10,productId:'article',articleId:'article',unit:'ATOMS',ratePerUnit:2,lines:[{articleId:'article',articleName:'Saved article',unit:'ATOMS',receivedQty:10,enteredReceivedQty:10,rateSnapshot:2}]};
    const deleted={id:'deleted',[owner]:'a',billingLifecycleVersion:1,billingDeleted:{version:1,receivedPolicy:'release'},sourceRecordIds:['r']};
    const settings={[key]:{bills:[deleted]},upperDistributions:[record],upperArticles:[article]},worker={id:'a',products:[article],articles:[article],purchases:[record],dispatches:[record]};
    const before=JSON.stringify({record,worker});
    const sandbox=vm.createContext({console,settings,getUpperWorkWeekRange:()=>({start:new Date('2026-10-17'),end:new Date('2026-10-24')}),upperWeeklyRecords:()=>[],upperLocalDateKey:value=>value.toISOString().slice(0,10),slRoleNumber:n=>Math.round(Number(n)*1000000)/1000000,upperLineDisplay:()=>({unit:'ATOMS'}),upperArticleUnit:()=> 'ATOMS',shoeSoleProductDisplayUnit:()=> 'ATOMS',factorySaleShopArticles:value=>value.articles});
    vm.runInContext(helper,sandbox);vm.runInContext(code,sandbox);
    const received=sandbox.supplierProductionReceivedBillData(worker);assert.equal(received.lines[0].qty,10);assert.deepEqual(copy(received.sourceRecordIds),['r']);
    delete deleted.billingLifecycleVersion;assert.equal(sandbox.supplierProductionReceivedBillData(worker).lines.length,0);
    deleted.billingLifecycleVersion=1;settings[key].bills.push({id:'rebilled',[owner]:'a',sourceRecordIds:['r']});assert.equal(sandbox.supplierProductionReceivedBillData(worker).lines.length,0);
    assert.equal(JSON.stringify({record,worker}),before);count++;
  }
  assert.equal(count,9);
});

test('all nine actual new bill saves persist the reliable marker and leave old bills unmarked',async()=>{
  let count=0;
  for(const text of [source,fs.readFileSync(path.join(__dirname,'../factory-sale.js'),'utf8')])for(const match of text.matchAll(/^async function saveSupplierProductionBill\(workerId,/gm)){
    const code=functionSource(text,'saveSupplierProductionBill',match.index),key=code.match(/previous=settings\.(\w+)/)[1],isSale=key==='billing',owner=isSale?'shopkeeperId':'supplierId';
    const old={id:'old',[owner]:'a',voucherNo:1001},settings={[key]:{accounts:{a:{startingBalance:100,currentBalance:100,openingAmount:100}},bills:[old],nextVoucherNo:1002}},worker={id:'a',name:'Supplier A'},lines=[{articleId:'article',articleName:'Saved',unit:'ATOMS',qty:2,rate:2}],received={lines,sourceRecordIds:['r'],periodFrom:'2026-10-17',periodTo:'2026-10-22'};
    const sandbox=vm.createContext({console,settings,supplierProductionBillSaving:false,supplierProductionActiveWorker:()=>worker,supplierProductionBillWorker:()=>worker,supplierProductionReceivedBillData:()=>received,supplierProductionBillAmounts:value=>({lines:value,totalAmount:4}),supplierProductionBillActivity:()=> 'activity',supplierProductionBillFingerprint:async()=> 'fingerprint',supplierProductionBillAccountState:()=>({exists:true,value:copy(settings[key].accounts.a)}),saveCriticalCloudState:async()=>true,reconcileCloudAfterCriticalRollback:async()=>{},document:{getElementById:()=>null},uid:()=> 'new-bill',closeModal(){},showSupplierProductionBill(){},openSupplierProductionBill(){},toast(){}});
    vm.runInContext(code,sandbox);assert.equal(await sandbox.saveSupplierProductionBill('a',lines,100,0,received),true);
    assert.equal(sandbox.settings[key].bills[1].billingLifecycleVersion,1);assert.equal(sandbox.settings[key].bills[0].billingLifecycleVersion,undefined);
    assert.deepEqual(copy(sandbox.settings[key].bills[1].sourceRecordIds),['r']);count++;
  }
  assert.equal(count,9);
});

test('Boards release/retain works across periods without changing original purchases',()=>{
  const supplier={id:'a',purchases:[{id:'r',date:'2026-09-01',items:10}],supplierBills:[{id:'deleted',supplierId:'a',sourceRecordIds:['r'],billingLifecycleVersion:1,billingDeleted:{version:1,receivedPolicy:'release'}}]},before=copy(supplier.purchases);
  const sandbox=vm.createContext({console,sbBillDateKey:value=>new Date(value).toISOString().slice(0,10),shoeBoxPurchaseItems:item=>item.items});vm.runInContext(helper,sandbox);vm.runInContext(functionSource(source,'sbSupplierBillReceived'),sandbox);
  assert.equal(sandbox.sbSupplierBillReceived(supplier,'2026-10-17','2026-10-22').totalItems,10);
  delete supplier.supplierBills[0].billingLifecycleVersion;assert.equal(sandbox.sbSupplierBillReceived(supplier,'2026-10-17','2026-10-22').totalItems,0);
  assert.deepEqual(supplier.purchases,before);
});

test('Gas NEW deletion releases only its saved KG/extra sources; OLD deletion releases none',()=>{
  for(const marker of [undefined,1]){
    const gasBill={id:'gas',openingAmount:1000,gasAmount:200,extraBalanceAmount:30,paidAmount:50,remainingBalance:1180,totalGasKg:20,billingSourceExtraIds:['extra-new'],gasBillReversal:{version:1,beforeState:{gasSupplierBillAccount:{exists:true,value:{currentBalance:1000}}}}};if(marker)gasBill.billingLifecycleVersion=marker;
    const settings={gasSupplier:{id:'a'},gasSupplierBillAccount:{startingBalance:1000,currentBalance:1180},gasSupplierBills:[gasBill],gasSupplierBilledExtraBalanceIds:['extra-old','extra-new'],gasSupplierWeeks:[{remainingKg:7}],gasExtraBalances:[{id:'extra-new',amount:30}]};
    const sandbox=vm.createContext({console,settings});vm.runInContext(helper,sandbox);const options=sandbox.billAccountGasAdapter(),before=copy(settings.gasSupplierWeeks);
    options.write(sandbox.billAccountChange(options.read(),options,{type:'delete',id:'delete',billId:'gas'}));
    assert.equal(sandbox.settings.gasSupplierBillAccount.currentBalance,950);
    assert.equal(sandbox.settings.gasSupplierBillAccount.billReleasedGasKg??0,marker?20:0);
    assert.deepEqual(copy(sandbox.settings.gasSupplierBilledExtraBalanceIds),marker?['extra-old']:['extra-old','extra-new']);
    assert.deepEqual(copy(sandbox.settings.gasSupplierWeeks),before);assert.equal(sandbox.settings.gasExtraBalances.length,1);
  }
});

test('actual Gas create/delete/rebill consumes released KG exactly once and saves NEW source markers',async()=>{
  const week={openingKg:3,newGasKg:0,remainingKg:3},settings={gasSupplier:{id:'a',name:'Gas A'},gasSupplierBillAccount:{startingBalance:100,currentBalance:100},gasSupplierBills:[],gasSupplierWeeks:[week],gasSupplierBilledExtraBalanceIds:['old-extra'],gasExtraBalances:[{id:'old-extra',amount:9},{id:'new-extra',amount:20}]};
  const fields={};for(const id of ['gasBillRate','gasBillOpening','gasBillPaid','gasBillTotal','gasBillGrandTotal','gasBillRemaining','gasBillSaveOpening','gasBillCancel','gasBillSave'])fields[id]={value:({gasBillRate:10,gasBillOpening:100,gasBillPaid:0}[id]??''),disabled:false,addEventListener(){}};
  let counter=0;const sandbox=vm.createContext({console,settings,ensureCurrentGasWeek:()=>week,gasWeekKg:(value,key)=>value[key]||0,gasExtraBalanceTotal:()=>sandbox.settings.gasExtraBalances.filter(item=>!sandbox.settings.gasSupplierBilledExtraBalanceIds.includes(item.id)).reduce((sum,item)=>sum+item.amount,0),modal(){},esc:String,formatMoney:String,gasSupplierBillHistoryHtml:()=>'',gasBindSupplierBillHistory(){},gasSaveSupplierOpeningAmount(){},closeModal(){},document:{getElementById:id=>fields[id]},gasBillActivityFingerprint:async()=> 'activity',gasDeepSnapshot:()=>({}),gasSupplierBillCommit:async()=>true,render(){},showGasSupplierBill(){},uid:()=> 'gas-'+(++counter),toast:message=>{throw Error(message);}});
  vm.runInContext(helper,sandbox);sandbox.mountBillAccountActions=()=>{};
  for(const name of ['gasBillAccountOpening','gasBillEffectState','gasSupplierBillGrandTotal','gasSupplierBillForm'])vm.runInContext(functionSource(source,name),sandbox);
  sandbox.settings.gasSupplierBillAccount.billReleasedGasKg=2;
  sandbox.gasSupplierBillForm();await fields.gasBillSave.onclick();
  let saved=sandbox.settings.gasSupplierBills[0];assert.equal(saved.billingLifecycleVersion,1);assert.equal(saved.totalGasKg,5);assert.deepEqual(copy(saved.billingSourceExtraIds),['new-extra']);assert.equal(sandbox.settings.gasSupplierBillAccount.billReleasedGasKg,0);assert.equal(week.remainingKg,0);
  const options=sandbox.billAccountGasAdapter();options.write(sandbox.billAccountChange(options.read(),options,{type:'delete',id:'delete-gas',billId:saved.id}));
  assert.equal(sandbox.settings.gasSupplierBillAccount.currentBalance,100);assert.equal(sandbox.settings.gasSupplierBillAccount.billReleasedGasKg,5);
  sandbox.gasSupplierBillForm();await fields.gasBillSave.onclick();saved=sandbox.settings.gasSupplierBills[1];
  assert.equal(saved.totalGasKg,5);assert.equal(saved.billingLifecycleVersion,1);assert.equal(sandbox.settings.gasSupplierBillAccount.billReleasedGasKg,0);assert.equal(sandbox.settings.gasSupplierBillAccount.currentBalance,170);
});

test('actual Boards creation saves NEW marker and original source links without promoting old bills',async()=>{
  const supplier={id:'a',name:'Boards A',supplierBillAccount:{startingBalance:100,currentBalance:100},supplierBills:[{id:'old',voucherNo:1,openingAmount:100}],purchases:[{id:'r',items:10}]},settings={shoeBoxSuppliers:[supplier]},received={sourceRecordIds:['r'],totalItems:10};
  const fields={};for(const id of ['sbBillFrom','sbBillTo','sbBillRate','sbBillOpening','sbBillPaid','sbBillItems','sbBillTotal','sbBillGrandTotal','sbBillRemaining','sbBillSaveOpening','sbBillCancel','sbBillSave'])fields[id]={value:({sbBillFrom:'2026-10-17',sbBillTo:'2026-10-22',sbBillRate:5,sbBillOpening:100,sbBillPaid:0}[id]??''),disabled:false,addEventListener(){}};
  const sandbox=vm.createContext({console,settings,sbSupplierBillSaving:false,getShoeBoxSuppliers:()=>sandbox.settings.shoeBoxSuppliers,sbSupplierBillWeek:()=>({from:'2026-10-17',to:'2026-10-22'}),sbSupplierBillReceived:()=>received,modal(){},esc:String,formatMoney:String,sbSupplierBillHistoryHtml:()=>'',sbBindSupplierBillHistory(){},sbSaveSupplierBillOpening(){},closeModal(){},document:{getElementById:id=>fields[id]},sbSupplierBillFingerprint:async()=> 'activity',sbSnapshot:()=>({}),sbSupplierBillCommit:async()=>true,showShoeBoxSupplierBill(){},shoeBoxSupplierDisplayName:value=>value.name,uid:()=> 'new-board',toast:message=>{throw Error(message);}});
  vm.runInContext(helper,sandbox);sandbox.mountBillAccountActions=()=>{};
  for(const name of ['sbSupplierBillAccountState','sbSupplierBillActivity','sbSupplierBillGrandTotal','sbSupplierBillForm'])vm.runInContext(functionSource(source,name),sandbox);
  sandbox.sbSupplierBillForm(0);await fields.sbBillSave.onclick();
  const bills=sandbox.settings.shoeBoxSuppliers[0].supplierBills;assert.equal(bills[0].billingLifecycleVersion,undefined);assert.equal(bills[1].billingLifecycleVersion,1);assert.deepEqual(copy(bills[1].sourceRecordIds),['r']);assert.equal(sandbox.settings.shoeBoxSuppliers[0].supplierBillAccount.currentBalance,150);assert.equal(sandbox.settings.shoeBoxSuppliers[0].purchases[0].items,10);
});

test('verified zero-production monetary bill may be deleted without inventing quantities',()=>{
  const data={account:{startingBalance:100,currentBalance:80},bills:[{...bill('zero',100,0,20),lines:[],sourceRecordIds:[]}]};
  const result=remove(data,'zero');assert.equal(result.account.currentBalance,80);assert.equal(result.bills[0].billingDeleted.receivedPolicy,'keep');assert.deepEqual(copy(result.bills[0].sourceRecordIds),[]);
});

function archiveFixture(){return {account:{startingBalance:350000,currentBalance:200000,openingAmount:200000,lastBillId:'old-1001',billPayments:[{id:'existing-payment',amount:5000,date:'2026-10-19'}],billCorrections:[{id:'existing-correction'}]},bills:[{id:'old-1001',supplierId:'a',supplierName:'Waseem Sole',voucherNo:1001,date:'2026-10-01',pendingAmount:350000,totalAmount:375000,lines:[{articleId:'original',qty:150,rate:2500,amount:375000}]}]};}
const archive=data=>context.billAccountChange(data,adapter,{type:'archive',billId:'old-1001',id:'archive-1'});

test('missing-snapshot OLD archive preserves exact balances/payments, original bill and receiving closure',()=>{
  const data=archiveFixture(),before=copy(data),result=archive(data);
  assert.equal(result.account.currentBalance,200000);assert.equal(result.account.openingAmount,200000);
  const account=copy(result.account);delete account.billArchives;assert.deepEqual(account,before.account);
  const bill=copy(result.bills[0]);delete bill.billingDeleted;assert.deepEqual(bill,before.bills[0]);
  assert.deepEqual(copy(result.account.billArchives[0].originalBill),before.bills[0]);
  assert.equal(result.bills[0].billingDeleted.financialPolicy,'unchanged');
  assert.equal(context.billAccountKeepsReceived(result.bills[0]),true);
  assert.equal(context.billAccountReleasedIds(result.bills,'a').size,0);
  assert.equal(result.bills.filter(item=>!item.billingDeleted).length,0);
  context.esc=String;assert(context.billAccountHistoryHtml(result.account).includes('Archived OLD Bills'));
  assert.deepEqual(data,before);assert.throws(()=>archive(result));
});

test('archive cannot bypass NEW policy or verified OLD financial deletion',()=>{
  const data=archiveFixture();data.bills[0].billingLifecycleVersion=1;assert.throws(()=>archive(data));
  const valid=lifecycleFixture();assert.equal(context.billAccountCanArchive(valid.bills[0],adapter),false);
  assert.throws(()=>context.billAccountChange(valid,adapter,{type:'archive',billId:'b1',id:'archive'}));
  const missing=lifecycleFixture();delete missing.bills[0].paidAmount;assert.equal(context.billAccountCanArchive(missing.bills[0],adapter),true);
});

test('archive confirmation writes only after approval; failed save rolls back and retry succeeds once',async()=>{
  let state=archiveFixture(),confirmation,locked=false,writes=0;
  const sandbox=vm.createContext({console,uid:()=> 'archive',toast(){},openConfirmModal:(text,callback)=>{confirmation={text,callback};}});vm.runInContext(helper,sandbox);
  const options={...adapter,read:()=>state,write:value=>{state=value;writes++;},valid:()=>true,busy:()=>locked,lock:value=>{locked=value;},save:async()=>false,reconcile:async()=>{},back(){}};
  const before=JSON.stringify(state);sandbox.confirmBillAccountDelete(options,'old-1001');assert.equal(writes,0);assert(confirmation.text.startsWith('Archive OLD Bill #1001'));await confirmation.callback();assert.equal(JSON.stringify(state),before);
  options.save=async()=>true;sandbox.confirmBillAccountDelete(options,'old-1001');await confirmation.callback();assert.equal(state.account.currentBalance,200000);assert.equal(state.account.billArchives.length,1);
  const saved=JSON.stringify(state);sandbox.confirmBillAccountDelete(options,'old-1001');assert.equal(JSON.stringify(state),saved);
});

test('archive affects only the selected supplier and rejects stale/changed-account confirmation',async()=>{
  const data=archiveFixture();let store={accounts:{a:data.account,b:{currentBalance:987}},bills:[...data.bills,{id:'other',supplierId:'b',totalAmount:123}]};
  const options=context.billAccountLineAdapter({id:'a',get:()=>store,set:value=>{store=value;},valid:()=>true,busy:()=>false,lock(){},save:async()=>true,reconcile:async()=>{}});
  const other=JSON.stringify({account:store.accounts.b,bill:store.bills[1]}),snapshot=JSON.stringify(options.read());
  await context.billAccountCommit(options,snapshot,{type:'archive',billId:'old-1001',id:'archive'});
  assert.equal(JSON.stringify({account:store.accounts.b,bill:store.bills[1]}),other);
  await assert.rejects(context.billAccountCommit(options,snapshot,{type:'archive',billId:'old-1001',id:'again'}));
});

test('correction cannot silently reverse an archived legacy financial contribution',()=>{
  const data=archiveFixture();data.bills[0].billReversal={version:1,beforeAccount:{exists:true,value:{currentBalance:350000}}};
  const result=archive(data);assert.throws(()=>context.billAccountReplay(copy(result),adapter,false,'old-1001'));
});
