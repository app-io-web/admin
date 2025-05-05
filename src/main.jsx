import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { HashRouter } from 'react-router-dom';
import { PermissionsProvider } from './context/PermissionsContext';
import AppRouter from './AppRouter';
import theme from './theme';
import './index.css';

// ✅ REGISTRO DO SERVICE WORKER FORA DO RENDER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/admin/service-worker.js')
    .then((registration) => {
      console.log('✅ Service Worker registrado:', registration);
    })
    .catch((error) => {
      console.error('❌ Erro ao registrar Service Worker:', error);
    });
}


// ✅ RENDERIZAÇÃO DO APP
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <PermissionsProvider>
        <HashRouter>
          <AppRouter />
        </HashRouter>
      </PermissionsProvider>
    </ChakraProvider>
  </StrictMode>
);
