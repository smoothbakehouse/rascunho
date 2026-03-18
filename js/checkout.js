// ======================
// ALERTA SMOOTH COM OK (SEM ABRIR TECLADO)
// ======================
function smoothAlert(message, focusAfterOkEl = null){

  const alertEl = document.getElementById("smooth-alert");
  const textEl  = document.getElementById("smooth-alert-text");
  const okBtn   = document.getElementById("smooth-alert-ok");

  if(!alertEl || !textEl || !okBtn) return;

  // ✅ fecha teclado se algum input já estiver focado
  if (document.activeElement && typeof document.activeElement.blur === "function") {
    document.activeElement.blur();
  }

  textEl.textContent = message;
  alertEl.classList.add("show");

  // evita acumular múltiplos handlers
 okBtn.onclick = () => {
  alertEl.classList.remove("show");
  alertEl.classList.remove("is-store-closed");

  // ✅ só foca o campo DEPOIS do OK (aí sim abre teclado)
  if (focusAfterOkEl) {
    setTimeout(() => {
      focusAfterOkEl.focus();
    }, 50);
  }
};

  // fechar clicando fora da caixa (opcional)
 alertEl.onclick = (e) => {
  if(e.target === alertEl){
    alertEl.classList.remove("show");
    alertEl.classList.remove("is-store-closed");

    if (focusAfterOkEl) {
      setTimeout(() => {
        focusAfterOkEl.focus();
      }, 50);
    }
  }
};

  // ❌ NÃO usar okBtn.focus() (não precisa e pode causar efeitos estranhos em alguns webviews)
}
// ======================
// CONSOLE VISUAL MOBILE (DEBUG | TEMPORÁRIO)
// ======================
function log(msg){
  const el = document.createElement("div");
  el.style.position = "fixed";
  el.style.bottom = "0";
  el.style.left = "0";
  el.style.right = "0";
  el.style.background = "black";
  el.style.color = "lime";
  el.style.padding = "8px";
  el.style.zIndex = "99999";
  el.style.fontSize = "12px";
  el.textContent = msg;
  document.body.appendChild(el);
}


let miniCart, miniTotal, miniCount, mobileBtn;

// ======================
// ESTADO CENTRAL
// ======================
const cart = {};
const DELIVERY_FEE = 9.99;
let delivery = 0;
let freeShipping = false;      // cupom frete




// ======================
// HORÁRIO DA LOJA — AVISO INFORMATIVO
// Não bloqueia carrinho.
// Apenas avisa 1 vez por sessão quando a loja estiver fechada.
// ======================

// ⚠️ AJUSTE ESTES HORÁRIOS PARA O HORÁRIO REAL DA SMOOTH
// 0 = domingo | 1 = segunda | 2 = terça | 3 = quarta | 4 = quinta | 5 = sexta | 6 = sábado
const STORE_HOURS = {
  0: null, // domingo: fechado
  1: { start: "14:00", end: "21:00" },
  2: { start: "14:00", end: "21:00" },
  3: { start: "14:00", end: "21:00" },
  4: { start: "14:00", end: "21:00" },
  5: { start: "14:00", end: "21:00" },
  6: { start: "14:00", end: "21:00" }
};

const CLOSED_NOTICE_SESSION_KEY = "smooth_closed_notice_seen_v1";

function timeToMinutes(hhmm){
  const [h, m] = hhmm.split(":").map(Number);
  return (h * 60) + m;
}

function getTodayStoreSchedule(){
  const now = new Date();
  const day = now.getDay();
  return STORE_HOURS[day] || null;
}

function isStoreOpenNow(){

  /*--------------------------FORÇADO PARA TESTAR O TICKER ABERTO--------------------------------*/

    /*return true; // FORÇADO PARA TESTAR O TICKER ABERTO
}*/
  const schedule = getTodayStoreSchedule();

  // dia fechado
  if(!schedule) return false;

  const now = new Date();
  const currentMinutes = (now.getHours() * 60) + now.getMinutes();

  const startMinutes = timeToMinutes(schedule.start);
  const endMinutes   = timeToMinutes(schedule.end);

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function formatHourLabel(hhmm){
  return hhmm.replace(":", "h");
}


function getDayName(day){
  const names = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado"
  ];
  return names[day];
}

function getNextOpenDayInfo(){
  const now = new Date();
  const today = now.getDay();

  for(let i = 1; i <= 7; i++){
    const nextDay = (today + i) % 7;
    const schedule = STORE_HOURS[nextDay];

    if(schedule){
      return {
        day: nextDay,
        schedule,
        offset: i
      };
    }
  }

  return null;
}


