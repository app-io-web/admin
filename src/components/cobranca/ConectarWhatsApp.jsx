import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Button, Spinner, useToast,useDisclosure, HStack 
} from '@chakra-ui/react';

import {
    Input,
    Select,
    useColorModeValue,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter
  } from '@chakra-ui/react';


import {
    criarInstancia,
    conectarInstancia,
    buscarInstanciaStatus,
    verificarInstanciaEvolution,
    verificarOuRecriarInstancia,
    desconectarInstancia // 👈 ADICIONE ISSO AQUI
  } from '../../services/evolutionApiService';
  

const BASE_NOCODB = import.meta.env.VITE_NOCODB_URL;
const TOKEN_NOCODB = import.meta.env.VITE_NOCODB_TOKEN;


const ModalDesconectar = ({ isOpen, onClose, confirmarDesconexao }) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered>
    <ModalOverlay />
    <ModalContent bg={useColorModeValue('white', 'gray.800')}>
      <ModalHeader>Confirmar Desconexão</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text>
            Para desconectar o WhatsApp, por favor, abra o WhatsApp no seu celular, vá até "Configurações" &gt; "Dispositivos Conectados" e desconecte-se da sessão ativa.
        </Text>
        <Text mt={2} color="red.500">
            Após desconectar no celular, clique em "Confirmar" para finalizar.
        </Text>
      </ModalBody>

      <ModalFooter>
        <Button colorScheme="green" onClick={onClose}>
          Fechar
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);




