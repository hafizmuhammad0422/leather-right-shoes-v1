/* Optional Unicode name entry. No stored names or language preferences are rewritten. */
(() => {
  'use strict';
  const ids = new Set(['slroleWorkerName','supplierProfileName','upperArticleName','wName',
    'rollStockEntrySupplier','rollStockEntryMaterial','rollStockName','hlm-worker-name',
    'hlm-article-name','wfm_sssName','wfm_sspName','pressMeterMaterialName','upperMaterialName',
    'mName','aName','sbsName','sbpName','lmProfileName','sssName','sspName','gsName','gsOwner',
    'bmpaName','bmpmName','fmpaName','fmpmName','mb20ProductName','mb20ShopName','mb20OwnerName','fsGlobalArticleName','fs_sssName','fs_sspName','fsManualName','fsDeliveryShopName']);
  const attached = new WeakSet();
  const keys = {a:'ا',b:'ب',c:'چ',d:'د',e:'ع',f:'ف',g:'گ',h:'ہ',i:'ی',j:'ج',k:'ک',l:'ل',
    m:'م',n:'ن',o:'و',p:'پ',q:'ق',r:'ر',s:'س',t:'ت',u:'ء',v:'ط',w:'و',x:'ش',y:'ے',z:'ز',
    A:'آ',B:'ب',C:'ث',D:'ڈ',E:'ع',F:'ف',G:'غ',H:'ح',I:'ٰ',J:'ض',K:'خ',L:'ل',M:'ں',
    N:'ں',O:'ؤ',P:'پ',Q:'ق',R:'ڑ',S:'ص',T:'ٹ',U:'ئ',V:'ظ',W:'ؤ',X:'ژ',Y:'ئ',Z:'ذ'};
  window.factoryNameText = text => {
    const value = String(text??'');
    return value.trim() ? value : '';
  };
  window.factoryReadName = id => factoryNameText(document.getElementById(id)?.value);
  const style = document.createElement('style');
  style.textContent = '.factory-name-controls{display:flex;gap:5px;align-items:center;flex-wrap:wrap;margin:3px 0 7px;font-size:12px}.factory-name-controls button{font:inherit;padding:3px 7px;cursor:pointer}.factory-name-controls button[aria-pressed="true"]{font-weight:bold;outline:1px solid currentColor}.factory-name-keys{flex-basis:100%;display:flex;flex-wrap:wrap;gap:3px;direction:rtl}.factory-name-keys[hidden]{display:none}.factory-name-keys button{font:18px "Noto Naskh Arabic","Segoe UI",serif;min-width:30px}.factory-name-urdu{direction:rtl!important;text-align:right!important;font-family:"Noto Naskh Arabic","Segoe UI",Tahoma,serif!important}@media print{.factory-name-controls{display:none!important}}';
  document.head.appendChild(style);
  function attach(input) {
    if (attached.has(input) || !ids.has(input.id) || input.readOnly || input.disabled) return;
    attached.add(input);
    const controls = document.createElement('div');
    controls.className = 'factory-name-controls';
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label','Name input language');
    const english = document.createElement('button'), urdu = document.createElement('button');
    english.type = urdu.type = 'button';
    english.textContent = 'English'; urdu.textContent = 'اردو'; urdu.lang = 'ur';
    const keyboard = document.createElement('div'); keyboard.className = 'factory-name-keys';
    keyboard.setAttribute('aria-label','Urdu character keyboard');
    const hint = document.createElement('span');
    hint.textContent = 'Urdu: type with letter keys, use your Urdu keyboard, or select characters below.';
    let mode = /[\u0600-\u06ff]/.test(input.value) ? 'ur' : 'en';
    function insert(text) {
      input.focus();
      // Browser insertion retains normal input events and undo when supported.
      if (!document.execCommand('insertText',false,text)) {
        input.setRangeText(text,input.selectionStart??input.value.length,input.selectionEnd??input.value.length,'end');
        input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));
      }
    }
    for (const character of 'ا آ ب پ ت ٹ ث ج چ ح خ د ڈ ذ ر ڑ ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن ں و ؤ ہ ھ ء ی ئ ے ۓ َ ِ ُ ْ ّ'.split(' ')) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = character;
      button.setAttribute('aria-label','Insert '+character);
      button.addEventListener('mousedown',event=>event.preventDefault());
      button.addEventListener('click',()=>insert(character)); keyboard.appendChild(button);
    }
    function select(next,focus=true) {
      mode = next; input.classList.toggle('factory-name-urdu',mode==='ur');
      input.dir = mode==='ur'?'rtl':'ltr'; input.lang = mode;
      english.setAttribute('aria-pressed',String(mode==='en')); urdu.setAttribute('aria-pressed',String(mode==='ur'));
      keyboard.hidden = hint.hidden = mode!=='ur';
      if (focus) input.focus();
    }
    english.onclick = ()=>select('en'); urdu.onclick = ()=>select('ur');
    input.addEventListener('keydown',event=>{
      if (mode!=='ur'||event.isComposing||event.ctrlKey||event.metaKey||event.altKey||!keys[event.key]) return;
      event.preventDefault(); insert(keys[event.key]);
    });
    input.addEventListener('beforeinput',event=>{
      if (mode==='ur'&&!event.isComposing&&event.cancelable&&event.inputType==='insertText'&&keys[event.data]) {
        event.preventDefault(); insert(keys[event.data]);
      }
    });
    controls.append(english,urdu,hint,keyboard);
    const label = input.closest('label');
    (label||input).insertAdjacentElement('afterend',controls);
    select(mode,false);
  }
  function scan(root) {
    if (root.nodeType!==1) return;
    if (root.matches('input')) attach(root);
    root.querySelectorAll('input').forEach(attach);
  }
  const observer = new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(scan)));
  observer.observe(document.body,{childList:true,subtree:true});
  scan(document.body);
})();
