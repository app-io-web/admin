import { useState, useRef } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, Button, HStack, Box, IconButton
} from '@chakra-ui/react';
import { FaDesktop, FaMobileAlt, FaSync } from 'react-icons/fa';

export default function PreviewSite({ isOpen, onClose, empresaMode = false }) {
  const [mode, setMode] = useState('desktop'); // 'desktop' ou 'mobile'
  const iframeRef = useRef(null); // ref para o iframe
  const [reloadKey, setReloadKey] = useState(0);

  const iframeStyle = {
    desktop: { width: '1280px', height: '800px', margin: '0 auto' },
    mobile: { width: '375px', height: '667px', margin: '0 auto' }
  };

  const siteUrl = empresaMode 
    ? 'https://www.maxfibraltda.com.br/#/empresas'
    : 'https://www.maxfibraltda.com.br/';

    const handleReload = () => {
        setReloadKey(prev => prev + 1); // muda a key do iframe pra forçar o reload
      };
      

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent bg="gray.900" color="white" position="relative">
        <ModalHeader>Preview Site</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <HStack spacing={4} mb={4}>
            <Button
              leftIcon={<FaDesktop />}
              colorScheme={mode === 'desktop' ? 'blue' : 'gray'}
              onClick={() => setMode('desktop')}
            >
              PC
            </Button>
            <Button
              leftIcon={<FaMobileAlt />}
              colorScheme={mode === 'mobile' ? 'blue' : 'gray'}
              onClick={() => setMode('mobile')}
            >
              Mobile
            </Button>
          </HStack>

          <Box bg="white" borderRadius="md" overflow="hidden" p={0}>
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={siteUrl}
            style={iframeStyle[mode]}
            frameBorder="0"
            sandbox="allow-same-origin allow-scripts allow-forms"
            title="Preview do Site"
            />

          </Box>
        </ModalBody>

        {/* Botão fixo no canto inferior direito */}
        <Box position="absolute" bottom={4} right={4}>
          <IconButton
            icon={<FaSync />}
            colorScheme="blue"
            size="lg"
            onClick={handleReload}
            aria-label="Recarregar"
          />
        </Box>
      </ModalContent>
    </Modal>
  );
}
