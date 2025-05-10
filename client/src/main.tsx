import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Добавляем глобальный обработчик ошибок
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
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

console.log('App initialization started');

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  const root = createRoot(rootElement);
  root.render(<App />);
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  
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