function getStoreHoursMessage(){
  const now = new Date();
  
  const schedule = getTodayStoreSchedule();

  const intro = "No momento estamos fora do horário de atendimento. Você pode continuar navegando pelo cardápio e montar seu pedido à vontade.";

  // hoje não abre
  if(!schedule){
    const nextOpen = getNextOpenDayInfo();

    if(nextOpen){
      const nextStart = formatHourLabel(nextOpen.schedule.start);

      if(nextOpen.offset === 1){
        return `${intro} Retornaremos amanhã às ${nextStart}.`;
      }

      return `${intro} Retornaremos ${getDayName(nextOpen.day)} às ${nextStart}.`;
    }

    return `${intro} Em breve será um prazer atender você.`;
  }

  const currentMinutes = (now.getHours() * 60) + now.getMinutes();
  const startMinutes = timeToMinutes(schedule.start);
  const endMinutes = timeToMinutes(schedule.end);

  const startLabel = formatHourLabel(schedule.start);

  // antes de abrir hoje
  if(currentMinutes < startMinutes){
    return `${intro} Nosso atendimento hoje começa às ${startLabel}.`;
  }

  // depois de fechar hoje
  if(currentMinutes >= endMinutes){
    const nextOpen = getNextOpenDayInfo();

    if(nextOpen){
      const nextStart = formatHourLabel(nextOpen.schedule.start);

      if(nextOpen.offset === 1){
        return `${intro} Retornaremos amanhã às ${nextStart}.`;
      }

      return `${intro} Retornaremos ${getDayName(nextOpen.day)} às ${nextStart}.`;
    }

    return `${intro} Em breve será um prazer atender você.`;
  }

  return `${intro}`;
}

function showClosedStoreNoticeOnce(){

  // se estiver aberto, não faz nada
  if(isStoreOpenNow()) return;

  // evita repetir o alerta várias vezes na mesma sessão
  try{
    const alreadyShown = sessionStorage.getItem(CLOSED_NOTICE_SESSION_KEY);
    if(alreadyShown === "1") return;

    sessionStorage.setItem(CLOSED_NOTICE_SESSION_KEY, "1");
  }catch(e){}

  const alertEl = document.getElementById("smooth-alert");
  if (alertEl) {
    alertEl.classList.add("is-store-closed");
  }

  smoothAlert(getStoreHoursMessage());
}


// ======================
// PERSISTÊNCIA (CARRINHO + DADOS) — SESSIONSTORAGE
// ======================
const LS_KEYS = {
  cart: "smooth_cart_v1",
  /*ui:   "smooth_ui_v1",*/
  draft:"smooth_draft_v1"
};

function saveCartState(){
  try{
    sessionStorage.setItem(LS_KEYS.cart, JSON.stringify(cart));
  }catch(e){}
}

function loadCartState(){
  try{
    const raw = sessionStorage.getItem(LS_KEYS.cart);
    if(!raw) return;
    const data = JSON.parse(raw);

    // garante formato esperado
    if(!data || typeof data !== "object") return;

    // limpa e restaura mantendo a mesma referência do objeto cart
    Object.keys(cart).forEach(k => delete cart[k]);

    for(const k in data){
      const item = data[k];
      if(!item) continue;

      const price = Number(item.price);
      const qty   = Number(item.qty);

      if(Number.isFinite(price) && Number.isFinite(qty) && qty > 0){
        cart[k] = { price, qty };
      }
    }
  }catch(e){}
}

function saveFormDraft(){
  try{
    const payload = {
      name:   document.getElementById("clientName")?.value || "",
      phone:  document.getElementById("clientPhone")?.value || "",
      notes:  document.getElementById("notes")?.value || "",
      address:document.getElementById("address")?.value || "",
      changeValue: document.getElementById("changeValue")?.value || ""
    };
    sessionStorage.setItem(LS_KEYS.draft, JSON.stringify(payload));
  }catch(e){}
}

function loadFormDraft(){
  try{
    const raw = sessionStorage.getItem(LS_KEYS.draft);
    if(!raw) return;
    const d = JSON.parse(raw);
    if(!d || typeof d !== "object") return;

    const nameEl  = document.getElementById("clientName");
    const phoneEl = document.getElementById("clientPhone");
    const notesEl = document.getElementById("notes");
    const addrEl  = document.getElementById("address");
    const chgEl   = document.getElementById("changeValue");

    if(nameEl  && typeof d.name === "string") nameEl.value = d.name;
    if(phoneEl && typeof d.phone === "string") phoneEl.value = d.phone;
    if(notesEl && typeof d.notes === "string") notesEl.value = d.notes;
    if(addrEl  && typeof d.address === "string") addrEl.value = d.address;
    if(chgEl   && typeof d.changeValue === "string") chgEl.value = d.changeValue;
  }catch(e){}
}

// Atualiza os números visuais dos cards (qty) com base no cart atual
function syncAllCardQtyFromCart(){
  document.querySelectorAll(".cookie-card").forEach(card => {
    const qtyEl = card.querySelector(".qty");
    if(!qtyEl) return;

    const baseName = card.dataset.baseName;

    // card com variação (usa radio selecionado)
    if(baseName){
      const selected = card.querySelector('input[type="radio"]:checked');
      if(!selected){
        qtyEl.textContent = "0";
        return;
      }
      const weight = selected.value;
      const key = `${baseName} — ${weight}g`;
      qtyEl.textContent = String(cart[key]?.qty || 0);
      return;
    }

    // card simples (se existir data-name)
    const simpleName = card.dataset.name;
    if(simpleName){
      qtyEl.textContent = String(cart[simpleName]?.qty || 0);
    }
  });
}


