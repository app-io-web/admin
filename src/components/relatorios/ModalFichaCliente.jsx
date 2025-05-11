import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, Text, Box, Tag, Spinner, Link, IconButton, HStack
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

export default function ModalFichaCliente({ isOpen, onClose, cpf, vendedor, contrato }) {
  const [clienteInfo, setClienteInfo] = useState(null);
  const [carregando, setCarregando] = useState(true);

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

  const statusInternet = contrato?.status_internet;
  const statusInternetTraduzido = (() => {
    switch (statusInternet) {
      case 'A': return { label: 'Ativo', color: 'green' };
      case 'D': return { label: 'Desativado', color: 'gray' };
      case 'CM': return { label: 'Bloq. Manual', color: 'red' };
      case 'CA': return { label: 'Bloq. Automático', color: 'orange' };
      case 'FA': return { label: 'Financeiro', color: 'red' };
      case 'AA': return { label: 'Assinatura', color: 'yellow' };
      default: return { label: '---', color: 'gray' };
    }
  })();

  useEffect(() => {
    const buscarDados = async () => {
      setCarregando(true);
      setClienteInfo(null);

      try {
        const listaVendedoresRes = await fetch('https://max.api.email.nexusnerds.com.br/api/vendedores');
        const lista = await listaVendedoresRes.json();
        const vendedorData = lista.find(v => v.vendedor.toLowerCase() === vendedor?.toLowerCase());
        if (!vendedorData?.url) return;

        const dadosRes = await fetch(`https://max.api.email.nexusnerds.com.br${vendedorData.url}`);
        const registros = await dadosRes.json();

        const normalizar = (v) => v?.replace(/[^0-9]/g, '');
        const cliente = registros.find(c => normalizar(c.cpf) === normalizar(cpf));
        setClienteInfo(cliente || null);
      } catch (err) {
        console.error('Erro ao buscar ficha do cliente:', err);
        setClienteInfo(null);
      } finally {
        setCarregando(false);
      }
    };

    if (isOpen && cpf && vendedor) buscarDados();
  }, [isOpen, cpf, vendedor]);

  const formatarDataBR = (dataISO) => {
    return dayjs(dataISO).locale('pt-br').format('DD/MM/YYYY');
  };

  const TelefoneCopiavel = ({ numero }) => (
    <HStack spacing={2} mb={1}>
      <Text>{numero}</Text>
      <IconButton
        icon={<CopyIcon />}
        size="xs"
        variant="ghost"
        onClick={() => navigator.clipboard.writeText(numero)}
        aria-label={`Copiar ${numero}`}
      />
    </HStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent borderRadius="lg" boxShadow="lg">
        <ModalHeader fontWeight="bold" fontSize="xl">Ficha Completa do Cliente</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {carregando ? (
            <Spinner size="lg" />
          ) : clienteInfo ? (
            <>
              <Box mb={3}><Text fontWeight="bold">Nome:</Text><Text>{clienteInfo.nome}</Text></Box>
              <Box mb={3}><Text fontWeight="bold">Data de Nascimento:</Text><Text>{formatarDataBR(clienteInfo.dataNascimento) || '---'}</Text></Box>
              <Box mb={3}><Text fontWeight="bold">E-mail:</Text><Text>{clienteInfo.email || '---'}</Text></Box>

              <Box mb={3}><Text fontWeight="bold">Telefone(s):</Text>
                {clienteInfo.telefone1 && <TelefoneCopiavel numero={clienteInfo.telefone1} />}
                {clienteInfo.telefone2 && <TelefoneCopiavel numero={clienteInfo.telefone2} />}
              </Box>

              <Box mb={3}><Text fontWeight="bold">Endereço:</Text><Text>{clienteInfo.rua}, {clienteInfo.numero} - {clienteInfo.bairro}, {clienteInfo.cidade} - CEP: {clienteInfo.cep}</Text></Box>
              {clienteInfo.complemento && (
                <Box mb={3}><Text fontWeight="bold">Complemento:</Text><Text>{clienteInfo.complemento}</Text></Box>
              )}
              <Box mb={4}>
                <Text fontWeight="bold">Localização:</Text>
                {clienteInfo.latitude && clienteInfo.longitude ? (
                  <Link
                    href={`https://www.google.com/maps?q=${clienteInfo.latitude},${clienteInfo.longitude}`}
                    isExternal
                    color="teal.500"
                    textDecoration="underline"
                  >
                    Abrir no Google Maps
                  </Link>
                ) : <Text>---</Text>}
              </Box>

              {contrato && (
                <Box mt={6} borderTop="1px solid #ccc" pt={4}>
                  <Text fontWeight="bold" mb={2}>Contrato</Text>
                  <Text><b>ID:</b> {contrato.id}</Text>
                  <Text>
                    <b>Status Internet:</b>{' '}
                    <Tag colorScheme={statusInternetTraduzido.color}>{statusInternetTraduzido.label}</Tag>
                  </Text>
                  <Text><b>Status:</b> {traduzirStatusContrato(contrato.status)}</Text>
                </Box>
              )}
            </>
          ) : (
            <Text color="red.500">Cliente não encontrado nos registros do vendedor.</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}