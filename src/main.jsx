// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { HashRouter } from 'react-router-dom';
import { PermissionsProvider } from './context/PermissionsContext'; // Agora é .jsx, mas a extensão pode ser omitida
import AppRouter from './AppRouter';
import theme from './theme';
import './index.css';

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