// ==================================================
// CUPOM ÚNICO (FRETE + DESCONTO) — ESTADO E REGRAS
// ==================================================
// O que este bloco faz:
// 1) Define o cupom aplicado (apenas 1 por vez)
// 2) Define quais cupons existem e quais benefícios cada um dá
// 3) Calcula o desconto nos produtos (percentual)
// ==================================================

let appliedCoupon = null; 
// formato: { code: 'SMOOTH10', freeship: true, percentOff: 10 }

const COUPONS = [
  // =========================================
  // CUPONS: FRETE GRÁTIS + 10% OFF
  // =========================================
  { code: 'SMOOTH10', freeship: true, percentOff: 10 },
  { code: 'GUI10',    freeship: true, percentOff: 10 },
  { code: 'SOFIA10',  freeship: true, percentOff: 10 },
  { code: 'DRY10',    freeship: true, percentOff: 10 },
  { code: 'DEYG10',   freeship: true, percentOff: 10 },
  { code: 'CAROL10',  freeship: true, percentOff: 10 },
  { code: 'MAITE10',  freeship: true, percentOff: 10 },

// =========================================
  // CUPOM: APENAS DESCONTO NOS PRODUTOS
  // =========================================
  { code: 'MARÇO10', freeship: false, percentOff: 10 },

  // =========================================
  // CUPONS: APENAS FRETE GRÁTIS
  // =========================================
  { code: '0800', freeship: true, percentOff: 0 },
  // exemplos extras:
  // { code: 'ENTREGA',  freeship: true, percentOff: 0 },
  // { code: 'VIPFRETE', freeship: true, percentOff: 0 },

];

function calcDiscount(subtotal){
  if(!appliedCoupon) return 0;

  const pct = appliedCoupon.percentOff || 0;
  let d = subtotal * (pct / 100);

  // nunca passa do subtotal
  d = Math.max(0, Math.min(d, subtotal));
  return d;
}

// ==================================================
// DESCONTO DO FRETE — QUANTO FOI “ABATIDO”
// ==================================================
// Regras:
// - Só existe desconto de frete quando: delivery > 0 e freeShipping = true
// - Se for retirada (delivery = 0), desconto de frete é 0
function calcShippingDiscount(){
  if (!freeShipping) return 0;
  if (delivery <= 0) return 0;
  return delivery; // ex: 9.99
}

// ======================
// ELEMENTOS
// ======================


const mobileTotal= document.getElementById('mobileTotal');

const cartList   = document.getElementById('cartList');
const subtotalEl = document.getElementById('subtotal');
const deliveryEl = document.getElementById('delivery');
const totalEl    = document.getElementById('total');

const nameEl     = document.getElementById('clientName');
const phoneEl    = document.getElementById('clientPhone');
const notesEl    = document.getElementById('notes');
const addressEl  = document.getElementById('address');

const addressBlock = document.getElementById('addressBlock');
const pickupBlock  = document.getElementById('pickupBlock');

const changeBlock  = document.getElementById('changeBlock');
const changeValue  = document.getElementById('changeValue');
const clearBtn = document.getElementById("clearCart");


// ======================
// SCROLL PARA CHECKOUT — FIX REAL MOBILE (BIND CORRETO)
// ======================
document.addEventListener("DOMContentLoaded", () => {

  // ✅ pega elementos primeiro
  miniCart   = document.getElementById('miniCart');
  miniTotal  = document.getElementById('miniTotal');
  miniCount  = document.getElementById('miniCount');
  mobileBtn  = document.getElementById('mobileBtn');

  // ✅ restaura carrinho + dados após reload/update
  loadCartState();
  loadFormDraft();
  syncAllCardQtyFromCart();

  // ✅ agora a UI já conhece os elementos
  updateUI();

  const checkoutEl = document.getElementById('checkout');
  const miniScroll = document.getElementById('miniScroll');

 function scrollToCheckout(){
  if(!checkoutEl) return;

  const scrollRoot = document.scrollingElement || document.documentElement || document.body;
  const offset = window.innerWidth <= 768 ? 45 : 60;

  const targetY = Math.max(
    0,
    checkoutEl.getBoundingClientRect().top + scrollRoot.scrollTop - offset
  );

  scrollRoot.scrollTop = targetY;
  window.scrollTo(0, targetY);
}

function bindScrollButton(btn){
  if(!btn) return;

  btn.addEventListener('click', () => {
    scrollToCheckout();
  });
}

  bindScrollButton(miniScroll);
  bindScrollButton(mobileBtn);

});

// ======================
// ESTADO INICIAL FORÇADO (ANTI-BUG)
// ======================
if (changeBlock) {
  changeBlock.classList.add('sc-hidden');
}

if (changeValue) {
  changeValue.classList.add('sc-hidden');
  changeValue.value = '';
}


const couponBlock  = document.getElementById('couponBlock');

const finishBtn = document.getElementById('finishBtn');



// ======================
// OBSERVER — ESCONDE MINI CARTS AO CHEGAR NO CHECKOUT
// ======================

