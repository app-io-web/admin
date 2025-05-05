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
import { apiGet, apiPost, apiPatch } from '../../services/api';
import CobrancaAutomatica from '../cobranca/CobrancaAutomatica';
import DownloadXLSX from '../Download/DownloadXLSX';

const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function ListaClientesBloqueados() {
  const [clientes, setClientes] = useState([]);
  const [whatsappStatus, setWhatsappStatus] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [verificandoWhatsApp, setVerificandoWhatsApp] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [totalEtapas, setTotalEtapas] = useState(0);
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [instanciaName, setInstanciaName] = useState('ServicoAPI');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [mensagensEnviadas, setMensagensEnviadas] = useState(0);

  const porPagina = 4;
  const batchSize = 10;
  const delayBetweenBatches = 5000;
  const toast = useToast();

  const bgCard = useColorModeValue('gray.50', 'gray.800');
  const corTexto = useColorModeValue('gray.800', 'gray.100');

  const clientesFiltrados = clientes.filter(c =>
    c.razao?.toLowerCase().includes(busca.toLowerCase())
  );
  const totalPaginas = Math.ceil(clientesFiltrados.length / porPagina);
  const inicio = (paginaAtual - 1) * porPagina;
  const clientesPagina = clientesFiltrados.slice(inicio, inicio + porPagina);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const getClickCount = () => {
    const storedData = localStorage.getItem('forceVerificationClicks');
    const today = new Date().toISOString().split('T')[0];

    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData.date === today) {
        return parsedData.clicks;
      } else {
        localStorage.setItem('forceVerificationClicks', JSON.stringify({ date: today, clicks: 0 }));
        return 0;
      }
    } else {
      localStorage.setItem('forceVerificationClicks', JSON.stringify({ date: today, clicks: 0 }));
      return 0;
    }
  };

  const updateClickCount = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentCount = getClickCount() + 1;
    localStorage.setItem('forceVerificationClicks', JSON.stringify({ date: today, clicks: currentCount }));
    setClickCount(currentCount);
  };

  const verifyApiAndInstance = async (instanciaName) => {
    try {
      const instanceRes = await fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m5i535h8qe8mn8k/records', {
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

      const testNumber = ['5527998168674'];
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

  const salvarStatusWhatsApp = async (dataAtual, clienteNome, numero, status, registros, urlMaxFibra) => {
    const statusEntry = {
      cliente: clienteNome,
      numero: numero,
      status: status,
    };

    let registroExistente = registros.find(r => r.Data === dataAtual);
    if (registroExistente) {
      const temWpp = registroExistente['[TEM WPP] - VERIFICAÇÃO'] || [];
      const existingEntryIndex = temWpp.findIndex(entry => entry.numero === numero);
      if (existingEntryIndex >= 0) {
        temWpp[existingEntryIndex] = statusEntry;

        try {
          const patchResponse = await fetch(urlMaxFibra, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'xc-token': NOCODB_TOKEN,
            },
            body: JSON.stringify({
              Id: registroExistente.Id,
              '[TEM WPP] - VERIFICAÇÃO': temWpp,
              '[MENSAGENS ENVIADAS]': mensagensEnviadas,
            }),
          });
          if (!patchResponse.ok) {
            console.error(`❌ Erro ao atualizar [TEM WPP] no NocoDB: Status ${patchResponse.status}, Resposta: ${await patchResponse.text()}`);
          } else {
            console.log(`✅ Status de ${numero} atualizado no NocoDB. Mensagens enviadas: ${mensagensEnviadas}`);
            registroExistente['[TEM WPP] - VERIFICAÇÃO'] = temWpp;
            registroExistente['[MENSAGENS ENVIADAS]'] = mensagensEnviadas;
          }
        } catch (err) {
          console.error(`❌ Erro ao atualizar status de ${numero} no NocoDB:`, err);
        }
      } else {
        temWpp.push(statusEntry);
        try {
          const patchResponse = await fetch(urlMaxFibra, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'xc-token': NOCODB_TOKEN,
            },
            body: JSON.stringify({
              Id: registroExistente.Id,
              '[TEM WPP] - VERIFICAÇÃO': temWpp,
              '[MENSAGENS ENVIADAS]': mensagensEnviadas,
            }),
          });
          if (!patchResponse.ok) {
            console.error(`❌ Erro ao atualizar [TEM WPP] no NocoDB: Status ${patchResponse.status}, Resposta: ${await patchResponse.text()}`);
          } else {
            console.log(`✅ Status de ${numero} atualizado no NocoDB. Mensagens enviadas: ${mensagensEnviadas}`);
            registroExistente['[TEM WPP] - VERIFICAÇÃO'] = temWpp;
            registroExistente['[MENSAGENS ENVIADAS]'] = mensagensEnviadas;
          }
        } catch (err) {
          console.error(`❌ Erro ao atualizar status de ${numero} no NocoDB:`, err);
        }
      }
    } else {
      try {
        const postResponse = await fetch(urlMaxFibra, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xc-token': NOCODB_TOKEN,
          },
          body: JSON.stringify({
            Data: dataAtual,
            '[TEM WPP] - VERIFICAÇÃO': [statusEntry],
            '[MENSAGENS ENVIADAS]': mensagensEnviadas,
          }),
        });
        if (!postResponse.ok) {
          console.error(`❌ Erro ao salvar [TEM WPP] no NocoDB: Status ${postResponse.status}, Resposta: ${await postResponse.text()}`);
        } else {
          console.log(`✅ Status de ${numero} salvo no NocoDB. Mensagens enviadas: ${mensagensEnviadas}`);
          const newRecord = await postResponse.json();
          registros.push({
            Id: newRecord.Id,
            Data: dataAtual,
            '[TEM WPP] - VERIFICAÇÃO': [statusEntry],
            '[MENSAGENS ENVIADAS]': mensagensEnviadas,
          });
        }
      } catch (err) {
        console.error(`❌ Erro ao salvar status de ${numero} no NocoDB:`, err);
      }
    }
  };

  const processarLote = async (lote, instanciaName, dataAtual, registros, urlMaxFibra, clientesMap) => {
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
        lote.forEach(num => {
          const cliente = clientesMap[num] || 'Desconhecido';
          statusMap[num] = 'Erro API...';
          salvarStatusWhatsApp(dataAtual, cliente, num, 'Erro API...', registros, urlMaxFibra);
        });
        throw new Error('API do WhatsApp não respondeu corretamente');
      }

      const resultado = await resp.json();
      console.log(`🔍 Resposta da API para lote:`, resultado);

      if (Array.isArray(resultado)) {
        for (const item of resultado) {
          if (item.number && typeof item.exists === 'boolean') {
            const cliente = clientesMap[item.number] || 'Desconhecido';
            statusMap[item.number] = item.exists ? 'Tem WhatsApp' : 'Sem WhatsApp';
            console.log(`✅ Status do número ${item.number}: ${item.exists ? 'Tem WhatsApp' : 'Sem WhatsApp'}`);
            await salvarStatusWhatsApp(dataAtual, cliente, item.number, item.exists ? 'Tem WhatsApp' : 'Sem WhatsApp', registros, urlMaxFibra);
          } else {
            console.log(`⚠️ Item inválido na resposta:`, item);
            const cliente = clientesMap[item.number] || 'Desconhecido';
            statusMap[item.number] = 'Erro API...';
            await salvarStatusWhatsApp(dataAtual, cliente, item.number, 'Erro API...', registros, urlMaxFibra);
          }
        }
      } else {
        console.warn(`❗️ Formato inesperado da resposta da API:`, resultado);
        lote.forEach(num => {
          const cliente = clientesMap[num] || 'Desconhecido';
          statusMap[num] = 'Erro API...';
          salvarStatusWhatsApp(dataAtual, cliente, num, 'Erro API...', registros, urlMaxFibra);
        });
      }
    } catch (err) {
      console.warn(`⚠️ Erro ao verificar lote:`, err);
      lote.forEach(num => {
        const cliente = clientesMap[num] || 'Desconhecido';
        statusMap[num] = 'Erro API...';
        salvarStatusWhatsApp(dataAtual, cliente, num, 'Erro API...', registros, urlMaxFibra);
      });
    }
    return statusMap;
  };

  const verificarStatusNocoDB = async (numeros, dataAtual, instanciaName, force = false) => {
    let statusMap = {};
    const numerosParaVerificar = [];
    const urlMaxFibra = 'https://nocodb.nexusnerds.com.br/api/v2/tables/mgmwultlj1hbo4u/records';

    const clientesMap = {};
    clientes.forEach(cliente => {
      const numero = `55${(cliente.telefone_celular || cliente.telefone_comercial || '').replace(/\D/g, '')}`;
      if (numero) clientesMap[numero] = cliente.razao;
    });

    let registros = [];
    try {
      console.log('📡 Consultando TODOS os status no NocoDB...');
      const response = await fetch(urlMaxFibra, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_TOKEN,
        },
      });

      if (!response.ok) throw new Error(`Erro ao consultar NocoDB: ${response.status}`);
      const data = await response.json();
      console.log('✅ Dados do NocoDB recebidos:', data);

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
      console.log('📋 Números que precisam de verificação:', numerosParaVerificar);

      if (numerosParaVerificar.length > 0) {
        setVerificandoWhatsApp(true);
        const lotes = [];
        for (let i = 0; i < numerosParaVerificar.length; i += batchSize) {
          lotes.push(numerosParaVerificar.slice(i, i + batchSize));
        }
        setTotalEtapas(lotes.length);
        console.log(`📊 Total de lotes a processar: ${lotes.length}`);

        for (let i = 0; i < lotes.length; i++) {
          setEtapaAtual(i + 1);
          console.log(`🚀 Processando lote ${i + 1} de ${lotes.length} (Números: ${lotes[i]}) com instância ${instanciaName}...`);

          const loteStatus = await processarLote(lotes[i], instanciaName, dataAtual, registros, urlMaxFibra, clientesMap);
          statusMap = { ...statusMap, ...loteStatus };
          setWhatsappStatus(prev => ({ ...prev, ...loteStatus }));

          if (i < lotes.length - 1) {
            console.log(`⏳ Aguardando ${delayBetweenBatches / 1000} segundos antes do próximo lote...`);
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

  const atualizarLogMaxFibra = async (dataAtual, cliente, numero, status, urlMaxFibra, registros) => {
    try {
      const statusEntry = {
        cliente: cliente.razao,
        numero: numero,
        status: status,
      };

      let registroExistente = registros.find(r => r.Data === dataAtual);
      if (registroExistente) {
        const logMaxFibra = registroExistente['[LOG]-[MAX_FIBRA]'] || [];
        if (!logMaxFibra.some(log => log.numero === numero && log.cliente === cliente.razao)) {
          logMaxFibra.push(statusEntry);
          try {
            const patchResponse = await fetch(urlMaxFibra, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'xc-token': NOCODB_TOKEN,
              },
              body: JSON.stringify({
                Id: registroExistente.Id,
                '[LOG]-[MAX_FIBRA]': logMaxFibra,
                '[MENSAGENS ENVIADAS]': mensagensEnviadas,
              }),
            });
            if (!patchResponse.ok) {
              console.error(`❌ Erro ao atualizar [LOG]-[MAX_FIBRA] no NocoDB: Status ${patchResponse.status}, Resposta: ${await patchResponse.text()}`);
            } else {
              console.log(`✅ Log de ${numero} atualizado no NocoDB. Mensagens enviadas: ${mensagensEnviadas}`);
              registroExistente['[LOG]-[MAX_FIBRA]'] = logMaxFibra;
              registroExistente['[MENSAGENS ENVIADAS]'] = mensagensEnviadas;
            }
          } catch (err) {
            console.error(`❌ Erro ao atualizar log de ${numero} no NocoDB:`, err);
          }
        }
      } else {
        try {
          const postResponse = await fetch(urlMaxFibra, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xc-token': NOCODB_TOKEN,
            },
            body: JSON.stringify({
              Data: dataAtual,
              '[LOG]-[MAX_FIBRA]': [statusEntry],
              '[MENSAGENS ENVIADAS]': mensagensEnviadas,
            }),
          });
          if (!postResponse.ok) {
            console.error(`❌ Erro ao salvar [LOG]-[MAX_FIBRA] no NocoDB: Status ${postResponse.status}, Resposta: ${await postResponse.text()}`);
          } else {
            console.log(`✅ Log de ${numero} salvo no NocoDB. Mensagens enviadas: ${mensagensEnviadas}`);
            const newRecord = await postResponse.json();
            registros.push({
              Id: newRecord.Id,
              Data: dataAtual,
              '[LOG]-[MAX_FIBRA]': [statusEntry],
              '[MENSAGENS ENVIADAS]': mensagensEnviadas,
            });
          }
        } catch (err) {
          console.error(`❌ Erro ao salvar log de ${numero} no NocoDB:`, err);
        }
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar log no NocoDB:', err);
    }
  };

  const handleMessageSent = () => {
    setMensagensEnviadas(prev => {
      const newCount = prev + 1;
      const dataAtual = new Date().toISOString().split('T')[0];
      const urlMaxFibra = 'https://nocodb.nexusnerds.com.br/api/v2/tables/mgmwultlj1hbo4u/records';

      fetch(urlMaxFibra, {
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
            fetch(urlMaxFibra, {
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
            fetch(urlMaxFibra, {
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
    let intervalo;

    async function carregarClientes() {
      console.log('📢 Iniciando carregarClientes...');
      setCarregando(true);
      setVerificandoWhatsApp(false);

      try {
        console.log('📡 Buscando lista de clientes bloqueados...');
        const res = await fetch('https://apidoixc.nexusnerds.com.br/data/ClientesBloquados.json');
        if (!res.ok) throw new Error(`Erro ao buscar clientes: ${res.status}`);
        const data = await res.json();
        console.log('✅ Dados dos clientes recebidos:', data);

        const clientesComStatusInicial = data.map(cliente => ({
          ...cliente,
          status: 'Carregando...',
        }));
        console.log('🔄 Clientes com status inicial:', clientesComStatusInicial);
        setClientes(clientesComStatusInicial);

        setCarregando(false);
        console.log('✅ Dados dos clientes exibidos na interface.');

        console.log('🔍 Verificando status na Max Fibra...');
        await verificarStatusMaxFibra();

        let instanciaName = 'ServicoAPI';
        try {
          console.log('📡 Buscando instancia_name na tabela [CONTROL - INSTANCE] - SYSTEM...');
          const instanceRes = await fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m5i535h8qe8mn8k/records', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'xc-token': NOCODB_TOKEN,
            },
          });

          if (!instanceRes.ok) {
            throw new Error(`Erro ao buscar instancia_name: ${instanceRes.status}`);
          }

          const instanceData = await instanceRes.json();
          console.log('✅ Dados de [CONTROL - INSTANCE] - SYSTEM recebidos:', instanceData);

          if (instanceData?.list?.length > 0 && instanceData.list[0].instancia_name) {
            instanciaName = instanceData.list[0].instancia_name;
            console.log(`✅ Instancia_name encontrado: ${instanciaName}`);
          } else {
            console.warn('⚠️ Nenhum valor de instancia_name encontrado. Usando valor padrão:', instanciaName);
          }
        } catch (err) {
          console.error('❌ Erro ao buscar instancia_name:', err);
          console.log(`⚠️ Usando valor padrão para instancia_name: ${instanciaName}`);
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

        const numeros = [...new Set(
          clientesComStatusInicial
            .flatMap(cliente => [cliente.telefone_celular, cliente.telefone_comercial])
            .filter(Boolean)
            .map(num => `55${num.replace(/\D/g, '')}`)
        )];
        console.log('📱 Números a verificar:', numeros);

        const dataAtual = new Date().toISOString().split('T')[0];
        const urlMaxFibra = 'https://nocodb.nexusnerds.com.br/api/v2/tables/mgmwultlj1hbo4u/records';

        let registros = [];
        try {
          const response = await fetch(urlMaxFibra, {
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
          const numero = cliente.telefone_celular || cliente.telefone_comercial;
          if (numero) {
            await atualizarLogMaxFibra(dataAtual, cliente, numero, cliente.status || 'Cobrança Pendente', urlMaxFibra, registros);
          }
        }

        const statusMap = await verificarStatusNocoDB(numeros, dataAtual, instanciaName);
        setWhatsappStatus(prev => ({ ...prev, ...statusMap }));
      } catch (err) {
        console.error('❌ Erro ao buscar dados dos clientes:', err);
        setClientes([]);
        setWhatsappStatus({});
        toast({
          title: 'Erro ao carregar clientes',
          description: 'Não foi possível carregar a lista de clientes. Tente novamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setCarregando(false);
      } finally {
        console.log('🏁 Finalizando carregarClientes.');
      }
    }

    carregarClientes();
    intervalo = setInterval(carregarClientes, 60000);

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
          'xc-token': NOCODB_TOKEN,
        },
      });
  
      const maxFibraData = await maxFibraResponse.json();
      const registros = maxFibraData?.list || [];
  
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
                      if (
                        clienteItem.telefone_celular === numero ||
                        clienteItem.telefone_comercial === numero
                      ) {
                        return { ...clienteItem, status: status || 'Cobrança Pendente' };
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
      }
    } catch (error) {
      console.error('Erro ao verificar status da cobrança na tabela MAX FIBRA:', error);
    }
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

    const numeros = [...new Set(
      clientes
        .flatMap(cliente => [cliente.telefone_celular, cliente.telefone_comercial])
        .filter(Boolean)
        .map(num => `55${num.replace(/\D/g, '')}`)
    )];
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
          isLoading={verificandoWhatsApp}
          loadingText="Verificando..."
          isDisabled={carregando || !isButtonEnabled || clickCount >= 2}
        >
          Forçar Verificação
        </Button>
        <HStack spacing={4} align="center" flexWrap="wrap">
          <CobrancaAutomatica
            clientes={clientes}
            whatsappStatus={whatsappStatus}
            onMessageSent={handleMessageSent}
          />
          {/* <DownloadXLSX dados={clientes} nomeEmpresa="Max Fibra" /> */}
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
                        const statusWhats = whatsappStatus[numeroFormatado];

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
                            ) : statusWhats === 'Tem WhatsApp' ? (
                              <Button
                                size="sm"
                                colorScheme="green"
                                onClick={() => chamarWhatsApp(numero, cliente)}
                                leftIcon={<FontAwesomeIcon icon={faWhatsapp} />}
                              >
                                WhatsApp
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                colorScheme="gray"
                                onClick={() => chamarWhatsApp(numero, cliente)}
                                leftIcon={<FontAwesomeIcon icon={faWhatsapp} />}
                              >
                                Tentar Chamar WhatsApp
                              </Button>
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