export default function ConectarWhatsApp() {
    const [status, setStatus] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [jaRodou, setJaRodou] = useState(false);
    const toast = useToast();
  
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const empresa = localStorage.getItem('empresaSelecionada') || 'EMPRESA';
    const nomeUsuario = (usuario?.nome || 'usuario')
      .toLowerCase()
      .replace(/\s/g, '_');
    const instancia = `${nomeUsuario}_instancia`;
    const [numeroConectado, setNumeroConectado] = useState('');
    const [statusInfo, setStatusInfo] = useState({});
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [numeroTeste, setNumeroTeste] = useState('');
    const [enviarCboInterna, setEnviarCboInterna] = useState('nao');


        // Estados para controlar a abertura e fechamento dos modais
    const { isOpen: isOpenDesconectar, onOpen: onOpenDesconectar, onClose: onCloseDesconectar } = useDisclosure();
    const { isOpen: isOpenEnviarTeste, onOpen: onOpenEnviarTeste, onClose: onCloseEnviarTeste } = useDisclosure();


    useEffect(() => {
        const verificarStatus = async () => {
          console.log('🔍 useEffect RODOU');
          try {
            const statusAtualizado = await buscarInstanciaStatus(instancia);
            const dados = statusAtualizado?.instance;
            console.log('📡 STATUS BRUTO:', statusAtualizado);
      
            setStatusInfo(dados || {});
            setNumeroConectado(dados?.phone || '');
            const estado = dados?.status || dados?.state || 'Desconhecido';
            setStatus(estado);
      
            // se estiver conectado, limpa o QR
            if ((estado === 'open' || estado === 'connected') && dados?.owner) {
              setQrCode('');
              toast({
                id: 'connected-toast',
                title: '✅ Conectado!',
                description: 'WhatsApp conectado com sucesso.',
                status: 'success',
                duration: 4000,
                isClosable: true,
              });
              return;
            }
      
            // 🔁 se estiver em connecting, tenta pegar o QR
            if (estado === 'connecting') {
              console.log('🔄 Instância em connecting, tentando pegar QR com /connect...');
              const conectado = await conectarInstancia(instancia);
              const qr = conectado?.base64;
              if (qr?.startsWith('data:image')) {
                setQrCode(qr);
                setStatus('connecting');
              }
            }
      
          } catch (e) {
            console.error('❌ Erro ao verificar status inicial:', e);
          } finally {
            setCarregando(false);
          }
        };
      
        if (!jaRodou) {
          setJaRodou(true);
          verificarStatus();
        }
      }, [jaRodou]);

      useEffect(() => {
        if (!qrCode || estaConectado(statusInfo)) return;
      
        console.log('⏳ Iniciando verificação automática enquanto QR está ativo...');
      
        const intervalo = setInterval(async () => {
          try {
            const statusAtualizado = await buscarInstanciaStatus(instancia);
            const dados = statusAtualizado?.instance;
            const estado = dados?.state || dados?.status || '';
            const temOwner = !!dados?.owner;
      
            console.log('📡 Verificação automática: estado:', estado);
      
            if ((estado === 'open' || estado === 'connected') && temOwner) {
              setQrCode('');
              setStatus(estado);
              setStatusInfo(dados);
              setNumeroConectado(dados?.phone || '');
      
              toast({
                id: 'connected-toast',
                title: '✅ Conectado!',
                description: 'WhatsApp conectado com sucesso.',
                status: 'success',
                duration: 4000,
                isClosable: true,
              });
      
              clearInterval(intervalo);
            }
          } catch (e) {
            console.error('❌ Erro na verificação automática de conexão:', e);
          }
        }, 5000);
      
        return () => clearInterval(intervalo);
      }, [qrCode, statusInfo, instancia]);
      
      
      useEffect(() => {
        if (status?.toLowerCase() === 'close') {
          console.log('🔄 Status CLOSE detectado — forçando reconexão...');
          (async () => {
            try {
              await desconectarInstancia(instancia);
              await new Promise(resolve => setTimeout(resolve, 1000));
              const conectado = await conectarInstancia(instancia);
              const novoQr = conectado?.base64;
      
              if (novoQr?.startsWith('data:image')) {
                setQrCode(novoQr);
                setStatus('connecting');
                toast({
                  title: '📱 QR Code gerado!',
                  description: 'Escaneie para reconectar.',
                  status: 'info',
                  duration: 4000,
                  isClosable: true,
                });
              } else {
                toast({
                  title: '❌ Falha ao gerar novo QR',
                  description: 'A instância não retornou um QR válido.',
                  status: 'error',
                  duration: 4000,
                  isClosable: true,
                });
              }
            } catch (e) {
              console.error('Erro ao reconectar após CLOSE:', e);
            }
          })();
        }
      }, [status]);
      
      
      
      
      
      




  
      const salvarNoNocoDB = async () => {
        console.log('📝 Verificando se já existe no NocoDB...');
        const query = encodeURIComponent(`(Instance_Name,eq,${instancia})`);
        const checkRes = await fetch(
          `${BASE_NOCODB}/api/v2/tables/m3xqm7fsjhg6m3g/records?where=${query}&limit=1`,
          {
            headers: {
              'Content-Type': 'application/json',
              accept: 'application/json',
              'xc-token': TOKEN_NOCODB,
            },
          }
        );
        const checkData = await checkRes.json();
        const jaExiste = checkData?.list?.length > 0;
      
        if (!jaExiste) {
          console.log('✅ Não existe, salvando no NocoDB...');
          await fetch(`${BASE_NOCODB}/api/v2/tables/m3xqm7fsjhg6m3g/records`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              accept: 'application/json',
              'xc-token': TOKEN_NOCODB,
            },
            body: JSON.stringify({
                User: nomeUsuario,
                UnicID: empresa,
                Instance_Name: instancia,
                Enviar_CBO_Interna: enviarCboInterna === 'sim'
              }),
          });
          console.log('✅ Instância salva!');
        } else {
          console.log('⚠️ Já existe no banco, não salvando novamente.');
        }
      };
      

      useEffect(() => {
        const carregarCboInterna = async () => {
          try {
            const query = encodeURIComponent(`(Instance_Name,eq,${instancia})`);
            const res = await fetch(`${BASE_NOCODB}/api/v2/tables/m3xqm7fsjhg6m3g/records?where=${query}&limit=1`, {
              headers: {
                'Content-Type': 'application/json',
                accept: 'application/json',
                'xc-token': TOKEN_NOCODB,
              },
            });
            const data = await res.json();
            console.log("Resultado da busca da instância:", data)

            if (!data?.list?.length) {
                console.error("❌ Nenhum registro encontrado com a instância:", instancia);
                toast({
                  title: 'Erro',
                  description: 'Instância não encontrada no banco.',
                  status: 'error',
                  duration: 4000,
                  isClosable: true,
                });
                return; // ⛔ evita seguir com o PATCH
              }
              
      
            // força valor booleano
            const raw = data?.list?.[0]?.Enviar_CBO_Interna;
            const valorConvertido = raw === true || raw === 'true' ? 'sim' : 'nao';

            setEnviarCboInterna(valorConvertido);
          } catch (err) {
            console.error('Erro ao carregar valor inicial:', err);
          }
        };
      
        carregarCboInterna();
      }, []);
      
      

    const buscarOuCriar = async () => {
            setCarregando(true);
            console.log('🚀 Iniciando processo para buscar ou criar instância:', instancia);
        
            try {
            // Verifica no NocoDB
            const query = encodeURIComponent(`(Instance_Name,eq,${instancia})`);
            const res = await fetch(
                `${BASE_NOCODB}/api/v2/tables/m3xqm7fsjhg6m3g/records?where=${query}&limit=1`,
                {
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    'xc-token': TOKEN_NOCODB,
                },
                }
            );
            const dados = await res.json();
            const existeNoBanco = dados?.list?.length > 0;
        
            console.log('📦 Resultado do NocoDB:', dados);
        
            // Se não tem no NocoDB, segue o fluxo com a API
            if (!existeNoBanco) {
                console.log('🔍 Não existe no banco. Verificando na Evolution...');
        
                const acao = await verificarOuRecriarInstancia(instancia);
                console.log(`⚙️ Ação recomendada pela API: ${acao}`);
        
                if (acao === 'JA_CONECTADA') {
                toast({
                    title: '✅ Já conectado!',
                    description: 'A instância já está ativa e conectada.',
                    status: 'success',
                    duration: 4000,
                    isClosable: true,
                });
                setStatus('CONNECTED');
                setQrCode('');
                return;
                }
        
                if (acao === 'CRIAR_NOVA') {
                toast({
                    title: 'Instância não encontrada',
                    description: 'Criando nova instância...',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                });
                await criarInstancia(instancia);
                console.log('✅ Instância criada na Evolution');
                }
        
                await desconectarInstancia(instancia);
                await new Promise(resolve => setTimeout(resolve, 1500));
                const conectado = await conectarInstancia(instancia);
        
                console.log('📥 Retorno da conexão:', conectado);
                const qr = conectado?.base64;
        
                if (qr?.startsWith('data:image')) {
                // inicia verificação contínua de status
                let tentativas = 0;
                const intervalo = setInterval(async () => {
                    try {
                    const statusAtualizado = await buscarInstanciaStatus(instancia);
                    const novoStatus = statusAtualizado?.instance?.state;
                    const temOwner = !!statusAtualizado?.instance?.owner;
        
                    if (novoStatus === 'CONNECTED' || (novoStatus === 'open' && temOwner)) {
                        setStatus('CONNECTED');
                        clearInterval(intervalo);
                        toast({
                        title: '✅ Conectado!',
                        description: 'WhatsApp conectado com sucesso.',
                        status: 'success',
                        duration: 4000,
                        isClosable: true,
                        });
                    }
        
                    if (++tentativas > 24) {
                        console.warn('⏱️ Tempo limite atingido ao tentar conectar.');
                        clearInterval(intervalo);
                    }
                    } catch (e) {
                    console.error('❌ Erro ao verificar status:', e);
                    clearInterval(intervalo);
                    }
                }, 5000);
        
                setQrCode(qr);
                setStatus('qrcode');
                await salvarNoNocoDB();
        
                toast({
                    title: 'Instância criada!',
                    description: 'Escaneie o QR Code para conectar.',
                    status: 'success',
                    duration: 4000,
                    isClosable: true,
                });
                } else {
                console.warn('❌ QR inválido. Retorno foi:', conectado?.qrcode);
                toast({
                    title: 'QR Code inválido',
                    description: 'A instância foi criada, mas não retornou QR válido.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
                }
            } else {
                // Caso já esteja no banco, tenta buscar o status
                const statusAPI = await buscarInstanciaStatus(instancia);
                console.log('📡 Status da instância:', statusAPI);
                
                const state = statusAPI?.instance?.state;
                const temOwner = !!statusAPI?.instance?.owner;
                const qr = statusAPI?.qrcode?.base64;
                
                const normalizedState = (state || '').toLowerCase();
                setStatus(state || 'Desconhecido');
                setStatusInfo(statusAPI?.instance || {});
                setNumeroConectado(statusAPI?.instance?.phone || '');
                
                // ⚡ AJUSTE IMPORTANTE: já conectado? então não mexe!
                if (normalizedState === 'connected' || (normalizedState === 'open' && temOwner)) {
                  toast({
                    title: '✅ Já conectado!',
                    description: 'A instância está ativa e não precisa reconectar.',
                    status: 'success',
                    duration: 4000,
                    isClosable: true,
                  });
                  setQrCode('');
                  return;
                }
              
                if (qr?.startsWith('data:image')) {
                  setQrCode(qr);
                  setStatus('qrcode');
                } else if (state === 'connecting') {
                  console.log('⏳ Instância em processo de conexão, tentando buscar QR...');
                  const conectado = await conectarInstancia(instancia);
                  const novoQr = conectado?.base64;
              
                  if (novoQr?.startsWith('data:image')) {
                    setQrCode(novoQr);
                    setStatus('qrcode');
                    toast({
                      title: '📱 QR Code gerado!',
                      description: 'Escaneie para conectar.',
                      status: 'info',
                      duration: 4000,
                      isClosable: true,
                    });
                  } else {
                    toast({
                      title: 'QR Code ainda não disponível',
                      description: 'Instância em conexão. Aguarde e tente novamente.',
                      status: 'warning',
                      duration: 4000,
                      isClosable: true,
                    });
                  }
                } else {
                    // Se não tem QR code válido e não está conectado, então exibe toast
                    const isConectado = normalizedState === 'open' || (normalizedState === 'open' && temOwner);
                  
                    if (!isConectado) {
                      toast({
                        title: 'QR Code não disponível',
                        description: 'A instância não retornou imagem válida.',
                        status: 'warning',
                        duration: 4000,
                        isClosable: true,
                      });
                      setQrCode('');
                    }
                  }
                  
              }
            } catch (err) {
            console.error('🔥 ERRO:', err);
            toast({
                title: 'Erro',
                description: err.message || 'Erro ao conectar o WhatsApp',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            } finally {
            setCarregando(false);
            }
        };

        function estaConectado(dados) {
            const estado = (dados?.status || '').toLowerCase();
            return (estado === 'open' || estado === 'connected') && !!dados?.owner;
          }
          

        async function handleRecarregar() {
            setCarregando(true);
          
            try {
              console.log('🔄 Recarregando conexão...');
              await desconectarInstancia(instancia); // <-- força reset da sessão
              await new Promise(resolve => setTimeout(resolve, 1000)); // espera 1s
          
              const conectado = await conectarInstancia(instancia);
              const novoQr = conectado?.base64;
          
              if (novoQr?.startsWith('data:image')) {
                setQrCode(novoQr);
                setStatus('connecting');
                toast({
                  id: 'qr-toast',
                  title: '📱 Novo QR Code gerado!',
                  description: 'Escaneie novamente para conectar.',
                  status: 'info',
                  duration: 4000,
                  isClosable: true,
                });
              } else {
                toast({
                  title: '❌ QR Code inválido',
                  description: 'A instância não retornou QR válido.',
                  status: 'error',
                  duration: 4000,
                  isClosable: true,
                });
              }
          
              // Atualiza status depois
              const statusAtualizado = await buscarInstanciaStatus(instancia);
              const estado = statusAtualizado?.instance?.state || statusAtualizado?.instance?.status;
              const temOwner = !!statusAtualizado?.instance?.owner;
          
              setStatus(estado || '');
              setNumeroConectado(statusAtualizado?.instance?.phone || '');
              setStatusInfo(statusAtualizado?.instance || {});
          
              if (estado === 'CONNECTED' || (estado === 'open' && temOwner)) {
                setQrCode('');
                toast({
                  id: 'connected-toast',
                  title: '✅ Conectado!',
                  description: 'WhatsApp conectado com sucesso.',
                  status: 'success',
                  duration: 4000,
                  isClosable: true,
                });
              }
          
            } catch (err) {
              console.error('❌ Erro ao reconectar:', err);
              toast({
                title: 'Erro ao reconectar',
                description: err.message || 'Não foi possível gerar novo QR.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            } finally {
              setCarregando(false);
            }
          }
        

        // Função chamada ao clicar no botão "Testar Envio"
        const handleTestarEnvio = () => {
          onOpenEnviarTeste();
        };

        // Função chamada ao clicar em "Enviar" dentro do modal
        async function handleEnviarTeste() {
          console.log('Número Teste:', numeroTeste); // Verifique o valor de numeroTeste

          // Se o número for inválido (menos ou mais que 11 caracteres), mostramos um erro e não enviamos.
          if (!numeroTeste || numeroTeste.length !== 11) {
              toast({
                  title: 'Número inválido',
                  description: 'Digite um número com DDD para testar.',
                  status: 'warning',
                  duration: 4000,
                  isClosable: true,
              });
              return; // Impede o envio caso o número não seja válido
          }

          // Agora que o número foi validado, vamos tentar enviar a mensagem
          try {
              const res = await fetch(`https://api.nexusnerds.com.br/message/sendText/${instancia}`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      apikey: 'bc2aff5752f5fbb0d492fff2599afb57',
                  },
                  body: JSON.stringify({
                      number: `55${numeroTeste}`, // DDI + número
                      textMessage: {
                          text: 'TESTE DE ENVIO',
                      },
                  }),
              });

              const json = await res.json();
              console.log('📨 Retorno da API:', json);

              // Se a mensagem for enviada com sucesso, mostramos uma notificação de sucesso
              if (res.ok || json?.key) {
                  toast({
                      title: '✅ Mensagem enviada!',
                      description: `Mensagem enviada para ${numeroTeste}`,
                      status: 'success',
                      duration: 4000,
                      isClosable: true,
                  });
                  onCloseEnviarTeste(); // Fecha o modal após o envio de teste
                  setNumeroTeste(''); // Limpa o campo de número
              } else {
                  throw new Error(json?.response?.message || 'Erro inesperado');
              }
          } catch (err) {
              console.error('Erro no envio de teste:', err);
              toast({
                  title: 'Erro ao enviar',
                  description: err.message || 'Falha ao enviar mensagem',
                  status: 'error',
                  duration: 5000,
                  isClosable: true,
              });
          }
        }

      
          
          
          
          
        // Função de desconectar
        // Função chamada ao clicar no botão "Desconectar"
        const handleDesconectar = () => {
          onOpenDesconectar();  // Abre o modal de desconexão
      };

        // Função para confirmar desconexão
          // Função para confirmar desconexão (apenas fechar o modal sem desconectar)
          const confirmarDesconexao = () => {
            try {
              // Apenas fecha o modal
              onCloseDesconectar(); // Fecha o modal
            } catch (err) {
              console.error('❌ Erro ao fechar o modal:', err);
              toast({
                title: 'Erro ao fechar o modal',
                description: err.message || 'Ocorreu um erro ao fechar o modal.',
                status: 'error',
                duration: 4000,
                isClosable: true,
              });
            } finally {
              setCarregando(false);
            }
          };

      

  
  
      useEffect(() => {
        const verificarStatus = async () => {
          console.log('🔍 useEffect RODOU');
          try {
            const statusAtualizado = await buscarInstanciaStatus(instancia);
            const dados = statusAtualizado?.instance;
            console.log('📡 STATUS BRUTO:', statusAtualizado);
      
            // Atualiza os estados visuais
            setStatusInfo(dados || {});
            setNumeroConectado(dados?.phone || '');
            setStatus(dados?.status || 'Desconhecido');
      
            // Se já estiver conectado (estado OPEN), limpa QR e mostra conectado
            if (dados?.state === 'open') {
              setQrCode('');
              toast({
                id: 'connected-toast',
                title: '✅ Conectado!',
                description: 'WhatsApp conectado com sucesso.',
                status: 'success',
                duration: 4000,
                isClosable: true,
              });
            }
          } catch (e) {
            console.error('❌ Erro ao verificar status inicial:', e);
          } finally {
            setCarregando(false);
          }
        };
      
        if (!jaRodou) {
          setJaRodou(true);
          verificarStatus(); // ou `buscarOuCriar()` se quiser incluir a lógica de criação
        }
      }, [jaRodou]);





  
    return (
        <Box
          p={6}
          borderRadius="lg"
          boxShadow="md"
          bg="whiteAlpha.100"
          maxW="320px"
          w="100%"
          textAlign="center"
        >
          <Heading size="md" mb={3}>
            Conectar WhatsApp
          </Heading>

          <Modal isOpen={isOpenEnviarTeste} onClose={onCloseEnviarTeste} isCentered>
              <ModalOverlay />
              <ModalContent bg={useColorModeValue('white', 'gray.800')}>
                  <ModalHeader>Enviar mensagem de teste</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                      <Input
                          placeholder="Número com DDD (ex: 27999999999)"
                          value={numeroTeste} // Garante que o valor de numeroTeste seja usado
                          onChange={(e) => setNumeroTeste(e.target.value.replace(/\D/g, ''))} // Permite apenas números
                      />
                  </ModalBody>

                  <ModalFooter>
                      <Button colorScheme="teal" mr={3} onClick={handleEnviarTeste}>
                          Enviar
                      </Button>
                      <Button variant="ghost" onClick={onCloseEnviarTeste}>
                          Cancelar
                      </Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>





            


            

      
      
          {carregando ? (
            <Spinner size="lg" />
            ) : (
            <>
                {estaConectado(statusInfo) ? (
                <Box textAlign="center" mb={3}>
                    <Text color="green.300" fontWeight="bold" fontSize="lg">
                    ✅ Conectado com sucesso!
                    </Text>

                    {statusInfo?.profileName && (
                    <Text fontSize="sm" color="gray.300">
                        Nome do perfil: <b>{statusInfo.profileName}</b>
                    </Text>
                    )}

                    {statusInfo?.profileStatus?.status && (
                    <Text fontSize="xs" color="gray.500" fontStyle="italic">
                        Status: "{statusInfo.profileStatus.status}"
                    </Text>
                    )}

                    <Box mt={4} display="flex" flexDirection="column" alignItems="center">
                    <Text fontSize="sm" mb={1} color="gray.300">
                        Deseja enviar cobrança interna?
                    </Text>
                    <Select
                        value={enviarCboInterna}
                        onChange={(e) => {
                        const valorSelecionado = e.target.value;
                        const valorBooleano = valorSelecionado === 'sim';

                        // Atualiza estado local
                        setEnviarCboInterna(valorSelecionado);

                        // Dispara PATCH para NocoDB
                        (async () => {
                            try {
                            const query = encodeURIComponent(`(Instance_Name,eq,${instancia})`);
                            const res = await fetch(`${BASE_NOCODB}/api/v2/tables/m3xqm7fsjhg6m3g/records?where=${query}&limit=1`, {
                                headers: {
                                'Content-Type': 'application/json',
                                accept: 'application/json',
                                'xc-token': TOKEN_NOCODB,
                                },
                            });

                            const data = await res.json();
                            const record = data?.list?.[0];
                            const recordId = record?.Id;

                            if (!recordId) {
                                console.error('❌ Nenhum ID encontrado para atualização!');
                                return;
                            }

                            console.log('✅ PATCH payload:', {
                                Id: recordId,
                                Enviar_CBO_Interna: valorBooleano
                            });

                            const patchRes = await fetch(`${BASE_NOCODB}/api/v2/tables/m3xqm7fsjhg6m3g/records`, {
                                method: 'PATCH',
                                headers: {
                                'Content-Type': 'application/json',
                                accept: 'application/json',
                                'xc-token': TOKEN_NOCODB,
                                },
                                body: JSON.stringify([
                                {
                                    Id: recordId,
                                    Enviar_CBO_Interna: valorBooleano
                                }
                                ]),
                            });

                            if (patchRes.ok) {
                                toast({
                                title: 'Atualizado',
                                description: 'Cobrança interna atualizada com sucesso.',
                                status: 'success',
                                duration: 3000,
                                isClosable: true,
                                });
                            } else {
                                throw new Error('Erro ao salvar no banco');
                            }
                            } catch (err) {
                            console.error('Erro ao atualizar cobrança interna:', err);
                            toast({
                                title: 'Erro',
                                description: 'Falha ao atualizar cobrança interna.',
                                status: 'error',
                                duration: 4000,
                                isClosable: true,
                            });
                            }
                        })();
                        }}
                    >
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                    </Select>
                    </Box>





                    {statusInfo?.profilePictureUrl && (
                    <Box mt={4} display="flex" flexDirection="column" alignItems="center">
                        <Box
                        borderRadius="full"
                        overflow="hidden"
                        border="2px solid"
                        borderColor="green.300"
                        boxSize="64px"
                        >
                        <img
                            src={statusInfo.profilePictureUrl}
                            alt="Foto de perfil"
                            width="100%"
                            height="100%"
                            style={{ objectFit: 'cover' }}
                        />
                        </Box>
                        {numeroConectado && (
                        <Text fontSize="sm" color="gray.200" mt={2}>
                            📞 <b>{numeroConectado}</b>
                        </Text>
                        )}
                    </Box>
                    )}

                    <HStack spacing={3} justify="center" mt={4}>
                    <Button size="sm" colorScheme="red" onClick={handleDesconectar}>
                        Desconectar
                    </Button>
                    <Button size="sm" colorScheme="teal" mr={3} onClick={handleTestarEnvio}>
                        Testar Envio
                    </Button>
                    </HStack>
                </Box>
                ) : status === 'connecting' || qrCode ? (
                <img src={qrCode} alt="QR Code" style={{ margin: '0 auto 12px', maxWidth: '100%' }} />
                ) : (
                <Text color="gray.400" mb={3}>QR Code não disponível</Text>
                )}



                <Text mt={3}>
                Status:{' '}
                <b style={{
                    color: estaConectado(statusInfo) ? 'limegreen' :
                        status === 'qrcode' || status === 'connecting' ? 'orange' :
                        'gray'
                }}>
                    {estaConectado(statusInfo) ? 'CONNECTED' : status.toUpperCase()}
                </b>
                </Text>

                {!estaConectado(statusInfo) && (
                    <>
                        <Button mt={4} colorScheme="blue" onClick={handleRecarregar}>
                        Recarregar
                        </Button>
                        <Button mt={2} size="sm" variant="ghost" colorScheme="gray" onClick={buscarOuCriar}>
                        Forçar Reconexão
                        </Button>
                    </>
                )}

                

            </>
            )}

            
            <ModalDesconectar 
                isOpen={isOpenDesconectar}  // Certifique-se de que o estado correto está sendo passado
                onClose={onCloseDesconectar}  // Função para fechar o modal
                confirmarDesconexao={confirmarDesconexao}  // Função para confirmar desconexão
            />



        </Box>
      );
      
  }
