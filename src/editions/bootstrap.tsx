import React, { type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { getEditionDefinition, type TasEdition } from './entitlements';

declare global {
  interface Window {
    __TAS_EDITION_MANIFEST__?: ReturnType<typeof getEditionDefinition>;
  }
}

export function mountEdition(edition: TasEdition, app: ReactNode) {
  const definition = getEditionDefinition(edition);
  document.documentElement.dataset.tasEdition = edition;
  document.title = definition.productName;
  window.__TAS_EDITION_MANIFEST__ = definition;

  const root = document.getElementById('root');
  if (!root) throw new Error('TAS edition bootstrap could not find #root.');

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      {app}
    </React.StrictMode>
  );
}