const sentinel = document.getElementById('checkout-sentinel');

if (sentinel) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      const hide = entry.isIntersecting;

if (miniCart) {
  miniCart.style.opacity = hide ? '0' : '1';
  miniCart.style.pointerEvents = hide ? 'none' : 'auto';
  miniCart.style.visibility = hide ? 'hidden' : 'visible';
}

if (mobileBtn) {
  mobileBtn.style.display = hide ? 'none' : 'flex';
}
    },
    {
      root: null,
      threshold: 0,
      rootMargin: '0px'
    }
  );

  observer.observe(sentinel);
}




// ======================
// HELPERS
// ======================
const money = v => `R$ ${v.toFixed(2).replace('.',',')}`;
const hasItems = () => Object.values(cart).reduce((a,i)=>a+i.qty,0) > 0;

// ======================
// UI UPDATE
// ======================
function updateUI(){
  let subtotal = 0;
  let items = 0;

const productsDiscountLine = document.getElementById('productsDiscountLine');
const productsDiscountEl   = document.getElementById('productsDiscount');

const shippingDiscountLine = document.getElementById('shippingDiscountLine');
const shippingDiscountEl   = document.getElementById('shippingDiscount');


  cartList.innerHTML = '';

 for(const name in cart){
  subtotal += cart[name].price * cart[name].qty;
  items += cart[name].qty;

  const li = document.createElement('li');
  li.className = 'cart-item';

  li.innerHTML = `
  <div class="cart-item-row">
    <div class="cart-item-text">
      <span class="cart-item-name">${name}</span>
      <span class="cart-item-meta">${cart[name].qty}x — ${money(cart[name].price)} (un)</span>
    </div>

    <button class="cart-mini-btn minus" type="button" data-cart-action="minus" data-cart-name="${name}">
      −
    </button>

    <button class="cart-mini-btn plus" type="button" data-cart-action="plus" data-cart-name="${name}">
      +
    </button>
  </div>
`;

  cartList.appendChild(li);
}



cartList.querySelectorAll('[data-cart-action]').forEach(btn => {

  let pressTimer = null;
  let isTouchPress = false;

  const addPress = () => {
    btn.classList.add('is-pressed');
  };

  const removePress = () => {
    btn.classList.remove('is-pressed');
  };

  btn.addEventListener('touchstart', () => {
    isTouchPress = true;
    addPress();
  }, { passive: true });

  btn.addEventListener('touchend', () => {
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      removePress();
      isTouchPress = false;
    }, 90);
  });

  btn.addEventListener('touchcancel', () => {
    clearTimeout(pressTimer);
    removePress();
    isTouchPress = false;
  });

  btn.addEventListener('mousedown', addPress);
  btn.addEventListener('mouseup', removePress);
  btn.addEventListener('mouseleave', removePress);

  btn.onclick = () => {
    const action = btn.dataset.cartAction;
    const name = btn.dataset.cartName;

    if (!name || !cart[name]) return;

    if (action === 'plus') {
      cart[name].qty++;
    }

    if (action === 'minus') {
      cart[name].qty--;
      if (cart[name].qty <= 0) {
        delete cart[name];
      }
    }

    syncAllCardQtyFromCart();

    const clickedAction = action;
    const clickedName = name;

    const finishUpdate = () => {
      updateUI();

      const recreatedBtn = cartList.querySelector(
        `[data-cart-action="${clickedAction}"][data-cart-name="${clickedName}"]`
      );

      if (recreatedBtn) {
        recreatedBtn.classList.add('is-pressed');

        setTimeout(() => {
          recreatedBtn.classList.remove('is-pressed');
        }, 80);
      }
    };

    if (isTouchPress) {
      setTimeout(finishUpdate, 70);
    } else {
      finishUpdate();
    }
  };
});



  // cupom pode zerar o frete
const deliveryValue = freeShipping ? 0 : delivery;

// cupom pode dar % off nos produtos
const discount = calcDiscount(subtotal);

subtotalEl.textContent = money(subtotal);

// ==================================================
// PRODUTOS (RESUMO FINAL)
// ==================================================
const productsValueEl = document.getElementById('productsValue');
if (productsValueEl) {
  productsValueEl.textContent = money(subtotal);
}
totalEl.textContent = money((subtotal - discount) + deliveryValue);

// ==================================================
// MOSTRAR DESCONTOS NO CHECKOUT (SÓ COM CUPOM APLICADO)
// ==================================================
const couponApplied = !!appliedCoupon;

// desconto nos produtos
if (productsDiscountLine && productsDiscountEl) {
  if (couponApplied && discount > 0) {
    productsDiscountEl.textContent = `-${money(discount)}`;
    productsDiscountLine.classList.remove('sc-hidden');
  } else {
    productsDiscountLine.classList.add('sc-hidden');
  }
}

// calcula 1 vez e reutiliza
const shipDiscount = calcShippingDiscount();

