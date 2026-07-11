(() => {
  const qs = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function linkButton(label, href, className = 'navy') {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.className = `tasMemberExtensionButton ${className}`;
    return a;
  }

  function installStyles() {
    if (qs('#tas-member-extension-style')) return;
    const style = document.createElement('style');
    style.id = 'tas-member-extension-style';
    style.textContent = `
      .tasMemberExtensionCard{grid-column:1/-1;border:1px solid #c6d5e5!important;background:linear-gradient(145deg,#fff,#f6fbff)!important;box-shadow:0 10px 26px rgba(4,30,62,.08)}
      .tasMemberExtensionCard h3{display:flex;align-items:center;gap:8px}.tasMemberExtensionCard .tasMemberStatus{display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:#e8f7f4;color:#087466;padding:5px 9px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
      .tasMemberExtensionActions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.tasMemberExtensionButton{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:7px 12px;border:1px solid #7591ad;background:#fff;color:#0a2346;text-decoration:none;font-size:12px;font-weight:800;border-radius:6px}.tasMemberExtensionButton.navy{background:#0a2c55;color:#fff;border-color:#0a2c55}.tasMemberExtensionButton.orange{background:#f47721;color:#fff;border-color:#f47721}
      .tasMemberExtensionNote{margin-top:12px;padding:10px 12px;border-left:4px solid #19b8c8;background:#eaf9fb;color:#17324e;font-size:12px;line-height:1.5}.tasMemberActivationGuide{margin-top:14px;border:1px solid #c6d5e5;background:#f8fbff;padding:14px;border-radius:8px}.tasMemberActivationGuide h3{margin:0 0 7px;color:#0a2346}.tasMemberActivationGuide ol{margin:8px 0 10px;padding-left:18px}.tasMemberActivationGuide li{margin:5px 0}.tasMemberUatBadge{display:inline-flex;margin-left:8px;padding:3px 7px;border-radius:999px;background:#fff3df;color:#9b4b00;font-size:10px;font-weight:800}
    `;
    document.head.appendChild(style);
  }

  function enhanceStandalone() {
    const page = qs('.standalonePage');
    if (!page || qs('[data-tas-member-extension]', page)) return;
    const grid = qs('.standaloneGrid', page);
    if (!grid) return;
    const placeholder = qs('.desktopDownloadLink', page);
    if (placeholder && !placeholder.dataset.tasMemberRetired) {
      placeholder.textContent = 'Commercial installer slot — not published';
      placeholder.removeAttribute('href');
      placeholder.removeAttribute('download');
      placeholder.setAttribute('aria-disabled', 'true');
      placeholder.dataset.tasMemberRetired = 'true';
      placeholder.style.opacity = '.62';
      placeholder.style.cursor = 'not-allowed';
    }
    const card = document.createElement('div');
    card.className = 'dashCard tasMemberExtensionCard';
    card.dataset.tasMemberExtension = 'true';
    card.innerHTML = `
      <h3>Member and edition hub <span class="tasMemberStatus">AURORA aligned</span></h3>
      <p>One controlled entry point for Community, Professional and Consultant customers, using the same command-centre colour, spacing and trust pattern as the main studio.</p>
      <p><b>Paid-member workspace:</b> entitled downloads, release hashes, quick start, offline activation, update status and support instructions now have a permanent home.</p>
      <div class="tasMemberExtensionActions"></div>
      <div class="tasMemberExtensionNote">No installer is falsely exposed. Signed Professional and Consultant release assets remain locked until the commercial fulfilment service is connected.</div>`;
    const actions = qs('.tasMemberExtensionActions', card);
    actions.append(linkButton('Open member hub', '/member/', 'orange'));
    actions.append(linkButton('Licence and download README', '/member-resources/TAS_LICENSING_AND_DOWNLOADS_README.md'));
    actions.append(linkButton('Customer quick start', '/member-resources/TAS_CUSTOMER_QUICK_START.md'));
    grid.appendChild(card);
  }

  function enhanceActivation() {
    const headings = all('.panel h2');
    const heading = headings.find(h => /Product activation/i.test(h.textContent || ''));
    if (!heading) return;
    const panel = heading.closest('.panel');
    if (!panel || qs('[data-tas-activation-guide]', panel)) return;

    all('button', panel).forEach(button => {
      const text = (button.textContent || '').trim();
      if (text === 'Activate product') button.textContent = 'Activate UAT demonstration';
      if (text === 'Create signed customer licence') button.textContent = 'Create UAT licence example';
    });
    const current = all('p', panel).find(p => /Current licence:/i.test(p.textContent || ''));
    if (current && !qs('.tasMemberUatBadge', current)) {
      const badge = document.createElement('span');
      badge.className = 'tasMemberUatBadge';
      badge.textContent = 'UAT only';
      current.appendChild(badge);
    }

    const guide = document.createElement('div');
    guide.className = 'tasMemberActivationGuide';
    guide.dataset.tasActivationGuide = 'true';
    guide.innerHTML = `<h3>How commercial licensing will work</h3><ol><li>Purchase creates the customer entitlement.</li><li>TAS produces a machine-bound activation request.</li><li>The vendor service returns a signed <code>.taslic</code> file.</li><li>The licence unlocks the correct edition and its protected download.</li><li>Update entitlement is tracked separately from the right to keep using the purchased version.</li></ol><div class="tasMemberExtensionActions"></div>`;
    const actions = qs('.tasMemberExtensionActions', guide);
    actions.append(linkButton('Open full licence guide', '/member/license-guide.html', 'navy'));
    actions.append(linkButton('Download offline activation workflow', '/member-resources/TAS_OFFLINE_ACTIVATION_WORKFLOW.md'));
    panel.appendChild(guide);
  }

  function install() {
    installStyles();
    enhanceStandalone();
    enhanceActivation();
  }

  install();
  new MutationObserver(install).observe(document.body, { childList: true, subtree: true });
})();
