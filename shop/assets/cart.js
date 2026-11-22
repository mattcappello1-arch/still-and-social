/* ========== STILL & SOCIAL CART ========== */
(function(){
  const STRIPE_PK = "pk_live_51Sh7aaRdn5OIpN4bta0NTatPqxrDxUDFOwa59dxRH6e4YWwP4GtcoJ1UTWx3pR6LlLMwyb8BCl5XmS7o0xFqCsFR00Aj2y9JTi";
  const CART_KEY = "ss_cart";

  /* ---- localStorage helpers ---- */
  function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(e){ return []; } }
  function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }
  window.ssGetCart = getCart;
  window.ssClearCart = function(){ localStorage.removeItem(CART_KEY); };

  /* ---- Cart operations ---- */
  function addToCart(item){
    const cart = getCart();
    const idx = cart.findIndex(c => c.priceId === item.priceId);
    if(idx > -1){ cart[idx].quantity += (item.quantity || 1); }
    else { cart.push({ priceId: item.priceId, name: item.name, price: item.price, quantity: item.quantity || 1, image: item.image || "" }); }
    saveCart(cart);
    renderCartDrawer();
    updateBadge();
    openCartDrawer();
  }
  window.ssAddToCart = addToCart;

  function updateQty(priceId, delta){
    const cart = getCart();
    const idx = cart.findIndex(c => c.priceId === priceId);
    if(idx === -1) return;
    cart[idx].quantity += delta;
    if(cart[idx].quantity < 1) cart.splice(idx, 1);
    saveCart(cart);
    renderCartDrawer();
    updateBadge();
  }

  function removeItem(priceId){
    const cart = getCart().filter(c => c.priceId !== priceId);
    saveCart(cart);
    renderCartDrawer();
    updateBadge();
  }

  function cartCount(){
    return getCart().reduce((s, i) => s + i.quantity, 0);
  }

  /* ---- Badge ---- */
  function updateBadge(){
    const badge = document.getElementById("cart-badge");
    if(!badge) return;
    const n = cartCount();
    badge.textContent = n;
    badge.style.display = n > 0 ? "flex" : "none";
  }

  /* ---- Drawer HTML injection ---- */
  function injectDrawer(){
    if(document.getElementById("cart-drawer")) return;

    /* Cart icon in nav */
    const navLinks = document.querySelector(".nav-links");
    if(navLinks){
      const cartBtn = document.createElement("button");
      cartBtn.id = "cart-toggle";
      cartBtn.setAttribute("aria-label", "Cart");
      cartBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span id="cart-badge" style="display:none">0</span>';
      navLinks.appendChild(cartBtn);
    }

    /* Mobile cart icon next to hamburger */
    const menuToggle = document.getElementById("menuToggle");
    if(menuToggle){
      const mobileCart = document.createElement("button");
      mobileCart.id = "cart-toggle-mobile";
      mobileCart.setAttribute("aria-label", "Cart");
      mobileCart.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span id="cart-badge-mobile" style="display:none">0</span>';
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
      #cart-badge,#cart-badge-mobile{position:absolute;top:-4px;right:-6px;background:var(--sienna);color:#fff;font-family:var(--mono);font-size:9px;font-weight:400;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;line-height:1}
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
      .cart-qty-btn{width:28px;height:28px;border:1px solid rgba(36,31,33,.18);background:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--char);transition:background .2s}
      .cart-qty-btn:hover{background:var(--cream)}
      .cart-qty{font-size:13px;min-width:20px;text-align:center;letter-spacing:.04em}
      .cart-remove{background:none;border:none;font-size:11px;color:var(--coffee);cursor:pointer;letter-spacing:.08em;text-transform:uppercase;margin-left:auto;padding:4px 0;transition:color .2s}
      .cart-remove:hover{color:var(--sienna)}
      .cart-empty{text-align:center;padding:60px 24px;color:var(--coffee);font-size:13px;letter-spacing:.04em}
      .cart-subtotal{display:flex;justify-content:space-between;font-size:13px;letter-spacing:.06em;margin-bottom:16px}
      .cart-subtotal strong{font-weight:400}
      .cart-checkout-btn{display:block;width:100%;text-align:center;background:var(--char);color:var(--cream);text-decoration:none;padding:17px;font-size:12px;letter-spacing:.28em;text-transform:uppercase;transition:background .25s;border:none;cursor:pointer;font-family:var(--mono)}
      .cart-checkout-btn:hover{background:var(--coffee)}
      .cart-continue{display:block;text-align:center;margin-top:12px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--coffee);text-decoration:none;transition:color .2s}
      .cart-continue:hover{color:var(--sienna)}
      .cart-added-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--char);color:var(--cream);padding:14px 28px;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;z-index:200;transition:transform .4s cubic-bezier(.4,0,.2,1);pointer-events:none}
      .cart-added-toast.show{transform:translateX(-50%) translateY(0)}
    `;
    document.head.appendChild(style);

    /* Toast element */
    const toast = document.createElement("div");
    toast.className = "cart-added-toast";
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
    updateMobileBadge();
  }

  function updateMobileBadge(){
    const badge = document.getElementById("cart-badge-mobile");
    if(!badge) return;
    const n = cartCount();
    badge.textContent = n;
    badge.style.display = n > 0 ? "flex" : "none";
  }

  /* Override updateBadge to also handle mobile */
  const _origUpdateBadge = updateBadge;
  updateBadge = function(){
    _origUpdateBadge();
    updateMobileBadge();
  };

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
    setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ---- Render drawer contents ---- */
  function renderCartDrawer(){
    const body = document.getElementById("cart-drawer-body");
    const footer = document.getElementById("cart-drawer-footer");
    if(!body || !footer) return;

    const cart = getCart();

    if(cart.length === 0){
      body.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
      footer.innerHTML = '<a class="cart-continue" href="/shop/catalogue.html">Continue shopping</a>';
      return;
    }

    let html = "";
    let subtotal = 0;
    cart.forEach(item => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      html += `<div class="cart-item">
        ${item.image ? `<img class="cart-item-img" src="${item.image}" alt="${item.name}">` : `<div class="cart-item-img"></div>`}
        <div>
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${item.price} AUD</div>
          <div class="cart-item-controls">
            <button class="cart-qty-btn" data-action="minus" data-id="${item.priceId}" aria-label="Decrease quantity">&minus;</button>
            <span class="cart-qty">${item.quantity}</span>
            <button class="cart-qty-btn" data-action="plus" data-id="${item.priceId}" aria-label="Increase quantity">+</button>
            <button class="cart-remove" data-action="remove" data-id="${item.priceId}">Remove</button>
          </div>
        </div>
      </div>`;
    });
    body.innerHTML = html;

    footer.innerHTML = `
      <div class="cart-subtotal"><span>Subtotal</span><strong>$${subtotal} AUD</strong></div>
      <button class="cart-checkout-btn" id="cart-checkout-btn">Checkout</button>
      <a class="cart-continue" href="/shop/catalogue.html">Continue shopping</a>
    `;

    /* Wire up qty/remove buttons */
    body.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", function(){
        const id = this.dataset.id;
        if(this.dataset.action === "plus") updateQty(id, 1);
        else if(this.dataset.action === "minus") updateQty(id, -1);
        else if(this.dataset.action === "remove") removeItem(id);
      });
    });

    /* Wire up checkout button */
    const checkoutBtn = document.getElementById("cart-checkout-btn");
    if(checkoutBtn) checkoutBtn.addEventListener("click", startCheckout);
  }

  /* ---- Stripe checkout ---- */
  let stripe = null;
  let currentCheckout = null;

  function getStripe(){
    if(!stripe && window.Stripe) stripe = Stripe(STRIPE_PK);
    return stripe;
  }

  async function startCheckout(){
    const cart = getCart();
    if(cart.length === 0) return;

    closeCartDrawer();

    const overlay = document.getElementById("checkout-overlay");
    const mount = document.getElementById("checkout-mount");
    if(!overlay || !mount) return;

    overlay.classList.add("open");
    mount.innerHTML = '<p style="text-align:center;padding:40px 0;color:var(--coffee);font-size:13px;letter-spacing:.06em">Loading checkout...</p>';

    const items = cart.map(i => ({ priceId: i.priceId, quantity: i.quantity }));

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if(!data.clientSecret) throw new Error(data.error || "Failed to create session");

      mount.innerHTML = "";
      const s = getStripe();
      currentCheckout = await s.initEmbeddedCheckout({ clientSecret: data.clientSecret });
      currentCheckout.mount("#checkout-mount");
    } catch(err) {
      mount.innerHTML = '<p style="text-align:center;padding:40px 0;color:#9F5136;font-size:13px">Something went wrong. Please try again.</p>';
      console.error("Checkout error:", err);
    }
  }

  /* Expose checkout close for existing pages */
  window.ssCloseCheckout = function(){
    const overlay = document.getElementById("checkout-overlay");
    if(overlay) overlay.classList.remove("open");
    if(currentCheckout){ currentCheckout.destroy(); currentCheckout = null; }
    const mount = document.getElementById("checkout-mount");
    if(mount) mount.innerHTML = "";
  };

  /* ---- Init ---- */
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", injectDrawer);
  } else {
    injectDrawer();
  }
})();
