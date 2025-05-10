import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Специальный режим диагностики для Replit Preview
const isPreviewMode = window.location.hostname.includes('.replit.dev') || 
                   window.location.hostname.includes('.replit.app');

// Автоматический редирект на страницу авторизации в случае ошибки
// Функция проверяет текущий URL и если мы не на странице /auth, редиректит при ошибке
const redirectToAuthOnError = () => {
  if (isPreviewMode && !window.location.pathname.includes('/auth')) {
    console.log('Redirecting to auth page due to error in Preview mode');
    window.location.href = '/auth';
    return true;
  }
  return false;
};

// Добавляем глобальный обработчик ошибок
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // В режиме Preview при ошибке редиректим на страницу авторизации
  if (redirectToAuthOnError()) return;
  
  // Создаем видимое сообщение об ошибке на странице
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100%';
  errorDiv.style.backgroundColor = 'red';
  errorDiv.style.color = 'white';
  errorDiv.style.padding = '10px';
  errorDiv.style.zIndex = '9999';
  errorDiv.textContent = `Error: ${event.error?.message || 'Unknown error occurred'}`;
  document.body.appendChild(errorDiv);
});

// Добавляем обработчик отклоненных промисов
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Специальная обработка ошибок 401 (Unauthorized)
  if (event.reason?.message?.includes('401:')) {
    console.warn('Authentication error detected (401)');
    
    // В режиме Preview редиректим на страницу авторизации
    if (redirectToAuthOnError()) return;
  }
  
  // Создаем видимое сообщение об ошибке
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '50px';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100%';
  errorDiv.style.backgroundColor = 'orange';
  errorDiv.style.color = 'white';
  errorDiv.style.padding = '10px';
  errorDiv.style.zIndex = '9999';
  errorDiv.textContent = `Promise error: ${event.reason?.message || 'Unknown promise error'}`;
  document.body.appendChild(errorDiv);
});

console.log('App initialization started in', isPreviewMode ? 'Preview Mode' : 'Development Mode');

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  // В режиме Preview добавляем автоматическую проверку аутентификации
  if (isPreviewMode) {
    fetch('/api/user', { credentials: 'include' })
      .then(res => {
        if (!res.ok && res.status === 401) {
          console.log('User not authenticated, redirecting to login page');
          if (window.location.pathname !== '/auth') {
            window.location.href = '/auth';
          }
        }
      })
      .catch(err => console.error('Auth check failed:', err));
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  
  // В режиме Preview при критической ошибке редиректим на страницу авторизации
  if (redirectToAuthOnError()) return;
  
  // Показываем ошибку на странице
  const fallbackDiv = document.createElement('div');
  fallbackDiv.style.padding = '20px';
  fallbackDiv.style.fontFamily = 'Arial, sans-serif';
  fallbackDiv.innerHTML = `
    <h1>Application Error</h1>
    <p>Sorry, the application failed to load properly.</p>
    <p>Error details: ${error instanceof Error ? error.message : String(error)}</p>
    <p>Please try refreshing the page or contact support.</p>
  `;
  document.body.innerHTML = '';
  document.body.appendChild(fallbackDiv);
}
