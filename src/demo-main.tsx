import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './demo/demo.css';
document.documentElement.dataset.tasEdition = 'demo';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
