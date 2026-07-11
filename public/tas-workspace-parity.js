(() => {
  const wired = new WeakSet();
  const qs = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const buttonByText = (text, root = document) => all('button', root).find(button => (button.textContent || '').trim().includes(text));

  function installStyles() {
    if (qs('#tas-workspace-parity-style')) return;
    const style = document.createElement('style');
    style.id = 'tas-workspace-parity-style';
    style.textContent = `
      .premiumGoldenSplit{--tas-top-pane:50%;grid-template-rows:minmax(150px,var(--tas-top-pane)) 10px minmax(150px,1fr)!important}
      .premiumFindingsPane,.premiumBottomPane{display:flex!important;flex-direction:column!important;min-height:0!important;overflow:hidden!important}
      .premiumGoldenMatrixScroll,.desktopTopGrid{flex:1 1 auto!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:auto!important;overscroll-behavior:contain}
      .premiumBottomPane>.detailsPane,.premiumBottomPane>.htmlReportWrap{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow:auto!important;overscroll-behavior:contain}
      .premiumGoldenTable tbody tr,.desktopTopGrid tbody tr{cursor:pointer}
      .premiumGoldenTable tbody tr:focus-visible,.desktopTopGrid tbody tr:focus-visible{outline:3px solid #ff7a00;outline-offset:-3px}
      .premiumGoldenTable tbody tr.tasParitySelected td{box-shadow:inset 0 0 0 2px #2a91d8;background:#eaf6ff!important}
      .rowSplitter{height:10px!important;cursor:row-resize!important;position:relative;background:linear-gradient(180deg,#d4dee9,#9fb0c3,#d4dee9)!important;touch-action:none}
      .rowSplitter:after{content:'drag to resize';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:1px 8px;border-radius:999px;background:#f8fbff;color:#38516d;font-size:9px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
      .rowSplitter:focus-visible{outline:3px solid #ff7a00;outline-offset:1px}
      .tasParityToast{position:fixed;right:18px;bottom:18px;z-index:1300;max-width:420px;padding:10px 13px;border:1px solid #87a8c6;border-left:4px solid #25a9c2;border-radius:8px;background:#f7fcff;color:#163b61;box-shadow:0 14px 38px rgba(3,30,62,.22);font:700 12px/1.4 Segoe UI,Arial,sans-serif;opacity:0;transform:translateY(10px);transition:.18s ease;pointer-events:none}
      .tasParityToast.show{opacity:1;transform:translateY(0)}
    `;
    document.head.appendChild(style);
  }

  function toast(message) {
    let box = qs('.tasParityToast');
    if (!box) { box = document.createElement('div'); box.className = 'tasParityToast'; document.body.appendChild(box); }
    box.textContent = message;
    box.classList.add('show');
    clearTimeout(box._tasTimer);
    box._tasTimer = setTimeout(() => box.classList.remove('show'), 2200);
  }

  function activateDetailsPane() {
    const button = buttonByText('Selected finding details pane');
    if (button && !button.classList.contains('active')) button.click();
    requestAnimationFrame(() => {
      const details = qs('.premiumBottomPane .detailsPane');
      if (details) details.scrollTop = 0;
    });
  }

  function clickRawFinding(controlId, assetName) {
    const rawTab = buttonByText('Raw assurance grid');
    const goldenTab = buttonByText('Premium Golden matrix');
    if (!rawTab) return;
    const restoreGolden = Boolean(goldenTab && goldenTab.classList.contains('active'));
    rawTab.click();
    setTimeout(() => {
      const rows = all('.desktopTopGrid tbody tr');
      const row = rows.find(candidate => {
        const cells = all('td', candidate);
        return (cells[3]?.textContent || '').trim() === controlId && (!assetName || (cells[0]?.textContent || '').trim() === assetName);
      }) || rows.find(candidate => (all('td', candidate)[3]?.textContent || '').trim() === controlId);
      if (row) {
        row.click();
        activateDetailsPane();
        row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        toast(`Selected ${controlId}${assetName ? ` for ${assetName}` : ''}; details updated below.`);
      }
      if (restoreGolden && goldenTab) setTimeout(() => goldenTab.click(), 60);
    }, 60);
  }

  function wireRawRows() {
    all('.desktopTopGrid tbody tr').forEach(row => {
      if (wired.has(row)) return;
      wired.add(row);
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', `Open finding details for ${(all('td', row)[3]?.textContent || 'selected control').trim()}`);
      row.addEventListener('click', () => setTimeout(activateDetailsPane, 0), true);
      row.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); row.click(); }
      });
    });
  }

  function wireGoldenRows() {
    const table = qs('.premiumGoldenTable');
    if (!table) return;
    const headers = all('thead th', table).map(th => (th.textContent || '').trim());
    all('tbody tr', table).forEach(row => {
      if (wired.has(row)) return;
      wired.add(row);
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      const cells = all('td', row);
      const controlId = (cells[0]?.textContent || '').trim();
      row.setAttribute('aria-label', `Open selected finding details for ${controlId}`);
      const choose = event => {
        all('tbody tr', table).forEach(item => item.classList.remove('tasParitySelected'));
        row.classList.add('tasParitySelected');
        const cell = event.target.closest('td');
        const index = cell ? cells.indexOf(cell) : -1;
        const assetName = index >= 4 && index < headers.length - 2 ? headers[index] : '';
        clickRawFinding(controlId, assetName);
      };
      row.addEventListener('click', choose);
      row.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(event); }
      });
    });
  }

  function wireSplitter() {
    const splitter = qs('.premiumGoldenSplit .rowSplitter');
    if (!splitter || wired.has(splitter)) return;
    wired.add(splitter);
    splitter.tabIndex = 0;
    splitter.setAttribute('role', 'separator');
    splitter.setAttribute('aria-orientation', 'horizontal');
    splitter.setAttribute('aria-valuemin', '25');
    splitter.setAttribute('aria-valuemax', '75');
    splitter.setAttribute('aria-valuenow', '50');
    const split = splitter.parentElement;
    let dragging = false;
    const apply = clientY => {
      const rect = split.getBoundingClientRect();
      const ratio = Math.max(25, Math.min(75, ((clientY - rect.top) / rect.height) * 100));
      split.style.setProperty('--tas-top-pane', `${ratio}%`);
      splitter.setAttribute('aria-valuenow', String(Math.round(ratio)));
    };
    splitter.addEventListener('pointerdown', event => { dragging = true; splitter.setPointerCapture(event.pointerId); apply(event.clientY); });
    splitter.addEventListener('pointermove', event => { if (dragging) apply(event.clientY); });
    splitter.addEventListener('pointerup', event => { dragging = false; if (splitter.hasPointerCapture(event.pointerId)) splitter.releasePointerCapture(event.pointerId); });
    splitter.addEventListener('pointercancel', () => { dragging = false; });
    splitter.addEventListener('keydown', event => {
      if (!['ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
      event.preventDefault();
      let value = Number(splitter.getAttribute('aria-valuenow') || 50);
      if (event.key === 'ArrowUp') value -= 5;
      if (event.key === 'ArrowDown') value += 5;
      if (event.key === 'Home') value = 25;
      if (event.key === 'End') value = 75;
      value = Math.max(25, Math.min(75, value));
      split.style.setProperty('--tas-top-pane', `${value}%`);
      splitter.setAttribute('aria-valuenow', String(value));
    });
  }

  function install() {
    installStyles();
    wireRawRows();
    wireGoldenRows();
    wireSplitter();
  }

  install();
  new MutationObserver(install).observe(document.body, { childList: true, subtree: true });
  window.__TAS_WORKSPACE_PARITY__ = { version: '70.20.3', install };
})();
