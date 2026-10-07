// Reviewed metadata and pure calculations only. No storage/network access.
export const REGISTRY_VERSION = 2;
const ACTIONS = ['search', 'detail', 'history', 'summary'];
const DENIED = new Set(['__proto__', 'prototype', 'constructor', 'ownerPin', 'secret', 'secrets', 'auditLog', 'backups', 'photo', 'logo', 'wallpaper', 'customFields', 'notes', 'verificationNotes']);
const sensitive=k=>DENIED.has(k)||/password|passwd|secret|token|credential|apikey|authorization|privatekey|accesskey|(?:^|_)pin(?:$|_)/i.test(String(k).replace(/[- ]/g,'_'));
const obj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const list = v => Array.isArray(v) ? v : [];
const n = v => Number(v) || 0;
const positive = v => Math.max(0, n(v));
const same = (a, b) => a != null && b != null && String(a) === String(b);
const key = v => String(v ?? '').normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase();
const active = r => !r.deletedAt && r.deleted !== true && !r.voided && r.status !== 'Deleted';
const fields = text => Object.fromEntries(text.split(' ').filter(Boolean).map(k => [k, true]));
const identity = fields('id name code articleNo category phone whatsapp mobile address location shopName ownerName archived deletedAt deleted tags');
const dated = fields('id date workDate createdAt updatedAt editedAt deletedAt deleted status voucherNo voucherId workerId workerRecordId workerName workerCategory supplierId supplierName articleId articleName materialId materialName productId productName');
const quantities = fields('qty unit stock stockItems stockBoxes boxes items atoms laminationUnit customUnit rate itemPrice amount reportedQty verifiedQty originalReportedQty difference rateSnapshot pairsPerUnit');
const productionLine = { ...dated, ...quantities, ...fields('receivedQty enteredQty enteredReceivedQty atomsPerUnit internalAtomsQty internalReceivedAtomsQty issuedQty openingPending labourExpense lineTotal articleStockBefore materialStockBefore') };
const productionVoucher = { ...dated, ...fields('workflowVersion totalItems totalAmount expenseAmount kharcha'), lines: [productionLine], items: [productionLine], materials: [productionLine] };
const pendingSchema = { ...dated, ...fields('qty delta action') };
const paymentSchema = { ...dated, ...fields('amount currentPaid amountKg previousRemainingKg oldWeekId oldWeekKey nextWeekId previousOpening previousNew previousAdvance status') };
const balanceSchema = { ...fields('openingAtom openingItem payAtom payItem advanceAtom advanceItem lastSettlementAt'), settledPurchaseIds: true, paymentHistory: [paymentSchema] };
const productSchema = { ...identity, ...quantities, atomBalance: balanceSchema, itemBalance: balanceSchema };
const supplierSchema = { ...identity, gasType: true, perKgPrice: true, status: true };
const source=(dataset,path,schema,entity,recordType,dateFields=['workDate','date','createdAt'])=>({dataset,path,schema,entity,recordType,dateFields,rootType:dataset==='settings'&&['gasSupplier','lamination','magziBatavaSupplier','workerProductionPages','wholeFactoryMaterials'].includes(path.split('.')[0])?'object':'array'});
const setting = (path, schema, entity, recordType, dates) => source('settings', path, schema, entity, recordType, dates);
const base = (name, aliases, adapter, sources, metrics, week = 'saturday_thursday') => ({ name, aliases, adapter, sources, metrics, week, actions: ACTIONS, entityAliases: [], sensitiveFields: [...DENIED], groupBy: ['worker', 'supplier', 'article', 'material', 'date'], identityFields: ['id'], nameFields: ['name', 'code', 'articleNo', 'shopName', 'ownerName'], relationships: [] });
const articleSchema = { ...identity, ...quantities, workerCategory: true, workerCategories: true, cartons: true, materials: [productionLine] };
const adjustments = setting('productionKharchaAdjustments', { ...dated, module: true, delta: true }, null, 'kharcha_adjustment', ['date']);
const workerSource = source('workers', '', { ...identity, upperDefaultMaterialId:true, defaultArticleLists: { upper: true, batam: true, finished: true }, defaultArticleIds: { upper: true, batam: true, finished: true } }, 'worker');
function bfModule(prefix, label, aliases) {
  return base(label, aliases, 'production', {
    workers: workerSource,
    articles: setting(prefix + 'MansProductionArticles', articleSchema, 'article'),
    materials: setting(prefix + 'MansProductionMaterials', articleSchema, 'material'),
    entries: setting(prefix + 'MansProduction', { ...productionLine, ...fields('slipId verificationAt verifiedAt verifiedBy') }, null, 'production'),
    vouchers: setting(prefix + 'MansProductionVouchers', productionVoucher, null, 'voucher'),
    distributions: setting(prefix + 'MansMaterialDistributions', productionLine, null, 'material_issue'),
    pending: setting(prefix + 'MansPendingRecords', pendingSchema, null, 'pending_adjustment'),
    expenses: setting(prefix + 'MansExpenses', { ...dated, amount: true }, null, 'expense'),
    verification: setting(prefix + 'MansVerificationSlips', { ...dated, slipNo: true, entries: [productionLine], rows: [productionLine], entryIds: true, voucherIds: true }, null, 'verification'),
    adjustments,
  }, ['count', 'reported', 'verified', 'issued', 'pending', 'kharcha', 'expenses', 'stock']);
}
function shoeModule(section, label, aliases) {
  return base(label, aliases, 'shoe', {
    suppliers: setting(section, supplierSchema, 'supplier'),
    products: setting(section + '.*.products', productSchema, 'article'),
    purchases: setting(section + '.*.purchases', { ...dated, ...quantities, time: true }, null, 'receive'),
    vouchers: setting(section + '.*.receiveVouchers', { ...dated, purchaseIds: true, workerTotalBoxesSnapshot: true, rateSnapshot: true, amountSnapshot: true }, null, 'voucher'),
    payments: setting(section + '.*.products.*.atomBalance.paymentHistory', paymentSchema, null, 'payment'),
    accounts: setting(section + '.*.account', { openingAmount: true, currentPaid: true, cycleStart: true, advanceBalance: true, payments: [paymentSchema] }),
    accountPayments: setting(section+'.*.account.payments',paymentSchema,null,'money_payment',['date']),
    extra: setting(section + '.*.extraBalances', { ...dated, amount: true }, null, 'extra_balance'),
  }, ['count','received','stock','opening','new','balance','advance','paid','paidMoney','extraBalance'], 'rolling_7_including_today');
}

