import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@douyinfe/semi-ui/dist/css/semi.css';
import { UserProvider } from './context/User';
import 'react-toastify/dist/ReactToastify.css';
import { StatusProvider } from './context/Status';
import { ThemeProvider } from './context/Theme';
import PageLayout from './components/layout/PageLayout.js';
import './i18n/i18n.js';
import './index.css';

// 欢迎信息（二次开发者不准将此移除）
// Welcome message (Secondary developers are not allowed to remove this)
if (typeof window !== 'undefined') {
  console.log('%cWe ❤ NewAPI%c Github: https://github.com/QuantumNous/new-api',
    'color: #10b981; font-weight: bold; font-size: 24px;',
    'color: inherit; font-size: 14px;');

  // 在开发环境中过滤 Semi Design 的 findDOMNode 警告
  if (process.env.NODE_ENV === 'development') {
    const originalWarn = console.warn;
    console.warn = function filterWarning(message) {
      const warnings = [
        'findDOMNode is deprecated',
        'findDOMNode was passed an instance of',
        'findDOMNode is deprecated in StrictMode'
      ];
      
      if (warnings.some(warning => message.includes && message.includes(warning))) {
        return;
      }
      
      originalWarn.apply(console, arguments);
    };
  }
}

// initialization

const root = ReactDOM.createRoot(document.getElementById('root'));

// 在开发环境中，由于 Semi Design UI 库使用了已弃用的 findDOMNode API，
// 我们暂时禁用 StrictMode 以减少控制台警告
const isDevelopment = process.env.NODE_ENV === 'development';

const AppWrapper = ({ children }) => {
  if (isDevelopment) {
    // 开发环境不使用 StrictMode
    return children;
  } else {
    // 生产环境使用 StrictMode
    return <React.StrictMode>{children}</React.StrictMode>;
  }
};

root.render(
  <AppWrapper>
    <StatusProvider>
      <UserProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ThemeProvider>
            <PageLayout />
          </ThemeProvider>
        </BrowserRouter>
      </UserProvider>
    </StatusProvider>
  </AppWrapper>,
);
