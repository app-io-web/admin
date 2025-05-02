import { useEffect, useState } from 'react'
import {
  Box, Text, VStack, HStack, Button, useToast, Tag, Spinner,
  Input, useColorModeValue, IconButton
} from '@chakra-ui/react'
import {
  CopyIcon, WarningIcon, ArrowLeftIcon, ArrowRightIcon
} from '@chakra-ui/icons'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'

import { apiGet } from '../../services/api'
import CobrancaAutomaticaVIR from '../cobranca/CobrancaAutomaticaVIR';
import DownloadXLSX from '../Download/DownloadXLSX';  // Importando o componente para download do XLSX





export default function ListaClientesBloqueadosVir() {
  const [clientes, setClientes] = useState([])
  const [whatsappStatus, setWhatsappStatus] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [mensagemConfig, setMensagemConfig] = useState('Olá {nome}, sua fatura está em aberto.')

  const porPagina = 4
  const toast = useToast()

  const bgCard = useColorModeValue('gray.50', 'gray.800')
  const corTexto = useColorModeValue('gray.800', 'gray.100')

  const clientesFiltrados = clientes.filter(c =>
    c.RAZAO_SOCIAL?.toLowerCase().includes(busca.toLowerCase())
  )
  const totalPaginas = Math.ceil(clientesFiltrados.length / porPagina)
  const inicio = (paginaAtual - 1) * porPagina
  const clientesPagina = clientesFiltrados.slice(inicio, inicio + porPagina)

  useEffect(() => {
    let intervalo

    async function carregarClientes() {
      try {
        const res = await fetch('https://apidoixc.nexusnerds.com.br/data/clientes_bloqueados_atualizado.json')
        const data = await res.json()
        setClientes(data.clientes || [])

        const numeros = (data.clientes || [])
          .map(c => {
            const numeroLimpo = c.telefone?.replace(/\D/g, '')
            if (numeroLimpo && numeroLimpo.length >= 10 && numeroLimpo.length <= 11) {
              return '55' + numeroLimpo
            }
            return null
          })
          .filter(Boolean)

        const options = {
          method: 'POST',
          headers: {
            apikey: 'bc2aff5752f5fbb0d492fff2599afb57',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ numbers: numeros })
        }

        const resp = await fetch('https://api.nexusnerds.com.br/chat/whatsappNumbers/ServicoAPI', options)
        const resultado = await resp.json()

        const statusMap = {}
        resultado.forEach(item => {
          statusMap[item.number] = item.exists
        })

        setWhatsappStatus(statusMap)
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os clientes ou status do WhatsApp.',
          status: 'error',
          duration: 5000,
          isClosable: true
        })
      } finally {
        setCarregando(false)
      }
    }

    carregarClientes()
    intervalo = setInterval(carregarClientes, 30000)

    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    async function carregarMensagemPadrao() {
      try {
        const res = await apiGet('/api/v2/tables/mm2wytmovgp5cm6/records')
        const mensagem = res?.list?.[0]?.VIR_TELECOM?.mensagem
        if (mensagem) setMensagemConfig(mensagem)
      } catch (err) {
        console.error('Erro ao buscar mensagem padrão do NocoDB', err)
      }
    }

    carregarMensagemPadrao()
  }, [])

  const copiarNumero = (numero) => {
    navigator.clipboard.writeText(numero)
    toast({
      title: 'Número copiado!',
      description: numero,
      status: 'success',
      duration: 3000,
      isClosable: true
    })
  }

  const aplicarVariaveis = (template, cliente) => {
    // Adicionando logs para verificar se a variável está sendo substituída corretamente
   // console.log('Template Original:', template);  // Exibe o template original
   // console.log('Dados do Cliente:', cliente);  // Exibe os dados do cliente, incluindo CPF_CNPJ
    
    // A função de substituição
    return template
      .replace(/{nome}/g, cliente.RAZAO_SOCIAL)   // Substitui {nome} pelo nome
      .replace(/{CPF_CNPJ}/g, cliente.CPF_CNPJ)   // Substitui {CPF_CNPJ} pelo CPF/CNPJ
      .replace(/{telefone}/g, cliente.telefone || '');  // Substitui {telefone} pelo número de telefone
  }
  
  

  const chamarWhatsApp = (numero, cliente) => {
    const tel = numero.replace(/\D/g, '');  // Limpeza do número
    const mensagemFinal = aplicarVariaveis(mensagemConfig, cliente);  // Aplicando variáveis na mensagem
    const link = `https://wa.me/55${tel}?text=${encodeURIComponent(mensagemFinal)}`;
    window.open(link, '_blank');  // Enviar mensagem via WhatsApp
  }

  return (
    <>
      <Text fontSize="md" mb={4}>
        Total de bloqueados: <b>{clientesFiltrados.length}</b>
      </Text>

      <HStack spacing={6} mb={6} align="center" flexWrap="wrap">
        {/* Campo de busca */}
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

        {/* Botões de Ação */}
        <HStack spacing={4} align="center" flexWrap="wrap">
        <CobrancaAutomaticaVIR clientes={clientes} whatsappStatus={whatsappStatus} />

          {/* Botão de download do XLSX 
          <DownloadXLSX dados={clientes} nomeEmpresa="Vir Telecom" />*/}
        </HStack>
      </HStack>

      {carregando ? (
        <Spinner size="xl" />
      ) : (
        <>
          <VStack spacing={4} align="stretch">
            {clientesPagina.map((cliente, idx) => {
              const celular = cliente.telefone
              const telLimpo = celular?.replace(/\D/g, '')
              const numeroFormatado = `55${telLimpo}`
              const temWhats = whatsappStatus[numeroFormatado] === true

              return (
                <Box
                  key={idx}
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  shadow="sm"
                  bg={bgCard}
                >
                  <Text fontWeight="bold" color={corTexto}>{cliente.RAZAO_SOCIAL}</Text>
                  <Text color={corTexto}>{cliente.CPF_CNPJ}</Text>

                  <VStack align="start" spacing={2} mt={2}>
                    {cliente.telefone && (
                      <HStack>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => copiarNumero(celular)}
                          leftIcon={<CopyIcon />}
                        >
                          {celular}
                        </Button>

                        {temWhats ? (
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => chamarWhatsApp(celular, cliente)}
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
                    )}
                  </VStack>
                </Box>
              )
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
  )
}
