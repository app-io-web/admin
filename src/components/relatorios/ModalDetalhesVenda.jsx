// src/components/relatorios/ModalDetalhesVenda.jsx
import {
  Box, Text, Tag, Badge, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, useColorModeValue, Accordion, AccordionItem,
  AccordionButton, AccordionPanel, AccordionIcon, IconButton, HStack, useDisclosure,Flex 
} from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';
import { useEffect, useState } from 'react';
import ModalFichaCliente from './ModalFichaCliente'; // importe o novo modal

export default function ModalDetalhesVenda({ isOpen, onClose, registros = [] }) {
  const [dadosCliente, setDadosCliente] = useState(null);
  const [contrato, setContrato] = useState(null);

  
  const {
  isOpen: isFichaOpen,
  onOpen: openFicha,
  onClose: closeFicha
} = useDisclosure();

  useEffect(() => {
    const buscarDadosExtras = async () => {
      const cpf = registros?.[0]?.cpf;
      if (!cpf) return;

      try {
        const resClientes = await fetch('https://apidoixc.nexusnerds.com.br/Data/clientesAtivos.json');
        const dataClientes = await resClientes.json();
        const clientes = dataClientes.registros;
        const cliente = clientes.find(c => c.cnpj_cpf === cpf);
        setDadosCliente(cliente || null);

        if (cliente?.id) {
          const resContratos = await fetch('https://apidoixc.nexusnerds.com.br/Data/todos_contratos.json');
          const dataContratos = await resContratos.json();
          const contratos = dataContratos.registros;
          const contratoCliente = contratos.find(c => c.id_cliente === cliente.id);
          setContrato(contratoCliente || null);
        } else {
          setContrato(null);
        }
      } catch (err) {
        console.error('Erro ao buscar dados extras', err);
        setContrato(null);
      }
    };

    if (isOpen) buscarDadosExtras();
  }, [isOpen, registros]);

  const traduzirStatus = (codigo) => {
    switch (codigo) {
      case 'A': return { label: 'Ativo', color: 'green' };
      case 'D': return { label: 'Desativado', color: 'gray' };
      case 'CM': return { label: 'Bloq. Manual', color: 'red' };
      case 'CA': return { label: 'Bloq. Automático', color: 'orange' };
      case 'FA': return { label: 'Financeiro', color: 'red' };
      case 'AA': return { label: 'Assinatura', color: 'yellow' };
      default: return { label: '---', color: 'gray' };
    }
  };

  const traduzirStatusContrato = (codigo) => {
    switch (codigo) {
      case 'P': return 'Pré-contrato';
      case 'A': return 'Ativo';
      case 'I': return 'Inativo';
      case 'N': return 'Negativado';
      case 'D': return 'Desistiu';
      default: return '---';
    }
  };

  const statusContrato = contrato?.status_internet ? traduzirStatus(contrato.status_internet) : null;
  const statusCliente = contrato?.status;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center" justify="space-between" pr={10}>
            <Text fontSize="lg" fontWeight="bold">Detalhes das Vendas</Text>
            {registros?.[0]?.cpf && registros?.[0]?.vendedor && (
              <IconButton
                icon={<InfoOutlineIcon />}
                aria-label="Ver ficha do cliente"
                size="sm"
                variant="ghost"
                onClick={openFicha}
              />
            )}
          </Flex>
        </ModalHeader>

        <ModalCloseButton />


        <ModalBody>
          <Accordion allowToggle defaultIndex={[0]}>
            {registros.map((venda, idx) => {
              const status = traduzirStatus(venda.statusContrato);
              return (
                <AccordionItem key={idx} border="1px solid #ccc" borderRadius="md" mb={2}>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        {venda.nome} — {venda.plano}
                        {venda.isEmpresa && (
                          <Badge ml={3} colorScheme="purple">Empresa</Badge>
                        )}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4} bg={useColorModeValue('gray.50', 'gray.700')} borderTop="1px solid #eee">
                    <Text fontSize="sm">CPF: {venda.cpf}</Text>
                    <Text fontSize="sm">Data: {venda.dataHora}</Text>
                    <Tag colorScheme={status.color} mt={2}>{status.label}</Tag>
                  </AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>

          {!dadosCliente && (
            <Box p={4} mt={4} borderTop="1px solid #ccc">
              <Text fontWeight="bold" fontSize="md" color="red.500">Cliente não encontrado na base de dados IXC</Text>
            </Box>
          )}

          {dadosCliente && (
            <Box p={4} mt={4} borderTop="1px solid #ccc">
              <Text fontWeight="bold" fontSize="md" mb={2}>Dados do Cliente</Text>
              <Text><b>Nome:</b> {dadosCliente.razao}</Text>
              <Text><b>Endereço:</b> {dadosCliente.endereco}, {dadosCliente.numero} - {dadosCliente.bairro}</Text>
              <Text><b>Telefone:</b> {dadosCliente.telefone_celular || dadosCliente.whatsapp}</Text>
              <Text><b>ID Cliente:</b> {dadosCliente.id}</Text>
              {dadosCliente.latitude && dadosCliente.longitude && (
                <Text>
                  <b>Localização:</b> <a
                    href={`https://www.google.com/maps?q=${dadosCliente.latitude},${dadosCliente.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline', color: 'teal' }}
                  >
                    Lat: {dadosCliente.latitude}, Lng: {dadosCliente.longitude}
                  </a>
                </Text>
              )}
            </Box>
          )}

          {contrato?.id && (
            <Box p={4} mt={4} borderTop="1px solid #ccc">
              <Text fontWeight="bold" fontSize="md" mb={2}>Contrato</Text>
              <Text><b>ID Contrato:</b> {contrato.id}</Text>
              {statusContrato && (
                <Text><b>Status Internet:</b> <Tag colorScheme={statusContrato.color}>{statusContrato.label}</Tag></Text>
              )}
              <Text><b>Status:</b> {traduzirStatusContrato(statusCliente)}</Text>
            </Box>
          )}
        </ModalBody>
      </ModalContent>

      <ModalFichaCliente
        isOpen={isFichaOpen}
        onClose={closeFicha}
        cpf={registros?.[0]?.cpf}
        vendedor={registros?.[0]?.vendedor}
        contrato={contrato}
      />
    </Modal>
  );
}