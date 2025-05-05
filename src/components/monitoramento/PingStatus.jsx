import {
    Box,
    Heading,
    HStack,
    Icon,
    useBreakpointValue,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    SimpleGrid,
  } from '@chakra-ui/react';
  import { FaSignal } from 'react-icons/fa';
  import PingCard from './PingCard';
  
  const fontes = [
    { nome: 'Clientes Ativos VIR', url: 'https://apidoixc.nexusnerds.com.br/data/clientes_ativosVIR.json' },
    { nome: 'Clientes Bloqueados VIR', url: 'https://apidoixc.nexusnerds.com.br/data/clientes_bloqueados_atualizado.json' },
    { nome: 'Clientes Cancelados VIR', url: 'https://apidoixc.nexusnerds.com.br/data/clientes_canceladosVIR.json' },
    { nome: 'Rede Vivo', url: 'vivo.com.br' },
    { nome: 'SmartOLT ONU Offline', url: 'grupomaxltda.smartolt.com' },
    { nome: 'WhatsApp', url: 'whatsapp.com' },
  ];
  
  export default function PingStatus() {
    const isMobile = useBreakpointValue({ base: true, md: false });
  
    return (
      <Box p={4}>
        <HStack spacing={2} mb={4}>
          <Icon as={FaSignal} color="teal.400" boxSize={5} />
          <Heading fontSize="xl">Monitoramento de Serviços</Heading>
        </HStack>
  
        {isMobile ? (
          <Accordion allowToggle defaultIndex={[0]}>
            {fontes.map((fonte, i) => (
              <AccordionItem key={i}>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    {fonte.nome}
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <PingCard nome={fonte.nome} url={fonte.url} />
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <SimpleGrid columns={{ md: 2, lg: 3 }} spacing={4}>
            {fontes.map((fonte, i) => (
              <PingCard key={i} nome={fonte.nome} url={fonte.url} />
            ))}
          </SimpleGrid>
        )}
      </Box>
    );
  }
  