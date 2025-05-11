import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, Text, VStack, HStack, Tag, Link, Spinner
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export default function ModalInfoOnu({ isOpen, onClose, onuId }) {
  const [info, setInfo] = useState(null);
  const [erro, setErro] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!onuId || !isOpen) return;

    const buscarInfo = async () => {
      try {
        setIsLoading(true);
        setErro('');
        setInfo(null);

        //console.log('🔍 Buscando ONU com MAC:', onuId);

        const resOnu = await fetch('https://apidoixc.nexusnerds.com.br/Data/onus.json');
        const listaOnus = await resOnu.json();
        //console.log('✅ Lista de ONUs:', listaOnus);

        const onus = listaOnus.registros || listaOnus.data || []; // garante array válido
        const onu = onus.find(o => o.mac === onuId);
        //console.log('🔎 ONU encontrada:', onu);
        if (!onu) {
          setErro('ONU não encontrada');
          setIsLoading(false);
          return;
        }

        const resContrato = await fetch('https://apidoixc.nexusnerds.com.br/Data/todos_contratos.json');
        const contratosRes = await resContrato.json();
        const contratos = contratosRes.registros || [];
        //console.log('✅ Lista de contratos:', contratos);

        const contrato = contratos.find(c => String(c.id) === String(onu.id_contrato));
        //console.log('🔎 Contrato encontrado:', contrato);

        const resCliente = await fetch('https://apidoixc.nexusnerds.com.br/Data/clientesAtivos.json');
        const clientesRes = await resCliente.json();
        const clientes = clientesRes.registros || [];
        //console.log('✅ Lista de clientes:', clientes);

        const cliente = contrato ? clientes.find(cli => String(cli.id) === String(contrato.id_cliente)) : null;
        //console.log('🔎 Cliente encontrado:', cliente);

        setInfo({ onu, contrato, cliente });
      } catch (e) {
        setErro('Erro ao carregar dados.');
        console.error('❌ Erro na busca de informações:', e);
      } finally {
        setIsLoading(false);
      }
    };

    buscarInfo();
  }, [onuId, isOpen]);

  const latitude = info?.cliente?.latitude;
  const longitude = info?.cliente?.longitude;
  const hasCoords = latitude && longitude;
  const linkGoogleMaps = hasCoords ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes da ONU</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading && (
            <HStack spacing={3}>
              <Spinner size="sm" color="blue.500" />
              <Text color="gray.600" fontSize="sm">Carregando dados, aguarde...</Text>
            </HStack>
          )}

          {erro && !isLoading && <Text color="red.400">{erro}</Text>}

          {info && !isLoading && (
            <VStack align="start" spacing={2} fontSize="sm" mt={2}>
              <Text><strong>MAC:</strong> {info.onu?.mac || '---'}</Text>
              <Text><strong>ID Contrato:</strong> {info.contrato?.id || '---'}</Text>
              <Text><strong>ID Cliente:</strong> {info.cliente?.id || '---'}</Text>

              <Text><strong>Nome:</strong> {info.cliente?.fantasia || '---'}</Text>
              <Text>
                <strong>Endereço:</strong>{' '}
                {info.cliente?.endereco || '---'}, {info.cliente?.numero || 'S/N'} - {info.cliente?.bairro || '---'}
              </Text>
              <Text><strong>Referência:</strong> {info.cliente?.referencia || '---'}</Text>
              <Text><strong>Latitude:</strong> {latitude || '---'}</Text>
              <Text><strong>Longitude:</strong> {longitude || '---'}</Text>

              {hasCoords && (
                <Link href={linkGoogleMaps} target="_blank" color="blue.500" fontWeight="bold">
                  📍 Ver no Google Maps
                </Link>
              )}

              <HStack wrap="wrap">
                {info.cliente?.telefone_celular && <Tag>{info.cliente.telefone_celular}</Tag>}
                {info.cliente?.whatsapp && <Tag>{info.cliente.whatsapp}</Tag>}
              </HStack>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Fechar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