// A future module using an existing adapter requires only a reviewed entry here.
export const MODULE_REGISTRY = {
  factory: { ...base('Factory profile', [], 'generic', { profile: setting('', fields('factoryName address phone')) }, [], 'calendar'), actions: ['profile'], profile: { appName: 'Leather Right Shoes By Abid', ownerName: 'Haji Abid Sahab' } },
  workers: base('Workers', ['worker'], 'workers', { workers: workerSource,
    columns: setting('customWorkerColumns', fields('id label')),
    upperArticles: setting('upperArticles', articleSchema),
    batamArticles: setting('batamMansProductionArticles', articleSchema),
    finishedArticles: setting('finishedMansProductionArticles', articleSchema),
  }, ['count', 'baqi'], 'calendar'),
  stock: base('Materials and stock', ['materials'], 'generic', {
    materials: source('materials', '', { ...identity, ...quantities, lowStockThreshold: true }, 'material'),
    movements: source('stockMovements', '', { ...dated, type: true, qty: true, unit: true }, null, 'stock_movement', ['date']),
    transactions: source('transactions', '', { ...dated, receiptNo: true, qty: true, unit: true }, null, 'transaction', ['date']),
  }, ['count', 'stock', 'issued', 'received'], 'calendar'),
  articles: base('Articles', ['article'], 'generic', { articles: {...source('articles','',articleSchema,'article'),stockUnit:'PAIRS'} }, ['count', 'stock'], 'calendar'),
  shopkeepers: base('Shopkeepers and bills', ['shopkeeper', 'sales'], 'shopkeepers', {
    shopkeepers: source('shopkeepers', '', { ...identity, openingBalance: true, ledger: [{ ...dated, type: true, amount: true }] }, 'shopkeeper'),
    bills: source('bills', '', { ...dated, billNo: true, shopkeeperId: true, shopkeeperName: true, total: true, paid: true, lines: [productionLine] }, null, 'bill', ['date']),
    ledger: source('shopkeepers', '*.ledger', { ...dated, type: true, amount: true }, null, 'ledger', ['date']),
  }, ['count', 'sold', 'billed', 'paid', 'balance'], 'calendar'),
  upper: base('Upper Man production', ['upper_man', 'upper mans'], 'upper', {
    workers: workerSource, articles: setting('upperArticles', articleSchema, 'article'), materials: setting('upperMaterials', articleSchema, 'material'),
    vouchers: setting('upperDistributions', productionVoucher, null, 'voucher'), pending: setting('upperPendingRecords', pendingSchema, null, 'pending_adjustment'), adjustments,
    config: setting('workerProductionPages', { '*': { features: { articleOnly: true } } }),
    legacyLabour: setting('upperWeeklyLabourRecords', { ...dated, totalAmount: true, amount: true }, null, 'legacy_labour'),
  }, ['count', 'issued', 'received', 'pending', 'kharcha', 'grossEarned', 'netEarned', 'stock']),
  batam: bfModule('batam', 'Battam Man production', ['battam', 'bottom', 'battam_man']),
  finished: bfModule('finished', 'Finished Man production', ['finished_man', 'finish']),
  gas: base('Gas supplier and usage', ['gas_supplier'], 'gas', {
    workers: workerSource, suppliers: setting('gasSupplier', supplierSchema, 'supplier'),
    vouchers: source('gasVouchers', '', { ...dated, ...fields('qtyKg gasType workerId voided extraBalanceAmount workerTotalGasKgSnapshot'), gasBalanceEffect: fields('weekId weekKey advanceUsedKg newGasKgAdded'), gasBalanceSnapshot: fields('pendingKg totalKg capturedAt') }, null, 'voucher', ['date']),
    weeks: setting('gasSupplierWeeks', fields('weekKey weekId openingKg newGasKg payKg advanceKg remainingKg closedAt paymentDate createdAt paidAtPaymentKg'), null, 'cycle', ['createdAt', 'weekKey']),
    payments: setting('gasPayments', paymentSchema, null, 'payment', ['date']),
    extra: setting('gasExtraBalances', { ...dated, amount: true }, null, 'extra_balance', ['date']),
  }, ['count', 'issued', 'paid', 'opening', 'new', 'balance', 'advance', 'extraBalance', 'balanceMoney'], 'rolling_7_before_today'),
  shoe_box: shoeModule('shoeBoxSuppliers', 'Shoe box suppliers', ['shoe_boxes', 'boxes']),
  shoe_sole: shoeModule('shoeSoleSuppliers', 'Shoe sole suppliers', ['shoe_soles', 'soles']),
  whole_factory_materials: shoeModule(
    'wholeFactoryMaterials.shoeSoleSuppliers',
    'Whole Factory Materials',
    ['whole factory materials', 'factory materials', 'material receiving']
  ),
  magzi: base('Magzi and Batava', ['magzi_batava', 'batava'], 'magzi', {
    suppliers: setting('magziBatavaSupplier.supplier', supplierSchema, 'supplier'),
    articles: setting('magziBatavaSupplier.products', productSchema, 'article'),
    vouchers: setting('magziBatavaSupplier.vouchers', productionVoucher, null, 'voucher'),
    payments: setting('magziBatavaSupplier.payments', { ...paymentSchema, productId: true }, null, 'payment', ['date']),
    opening: setting('magziBatavaSupplier.opening', { '*': 'number' }), advance: setting('magziBatavaSupplier.advance', { '*': 'number' }),
    settlements: setting('magziBatavaSupplier.settlements', { '*': { version: true, includedVouchers: { '*': fields('amount reversed baseline') } } }),
  }, ['count', 'issued', 'received', 'pending', 'kharcha', 'opening', 'new', 'paid', 'balance', 'advance'], 'saturday_friday'),
  lamination: base('Lamination', [], 'lamination', {
    suppliers: setting('lamination.suppliers', supplierSchema, 'supplier'), articles: setting('lamination.types', articleSchema, 'article'),
    vouchers: setting('lamination.vouchers', { ...dated, lines: [{ ...dated, typeId: true, typeName: true, issued: true, received: true }] }, null, 'voucher'),
  }, ['count', 'issued', 'received', 'pending'], 'saturday_friday'),
};
MODULE_REGISTRY.upper.category = 'UPPER MANS';
MODULE_REGISTRY.upper_all={...MODULE_REGISTRY.upper,name:'All Upper worker-filter workflows',aliases:['upper_workflows'],category:null,entityAliases:[]};
MODULE_REGISTRY.stitch={...MODULE_REGISTRY.upper,name:'Stitch Man production',aliases:['stitch_man'],category:'Stitch Man',entityAliases:[]};
MODULE_REGISTRY.shoe_lamination={...MODULE_REGISTRY.upper,name:'Shoes Laminations production',aliases:['shoes laminations','shoe lamination'],category:'Shoes Laminations',categoryAliases:['shoe lamination','shoes laminations'],entityAliases:[]};
MODULE_REGISTRY.kharcha=base('Factory kharcha and expenses',['expenses','kharcha'],'generic',{
 upper:{...setting('upperDistributions',productionVoucher,null,'upper_expense'),aggregations:{kharcha:{field:'totalAmount',unit:'PKR'}}},
 batam:{...setting('batamMansProductionVouchers',productionVoucher,null,'batam_expense'),aggregations:{kharcha:{field:'expenseAmount',unit:'PKR'}}},
 finished:{...setting('finishedMansProductionVouchers',productionVoucher,null,'finished_expense'),aggregations:{kharcha:{field:'expenseAmount',unit:'PKR'}}},
 magzi:{...setting('magziBatavaSupplier.vouchers',productionVoucher,null,'magzi_expense'),aggregations:{kharcha:{field:'kharcha',unit:'PKR'}}},
 adjustments:{...adjustments,aggregations:{kharcha:{field:'delta',unit:'PKR'}}}
},['count','kharcha']);
const PRIMARY={workers:['workers'],stock:['materials'],articles:['articles'],shopkeepers:['bills'],upper:['vouchers'],upper_all:['vouchers'],stitch:['vouchers'],shoe_lamination:['vouchers'],label:['vouchers'],batam:['entries'],finished:['entries'],gas:['vouchers'],shoe_box:['purchases'],shoe_sole:['purchases'],whole_factory_materials:['purchases'],magzi:['vouchers'],lamination:['vouchers']};
MODULE_REGISTRY.label = { ...MODULE_REGISTRY.upper, name: 'Label Man production', aliases: ['label_man', 'label mans'], category: 'LABEL MANS', entityAliases: [] };
const RULES = {
  upper: ['upperLineDisplay', 'upperPendingState', 'upperVoucherPendingArticles', 'upperWorkerWeekSummary', 'productionKharchaAdjustmentTotal'],
  production: ['bfWeeklyVoucherData', 'bfArticleUnit', 'getBatamPendingForWorker', 'getFinishedPendingForWorker', 'productionKharchaAdjustmentTotal'],
  gas: ['gasVoucherBelongsToWorker', 'getGasHistoryList', 'recalcGasWeekBalance', 'gasVoucherBalanceDisplay'],
  shoe: ['shoeBoxReceiveSummary', 'shoeBoxProductAtomBalanceForSupplier', 'shoeSoleProductAtomBalanceForSupplier'],
  magzi: ['mb20ItemPending', 'mb20new', 'mb20paid', 'mb20bal'],
  workers: ['workerDefaultArticleIds', 'getWorkerSummaryAmount'], shopkeepers: ['shopkeeperBalance'], lamination: ['lmPending'], generic: ['stored_stock_and_quantities'],
};
for (const [moduleId,m] of Object.entries(MODULE_REGISTRY)) {
  m.countCollections=PRIMARY[moduleId]||Object.keys(m.sources).filter(k=>m.sources[k].recordType);
  m.categoryFilter=m.adapter==='upper';
  m.calculationRules = { adapter: m.adapter, version: 1, sourceFunctions: RULES[m.adapter], missing: 'not_found', unitPolicy: 'separate_units', historyPagination: 'after_filter_and_sort', summaryPagination: 'after_full_aggregation' };
  m.relationships = Object.entries(m.sources).filter(([, s]) => s.recordType).map(([collection]) => ({ collection, keys: ['workerId', 'supplierId', 'articleId', 'materialId', 'productId', 'voucherId'], rule: 'saved_id_only_except_unique_exact_legacy_gas_worker_name' }));
  m.quantityFields = ['qty', 'qtyKg', 'atoms', 'items', 'stock', 'stockItems', 'reportedQty', 'verifiedQty', 'issuedQty', 'receivedQty'];
  m.balanceFields = ['openingKg', 'remainingKg', 'openingAtom', 'advanceAtom', 'opening', 'advance', 'delta'];
}