// desconto no frete
if (shippingDiscountLine && shippingDiscountEl) {
  if (couponApplied && shipDiscount > 0) {
    shippingDiscountEl.textContent = `-${money(shipDiscount)}`;
    shippingDiscountLine.classList.remove('sc-hidden');
  } else {
    shippingDiscountLine.classList.add('sc-hidden');
  }
}

// ==================================================
// ECONOMIA TOTAL (PRODUTOS + FRETE)
// ==================================================
const totalSavingsLine = document.getElementById('totalSavingsLine');
const totalSavingsEl   = document.getElementById('totalSavings');

if (totalSavingsLine && totalSavingsEl) {
  const totalSavings = discount + shipDiscount;

  if (couponApplied && totalSavings > 0) {
    totalSavingsEl.textContent = money(totalSavings);
    totalSavingsLine.classList.remove('sc-hidden');
  } else {
    totalSavingsLine.classList.add('sc-hidden');
  }
}

const deliveryLine = document.getElementById('deliveryLine');

const productsLine = document.getElementById('productsLine');

// ==================================================
// TAXA DE ENTREGA — MOSTRAR NORMALMENTE
// esconder somente quando for FRETE GRÁTIS
// ==================================================
if (delivery > 0 && !freeShipping) {
  deliveryEl.textContent = money(delivery);
  deliveryLine.classList.remove('sc-hidden');
} else {
  deliveryLine.classList.add('sc-hidden');
}


if (miniTotal)  miniTotal.textContent = totalEl.textContent;
if (miniCount)  miniCount.textContent = `${items} selecionado(s)`;
if (mobileTotal) mobileTotal.textContent = totalEl.textContent;

const show = items > 0;
if (miniCart)  miniCart.style.display = show ? 'block' : 'none';

/* mobileBtn precisa ser flex pra manter alinhamento */
if (mobileBtn) mobileBtn.style.display = show ? 'flex' : 'none';


// mostrar / esconder botão "Limpar itens" (via classe)
if (clearBtn) {
  clearBtn.classList.toggle("is-hidden", !hasItems());
}


  // ✅ salva estado do carrinho e rascunho do cliente
  saveCartState();
  saveFormDraft();


  validate();
}



// ======================
// PRODUTOS (+ / -) — UNIFICADO
// ======================
document.querySelectorAll('.cookie-card').forEach(card => {

  const plusBtn = card.querySelector('.plus');
  const minusBtn = card.querySelector('.minus');
  const qtyEl = card.querySelector('.qty');

  const baseName = card.dataset.baseName;
  const simpleName = card.dataset.name;
  const simplePrice = +card.dataset.price;

  function getItemData(){

    // card com variação
    if(baseName){
      const selected = card.querySelector('input[type="radio"]:checked');
      if(!selected) return null;

      const weight = selected.value;
      const price = +selected.dataset.price;

      return {
        name: `${baseName} — ${weight}g`,
        price
      };
    }

    // card simples
    return {
      name: simpleName,
      price: simplePrice
    };
  }

  function updateCardQty(){

    // apenas cards com variação precisam sincronizar
    if(!baseName) return;

    const selected = card.querySelector('input[type="radio"]:checked');
    if(!selected) return;

    const weight = selected.value;
    const key = `${baseName} — ${weight}g`;

    qtyEl.textContent = cart[key]?.qty || 0;
  }

  plusBtn.onclick = () => {
  const item = getItemData();
  if(!item) return;

  // avisa apenas 1 vez por sessão se a loja estiver fechada
  showClosedStoreNoticeOnce();

  cart[item.name] = cart[item.name] || { price: item.price, qty: 0 };
  cart[item.name].qty++;

  if(baseName){
    updateCardQty();
  } else {
    qtyEl.textContent = cart[item.name].qty;
  }

  updateUI();
};


  minusBtn.onclick = () => {
    const item = getItemData();
    if(!item || !cart[item.name]) return;

    cart[item.name].qty--;

    if(cart[item.name].qty <= 0){
      delete cart[item.name];
    }

    if(baseName){
      updateCardQty();
    } else {
      qtyEl.textContent = cart[item.name]?.qty || 0;
    }

    updateUI();
  };

  // atualizar contador ao trocar peso
  if(baseName){
    card.querySelectorAll('input[type="radio"]').forEach(r => {
      r.addEventListener('change', updateCardQty);
    });

    updateCardQty();
  }

});


// ======================
// PREÇO DINÂMICO — VARIANT CARD
// ======================

document.querySelectorAll('.variant-card').forEach(card => {

  const radios = card.querySelectorAll('input[type="radio"]');
  const priceEl = card.querySelector('.price-line .value');
  const infoEl = card.querySelector('.dynamic-price .info-produto');

  function updatePrice(){
    const selected = card.querySelector('input[type="radio"]:checked');
    if(!selected) return;

    const price = +selected.dataset.price;
    const weight = selected.value;

    const [int, cents] = price.toFixed(2).split('.');

    priceEl.innerHTML = `${int},<span class="cents">${cents}</span>`;
    infoEl.textContent = `unidade • ${weight}g`;
  }

  radios.forEach(r => r.addEventListener('change', updatePrice));

  updatePrice(); // inicializa
});


