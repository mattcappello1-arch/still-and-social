/* ========== STILL & SOCIAL CART — SQUARE ========== */
(function(){
  const CART_KEY = "ss_cart";

  /* ---- localStorage helpers ---- */
  function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(e){ return []; } }
  function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); updateBadge(); renderCartDrawer(); }
  function cartCount(){ return getCart().reduce((s, i) => s + i.quantity, 0); }
  function fmt(cents){ return "$" + (cents / 100).toFixed(2); }

  window.ssGetCart = getCart;
  window.ssClearCart = function(){ localStorage.removeItem(CART_KEY); updateBadge(); renderCartDrawer(); };

  /* ---- Cart operations ---- */
  function cartKey(item){
    return item.name + (item.modifier_name ? " — " + item.modifier_name : "");
  }

  function addToCart(item){
    const cart = getCart();
    const key = cartKey(item);
    const idx = cart.findIndex(c => cartKey(c) === key);
    if(idx > -1){ cart[idx].quantity += (item.quantity || 1); }
    else {
      const entry = { name: item.name, price: item.price, quantity: item.quantity || 1, image: item.image || "" };
      if(item.catalog_object_id) entry.catalog_object_id = item.catalog_object_id;
      if(item.modifiers) entry.modifiers = item.modifiers;
      if(item.modifier_name) entry.modifier_name = item.modifier_name;
      cart.push(entry);
    }
    saveCart(cart);
    showToast((item.modifier_name ? item.name + " — " + item.modifier_name : item.name) + " added to cart");
  }
  window.ssAddToCart = addToCart;

  function updateQty(idx, delta){
    const cart = getCart();
    if(idx < 0 || idx >= cart.length) return;
    cart[idx].quantity += delta;
    if(cart[idx].quantity < 1) cart.splice(idx, 1);
    saveCart(cart);
  }

  function removeItem(idx){
    const cart = getCart();
    cart.splice(idx, 1);
    saveCart(cart);
  }

  /* ---- Badge ---- */
  function updateBadge(){
    const n = cartCount();
    document.querySelectorAll(".ss-cart-badge").forEach(b => {
      b.textContent = n;
      b.style.display = n > 0 ? "flex" : "none";
    });
  }

  /* ---- Drawer ---- */
  function openCartDrawer(){
    renderCartDrawer();
    const overlay = document.getElementById("cart-drawer-overlay");
    if(overlay) overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  window.ssOpenCartDrawer = openCartDrawer;

  function closeCartDrawer(){
    const overlay = document.getElementById("cart-drawer-overlay");
    if(overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function showToast(msg){
    const t = document.getElementById("cart-toast");
    if(!t) return;
    t.textContent = msg || "Added to cart";
    t.classList.add("show");
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---- Render drawer ---- */
  function renderCartDrawer(){
    const body = document.getElementById("cart-drawer-body");
    const footer = document.getElementById("cart-drawer-footer");
    if(!body || !footer) return;

    const cart = getCart();

    if(cart.length === 0){
      body.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
      footer.innerHTML = '<a class="cart-continue" href="/shop/">Continue shopping</a>';
      return;
    }

    let html = "";
    let subtotal = 0;
    cart.forEach((item, idx) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      html += `<div class="cart-item">
        ${item.image ? `<img class="cart-item-img" src="${item.image}" alt="${item.name}">` : `<div class="cart-item-img"></div>`}
        <div>
          <div class="cart-item-name">${item.modifier_name ? item.name + ' — ' + item.modifier_name : item.name}</div>
          <div class="cart-item-price">${fmt(item.price)}</div>
          <div class="cart-item-controls">
            <button class="cart-qty-btn" data-action="minus" data-idx="${idx}" aria-label="Decrease quantity">&minus;</button>
            <span class="cart-qty">${item.quantity}</span>
            <button class="cart-qty-btn" data-action="plus" data-idx="${idx}" aria-label="Increase quantity">+</button>
            <button class="cart-remove" data-action="remove" data-idx="${idx}">Remove</button>
          </div>
        </div>
      </div>`;
    });
    body.innerHTML = html;

    footer.innerHTML = `
      <div class="cart-subtotal"><span>Subtotal</span><strong>${fmt(subtotal)}</strong></div>
      <button class="cart-checkout-btn" id="cart-checkout-btn">Checkout</button>
      <a class="cart-continue" href="/shop/">Continue shopping</a>
    `;

    /* Wire up qty/remove buttons */
    body.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", function(){
        const idx = parseInt(this.dataset.idx);
        if(this.dataset.action === "plus") updateQty(idx, 1);
        else if(this.dataset.action === "minus") updateQty(idx, -1);
        else if(this.dataset.action === "remove") removeItem(idx);
      });
    });

    /* Wire up checkout button */
    document.getElementById("cart-checkout-btn").addEventListener("click", startCheckout);
  }

  /* ---- Checkout ---- */
  function startCheckout(){
    const cart = getCart();
    if(cart.length === 0) return;
    window.location.href = "/shop/checkout.html";
  }

  /* ---- Inject UI ---- */
  function injectDrawer(){
    if(document.getElementById("cart-drawer-overlay")) return;

    /* Cart icon in nav-links (desktop) */
    const navLinks = document.querySelector(".nav-links");
    if(navLinks){
      const cartBtn = document.createElement("button");
      cartBtn.id = "cart-toggle";
      cartBtn.setAttribute("aria-label", "Cart");
      cartBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span class="ss-cart-badge" style="display:none">0</span>';
      navLinks.appendChild(cartBtn);
    }

    /* Mobile cart icon next to hamburger */
    const menuToggle = document.getElementById("menuToggle");
    if(menuToggle){
      const mobileCart = document.createElement("button");
      mobileCart.id = "cart-toggle-mobile";
      mobileCart.setAttribute("aria-label", "Cart");
      mobileCart.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span class="ss-cart-badge" style="display:none">0</span>';
      menuToggle.parentNode.insertBefore(mobileCart, menuToggle);
    }

    /* Drawer overlay + panel */
    const drawer = document.createElement("div");
    drawer.id = "cart-drawer-overlay";
    drawer.innerHTML = '<div id="cart-drawer"><div id="cart-drawer-header"><span>Your Cart</span><button id="cart-drawer-close" aria-label="Close cart">&times;</button></div><div id="cart-drawer-body"></div><div id="cart-drawer-footer"></div></div>';
    document.body.appendChild(drawer);

    /* Styles */
    const style = document.createElement("style");
    style.textContent = `
      #cart-toggle,#cart-toggle-mobile{background:none;border:0;color:var(--coffee);cursor:pointer;padding:4px;position:relative;display:inline-flex;align-items:center;transition:color .3s}
      #cart-toggle:hover,#cart-toggle-mobile:hover{color:var(--sienna)}
      #cart-toggle{display:inline-flex}
      #cart-toggle-mobile{display:none}
      @media(max-width:980px){#cart-toggle-mobile{display:inline-flex}}
      .ss-cart-badge{position:absolute;top:-4px;right:-6px;background:var(--sienna);color:#fff;font-family:var(--mono);font-size:9px;font-weight:400;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;line-height:1}
      #cart-drawer-overlay{position:fixed;inset:0;z-index:90;background:rgba(36,31,33,.4);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .3s}
      #cart-drawer-overlay.open{opacity:1;pointer-events:auto}
      #cart-drawer{position:fixed;top:0;right:0;bottom:0;width:min(420px,92vw);background:var(--paper);z-index:91;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);box-shadow:-8px 0 40px rgba(36,31,33,.12)}
      #cart-drawer-overlay.open #cart-drawer{transform:translateX(0)}
      #cart-drawer-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid rgba(36,31,33,.1)}
      #cart-drawer-header span{font-family:var(--mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--coffee)}
      #cart-drawer-close{background:none;border:none;font-size:22px;cursor:pointer;color:var(--char);line-height:1;padding:0 4px}
      #cart-drawer-body{flex:1;overflow-y:auto;padding:0}
      #cart-drawer-footer{padding:20px 24px;border-top:1px solid rgba(36,31,33,.1)}
      .cart-item{display:grid;grid-template-columns:72px 1fr;gap:14px;padding:18px 24px;border-bottom:1px solid rgba(36,31,33,.08);align-items:start}
      .cart-item-img{width:72px;height:90px;object-fit:cover;background:var(--cream)}
      .cart-item-name{font-size:13px;letter-spacing:.03em;font-weight:400;margin-bottom:2px}
      .cart-item-price{font-size:12px;color:var(--coffee);letter-spacing:.06em}
      .cart-item-controls{display:flex;align-items:center;gap:10px;margin-top:8px}
      .cart-qty-btn{width:28px;height:28px;border:1px solid rgba(36,31,33,.18);background:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--char);transition:background .2s;font-family:var(--mono)}
      .cart-qty-btn:hover{background:var(--cream)}
      .cart-qty{font-size:13px;min-width:20px;text-align:center;letter-spacing:.04em}
      .cart-remove{background:none;border:none;font-size:11px;color:var(--coffee);cursor:pointer;letter-spacing:.08em;text-transform:uppercase;margin-left:auto;padding:4px 0;transition:color .2s;font-family:var(--mono)}
      .cart-remove:hover{color:var(--sienna)}
      .cart-empty{text-align:center;padding:60px 24px;color:var(--coffee);font-size:13px;letter-spacing:.04em}
      .cart-subtotal{display:flex;justify-content:space-between;font-size:13px;letter-spacing:.06em;margin-bottom:16px}
      .cart-subtotal strong{font-weight:400}
      .cart-checkout-btn{display:block;width:100%;text-align:center;background:var(--char);color:var(--cream);text-decoration:none;padding:17px;font-size:12px;letter-spacing:.28em;text-transform:uppercase;transition:background .25s;border:none;cursor:pointer;font-family:var(--mono)}
      .cart-checkout-btn:hover{background:var(--coffee)}
      .cart-checkout-btn:disabled{opacity:.6;cursor:wait}
      .cart-continue{display:block;text-align:center;margin-top:12px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--coffee);text-decoration:none;transition:color .2s}
      .cart-continue:hover{color:var(--sienna)}
      #cart-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--char);color:var(--cream);padding:14px 28px;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;z-index:200;transition:transform .4s cubic-bezier(.4,0,.2,1);pointer-events:none;white-space:nowrap}
      #cart-toast.show{transform:translateX(-50%) translateY(0)}
      .ss-qty-picker{display:flex;align-items:center;gap:0;margin-bottom:16px}
      .ss-qty-picker button{width:40px;height:40px;border:1px solid rgba(36,31,33,.18);background:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--char);font-family:var(--mono);transition:background .2s}
      .ss-qty-picker button:hover{background:var(--cream)}
      .ss-qty-picker span{width:48px;height:40px;display:flex;align-items:center;justify-content:center;border-top:1px solid rgba(36,31,33,.18);border-bottom:1px solid rgba(36,31,33,.18);font-size:14px;letter-spacing:.04em}
    `;
    document.head.appendChild(style);

    /* Toast element */
    const toast = document.createElement("div");
    toast.id = "cart-toast";
    toast.textContent = "Added to cart";
    document.body.appendChild(toast);

    /* Event listeners */
    const toggleBtn = document.getElementById("cart-toggle");
    const toggleBtnMobile = document.getElementById("cart-toggle-mobile");
    const overlay = document.getElementById("cart-drawer-overlay");
    const closeBtn = document.getElementById("cart-drawer-close");

    if(toggleBtn) toggleBtn.addEventListener("click", openCartDrawer);
    if(toggleBtnMobile) toggleBtnMobile.addEventListener("click", openCartDrawer);
    if(closeBtn) closeBtn.addEventListener("click", closeCartDrawer);
    if(overlay) overlay.addEventListener("click", function(e){ if(e.target === this) closeCartDrawer(); });

    updateBadge();
    renderCartDrawer();
  }

  /* ---- Init ---- */
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", injectDrawer);
  } else {
    injectDrawer();
  }
})();
