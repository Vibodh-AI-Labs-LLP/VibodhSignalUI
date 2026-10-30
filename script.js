
// ── Textarea innerText compatibility bridge for unified post textbox ────
try {
  if (!Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'innerText')?.set) {
    Object.defineProperty(HTMLTextAreaElement.prototype, 'innerText', {
      get() { return this.value; },
      set(val) {
        this.value = val;
        this.dispatchEvent(new Event('input', { bubbles: true }));
      },
      configurable: true
    });
  }
} catch(e) {}

function handleTextStudioCaptionInput(textarea) {
  if (!textarea) return;
  const text = textarea.value || '';
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const firstLine = lines.length > 0 ? lines[0] : '';
  const leadEl = document.getElementById('mockup-headline-lead');
  if (leadEl) leadEl.innerText = firstLine;

  if (typeof updateSidePreviewLive === 'function') {
    updateSidePreviewLive();
  }
}
window.handleTextStudioCaptionInput = handleTextStudioCaptionInput;

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
        <button onclick="closeModal()" style="border:none; background:#F5F5F4; border-radius:8px; width:32px; height:32px; cursor:pointer; font-size:15px; color:#78716C; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-left:16px;">&times;</button>
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
              <div style="width:28px; height:28px; border-radius:50%; background:${bg}; color:${tc}; font-size:10.5px; font-weight:700; display:flex; align-items:center; justify-content:center;">
                ${done ? '✓' : idx}
              </div>
              <div style="font-size:9px; font-weight:600; color:${active ? '#243B6B' : '#A8A29E'}; white-space:nowrap;">${label}</div>
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
          <div style="font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#78716C; margin-bottom:6px;">Selected Plan</div>
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
                ${opt.savings ? `<span style="background:#DCFCE7; color:#15803D; font-size:9px; font-weight:700; padding:2px 8px; border-radius:99px;">${opt.savings}</span>` : ''}
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
      <div style="font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#0F9D8A; margin-bottom:6px;">Agency Plan Baseline (Custom Scope)</div>
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
            badgeHTML = `<span style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:#0F9D8A; color:#fff; font-size:8.5px; font-weight:700; padding:2px 8px; border-radius:99px; white-space:nowrap;">⭐ Popular</span>`;
          } else if (pack.discount) {
            const badgeBg = pack.credits === 1000 ? '#7C3AED' : '#243B6B';
            badgeHTML = `<span style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:${badgeBg}; color:#fff; font-size:8.5px; font-weight:700; padding:2px 8px; border-radius:99px; white-space:nowrap;">${pack.discount}</span>`;
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
        <span style="font-size:22px;">⚡</span>
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
            style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:12px; color:#78716C;">👁</button>
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
            <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; background:#166534; color:#fff; border-radius:50%; font-size:10.5px;">&#10003;</span>
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
            <span style="display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; background:#9F1239; color:#fff; border-radius:50%; font-size:10.5px;">&#10005;</span>
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

  /* ── 9h. Sidebar Collapse & Mobile Drawer ────────────── */
  const sidebar = document.getElementById('sidebar');
  const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
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

  function toggleSidebarCollapse() {
    if (!sidebar) return;
    const isCollapsed = sidebar.classList.toggle('collapsed');
    try {
      localStorage.setItem('vibodh_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    } catch (e) {}
    if (sidebarCollapseBtn) {
      sidebarCollapseBtn.setAttribute('title', isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
      sidebarCollapseBtn.setAttribute('aria-label', isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
    }
  }

  // Restore saved collapse state on desktop
  try {
    if (window.innerWidth > 991 && localStorage.getItem('vibodh_sidebar_collapsed') === 'true') {
      sidebar?.classList.add('collapsed');
      sidebarCollapseBtn?.setAttribute('title', 'Expand sidebar');
    }
  } catch (e) {}

  sidebarCollapseBtn?.addEventListener('click', e => {
    e.stopPropagation();
    toggleSidebarCollapse();
  });

  sidebarToggle?.addEventListener('click', e => {
    e.stopPropagation();
    if (window.innerWidth <= 991) {
      openSidebar();
    } else {
      toggleSidebarCollapse();
    }
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
    // Update active state on topbar quick nav buttons
    document.querySelectorAll('.topbar-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
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

    // Reset scroll to top & manage no-scroll constraint for Content Studio
    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
      pageContent.scrollTo({ top: 0, behavior: 'smooth' });
      if (viewName === 'content-studio') {
        pageContent.classList.add('cs-no-scroll');
      } else {
        pageContent.classList.remove('cs-no-scroll');
      }
    }

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
    handle: 'Company Page & Personal Profile',
    desc: 'B2B audience, thought leadership, carousel pdfs, and rich business articles.',
    formats: ['Feed Post', 'Carousel Slides', 'Article', 'Poll'],
    color: '#0A66C2',
    bg: '#F0F7FD',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#0A66C2"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z"/></svg>`
  },
  {
    id: 'ig',
    name: 'Instagram',
    handle: '@brand_instagram (Business Account)',
    desc: 'High-engagement visuals, aesthetic lifestyle photography, Reels & Story highlights.',
    formats: ['Feed Post', 'Story', 'Reel Video', 'Multi-slide Carousel'],
    color: '#E1306C',
    bg: '#FDF2F7',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
  },
  {
    id: 'tw',
    name: 'Twitter / X',
    handle: '@brand_x_handle (Verified Pro)',
    desc: 'Real-time discussions, fast-paced thread storytelling, and industry commentary.',
    formats: ['Standard Post', 'Thread Storm', 'Poll', 'Video Clip'],
    color: '#0F172A',
    bg: '#F8FAFC',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#0F172A"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
  },
  {
    id: 'fb',
    name: 'Facebook',
    handle: 'Brand Official Page & VIP Group',
    desc: 'Diverse demographics, community groups, long-form posts, link previews & Reels.',
    formats: ['Page Feed', 'Group Post', 'Facebook Reel', 'Story'],
    color: '#1877F2',
    bg: '#F0F6FF',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
  },
  {
    id: 'yt',
    name: 'YouTube',
    handle: 'Brand Channel & Shorts Hub',
    desc: 'World largest video engine. Great for vertical Shorts, trailers & Community posts.',
    formats: ['YouTube Short', 'Community Post', 'Video Premiere'],
    color: '#FF0000',
    bg: '#FEF2F2',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
  },
  {
    id: 'tt',
    name: 'TikTok',
    handle: '@brand_creators (Official)',
    desc: 'High viral potential, dynamic trending sounds, snappy short videos & photo mode carousels.',
    formats: ['Video Feed', 'Photo Slides', 'Story'],
    color: '#000000',
    bg: '#F8FAFC',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#000000"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`
  },
  {
    id: 'pin',
    name: 'Pinterest',
    handle: 'Brand Visual Board',
    desc: 'High buyer intent, eternal shelf life pins, infographic cards and DIY guides.',
    formats: ['Standard Pin', 'Idea Pin', 'Product Board'],
    color: '#E60023',
    bg: '#FFF1F2',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#E60023"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>`
  },
  {
    id: 'th',
    name: 'Threads',
    handle: '@brand_threads (Meta)',
    desc: 'Bite-sized conversational text, behind the scenes, and spontaneous community interactions.',
    formats: ['Text Thread', 'Photo Snippet', 'Link Share'],
    color: '#0F172A',
    bg: '#F8FAFC',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#0F172A"><path d="M12.186 24C5.467 24 0 18.533 0 11.814 0 5.095 5.467 0 12.186 0c6.643 0 11.968 5.253 12.181 11.888h-3.033c-.206-4.992-4.296-8.99-9.148-8.99-5.068 0-9.186 4.118-9.186 9.186 0 5.068 4.118 9.186 9.186 9.186 3.535 0 6.61-2.007 8.118-4.945l2.673 1.458C20.916 21.657 16.892 24 12.186 24zm1.536-7.854c-1.393 0-2.483-.873-2.483-2.28 0-1.423 1.107-2.31 2.483-2.31 1.408 0 2.513.887 2.513 2.31 0 1.407-1.105 2.28-2.513 2.28z"/></svg>`
  }
];

let selectedPlatformIds = ['li', 'ig', 'tw', 'fb'];
try {
  const saved = localStorage.getItem('vibodh_selected_platforms');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      selectedPlatformIds = parsed;
    }
  }
} catch(e) {}
let channelsSearchFilter = '';

/* Renders the Target Channels options cards inside the right side panel */
function renderAllChannelCards() {
  const modes = ['text', 'image', 'video'];
  modes.forEach(mode => renderChannelSelectionCards(mode));
}
window.renderAllChannelCards = renderAllChannelCards;

function renderChannelSelectionCards(mode) {
  const container = document.getElementById(`cs-channels-options-container-${mode}`);
  const countBadge = document.getElementById(`cs-channels-count-${mode}`);

  if (countBadge) {
    countBadge.innerText = `${selectedPlatformIds.length} Active Channel${selectedPlatformIds.length === 1 ? '' : 's'}`;
  }

  if (!container) return;

  const query = (channelsSearchFilter || '').toLowerCase().trim();
  const filtered = AVAILABLE_PLATFORMS.filter(p =>
    p.name.toLowerCase().includes(query) ||
    (p.desc && p.desc.toLowerCase().includes(query)) ||
    (p.handle && p.handle.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 30px 10px; color:#64748B; font-size:12px;">No channels matching "${query}"</div>`;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const isSelected = selectedPlatformIds.includes(p.id);
    return `
      <div class="cs-channel-card ${isSelected ? 'selected' : ''}" onclick="toggleChannelCard('${p.id}', event)">
        <div class="cs-channel-card-top">
          <div class="cs-channel-card-left">
            <div class="cs-channel-icon-squircle" style="background:${p.bg}; border: 1.5px solid ${p.color}35;">
              ${p.iconSvg}
            </div>
            <div class="cs-channel-info">
              <div class="cs-channel-name-row">
                <span class="cs-channel-name">${p.name}</span>
                <span class="cs-channel-badge ${isSelected ? 'connected' : 'idle'}">
                  ${isSelected ? '● Active' : 'Connected'}
                </span>
              </div>
              <div class="cs-channel-handle">${p.handle || 'Connected Channel'}</div>
            </div>
          </div>
          <div class="cs-channel-toggle-wrap">
            <label class="cs-channel-switch" onclick="event.stopPropagation()">
              <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleChannelCard('${p.id}', event)">
              <span class="cs-channel-slider"></span>
            </label>
          </div>
        </div>
        <div class="cs-channel-formats-row">
          ${(p.formats || []).map(f => `<span class="cs-channel-format-chip">${f}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}
window.renderChannelSelectionCards = renderChannelSelectionCards;

function toggleChannelCard(platId, event) {
  if (event) event.stopPropagation();
  const idx = selectedPlatformIds.indexOf(platId);
  const p = AVAILABLE_PLATFORMS.find(item => item.id === platId);
  const name = p ? p.name : platId;

  if (idx > -1) {
    selectedPlatformIds.splice(idx, 1);
    if (window.showToast) showToast(`${name} removed from target channels`, '⚪');
  } else {
    selectedPlatformIds.push(platId);
    if (window.showToast) showToast(`${name} added to target channels!`, '✅');
  }

  try {
    localStorage.setItem('vibodh_selected_platforms', JSON.stringify(selectedPlatformIds));
  } catch(e) {}

  renderAllChannelCards();
  if (typeof renderAllPlatformMultiselects === 'function') {
    renderAllPlatformMultiselects();
  }
  if (typeof syncPreviewTargetChannels === 'function') {
    syncPreviewTargetChannels();
  }
  if (typeof renderAllSidePreviews === 'function') {
    renderAllSidePreviews();
  }
}
window.toggleChannelCard = toggleChannelCard;

function bulkSetChannels(selectAll, mode) {
  if (selectAll) {
    selectedPlatformIds = AVAILABLE_PLATFORMS.map(p => p.id);
    if (window.showToast) showToast('All 8 target channels selected!', '🎯');
  } else {
    selectedPlatformIds = [];
    if (window.showToast) showToast('All channels deselected', '⚪');
  }

  try {
    localStorage.setItem('vibodh_selected_platforms', JSON.stringify(selectedPlatformIds));
  } catch(e) {}

  renderAllChannelCards();
  if (typeof renderAllPlatformMultiselects === 'function') {
    renderAllPlatformMultiselects();
  }
  if (typeof syncPreviewTargetChannels === 'function') {
    syncPreviewTargetChannels();
  }
  if (typeof renderAllSidePreviews === 'function') {
    renderAllSidePreviews();
  }
}
window.bulkSetChannels = bulkSetChannels;

function filterChannelsList(input, mode) {
  channelsSearchFilter = input ? input.value : '';
  renderAllChannelCards();
}
window.filterChannelsList = filterChannelsList;

function clearChannelsSearch(mode) {
  channelsSearchFilter = '';
  const searchInput = document.getElementById(`cs-channels-search-${mode}`);
  if (searchInput) searchInput.value = '';
  renderAllChannelCards();
}
window.clearChannelsSearch = clearChannelsSearch;

function updateCsRailButtons(state) {
  const modes = ['text', 'image', 'video'];
  modes.forEach(mode => {
    const genBtn = document.getElementById(`cs-rail-btn-${mode}`);
    const chanBtn = document.getElementById(`cs-rail-btn-channels-${mode}`);
    const draftBtn = document.getElementById(`cs-rail-btn-drafts-${mode}`);
    const schedBtn = document.getElementById(`cs-rail-btn-schedule-${mode}`);
    const guardBtn = document.getElementById(`cs-rail-btn-guardrail-${mode}`);
    const prevBtn = document.getElementById(`cs-rail-btn-preview-${mode}`);

    [genBtn, chanBtn, draftBtn, schedBtn, guardBtn, prevBtn].forEach(b => {
      if (b) b.classList.remove('cs-active-tool-btn');
    });

    if (state === 'options' && genBtn) genBtn.classList.add('cs-active-tool-btn');
    if (state === 'channels' && chanBtn) chanBtn.classList.add('cs-active-tool-btn');
    if (state === 'drafts' && draftBtn) draftBtn.classList.add('cs-active-tool-btn');
    if (state === 'schedule' && schedBtn) schedBtn.classList.add('cs-active-tool-btn');
    if (state === 'guardrail' && guardBtn) guardBtn.classList.add('cs-active-tool-btn');
    if (state === 'preview' && prevBtn) prevBtn.classList.add('cs-active-tool-btn');
  });
}
window.updateCsRailButtons = updateCsRailButtons;

// Fallback compatibility with previous dropdown functions
function renderPlatformMultiselect(mode) {
  // Gracefully no-op if legacy elements not in DOM
}
window.renderPlatformMultiselect = renderPlatformMultiselect;
function renderAllPlatformMultiselects() {
  renderAllChannelCards();
}
window.renderAllPlatformMultiselects = renderAllPlatformMultiselects;
function togglePlatformDropdown() {}
window.togglePlatformDropdown = togglePlatformDropdown;
function closeAllPlatformDropdowns(event) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }

  // 1. Close specific image format dropdown
  const imgDropdown = document.getElementById('cs-dropdown-image-formats');
  const imgParent = document.getElementById('cs-plat-multiselect-image-formats');
  if (imgDropdown) {
    imgDropdown.style.display = 'none';
  }
  if (imgParent) {
    imgParent.classList.remove('open');
    const trigger = imgParent.querySelector('.cs-multiselect-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  // 2. Close any generic multiselect dropdown windows across the DOM
  document.querySelectorAll('.cs-multiselect-dropdown').forEach(dropdown => {
    dropdown.style.display = 'none';
  });
  document.querySelectorAll('.cs-platform-multiselect').forEach(parent => {
    parent.classList.remove('open');
    const trigger = parent.querySelector('.cs-multiselect-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}
window.closeAllPlatformDropdowns = closeAllPlatformDropdowns;
window.closeImageFormatDropdown = closeAllPlatformDropdowns;
function togglePlatformSelection(platId, mode, event) {
  toggleChannelCard(platId, event);
}
window.togglePlatformSelection = togglePlatformSelection;
function removePlatformChip(platId, mode, event) {
  toggleChannelCard(platId, event);
}
window.removePlatformChip = removePlatformChip;
function filterPlatformOptions(input, mode) {
  filterChannelsList(input, mode);
}
window.filterPlatformOptions = filterPlatformOptions;
function clearPlatformSearch(mode) {
  clearChannelsSearch(mode);
}
window.clearPlatformSearch = clearChannelsSearch;
function toggleAllPlatforms(mode) {
  bulkSetChannels(selectedPlatformIds.length !== AVAILABLE_PLATFORMS.length, mode);
}
window.toggleAllPlatforms = toggleAllPlatforms;

// Fallback compatibility
function toggleTargetPlatform(btn, platKey) {
  togglePlatformSelection(platKey, 'text');
}
window.toggleTargetPlatform = toggleTargetPlatform;

// Close dropdown on outside click or when clicking Done
document.addEventListener('click', function(e) {
  const isDoneBtn = e.target.closest('.cs-dropdown-done-btn');
  const isDropdown = e.target.closest('.cs-multiselect-dropdown');
  const isTrigger = e.target.closest('.cs-multiselect-trigger');

  // If clicking on Done button, close immediately!
  if (isDoneBtn) {
    closeAllPlatformDropdowns(e);
    return;
  }

  // If clicking anywhere outside the dropdown and outside the trigger, close immediately!
  if (!isDropdown && !isTrigger) {
    closeAllPlatformDropdowns(e);
  }

  if (!e.target.closest('.cs-goal-dropdown-wrap')) {
    if (typeof closeCreateTypeDropdown === 'function') {
      closeCreateTypeDropdown();
    }
  }
});

// Close dropdown on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeAllPlatformDropdowns(e);
    if (typeof closeCreateTypeDropdown === 'function') {
      closeCreateTypeDropdown();
    }
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
  const el = document.getElementById('mockup-caption-text');
  const text = el?.value || el?.innerText || '';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Post copied to clipboard!', '📋');
    }).catch(() => showToast('Post copied!', '📋'));
  } else {
    showToast('Post copied!', '📋');
  }
}
window.copyMockupCaption = copyMockupCaption;

// ══════════════════════════════════════════════════════════════════════════
// CONTENT STUDIO: 3 TABS (TEXT, IMAGE, VIDEO) CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════
function switchCsMainTab(tabKey) {
  currentActiveStudioMode = tabKey;

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

  // Re-sync current right sidebar state for active tab
  if (typeof getCurrentCsRightSidebarState === 'function' && typeof setCsRightSidebarState === 'function') {
    const currState = getCurrentCsRightSidebarState();
    setCsRightSidebarState(currState);
  }

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

// ══════════════════════════════════════════════════════════════════════
// DEDICATED SOCIAL PROFILES POST SCHEDULER (NOT CAMPAIGN)
// ══════════════════════════════════════════════════════════════════════
let currentSocialSchedMode = 'text';

function openScheduleModal(mode) {
  currentSocialSchedMode = mode || (typeof currentCsMainTab !== 'undefined' ? currentCsMainTab : 'text');
  const modal = document.getElementById('modal-schedule-social-post');
  if (!modal) return;

  // 1. Populate Active Target Channels (from selectedPlatformIds)
  const pillsWrap = document.getElementById('social-sched-platforms-pills');
  if (pillsWrap && typeof AVAILABLE_PLATFORMS !== 'undefined') {
    const activePlats = AVAILABLE_PLATFORMS.filter(p => selectedPlatformIds.includes(p.id));
    if (activePlats.length > 0) {
      pillsWrap.innerHTML = activePlats.map(p => `
        <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;background:${p.bg};border:1px solid ${p.color}40;color:${p.color};font-size:10px;font-weight:700;">
          ${p.iconSvg}
          <span>${p.name}</span>
        </span>
      `).join('');
    } else {
      pillsWrap.innerHTML = '<span style="font-size:10px;color:#94A3B8;">No channels selected. Please select at least one target channel.</span>';
    }
  }

  // 2. Set default date to tomorrow
  const dateInput = document.getElementById('social-sched-date-input');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  // 3. Set default time
  const timeInput = document.getElementById('social-sched-time-input');
  if (timeInput && !timeInput.value) {
    timeInput.value = '10:30';
  }

  // 4. Update Post Preview based on mode
  const badge = document.getElementById('social-sched-mode-badge');
  const previewText = document.getElementById('social-sched-preview-text');
  const thumbWrap = document.getElementById('social-sched-thumb-wrap');

  if (currentSocialSchedMode === 'image') {
    if (badge) badge.innerText = '🖼️ Visual Creative Post';
    const promptInput = document.getElementById('cs-image-prompt-input');
    if (previewText) previewText.innerText = promptInput?.value || 'High-impact AI visual post ready for social publishing';
    const previewImg = document.getElementById('image-result-display') || document.querySelector('.cs-image-canvas-img');
    if (thumbWrap) {
      if (previewImg && previewImg.src && !previewImg.src.includes('data:image/svg')) {
        thumbWrap.innerHTML = `<img src="${previewImg.src}" style="width:100%;height:100%;object-fit:cover;">`;
      } else {
        thumbWrap.innerHTML = '🎨';
      }
    }
  } else if (currentSocialSchedMode === 'video') {
    if (badge) badge.innerText = '🎬 Video Reel Post';
    const promptInput = document.getElementById('cs-video-prompt-input');
    if (previewText) previewText.innerText = promptInput?.value || 'High-energy motion reel ready for social publishing';
    if (thumbWrap) thumbWrap.innerHTML = '🎬';
  } else {
    if (badge) badge.innerText = '📝 Thought-Leadership Post';
    const textEditor = document.getElementById('post-editor-textarea') || document.querySelector('.cs-post-body-editable');
    if (previewText) previewText.innerText = textEditor?.innerText || textEditor?.value || '5 Margin Killers in Agency Operations & Strategic Consultation Post...';
    if (thumbWrap) thumbWrap.innerHTML = '📝';
  }

  modal.style.display = 'flex';
}
window.openScheduleModal = openScheduleModal;

function closeScheduleModal() {
  const modal = document.getElementById('modal-schedule-social-post');
  if (modal) modal.style.display = 'none';
}
window.closeScheduleModal = closeScheduleModal;

function setScheduleQuickSlot(day, time, btn) {
  const dateInput = document.getElementById('social-sched-date-input');
  const timeInput = document.getElementById('social-sched-time-input');
  
  const targetDate = new Date();
  if (day === 'tomorrow') {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');

  if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;
  if (timeInput) timeInput.value = time;

  document.querySelectorAll('.social-sched-quick-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}
window.setScheduleQuickSlot = setScheduleQuickSlot;

function confirmScheduleSocialPost() {
  const dateInput = document.getElementById('social-sched-date-input');
  const timeInput = document.getElementById('social-sched-time-input');
  const tzSelect = document.getElementById('social-sched-tz-select');

  const dateVal = dateInput?.value || 'Tomorrow';
  const timeVal = timeInput?.value || '10:30 AM';
  const tzVal = tzSelect?.value || 'IST';

  if (!selectedPlatformIds || selectedPlatformIds.length === 0) {
    showToast('Please select at least one target channel before scheduling!', '⚠️');
    return;
  }

  const platformNames = (typeof AVAILABLE_PLATFORMS !== 'undefined')
    ? AVAILABLE_PLATFORMS.filter(p => selectedPlatformIds.includes(p.id)).map(p => p.name).join(', ')
    : 'Social Profiles';

  closeScheduleModal();

  showToast(`🎉 Social post successfully scheduled for ${dateVal} at ${timeVal} (${tzVal}) on ${platformNames}!`, '📅');
}
window.confirmScheduleSocialPost = confirmScheduleSocialPost;


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






// ── Updated Prompt Reference Attachment Handlers ─────────────────────────
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
    if (typeof promptRefImages === 'undefined') {
      window.promptRefImages = {};
    }
    promptRefImages[mode] = {
      name: file.name,
      url: dataUrl,
      size: (file.size / 1024).toFixed(1) + ' KB'
    };

    const thumb = document.getElementById(`cs-${mode}-ref-thumb`);
    const nameEl = document.getElementById(`cs-${mode}-ref-name`);
    const chip = document.getElementById(`cs-${mode}-attached-chip`);

    if (thumb) thumb.src = dataUrl;
    if (nameEl) nameEl.innerText = file.name;
    if (chip) chip.style.display = 'inline-flex';

    showToast(`Attached "${file.name}" to ${mode} prompt`, '📎');
  };
  reader.readAsDataURL(file);
}
window.handlePromptRefImageUpload = handlePromptRefImageUpload;

function removePromptReferenceImage(mode) {
  if (typeof promptRefImages !== 'undefined') {
    promptRefImages[mode] = null;
  }
  const input = document.getElementById(`cs-${mode}-ref-input`);
  if (input) input.value = '';

  const chip = document.getElementById(`cs-${mode}-attached-chip`);
  if (chip) chip.style.display = 'none';

  showToast(`Attachment removed from ${mode} prompt`, '🗑️');
}
window.removePromptReferenceImage = removePromptReferenceImage;


// ── Additional Controllers for Screenshot 1 & 2 ─────────────────────────

function updatePillarsChart() {
  const inputs = document.querySelectorAll('#dna-pillars-allocation-list .dna-ratio-input');
  let sum = 0;
  inputs.forEach(inp => {
    sum += parseInt(inp.value, 10) || 0;
  });
  const totalLabel = document.getElementById('dna-pillars-total-ratio');
  if (totalLabel) {
    if (sum === 100) {
      totalLabel.innerHTML = 'Total Ratio: 100% ✓ (Target 100%)';
      totalLabel.style.color = '#0F9D8A';
    } else {
      totalLabel.innerHTML = `Total Ratio: ${sum}% (Target 100%)`;
      totalLabel.style.color = sum > 100 ? '#EF4444' : '#D97706';
    }
  }
}
window.updatePillarsChart = updatePillarsChart;

function removePillarRow(btn) {
  const row = btn.closest('.dna-pillar-alloc-row');
  if (row) {
    row.remove();
    updatePillarsChart();
    showToast('Content pillar removed.', '🗑️');
  }
}
window.removePillarRow = removePillarRow;

function addNewPillarRow() {
  const nameInp = document.getElementById('dna-new-pillar-name');
  const pctInp = document.getElementById('dna-new-pillar-pct');
  const list = document.getElementById('dna-pillars-allocation-list');
  if (!nameInp || !list) return;

  const name = nameInp.value.trim();
  const pct = parseInt(pctInp?.value, 10) || 20;
  if (!name) {
    showToast('Please enter a pillar name.', '⚠️');
    return;
  }

  const colors = ['#0F9D8A', '#7C3AED', '#EA580C', '#2563EB', '#D97706'];
  const rowCount = list.querySelectorAll('.dna-pillar-alloc-row').length;
  const color = colors[rowCount % colors.length];

  const row = document.createElement('div');
  row.className = 'dna-pillar-alloc-row';
  row.innerHTML = `
    <span class="dna-pillar-swatch-dot" style="background:${color};"></span>
    <input type="text" class="dna-input-premium dna-pillar-input" value="${name}" onchange="updatePillarsChart()">
    <div class="dna-ratio-input-wrap">
      <input type="number" class="dna-ratio-input" value="${pct}" min="0" max="100" onchange="updatePillarsChart()">
      <span class="dna-ratio-unit">%</span>
    </div>
    <div class="dna-pillar-swatch-box" style="background:${color};"></div>
    <button type="button" class="btn-dna-delete-prod" onclick="removePillarRow(this)" title="Remove Pillar">✕</button>
  `;
  list.appendChild(row);
  nameInp.value = '';
  updatePillarsChart();
  showToast(`Pillar "${name}" added!`, '🎯');
}
window.addNewPillarRow = addNewPillarRow;

function toggleRegionalDialect(toggle) {
  const statusText = document.getElementById('dna-regional-status-text');
  const warningBanner = document.getElementById('dna-regional-warning-banner');
  const chipsCount = document.querySelectorAll('#dna-approved-chips .dna-regional-chip').length;

  if (toggle.checked) {
    if (statusText) {
      statusText.innerText = 'Enabled';
      statusText.style.color = '#EA580C';
    }
    if (warningBanner) {
      // When enabled, show warning message as in Image 2 if approved vocabulary is empty
      if (chipsCount === 0) {
        warningBanner.style.display = 'flex';
      } else {
        warningBanner.style.display = 'none';
      }
    }
    showToast('Regional language & dialect grounding enabled!', '🌐');
  } else {
    if (statusText) {
      statusText.innerText = 'Disabled';
      statusText.style.color = '#64748B';
    }
    if (warningBanner) {
      warningBanner.style.display = 'none';
    }
    showToast('Regional grounding disabled.', 'ℹ️');
  }
}
window.toggleRegionalDialect = toggleRegionalDialect;

// ══════════════════════════════════════════════════════════════════════
// REGIONAL VOICE & DIALECT MANAGEMENT (SECTION 7 REDESIGN)
// ══════════════════════════════════════════════════════════════════════
const REGIONAL_LANG_PRESETS = [
  { code: "hi", name: "Hindi (हिंदी)", style: "Hinglish Conversational", sampleTagline: "Science-backed skincare jo sach mein kaam kare ✨" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)", style: "Kanglish Colloquial", sampleTagline: "Nimma brand, nija-vada prabhava ✨" },
  { code: "te", name: "Telugu (తెలుగు)", style: "Teluglish Conversational", sampleTagline: "Mee brand, nijamaina prabhavam ✨" },
  { code: "ta", name: "Tamil (தமிழ்)", style: "Tanglish Colloquial", sampleTagline: "Ungal brand, unmaiyana thaakkam ✨" },
  { code: "hinglish", name: "Hinglish", style: "Commercial / Casual", sampleTagline: "Smart solutions jo aapki growth ko boost karein ✨" },
  { code: "en", name: "English", style: "Global Contemporary", sampleTagline: "Built for scale and authentic connection ✨" }
];

const REGIONAL_STYLE_PRESETS = [
  "Hinglish Conversational",
  "Formal Hindi",
  "Regional Colloquial",
  "Urban Colloquial",
  "Commercial / Casual",
  "Modern Conversational",
  "Creative Youth Slang",
  "Professional / Tech",
  "Colloquial Storytelling"
];

function selectLangPreset(btn, langName) {
  // Update active pill UI
  document.querySelectorAll('.dna-lang-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const preset = REGIONAL_LANG_PRESETS.find(p => p.name === langName || p.name.includes(langName));
  
  // 1. Update Target Regional Language select
  const langSelect = document.getElementById('dna-reg-lang');
  if (langSelect) {
    langSelect.value = preset ? preset.name : langName;
  }

  // 2. Update Conversational Style select & input
  const styleSelect = document.getElementById('dna-reg-style-preset');
  const styleInput = document.getElementById('dna-reg-style-input');
  const targetStyle = preset ? preset.style : 'Commercial / Casual';
  if (styleInput) styleInput.value = targetStyle;
  if (styleSelect) {
    let found = false;
    for (let opt of styleSelect.options) {
      if (opt.value === targetStyle) {
        styleSelect.value = targetStyle;
        found = true;
        break;
      }
    }
    if (!found) styleSelect.value = '';
  }

  // 3. Update Sample Tagline textarea
  const taglineEl = document.getElementById('dna-reg-tagline');
  if (taglineEl && preset) {
    if (taglineEl.tagName === 'INPUT' || taglineEl.tagName === 'TEXTAREA') {
      taglineEl.value = preset.sampleTagline;
    } else {
      taglineEl.textContent = preset.sampleTagline;
    }
  }

  if (typeof showToast === 'function') {
    showToast(`Switched regional voice preset to ${langName}`, '🌐');
  }
}
window.selectLangPreset = selectLangPreset;

function onRegLangChange(selectEl) {
  const selectedLang = selectEl.value;
  // Sync with pill
  const pills = document.querySelectorAll('.dna-lang-pill');
  pills.forEach(p => {
    if (p.textContent.trim() === selectedLang || selectedLang.includes(p.textContent.trim())) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  const preset = REGIONAL_LANG_PRESETS.find(p => p.name === selectedLang);
  if (preset) {
    const styleSelect = document.getElementById('dna-reg-style-preset');
    const styleInput = document.getElementById('dna-reg-style-input');
    if (styleInput) styleInput.value = preset.style;
    if (styleSelect) {
      for (let opt of styleSelect.options) {
        if (opt.value === preset.style) {
          styleSelect.value = preset.style;
          break;
        }
      }
    }
    const taglineEl = document.getElementById('dna-reg-tagline');
    if (taglineEl) {
      if (taglineEl.tagName === 'INPUT' || taglineEl.tagName === 'TEXTAREA') {
        taglineEl.value = preset.sampleTagline;
      } else {
        taglineEl.textContent = preset.sampleTagline;
      }
    }
  }
}
window.onRegLangChange = onRegLangChange;

function onRegStylePresetChange(selectEl) {
  if (selectEl && selectEl.value && typeof showToast === 'function') {
    showToast(`Conversational style set to ${selectEl.value}`, '💬');
  }
}
window.onRegStylePresetChange = onRegStylePresetChange;

function addApprovedSlang() {
  const input = document.getElementById('dna-approved-slang-input');
  const container = document.getElementById('dna-approved-chips');
  if (!input || !container) return;

  const phrase = input.value.trim();
  if (!phrase) return;

  const chip = document.createElement('span');
  chip.className = 'dna-regional-chip approved';
  const cleanPhrase = phrase.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  chip.innerHTML = `<span>${cleanPhrase}</span><button type="button" class="dna-regional-chip-remove" onclick="removeApprovedSlang(this)" title="Remove">×</button>`;
  container.appendChild(chip);

  input.value = '';
  updateSlangCounts();
}
window.addApprovedSlang = addApprovedSlang;

function removeApprovedSlang(btn) {
  const chip = btn.closest('.dna-regional-chip');
  if (chip) chip.remove();
  updateSlangCounts();
}
window.removeApprovedSlang = removeApprovedSlang;

function addProhibitedSlang() {
  const input = document.getElementById('dna-prohib-slang-input');
  const container = document.getElementById('dna-prohib-chips');
  if (!input || !container) return;

  const phrase = input.value.trim();
  if (!phrase) return;

  const chip = document.createElement('span');
  chip.className = 'dna-regional-chip prohibited';
  const cleanPhrase = phrase.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  chip.innerHTML = `<span>${cleanPhrase}</span><button type="button" class="dna-regional-chip-remove" onclick="removeProhibitedSlang(this)" title="Remove">×</button>`;
  container.appendChild(chip);

  input.value = '';
  updateSlangCounts();
}
window.addProhibitedSlang = addProhibitedSlang;

function removeProhibitedSlang(btn) {
  const chip = btn.closest('.dna-regional-chip');
  if (chip) chip.remove();
  updateSlangCounts();
}
window.removeProhibitedSlang = removeProhibitedSlang;

function updateSlangCounts() {
  const appContainer = document.getElementById('dna-approved-chips');
  const appCountEl = document.getElementById('dna-approved-slang-count');
  if (appContainer && appCountEl) {
    const total = appContainer.querySelectorAll('.dna-regional-chip').length;
    appCountEl.textContent = `${total} approved`;
  }

  const proContainer = document.getElementById('dna-prohib-chips');
  const proCountEl = document.getElementById('dna-prohib-slang-count');
  if (proContainer && proCountEl) {
    const total = proContainer.querySelectorAll('.dna-regional-chip').length;
    proCountEl.textContent = `${total} prohibited`;
  }
}
window.updateSlangCounts = updateSlangCounts;

function extractRegionalVoiceAi() {
  const lang = document.getElementById('dna-reg-lang')?.value || 'Hinglish';
  const taglineEl = document.getElementById('dna-reg-tagline');
  if (typeof showToast === 'function') {
    showToast(`✨ Extracting voice and colloquial idioms via AI for ${lang}...`, '✨');
  }
  if (taglineEl) {
    taglineEl.style.transition = 'all 0.3s ease';
    taglineEl.style.boxShadow = '0 0 0 4px rgba(245, 158, 11, 0.25)';
    taglineEl.style.borderColor = '#F59E0B';
    setTimeout(() => {
      taglineEl.style.boxShadow = '';
      taglineEl.style.borderColor = '#CBD5E1';
    }, 1200);
  }

  // Populate sample vocabulary for the language if empty
  const appContainer = document.getElementById('dna-approved-chips');
  if (appContainer && appContainer.querySelectorAll('.dna-regional-chip').length === 0) {
    const samples = {
      'Hindi (हिंदी)': ['Bindaas', 'Kamaal ka', 'Dil se'],
      'Kannada (ಕನ್ನಡ)': ['Bombaat', 'Chindi', 'Sakkat'],
      'Telugu (తెలుగు)': ['Keka', 'Adurs', 'Kiraak'],
      'Tamil (தமிழ்)': ['Semma', 'Gethu', 'Mass'],
      'Hinglish': ['Bindaas', 'Jugaad', 'Solid', 'Dhamaal'],
      'English': ['Disruptive', 'Scalable', 'Zero-friction']
    };
    const words = samples[lang] || ['Bindaas', 'Jugaad', 'Solid'];
    appContainer.innerHTML = words.map(w => `<span class="dna-regional-chip approved"><span>${w}</span></span>`).join('');
    const countEl = document.getElementById('dna-approved-slang-count');
    if (countEl) countEl.innerText = `${words.length} approved`;
    const warningBanner = document.getElementById('dna-regional-warning-banner');
    if (warningBanner) warningBanner.style.display = 'none';
  }
}
window.extractRegionalVoiceAi = extractRegionalVoiceAi;

function addDnaTagWithCounter(containerId, inputId, tagClass, countId, typeWord) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(containerId);
  const countEl = document.getElementById(countId);
  if (!input || !container) return;
  const val = input.value.trim();
  if (!val) return;
  const pill = document.createElement('span');
  pill.className = 'dna-tag-pill ' + (tagClass || '');
  pill.innerHTML = `<span>${val}</span><button type="button" class="dna-tag-remove" onclick="this.parentElement.remove(); updateTagCounter('${containerId}', '${countId}', '${typeWord}');">×</button>`;
  container.appendChild(pill);
  input.value = '';
  if (countEl) {
    const total = container.querySelectorAll('.dna-tag-pill').length;
    countEl.innerText = `${total} ${typeWord}`;
  }
}
window.addDnaTagWithCounter = addDnaTagWithCounter;

function updateTagCounter(containerId, countId, typeWord) {
  const container = document.getElementById(containerId);
  const countEl = document.getElementById(countId);
  if (container && countEl) {
    const total = container.querySelectorAll('.dna-tag-pill').length;
    countEl.innerText = `${total} ${typeWord}`;
  }
}
window.updateTagCounter = updateTagCounter;

// 10d. Brand DNA Tabs & All 7 Sections Navigation & Management
const DNA_SECTION_NAMES = {
  1: 'Business Information',
  2: 'Target Audience',
  3: 'Brand Voice & Tone',
  4: 'Visual Identity',
  5: 'Products & Offerings',
  6: 'Content Strategy',
  7: 'Regional Voice'
};

function switchDnaSection(secNum) {
  const targetNum = parseInt(secNum, 10) || 1;
  
  // 1. Hide all 7 sections
  for (let i = 1; i <= 7; i++) {
    const sec = document.getElementById('dna-section-' + i);
    if (sec) sec.style.display = 'none';
  }
  
  // 2. Show target section
  const activeSec = document.getElementById('dna-section-' + targetNum);
  if (activeSec) {
    activeSec.style.display = 'block';
  }
  
  // 3. Update pill tab buttons
  document.querySelectorAll('.dna-pill-btn').forEach(btn => {
    const s = parseInt(btn.getAttribute('data-sec'), 10);
    btn.classList.toggle('active', s === targetNum);
  });
  
  // 4. Update section indicator in subheader
  const indicator = document.getElementById('dna-section-indicator');
  if (indicator) {
    indicator.innerHTML = 'Section ' + targetNum + ' of 7: <strong style="color:#0F172A;">' + (DNA_SECTION_NAMES[targetNum] || '') + '</strong>';
  }
  
  // 5. Scroll smoothly
  if (activeSec) {
    activeSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
window.switchDnaSection = switchDnaSection;

// Backwards compatibility for switchDnaTab
function switchDnaTab(btn, tabKey) {
  if (typeof tabKey === 'number') {
    switchDnaSection(tabKey);
  } else {
    const map = { 'biz': 1, 'audience': 2, 'voice': 3, 'visual': 4, 'products': 5, 'strategy': 6, 'regional': 7 };
    switchDnaSection(map[tabKey] || 1);
  }
}
window.switchDnaTab = switchDnaTab;

// Toggle generic DNA chips (e.g. Proof & Credibility factors in Section 1)
function toggleDnaChip(btn) {
  const isAct = btn.classList.toggle('active');
  const txt = btn.innerText.replace(/^[+✓✕s]+/, '').replace(/[+✓✕s]+$/, '').trim();
  btn.innerText = (isAct ? '✓ ' : '+ ') + txt;
  
  // Update counter
  const wrap = btn.closest('#dna-proof-chips-wrap') || btn.parentElement;
  if (wrap) {
    const activeCount = wrap.querySelectorAll('.dna-chip.active').length;
    const counter = document.getElementById('dna-proof-counter') || wrap.previousElementSibling?.querySelector('span:last-child');
    if (counter) counter.innerText = activeCount + ' factors selected';
  }
}
window.toggleDnaChip = toggleDnaChip;

// Toggle tone traits (Section 3: max 3 allowed)
function toggleToneTrait(btn) {
  const wrap = document.getElementById('dna-tone-chips-wrap') || btn.parentElement;
  const isCurrentlyActive = btn.classList.contains('active');
  const activeCount = wrap.querySelectorAll('.dna-chip.active').length;
  
  if (!isCurrentlyActive && activeCount >= 3) {
    showToast('Maximum of 3 tone traits can be active simultaneously.', '⚠️');
    return;
  }
  
  const nowActive = btn.classList.toggle('active');
  const cleanText = btn.innerText.replace(/^[+✓✕s]+/, '').replace(/[+✓✕s]+$/, '').trim();
  btn.innerText = nowActive ? ('✓ ' + cleanText + ' ×') : ('+ ' + cleanText);
  
  const counter = document.getElementById('dna-tone-counter') || wrap.previousElementSibling?.querySelector('span:last-child');
  const newCount = wrap.querySelectorAll('.dna-chip.active').length;
  if (counter) counter.innerText = newCount + '/3 selected';
}
window.toggleToneTrait = toggleToneTrait;

// Add custom tone trait (Section 3)
function addCustomToneTrait() {
  const input = document.getElementById('dna-custom-tone-input');
  if (!input || !input.value.trim()) return;
  const val = input.value.trim();
  const wrap = document.getElementById('dna-tone-chips-wrap');
  if (!wrap) return;
  
  const activeCount = wrap.querySelectorAll('.dna-chip.active').length;
  const canActivate = activeCount < 3;
  
  const newBtn = document.createElement('button');
  newBtn.type = 'button';
  newBtn.className = 'dna-chip' + (canActivate ? ' active' : '');
  newBtn.onclick = function() { toggleToneTrait(this); };
  newBtn.innerText = canActivate ? ('✓ ' + val + ' ×') : ('+ ' + val);
  wrap.appendChild(newBtn);
  
  input.value = '';
  const counter = document.getElementById('dna-tone-counter');
  const newCount = wrap.querySelectorAll('.dna-chip.active').length;
  if (counter) counter.innerText = newCount + '/3 selected';
  showToast('Custom tone trait added: ' + val, '✨');
}
window.addCustomToneTrait = addCustomToneTrait;

// Product / Service items reordering (Section 5)
function moveProductItem(btn, direction) {
  const card = btn.closest('.dna-product-item-card');
  if (!card) return;
  const container = card.parentElement;
  
  if (direction === -1 && card.previousElementSibling) {
    container.insertBefore(card, card.previousElementSibling);
    reindexProducts(container);
    showToast('Product order updated', '↕️');
  } else if (direction === 1 && card.nextElementSibling) {
    container.insertBefore(card.nextElementSibling, card);
    reindexProducts(container);
    showToast('Product order updated', '↕️');
  }
}
window.moveProductItem = moveProductItem;

function removeProductItem(btn) {
  const card = btn.closest('.dna-product-item-card');
  if (!card) return;
  const container = card.parentElement;
  card.remove();
  reindexProducts(container);
  showToast('Product removed from catalog', '🗑️');
}
window.removeProductItem = removeProductItem;

function reindexProducts(container) {
  const cards = container.querySelectorAll('.dna-product-item-card');
  cards.forEach((c, idx) => {
    const numBox = c.querySelector('.dna-prod-num-box');
    if (numBox) numBox.innerText = (idx + 1);
  });
  const countEl = document.getElementById('dna-prod-registered-count');
  if (countEl) countEl.innerText = cards.length + ' Products Registered';
}

// Section 5: Modal Offering Management Helpers (Edit, Reorder, Delete, Add inside modal)
function updateModalOfferingBadges() {
  const container = document.getElementById('modal-offerings-container');
  if (!container) return;
  const cards = container.querySelectorAll('.modal-offering-edit-card');
  cards.forEach((c, idx) => {
    const badge = c.querySelector('.modal-offering-badge');
    if (badge) badge.innerText = (idx + 1);
    const titleSpan = c.querySelector('.modal-offering-title-label');
    if (titleSpan) titleSpan.innerText = 'Offering #' + (idx + 1);
  });
  const countEl = document.getElementById('modal-offerings-count');
  if (countEl) countEl.innerText = cards.length;
}
window.updateModalOfferingBadges = updateModalOfferingBadges;

function moveModalOffering(btn, direction) {
  const card = btn.closest('.modal-offering-edit-card');
  if (!card) return;
  const container = card.parentElement;
  if (direction === -1 && card.previousElementSibling) {
    container.insertBefore(card, card.previousElementSibling);
    updateModalOfferingBadges();
  } else if (direction === 1 && card.nextElementSibling) {
    container.insertBefore(card.nextElementSibling, card);
    updateModalOfferingBadges();
  }
}
window.moveModalOffering = moveModalOffering;

function deleteModalOffering(btn) {
  const card = btn.closest('.modal-offering-edit-card');
  if (!card) return;
  card.remove();
  updateModalOfferingBadges();
}
window.deleteModalOffering = deleteModalOffering;

function addNewOfferingInModal() {
  const nameInp = document.getElementById('modal-new-offering-name');
  const descInp = document.getElementById('modal-new-offering-desc');
  const name = nameInp ? nameInp.value.trim() : '';
  const desc = descInp ? descInp.value.trim() : '';
  if (!name) {
    showToast('Please enter an offering name', '⚠️');
    if (nameInp) nameInp.focus();
    return;
  }
  const container = document.getElementById('modal-offerings-container');
  if (!container) return;
  const newIdx = container.querySelectorAll('.modal-offering-edit-card').length + 1;
  const escapeVal = s => (s || '').replace(/"/g, '&quot;');
  const escapeTxt = s => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  const cardDiv = document.createElement('div');
  cardDiv.className = 'modal-offering-edit-card';
  cardDiv.style.cssText = 'background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:12px;padding:14px;margin-bottom:12px;position:relative;';
  cardDiv.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="modal-offering-badge" style="width:26px;height:26px;border-radius:6px;background:#0F172A;color:#FFFFFF;display:inline-flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:800;">${newIdx}</span>
        <span class="modal-offering-title-label" style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.04em;">Offering #${newIdx}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <button type="button" class="btn-dna-arrow" onclick="moveModalOffering(this, -1)" title="Move Up" style="width:28px;height:28px;border-radius:6px;background:#FFFFFF;border:1px solid #CBD5E1;cursor:pointer;font-size:9.5px;">▲</button>
        <button type="button" class="btn-dna-arrow" onclick="moveModalOffering(this, 1)" title="Move Down" style="width:28px;height:28px;border-radius:6px;background:#FFFFFF;border:1px solid #CBD5E1;cursor:pointer;font-size:9.5px;">▼</button>
        <button type="button" class="btn-dna-delete-prod" onclick="deleteModalOffering(this)" title="Delete Offering" style="width:28px;height:28px;border-radius:6px;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;cursor:pointer;font-size:10.5px;font-weight:700;">✕</button>
      </div>
    </div>
    <div style="margin-bottom:8px;">
      <label style="font-size:9.5px;font-weight:700;color:#475569;text-transform:uppercase;display:block;margin-bottom:4px;">Offering Name</label>
      <input type="text" class="dna-input-premium modal-offering-name" value="${escapeVal(name)}" placeholder="e.g. Architecture & Design" style="width:100%;font-weight:700;">
    </div>
    <div>
      <label style="font-size:9.5px;font-weight:700;color:#475569;text-transform:uppercase;display:block;margin-bottom:4px;">Offering Pitch & Description</label>
      <textarea class="dna-textarea-premium modal-offering-desc" rows="2" placeholder="Describe key deliverables, architecture, value proposition..." style="width:100%;">${escapeTxt(desc)}</textarea>
    </div>
  `;
  container.appendChild(cardDiv);
  if (nameInp) nameInp.value = '';
  if (descInp) descInp.value = '';
  updateModalOfferingBadges();
  cardDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  showToast('✓ Added to offerings list!', '➕');
}
window.addNewOfferingInModal = addNewOfferingInModal;

function addNewProductFromForm() {
  const nameInput = document.getElementById('dna-new-prod-name');
  const priceInput = document.getElementById('dna-new-prod-price');
  const pitchInput = document.getElementById('dna-new-prod-pitch');
  const urlInput = document.getElementById('dna-new-prod-url');
  
  if (!nameInput || !nameInput.value.trim()) {
    showToast('Please enter a product or service name', '⚠️');
    nameInput?.focus();
    return;
  }
  
  const name = nameInput.value.trim();
  const price = priceInput?.value.trim() || '';
  const pitch = pitchInput?.value.trim() || 'Flagship verified brand offering';
  const url = urlInput?.value.trim() || '';
  
  const list = document.getElementById('dna-products-list');
  if (!list) return;
  
  const currentCount = list.querySelectorAll('.dna-product-item-card').length + 1;
  const card = document.createElement('div');
  card.className = 'dna-product-item-card';
  card.setAttribute('data-id', currentCount);
  card.innerHTML = `
    <div class="dna-prod-num-box">${currentCount}</div>
    <div class="dna-prod-info">
      <div style="display:flex;align-items:center;gap:8px;">
        <h4 class="dna-prod-name">${name}</h4>
        ${price ? `<span style="font-size:9.5px;font-weight:700;color:#0F9D8A;background:#E6F7F5;padding:2px 7px;border-radius:6px;">${price}</span>` : ''}
      </div>
      <p class="dna-prod-desc">${pitch}${url ? ` &bull; <a href="${url}" target="_blank" style="color:#0F9D8A;text-decoration:underline;">${url}</a>` : ''}</p>
    </div>
    <div class="dna-prod-actions">
      <button type="button" class="btn-dna-arrow" onclick="moveProductItem(this, -1)" title="Move Up">▲</button>
      <button type="button" class="btn-dna-arrow" onclick="moveProductItem(this, 1)" title="Move Down">▼</button>
      <button type="button" class="btn-dna-delete-prod" onclick="removeProductItem(this)" title="Remove Product">✕</button>
    </div>
  `;
  list.appendChild(card);
  
  nameInput.value = '';
  if (priceInput) priceInput.value = '';
  if (pitchInput) pitchInput.value = '';
  if (urlInput) urlInput.value = '';
  
  reindexProducts(list);
  showToast('✓ ' + name + ' added to Brand Offerings!', '📦');
}
window.addNewProductFromForm = addNewProductFromForm;

// Workspace Deletion Confirmation Dialog
function deleteWorkspaceConfirm() {
  if (confirm('Are you sure you want to delete this workspace and all associated Brand DNA guidelines? This action cannot be undone.')) {
    showToast('Workspace deletion cancelled for demo protection.', '🛡️');
  }
}
window.deleteWorkspaceConfirm = deleteWorkspaceConfirm;

function saveBrandDna() {
  showToast('Brand DNA saved & re-indexed to vector memory! (100% Score)', '&#129516;');
}
window.saveBrandDna = saveBrandDna;

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE GENERATION CHANNEL & ASPECT RATIO MULTI-SELECT CONTROLLER
// (Matches: "Choose where it will be used - Select every channel you want to prepare")
// ═══════════════════════════════════════════════════════════════════════════

const IMAGE_CHANNEL_FORMATS = [
  {
    id: 'ig',
    name: 'Instagram',
    desc: 'Feed portrait · 4:5',
    ratio: '4:5',
    ratioCss: '4/5',
    color: '#E1306C',
    bg: '#FDF2F7',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#E1306C"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
  },
  {
    id: 'story',
    name: 'Story / Reel',
    desc: 'Full screen · 9:16',
    ratio: '9:16',
    ratioCss: '9/16',
    color: '#D946EF',
    bg: '#FDF4FF',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#D946EF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`
  },
  {
    id: 'li',
    name: 'LinkedIn',
    desc: 'Landscape · 16:9',
    ratio: '16:9',
    ratioCss: '16/9',
    color: '#0A66C2',
    bg: '#F0F7FD',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#0A66C2"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z"/></svg>`
  },
  {
    id: 'fb',
    name: 'Facebook',
    desc: 'Square · 1:1',
    ratio: '1:1',
    ratioCss: '1/1',
    color: '#1877F2',
    bg: '#EFF6FF',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
  },
  {
    id: 'x',
    name: 'X',
    desc: 'Landscape · 16:9',
    ratio: '16:9',
    ratioCss: '16/9',
    color: '#0F172A',
    bg: '#F8FAFC',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#0F172A"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
  },
  {
    id: 'yt',
    name: 'YouTube',
    desc: 'Thumbnail · 16:9',
    ratio: '16:9',
    ratioCss: '16/9',
    color: '#FF0000',
    bg: '#FEF2F2',
    iconSvg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
  }
];

let selectedImageFormatIds = ['ig']; // 1 format active by default (e.g. Instagram 4:5)
let activeImageFormatFilter = '';

function toggleImageFormatDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('cs-dropdown-image-formats');
  const parent = document.getElementById('cs-plat-multiselect-image-formats');
  if (!dropdown || !parent) return;

  const isOpen = parent.classList.contains('open');
  closeAllPlatformDropdowns();

  if (!isOpen) {
    parent.classList.add('open');
    dropdown.style.display = 'block';
    renderImageFormatMultiselect();
    const searchInput = document.getElementById('cs-search-image-formats');
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 60);
    }
  } else {
    parent.classList.remove('open');
    dropdown.style.display = 'none';
  }
}
window.toggleImageFormatDropdown = toggleImageFormatDropdown;

function toggleImageFormatSelection(id, event) {
  if (event) event.stopPropagation();
  const idx = selectedImageFormatIds.indexOf(id);
  const item = IMAGE_CHANNEL_FORMATS.find(f => f.id === id);
  const name = item ? `${item.name} (${item.ratio})` : id;

  if (idx > -1) {
    selectedImageFormatIds.splice(idx, 1);
    showToast(`${name} removed`, '⚪');
  } else {
    selectedImageFormatIds.push(id);
    showToast(`${name} added!`, '📐');
  }

  // Sync with selectedPlatformIds for publishing/schedule workflows
  if (selectedImageFormatIds.includes(id)) {
    if (!selectedPlatformIds.includes(id) && id !== 'story') {
      selectedPlatformIds.push(id);
    }
  }

  renderImageFormatMultiselect();
  renderAllPlatformMultiselects();
  updateImagePreviewAspectRatio();
}
window.toggleImageFormatSelection = toggleImageFormatSelection;

function removeImageFormatChip(id, event) {
  if (event) event.stopPropagation();
  const idx = selectedImageFormatIds.indexOf(id);
  if (idx > -1) {
    selectedImageFormatIds.splice(idx, 1);
    const item = IMAGE_CHANNEL_FORMATS.find(f => f.id === id);
    showToast(`${item ? item.name : id} removed`, '⚪');
    renderImageFormatMultiselect();
    updateImagePreviewAspectRatio();
  }
}
window.removeImageFormatChip = removeImageFormatChip;

function filterImageFormatOptions(input) {
  activeImageFormatFilter = input.value || '';
  renderImageFormatMultiselect();
}
window.filterImageFormatOptions = filterImageFormatOptions;

function clearImageFormatSearch(event) {
  if (event && event.stopPropagation) event.stopPropagation();
  const searchInput = document.getElementById('cs-search-image-formats');
  if (searchInput && searchInput.value) {
    searchInput.value = '';
    activeImageFormatFilter = '';
    renderImageFormatMultiselect();
  } else {
    // If search is already empty, clicking × closes the dropdown
    closeAllPlatformDropdowns(event);
  }
}
window.clearImageFormatSearch = clearImageFormatSearch;

function toggleAllImageFormats() {
  if (selectedImageFormatIds.length === IMAGE_CHANNEL_FORMATS.length) {
    selectedImageFormatIds = [];
    showToast('All channels & aspect ratios deselected', '⚪');
  } else {
    selectedImageFormatIds = IMAGE_CHANNEL_FORMATS.map(f => f.id);
    showToast('All channels & aspect ratios selected!', '📐');
  }
  renderImageFormatMultiselect();
  updateImagePreviewAspectRatio();
}
window.toggleAllImageFormats = toggleAllImageFormats;

function updateImagePreviewAspectRatio() {
  const badge = document.getElementById('cs-img-badge-ratio');
  const previewCard = document.querySelector('.cs-media-preview-card.featured');
  
  if (!selectedImageFormatIds || selectedImageFormatIds.length === 0) {
    if (previewCard) previewCard.style.aspectRatio = '16/9';
    if (badge) badge.innerText = '16:9 HD';
    return;
  }
  const primaryId = selectedImageFormatIds[0];
  const primary = IMAGE_CHANNEL_FORMATS.find(f => f.id === primaryId) || IMAGE_CHANNEL_FORMATS[0];

  if (previewCard && primary) {
    previewCard.style.aspectRatio = primary.ratioCss;
  }

  if (badge && primary) {
    if (selectedImageFormatIds.length === 1) {
      badge.innerText = `${primary.ratio} (${primary.name})`;
    } else {
      badge.innerText = `${primary.ratio} (+${selectedImageFormatIds.length - 1} formats)`;
    }
  }
}
window.updateImagePreviewAspectRatio = updateImagePreviewAspectRatio;

function renderImageFormatMultiselect() {
  const chipsBox = document.getElementById('cs-chips-box-image-formats');
  const listEl = document.getElementById('cs-options-list-image-formats');
  if (!chipsBox || !listEl) return;

  // 1. Render Chips
  if (selectedImageFormatIds.length === 0) {
    chipsBox.innerHTML = '<span class="cs-multiselect-placeholder">Select target channels &amp; formats...</span>';
  } else {
    chipsBox.innerHTML = selectedImageFormatIds.map(id => {
      const f = IMAGE_CHANNEL_FORMATS.find(item => item.id === id);
      if (!f) return '';
      return `
        <span class="cs-plat-chip" style="background:${f.bg}; border-color:${f.color}40;" title="${f.name} (${f.desc})">
          <span class="cs-chip-icon">${f.iconSvg}</span>
          <span class="cs-chip-label" style="font-weight:600;color:#0F172A;">${f.name} <span style="color:#64748B;font-weight:500;font-size:9.5px;">(${f.ratio})</span></span>
          <span class="cs-chip-remove" onclick="removeImageFormatChip('${f.id}', event)" title="Remove ${f.name}">&times;</span>
        </span>
      `;
    }).join('');
  }

  // 2. Render Options
  const query = (activeImageFormatFilter || '').toLowerCase().trim();
  const filtered = IMAGE_CHANNEL_FORMATS.filter(f => f.name.toLowerCase().includes(query) || f.desc.toLowerCase().includes(query) || f.ratio.includes(query));

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="cs-dropdown-no-results">No channels matching "${query}"</div>`;
  } else {
    listEl.innerHTML = filtered.map(f => {
      const isSelected = selectedImageFormatIds.includes(f.id);
      return `
        <div class="cs-dropdown-option-item ${isSelected ? 'selected' : ''}" onclick="toggleImageFormatSelection('${f.id}', event)" style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;cursor:pointer;border-radius:7px;transition:background 0.15s;${isSelected ? 'background:' + f.bg + ';' : ''}">
          <div class="cs-option-left" style="display:flex;align-items:center;gap:10px;">
            <span class="cs-option-logo" style="width:28px;height:28px;border-radius:6px;background:#FFFFFF;border:1px solid ${isSelected ? f.color : '#E2E8F0'};display:flex;align-items:center;justify-content:center;">
              ${f.iconSvg}
            </span>
            <div style="display:flex;flex-direction:column;">
              <span class="cs-option-name" style="${isSelected ? 'color:' + f.color + '; font-weight:700;' : 'color:#0F172A; font-weight:600;'}font-size:11.5px;">${f.name}</span>
              <span style="font-size:9.5px;color:#64748B;">${f.desc}</span>
            </div>
          </div>
          <span class="cs-option-check" style="font-size:11.5px;font-weight:800;color:${isSelected ? f.color : '#CBD5E1'};">${isSelected ? '✓' : '＋'}</span>
        </div>
      `;
    }).join('');
  }
}
window.renderImageFormatMultiselect = renderImageFormatMultiselect;

// Initial render call when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      renderImageFormatMultiselect();
      updateImagePreviewAspectRatio();
    }, 200);
  });
} else {
  setTimeout(() => {
    renderImageFormatMultiselect();
    updateImagePreviewAspectRatio();
  }, 200);
}

/* ═══════════════════════════════════════════════════════════════════════
   WHAT DO YOU WANT TO CREATE? (Section 1 Dropdown Logic)
═══════════════════════════════════════════════════════════════════════ */
const CREATION_GOALS = [
  {
    id: 'trends',
    icon: '🔥',
    title: 'Live Online Trends',
    desc: 'Ride breaking viral news tailored to your brand',
    contextNote: '⚡ Grounded in real-time viral signals & industry news topics below.',
    hasInput: false
  },
  {
    id: 'holidays',
    icon: '🎉',
    title: 'Holidays & Occasions',
    desc: 'Celebrate festivals and calendar days',
    contextNote: '🎉 Generates thematic celebratory copy, seasonal promos & community greetings.',
    hasInput: true,
    inputPlaceholder: 'Enter holiday or seasonal theme (e.g., Earth Day, Diwali, Thanksgiving sale)...'
  },
  {
    id: 'repurpose',
    icon: '♻️',
    title: 'Repurpose Content',
    desc: 'Turn blogs, articles, or transcripts into posts',
    contextNote: '♻️ Converts long-form articles, YouTube transcripts, or notes into punchy social posts.',
    hasInput: true,
    inputPlaceholder: 'Paste blog excerpt, article link, or transcript notes here...'
  },
  {
    id: 'guides',
    icon: '📚',
    title: 'Guides & How-Tos',
    desc: 'Teach your audience with actionable frameworks',
    contextNote: '📚 Structures bite-sized educational carousels, numbered steps, and actionable advice.',
    hasInput: true,
    inputPlaceholder: 'What skill, framework, or lesson do you want to teach?'
  },
  {
    id: 'product',
    icon: '🚀',
    title: 'Product Spotlight',
    desc: 'Turn your products into problem-solving stories',
    contextNote: '🚀 Highlights feature benefits, customer pain points, and high-converting CTAs.',
    hasInput: true,
    inputPlaceholder: 'Describe your product feature, client problem, or launch announcement...'
  },
  {
    id: 'polls',
    icon: '💬',
    title: 'Polls & Discussions',
    desc: 'Ask questions, spark debates & get comments',
    contextNote: '💬 Crafts thought-provoking discussion starters, multiple-choice polls & debate hooks.',
    hasInput: true,
    inputPlaceholder: 'Enter the controversial topic, question, or industry debate you want opinions on...'
  },
  {
    id: 'custom',
    icon: '✨',
    title: 'Custom Idea',
    desc: 'Type anything and let AI craft the package',
    contextNote: '✨ Complete creative freedom—describe your exact angle, audience, and goal.',
    hasInput: true,
    inputPlaceholder: 'Describe whatever idea you have in mind and let Gemini craft the full post...'
  }
];

let activeCreationGoalId = 'trends';
let customGoalInputText = '';

function toggleCreateTypeDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('cs-create-type-menu');
  const wrap = document.getElementById('cs-create-type-dropdown-container');
  if (!menu || !wrap) return;

  const isOpen = wrap.classList.contains('open');
  closeAllPlatformDropdowns();

  if (!isOpen) {
    wrap.classList.add('open');
    menu.style.display = 'block';
    renderCreationGoalDropdown();
  } else {
    wrap.classList.remove('open');
    menu.style.display = 'none';
  }
}
window.toggleCreateTypeDropdown = toggleCreateTypeDropdown;

function closeCreateTypeDropdown() {
  const menu = document.getElementById('cs-create-type-menu');
  const wrap = document.getElementById('cs-create-type-dropdown-container');
  if (menu) menu.style.display = 'none';
  if (wrap) wrap.classList.remove('open');
}
window.closeCreateTypeDropdown = closeCreateTypeDropdown;

function selectCreationGoal(goalId, event) {
  if (event) event.stopPropagation();
  activeCreationGoalId = goalId;
  const goal = CREATION_GOALS.find(g => g.id === goalId) || CREATION_GOALS[0];

  // Update Trigger Content
  const triggerContent = document.getElementById('cs-create-type-trigger-content');
  if (triggerContent) {
    triggerContent.innerHTML = `
      <div class="cs-goal-item-left">
        <span class="cs-goal-item-icon">${goal.icon}</span>
        <div class="cs-goal-item-info">
          <span class="cs-goal-item-title">${goal.title}</span>
          <span class="cs-goal-item-desc">${goal.desc}</span>
        </div>
      </div>
      <div class="cs-goal-trigger-right">
        <span class="cs-goal-active-badge">ACTIVE</span>
        <span class="cs-goal-arrow">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </span>
      </div>
    `;
  }

  // Update Context Guidance / Input Box
  const contextBox = document.getElementById('cs-goal-context-box');
  if (contextBox) {
    let html = `<div class="cs-goal-context-text"><span>${goal.contextNote}</span></div>`;
    if (goal.hasInput) {
      html += `<input type="text" class="cs-goal-custom-input" id="cs-goal-custom-input" placeholder="${goal.inputPlaceholder}" value="${customGoalInputText}" oninput="customGoalInputText=this.value">`;
    }
    contextBox.innerHTML = html;
  }

  // Update Mockup headline based on goal
  const headlineEl = document.getElementById('mockup-headline-lead');
  if (headlineEl) {
    const sampleHeadlines = {
      'trends': 'Most digital agencies are bleeding margins because they treat AI integration like a side project.',
      'holidays': 'Celebrate this season by unlocking 20+ hours of reclaimed billable agency time.',
      'repurpose': '3 High-ROI Frameworks from Our Keynote Breakdown: How to Scale AI Operations.',
      'guides': 'Step-by-Step Guide: How to Automate Social Distribution Without Sacrificing Brand Fidelity.',
      'product': 'Introducing Vibodh Signal 2.0: The Unified AI Operating System for Digital Agencies.',
      'polls': 'Quick Poll: What is the #1 operational bottleneck eating your client margins right now?',
      'custom': 'The Unfair Advantage: How Modern Agencies Deliver 10x Content Volume at Half the Overhead.'
    };
    headlineEl.innerText = sampleHeadlines[goalId] || sampleHeadlines['trends'];
  }

  // Show Section 2 if Live Online Trends is selected, hide or adapt if another goal
  const sec2Trends = document.getElementById('cs-section-2-trends');
  const sec2Holidays = document.getElementById('cs-section-2-holidays');
  const sec2Repurpose = document.getElementById('cs-section-2-repurpose');
  const sec2Guides = document.getElementById('cs-section-2-guides');
  const sec2Product = document.getElementById('cs-section-2-product');
  const sec2Polls = document.getElementById('cs-section-2-polls');
  const sec2Custom = document.getElementById('cs-section-2-custom');

  if (sec2Trends) sec2Trends.style.display = (goalId === 'trends') ? 'block' : 'none';
  if (sec2Holidays) {
    sec2Holidays.style.display = (goalId === 'holidays') ? 'block' : 'none';
    if (goalId === 'holidays' && typeof renderHolidayCards === 'function') {
      renderHolidayCards();
    }
  }
  if (sec2Repurpose) {
    sec2Repurpose.style.display = (goalId === 'repurpose') ? 'block' : 'none';
  }
  if (sec2Guides) {
    sec2Guides.style.display = (goalId === 'guides') ? 'block' : 'none';
    if (goalId === 'guides' && typeof syncGuidePreview === 'function') {
      syncGuidePreview();
    }
  }
  if (sec2Product) {
    sec2Product.style.display = (goalId === 'product') ? 'block' : 'none';
    if (goalId === 'product' && typeof syncProductPreview === 'function') {
      syncProductPreview();
    }
  }
  if (sec2Polls) {
    sec2Polls.style.display = (goalId === 'polls') ? 'block' : 'none';
    if (goalId === 'polls' && typeof syncPollPreview === 'function') {
      syncPollPreview();
    }
  }
  if (sec2Custom) {
    sec2Custom.style.display = (goalId === 'custom') ? 'block' : 'none';
    if (goalId === 'custom' && typeof syncCustomPreview === 'function') {
      syncCustomPreview();
    }
  }
  showToast(`Campaign goal set to ${goal.title}`, goal.icon);
  closeCreateTypeDropdown();
}
window.selectCreationGoal = selectCreationGoal;

function renderCreationGoalDropdown() {
  const list = document.getElementById('cs-create-type-options-list');
  if (!list) return;

  list.innerHTML = CREATION_GOALS.map(g => {
    const isActive = g.id === activeCreationGoalId;
    return `
      <div class="cs-goal-option-card ${isActive ? 'is-active' : ''}" onclick="selectCreationGoal('${g.id}', event)">
        <div class="cs-goal-item-left">
          <span class="cs-goal-item-icon">${g.icon}</span>
          <div class="cs-goal-item-info">
            <span class="cs-goal-item-title">${g.title}</span>
            <span class="cs-goal-item-desc">${g.desc}</span>
          </div>
        </div>
        ${isActive ? '<span class="cs-goal-active-badge">ACTIVE</span>' : ''}
      </div>
    `;
  }).join('');
}
window.renderCreationGoalDropdown = renderCreationGoalDropdown;

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 2: LIVE ONLINE TRENDS DATA & LOGIC
═══════════════════════════════════════════════════════════════════════ */
const LIVE_TRENDS_TOPICS = [
  {
    id: 'trend-1',
    rank: '#1',
    virality: '99/100 virality',
    source: 'J.P. Morgan',
    title: '2026 Software Market Trends, Outlook and Industry Analysis',
    desc: "Explore key software industry trends shaping the market in 2026, including AI's impact on SaaS, venture investment shifts and software M&A activity.",
    summary: "Venture capital and private equity allocations are pivoting aggressively toward agentic AI ecosystems. Legacy seat-based SaaS models face pressure as automated workflows replace manual software usage.",
    briefing: "Comprehensive J.P. Morgan analysis indicates that software vendors without deep workflow automation risk losing up to 35% net revenue retention over the next 18 months."
  },
  {
    id: 'trend-2',
    rank: '#2',
    virality: '97/100 virality',
    source: 'Forbes',
    title: 'With The Rise Of Agentic, Has SaaS Seen Its Moment?',
    desc: 'Agentic AI is fundamentally reshaping the Software-as-a-Service (SaaS) model, moving value from application usage to autonomous...',
    summary: 'Agentic AI is fundamentally reshaping the Software-as-a-Service (SaaS) model, moving value from application usage to autonomous multi-agent execution.',
    briefing: 'Enterprise software buyers are transitioning budgets toward autonomous AI solutions that deliver completed work rather than seat licenses that require human data entry.'
  },
  {
    id: 'trend-3',
    rank: '#3',
    virality: '95/100 virality',
    source: 'Constellation Research',
    title: 'Enterprise Cloud Optimization Focuses on AI Token Economics',
    desc: 'CIOs overhaul architecture to prevent runaway GPU billing and maximize unit margin ROI across enterprise cloud deployments.',
    summary: 'CIOs overhaul architecture to prevent runaway GPU billing and maximize unit margin ROI across enterprise cloud deployments.',
    briefing: 'Constellation Research highlights that 72% of digital agency and enterprise leads cite unpredictable LLM token inference expenses as their primary margin leak.'
  },
  {
    id: 'trend-4',
    rank: '#4',
    virality: '94/100 virality',
    source: 'TechCrunch',
    title: 'OpenAI Launches Autonomous Marketing Agents',
    desc: 'New multi-agent framework enabling end-to-end campaign execution without manual prompting.',
    summary: 'New multi-agent framework enabling end-to-end campaign execution without manual prompting.',
    briefing: 'Framework features autonomous agent orchestration across creative generation, compliance verification, and scheduled distribution.'
  }
];

let selectedTrendTopicId = 'trend-4'; // OpenAI Launches Autonomous Marketing Agents by default
let liveTrendsSearchQuery = '';

function renderLiveTrendsCards() {
  const container = document.getElementById('cs-trends-cards-list');
  if (!container) return;

  const query = (liveTrendsSearchQuery || '').toLowerCase().trim();
  const filtered = LIVE_TRENDS_TOPICS.filter(t => 
    t.title.toLowerCase().includes(query) || 
    t.desc.toLowerCase().includes(query) || 
    t.source.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    container.innerHTML = '<div style="padding:16px;text-align:center;color:#64748B;font-size:10.5px;">No trending topics match your search. Click "Scan Live" to fetch new trends.</div>';
    return;
  }

  container.innerHTML = filtered.map(t => {
    const isSelected = t.id === selectedTrendTopicId;
    return `
      <div class="cs-trend-card ${isSelected ? 'is-selected' : ''}" onclick="selectLiveTrendTopic('${t.id}', event)">
        <div class="cs-trend-card-header">
          <div class="cs-trend-card-left-badge">
            <span class="cs-trend-rank-pill">${t.rank}</span>
            <span class="cs-trend-virality-tag">⚡ ${t.virality}</span>
          </div>
          <span class="cs-trend-source-pill">${t.source}</span>
        </div>
        <div class="cs-trend-card-title">${t.title}</div>
        <div class="cs-trend-card-desc">${t.desc}</div>
      </div>
    `;
  }).join('');
}
window.renderLiveTrendsCards = renderLiveTrendsCards;

function selectLiveTrendTopic(trendId, event) {
  if (event) event.stopPropagation();
  selectedTrendTopicId = trendId;
  const trend = LIVE_TRENDS_TOPICS.find(t => t.id === trendId);
  if (!trend) return;

  const headlineInput = document.getElementById('cs-active-trend-headline');
  const summaryTextarea = document.getElementById('cs-active-trend-summary');
  const briefingTextarea = document.getElementById('cs-active-trend-briefing');

  if (headlineInput) headlineInput.value = trend.title;
  if (summaryTextarea) summaryTextarea.value = trend.summary;
  if (briefingTextarea) {
    briefingTextarea.value = trend.briefing || '';
    updateBriefingCharCount(briefingTextarea.value);
  }

  // Sync right-side preview mockup
  const leadHeadline = document.getElementById('mockup-headline-lead');
  const captionText = document.getElementById('mockup-caption-text');
  if (leadHeadline) leadHeadline.innerText = trend.title;
  if (captionText) {
    captionText.innerText = `${trend.summary}\n\nKey strategic observations for digital leaders:\n• Automated orchestration drives 40% margin improvement\n• Fast distribution across connected social channels\n• Full brand identity adherence with AI guardrails.\n\n👉 Follow for weekly intelligence breakdowns or explore our agency automation roadmap.`;
  }

  renderLiveTrendsCards();
  showToast(`Loaded trend: ${trend.source} · ${trend.title.slice(0, 32)}...`, '🔥');
}
window.selectLiveTrendTopic = selectLiveTrendTopic;

function filterLiveTrends(val) {
  liveTrendsSearchQuery = val || '';
  renderLiveTrendsCards();
}
window.filterLiveTrends = filterLiveTrends;

function clearLiveTrendsSearch() {
  const inp = document.getElementById('cs-trends-search-input');
  if (inp) inp.value = '';
  liveTrendsSearchQuery = '';
  renderLiveTrendsCards();
}
window.clearLiveTrendsSearch = clearLiveTrendsSearch;

function scanLiveGoogleNews() {
  showToast('Scanning live Google News, Bloomberg & J.P. Morgan RSS feeds...', '🔄');
  const btn = document.querySelector('.cs-scan-live-btn');
  if (btn) {
    btn.innerHTML = '<span class="cs-btn-icon">⏳</span> Scanning...';
    btn.style.opacity = '0.7';
  }

  setTimeout(() => {
    if (btn) {
      btn.innerHTML = '<span class="cs-btn-icon">🔄</span> Scan Live';
      btn.style.opacity = '1';
    }
    showToast('Found 4 new viral signals! List refreshed with live virality scores.', '⚡');
    renderLiveTrendsCards();
  }, 750);
}
window.scanLiveGoogleNews = scanLiveGoogleNews;

function openBatchGenerationModal() {
  showToast('Batch Generation active: creating 3 content variations for this trend...', '⚡');
  generateTextStudioPackage();
}
window.openBatchGenerationModal = openBatchGenerationModal;

function updateActiveTrendHeadline(val) {
  const leadHeadline = document.getElementById('mockup-headline-lead');
  if (leadHeadline && val) leadHeadline.innerText = val;
}
window.updateActiveTrendHeadline = updateActiveTrendHeadline;

function updateActiveTrendSummary(val) {
  // Can sync caption
}
window.updateActiveTrendSummary = updateActiveTrendSummary;

function updateBriefingCharCount(val) {
  const counter = document.getElementById('cs-briefing-char-count');
  if (counter) {
    const len = (val || '').length;
    counter.innerText = `(${len} chars)`;
  }
}
window.updateBriefingCharCount = updateBriefingCharCount;

// Initialize Live Trends Section
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderLiveTrendsCards === 'function') renderLiveTrendsCards();
  });
} else {
  if (typeof renderLiveTrendsCards === 'function') renderLiveTrendsCards();
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 2: HOLIDAYS & OCCASIONS DATA & LOGIC
═══════════════════════════════════════════════════════════════════════ */
const HOLIDAYS_DATA = [
  {
    id: 'holiday-dussehra',
    type: 'indian',
    tagText: 'IN Indian · 📅 2026-10-20',
    date: '2026-10-20',
    title: 'Dussehra / Vijayadashami',
    desc: 'Victory of virtue over vice, courage, and overcoming obstacles',
    category: 'Indian Cultural & Religious Festival',
    theme: 'Celebrate the triumph of innovation over legacy friction. Share inspirational client success stories and seasonal agency growth offers.'
  },
  {
    id: 'holiday-halloween',
    type: 'global',
    tagText: '🌏 Global · 📅 2026-10-31',
    date: '2026-10-31',
    title: 'Halloween',
    desc: 'Playful spooky season, costume celebration, and festive storytelling',
    category: 'Global & International Observance',
    theme: 'Unmask the hidden costs and spooky bottlenecks haunting agency margins! Playful festive copy highlighting unified AI workflows.'
  },
  {
    id: 'holiday-diwali',
    type: 'indian',
    tagText: 'IN Indian · 📅 2026-11-08',
    date: '2026-11-08',
    title: 'Diwali - Festival of Lights',
    desc: 'Celebration of light, prosperity, new beginnings, and festive gifting',
    category: 'Indian Cultural & Religious Festival',
    theme: 'Illuminate your digital marketing pipelines this Diwali with automated workflows, prosperous client ROIs, and festive team greetings.'
  },
  {
    id: 'holiday-thanksgiving',
    type: 'global',
    tagText: '🌏 Global · 📅 2026-11-26',
    date: '2026-11-26',
    title: 'Thanksgiving Day',
    desc: 'Gratitude, client appreciation, team celebration, and seasonal offers',
    category: 'Global & International Observance',
    theme: 'Expressing heartfelt gratitude to our agency partners and clients who scaled with Vibodh Signal this year.'
  },
  {
    id: 'holiday-blackfriday',
    type: 'global',
    tagText: '🌏 Global · 📅 2026-11-27',
    date: '2026-11-27',
    title: 'Black Friday / Cyber Week',
    desc: 'Exclusive agency packages, SaaS discounts, and annual deals',
    category: 'Commercial & Retail Shopping Event',
    theme: 'Unlock our biggest annual credit top-up bonus and upgrade agency delivery speed ahead of Q1.'
  }
];

let selectedHolidayId = 'holiday-dussehra';
let activeHolidayFilterType = 'all';
let holidaySearchQuery = '';

function renderHolidayCards() {
  const container = document.getElementById('cs-holidays-cards-list');
  if (!container) return;

  const query = (holidaySearchQuery || '').toLowerCase().trim();
  const filtered = HOLIDAYS_DATA.filter(h => {
    const matchesCategory = (activeHolidayFilterType === 'all') || (h.type === activeHolidayFilterType);
    const matchesQuery = !query || h.title.toLowerCase().includes(query) || h.desc.toLowerCase().includes(query) || h.date.includes(query);
    return matchesCategory && matchesQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="padding:16px;text-align:center;color:#64748B;font-size:10.5px;">No occasions found matching your filter. Try searching for Diwali, Halloween, etc.</div>';
    return;
  }

  container.innerHTML = filtered.map(h => {
    const isSelected = h.id === selectedHolidayId;
    return `
      <div class="cs-holiday-card ${isSelected ? 'is-selected' : ''}" onclick="selectHolidayCard('${h.id}', event)">
        <div class="cs-holiday-card-tag">${h.tagText}</div>
        <div class="cs-holiday-card-title">${h.title}</div>
        <div class="cs-holiday-card-desc">${h.desc}</div>
      </div>
    `;
  }).join('');
}
window.renderHolidayCards = renderHolidayCards;

function selectHolidayCard(holidayId, event) {
  if (event) event.stopPropagation();
  selectedHolidayId = holidayId;
  const h = HOLIDAYS_DATA.find(item => item.id === holidayId);
  if (!h) return;

  const nameInput = document.getElementById('cs-holiday-name');
  const dateInput = document.getElementById('cs-holiday-date');
  const catSelect = document.getElementById('cs-holiday-category');
  const themeTextarea = document.getElementById('cs-holiday-brand-theme');

  if (nameInput) nameInput.value = h.title;
  if (dateInput) dateInput.value = h.date;
  if (catSelect) catSelect.value = h.category;
  if (themeTextarea) themeTextarea.value = h.theme;

  // Sync right-side preview mockup
  const leadHeadline = document.getElementById('mockup-headline-lead');
  const captionText = document.getElementById('mockup-caption-text');
  if (leadHeadline) leadHeadline.innerText = `Celebrate ${h.title}: ${h.desc.slice(0, 50)}...`;
  if (captionText) {
    captionText.innerText = `✨ Wishing our entire community a joyful ${h.title}!\n\n${h.theme}\n\nMay this season bring breakthrough growth, renewed energy, and elevated momentum for your teams.\n\n👇 Tap the link in bio to explore our seasonal partner roadmap.`;
  }

  renderHolidayCards();
  showToast(`Loaded occasion: ${h.title}`, '🎉');
}
window.selectHolidayCard = selectHolidayCard;

function filterHolidayCategory(type) {
  activeHolidayFilterType = type;
  document.querySelectorAll('.cs-holiday-filter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.id === `cs-filter-holiday-${type}`);
  });
  renderHolidayCards();
}
window.filterHolidayCategory = filterHolidayCategory;

function filterHolidaySearch(val) {
  holidaySearchQuery = val || '';
  renderHolidayCards();
}
window.filterHolidaySearch = filterHolidaySearch;

function clearHolidaySearch() {
  const inp = document.getElementById('cs-holiday-search-input');
  if (inp) inp.value = '';
  holidaySearchQuery = '';
  renderHolidayCards();
}
window.clearHolidaySearch = clearHolidaySearch;

function updateHolidayName(val) {
  const leadHeadline = document.getElementById('mockup-headline-lead');
  if (leadHeadline && val) leadHeadline.innerText = `Celebrate ${val}`;
}
window.updateHolidayName = updateHolidayName;

function updateHolidayDate(val) {}
window.updateHolidayDate = updateHolidayDate;

function updateHolidayCategorySelect(val) {}
window.updateHolidayCategorySelect = updateHolidayCategorySelect;

function updateHolidayBrandTheme(val) {}
window.updateHolidayBrandTheme = updateHolidayBrandTheme;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderHolidayCards === 'function') renderHolidayCards();
  });
} else {
  if (typeof renderHolidayCards === 'function') renderHolidayCards();
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 2: REPURPOSE CONTENT LOGIC
═══════════════════════════════════════════════════════════════════════ */
let activeRepurposeTarget = 'linkedin';
let activeRepurposeSource = 'blog';

const SAMPLE_REPURPOSE_ARTICLE = `In digital marketing automation, agencies frequently encounter operational friction when scaling across disparate platforms. While traditional teams spend up to 25 hours per week manually formatting copy, designing banner variants, and managing approval queues, AI-driven operating systems unify this entire workflow into a single synchronized pipeline. 

By leveraging Brand DNA grounding, marketing agencies eliminate prompt drift and ensure 100% voice fidelity across LinkedIn, Instagram, X, and Facebook. Furthermore, automating token economics and campaign scheduling frees senior strategists to focus on high-margin advisory consulting rather than mechanical execution. Teams adopting unified AI workflows report an average 3.8x increase in monthly content output while reducing operational delivery overhead by 42%.`;

function selectRepurposeTarget(targetKey) {
  activeRepurposeTarget = targetKey;
  document.querySelectorAll('.cs-repurpose-target-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `cs-target-${targetKey}`);
  });

  const targetNames = {
    'linkedin': 'LinkedIn Post',
    'carousel': 'Document Carousel',
    'reel': 'Video Reel Script',
    'newsletter': 'Newsletter Brief'
  };

  showToast(`Target format: ${targetNames[targetKey] || targetKey}`, '🎯');
}
window.selectRepurposeTarget = selectRepurposeTarget;

function selectRepurposeSource(sourceKey) {
  activeRepurposeSource = sourceKey;
  document.querySelectorAll('.cs-repurpose-source-pill').forEach(btn => {
    btn.classList.toggle('active', btn.id === `cs-source-${sourceKey}`);
  });

  const placeholders = {
    'blog': 'Paste blog article or web essay text here (minimum 50 words)...',
    'video': 'Paste video transcript, timestamps, or YouTube script here (minimum 50 words)...',
    'whitepaper': 'Paste whitepaper executive summary, research findings, or report excerpt here...',
    'speech': 'Paste speech notes, podcast transcript, or interview quotes here...'
  };

  const textarea = document.getElementById('cs-repurpose-content-input');
  if (textarea && !textarea.value.trim()) {
    textarea.placeholder = placeholders[sourceKey] || placeholders['blog'];
  }

  showToast(`Source format: ${sourceKey.toUpperCase()}`, '📑');
}
window.selectRepurposeSource = selectRepurposeSource;

function updateRepurposeWordCount(text) {
  const counter = document.getElementById('cs-repurpose-word-counter');
  if (!counter) return;

  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  if (words >= 50) {
    counter.innerHTML = `✅ ${words} words (Ready to repurpose)`;
    counter.classList.add('is-valid');
  } else {
    counter.innerHTML = `⚠️ ${words} / 50 min words`;
    counter.classList.remove('is-valid');
  }
}
window.updateRepurposeWordCount = updateRepurposeWordCount;

function loadSampleRepurposeArticle() {
  const textarea = document.getElementById('cs-repurpose-content-input');
  if (textarea) {
    textarea.value = SAMPLE_REPURPOSE_ARTICLE;
    updateRepurposeWordCount(textarea.value);
  }

  // Update right-side preview mockup
  const leadHeadline = document.getElementById('mockup-headline-lead');
  const captionText = document.getElementById('mockup-caption-text');
  if (leadHeadline) {
    leadHeadline.innerText = 'How to Build an Omnichannel Content Strategy (Repurposed from Article)';
  }
  if (captionText) {
    captionText.innerText = `Repurposed 3 key operational frameworks from our keynote analysis:\n\n1. Traditional teams waste 25+ hrs/week on manual reformatting.\n2. Grounding in Brand DNA eliminates cross-platform prompt drift.\n3. Unified AI workflows unlock a 3.8x output surge while cutting delivery overhead by 42%.\n\n👇 Read the full report or tap the link in bio to deploy the Vibodh Signal workflow for your agency.`;
  }

  showToast('Loaded sample article (126 words)!', '📜');
}
window.loadSampleRepurposeArticle = loadSampleRepurposeArticle;

/* ==========================================================================
   GUIDES & HOW-TOS SECTION 2 LOGIC
   ========================================================================== */
let activeGuideArchetype = 'howto';

const GUIDE_ARCHETYPES = {
  'howto': {
    name: 'How-to Practical Guide',
    icon: '📖',
    headlineSuffix: ': A Practical Step-by-Step Guide',
    previewLead: 'Step-by-Step Practical Blueprint',
    captionTemplate: (topic) => `Here is your practical 3-step blueprint to master "${topic}":\n\n1. Audit & Foundational Alignment\nMap every client touchpoint to ensure cohesive brand governance.\n\n2. Multi-Channel Signal Syncing\nAutomate distribution workflows while preserving custom platform fidelity.\n\n3. Continuous Performance Loops\nIterate based on engagement analytics to maximize campaign ROI.\n\n👇 Save this guide or tap the link in bio to deploy this framework.`
  },
  'explainer': {
    name: 'Explainer & Concept Deep-Dive',
    icon: '💡',
    headlineSuffix: ' Explained: What Every Agency Needs to Know',
    previewLead: 'Concept Deep-Dive & Architecture',
    captionTemplate: (topic) => `Why does "${topic}" matter more than ever in 2026?\n\nMost teams struggle with operational friction because they treat each channel as an isolated silo.\n\nHere is what changes when you unify your architecture:\n• 3.4x faster turnaround times\n• Zero brand tone drift across platforms\n• Scalable agency delivery without headcount surges\n\n👇 Read the full breakdown below.`
  },
  'checklist': {
    name: 'Actionable Checklist',
    icon: '✅',
    headlineSuffix: ' Implementation Checklist [Interactive]',
    previewLead: 'Actionable Readiness Checklist',
    captionTemplate: (topic) => `Before launching your next campaign, run through this "${topic}" checklist:\n\n[✓] Brand DNA parameters verified and locked\n[✓] Omnichannel assets generated and proofed\n[✓] Cross-platform scheduling queued for peak engagement windows\n[✓] Live analytics telemetry active\n\nBookmark this post so your team stays aligned!`
  },
  'faq': {
    name: 'FAQ & Objection Buster',
    icon: '❓',
    headlineSuffix: ': Top Questions Answered',
    previewLead: 'FAQ & Tactical Insights',
    captionTemplate: (topic) => `The 3 most common misconceptions about "${topic}":\n\nQ: "Does omnichannel mean posting the exact same thing everywhere?"\nA: Absolutely not. Platform tailoring is critical.\n\nQ: "How long does full integration take?"\nA: With unified AI workflows, less than 48 hours.\n\nQ: "What is the immediate impact on agency margins?"\nA: Agencies report a 42% decrease in overhead within 30 days.`
  },
  'comparative': {
    name: 'Comparative Analysis',
    icon: '⚖️',
    headlineSuffix: ': Traditional vs Modern Strategy',
    previewLead: 'Side-by-Side Comparative Analysis',
    captionTemplate: (topic) => `Traditional vs Modern: The Truth About "${topic}"\n\n❌ TRADITIONAL WAY:\n• Manual reformatting for every network (20+ hrs/wk)\n• Fragmented tools and disjointed messaging\n• Inconsistent brand voice\n\n✅ MODERN WAY (Vibodh Signal):\n• 1-click multi-format transformations\n• Grounded in verified Brand DNA\n• Real-time automated scheduling and tracking\n\nWhich path is your agency on?`
  }
};

function selectGuideArchetype(archetypeKey) {
  activeGuideArchetype = archetypeKey;
  document.querySelectorAll('.cs-guide-archetype-pill').forEach(pill => {
    pill.classList.toggle('active', pill.id === `cs-archetype-${archetypeKey}`);
  });

  const arch = GUIDE_ARCHETYPES[archetypeKey];
  if (arch) {
    showToast(`Archetype: ${arch.name}`, arch.icon);
    syncGuidePreview();
  }
}
window.selectGuideArchetype = selectGuideArchetype;

function updateGuideTopic(topic) {
  syncGuidePreview();
}
window.updateGuideTopic = updateGuideTopic;

function updateGuideContext(context) {
  // Sync context into live preview if appropriate
}
window.updateGuideContext = updateGuideContext;

function syncGuidePreview() {
  const topicInput = document.getElementById('cs-guide-topic-input');
  const topic = (topicInput && topicInput.value.trim()) || 'How to Build an Omnichannel Content Strategy';
  const arch = GUIDE_ARCHETYPES[activeGuideArchetype] || GUIDE_ARCHETYPES['howto'];

  const headlineEl = document.getElementById('mockup-headline-lead');
  const captionEl = document.getElementById('mockup-caption-text');

  if (headlineEl) {
    headlineEl.innerText = topic + arch.headlineSuffix;
  }
  if (captionEl) {
    captionEl.innerText = arch.captionTemplate(topic);
  }
}
window.syncGuidePreview = syncGuidePreview;


/* ==========================================================================
   PRODUCT SPOTLIGHT SECTION 2 LOGIC
   ========================================================================== */
let activeProductCatalogItem = 'arch';
let activeStoryFramework = 'pas';

const PRODUCT_CATALOG = {
  'arch': {
    name: 'Architecture & Design',
    desc: 'Deep technical blueprinting and multi-layer structural optimization'
  },
  'ai': {
    name: 'AI Delivery Solutions',
    desc: 'Autonomous agent pipelines and generative marketing orchestration'
  },
  'eng': {
    name: 'Product Engineering Accelerators',
    desc: 'Pre-built modular micro-services for rapid enterprise deployment'
  }
};

const STORY_FRAMEWORKS = {
  'feature': {
    name: 'Feature Spotlight',
    icon: '⭐',
    leadFormat: (product) => `Introducing ${product}: The Enterprise Advantage`,
    captionFormat: (product, useCase) => `Built specifically for high-velocity teams navigating "${useCase}":\n\n✨ Key Highlight: ${product}\n• Native API integration with instant feedback\n• Zero prompt engineering required\n• Pre-aligned with your verified Brand DNA\n\nReady to elevate your agency benchmark? Explore the full architecture today.`
  },
  'pas': {
    name: 'Problem → Solution (PAS / AIDA)',
    icon: '🎯',
    leadFormat: (product, useCase) => `${product} Solves "${useCase}"`,
    captionFormat: (product, useCase) => `🚨 THE PROBLEM:\nMost digital agencies lose 25+ billable hours every week trying to solve "${useCase}" with disjointed legacy tools.\n\n💡 THE AGITATION:\nClient expectations are accelerating, while manual delivery eats directly into your profit margins.\n\n✅ THE SOLUTION: ${product}\nAutomate multi-channel campaign execution while maintaining pixel-perfect brand fidelity.\n\n👇 Tap the link in bio to book a 1-on-1 walkthrough.`
  },
  'workflow': {
    name: 'Agency / Team Workflow',
    icon: '⚡',
    leadFormat: (product) => `How Modern Teams Deploy ${product}`,
    captionFormat: (product, useCase) => `Inside the modern delivery pipeline for "${useCase}":\n\n1. Ingest brand assets into Brand Brain\n2. Trigger automated ${product} generation\n3. Review across multi-platform previews\n4. Direct 1-click publishing to connected channels\n\nStop reinventing the wheel. Reclaim your team's creative focus.`
  },
  'transformation': {
    name: 'Customer Transformation Story',
    icon: '🌟',
    leadFormat: (product) => `From Operational Bottleneck to 3.8x Output with ${product}`,
    captionFormat: (product, useCase) => `"Before integrating ${product}, solving '${useCase}' took our entire senior creative team 4 days.\n\nNow, we deliver complete omnichannel campaigns in under 45 minutes."\n\n— VP of Growth, Apex Creative Media\n\nWant results like this for your agency? Let's talk.`
  }
};

function selectProductCatalogItem(key) {
  activeProductCatalogItem = key;
  document.querySelectorAll('.cs-product-pills-row .cs-product-pill').forEach(pill => {
    if (pill.id.startsWith('cs-catalog-')) {
      pill.classList.toggle('active', pill.id === `cs-catalog-${key}`);
    }
  });

  const customInput = document.getElementById('cs-product-name-input');
  if (customInput) customInput.value = '';

  const prod = PRODUCT_CATALOG[key];
  if (prod) {
    showToast(`Product: ${prod.name}`, '✦');
    syncProductPreview();
  }
}
window.selectProductCatalogItem = selectProductCatalogItem;

function selectStoryFramework(frameworkKey) {
  activeStoryFramework = frameworkKey;
  document.querySelectorAll('.cs-product-pills-row .cs-product-pill').forEach(pill => {
    if (pill.id.startsWith('cs-framework-')) {
      pill.classList.toggle('active', pill.id === `cs-framework-${frameworkKey}`);
    }
  });

  const fw = STORY_FRAMEWORKS[frameworkKey];
  if (fw) {
    showToast(`Framework: ${fw.name}`, fw.icon);
    syncProductPreview();
  }
}
window.selectStoryFramework = selectStoryFramework;

function updateProductCustomName(val) {
  if (val.trim()) {
    document.querySelectorAll('.cs-product-pills-row .cs-product-pill').forEach(pill => {
      if (pill.id.startsWith('cs-catalog-')) pill.classList.remove('active');
    });
  }
  syncProductPreview();
}
window.updateProductCustomName = updateProductCustomName;

function updateProductUseCase(val) {
  syncProductPreview();
}
window.updateProductUseCase = updateProductUseCase;

function syncProductPreview() {
  const customInput = document.getElementById('cs-product-name-input');
  const useCaseInput = document.getElementById('cs-product-usecase-input');

  const customName = customInput && customInput.value.trim();
  const productName = customName || (PRODUCT_CATALOG[activeProductCatalogItem] ? PRODUCT_CATALOG[activeProductCatalogItem].name : 'Vibodh Signal');
  const useCase = (useCaseInput && useCaseInput.value.trim()) || 'How to Build an Omnichannel Content Strategy';

  const fw = STORY_FRAMEWORKS[activeStoryFramework] || STORY_FRAMEWORKS['pas'];

  const headlineEl = document.getElementById('mockup-headline-lead');
  const captionEl = document.getElementById('mockup-caption-text');

  if (headlineEl) {
    headlineEl.innerText = fw.leadFormat(productName, useCase);
  }
  if (captionEl) {
    captionEl.innerText = fw.captionFormat(productName, useCase);
  }
}
window.syncProductPreview = syncProductPreview;


/* ==========================================================================
   POLLS & DISCUSSIONS SECTION 2 LOGIC
   ========================================================================== */
let activePollInteractionType = 'poll';

const POLL_INTERACTION_TYPES = {
  'poll': {
    name: 'Interactive Community Poll',
    icon: '📊',
    leadFormat: (topic) => `POLL: What is the biggest hurdle in ${topic}?`,
    captionFormat: (topic) => `We polled 150+ digital agency founders and creative directors about "${topic}":\n\nWhich bottleneck is eating the most client margin right now?\n\n🔘 Option A: Fragmented cross-platform asset tailoring\n🔘 Option B: Tone inconsistency between copy and creative\n🔘 Option C: Manual approvals and feedback lag\n🔘 Option D: Measuring cross-network attribution\n\nCast your vote below and drop your thoughts in the comments! 👇`
  },
  'debate': {
    name: 'Provocative Industry Debate',
    icon: '🔥',
    leadFormat: (topic) => `Hot Take: The Uncomfortable Truth About ${topic}`,
    captionFormat: (topic) => `Unpopular opinion on "${topic}":\n\nMost teams spend 80% of their energy repurposing mediocre ideas instead of engineering 1 viral breakthrough.\n\nSide A: Omni-presence is table stakes—volume always beats perfection.\nSide B: Fewer, deeply aligned tentpole assets convert 10x better.\n\nWhere do you stand? Debate us in the comments! 👇`
  },
  'thisorthat': {
    name: 'This or That (Visual Choice)',
    icon: '⚖️',
    leadFormat: (topic) => `This or That: ${topic} Strategy Choice`,
    captionFormat: (topic) => `If you had to pick ONE operating model for "${topic}":\n\n👉 Strategy 1: Fully autonomous AI pipelines with human-in-the-loop review\n👉 Strategy 2: 100% human-crafted creative with AI reserved for post-production\n\nDrop 1 or 2 below! 🚀`
  },
  'question': {
    name: 'Open Community Question',
    icon: '💭',
    leadFormat: (topic) => `Community Question: How does your team handle ${topic}?`,
    captionFormat: (topic) => `Quick question for agency leaders and growth marketers:\n\nWhat is the #1 tool or framework you discovered this quarter that completely changed how you approach "${topic}"?\n\nShare your stack below—best responses will be featured in next week's briefing! ✨`
  },
  'quiz': {
    name: 'Knowledge / Diagnostic Quiz',
    icon: '🧠',
    leadFormat: (topic) => `Diagnostic Quiz: Test Your ${topic} Maturity`,
    captionFormat: (topic) => `Quick 10-second audit on your agency's readiness for "${topic}":\n\n1. Can you generate multi-format social assets in under 5 minutes?\n2. Are your brand parameters systematically enforced across every asset?\n3. Is your team saving 20+ hours each week on routine distribution?\n\nScore:\n3/3 = Enterprise Leader\n2/3 = Scaling Efficiently\n0-1/3 = High Margin Risk\n\nHow did your team score? 👇`
  }
};

function selectPollInteractionType(key) {
  activePollInteractionType = key;
  document.querySelectorAll('.cs-poll-type-pills .cs-poll-pill').forEach(pill => {
    pill.classList.toggle('active', pill.id === `cs-polltype-${key}`);
  });

  const item = POLL_INTERACTION_TYPES[key];
  if (item) {
    showToast(`Interaction: ${item.name}`, item.icon);
    syncPollPreview();
  }
}
window.selectPollInteractionType = selectPollInteractionType;

function updatePollTopic(val) {
  syncPollPreview();
}
window.updatePollTopic = updatePollTopic;

function updatePollContext(val) {
  // Sync context into live preview if appropriate
}
window.updatePollContext = updatePollContext;

function syncPollPreview() {
  const topicInput = document.getElementById('cs-poll-topic-input');
  const topic = (topicInput && topicInput.value.trim()) || 'How to Build an Omnichannel Content Strategy';
  const typeItem = POLL_INTERACTION_TYPES[activePollInteractionType] || POLL_INTERACTION_TYPES['poll'];

  const headlineEl = document.getElementById('mockup-headline-lead');
  const captionEl = document.getElementById('mockup-caption-text');

  if (headlineEl) {
    headlineEl.innerText = typeItem.leadFormat(topic);
  }
  if (captionEl) {
    captionEl.innerText = typeItem.captionFormat(topic);
  }
}
window.syncPollPreview = syncPollPreview;


/* ==========================================================================
   CUSTOM IDEA SECTION 2 LOGIC
   ========================================================================== */
function updateCustomPrompt(val) {
  syncCustomPreview(val);
}
window.updateCustomPrompt = updateCustomPrompt;

function syncCustomPreview(customText) {
  const promptInput = document.getElementById('cs-custom-prompt-input');
  const text = (customText !== undefined ? customText : (promptInput && promptInput.value)) || 'Create a high-converting announcement post for our new AI Marketing OS release.';

  const headlineEl = document.getElementById('mockup-headline-lead');
  const captionEl = document.getElementById('mockup-caption-text');

  if (headlineEl) {
    headlineEl.innerText = text.length > 80 ? text.substring(0, 80) + '...' : text;
  }
  if (captionEl) {
    captionEl.innerText = `🚀 Announcement: ${text}\n\nWe built this to solve the single largest operational bottleneck modern agencies face: balancing high-volume multi-channel output with uncompromising brand governance.\n\nKey Highlights:\n• Unified Brand Brain parameters\n• Instant cross-network format transformations\n• Verified tone fidelity on every post\n\nTap the link in bio to experience the workflow live.`;
  }
}
window.syncCustomPreview = syncCustomPreview;


/* ==========================================================================
   SECTION 3: GROUNDING & COMPLETE PACKAGE LOGIC
   ========================================================================== */
function toggleLanguageDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('cs-language-dropdown-menu');
  const trigger = document.getElementById('cs-language-dropdown-trigger');
  const toneMenu = document.getElementById('cs-tone-dropdown-menu');
  const toneTrigger = document.getElementById('cs-tone-dropdown-trigger');

  if (toneMenu) toneMenu.style.display = 'none';
  if (toneTrigger) toneTrigger.classList.remove('open');

  if (menu) {
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
    if (trigger) trigger.classList.toggle('open', !isVisible);
  }
}
window.toggleLanguageDropdown = toggleLanguageDropdown;

function selectDraftLanguage(lang) {
  const label = document.getElementById('cs-selected-language-label');
  if (label) label.innerText = lang;

  const menu = document.getElementById('cs-language-dropdown-menu');
  const trigger = document.getElementById('cs-language-dropdown-trigger');
  if (menu) menu.style.display = 'none';
  if (trigger) trigger.classList.remove('open');

  document.querySelectorAll('#cs-language-dropdown-menu .cs-sec3-menu-item').forEach(item => {
    item.classList.toggle('active', item.innerText.trim() === lang);
  });

  showToast(`Language set to ${lang}`, '🌐');
}
window.selectDraftLanguage = selectDraftLanguage;

function toggleToneDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('cs-tone-dropdown-menu');
  const trigger = document.getElementById('cs-tone-dropdown-trigger');
  const langMenu = document.getElementById('cs-language-dropdown-menu');
  const langTrigger = document.getElementById('cs-language-dropdown-trigger');

  if (langMenu) langMenu.style.display = 'none';
  if (langTrigger) langTrigger.classList.remove('open');

  if (menu) {
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
    if (trigger) trigger.classList.toggle('open', !isVisible);
  }
}
window.toggleToneDropdown = toggleToneDropdown;

function selectDraftTone(toneTitle, toneStyleDesc) {
  const label = document.getElementById('cs-selected-tone-label');
  if (label) label.innerText = toneTitle;

  const styleDesc = document.getElementById('cs-style-desc-text');
  if (styleDesc && toneStyleDesc) styleDesc.innerText = toneStyleDesc;

  const menu = document.getElementById('cs-tone-dropdown-menu');
  const trigger = document.getElementById('cs-tone-dropdown-trigger');
  if (menu) menu.style.display = 'none';
  if (trigger) trigger.classList.remove('open');

  document.querySelectorAll('#cs-tone-dropdown-menu .cs-sec3-menu-item').forEach(item => {
    item.classList.toggle('active', item.innerText.includes(toneTitle));
  });

  showToast(`Tone set to ${toneTitle}`, '✦');
}
window.selectDraftTone = selectDraftTone;

function updateDraftAudience(val) {
  // Sync audience to live preview if applicable
}
window.updateDraftAudience = updateDraftAudience;

function openChooseDocumentsModal() {
  showToast('Opening Document Vault Selector...', '📂');
}
window.openChooseDocumentsModal = openChooseDocumentsModal;

function suggestDraftSources() {
  showToast('AI analyzing Brand Brain for suggested sources...', '✨');
}
window.suggestDraftSources = suggestDraftSources;

function openEditBrandDnaModal() {
  if (typeof openBrandDnaTab === 'function') {
    openBrandDnaTab();
  } else {
    showToast('Navigating to Brand DNA settings...', '🌿');
  }
}
window.openEditBrandDnaModal = openEditBrandDnaModal;

function toggleVaultSearch(isChecked) {
  showToast(isChecked ? 'Knowledge Vault search enabled' : 'Knowledge Vault search disabled', isChecked ? '🔍' : '⚪');
}
window.toggleVaultSearch = toggleVaultSearch;

function generateCompleteContentPackage() {
  if (typeof generateTextStudioPackage === 'function') {
    generateTextStudioPackage();
  }
  showToast('Generating Complete Content Package for LinkedIn, Instagram & Twitter/X...', '⚡');
}
window.generateCompleteContentPackage = generateCompleteContentPackage;

// Close dropdowns on outside click
document.addEventListener('click', function(e) {
  const langMenu = document.getElementById('cs-language-dropdown-menu');
  const langTrigger = document.getElementById('cs-language-dropdown-trigger');
  const toneMenu = document.getElementById('cs-tone-dropdown-menu');
  const toneTrigger = document.getElementById('cs-tone-dropdown-trigger');

  if (langMenu && !langTrigger?.contains(e.target) && !langMenu.contains(e.target)) {
    langMenu.style.display = 'none';
    if (langTrigger) langTrigger.classList.remove('open');
  }
  if (toneMenu && !toneTrigger?.contains(e.target) && !toneMenu.contains(e.target)) {
    toneMenu.style.display = 'none';
    if (toneTrigger) toneTrigger.classList.remove('open');
  }
});


// ═══════════════════════════════════════════════════════════════════════════
// BRAND DNA FLOATING WINDOW (MODAL) CONTROLLER FOR ALL 7 TABS
// ═══════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════
// 🎨 DNA SECTION 4: 5-SWATCH COLOR PALETTE INTERACTIVE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const DNA_PALETTE_COLORS = [
  {
    index: 0,
    hex: '#F6F2F1',
    role: 'Dominant (60%)',
    roleTag: 'PRIMARY',
    glow: 'rgba(203, 213, 225, 0.6)'
  },
  {
    index: 1,
    hex: '#CA4B16',
    role: 'Secondary (30%)',
    roleTag: 'SUPPORT',
    glow: 'rgba(202, 75, 22, 0.45)'
  },
  {
    index: 2,
    hex: '#B84514',
    role: 'Accent (10%)',
    roleTag: 'HIGHLIGHT',
    glow: 'rgba(184, 69, 20, 0.45)'
  },
  {
    index: 3,
    hex: '#FFFFFF',
    role: 'Background',
    roleTag: 'CANVAS',
    glow: 'rgba(148, 163, 184, 0.5)'
  },
  {
    index: 4,
    hex: '#0F172A',
    role: 'Text / Neutral',
    roleTag: 'TYPO',
    glow: 'rgba(15, 23, 42, 0.45)'
  }
];

let activeDnaPaletteIndex = 0;

function selectDnaPaletteColor(index) {
  if (index < 0 || index >= DNA_PALETTE_COLORS.length) return;
  activeDnaPaletteIndex = index;

  // Update bubble active states on both button and wrapper items
  for (let i = 0; i < DNA_PALETTE_COLORS.length; i++) {
    const item = document.getElementById('dna-bubble-item-' + i);
    const btn = document.getElementById('dna-bubble-btn-' + i);
    const isAct = (i === activeDnaPaletteIndex);
    if (item) {
      if (isAct) item.classList.add('active');
      else item.classList.remove('active');
    }
    if (btn) {
      if (isAct) {
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-checked', 'false');
      }
    }
  }

  renderDnaSelectedColorInfo();
}
window.selectDnaPaletteColor = selectDnaPaletteColor;

// Render the 3 pieces of information directly under each circle
function renderDnaSelectedColorInfo() {
  for (let i = 0; i < DNA_PALETTE_COLORS.length; i++) {
    const col = DNA_PALETTE_COLORS[i];
    const roleEl = document.getElementById('dna-bubble-role-' + i);
    if (roleEl) roleEl.innerText = col.role;

    const badgeEl = document.getElementById('dna-bubble-badge-' + i);
    if (badgeEl) badgeEl.innerText = col.roleTag;

    const hexEl = document.getElementById('dna-bubble-hex-' + i);
    if (hexEl) hexEl.innerText = col.hex;
  }
}
window.renderDnaSelectedColorInfo = renderDnaSelectedColorInfo;

// 1-Click Copy Hex with Toast Notification
function copyDnaColorHex(hex) {
  if (!hex) return;
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(hex).then(() => {
      showToast('✓ Copied color code ' + hex + ' to clipboard!', '📋');
    }).catch(() => {
      fallbackCopy(hex);
    });
  } else {
    fallbackCopy(hex);
  }
}
window.copyDnaColorHex = copyDnaColorHex;

function fallbackCopy(hex) {
  const t = document.createElement('textarea');
  t.value = hex;
  document.body.appendChild(t);
  t.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(t);
  showToast('✓ Copied color code ' + hex + ' to clipboard!', '📋');
}

// Sync bubbles with any updated colors from modal
function syncDnaPaletteBubblesFromData() {
  for (let i = 0; i < DNA_PALETTE_COLORS.length; i++) {
    const col = DNA_PALETTE_COLORS[i];
    const btn = document.getElementById('dna-bubble-btn-' + i);
    if (btn) {
      btn.style.background = col.hex;
      btn.style.setProperty('--bubble-color', col.hex);
      btn.style.setProperty('--bubble-glow', col.glow || 'rgba(15, 23, 42, 0.25)');
      if (col.hex.toUpperCase() === '#FFFFFF' || col.hex.toUpperCase() === '#F6F2F1') {
        btn.style.border = '1.5px solid #CBD5E1';
      } else {
        btn.style.border = 'none';
      }
      btn.setAttribute('title', col.role + ' · ' + col.roleTag + ' (' + col.hex + ')');
    }
  }
  renderDnaSelectedColorInfo();
}
window.syncDnaPaletteBubblesFromData = syncDnaPaletteBubblesFromData;

let activeDnaEditType = null;
let activeDnaEditMeta = null;

function openDnaEditModal(type, meta) {
  activeDnaEditType = type;
  activeDnaEditMeta = meta;

  const modal = document.getElementById('dna-edit-modal');
  const iconEl = document.getElementById('dna-modal-icon');
  const titleEl = document.getElementById('dna-modal-title');
  const subEl = document.getElementById('dna-modal-subtitle');
  const bodyEl = document.getElementById('dna-modal-body');

  if (!modal || !bodyEl) return;

  let title = 'Edit Brand DNA';
  let subtitle = 'Update your brand parameters and save changes';
  let icon = '✏️';
  let formHtml = '';

  switch (type) {
    // ── SECTION 1: BRAND LOGO ─────────────────────────────────────
    case 'sec1-logo': {
      icon = '🎨';
      title = 'Edit Brand Logo';
      subtitle = 'Upload a new logo, vector mark, or manage brand graphic assets';

      const currentGraphic = document.getElementById('dna-logo-display-graphic')?.innerHTML || `
        <svg viewBox="0 0 100 100" style="width:64px;height:64px;" fill="none">
          <path d="M18 20L44 80C46 84 52 84 54 80L82 20C84 15 78 12 74 16L50 64L26 16C22 12 16 15 18 20Z" fill="#F0512D"/>
          <circle cx="22" cy="18" r="4" fill="#F97316"/>
          <circle cx="28" cy="28" r="3.5" fill="#FDBA74"/>
          <circle cx="16" cy="32" r="3" fill="#FB923C"/>
          <circle cx="34" cy="42" r="3" fill="#F97316"/>
        </svg>
      `;

      window.pendingModalLogoData = null;

      formHtml = `
        <div style="display:flex;flex-direction:column;gap:18px;">
          <!-- Logo Preview & Actions Card -->
          <div style="display:flex;align-items:center;gap:20px;padding:18px 20px;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:14px;flex-wrap:wrap;">
            <div id="modal-logo-preview" style="width:90px;height:90px;border:2px dashed #CBD5E1;border-radius:12px;background:#FFFFFF;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
              ${currentGraphic}
            </div>

            <div style="flex:1;min-width:220px;">
              <div style="font-size:11.5px;font-weight:700;color:#0F172A;margin-bottom:3px;">Brand Logo Actions</div>
              <div style="font-size:10.5px;color:#64748B;margin-bottom:12px;">Upload a vector mark, PNG, or JPG (SVG recommended for sharp resolution)</div>
              
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <input type="file" id="modal-file-upload-logo" accept="image/*,.svg" style="display:none;" onchange="handleModalLogoUpload(this)">
                <button type="button" class="btn-dna-action" onclick="document.getElementById('modal-file-upload-logo').click()" style="background:#0F9D8A;color:#FFFFFF;border-color:#0F9D8A;font-weight:700;padding:8px 16px;box-shadow:0 2px 6px rgba(15,157,138,0.25);">
                  <span>📁</span> Upload New Logo
                </button>
                <button type="button" class="btn-dna-action-danger" onclick="handleModalLogoRemove()" style="padding:8px 14px;">
                  <span>🗑️</span> Remove Logo
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      break;
    }

    // ── SECTION 1: COMPANY IDENTITY (4 FIELDS ONLY) ────────────────────
    case 'sec1-brand-info': {
      icon = '🏢';
      title = 'Edit Company Identity';
      subtitle = 'Update company name, sector focus, operating location, and website URL';

      const curName = (document.getElementById('dna-display-brand-name')?.innerText || 'Vibodhai').trim();
      const curIndEl = document.getElementById('dna-display-brand-industry');
      const curInd = (curIndEl ? curIndEl.innerText : 'Software, SaaS & AI').trim();
      const curLocation = (document.getElementById('dna-display-location')?.innerText || 'Bengaluru, Karnataka, India').trim();
      const curWebsite = (document.getElementById('dna-display-website')?.innerText || 'https://vibodhai.com').trim();

      const escapeVal = s => (s || '').replace(/"/g, '&quot;');

      formHtml = `
        <div style="display:flex;flex-direction:column;gap:18px;">
          <!-- Row 1: Company Name & Industry Sector (2-Col Grid) -->
          <div class="dna-2col-grid" style="margin-bottom:0;gap:18px;">
            <div class="modal-form-group" style="margin-bottom:0;">
              <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">
                <span>🏢</span> COMPANY / BRAND NAME
              </label>
              <input type="text" id="modal-inp-brand-name" class="dna-input-premium" value="${escapeVal(curName)}" placeholder="e.g. Vibodhai" style="font-size:12px;font-weight:700;">
            </div>

            <div class="modal-form-group" style="margin-bottom:0;">
              <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">
                <span>⚡</span> INDUSTRY &amp; SECTOR
              </label>
              <input type="text" id="modal-inp-brand-industry" list="industry-presets" class="dna-input-premium" value="${escapeVal(curInd)}" placeholder="e.g. Software, SaaS &amp; AI" style="font-size:11.5px;font-weight:600;">
              <datalist id="industry-presets">
                <option value="Software, SaaS &amp; AI">
                <option value="E-Commerce &amp; Retail">
                <option value="FinTech &amp; Financial Services">
                <option value="Healthcare &amp; MedTech">
                <option value="Digital Agency &amp; Marketing">
                <option value="B2B Technology &amp; Cloud">
                <option value="Education &amp; EdTech">
                <option value="Consulting &amp; Professional Services">
              </datalist>
            </div>
          </div>

          <!-- Row 2: Operating Location / Headquarters & Website URL (2-Col Grid) -->
          <div class="dna-2col-grid" style="margin-bottom:0;gap:18px;">
            <div class="modal-form-group" style="margin-bottom:0;">
              <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">
                <span>📍</span> OPERATING LOCATION / HEADQUARTERS
              </label>
              <input type="text" id="modal-inp-brand-location" class="dna-input-premium" value="${escapeVal(curLocation)}" placeholder="e.g. Bengaluru, Karnataka, India" style="font-size:11.5px;font-weight:600;">
            </div>

            <div class="modal-form-group" style="margin-bottom:0;">
              <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">
                <span>🌐</span> WEBSITE URL
              </label>
              <input type="text" id="modal-inp-brand-website" class="dna-input-premium" value="${escapeVal(curWebsite)}" placeholder="e.g. https://vibodhai.com" style="font-size:11.5px;font-weight:600;">
            </div>
          </div>
        </div>
      `;
      break;
    }

    // ── SECTION 1: MISSION, DESCRIPTION & POSITIONING (3 FIELDS) ─────────
    case 'sec1-mission':
    case 'sec1-description':
    case 'sec1-positioning': {
      icon = '🎯';
      title = 'Edit Mission, Description & Value Proposition';
      subtitle = 'Edit core mission statement, brand description, and market positioning';

      const curMission = (document.getElementById('dna-display-mission')?.innerText || '').trim();
      const curDesc = (document.getElementById('dna-display-desc')?.innerText || '').trim();
      const curPos = (document.getElementById('dna-display-positioning')?.innerText || '').trim();

      const escapeTxt = s => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      formHtml = `
        <div style="display:flex;flex-direction:column;gap:18px;">
          <!-- Row 1: Core Mission Statement (Full Width) -->
          <div class="modal-form-group" style="margin-bottom:0;">
            <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">
              <span>🎯</span> CORE MISSION STATEMENT
            </label>
            <textarea id="modal-inp-mission" class="dna-textarea-premium" rows="3" placeholder="Enter your core mission statement..." style="line-height:1.55;font-size:11.5px;">${escapeTxt(curMission)}</textarea>
            <div style="font-size:10px;color:#94A3B8;margin-top:4px;">Define why your company exists and the high-impact value you deliver to customers.</div>
          </div>

          <!-- Row 2: Brand Description (Full Width) -->
          <div class="modal-form-group" style="margin-bottom:0;">
            <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">
              <span>📖</span> BRAND DESCRIPTION
            </label>
            <textarea id="modal-inp-desc" class="dna-textarea-premium" rows="3" placeholder="Brief summary of what your company does..." style="line-height:1.55;font-size:11.5px;">${escapeTxt(curDesc)}</textarea>
            <div style="font-size:10px;color:#94A3B8;margin-top:4px;">Elevator pitch describing what your company does and who it serves.</div>
          </div>

          <!-- Row 3: Positioning / Value Proposition (Full Width) -->
          <div class="modal-form-group" style="margin-bottom:0;">
            <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">
              <span>💎</span> POSITIONING / VALUE PROPOSITION
            </label>
            <textarea id="modal-inp-positioning" class="dna-textarea-premium" rows="3" placeholder="For [target audience] who [problem], [Brand] is [solution]..." style="line-height:1.55;font-size:11.5px;">${escapeTxt(curPos)}</textarea>
            <div style="font-size:10px;color:#94A3B8;margin-top:4px;">Clear differentiation vs conventional competitors and market alternatives.</div>
          </div>
        </div>
      `;
      break;
    }

    case 'sec1-proof':
      icon = '🏆';
      title = 'Edit Proof & Credibility Factors';
      subtitle = 'Select credibility factors and provide supporting verification details';
      const proofDetails = document.getElementById('dna-display-proof-details')?.innerText.trim() || '';
      const activeFactors = Array.from(document.querySelectorAll('#dna-display-proof-chips .dna-tag-pill')).map(p => p.innerText.replace(/^[✓+s]+/, '').trim());
      const allFactors = ['Quality', 'Expertise', 'Results', 'Speed', 'Craftsmanship', 'Innovation', 'Price or value', 'Sustainability', 'Community', 'Awards or certifications', 'Years in business', 'Reviews or ratings', 'Founder story', 'Other'];
      
      let chipsHtml = allFactors.map(f => {
        const isAct = activeFactors.includes(f);
        return `<button type="button" class="dna-chip ${isAct ? 'active' : ''}" onclick="toggleModalDnaChip(this)">${isAct ? '✓ ' : '+ '}${f}</button>`;
      }).join('');

      formHtml = `
        <div class="modal-form-group">
          <label class="modal-form-label">Select Credibility Factors</label>
          <div class="dna-chips-wrap" id="modal-proof-chips-wrap" style="margin-bottom:12px;">
            ${chipsHtml}
          </div>
        </div>
        <div class="modal-form-group">
          <label class="modal-form-label">Supporting Proof Details</label>
          <textarea id="modal-inp-proof-details" class="dna-textarea-premium" rows="4">${proofDetails}</textarea>
        </div>
      `;
      break;

    // ── SECTION 2: TARGET AUDIENCE ───────────────────────────────────────
    case 'sec2-combined':
    case 'sec2-persona':
    case 'sec2-segments': {
      icon = '👥';
      title = 'Edit Target Audience & Segments';
      subtitle = 'Define ideal customer profile, technical roles, and targeted audience segments';
      const curPersona = document.getElementById('dna-display-persona')?.innerText.trim() || '';
      const segTags = Array.from(document.querySelectorAll('#dna-display-segments .dna-tag-pill span')).map(s => s.innerText.trim()).filter(Boolean);
      
      const tagSpans = segTags.map(txt => `
        <span class="modal-tag-item">
          <span>${txt}</span>
          <button type="button" class="modal-tag-remove-btn" onclick="this.parentElement.remove(); if(window.updateModalSegCounter) window.updateModalSegCounter();">✕</button>
        </span>
      `).join('');

      formHtml = `
        <div class="modal-form-group" style="margin-bottom:20px;">
          <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;color:#334155;">
            <span>👤</span> PRIMARY TARGET AUDIENCE PERSONA
          </label>
          <textarea id="modal-inp-persona" class="dna-textarea-premium" rows="4" placeholder="Describe the primary customer persona, target titles, and company profile...">${curPersona}</textarea>
        </div>

        <div class="modal-form-group">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;margin-bottom:0;font-size:10.5px;font-weight:700;color:#334155;">
              <span>👥</span> AUDIENCE SEGMENTS &amp; CORE NEEDS
            </label>
            <span style="font-size:10.5px;color:#64748B;font-weight:600;" id="modal-seg-counter">${segTags.length} segments</span>
          </div>
          <div id="modal-tags-list" style="display:flex;flex-wrap:wrap;gap:8px;padding:12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;min-height:70px;margin-bottom:12px;">
            ${tagSpans || '<span style="color:#94A3B8;font-size:10.5px;font-style:italic;">No segments defined. Add one below.</span>'}
          </div>
          <div class="dna-input-add-row">
            <input type="text" id="modal-inp-new-tag" class="dna-input-premium" placeholder="Add audience segment (e.g. Chief Technology Officer / VP of Engineering)..." onkeydown="if(event.key==='Enter'){event.preventDefault();addModalTag('modal-tags-list');}">
            <button type="button" class="btn-dna-add" onclick="addModalTag('modal-tags-list')">+ Add</button>
          </div>
        </div>
      `;
      break;
    }

    case 'sec2-pain-points':
      icon = '⚠️';
      title = 'Edit Audience Pain Points & Frustrations';
      subtitle = 'Add or remove major customer pain points and objections';
      const painTags = Array.from(document.querySelectorAll('#dna-display-pain-points .dna-tag-pill span')).map(s => s.innerText.trim()).filter(Boolean);
      formHtml = renderModalTagManager('modal-tags-list', painTags, 'tag-rose', 'Add pain point (e.g. Inconsistent tone)...');
      break;

    case 'sec2-desires':
      icon = '✨';
      title = 'Edit Desired Outcomes & Aspirations';
      subtitle = 'Add or remove customer goals, metrics, and desired transformations';
      const desireTags = Array.from(document.querySelectorAll('#dna-display-desires .dna-tag-pill span')).map(s => s.innerText.trim()).filter(Boolean);
      formHtml = renderModalTagManager('modal-tags-list', desireTags, 'tag-purple', 'Add desired outcome (e.g. 10x faster delivery)...');
      break;

    // ── SECTION 3: BRAND VOICE & TONE ───────────────────────────────────
    case 'sec3-combined':
    case 'sec3-tones':
    case 'sec3-personality': {
      icon = '🎙️';
      title = 'Edit Brand Voice & Personality';
      subtitle = 'Select core tone traits and customize brand messaging style instructions';
      const curTones = Array.from(document.querySelectorAll('#dna-display-tone-chips .dna-chip')).map(c => c.innerText.replace(/^[✓+s]+/, '').replace(/×$/, '').trim());
      const availableTones = ['Professional', 'Innovative', 'Clear and professional', 'Friendly and conversational', 'Bold and direct', 'Premium', 'Playful', 'Educational', 'Inspirational', 'Technical', 'Empathetic', 'Authoritative', 'Witty', 'Warm and reassuring'];
      
      let toneChipsHtml = availableTones.map(t => {
        const isAct = curTones.includes(t);
        return `<button type="button" class="dna-chip ${isAct ? 'active' : ''}" onclick="toggleModalToneTrait(this)">${isAct ? '✓ ' + t + ' ×' : '+ ' + t}</button>`;
      }).join('');

      const curPers = document.getElementById('dna-display-personality')?.innerText.trim() || '';

      formHtml = `
        <div class="modal-form-group" style="margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;margin-bottom:0;font-size:10.5px;font-weight:700;color:#334155;">
              <span>🎙️</span> BRAND TONE TRAITS (Select up to 3)
            </label>
            <span style="font-size:10.5px;font-weight:700;color:#0F9D8A;" id="modal-tone-counter">${curTones.length}/3 selected</span>
          </div>
          <div class="dna-chips-wrap" id="modal-tone-chips-wrap" style="margin-bottom:12px;">
            ${toneChipsHtml}
          </div>
          <div class="dna-input-add-row">
            <input type="text" id="modal-inp-custom-tone" class="dna-input-premium" placeholder="Add custom tone trait (e.g. Quirky, Direct)..." onkeydown="if(event.key==='Enter'){event.preventDefault();addModalCustomTone();}">
            <button type="button" class="btn-dna-add" onclick="addModalCustomTone()">+ Add Trait</button>
          </div>
        </div>

        <div class="modal-form-group">
          <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;color:#334155;">
            <span>🎭</span> BRAND PERSONALITY &amp; STYLE INSTRUCTIONS
          </label>
          <textarea id="modal-inp-personality" class="dna-textarea-premium" rows="4" placeholder="Direct, technical, and authoritative with an emphasis on production engineering outcomes...">${curPers}</textarea>
        </div>
      `;
      break;
    }

    case 'sec3-pref-words':
      icon = '📗';
      title = 'Edit Preferred Vocabulary';
      subtitle = 'Add or remove power words favored in copy generation';
      const prefTags = Array.from(document.querySelectorAll('#dna-display-pref-words .dna-tag-pill span')).map(s => s.innerText.trim()).filter(Boolean);
      formHtml = renderModalTagManager('modal-tags-list', prefTags, 'tag-emerald', 'Add preferred word (e.g. accelerators)...');
      break;

    case 'sec3-proh-words':
      icon = '🚫';
      title = 'Edit Prohibited Words';
      subtitle = 'Add or remove words and phrases never to be used in marketing copy';
      const prohTags = Array.from(document.querySelectorAll('#dna-display-proh-words .dna-tag-pill span')).map(s => s.innerText.trim()).filter(Boolean);
      formHtml = renderModalTagManager('modal-tags-list', prohTags, 'tag-rose', 'Add prohibited word (e.g. cheap, hacky)...');
      break;

    // ── SECTION 4: VISUAL IDENTITY ──────────────────────────────────────
    case 'sec4-palette': {
      icon = '🎨';
      title = 'Edit 5-Swatch Color Palette';
      subtitle = 'Configure the 60-30-10 design rule palette for brand generation';

      const items = [
        { num: 1, role: 'Dominant (60%)', badge: 'PRIMARY', hex: DNA_PALETTE_COLORS[0].hex, desc: 'Dominant canvas and structural foundation' },
        { num: 2, role: 'Secondary (30%)', badge: 'SUPPORT', hex: DNA_PALETTE_COLORS[1].hex, desc: 'Brand secondary accent and support tone' },
        { num: 3, role: 'Accent (10%)', badge: 'HIGHLIGHT', hex: DNA_PALETTE_COLORS[2].hex, desc: 'Buttons, badges, and attention calls' },
        { num: 4, role: 'Background', badge: 'CANVAS', hex: DNA_PALETTE_COLORS[3].hex, desc: 'Page canvas and light surface tone' },
        { num: 5, role: 'Text / Neutral', badge: 'TYPO', hex: DNA_PALETTE_COLORS[4].hex, desc: 'Headings, body typography & dark contrast' }
      ];

      formHtml = `
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${items.map(it => `
            <div class="dna-display-swatch-card" style="display:flex;align-items:center;flex-direction:row;justify-content:space-between;padding:12px 16px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;">
              <div style="display:flex;align-items:center;gap:14px;">
                <input type="color" id="modal-color-${it.num}" value="${it.hex}"
                  style="width:42px;height:42px;border-radius:8px;border:1px solid #CBD5E1;cursor:pointer;padding:2px;background:#FFFFFF;"
                  oninput="document.getElementById('modal-hex-${it.num}').value = this.value.toUpperCase()">
                <div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-weight:700;font-size:11.5px;color:#0F172A;">${it.role}</span>
                    <span style="font-size:9.5px;font-weight:700;background:#EEF2F6;color:#475569;padding:2px 7px;border-radius:4px;letter-spacing:0.5px;">${it.badge}</span>
                  </div>
                  <div style="font-size:10.5px;color:#64748B;margin-top:2px;">${it.desc}</div>
                </div>
              </div>
              <input type="text" id="modal-hex-${it.num}" class="dna-input-premium"
                style="width:115px;font-family:monospace;font-weight:700;text-transform:uppercase;"
                value="${it.hex}"
                oninput="if(/^#[0-9A-Fa-f]{6}$/.test(this.value)){ document.getElementById('modal-color-${it.num}').value = this.value; }">
            </div>
          `).join('')}
        </div>
      `;
      break;
    }

    case 'sec4-combined':
    case 'sec4-typography':
    case 'sec4-image-style': {
      icon = '🎨';
      title = 'Edit Typography & Image Style Directives';
      subtitle = 'Configure font families for headings and body, and set image photography directives';
      const curPrimaryFont = document.getElementById('dna-display-typo-primary')?.innerText.trim() || 'Inter, system-ui, sans-serif';
      const curSecFont = document.getElementById('dna-display-typo-secondary')?.innerText.trim() || 'Merriweather, serif';
      const curImgStyle = document.getElementById('dna-display-image-style')?.innerText.trim() || '';

      formHtml = `
        <div class="dna-2col-grid" style="gap:16px;margin-bottom:20px;">
          <div class="modal-form-group" style="margin-bottom:0;">
            <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;color:#334155;">
              <span>🔤</span> PRIMARY HEADING TYPOGRAPHY
            </label>
            <input type="text" id="modal-inp-typo-primary" class="dna-input-premium" value="${curPrimaryFont}" placeholder="e.g. Inter, system-ui, sans-serif">
          </div>
          <div class="modal-form-group" style="margin-bottom:0;">
            <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;color:#334155;">
              <span>🔠</span> SECONDARY / BODY TYPOGRAPHY
            </label>
            <input type="text" id="modal-inp-typo-secondary" class="dna-input-premium" value="${curSecFont}" placeholder="e.g. Merriweather, serif">
          </div>
        </div>

        <div class="modal-form-group">
          <label class="modal-form-label" style="display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;color:#334155;">
            <span>📸</span> IMAGE &amp; PHOTOGRAPHY STYLE DIRECTIVES
          </label>
          <textarea id="modal-inp-image-style" class="dna-textarea-premium" rows="5" placeholder="Specify visual framing, aesthetic directives, lighting, and art direction...">${curImgStyle}</textarea>
        </div>
      `;
      break;
    }

    // ── SECTION 5: PRODUCTS & OFFERINGS ─────────────────────────────────
    case 'sec5-manage-offerings':
    case 'sec5-edit-prod':
    case 'sec5-add-prod': {
      icon = '📦';
      title = 'Edit or Add Offerings';
      subtitle = 'Edit existing offerings, reorder items, delete offerings, or register new ones';

      const list = document.getElementById('dna-products-list');
      const cards = list ? Array.from(list.querySelectorAll('.dna-product-item-card')) : [];

      let itemsHtml = '';
      const escapeVal = s => (s || '').replace(/"/g, '&quot;');
      const escapeTxt = s => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      cards.forEach((c, idx) => {
        const name = (c.querySelector('.dna-prod-name')?.innerText || '').trim();
        const desc = (c.querySelector('.dna-prod-desc')?.innerText || '').trim();

        itemsHtml += `
          <div class="modal-offering-edit-card" data-idx="${idx}" style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:12px;padding:14px;margin-bottom:12px;position:relative;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="modal-offering-badge" style="width:26px;height:26px;border-radius:6px;background:#0F172A;color:#FFFFFF;display:inline-flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:800;">${idx + 1}</span>
                <span class="modal-offering-title-label" style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.04em;">Offering #${idx + 1}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <button type="button" class="btn-dna-arrow" onclick="moveModalOffering(this, -1)" title="Move Up" style="width:28px;height:28px;border-radius:6px;background:#FFFFFF;border:1px solid #CBD5E1;cursor:pointer;font-size:9.5px;">▲</button>
                <button type="button" class="btn-dna-arrow" onclick="moveModalOffering(this, 1)" title="Move Down" style="width:28px;height:28px;border-radius:6px;background:#FFFFFF;border:1px solid #CBD5E1;cursor:pointer;font-size:9.5px;">▼</button>
                <button type="button" class="btn-dna-delete-prod" onclick="deleteModalOffering(this)" title="Delete Offering" style="width:28px;height:28px;border-radius:6px;background:#FEF2F2;border:1px solid #FCA5A5;color:#DC2626;cursor:pointer;font-size:10.5px;font-weight:700;">✕</button>
              </div>
            </div>
            <div style="margin-bottom:8px;">
              <label style="font-size:9.5px;font-weight:700;color:#475569;text-transform:uppercase;display:block;margin-bottom:4px;">Offering Name</label>
              <input type="text" class="dna-input-premium modal-offering-name" value="${escapeVal(name)}" placeholder="e.g. Architecture & Design" style="width:100%;font-weight:700;">
            </div>
            <div>
              <label style="font-size:9.5px;font-weight:700;color:#475569;text-transform:uppercase;display:block;margin-bottom:4px;">Offering Pitch & Description</label>
              <textarea class="dna-textarea-premium modal-offering-desc" rows="2" placeholder="Describe key deliverables, architecture, value proposition..." style="width:100%;">${escapeTxt(desc)}</textarea>
            </div>
          </div>
        `;
      });

      formHtml = `
        <div style="max-height:65vh;overflow-y:auto;padding-right:4px;">
          <!-- Existing Offerings List -->
          <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span style="font-size:10.5px;font-weight:800;color:#0F172A;text-transform:uppercase;letter-spacing:0.04em;">
                Current Offerings (<span id="modal-offerings-count">${cards.length}</span>)
              </span>
              <span style="font-size:10px;color:#64748B;">Reorder with ▲ ▼, edit inline, or remove</span>
            </div>
            <div id="modal-offerings-container">
              ${itemsHtml}
            </div>
          </div>

          <!-- Add New Offering Section -->
          <div style="background:#F0FDF4;border:1.5px dashed #86EFAC;border-radius:12px;padding:16px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
              <span style="font-size:12px;">➕</span>
              <strong style="font-size:11px;color:#166534;text-transform:uppercase;letter-spacing:0.04em;">Add New Offering to Catalog</strong>
            </div>
            <div style="margin-bottom:10px;">
              <label style="font-size:9.5px;font-weight:700;color:#166534;display:block;margin-bottom:4px;">New Offering Title *</label>
              <input type="text" id="modal-new-offering-name" class="dna-input-premium" placeholder="e.g. Enterprise AI Scaling Engine" style="width:100%;background:#FFFFFF;">
            </div>
            <div style="margin-bottom:12px;">
              <label style="font-size:9.5px;font-weight:700;color:#166534;display:block;margin-bottom:4px;">New Offering Pitch / Description</label>
              <textarea id="modal-new-offering-desc" class="dna-textarea-premium" rows="2" placeholder="Detail the flagship service, target deliverable, or technical scope..." style="width:100%;background:#FFFFFF;"></textarea>
            </div>
            <button type="button" onclick="addNewOfferingInModal()" class="btn-dna-action" style="background:#16A34A;color:#FFFFFF;border:none;font-weight:700;padding:7px 14px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:10.5px;">
              <span>+</span> Add to Offerings List
            </button>
          </div>
        </div>
      `;
      break;
    }

    // ── SECTION 6: CONTENT STRATEGY ─────────────────────────────────────
    case 'sec6-pillars':
      icon = '🎯';
      title = 'Edit Content Pillars & Topic Allocation';
      subtitle = 'Adjust topic names, allocations, and distribution percentages (Target 100%)';
      const pillarCards = Array.from(document.querySelectorAll('#dna-display-pillars-list .dna-display-pillar-card'));
      const pillars = pillarCards.map(c => {
        const dot = c.querySelector('.dna-pillar-swatch-dot');
        const color = dot ? dot.style.background || '#0F9D8A' : '#0F9D8A';
        const name = c.querySelector('.dna-display-pillar-name')?.innerText.trim() || '';
        const pct = parseInt(c.querySelector('.dna-display-pillar-pct')?.innerText.replace('%', ''), 10) || 25;
        return { color, name, pct };
      });

      let pillarsRowsHtml = pillars.map((p, idx) => {
        const hex = colorToHex(p.color);
        return `
        <div class="dna-pillar-alloc-row modal-pillar-row" data-idx="${idx}" style="display:flex;align-items:center;gap:10px;">
          <span class="dna-pillar-swatch-dot" style="background:${hex};"></span>
          <input type="text" class="dna-input-premium modal-pillar-name" value="${p.name}" style="flex:1;">
          <div class="dna-ratio-input-wrap" style="width:72px;">
            <input type="number" class="dna-ratio-input modal-pillar-pct" value="${p.pct}" min="0" max="100" onchange="updateModalPillarsTotal()">
            <span class="dna-ratio-unit">%</span>
          </div>
          <input type="color" class="dna-pillar-color-picker modal-pillar-color" value="${hex}" oninput="updateModalPillarRowColor(this)" title="Choose pillar color">
          <button type="button" class="btn-dna-delete-prod" onclick="this.closest('.modal-pillar-row').remove(); updateModalPillarsTotal();" title="Remove Pillar" style="background:transparent;border:none;color:#94A3B8;font-size:13.5px;cursor:pointer;padding:0 4px;" onmouseover="this.style.color='#EF4444'" onmouseout="this.style.color='#94A3B8'">✕</button>
        </div>
      `;
      }).join('');

      formHtml = `
        <div class="modal-form-group">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <label class="modal-form-label" style="margin-bottom:0;">Pillars &amp; Ratios</label>
            <span id="modal-pillars-total-ratio" style="font-size:10.5px;font-weight:700;color:#0F9D8A;">Total Ratio: 100% ✓</span>
          </div>
          <div id="modal-pillars-list" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
            ${pillarsRowsHtml}
          </div>
          <div class="dna-add-pillar-row" style="display:flex;align-items:center;gap:10px;margin-top:10px;">
            <input type="text" id="modal-new-pillar-name" class="dna-input-premium" placeholder="New pillar (e.g. Founder Stories)..." style="flex:1;">
            <div class="dna-ratio-input-wrap" style="width:72px;">
              <input type="number" id="modal-new-pillar-pct" class="dna-ratio-input" value="25" min="0" max="100">
              <span class="dna-ratio-unit">%</span>
            </div>
            <input type="color" id="modal-new-pillar-color" class="dna-pillar-color-picker" value="#0F9D8A" title="Choose color for new pillar">
            <button type="button" class="btn-dna-add" onclick="addModalPillarRow()">+ Add</button>
          </div>
        </div>
      `;
      break;

    case 'sec6-objectives':
      icon = '🎯';
      title = 'Edit Content Objectives';
      subtitle = 'Add or remove primary content marketing objectives';
      const objTags = Array.from(document.querySelectorAll('#dna-display-objectives .dna-tag-pill span')).map(s => s.innerText.trim()).filter(Boolean);
      formHtml = renderModalTagManager('modal-tags-list', objTags, 'tag-mint', 'Add objective (e.g. Lead Gen, Brand Authority)...');
      break;

    case 'sec6-ctas':
      icon = '📣';
      title = 'Edit Preferred Calls to Action';
      subtitle = 'Add or remove target CTAs for AI generation campaigns';
      const ctaTags = Array.from(document.querySelectorAll('#dna-display-ctas .dna-tag-pill span')).map(s => s.innerText.trim()).filter(Boolean);
      formHtml = renderModalTagManager('modal-tags-list', ctaTags, 'tag-purple', 'Add CTA (e.g. Try Free, Book Demo)...');
      break;

    // ── SECTION 7: REGIONAL VOICE ───────────────────────────────────────
    case 'sec7-lang-style':
      icon = '🌐';
      title = 'Edit Regional Language & Conversational Style';
      subtitle = 'Configure primary vernacular and conversational dialect style';
      const curLang = document.getElementById('dna-display-regional-lang')?.innerText.trim().replace(/^🌐s*/, '') || 'English';
      const curDialect = document.getElementById('dna-display-dialect-style')?.innerText.trim() || '';
      formHtml = `
        <div class="modal-form-group">
          <label class="modal-form-label">Target Regional Language</label>
          <input type="text" id="modal-inp-regional-lang" class="dna-input-premium" value="${curLang}">
        </div>
        <div class="modal-form-group">
          <label class="modal-form-label">Conversational Style &amp; Dialect Syntax</label>
          <input type="text" id="modal-inp-dialect-style" class="dna-input-premium" value="${curDialect}">
        </div>
      `;
      break;

    case 'sec7-example':
      icon = '💬';
      title = 'Edit Colloquial Phrasing Example';
      subtitle = 'Provide authentic cultural grounding sample text for generation models';
      const curEg = document.getElementById('dna-display-regional-example')?.innerText.trim() || '';
      formHtml = `
        <div class="modal-form-group">
          <label class="modal-form-label">Colloquial Phrasing Example</label>
          <textarea id="modal-inp-regional-example" class="dna-textarea-premium" rows="4">${curEg}</textarea>
        </div>
      `;
      break;

    case 'sec7-slang':
      icon = '✅';
      title = 'Edit Approved Regional Slang';
      subtitle = 'Add or remove approved cultural idioms and colloquial terms';
      const slangTags = Array.from(document.querySelectorAll('#dna-approved-chips .dna-regional-chip span, #dna-approved-chips .dna-tag-pill span, #dna-display-approved-slang .dna-tag-pill span')).map(s => s.innerText.trim()).filter(Boolean);
      formHtml = renderModalTagManager('modal-tags-list', slangTags, 'tag-mint', 'Add phrase (e.g. Bindaas, Superu, Dil se)...');
      break;

    case 'sec7-prohib-slang':
      icon = '❌';
      title = 'Edit Prohibited Regional Claims';
      subtitle = 'Add or remove prohibited colloquial slang and regional expressions';
      const prohibSlangTags = Array.from(document.querySelectorAll('#dna-prohib-chips .dna-regional-chip span, #dna-prohib-chips .dna-tag-pill span, #dna-display-prohib-slang .dna-tag-pill span')).map(s => s.innerText.trim()).filter(Boolean);
      formHtml = renderModalTagManager('modal-tags-list', prohibSlangTags, 'tag-rose', 'Add prohibited regional phrase...');
      break;

    default:
      formHtml = '<p style="color:#64748B;">No editor configured for this section.</p>';
  }

  iconEl.innerText = icon;
  titleEl.innerText = title;
  subEl.innerText = subtitle;
  bodyEl.innerHTML = formHtml;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // If editing pillars, check ratio
  if (type === 'sec6-pillars') {
    updateModalPillarsTotal();
  }
}
window.openDnaEditModal = openDnaEditModal;

window.pendingModalLogoData = null;

function handleModalLogoUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    window.pendingModalLogoData = e.target.result;
    const preview = document.getElementById('modal-logo-preview');
    if (preview) {
      preview.innerHTML = `<img src="${window.pendingModalLogoData}" alt="Brand Logo" style="width:100%;height:100%;object-fit:contain;padding:6px;">`;
    }
    showToast(`✓ "${file.name}" loaded! Click Save Changes to confirm.`, '📁');
  };
  reader.readAsDataURL(file);
}
window.handleModalLogoUpload = handleModalLogoUpload;

function handleModalLogoRemove() {
  window.pendingModalLogoData = 'REMOVED';
  const preview = document.getElementById('modal-logo-preview');
  if (preview) {
    preview.innerHTML = `
      <div style="width:58px;height:58px;border-radius:10px;background:#F1F5F9;display:flex;align-items:center;justify-content:center;color:#64748B;font-size:19px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;">
        V
      </div>
    `;
  }
  showToast('Logo marked for removal. Click Save Changes to confirm.', '🗑️');
}
window.handleModalLogoRemove = handleModalLogoRemove;

function closeDnaEditModal() {
  const modal = document.getElementById('dna-edit-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}
window.closeDnaEditModal = closeDnaEditModal;

function openDnaSectionModal(secNum) {
  const map = {
    1: 'sec1-brand-info',
    2: 'sec2-persona',
    3: 'sec3-tones',
    4: 'sec4-palette',
    5: 'sec5-manage-offerings',
    6: 'sec6-pillars',
    7: 'sec7-lang-style'
  };
  openDnaEditModal(map[secNum] || 'sec1-brand-info');
}
window.openDnaSectionModal = openDnaSectionModal;

// Modal Tag Manager Renderer
function renderModalTagManager(listId, items, tagClass, placeholder) {
  const tagSpans = items.map(txt => `
    <span class="modal-tag-item">
      <span>${txt}</span>
      <button type="button" class="modal-tag-remove-btn" onclick="this.parentElement.remove()">✕</button>
    </span>
  `).join('');

  return `
    <div class="modal-form-group">
      <label class="modal-form-label">Current Active Items</label>
      <div id="${listId}" style="display:flex;flex-wrap:wrap;gap:8px;padding:12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;min-height:75px;margin-bottom:12px;">
        ${tagSpans || '<span style="color:#94A3B8;font-size:10.5px;font-style:italic;">No items defined. Use the input below to add items.</span>'}
      </div>
      <div class="dna-input-add-row">
        <input type="text" id="modal-inp-new-tag" class="dna-input-premium" placeholder="${placeholder}" onkeydown="if(event.key==='Enter'){event.preventDefault();addModalTag('${listId}');}">
        <button type="button" class="btn-dna-add" onclick="addModalTag('${listId}')">+ Add Item</button>
      </div>
    </div>
  `;
}

function addModalTag(listId) {
  const input = document.getElementById('modal-inp-new-tag');
  const list = document.getElementById(listId);
  if (!input || !list || !input.value.trim()) return;

  const val = input.value.trim();
  // Clear empty placeholder if present
  if (list.querySelector('span[style*="italic"]')) {
    list.innerHTML = '';
  }

  const span = document.createElement('span');
  span.className = 'modal-tag-item';
  span.innerHTML = `
    <span>${val}</span>
    <button type="button" class="modal-tag-remove-btn" onclick="this.parentElement.remove()">✕</button>
  `;
  list.appendChild(span);
  input.value = '';
  input.focus();
}
window.addModalTag = addModalTag;

function toggleModalDnaChip(btn) {
  const isAct = btn.classList.toggle('active');
  const txt = btn.innerText.replace(/^[+✓✕s]+/, '').trim();
  btn.innerText = (isAct ? '✓ ' : '+ ') + txt;
}
window.toggleModalDnaChip = toggleModalDnaChip;

function toggleModalToneTrait(btn) {
  const wrap = document.getElementById('modal-tone-chips-wrap');
  const isAct = btn.classList.contains('active');
  const activeCount = wrap?.querySelectorAll('.dna-chip.active').length || 0;

  if (!isAct && activeCount >= 3) {
    showToast('Maximum of 3 tone traits can be active.', '⚠️');
    return;
  }

  btn.classList.toggle('active');
  const clean = btn.innerText.replace(/^[+✓✕s]+/, '').replace(/×$/, '').trim();
  btn.innerText = btn.classList.contains('active') ? ('✓ ' + clean + ' ×') : ('+ ' + clean);

  const counter = document.getElementById('modal-tone-counter');
  const newCount = wrap?.querySelectorAll('.dna-chip.active').length || 0;
  if (counter) counter.innerText = `${newCount}/3 selected`;
}
window.toggleModalToneTrait = toggleModalToneTrait;

function addModalCustomTone() {
  const input = document.getElementById('modal-inp-custom-tone');
  const wrap = document.getElementById('modal-tone-chips-wrap');
  if (!input || !wrap || !input.value.trim()) return;

  const val = input.value.trim();
  const activeCount = wrap.querySelectorAll('.dna-chip.active').length;
  const canActivate = activeCount < 3;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dna-chip' + (canActivate ? ' active' : '');
  btn.onclick = function() { toggleModalToneTrait(this); };
  btn.innerText = canActivate ? ('✓ ' + val + ' ×') : ('+ ' + val);
  wrap.appendChild(btn);

  input.value = '';
  const counter = document.getElementById('modal-tone-counter');
  const newCount = wrap.querySelectorAll('.dna-chip.active').length;
  if (counter) counter.innerText = `${newCount}/3 selected`;
}
window.addModalCustomTone = addModalCustomTone;

function colorToHex(color) {
  if (!color) return '#0F9D8A';
  color = color.trim();
  if (color.startsWith('#')) {
    if (color.length === 4) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    return color.substring(0, 7);
  }
  const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return '#' + r + g + b;
  }
  return '#0F9D8A';
}
window.colorToHex = colorToHex;

function updateModalPillarRowColor(input) {
  const row = input.closest('.modal-pillar-row');
  if (!row) return;
  const dot = row.querySelector('.dna-pillar-swatch-dot');
  if (dot) {
    dot.style.background = input.value;
  }
}
window.updateModalPillarRowColor = updateModalPillarRowColor;

function updateModalPillarsTotal() {
  const inputs = document.querySelectorAll('#modal-pillars-list .modal-pillar-pct');
  let sum = 0;
  inputs.forEach(inp => sum += parseInt(inp.value, 10) || 0);

  const totalEl = document.getElementById('modal-pillars-total-ratio');
  if (totalEl) {
    if (sum === 100) {
      totalEl.innerHTML = 'Total Ratio: 100% ✓';
      totalEl.style.color = '#0F9D8A';
    } else {
      totalEl.innerHTML = `Total Ratio: ${sum}% (Target 100%)`;
      totalEl.style.color = sum > 100 ? '#EF4444' : '#D97706';
    }
  }
}
window.updateModalPillarsTotal = updateModalPillarsTotal;

function addModalPillarRow() {
  const nameInp = document.getElementById('modal-new-pillar-name');
  const pctInp = document.getElementById('modal-new-pillar-pct');
  const colorInp = document.getElementById('modal-new-pillar-color');
  const list = document.getElementById('modal-pillars-list');
  if (!nameInp || !list || !nameInp.value.trim()) return;

  const name = nameInp.value.trim();
  const pct = parseInt(pctInp?.value, 10) || 25;
  const colors = ['#0F9D8A', '#7C3AED', '#EA580C', '#2563EB', '#D97706', '#1E293B'];
  const count = list.querySelectorAll('.modal-pillar-row').length;
  const color = colorInp ? colorInp.value : colors[count % colors.length];
  const nextColor = colors[(count + 1) % colors.length];

  const row = document.createElement('div');
  row.className = 'dna-pillar-alloc-row modal-pillar-row';
  row.style.cssText = 'display:flex;align-items:center;gap:10px;';
  row.innerHTML = `
    <span class="dna-pillar-swatch-dot" style="background:${color};"></span>
    <input type="text" class="dna-input-premium modal-pillar-name" value="${name}" style="flex:1;">
    <div class="dna-ratio-input-wrap" style="width:72px;">
      <input type="number" class="dna-ratio-input modal-pillar-pct" value="${pct}" min="0" max="100" onchange="updateModalPillarsTotal()">
      <span class="dna-ratio-unit">%</span>
    </div>
    <input type="color" class="dna-pillar-color-picker modal-pillar-color" value="${color}" oninput="updateModalPillarRowColor(this)" title="Choose pillar color">
    <button type="button" class="btn-dna-delete-prod" onclick="this.closest('.modal-pillar-row').remove(); updateModalPillarsTotal();" title="Remove Pillar" style="background:transparent;border:none;color:#94A3B8;font-size:13.5px;cursor:pointer;padding:0 4px;" onmouseover="this.style.color='#EF4444'" onmouseout="this.style.color='#94A3B8'">✕</button>
  `;
  list.appendChild(row);
  nameInp.value = '';
  if (colorInp) colorInp.value = nextColor;
  updateModalPillarsTotal();
}
window.addModalPillarRow = addModalPillarRow;

// ── SAVE MODAL CHANGES HANDLER ──────────────────────────────────────────
function saveDnaModalChanges() {
  const type = activeDnaEditType;
  if (!type) {
    closeDnaEditModal();
    return;
  }

  switch (type) {
    case 'sec1-logo': {
      const graphicEls = document.querySelectorAll('.dna-logo-display-graphic, #dna-logo-display-graphic');
      if (window.pendingModalLogoData === 'REMOVED') {
        graphicEls.forEach(el => {
          el.innerHTML = `
            <div style="width:58px;height:58px;border-radius:10px;background:#F1F5F9;display:flex;align-items:center;justify-content:center;color:#64748B;font-size:19px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;">
              V
            </div>
          `;
        });
        showToast('✓ Brand logo reset to default placeholder', '🗑️');
      } else if (window.pendingModalLogoData) {
        graphicEls.forEach(el => {
          el.innerHTML = `<img src="${window.pendingModalLogoData}" alt="Brand Logo" style="width:100%;height:100%;object-fit:contain;padding:6px;border-radius:8px;">`;
        });
        showToast('✓ New brand logo uploaded and saved!', '🎨');
      } else {
        showToast('✓ Brand logo details updated!', '🎨');
      }
      window.pendingModalLogoData = null;
      break;
    }

    case 'sec1-brand-info': {
      const newName = document.getElementById('modal-inp-brand-name')?.value?.trim();
      const newInd = (document.getElementById('modal-inp-brand-industry')?.value || document.getElementById('modal-sel-brand-industry')?.value || '').trim();
      const newLocation = document.getElementById('modal-inp-brand-location')?.value?.trim();
      const newWebsite = document.getElementById('modal-inp-brand-website')?.value?.trim();

      if (newName) {
        const brandDisplay = document.getElementById('dna-display-brand-name');
        if (brandDisplay) brandDisplay.innerText = newName;
        const curBrandHeader = document.getElementById('dna-current-brand-name');
        if (curBrandHeader) curBrandHeader.innerText = newName;
      }
      if (newInd) {
        const indDisplay = document.getElementById('dna-display-brand-industry');
        if (indDisplay) indDisplay.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;background:#F1F5F9;padding:4px 10px;border-radius:6px;color:#1E293B;font-size:11.5px;font-weight:700;">${newInd}</span>`;
      }
      if (newLocation !== undefined) {
        const locDisplay = document.getElementById('dna-display-location');
        if (locDisplay) locDisplay.innerText = newLocation || 'Bengaluru, Karnataka, India';
      }
      if (newWebsite !== undefined) {
        const webDisplay = document.getElementById('dna-display-website');
        if (webDisplay) {
          const val = newWebsite || 'https://vibodhai.com';
          webDisplay.innerText = val;
          if (webDisplay.tagName === 'A') {
            webDisplay.href = val.startsWith('http') ? val : 'https://' + val;
          }
        }
      }
      showToast('✓ Company Identity updated successfully!', '🏢');
      break;
    }

    case 'sec1-mission':
    case 'sec1-description':
    case 'sec1-positioning': {
      const newMission = document.getElementById('modal-inp-mission')?.value?.trim();
      const newDesc = document.getElementById('modal-inp-desc')?.value?.trim();
      const newPos = document.getElementById('modal-inp-positioning')?.value?.trim();

      if (newMission !== undefined) {
        const missionDisplay = document.getElementById('dna-display-mission');
        if (missionDisplay) missionDisplay.innerText = newMission;
      }
      if (newDesc !== undefined) {
        const descDisplay = document.getElementById('dna-display-desc');
        if (descDisplay) descDisplay.innerText = newDesc;
      }
      if (newPos !== undefined) {
        const posDisplay = document.getElementById('dna-display-positioning');
        if (posDisplay) posDisplay.innerText = newPos;
      }
      showToast('✓ Mission, Description & Positioning updated successfully!', '🎯');
      break;
    }

    case 'sec1-proof': {
      const activeChips = Array.from(document.querySelectorAll('#modal-proof-chips-wrap .dna-chip.active')).map(c => c.innerText.replace(/^[✓+s]+/, '').trim());
      const details = document.getElementById('modal-inp-proof-details')?.value.trim();
      
      const chipsContainer = document.getElementById('dna-display-proof-chips');
      if (chipsContainer) {
        chipsContainer.innerHTML = activeChips.map(c => `<span class="dna-tag-pill tag-mint">✓ ${c}</span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No factors selected</span>';
      }
      const countEl = document.getElementById('dna-display-proof-count');
      if (countEl) countEl.innerText = `${activeChips.length} factors active`;

      const detailsEl = document.getElementById('dna-display-proof-details');
      if (detailsEl && details) detailsEl.innerText = details;

      showToast('✓ Proof & Credibility Factors updated!', '🏆');
      break;
    }

    case 'sec2-combined':
    case 'sec2-persona':
    case 'sec2-segments': {
      const personaEl = document.getElementById('dna-display-persona');
      const personaInp = document.getElementById('modal-inp-persona');
      if (personaEl && personaInp && personaInp.value.trim() !== '') {
        personaEl.innerText = personaInp.value.trim();
      }

      const tagsList = document.getElementById('modal-tags-list');
      if (tagsList) {
        const items = Array.from(tagsList.querySelectorAll('.modal-tag-item span:first-child')).map(s => s.innerText.trim()).filter(Boolean);
        const container = document.getElementById('dna-display-segments');
        if (container) {
          container.innerHTML = items.map(t => `<span class="dna-tag-pill tag-mint"><span>${t}</span></span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No segments defined</span>';
        }
        const countEl = document.getElementById('dna-display-seg-count');
        if (countEl) countEl.innerText = `${items.length} segments defined`;
      }

      showToast('✓ Target Audience & Segments updated!', '👥');
      break;
    }

    case 'sec2-pain-points': {
      const items = Array.from(document.querySelectorAll('#modal-tags-list .modal-tag-item span:first-child')).map(s => s.innerText.trim()).filter(Boolean);
      const container = document.getElementById('dna-display-pain-points');
      if (container) {
        container.innerHTML = items.map(t => `<span class="dna-tag-pill tag-rose"><span>${t}</span></span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No pain points defined</span>';
      }
      showToast('✓ Audience Pain Points updated!', '⚠️');
      break;
    }

    case 'sec2-desires': {
      const items = Array.from(document.querySelectorAll('#modal-tags-list .modal-tag-item span:first-child')).map(s => s.innerText.trim()).filter(Boolean);
      const container = document.getElementById('dna-display-desires');
      if (container) {
        container.innerHTML = items.map(t => `<span class="dna-tag-pill tag-purple"><span>${t}</span></span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No desired outcomes defined</span>';
      }
      showToast('✓ Desired Outcomes updated!', '✨');
      break;
    }

    case 'sec3-combined':
    case 'sec3-tones':
    case 'sec3-personality': {
      const toneWrap = document.getElementById('modal-tone-chips-wrap');
      if (toneWrap) {
        const activeTones = Array.from(toneWrap.querySelectorAll('.dna-chip.active')).map(c => c.innerText.replace(/^[✓+s]+/, '').replace(/×$/, '').trim());
        const container = document.getElementById('dna-display-tone-chips');
        if (container) {
          container.innerHTML = activeTones.map(t => `<span class="dna-chip active">✓ ${t}</span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No tone traits selected</span>';
        }
        const countEl = document.getElementById('dna-display-tone-count');
        if (countEl) countEl.innerText = `${activeTones.length}/3 selected`;
      }

      const persInp = document.getElementById('modal-inp-personality');
      if (persInp && persInp.value.trim() !== '') {
        const persEl = document.getElementById('dna-display-personality');
        if (persEl) persEl.innerText = persInp.value.trim();
      }

      showToast('✓ Brand Voice & Personality updated!', '🎙️');
      break;
    }

    case 'sec3-pref-words': {
      const items = Array.from(document.querySelectorAll('#modal-tags-list .modal-tag-item span:first-child')).map(s => s.innerText.trim()).filter(Boolean);
      const container = document.getElementById('dna-display-pref-words');
      if (container) {
        container.innerHTML = items.map(t => `<span class="dna-tag-pill tag-emerald"><span>${t}</span></span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No preferred words defined</span>';
      }
      const countEl = document.getElementById('dna-display-pref-count');
      if (countEl) countEl.innerText = `${items.length} words`;
      showToast('✓ Preferred Vocabulary updated!', '📗');
      break;
    }

    case 'sec3-proh-words': {
      const items = Array.from(document.querySelectorAll('#modal-tags-list .modal-tag-item span:first-child')).map(s => s.innerText.trim()).filter(Boolean);
      const container = document.getElementById('dna-display-proh-words');
      if (container) {
        container.innerHTML = items.map(t => `<span class="dna-tag-pill tag-rose"><span>${t}</span></span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No prohibited words defined</span>';
      }
      const countEl = document.getElementById('dna-display-proh-count');
      if (countEl) countEl.innerText = `${items.length} words`;
      showToast('✓ Prohibited Words updated!', '🚫');
      break;
    }

    case 'sec4-palette': {
      for (let i = 1; i <= 5; i++) {
        const hexInput = document.getElementById(`modal-hex-${i}`);
        const colorInput = document.getElementById(`modal-color-${i}`);
        let hex = hexInput?.value.trim() || colorInput?.value.trim();
        if (hex) {
          if (!hex.startsWith('#')) hex = '#' + hex;
          const upperHex = hex.toUpperCase();
          const box = document.getElementById(`dna-display-swatch-box-${i}`);
          if (box) box.style.background = upperHex;
          const hexLabel = document.getElementById(`dna-display-hex-${i}`);
          if (hexLabel) hexLabel.innerText = upperHex;
          if (DNA_PALETTE_COLORS[i - 1]) {
            DNA_PALETTE_COLORS[i - 1].hex = upperHex;
          }
        }
      }
      syncDnaPaletteBubblesFromData();
      closeDnaEditModal();
      showToast('✓ 5-Swatch Color Palette updated and saved!', '🎨');
      break;
    }

    case 'sec4-combined':
    case 'sec4-typography':
    case 'sec4-image-style': {
      const pInp = document.getElementById('modal-inp-typo-primary');
      if (pInp && pInp.value.trim() !== '') {
        const el = document.getElementById('dna-display-typo-primary');
        if (el) {
          el.innerText = pInp.value.trim();
          el.style.fontFamily = pInp.value.trim();
        }
      }

      const sInp = document.getElementById('modal-inp-typo-secondary');
      if (sInp && sInp.value.trim() !== '') {
        const el = document.getElementById('dna-display-typo-secondary');
        if (el) {
          el.innerText = sInp.value.trim();
          el.style.fontFamily = sInp.value.trim();
        }
      }

      const imgInp = document.getElementById('modal-inp-image-style');
      if (imgInp && imgInp.value.trim() !== '') {
        const el = document.getElementById('dna-display-image-style');
        if (el) el.innerText = imgInp.value.trim();
      }

      showToast('✓ Typography & Image Directives updated!', '🎨');
      break;
    }

    case 'sec5-manage-offerings':
    case 'sec5-edit-prod':
    case 'sec5-add-prod': {
      // Check if user entered text in "Add New Offering" fields without clicking "+ Add to Offerings List"
      const pendingName = document.getElementById('modal-new-offering-name')?.value.trim();
      const pendingDesc = document.getElementById('modal-new-offering-desc')?.value.trim() || '';
      
      const container = document.getElementById('modal-offerings-container');
      const offeringCards = container ? Array.from(container.querySelectorAll('.modal-offering-edit-card')) : [];
      
      const offeringsData = [];
      offeringCards.forEach(card => {
        const name = card.querySelector('.modal-offering-name')?.value.trim();
        const desc = card.querySelector('.modal-offering-desc')?.value.trim() || '';
        if (name) {
          offeringsData.push({ name, desc });
        }
      });

      if (pendingName) {
        offeringsData.push({ name: pendingName, desc: pendingDesc });
      }

      if (offeringsData.length === 0) {
        showToast('Please keep or add at least one offering to save', '⚠️');
        return;
      }

      const list = document.getElementById('dna-products-list');
      if (list) {
        list.innerHTML = '';
        const escapeTxt = s => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        offeringsData.forEach((item, idx) => {
          const card = document.createElement('div');
          card.className = 'dna-product-item-card';
          card.setAttribute('data-id', idx + 1);
          card.innerHTML = `
            <div class="dna-prod-num-box">${idx + 1}</div>
            <div class="dna-prod-info">
              <h4 class="dna-prod-name">${escapeTxt(item.name)}</h4>
              <p class="dna-prod-desc">${escapeTxt(item.desc)}</p>
            </div>
          `;
          list.appendChild(card);
        });
      }

      const countEl = document.getElementById('dna-prod-registered-count');
      if (countEl) {
        countEl.innerText = offeringsData.length + ' Products Registered';
      }

      showToast('✓ Offerings catalog updated successfully!', '📦');
      break;
    }

    case 'sec6-pillars': {
      const rows = Array.from(document.querySelectorAll('#modal-pillars-list .modal-pillar-row'));
      const container = document.getElementById('dna-display-pillars-list');
      const colors = ['#1E293B', '#0F9D8A', '#7C3AED', '#EA580C', '#2563EB', '#D97706'];
      
      let total = 0;
      const fallbackColors = ['#1E293B', '#0F9D8A', '#7C3AED', '#EA580C', '#2563EB', '#D97706'];
      const updatedPillars = rows.map((r, i) => {
        const name = r.querySelector('.modal-pillar-name')?.value.trim() || `Pillar ${i+1}`;
        const pct = parseInt(r.querySelector('.modal-pillar-pct')?.value, 10) || 0;
        const color = r.querySelector('.modal-pillar-color')?.value || fallbackColors[i % fallbackColors.length];
        total += pct;
        return { name, pct, color };
      });

      if (container) {
        container.innerHTML = updatedPillars.map((p, i) => `
          <div class="dna-display-pillar-card" data-pillar-idx="${i}">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="dna-pillar-swatch-dot" style="background:${p.color};"></span>
              <span style="font-size:11.5px;font-weight:700;color:#0F172A;" class="dna-display-pillar-name">${p.name}</span>
            </div>
            <span style="font-size:10.5px;font-weight:800;color:${p.color};background:#F8FAFC;padding:3px 10px;border-radius:6px;border:1px solid #E2E8F0;" class="dna-display-pillar-pct">${p.pct}%</span>
          </div>
        `).join('');
      }

      const ratioLabel = document.getElementById('dna-display-pillars-ratio');
      if (ratioLabel) {
        ratioLabel.innerHTML = total === 100 ? 'Total Ratio: 100% ✓' : `Total Ratio: ${total}% (Target 100%)`;
        ratioLabel.style.color = total === 100 ? '#0F9D8A' : '#D97706';
      }

      // Re-render Donut Chart & Legend
      renderDnaDonutChart(updatedPillars, total);
      showToast('✓ Content Pillars & Distribution updated!', '🎯');
      break;
    }

    case 'sec6-objectives': {
      const items = Array.from(document.querySelectorAll('#modal-tags-list .modal-tag-item span:first-child')).map(s => s.innerText.trim()).filter(Boolean);
      const container = document.getElementById('dna-display-objectives');
      if (container) {
        container.innerHTML = items.map(t => `<span class="dna-tag-pill tag-mint"><span>${t}</span></span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No objectives defined</span>';
      }
      const countEl = document.getElementById('dna-display-objectives-count');
      if (countEl) countEl.innerText = `${items.length} objectives`;
      showToast('✓ Primary Content Objectives updated!', '🎯');
      break;
    }

    case 'sec6-ctas': {
      const items = Array.from(document.querySelectorAll('#modal-tags-list .modal-tag-item span:first-child')).map(s => s.innerText.trim()).filter(Boolean);
      const container = document.getElementById('dna-display-ctas');
      if (container) {
        container.innerHTML = items.map(t => `<span class="dna-tag-pill tag-purple"><span>${t}</span></span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No CTAs defined</span>';
      }
      const countEl = document.getElementById('dna-display-ctas-count');
      if (countEl) countEl.innerText = `${items.length} CTAs`;
      showToast('✓ Preferred CTAs updated!', '📣');
      break;
    }

    case 'sec7-lang-style': {
      const lang = document.getElementById('modal-inp-regional-lang')?.value.trim();
      const style = document.getElementById('modal-inp-dialect-style')?.value.trim();
      if (lang) {
        const el = document.getElementById('dna-display-regional-lang');
        if (el) el.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;background:#E0F2FE;color:#0284C7;padding:4px 10px;border-radius:6px;">🌐 ${lang}</span>`;
      }
      if (style) {
        const el = document.getElementById('dna-display-dialect-style');
        if (el) el.innerText = style;
      }
      showToast('✓ Regional Language & Style updated!', '🌐');
      break;
    }

    case 'sec7-example': {
      const val = document.getElementById('modal-inp-regional-example')?.value.trim();
      const el = document.getElementById('dna-display-regional-example');
      if (el && val) el.innerText = val;
      showToast('✓ Colloquial Phrasing Example updated!', '💬');
      break;
    }

    case 'sec7-slang': {
      const items = Array.from(document.querySelectorAll('#modal-tags-list .modal-tag-item span:first-child')).map(s => s.innerText.trim()).filter(Boolean);
      const container = document.getElementById('dna-approved-chips') || document.getElementById('dna-display-approved-slang');
      if (container) {
        if (items.length > 0) {
          container.innerHTML = items.map(t => `<span class="dna-regional-chip approved"><span>${t}</span></span>`).join('');
        } else {
          container.innerHTML = '<span class="dna-vocab-empty-text" style="font-size:11px;color:#94A3B8;font-style:italic;">No approved vocabulary added yet. Click &quot;Edit Words&quot; to add regional slang and cultural phrasing.</span>';
        }
      }
      const countEl = document.getElementById('dna-approved-slang-count') || document.getElementById('dna-display-approved-slang-count');
      if (countEl) countEl.innerText = `${items.length} approved`;

      // Update warning banner if regional voice is enabled
      const toggle = document.getElementById('dna-regional-toggle');
      const warningBanner = document.getElementById('dna-regional-warning-banner');
      if (toggle && toggle.checked && warningBanner) {
        warningBanner.style.display = items.length === 0 ? 'flex' : 'none';
      }

      showToast('✓ Approved Colloquial Slang updated!', '✅');
      break;
    }

    case 'sec7-prohib-slang': {
      const items = Array.from(document.querySelectorAll('#modal-tags-list .modal-tag-item span:first-child')).map(s => s.innerText.trim()).filter(Boolean);
      const container = document.getElementById('dna-prohib-chips') || document.getElementById('dna-display-prohib-slang');
      if (container) {
        if (items.length > 0) {
          container.innerHTML = items.map(t => `<span class="dna-regional-chip prohibited"><span>${t}</span></span>`).join('');
        } else {
          container.innerHTML = '<span class="dna-vocab-empty-text" style="font-size:11px;color:#94A3B8;font-style:italic;">No prohibited regional claims registered. Click &quot;Edit Words&quot; to add guardrails.</span>';
        }
      }
      const countEl = document.getElementById('dna-prohib-slang-count') || document.getElementById('dna-display-prohib-slang-count');
      if (countEl) countEl.innerText = `${items.length} prohibited`;
      showToast('✓ Prohibited Regional Claims updated!', '❌');
      break;
    }
  }

  closeDnaEditModal();
}
window.saveDnaModalChanges = saveDnaModalChanges;

function renderDnaDonutChart(pillars, total) {
  const svg = document.getElementById('dna-donut-svg');
  const legend = document.getElementById('dna-donut-legend');
  const centerPct = document.getElementById('dna-donut-center-pct');

  if (centerPct) centerPct.innerText = total + '%';

  if (!svg || !pillars.length) return;

  const circumference = 238.76; // 2 * PI * 38
  let currentOffset = 0;

  let circlesHtml = `<circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" stroke-width="15"/>`;
  let legendHtml = '';

  pillars.forEach(p => {
    const dashLength = (p.pct / 100) * circumference;
    circlesHtml += `<circle cx="50" cy="50" r="38" fill="none" stroke="${p.color}" stroke-width="15" stroke-dasharray="${dashLength.toFixed(2)} ${circumference}" stroke-dashoffset="${(-currentOffset).toFixed(2)}"/>`;
    currentOffset += dashLength;

    legendHtml += `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="display:flex;align-items:center;gap:6px;color:#334155;">
          <span style="width:8px;height:8px;border-radius:50%;background:${p.color};"></span>
          <span style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</span>
        </span>
        <strong style="color:#0F172A;">${p.pct}%</strong>
      </div>
    `;
  });

  svg.innerHTML = circlesHtml;
  if (legend) legend.innerHTML = legendHtml;
}
window.renderDnaDonutChart = renderDnaDonutChart;



/* ═══════════════════════════════════════════════════════════════════════════
   BRAND DNA: INLINE TEXTBOX EDITING ENGINE (ALL 7 TABS)
═══════════════════════════════════════════════════════════════════════════ */

function getDnaBoxCurrentText(box, type) {
  const displayEl = box.querySelector('.dna-box-display');
  if (!displayEl) return '';

  if (type === 'product-card') {
    const title = displayEl.querySelector('.dna-prod-name')?.innerText.trim() || '';
    const desc = displayEl.querySelector('.dna-prod-desc')?.innerText.trim() || '';
    return JSON.stringify({ title, desc });
  }

  if (type === 'pillars-list') {
    const cards = Array.from(displayEl.querySelectorAll('.dna-display-pillar-card'));
    return cards.map(c => {
      const name = c.querySelector('.dna-display-pillar-name')?.innerText.trim() || '';
      const pct = c.querySelector('.dna-display-pillar-pct')?.innerText.trim().replace('%', '') || '0';
      return name + ': ' + pct + '%';
    }).join('\n');
  }

  if (type === 'tags-list' || type === 'words-list' || type === 'chips-list') {
    const tags = Array.from(displayEl.querySelectorAll('.dna-tag-pill span, .dna-chip, .dna-regional-chip span'))
      .map(s => s.innerText.replace(/^[✓+s]+/, '').replace(/×$/, '').trim())
      .filter(s => s && !s.includes('No approved') && !s.includes('No prohibited') && !s.includes('No items'));
    
    if (type === 'words-list') {
      return tags.join(', ');
    }
    return tags.join('\n');
  }

  return displayEl.innerText.trim();
}

function toggleDnaBoxEdit(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;

  const type = box.getAttribute('data-dna-type') || 'text-multi';
  const saveBtn = box.querySelector('.dna-inline-save-btn');

  // If already editing, close/cancel
  if (box.classList.contains('is-editing')) {
    cancelDnaBoxEdit(boxId);
    return;
  }

  // Get current text and store as original value
  const originalVal = getDnaBoxCurrentText(box, type);
  box.setAttribute('data-original-val', originalVal);

  // Populate editor with current value
  if (type === 'product-card') {
    let parsed = { title: '', desc: '' };
    try { parsed = JSON.parse(originalVal); } catch (e) {}
    const titleInp = box.querySelector('.dna-editor-prod-title');
    const descTa = box.querySelector('.dna-editor-prod-desc');
    if (titleInp) titleInp.value = parsed.title;
    if (descTa) descTa.value = parsed.desc;
  } else {
    const editor = box.querySelector('.dna-box-editor');
    if (editor) {
      editor.value = originalVal;
    }
  }

  // Enter edit mode
  box.classList.add('is-editing');

  // Save button starts strictly disabled!
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.classList.remove('can-save');
  }

  // Focus the first editor element
  setTimeout(() => {
    const firstInp = box.querySelector('.dna-box-editor input, .dna-box-editor textarea, input.dna-box-editor, textarea.dna-box-editor');
    if (firstInp) {
      firstInp.focus();
      if (typeof firstInp.select === 'function' && type === 'text-single') {
        firstInp.select();
      }
    }
  }, 40);
}
window.toggleDnaBoxEdit = toggleDnaBoxEdit;

function handleDnaBoxInput(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;

  const type = box.getAttribute('data-dna-type') || 'text-multi';
  const originalVal = (box.getAttribute('data-original-val') || '').trim();
  const saveBtn = box.querySelector('.dna-inline-save-btn');

  let currentVal = '';
  if (type === 'product-card') {
    const title = (box.querySelector('.dna-editor-prod-title')?.value || '').trim();
    const desc = (box.querySelector('.dna-editor-prod-desc')?.value || '').trim();
    currentVal = JSON.stringify({ title, desc });
  } else {
    const editor = box.querySelector('.dna-box-editor');
    currentVal = (editor?.value || '').trim();
  }

  if (saveBtn) {
    if (currentVal !== originalVal && currentVal !== '') {
      saveBtn.disabled = false;
      saveBtn.classList.add('can-save');
    } else {
      saveBtn.disabled = true;
      saveBtn.classList.remove('can-save');
    }
  }
}
window.handleDnaBoxInput = handleDnaBoxInput;

function handleDnaBoxKeydown(event, boxId) {
  if (event.key === 'Escape') {
    event.preventDefault();
    cancelDnaBoxEdit(boxId);
  } else if (event.key === 'Enter') {
    const box = document.getElementById(boxId);
    const type = box?.getAttribute('data-dna-type');
    if (type === 'text-single' || event.ctrlKey || event.metaKey) {
      event.preventDefault();
      saveDnaBoxEdit(boxId);
    }
  }
}
window.handleDnaBoxKeydown = handleDnaBoxKeydown;

function cancelDnaBoxEdit(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;

  box.classList.remove('is-editing');
  const saveBtn = box.querySelector('.dna-inline-save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.classList.remove('can-save');
  }
}
window.cancelDnaBoxEdit = cancelDnaBoxEdit;

function saveDnaBoxEdit(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;

  const saveBtn = box.querySelector('.dna-inline-save-btn');
  if (saveBtn && saveBtn.disabled) return;

  const field = box.getAttribute('data-dna-field');
  const type = box.getAttribute('data-dna-type') || 'text-multi';
  const displayEl = box.querySelector('.dna-box-display');

  let savedValue = '';

  if (type === 'product-card') {
    const title = (box.querySelector('.dna-editor-prod-title')?.value || '').trim();
    const desc = (box.querySelector('.dna-editor-prod-desc')?.value || '').trim();
    if (displayEl) {
      const nameEl = displayEl.querySelector('.dna-prod-name');
      const descEl = displayEl.querySelector('.dna-prod-desc');
      if (nameEl) nameEl.innerText = title;
      if (descEl) descEl.innerText = desc;
    }
    savedValue = { title, desc };
  } else if (type === 'pillars-list') {
    const raw = (box.querySelector('.dna-box-editor')?.value || '').trim();
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const colors = ['#1E293B', '#0F9D8A', '#7C3AED', '#EA580C', '#2563EB', '#D97706'];
    let totalPct = 0;
    const pillars = lines.map((l, i) => {
      const parts = l.split(':');
      const name = parts[0]?.trim() || ('Pillar ' + (i+1));
      const pct = parseInt(parts[1]?.replace('%', '')?.trim(), 10) || 25;
      totalPct += pct;
      return { name, pct, color: colors[i % colors.length] };
    });

    if (displayEl) {
      displayEl.innerHTML = pillars.map((p, idx) => `
        <div class="dna-display-pillar-card" data-pillar-idx="${idx}">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="dna-pillar-swatch-dot" style="background:${p.color};"></span>
            <span style="font-size:11.5px;font-weight:700;color:#0F172A;" class="dna-display-pillar-name">${p.name}</span>
          </div>
          <span style="font-size:10.5px;font-weight:800;color:${p.color};padding:3px 10px;border-radius:6px;" class="dna-display-pillar-pct">${p.pct}%</span>
        </div>
      `).join('');
    }

    const ratioBadge = document.getElementById('dna-display-pillars-ratio');
    if (ratioBadge) {
      ratioBadge.innerText = 'Total Ratio: ' + totalPct + '% ' + (totalPct === 100 ? '✓' : '');
      ratioBadge.style.color = totalPct === 100 ? '#0F9D8A' : '#EF4444';
    }

    if (typeof renderDnaDonutChart === 'function') {
      renderDnaDonutChart(pillars, totalPct);
    }
    savedValue = pillars;
  } else if (type === 'tags-list') {
    const raw = (box.querySelector('.dna-box-editor')?.value || '').trim();
    const items = raw.split('\n').map(s => s.trim()).filter(Boolean);
    const tagClass = field === 'pain-points' ? 'tag-rose' : (field === 'desires' ? 'tag-purple' : (field === 'ctas' ? 'tag-purple' : 'tag-mint'));
    
    if (displayEl) {
      displayEl.innerHTML = items.map(t => `<span class="dna-tag-pill ${tagClass}"><span>${t}</span></span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No items defined</span>';
    }

    // Update counters
    if (field === 'segments') {
      const c = document.getElementById('dna-display-seg-count');
      if (c) c.innerText = items.length + ' segments defined';
    } else if (field === 'objectives') {
      const c = document.getElementById('dna-display-objectives-count');
      if (c) c.innerText = items.length + ' objectives';
    } else if (field === 'ctas') {
      const c = document.getElementById('dna-display-ctas-count');
      if (c) c.innerText = items.length + ' CTAs';
    }
    savedValue = items;
  } else if (type === 'words-list') {
    const raw = (box.querySelector('.dna-box-editor')?.value || '').trim();
    const items = raw.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    const tagClass = field === 'proh-words' ? 'tag-rose' : (field === 'pref-words' ? 'tag-emerald' : (field === 'prohib-slang' ? 'prohibited' : 'approved'));
    
    if (displayEl) {
      if (field === 'approved-slang' || field === 'prohib-slang') {
        displayEl.innerHTML = items.length > 0 
          ? items.map(t => `<span class="dna-regional-chip ${tagClass}"><span>${t}</span></span>`).join('')
          : '<span class="dna-vocab-empty-text" style="font-size:11px;color:#94A3B8;font-style:italic;">No items registered. Click edit to add words.</span>';
      } else {
        displayEl.innerHTML = items.map(t => `<span class="dna-tag-pill ${tagClass}"><span>${t}</span></span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No words defined</span>';
      }
    }

    if (field === 'pref-words') {
      const c = document.getElementById('dna-display-pref-count');
      if (c) c.innerText = items.length + ' words';
    } else if (field === 'proh-words') {
      const c = document.getElementById('dna-display-proh-count');
      if (c) c.innerText = items.length + ' words';
    } else if (field === 'approved-slang') {
      const c = document.getElementById('dna-approved-slang-count');
      if (c) c.innerText = items.length + ' approved';
    } else if (field === 'prohib-slang') {
      const c = document.getElementById('dna-prohib-slang-count');
      if (c) c.innerText = items.length + ' prohibited';
    }
    savedValue = items;
  } else if (type === 'chips-list') {
    const raw = (box.querySelector('.dna-box-editor')?.value || '').trim();
    const items = raw.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    if (displayEl) {
      displayEl.innerHTML = items.map(t => `<span class="dna-chip active">✓ ${t}</span>`).join('') || '<span style="color:#94A3B8;font-style:italic;">No traits selected</span>';
    }
    const c = document.getElementById('dna-display-tone-count');
    if (c) c.innerText = items.length + '/3 selected';
    savedValue = items;
  } else {
    // Single or multi-line text
    const editor = box.querySelector('.dna-box-editor');
    const val = (editor?.value || '').trim();
    if (displayEl) {
      if (field === 'brand-industry') {
        displayEl.innerHTML = `<span class="dna-info-badge">${val}</span>`;
      } else if (field === 'location') {
        const span = displayEl.querySelector('#dna-display-location') || displayEl;
        span.innerText = val;
      } else if (field === 'website') {
        const a = displayEl.querySelector('#dna-display-website') || displayEl;
        a.innerText = val;
        if (a.tagName === 'A') {
          a.href = val.startsWith('http') ? val : 'https://' + val;
        }
      } else {
        displayEl.innerText = val;
      }
    }
    savedValue = val;
  }

  // Persist to localStorage
  try {
    let dnaStore = {};
    const existing = localStorage.getItem('vibodh_brand_dna_data');
    if (existing) dnaStore = JSON.parse(existing);
    dnaStore[field] = savedValue;
    localStorage.setItem('vibodh_brand_dna_data', JSON.stringify(dnaStore));
  } catch (e) {
    console.warn('Could not save Brand DNA to localStorage:', e);
  }

  // Exit editing mode
  box.classList.remove('is-editing');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.classList.remove('can-save');
  }

  // Visual success feedback
  showToast('Saved changes!', '✓');
}
window.saveDnaBoxEdit = saveDnaBoxEdit;

function loadSavedBrandDna() {
  try {
    const raw = localStorage.getItem('vibodh_brand_dna_data');
    if (!raw) return;
    const data = JSON.parse(raw);

    Object.keys(data).forEach(field => {
      const box = document.querySelector(`.dna-editable-box[data-dna-field="${field}"]`);
      if (!box) return;
      const type = box.getAttribute('data-dna-type') || 'text-multi';
      const displayEl = box.querySelector('.dna-box-display');
      const val = data[field];

      if (type === 'product-card' && typeof val === 'object') {
        if (displayEl) {
          if (val.title) {
            const h = displayEl.querySelector('.dna-prod-name');
            if (h) h.innerText = val.title;
          }
          if (val.desc) {
            const p = displayEl.querySelector('.dna-prod-desc');
            if (p) p.innerText = val.desc;
          }
        }
      } else if (type === 'pillars-list' && Array.isArray(val)) {
        if (displayEl) {
          displayEl.innerHTML = val.map((p, idx) => `
            <div class="dna-display-pillar-card" data-pillar-idx="${idx}">
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="dna-pillar-swatch-dot" style="background:${p.color};"></span>
                <span style="font-size:11.5px;font-weight:700;color:#0F172A;" class="dna-display-pillar-name">${p.name}</span>
              </div>
              <span style="font-size:10.5px;font-weight:800;color:${p.color};padding:3px 10px;border-radius:6px;" class="dna-display-pillar-pct">${p.pct}%</span>
            </div>
          `).join('');
        }
        let totalPct = val.reduce((acc, p) => acc + (p.pct || 0), 0);
        const ratioBadge = document.getElementById('dna-display-pillars-ratio');
        if (ratioBadge) {
          ratioBadge.innerText = 'Total Ratio: ' + totalPct + '% ' + (totalPct === 100 ? '✓' : '');
          ratioBadge.style.color = totalPct === 100 ? '#0F9D8A' : '#EF4444';
        }
        if (typeof renderDnaDonutChart === 'function') {
          renderDnaDonutChart(val, totalPct);
        }
      } else if (type === 'tags-list' && Array.isArray(val)) {
        const tagClass = field === 'pain-points' ? 'tag-rose' : (field === 'desires' ? 'tag-purple' : (field === 'ctas' ? 'tag-purple' : 'tag-mint'));
        if (displayEl) {
          displayEl.innerHTML = val.map(t => `<span class="dna-tag-pill ${tagClass}"><span>${t}</span></span>`).join('');
        }
        if (field === 'segments') {
          const c = document.getElementById('dna-display-seg-count');
          if (c) c.innerText = val.length + ' segments defined';
        } else if (field === 'objectives') {
          const c = document.getElementById('dna-display-objectives-count');
          if (c) c.innerText = val.length + ' objectives';
        } else if (field === 'ctas') {
          const c = document.getElementById('dna-display-ctas-count');
          if (c) c.innerText = val.length + ' CTAs';
        }
      } else if (type === 'words-list' && Array.isArray(val)) {
        const tagClass = field === 'proh-words' ? 'tag-rose' : (field === 'pref-words' ? 'tag-emerald' : (field === 'prohib-slang' ? 'prohibited' : 'approved'));
        if (displayEl) {
          if (field === 'approved-slang' || field === 'prohib-slang') {
            displayEl.innerHTML = val.length > 0 
              ? val.map(t => `<span class="dna-regional-chip ${tagClass}"><span>${t}</span></span>`).join('')
              : '<span class="dna-vocab-empty-text" style="font-size:11px;color:#94A3B8;font-style:italic;">No items registered. Click edit to add words.</span>';
          } else {
            displayEl.innerHTML = val.map(t => `<span class="dna-tag-pill ${tagClass}"><span>${t}</span></span>`).join('');
          }
        }
        if (field === 'pref-words') {
          const c = document.getElementById('dna-display-pref-count');
          if (c) c.innerText = val.length + ' words';
        } else if (field === 'proh-words') {
          const c = document.getElementById('dna-display-proh-count');
          if (c) c.innerText = val.length + ' words';
        } else if (field === 'approved-slang') {
          const c = document.getElementById('dna-approved-slang-count');
          if (c) c.innerText = val.length + ' approved';
        } else if (field === 'prohib-slang') {
          const c = document.getElementById('dna-prohib-slang-count');
          if (c) c.innerText = val.length + ' prohibited';
        }
      } else if (type === 'chips-list' && Array.isArray(val)) {
        if (displayEl) {
          displayEl.innerHTML = val.map(t => `<span class="dna-chip active">✓ ${t}</span>`).join('');
        }
        const c = document.getElementById('dna-display-tone-count');
        if (c) c.innerText = val.length + '/3 selected';
      } else if (typeof val === 'string') {
        if (displayEl) {
          if (field === 'brand-industry') {
            displayEl.innerHTML = `<span class="dna-info-badge">${val}</span>`;
          } else if (field === 'location') {
            const span = displayEl.querySelector('#dna-display-location') || displayEl;
            span.innerText = val;
          } else if (field === 'website') {
            const a = displayEl.querySelector('#dna-display-website') || displayEl;
            a.innerText = val;
            if (a.tagName === 'A') a.href = val.startsWith('http') ? val : 'https://' + val;
          } else {
            displayEl.innerText = val;
          }
        }
        if (field === 'brand-name') {
          const curH = document.getElementById('dna-current-brand-name');
          if (curH) curH.innerText = val;
        }
      }
    });
  } catch (e) {
    console.warn('Could not load Brand DNA from localStorage:', e);
  }
}
window.loadSavedBrandDna = loadSavedBrandDna;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSavedBrandDna);
} else {
  loadSavedBrandDna();
}

/* ═══════════════════════════════════════════════════════════════════
   BRAND DNA: VERSION HISTORY & SNAPSHOT TRACEABILITY
   ═══════════════════════════════════════════════════════════════════ */

// Default Seed Snapshot
const DEFAULT_DNA_SNAPSHOTS = [
  {
    version: 'v1.0',
    description: 'Initial baseline snapshot from onboarding',
    author: 'Sahana Viswanath',
    date: 'Oct 15, 2026, 03:53 PM',
    completeness: '100% completeness',
    active: true,
    data: {
      brandName: 'Vibodhai',
      industry: 'Digital Marketing Automation & AI Operations',
      mission: 'Empower digital marketing agencies to automate end-to-end multi-channel operations, delivering 10x content velocity while preserving 100% brand fidelity.',
      description: 'Vibodh Signal is an AI-powered digital marketing operating system designed specifically for marketing agencies, brand managers, and growth teams. It unifies campaign planning, multi-format creative production, cross-platform distribution, and real-time performance analytics into a single governed workspace.',
      positioning: 'The premier autonomous marketing orchestration engine that bridges strategic brand intelligence with enterprise-grade multi-channel distribution.',
      targetAudience: 'Mid-Market & Boutique Digital Marketing Agencies, Founders, Heads of Growth',
      voiceTone: 'Authoritative, Visionary, Data-Driven, Empathetic',
      colors: '#0F9D8A (Teal), #0F172A (Deep Slate), #F59E0B (Amber Gold)',
      typography: 'Plus Jakarta Sans (Headings), Inter (Body)',
      pillars: 'AI Marketing Automation (40%), Agency Operations & Client ROI (35%), Brand Integrity (25%)',
      guardrails: 'Strict Claim Verification, Zero AI Hallucination Grounding, Competitor Anti-Drift'
    }
  }
];

function getDnaSnapshots() {
  try {
    const raw = localStorage.getItem('vibodh_dna_snapshots');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse saved snapshots', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DNA_SNAPSHOTS));
}

function saveDnaSnapshots(list) {
  try {
    localStorage.setItem('vibodh_dna_snapshots', JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save snapshots', e);
  }
}

function switchDnaMainView(viewName) {
  const editorView = document.getElementById('dna-editor-view');
  const historyView = document.getElementById('dna-version-history-view');
  const btnEditor = document.getElementById('btn-dna-view-editor');
  const btnHistory = document.getElementById('btn-dna-view-history');

  if (viewName === 'history') {
    if (editorView) editorView.style.display = 'none';
    if (historyView) historyView.style.display = 'block';

    if (btnEditor) {
      btnEditor.classList.remove('active');
      btnEditor.style.background = 'transparent';
      btnEditor.style.color = '#475569';
      btnEditor.style.border = 'none';
      btnEditor.style.fontWeight = '600';
      btnEditor.style.boxShadow = 'none';
    }
    if (btnHistory) {
      btnHistory.classList.add('active');
      btnHistory.style.background = '#0F9D8A';
      btnHistory.style.color = '#FFFFFF';
      btnHistory.style.border = 'none';
      btnHistory.style.fontWeight = '700';
      btnHistory.style.boxShadow = '0 2px 8px rgba(15, 157, 138, 0.28)';
    }

    renderDnaSnapshots();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    if (editorView) editorView.style.display = 'block';
    if (historyView) historyView.style.display = 'none';

    if (btnEditor) {
      btnEditor.classList.add('active');
      btnEditor.style.background = '#0F9D8A';
      btnEditor.style.color = '#FFFFFF';
      btnEditor.style.border = 'none';
      btnEditor.style.fontWeight = '700';
      btnEditor.style.boxShadow = '0 2px 8px rgba(15, 157, 138, 0.28)';
    }
    if (btnHistory) {
      btnHistory.classList.remove('active');
      btnHistory.style.background = 'transparent';
      btnHistory.style.color = '#475569';
      btnHistory.style.border = 'none';
      btnHistory.style.fontWeight = '600';
      btnHistory.style.boxShadow = 'none';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
window.switchDnaMainView = switchDnaMainView;

function renderDnaSnapshots() {
  const container = document.getElementById('dna-snapshots-list');
  if (!container) return;

  const snapshots = getDnaSnapshots();
  let html = '';

  snapshots.forEach(snap => {
    const isActive = snap.active;
    const itemClass = isActive ? 'dna-snapshot-item active-prompt' : 'dna-snapshot-item archived';
    const statusPill = isActive
      ? '<span class="dna-snap-status-badge">ACTIVE IN AI PROMPTS</span>'
      : '<span class="dna-snap-status-badge archived-badge">PRESERVED SNAPSHOT</span>';

    const activateAction = !isActive
      ? `<button type="button" class="btn-activate-snapshot" onclick="activateSnapshot('${snap.version}')" title="Set this version as active prompt context">Restore as Active</button>`
      : '';

    html += `
      <div class="${itemClass}" id="dna-snapshot-${snap.version.replace('.', '-')}">
        <div class="dna-snap-item-left">
          <div class="dna-snap-version-line">
            <span class="dna-snap-version-tag">${snap.version}</span>
            ${statusPill}
          </div>
          <div class="dna-snap-description">
            ${snap.description}
          </div>
        </div>
        
        <div class="dna-snap-item-right">
          <div class="dna-snap-meta-text">
            ${snap.author} &bull; ${snap.date}
          </div>
          <div class="dna-snap-completeness-pill">
            ${snap.completeness || '100% completeness'}
          </div>
          ${activateAction}
          <button type="button" class="btn-inspect-snapshot" onclick="inspectSnapshot('${snap.version}')">
            <span class="btn-inspect-icon">🔍</span> Inspect
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
window.renderDnaSnapshots = renderDnaSnapshots;

let currentInspectedSnapshot = null;

function inspectSnapshot(version) {
  const snapshots = getDnaSnapshots();
  const snap = snapshots.find(s => s.version === version) || snapshots[0];
  if (!snap) return;

  currentInspectedSnapshot = snap;

  const modal = document.getElementById('dna-inspect-modal');
  const title = document.getElementById('dna-inspect-modal-title');
  const body = document.getElementById('dna-inspect-modal-body');
  const statusBadge = document.getElementById('dna-inspect-modal-status-badge');

  if (title) title.innerHTML = `Snapshot Inspector &bull; ${snap.version}`;
  if (statusBadge) {
    statusBadge.innerHTML = snap.active 
      ? '<span class="dna-snap-status-badge" style="font-size:9.5px;">ACTIVE IN AI PROMPTS</span>'
      : '<span class="dna-snap-status-badge archived-badge" style="font-size:9.5px;">PRESERVED ARCHIVE</span>';
  }

  const d = snap.data || {};
  if (body) {
    body.innerHTML = `
      <div style="background:#FFFDF5;border:1.5px solid #FDE68A;border-radius:10px;padding:14px 18px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:6px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <strong style="color:#EA580C;font-family:monospace;font-size:13.5px;">${snap.version}</strong>
            <span style="font-size:11.5px;font-weight:600;color:#1E293B;">${snap.description}</span>
          </div>
          <span style="font-size:10.5px;color:#64748B;">Committed by <strong>${snap.author}</strong> on ${snap.date}</span>
        </div>
        <p style="margin:4px 0 0;font-size:10.5px;color:#64748B;">This immutable snapshot stores the exact grounding state injected into generation prompts across Reels, Shorts, Newsletters, and Ad variants.</p>
      </div>

      <div class="dna-inspect-grid">
        <div class="dna-inspect-card">
          <div class="dna-inspect-card-title"><span>🏢</span> 1. Business Info &amp; Positioning</div>
          <div class="dna-inspect-card-content">
            <div><strong>Brand:</strong> ${d.brandName || 'Vibodhai'}</div>
            <div><strong>Industry:</strong> ${d.industry || 'Digital Marketing Automation'}</div>
            <div style="margin-top:6px;"><strong>Core Mission:</strong> <br><em style="color:#475569;">"${d.mission || 'Empower digital marketing agencies to automate end-to-end multi-channel operations.'}"</em></div>
          </div>
        </div>

        <div class="dna-inspect-card">
          <div class="dna-inspect-card-title"><span>🎯</span> 2. Target Audience &amp; ICP</div>
          <div class="dna-inspect-card-content">
            <div><strong>Primary ICP:</strong> ${d.targetAudience || 'Mid-Market & Boutique Digital Marketing Agencies'}</div>
            <div style="margin-top:4px;"><strong>Key Decision Makers:</strong> Agency Founders, Heads of Growth</div>
            <div style="margin-top:4px;"><strong>Core Pain Points:</strong> Operational bottlenecks, client churn, brand drift</div>
          </div>
        </div>

        <div class="dna-inspect-card">
          <div class="dna-inspect-card-title"><span>🗣️</span> 3. Voice &amp; Tone Guardrails</div>
          <div class="dna-inspect-card-content">
            <div><strong>Primary Attributes:</strong> ${d.voiceTone || 'Authoritative, Visionary, Data-Driven, Empathetic'}</div>
            <div style="margin-top:4px;"><strong>Reading Grade Level:</strong> Professional / Executive</div>
            <div style="margin-top:4px;"><strong>Prohibited Terms:</strong> Cheap, Quick fix, Miracle, Gurus, Hacky</div>
          </div>
        </div>

        <div class="dna-inspect-card">
          <div class="dna-inspect-card-title"><span>🎨</span> 4. Visual Identity &amp; Palette</div>
          <div class="dna-inspect-card-content">
            <div><strong>Colors:</strong> ${d.colors || '#0F9D8A (Teal), #0F172A (Deep Slate), #F59E0B (Amber Gold)'}</div>
            <div style="margin-top:4px;"><strong>Headings Font:</strong> Plus Jakarta Sans</div>
            <div style="margin-top:4px;"><strong>Body Font:</strong> Inter</div>
          </div>
        </div>

        <div class="dna-inspect-card">
          <div class="dna-inspect-card-title"><span>📊</span> 5 &amp; 6. Strategy &amp; Pillars</div>
          <div class="dna-inspect-card-content">
            <div><strong>Allocations:</strong> ${d.pillars || 'AI Automation (40%), Agency ROI (35%), Brand Integrity (25%)'}</div>
            <div style="margin-top:4px;"><strong>Cadence:</strong> 12 Multi-Format Assets / Week</div>
          </div>
        </div>

        <div class="dna-inspect-card">
          <div class="dna-inspect-card-title"><span>🛡️</span> 7. Compliance &amp; AI Safety</div>
          <div class="dna-inspect-card-content">
            <div><strong>Guardrails:</strong> ${d.guardrails || 'Strict Claim Verification, Zero Hallucination Grounding, Anti-Drift'}</div>
            <div style="margin-top:4px;"><strong>Audit Trail:</strong> SHA-256 Prompt Grounding Active</div>
          </div>
        </div>
      </div>
    `;
  }

  if (modal) modal.style.display = 'flex';
}
window.inspectSnapshot = inspectSnapshot;

function closeDnaInspectModal() {
  const modal = document.getElementById('dna-inspect-modal');
  if (modal) modal.style.display = 'none';
}
window.closeDnaInspectModal = closeDnaInspectModal;

function openCreateSnapshotModal() {
  const modal = document.getElementById('dna-create-snapshot-modal');
  const snapshots = getDnaSnapshots();
  
  // Calculate next version
  let nextVer = 'v1.1';
  if (snapshots.length > 0) {
    const highest = snapshots.reduce((max, s) => {
      const match = s.version.match(/v(\d+)\.(\d+)/);
      if (match) {
        const val = parseFloat(match[1] + '.' + match[2]);
        return Math.max(max, val);
      }
      return max;
    }, 1.0);
    nextVer = 'v' + (highest + 0.1).toFixed(1);
  }

  const verLabel = document.getElementById('dna-new-version-label');
  if (verLabel) verLabel.innerText = nextVer;

  const descInput = document.getElementById('dna-new-snap-desc');
  if (descInput) descInput.value = 'Updated prompt context & brand parameters';

  if (modal) modal.style.display = 'flex';
}
window.openCreateSnapshotModal = openCreateSnapshotModal;

function closeCreateSnapshotModal() {
  const modal = document.getElementById('dna-create-snapshot-modal');
  if (modal) modal.style.display = 'none';
}
window.closeCreateSnapshotModal = closeCreateSnapshotModal;

function saveNewSnapshotCommit() {
  const verLabel = document.getElementById('dna-new-version-label');
  const descInput = document.getElementById('dna-new-snap-desc');
  const activeCheck = document.getElementById('dna-new-snap-active');

  const ver = verLabel ? verLabel.innerText : 'v1.1';
  const desc = (descInput && descInput.value.trim()) ? descInput.value.trim() : 'Manual snapshot commit';
  const makeActive = activeCheck ? activeCheck.checked : true;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const snapshots = getDnaSnapshots();

  if (makeActive) {
    snapshots.forEach(s => s.active = false);
  }

  const newSnap = {
    version: ver,
    description: desc,
    author: 'Sahana Viswanath',
    date: dateFormatted,
    completeness: '100% completeness',
    active: makeActive,
    data: {
      brandName: 'Vibodhai',
      industry: 'Digital Marketing Automation & AI Operations',
      mission: 'Empower digital marketing agencies to automate end-to-end multi-channel operations, delivering 10x content velocity while preserving 100% brand fidelity.',
      description: 'Vibodh Signal is an AI-powered digital marketing operating system designed specifically for marketing agencies, brand managers, and growth teams.',
      positioning: 'The premier autonomous marketing orchestration engine that bridges strategic brand intelligence with enterprise-grade multi-channel distribution.',
      targetAudience: 'Mid-Market & Boutique Digital Marketing Agencies',
      voiceTone: 'Authoritative, Visionary, Data-Driven, Empathetic',
      colors: '#0F9D8A (Teal), #0F172A (Deep Slate), #F59E0B (Amber Gold)',
      typography: 'Plus Jakarta Sans, Inter',
      pillars: 'AI Automation (40%), Agency ROI (35%), Brand Integrity (25%)',
      guardrails: 'Strict Claim Verification, Zero Hallucination'
    }
  };

  // Add to top of list
  snapshots.unshift(newSnap);

  // Retain up to 5 rolling versions
  if (snapshots.length > 5) {
    snapshots.length = 5;
  }

  saveDnaSnapshots(snapshots);
  closeCreateSnapshotModal();
  renderDnaSnapshots();

  if (typeof showToast === 'function') {
    showToast(`Snapshot ${ver} created and activated in AI prompts!`, '⏱️');
  }
}
window.saveNewSnapshotCommit = saveNewSnapshotCommit;

function activateSnapshot(ver) {
  const snapshots = getDnaSnapshots();
  snapshots.forEach(s => {
    s.active = (s.version === ver);
  });
  saveDnaSnapshots(snapshots);
  renderDnaSnapshots();
  if (typeof showToast === 'function') {
    showToast(`Snapshot ${ver} is now active in AI prompt context!`, '✅');
  }
}
window.activateSnapshot = activateSnapshot;

function exportSnapshotJSON() {
  const snap = currentInspectedSnapshot || getDnaSnapshots()[0];
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snap, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `brand-dna-snapshot-${snap.version}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  if (typeof showToast === 'function') {
    showToast(`Snapshot ${snap.version} exported as JSON`, '📥');
  }
}
window.exportSnapshotJSON = exportSnapshotJSON;


window.updateModalSegCounter = function() {
  const sc = document.getElementById('modal-seg-counter');
  const tagsList = document.getElementById('modal-tags-list');
  if (sc && tagsList) {
    const count = tagsList.querySelectorAll('.modal-tag-item').length;
    sc.innerText = `${count} segments`;
  }
};

/* ── Content Studio Right Sidebar State Machine ───────────────────────── */
/* States: 'collapsed' (68px) | 'menu' (shows tool names) | 'options' (full form) */
function setCsRightSidebarState(state) {
  const containers = document.querySelectorAll('.cs-layout-container');
  const viewCs = document.getElementById('view-content-studio');

  const allStates = [
    'sidebar-collapsed',
    'sidebar-menu-open',
    'sidebar-options-open',
    'sidebar-channels-open',
    'sidebar-drafts-open',
    'sidebar-schedule-open',
    'sidebar-guardrail-open',
    'sidebar-preview-open',
    'sidebar-hidden'
  ];

  containers.forEach(c => {
    allStates.forEach(s => c.classList.remove(s));
    if (state === 'collapsed') {
      c.classList.add('sidebar-collapsed');
    } else if (state === 'menu') {
      c.classList.add('sidebar-menu-open');
    } else if (state === 'options') {
      c.classList.add('sidebar-options-open');
    } else if (state === 'channels') {
      c.classList.add('sidebar-channels-open');
    } else if (state === 'drafts') {
      c.classList.add('sidebar-drafts-open');
    } else if (state === 'schedule') {
      c.classList.add('sidebar-schedule-open');
    } else if (state === 'guardrail') {
      c.classList.add('sidebar-guardrail-open');
    } else if (state === 'preview') {
      c.classList.add('sidebar-preview-open');
    }
  });

  if (viewCs) {
    const csStates = [
      'cs-sidebar-collapsed',
      'cs-sidebar-menu-open',
      'cs-sidebar-options-open',
      'cs-sidebar-channels-open',
      'cs-sidebar-drafts-open',
      'cs-sidebar-schedule-open',
      'cs-sidebar-guardrail-open',
      'cs-sidebar-preview-open',
      'cs-sidebar-expanded'
    ];
    csStates.forEach(s => viewCs.classList.remove(s));
    if (state === 'collapsed') {
      viewCs.classList.add('cs-sidebar-collapsed');
    } else if (state === 'menu') {
      viewCs.classList.add('cs-sidebar-menu-open');
    } else if (state === 'options') {
      viewCs.classList.add('cs-sidebar-expanded', 'cs-sidebar-options-open');
    } else if (state === 'channels') {
      viewCs.classList.add('cs-sidebar-expanded', 'cs-sidebar-channels-open');
    } else if (state === 'drafts') {
      viewCs.classList.add('cs-sidebar-expanded', 'cs-sidebar-drafts-open');
    } else if (state === 'schedule') {
      viewCs.classList.add('cs-sidebar-expanded', 'cs-sidebar-schedule-open');
    } else if (state === 'guardrail') {
      viewCs.classList.add('cs-sidebar-expanded', 'cs-sidebar-guardrail-open');
    } else if (state === 'preview') {
      viewCs.classList.add('cs-sidebar-expanded', 'cs-sidebar-preview-open');
    }
  }

  /* CRITICAL GUARANTEE: Open ONLY ONE window at a time.
     All other windows are immediately set to display: none !important.
  */
  const panelMap = [
    { key: 'menu', selector: '.cs-right-sidebar-menu', display: 'flex' },
    { key: 'options', selector: '.cs-right-sidebar-full', display: 'block' },
    { key: 'channels', selector: '.cs-right-sidebar-channels', display: 'flex' },
    { key: 'drafts', selector: '.cs-right-sidebar-drafts', display: 'flex' },
    { key: 'schedule', selector: '.cs-right-sidebar-schedule', display: 'flex' },
    { key: 'guardrail', selector: '.cs-right-sidebar-guardrail', display: 'flex' },
    { key: 'preview', selector: '.cs-right-sidebar-preview', display: 'flex' }
  ];

  document.querySelectorAll('.cs-workspace-col.cs-right-sidebar').forEach(sidebar => {
    panelMap.forEach(p => {
      const el = sidebar.querySelector(p.selector);
      if (el) {
        if (state === p.key) {
          el.style.setProperty('display', p.display, 'important');
        } else {
          el.style.setProperty('display', 'none', 'important');
        }
      }
    });
  });

  if (typeof updateCsRailButtons === 'function') {
    updateCsRailButtons(state);
  }

  if (state === 'channels' && typeof renderAllChannelCards === 'function') {
    renderAllChannelCards();
  }
  if (state === 'drafts' && typeof renderAllDraftsCards === 'function') {
    renderAllDraftsCards();
  }
  if (state === 'schedule' && typeof populateSchedulePanel === 'function') {
    populateSchedulePanel();
  }
  if (state === 'guardrail' && typeof renderAllGuardrailChecks === 'function') {
    renderAllGuardrailChecks();
  }
  if (state === 'preview' && typeof renderAllSidePreviews === 'function') {
    renderAllSidePreviews();
  }

  try {
    localStorage.setItem('vibodh_cs_right_sidebar_state', state);
  } catch(e) {}
}
window.setCsRightSidebarState = setCsRightSidebarState;

/* Toggle Button (2nd image button):
   - When collapsed -> opens menu showing the tool names
   - When open -> collapses to 68px rail
*/
function toggleCsRightSidebar(forceExpand) {
  const containers = document.querySelectorAll('.cs-layout-container');
  if (!containers.length) return;
  const first = containers[0];
  const isCurrentlyCollapsed = first.classList.contains('sidebar-collapsed');

  if (typeof forceExpand === 'boolean') {
    setCsRightSidebarState(forceExpand ? 'menu' : 'collapsed');
  } else {
    setCsRightSidebarState(isCurrentlyCollapsed ? 'menu' : 'collapsed');
  }

  if (window.showToast) {
    showToast(isCurrentlyCollapsed ? 'AI Tools menu opened' : 'Sidebar collapsed', '🎛️');
  }
}
window.toggleCsRightSidebar = toggleCsRightSidebar;

/* When user clicks on a tool button in right panel:
   - 'text', 'image', 'video' -> displays generator form options in right panel
   - 'channels' -> displays target channels selection options in right panel
   - 'drafts' -> displays saved drafts in right panel
   - 'schedule' -> displays scheduling options in right panel
   - 'guardrail' -> displays AI guardrail policy checks in right panel
*/
/* Helper to get actual current right sidebar state */
function getCurrentCsRightSidebarState() {
  const container = document.querySelector('.cs-layout-container');
  if (!container) return 'collapsed';
  if (container.classList.contains('sidebar-options-open')) return 'options';
  if (container.classList.contains('sidebar-channels-open')) return 'channels';
  if (container.classList.contains('sidebar-drafts-open')) return 'drafts';
  if (container.classList.contains('sidebar-schedule-open')) return 'schedule';
  if (container.classList.contains('sidebar-guardrail-open')) return 'guardrail';
  if (container.classList.contains('sidebar-preview-open')) return 'preview';
  if (container.classList.contains('sidebar-menu-open')) return 'menu';
  if (container.classList.contains('sidebar-collapsed')) return 'collapsed';
  return 'collapsed';
}

/* When user clicks on a tool button in right panel / rail:
   - If that tool panel is already OPEN -> TOGGLE CLOSE IT (collapse panel)
   - If closed or different tool open -> OPEN ONLY that tool window
*/
function openCsRightSidebarTool(tabType) {
  // Map tabType to its corresponding panel state
  let targetState = 'options';
  if (tabType === 'channels') targetState = 'channels';
  else if (tabType === 'drafts') targetState = 'drafts';
  else if (tabType === 'schedule') targetState = 'schedule';
  else if (tabType === 'guardrail') targetState = 'guardrail';
  else if (tabType === 'preview') targetState = 'preview';
  else if (['text', 'image', 'video'].includes(tabType)) targetState = 'options';

  const currentState = getCurrentCsRightSidebarState();

  // TASK 1: If the panel is already open for this same button, clicking it again CLOSES the panel!
  if (currentState === targetState) {
    setCsRightSidebarState('collapsed');
    if (window.showToast) {
      showToast('Panel closed', '✖️');
    }
    return;
  }

  // Otherwise, open this specific tool window
  setCsRightSidebarState(targetState);

  const titles = {
    'text': 'AI Text Generator Options',
    'image': 'AI Image Generator Options',
    'video': 'AI Video Generator Options',
    'channels': 'Target Channels options opened',
    'drafts': 'Saved Drafts opened',
    'schedule': 'Schedule Post options opened',
    'guardrail': 'AI Guardrail checks opened',
    'preview': 'Social Post Preview opened'
  };

  const icons = {
    'text': '🎛️',
    'image': '🎛️',
    'video': '🎛️',
    'channels': '🎯',
    'drafts': '📁',
    'schedule': '📅',
    'guardrail': '🛡️',
    'preview': '👁️'
  };

  if (window.showToast) {
    showToast(titles[tabType] || 'Options opened', icons[tabType] || '🎛️');
  }
}
window.openCsRightSidebarTool = openCsRightSidebarTool;

/* Back button in options header: returns to the Menu List View */
function showCsRightSidebarMenu() {
  setCsRightSidebarState('menu');
  if (window.showToast) {
    showToast('Returned to AI Tools menu', '📋');
  }
}
window.showCsRightSidebarMenu = showCsRightSidebarMenu;

// Global shortcut Ctrl+\ to toggle Content Studio right sidebar
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key === '\\') {
    e.preventDefault();
    if (typeof window.toggleCsRightSidebar === 'function') {
      window.toggleCsRightSidebar();
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Content Studio Right Sidebar Drag-to-Resize Handler (Double-Sided Arrow)
// Allows expanding throughout the section (up to window.innerWidth - 90px)
// Resizer is hidden when panel is closed, displayed ONLY when opened
// ─────────────────────────────────────────────────────────────────────────────
function initCsSidebarResizers() {
  const containers = document.querySelectorAll('.cs-layout-container');
  const resizers = document.querySelectorAll('.cs-sidebar-resizer');
  
  if (!resizers.length) return;

  // Restore saved width from localStorage if present (allowing full section expansion)
  try {
    const savedWidth = localStorage.getItem('vibodh_cs_right_sidebar_width');
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      const maxPossible = Math.max(700, window.innerWidth - 90);
      if (parsed >= 280 && parsed <= maxPossible) {
        document.documentElement.style.setProperty('--cs-right-sidebar-width', parsed + 'px');
      }
    }
  } catch(e) {}

  resizers.forEach(resizer => {
    let container = null;
    let sidebar = null;

    function onPointerMove(e) {
      if (!container) return;
      
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      if (!clientX) return;

      // Because the panel is docked at right: 0, the width is window.innerWidth - clientX
      let newWidth = window.innerWidth - clientX;
      
      // Auto-collapse if dragged very small (< 180px)
      if (newWidth < 180) {
        if (!container.classList.contains('sidebar-collapsed')) {
          if (typeof window.toggleCsRightSidebar === 'function') {
            window.toggleCsRightSidebar(false);
          }
        }
        return;
      }

      // If collapsed and user drags wider than 220px, uncollapse
      if (container.classList.contains('sidebar-collapsed') && newWidth >= 220) {
        if (typeof window.toggleCsRightSidebar === 'function') {
          window.toggleCsRightSidebar(true);
        }
      }

      // Allow expanding throughout the section (up to window.innerWidth - 90px)
      const maxAllowed = Math.max(650, Math.floor(window.innerWidth - 90));
      newWidth = Math.max(280, Math.min(newWidth, maxAllowed));

      document.documentElement.style.setProperty('--cs-right-sidebar-width', newWidth + 'px');
      try {
        localStorage.setItem('vibodh_cs_right_sidebar_width', newWidth);
      } catch(err) {}
    }

    function onPointerUp() {
      document.body.classList.remove('cs-resizing-active');
      containers.forEach(c => c.classList.remove('is-resizing'));
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    }

    resizer.addEventListener('mousedown', function(e) {
      e.preventDefault();
      container = resizer.closest('.cs-layout-container');
      sidebar = container ? container.querySelector('.cs-workspace-col') : null;
      if (!container || !sidebar) return;

      document.body.classList.add('cs-resizing-active');
      container.classList.add('is-resizing');

      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
    });

    resizer.addEventListener('touchstart', function(e) {
      container = resizer.closest('.cs-layout-container');
      sidebar = container ? container.querySelector('.cs-workspace-col') : null;
      if (!container || !sidebar) return;

      document.body.classList.add('cs-resizing-active');
      container.classList.add('is-resizing');

      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp);
    }, { passive: true });

    // Double-click to toggle between expanded throughout section (~82% of screen) and default 420px
    resizer.addEventListener('dblclick', function() {
      const currentVal = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cs-right-sidebar-width') || '420', 10);
      const wideWidth = Math.max(650, Math.floor(window.innerWidth * 0.82));
      const targetWidth = (currentVal >= 650) ? '420px' : (wideWidth + 'px');
      
      document.documentElement.style.setProperty('--cs-right-sidebar-width', targetWidth);
      try {
        localStorage.setItem('vibodh_cs_right_sidebar_width', targetWidth);
      } catch(e) {}
      if (window.showToast) {
        showToast(targetWidth === '420px' ? 'Options panel reset to default (420px)' : 'Options panel expanded throughout section', '↔️');
      }
    });
  });

  // Ensure initial state matches saved preference (default to collapsed/closed)
  try {
    const savedState = localStorage.getItem('vibodh_cs_right_sidebar_state');
    if (savedState && ['collapsed', 'menu', 'options', 'channels', 'drafts', 'schedule', 'guardrail'].includes(savedState)) {
      setCsRightSidebarState(savedState);
    } else {
      setCsRightSidebarState('collapsed');
    }
  } catch(e) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCsSidebarResizers);
} else {
  initCsSidebarResizers();
}
window.initCsSidebarResizers = initCsSidebarResizers;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof renderAllChannelCards === 'function') renderAllChannelCards();
  if (typeof syncPreviewTargetChannels === 'function') syncPreviewTargetChannels();
  if (typeof renderAllSidePreviews === 'function') renderAllSidePreviews();
  if (typeof switchPreviewDevice === 'function') switchPreviewDevice(currentPreviewDevice);
});

/* ══════════════════════════════════════════════════════════════════════
   SAVED DRAFTS, SCHEDULE & GUARDRAILS IN RIGHT SIDEBAR PANEL
   ══════════════════════════════════════════════════════════════════════ */

const DRAFTS_DATA = [
  {
    id: 'd1',
    title: 'Enterprise Operations Launch Draft',
    time: 'Saved Today',
    badgeClass: 'teal',
    mode: 'image',
    format: '4:5 Feed • Photorealistic Commercial',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    headline: 'Enterprise AI Operations Bottlenecks',
    copy: 'Harness the power of AI-orchestrated digital workflows. While competitors struggle with disconnected tools, forward-thinking teams are unifying their brand operations into high-velocity engines that compound ROI.\n\n#VibodhSignal #MarketingAutomation #EnterpriseAI',
    prompt: 'Modern tech studio with holographic AI interface and brand analytics dashboard'
  },
  {
    id: 'd2',
    title: 'Cyber Neon Wave Campaign',
    time: 'Saved Yesterday',
    badgeClass: 'indigo',
    mode: 'image',
    format: '1:1 Square • Cyberpunk Glow',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    headline: 'Next-Gen Agency Automation Systems',
    copy: 'Neon wave aesthetics for next-gen agency operators. Stop settling for generic templates.\n\n#CyberTech #VibodhAI #HighImpact',
    prompt: 'Neon teal and purple fluid wave cyberpunk render 8k octane'
  },
  {
    id: 'd3',
    title: 'Agency Bottleneck Viral Reel (15s)',
    time: 'Video Draft',
    badgeClass: 'teal',
    mode: 'video',
    format: 'Duration: 15s • AI Reels • Voice: Alex Tech',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    headline: 'Stop Letting Delivery Bottlenecks Eat Margins',
    copy: 'Stop letting operational bottlenecks eat away at your client margins! 📉 In this quick breakdown, see how digital agencies are switching to unified AI workflows.\n\n#AIOperations #Reels #Shorts',
    prompt: '15s dynamic agency breakdown motion video with fast cuts'
  },
  {
    id: 'd4',
    title: '5 Costly Bottlenecks Eating Agency Margins',
    time: 'Text Draft',
    badgeClass: 'gray',
    mode: 'text',
    format: 'LinkedIn & X • Thought Leadership • 5 Points',
    icon: '📝',
    headline: '5 Costly Bottlenecks Eating Agency Margins',
    copy: 'When you rely on fragmented, non-scalable delivery methods, you aren\'t just losing time—you\'re losing your competitive edge. Here are 5 costly mistakes that kill your billable margins, from manual bottlenecks to ignoring compliance.\n\n1. Lack of Prompt Guardrails causing rework\n2. Treating AI as a standalone tool instead of pipeline\n3. Unmonitored token & inference spend\n4. Zero brand identity synchronization\n5. Manual distribution without automated queues\n\n👉 Schedule a Strategic Consultation to align your AI operations with enterprise standards.\n\n#EnterpriseAI #DigitalAgency #AIEngineering #ScalableSaaS #VibodhSignal',
    prompt: 'Agency profit margins and AI orchestration strategy breakdown'
  }
];

let selectedDraftId = 'd1';
let activeDraftFilter = 'all';
let draftsSearchQuery = '';

function renderAllDraftsCards() {
  ['text', 'image', 'video'].forEach(m => renderDraftsCards(m));
}
window.renderAllDraftsCards = renderAllDraftsCards;

function renderDraftsCards(mode) {
  const container = document.getElementById(`cs-drafts-list-${mode}`);
  const badge = document.getElementById(`cs-drafts-badge-${mode}`);
  if (!container) return;

  const query = (draftsSearchQuery || '').toLowerCase().trim();
  const filtered = DRAFTS_DATA.filter(d => {
    const matchesFilter = activeDraftFilter === 'all' || d.mode === activeDraftFilter;
    const matchesQuery = !query || d.title.toLowerCase().includes(query) || d.copy.toLowerCase().includes(query);
    return matchesFilter && matchesQuery;
  });

  if (badge) {
    badge.innerText = `${filtered.length} Saved Draft${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 30px 10px; color:#64748B; font-size:12px;">No drafts found matching "${query}"</div>`;
    return;
  }

  container.innerHTML = filtered.map(d => {
    const isSelected = selectedDraftId === d.id;
    return `
      <div class="cs-draft-card ${isSelected ? 'selected' : ''}" onclick="selectDraftInPanel('${d.id}', '${mode}', event)">
        ${d.image ? `
          <img src="${d.image}" class="cs-draft-thumb" alt="${d.title}">
        ` : `
          <div class="cs-draft-icon-box">${d.icon || '📝'}</div>
        `}
        <div class="cs-draft-body">
          <div class="cs-draft-header-row">
            <span class="cs-draft-title">${d.title}</span>
            <span class="cs-draft-badge ${d.badgeClass || 'teal'}">${d.time}</span>
          </div>
          <p class="cs-draft-snippet">${d.copy}</p>
          <div class="cs-draft-meta">${d.format}</div>
        </div>
      </div>
    `;
  }).join('');
}
window.renderDraftsCards = renderDraftsCards;

function selectDraftInPanel(draftId, mode, event) {
  if (event) event.stopPropagation();
  selectedDraftId = draftId;
  renderAllDraftsCards();
}
window.selectDraftInPanel = selectDraftInPanel;

function confirmDraftSelection(mode) {
  const d = DRAFTS_DATA.find(item => item.id === selectedDraftId) || DRAFTS_DATA[0];
  if (!d) return;

  const headlineEl = document.getElementById('mockup-headline-lead');
  const captionEl = document.getElementById('mockup-caption-text');
  if (headlineEl) headlineEl.innerText = d.headline || d.title;
  if (captionEl) captionEl.innerText = d.copy || '';

  const imgDisplay = document.getElementById('cs-img-display-main');
  if (imgDisplay && d.image) {
    imgDisplay.src = d.image;
  }

  if (window.showToast) {
    showToast(`Draft "${d.title}" restored into active canvas!`, '✨');
  }

  openCsRightSidebarTool(mode);
}
window.confirmDraftSelection = confirmDraftSelection;

function filterDraftsPanel(input, mode) {
  draftsSearchQuery = input ? input.value : '';
  renderAllDraftsCards();
}
window.filterDraftsPanel = filterDraftsPanel;

function clearDraftsSearch(mode) {
  draftsSearchQuery = '';
  const searchInput = document.getElementById(`cs-drafts-search-${mode}`);
  if (searchInput) searchInput.value = '';
  renderAllDraftsCards();
}
window.clearDraftsSearch = clearDraftsSearch;

function setDraftFilter(filterType, mode, btn) {
  activeDraftFilter = filterType;
  document.querySelectorAll(`#cs-drafts-panel-${mode} .cs-draft-filter-pill`).forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAllDraftsCards();
}
window.setDraftFilter = setDraftFilter;

/* ── Scheduling Functions ──────────────────────────────────────────────── */
function populateSchedulePanel() {
  const modes = ['text', 'image', 'video'];
  modes.forEach(mode => {
    const pillsWrap = document.getElementById(`cs-sched-platform-pills-${mode}`);
    if (pillsWrap && typeof AVAILABLE_PLATFORMS !== 'undefined') {
      const activePlats = AVAILABLE_PLATFORMS.filter(p => selectedPlatformIds.includes(p.id));
      if (activePlats.length > 0) {
        pillsWrap.innerHTML = activePlats.map(p => `
          <span style="display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:6px; background:${p.bg}; border:1px solid ${p.color}40; color:${p.color}; font-size:10.5px; font-weight:700;">
            ${p.iconSvg}
            <span>${p.name}</span>
          </span>
        `).join('');
      } else {
        pillsWrap.innerHTML = `<span style="font-size:11px; color:#94A3B8;">No channels selected. <a href="javascript:void(0)" onclick="openCsRightSidebarTool('channels')" style="color:#0F9D8A; font-weight:700;">Select Channels ›</a></span>`;
      }
    }

    const dateInput = document.getElementById(`cs-sched-date-${mode}`);
    if (dateInput && !dateInput.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }
  });
}
window.populateSchedulePanel = populateSchedulePanel;

function setPanelQuickSlot(day, time, mode, btn) {
  const dateInput = document.getElementById(`cs-sched-date-${mode}`);
  const timeInput = document.getElementById(`cs-sched-time-${mode}`);

  if (day === 'tomorrow' && dateInput) {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    dateInput.value = t.toISOString().split('T')[0];
  }
  if (time && timeInput) {
    timeInput.value = time;
  }

  document.querySelectorAll(`#cs-schedule-panel-${mode} .cs-sched-quick-slot`).forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}
window.setPanelQuickSlot = setPanelQuickSlot;

function confirmScheduleSocialPost(mode) {
  const currentMode = mode || 'text';
  const dateInput = document.getElementById(`cs-sched-date-${currentMode}`);
  const timeInput = document.getElementById(`cs-sched-time-${currentMode}`);

  const dateVal = dateInput?.value || 'Tomorrow';
  const timeVal = timeInput?.value || '10:30';

  const count = selectedPlatformIds.length;
  if (count === 0) {
    if (window.showToast) showToast('Please select at least 1 target channel before scheduling!', '⚠️');
    openCsRightSidebarTool('channels');
    return;
  }

  if (window.showToast) {
    showToast(`Post scheduled for ${dateVal} at ${timeVal} across ${count} channels!`, '📅');
  }

  openCsRightSidebarTool(currentMode);
}
window.confirmScheduleSocialPost = confirmScheduleSocialPost;

/* ── Guardrails Functions ──────────────────────────────────────────────── */
const GUARDRAIL_POLICIES = [
  { name: 'Brand Voice & Style Guide', status: 'Passed (99%)', desc: 'Aligned with authoritative, enterprise-grade tone defined in Brand DNA Vault.' },
  { name: 'Toxicity & Bias Filtering', status: 'Clean (100%)', desc: 'Zero offensive, hostile, or discriminatory expressions identified.' },
  { name: 'Factual Grounding & Hallucination', status: 'Verified (97%)', desc: 'Statements cross-referenced with internal product specs and verified claims.' },
  { name: 'PII & Confidentiality Shield', status: 'Protected (100%)', desc: 'No client PII, confidential API credentials, or internal URLs detected.' },
  { name: 'Competitor & Trademark Safety', status: 'Compliant (100%)', desc: 'Zero trademark violations or unauthorized third-party brand infringement.' },
  { name: 'Platform Constraints Compliance', status: 'Valid (100%)', desc: 'Length, hashtag density, and media aspect ratios meet channel limits.' },
  { name: 'Sentiment & Emotional Alignment', status: 'Optimal (98%)', desc: 'Inspiring, credible, and action-oriented emotional velocity score.' },
  { name: 'Copyright & Source Authenticity', status: 'Clear (100%)', desc: 'No flagged copyrighted verbatim text strings found.' }
];

function renderAllGuardrailChecks() {
  ['text', 'image', 'video'].forEach(m => renderGuardrailChecks(m));
}
window.renderAllGuardrailChecks = renderAllGuardrailChecks;

function renderGuardrailChecks(mode) {
  const container = document.getElementById(`cs-guardrail-checks-${mode}`);
  if (!container) return;

  container.innerHTML = GUARDRAIL_POLICIES.map((p, i) => `
    <div class="cs-guardrail-check-card">
      <div class="cs-guardrail-check-header">
        <span class="cs-guardrail-check-name">
          <span class="cs-guardrail-check-icon">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0F9D8A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          <span>${p.name}</span>
        </span>
        <span class="cs-guardrail-check-status">${p.status}</span>
      </div>
      <div class="cs-guardrail-check-desc">${p.desc}</div>
    </div>
  `).join('');
}
window.renderGuardrailChecks = renderGuardrailChecks;

function runGuardrailScanInPanel(mode) {
  const currentMode = mode || 'text';
  const statusText = document.getElementById(`cs-guardrail-status-text-${currentMode}`);
  const progressBar = document.getElementById(`cs-guardrail-progress-bar-${currentMode}`);

  if (statusText) statusText.innerHTML = `<span class="guardrail-scan-pulse"></span><span>Re-scanning against 8 enterprise safety policies...</span>`;
  if (progressBar) progressBar.style.width = '20%';

  setTimeout(() => {
    if (progressBar) progressBar.style.width = '65%';
  }, 250);

  setTimeout(() => {
    if (progressBar) progressBar.style.width = '100%';
    if (statusText) statusText.innerHTML = `<span class="guardrail-scan-pulse"></span><span>All 8 safety policies verified &amp; passing</span>`;
    if (window.showToast) showToast('AI Guardrail scan completed • 100% Passing', '🛡️');
  }, 500);
}
window.runGuardrailScanInPanel = runGuardrailScanInPanel;

function approveGuardrailInPanel(mode) {
  if (window.showToast) showToast('Guardrail clearance approved for distribution!', '✅');
  openCsRightSidebarTool(mode || 'text');
}
window.approveGuardrailInPanel = approveGuardrailInPanel;

/* Direct Aliases so existing triggers open the right sidebar panel */
window.openDraftsPickerModal = function(mode) { openCsRightSidebarTool('drafts'); };
window.openScheduleModal = function(mode) { openCsRightSidebarTool('schedule'); };
window.openGuardrailModal = function(mode) { openCsRightSidebarTool('guardrail'); };


/* ══════════════════════════════════════════════════════════════════════
   EDIT WITH AI BOX & THINK BUTTON
   ══════════════════════════════════════════════════════════════════════ */
let thinkModeActive = false;

function toggleThinkMode(mode) {
  thinkModeActive = !thinkModeActive;
  ['text', 'image', 'video'].forEach(m => {
    const btn = document.getElementById(`cs-think-btn-${m}`);
    if (btn) {
      if (thinkModeActive) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });

  if (window.showToast) {
    showToast(thinkModeActive ? 'Thinking model active: Get a Smarter Answer' : 'Standard model active', '🧠');
  }
}
window.toggleThinkMode = toggleThinkMode;

function submitEditWithAi(mode) {
  const currentMode = mode || (typeof currentActiveStudioMode !== 'undefined' ? currentActiveStudioMode : 'text');
  const input = document.getElementById(`cs-edit-ai-input-${currentMode}`);
  if (!input) return;
  const prompt = input.value.trim();
  if (!prompt) {
    if (window.showToast) {
      showToast('Type an edit prompt to apply with AI', '✍️');
    }
    input.focus();
    return;
  }

  // Micro animation on tick mark button
  const tickBtn = document.getElementById(`cs-edit-ai-tick-btn-${currentMode}`);
  if (tickBtn) {
    tickBtn.style.transform = 'scale(0.88)';
    setTimeout(() => { tickBtn.style.transform = ''; }, 160);
  }

  if (window.showToast) {
    showToast(`Refining with AI: "${prompt}"`, '✨');
  }

  if (currentMode === 'text') {
    const captionEl = document.getElementById('mockup-caption-text');
    if (captionEl) {
      captionEl.style.opacity = '0.5';
      setTimeout(() => {
        captionEl.style.opacity = '1';
        captionEl.innerText = captionEl.innerText + `\n\n✨ [AI Refinement (${thinkModeActive ? 'Smart Reasoner' : 'Fast'}): ${prompt}]`;
        if (window.showToast) showToast('AI Edit applied to canvas copy!', '✅');
      }, 450);
    }
  } else if (currentMode === 'image') {
    const imgCaption = document.getElementById('cs-image-caption-input');
    if (imgCaption) {
      imgCaption.style.opacity = '0.5';
      setTimeout(() => {
        imgCaption.style.opacity = '1';
        imgCaption.value = imgCaption.value + `\n\n✨ [AI Refinement (${thinkModeActive ? 'Smart Reasoner' : 'Fast'}): ${prompt}]`;
        if (window.showToast) showToast('AI Edit applied to image caption!', '✅');
      }, 450);
    }
    if (typeof regenerateImageMediaOnly === 'function') {
      regenerateImageMediaOnly();
    }
  } else if (currentMode === 'video') {
    const vidCaption = document.getElementById('cs-video-caption-input');
    if (vidCaption) {
      vidCaption.style.opacity = '0.5';
      setTimeout(() => {
        vidCaption.style.opacity = '1';
        vidCaption.value = vidCaption.value + `\n\n✨ [AI Refinement (${thinkModeActive ? 'Smart Reasoner' : 'Fast'}): ${prompt}]`;
        if (window.showToast) showToast('AI Edit applied to video description!', '✅');
      }, 450);
    }
    if (typeof regenerateVideoMediaOnly === 'function') {
      regenerateVideoMediaOnly();
    }
  }

  input.value = '';
}
window.submitEditWithAi = submitEditWithAi;

function handleEditWithAiKeyDown(event, mode) {
  if (event.key === 'Enter') {
    event.preventDefault();
    submitEditWithAi(mode);
  }
}
window.handleEditWithAiKeyDown = handleEditWithAiKeyDown;


/* ══════════════════════════════════════════════════════════════════════
   LIVE SOCIAL POST PREVIEW IN RIGHT SIDEBAR
   ══════════════════════════════════════════════════════════════════════ */
let activeSidePreviewPlatform = 'li';
currentPreviewDevice = 'mobile';
try {
  const savedDev = localStorage.getItem('vibodh_preview_device');
  if (savedDev === 'desktop' || savedDev === 'mobile') {
    currentPreviewDevice = savedDev;
  }
} catch(e) {}

function toggleSnappyDevice(mode) {
  const next = currentPreviewDevice === 'mobile' ? 'desktop' : 'mobile';
  switchPreviewDevice(next, mode);
}
window.toggleSnappyDevice = toggleSnappyDevice;

function switchPreviewDevice(device, mode) {
  currentPreviewDevice = device || 'mobile';
  try {
    localStorage.setItem('vibodh_preview_device', currentPreviewDevice);
  } catch(e) {}

  const modes = ['text', 'image', 'video'];
  modes.forEach(m => {
    // 1. Snappy Track state
    const track = document.getElementById(`cs-snappy-track-${m}`);
    if (track) {
      track.classList.toggle('device-mobile', currentPreviewDevice === 'mobile');
      track.classList.toggle('device-desktop', currentPreviewDevice === 'desktop');
      track.setAttribute('aria-checked', currentPreviewDevice === 'desktop' ? 'true' : 'false');
    }

    // 2. Snappy buttons state
    const mobBtn = document.getElementById(`cs-device-btn-mobile-${m}`);
    const dskBtn = document.getElementById(`cs-device-btn-desktop-${m}`);
    if (mobBtn) mobBtn.classList.toggle('active', currentPreviewDevice === 'mobile');
    if (dskBtn) dskBtn.classList.toggle('active', currentPreviewDevice === 'desktop');

    // 3. Header title label
    const label = document.getElementById(`cs-device-label-${m}`);
    if (label) {
      label.innerText = currentPreviewDevice === 'mobile' ? 'Mobile View' : 'Desktop View';
    }

    // 4. Preview stage transformation
    const stage = document.getElementById(`cs-side-preview-stage-${m}`);
    if (stage) {
      stage.classList.toggle('device-mobile', currentPreviewDevice === 'mobile');
      stage.classList.toggle('device-desktop', currentPreviewDevice === 'desktop');
    }
  });

  if (window.showToast) {
    showToast(`Switched to ${currentPreviewDevice === 'mobile' ? 'Mobile Phone' : 'Desktop'} view`, currentPreviewDevice === 'mobile' ? '📱' : '🖥️');
  }
}
window.switchPreviewDevice = switchPreviewDevice;

function syncPreviewTargetChannels() {
  const modes = ['text', 'image', 'video'];
  const activeIds = (typeof selectedPlatformIds !== 'undefined')
    ? selectedPlatformIds
    : ['li', 'tw', 'ig', 'fb'];

  // Match with AVAILABLE_PLATFORMS
  const selectedPlatforms = AVAILABLE_PLATFORMS.filter(p => activeIds.includes(p.id));

  // If active platform is no longer in selected, auto-select first available or empty
  if (selectedPlatforms.length > 0) {
    if (!selectedPlatforms.some(p => p.id === activeSidePreviewPlatform)) {
      activeSidePreviewPlatform = selectedPlatforms[0].id;
    }
  } else {
    activeSidePreviewPlatform = '';
  }

  modes.forEach(m => {
    const subtext = document.getElementById(`cs-prev-channels-count-${m}`);
    if (subtext) {
      if (selectedPlatforms.length === 0) {
        subtext.innerText = '0 Channels Selected';
      } else {
        subtext.innerText = `${selectedPlatforms.length} Channel${selectedPlatforms.length === 1 ? '' : 's'} Selected`;
      }
    }

    const bar = document.getElementById(`cs-preview-platform-bar-${m}`);
    if (bar) {
      if (selectedPlatforms.length === 0) {
        bar.innerHTML = `
          <div style="font-size:11.5px; color:#64748B; padding:6px 0; display:flex; align-items:center; gap:6px;">
            <span>No channels active.</span>
            <button type="button" onclick="openCsRightSidebarTool('channels')" style="color:#0F9D8A; font-weight:700; background:none; border:none; cursor:pointer; text-decoration:underline; font-size:11.5px; padding:0;">
              Select Channels ›
            </button>
          </div>
        `;
      } else {
        bar.innerHTML = selectedPlatforms.map(p => {
          const isActive = p.id === activeSidePreviewPlatform;
          const svg = (p.iconSvg || '').replace(/width="16" height="16"/g, 'width="15" height="15"');
          return `
            <button type="button" class="cs-preview-plat-chip ${isActive ? 'active' : ''}" id="cs-prev-tab-${p.id}-${m}" onclick="switchSidePreviewPlatform('${p.id}', '${m}')" title="Preview on ${p.name}" aria-label="${p.name}">
              ${svg}
            </button>
          `;
        }).join('');
      }
    }
  });
}
window.syncPreviewTargetChannels = syncPreviewTargetChannels;

function switchSidePreviewPlatform(platform, mode) {
  activeSidePreviewPlatform = platform || 'li';
  const modes = ['text', 'image', 'video'];
  modes.forEach(m => {
    ['li', 'tw', 'ig', 'fb', 'yt', 'tt', 'pin', 'th'].forEach(p => {
      const chip = document.getElementById(`cs-prev-tab-${p}-${m}`);
      if (chip) {
        chip.classList.toggle('active', p === activeSidePreviewPlatform);
      }
    });
    renderSidePanelPreview(m);
  });
}
window.switchSidePreviewPlatform = switchSidePreviewPlatform;

function renderAllSidePreviews() {
  syncPreviewTargetChannels();
  ['text', 'image', 'video'].forEach(m => renderSidePanelPreview(m));
}
window.renderAllSidePreviews = renderAllSidePreviews;

function renderSidePanelPreview(mode) {
  const currentMode = mode || 'text';
  const stage = document.getElementById(`cs-side-preview-stage-${currentMode}`);
  if (!stage) return;

  // Sync device view styling
  stage.classList.toggle('device-mobile', currentPreviewDevice === 'mobile');
  stage.classList.toggle('device-desktop', currentPreviewDevice === 'desktop');

  // Check if any platform is selected
  const activeIds = (typeof selectedPlatformIds !== 'undefined') ? selectedPlatformIds : ['li', 'tw', 'ig', 'fb'];
  if (activeIds.length === 0) {
    stage.innerHTML = `
      <div style="text-align:center; padding:36px 16px; background:#F8FAFC; border:1.5px dashed #CBD5E1; border-radius:14px; color:#64748B;">
        <div style="font-size:28px; margin-bottom:8px;">🎯</div>
        <div style="font-weight:700; font-size:13.5px; color:#0F172A; margin-bottom:4px;">No Target Channels Selected</div>
        <div style="font-size:12px; line-height:1.45; margin-bottom:14px; color:#64748B;">Select one or more destination channels in Target Channels to preview your post across platforms.</div>
        <button type="button" class="btn-primary-teal" onclick="openCsRightSidebarTool('channels')" style="font-size:11.5px; padding:7px 18px; border-radius:8px;">Choose Channels</button>
      </div>
    `;
    return;
  }

  // Ensure activeSidePreviewPlatform is valid
  if (!activeSidePreviewPlatform || !activeIds.includes(activeSidePreviewPlatform)) {
    activeSidePreviewPlatform = activeIds[0];
  }

  // 1. Extract dynamic canvas content
  let headline = '';
  let copy = '';
  let mediaUrl = '';
  let isVideo = currentMode === 'video';

  if (currentMode === 'text') {
    const rawVal = (document.getElementById('mockup-caption-text')?.value ?? document.getElementById('mockup-caption-text')?.innerText ?? '').trim();
    const paras = rawVal.split(/\n\s*\n/);
    if (paras.length > 1) {
      headline = paras[0].trim();
      copy = paras.slice(1).join('\n\n').trim();
    } else {
      headline = '';
      copy = rawVal;
    }
    const leadEl = document.getElementById('mockup-headline-lead');
    if (leadEl && headline) leadEl.innerText = headline;
  } else if (currentMode === 'image') {
    headline = document.getElementById('cs-img-display-title')?.innerText.trim() || 'Visual Campaign Creative';
    copy = document.getElementById('cs-image-caption-input')?.value.trim() || document.getElementById('mockup-caption-text')?.innerText.trim() || '';
    mediaUrl = document.getElementById('cs-img-display-main')?.src || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80';
  } else if (currentMode === 'video') {
    headline = document.getElementById('mockup-headline-lead')?.innerText.trim() || 'Short-form Motion Showcase';
    copy = document.getElementById('cs-video-caption-input')?.value.trim() || document.getElementById('mockup-caption-text')?.innerText.trim() || '';
    const videoEl = document.getElementById('cs-main-video-player');
    mediaUrl = videoEl?.poster || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80';
  }

  // Highlight hashtags with Vibodh Signal teal
  const formatHashtags = (str) => {
    if (!str) return '';
    return str.replace(/#([\w\d_]+)/g, '<span class="cs-social-hashtag">#$1</span>');
  };

  const formattedCopy = formatHashtags(copy);

  // Platform specific rendering
  if (activeSidePreviewPlatform === 'tw') {
    // Twitter / X View
    stage.innerHTML = `
      <div class="cs-social-preview-card">
        <div class="cs-social-card-author">
          <div class="cs-social-card-avatar" style="background:#0F172A; color:#FFFFFF;">VS</div>
          <div class="cs-social-card-author-info">
            <div class="cs-social-card-name-row">
              <span class="cs-social-card-name">Vibodh Signal</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#0F9D8A"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            <div class="cs-social-card-meta">@vibodhsignal • Just now</div>
          </div>
        </div>
        <div class="cs-social-card-body">${formattedCopy}</div>
        ${mediaUrl ? `
          <div class="cs-social-card-media">
            ${isVideo ? `<video src="${mediaUrl}" poster="${mediaUrl}" controls style="width:100%; display:block; max-height:240px;"></video>` : `<img src="${mediaUrl}" alt="Tweet visual">`}
          </div>
        ` : ''}
        <div class="cs-social-card-actions">
          <button type="button" class="cs-social-action-btn">💬 <span>24</span></button>
          <button type="button" class="cs-social-action-btn">🔁 <span>16</span></button>
          <button type="button" class="cs-social-action-btn">❤️ <span>189</span></button>
          <button type="button" class="cs-social-action-btn">📊 <span>4.2k</span></button>
        </div>
      </div>
    `;
  } else if (activeSidePreviewPlatform === 'ig') {
    // Instagram View
    stage.innerHTML = `
      <div class="cs-social-preview-card" style="padding:0; overflow:hidden;">
        <div style="padding:12px 14px;" class="cs-social-card-author">
          <div class="cs-social-card-avatar" style="background:linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color:#FFFFFF;">VS</div>
          <div class="cs-social-card-author-info">
            <span class="cs-social-card-name">vibodhsignal</span>
            <span class="cs-social-card-meta">Original Audio • Sponsored</span>
          </div>
        </div>
        ${mediaUrl ? `
          <div class="cs-social-card-media" style="border-radius:0; border-left:none; border-right:none;">
            ${isVideo ? `<video src="${mediaUrl}" poster="${mediaUrl}" controls style="width:100%; display:block; max-height:260px; object-fit:cover;"></video>` : `<img src="${mediaUrl}" alt="Post visual" style="width:100%; display:block; max-height:260px; object-fit:cover;">`}
          </div>
        ` : `
          <div style="background:linear-gradient(135deg, #0F9D8A, #0B1320); padding:30px 20px; color:#fff; text-align:center;">
            <div style="font-size:16px; font-weight:800; margin-bottom:8px;">${headline}</div>
            <div style="font-size:12px; opacity:0.85;">Vibodh Signal Studio Quote Slide</div>
          </div>
        `}
        <div style="padding:10px 14px 14px 14px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; gap:12px; font-size:16px;">
              <span>❤️</span> <span>💬</span> <span>📤</span>
            </div>
            <span style="font-size:16px;">🔖</span>
          </div>
          <div style="font-size:11.5px; font-weight:700; color:#0F172A;">342 likes</div>
          <div class="cs-social-card-body" style="font-size:11.5px;">
            <strong>vibodhsignal</strong> ${formattedCopy}
          </div>
        </div>
      </div>
    `;
  } else if (activeSidePreviewPlatform === 'fb') {
    // Facebook View
    stage.innerHTML = `
      <div class="cs-social-preview-card">
        <div class="cs-social-card-author">
          <div class="cs-social-card-avatar" style="background:#1877F2; color:#FFFFFF; font-weight:700;">VS</div>
          <div class="cs-social-card-author-info">
            <div class="cs-social-card-name-row">
              <span class="cs-social-card-name">Vibodh Signal</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            <div class="cs-social-card-meta">Sponsored • Paid Partnership • 🌐</div>
          </div>
          <div style="margin-left:auto; color:#64748B; font-size:16px; cursor:pointer;">•••</div>
        </div>
        ${headline ? `<div class="cs-social-card-headline" style="font-size:13.5px; font-weight:700; color:#0F172A; margin:4px 0;">${headline}</div>` : ''}
        <div class="cs-social-card-body" style="font-size:13px; line-height:1.5; color:#1E293B;">${formattedCopy}</div>
        ${mediaUrl ? `
          <div class="cs-social-card-media" style="margin-top:8px; border-radius:10px; overflow:hidden; border:1px solid #E2E8F0;">
            ${isVideo ? `
              <video src="${mediaUrl}" poster="${mediaUrl}" controls style="width:100%; display:block; max-height:260px; object-fit:cover;"></video>
            ` : `
              <img src="${mediaUrl}" alt="Facebook visual" style="width:100%; display:block; max-height:260px; object-fit:cover;">
            `}
          </div>
        ` : ''}
        <div class="cs-social-card-reactions-bar" style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #F1F5F9; font-size:11.5px; color:#64748B;">
          <span style="display:inline-flex; align-items:center; gap:4px;">
            <span style="display:inline-flex; width:18px; height:18px; background:#1877F2; border-radius:50%; align-items:center; justify-content:center; color:#fff; font-size:10px;">👍</span>
            <span style="display:inline-flex; width:18px; height:18px; background:#FA3E3E; border-radius:50%; align-items:center; justify-content:center; color:#fff; font-size:10px; margin-left:-6px;">❤️</span>
            <span style="margin-left:4px; font-weight:600; color:#334155;">284</span>
          </span>
          <span>48 comments • 16 shares</span>
        </div>
        <div class="cs-social-card-actions" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; padding-top:4px;">
          <button type="button" class="cs-social-action-btn" style="width:100%; justify-content:center; padding:7px 0; font-size:12px; font-weight:600; color:#475569; background:transparent; border:none; border-radius:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1877F2" stroke-width="2" style="margin-right:5px;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
            Like
          </button>
          <button type="button" class="cs-social-action-btn" style="width:100%; justify-content:center; padding:7px 0; font-size:12px; font-weight:600; color:#475569; background:transparent; border:none; border-radius:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" style="margin-right:5px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Comment
          </button>
          <button type="button" class="cs-social-action-btn" style="width:100%; justify-content:center; padding:7px 0; font-size:12px; font-weight:600; color:#475569; background:transparent; border:none; border-radius:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" style="margin-right:5px;"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            Share
          </button>
        </div>
      </div>
    `;
  } else if (activeSidePreviewPlatform === 'yt') {
    // YouTube View
    stage.innerHTML = `
      <div class="cs-social-preview-card" style="padding:0; overflow:hidden;">
        ${mediaUrl ? `
          <div class="cs-social-card-media" style="border-radius:0; border-left:none; border-right:none;">
            ${isVideo ? `<video src="${mediaUrl}" poster="${mediaUrl}" controls style="width:100%; display:block; max-height:260px;"></video>` : `<img src="${mediaUrl}" alt="Video thumbnail" style="width:100%; display:block; max-height:260px;">`}
          </div>
        ` : ''}
        <div style="padding:12px 14px;">
          <div style="font-size:13.5px; font-weight:700; color:#0F172A; margin-bottom:6px;">${headline || 'Enterprise AI Marketing Showcase'}</div>
          <div class="cs-social-card-author" style="margin-bottom:8px;">
            <div class="cs-social-card-avatar" style="background:#FF0000; color:#fff;">VS</div>
            <div class="cs-social-card-author-info">
              <span class="cs-social-card-name">Vibodh Signal</span>
              <span class="cs-social-card-meta">24.5K subscribers • Just now</span>
            </div>
            <button type="button" style="margin-left:auto; background:#0F172A; color:#fff; border:none; padding:6px 14px; border-radius:9999px; font-size:11px; font-weight:600;">Subscribe</button>
          </div>
          <div class="cs-social-card-body" style="font-size:12px;">${formattedCopy}</div>
        </div>
      </div>
    `;
  } else if (activeSidePreviewPlatform === 'tt') {
    // TikTok View
    stage.innerHTML = `
      <div class="cs-social-preview-card" style="padding:0; overflow:hidden; background:#0B0F17; color:#FFFFFF; border:1px solid #1E293B;">
        <div style="padding:12px 14px; display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="cs-social-card-avatar" style="background:#000000; color:#00F2FE; border:1.5px solid #FE2C55;">VS</div>
            <div>
              <div style="font-size:13px; font-weight:700; color:#FFFFFF; display:flex; align-items:center; gap:4px;">
                @vibodhsignal
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#00F2FE"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
              <div style="font-size:11px; color:#94A3B8;">Vibodh Signal • TikTok Feed</div>
            </div>
          </div>
          <button type="button" style="background:#FE2C55; color:#fff; border:none; padding:5px 12px; border-radius:4px; font-size:11px; font-weight:700;">Follow</button>
        </div>
        ${mediaUrl ? `
          <div class="cs-social-card-media" style="position:relative; border-radius:0; border:none; margin:0;">
            ${isVideo ? `<video src="${mediaUrl}" poster="${mediaUrl}" controls style="width:100%; display:block; max-height:280px; object-fit:cover;"></video>` : `<img src="${mediaUrl}" alt="TikTok visual" style="width:100%; display:block; max-height:280px; object-fit:cover;">`}
            <div style="position:absolute; right:10px; bottom:20px; display:flex; flex-direction:column; gap:12px; align-items:center; z-index:2; text-shadow:0 1px 4px rgba(0,0,0,0.8);">
              <div style="display:flex; flex-direction:column; align-items:center; font-size:10px; font-weight:700; color:#fff;">
                <span style="font-size:20px;">❤️</span>
                <span>2.4K</span>
              </div>
              <div style="display:flex; flex-direction:column; align-items:center; font-size:10px; font-weight:700; color:#fff;">
                <span style="font-size:20px;">💬</span>
                <span>184</span>
              </div>
              <div style="display:flex; flex-direction:column; align-items:center; font-size:10px; font-weight:700; color:#fff;">
                <span style="font-size:20px;">🔖</span>
                <span>92</span>
              </div>
              <div style="display:flex; flex-direction:column; align-items:center; font-size:10px; font-weight:700; color:#fff;">
                <span style="font-size:20px;">↗️</span>
                <span>56</span>
              </div>
            </div>
          </div>
        ` : ''}
        <div style="padding:12px 14px;">
          <div class="cs-social-card-body" style="color:#F1F5F9; font-size:12.5px; line-height:1.45;">${formattedCopy}</div>
          <div style="display:flex; align-items:center; gap:6px; margin-top:8px; font-size:11px; color:#94A3B8;">
            <span>🎵</span>
            <span>vibodhsignal • Original Sound - Automation Wave</span>
          </div>
        </div>
      </div>
    `;
  } else if (activeSidePreviewPlatform === 'pin') {
    // Pinterest View
    stage.innerHTML = `
      <div class="cs-social-preview-card" style="padding:0; overflow:hidden; border-radius:16px;">
        ${mediaUrl ? `
          <div class="cs-social-card-media" style="position:relative; border-radius:0; border:none; margin:0;">
            ${isVideo ? `<video src="${mediaUrl}" poster="${mediaUrl}" controls style="width:100%; display:block; max-height:280px; object-fit:cover;"></video>` : `<img src="${mediaUrl}" alt="Pinterest pin" style="width:100%; display:block; max-height:280px; object-fit:cover;">`}
            <button type="button" style="position:absolute; top:12px; right:12px; background:#E60023; color:#fff; border:none; padding:7px 16px; border-radius:9999px; font-size:12px; font-weight:700; cursor:pointer; box-shadow:0 2px 8px rgba(230,0,35,0.4);">
              Save
            </button>
          </div>
        ` : ''}
        <div style="padding:14px 16px;">
          <div style="font-size:14px; font-weight:800; color:#0F172A; margin-bottom:4px;">${headline || 'Design & Automation Pin'}</div>
          <div class="cs-social-card-body" style="font-size:12.5px; color:#334155;">${formattedCopy}</div>
          <div class="cs-social-card-author" style="margin-top:12px; padding-top:10px; border-top:1px solid #F1F5F9;">
            <div class="cs-social-card-avatar" style="background:#E60023; color:#fff; width:32px; height:32px; font-size:11px;">VS</div>
            <div class="cs-social-card-author-info">
              <span class="cs-social-card-name" style="font-size:12px;">Vibodh Signal</span>
              <span class="cs-social-card-meta" style="font-size:10.5px;">14.2K followers</span>
            </div>
            <button type="button" style="margin-left:auto; background:#F1F5F9; color:#0F172A; border:none; padding:5px 12px; border-radius:9999px; font-size:11px; font-weight:600;">Follow</button>
          </div>
        </div>
      </div>
    `;
  } else if (activeSidePreviewPlatform === 'th') {
    // Threads View
    stage.innerHTML = `
      <div class="cs-social-preview-card">
        <div class="cs-social-card-author">
          <div class="cs-social-card-avatar" style="background:#000000; color:#FFFFFF; font-weight:700;">VS</div>
          <div class="cs-social-card-author-info">
            <div class="cs-social-card-name-row">
              <span class="cs-social-card-name">vibodhsignal</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#0A66C2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            <div class="cs-social-card-meta">threads.net • Just now</div>
          </div>
          <div style="margin-left:auto; color:#94A3B8; font-size:16px;">•••</div>
        </div>
        <div class="cs-social-card-body" style="font-size:13px; line-height:1.5;">${formattedCopy}</div>
        ${mediaUrl ? `
          <div class="cs-social-card-media" style="margin-top:8px; border-radius:10px; overflow:hidden; border:1px solid #E2E8F0;">
            ${isVideo ? `<video src="${mediaUrl}" poster="${mediaUrl}" controls style="width:100%; display:block; max-height:240px;"></video>` : `<img src="${mediaUrl}" alt="Threads media">`}
          </div>
        ` : ''}
        <div style="display:flex; gap:16px; margin-top:12px; font-size:16px; color:#475569;">
          <span>🤍</span> <span>💬</span> <span>🔁</span> <span>✈️</span>
        </div>
        <div style="font-size:11.5px; color:#94A3B8; margin-top:8px;">89 replies • 312 likes</div>
      </div>
    `;
  } else {
    // LinkedIn View (Default)
    stage.innerHTML = `
      <div class="cs-social-preview-card">
        <div class="cs-social-card-author">
          <div class="cs-social-card-avatar">VS</div>
          <div class="cs-social-card-author-info">
            <div class="cs-social-card-name-row">
              <span class="cs-social-card-name">Vibodh Signal</span>
              <span style="font-size:10px; color:#64748B; background:#F1F5F9; padding:1px 5px; border-radius:4px;">1st</span>
            </div>
            <div class="cs-social-card-meta">Enterprise Marketing Automation • Just now • 🌐</div>
          </div>
        </div>
        ${headline ? `<div class="cs-social-card-headline">${headline}</div>` : ''}
        <div class="cs-social-card-body">${formattedCopy}</div>
        ${mediaUrl ? `
          <div class="cs-social-card-media">
            ${isVideo ? `<video src="${mediaUrl}" poster="${mediaUrl}" controls style="width:100%; display:block; max-height:240px;"></video>` : `<img src="${mediaUrl}" alt="Post visual">`}
          </div>
        ` : ''}
        <div class="cs-social-card-reactions-bar">
          <span>👍❤️💡 148 reactions</span>
          <span>24 comments • 9 reposts</span>
        </div>
        <div class="cs-social-card-actions">
          <button type="button" class="cs-social-action-btn">👍 <span>Like</span></button>
          <button type="button" class="cs-social-action-btn">💬 <span>Comment</span></button>
          <button type="button" class="cs-social-action-btn">🔁 <span>Repost</span></button>
          <button type="button" class="cs-social-action-btn">📤 <span>Send</span></button>
        </div>
      </div>
    `;
  }
}
window.renderSidePanelPreview = renderSidePanelPreview;


// Direct alias for openPostPreviewModal so any calls open the right side panel
window.openPostPreviewModal = function(mode) {
  openCsRightSidebarTool('preview');
};

// Save Current Post handler (Floppy disk button in between Edit with AI & Post)
function saveCurrentPost(mode) {
  const m = mode || (typeof currentCsStepNum !== 'undefined' ? (currentCsStepNum === 2 ? 'image' : currentCsStepNum === 3 ? 'video' : 'text') : 'text');
  
  const saveBtn = document.getElementById(`cs-unified-save-btn-${m}`) || document.querySelector('.cs-unified-save-btn');
  if (saveBtn) {
    saveBtn.classList.add('saved');
    setTimeout(() => {
      saveBtn.classList.remove('saved');
    }, 1200);
  }

  if (m === 'text' && typeof saveCurrentDraft === 'function') {
    saveCurrentDraft();
  } else if (m === 'image' && typeof savePostToLibrary === 'function') {
    savePostToLibrary();
  } else if (m === 'video' && typeof saveVideoToLibrary === 'function') {
    saveVideoToLibrary();
  } else {
    showToast('Post successfully saved to your workspace library!', '💾');
  }
}
window.saveCurrentPost = saveCurrentPost;


// ══════════════════════════════════════════════════════════════════════
// Unicode Font Styler, Hashtags & Emojis Suite
// ══════════════════════════════════════════════════════════════════════

function toUnicodeStyle(text, style) {
  let result = '';
  for (let ch of text) {
    let code = ch.codePointAt(0);
    if (style === 'bold') {
      if (code >= 65 && code <= 90) result += String.fromCodePoint(0x1D5D4 + (code - 65));
      else if (code >= 97 && code <= 122) result += String.fromCodePoint(0x1D5EE + (code - 97));
      else if (code >= 48 && code <= 57) result += String.fromCodePoint(0x1D7EC + (code - 48));
      else result += ch;
    } else if (style === 'italic') {
      if (code >= 65 && code <= 90) result += String.fromCodePoint(0x1D608 + (code - 65));
      else if (code >= 97 && code <= 122) result += String.fromCodePoint(0x1D622 + (code - 97));
      else result += ch;
    } else if (style === 'script') {
      if (code >= 65 && code <= 90) result += String.fromCodePoint(0x1D4D0 + (code - 65));
      else if (code >= 97 && code <= 122) result += String.fromCodePoint(0x1D4EA + (code - 97));
      else result += ch;
    } else if (style === 'typewriter') {
      if (code >= 65 && code <= 90) result += String.fromCodePoint(0x1D670 + (code - 65));
      else if (code >= 97 && code <= 122) result += String.fromCodePoint(0x1D68A + (code - 97));
      else if (code >= 48 && code <= 57) result += String.fromCodePoint(0x1D7F6 + (code - 48));
      else result += ch;
    } else {
      result += ch;
    }
  }
  return result;
}

function normalizeUnicode(text) {
  let result = '';
  for (let ch of text) {
    let cp = ch.codePointAt(0);
    // Bold Sans A-Z (0x1D5D4 - 0x1D5ED)
    if (cp >= 0x1D5D4 && cp <= 0x1D5ED) result += String.fromCharCode(65 + (cp - 0x1D5D4));
    // Bold Sans a-z (0x1D5EE - 0x1D607)
    else if (cp >= 0x1D5EE && cp <= 0x1D607) result += String.fromCharCode(97 + (cp - 0x1D5EE));
    // Bold Sans 0-9 (0x1D7EC - 0x1D7F5)
    else if (cp >= 0x1D7EC && cp <= 0x1D7F5) result += String.fromCharCode(48 + (cp - 0x1D7EC));
    // Italic Sans A-Z (0x1D608 - 0x1D621)
    else if (cp >= 0x1D608 && cp <= 0x1D621) result += String.fromCharCode(65 + (cp - 0x1D608));
    // Italic Sans a-z (0x1D622 - 0x1D63B)
    else if (cp >= 0x1D622 && cp <= 0x1D63B) result += String.fromCharCode(97 + (cp - 0x1D622));
    // Script Bold A-Z (0x1D4D0 - 0x1D4E9)
    else if (cp >= 0x1D4D0 && cp <= 0x1D4E9) result += String.fromCharCode(65 + (cp - 0x1D4D0));
    // Script Bold a-z (0x1D4EA - 0x1D503)
    else if (cp >= 0x1D4EA && cp <= 0x1D503) result += String.fromCharCode(97 + (cp - 0x1D4EA));
    // Typewriter A-Z (0x1D670 - 0x1D689)
    else if (cp >= 0x1D670 && cp <= 0x1D689) result += String.fromCharCode(65 + (cp - 0x1D670));
    // Typewriter a-z (0x1D68A - 0x1D6A3)
    else if (cp >= 0x1D68A && cp <= 0x1D6A3) result += String.fromCharCode(97 + (cp - 0x1D68A));
    // Typewriter 0-9 (0x1D7F6 - 0x1D7FF)
    else if (cp >= 0x1D7F6 && cp <= 0x1D7FF) result += String.fromCharCode(48 + (cp - 0x1D7F6));
    else result += ch;
  }
  return result;
}

function applyUnicodeFontToTarget(targetId, style) {
  const textarea = document.getElementById(targetId);
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value || '';

  if (start !== end && end > start) {
    // Transform selected text
    const selected = val.substring(start, end);
    const converted = style === 'clear' ? normalizeUnicode(selected) : toUnicodeStyle(normalizeUnicode(selected), style);
    
    if (typeof textarea.setRangeText === 'function') {
      textarea.setRangeText(converted, start, end, 'select');
    } else {
      textarea.value = val.substring(0, start) + converted + val.substring(end);
      textarea.selectionStart = start;
      textarea.selectionEnd = start + converted.length;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    showToast(`Converted selection to ${style.toUpperCase()} font!`, '✨');
  } else {
    // If no text selected, highlight the opening hook (first line)
    const lines = val.split('\n');
    if (lines.length > 0 && lines[0].trim().length > 0) {
      const convertedHook = style === 'clear' ? normalizeUnicode(lines[0]) : toUnicodeStyle(normalizeUnicode(lines[0]), style);
      lines[0] = convertedHook;
      textarea.value = lines.join('\n');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      showToast(`Formatted opening hook with ${style.toUpperCase()} font!`, '✨');
    } else {
      showToast('Select text to apply font formatting, or type a hook first!', 'ℹ️');
    }
  }
  textarea.focus();
}
window.applyUnicodeFontToTarget = applyUnicodeFontToTarget;

function insertTagToTarget(targetId, tag) {
  const textarea = document.getElementById(targetId);
  if (!textarea) return;

  const val = textarea.value || '';
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  if (document.activeElement === textarea && start !== undefined) {
    const prefix = (start > 0 && val[start - 1] !== ' ' && val[start - 1] !== '\n') ? ' ' : '';
    const insertion = prefix + tag + ' ';
    if (typeof textarea.setRangeText === 'function') {
      textarea.setRangeText(insertion, start, end, 'end');
    } else {
      textarea.value = val.substring(0, start) + insertion + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
    }
  } else {
    // Append to end
    const separator = val.length === 0 ? '' : (val.endsWith('\n') ? '' : '\n\n');
    textarea.value = val + separator + tag;
  }

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  closeAllToolbarPopovers();
  showToast(`Added ${tag}`, '🏷️');
  textarea.focus();
}
window.insertTagToTarget = insertTagToTarget;

function insertEmojiToTarget(targetId, emoji) {
  const textarea = document.getElementById(targetId);
  if (!textarea) return;

  const val = textarea.value || '';
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  if (document.activeElement === textarea && start !== undefined) {
    const insertion = emoji + ' ';
    if (typeof textarea.setRangeText === 'function') {
      textarea.setRangeText(insertion, start, end, 'end');
    } else {
      textarea.value = val.substring(0, start) + insertion + val.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
    }
  } else {
    // Insert at beginning of active line or append
    const separator = val.length === 0 ? '' : (val.endsWith(' ') ? '' : ' ');
    textarea.value = val + separator + emoji + ' ';
  }

  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  closeAllToolbarPopovers();
  showToast(`Inserted ${emoji}`, emoji);
  textarea.focus();
}
window.insertEmojiToTarget = insertEmojiToTarget;

function toggleToolbarPopover(event, type, mode) {
  if (event) event.stopPropagation();
  const targetId = `cs-popover-${type}-${mode}`;
  const popover = document.getElementById(targetId);
  const isOpen = popover && popover.classList.contains('active');

  closeAllToolbarPopovers();

  if (popover && !isOpen) {
    popover.classList.add('active');
  }
}
window.toggleToolbarPopover = toggleToolbarPopover;

function closeAllToolbarPopovers() {
  document.querySelectorAll('.cs-toolbar-popover').forEach(p => p.classList.remove('active'));
}
window.closeAllToolbarPopovers = closeAllToolbarPopovers;

document.addEventListener('click', (e) => {
  if (!e.target.closest('.cs-toolbar-popover') && !e.target.closest('.cs-toolbar-tool-btn')) {
    closeAllToolbarPopovers();
  }
});

function copyStudioCaption(mode) {
  const inputId = mode === 'image' ? 'cs-image-caption-input' : mode === 'video' ? 'cs-video-caption-input' : 'mockup-caption-text';
  const el = document.getElementById(inputId);
  const text = el?.value || el?.innerText || '';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Caption copied to clipboard!', '📋');
    }).catch(() => showToast('Caption copied!', '📋'));
  } else {
    showToast('Caption copied!', '📋');
  }
}
window.copyStudioCaption = copyStudioCaption;
