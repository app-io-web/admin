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
  Spinner,
  Button,
  ButtonGroup,
  Text,
} from '@chakra-ui/react';
import { FaSignal, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import PingCard from './PingCard';

const CARDS_POR_PAGINA = 6;
const TEMPO_SLIDE = 60000; // 60 segundos

export default function PingStatus() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [fontes, setFontes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);

useEffect(() => {
  const carregarStatus = async () => {
    try {
      const res = await fetch('https://apigeral.ping.nexusnerds.com.br/api/status-reais');
      const json = await res.json();
      setFontes(json);
    } catch (err) {
      console.error('Erro ao buscar status dos serviços:', err);
    } finally {
      setCarregando(false);
    }
  };

  carregarStatus(); // Carrega inicialmente

  const intervalo = setInterval(() => {
    carregarStatus();
  }, 8000); // 10 segundos

  return () => clearInterval(intervalo);
}, []);


  // Paginação automática a cada 30s
  useEffect(() => {
    const intervalo = setInterval(() => {
      setPaginaAtual((prev) => {
        const totalPaginas = Math.ceil(fontes.length / CARDS_POR_PAGINA);
        return prev >= totalPaginas ? 1 : prev + 1;
      });
    }, TEMPO_SLIDE);
    return () => clearInterval(intervalo);
  }, [fontes]);

  const totalPaginas = Math.ceil(fontes.length / CARDS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * CARDS_POR_PAGINA;
  const fim = inicio + CARDS_POR_PAGINA;
  const fontesPaginadas = fontes.slice(inicio, fim);

  return (
    <Box p={4}>
      <HStack spacing={2} mb={4}>
        <Icon as={FaSignal} color="teal.400" boxSize={5} />
        <Heading fontSize="xl">Monitoramento de Serviços</Heading>
      </HStack>

      {carregando ? (
        <Spinner size="lg" />
      ) : isMobile ? (
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
                <PingCard {...fonte} />
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <>
          <SimpleGrid columns={{ md: 2, lg: 3 }} spacing={4} mb={4}>
            {fontesPaginadas.map((fonte, i) => (
              <PingCard key={i} {...fonte} />
            ))}
          </SimpleGrid>

          {totalPaginas > 1 && (
            <HStack justify="center" mt={4}>
              <ButtonGroup variant="outline" size="sm" isAttached>
                <Button
                  onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                  isDisabled={paginaAtual === 1}
                  leftIcon={<FaChevronLeft />}
                >
                  Anterior
                </Button>
                <Button cursor="default" _hover={{}} disabled>
                  Página {paginaAtual} de {totalPaginas}
                </Button>
                <Button
                  onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                  isDisabled={paginaAtual === totalPaginas}
                  rightIcon={<FaChevronRight />}
                >
                  Próxima
                </Button>
              </ButtonGroup>
            </HStack>
          )}
        </>
      )}
    </Box>
  );
}