// ======================
// PREÇO DINÂMICO — CARDS COM VARIAÇÃO
// ======================
document.querySelectorAll('.cookie-card[data-base-name]').forEach(card => {

  const radios = card.querySelectorAll('input[type="radio"]');
  const priceEl = card.querySelector('.price-line .value');
  const infoEl = card.querySelector('.price-block .info-produto');

  function updatePrice(){
    const selected = card.querySelector('input[type="radio"]:checked');
    if(!selected) return;

    const price = +selected.dataset.price;
    const weight = selected.value;

    const [int, cents] = price.toFixed(2).split('.');

    priceEl.innerHTML = `${int},<span class="cents">${cents}</span>`;
    infoEl.textContent = `unidade • ${weight}g`;
  }

  radios.forEach(r => r.addEventListener('change', updatePrice));

  updatePrice(); // inicia já correto
});


// ======================
// RECEBIMENTO
// ======================
document.querySelectorAll('input[name="receive"]').forEach(r=>{
  r.onchange = ()=>{
    deliveryClicks = 0;               // 🔁 reset gesto secreto
    couponBlock.classList.add('sc-hidden');

    if(r.value === 'entrega'){
      delivery = DELIVERY_FEE;
      addressBlock.classList.remove('sc-hidden');
      pickupBlock.classList.add('sc-hidden');
    }else{
      delivery = 0;
      addressBlock.classList.add('sc-hidden');
      pickupBlock.classList.remove('sc-hidden');
      freeShipping = false;
      appliedCoupon = null; // ✅ remove desconto também ao sair de entrega

      // 🔁 reset UI do cupom ao sair de Entrega
      const couponInput = document.getElementById('coupon');
const couponBtn   = document.getElementById('applyCoupon');

if (couponInput) {
  couponInput.disabled = false;
  couponInput.value = '';
}
if (couponBtn) {
  couponBtn.disabled = false;
  couponBtn.textContent = 'Aplicar';
  couponBtn.classList.remove('is-applied');
}
    }

    updateUI();
  };
});

// ======================
// CUPOM FRETE — GESTO SECRETO
// 6 cliques em "Entrega (+R$9,99)"
// ======================

let deliveryClicks = 0;

document.querySelectorAll('input[name="receive"]').forEach(r=>{
  r.addEventListener('click', ()=>{
    // só conta clique se for entrega
    if(r.value !== 'entrega') return;

    // só conta se entrega estiver selecionada
    if(!r.checked) return;

    deliveryClicks++;

    if(deliveryClicks === 6){
      couponBlock.classList.remove('sc-hidden');
    }
  });
});

// ======================
// PAGAMENTO / TROCO — VISIBILIDADE FINAL
// ======================
document.querySelectorAll('input[name="payment"]').forEach(r=>{
  r.onchange = ()=>{
    if (r.value === 'Dinheiro') {

      // mostra a pergunta
      changeBlock.classList.remove('sc-hidden');

      // campo começa SEMPRE escondido
      changeValue.classList.add('sc-hidden');
      changeValue.value = '';

      // limpa Sim / Não
      document
        .querySelectorAll('input[name="change"]')
        .forEach(c => c.checked = false);

    } else {
      // se não for dinheiro, some tudo
      changeBlock.classList.add('sc-hidden');
      changeValue.classList.add('sc-hidden');
      changeValue.value = '';

      document
        .querySelectorAll('input[name="change"]')
        .forEach(c => c.checked = false);
    }

    validate();
  };
});




// ======================
// SIM / NÃO — TROCO
// ======================
document.querySelectorAll('input[name="change"]').forEach(r=>{
  r.onchange = ()=>{
    if (r.value === 'sim') {
      changeValue.classList.remove('sc-hidden');
    } else {
      changeValue.classList.add('sc-hidden');
      changeValue.value = '';
    }

    validate();
  };
});



// ==================================================
// CUPOM — APLICAR (ÚNICO: FRETE + 10% NOS PRODUTOS)
// ==================================================
document.getElementById('applyCoupon')?.addEventListener('click', () => {
  const input = document.getElementById('coupon');
  const btn   = document.getElementById('applyCoupon');
  const code  = input.value.trim().toUpperCase();

  if (!code) {
    smoothAlert('Digite um cupom antes de aplicar.');
    return;
  }

  // ✅ já existe cupom aplicado
  if (appliedCoupon) {
    smoothAlert('Já existe um cupom aplicado.');
    return;
  }

  const found = COUPONS.find(c => c.code === code);

  if (!found) {
    smoothAlert('Cupom inválido.');
    return;
  }

  // ✅ aplica cupom e benefícios
  appliedCoupon = found;
  freeShipping = !!found.freeship;

  updateUI();

  // ✅ UI trava igual hoje
  if (btn) {
    btn.textContent = 'Aplicado ✓';
    btn.disabled = true;
    btn.classList.add('is-applied');
  }
  if (input) input.disabled = true;

  // ✅ mensagem mais profissional
  if (found.freeship && (found.percentOff || 0) > 0) {
  smoothAlert('Cupom aplicado: entrega grátis + 10% de desconto.');
} else if (found.freeship) {
  smoothAlert('Cupom aplicado: entrega grátis.');
} else {
  smoothAlert('Cupom aplicado: desconto nos produtos.');
}
});