// No aliases are inferred. Approved aliases are added to an entry's entityAliases.
export function project(value, schema) {
  if(schema==='number')return (typeof value==='number'||typeof value==='string')&&String(value).trim()&&Number.isFinite(Number(value))?value:undefined;
  if (schema === true) {
    if (Array.isArray(value)) return value.filter(v => v === null || ['string', 'number', 'boolean'].includes(typeof v));
    return value === null || ['string', 'number', 'boolean'].includes(typeof value) ? value : undefined;
  }
  if (Array.isArray(schema)) return Array.isArray(value) ? value.map(v => project(v, schema[0])).filter(v => v !== undefined) : undefined;
  if (!obj(value) || !obj(schema)) return undefined;
  const out = {};
  for (const k of Object.keys(value)) {
    if (sensitive(k)) continue;
    const allowed = Object.hasOwn(schema, k) ? schema[k] : schema['*'];
    if (allowed === undefined) continue;
    const v = project(value[k], allowed);
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function extract(root, path, schema) {
  const walk = (v, parts, parents) => {
    if (!parts.length) return (Array.isArray(v) ? v : [v]).filter(x => x != null).map(record => ({ record: project(record, schema), parents }));
    const [part, ...rest] = parts;
    if (part === '*') return list(v).flatMap(parent => walk(parent, rest, [...parents, parent]));
    return obj(v) && Object.hasOwn(v, part) ? walk(v[part], rest, parents) : [];
  };
  return walk(root, path ? path.split('.') : [], []);
}
const dayKey = date => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const midnight = day => new Date(day + 'T00:00:00+05:00');
const addDays = (day, amount) => dayKey(new Date(+midnight(day) + amount * 86400000));
const validDay = day => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(+midnight(day)) && dayKey(midnight(day)) === day;
const saturday = day => addDays(day, -((new Date(day + 'T12:00:00Z').getUTCDay() + 1) % 7));
export function resolvePeriod(input = { preset: 'all' }, module, now = new Date()) {
  const today = dayKey(now), preset = input.preset || 'range';
  let from = null, to = null, basis = module.week;
  if (preset === 'today') from = to = today;
  else if (preset === 'yesterday') from = to = addDays(today, -1);
  else if (preset === 'this_month') { from = today.slice(0, 7) + '-01'; to = today; }
  else if (preset === 'last_n_days') { from = addDays(today, -(input.days - 1)); to = today; }
  else if (preset === 'range') { from = input.from; to = input.to; }
  else if (preset === 'current_week' || preset === 'previous_week') {
    const shift = preset === 'previous_week' ? -7 : 0;
    if (basis.startsWith('rolling_7')) { from = addDays(today, shift - (basis === 'rolling_7_before_today' ? 7 : 6)); to = addDays(today, shift); }
    else { from = addDays(saturday(today), shift); to = addDays(from, basis === 'saturday_thursday' ? 5 : 6); }
  } else if (preset !== 'all') throw new Error('INVALID_PERIOD');
  if ((from !== null && !validDay(from)) || (to !== null && !validDay(to)) || (from && to && from > to)) throw new Error('INVALID_PERIOD');
  return { preset, from, to, fromInclusive: from ? midnight(from).toISOString() : null, toExclusive: to ? midnight(addDays(to, 1)).toISOString() : null, timezone: 'Asia/Karachi', basis };
}
function time(record, dateFields = ['workDate', 'date', 'createdAt']) {
  const raw = dateFields.map(f => record[f]).find(v => typeof v === 'string' && v);
  if (!raw) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? midnight(raw) : new Date(raw);
  return Number.isFinite(+date) ? date : null;
}
const inPeriod = (date, p) => date !== null && (!p.fromInclusive || +date >= +new Date(p.fromInclusive)) && (!p.toExclusive || +date < +new Date(p.toExclusive));
const beforeEnd = (date, p) => date !== null && (!p.toExclusive || +date < +new Date(p.toExclusive));
function workTime(r) {
  if (!r.workDate) return time(r, ['date', 'createdAt']);
  const created = time(r, ['createdAt', 'date']);
  if (!created || !validDay(r.workDate)) return null;
  return new Date(+midnight(r.workDate) + ((+created + 18000000) % 86400000));
}
function identityOf(moduleId, descriptor, record, parents) {
  return { module: moduleId, entity: descriptor.entity, id: record.id == null ? null : String(record.id), name: record.name || record.shopName || record.ownerName || record.code || record.articleNo || null, ...(parents[0]?.id != null ? { supplierId: String(parents[0].id) } : {}) };
}
function loadModule(state, m) {
  const data = {}, missing = [];
  for (const [label, s] of Object.entries(m.sources)) {
    if (!Object.hasOwn(state, s.dataset)) { data[label] = []; missing.push(label); continue; }
    const rows = extract(state[s.dataset], s.path, s.schema);
    // Distinguish absent collections from empty saved arrays.
    let root = state[s.dataset];
    for (const part of s.path.split('.').filter(Boolean)) {
      if (part === '*') break;
      root = obj(root) ? root[part] : undefined;
    }
    if (root === undefined) missing.push(label);
    data[label] = rows.filter(x => x.record !== undefined);
  }
  return { data, missing };
}
const records = (ctx, name) => (ctx.data[name] || []).map(x => x.record);
function fact(metric, value, unit, dims = {}, date = null, state = false) { return { metric, value, unit, ...dims, date: date?.toISOString() || null, state }; }
function dims(r, parents = []) { return { worker: r.workerId || r.workerRecordId || null, supplier: r.supplierId || parents[0]?.id || null, article: r.articleId || r.productId || r.typeId || null, material: r.materialId || null }; }
function generic(ctx, p, m) {
  const out = [];
  for (const [label, rows] of Object.entries(ctx.data)) for (const { record: r, parents } of rows) {
    const s = m.sources[label], d = dims(r, parents);
    if (s.entity && Object.hasOwn(r, 'stock') && !(r.laminationUnit===true||['shoe lamination','shoes laminations'].includes(key(r.workerCategory)))) out.push(fact('stock', n(r.stock), r.unit || s.stockUnit || (s.entity === 'article' ? 'ATOMS' : null), { ...d, [s.entity]: r.id }, null, true));
    if (s.recordType === 'transaction' && Object.hasOwn(r, 'qty')) out.push(fact('issued', n(r.qty), r.unit || records(ctx, 'materials').find(x => same(x.id, r.materialId))?.unit || null, d, time(r, s.dateFields)));
    if (s.recordType === 'stock_movement' && ['add', 'opening'].includes(r.type) && Object.hasOwn(r, 'qty')) out.push(fact('received', n(r.qty), r.unit || records(ctx, 'materials').find(x => same(x.id, r.materialId))?.unit || null, d, time(r, s.dateFields)));
    // Declarative metrics let future simple modules reuse this adapter.
    for (const [metric, rule] of Object.entries(s.aggregations || {})) {
      if (Object.hasOwn(r, rule.field) && Number.isFinite(Number(r[rule.field])) && r[rule.field] !== null && r[rule.field] !== '') out.push(fact(metric, Number(r[rule.field]), rule.unit || r[rule.unitField] || null, d, time(r, s.dateFields), rule.state === true));
    }
  }
  return out;
}
function upper(ctx, p, m) {
  const out = [], vouchers = records(ctx, 'vouchers'), openings = records(ctx, 'pending'), workers = records(ctx, 'workers');
  const category = p.category ? key(p.category) : m.category ? key(m.category) : null;
  const matches = r => !category || key(r.workerCategory || workers.find(w => same(w.id, r.workerId))?.category || 'UPPER MANS') === category||!!(m.categoryAliases&&m.categoryAliases.includes(key(r.workerCategory||workers.find(w=>same(w.id,r.workerId))?.category)));
  for (const r of vouchers.filter(matches)) {
    const date = time(r), d = dims(r);
    for (const l of list(r.lines)) {
      const snapshot = l.laminationUnit===true||['ATOMS', 'SET'].includes(l.unit), unit = snapshot ? l.unit : 'ATOMS', ld = { ...d, article: l.articleId || l.articleName || null, material: l.materialId || null };
      out.push(fact('issued', snapshot ? n(l.enteredQty) : n(l.qty), unit, ld, date));
      if (r.workflowVersion === 1) {
        out.push(fact('received', snapshot ? n(l.enteredReceivedQty) : n(l.receivedQty), unit, ld, date));
        out.push(fact('grossEarned', (snapshot ? n(l.enteredReceivedQty) : n(l.receivedQty)) * n(snapshot ? l.rateSnapshot : l.rate), 'PKR', ld, date));
      }
    }
    out.push(fact('kharcha', n(r.totalAmount), 'PKR', d, date));
  }
  for (const r of records(ctx, 'adjustments').filter(r => r.module === 'upper' && matches(r))) out.push(fact('kharcha', n(r.delta), 'PKR', dims(r), time(r, ['date'])));
  if (!ctx.missing.includes('pending') && !ctx.missing.includes('vouchers')) for (const workerId of new Set([...vouchers.filter(matches), ...openings.filter(matches)].map(r => String(r.workerId)))) {
    const worker = workers.find(w => same(w.id, workerId)), cat = key(worker?.category || vouchers.find(v => same(v.workerId, workerId))?.workerCategory), pageKey = 'category-' + [...cat].map(c => c.codePointAt(0).toString(16)).join('-');
    const config = ctx.data.config?.[0]?.record;
    if (/^label mans?$/.test(cat) || config?.[pageKey]?.features?.articleOnly === true) { out.push(fact('pending', 0, 'ATOMS', { worker: workerId }, null, true)); continue; }
    if(['shoe lamination','shoes laminations'].includes(cat)){
      const grouped=new Map(),byArticle=new Map();for(const r of openings.filter(r=>same(r.workerId,workerId)&&beforeEnd(time(r,['date']),p))){const g=grouped.get('legacy')||{unit:'LEGACY_UNKNOWN',qty:0};g.qty+=Number.isFinite(Number(r.delta))?Number(r.delta):n(r.qty);grouped.set('legacy',g);}
      for(const r of vouchers.filter(r=>r.workflowVersion===1&&same(r.workerId,workerId)&&beforeEnd(workTime(r),p)))for(const l of list(r.lines)){const snapshot=l.laminationUnit===true||['ATOMS','SET'].includes(l.unit),unit=snapshot?l.unit:'ATOMS',basis=l.laminationUnit===true?'saved':'historical',signature=JSON.stringify([basis,unit]),g=grouped.get(signature)||{unit,qty:0},delta=(snapshot?n(l.enteredQty):n(l.qty))-(snapshot?n(l.enteredReceivedQty):n(l.receivedQty));g.qty+=delta;grouped.set(signature,g);const id=l.articleId||l.articleName;if(id){const k=JSON.stringify([id,basis,unit]),a=byArticle.get(k)||{unit,id,qty:0};a.qty+=delta;byArticle.set(k,a);}}
      for(const [unitBasis,g]of grouped)out.push(fact('pending',g.qty,g.unit,{worker:workerId,scope:'worker_total',unitBasis},null,true));for(const [unitBasis,g]of byArticle)out.push(fact('pending',g.qty,g.unit,{worker:workerId,article:g.id,scope:'article',unitBasis},null,true));continue;
    }
    const manual = openings.filter(r => same(r.workerId, workerId) && beforeEnd(time(r, ['date']), p));
    let total = manual.reduce((sum, r) => sum + (Number.isFinite(Number(r.delta)) ? Number(r.delta) : n(r.qty)), 0), attributable = !manual.some(r => (Number.isFinite(Number(r.delta)) ? Number(r.delta) : n(r.qty)) !== 0);
    const articles = new Map();
    for (const r of vouchers.filter(r => r.workflowVersion === 1 && same(r.workerId, workerId) && beforeEnd(workTime(r), p))) for (const l of list(r.lines)) {
      const delta = n(l.qty) - n(l.receivedQty), unit = ['ATOMS', 'SET'].includes(l.unit) ? l.unit : 'ATOMS', factor = n(l.atomsPerUnit) || (unit === 'SET' ? 2 : 1);
      total += delta;
      if (!(l.articleId || l.articleName) || ((['ATOMS', 'SET'].includes(l.unit) ? n(l.enteredQty) : n(l.qty)) * factor !== n(l.qty)) || ((['ATOMS', 'SET'].includes(l.unit) ? n(l.enteredReceivedQty) : n(l.receivedQty)) * factor !== n(l.receivedQty))) attributable = false;
      const id = l.articleId || l.articleName, k = JSON.stringify([id, unit]);
      const a = articles.get(k) || { id, unit, factor, qty: 0 }; a.qty += delta; articles.set(k, a);
    }
    out.push(fact('pending', total, 'ATOMS', { worker: workerId, scope: 'worker_total', attributable }, null, true));
    if (attributable && [...articles.values()].every(a => a.qty >= 0)) for (const a of articles.values()) out.push(fact('pending', a.qty / a.factor, a.unit, { worker: workerId, article: a.id, scope: 'article' }, null, true));
  }
  return out.concat(generic({data:{articles:(ctx.data.articles||[]).filter(x=>matches(x.record)),materials:(ctx.data.materials||[]).filter(x=>!category||!Array.isArray(x.record.workerCategories)||x.record.workerCategories.some(c=>key(c)===category))}},p,{sources:{articles:m.sources.articles,materials:m.sources.materials}}));
}
function production(ctx, p, m, moduleId) {
  const out = [], vouchers = records(ctx, 'vouchers'), entries = records(ctx, 'entries');
  for (const r of entries.filter(active)) {
    const parent = r.voucherId ? vouchers.find(v => same(v.id, r.voucherId)) : null;
    if (r.voucherId && (!parent || !active(parent) || !same(parent.workerId, r.workerId))) continue;
    const date = time(r.workDate ? r : parent || r), d = dims(r), unit = r.unit === 'SET' ? 'SET' : 'ATOMS';
    out.push(fact('reported', positive(r.reportedQty), unit, d, date));
    if (r.verifiedQty !== null && r.verifiedQty !== undefined && r.verifiedQty !== '') out.push(fact('verified', positive(r.verifiedQty), unit, d, date));
  }
  for (const r of vouchers.filter(active)) out.push(fact('kharcha', n(r.expenseAmount), 'PKR', dims(r), time(r)));
  for (const r of records(ctx, 'adjustments').filter(r => r.module === moduleId)) out.push(fact('kharcha', n(r.delta), 'PKR', dims(r), time(r, ['date'])));
  for (const r of records(ctx, 'expenses').filter(active)) out.push(fact('expenses', n(r.amount), 'PKR', dims(r), time(r, ['createdAt', 'date'])));
  for (const r of records(ctx, 'distributions')) out.push(fact('issued', n(r.qty), 'ATOMS', dims(r), time(r)));
  const pending = records(ctx, 'pending').filter(r => beforeEnd(time(r, ['date']), p)), ids = new Set(pending.map(r => String(r.workerId)));
  for (const id of ids) out.push(fact('pending', Math.max(0, pending.filter(r => same(r.workerId, id)).reduce((sum, r) => sum + (Number.isFinite(Number(r.delta)) ? Number(r.delta) : n(r.qty)), 0)), 'ATOMS', { worker: id }, null, true));
  return out.concat(generic({ data: { articles: ctx.data.articles, materials: ctx.data.materials } }, p, { sources: { articles: m.sources.articles, materials: m.sources.materials } }));
}
function shoe(ctx) {
  const out = [];
  for (const { record: r, parents } of ctx.data.purchases) out.push(fact('received', n(r.atoms ?? r.items), 'ATOMS', dims(r, parents), time(r)));
  for (const { record: r, parents } of ctx.data.payments) if (r.status !== 'Deleted') out.push(fact('paid', n(r.amount), 'ATOMS', { supplier: parents[0]?.id, article: parents[1]?.id }, time(r, ['date'])));
  for(const {record:r,parents}of ctx.data.accountPayments||[])if(active(r))out.push(fact('paidMoney',n(r.amount),'PKR',{supplier:parents[0]?.id},time(r,['date'])));
  for(const {record:r,parents}of ctx.data.extra||[])if(active(r))out.push(fact('extraBalance',n(r.amount),'PKR',{supplier:parents[0]?.id},time(r,['date'])));
  for (const { record: product, parents } of ctx.data.products) {
    const supplier = parents[0], d = { supplier: supplier?.id, article: product.id }, b = product.atomBalance || product.itemBalance;
    if (Object.hasOwn(product, 'stockItems') || Object.hasOwn(product, 'stockBoxes')) out.push(fact('stock', positive(product.stockItems ?? product.stockBoxes), 'ATOMS', d, null, true));
    if (!b || !supplier || !Array.isArray(supplier.purchases)) continue;
    const settled = new Set(list(b.settledPurchaseIds).map(String)), opening = positive(b.openingAtom ?? b.openingItem);
    const fresh = supplier.purchases.filter(r => same(r.productId, product.id) && !settled.has(String(r.id))).reduce((sum, r) => sum + positive(r.atoms ?? r.items), 0);
    out.push(fact('opening', opening, 'ATOMS', d, null, true), fact('new', fresh, 'ATOMS', d, null, true), fact('balance', Math.max(0, opening + fresh), 'ATOMS', d, null, true), fact('advance', positive(b.advanceAtom ?? b.advanceItem), 'ATOMS', d, null, true));
  }
  return out;
}
function gas(ctx, p) {
  const out = [], workers = records(ctx, 'workers'),supplierId=records(ctx,'suppliers')[0]?.id||'gasSupplier';
  for (const r of records(ctx, 'vouchers').filter(active)) {
    let id = r.workerRecordId;
    if (id == null || id === '') { const matches = workers.filter(w => key(w.name) === key(r.workerName)); id = matches.length === 1 ? matches[0].id : null; }
    out.push(fact('issued', n(r.qtyKg), 'KG', { worker:id||null,supplier:supplierId },time(r,['date'])));
  }
  for (const r of records(ctx, 'payments').filter(active)) out.push(fact('paid', n(r.amountKg),'KG',{supplier:supplierId}, time(r, ['date'])));
  const weeks = records(ctx, 'weeks'), w = p.cycle === 'previous' ? weeks[weeks.length - 2] : weeks[weeks.length - 1];
  if (w) {
    const supplier = records(ctx, 'suppliers')[0], d = { supplier: supplier?.id || 'gasSupplier', cycleId: w.weekId || w.weekKey };
    // Closed cycles keep their saved remaining; do not recalculate a paid cycle.
    const remaining = w.closedAt ? n(w.remainingKg) : Math.round((n(w.openingKg) + n(w.newGasKg) - n(w.payKg) + Number.EPSILON) * 100) / 100;
    for (const [metric, value] of [['opening', n(w.openingKg)], ['new', n(w.newGasKg)], ['balance', remaining], ['advance', n(w.advanceKg)]]) out.push(fact(metric, value, 'KG', d, null, true));
    if (supplier?.perKgPrice !== undefined) out.push(fact('balanceMoney', remaining * n(supplier.perKgPrice), 'PKR', d, null, true));
  }
  if (!ctx.missing.includes('extra')) out.push(fact('extraBalance', Math.max(0, Math.round(records(ctx, 'extra').reduce((sum, r) => sum + n(r.amount), 0) * 100) / 100), 'PKR',{supplier:supplierId},null,true));
  return out;
}
function magzi(ctx, p, m, moduleId, now) {
  const out = [], vouchers = records(ctx, 'vouchers'), payments = records(ctx, 'payments'), supplierId = records(ctx, 'suppliers')[0]?.id || 'magziBatavaSupplier';
  const quantities = new Map();
  for (const r of vouchers) {
    for (const l of list(r.lines)) {
      const d = { supplier: supplierId, article: l.productId }, date = time(r);
      if (r.workflowVersion === 1) {
        out.push(fact('issued', n(l.issuedQty), 'ATOMS', d, date));
        if (beforeEnd(workTime(r), p)) quantities.set(String(l.productId), (quantities.get(String(l.productId)) || 0) + n(l.openingPending) + n(l.issuedQty) - n(l.receivedQty));
      }
      if (active(r) && active(l)) out.push(fact('received', n(l.receivedQty), 'ATOMS', d, date));
    }
    if (r.workflowVersion === 1) out.push(fact('kharcha', n(r.kharcha), 'PKR', { supplier: supplierId }, time(r)));
  }
  for(const payment of payments.filter(r=>r.deleted!==true))out.push(fact('paid',n(payment.amount),'PKR',{supplier:supplierId,article:payment.productId},time(payment,['date'])));
  for (const [article, qty] of quantities) out.push(fact('pending', qty, 'ATOMS', { supplier: supplierId, article }, null, true));
  if (ctx.missing.some(k => ['opening', 'advance', 'vouchers', 'payments'].includes(k))) return out;
  const opening = ctx.data.opening[0]?.record || {}, advance = ctx.data.advance[0]?.record || {}, settlements = ctx.data.settlements[0]?.record || {};
  const today = dayKey(now), start = saturday(today), end = addDays(start, 6), ws = midnight(start).toISOString().slice(0, 10);
  // Preserve mb20ws/mb20we's legacy UTC-date slicing, including its +05 offset.
  const we = addDays(ws, 4), legacyToday = now.toISOString().slice(0, 10), dateOf = r => String(r.date || '').slice(0, 10);
  for (const product of records(ctx, 'articles')) {
    const id = String(product.id), d = { supplier: supplierId, article: id }, entry = settlements[id], settled = entry?.version === 1;
    const included = entry?.includedVouchers || {};
    let fresh = vouchers.filter(v => settled ? !Object.hasOwn(included, String(v.id)) : dateOf(v) >= start && dateOf(v) <= end).reduce((sum, v) => sum + list(v.lines).filter(l => same(l.productId, id)).reduce((a, l) => a + n(l.amount), 0), 0);
    const ps = payments.filter(r => same(r.productId, id));
    if (!settled) fresh = Math.max(0, fresh - ps.filter(r => dateOf(r) >= start && dateOf(r) <= end).reduce((sum, r) => sum + n(r.currentPaid), 0));
    const paid = ps.filter(r => r.deleted !== true && dateOf(r) >= start && dateOf(r) <= end).reduce((sum, r) => sum + n(r.amount), 0);
    const deduction = settled ? 0 : ps.filter(r => dateOf(r) >= ws && dateOf(r) <= we || dateOf(r) === legacyToday).reduce((sum, r) => sum + n(r.currentPaid), 0);
    const o = positive(opening[id]), adv = Math.max(0, n(advance[id]) - deduction);
    for (const [metric, value] of [['opening', o], ['new', fresh], ['balance', Math.max(0, o + fresh - adv)], ['advance', adv]]) out.push(fact(metric, value, 'PKR', d, null, true));
  }
  return out;
}
function shopkeepers(ctx) {
  const out = [], bills = records(ctx, 'bills');
  for (const b of bills) {
    const d = { supplier: b.shopkeeperId }, date = time(b, ['date']);
    out.push(fact('billed', n(b.total), 'PKR', d, date), fact('paid', n(b.paid), 'PKR', d, date));
    for (const l of list(b.lines)) out.push(fact('sold', n(l.qty), 'PAIRS', { ...d, article: l.articleId || l.articleName }, date));
  }
  for(const {record:r,parents}of ctx.data.ledger||[])if(r.type==='payment-in')out.push(fact('paid',n(r.amount),'PKR',{supplier:parents[0]?.id},time(r,['date'])));
  for (const s of records(ctx, 'shopkeepers')) {
    if(ctx.missing.includes('bills'))continue;
    let balance = n(s.openingBalance);
    for (const b of bills.filter(b => same(b.shopkeeperId, s.id))) balance += n(b.total) - n(b.paid);
    for (const r of list(s.ledger)) { if (r.type === 'payment-in') balance -= n(r.amount); else if (r.type === 'payment-out' || r.type === 'adjustment') balance += n(r.amount); }
    out.push(fact('balance', Math.round(balance * 100) / 100, 'PKR', { supplier: s.id }, null, true));
  }
  return out;
}
function lamination(ctx, p) {
  const out = [], pending = new Map();
  for (const r of records(ctx, 'vouchers').filter(active)) for (const l of list(r.lines)) {
    const d = { supplier: r.supplierId, article: l.typeId }, date = time(r);
    out.push(fact('issued', n(l.issued), 'ROLLS', d, date), fact('received', n(l.received), 'ROLLS', d, date));
    if (beforeEnd(date, p)) { const k = JSON.stringify([r.supplierId, l.typeId]); pending.set(k, (pending.get(k) || 0) + n(l.issued) - n(l.received)); }
  }
  for (const [k, value] of pending) { const [supplier, article] = JSON.parse(k); out.push(fact('pending', value, 'ROLLS', { supplier, article }, null, true)); }
  return out;
}
const ADAPTERS = { generic, upper, production, shoe, gas, magzi, shopkeepers, lamination, workers: () => [] };

function checkRegistry(registry) {
  for (const [id, m] of Object.entries(registry)) {
    if (!/^[a-z][a-z0-9_]*$/.test(id) || !ADAPTERS[m.adapter] || !obj(m.sources) || !Array.isArray(m.metrics)) throw new Error('INVALID_REGISTRY');
    for (const s of Object.values(m.sources)) if(!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(s.dataset)||sensitive(s.dataset)||s.path?.split('.').some(k=>sensitive(k)) || !obj(s.schema)) throw new Error('INVALID_REGISTRY');
  }
}
function moduleKey(input, registry) {
  if (Object.hasOwn(registry, input)) return input;
  const matches = Object.keys(registry).filter(id => registry[id].aliases.some(a => key(a) === key(input)));
  return matches.length === 1 ? matches[0] : null;
}
const ALLOWED_FIELDS = {
  catalog: ['action', 'module'], profile: ['action', 'fields'],
  search: ['action', 'module', 'modules', 'entity', 'query', 'match', 'offset','limit','includeArchived','category'],
  detail: ['action', 'entity', 'sections'],
  history: ['action', 'module', 'modules', 'entity', 'worker', 'supplier', 'article', 'material', 'recordTypes', 'period', 'sortBy','order','offset','limit','category','collections','includeDeleted'],
  summary: ['action', 'module', 'modules', 'worker', 'supplier', 'article', 'material', 'period', 'metrics', 'groupBy', 'orderBy', 'comparePeriods', 'offset','limit','cycle','category','collections','unit'],
};
function refValid(r) {
  return obj(r) && Object.keys(r).every(k => ['entity', 'module', 'id', 'name'].includes(k)) && ['worker', 'supplier', 'shopkeeper', 'article', 'material'].includes(r.entity) && ((typeof r.id === 'string' && r.id.length > 0 && r.id.length <= 200 && !Object.hasOwn(r, 'name')) || (typeof r.name === 'string' && r.name.trim() && r.name.length <= 200 && !Object.hasOwn(r, 'id'))) && (r.module === undefined || typeof r.module === 'string');
}
function periodValid(p) {
  if (!obj(p) || Object.keys(p).some(k => !['preset', 'from', 'to', 'days'].includes(k))) return false;
  const preset = p.preset || 'range';
  if (!['all', 'today', 'yesterday', 'this_month', 'current_week', 'previous_week', 'range', 'last_n_days'].includes(preset)) return false;
  if (preset === 'range') return validDay(p.from) && validDay(p.to) && p.from <= p.to && p.days === undefined;
  return p.from === undefined && p.to === undefined && (preset === 'last_n_days' ? Number.isInteger(p.days) && p.days >= 1 && p.days <= 3660 : p.days === undefined);
}
export function validateKnowledgeRequest(body, registry = MODULE_REGISTRY) {
  checkRegistry(registry);
  if (!obj(body) || !Object.hasOwn(ALLOWED_FIELDS, body.action) || Object.keys(body).some(k => !ALLOWED_FIELDS[body.action].includes(k))) return { error: 'INVALID_REQUEST' };
  const q = { ...body, offset: body.offset ?? 0, limit: body.limit ?? 50 };
  if (!Number.isSafeInteger(q.offset) || q.offset < 0 || !Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) return { error: 'INVALID_PAGINATION' };
  const ids = body.modules ?? (body.module === undefined ? [] : [body.module]);
  if (!Array.isArray(ids) || ids.length > 32 || ids.some(x => typeof x !== 'string' || !moduleKey(x, registry)) || (body.modules !== undefined && body.module !== undefined)) return { error: 'INVALID_MODULE' };
  q.modules = [...new Set(ids.map(x => moduleKey(x, registry)))];
  if (['summary', 'history'].includes(q.action) && !q.modules.length) return { error: 'MODULE_REQUIRED' };
  if (q.action === 'catalog' && q.modules.length > 1) return { error: 'INVALID_MODULE' };
  if (q.action === 'profile' && body.fields !== undefined && (!Array.isArray(body.fields) || !body.fields.length || body.fields.some(x => !['appName', 'ownerName', 'factoryName', 'address', 'phone'].includes(x)))) return { error: 'INVALID_FIELDS' };
  if (q.action === 'search' && (!['worker', 'supplier', 'shopkeeper', 'article', 'material'].includes(q.entity) || typeof q.query !== 'string' || q.query.length > 200 || (q.match !== undefined && !['exact', 'contains'].includes(q.match)) || (q.includeArchived !== undefined && typeof q.includeArchived !== 'boolean'))) return { error: 'INVALID_SEARCH' };
  for (const k of ['worker', 'supplier', 'article', 'material']) if (q[k] !== undefined && (!refValid(q[k]) || (q[k].entity!==k&&!(k==='supplier'&&q[k].entity==='shopkeeper')))) return { error: 'INVALID_IDENTITY' };
  if (q.entity !== undefined && q.action !== 'search' && !refValid(q.entity)) return { error: 'INVALID_IDENTITY' };
  if (q.action === 'detail' && !refValid(q.entity)) return { error: 'INVALID_IDENTITY' };
  if (q.sections !== undefined && (!Array.isArray(q.sections) || q.sections.some(x => !['identity', 'contacts', 'defaults', 'balances', 'relationshipCounts'].includes(x)))) return { error: 'INVALID_SECTIONS' };
  if (q.period !== undefined && !periodValid(q.period)) return { error: 'INVALID_PERIOD' };
  if(q.cycle!==undefined&&(!['current','previous'].includes(q.cycle)||q.modules.some(id=>registry[id].adapter!=='gas'))) return { error: 'INVALID_CYCLE' };
  if (q.recordTypes !== undefined && (!Array.isArray(q.recordTypes) || q.recordTypes.some(x => !q.modules.some(id => Object.values(registry[id].sources).some(s => s.recordType === x))))) return { error: 'INVALID_RECORD_TYPE' };
  if (q.sortBy !== undefined && q.sortBy !== 'date' || q.order !== undefined && !['asc', 'desc'].includes(q.order)) return { error: 'INVALID_SORT' };
  if(q.category!==undefined&&(typeof q.category!=='string'||!q.category.trim()||q.category.length>200||q.modules.some(id=>!registry[id].categoryFilter&&q.action!=='search')))return {error:'INVALID_CATEGORY'};
  if(q.unit!==undefined&&(typeof q.unit!=='string'||!q.unit.trim()||q.unit.length>60))return {error:'INVALID_UNIT'};
  if(q.includeDeleted!==undefined&&typeof q.includeDeleted!=='boolean')return {error:'INVALID_FILTER'};
  if(q.collections!==undefined&&(!Array.isArray(q.collections)||!q.collections.length||q.collections.some(c=>typeof c!=='string'||!q.modules.some(id=>Object.hasOwn(registry[id].sources,c)))))return {error:'INVALID_COLLECTION'};
  if (q.action === 'summary') {
    if (!Array.isArray(q.metrics) || !q.metrics.length || q.metrics.length > 12 || q.metrics.some(x => typeof x !== 'string' || !q.modules.some(id => registry[id].metrics.includes(x)))) return { error: 'INVALID_METRICS' };
    q.groupBy = q.groupBy || [];
    if (!Array.isArray(q.groupBy) || q.groupBy.some(x => !['worker', 'supplier', 'article', 'material', 'date'].includes(x)) || new Set(q.groupBy).size !== q.groupBy.length) return { error: 'INVALID_GROUP' };
    if (q.orderBy !== undefined && (!obj(q.orderBy) || Object.keys(q.orderBy).some(k => !['metric', 'direction'].includes(k)) || !q.metrics.includes(q.orderBy.metric) || !['asc', 'desc'].includes(q.orderBy.direction))) return { error: 'INVALID_SORT' };
    if (q.comparePeriods !== undefined && (!Array.isArray(q.comparePeriods) || q.comparePeriods.length < 2 || q.comparePeriods.length > 4 || q.comparePeriods.some(p => !periodValid(p)) || body.period !== undefined)) return { error: 'INVALID_COMPARISON' };
  }
  return { query: q };
}

export function requiredDatasets(q, registry = MODULE_REGISTRY) {
  if(q.action==='catalog')return ['workers','settings'];
  if (q.action === 'profile') return ['settings'];
  const ids = q.action === 'search' || q.action === 'detail' ? (q.modules.length ? q.modules : Object.keys(registry)) : q.modules;
  const needed = ids.flatMap(id => Object.values(registry[id].sources).map(s => s.dataset));
  if (q.action === 'summary' || q.action === 'detail') needed.push('workers', 'settings');
  return [...new Set(needed)];
}
function entities(state, registry, ids = Object.keys(registry)) {
  const out = [], seen = new Set();
  for (const moduleId of ids) {
    const m = registry[moduleId], ctx = loadModule(state, m);
    for (const [label, rows] of Object.entries(ctx.data)) if (m.sources[label].entity) for (const { record, parents } of rows) {
      const descriptor = m.sources[label], e = identityOf(moduleId, descriptor, record, parents);
      if (e.id === null && descriptor.entity === 'supplier' && ['gas', 'magzi'].includes(moduleId)) e.id = moduleId === 'gas' ? 'gasSupplier' : 'magziBatavaSupplier';
      if (e.id === null) continue;
      const canonicalModule = descriptor.entity === 'worker' ? 'workers' : moduleId;
      const signature = JSON.stringify([canonicalModule, e.entity, e.supplierId, e.id]);
      if (seen.has(signature)) continue; seen.add(signature);
      out.push({ ...e, module: canonicalModule, record });
    }
  }
  return out;
}
function resolveRef(ref, all, registry) {
  const moduleId = ref.module ? moduleKey(ref.module, registry) : null;
  if (ref.module && !moduleId) return { status: 'not_found', candidates: [] };
  let matches = all.filter(e => e.entity === ref.entity && (!moduleId || e.module === moduleId));
  if (ref.id !== undefined) matches = matches.filter(e => same(e.id, ref.id));
  else matches = matches.filter(e => ['name', 'code', 'articleNo', 'shopName', 'ownerName'].some(f => key(e.record[f]) === key(ref.name)) || registry[e.module].entityAliases.some(a => a.entity === e.entity && same(a.id, e.id) && key(a.alias) === key(ref.name)));
  return matches.length === 1 ? { status: 'found', value: matches[0] } : { status: matches.length ? 'ambiguous' : 'not_found', candidates: matches.map(({ record, ...e }) => e) };
}
const page = (rows, q) => ({ data: rows.slice(q.offset, q.offset + q.limit), pagination: { offset: q.offset, limit: q.limit, total: rows.length, hasMore: q.offset + q.limit < rows.length } });
function baqi(state, workerId) {
  const columns = list(state.settings?.customWorkerColumns).filter(c => key(c.label) === 'baqi');
  if (columns.length !== 1) return null;
  const worker = list(state.workers).find(w => same(w.id, workerId)), c = columns[0];
  let raw = worker?.customFields?.[c.id];
  if ((raw === undefined || raw === null || raw === '') && Object.hasOwn(worker?.customFields || {}, c.label)) raw = worker.customFields[c.label];
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;
  const number = Number(String(raw).replace(/,/g, '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(number) ? Math.max(0, number) : null;
}
export function executeKnowledge(q, state, registry = MODULE_REGISTRY, now = new Date()) {
  if(q.action==='catalog')return {supportedLanguages:['Urdu','Punjabi','Roman Urdu'],inputContract:'Structured actions; the existing n8n AI Agent maps text or transcribed voice to these parameters.',status: 'found', registryVersion: REGISTRY_VERSION, data: (q.modules.length ? q.modules : Object.keys(registry)).map(id => {
    const m = registry[id]; return { module: id, name: m.name, aliases: m.aliases, actions: m.actions, entities: [...new Set(Object.values(m.sources).map(s => s.entity).filter(Boolean))], metrics: m.metrics, groupBy: m.groupBy, weekBasis: m.week, timezone: 'Asia/Karachi', periods: ['all', 'today', 'yesterday', 'this_month', 'current_week', 'previous_week', 'range', 'last_n_days'], categoryFilter:m.categoryFilter,categories:m.categoryFilter?[...new Set([...list(state.workers).map(w=>w.category),...list(state.settings?.workerCategories)].filter(c=>typeof c==='string'&&c.trim()))]:[],collections:Object.entries(m.sources).map(([collection,s])=>({collection,dataset:s.dataset,path:s.path,recordType:s.recordType||null,entity:s.entity||null,approvedFields:s.schema,dateFields:s.dateFields,aggregations:s.aggregations||{}})),identityFields:m.identityFields,nameFields:m.nameFields,relationships:m.relationships||[],calculationRules:m.calculationRules,countCollections:m.countCollections||[],datePolicies:{flow:'date-filtered',stock:'current_only',balances:'current_only_except_explicit_gas_payment_cycle',pending:'cumulative_through_period_end',magziMoney:'settlement_ids_or_existing_week_date_prefix_rules'},ranking:{action:'summary',parameters:['groupBy','orderBy','unit'],requiresCompatibleUnits:true},comparison:{action:'summary',parameter:'comparePeriods'},calculations: { adapter: m.adapter, version: m.calculationRules?.version || 1, unitPolicy: 'separate_units' }, registryVersion: REGISTRY_VERSION };
  }) };
  if (q.action === 'profile') {
    const data = {}, staticValues = registry.factory.profile;
    for (const f of q.fields || ['appName', 'ownerName', 'factoryName', 'address', 'phone']) {
      const value = Object.hasOwn(staticValues, f) ? staticValues[f] : state.settings?.[f];
      data[f] = typeof value === 'string' && value.trim() ? { status: 'found', value, source: Object.hasOwn(staticValues, f) ? 'approved_static' : 'settings' } : { status: 'not_found' };
    }
    const statuses = Object.values(data).map(x => x.status);
    return { status: statuses.every(s => s === 'found') ? 'found' : statuses.every(s => s === 'not_found') ? 'not_found' : 'partial', data };
  }
  const all=entities(state,registry);
  if(q.category!==undefined&&!list(state.workers).some(w=>key(w.category)===key(q.category))&&!list(state.settings?.workerCategories).some(c=>key(c)===key(q.category)))return {status:'not_found',data:null,reason:'category_not_found'};
  if (q.action === 'search') {
    const exact = q.match !== 'contains';
    const matches = all.filter(e => e.entity === q.entity && (!q.modules.length || q.modules.includes(e.module)||e.entity==='worker'&&q.modules.some(id=>Object.values(registry[id].sources).some(s=>s.entity==='worker'))) && (q.includeArchived||(!e.record.archived&&active(e.record)))&&(!q.category||key(e.record.category)===key(q.category)) && ['name', 'code', 'articleNo', 'shopName', 'ownerName'].some(f => e.record[f] !== undefined && (exact ? key(e.record[f]) === key(q.query) : key(e.record[f]).includes(key(q.query))))).map(({ record, ...e }) => ({ ...e, ...project(record, identity) }));
    return { status: matches.length === 1 ? 'found' : matches.length ? 'ambiguous' : 'not_found', ...page(matches, q) };
  }
  const resolved = {};
  for (const k of ['entity', 'worker', 'supplier', 'article', 'material']) if (q[k]) {
    const result = resolveRef(q[k], all, registry); if (result.status !== 'found') return { status: result.status, candidates: result.candidates, data: null }; resolved[k] = result.value;
  }
  if (q.action === 'detail') {
    const e = resolved.entity, data = {}, sections = q.sections || ['identity', 'contacts', 'defaults', 'balances', 'relationshipCounts'];
    if (sections.includes('identity')) data.identity = { ...e.record, module: e.module, entity: e.entity };
    if (sections.includes('contacts')) data.contacts = Object.fromEntries(['phone', 'whatsapp', 'mobile', 'address', 'location'].map(f => [f, typeof e.record[f] === 'string' && e.record[f].trim() ? { status: 'found', value: e.record[f] } : { status: 'not_found' }]));
    if (sections.includes('defaults')) data.defaults = e.entity === 'worker' ? { status: 'found', data: ['upper', 'batam', 'finished'].map(module => {
      const ids = Array.isArray(e.record.defaultArticleLists?.[module]) ? [...new Set(e.record.defaultArticleLists[module].map(String))] : e.record.defaultArticleIds?.[module] ? [String(e.record.defaultArticleIds[module])] : null;
      return {module,defaultMaterial:module==='upper'&&e.record.upperDefaultMaterialId?{id:String(e.record.upperDefaultMaterialId),status:'found'}:{status:'not_found'}, status: ids === null ? 'not_found' : 'found', articles: ids?.map(id => { const a = all.find(a => a.module === module && a.entity === 'article' && same(a.id, id)); return a ? { id, name: a.name, status: 'found' } : { id, status: 'not_found' }; }) || [] };
    }) } : { status: 'not_found' };
    if (sections.includes('balances')) {
      data.balances = [];
      for (const moduleId of Object.keys(registry)) {
        const m = registry[moduleId], ctx = loadModule(state, m), p = resolvePeriod({ preset: 'all' }, m, now);
        const fs = ADAPTERS[m.adapter](ctx, p, m, moduleId, now);
        data.balances.push(...fs.filter(f => f.state && ['balance', 'pending', 'advance', 'opening'].includes(f.metric) && (e.entity === 'worker' ? same(f.worker, e.id) : e.module === moduleId && same(f[e.entity === 'shopkeeper' ? 'supplier' : e.entity], e.id))).map(f => ({ module: moduleId, ...f, asOf: 'current' })));
      }
      if (e.entity === 'worker') { const value = baqi(state, e.id); data.baqi = value === null ? { status: 'not_found' } : { status: 'found', value, unit: 'PKR' }; }
      if (!data.balances.length) data.balances = { status: 'not_found' };
    }
    if (sections.includes('relationshipCounts')) {
      data.relationshipCounts = [];
      for (const [moduleId, m] of Object.entries(registry)) {
        const ctx = loadModule(state, m);
        for (const [label, rows] of Object.entries(ctx.data)) if (m.sources[label].recordType) {
          const count = rows.filter(({ record: r, parents }) => active(r) && recordMatches(r, parents, e, moduleId, state)).length;
          data.relationshipCounts.push({ module: moduleId, recordType: m.sources[label].recordType, count, status: ctx.missing.includes(label) ? 'not_found' : 'found' });
        }
      }
    }
    return { status: 'found', data };
  }
  if (q.action === 'history') {
    const out = [], missing = [];
    for (const moduleId of q.modules) {
      const m = registry[moduleId], ctx = loadModule(state, m), p = resolvePeriod(q.period, m, now);
      for (const [label, rows] of Object.entries(ctx.data)) {
        const s = m.sources[label]; if(!s.recordType||q.collections&&!q.collections.includes(label)||q.recordTypes && !q.recordTypes.includes(s.recordType)) continue;
        if (ctx.missing.includes(label)) missing.push({ module: moduleId, collection: label });
        for (const { record: r, parents } of rows) if((q.includeDeleted||active(r))&&(!q.category||key(r.workerCategory||list(state.workers).find(w=>same(w.id,r.workerId))?.category)===key(q.category))&&inPeriod(time(r,s.dateFields),p) && Object.values(resolved).every(e => recordMatches(r, parents, e, moduleId, state))) out.push({ module: moduleId, recordType: s.recordType, date: time(r, s.dateFields)?.toISOString(), ...r,collection:label, ...(parents[0]?.id ? { parentId: parents[0].id } : {}), period: p });
      }
    }
    out.sort((a, b) => ((new Date(a.date) - new Date(b.date)) || String(a.id || '').localeCompare(String(b.id || ''))) * (q.order === 'asc' ? 1 : -1));
    return { status: missing.length ? (out.length ? 'partial' : 'not_found') : out.length ? 'found' : 'not_found', missing, ...page(out, q) };
  }
  const periods = q.comparePeriods || [q.period || { preset: 'all' }], out = [], missing = [];
  for (let periodIndex = 0; periodIndex < periods.length; periodIndex++) for (const moduleId of q.modules) {
    const m = registry[moduleId], ctx = loadModule(state, m), p = { ...resolvePeriod(periods[periodIndex], m, now), cycle:q.cycle||'current',category:q.category };
    let fs = ADAPTERS[m.adapter](ctx, p, m, moduleId, now);
    if (m.adapter === 'workers') fs = records(ctx, 'workers').flatMap(w => { const value = baqi(state, w.id); return value === null ? [] : [fact('baqi', value, 'PKR', { worker: w.id }, null, true)]; });
    for (const [label, rows] of Object.entries(ctx.data)) if((q.collections||m.countCollections||Object.keys(m.sources).filter(k=>m.sources[k].recordType)).includes(label)) for(const {record:r,parents}of rows.filter(x=>active(x.record)&&(!q.category||key(x.record.workerCategory||list(state.workers).find(w=>same(w.id,x.record.workerId))?.category)===key(q.category)))) fs.push(fact('count', 1, 'RECORDS', { ...dims(r, parents), ...(m.sources[label].entity ? { [m.sources[label].entity]: r.id } : {}) }, time(r, m.sources[label].dateFields), !!m.sources[label].entity));
    for (const metric of q.metrics) if (!m.metrics.includes(metric)) missing.push({ module: moduleId, metric, reason: 'unsupported_metric' });
    for(const collection of ctx.missing.filter(c=>(q.collections||metricCollections(m,q.metrics)).includes(c)))missing.push({module:moduleId,collection});
    const groups = new Map();
    const wanted = q.metrics.includes('netEarned') ? [...q.metrics, 'grossEarned', 'kharcha'] : q.metrics;
    for (const f of fs) {
      if(!wanted.includes(f.metric)||q.unit!==undefined&&f.unit!==q.unit||f.unit===null || !Number.isFinite(f.value)) continue;
      if (f.state && ['balance', 'opening', 'new', 'advance', 'stock', 'balanceMoney','extraBalance','paid','baqi','count'].includes(f.metric) && periods[periodIndex].preset !== 'all' && !(m.adapter==='gas'&&q.cycle)) { missing.push({ module: moduleId, metric: f.metric, reason: 'current_state_only' }); continue; }
      if (!f.state && !inPeriod(f.date ? new Date(f.date) : null, p)) continue;
      if (f.metric === 'pending' && m.adapter === 'upper' && (q.groupBy.includes('article') || resolved.article ? f.scope !== 'article' : f.scope === 'article')) continue;
      if (Object.entries(resolved).some(([type, e]) => !same(f[type], e.id) || ['article', 'material', 'supplier'].includes(type) && e.module !== moduleId)) continue;
      const dimensions = Object.fromEntries(q.groupBy.map(k => [k, k === 'date' ? (f.date ? dayKey(new Date(f.date)) : null) : f[k] ?? null]));
      if (q.groupBy.some(k => dimensions[k] === null)) continue;
      const signature=JSON.stringify([f.unit,f.unitBasis||null,f.state?'state':'flow',dimensions]);
      const row = groups.get(signature) || {module:moduleId,unit:f.unit,...(f.unitBasis?{unitBasis:f.unitBasis}:{}),dimensions,dimensionNames:Object.fromEntries(Object.entries(dimensions).filter(([type])=>type!=='date').map(([type,id])=>[type,all.find(e=>e.entity===(type==='supplier'&&moduleId==='shopkeepers'?'shopkeeper':type)&&same(e.id,id)&&(type==='worker'||e.module===moduleId))?.name||null])),metrics: {}, period: p, periodIndex, stateBasis: f.state ? (f.metric === 'pending' ? 'through_period_end' : 'current') : 'period_flows' };
      row.metrics[f.metric] = (row.metrics[f.metric] || 0) + f.value; groups.set(signature, row);
    }
    if (q.metrics.includes('netEarned') && m.adapter === 'upper') for (const row of groups.values()) if (row.unit === 'PKR') row.metrics.netEarned = (row.metrics.grossEarned || 0) - (row.metrics.kharcha || 0);
    for (const row of groups.values()) for (const metric of Object.keys(row.metrics)) if (!q.metrics.includes(metric)) delete row.metrics[metric];
    for (const metric of q.metrics) if (![...groups.values()].some(r => Object.hasOwn(r.metrics, metric))) missing.push({ module: moduleId, metric, reason: 'not_found' });
    out.push(...groups.values());
  }
  if (q.orderBy) {
    const eligible = out.filter(r => Object.hasOwn(r.metrics, q.orderBy.metric));
    if (new Set(eligible.map(r=>JSON.stringify([r.unit,r.unitBasis||null]))).size>1) return { status: 'not_found', error: 'INCOMPATIBLE_UNITS', data: [] };
    out.splice(0, out.length, ...eligible.sort((a, b) => (a.metrics[q.orderBy.metric] - b.metrics[q.orderBy.metric]) * (q.orderBy.direction === 'asc' ? 1 : -1) || JSON.stringify(a.dimensions).localeCompare(JSON.stringify(b.dimensions))));
  }
  return { status: missing.length ? (out.length ? 'partial' : 'not_found') : out.length ? 'found' : 'not_found', missing, ...page(out, q) };
}
function metricCollections(m,metrics){const deps={upper:{issued:['vouchers'],received:['vouchers'],grossEarned:['vouchers'],netEarned:['vouchers','adjustments'],kharcha:['vouchers','adjustments'],pending:['vouchers','pending'],stock:['articles','materials']},production:{reported:['entries'],verified:['entries'],issued:['distributions'],pending:['pending'],kharcha:['vouchers','adjustments'],expenses:['expenses'],stock:['articles','materials']},gas:{issued:['vouchers'],paid:['payments'],opening:['weeks'],new:['weeks'],balance:['weeks'],advance:['weeks'],balanceMoney:['weeks','suppliers'],extraBalance:['extra']},shoe:{received:['purchases'],stock:['products'],paid:['payments'],paidMoney:['accountPayments'],extraBalance:['extra'],opening:['products','purchases'],new:['products','purchases'],balance:['products','purchases'],advance:['products']},magzi:{issued:['vouchers'],received:['vouchers'],pending:['vouchers'],kharcha:['vouchers'],opening:['opening'],advance:['advance','payments'],new:['vouchers','payments'],paid:['payments'],balance:['opening','advance','vouchers','payments']},shopkeepers:{billed:['bills'],paid:['bills','ledger'],sold:['bills'],balance:['shopkeepers','bills']},lamination:{issued:['vouchers'],received:['vouchers'],pending:['vouchers']},workers:{baqi:['workers','columns']}};return [...new Set(metrics.flatMap(metric=>metric==='count'?(m.countCollections||[]):deps[m.adapter]?.[metric]||Object.keys(m.sources)))];}
function recordMatches(r, parents, e, moduleId, state) {
  if (e.entity === 'worker') {
    if (moduleId !== 'gas') return same(r.workerId, e.id);
    if (r.workerRecordId != null && r.workerRecordId !== '') return same(r.workerRecordId, e.id);
    const matches = list(state.workers).filter(w => key(w.name) === key(r.workerName)); return matches.length === 1 && same(matches[0].id, e.id);
  }
  if (e.module !== moduleId) return false;
  if (e.entity === 'supplier' || e.entity === 'shopkeeper') return same(r.supplierId || r.shopkeeperId || parents[0]?.id, e.id) || ['gas', 'magzi'].includes(moduleId);
  const field = e.entity === 'material' ? 'materialId' : 'articleId';
  return same(r[field] || r.productId || r.typeId, e.id) || [...list(r.lines), ...list(r.items), ...list(r.materials)].some(l => same(l[field] || l.productId || l.typeId, e.id));
}
