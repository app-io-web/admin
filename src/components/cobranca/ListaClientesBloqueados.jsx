import { useEffect, useState } from 'react';
import {
  Box, Text, VStack, HStack, Button, useToast, Tag, Spinner,
  Input, useColorModeValue, IconButton
} from '@chakra-ui/react';
import {
  CopyIcon, WarningIcon, ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon
} from '@chakra-ui/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { apiGet } from '../../services/api';
import CobrancaAutomatica from '../cobranca/CobrancaAutomatica';
import DownloadXLSX from '../Download/DownloadXLSX';

export default function ListaClientesBloqueados() {
  const [clientes, setClientes] = useState([]);
  const [whatsappStatus, setWhatsappStatus] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [verificandoWhatsApp, setVerificandoWhatsApp] = useState(true);
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);

  const porPagina = 4;
  const toast = useToast();

  const bgCard = useColorModeValue('gray.50', 'gray.800');
  const corTexto = useColorModeValue('gray.800', 'gray.100');

  const clientesFiltrados = clientes.filter(c =>
    c.razao?.toLowerCase().includes(busca.toLowerCase())
  );
  const totalPaginas = Math.ceil(clientesFiltrados.length / porPagina);
  const inicio = (paginaAtual - 1) * porPagina;
  const clientesPagina = clientesFiltrados.slice(inicio, inicio + porPagina);

  useEffect(() => {
    let intervalo;

    async function carregarClientes() {
      setCarregando(true);
      setVerificandoWhatsApp(true);
      try {
        const res = await fetch('https://apidoixc.nexusnerds.com.br/data/ClientesBloquados.json');
        if (!res.ok) throw new Error(`Erro ao buscar clientes: ${res.status}`);
        const data = await res.json();

        const clientesComStatusInicial = data.map(cliente => ({
          ...cliente,
          status: 'Carregando...',
        }));
        setClientes(clientesComStatusInicial);

        await verificarStatusMaxFibra();

        // Processar números de telefone_celular e telefone_comercial
        const numerosSet = new Set();
        data.forEach(c => {
          [c.telefone_celular, c.telefone_comercial].filter(Boolean).forEach(numero => {
            const numeroLimpo = numero?.replace(/\D/g, '');
            // Lista de DDDs válidos no Brasil (pode ser expandida)
            const dddsValidos = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'];
            if (numeroLimpo && numeroLimpo.length === 11) {
              const ddd = numeroLimpo.slice(0, 2);
              if (dddsValidos.includes(ddd)) {
                const numeroCompleto = '55' + numeroLimpo;
                if (numeroCompleto.length === 13) {
                  numerosSet.add(numeroCompleto);
                } else {
                  console.warn(`⚠️ Número rejeitado (tamanho inválido após adicionar 55): ${numero} -> ${numeroCompleto}`);
                }
              } else {
                console.warn(`⚠️ Número rejeitado (DDD inválido): ${numero} -> DDD ${ddd}`);
              }
            } else {
              console.warn(`⚠️ Número rejeitado (tamanho inválido): ${numero} -> ${numeroLimpo}`);
            }
          });
        });

        const numeros = Array.from(numerosSet);
        if (numeros.length === 0) {
          console.warn('⚠️ Nenhum número válido para verificar WhatsApp.');
          setWhatsappStatus({});
          setVerificandoWhatsApp(false);
          return;
        }

        // Dividir números em lotes de 25
        const loteTamanho = 25;
        const lotes = [];
        for (let i = 0; i < numeros.length; i += loteTamanho) {
          lotes.push(numeros.slice(i, i + loteTamanho));
        }

        const statusMap = {};
        for (const lote of lotes) {
          const options = {
            method: 'POST',
            headers: {
              apikey: 'bc2aff5752f5fbb0d492fff2599afb57',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ numbers: lote }),
          };

          console.log('📤 Enviando lote para API WhatsAppNumbers:', JSON.stringify({ numbers: lote }, null, 2));

          const resp = await fetch('https://api.nexusnerds.com.br/chat/whatsappNumbers/ServicoAPI', options);
          if (!resp.ok) {
            const errorData = await resp.json().catch(() => ({}));
            console.error('❌ Erro na API WhatsApp para lote:', resp.status, errorData);
            throw new Error(`Erro na API WhatsApp: ${resp.status} - ${JSON.stringify(errorData)}`);
          }
          const resultado = await resp.json();

          console.log('🔍 Resposta da API WhatsAppNumbers para lote:', JSON.stringify(resultado, null, 2));

          if (Array.isArray(resultado)) {
            resultado.forEach(item => {
              if (item.number && typeof item.exists === 'boolean') {
                statusMap[item.number] = item.exists;
              }
            });
          } else {
            console.warn('❗️ Formato inesperado da resposta da API para lote:', resultado);
            lote.forEach(num => {
              statusMap[num] = false;
            });
          }
        }

        setWhatsappStatus(statusMap);
      } catch (err) {
        console.error('❌ Erro ao buscar dados:', err);
        const statusMap = {};
        clientes.forEach(c => {
          [c.telefone_celular, c.telefone_comercial].filter(Boolean).forEach(numero => {
            const numeroLimpo = numero?.replace(/\D/g, '');
            if (numeroLimpo && numeroLimpo.length === 11) {
              statusMap['55' + numeroLimpo] = false;
            }
          });
        });
        setWhatsappStatus(statusMap);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível verificar o status do WhatsApp. Verifique os números e tente novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setCarregando(false);
        setVerificandoWhatsApp(false);
      }
    }

    carregarClientes();
    intervalo = setInterval(carregarClientes, 60000); // Aumentado para 60 segundos

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    async function carregarMensagemPadrao() {
      try {
        const res = await apiGet('/api/v2/tables/mm2wytmovgp5cm6/records');
        const mensagem = res?.list?.[0]?.MAX_FIBRA?.mensagem;
        if (mensagem) setMensagemConfig(mensagem);
      } catch (err) {
        console.error('Erro ao buscar mensagem padrão do NocoDB', err);
      }
    }

    carregarMensagemPadrao();
  }, []);

  const copiarNumero = (numero) => {
    navigator.clipboard.writeText(numero);
    toast({
      title: 'Número copiado!',
      description: numero,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const [mensagemConfig, setMensagemConfig] = useState('Olá {nome}, sua fatura está em aberto.');

  const aplicarVariaveis = (template, cliente) => {
    return template
      .replace(/{nome}/g, cliente.razao)
      .replace(/{endereco}/g, cliente.endereco)
      .replace(/{telefone}/g, cliente.telefone_celular);
  };

  const chamarWhatsApp = (numero, cliente) => {
    const tel = numero.replace(/\D/g, '');
    const mensagemFinal = aplicarVariaveis(mensagemConfig, cliente);
    const link = `https://wa.me/55${tel}?text=${encodeURIComponent(mensagemFinal)}`;
    window.open(link, '_blank');
  };

  const verificarStatusMaxFibra = async () => {
    const dataCorrigida = new Date().toISOString().split('T')[0];

    const urlMaxFibra = 'https://nocodb.nexusnerds.com.br/api/v2/tables/mgmwultlj1hbo4u/records';

    try {
      const maxFibraResponse = await fetch(urlMaxFibra, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': import.meta.env.VITE_NOCODB_TOKEN,
        },
      });

      const maxFibraData = await maxFibraResponse.json();
      console.log('Resposta da API MAX FIBRA:', maxFibraData);

      if (maxFibraData && maxFibraData.list && maxFibraData.list.length > 0) {
        maxFibraData.list.forEach(record => {
          const dataRegistro = record.Data;

          if (dataRegistro === dataCorrigida) {
            const logMaxFibra = record['[LOG]-[MAX_FIBRA]'];

            if (logMaxFibra && Array.isArray(logMaxFibra)) {
              logMaxFibra.forEach(log => {
                const status = log.status;
                const cliente = log.cliente;
                const numero = log.numero;

                if (cliente && numero) {
                  setClientes(prevClientes => {
                    return prevClientes.map(clienteItem => {
                      if (clienteItem.telefone_celular === numero) {
                        setTimeout(() => {
                          setClientes(prev => prev.map(item => {
                            if (item.telefone_celular === numero) {
                              return { ...item, status: status || 'Cobrança Pendente' };
                            }
                            return item;
                          }));
                        }, 3000);
                        return clienteItem;
                      }
                      return clienteItem;
                    });
                  });

                  if (status === 'Enviada') {
                    console.log(`Cobrança para ${cliente} foi enviada com sucesso.`);
                  } else {
                    console.log(`Cobrança para ${cliente} falhou ou está pendente.`);
                  }
                }
              });
            }
          }
        });
      } else {
        console.log('Nenhum registro encontrado para a data de cobrança.');
      }
    } catch (error) {
      console.error('Erro ao verificar status da cobrança na tabela MAX FIBRA:', error);
    }
  };

  return (
    <>
      <Text fontSize="md" mb={4}>
        Total de bloqueados: <b>{clientesFiltrados.length}</b>
      </Text>

      <HStack spacing={6} mb={6} align="center" flexWrap="wrap">
        <Input
          placeholder="🔍 Buscar por nome..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPaginaAtual(1);
          }}
          maxW="400px"
          bg={useColorModeValue('white', 'gray.700')}
          borderRadius="md"
          boxShadow="sm"
          _focus={{
            borderColor: 'teal.400',
            boxShadow: '0 0 0 1px teal.400',
          }}
        />

        <HStack spacing={4} align="center" flexWrap="wrap">
          <CobrancaAutomatica clientes={clientes} whatsappStatus={whatsappStatus} />
          {/* <DownloadXLSX dados={clientes} nomeEmpresa="Max Fibra" /> */}
        </HStack>
      </HStack>

      {carregando ? (
        <Spinner size="xl" />
      ) : (
        <>
          <VStack spacing={4} align="stretch">
            {clientesPagina.map((cliente, idx) => {
              return (
                <Box
                  key={idx}
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  shadow="sm"
                  bg={bgCard}
                  position="relative"
                >
                  <Text fontWeight="bold" color={corTexto}>{cliente.razao}</Text>
                  <Text color={corTexto}>{cliente.endereco}</Text>

                  <Tag
                    colorScheme={cliente.status === 'Enviada' ? 'green' : cliente.status === 'Carregando...' ? 'blue' : 'red'}
                    position="absolute"
                    top="8px"
                    right="8px"
                  >
                    {cliente.status === 'Carregando...' ? (
                      <Spinner size="sm" />
                    ) : cliente.status === 'Enviada' ? (
                      <CheckCircleIcon />
                    ) : (
                      <WarningIcon />
                    )}
                    {cliente.status === 'Carregando...' ? 'Carregando...' : cliente.status === 'Enviada' ? 'Cobrança Enviada' : 'Cobrança Pendente'}
                  </Tag>

                  <VStack align="start" spacing={2} mt={2}>
                    {[cliente.telefone_celular, cliente.telefone_comercial]
                      .filter(Boolean)
                      .map((numero, i) => {
                        const telLimpo = numero.replace(/\D/g, '');
                        const numeroFormatado = `55${telLimpo}`;
                        const temWhats = whatsappStatus[numeroFormatado] === true;

                        return (
                          <HStack key={i}>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={() => copiarNumero(numero)}
                              leftIcon={<CopyIcon />}
                            >
                              {numero}
                            </Button>

                            {verificandoWhatsApp ? (
                              <Tag size="lg" colorScheme="blue">
                                <Spinner size="sm" mr={1} /> Verificando WhatsApp...
                              </Tag>
                            ) : temWhats ? (
                              <Button
                                size="sm"
                                colorScheme="green"
                                onClick={() => chamarWhatsApp(numero, cliente)}
                                leftIcon={<FontAwesomeIcon icon={faWhatsapp} />}
                              >
                                WhatsApp
                              </Button>
                            ) : (
                              <Tag size="lg" colorScheme="red">
                                <WarningIcon mr={1} /> Sem WhatsApp
                              </Tag>
                            )}
                          </HStack>
                        );
                      })}
                  </VStack>
                </Box>
              );
            })}
          </VStack>

          {totalPaginas > 1 && (
            <HStack justify="center" mt={8} spacing={4} flexWrap="wrap">
              <IconButton
                icon={<ArrowLeftIcon />}
                onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                isDisabled={paginaAtual === 1}
                aria-label="Página anterior"
              />
              <Text fontSize={{ base: 'sm', md: 'md' }}>
                Página <b>{paginaAtual}</b> de <b>{totalPaginas}</b>
              </Text>
              <IconButton
                icon={<ArrowRightIcon />}
                onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                isDisabled={paginaAtual === totalPaginas}
                aria-label="Próxima página"
              />
            </HStack>
          )}
        </>
      )}
    </>
  );
}