// ==================================================
// CUPOM — AO EDITAR O CAMPO, DESAPLICA TUDO
// ==================================================
document.getElementById('coupon')?.addEventListener('input', () => {
  const input = document.getElementById('coupon');
  const btn   = document.getElementById('applyCoupon');

  // libera input (caso estivesse travado)
  if (input && input.disabled) {
    input.disabled = false;
  }

  // libera botão
  if (btn && btn.disabled) {
    btn.disabled = false;
    btn.textContent = 'Aplicar';
    btn.classList.remove('is-applied');
  }

  // ✅ remove cupom aplicado e benefícios
  if (appliedCoupon || freeShipping) {
    appliedCoupon = null;
    freeShipping = false;
    updateUI();
  }
});

// ======================
// VALIDAÇÃO + BOTÃO MUTE
// ======================
function validate(){
  let ok = true;

  if(!hasItems()) ok=false;
  if(!nameEl.value.trim()) ok=false;
  if(!phoneEl.value.trim()) ok=false;

  const receive = document.querySelector('input[name="receive"]:checked');


// ==================================================
// MOSTRAR "PRODUTOS" SOMENTE QUANDO FOR ENTREGA
// ==================================================
const productsLine = document.getElementById('productsLine');

if (productsLine) {

  const isEntrega = (receive && receive.value === 'entrega');

  if (isEntrega) {
    productsLine.classList.remove('sc-hidden');
  } else {
    productsLine.classList.add('sc-hidden');
  }

}

  
  if(!receive) ok=false;

  if(receive?.value==='entrega' && !addressEl.value.trim()) ok=false;

  const pay = document.querySelector('input[name="payment"]:checked');
if(!pay) ok = false;

/* REGRA DINHEIRO + TROCO — CORRETA */
if (pay && pay.value === 'Dinheiro') {

  // se o bloco de troco ainda está escondido → inválido
  if (changeBlock.classList.contains('sc-hidden')) {
    ok = false;
  } else {
    const ch = document.querySelector('input[name="change"]:checked');

    // não escolheu Sim ou Não
    if (!ch) ok = false;

    // escolheu Sim, mas não informou valor
    if (ch && ch.value === 'sim' && !changeValue.value.trim()) {
      ok = false;
    }
  }
}


  finishBtn.classList.toggle('sc-muted', !ok);
  return ok;
}

[nameEl,phoneEl,notesEl,addressEl,changeValue].forEach(el=>{
  el?.addEventListener('input',validate);
});



// ======================
// Alertas novo
// ======================


finishBtn.onclick = ()=>{

  if(!hasItems()){
    smoothAlert('Adicione pelo menos um cookie ao pedido.');
    return;
  }

  if(!nameEl.value.trim()){
    smoothAlert('Informe seu nome.', nameEl);
return;
  }

  if(!phoneEl.value.trim()){
    smoothAlert('Informe seu WhatsApp.', phoneEl);
return;
  }

  const receive = document.querySelector('input[name="receive"]:checked');
  if(!receive){
    smoothAlert('Escolha entrega ou retirada.');
    return;
  }

  if(receive.value === 'entrega' && !addressEl.value.trim()){
    smoothAlert('Informe o endereço para entrega.', addressEl);
return;
  }

  const pay = document.querySelector('input[name="payment"]:checked');
  if(!pay){
    smoothAlert('Escolha a forma de pagamento.');
    return;
  }

  if(pay.value === 'Dinheiro'){
    const ch = document.querySelector('input[name="change"]:checked');
    if(!ch){
      smoothAlert('Informe se precisa de troco.');
      return;
    }
    if(ch.value === 'sim' && !changeValue.value.trim()){
      smoothAlert('Informe o valor para o troco.', changeValue);
return;
    }
  }

// ======================
// MONTA MENSAGEM WHATSAPP — FINAL
// ======================

let msg = '*Pedido Smooth*\n\n';

msg += `Cliente: ${nameEl.value}\n`;
msg += `WhatsApp: ${phoneEl.value}\n\n`;

msg += 'Cookies selecionados:\n';

let subtotal = 0;

for (const n in cart) {
  const qty = cart[n].qty;
  const price = cart[n].price;
  subtotal += qty * price;

  msg += `${qty}x ${n} — ${money(price)} (un)\n`;
}

// ==================================================
// RESUMO — SUBTOTAL / DESCONTOS / FRETE / TOTAL
// ==================================================

msg += `Subtotal dos produtos: ${money(subtotal)}\n`;

// ✅ desconto nos produtos (ex: 10%)
const discountProducts = calcDiscount(subtotal);
if (discountProducts > 0) {
  msg += `Desconto nos produtos: -${money(discountProducts)}\n`;
}

const deliveryValue = freeShipping ? 0 : delivery;

if (receive.value === 'entrega') {

  const discountShipping = calcShippingDiscount();

  // ✅ SEM cupom → mostra entrega normal
  if (!appliedCoupon) {
    msg += `Entrega: ${money(delivery)}\n`;
  }

  // ✅ COM cupom → mostra apenas desconto na entrega
  if (appliedCoupon && discountShipping > 0) {
    msg += `Desconto na entrega: -${money(discountShipping)}\n`;
  }
}

msg += '---------------------------------------\n';
msg += `*Total do pedido: ${totalEl.textContent}*\n`;

msg += 'Valor sujeito à confirmação.\n\n';


msg += `Forma de pagamento: ${pay.value}\n\n`;

if (pay.value === 'Dinheiro') {
  const ch = document.querySelector('input[name="change"]:checked');

  if (ch && ch.value === 'sim') {
    msg += `Troco para: R$ ${changeValue.value}\n\n`;
  } else {
    msg += 'Sem necessidade de troco\n\n';
  }
}


msg += 'Forma de recebimento:\n';

if (receive.value === 'entrega') {
  msg += 'Entrega —\n';
  msg += `${addressEl.value}\n`;
} else {
  msg += 'Retirada no local —\n';
  msg += 'Rua Emidio Alves Feitosa, nº 1680\n';
  msg += 'Bairro Agenor de Carvalho.\n';
}

if (notesEl.value.trim()) {
  msg += `\nObservações:\n${notesEl.value}\n`;
}

msg += '\n*Obrigado!*';

const url = `https://wa.me/556932156921?text=${encodeURIComponent(msg)}`;
window.location.href = url;

}

