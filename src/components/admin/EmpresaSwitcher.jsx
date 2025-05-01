import { Box, Button, HStack, useColorModeValue } from '@chakra-ui/react';
import { useState, useEffect } from 'react';

export default function EmpresaSwitcher({ empresas = '', onChange }) {
  const listaEmpresas = empresas
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  const bgAtivo = useColorModeValue('blue.500', 'blue.300');
  const colorAtivo = useColorModeValue('white', 'gray.800');

  const [selecionada, setSelecionada] = useState(() => {
    const salva = localStorage.getItem('empresaSelecionada');
    return salva && listaEmpresas.includes(salva) ? salva : listaEmpresas[0] || '';
  });

  useEffect(() => {
    if (onChange && selecionada) {
      onChange(selecionada);
    }
  }, [selecionada]);

  const handleSelecionar = (empresa) => {
    setSelecionada(empresa);
    localStorage.setItem('empresaSelecionada', empresa);
  };

  if (!listaEmpresas.length) return null;

  return (
    <HStack spacing={3} flexWrap="wrap">
      {listaEmpresas.map((empresa) => (
        <Button
          key={empresa}
          onClick={() => handleSelecionar(empresa)}
          size="sm"
          variant="outline"
          borderWidth="2px"
          borderColor={empresa === selecionada ? bgAtivo : 'gray.300'}
          bg={empresa === selecionada ? bgAtivo : 'transparent'}
          color={empresa === selecionada ? colorAtivo : undefined}
          _hover={{ opacity: 0.85 }}
        >
          {empresa}
        </Button>
      ))}
    </HStack>
  );
}
