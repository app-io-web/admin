import { useEffect, useState, useRef } from 'react';
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
import CobrancaAutomaticaVIR from '../cobranca/CobrancaAutomaticaVIR';
// import DownloadXLSX from '../Download/DownloadXLSX';

const NOCODB_URL = import.meta.env.VITE_NOCODB_URL;
const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function ListaClientesBloqueadosVir() {
  const [clientes, setClientes] = useState([]);
  const [whatsappStatus, setWhatsappStatus] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mensagemConfig, setMensagemConfig] = useState('Olá {nome}, sua fatura está em aberto.');
  const [instanciaName, setInstanciaName] = useState('ServicoAPI');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [verificandoWhatsApp, setVerificandoWhatsApp] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [totalEtapas, setTotalEtapas] = useState(0);
  const [mensagensEnviadas, setMensagensEnviadas] = useState(0);

  const porPagina = 4;
  const batchSize = 10;
  const delayBetweenBatches = 5000;
  const toast = useToast();
  const bgCard = useColorModeValue('gray.50', 'gray.800');
  const corTexto = useColorModeValue('gray.800', 'gray.100');
  const intervaloRef = useRef(null);

  const clientesFiltrados = clientes.filter(c =>
    c.RAZAO_SOCIAL?.toLowerCase().includes(busca.toLowerCase())
  );
  const totalPaginas = Math.ceil(clientesFiltrados.length / porPagina);
  const inicio = (paginaAtual - 1) * porPagina;
  const clientesPagina = clientesFiltrados.slice(inicio, inicio + porPagina);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const getClickCount = () => {
    const storedData = localStorage.getItem('forceVerificationClicksVir');
    const today = new Date().toISOString().split('T')[0];
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData.date === today) {
        return parsedData.clicks;
      } else {
        localStorage.setItem('forceVerificationClicksVir', JSON.stringify({ date: today, clicks: 0 }));
        return 0;
      }
    } else {
      localStorage.setItem('forceVerificationClicksVir', JSON.stringify({ date: today, clicks: 0 }));
      return 0;
    }
  };

  const updateClickCount = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentCount = getClickCount() + 1;
    localStorage.setItem('forceVerificationClicksVir', JSON.stringify({ date: today, clicks: currentCount }));
    setClickCount(currentCount);
  };

  const verifyApiAndInstance = async (instanciaName) => {
    try {
      const instanceRes = await fetch(`${NOCODB_URL}/api/v2/tables/m5i535h8qe8mn8k/records`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_TOKEN,
        },
      });
      if (!instanceRes.ok) {
        console.error('❌ Instância inválida:', instanceRes.status);
        return false;
      }
      const instanceData = await instanceRes.json();
      if (!instanceData?.list?.length || !instanceData.list[0].instancia_name) {
        console.error('❌ Nenhum valor de instancia_name encontrado.');
        return false;
      }

      const testNumber = ['5511999999999'];
      const options = {
        method: 'POST',
        headers: {
          apikey: import.meta.env.VITE_API_KEY || 'bc2aff5752f5fbb0d492fff2599afb57',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numbers: testNumber }),
      };
      const apiRes = await fetch(`https://api.nexusnerds.com.br/chat/whatsappNumbers/${instanciaName}`, options);
      if (!apiRes.ok) {
        console.error('❌ API inválida:', apiRes.status);
        return false;
      }
      return true;
    } catch (err) {
      console.error('❌ Erro ao verificar API ou instância:', err);
      return false;
    }
  };

  const registrosPorDataCache = {};

  async function salvarLogNocoDB(dataAtual, cliente, numero, status, wppStatus = null, mensagensEnviadas = 0, registros) {
    try {
      const tableId = 'mji4m0uym8axwya';
      const baseUrl = `${NOCODB_URL}/api/v2/tables`;
      const url = `${baseUrl}/${tableId}/records`;

      let registroExistente = registros.find(r => r.Data === dataAtual);
      const logEntry = {
        cliente: cliente.RAZAO_SOCIAL || 'Desconhecido',
        numero: numero,
        status: status, // Status de cobrança
      };
      const wppEntry = wppStatus
        ? {
            cliente: cliente.RAZAO_SOCIAL || 'Desconhecido',
            numero: numero,
            status: wppStatus, // Status do WhatsApp
          }
        : null;

      if (registroExistente) {
        const logVirTelecom = registroExistente['[LOG]-[VIR_TELECOM]'] || [];
        const temWpp = registroExistente['[TEM WPP] - VERIFICAÇÃO'] || [];
        const existingLogIndex = logVirTelecom.findIndex(entry => entry.numero === numero);
        const existingWppIndex = temWpp.findIndex(entry => entry.numero === numero);

        if (existingLogIndex >= 0) {
          logVirTelecom[existingLogIndex] = logEntry;
        } else {
          logVirTelecom.push(logEntry);
        }
        if (wppStatus && existingWppIndex >= 0) {
          temWpp[existingWppIndex] = wppEntry;
        } else if (wppStatus) {
          temWpp.push(wppEntry);
        }

        try {
          const patchResponse = await fetch(url, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'xc-token': NOCODB_TOKEN,
            },
            body: JSON.stringify({
              Id: registroExistente.Id,
              '[LOG]-[VIR_TELECOM]': logVirTelecom,
              '[TEM WPP] - VERIFICAÇÃO': temWpp,
              '[MENSAGENS ENVIADAS]': mensagensEnviadas,
            }),
          });
          if (!patchResponse.ok) {
            console.error(`❌ Erro ao atualizar log no NocoDB: Status ${patchResponse.status}, Resposta: ${await patchResponse.text()}`);
          } else {
            console.log(`✅ Log de ${numero} atualizado no NocoDB. Mensagens enviadas: ${mensagensEnviadas}`);
            registroExistente['[LOG]-[VIR_TELECOM]'] = logVirTelecom;
            registroExistente['[TEM WPP] - VERIFICAÇÃO'] = temWpp;
            registroExistente['[MENSAGENS ENVIADAS]'] = mensagensEnviadas;
          }
        } catch (err) {
          console.error(`❌ Erro ao atualizar log de ${numero} no NocoDB:`, err);
        }
      } else {
        const payload = {
          Data: dataAtual,
          '[LOG]-[VIR_TELECOM]': [logEntry],
          '[TEM WPP] - VERIFICAÇÃO': wppStatus ? [wppEntry] : [],
          '[MENSAGENS ENVIADAS]': mensagensEnviadas,
        };

        try {
          const postResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xc-token': NOCODB_TOKEN,
            },
            body: JSON.stringify(payload),
          });
          if (!postResponse.ok) {
            console.error(`❌ Erro ao salvar log no NocoDB: Status ${postResponse.status}, Resposta: ${await postResponse.text()}`);
          } else {
            console.log(`✅ Log de ${numero} salvo no NocoDB. Mensagens enviadas: ${mensagensEnviadas}`);
            const newRecord = await postResponse.json();
            registros.push({
              Id: newRecord.Id,
              Data: dataAtual,
              '[LOG]-[VIR_TELECOM]': [logEntry],
              '[TEM WPP] - VERIFICAÇÃO': wppStatus ? [wppEntry] : [],
              '[MENSAGENS ENVIADAS]': mensagensEnviadas,
            });
            registrosPorDataCache[dataAtual] = newRecord.Id;
          }
        } catch (err) {
          console.error(`❌ Erro ao salvar log de ${numero} no NocoDB:`, err);
        }
      }
    } catch (err) {
      console.error(`❌ Erro ao salvar log no NocoDB:`, err);
    }
  }

  const processarLote = async (lote, instanciaName, dataAtual, clientesMap, registros) => {
    const statusMap = {};
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const options = {
        method: 'POST',
        headers: {
          apikey: import.meta.env.VITE_API_KEY || 'bc2aff5752f5fbb0d492fff2599afb57',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numbers: lote }),
        signal: controller.signal,
      };

      const resp = await fetch(`https://api.nexusnerds.com.br/chat/whatsappNumbers/${instanciaName}`, options);
      clearTimeout(timeoutId);

      if (!resp.ok) {
        console.warn(`⚠️ Falha ao verificar lote: Status ${resp.status}, Resposta: ${await resp.text()}`);
        lote.forEach(numero => {
          const cliente = clientesMap[numero] || 'Desconhecido';
          statusMap[numero] = 'Erro API...';
          salvarLogNocoDB(dataAtual, { RAZAO_SOCIAL: cliente }, numero, 'Cobrança Pendente', 'Erro API...', mensagensEnviadas, registros);
        });
        return statusMap;
      }

      const resultado = await resp.json();
      console.log(`🔍 Resposta da API para lote:`, resultado);

      if (Array.isArray(resultado)) {
        for (const item of resultado) {
          if (item.number && typeof item.exists === 'boolean') {
            const cliente = clientesMap[item.number] || 'Desconhecido';
            statusMap[item.number] = item.exists ? 'Tem WhatsApp' : 'Sem WhatsApp';
            await salvarLogNocoDB(dataAtual, { RAZAO_SOCIAL: cliente }, item.number, 'Cobrança Pendente', statusMap[item.number], mensagensEnviadas, registros);
          } else {
            const cliente = clientesMap[item.number] || 'Desconhecido';
            statusMap[item.number] = 'Erro API...';
            await salvarLogNocoDB(dataAtual, { RAZAO_SOCIAL: cliente }, item.number, 'Cobrança Pendente', 'Erro API...', mensagensEnviadas, registros);
          }
        }
      } else {
        console.warn(`❗️ Formato inesperado da resposta da API:`, resultado);
        lote.forEach(numero => {
          const cliente = clientesMap[numero] || 'Desconhecido';
          statusMap[numero] = 'Erro API...';
          salvarLogNocoDB(dataAtual, { RAZAO_SOCIAL: cliente }, numero, 'Cobrança Pendente', 'Erro API...', mensagensEnviadas, registros);
        });
      }
    } catch (err) {
      console.warn(`⚠️ Erro ao verificar lote:`, err);
      lote.forEach(numero => {
        const cliente = clientesMap[numero] || 'Desconhecido';
        statusMap[numero] = 'Erro API...';
        salvarLogNocoDB(dataAtual, { RAZAO_SOCIAL: cliente }, numero, 'Cobrança Pendente', 'Erro API...', mensagensEnviadas, registros);
      });
    }
    return statusMap;
  };

  const verificarStatusNocoDB = async (numeros, dataAtual, instanciaName, force = false) => {
    let statusMap = {};
    const numerosParaVerificar = [];
    const url = `${NOCODB_URL}/api/v2/tables/mji4m0uym8axwya/records`;

    const clientesMap = {};
    clientes.forEach(cliente => {
      const numero = `55${(cliente.telefone || '').replace(/\D/g, '')}`;
      if (numero) clientesMap[numero] = cliente.RAZAO_SOCIAL;
    });

    let registros = [];
    try {
      console.log('📡 Consultando TODOS os status no NocoDB...');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_TOKEN,
        },
      });

      if (!response.ok) throw new Error(`Erro ao consultar NocoDB: ${response.status}`);
      const data = await response.json();
      registros = data?.list || [];

      // Carregar mensagens enviadas do registro do dia atual
      const registroAtual = registros.find(r => r.Data === dataAtual);
      if (registroAtual && registroAtual['[MENSAGENS ENVIADAS]'] !== undefined) {
        setMensagensEnviadas(registroAtual['[MENSAGENS ENVIADAS]']);
      }

      registros.forEach(record => {
        const temWpp = record['[TEM WPP] - VERIFICAÇÃO'];
        if (temWpp && Array.isArray(temWpp)) {
          temWpp.forEach(status => {
            if (status.numero && status.status) {
              if (!(status.numero in statusMap)) {
                statusMap[status.numero] = status.status;
                console.log(`✅ Status encontrado para ${status.numero}: ${status.status}`);
              }
            }
          });
        }
      });

      numeros.forEach(num => {
        if (force) {
          numerosParaVerificar.push(num);
        } else if (!(num in statusMap)) {
          numerosParaVerificar.push(num);
        } else if (statusMap[num] === 'Erro API...') {
          numerosParaVerificar.push(num);
        }
      });

      if (numerosParaVerificar.length > 0) {
        setVerificandoWhatsApp(true);
        const lotes = [];
        for (let i = 0; i < numerosParaVerificar.length; i += batchSize) {
          lotes.push(numerosParaVerificar.slice(i, i + batchSize));
        }
        setTotalEtapas(lotes.length);

        for (let i = 0; i < lotes.length; i++) {
          setEtapaAtual(i + 1);
          const loteStatus = await processarLote(lotes[i], instanciaName, dataAtual, clientesMap, registros);
          statusMap = { ...statusMap, ...loteStatus };
          setWhatsappStatus(prev => ({ ...prev, ...loteStatus }));

          if (i < lotes.length - 1) {
            await delay(delayBetweenBatches);
          }
        }
      } else {
        console.log('✅ Todos os números já foram verificados anteriormente ou não requerem verificação.');
      }

      return statusMap;
    } catch (err) {
      console.error('❌ Erro ao verificar status no NocoDB:', err);
      return statusMap;
    } finally {
      setVerificandoWhatsApp(false);
      setEtapaAtual(0);
      setTotalEtapas(0);
    }
  };

  const verificarStatusVirTelecom = async () => {
    const dataAtual = new Date().toISOString().split('T')[0];
    const url = `${NOCODB_URL}/api/v2/tables/mji4m0uym8axwya/records`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_TOKEN,
        },
      });

      if (!response.ok) throw new Error(`Erro ao consultar NocoDB: ${response.status}`);
      const data = await response.json();
      const registros = data?.list || [];

      if (registros.length === 0) {
        console.log('⚠️ Nenhum registro encontrado. Nenhum status atualizado.');
        return;
      }

      registros.forEach(record => {
        const logVirTelecom = record['[LOG]-[VIR_TELECOM]'] || [];
        if (logVirTelecom && Array.isArray(logVirTelecom)) {
          logVirTelecom.forEach(log => {
            const status = log.status;
            const clienteNome = log.cliente;
            const numero = log.numero;

            if (clienteNome && numero) {
              setClientes(prevClientes => {
                return prevClientes.map(clienteItem => {
                  const numeroCliente = `55${(clienteItem.telefone || '').replace(/\D/g, '')}`;
                  if (numeroCliente === numero) {
                    return { ...clienteItem, status: status || 'Cobrança Pendente' };
                  }
                  return clienteItem;
                });
              });
              console.log(`✅ Atualizando ${clienteNome} para status: ${status}`);
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Erro ao verificar status de cobrança no NocoDB:', error);
    }
  };

  const handleMessageSent = () => {
    setMensagensEnviadas(prev => {
      const newCount = prev + 1;
      // Salvar o novo contador no NocoDB
      const dataAtual = new Date().toISOString().split('T')[0];
      const url = `${NOCODB_URL}/api/v2/tables/mji4m0uym8axwya/records`;
      fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_TOKEN,
        },
      })
        .then(response => response.json())
        .then(data => {
          const registros = data?.list || [];
          const registroAtual = registros.find(r => r.Data === dataAtual);
          if (registroAtual) {
            fetch(url, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'xc-token': NOCODB_TOKEN,
              },
              body: JSON.stringify({
                Id: registroAtual.Id,
                '[MENSAGENS ENVIADAS]': newCount,
              }),
            })
              .then(response => {
                if (!response.ok) {
                  console.error(`❌ Erro ao atualizar mensagens enviadas: ${response.status}`);
                } else {
                  console.log(`✅ Mensagens enviadas atualizadas: ${newCount}`);
                }
              });
          } else {
            fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'xc-token': NOCODB_TOKEN,
              },
              body: JSON.stringify({
                Data: dataAtual,
                '[MENSAGENS ENVIADAS]': newCount,
              }),
            })
              .then(response => {
                if (!response.ok) {
                  console.error(`❌ Erro ao criar registro de mensagens enviadas: ${response.status}`);
                } else {
                  console.log(`✅ Novo registro de mensagens enviadas criado: ${newCount}`);
                }
              });
          }
        })
        .catch(err => console.error('❌ Erro ao salvar mensagens enviadas:', err));
      return newCount;
    });
  };

  useEffect(() => {
    async function carregarClientes() {
      if (intervaloRef.current) {
        return;
      }

      setCarregando(true);
      try {
        const res = await fetch('https://apidoixc.nexusnerds.com.br/data/clientes_bloqueados_atualizado.json');
        if (!res.ok) throw new Error(`Erro ao buscar clientes: ${res.status}`);
        const data = await res.json();
        const clientesData = data.clientes || [];

        const clientesComStatusInicial = clientesData.map(cliente => ({
          ...cliente,
          status: 'Carregando...',
        }));
        setClientes(clientesComStatusInicial);

        let instanciaName = 'ServicoAPI';
        try {
          const instanceRes = await fetch(`${NOCODB_URL}/api/v2/tables/m5i535h8qe8mn8k/records`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'xc-token': NOCODB_TOKEN,
            },
          });
          if (instanceRes.ok) {
            const instanceData = await instanceRes.json();
            if (instanceData?.list?.length > 0 && instanceData.list[0].instancia_name) {
              instanciaName = instanceData.list[0].instancia_name;
            }
          }
        } catch (err) {
          console.error('❌ Erro ao buscar instancia_name:', err);
        }
        setInstanciaName(instanciaName);

        const isValid = await verifyApiAndInstance(instanciaName);
        setIsButtonEnabled(isValid);
        if (!isValid) {
          toast({
            title: 'Erro na API ou Instância',
            description: 'Não foi possível validar a API ou a instância. O botão de verificação foi desabilitado.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }

        const initialClickCount = getClickCount();
        setClickCount(initialClickCount);

        const dataAtual = new Date().toISOString().split('T')[0];
        const url = `${NOCODB_URL}/api/v2/tables/mji4m0uym8axwya/records`;
        let registros = [];
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'xc-token': NOCODB_TOKEN,
            },
          });
          const data = await response.json();
          registros = data?.list || [];

          // Carregar mensagens enviadas do registro do dia atual
          const registroAtual = registros.find(r => r.Data === dataAtual);
          if (registroAtual && registroAtual['[MENSAGENS ENVIADAS]'] !== undefined) {
            setMensagensEnviadas(registroAtual['[MENSAGENS ENVIADAS]']);
          }
        } catch (err) {
          console.error('❌ Erro ao carregar registros do NocoDB:', err);
        }

        for (const cliente of clientesComStatusInicial) {
          const numero = cliente.telefone;
          if (numero) {
            const numeroFormatado = `55${numero.replace(/\D/g, '')}`;
            await salvarLogNocoDB(dataAtual, cliente, numeroFormatado, cliente.status || 'Cobrança Pendente', null, mensagensEnviadas, registros);
          }
        }

        await verificarStatusVirTelecom();

        const numeros = clientesComStatusInicial
          .map(c => {
            const numeroLimpo = c.telefone?.replace(/\D/g, '');
            return numeroLimpo && numeroLimpo.length >= 10 && numeroLimpo.length <= 11
              ? `55${numeroLimpo}`
              : null;
          })
          .filter(Boolean);

        const statusMap = await verificarStatusNocoDB(numeros, dataAtual, instanciaName);
        setWhatsappStatus(statusMap);
      } catch (err) {
        console.error('❌ Erro ao carregar dados:', err);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os clientes ou status do WhatsApp.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setCarregando(false);
      }
    }

    carregarClientes();
    intervaloRef.current = setInterval(carregarClientes, 60000);

    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    async function carregarMensagemPadrao() {
      try {
        const res = await apiGet('/api/v2/tables/mm2wytmovgp5cm6/records');
        const mensagem = res?.list?.[0]?.VIR_TELECOM?.mensagem;
        if (mensagem) {
          setMensagemConfig(mensagem);
        }
      } catch (err) {
        console.error('❌ Erro ao buscar mensagem padrão do NocoDB:', err);
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

  const aplicarVariaveis = (template, cliente) => {
    return template
      .replace(/{nome}/g, cliente.RAZAO_SOCIAL || '')
      .replace(/{CPF_CNPJ}/g, cliente.CPF_CNPJ || '')
      .replace(/{telefone}/g, cliente.telefone || '');
  };

  const chamarWhatsApp = (numero, cliente) => {
    const tel = numero.replace(/\D/g, '');
    const mensagemFinal = aplicarVariaveis(mensagemConfig, cliente);
    const link = `https://wa.me/55${tel}?text=${encodeURIComponent(mensagemFinal)}`;
    window.open(link, '_blank');
  };

  const handleForceVerification = async () => {
    if (clickCount >= 2) {
      toast({
        title: 'Limite de cliques atingido',
        description: 'Você atingiu o limite de 2 verificações por dia. Tente novamente amanhã.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    updateClickCount();

    const numeros = clientes
      .map(c => {
        const numeroLimpo = c.telefone?.replace(/\D/g, '');
        return numeroLimpo && numeroLimpo.length >= 10 && numeroLimpo.length <= 11
          ? `55${numeroLimpo}`
          : null;
      })
      .filter(Boolean);

    const dataAtual = new Date().toISOString().split('T')[0];
    setVerificandoWhatsApp(true);
    const statusMap = await verificarStatusNocoDB(numeros, dataAtual, instanciaName, true);
    setWhatsappStatus(prev => ({ ...prev, ...statusMap }));
    toast({
      title: 'Verificação forçada iniciada',
      description: `Verificação ${clickCount + 1} de 2 realizadas hoje.`,
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <>
      <Text fontSize="md" mb={4}>
        Total de bloqueados: <b>{clientesFiltrados.length}</b>
      </Text>
      <Text fontSize="md" mb={4}>
        Mensagens enviadas: <b>{mensagensEnviadas}</b>
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
        <Button
          colorScheme="red"
          onClick={handleForceVerification}
          isLoading={carregando || verificandoWhatsApp}
          loadingText="Verificando..."
          isDisabled={!isButtonEnabled || clickCount >= 2 || carregando}
        >
          Forçar Verificação
        </Button>
        <HStack spacing={4} align="center" flexWrap="wrap">
          <CobrancaAutomaticaVIR
            clientes={clientes}
            whatsappStatus={whatsappStatus}
            onMessageSent={handleMessageSent}
          />
          {/* <DownloadXLSX dados={clientes} nomeEmpresa="Vir Telecom" /> */}
        </HStack>
      </HStack>

      {carregando ? (
        <Spinner size="xl" />
      ) : (
        <>
          {verificandoWhatsApp && (
            <Text fontSize="sm" color="gray.500" mb={4}>
              Verificando WhatsApp... (Etapa {etapaAtual} de {totalEtapas})
            </Text>
          )}

          <VStack spacing={4} align="stretch">
            {clientesPagina.map((cliente, idx) => {
              const celular = cliente.telefone;
              const telLimpo = celular?.replace(/\D/g, '');
              const numeroFormatado = `55${telLimpo}`;
              const temWhats = whatsappStatus[numeroFormatado] === 'Tem WhatsApp';

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
                  <Text fontWeight="bold" color={corTexto}>{cliente.RAZAO_SOCIAL || 'Sem Nome'}</Text>
                  <Text color={corTexto}>{cliente.CPF_CNPJ || 'Sem CPF/CNPJ'}</Text>

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
                    {celular && (
                      <HStack>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => copiarNumero(celular)}
                          leftIcon={<CopyIcon />}
                        >
                          {celular}
                        </Button>
                        {verificandoWhatsApp ? (
                          <Tag size="lg" colorScheme="blue">
                            <Spinner size="sm" mr={1} /> Verificando WhatsApp...
                          </Tag>
                        ) : temWhats ? (
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => chamarWhatsApp(celular, cliente)}
                            leftIcon={<FontAwesomeIcon icon={faWhatsapp} />}
                          >
                            WhatsApp
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            colorScheme="gray"
                            onClick={() => chamarWhatsApp(celular, cliente)}
                            leftIcon={<FontAwesomeIcon icon={faWhatsapp} />}
                          >
                            Tentar Chamar WhatsApp
                          </Button>
                        )}
                      </HStack>
                    )}
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