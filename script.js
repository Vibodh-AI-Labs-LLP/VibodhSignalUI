/**
 * Vibodh Signal — Pricing Page Interactions
 *  • Tab switching (Plans / Features / Add-Ons / FAQ)
 *  • 3-Way Billing Toggle with animated price updates
 *  • Get Started → 4-step checkout modal
 *  • Contact Sales modal
 *  • Add Pack → Credit top-up modal
 *  • Log In modal
 *  • FAQ Accordion · Mobile Nav
 */

/* ─────────────────────────────────────────────────────────
   0. TAB SYSTEM
───────────────────────────────────────────────────────── */
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const match = btn.getAttribute('data-tab') === tabId;
    btn.classList.toggle('is-active', match);
    btn.setAttribute('aria-selected', match ? 'true' : 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('is-active', panel.id === 'panel-' + tabId);
  });
  document.querySelectorAll('.nav-links .nav-link[data-tab]').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-tab') === tabId);
  });
  // Reset scroll position back to top when switching tabs
  const pageContent = document.querySelector('.page-content');
  if (pageContent) {
    pageContent.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchTab = switchTab;


/* ─────────────────────────────────────────────────────────
   1. PRICING DATA
───────────────────────────────────────────────────────── */
const PLANS = {
  starter:  { name: 'Starter',  monthly: 1499,  quarterly: 4047,  annual: 14990,  annualMonthly: 1249 },
  growth:   { name: 'Growth',   monthly: 3999,  quarterly: 10797, annual: 39990,  annualMonthly: 3333 },
  pro:      { name: 'Business', monthly: 8999,  quarterly: 24297, annual: 89990,  annualMonthly: 7499 },
  agency:   { name: 'Agency',   monthly: 34999, quarterly: 94497, annual: 349990, annualMonthly: 29166, custom: true }
};

const PRICING_DATA = {
  monthly:   { periodLabel: '/ month',   subCaption: 'Billed monthly',                 key: 'monthly'   },
  quarterly: { periodLabel: '/ quarter', subCaption: 'Billed quarterly (Save ~10%)',   key: 'quarterly' },
  annual:    { periodLabel: '/ year',    subCaption: 'Billed annually (Save ~17%)',     key: 'annual'    }
};

const CREDIT_PACKS = [
  { credits: 50,    price: 500,  label: '50 credits',    discount: null,     baseRate: 10 },
  { credits: 100,   price: 950,  label: '100 credits',   discount: '5% OFF', baseRate: 10 },
  { credits: 250,   price: 2250, label: '250 credits',   discount: '10% OFF',popular: true, baseRate: 10 },
  { credits: 500,   price: 4300, label: '500 credits',   discount: '14% OFF',baseRate: 10 },
  { credits: 1000,  price: 8300, label: '1,000 credits', discount: '17% OFF',bestValue: true, baseRate: 10 },
];

let activeCycle = 'monthly';
let selectedCreditPack = null;

/* ─────────────────────────────────────────────────────────
   2. FORMAT HELPERS
───────────────────────────────────────────────────────── */
function formatINR(n) {
  return '\u20B9' + Number(n).toLocaleString('en-IN');
}

function cyclePrice(planKey, cycle) {
  if (planKey === 'agency') return 'Custom';
  const p = PLANS[planKey];
  if (!p) return '';
  if (cycle === 'monthly')   return formatINR(p.monthly);
  if (cycle === 'quarterly') return formatINR(p.quarterly);
  return formatINR(p.annual);
}

/* ─────────────────────────────────────────────────────────
   3. MODAL SYSTEM
───────────────────────────────────────────────────────── */
let modalOverlay = null;

function createOverlay() {
  if (document.getElementById('vs-modal-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'vs-modal-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    background:rgba(15,15,20,0.55); backdrop-filter:blur(4px);
    display:flex; align-items:center; justify-content:center;
    padding:20px; opacity:0; transition:opacity 0.2s ease;
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  modalOverlay = overlay;
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => overlay.style.opacity = '1');
}

function showModal(html, opts = {}) {
  createOverlay();
  const width = opts.width || '520px';
  const box = document.createElement('div');
  box.id = 'vs-modal-box';
  box.style.cssText = `
    background:#fff; border-radius:16px; width:100%; max-width:${width};
    max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.22);
    transform:translateY(16px) scale(0.98); transition:transform 0.22s ease, opacity 0.22s ease;
    opacity:0; position:relative;
  `;
  box.innerHTML = html;
  modalOverlay.innerHTML = '';
  modalOverlay.appendChild(box);
  requestAnimationFrame(() => {
    box.style.transform = 'translateY(0) scale(1)';
    box.style.opacity = '1';
  });
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.style.opacity = '0';
  document.body.style.overflow = '';
  setTimeout(() => { modalOverlay?.remove(); modalOverlay = null; }, 200);
}

function modalHeader(title, subtitle = '') {
  return `
    <div style="padding:28px 28px 20px; border-bottom:1px solid #f0f0f0;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div style="font-size:1.125rem; font-weight:700; color:#1C1917; line-height:1.3;">${title}</div>
          ${subtitle ? `<div style="font-size:0.8125rem; color:#78716C; margin-top:4px;">${subtitle}</div>` : ''}
        </div>
        <button onclick="closeModal()" style="border:none; background:#F5F5F4; border-radius:8px; width:32px; height:32px; cursor:pointer; font-size:18px; color:#78716C; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-left:16px;">&times;</button>
      </div>
    </div>`;
}

function stepIndicator(current, total, labels) {
  return `
    <div style="display:flex; align-items:center; justify-content:center; gap:0; padding:16px 28px 0;">
      ${labels.map((label, i) => {
        const idx = i + 1;
        const done  = idx < current;
        const active = idx === current;
        const bg = done ? '#0F9D8A' : active ? '#243B6B' : '#E7E5E4';
        const tc = done || active ? '#fff' : '#A8A29E';
        const lc = done || active ? '#0F9D8A' : '#E7E5E4';
        return `
          <div style="display:flex; align-items:center; flex:1; ${i === 0 ? 'flex:0;' : ''}">
            ${i > 0 ? `<div style="flex:1; height:2px; background:${lc}; min-width:20px;"></div>` : ''}
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
              <div style="width:28px; height:28px; border-radius:50%; background:${bg}; color:${tc}; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center;">
                ${done ? '✓' : idx}
              </div>
              <div style="font-size:10px; font-weight:600; color:${active ? '#243B6B' : '#A8A29E'}; white-space:nowrap;">${label}</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

/* ─────────────────────────────────────────────────────────
   4. CHECKOUT FLOW  (4 steps)
───────────────────────────────────────────────────────── */
let checkoutState = {};

function openCheckout(planKey) {
  checkoutState = {
    plan: planKey,
    cycle: activeCycle,
    step: 1,
    name: '', email: '', phone: '', gstin: '',
    payMethod: 'upi', upiId: '', card: { number:'', expiry:'', cvv:'', name:'' }
  };
  renderCheckoutStep(1);
}

function renderCheckoutStep(step) {
  checkoutState.step = step;
  const plan = PLANS[checkoutState.plan];
  const price = cyclePrice(checkoutState.plan, checkoutState.cycle);
  const steps = ['Plan', 'Account', 'Payment', 'Done'];

  let body = '';

  if (step === 1) {
    // ── Step 1: Confirm Plan ────────────────────────────
    const cycleOpts = [
      { key:'monthly',   label:'Monthly',   sub:'Maximum flexibility', savings:'' },
      { key:'quarterly', label:'Quarterly', sub:'~10% savings',        savings:'Save ~10%' },
      { key:'annual',    label:'Annual',    sub:'Best value',          savings:'Save ~17%' }
    ];

    body = `
      <div style="padding:24px 28px;">
        <div style="background:linear-gradient(135deg,#EFF6FF,#F0FDF4); border:1.5px solid #DBEAFE; border-radius:12px; padding:20px; margin-bottom:24px;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#78716C; margin-bottom:6px;">Selected Plan</div>
          <div style="font-size:1.5rem; font-weight:800; color:#243B6B;">${plan.name}</div>
          <div id="co-price-display" style="font-size:1rem; font-weight:600; color:#0F9D8A; margin-top:4px;">${price} <span style="font-size:.8125rem; font-weight:400; color:#78716C;">${PRICING_DATA[checkoutState.cycle].periodLabel}</span></div>
          <div id="co-cycle-caption" style="font-size:.75rem; color:#78716C; margin-top:2px;">${PRICING_DATA[checkoutState.cycle].subCaption}</div>
        </div>

        <div style="margin-bottom:20px;">
          <div style="font-size:.8125rem; font-weight:600; color:#1C1917; margin-bottom:10px;">Choose billing cycle:</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${cycleOpts.map(opt => `
              <label style="display:flex; align-items:center; gap:12px; padding:12px 14px; border:1.5px solid ${checkoutState.cycle===opt.key ? '#243B6B':'#E7E5E4'}; border-radius:10px; cursor:pointer; background:${checkoutState.cycle===opt.key ? '#F8FAFC':'#fff'}; transition:all .15s;">
                <input type="radio" name="co-cycle" value="${opt.key}" ${checkoutState.cycle===opt.key?'checked':''} onchange="coSetCycle('${opt.key}')" style="accent-color:#243B6B; width:16px; height:16px;">
                <div style="flex:1;">
                  <div style="font-weight:600; color:#1C1917; font-size:.875rem;">${opt.label}</div>
                  <div style="font-size:.75rem; color:#78716C;">${opt.sub}</div>
                </div>
                ${opt.savings ? `<span style="background:#DCFCE7; color:#15803D; font-size:10px; font-weight:700; padding:2px 8px; border-radius:99px;">${opt.savings}</span>` : ''}
                <div style="font-size:.875rem; font-weight:700; color:#243B6B;" id="co-opt-price-${opt.key}">${cyclePrice(checkoutState.plan, opt.key)}</div>
              </label>`).join('')}
          </div>
        </div>

        <div style="background:#FFFBEB; border:1px solid #FEF3C7; border-radius:8px; padding:10px 14px; font-size:.75rem; color:#92400E; margin-bottom:24px;">
          ℹ️ All prices exclude 18% GST. GST invoice will be provided for ITC claim.
        </div>

        <button onclick="renderCheckoutStep(2)" style="width:100%; padding:13px; background:#243B6B; color:#fff; border:none; border-radius:10px; font-size:.9375rem; font-weight:700; cursor:pointer; transition:background .15s;" onmouseover="this.style.background='#1a2d52'" onmouseout="this.style.background='#243B6B'">
          Continue — Account Details →
        </button>
        <button onclick="closeModal()" style="width:100%; padding:10px; background:none; border:none; color:#78716C; font-size:.8125rem; cursor:pointer; margin-top:8px;">Cancel</button>
      </div>`;

  } else if (step === 2) {
    // ── Step 2: Account Details ──────────────────────────
    body = `
      <div style="padding:24px 28px;">
        <div style="display:flex; gap:12px; margin-bottom:16px;">
          <div style="flex:1;">
            <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Full Name *</label>
            <input id="co-name" type="text" placeholder="e.g. Priya Sharma" value="${checkoutState.name}"
              style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; outline:none; transition:border-color .15s;"
              onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
          </div>
          <div style="flex:1;">
            <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Phone *</label>
            <input id="co-phone" type="tel" placeholder="+91 98765 43210" value="${checkoutState.phone}"
              style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; outline:none; transition:border-color .15s;"
              onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Work Email *</label>
          <input id="co-email" type="email" placeholder="priya@yourbrand.in" value="${checkoutState.email}"
            style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; outline:none; transition:border-color .15s;"
            onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
        </div>

        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">
            GSTIN <span style="font-weight:400; color:#78716C;">(optional — for GST invoice)</span>
          </label>
          <input id="co-gstin" type="text" placeholder="e.g. 27AABCV1234F1Z5" value="${checkoutState.gstin}"
            style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; font-family:monospace; outline:none; transition:border-color .15s; text-transform:uppercase;"
            onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
          <div style="font-size:.75rem; color:#78716C; margin-top:4px;">Enter your 15-digit GSTIN to claim 18% ITC on your subscription.</div>
        </div>

        <div id="co-acct-error" style="display:none; color:#DC2626; font-size:.8125rem; background:#FEF2F2; border-radius:8px; padding:10px 12px; margin-bottom:16px;"></div>

        <div style="display:flex; gap:10px; margin-top:8px;">
          <button onclick="renderCheckoutStep(1)" style="flex:1; padding:12px; border:1.5px solid #E7E5E4; border-radius:10px; background:#fff; color:#44403C; font-size:.875rem; font-weight:600; cursor:pointer;">
            ← Back
          </button>
          <button onclick="coValidateAccount()" style="flex:2; padding:12px; background:#243B6B; color:#fff; border:none; border-radius:10px; font-size:.9375rem; font-weight:700; cursor:pointer;" onmouseover="this.style.background='#1a2d52'" onmouseout="this.style.background='#243B6B'">
            Continue — Payment →
          </button>
        </div>
      </div>`;

  } else if (step === 3) {
    // ── Step 3: Payment ────────────────────────────────
    const price = cyclePrice(checkoutState.plan, checkoutState.cycle);
    const plan = PLANS[checkoutState.plan];
    const rawPrice = plan[checkoutState.cycle === 'monthly' ? 'monthly' : checkoutState.cycle === 'quarterly' ? 'quarterly' : 'annual'];
    const gst = Math.round(rawPrice * 0.18);
    const total = rawPrice + gst;

    body = `
      <div style="padding:24px 28px;">
        <!-- Order Summary -->
        <div style="background:#F8FAFC; border:1px solid #E7E5E4; border-radius:10px; padding:14px 16px; margin-bottom:20px;">
          <div style="font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#78716C; margin-bottom:10px;">Order Summary</div>
          <div style="display:flex; justify-content:space-between; font-size:.875rem; margin-bottom:6px;">
            <span style="color:#44403C;">${plan.name} Plan (${PRICING_DATA[checkoutState.cycle].periodLabel.replace('/ ','')})</span>
            <span style="font-weight:600;">${price}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:.8125rem; color:#78716C; margin-bottom:10px;">
            <span>GST @ 18%</span>
            <span>${formatINR(gst)}</span>
          </div>
          <div style="border-top:1px solid #E7E5E4; padding-top:10px; display:flex; justify-content:space-between; font-size:1rem; font-weight:800; color:#243B6B;">
            <span>Total Payable</span>
            <span>${formatINR(total)}</span>
          </div>
          <div style="font-size:.75rem; color:#78716C; margin-top:4px; text-align:right;">Includes 18% GST (SAC: 998314)</div>
        </div>

        <!-- Payment Method Tabs -->
        <div style="margin-bottom:16px;">
          <div style="font-size:.8125rem; font-weight:600; color:#1C1917; margin-bottom:10px;">Payment method:</div>
          <div style="display:flex; gap:8px; margin-bottom:16px;">
            ${[['upi','📱 UPI / Autopay'],['card','💳 Card'],['netbanking','🏦 Net Banking']].map(([key, label]) => `
              <button onclick="coSetPayMethod('${key}')" id="co-pm-tab-${key}"
                style="flex:1; padding:9px 6px; border:1.5px solid ${checkoutState.payMethod===key?'#243B6B':'#E7E5E4'}; border-radius:8px; background:${checkoutState.payMethod===key?'#EFF6FF':'#fff'}; color:${checkoutState.payMethod===key?'#243B6B':'#78716C'}; font-size:.75rem; font-weight:600; cursor:pointer; transition:all .15s;">
                ${label}
              </button>`).join('')}
          </div>

          <div id="co-pay-fields">
            ${renderPayFields(checkoutState.payMethod)}
          </div>
        </div>

        <div id="co-pay-error" style="display:none; color:#DC2626; font-size:.8125rem; background:#FEF2F2; border-radius:8px; padding:10px 12px; margin-bottom:16px;"></div>

        <!-- Trust row -->
        <div style="display:flex; align-items:center; justify-content:center; gap:16px; margin-bottom:16px; font-size:.75rem; color:#78716C;">
          <span>🔒 256-bit SSL</span>
          <span>📄 GST invoice auto-generated</span>
          <span>↩ Cancel anytime</span>
        </div>

        <div style="display:flex; gap:10px;">
          <button onclick="renderCheckoutStep(2)" style="flex:1; padding:12px; border:1.5px solid #E7E5E4; border-radius:10px; background:#fff; color:#44403C; font-size:.875rem; font-weight:600; cursor:pointer;">
            ← Back
          </button>
          <button onclick="coProcessPayment()" id="co-pay-btn" style="flex:2; padding:12px; background:#0F9D8A; color:#fff; border:none; border-radius:10px; font-size:.9375rem; font-weight:700; cursor:pointer; transition:background .15s;" onmouseover="this.style.background='#0c8170'" onmouseout="this.style.background='#0F9D8A'">
            Pay ${formatINR(total)} →
          </button>
        </div>
      </div>`;

  } else if (step === 4) {
    // ── Step 4: Success ─────────────────────────────────
    const plan = PLANS[checkoutState.plan];
    const rawPrice = plan[checkoutState.cycle === 'monthly' ? 'monthly' : checkoutState.cycle === 'quarterly' ? 'quarterly' : 'annual'];
    const gst = Math.round(rawPrice * 0.18);
    const total = rawPrice + gst;
    const invoiceId = 'INV-' + Date.now().toString().slice(-8);
    const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

    body = `
      <div style="padding:36px 28px; text-align:center;">
        <div style="width:72px; height:72px; background:linear-gradient(135deg,#0F9D8A,#16A34A); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; box-shadow:0 8px 24px rgba(15,157,138,0.3);">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h2 style="font-size:1.375rem; font-weight:800; color:#1C1917; margin-bottom:8px;">You're all set! 🎉</h2>
        <p style="color:#78716C; font-size:.9375rem; margin-bottom:24px; line-height:1.5;">
          Welcome to <strong>Vibodh Signal ${plan.name}</strong>.<br>Your workspace is being set up.
        </p>

        <!-- Invoice summary -->
        <div style="background:#F8FAFC; border:1px solid #E7E5E4; border-radius:12px; padding:16px; text-align:left; margin-bottom:24px;">
          <div style="font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#78716C; margin-bottom:12px;">Payment Receipt</div>
          ${[
            ['Invoice ID', invoiceId],
            ['Plan', plan.name + ' (' + checkoutState.cycle.charAt(0).toUpperCase() + checkoutState.cycle.slice(1) + ')'],
            ['Account', checkoutState.email],
            ['Amount Paid', formatINR(total) + ' (incl. 18% GST)'],
            ['Date', today],
            ['GST Invoice', checkoutState.gstin ? 'Will be sent to ' + checkoutState.email : 'Available in your dashboard'],
          ].map(([k,v]) => `
            <div style="display:flex; justify-content:space-between; font-size:.8125rem; padding:5px 0; border-bottom:1px solid #F5F5F4;">
              <span style="color:#78716C;">${k}</span>
              <span style="font-weight:600; color:#1C1917;">${v}</span>
            </div>`).join('')}
        </div>

        <div style="background:#F0FDF4; border:1px solid #DCFCE7; border-radius:10px; padding:12px 16px; text-align:left; margin-bottom:24px; font-size:.8125rem; color:#166534;">
          ✉️ Confirmation email sent to <strong>${checkoutState.email}</strong>
        </div>

        <button onclick="closeModal()" style="width:100%; padding:13px; background:#243B6B; color:#fff; border:none; border-radius:10px; font-size:.9375rem; font-weight:700; cursor:pointer;" onmouseover="this.style.background='#1a2d52'" onmouseout="this.style.background='#243B6B'">
          Go to Dashboard →
        </button>
      </div>`;
  }

  showModal(
    modalHeader(
      step < 4 ? `Start with ${plan.name}` : 'Subscription Activated!',
      step < 4 ? `Step ${step} of 3 — ${['','Plan & Billing','Account Details','Payment'][step]}` : ''
    ) +
    (step < 4 ? stepIndicator(step, 3, ['Plan', 'Account', 'Payment']) : '') +
    body
  );
}

function renderPayFields(method) {
  if (method === 'upi') {
    return `
      <div>
        <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">UPI ID *</label>
        <input id="co-upi" type="text" placeholder="yourname@upi or phone@paytm" value="${checkoutState.upiId}"
          style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; outline:none; transition:border-color .15s;"
          onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
        <div style="margin-top:10px; font-size:.75rem; color:#78716C;">Supports: Google Pay, PhonePe, Paytm, BHIM, all UPI apps</div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          ${['G Pay','PhonePe','Paytm','BHIM'].map(app => `<span style="background:#F5F5F4; border-radius:6px; padding:4px 10px; font-size:.75rem; color:#44403C; font-weight:500;">${app}</span>`).join('')}
        </div>
      </div>`;
  }
  if (method === 'card') {
    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Card Number *</label>
          <input id="co-card-num" type="text" placeholder="1234 5678 9012 3456" maxlength="19"
            oninput="this.value=this.value.replace(/[^0-9]/g,'').replace(/(.{4})/g,'$1 ').trim()"
            style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; font-family:monospace; letter-spacing:.05em; outline:none; transition:border-color .15s;"
            onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
        </div>
        <div style="display:flex; gap:12px;">
          <div style="flex:1;">
            <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Expiry (MM/YY) *</label>
            <input id="co-card-exp" type="text" placeholder="08/27" maxlength="5"
              oninput="let v=this.value.replace(/[^0-9]/g,''); if(v.length>=3) v=v.slice(0,2)+'/'+v.slice(2); this.value=v;"
              style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; font-family:monospace; outline:none; transition:border-color .15s;"
              onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
          </div>
          <div style="flex:1;">
            <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">CVV *</label>
            <input id="co-card-cvv" type="password" placeholder="•••" maxlength="4"
              style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; font-family:monospace; outline:none; transition:border-color .15s;"
              onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
          </div>
        </div>
        <div>
          <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Name on Card *</label>
          <input id="co-card-name" type="text" placeholder="PRIYA SHARMA"
            style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; text-transform:uppercase; outline:none; transition:border-color .15s;"
            onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          ${['Visa','MC','RuPay','Amex'].map(n => `<span style="background:#F5F5F4; border:1px solid #E7E5E4; border-radius:5px; padding:3px 8px; font-size:.75rem; color:#44403C; font-weight:600;">${n}</span>`).join('')}
        </div>
      </div>`;
  }
  // Net Banking
  return `
    <div>
      <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Select Bank</label>
      <select id="co-bank" style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; outline:none; background:#fff;">
        <option value="">— Choose your bank —</option>
        ${['SBI','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra','Yes Bank','Punjab National Bank','Bank of Baroda','IndusInd Bank','Federal Bank'].map(b => `<option>${b}</option>`).join('')}
      </select>
      <div style="margin-top:10px; font-size:.75rem; color:#78716C;">You will be securely redirected to your bank's net banking portal.</div>
    </div>`;
}

// Global helpers called from modal HTML
window.coSetCycle = function(cycle) {
  checkoutState.cycle = cycle;
  // Update price display
  const pd = document.getElementById('co-price-display');
  const cc = document.getElementById('co-cycle-caption');
  if (pd) pd.innerHTML = cyclePrice(checkoutState.plan, cycle) + ` <span style="font-size:.8125rem;font-weight:400;color:#78716C;">${PRICING_DATA[cycle].periodLabel}</span>`;
  if (cc) cc.textContent = PRICING_DATA[cycle].subCaption;
  // Update label borders
  document.querySelectorAll('input[name="co-cycle"]').forEach(r => {
    const lbl = r.closest('label');
    if (!lbl) return;
    if (r.value === cycle) { lbl.style.borderColor='#243B6B'; lbl.style.background='#F8FAFC'; }
    else { lbl.style.borderColor='#E7E5E4'; lbl.style.background='#fff'; }
  });
};

window.coValidateAccount = function() {
  const name  = document.getElementById('co-name')?.value.trim();
  const phone = document.getElementById('co-phone')?.value.trim();
  const email = document.getElementById('co-email')?.value.trim();
  const gstin = document.getElementById('co-gstin')?.value.trim();
  const errEl = document.getElementById('co-acct-error');

  if (!name) { showFieldError(errEl, 'Please enter your full name.'); return; }
  if (!phone || !/^[+\d\s]{10,15}$/.test(phone)) { showFieldError(errEl, 'Please enter a valid phone number.'); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError(errEl, 'Please enter a valid email address.'); return; }
  if (gstin && gstin.length !== 15) { showFieldError(errEl, 'GSTIN must be exactly 15 characters (or leave blank).'); return; }

  checkoutState.name = name;
  checkoutState.phone = phone;
  checkoutState.email = email;
  checkoutState.gstin = gstin;
  renderCheckoutStep(3);
};

window.coSetPayMethod = function(method) {
  checkoutState.payMethod = method;
  const plan = PLANS[checkoutState.plan];
  const rawPrice = plan[checkoutState.cycle === 'monthly' ? 'monthly' : checkoutState.cycle === 'quarterly' ? 'quarterly' : 'annual'];
  const gst = Math.round(rawPrice * 0.18);
  const total = rawPrice + gst;
  // Update tab styles
  ['upi','card','netbanking'].forEach(k => {
    const tab = document.getElementById('co-pm-tab-' + k);
    if (!tab) return;
    tab.style.borderColor = k === method ? '#243B6B' : '#E7E5E4';
    tab.style.background  = k === method ? '#EFF6FF' : '#fff';
    tab.style.color       = k === method ? '#243B6B' : '#78716C';
  });
  const fields = document.getElementById('co-pay-fields');
  if (fields) fields.innerHTML = renderPayFields(method);
};

window.coProcessPayment = function() {
  const errEl = document.getElementById('co-pay-error');
  const btn   = document.getElementById('co-pay-btn');

  if (checkoutState.payMethod === 'upi') {
    const upi = document.getElementById('co-upi')?.value.trim();
    if (!upi || !upi.includes('@')) { showFieldError(errEl, 'Please enter a valid UPI ID (e.g. name@upi).'); return; }
    checkoutState.upiId = upi;
  } else if (checkoutState.payMethod === 'card') {
    const num  = document.getElementById('co-card-num')?.value.replace(/\s/g,'');
    const exp  = document.getElementById('co-card-exp')?.value;
    const cvv  = document.getElementById('co-card-cvv')?.value;
    const name = document.getElementById('co-card-name')?.value.trim();
    if (!num || num.length < 15) { showFieldError(errEl, 'Please enter a valid card number.'); return; }
    if (!exp || !/^\d{2}\/\d{2}$/.test(exp)) { showFieldError(errEl, 'Please enter expiry as MM/YY.'); return; }
    if (!cvv || cvv.length < 3) { showFieldError(errEl, 'Please enter the 3 or 4 digit CVV.'); return; }
    if (!name) { showFieldError(errEl, 'Please enter the name on card.'); return; }
  } else {
    const bank = document.getElementById('co-bank')?.value;
    if (!bank) { showFieldError(errEl, 'Please select your bank to continue.'); return; }
  }

  // Simulate payment processing
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;"><span style="width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;display:inline-block;animation:vs-spin 0.7s linear infinite;"></span>Processing…</span>';
  }
  if (!document.getElementById('vs-spin-style')) {
    const s = document.createElement('style');
    s.id = 'vs-spin-style';
    s.textContent = '@keyframes vs-spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
  setTimeout(() => renderCheckoutStep(4), 2200);
};

function showFieldError(el, msg) {
  if (!el) return;
  el.style.display = 'block';
  el.textContent = '⚠ ' + msg;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
}

/* ─────────────────────────────────────────────────────────
   5. CONTACT SALES MODAL
───────────────────────────────────────────────────────── */
function openContactSales(source) {
  let title = 'Talk to our Sales Team';
  let subtitle = 'For Agency plan enquiries, custom pricing & enterprise onboarding';
  let defaultMsg = '';

  if (source === 'meta-ads') {
    title = 'Meta Ads Management';
    subtitle = 'Campaign setup, creative variations & budget optimization for Meta (Facebook & Instagram)';
    defaultMsg = 'I want to get started with Meta Ads management for my brand.';
  } else if (source === 'google-ads') {
    title = 'Google Ads Management';
    subtitle = 'Search, display & conversion campaigns managed by Vibodh Signal';
    defaultMsg = 'I want to get started with Google Ads management for my brand.';
  } else if (source === 'linkedin-ads') {
    title = 'LinkedIn Ads Management';
    subtitle = 'B2B audience targeting & sponsored content optimization';
    defaultMsg = 'I want to get started with LinkedIn Ads management for my brand.';
  } else if (source === 'Chatbot Setup') {
    title = 'Website Chatbot Setup';
    subtitle = 'Branded website chatbot with FAQs, service recommendations & team handoff';
    defaultMsg = 'Hi, I am interested in setting up a branded website chatbot for my business. Please send me details on scope and turnaround time.';
  } else if (source && typeof source === 'string' && source !== 'cta' && source !== 'agency') {
    title = source;
    subtitle = 'One-time creative project deliverable handled by our human design team';
    defaultMsg = 'Hi, I am interested in the ' + source + '. Please send me details on scope and turnaround time.';
  }

  const isAgency = (source === 'agency-card' || source === 'agency' || !source || source === 'cta');
  if (isAgency && source === 'agency-card') {
    title = 'Agency Plan Enquiry';
    subtitle = 'Custom multi-brand pricing, dedicated onboarding & tailored SLA';
  }

  const agencyInfoHTML = isAgency ? `
    <div style="background:#F0FDFA; border:1.5px solid #99F6E4; border-radius:10px; padding:12px 14px; margin-bottom:16px;">
      <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#0F9D8A; margin-bottom:6px;">Agency Plan Baseline (Custom Scope)</div>
      <div style="font-size:.8125rem; color:#134E4A; line-height:1.55; display:grid; grid-template-columns:1fr 1fr; gap:4px 12px;">
        <div>&bull; <strong>5+ brands</strong> (Custom)</div>
        <div>&bull; <strong>20+ social profiles</strong></div>
        <div>&bull; <strong>100+ posts / month</strong></div>
        <div>&bull; <strong>800+ AI credits / month</strong> (Custom)</div>
        <div style="grid-column:1/-1;">&bull; <strong>5+ team members</strong> + Advanced workflows</div>
      </div>
    </div>` : '';

  showModal(
    modalHeader(title, subtitle) + `
    <div id="cs-form-wrap">
      <div style="padding:24px 28px;">
        ${agencyInfoHTML}
        <div style="display:flex; gap:12px; margin-bottom:14px;">
          <div style="flex:1;">
            <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Full Name *</label>
            <input id="cs-name" type="text" placeholder="Your name"
              style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; outline:none;" onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
          </div>
          <div style="flex:1;">
            <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Work Email *</label>
            <input id="cs-email" type="email" placeholder="you@company.com"
              style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; outline:none;" onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
          </div>
        </div>

        <div style="display:flex; gap:12px; margin-bottom:14px;">
          <div style="flex:1;">
            <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Company Name *</label>
            <input id="cs-company" type="text" placeholder="Your agency or brand"
              style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; outline:none;" onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
          </div>
          <div style="flex:1;">
            <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Number of Brands</label>
            <select id="cs-brands" style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; background:#fff; outline:none;">
              ${isAgency ? `
              <option value="">Select range (starts from 6)</option>
              <option>6 – 10 brands</option>
              <option>11 – 20 brands</option>
              <option>21 – 50 brands</option>
              <option>50+ brands</option>
              ` : `
              <option value="">Select range</option>
              <option>1 – 5 brands</option>
              <option>6 – 15 brands</option>
              <option>16 – 25 brands</option>
              <option>25+ brands</option>
              `}
            </select>
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Message / Specific Requirements</label>
          <textarea id="cs-msg" rows="3" placeholder="Tell us about your use case, team size, or any specific requirements…"
            style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; resize:vertical; font-family:inherit; outline:none;" onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">${defaultMsg}</textarea>
        </div>

        <div id="cs-error" style="display:none; color:#DC2626; font-size:.8125rem; background:#FEF2F2; border-radius:8px; padding:10px 12px; margin-bottom:14px;"></div>

        <button onclick="submitContactSales()" style="width:100%; padding:13px; background:#243B6B; color:#fff; border:none; border-radius:10px; font-size:.9375rem; font-weight:700; cursor:pointer; transition:background .15s;" onmouseover="this.style.background='#1a2d52'" onmouseout="this.style.background='#243B6B'">
          Send Enquiry →
        </button>
        <div style="text-align:center; font-size:.75rem; color:#78716C; margin-top:10px;">Our team typically responds within 1 business day.</div>
      </div>
    </div>`
  );
}

window.submitContactSales = function() {
  const name    = document.getElementById('cs-name')?.value.trim();
  const email   = document.getElementById('cs-email')?.value.trim();
  const company = document.getElementById('cs-company')?.value.trim();
  const errEl   = document.getElementById('cs-error');
  if (!name)    { showFieldError(errEl, 'Please enter your name.'); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError(errEl, 'Please enter a valid email.'); return; }
  if (!company) { showFieldError(errEl, 'Please enter your company name.'); return; }

  const wrap = document.getElementById('cs-form-wrap');
  if (wrap) wrap.innerHTML = `
    <div style="padding:48px 28px; text-align:center;">
      <div style="width:64px; height:64px; background:linear-gradient(135deg,#243B6B,#0F9D8A); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <h3 style="font-size:1.25rem; font-weight:800; color:#1C1917; margin-bottom:8px;">Enquiry Received! 🙌</h3>
      <p style="color:#78716C; font-size:.9375rem; line-height:1.6;">
        Thanks, <strong>${name}</strong>! Our sales team will reach out to <strong>${email}</strong> within 1 business day.
      </p>
      <button onclick="closeModal()" style="margin-top:24px; padding:11px 28px; background:#243B6B; color:#fff; border:none; border-radius:10px; font-size:.9375rem; font-weight:700; cursor:pointer;">Close</button>
    </div>`;
};

/* ─────────────────────────────────────────────────────────
   6. CREDIT PACK MODAL
───────────────────────────────────────────────────────── */
function openCreditPackModal() {
  // respect the pack pre-selected by the button; fall back to popular
  if (!selectedCreditPack) selectedCreditPack = CREDIT_PACKS[2];
  renderCreditPackModal();
}

function renderCreditPackModal() {
  showModal(
    modalHeader('Top-Up AI Credits', 'Buy additional generation credits — active through your subscription') + `
    <div style="padding:24px 28px;">
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px; margin-bottom:20px;">
        ${CREDIT_PACKS.map((pack, i) => {
          const sel = selectedCreditPack && selectedCreditPack.credits === pack.credits;
          let badgeHTML = '';
          if (pack.popular) {
            badgeHTML = `<span style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:#0F9D8A; color:#fff; font-size:9px; font-weight:700; padding:2px 8px; border-radius:99px; white-space:nowrap;">⭐ Popular</span>`;
          } else if (pack.discount) {
            const badgeBg = pack.credits === 1000 ? '#7C3AED' : '#243B6B';
            badgeHTML = `<span style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:${badgeBg}; color:#fff; font-size:9px; font-weight:700; padding:2px 8px; border-radius:99px; white-space:nowrap;">${pack.discount}</span>`;
          }
          return `
            <div onclick="selectCreditPack(${i})" id="cp-card-${i}"
              style="padding:14px 12px; border:${sel?'2px solid #0F9D8A':'1.5px solid #E7E5E4'}; border-radius:10px; cursor:pointer; text-align:center; background:${sel?'#F0FDFA':'#fff'}; position:relative; transition:all .15s;">
              ${badgeHTML}
              <div style="font-size:1rem; font-weight:800; color:${sel?'#0F9D8A':'#1C1917'};">${pack.label}</div>
              <div style="font-size:1.125rem; font-weight:700; color:#243B6B; margin-top:4px;">${formatINR(pack.price)}</div>
              <div style="font-size:.7rem; color:#78716C; margin-top:2px;">₹${(pack.price/pack.credits).toFixed(1)}/credit</div>
            </div>`;
        }).join('')}
      </div>

      <div style="background:#F8FAFC; border:1px solid #E7E5E4; border-radius:10px; padding:12px 14px; margin-bottom:16px;">
        <div style="font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#78716C; margin-bottom:8px;">Credit Consumption Guide</div>
        <table style="width:100%; border-collapse:collapse; font-size:.8125rem;">
          <thead>
            <tr style="border-bottom:1px solid #E2E8F0; color:#1C1917; font-weight:700;">
              <th style="text-align:left; padding:4px 0;">Content Type</th>
              <th style="text-align:right; padding:4px 0;">Example Credits</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="padding:4px 0; color:#475569;">Standard AI image</td><td style="text-align:right; font-weight:700; color:#243B6B;">1</td></tr>
            <tr><td style="padding:4px 0; color:#475569;">High-quality image</td><td style="text-align:right; font-weight:700; color:#243B6B;">2</td></tr>
            <tr style="border-top:1px dashed #E2E8F0;"><td style="padding:5px 0 3px; color:#475569;">10-sec video</td><td style="text-align:right; font-weight:700; color:#243B6B;">10</td></tr>
            <tr><td style="padding:4px 0; color:#475569;">15-sec video</td><td style="text-align:right; font-weight:700; color:#243B6B;">15</td></tr>
            <tr><td style="padding:4px 0; color:#475569;">30 sec video</td><td style="text-align:right; font-weight:700; color:#243B6B;">30</td></tr>
          </tbody>
        </table>
      </div>

      <div id="cp-summary" style="background:#F8FAFC; border:1px solid #E7E5E4; border-radius:10px; padding:14px 16px; margin-bottom:16px;">
        ${renderCreditSummaryHTML()}
      </div>

      <div style="font-size:.75rem; color:#78716C; text-align:center; margin-bottom:16px;">
        Credits are valid through your active subscription and don't expire monthly.
      </div>

      <button onclick="completeCreditPurchase()" style="width:100%; padding:13px; background:#0F9D8A; color:#fff; border:none; border-radius:10px; font-size:.9375rem; font-weight:700; cursor:pointer; transition:background .15s;" onmouseover="this.style.background='#0c8170'" onmouseout="this.style.background='#0F9D8A'">
        Buy ${selectedCreditPack ? selectedCreditPack.label : 'Credits'} →
      </button>
      <button onclick="closeModal()" style="width:100%; padding:10px; background:none; border:none; color:#78716C; font-size:.8125rem; cursor:pointer; margin-top:6px;">Cancel</button>
    </div>`
  );
}

function renderCreditSummaryHTML() {
  if (!selectedCreditPack) return '<div style="color:#78716C;font-size:.875rem;">Select a pack above</div>';
  const p = selectedCreditPack;
  const gst = Math.round(p.price * 0.18);
  return `
    <div style="font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#78716C; margin-bottom:10px;">Selected Pack</div>
    <div style="display:flex; justify-content:space-between; font-size:.875rem; margin-bottom:6px;">
      <span style="color:#44403C;">${p.label}</span>
      <span style="font-weight:600;">${formatINR(p.price)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:.8125rem; color:#78716C; margin-bottom:8px;">
      <span>GST @ 18%</span>
      <span>${formatINR(gst)}</span>
    </div>
    <div style="border-top:1px solid #E7E5E4; padding-top:8px; display:flex; justify-content:space-between; font-size:1rem; font-weight:800; color:#0F9D8A;">
      <span>Total</span>
      <span>${formatINR(p.price + gst)}</span>
    </div>`;
}

window.selectCreditPack = function(idx) {
  selectedCreditPack = CREDIT_PACKS[idx];
  // Update card borders
  CREDIT_PACKS.forEach((_, i) => {
    const card = document.getElementById('cp-card-' + i);
    if (!card) return;
    const sel = i === idx;
    card.style.borderColor = sel ? '#0F9D8A' : '#E7E5E4';
    card.style.borderWidth  = sel ? '2px' : '1.5px';
    card.style.background   = sel ? '#F0FDFA' : '#fff';
    card.querySelector('div').style.color = sel ? '#0F9D8A' : '#1C1917';
  });
  const sumEl = document.getElementById('cp-summary');
  if (sumEl) sumEl.innerHTML = renderCreditSummaryHTML();
  const buyBtn = document.querySelector('[onclick="completeCreditPurchase()"]');
  if (buyBtn) buyBtn.textContent = 'Buy ' + selectedCreditPack.label + ' →';
};

window.completeCreditPurchase = function() {
  if (!selectedCreditPack) return;
  const p = selectedCreditPack;
  const gst = Math.round(p.price * 0.18);
  showModal(
    modalHeader('Credits Added! ⚡') + `
    <div style="padding:40px 28px; text-align:center;">
      <div style="width:64px; height:64px; background:linear-gradient(135deg,#F59E0B,#F97316); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
        <span style="font-size:28px;">⚡</span>
      </div>
      <h3 style="font-size:1.25rem; font-weight:800; color:#1C1917; margin-bottom:8px;">${p.label} Added!</h3>
      <p style="color:#78716C; font-size:.9375rem; margin-bottom:20px;">Your workspace has been topped up with <strong>${p.label}</strong>. Credits are ready to use immediately.</p>
      <div style="background:#FFF7ED; border:1px solid #FED7AA; border-radius:10px; padding:12px 16px; font-size:.8125rem; color:#92400E; margin-bottom:24px;">
        Amount charged: <strong>${formatINR(p.price + gst)}</strong> (incl. 18% GST)
      </div>
      <button onclick="closeModal()" style="width:100%; padding:13px; background:#243B6B; color:#fff; border:none; border-radius:10px; font-size:.9375rem; font-weight:700; cursor:pointer;">
        Done ✓
      </button>
    </div>`
  );
};

/* ─────────────────────────────────────────────────────────
   7. LOGIN MODAL
───────────────────────────────────────────────────────── */
function openLoginModal() {
  showModal(
    modalHeader('Sign in to Vibodh Signal', 'Welcome back — access your AI marketing workspace') + `
    <div style="padding:24px 28px;">
      <div style="margin-bottom:14px;">
        <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Email address</label>
        <input id="li-email" type="email" placeholder="you@yourbrand.in"
          style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; outline:none;" onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
      </div>
      <div style="margin-bottom:6px;">
        <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Password</label>
        <div style="position:relative;">
          <input id="li-pwd" type="password" placeholder="Enter your password"
            style="width:100%; padding:10px 40px 10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; outline:none;" onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
          <button onclick="let i=document.getElementById('li-pwd');i.type=i.type==='password'?'text':'password';this.textContent=i.type==='password'?'👁':'🔒'"
            style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:14px; color:#78716C;">👁</button>
        </div>
      </div>
      <div style="text-align:right; margin-bottom:20px;">
        <a href="#" onclick="openForgotPassword();return false;" style="font-size:.8125rem; color:#243B6B; font-weight:500; text-decoration:none;">Forgot password?</a>
      </div>

      <div id="li-error" style="display:none; color:#DC2626; font-size:.8125rem; background:#FEF2F2; border-radius:8px; padding:10px 12px; margin-bottom:14px;"></div>

      <button onclick="submitLogin()" style="width:100%; padding:13px; background:#243B6B; color:#fff; border:none; border-radius:10px; font-size:.9375rem; font-weight:700; cursor:pointer;" onmouseover="this.style.background='#1a2d52'" onmouseout="this.style.background='#243B6B'">
        Sign In
      </button>

      <div style="text-align:center; margin-top:20px; font-size:.875rem; color:#78716C;">
        Don't have an account?
        <a href="#pricing" onclick="closeModal()" style="color:#0F9D8A; font-weight:600; text-decoration:none;">Get Started →</a>
      </div>
    </div>`
  );
}

window.submitLogin = function() {
  const email = document.getElementById('li-email')?.value.trim();
  const pwd   = document.getElementById('li-pwd')?.value;
  const errEl = document.getElementById('li-error');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError(errEl, 'Please enter a valid email address.'); return; }
  if (!pwd || pwd.length < 6) { showFieldError(errEl, 'Please enter your password (min 6 characters).'); return; }
  showModal(
    modalHeader('Signing you in…') + `
    <div style="padding:48px 28px; text-align:center;">
      <div style="width:48px; height:48px; border:3px solid #E7E5E4; border-top-color:#243B6B; border-radius:50%; margin:0 auto 20px; animation:vs-spin .7s linear infinite;"></div>
      <p style="color:#78716C;">Verifying your credentials…</p>
    </div>`
  );
  if (!document.getElementById('vs-spin-style')) {
    const s = document.createElement('style'); s.id='vs-spin-style';
    s.textContent='@keyframes vs-spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
  setTimeout(() => {
    showModal(
      modalHeader('Welcome back! 👋') + `
      <div style="padding:40px 28px; text-align:center;">
        <div style="width:64px; height:64px; background:linear-gradient(135deg,#243B6B,#0F9D8A); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px;">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h3 style="font-size:1.25rem; font-weight:800; color:#1C1917; margin-bottom:8px;">Signed In Successfully</h3>
        <p style="color:#78716C; margin-bottom:24px;">Redirecting you to your dashboard…</p>
        <button onclick="closeModal()" style="padding:11px 28px; background:#243B6B; color:#fff; border:none; border-radius:10px; font-size:.9375rem; font-weight:700; cursor:pointer;">Go to Dashboard</button>
      </div>`
    );
  }, 1800);
};

window.openForgotPassword = function() {
  showModal(
    modalHeader('Reset Your Password', 'Enter your email to receive a reset link') + `
    <div style="padding:24px 28px;">
      <div style="margin-bottom:16px;">
        <label style="display:block; font-size:.8125rem; font-weight:600; color:#44403C; margin-bottom:6px;">Email address</label>
        <input id="fp-email" type="email" placeholder="you@yourbrand.in"
          style="width:100%; padding:10px 12px; border:1.5px solid #E7E5E4; border-radius:8px; font-size:.875rem; outline:none;" onfocus="this.style.borderColor='#243B6B'" onblur="this.style.borderColor='#E7E5E4'">
      </div>
      <div id="fp-error" style="display:none; color:#DC2626; font-size:.8125rem; background:#FEF2F2; border-radius:8px; padding:10px 12px; margin-bottom:14px;"></div>
      <button onclick="
        const e=document.getElementById('fp-email').value.trim();
        const err=document.getElementById('fp-error');
        if(!e||!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(e)){err.style.display='block';err.textContent='Please enter a valid email.';return;}
        document.querySelector('[onclick*=fp-email]').closest('div').innerHTML='<div style=text-align:center;padding:20px><p style=color:#78716C;font-size:.9375rem>✉️ Reset link sent to <strong>'+e+'</strong>.<br>Check your inbox.</p><button onclick=closeModal() style=margin-top:16px;padding:10px 24px;background:#243B6B;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer>Done</button></div>';
      " style="width:100%; padding:13px; background:#243B6B; color:#fff; border:none; border-radius:10px; font-size:.9375rem; font-weight:700; cursor:pointer;">
        Send Reset Link
      </button>
      <button onclick="openLoginModal()" style="width:100%; padding:10px; background:none; border:none; color:#78716C; font-size:.8125rem; cursor:pointer; margin-top:6px;">← Back to Sign In</button>
    </div>`
  );
};

/* ─────────────────────────────────────────────────────────
   7.5 AD MANAGEMENT CALCULATOR
───────────────────────────────────────────────────────── */
function updateAdCalc(platform) {
  const slider = document.getElementById('slider-' + platform);
  if (!slider) return;
  const budget = Number(slider.value);
  const fee = Math.round(budget * 0.10);
  const total = budget + fee;

  const budgetDisp = document.getElementById('ad-budget-display-' + platform);
  const budgetVal  = document.getElementById('ad-budget-val-' + platform);
  const mgmtVal    = document.getElementById('ad-mgmt-val-' + platform);
  const totalVal   = document.getElementById('ad-total-val-' + platform);

  if (budgetDisp) budgetDisp.innerHTML = formatINR(budget);
  if (budgetVal)  budgetVal.innerHTML  = formatINR(budget);
  if (mgmtVal)    mgmtVal.innerHTML    = formatINR(fee);
  if (totalVal)   totalVal.innerHTML   = formatINR(total);
}

/* ─────────────────────────────────────────────────────────
   7.6 CREDIT TOP-UP SLIDER
───────────────────────────────────────────────────────── */
function updateCreditSlider(index) {
  const idx = Number(index);
  selectedCreditPack = CREDIT_PACKS[idx] || CREDIT_PACKS[2];
  const p = selectedCreditPack;

  const numEl = document.getElementById('cs-credits-num');
  const priceEl = document.getElementById('cs-price-num');
  const rateEl = document.getElementById('cs-rate-label');
  const tagEl = document.getElementById('cs-popular-tag');
  const buyBtn = document.getElementById('credit-slider-buy-btn');

  if (numEl) numEl.textContent = p.credits.toLocaleString('en-IN');
  if (priceEl) priceEl.innerHTML = '\u20B9' + p.price.toLocaleString('en-IN');
  if (rateEl) {
    const perCredit = (p.price / p.credits).toFixed(1);
    let note = '';
    if (p.credits === 50) {
      note = 'Base rate (\u20B910 / credit)';
    } else if (p.credits === 1000) {
      note = '17% OFF vs \u20B910 base rate &bull; Best value';
    } else if (p.popular) {
      note = '10% OFF &bull; Best value for growth';
    } else if (p.discount) {
      note = `${p.discount} vs base rate`;
    } else {
      note = 'Instant top-up';
    }
    rateEl.innerHTML = '&#8377;' + perCredit + ' / credit &bull; ' + note;
  }
  if (tagEl) {
    if (p.popular) {
      tagEl.style.visibility = 'visible';
      tagEl.textContent = '★ Popular';
      tagEl.style.background = 'var(--teal)';
    } else if (p.discount) {
      tagEl.style.visibility = 'visible';
      tagEl.textContent = p.discount;
      tagEl.style.background = p.credits === 1000 ? '#7C3AED' : '#243B6B';
    } else {
      tagEl.style.visibility = 'hidden';
    }
  }
  if (buyBtn) {
    buyBtn.innerHTML = 'Buy ' + p.label + ' &#8212; &#8377;' + p.price.toLocaleString('en-IN');
  }
}

function setCreditSlider(idx) {
  const slider = document.getElementById('credit-slider-input');
  if (slider) {
    slider.value = idx;
    updateCreditSlider(idx);
  }
}

function buyCreditSliderPack() {
  const slider = document.getElementById('credit-slider-input');
  const idx = slider ? Number(slider.value) : 2;
  selectedCreditPack = CREDIT_PACKS[idx] || CREDIT_PACKS[2];
  openCreditPackModal();
}

/* ─────────────────────────────────────────────────────────
   7.7 AD MANAGEMENT SCOPE & CONDITIONS MODAL
───────────────────────────────────────────────────────── */
function openAdScopeModal() {
  showModal(
    modalHeader('Ad Management Scope &amp; Conditions', 'Clear breakdown of services included under the 10% management fee versus direct advertising platform costs') + `
    <div style="padding:22px 26px;">
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(270px, 1fr)); gap:18px; margin-bottom:18px;">

        <!-- Included Column -->
        <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:18px;">
          <div style="display:flex; align-items:center; gap:8px; font-size:.9rem; font-weight:800; color:#166534; margin-bottom:12px;">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; background:#166534; color:#fff; border-radius:50%; font-size:12px;">&#10003;</span>
            What &lsquo;Ad Management&rsquo; Includes
          </div>
          <p style="font-size:.75rem; color:#15803D; margin-bottom:12px; line-height:1.4;">Covered in full by your 10% Vibodh Signal management fee:</p>
          <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; font-size:.8125rem; color:#14532D; line-height:1.45;">
            <li style="display:flex; gap:8px;">
              <span style="color:#16a34a; font-weight:bold;">&#8226;</span>
              <span><strong>Campaign Architecture &amp; Setup:</strong> Account setup, campaign structure, conversion tracking &amp; objective alignment.</span>
            </li>
            <li style="display:flex; gap:8px;">
              <span style="color:#16a34a; font-weight:bold;">&#8226;</span>
              <span><strong>Audience Targeting:</strong> Segment buildout using your brand's customer personas, demographics, interests &amp; location data.</span>
            </li>
            <li style="display:flex; gap:8px;">
              <span style="color:#16a34a; font-weight:bold;">&#8226;</span>
              <span><strong>Creative &amp; Copy Preparation:</strong> Compelling ad copy drafts and image variations utilizing your plan's included content quota.</span>
            </li>
            <li style="display:flex; gap:8px;">
              <span style="color:#16a34a; font-weight:bold;">&#8226;</span>
              <span><strong>Campaign Monitoring:</strong> Regular monitoring of delivery health, click-through rates (CTR) &amp; frequency pacing.</span>
            </li>
            <li style="display:flex; gap:8px;">
              <span style="color:#16a34a; font-weight:bold;">&#8226;</span>
              <span><strong>Budget &amp; Schedule Tuning:</strong> Bid pacing and schedule adjustments within your agreed limits to maximize ROI.</span>
            </li>
            <li style="display:flex; gap:8px;">
              <span style="color:#16a34a; font-weight:bold;">&#8226;</span>
              <span><strong>Performance Reporting:</strong> Transparent reports on impressions, clicks, leads, conversions &amp; estimated ROAS.</span>
            </li>
            <li style="display:flex; gap:8px;">
              <span style="color:#16a34a; font-weight:bold;">&#8226;</span>
              <span><strong>Strategic Recommendations:</strong> Practical guidance on refining ad copy, visual assets &amp; high-performing funnels.</span>
            </li>
          </ul>
        </div>

        <!-- Excluded Column -->
        <div style="background:#FFF1F2; border:1px solid #FECDD3; border-radius:12px; padding:18px;">
          <div style="display:flex; align-items:center; gap:8px; font-size:.9rem; font-weight:800; color:#9F1239; margin-bottom:12px;">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; background:#9F1239; color:#fff; border-radius:50%; font-size:12px;">&#10005;</span>
            What Is NOT Included
          </div>
          <p style="font-size:.75rem; color:#BE123C; margin-bottom:12px; line-height:1.4;">External costs or out-of-scope services billed separately:</p>
          <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; font-size:.8125rem; color:#881337; line-height:1.45;">
            <li style="display:flex; gap:8px;">
              <span style="color:#e11d48; font-weight:bold;">&#8226;</span>
              <span><strong>Direct Media / Ad Spend:</strong> The actual advertising budget paid directly to Meta, Google, LinkedIn or other ad networks.</span>
            </li>
            <li style="display:flex; gap:8px;">
              <span style="color:#e11d48; font-weight:bold;">&#8226;</span>
              <span><strong>Influencer &amp; Creator Fees:</strong> Any third-party creator payments, sponsored content fees or partnership contracts.</span>
            </li>
            <li style="display:flex; gap:8px;">
              <span style="color:#e11d48; font-weight:bold;">&#8226;</span>
              <span><strong>On-Site Shoots &amp; Studio Production:</strong> Large-scale professional photography sessions, physical video shoots or actor hiring.</span>
            </li>
            <li style="display:flex; gap:8px;">
              <span style="color:#e11d48; font-weight:bold;">&#8226;</span>
              <span><strong>Premium Stock Licensing:</strong> Specialized third-party commercial stock footage, photography or music requiring custom licenses.</span>
            </li>
            <li style="display:flex; gap:8px;">
              <span style="color:#e11d48; font-weight:bold;">&#8226;</span>
              <span><strong>Out-of-Scope Consulting:</strong> Specialist advertising consultancy, market research or advisory beyond your plan's campaign limits.</span>
            </li>
          </ul>
        </div>

      </div>

      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; font-size:.8125rem; color:#475569; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <div>
          <span style="font-weight:700; color:#1E293B;">Need Done-For-You Design?</span> Logo design, brand kits, and landing pages are available as fixed-price one-time deliverables under the <strong>Add-Ons</strong> tab.
        </div>
        <button type="button" onclick="closeModal(); switchTab('addons');" style="background:#243B6B; color:#fff; border:none; padding:7px 14px; border-radius:6px; font-size:.75rem; font-weight:700; cursor:pointer;">
          Explore Add-Ons &rarr;
        </button>
      </div>

      <div style="margin-top:16px; display:flex; justify-content:flex-end;">
        <button type="button" onclick="closeModal()" style="padding:10px 24px; background:#F1F5F9; color:#334155; border:1px solid #CBD5E1; border-radius:8px; font-size:.875rem; font-weight:600; cursor:pointer;">
          Close
        </button>
      </div>
    </div>`,
    { width: '700px' }
  );
}

/* ─────────────────────────────────────────────────────────
   8. EXPOSE GLOBALS
───────────────────────────────────────────────────────── */
window.closeModal          = closeModal;
window.openCheckout        = openCheckout;
window.openContactSales    = openContactSales;
window.openCreditPackModal  = openCreditPackModal;
window.openLoginModal      = openLoginModal;
window.openAdScopeModal    = openAdScopeModal;
window.renderCheckoutStep  = renderCheckoutStep;
window.updateAdCalc        = updateAdCalc;
window.updateCreditSlider  = updateCreditSlider;
window.setCreditSlider     = setCreditSlider;
window.buyCreditSliderPack = buyCreditSliderPack;
window.formatINR           = formatINR;

/* ─────────────────────────────────────────────────────────
   9. DOM READY — WIRE UP ALL BUTTONS
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* ── 9a. Billing Toggle ─────────────────────────────── */
  const billingButtons = document.querySelectorAll('.billing-btn');
  const periodEls      = document.querySelectorAll('.pricing-card:not([data-plan="agency"]) .price-period');
  const subCapEls      = document.querySelectorAll('.pricing-card:not([data-plan="agency"]) .price-sub-caption');

  function updateBillingCycle(cycle) {
    activeCycle = cycle;
    billingButtons.forEach(btn => {
      const match = btn.getAttribute('data-cycle') === cycle;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-pressed', match ? 'true' : 'false');
    });
    Object.keys(PLANS).forEach(planKey => {
      const el = document.querySelector(`[data-plan="${planKey}"] .price-amount`);
      if (!el) return;
      if (planKey === 'agency') {
        el.textContent = 'Custom';
        const agencyPeriod = document.querySelector('[data-plan="agency"] .price-period');
        if (agencyPeriod) agencyPeriod.textContent = '';
        return;
      }
      el.style.opacity = '0';
      setTimeout(() => {
        el.innerHTML = cyclePrice(planKey, cycle);
        el.style.transition = 'opacity .15s';
        el.style.opacity = '1';
      }, 120);
    });
    periodEls.forEach(el => el.textContent = PRICING_DATA[cycle].periodLabel);
    subCapEls.forEach(el => el.textContent = PRICING_DATA[cycle].subCaption);
  }

  billingButtons.forEach(btn => {
    btn.addEventListener('click', () => updateBillingCycle(btn.getAttribute('data-cycle')));
  });
  updateBillingCycle('monthly');

  /* ── 9b. Plan "Get Started" buttons ─────────────────── */
  document.querySelectorAll('.card-cta-btn').forEach(btn => {
    const card = btn.closest('[data-plan]');
    if (!card) return;
    const planKey = card.getAttribute('data-plan');
    if (planKey === 'agency') {
      btn.addEventListener('click', e => { e.preventDefault(); openContactSales('agency-card'); });
    } else {
      btn.addEventListener('click', e => { e.preventDefault(); openCheckout(planKey); });
    }
  });

  /* ── 9c. Credit "Add pack" / "Popular top-up" buttons ── */
  document.querySelectorAll('.credit-buy-btn').forEach((btn, idx) => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      selectedCreditPack = CREDIT_PACKS[idx] || CREDIT_PACKS[2];
      openCreditPackModal();
    });
  });

  /* ── 9d. Tab buttons ────────────────────────────────── */
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  /* ── 9d-2. Ad Management Platform Sub-Tabs & Sliders ─── */
  document.querySelectorAll('.ad-tab-btn[data-platform]').forEach(btn => {
    btn.addEventListener('click', () => {
      const plat = btn.getAttribute('data-platform');
      document.querySelectorAll('.ad-tab-btn').forEach(b => b.classList.toggle('is-active', b === btn));
      document.querySelectorAll('.ad-platform-panel').forEach(p => p.classList.toggle('is-active', p.id === 'adp-' + plat));
      updateAdCalc(plat);
    });
  });

  // Initialize all ad calculators on load
  ['meta', 'google', 'linkedin'].forEach(plat => updateAdCalc(plat));

  // Initialize credit top-up slider to popular pack (250 credits)
  updateCreditSlider(2);

  /* ── 9d-3. Creative Services Enquire buttons ─────────── */
  document.querySelectorAll('.creative-enquire-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const service = btn.getAttribute('data-service') || 'Creative Services';
      openContactSales(service);
    });
  });

  /* ── 9e. Nav links with data-tab ────────────────────── */
  document.querySelectorAll('[data-tab]').forEach(el => {
    if (el.classList.contains('tab-btn')) return; // already handled above
    el.addEventListener('click', e => {
      const tab = el.getAttribute('data-tab');
      if (tab) { e.preventDefault(); switchTab(tab); }
    });
  });

  /* ── 9f. CTA buttons ─────────────────────────────────── */
  document.getElementById('cta-start-btn')?.addEventListener('click', () => openCheckout('pro'));
  document.getElementById('cta-sales-btn')?.addEventListener('click', () => openContactSales('cta'));

  /* ── 9g. Nav: Log In / Get Started ──────────────────── */
  document.getElementById('nav-login-btn')?.addEventListener('click',      () => openLoginModal());
  document.getElementById('nav-getstarted-btn')?.addEventListener('click', () => openCheckout('pro'));

  /* ── 9ga. PS Avatar Click → Landing Page ──────────────── */
  document.querySelectorAll('.sidebar-avatar, .topbar-avatar, #sidebar-user-avatar, #topbar-user-avatar').forEach(avatar => {
    avatar.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'landing.html';
    });
  });

  /* ── 9g. FAQ Accordion ───────────────────────────────── */
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q-btn, .faq-question-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach(x => {
        x.classList.remove('is-open');
        x.querySelector('.faq-q-btn, .faq-question-btn')?.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });
  });

  /* ── 9h. Mobile Sidebar Drawer ───────────────────────── */
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle-btn');
  const sidebarClose = document.getElementById('sidebar-close-btn');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  function openSidebar() {
    sidebar?.classList.add('is-open');
    sidebarBackdrop?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('is-open');
    sidebarBackdrop?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  sidebarToggle?.addEventListener('click', e => {
    e.stopPropagation();
    openSidebar();
  });
  sidebarClose?.addEventListener('click', closeSidebar);
  sidebarBackdrop?.addEventListener('click', closeSidebar);

  /* ── 9i. Side Panel Multi-View Router ───────────────────── */
  const VIEW_TITLES = {
    'dashboard':        'Dashboard | Vibodh Signal',
    'campaigns':        'Campaigns | Vibodh Signal',
    'content-studio':   'Content Studio | Vibodh Signal',
    'brand-dna':        'Brand DNA | Vibodh Signal',
    'calendar':         'Calendar | Vibodh Signal',
    'analytics':        'Analytics | Vibodh Signal',
    'media-library':    'Media Library | Vibodh Signal',
    'social-channels':  'Social Channels | Vibodh Signal',
    'agency-hub':       'Agency Hub | Vibodh Signal',
    'brand-knowledge':  'Brand Knowledge | Vibodh Signal',
    'activity':         'Activity | Vibodh Signal',
    'billing':          'Pricing & Billing | Vibodh Signal',
    'settings':         'Settings | Vibodh Signal'
  };

  function switchAppView(viewName) {
    if (!viewName) viewName = 'dashboard';
    
    // Normalize aliases
    if (viewName === 'campaign' || viewName === 'campaigns') viewName = 'campaigns';
    if (viewName === 'contentstudio' || viewName === 'content-studio') viewName = 'content-studio';
    if (viewName === 'branddna' || viewName === 'brand-dna') viewName = 'brand-dna';
    if (viewName === 'medialibrary' || viewName === 'media-library') viewName = 'media-library';
    if (viewName === 'socialchannels' || viewName === 'social-channels') viewName = 'social-channels';
    if (viewName === 'agency' || viewName === 'agency-hub') viewName = 'agency-hub';
    if (viewName === 'brandknowledge' || viewName === 'brand-knowledge') viewName = 'brand-knowledge';

    const targetViewEl = document.getElementById('view-' + viewName);
    if (!targetViewEl) {
      console.warn('View container not found for:', viewName);
      return;
    }

    // Toggle active on view containers
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    targetViewEl.classList.add('active');

    // Update active nav item
    document.querySelectorAll('.sidebar .nav-item').forEach(n => {
      const match = n.getAttribute('data-view') === viewName;
      n.classList.toggle('active', match);
    });

    // Update document title and URL hash without reload
    if (VIEW_TITLES[viewName]) {
      document.title = VIEW_TITLES[viewName];
    }
    try {
      history.replaceState(null, '', '#' + viewName);
    } catch (e) {
      window.location.hash = viewName;
    }

    // Reset scroll to top
    const pageContent = document.querySelector('.page-content');
    if (pageContent) pageContent.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.innerWidth <= 900) closeSidebar();
  }
  window.switchAppView = switchAppView;

  // Sidebar item click binding
  document.querySelectorAll('.sidebar .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      if (view) switchAppView(view);
    });
  });

  // Handle URL hash / parameter routing on load
  function initRouting() {
    let initialView = 'dashboard';
    const hash = window.location.hash.replace('#', '').trim();
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');

    if (hash && document.getElementById('view-' + hash)) {
      initialView = hash;
    } else if (viewParam && document.getElementById('view-' + viewParam)) {
      initialView = viewParam;
    } else if (params.get('plan')) {
      initialView = 'billing';
    }

    switchAppView(initialView);
  }

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && document.getElementById('view-' + hash)) {
      switchAppView(hash);
    }
  });

  initRouting();

  window.openSidebar = openSidebar;
  window.closeSidebar = closeSidebar;

  /* ── 9j. Escape key closes modal & sidebar ────────────── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeSidebar();
    }
  });

  // Handle ?plan= query param when arriving from landing.html
  try {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (planParam) {
      if (planParam === 'agency') {
        setTimeout(() => openContactSales('agency-card'), 250);
      } else if (PLANS[planParam]) {
        setTimeout(() => openCheckout(planParam), 250);
      }
    }
  } catch (err) {}
});


/* ─────────────────────────────────────────────────────────
   10. VIEW INTERACTION HANDLERS & MODALS
───────────────────────────────────────────────────────── */

// Toast notification system
function showToast(msg, icon = '&#10003;') {
  const toast = document.getElementById('vs-toast');
  const msgEl = document.getElementById('vs-toast-msg');
  const iconEl = document.getElementById('vs-toast-icon');
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  if (iconEl) iconEl.innerHTML = icon;
  toast.style.display = 'flex';
  toast.style.opacity = '1';
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.style.display = 'none', 250);
  }, 3200);
}
window.showToast = showToast;

function closeAllModals() {
  document.querySelectorAll('.modal-overlay-backdrop').forEach(m => m.style.display = 'none');
  document.querySelectorAll('.custom-picker-modal-overlay').forEach(m => m.style.display = 'none');
  const guardModal = document.getElementById('modal-guardrail-checker');
  if (guardModal) guardModal.style.display = 'none';
  const postPrevModal = document.getElementById('modal-post-preview');
  if (postPrevModal) postPrevModal.style.display = 'none';
}
window.closeAllModals = closeAllModals;

// 10a. Dashboard Quick Creator
let currentQcGoal = 'Brand Awareness';
function setQcGoal(btn, goal) {
  document.querySelectorAll('.qc-goal-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentQcGoal = goal;
}
window.setQcGoal = setQcGoal;

function fillQcPrompt(text) {
  const input = document.getElementById('qc-input');
  if (input) {
    input.value = text;
    input.focus();
  }
}
window.fillQcPrompt = fillQcPrompt;

function generateQuickDraft() {
  const input = document.getElementById('qc-input');
  const btn = document.getElementById('btn-qc-generate');
  const resultBox = document.getElementById('qc-result-box');
  const resultText = document.getElementById('qc-result-text');
  
  const prompt = input?.value?.trim() || 'Announce the launch of Vibodh Signal autonomous AI marketing suite';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="display:inline-block;animation:spin 1s linear infinite;">&#10022;</span> Grounding with Gemini 2.5...';
  }

  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '&#10024; Generate Grounded Draft';
    }
    if (resultBox && resultText) {
      resultText.innerHTML = `<strong>Goal: ${currentQcGoal}</strong><br><br>Ready to transform how your brand operates? Meet <strong>Vibodh Signal</strong> &mdash; the unified autonomous AI workspace that turns fragmented digital marketing into high-velocity growth. &#128640;<br><br>&bull; Grounded Brand DNA with zero voice drift<br>&bull; Multichannel instant rendering across LinkedIn, Meta &amp; X<br>&bull; AES-256 encrypted hardware token security<br><br>Discover the future of digital marketing: <em>vibodhsignal.io/dashboard</em><br><br><strong>#MarketingAutomation #AI #BrandGrowth #VibodhSignal</strong>`;
      resultBox.classList.add('visible');
      showToast('AI Draft generated and calibrated with Brand DNA!', '&#10024;');
    }
  }, 750);
}
window.generateQuickDraft = generateQuickDraft;

function copyQcDraft() {
  const resultText = document.getElementById('qc-result-text');
  if (resultText) {
    navigator.clipboard?.writeText(resultText.innerText).then(() => {
      showToast('Draft text copied to clipboard!');
    }).catch(() => {
      showToast('Copied text!');
    });
  }
}
window.copyQcDraft = copyQcDraft;

// 10b. Campaigns Modal
function openNewCampaignModal() {
  const m = document.getElementById('modal-new-campaign');
  if (m) m.style.display = 'flex';
}
window.openNewCampaignModal = openNewCampaignModal;

function submitNewCampaign() {
  const name = document.getElementById('inp-camp-name')?.value || 'Q4 Growth Campaign';
  closeAllModals();
  showToast(`Campaign "${name}" created & added to scheduled flight!`, '&#127919;');
}
window.submitNewCampaign = submitNewCampaign;

// 10c. Content Studio Interactions (Redesigned)
function selectCsContentType(card, typeName) {
  document.querySelectorAll('.cs-type-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  const label = document.getElementById('cs-current-format-label');
  if (label) label.innerText = typeName;
  const chip = document.getElementById('cs-preview-format-chip');
  if (chip) chip.innerText = typeName;
  showToast(`Selected format: ${typeName}`, '🎯');
}
window.selectCsContentType = selectCsContentType;

let currentCsStepNum = 1;

function focusCsStep(stepNum) {
  currentCsStepNum = stepNum;
  
  // 1. Update Stepper Header Tabs
  document.querySelectorAll('.cs-stepper-step').forEach(s => s.classList.remove('active'));
  const activeStep = document.getElementById(`step-nav-${stepNum}`);
  if (activeStep) activeStep.classList.add('active');

  // 2. Switch Tab Panels (Step 1, Step 2, Step 3)
  for (let i = 1; i <= 3; i++) {
    const panel = document.getElementById(`cs-tab-panel-${i}`);
    if (panel) {
      if (i === stepNum) {
        panel.style.display = 'block';
        panel.classList.add('active');
      } else {
        panel.style.display = 'none';
        panel.classList.remove('active');
      }
    }
  }

  // 3. Update Save Draft Button in Preview Panel
  const previewSaveBtn = document.getElementById('cs-preview-save-btn');
  if (previewSaveBtn) {
    if (stepNum === 3) {
      previewSaveBtn.style.opacity = '1';
      previewSaveBtn.title = 'Save as draft to Workspace Drafts';
    } else {
      previewSaveBtn.style.opacity = '0.65';
      previewSaveBtn.title = `Save Draft is available in Step 3 (Currently in Step ${stepNum})`;
    }
  }

  // Smooth scroll into view
  const activePanel = document.getElementById(`cs-tab-panel-${stepNum}`);
  if (activePanel) {
    activePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
window.focusCsStep = focusCsStep;

function handleBrandVoiceChange(selectEl) {
  const selectedTone = selectEl.value;
  showToast(`Brand voice tone updated to: ${selectedTone}`, '🧬');
  
  // Also sync the right preview tone badge
  const previewToneChip = document.getElementById('cs-preview-chip-tone');
  if (previewToneChip) {
    previewToneChip.innerText = `🎭 ${selectedTone}`;
  }
}
window.handleBrandVoiceChange = handleBrandVoiceChange;

function setCsTonePill(btn) {
  document.querySelectorAll('.cs-tone-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`Voice tone set to: ${btn.innerText}`, '🎙️');
}
window.setCsTonePill = setCsTonePill;

function handleTrendCardClick(card, headline, snippet, angle) {
  const details = card.querySelector('.cs-news-trend-details');
  const arrow = card.querySelector('.cs-trend-toggle-arrow');
  const isCurrentlyOpen = details && details.style.display !== 'none';

  // If already open, clicking can collapse it
  if (isCurrentlyOpen) {
    details.style.display = 'none';
    if (arrow) arrow.innerText = '▸';
    card.classList.remove('active');
    return;
  }

  // Otherwise, collapse any other open trend cards and expand this one
  document.querySelectorAll('.cs-news-trend-card').forEach(c => {
    c.classList.remove('active');
    const d = c.querySelector('.cs-news-trend-details');
    const a = c.querySelector('.cs-trend-toggle-arrow');
    if (d) d.style.display = 'none';
    if (a) a.innerText = '▸';
  });

  // Open this card
  card.classList.add('active');
  if (details) details.style.display = 'block';
  if (arrow) arrow.innerText = '▾';

  // Load into brief and preview
  const headlineInput = document.getElementById('cs-topic-input');
  if (headlineInput) headlineInput.value = headline;
  
  const summaryInput = document.getElementById('cs-summary-input');
  if (summaryInput) summaryInput.value = snippet;

  const angleDesc = document.getElementById('cs-angle-desc-text');
  if (angleDesc && angle) angleDesc.innerText = angle;

  const previewHeadline = document.getElementById('mockup-headline-text');
  if (previewHeadline) previewHeadline.innerText = headline;

  showToast(`Loaded & expanded: ${headline.slice(0, 38)}...`, '⚡');
}
window.handleTrendCardClick = handleTrendCardClick;

function selectNewsTrend(card, headline, snippet, angle) {
  handleTrendCardClick(card, headline, snippet, angle);
}
window.selectNewsTrend = selectNewsTrend;

function filterCsTrendCards(query) {
  const q = (query || '').toLowerCase().trim();
  const cards = document.querySelectorAll('.cs-news-trend-card');
  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(q) ? 'block' : 'none';
  });
}
window.filterCsTrendCards = filterCsTrendCards;

function triggerScanLiveTrends() {
  const icon = document.querySelector('.cs-scan-live-btn .cs-refresh-icon');
  if (icon) icon.style.display = 'inline-block';
  showToast('Scanning live Google News & industry trends...', '🔄');
  setTimeout(() => {
    showToast('Found 3 high-virality news topics matching your Brand DNA!', '⚡');
  }, 700);
}
window.triggerScanLiveTrends = triggerScanLiveTrends;

function triggerBatchGeneration() {
  showToast('Preparing batch generation package across LinkedIn, Instagram & X...', '⚡');
  setTimeout(() => {
    focusCsStep(3);
    generateContentStudioPackage();
  }, 400);
}
window.triggerBatchGeneration = triggerBatchGeneration;

function updateCsBriefingCharCount(textarea) {
  const count = (textarea.value || '').length;
  const label = document.getElementById('cs-briefing-char-count');
  if (label) {
    label.innerText = `(${count} chars)`;
  }
}
window.updateCsBriefingCharCount = updateCsBriefingCharCount;

function toggleAutoVaultGround(checkbox) {
  const desc = document.getElementById('cs-vault-status-desc');
  const pill = document.getElementById('cs-vault-active-pill');
  if (checkbox.checked) {
    if (desc) desc.innerText = 'Auto-Vault Grounding active: Will retrieve relevant knowledge documents from your vault.';
    if (pill) {
      pill.innerText = '● Smart Reference Active';
      pill.classList.remove('inactive');
    }
    showToast('Auto-Vault Grounding enabled', '📚');
  } else {
    if (desc) desc.innerText = 'Auto-Vault Grounding paused: Content will be generated using standard brand guidelines.';
    if (pill) {
      pill.innerText = '○ Grounding Inactive';
      pill.classList.add('inactive');
    }
    showToast('Auto-Vault Grounding paused', 'ℹ️');
  }
}
window.toggleAutoVaultGround = toggleAutoVaultGround;

function applyTrendTopic(topic) {
  const input = document.getElementById('cs-topic-input');
  if (input) {
    input.value = topic;
    input.focus();
  }
  const headline = document.getElementById('mockup-headline-text');
  if (headline) headline.innerText = topic;
  showToast('Live trend loaded into your content brief!', '🔥');
}
window.applyTrendTopic = applyTrendTopic;

function triggerCsDocUpload() {
  const input = document.getElementById('cs-doc-upload-input');
  if (input) input.click();
}
window.triggerCsDocUpload = triggerCsDocUpload;

function handleCsDocAttached(input) {
  if (input && input.files && input.files[0]) {
    const file = input.files[0];
    const badge = document.getElementById('cs-attached-file-badge');
    const nameSpan = document.getElementById('cs-attached-file-name');
    if (nameSpan) nameSpan.innerText = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    if (badge) badge.style.display = 'flex';
    showToast(`Attached document: ${file.name} for grounding`, '📎');
  }
}
window.handleCsDocAttached = handleCsDocAttached;

function removeCsDocAttached() {
  const badge = document.getElementById('cs-attached-file-badge');
  const input = document.getElementById('cs-doc-upload-input');
  if (badge) badge.style.display = 'none';
  if (input) input.value = '';
  showToast('Document attachment removed', 'ℹ️');
}
window.removeCsDocAttached = removeCsDocAttached;

function toggleAdvancedSettings() {
  const body = document.getElementById('cs-advanced-content-body');
  const arrow = document.getElementById('cs-adv-toggle-arrow');
  if (body) {
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    if (arrow) arrow.innerText = isHidden ? '▾' : '▸';
  }
}
window.toggleAdvancedSettings = toggleAdvancedSettings;

function toggleDraftsBox() {
  const body = document.getElementById('cs-drafts-list-body');
  const arrow = document.getElementById('drafts-accordion-arrow');
  if (body) {
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'flex' : 'none';
    if (arrow) arrow.innerText = isHidden ? '▾' : '▸';
  }
}
window.toggleDraftsBox = toggleDraftsBox;

function loadCsDraft(draftKey) {
  const topicInput = document.getElementById('cs-topic-input');
  const headline = document.getElementById('mockup-headline-text');
  const caption = document.getElementById('mockup-caption-text');
  const angle = document.getElementById('cs-angle-desc-text');
  
  if (draftKey === 'cloud-ai') {
    if (topicInput) topicInput.value = 'Enterprise Cloud Optimization Focuses on AI Token Economics & Inference Costs';
    if (headline) headline.innerText = 'Enterprise Cloud AI Optimization & Inference Economics';
    if (caption) caption.innerText = `Enterprise Cloud Optimization Focuses on AI Token Economics & Inference Costs ⚡\n\nModern CIOs are shifting focus from raw compute to cost-per-inference metrics. Vibodh Signal monitors and optimizes marketing token throughput with enterprise rigor.\n\n✨ 3.8x lower latency\n✨ Zero-leakage Brand DNA grounding\n\nRead our technical whitepaper: vibodhsignal.io/cloud-ai\n#CloudAI #TokenEconomics #FinOps #EnterpriseAI`;
    if (angle) angle.innerText = 'Appeals to enterprise engineering and finance leaders focusing on ROI and cloud unit economics.';
    showToast('Loaded draft: Enterprise Cloud AI Optimization', '📁');
  } else if (draftKey === 'q4-launch') {
    if (topicInput) topicInput.value = 'Q4 Product Launch: Autonomous Multi-Channel Content Workflows';
    if (headline) headline.innerText = 'Next-Gen Autonomous Multi-Channel Workflows';
    if (caption) caption.innerText = `Excited to unveil our Q4 release: Full Multi-Channel Autonomous Publishing 🎉\n\nOrchestrate LinkedIn, Instagram, and X campaigns from a single Brand DNA-grounded canvas.\n\n✨ Instant AI creative resizing\n✨ Real-time trend calibration\n\nExperience the future of marketing: vibodhsignal.io/launch\n#ProductLaunch #MarketingAutomation #VibodhSignal`;
    if (angle) angle.innerText = 'Announcement format driving product trial conversions and feature awareness.';
    showToast('Loaded draft: Q4 Product Launch Announcement', '📁');
  } else if (draftKey === 'growth-framework') {
    if (topicInput) topicInput.value = '10 Rules for Scaling B2B Organic Reach with Grounded AI';
    if (headline) headline.innerText = '10 Rules for Scaling B2B Organic Reach';
    if (caption) caption.innerText = `Slide 1/10: Why generic AI copy fails on LinkedIn.\n\nAudience trust requires voice consistency, domain specifics, and zero buzzwords. Here is the exact framework we used to scale 100k+ impressions monthly.\n\n👉 Save this post for your next content sprint.\n#SaaSGrowth #ContentStrategy #B2BMarketing`;
    if (angle) angle.innerText = 'Educational carousel framework maximizing saves, shares, and engagement.';
    showToast('Loaded draft: SaaS Growth Framework Guide', '📁');
  }
}
window.loadCsDraft = loadCsDraft;

function saveCurrentDraft() {
  showToast('Draft successfully saved to your workspace!', '💾');
}
window.saveCurrentDraft = saveCurrentDraft;

function handleSaveDraftAction() {
  if (currentCsStepNum !== 3) {
    showToast('Drafts can only be saved in Step 3 (Review & Save). Switching you to Step 3...', 'ℹ️');
    focusCsStep(3);
    return;
  }
  saveCurrentDraft();
}
window.handleSaveDraftAction = handleSaveDraftAction;

function regenerateCsHeadline() {
  const topic = document.getElementById('cs-topic-input')?.value || 'Plan • Create • Automate • Grow.';
  const headline = document.getElementById('mockup-headline-text');
  if (headline) {
    headline.innerText = topic;
  }
  showToast('Regenerated fresh angle & creative headline!', '🔄');
}
window.regenerateCsHeadline = regenerateCsHeadline;

function switchMockupTab(btn, platform) {
  document.querySelectorAll('.cs-subnav-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const caption = document.getElementById('mockup-caption-text');
  const leadHeadline = document.getElementById('mockup-headline-lead');
  if (!caption) return;
  
  if (platform === 'li') {
    if (leadHeadline) leadHeadline.innerText = 'Most digital agencies are bleeding margins because they treat AI integration like a side project.';
    caption.innerText = `When you rely on fragmented, non-scalable delivery methods, you aren't just losing time—you're losing your competitive edge. Here are 5 costly mistakes that kill your billable margins, from manual bottlenecks to ignoring compliance.\n\n👉 Schedule a Strategic Consultation to align your AI operations with enterprise standards.\n\n#EnterpriseAI #DigitalAgency #AIEngineering #ScalableSaaS #VibodhAI`;
  } else if (platform === 'ig') {
    if (leadHeadline) leadHeadline.innerText = 'Are hidden operational bottlenecks eating your agency margins? 📉';
    caption.innerText = `Swipe through to see the 5 most common mistakes agencies make when rolling out AI workflows in 2026 👉\n\n1️⃣ Treating prompts like products\n2️⃣ Fragmented tool sprawl\n3️⃣ Lack of brand calibration\n4️⃣ Manual copy-pasting\n5️⃣ Compliance oversights\n\nSave this post for your team sprint! 💡\n#AgencyGrowth #MarketingAI #Operations #SaaS`;
  } else if (platform === 'tw') {
    if (leadHeadline) leadHeadline.innerText = '5 costly mistakes digital agencies make with AI integration (and how to fix them): 🧵';
    caption.innerText = `1/ Agency margins are shrinking not from lack of talent, but fragmented delivery tools.\n\n2/ Vibodh Signal unifies campaign planning, Brand DNA, and autonomous distribution in one place.\n\nRead the full playbook: vibodhsignal.io/playbook`;
  }
  showToast(`Switched preview to ${btn.innerText.trim()}`, '📱');
}
window.switchMockupTab = switchMockupTab;

function updatePromptCharCount(textarea) {
  const counter = document.getElementById('cs-prompt-char-count');
  if (counter) {
    counter.innerText = `${textarea.value.length}/1000`;
  }
}
window.updatePromptCharCount = updatePromptCharCount;

function selectPanelContentType(btn, typeKey) {
  document.querySelectorAll('.cs-type-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  const leadHeadline = document.getElementById('mockup-headline-lead');
  const caption = document.getElementById('mockup-caption-text');
  const formatText = document.getElementById('cs-active-format-standard-text');

  if (typeKey === 'ig') {
    if (formatText) formatText.innerHTML = 'FORMAT STANDARD: <strong>1:1 Square (1080×1080 px)</strong> &bull; Visual Carousel';
    if (leadHeadline) leadHeadline.innerText = 'Are hidden operational bottlenecks eating your agency margins? 📉';
    if (caption) caption.innerText = `Swipe through to see the 5 most common mistakes agencies make when rolling out AI workflows in 2026 👉\n\n1️⃣ Treating prompts like products\n2️⃣ Fragmented tool sprawl\n3️⃣ Lack of brand calibration\n4️⃣ Manual copy-pasting\n5️⃣ Compliance oversights\n\nSave this post for your team sprint! 💡\n#AgencyGrowth #MarketingAI #Operations #SaaS`;
  } else if (typeKey === 'li') {
    if (formatText) formatText.innerHTML = 'FORMAT STANDARD: <strong>1:1 Square (1200×1200 px)</strong> &bull; Copy: 1,200–2,000 chars';
    if (leadHeadline) leadHeadline.innerText = 'Most digital agencies are bleeding margins because they treat AI integration like a side project.';
    if (caption) caption.innerText = `When you rely on fragmented, non-scalable delivery methods, you aren't just losing time—you're losing your competitive edge. Here are 5 costly mistakes that kill your billable margins, from manual bottlenecks to ignoring compliance.\n\n👉 Schedule a Strategic Consultation to align your AI operations with enterprise standards.\n\n#EnterpriseAI #DigitalAgency #AIEngineering #ScalableSaaS #VibodhAI`;
  } else if (typeKey === 'fb') {
    if (formatText) formatText.innerHTML = 'FORMAT STANDARD: <strong>1.91:1 Feed Post (1200×628 px)</strong> &bull; Community Engagement';
    if (leadHeadline) leadHeadline.innerText = 'How leading marketing agencies protect their margins while scaling AI in 2026';
    if (caption) caption.innerText = `Running an agency today means balancing creative excellence with high-speed execution. Here is our breakdown of how enterprise teams streamline content pipelines without ballooning headcount.\n\nDrop your thoughts below: How is your team adapting?`;
  } else if (typeKey === 'prod') {
    if (formatText) formatText.innerHTML = 'FORMAT STANDARD: <strong>Product Feature Brief</strong> &bull; Conversion Focused';
    if (leadHeadline) leadHeadline.innerText = 'Vibodh Signal — Autonomous Digital Marketing Orchestration Platform';
    if (caption) caption.innerText = `Transform ad-hoc marketing campaigns into automated, Brand DNA-grounded growth engines. Real-time trend calibration, multichannel distribution, and autonomous guardrails for high-growth digital teams.`;
  } else if (typeKey === 'ad') {
    if (formatText) formatText.innerHTML = 'FORMAT STANDARD: <strong>Paid Social Ad Copy</strong> &bull; High Click-Through Rate';
    if (leadHeadline) leadHeadline.innerText = 'Stop Wasting 40+ Hours Every Week on Manual Content Distribution';
    if (caption) caption.innerText = `Vibodh Signal unifies real-time trend scanning, multi-agent campaign generation, and autonomous scheduling. Start your 14-day free trial today.`;
  } else {
    if (formatText) formatText.innerHTML = 'FORMAT STANDARD: <strong>Custom Multimodal Post</strong> &bull; Dynamic Layout';
    if (leadHeadline) leadHeadline.innerText = 'Custom Strategic Content Framework';
    if (caption) caption.innerText = `Tailored content generation synchronized with your active brand guidelines and custom notes.`;
  }
  showToast(`Switched content type to ${btn.innerText.trim()}`, '🎯');
}
window.selectPanelContentType = selectPanelContentType;

function applyAiEditInstruction() {
  const input = document.getElementById('cs-ai-edit-instruction-input');
  const text = (input?.value || '').trim();
  if (!text) {
    showToast('Please type an instruction first (e.g. "Make it punchier")', '⚠️');
    return;
  }
  showToast(`Applying AI edit: "${text}"...`, '✨');
  setTimeout(() => {
    const caption = document.getElementById('mockup-caption-text');
    if (caption) {
      caption.innerText = `[Refined by AI]: ${caption.innerText.replace(/#\w+/g, '').trim()}\n\n👉 Let's connect to transform your agency margins!\n\n#VibodhAI #MarketingAutomation`;
    }
    input.value = '';
    showToast('Content successfully updated with AI!', '✅');
  }, 600);
}
window.applyAiEditInstruction = applyAiEditInstruction;

function applyQuickSuggestion(suggestion) {
  const input = document.getElementById('cs-ai-edit-instruction-input');
  if (input) {
    input.value = suggestion;
    input.focus();
  }
  applyAiEditInstruction();
}
window.applyQuickSuggestion = applyQuickSuggestion;

function resetMockupContent() {
  const leadHeadline = document.getElementById('mockup-headline-lead');
  const caption = document.getElementById('mockup-caption-text');
  if (leadHeadline) leadHeadline.innerText = 'Most digital agencies are bleeding margins because they treat AI integration like a side project.';
  if (caption) caption.innerText = `When you rely on fragmented, non-scalable delivery methods, you aren't just losing time—you're losing your competitive edge. Here are 5 costly mistakes that kill your billable margins, from manual bottlenecks to ignoring compliance.\n\n👉 Schedule a Strategic Consultation to align your AI operations with enterprise standards.\n\n#EnterpriseAI #DigitalAgency #AIEngineering #ScalableSaaS #VibodhAI`;
  showToast('Content reset to default generated draft', '↺');
}
window.resetMockupContent = resetMockupContent;

function savePostToLibrary() {
  showToast('Post saved to your Media & Content Asset Library!', '💾');
}
window.savePostToLibrary = savePostToLibrary;

function resetToNewContent() {
  const promptInput = document.getElementById('cs-creation-prompt-input');
  if (promptInput) {
    promptInput.value = '';
    promptInput.placeholder = 'Describe what you want to create today...';
    promptInput.focus();
    updatePromptCharCount(promptInput);
  }
  showToast('Ready for new content creation', '✨');
}
window.resetToNewContent = resetToNewContent;

// ══════════════════════════════════════════════════════════════════════
// MULTI-SELECT PLATFORM TARGETING CONTROLLER
// ══════════════════════════════════════════════════════════════════════
const AVAILABLE_PLATFORMS = [
  {
    id: 'li',
    name: 'LinkedIn',
    color: '#0A66C2',
    bg: '#F0F7FD',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#0A66C2"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z"/></svg>`
  },
  {
    id: 'ig',
    name: 'Instagram',
    color: '#E1306C',
    bg: '#FDF2F7',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
  },
  {
    id: 'tw',
    name: 'Twitter / X',
    color: '#0F172A',
    bg: '#F8FAFC',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#0F172A"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
  },
  {
    id: 'fb',
    name: 'Facebook',
    color: '#1877F2',
    bg: '#F0F6FF',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
  },
  {
    id: 'yt',
    name: 'YouTube',
    color: '#FF0000',
    bg: '#FEF2F2',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
  },
  {
    id: 'th',
    name: 'Threads',
    color: '#0F172A',
    bg: '#F8FAFC',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#0F172A"><path d="M12.186 24C5.467 24 0 18.533 0 11.814 0 5.095 5.467 0 12.186 0c6.643 0 11.968 5.253 12.181 11.888h-3.033c-.206-4.992-4.296-8.99-9.148-8.99-5.068 0-9.186 4.118-9.186 9.186 0 5.068 4.118 9.186 9.186 9.186 3.535 0 6.61-2.007 8.118-4.945l2.673 1.458C20.916 21.657 16.892 24 12.186 24zm1.536-7.854c-1.393 0-2.483-.873-2.483-2.28 0-1.423 1.107-2.31 2.483-2.31 1.408 0 2.513.887 2.513 2.31 0 1.407-1.105 2.28-2.513 2.28z"/></svg>`
  }
];

let selectedPlatformIds = ['li', 'ig', 'tw', 'fb'];
const activePlatformFilter = { text: '', image: '', video: '' };

function renderPlatformMultiselect(mode) {
  const chipsBox = document.getElementById(`cs-chips-box-${mode}`);
  const listEl = document.getElementById(`cs-options-list-${mode}`);
  if (!chipsBox || !listEl) return;

  // 1. Render Selected Chips
  if (selectedPlatformIds.length === 0) {
    chipsBox.innerHTML = `<span class="cs-multiselect-placeholder">Select target platforms...</span>`;
  } else {
    chipsBox.innerHTML = selectedPlatformIds.map(id => {
      const p = AVAILABLE_PLATFORMS.find(item => item.id === id);
      if (!p) return '';
      return `
        <span class="cs-plat-chip" style="background:${p.bg}; border-color:${p.color}40;" title="${p.name}">
          <span class="cs-chip-icon">${p.iconSvg}</span>
          <span class="cs-chip-label">${p.name}</span>
          <span class="cs-chip-remove" onclick="removePlatformChip('${p.id}', '${mode}', event)" title="Remove ${p.name}">&times;</span>
        </span>
      `;
    }).join('');
  }

  // 2. Render Options inside Dropdown
  const query = (activePlatformFilter[mode] || '').toLowerCase().trim();
  const filtered = AVAILABLE_PLATFORMS.filter(p => p.name.toLowerCase().includes(query));

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="cs-dropdown-no-results">No platforms matching "${query}"</div>`;
  } else {
    listEl.innerHTML = filtered.map(p => {
      const isSelected = selectedPlatformIds.includes(p.id);
      return `
        <div class="cs-dropdown-option-item ${isSelected ? 'selected' : ''}" onclick="togglePlatformSelection('${p.id}', '${mode}', event)">
          <div class="cs-option-left">
            <span class="cs-option-logo" style="border-color:${isSelected ? p.color : '#E2E8F0'}">
              ${p.iconSvg}
            </span>
            <span class="cs-option-name" style="${isSelected ? 'color:' + p.color + '; font-weight:700;' : ''}">${p.name}</span>
          </div>
          <span class="cs-option-check">✓</span>
        </div>
      `;
    }).join('');
  }
}
window.renderPlatformMultiselect = renderPlatformMultiselect;

function renderAllPlatformMultiselects() {
  ['text', 'image', 'video'].forEach(m => renderPlatformMultiselect(m));
}
window.renderAllPlatformMultiselects = renderAllPlatformMultiselects;

function togglePlatformDropdown(mode, event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById(`cs-dropdown-${mode}`);
  const parent = document.getElementById(`cs-plat-multiselect-${mode}`);
  if (!dropdown || !parent) return;

  const isOpen = parent.classList.contains('open');

  // Close other open platform dropdowns
  closeAllPlatformDropdowns();

  if (!isOpen) {
    parent.classList.add('open');
    dropdown.style.display = 'block';
    renderPlatformMultiselect(mode);
    const searchInput = document.getElementById(`cs-search-${mode}`);
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 60);
    }
  }
}
window.togglePlatformDropdown = togglePlatformDropdown;

function closeAllPlatformDropdowns() {
  ['text', 'image', 'video'].forEach(m => {
    const d = document.getElementById(`cs-dropdown-${m}`);
    const p = document.getElementById(`cs-plat-multiselect-${m}`);
    if (d) d.style.display = 'none';
    if (p) p.classList.remove('open');
  });
}
window.closeAllPlatformDropdowns = closeAllPlatformDropdowns;

function togglePlatformSelection(platId, mode, event) {
  if (event) event.stopPropagation();
  const idx = selectedPlatformIds.indexOf(platId);
  const plat = AVAILABLE_PLATFORMS.find(p => p.id === platId);
  const name = plat ? plat.name : platId;

  if (idx > -1) {
    selectedPlatformIds.splice(idx, 1);
    showToast(`${name} removed from target channels`, '⚪');
  } else {
    selectedPlatformIds.push(platId);
    showToast(`${name} added to target channels!`, '✅');
  }

  renderAllPlatformMultiselects();
}
window.togglePlatformSelection = togglePlatformSelection;

function removePlatformChip(platId, mode, event) {
  if (event) event.stopPropagation();
  const idx = selectedPlatformIds.indexOf(platId);
  if (idx > -1) {
    selectedPlatformIds.splice(idx, 1);
    const plat = AVAILABLE_PLATFORMS.find(p => p.id === platId);
    showToast(`${plat ? plat.name : platId} removed`, '⚪');
    renderAllPlatformMultiselects();
  }
}
window.removePlatformChip = removePlatformChip;

function filterPlatformOptions(input, mode) {
  activePlatformFilter[mode] = input.value;
  renderPlatformMultiselect(mode);
}
window.filterPlatformOptions = filterPlatformOptions;

function clearPlatformSearch(mode) {
  const searchInput = document.getElementById(`cs-search-${mode}`);
  if (searchInput) searchInput.value = '';
  activePlatformFilter[mode] = '';
  renderPlatformMultiselect(mode);
}
window.clearPlatformSearch = clearPlatformSearch;

function toggleAllPlatforms(mode) {
  if (selectedPlatformIds.length === AVAILABLE_PLATFORMS.length) {
    selectedPlatformIds = [];
    showToast('All channels deselected', '⚪');
  } else {
    selectedPlatformIds = AVAILABLE_PLATFORMS.map(p => p.id);
    showToast('All connected channels selected!', '🎯');
  }
  renderAllPlatformMultiselects();
}
window.toggleAllPlatforms = toggleAllPlatforms;

// Fallback compatibility
function toggleTargetPlatform(btn, platKey) {
  togglePlatformSelection(platKey, 'text');
}
window.toggleTargetPlatform = toggleTargetPlatform;

// Close dropdown on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('.cs-platform-multiselect')) {
    closeAllPlatformDropdowns();
  }
});

function handleToneSelectChange(select) {
  const textDesc = document.getElementById('cs-style-desc-text');
  const selected = select.value;
  if (selected === 'brand-default') {
    if (textDesc) textDesc.innerText = 'Grounded in active Brand Brain voice traits and vocabulary guardrails';
  } else if (selected === 'authoritative') {
    if (textDesc) textDesc.innerText = 'Technical, data-backed insights with industry benchmarks and zero fluff';
  } else if (selected === 'vibrant') {
    if (textDesc) textDesc.innerText = 'High energy, inspirational hook with forward-looking market vision';
  } else if (selected === 'conversational') {
    if (textDesc) textDesc.innerText = 'Approachable, warm tone focused on relatable problems and easy takeaways';
  } else if (selected === 'bold') {
    if (textDesc) textDesc.innerText = 'Challenger perspective addressing common industry myths head-on';
  }
  showToast(`Voice Tone updated to: ${select.options[select.selectedIndex].text}`, '🎙️');
}
window.handleToneSelectChange = handleToneSelectChange;

function generateContentStudioPackage() {
  const mainBtn = document.getElementById('cs-main-gen-btn');
  const headerBtn = document.getElementById('cs-header-gen-btn');
  const topic = document.getElementById('cs-topic-input')?.value || 'OpenAI Launches Autonomous Marketing Agents';
  const headline = document.getElementById('mockup-headline-text');
  
  if (mainBtn) {
    mainBtn.style.opacity = '0.7';
    mainBtn.innerHTML = '<span class="cs-btn-flash">⚡</span> Generating Complete Content Package...';
  }
  if (headerBtn) {
    headerBtn.innerText = 'Generating...';
  }

  setTimeout(() => {
    if (headline) headline.innerText = topic;
    if (mainBtn) {
      mainBtn.style.opacity = '1';
      mainBtn.innerHTML = '<span class="cs-btn-flash">⚡</span> Generate Complete Content Package';
    }
    if (headerBtn) {
      headerBtn.innerText = '✨ Generate Content';
    }
    focusCsStep(3);
    showToast('Generated multi-channel content package synced with Brand DNA!', '⚡');
  }, 600);
}
window.generateContentStudioPackage = generateContentStudioPackage;

function copyMockupCaption() {
  const text = document.getElementById('mockup-caption-text')?.innerText || '';
  navigator.clipboard?.writeText(text).then(() => {
    showToast('Caption copied to clipboard!', '📋');
  }).catch(() => showToast('Caption copied!', '📋'));
}
window.copyMockupCaption = copyMockupCaption;

// ══════════════════════════════════════════════════════════════════════════
// CONTENT STUDIO: 3 TABS (TEXT, IMAGE, VIDEO) CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════
function switchCsMainTab(tabKey) {
  // Update Tab Buttons
  document.querySelectorAll('.cs-main-tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`cs-main-tab-${tabKey}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Update Panels
  const panels = ['text', 'image', 'video'];
  panels.forEach(p => {
    const el = document.getElementById(`cs-view-panel-${p}`);
    if (el) el.style.display = (p === tabKey) ? 'block' : 'none';
  });

  const tabLabels = {
    'text': 'Text Generation & AI Editor',
    'image': 'AI Image Generator',
    'video': 'AI Video Generator'
  };
  showToast(`Switched to ${tabLabels[tabKey] || tabKey}`, '✨');
}
window.switchCsMainTab = switchCsMainTab;

function updateGenPromptCharCount(textarea, counterId) {
  const countEl = document.getElementById(counterId);
  if (countEl) {
    countEl.innerText = `${textarea.value.length}/1000`;
  }
}
window.updateGenPromptCharCount = updateGenPromptCharCount;

function generateTextStudioPackage() {
  const leadHeadline = document.getElementById('mockup-headline-lead');
  const captionText = document.getElementById('mockup-caption-text');
  const btn = document.getElementById('cs-text-gen-btn');

  if (btn) {
    btn.style.opacity = '0.7';
    btn.innerHTML = '<span class="cs-btn-flash">⚡</span> Generating Content with Gemini...';
  }

  setTimeout(() => {
    if (leadHeadline) {
      leadHeadline.innerText = 'Most digital agencies are bleeding margins because they treat AI integration like a side project.';
    }
    if (captionText) {
      captionText.innerText = `When you rely on fragmented, non-scalable delivery methods, you aren't just losing time—you're losing your competitive edge. Here are 5 costly mistakes that kill your billable margins, from manual bottlenecks to ignoring compliance.\n\n1. Lack of Prompt Guardrails causing client rework\n2. Treating AI as an isolated tool instead of an automated pipeline\n3. Unmonitored token & inference spend\n4. Zero brand identity synchronization across assets\n5. Manual distribution without automated queues\n\n👉 Schedule a Strategic Consultation to align your AI operations with enterprise standards.\n\n#EnterpriseAI #DigitalAgency #AIEngineering #ScalableSaaS #VibodhSignal`;
    }
    if (btn) {
      btn.style.opacity = '1';
      btn.innerHTML = '<span class="cs-btn-flash">⚡</span> <span>Generate Content</span> <span class="cs-btn-credit-badge" id="cs-text-credit-badge">⚡ 1 Credit</span>';
    }
    showToast('Marketing text generated and synchronized with Brand DNA!', '⚡');
  }, 500);
}
window.generateTextStudioPackage = generateTextStudioPackage;

function loadTextTopicTrend(headline, snippet) {
  const leadHeadline = document.getElementById('mockup-headline-lead');
  const captionText = document.getElementById('mockup-caption-text');
  if (leadHeadline) leadHeadline.innerText = headline;
  if (captionText) {
    captionText.innerText = `${snippet}\n\nKey takeaways for modern teams:\n• Fast execution across all connected channels\n• Continuous alignment with Brand DNA voice guardrails\n• Single-click publishing directly to LinkedIn, Instagram, X & Facebook\n\n👉 Explore Vibodh Signal to scale automated digital marketing.\n\n#VibodhSignal #MarketingAutomation #DigitalAgency #Growth`;
  }
  showToast(`Loaded trend: ${headline.substring(0, 32)}...`, '🔥');
}
window.loadTextTopicTrend = loadTextTopicTrend;

// Image Generator Controllers
function handleImageAspectSelectChange(select) {
  const selectedOpt = select.options[select.selectedIndex];
  const ratio = selectedOpt.value;
  const desc = selectedOpt.getAttribute('data-desc') || ratio;
  const badgeLabel = selectedOpt.getAttribute('data-badge') || ratio;
  
  const textEl = document.getElementById('cs-selected-ratio-text');
  if (textEl) textEl.innerHTML = desc;
  
  const pillEl = document.getElementById('cs-ratio-pill-indicator');
  if (pillEl) pillEl.innerText = ratio;
  
  const badge = document.getElementById('cs-img-badge-ratio');
  if (badge) badge.innerText = `${badgeLabel}`;
  
  showToast(`Image aspect ratio set to ${ratio}`, '📐');
}
window.handleImageAspectSelectChange = handleImageAspectSelectChange;

function handleImageStyleSelectChange(select) {
  const selectedOpt = select.options[select.selectedIndex];
  const styleName = selectedOpt.value;
  const vibe = selectedOpt.getAttribute('data-vibe') || '';
  const cat = selectedOpt.getAttribute('data-cat') || '';
  
  const textEl = document.getElementById('cs-selected-style-text');
  if (textEl) textEl.innerHTML = `${styleName} &bull; ${vibe}`;
  
  const pillEl = document.getElementById('cs-style-pill-indicator');
  if (pillEl) pillEl.innerText = cat || styleName;
  
  showToast(`Visual style set to ${styleName}`, '🎨');
}
window.handleImageStyleSelectChange = handleImageStyleSelectChange;

function selectImageAspectRatio(btn, ratio, desc) {
  document.querySelectorAll('#cs-view-panel-image .cs-aspect-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const textEl = document.getElementById('cs-selected-ratio-text');
  if (textEl) textEl.innerText = desc;
  const badge = document.getElementById('cs-img-badge-ratio');
  if (badge) badge.innerText = `${ratio} Ratio`;
  showToast(`Image format set to ${ratio}`, '📐');
}
window.selectImageAspectRatio = selectImageAspectRatio;

function selectImageStyle(card, styleName, vibe) {
  document.querySelectorAll('#cs-image-styles-grid .cs-style-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  const textEl = document.getElementById('cs-selected-style-text');
  if (textEl) textEl.innerText = `${styleName} • ${vibe}`;
  showToast(`Style set to ${styleName}`, '🎨');
}
window.selectImageStyle = selectImageStyle;

function filterImageStyles(btn, cat) {
  document.querySelectorAll('.cs-style-cat-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`Showing ${btn.innerText} presets`, '🔍');
}
window.filterImageStyles = filterImageStyles;

function applyImageExamplePrompt(promptText) {
  const input = document.getElementById('cs-image-prompt-input');
  if (input) {
    input.value = promptText;
    updateGenPromptCharCount(input, 'cs-img-counter');
    showToast('Example prompt loaded into editor!', '💡');
  }
}
window.applyImageExamplePrompt = applyImageExamplePrompt;

function cycleImageExamples() {
  const examples = [
    'Ultra-modern digital marketing dashboard interface floating above executive office desk, glowing teal data nodes, volumetric lighting, photorealistic 8K',
    'Futuristic holographic AI agency brain processing social signals, glass spheres, elegant deep navy and emerald gradient reflections',
    'Architectural concept of high-growth creative agency studio, floor-to-ceiling windows, minimal Scandinavian design, cinematic depth of field'
  ];
  const chosen = examples[Math.floor(Math.random() * examples.length)];
  applyImageExamplePrompt(chosen);
}
window.cycleImageExamples = cycleImageExamples;

function generateImageStudioPackage() {
  const btn = document.getElementById('cs-img-gen-btn');
  const mainImg = document.getElementById('cs-main-image-preview');
  const title = document.getElementById('cs-img-display-title');
  const prompt = document.getElementById('cs-image-prompt-input')?.value || 'AI Visual Creative';

  if (btn) {
    btn.style.opacity = '0.7';
    btn.innerHTML = '<span class="cs-btn-flash">🎨</span> Generating Visual Creative...';
  }

  const sampleImages = [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
  ];

  setTimeout(() => {
    if (mainImg) {
      const nextImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
      mainImg.src = nextImg;
    }
    if (title) {
      title.innerText = prompt.substring(0, 32) + '...';
    }
    if (btn) {
      btn.style.opacity = '1';
      const qualitySelect = document.getElementById('cs-image-quality-select');
      const credits = qualitySelect && qualitySelect.value === 'high-quality' ? 2 : 1;
      btn.innerHTML = `<span class="cs-btn-flash">🎨</span> <span>Generate Image Asset</span> <span class="cs-btn-credit-badge" id="cs-img-credit-badge">⚡ ${credits} Credit${credits > 1 ? 's' : ''}</span>`;
    }
    if (typeof promptRefImages !== 'undefined' && promptRefImages.image) {
      showToast(`4K Image generated with reference guidance: "${promptRefImages.image.name}"`, '🎨');
    } else {
      showToast('4K Image asset generated successfully!', '✨');
    }
  }, 600);
}
window.generateImageStudioPackage = generateImageStudioPackage;

function handleImageQualityChange(select) {
  const credits = select.value === 'high-quality' ? 2 : 1;
  const badge = document.getElementById('cs-img-credit-badge');
  if (badge) {
    badge.textContent = `⚡ ${credits} Credit${credits > 1 ? 's' : ''}`;
  }
  showToast(`Image quality set to ${select.options[select.selectedIndex].text.split('(')[0].trim()} (${credits} credit${credits > 1 ? 's' : ''})`, '💎');
}
window.handleImageQualityChange = handleImageQualityChange;

function setMainImagePreview(btn) {
  const card = btn.closest('.cs-media-preview-card');
  const img = card?.querySelector('img');
  const mainImg = document.getElementById('cs-main-image-preview');
  if (img && mainImg) {
    const temp = mainImg.src;
    mainImg.src = img.src;
    img.src = temp;
    showToast('Selected variation promoted to primary canvas!', '🖼️');
  }
}
window.setMainImagePreview = setMainImagePreview;

function saveImageToLibrary() {
  showToast('Image creative saved to Media & Content Asset Library!', '💾');
}
window.saveImageToLibrary = saveImageToLibrary;

// Accompanying Media Caption Regenerators
function regenerateImageCaptionText() {
  const promptInput = document.getElementById('cs-image-prompt-input');
  const styleSelect = document.getElementById('cs-image-style-select');
  const captionInput = document.getElementById('cs-image-caption-input');
  const promptVal = promptInput ? promptInput.value.trim() : '';
  const styleVal = styleSelect ? styleSelect.value : 'Photorealistic';
  
  const options = [
    `Transforming operational complexity into visual clarity. Here's a look at our latest ${styleVal.toLowerCase()} visual asset designed for high-performing marketing teams.\n\n✨ Why this matters:\n• Grounded in verified brand memory & visual consistency\n• Instant generation engineered for multi-channel reach\n• Built to drive quantifiable engagement & authority\n\n👉 Upgrade your creative engine with Vibodh Signal.\n\n#VibodhSignal #VisualMarketing #${styleVal.replace(/\s+/g, '')} #AIEngineering`,
    `A picture is worth a thousand data points. Our ${styleVal.toLowerCase()} rendering engine brings high-impact ideas to life without the typical agency delays.\n\n🚀 Highlights:\n• Automated asset distribution across LinkedIn, IG, X & FB\n• Zero brand dilution across campaigns\n• Scalable 4K creative output\n\n💬 What do you think of this visual approach?\n\n#MarketingAutomation #CreativeOps #GenerativeAI #VibodhAI`,
    `Precision design meets enterprise marketing velocity. Synchronized directly with our brand voice guidelines.\n\nKey Takeaways:\n1. 10x faster turnaround on high-converting social imagery\n2. Real-time alignment with active campaign signals\n3. One-click publishing straight from Content Studio\n\n👉 Learn how Vibodh Signal automates creative workflows.\n\n#B2BMarketing #EnterpriseCreative #AIAgency #GrowthStrategy`
  ];
  
  const randomCaption = options[Math.floor(Math.random() * options.length)];
  if (captionInput) {
    captionInput.value = randomCaption;
    showToast('Accompanying image caption regenerated!', '✨');
  }
}
window.regenerateImageCaptionText = regenerateImageCaptionText;

function regenerateVideoCaptionText() {
  const modeSelect = document.getElementById('cs-video-mode-select');
  const captionInput = document.getElementById('cs-video-caption-input');
  
  const modeOpt = modeSelect ? modeSelect.options[modeSelect.selectedIndex].text.split('•')[0].trim() : 'AI Reels';
  const durationVal = document.getElementById('cs-duration-range-input')?.value || '15';
  
  const options = [
    `Stop letting operational bottlenecks eat away at your client margins! 📉\n\nIn this quick ${durationVal}-second breakdown, see how digital agencies are switching to unified AI workflows to automate content distribution, maintain 100% brand fidelity, and reclaim 20+ billable hours every week.\n\n👇 Drop a comment or tap the link in bio to deploy the Vibodh Signal workflow for your team.\n\n#AgencyGrowth #MarketingAutomation #AIOperations #Shorts #VibodhSignal`,
    `Are your marketing workflows slowing down your growth? Here is how to fix it in ${durationVal} seconds ⏱️\n\nWith ${modeOpt}, you turn complex campaign ideas into viral, polished motion assets ready for instant distribution.\n\n💡 Key benefits:\n• Dynamic pacing & synchronized voiceover\n• Formatted natively for Reels, Shorts & TikTok\n• Zero video production bottlenecks\n\n👉 Experience the Vibodh Motion Engine today.\n\n#Reels #TikTokMarketing #AIVideo #ShortFormContent`,
    `The future of B2B social content is short, punchy, and video-first. 🎥\n\nHere is a ${durationVal}-second preview of how autonomous marketing pipelines execute from script to render without manual editing loops.\n\n🚀 What is your biggest challenge in scaling video content this quarter?\n\n#DigitalStrategy #ContentVelocity #VibodhSignal #MarketingLeadership`
  ];
  
  const randomCaption = options[Math.floor(Math.random() * options.length)];
  if (captionInput) {
    captionInput.value = randomCaption;
    showToast('Video post description regenerated!', '🎬');
  }
}
window.regenerateVideoCaptionText = regenerateVideoCaptionText;

// Video Generator Controllers (Matches uploaded custom dropdown UI)
function toggleVideoGenDropdown(e) {
  if (e) e.stopPropagation();
  const trigger = document.getElementById('cs-video-gen-trigger');
  const menu = document.getElementById('cs-video-gen-menu');
  if (!trigger || !menu) return;
  
  const isOpen = menu.classList.contains('open');
  if (isOpen) {
    menu.classList.remove('open');
    trigger.classList.remove('active');
    trigger.setAttribute('aria-expanded', 'false');
  } else {
    menu.classList.add('open');
    trigger.classList.add('active');
    trigger.setAttribute('aria-expanded', 'true');
  }
}
window.toggleVideoGenDropdown = toggleVideoGenDropdown;

function selectCustomVideoType(val, labelText, itemEl) {
  const trigger = document.getElementById('cs-video-gen-trigger');
  const menu = document.getElementById('cs-video-gen-menu');
  const labelSpan = document.getElementById('cs-video-gen-selected-label');
  const syncSelect = document.getElementById('cs-video-mode-select');

  if (labelSpan) labelSpan.textContent = labelText;
  if (syncSelect) syncSelect.value = val;

  // Update selection UI and checkmarks
  document.querySelectorAll('#cs-video-gen-menu .cs-custom-select-item').forEach(item => {
    item.classList.remove('selected');
    item.setAttribute('aria-selected', 'false');
    const check = item.querySelector('.cs-custom-item-check');
    if (check) check.style.display = 'none';
  });

  if (itemEl) {
    itemEl.classList.add('selected');
    itemEl.setAttribute('aria-selected', 'true');
    const check = itemEl.querySelector('.cs-custom-item-check');
    if (check) check.style.display = 'block';
  }

  // Close dropdown menu
  if (menu) menu.classList.remove('open');
  if (trigger) {
    trigger.classList.remove('active');
    trigger.setAttribute('aria-expanded', 'false');
  }

  // Update prompt and screenplay summary based on selected video type
  const promptInput = document.getElementById('cs-video-prompt-input');
  const summaryEl = document.getElementById('cs-video-screenplay-summary');

  if (val === 'text_to_reel') {
    if (promptInput) promptInput.value = 'High-impact 15s viral reel: Fast intro hook exposing the top operational drain for digital agencies, energetic motion graphics, sync with upbeat audio beats, and animated subtitle highlights.';
    if (summaryEl) summaryEl.innerHTML = '<strong>Scene 1 (0-3s):</strong> High-voltage viral hook &amp; title card.<br><strong>Scene 2 (3-11s):</strong> Rapid 3-point visual walkthrough.<br><strong>Scene 3 (11-15s):</strong> Tap link in bio CTA.';
  } else if (val === 'ai_avatar') {
    if (promptInput) promptInput.value = 'Professional UGC AI spokesperson looking directly into camera in modern office: Confident, friendly tone sharing how Vibodh Signal saved their agency 25+ billable hours weekly, clean studio acoustics.';
    if (summaryEl) summaryEl.innerHTML = '<strong>Spokesperson Hook:</strong> Friendly camera greeting &amp; problem framing.<br><strong>Demonstration:</strong> AI workflow highlights on laptop screen.<br><strong>Outro:</strong> Personal recommendation &amp; deploy link.';
  } else if (val === 'image_to_360') {
    if (promptInput) promptInput.value = 'Sleek 360-degree rotating product showcase: High-end hardware analytics console on dark glossy reflective pedestal, smooth circular camera sweep, volumetric teal rim lighting, 4K 60fps.';
    if (summaryEl) summaryEl.innerHTML = '<strong>Angle A (0-5s):</strong> 90&deg; smooth orbit revealing sleek edges.<br><strong>Angle B (5-10s):</strong> Close-up macro on holographic controls.<br><strong>Angle C (10-15s):</strong> Full 360&deg; turntable loop with logo outro.';
  } else {
    if (promptInput) promptInput.value = 'Fast-paced 15-second teaser video: Highlighting 5 hidden margin killers in agency operations with sleek motion graphics, smooth zoom-in camera transitions, and confident technical narrator voice.';
    if (summaryEl) summaryEl.innerHTML = '<strong>Scene 1 (0-5s):</strong> Fast hook revealing the agency margin bottleneck.<br><strong>Scene 2 (5-10s):</strong> AI autonomous workflow in action with live metrics.<br><strong>Scene 3 (10-15s):</strong> Strong call-to-action to deploy Vibodh Signal.';
  }

  if (promptInput) updateGenPromptCharCount(promptInput, 'cs-vid-counter');
  showToast(`Video mode set to: ${labelText}`, '🎬');
}
window.selectCustomVideoType = selectCustomVideoType;

// Close custom dropdown on outside click
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const container = document.getElementById('cs-video-gen-dropdown-container');
    const trigger = document.getElementById('cs-video-gen-trigger');
    const menu = document.getElementById('cs-video-gen-menu');
    if (container && !container.contains(e.target)) {
      if (menu) menu.classList.remove('open');
      if (trigger) {
        trigger.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
      }
    }
  });
}

function handleVideoModeSelectChange(select) {
  const selectedOpt = select.options[select.selectedIndex];
  const modeKey = selectedOpt.value;
  const modeDesc = selectedOpt.text;
  selectCustomVideoType(modeKey, modeDesc, null);
}
window.handleVideoModeSelectChange = handleVideoModeSelectChange;

function handleVideoAspectSelectChange(select) {
  const selectedOpt = select.options[select.selectedIndex];
  const ratio = selectedOpt.value;
  const desc = selectedOpt.getAttribute('data-desc') || ratio;
  const badgeLabel = selectedOpt.getAttribute('data-badge') || `${ratio} HD`;
  
  const textEl = document.getElementById('cs-video-ratio-text');
  if (textEl) textEl.innerHTML = desc;
  
  const pillEl = document.getElementById('cs-video-ratio-pill-indicator');
  if (pillEl) pillEl.innerText = ratio;
  
  const badge = document.getElementById('cs-vid-badge-format');
  if (badge) badge.innerText = badgeLabel;
  
  showToast(`Video framing set to ${ratio}`, '📐');
}
window.handleVideoAspectSelectChange = handleVideoAspectSelectChange;

// Video Duration Slider Handlers (Matches uploaded screenshot: 5s, 10s, 15s, 20s, 25s, 30s)
function handleVideoDurationChange(val) {
  const numVal = parseInt(val, 10);
  const titleEl = document.getElementById('cs-video-duration-title');
  const fillEl = document.getElementById('cs-duration-fill');
  const thumbEl = document.getElementById('cs-duration-thumb');
  const rangeInput = document.getElementById('cs-duration-range-input');
  const tagEl = document.getElementById('cs-duration-pill-tag');
  const badgeEl = document.getElementById('cs-vid-duration-badge');

  // Percentage on 5s to 30s scale (5 = 0%, 30 = 100%)
  const pct = Math.max(0, Math.min(100, ((numVal - 5) / 25) * 100));

  if (titleEl) titleEl.textContent = `Video Duration: ${numVal} Seconds`;
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (thumbEl) thumbEl.style.left = `${pct}%`;
  if (rangeInput) rangeInput.value = numVal;

  if (badgeEl) {
    badgeEl.textContent = `0:${numVal < 10 ? '0' + numVal : numVal}`;
  }

  if (tagEl) {
    if (numVal <= 15) {
      tagEl.textContent = 'Short-Form';
      tagEl.style.color = '#0F9D8A';
      tagEl.style.background = '#E6F7F5';
    } else if (numVal <= 25) {
      tagEl.textContent = 'Mid-Form';
      tagEl.style.color = '#2563EB';
      tagEl.style.background = '#EFF6FF';
    } else {
      tagEl.textContent = 'Long Reel';
      tagEl.style.color = '#7C3AED';
      tagEl.style.background = '#F5F3FF';
    }
  }

  // Highlight active tick label
  document.querySelectorAll('.cs-duration-tick-label').forEach(lbl => {
    lbl.classList.remove('active');
  });
  const activeTick = document.querySelector(`.cs-duration-tick-label.tick-${numVal}`);
  if (activeTick) activeTick.classList.add('active');

  // Update credit badge dynamically on Generate button
  const vidCreditBadge = document.getElementById('cs-vid-credit-badge');
  if (vidCreditBadge) {
    vidCreditBadge.textContent = `⚡ ${numVal} Credits`;
  }

  showToast(`Video duration set to ${numVal}s (${numVal} credits)`, '⏱️');
}
window.handleVideoDurationChange = handleVideoDurationChange;

function setVideoDuration(val) {
  handleVideoDurationChange(val);
}
window.setVideoDuration = setVideoDuration;

function selectVideoMode(card, modeKey, modeDesc) {
  document.querySelectorAll('.cs-video-mode-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  const textEl = document.getElementById('cs-selected-video-mode-text');
  if (textEl) textEl.innerText = modeDesc;
  showToast(`Video mode set to: ${modeDesc}`, '🎬');
}
window.selectVideoMode = selectVideoMode;

function selectVideoAspectRatio(btn, ratio, desc) {
  document.querySelectorAll('#cs-view-panel-video .cs-aspect-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const textEl = document.getElementById('cs-video-ratio-text');
  if (textEl) textEl.innerText = desc;
  const badge = document.getElementById('cs-vid-badge-format');
  if (badge) badge.innerText = `${ratio} HD`;
  showToast(`Video framing set to ${ratio}`, '📐');
}
window.selectVideoAspectRatio = selectVideoAspectRatio;

function applyVideoExamplePrompt(promptText) {
  const input = document.getElementById('cs-video-prompt-input');
  if (input) {
    input.value = promptText;
    updateGenPromptCharCount(input, 'cs-vid-counter');
    showToast('Video screenplay prompt loaded into editor!', '💡');
  }
}
window.applyVideoExamplePrompt = applyVideoExamplePrompt;

function cycleVideoExamples() {
  const examples = [
    'Fast-paced 15s tech reel showing agency founder looking stressed at spreadsheet, then transition to glowing Vibodh AI dashboard with happy team celebrating margin jump',
    '360° rotating showcase of new SaaS hardware device with pulsing neon lights, high-tech soundtrack, and smooth cinematic slow-mo camera turns',
    'UGC-style creator explaining 3 reasons why treating AI like a side project ruins agency profits, with dynamic animated text captions'
  ];
  const chosen = examples[Math.floor(Math.random() * examples.length)];
  applyVideoExamplePrompt(chosen);
}
window.cycleVideoExamples = cycleVideoExamples;

function generateVideoStudioPackage() {
  const btn = document.getElementById('cs-vid-gen-btn');
  const player = document.getElementById('cs-main-video-player');
  const screenplay = document.getElementById('cs-video-screenplay-summary');
  const duration = document.getElementById('cs-duration-range-input')?.value || '15';
  const voice = document.getElementById('cs-video-voice-select')?.options[document.getElementById('cs-video-voice-select')?.selectedIndex]?.text || 'Professional';

  if (btn) {
    btn.style.opacity = '0.7';
    btn.innerHTML = '<span class="cs-btn-flash">🎬</span> Rendering Motion Video...';
  }

  setTimeout(() => {
    if (player) {
      player.load();
      player.play().catch(() => {});
    }
    if (screenplay) {
      screenplay.innerHTML = `<strong>Scene 1 (0-${Math.floor(duration/3)}s):</strong> Hook problem statement with dynamic camera tilt.<br><strong>Scene 2 (${Math.floor(duration/3)}-${Math.floor(duration*2/3)}s):</strong> Solution showcase with voiceover (${voice}).<br><strong>Scene 3 (${Math.floor(duration*2/3)}-${duration}s):</strong> High-conversion Vibodh Signal call-to-action.`;
    }
    if (btn) {
      btn.style.opacity = '1';
      btn.innerHTML = `<span class="cs-btn-flash">🎬</span> <span>Generate Video Clip</span> <span class="cs-btn-credit-badge" id="cs-vid-credit-badge">⚡ ${duration} Credits</span>`;
    }
    if (typeof promptRefImages !== 'undefined' && promptRefImages.video) {
      showToast(`1080P Video generated from reference start frame: "${promptRefImages.video.name}" (${duration}s)`, '🎬');
    } else {
      showToast(`1080P Video clip (${duration}s &bull; ${duration} credits) generated successfully!`, '🚀');
    }
  }, 700);
}
window.generateVideoStudioPackage = generateVideoStudioPackage;

function saveVideoToLibrary() {
  showToast('Video clip & screenplay saved to Media & Content Asset Library!', '💾');
}
window.saveVideoToLibrary = saveVideoToLibrary;

function publishLivePost() {
  if (!selectedPlatformIds || selectedPlatformIds.length === 0) {
    showToast('Please select at least one platform in Target Channels before posting!', '⚠️');
    return;
  }
  const names = selectedPlatformIds.map(id => {
    const p = AVAILABLE_PLATFORMS.find(item => item.id === id);
    return p ? p.name : id;
  });
  showToast(`Successfully published live to: ${names.join(', ')}!`, '🚀');
}
window.publishLivePost = publishLivePost;


// 10d. Brand DNA Tabs & Save
function switchDnaTab(btn, tabKey) {
  document.querySelectorAll('.dna-nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.dna-tab-panel').forEach(p => p.style.display = 'none');
  const activePanel = document.getElementById('dna-panel-' + tabKey);
  if (activePanel) activePanel.style.display = 'block';
}
window.switchDnaTab = switchDnaTab;

function saveBrandDna() {
  showToast('Brand DNA saved & re-indexed to vector memory! (100% Score)', '&#129516;');
}
window.saveBrandDna = saveBrandDna;

// 10e. Calendar Schedule Modal
function openScheduleModal() {
  showToast('Opening Omnichannel Publishing Scheduler...', '&#128197;');
  setTimeout(() => {
    openNewCampaignModal();
  }, 300);
}
window.openScheduleModal = openScheduleModal;

// 10f. Analytics Export & Filter
function updateAnalyticsFilter(days) {
  showToast(`Telemetry updated for the last ${days} days.`, '&#128202;');
}
window.updateAnalyticsFilter = updateAnalyticsFilter;

function exportAnalyticsReport() {
  showToast('Exporting analytics report as high-res PDF...', '&#128196;');
}
window.exportAnalyticsReport = exportAnalyticsReport;

// 10g. Media Library Upload & Tabs
function filterMediaTab(btn, cat) {
  document.querySelectorAll('#view-media-library .view-subnav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const countLabel = document.getElementById('media-count-label');
  const emptyCard = document.getElementById('media-empty-card');
  const templatesGrid = document.getElementById('media-templates-grid');

  if (cat === 'templates') {
    if (emptyCard) emptyCard.style.display = 'none';
    if (templatesGrid) templatesGrid.style.display = 'grid';
    if (countLabel) countLabel.innerText = '6';
    showToast('Showing Pre-Built Campaign & Production Templates', '📋');
  } else {
    if (templatesGrid) templatesGrid.style.display = 'none';
    if (emptyCard) emptyCard.style.display = 'block';
    if (countLabel) countLabel.innerText = '0';
    showToast(`Filtered media assets: ${btn.innerText}`);
  }
}
window.filterMediaTab = filterMediaTab;

function loadTemplateIntoStudio(tplTitle, mediaUrl, promptText, captionText, mode) {
  window.switchAppView('content-studio');
  if (mode === 'video') {
    switchCsMainTab('video');
    const videoEl = document.getElementById('cs-main-video-player');
    const promptInput = document.getElementById('cs-video-prompt-input');
    const summaryEl = document.getElementById('cs-video-screenplay-summary');
    if (videoEl && mediaUrl) videoEl.poster = mediaUrl;
    if (promptInput && promptText) {
      promptInput.value = promptText;
      updateGenPromptCharCount(promptInput, 'cs-vid-counter');
    }
    if (summaryEl) {
      summaryEl.innerHTML = `<strong>Template Mode:</strong> ${tplTitle} preset synchronized.<br><strong>Visuals:</strong> High-impact multi-scene motion calibrated for viral retention.`;
    }
  } else {
    switchCsMainTab('image');
    const mainImg = document.getElementById('cs-main-image-preview');
    const titleEl = document.getElementById('cs-img-display-title');
    const promptInput = document.getElementById('cs-image-prompt-input');
    if (mainImg && mediaUrl) mainImg.src = mediaUrl;
    if (titleEl) titleEl.innerText = tplTitle;
    if (promptInput && promptText) {
      promptInput.value = promptText;
      updateGenPromptCharCount(promptInput, 'cs-img-counter');
    }
  }
  showToast(`Loaded template: "${tplTitle}" into Content Studio!`, '📋');
}
window.loadTemplateIntoStudio = loadTemplateIntoStudio;

function openUploadMediaModal() {
  const m = document.getElementById('modal-upload-kb');
  if (m) m.style.display = 'flex';
}
window.openUploadMediaModal = openUploadMediaModal;

// 10h. Social Channels Direct API Connections
let pendingChannel = null;
const CHANNEL_NAMES = {
  'ig': 'Instagram Business',
  'meta': 'Meta Ads Manager',
  'li': 'LinkedIn Organization',
  'tw': 'X (Twitter) Pro',
  'tt': 'TikTok for Business'
};

function toggleChannelConnect(chKey) {
  pendingChannel = chKey;
  const m = document.getElementById('modal-connect-api');
  const title = document.getElementById('modal-connect-title');
  const desc = document.getElementById('modal-connect-desc');
  const chName = CHANNEL_NAMES[chKey] || 'Social Channel';
  if (title) title.textContent = `Connect ${chName}`;
  if (desc) desc.textContent = `Authorize direct dispatch pipeline for ${chName} with AES-256 encrypted hardware token storage.`;
  if (m) m.style.display = 'flex';
}
window.toggleChannelConnect = toggleChannelConnect;

function confirmChannelConnect() {
  if (!pendingChannel) return;
  const btn = document.getElementById('btn-channel-' + pendingChannel);
  const tag = document.getElementById('status-tag-' + pendingChannel);
  const card = document.getElementById('card-channel-' + pendingChannel);
  const chName = CHANNEL_NAMES[pendingChannel] || 'Channel';

  if (btn && tag) {
    if (btn.innerText.includes('Connect API')) {
      btn.innerText = 'Disconnect';
      btn.className = 'btn-secondary-outline';
      tag.className = 'view-badge-pill badge-emerald';
      tag.textContent = 'Connected ✓';
      showToast(`${chName} connected successfully!`, '&#10003;');
    } else {
      btn.innerText = '+ Connect API';
      btn.className = 'btn-primary-teal';
      tag.className = 'view-badge-pill badge-gray';
      tag.textContent = 'Ready to Connect';
      showToast(`${chName} disconnected.`, '&#9888;');
    }
  }
  closeAllModals();
}
window.confirmChannelConnect = confirmChannelConnect;

// 10i. Agency Hub
function openOnboardBrandModal() {
  showToast('Opening Multi-Tenant Onboarding wizard...', '&#127970;');
  setTimeout(() => openNewCampaignModal(), 300);
}
window.openOnboardBrandModal = openOnboardBrandModal;

// 10j. Brand Knowledge Upload & Search Tester
function openUploadKnowledgeModal() {
  const m = document.getElementById('modal-upload-kb');
  if (m) m.style.display = 'flex';
}
window.openUploadKnowledgeModal = openUploadKnowledgeModal;

function openSearchTesterModal() {
  showToast('Testing RAG semantic retrieval: 100% Vector Recall', '&#9889;');
}
window.openSearchTesterModal = openSearchTesterModal;

function simulateFileUpload() {
  showToast('Brand PDF loaded: "Vibodh_AI_Playbook_2026.pdf"', '&#128196;');
}
window.simulateFileUpload = simulateFileUpload;

function submitKnowledgeUpload() {
  closeAllModals();
  showToast('Asset uploaded & indexed into RAG vector memory!', '&#128193;');
}
window.submitKnowledgeUpload = submitKnowledgeUpload;

// 10k. Activity Feed
function markAllActivityRead() {
  const badge = document.getElementById('activity-badge-count');
  if (badge) badge.innerText = '0 Unread';
  showToast('All notifications marked as read!', '&#10003;');
}
window.markAllActivityRead = markAllActivityRead;

// 10l. Settings
function saveSettings() {
  showToast('Workspace settings & API keys saved successfully!', '&#10003;');
}
window.saveSettings = saveSettings;

// 10m. Redesigned Dashboard Handlers
function updateDqcCount(el) {
  const countEl = document.getElementById('dqc-char-count');
  if (countEl) {
    countEl.textContent = `${el.value.length} / 1000 chars (Min 5)`;
  }
}
window.updateDqcCount = updateDqcCount;

function fillDqcPrompt(text) {
  const input = document.getElementById('qc-main-prompt');
  if (input) {
    input.value = text;
    updateDqcCount(input);
    input.focus();
  }
}
window.fillDqcPrompt = fillDqcPrompt;

let activeDqcFormat = 'linkedin';
function setDqcFormat(btn, fmt) {
  activeDqcFormat = fmt;
  document.querySelectorAll('.dqc-fmt-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}
window.setDqcFormat = setDqcFormat;

function selectHeroChip(btn, fmt, promptText) {
  activeDqcFormat = fmt || 'auto';
  document.querySelectorAll('.dash-hero-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const input = document.getElementById('qc-main-prompt');
  if (input) {
    if (promptText) {
      input.value = promptText;
    }
    input.focus();
  }
}
window.selectHeroChip = selectHeroChip;

function generateDqcPost() {
  const promptInput = document.getElementById('qc-main-prompt');
  const toneSelect = document.getElementById('dqc-tone-select');
  const prompt = (promptInput ? promptInput.value : '').trim() || 'Exciting update from Vibodh Signal';
  const tone = toneSelect ? toneSelect.options[toneSelect.selectedIndex].text : 'Default Brand Voice';
  const btn = document.getElementById('btn-dqc-generate');
  
  if (btn) {
    btn.innerHTML = '<span>⚡</span> Creating...';
    btn.disabled = true;
  }
  
  showToast('Creating post in your brand voice...', '✨');
  
  setTimeout(() => {
    if (btn) {
      btn.innerHTML = '<span>✨</span> Create';
      btn.disabled = false;
    }
    const outputBox = document.getElementById('dqc-output-box');
    const outputText = document.getElementById('dqc-output-text');
    if (outputBox && outputText) {
      outputText.textContent = `🚀 [${activeDqcFormat.toUpperCase()} • ${tone}]\n\n"${prompt}"\n\n✨ Great marketing doesn't have to be complicated. Vibodh Signal helps your team plan, create, and share on-brand content across every channel in minutes.\n\nWhat makes this work:\n• Consistent voice across all platforms\n• Ready-to-share posts tailored for your audience\n• Clear insights on what performs best\n\n#VibodhAI #Marketing #ContentCreation #SocialMedia`;
      outputBox.style.display = 'block';
      outputBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      showToast('Draft post created successfully!', '✅');
    }
  }, 650);
}
window.generateDqcPost = generateDqcPost;

function copyDqcText() {
  const outputText = document.getElementById('dqc-output-text');
  if (outputText) {
    navigator.clipboard.writeText(outputText.textContent).then(() => {
      showToast('Post copied to clipboard!', '📋');
    });
  }
}
window.copyDqcText = copyDqcText;

let activeDgcTarget = 'linkedin';
function setDgcTarget(btn, target) {
  activeDgcTarget = target;
  document.querySelectorAll('.dgc-target-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}
window.setDgcTarget = setDgcTarget;

function generateGroundedPost() {
  const input = document.getElementById('dgc-input');
  const val = (input ? input.value : '').trim() || 'Vibodh Signal smart marketing platform';
  const btn = document.getElementById('btn-dgc-submit');
  
  if (btn) {
    btn.innerHTML = '<span>⚡</span> Creating...';
    btn.disabled = true;
  }
  
  showToast('Drafting post with your brand facts...', '⚡');
  
  setTimeout(() => {
    if (btn) {
      btn.innerHTML = '<span>⚡</span> Create Post';
      btn.disabled = false;
    }
    const outputBox = document.getElementById('dgc-output-box');
    const outputText = document.getElementById('dgc-output-text');
    if (outputBox && outputText) {
      outputText.textContent = `📌 [${activeDgcTarget.toUpperCase()} POST DRAFT]\n\nTopic: "${val}"\n\n"We built Vibodh Signal to help marketing teams save hours every week. Instead of switching between multiple disconnected tools, you can create consistent, high-impact content that truly sounds like your brand."\n\n💡 Verified with your saved brand documents.`;
      outputBox.style.display = 'block';
      outputBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      showToast('Post draft created!', '✨');
    }
  }, 600);
}
window.generateGroundedPost = generateGroundedPost;

function copyGroundedText() {
  const outputText = document.getElementById('dgc-output-text');
  if (outputText) {
    navigator.clipboard.writeText(outputText.textContent).then(() => {
      showToast('Draft copied to clipboard!', '📋');
    });
  }
}
window.copyGroundedText = copyGroundedText;

// ══════════════════════════════════════════════════════════════════════════
// ASSET GALLERY PICKER MODAL CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════
let currentGalleryMode = 'image';
let currentSelectedGalleryAsset = null;
let currentActiveGalleryModalTab = 'gallery';
let currentSelectedTemplate = null;

function switchGalleryModalView(view) {
  currentActiveGalleryModalTab = view;
  const galTab = document.getElementById('btn-tab-gallery-view');
  const tplTab = document.getElementById('btn-tab-templates-view');
  const galFilters = document.getElementById('gallery-filter-bar');
  const galContainer = document.getElementById('gallery-items-container');
  const tplFilters = document.getElementById('templates-filter-bar');
  const tplContainer = document.getElementById('templates-items-container');
  const title = document.getElementById('gallery-picker-title');
  const sub = document.getElementById('gallery-picker-subtitle');
  const confirmBtn = document.getElementById('btn-confirm-gallery-load');
  const summary = document.getElementById('gallery-selected-summary');

  if (view === 'templates') {
    if (galTab) galTab.classList.remove('active');
    if (tplTab) tplTab.classList.add('active');
    if (galFilters) galFilters.style.display = 'none';
    if (galContainer) galContainer.style.display = 'none';
    if (tplFilters) tplFilters.style.display = 'flex';
    if (tplContainer) tplContainer.style.display = 'grid';
    if (title) title.innerText = 'Pre-Built Campaign Templates';
    if (sub) sub.innerText = 'Select a ready-to-use template with optimized prompts, styling & post copy';
    if (confirmBtn) confirmBtn.innerText = 'Load Selected Template';
    
    if (summary) {
      summary.innerHTML = currentSelectedTemplate 
        ? `Selected template: <strong>${currentSelectedTemplate.title}</strong>`
        : 'Click any template blueprint above to load into your studio';
    }
  } else {
    if (tplTab) tplTab.classList.remove('active');
    if (galTab) galTab.classList.add('active');
    if (tplFilters) tplFilters.style.display = 'none';
    if (tplContainer) tplContainer.style.display = 'none';
    if (galFilters) galFilters.style.display = 'flex';
    if (galContainer) galContainer.style.display = 'grid';
    if (title) title.innerText = currentGalleryMode === 'video' ? 'Video Asset Library & Gallery' : 'Media Asset Library & Gallery';
    if (sub) sub.innerText = 'Select pre-approved brand media or generated assets to load into studio';
    if (confirmBtn) confirmBtn.innerText = 'Load Selected Asset';

    if (summary) {
      summary.innerHTML = currentSelectedGalleryAsset 
        ? `Selected asset: <strong>${currentSelectedGalleryAsset.title}</strong>`
        : 'Click any asset above to load into your studio';
    }
  }
}
window.switchGalleryModalView = switchGalleryModalView;

function openGalleryPickerModal(mode = 'image') {
  currentGalleryMode = mode;
  currentSelectedGalleryAsset = null;
  currentSelectedTemplate = null;
  const modal = document.getElementById('modal-gallery-picker');
  
  // Reset all selection styles
  document.querySelectorAll('#modal-gallery-picker .gallery-picker-card').forEach(card => card.classList.remove('selected'));
  
  // Default to gallery view
  switchGalleryModalView('gallery');

  if (modal) modal.style.display = 'flex';
}
window.openGalleryPickerModal = openGalleryPickerModal;

function selectGalleryAsset(card, mediaUrl, mediaTitle, mediaType) {
  document.querySelectorAll('#gallery-items-container .gallery-picker-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  currentSelectedGalleryAsset = { url: mediaUrl, title: mediaTitle, type: mediaType };
  
  const summary = document.getElementById('gallery-selected-summary');
  if (summary) {
    summary.innerHTML = `Selected asset: <strong>${mediaTitle}</strong>`;
  }
}
window.selectGalleryAsset = selectGalleryAsset;

function selectTemplateAsset(card, tplTitle, mediaUrl, promptText, captionText, aspectVal) {
  document.querySelectorAll('#templates-items-container .gallery-picker-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  currentSelectedTemplate = {
    title: tplTitle,
    url: mediaUrl,
    prompt: promptText,
    copy: captionText,
    aspect: aspectVal
  };
  
  const summary = document.getElementById('gallery-selected-summary');
  if (summary) {
    summary.innerHTML = `Selected template: <strong>${tplTitle}</strong> (${aspectVal})`;
  }
}
window.selectTemplateAsset = selectTemplateAsset;

function filterGalleryItems(cat) {
  document.querySelectorAll('#gallery-filter-bar .cs-style-cat-chip').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`gal-filter-${cat}s`) || document.getElementById(`gal-filter-${cat}`);
  if (activeBtn) activeBtn.classList.add('active');
  showToast(`Filtering gallery: ${cat.toUpperCase()}`, '🔍');
}
window.filterGalleryItems = filterGalleryItems;

function filterTemplateItems(cat, btn) {
  document.querySelectorAll('#templates-filter-bar .cs-style-cat-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const cards = document.querySelectorAll('#templates-items-container .gallery-picker-card');
  cards.forEach(card => {
    if (cat === 'all' || card.getAttribute('data-cat') === cat) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });

  showToast(`Templates filtered: ${cat.toUpperCase()}`, '📑');
}
window.filterTemplateItems = filterTemplateItems;

function confirmGallerySelection() {
  if (currentActiveGalleryModalTab === 'templates') {
    if (!currentSelectedTemplate) {
      showToast('Please select a template blueprint from the grid first.', 'ℹ️');
      return;
    }

    if (currentGalleryMode === 'image') {
      const mainImg = document.getElementById('cs-main-image-preview');
      const titleEl = document.getElementById('cs-img-display-title');
      const captionInput = document.getElementById('cs-image-caption-input');
      const promptInput = document.getElementById('cs-image-prompt-input');

      if (mainImg && currentSelectedTemplate.url) mainImg.src = currentSelectedTemplate.url;
      if (titleEl) titleEl.innerText = currentSelectedTemplate.title;
      if (captionInput && currentSelectedTemplate.copy) captionInput.value = currentSelectedTemplate.copy;
      if (promptInput && currentSelectedTemplate.prompt) {
        promptInput.value = currentSelectedTemplate.prompt;
        updateGenPromptCharCount(promptInput, 'cs-img-counter');
      }

      showToast(`Loaded template: "${currentSelectedTemplate.title}"!`, '📑');
    } else if (currentGalleryMode === 'video') {
      const videoEl = document.getElementById('cs-main-video-player');
      const captionInput = document.getElementById('cs-video-caption-input');
      const promptInput = document.getElementById('cs-video-prompt-input');
      const summaryEl = document.getElementById('cs-video-screenplay-summary');

      if (videoEl && currentSelectedTemplate.url) videoEl.poster = currentSelectedTemplate.url;
      if (captionInput && currentSelectedTemplate.copy) captionInput.value = currentSelectedTemplate.copy;
      if (promptInput && currentSelectedTemplate.prompt) {
        promptInput.value = currentSelectedTemplate.prompt;
        updateGenPromptCharCount(promptInput, 'cs-vid-counter');
      }
      if (summaryEl) {
        summaryEl.innerHTML = `<strong>Template Mode:</strong> ${currentSelectedTemplate.title} preset synchronized.<br><strong>Visuals:</strong> High-impact multi-scene motion calibrated for viral retention.`;
      }

      showToast(`Loaded video template: "${currentSelectedTemplate.title}"!`, '🎬');
    }

    closeAllModals();
    return;
  }

  // Otherwise, load from Gallery Assets
  if (!currentSelectedGalleryAsset) {
    showToast('Please click on an asset in the gallery to select it first.', 'ℹ️');
    return;
  }
  
  if (currentGalleryMode === 'image') {
    const mainImg = document.getElementById('cs-main-image-preview');
    const titleEl = document.getElementById('cs-img-display-title');
    if (mainImg) mainImg.src = currentSelectedGalleryAsset.url;
    if (titleEl) titleEl.innerText = currentSelectedGalleryAsset.title;
    showToast(`Loaded "${currentSelectedGalleryAsset.title}" from Gallery!`, '🖼️');
  } else if (currentGalleryMode === 'video') {
    const videoEl = document.getElementById('cs-main-video-player');
    if (videoEl) videoEl.poster = currentSelectedGalleryAsset.url;
    showToast(`Loaded "${currentSelectedGalleryAsset.title}" into Video Canvas!`, '🎬');
  }
  
  closeAllModals();
}
window.confirmGallerySelection = confirmGallerySelection;

// ══════════════════════════════════════════════════════════════════════════
// REFRESH BUTTONS WITHIN IMAGE & VIDEO MEDIA AREAS
// ══════════════════════════════════════════════════════════════════════════
function regenerateImageMediaOnly() {
  const mainImg = document.getElementById('cs-main-image-preview');
  const titleEl = document.getElementById('cs-img-display-title');
  const captionInput = document.getElementById('cs-image-caption-input');
  
  const sampleImages = [
    { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', title: 'Cyber Neon Fluid Wave Architecture' },
    { url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80', title: '3D Minimal Glass Block Tech Stack' },
    { url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80', title: 'Encrypted Neural Signal Circuit' },
    { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', title: 'Global Fiber Optic Core Mesh' },
    { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80', title: 'Enterprise AI Operations Flow' }
  ];

  const nextItem = sampleImages[Math.floor(Math.random() * sampleImages.length)];
  if (mainImg) {
    mainImg.style.opacity = '0.5';
    setTimeout(() => {
      mainImg.src = nextItem.url;
      mainImg.style.opacity = '1';
      if (titleEl) titleEl.innerText = nextItem.title;
      // Also automatically update accompanying text to match the new image
      regenerateImageCaptionText();
      showToast(`Refreshed: ${nextItem.title}`, '🔄');
    }, 350);
  }
}
window.regenerateImageMediaOnly = regenerateImageMediaOnly;

function regenerateVideoMediaOnly() {
  const videoEl = document.getElementById('cs-main-video-player');
  const samplePosters = [
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
  ];
  const nextPoster = samplePosters[Math.floor(Math.random() * samplePosters.length)];
  if (videoEl) {
    videoEl.style.opacity = '0.5';
    setTimeout(() => {
      videoEl.poster = nextPoster;
      videoEl.style.opacity = '1';
      regenerateVideoCaptionText();
      showToast('Video scene and motion refreshed with new angles!', '🎬');
    }, 400);
  }
}
window.regenerateVideoMediaOnly = regenerateVideoMediaOnly;

// ══════════════════════════════════════════════════════════════════════════
// LOAD FROM DRAFTS PICKER MODAL CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════
let currentDraftsMode = 'image';
let currentSelectedDraft = null;

function openDraftsPickerModal(mode = 'image') {
  currentDraftsMode = mode;
  currentSelectedDraft = null;
  const modal = document.getElementById('modal-drafts-picker');
  const title = document.getElementById('drafts-picker-title');
  const icon = document.getElementById('drafts-picker-icon');
  
  if (title) {
    if (mode === 'text') {
      title.innerText = 'Text Post Drafts';
    } else if (mode === 'video') {
      title.innerText = 'Video Workspace Drafts';
    } else {
      title.innerText = 'Image Workspace Drafts';
    }
  }
  if (icon) {
    icon.innerText = mode === 'text' ? '📝' : (mode === 'video' ? '🎬' : '📁');
  }

  document.querySelectorAll('#drafts-items-container .gallery-picker-card').forEach(card => card.classList.remove('selected'));
  const summary = document.getElementById('drafts-selected-summary');
  if (summary) summary.innerText = 'Select a draft above to load into active canvas';

  if (modal) modal.style.display = 'flex';
}
window.openDraftsPickerModal = openDraftsPickerModal;

function selectDraftAsset(card, draftTitle, mediaUrl, draftCopy, promptText, mode) {
  document.querySelectorAll('#drafts-items-container .gallery-picker-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  currentSelectedDraft = {
    title: draftTitle,
    url: mediaUrl,
    copy: draftCopy,
    prompt: promptText,
    mode: mode
  };
  const summary = document.getElementById('drafts-selected-summary');
  if (summary) {
    summary.innerHTML = `Selected draft: <strong>${draftTitle}</strong>`;
  }
}
window.selectDraftAsset = selectDraftAsset;

function confirmDraftSelection() {
  if (!currentSelectedDraft) {
    showToast('Please select a draft from the list first.', 'ℹ️');
    return;
  }

  if (currentDraftsMode === 'text') {
    const headlineEl = document.getElementById('mockup-headline-lead');
    const captionEl = document.getElementById('mockup-caption-text');

    if (headlineEl && currentSelectedDraft.title) {
      headlineEl.innerText = currentSelectedDraft.title;
    }
    if (captionEl && currentSelectedDraft.copy) {
      captionEl.innerText = currentSelectedDraft.copy;
    }
    showToast(`Restored text draft: "${currentSelectedDraft.title}"!`, '📝');
  } else if (currentDraftsMode === 'image') {
    const mainImg = document.getElementById('cs-main-image-preview');
    const titleEl = document.getElementById('cs-img-display-title');
    const captionInput = document.getElementById('cs-image-caption-input');
    const promptInput = document.getElementById('cs-image-prompt-input');

    if (mainImg && currentSelectedDraft.url) mainImg.src = currentSelectedDraft.url;
    if (titleEl) titleEl.innerText = currentSelectedDraft.title;
    if (captionInput) captionInput.value = currentSelectedDraft.copy;
    if (promptInput && currentSelectedDraft.prompt) {
      promptInput.value = currentSelectedDraft.prompt;
      updateGenPromptCharCount(promptInput, 'cs-img-counter');
    }
    showToast(`Restored image draft: "${currentSelectedDraft.title}"!`, '📁');
  } else if (currentDraftsMode === 'video') {
    const videoEl = document.getElementById('cs-main-video-player');
    const captionInput = document.getElementById('cs-video-caption-input');
    const promptInput = document.getElementById('cs-video-prompt-input');

    if (videoEl && currentSelectedDraft.url) videoEl.poster = currentSelectedDraft.url;
    if (captionInput) captionInput.value = currentSelectedDraft.copy;
    if (promptInput && currentSelectedDraft.prompt) {
      promptInput.value = currentSelectedDraft.prompt;
      updateGenPromptCharCount(promptInput, 'cs-vid-counter');
    }
    showToast(`Restored video draft: "${currentSelectedDraft.title}"!`, '🎬');
  }

  closeAllModals();
}
window.confirmDraftSelection = confirmDraftSelection;

// ══════════════════════════════════════════════════════════════════════════
// AI GUARDRAIL VERIFICATION & COMPLIANCE MODAL LOGIC (VIBODH SIGNAL THEME)
// ══════════════════════════════════════════════════════════════════════════
const guardrailChecksData = [
  {
    title: 'Brand voice and identity',
    desc: 'Matches brand guidelines and tone.',
    type: 'pass',
    badgeText: 'Pass',
    pct: 99,
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`
  },
  {
    title: 'Factual accuracy',
    desc: 'All claims supported by sources.',
    type: 'pass',
    badgeText: 'Pass',
    pct: 100,
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="m9 10 2 2 4-4"/></svg>`
  },
  {
    title: 'Content safety',
    desc: 'No sensitive or prohibited content.',
    type: 'pass',
    badgeText: 'Pass',
    pct: 100,
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`
  },
  {
    title: 'Legal and compliance',
    desc: 'No regulated claims detected.',
    type: 'pass',
    badgeText: 'Pass',
    pct: 98,
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`
  },
  {
    title: 'Platform compliance',
    desc: 'Format, length and hashtags valid.',
    type: 'pass',
    badgeText: 'Pass',
    pct: 100,
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/><path d="m9 10 2 2 4-4"/></svg>`
  },
  {
    title: 'Creative consistency',
    desc: 'Caption, image and CTA aligned.',
    type: 'pass',
    badgeText: 'Pass',
    pct: 96,
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m10 12 1.5 1.5 3-3"/></svg>`
  },
  {
    title: 'Claim verification',
    desc: '1 claim needs review.',
    type: 'warning',
    badgeText: 'Warning',
    pct: 84,
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  },
  {
    title: 'Publishing control',
    desc: 'Approval required for this campaign.',
    type: 'required',
    badgeText: 'Required',
    pct: 100,
    iconSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  }
];

let guardrailScanTimers = [];

function startGuardrailScanAnimation() {
  const container = document.getElementById('guardrail-checks-list');
  const globalBar = document.getElementById('guardrail-global-progress-bar');
  const globalStatusText = document.getElementById('guardrail-scan-status-text');
  const globalScorePill = document.getElementById('guardrail-overall-score-pill');
  const engineStatus = document.getElementById('guardrail-engine-status');

  if (!container) return;

  // Clear any existing active animation timers
  guardrailScanTimers.forEach(t => clearTimeout(t));
  guardrailScanTimers = [];

  // Reset top scanner indicators
  if (globalBar) globalBar.style.width = '0%';
  if (globalScorePill) {
    globalScorePill.textContent = '0% Completed';
    globalScorePill.style.background = 'rgba(15, 157, 138, 0.14)';
    globalScorePill.style.color = '#0F9D8A';
  }
  if (globalStatusText) {
    globalStatusText.innerHTML = '<span class="guardrail-scan-pulse"></span><span>Scanning content against 8 enterprise safety policies...</span>';
  }
  if (engineStatus) {
    engineStatus.innerHTML = '<span>⚡</span> Evaluating policies in real-time &bull; Vibodh Shield™ Active';
  }

  // 1. Render all 8 items in initial evaluating/checking state
  container.innerHTML = guardrailChecksData.map((item, idx) => {
    return `
      <div id="guardrail-card-${idx}" class="guardrail-dark-card evaluating">
        <div class="guardrail-dark-left">
          <div id="guardrail-icon-${idx}" class="guardrail-dark-icon icon-evaluating">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:guardrailSpinPulse 1.8s linear infinite"><circle cx="12" cy="12" r="9" stroke-dasharray="28" stroke-dashoffset="14"/><path d="m12 6v6l4 2"/></svg>
          </div>
          <div class="guardrail-dark-info">
            <h4 class="guardrail-dark-title">${item.title}</h4>
            <p class="guardrail-dark-desc">${item.desc}</p>
            <div class="guardrail-item-loading-track">
              <div id="guardrail-fill-${idx}" class="guardrail-item-loading-fill fill-evaluating" style="width: 15%;"></div>
            </div>
          </div>
        </div>
        <div class="guardrail-dark-right">
          <span id="guardrail-pct-${idx}" class="guardrail-pct-badge pct-evaluating">--%</span>
          <span id="guardrail-status-${idx}" class="guardrail-status-pill pill-checking">
            <span class="guardrail-scan-pulse" style="width:6px;height:6px;"></span>
            Checking...
          </span>
        </div>
      </div>
    `;
  }).join('');

  // 2. Sequential completion for each item with realistic staggering
  guardrailChecksData.forEach((item, idx) => {
    const delay = 180 + idx * 160;

    const timer = setTimeout(() => {
      const cardEl = document.getElementById(`guardrail-card-${idx}`);
      const iconEl = document.getElementById(`guardrail-icon-${idx}`);
      const fillEl = document.getElementById(`guardrail-fill-${idx}`);
      const pctEl = document.getElementById(`guardrail-pct-${idx}`);
      const statusEl = document.getElementById(`guardrail-status-${idx}`);

      if (fillEl) {
        fillEl.style.width = item.pct + '%';
        fillEl.className = 'guardrail-item-loading-fill fill-' + item.type;
      }

      if (cardEl) {
        cardEl.className = 'guardrail-dark-card ' + (item.type === 'warning' ? 'warning-card' : item.type === 'required' ? 'required-card' : 'pass-card');
      }

      if (iconEl) {
        iconEl.className = 'guardrail-dark-icon icon-' + item.type;
        iconEl.innerHTML = item.iconSvg;
      }

      if (pctEl) {
        pctEl.className = 'guardrail-pct-badge pct-' + item.type;
        pctEl.textContent = item.pct + '%';
      }

      if (statusEl) {
        statusEl.className = 'guardrail-status-pill pill-' + item.type;
        let badgeIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/></svg>`;
        if (item.type === 'warning') {
          badgeIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        } else if (item.type === 'required') {
          badgeIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        }
        statusEl.innerHTML = `${badgeIcon} <span>${item.badgeText}</span>`;
      }

      // Update global progress track
      const completedCount = idx + 1;
      const progressPct = Math.round((completedCount / guardrailChecksData.length) * 100);
      if (globalBar) globalBar.style.width = progressPct + '%';
      if (globalScorePill) globalScorePill.textContent = progressPct + '% Completed';

      // When the final guardrail completes
      if (idx === guardrailChecksData.length - 1) {
        if (globalStatusText) {
          globalStatusText.innerHTML = '<span style="color:#10B981;font-weight:700;">✓ All 8 Guardrails Verified</span> <span style="color:#94A3B8;">&bull; 7 Passed, 1 Warning</span>';
        }
        if (globalScorePill) {
          globalScorePill.textContent = '97.1% Overall Score';
          globalScorePill.style.background = 'rgba(16, 185, 129, 0.2)';
          globalScorePill.style.color = '#34D399';
        }
        if (engineStatus) {
          engineStatus.innerHTML = '<span>⚡</span> Evaluated in 42ms &bull; 8/8 Guardrails Verified &bull; Vibodh Shield™ Active';
        }
        showToast('Guardrail verification complete: 7 Passed, 1 Warning', '🛡️');
      }
    }, delay);

    guardrailScanTimers.push(timer);
  });
}
window.startGuardrailScanAnimation = startGuardrailScanAnimation;

function openGuardrailModal(mode = 'text') {
  const modal = document.getElementById('modal-guardrail-checker');
  if (modal) {
    modal.style.display = 'flex';
  }
  startGuardrailScanAnimation();
  showToast('Evaluating AI Guardrails & Policies...', '🛡️');
}
window.openGuardrailModal = openGuardrailModal;

function closeGuardrailModal() {
  const modal = document.getElementById('modal-guardrail-checker');
  if (modal) {
    modal.style.display = 'none';
  }
  guardrailScanTimers.forEach(t => clearTimeout(t));
  guardrailScanTimers = [];
}
window.closeGuardrailModal = closeGuardrailModal;

function runGuardrailReScan() {
  showToast('Re-scanning content through Vibodh Shield engine...', '🔄');
  startGuardrailScanAnimation();
}
window.runGuardrailReScan = runGuardrailReScan;

// ══════════════════════════════════════════════════════════════════════
// OMNICHANNEL SOCIAL POST PREVIEW (INSTAGRAM, FACEBOOK, LINKEDIN, X)
// ══════════════════════════════════════════════════════════════════════
let currentPreviewPlatform = 'ig';
let currentPreviewDevice = 'mobile';
let currentActiveStudioMode = 'image';

function openPostPreviewModal(preferredPlatform) {
  // 1. Detect active Studio Tab
  const isVideo = document.getElementById('cs-view-panel-video') && document.getElementById('cs-view-panel-video').style.display !== 'none';
  const isImage = document.getElementById('cs-view-panel-image') && document.getElementById('cs-view-panel-image').style.display !== 'none';
  currentActiveStudioMode = isVideo ? 'video' : (isImage ? 'image' : 'text');

  // 2. Extract active content
  let headline = '';
  let rawCaption = '';
  let mediaType = currentActiveStudioMode;
  let mediaUrl = '';
  let videoPoster = '';
  let videoSrc = '';

  if (currentActiveStudioMode === 'text') {
    headline = document.getElementById('mockup-headline-lead')?.innerText.trim() || 'Enterprise AI Operations Bottlenecks';
    rawCaption = document.getElementById('mockup-caption-text')?.innerText.trim() || '';
  } else if (currentActiveStudioMode === 'image') {
    headline = document.getElementById('cs-img-display-title')?.innerText.trim() || 'Visual Campaign Creative';
    rawCaption = document.getElementById('cs-image-caption-input')?.value.trim() || '';
    mediaUrl = document.getElementById('cs-main-image-preview')?.src || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80';
  } else if (currentActiveStudioMode === 'video') {
    headline = 'Short-form Motion Showcase';
    rawCaption = document.getElementById('cs-video-caption-input')?.value.trim() || '';
    const videoEl = document.getElementById('cs-main-video-player');
    videoPoster = videoEl?.poster || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80';
    videoSrc = videoEl?.querySelector('source')?.src || videoEl?.src || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  }

  // Format hashtags with styling
  const formatHashtags = (text, className) => {
    if (!text) return '';
    return text.replace(/#([\w\d_]+)/g, `<span class="${className}">#$1</span>`);
  };

  // 3. Populate Instagram Card
  const igCaptionEl = document.getElementById('ig-caption-content');
  if (igCaptionEl) {
    igCaptionEl.innerHTML = formatHashtags(rawCaption, 'ig-hashtag');
  }
  const igImg = document.getElementById('ig-preview-img');
  const igVideo = document.getElementById('ig-preview-video');
  const igQuote = document.getElementById('ig-preview-quote');
  const igQuoteLead = document.getElementById('ig-quote-lead');

  if (mediaType === 'image') {
    if (igImg) { igImg.src = mediaUrl; igImg.style.display = 'block'; }
    if (igVideo) igVideo.style.display = 'none';
    if (igQuote) igQuote.style.display = 'none';
  } else if (mediaType === 'video') {
    if (igVideo) {
      igVideo.poster = videoPoster;
      const srcEl = igVideo.querySelector('source');
      if (srcEl) srcEl.src = videoSrc;
      igVideo.load();
      igVideo.style.display = 'block';
    }
    if (igImg) igImg.style.display = 'none';
    if (igQuote) igQuote.style.display = 'none';
  } else {
    // Text post on Instagram uses quote slide
    if (igQuote) {
      if (igQuoteLead) igQuoteLead.innerText = headline || rawCaption.substring(0, 140) + '...';
      igQuote.style.display = 'flex';
    }
    if (igImg) igImg.style.display = 'none';
    if (igVideo) igVideo.style.display = 'none';
  }

  // 4. Populate LinkedIn Card
  const liHeadlineEl = document.getElementById('li-headline-lead');
  const liCaptionEl = document.getElementById('li-caption-content');
  if (liHeadlineEl) liHeadlineEl.innerText = headline;
  if (liCaptionEl) liCaptionEl.innerHTML = formatHashtags(rawCaption, 'li-hashtag');

  const liImg = document.getElementById('li-preview-img');
  const liVideo = document.getElementById('li-preview-video');
  const liMediaFrame = document.getElementById('li-media-frame');

  if (mediaType === 'image') {
    if (liMediaFrame) liMediaFrame.style.display = 'block';
    if (liImg) { liImg.src = mediaUrl; liImg.style.display = 'block'; }
    if (liVideo) liVideo.style.display = 'none';
  } else if (mediaType === 'video') {
    if (liMediaFrame) liMediaFrame.style.display = 'block';
    if (liVideo) {
      liVideo.poster = videoPoster;
      const srcEl = liVideo.querySelector('source');
      if (srcEl) srcEl.src = videoSrc;
      liVideo.load();
      liVideo.style.display = 'block';
    }
    if (liImg) liImg.style.display = 'none';
  } else {
    if (liMediaFrame) liMediaFrame.style.display = 'none';
  }

  // 5. Populate Facebook Card
  const fbCaptionEl = document.getElementById('fb-caption-content');
  if (fbCaptionEl) fbCaptionEl.innerHTML = formatHashtags(rawCaption, 'li-hashtag');
  const fbImg = document.getElementById('fb-preview-img');
  const fbVideo = document.getElementById('fb-preview-video');

  if (mediaType === 'image') {
    if (fbImg) { fbImg.src = mediaUrl; fbImg.style.display = 'block'; }
    if (fbVideo) fbVideo.style.display = 'none';
  } else if (mediaType === 'video') {
    if (fbVideo) {
      fbVideo.poster = videoPoster;
      const srcEl = fbVideo.querySelector('source');
      if (srcEl) srcEl.src = videoSrc;
      fbVideo.load();
      fbVideo.style.display = 'block';
    }
    if (fbImg) fbImg.style.display = 'none';
  } else {
    if (fbImg) fbImg.style.display = 'none';
    if (fbVideo) fbVideo.style.display = 'none';
  }

  // 6. Populate Twitter / X Card
  const twCaptionEl = document.getElementById('tw-caption-content');
  if (twCaptionEl) twCaptionEl.innerHTML = formatHashtags(rawCaption, 'tw-hashtag');
  const twImg = document.getElementById('tw-preview-img');
  const twVideo = document.getElementById('tw-preview-video');
  const twMediaFrame = document.getElementById('tw-media-frame');

  if (mediaType === 'image') {
    if (twMediaFrame) twMediaFrame.style.display = 'block';
    if (twImg) { twImg.src = mediaUrl; twImg.style.display = 'block'; }
    if (twVideo) twVideo.style.display = 'none';
  } else if (mediaType === 'video') {
    if (twMediaFrame) twMediaFrame.style.display = 'block';
    if (twVideo) {
      twVideo.poster = videoPoster;
      const srcEl = twVideo.querySelector('source');
      if (srcEl) srcEl.src = videoSrc;
      twVideo.load();
      twVideo.style.display = 'block';
    }
    if (twImg) twImg.style.display = 'none';
  } else {
    if (twMediaFrame) twMediaFrame.style.display = 'none';
  }

  // 7. Update Clock Time
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const clockEl = document.getElementById('preview-clock-time');
  if (clockEl) clockEl.innerText = timeStr;

  // 8. Platform selection setup
  let plat = preferredPlatform || currentPreviewPlatform || 'ig';
  if (!selectedPlatformIds.includes(plat) && selectedPlatformIds.length > 0) {
    plat = selectedPlatformIds[0];
  }
  switchPreviewPlatform(plat);

  // 9. Show Modal
  const modal = document.getElementById('modal-post-preview');
  if (modal) modal.style.display = 'flex';
  const stage = document.querySelector('.social-feed-stage-col');
  if (stage) stage.scrollTop = 0;
  showToast('Live preview generated for connected channels!', '👁️');
}
window.openPostPreviewModal = openPostPreviewModal;

function switchPreviewPlatform(platKey) {
  currentPreviewPlatform = platKey;

  // Update tabs
  ['ig', 'li', 'fb', 'tw'].forEach(p => {
    const isTargeted = selectedPlatformIds.includes(p);
    const tab = document.getElementById(`plat-tab-${p}`);
    if (tab) {
      tab.className = `social-plat-tab ${p === platKey ? 'active-' + p : ''}`;
      tab.style.opacity = isTargeted ? '1' : '0.55';
    }
    const pill = document.getElementById(`plat-pill-${p}`);
    if (pill) {
      if (p === platKey) {
        pill.innerText = isTargeted ? '👁️ Viewing' : '👁️ Viewing (Excluded)';
        pill.style.background = isTargeted ? 'rgba(15, 157, 138, 0.35)' : 'rgba(239, 68, 68, 0.2)';
        pill.style.color = isTargeted ? '#2DD4BF' : '#FCA5A5';
        pill.style.borderColor = isTargeted ? '#0F9D8A' : '#EF4444';
      } else {
        pill.innerText = isTargeted ? '✓ Live' : 'Excluded';
        pill.style.background = 'rgba(255, 255, 255, 0.08)';
        pill.style.color = isTargeted ? '#94A3B8' : '#64748B';
        pill.style.borderColor = 'transparent';
      }
    }
    const card = document.getElementById(`preview-card-${p}`);
    if (card) {
      card.style.display = (p === platKey) ? 'block' : 'none';
    }
  });

  // Always reset stage scroll to top so top of post and phone bezel are completely visible
  const stage = document.querySelector('.social-feed-stage-col');
  if (stage) stage.scrollTop = 0;

  // Update sidebar info
  const platMeta = {
    'ig': {
      name: 'Instagram Feed & Reel',
      icon: '📸',
      aspect: currentActiveStudioMode === 'video' ? '9:16 Reel (1080x1920)' : (currentActiveStudioMode === 'image' ? '4:5 Feed (1080x1350)' : '1:1 Branded Slide'),
      mode: currentActiveStudioMode === 'video' ? 'Reel / Short-Form Video' : (currentActiveStudioMode === 'image' ? 'Single Visual Feed' : 'Branded Quote Canvas'),
      safeZone: 'Safe for mobile portrait view with no UI clipping.',
      maxChars: 2200,
      foldChars: 125,
      accName: '@vibodhai (Verified)'
    },
    'li': {
      name: 'LinkedIn Feed Post',
      icon: '💼',
      aspect: currentActiveStudioMode === 'text' ? 'Text Article Post' : '16:9 Landscape / 1:1 Square',
      mode: currentActiveStudioMode === 'video' ? 'Native Video Post' : (currentActiveStudioMode === 'image' ? 'Image Attachment' : 'Thought Leadership Text'),
      safeZone: 'Professional headline & top 3 lines rendered above fold.',
      maxChars: 3000,
      foldChars: 140,
      accName: 'Vibodh AI • 14,820 Followers'
    },
    'fb': {
      name: 'Facebook Page Post',
      icon: '👥',
      aspect: currentActiveStudioMode === 'text' ? 'Status Update' : '1:1 Square / 1.91:1 Link Bar',
      mode: currentActiveStudioMode === 'video' ? 'Video Player Post' : (currentActiveStudioMode === 'image' ? 'News Feed Photo' : 'Text Update'),
      safeZone: 'Link preview banner and interactive CTA button included.',
      maxChars: 63206,
      foldChars: 250,
      accName: 'Vibodh AI Official Page'
    },
    'tw': {
      name: 'Twitter / X Post',
      icon: '🐦',
      aspect: currentActiveStudioMode === 'text' ? '280-char Tweet' : '16:9 Media Card',
      mode: currentActiveStudioMode === 'video' ? 'X Video Post' : (currentActiveStudioMode === 'image' ? 'Embedded Media' : 'Standard Tweet'),
      safeZone: 'Compact single-scroll card optimized for high virality.',
      maxChars: 280,
      foldChars: 280,
      accName: '@vibodhai (Verified)'
    }
  };

  const meta = platMeta[platKey] || platMeta['ig'];
  const nameEl = document.getElementById('sidebar-plat-name');
  const iconEl = document.getElementById('sidebar-plat-icon');
  const aspectEl = document.getElementById('sidebar-aspect-ratio');
  const modeEl = document.getElementById('sidebar-content-mode');
  const safeZoneEl = document.getElementById('sidebar-safe-zone-hint');
  const charCounterEl = document.getElementById('sidebar-char-counter');
  const charProgressEl = document.getElementById('sidebar-char-progress');
  const truncEl = document.getElementById('sidebar-truncation-hint');
  const hashtagEl = document.getElementById('sidebar-hashtag-counter');

  if (nameEl) nameEl.innerText = meta.name;
  if (iconEl) iconEl.innerText = meta.icon;
  if (aspectEl) aspectEl.innerText = meta.aspect;
  if (modeEl) modeEl.innerText = meta.mode;
  if (safeZoneEl) safeZoneEl.innerText = meta.safeZone;

  // Calculate character length
  let copyText = '';
  if (currentActiveStudioMode === 'text') {
    copyText = document.getElementById('mockup-caption-text')?.innerText || '';
  } else if (currentActiveStudioMode === 'image') {
    copyText = document.getElementById('cs-image-caption-input')?.value || '';
  } else {
    copyText = document.getElementById('cs-video-caption-input')?.value || '';
  }

  const charCount = copyText.length;
  const pct = Math.min(100, Math.round((charCount / meta.maxChars) * 100));

  if (charCounterEl) {
    charCounterEl.innerText = `${charCount} / ${meta.maxChars.toLocaleString()} chars`;
    if (charCount > meta.maxChars) {
      charCounterEl.style.color = '#EF4444';
    } else {
      charCounterEl.style.color = '#F8FAFC';
    }
  }

  if (charProgressEl) {
    charProgressEl.style.width = `${pct}%`;
    charProgressEl.style.background = charCount > meta.maxChars ? '#EF4444' : '#0F9D8A';
  }

  if (truncEl) {
    truncEl.innerText = `First ${meta.foldChars} chars visible before "see more"`;
  }

  // Count hashtags
  const hashtags = (copyText.match(/#[\w\d_]+/g) || []);
  if (hashtagEl) {
    hashtagEl.innerText = `${hashtags.length} Hashtags (${hashtags.length >= 3 && hashtags.length <= 6 ? 'Optimal' : 'Detected'})`;
  }
}
window.switchPreviewPlatform = switchPreviewPlatform;

function togglePreviewDeviceMode(mode) {
  currentPreviewDevice = mode;
  const btnMobile = document.getElementById('btn-device-mobile');
  const btnDesktop = document.getElementById('btn-device-desktop');
  const container = document.getElementById('preview-device-container');
  const phoneBar = document.getElementById('phone-top-bar');
  const phoneScreen = document.getElementById('phone-screen-inner');

  if (mode === 'mobile') {
    if (btnMobile) btnMobile.classList.add('active');
    if (btnDesktop) btnDesktop.classList.remove('active');
    if (container) container.className = 'phone-mockup-frame';
    if (phoneBar) phoneBar.style.display = 'flex';
    if (phoneScreen) phoneScreen.style.borderRadius = '30px';
  } else {
    if (btnDesktop) btnDesktop.classList.add('active');
    if (btnMobile) btnMobile.classList.remove('active');
    if (container) container.className = 'desktop-feed-mockup-wrap';
    if (phoneBar) phoneBar.style.display = 'none';
    if (phoneScreen) phoneScreen.style.borderRadius = '10px';
  }
}
window.togglePreviewDeviceMode = togglePreviewDeviceMode;

function closePostPreviewModal() {
  const modal = document.getElementById('modal-post-preview');
  if (modal) modal.style.display = 'none';
}
window.closePostPreviewModal = closePostPreviewModal;

function confirmPublishFromPreview() {
  closePostPreviewModal();
  publishLivePost();
}
window.confirmPublishFromPreview = confirmPublishFromPreview;

function copyFormattedPreviewText() {
  let copyText = '';
  if (currentActiveStudioMode === 'text') {
    copyText = document.getElementById('mockup-caption-text')?.innerText || '';
  } else if (currentActiveStudioMode === 'image') {
    copyText = document.getElementById('cs-image-caption-input')?.value || '';
  } else {
    copyText = document.getElementById('cs-video-caption-input')?.value || '';
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(copyText).then(() => {
      showToast('Formatted caption copied to clipboard!', '📋');
    }).catch(() => {
      showToast('Caption ready for copying!', '📋');
    });
  } else {
    showToast('Caption copied to clipboard!', '📋');
  }
}
window.copyFormattedPreviewText = copyFormattedPreviewText;

// ══════════════════════════════════════════════════════════════════════
// PROMPT REFERENCE IMAGE UPLOAD CONTROLLER (IMAGE & VIDEO)
// ══════════════════════════════════════════════════════════════════════
const promptRefImages = {
  image: null,
  video: null
};

function triggerRefUploadClick(mode) {
  const input = document.getElementById(`cs-${mode}-ref-input`);
  if (input) input.click();
}
window.triggerRefUploadClick = triggerRefUploadClick;

function handlePromptRefImageUpload(input, mode) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    promptRefImages[mode] = {
      name: file.name,
      url: dataUrl,
      size: (file.size / 1024).toFixed(1) + ' KB'
    };

    const thumb = document.getElementById(`cs-${mode}-ref-thumb`);
    const nameEl = document.getElementById(`cs-${mode}-ref-name`);
    const dropzone = document.getElementById(`cs-${mode}-ref-dropzone`);
    const attached = document.getElementById(`cs-${mode}-ref-attached`);

    if (thumb) thumb.src = dataUrl;
    if (nameEl) nameEl.innerText = file.name;
    if (dropzone) dropzone.style.display = 'none';
    if (attached) attached.style.display = 'block';

    showToast(`Reference image "${file.name}" attached to ${mode} prompt!`, '🖼️');
  };
  reader.readAsDataURL(file);
}
window.handlePromptRefImageUpload = handlePromptRefImageUpload;

function removePromptReferenceImage(mode) {
  promptRefImages[mode] = null;
  const input = document.getElementById(`cs-${mode}-ref-input`);
  if (input) input.value = '';

  const dropzone = document.getElementById(`cs-${mode}-ref-dropzone`);
  const attached = document.getElementById(`cs-${mode}-ref-attached`);

  if (dropzone) dropzone.style.display = 'flex';
  if (attached) attached.style.display = 'none';

  showToast(`Reference image removed from ${mode} prompt`, '🗑️');
}
window.removePromptReferenceImage = removePromptReferenceImage;

function applySamplePromptReference(mode) {
  const samples = {
    image: {
      name: 'vibodh-neon-brand-guide.png',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'
    },
    video: {
      name: 'saas-dashboard-opening-frame.png',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80'
    }
  };

  const sample = samples[mode] || samples.image;
  promptRefImages[mode] = sample;

  const thumb = document.getElementById(`cs-${mode}-ref-thumb`);
  const nameEl = document.getElementById(`cs-${mode}-ref-name`);
  const dropzone = document.getElementById(`cs-${mode}-ref-dropzone`);
  const attached = document.getElementById(`cs-${mode}-ref-attached`);

  if (thumb) thumb.src = sample.url;
  if (nameEl) nameEl.innerText = sample.name;
  if (dropzone) dropzone.style.display = 'none';
  if (attached) attached.style.display = 'block';

  showToast(`Attached sample reference image: "${sample.name}"!`, '⚡');
}
window.applySamplePromptReference = applySamplePromptReference;

function handleRefDragOver(e, el) {
  e.preventDefault();
  e.stopPropagation();
  el.classList.add('drag-over');
}
window.handleRefDragOver = handleRefDragOver;

function handleRefDragLeave(e, el) {
  e.preventDefault();
  e.stopPropagation();
  el.classList.remove('drag-over');
}
window.handleRefDragLeave = handleRefDragLeave;

function handleRefDrop(e, mode) {
  e.preventDefault();
  e.stopPropagation();
  const dropzone = document.getElementById(`cs-${mode}-ref-dropzone`);
  if (dropzone) dropzone.classList.remove('drag-over');

  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = function(evt) {
      const dataUrl = evt.target.result;
      promptRefImages[mode] = {
        name: file.name,
        url: dataUrl,
        size: (file.size / 1024).toFixed(1) + ' KB'
      };

      const thumb = document.getElementById(`cs-${mode}-ref-thumb`);
      const nameEl = document.getElementById(`cs-${mode}-ref-name`);
      const attached = document.getElementById(`cs-${mode}-ref-attached`);

      if (thumb) thumb.src = dataUrl;
      if (nameEl) nameEl.innerText = file.name;
      if (dropzone) dropzone.style.display = 'none';
      if (attached) attached.style.display = 'block';

      showToast(`Dropped "${file.name}" as ${mode} prompt reference!`, '🖼️');
    };
    reader.readAsDataURL(file);
  }
}
window.handleRefDrop = handleRefDrop;

function setRefConditioningMode(btn, modeKey) {
  const parent = btn.closest('.cs-ref-modes-group');
  if (parent) {
    parent.querySelectorAll('.cs-ref-mode-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  showToast(`Conditioning mode: ${btn.innerText.trim()}`, '🎯');
}
window.setRefConditioningMode = setRefConditioningMode;

// Initialize Platform Multi-Select on Load
if (typeof renderAllPlatformMultiselects === 'function') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAllPlatformMultiselects);
  } else {
    renderAllPlatformMultiselects();
  }
}




