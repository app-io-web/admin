// src/components/relatorios/ModalExportarXlsx.jsx
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, Checkbox, VStack
} from '@chakra-ui/react';
import { useState } from 'react';


export default function ModalExportarXlsx({ isOpen, onClose, onConfirm }) {
  const [options, setOptions] = useState({
    excluirNaoEncontrados: false,
    excluirBloqueados: false,
    excluirStatusIndefinido: false,
    exportarPlano: true,
    exportarStatus: true,
    exportarCPF: true
  });

  const handleToggle = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const confirmar = () => {
    onConfirm(options);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Opções de Exportação</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="start" spacing={3}>
            <Checkbox isChecked={options.excluirNaoEncontrados} onChange={() => handleToggle('excluirNaoEncontrados')}>
              Não exportar clientes não encontrados no IXC
            </Checkbox>
            <Checkbox isChecked={options.excluirBloqueados} onChange={() => handleToggle('excluirBloqueados')}>
              Não exportar bloqueados
            </Checkbox>
            <Checkbox isChecked={options.excluirStatusIndefinido} onChange={() => handleToggle('excluirStatusIndefinido')}>
              Não exportar com status indefinido
            </Checkbox>
            <Checkbox isChecked={options.exportarPlano} onChange={() => handleToggle('exportarPlano')}>
              Exportar planos
            </Checkbox>
            <Checkbox isChecked={options.exportarStatus} onChange={() => handleToggle('exportarStatus')}>
              Exportar status
            </Checkbox>
            <Checkbox isChecked={options.exportarCPF} onChange={() => handleToggle('exportarCPF')}>
              Exportar CPF
            </Checkbox>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="green" onClick={confirmar}>
            Confirmar Exportação
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
