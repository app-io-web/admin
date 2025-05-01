import { useEffect, useState } from 'react';
import {
  Box, Text, VStack, HStack, Collapse, IconButton,
  useDisclosure, useColorModeValue
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Lottie from 'lottie-react';
import fixAnimation from '../assets/lottie/fix.json'; // Caminho relativo

const MotionBox = motion(Box);

export default function OrdensExecucaoCard() {
  const [ordens, setOrdens] = useState([]);

  useEffect(() => {
    const fetchOrdens = () => {
      fetch('https://apidoixc.nexusnerds.com.br/data/Ordens_Em_Execucao.json')
        .then(r => r.json())
        .then(setOrdens)
        .catch(console.error);
    };
  
    fetchOrdens(); // primeira carga
  
    const id = setInterval(fetchOrdens, 300000); // 5 minutos
  
    return () => clearInterval(id); // limpa no unmount
  }, []);
  

  const bgCard = useColorModeValue('white', 'gray.800');

  return (
    <VStack align="stretch" spacing={4} w={{ base: '100%', md: '400px' }} flexShrink={0}>
      {ordens.map((ordem, idx) => (
        <OrdemItem key={idx} ordem={ordem} bgCard={bgCard} />
      ))}
    </VStack>
  );
}

function OrdemItem({ ordem, bgCard }) {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <MotionBox
      minH="auto"
      w="100%"
      p={4}
      borderRadius="xl"
      boxShadow="md"
      bg={bgCard}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      cursor="pointer"
      mt={4}
      onClick={onToggle}
    >
      <HStack justify="space-between" align="flex-start">
        <HStack align="flex-start">
          {/* Animação Lottie ao lado do nome quando está fechado */}
          {!isOpen && (
            <Box w="30px" h="30px" mt="2px">
              <Lottie animationData={fixAnimation} loop autoPlay />
            </Box>
          )}
          <Box>
            <Text fontWeight="bold">{ordem.razao}</Text>
            <Text fontSize="sm" color="gray.500">Técnico: {ordem.tecnico}</Text>
          </Box>
        </HStack>
        <IconButton
          icon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
          size="sm"
          variant="ghost"
          aria-label="Toggle detalhes"
          pointerEvents="none"
          opacity={0.7}
        />
      </HStack>

      <Collapse in={isOpen} animateOpacity>
        <Box mt={3} fontSize="sm">
          <Text><strong>ID Cliente:</strong> {ordem.id_cliente}</Text>
          <Text><strong>Telefone:</strong> {ordem.telefone_celular}</Text>
          <Text><strong>Endereço:</strong> {ordem.endereco}</Text>
          <Text><strong>Assunto:</strong> {ordem.assunto}</Text>
          <Text><strong>Aberta em:</strong> {ordem.data_abertura}</Text>
        </Box>
      </Collapse>
    </MotionBox>
  );
}
