import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    useColorModeValue,
    Spinner,
    Text
  } from '@chakra-ui/react'

  import { Tooltip } from '@chakra-ui/react'
  import { WarningTwoIcon } from '@chakra-ui/icons'
  import { HStack } from '@chakra-ui/react'


  import { useEffect, useState } from 'react'
  import { FiWifi } from 'react-icons/fi'
  
  export default function StatusOnusCard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tempoRestante, setTempoRestante] = useState(0)
    // 🎨 Cor dinâmica do ECG
    let corECG = '#00D97E'; // verde padrão

    if (data?.los >= 10) {
    corECG = '#FF4136'; // vermelho
    } else if (data?.los >= 5) {
    corECG = '#FFD700'; // amarelo
    } else if (data?.los >= 1) {
    corECG = '#FFA500'; // laranja
    }


  
    const bgCard = useColorModeValue('white', 'gray.800')
    const textColor = useColorModeValue('gray.800', 'white')
    const bgHeader = bgCard

  
    useEffect(() => {
        const carregarDados = () => {
          fetch('https://apidoixc.nexusnerds.com.br/data/Resultados_Status.json')
            .then(res => res.json())
            .then(json => {
              setData(json?.contagem)
              setLoading(false)
              setTempoRestante(300) // 🔁 define nova contagem
            })
            .catch(() => setLoading(false))
        }
      
        carregarDados() // primeira vez ao montar
      
        const intervaloDados = setInterval(carregarDados, 300000) // 🔁 a cada 5 minutos
        const intervaloTempo = setInterval(() => {
          setTempoRestante(prev => (prev > 0 ? prev - 1 : 0))
        }, 1000)
      
        return () => {
          clearInterval(intervaloDados)
          clearInterval(intervaloTempo)
        }
      }, [])
      
  
    return (
      <Accordion allowToggle borderRadius="xl" boxShadow="md"       whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }} mt={4} >
        <AccordionItem
          border="none"
          bg={bgCard}
          borderRadius="xl"
          overflow="hidden"
          _first={{ borderTopRadius: 'xl' }}
          _last={{ borderBottomRadius: 'xl' }}
        >
          <AccordionButton px={5} py={4} bg={bgHeader} _hover={{ bg: bgHeader }}>
            <Box flex="1" textAlign="left" display="flex" alignItems="center" gap={2} color={textColor}>
                
            <Box flex="1" textAlign="left" color={textColor}>
                <Text fontWeight="bold" display="flex" alignItems="center" gap={2}>
                    <FiWifi />
                    Status das ONUs
                </Text>

                {/* 🔽 Subtexto abaixo do título */}
                <Text fontSize="sm" color="gray.500" mt={0}>
                    conectividade óptica
                </Text>
                </Box>

              <HStack spacing={2} ml={2} align="center">
                <Box w="60px" h="22px">
                    <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                    <polyline
                        fill="none"
                        stroke={corECG}
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points="0,10 10,10 15,5 20,15 25,5 30,15 35,10 100,10"
                    >
                        <animate
                        attributeName="points"
                        dur="1.5s"
                        repeatCount="indefinite"
                        values="
                            0,10 10,10 15,5 20,15 25,5 30,15 35,10 100,10;
                            0,10 10,10 15,15 20,5 25,15 30,5 35,10 100,10;
                            0,10 10,10 15,5 20,15 25,5 30,15 35,10 100,10
                        "
                        />
                    </polyline>
                    </svg>
                </Box>

                {data?.los > 5 && (
                    <Tooltip label="Muitas ONUs com perda de sinal óptico (LOS). Verifique a rede." hasArrow bg="red.500" color="white">
                    <Box mt="2px">
                        <WarningTwoIcon color="red.500" boxSize={4} />
                    </Box>
                    </Tooltip>
                )}
                </HStack>

            </Box>
            <AccordionIcon />
          </AccordionButton>
  
          <AccordionPanel pb={4} color={textColor}>
            {loading ? (
              <Spinner size="md" />
            ) : (
              <Box>
                <Stat>
                  <StatLabel>ONUs Online</StatLabel>
                  <StatNumber color="green.400">{data?.online}</StatNumber>
                </Stat>
                <Stat mt={3}>
                  <StatLabel>ONUs Offline</StatLabel>
                  <StatNumber color="red.400">{data?.offline}</StatNumber>
                </Stat>
                <Stat mt={3}>
                  <StatLabel>ONUs com LOS</StatLabel>
                  <StatNumber color="yellow.400">{data?.los}</StatNumber>
                  <StatHelpText>Perda de sinal óptico</StatHelpText>
                </Stat>
                <Text mt={4} textAlign="center" fontSize="sm" color="gray.500">
                  Atualização em {Math.floor(tempoRestante / 60)}:
                  {String(tempoRestante % 60).padStart(2, '0')} min
                </Text>
              </Box>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    )
  }
  