console.log('JS carregou');


// ======================
// MINI CART — DRAG (DESKTOP)
// ======================

(function enableMiniCartDrag() {
  if (window.innerWidth <= 768) return; // ❌ mobile não

  const cart = document.getElementById('miniCart');
  if (!cart) return;

  let isDragging = false;
  let startX, startY, startRight, startBottom;

  cart.addEventListener('mousedown', (e) => {
    // evita arrastar ao clicar em botões
    if (e.target.closest('button')) return;

    isDragging = true;
    cart.style.transition = 'none';

    startX = e.clientX;
    startY = e.clientY;

    const rect = cart.getBoundingClientRect();
    startRight = window.innerWidth - rect.right;
    startBottom = window.innerHeight - rect.bottom;

    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    cart.style.right = `${startRight - dx}px`;
    cart.style.bottom = `${startBottom - dy}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;

    isDragging = false;
    cart.style.transition = '';
    document.body.style.userSelect = '';
  });
})();



//=========================
// Limpar Itens
//=========================

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    // 1. limpa estado lógico
    Object.keys(cart).forEach(key => delete cart[key]);

    // 2. zera contadores visuais
    document.querySelectorAll('.cookie-card .qty').forEach(qty => {
      qty.textContent = '0';
    });

    // 3. atualiza UI inteira
    updateUI();
  });
}


/* =========================================
   DEBUG MOBILE — CONFIRMA EXECUÇÃO + CAPTURE
   (remover depois)
========================================= */
/*(() => {
  // evita duplicar
  if (window.__dbgTap) return;
  window.__dbgTap = true;

  // plaquinha fixa (prova que o arquivo executou)
  const badge = document.createElement("div");
  badge.id = "dbg-badge";
  badge.textContent = "DEBUG ATIVO ✅ (toque na tela)";
  badge.style.position = "fixed";
  badge.style.left = "10px";
  badge.style.top = "10px";
  badge.style.zIndex = "999999";
  badge.style.background = "rgba(0,0,0,.85)";
  badge.style.color = "#fff";
  badge.style.padding = "8px 10px";
  badge.style.borderRadius = "10px";
  badge.style.fontSize = "12px";
  badge.style.pointerEvents = "none"; // não bloqueia toque
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(badge));

  function show(msg){
    let el = document.getElementById("tap-debug");
    if(!el){
      el = document.createElement("div");
      el.id = "tap-debug";
      el.style.position = "fixed";
      el.style.left = "10px";
      el.style.right = "10px";
      el.style.bottom = "90px";
      el.style.zIndex = "999999";
      el.style.background = "rgba(0,0,0,.85)";
      el.style.color = "#fff";
      el.style.padding = "10px";
      el.style.borderRadius = "12px";
      el.style.fontSize = "12px";
      el.style.lineHeight = "1.3";
      el.style.pointerEvents = "none";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    clearTimeout(window.__tapDebugT);
    window.__tapDebugT = setTimeout(()=> el.remove(), 1800);
  }

  function pickTop(e){
    const x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const y = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    const top = document.elementFromPoint(x, y);
    if(!top) return;

    const tag = top.tagName ? top.tagName.toLowerCase() : "??";
    const id  = top.id ? `#${top.id}` : "";
    const cls = top.className ? `.${String(top.className).trim().replace(/\s+/g,'.')}` : "";
    show(`TOPO: ${tag}${id}${cls}`);
  }

  // CAPTURE: pega mesmo se algum script parar a propagação
  window.addEventListener("touchstart", pickTop, { capture: true, passive: true });
  window.addEventListener("pointerdown", pickTop, { capture: true, passive: true });
})();*/
