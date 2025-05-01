import { useState, useEffect } from 'react';
import {
  Box, Text, VStack, Button, Input, SimpleGrid, Image, useToast, Accordion, AccordionItem,
  AccordionButton, AccordionPanel, AccordionIcon, Checkbox, HStack
} from '@chakra-ui/react';

import { FiUpload } from 'react-icons/fi'; 

export default function ConfigServicoAdicional() {
  const [dados, setDados] = useState({});
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const planos = [
    { key: 'Plano - Turbo - Serviço Adicional', label: 'Plano - Turbo - Serviço Adicional', plano: 'Turbo' },
    { key: 'Plano - Infinity - Serviço Adicional', label: 'Plano - Infinity - Serviço Adicional', plano: 'Infinity' },
    { key: 'Plano - Gold - Serviço Adicional', label: 'Plano - Gold - Serviço Adicional', plano: 'Gold' }
  ];

  const fetchServicos = async () => {
    try {
      const res = await fetch('https://api.configsite.nexusnerds.com.br/plano-servico-adicional-settings');
      const data = await res.json();
      const registro = data.list?.[0];
      if (!registro) return;

      const novosDados = { id: registro.Id, maisVendido: registro['Tag-MaisVendido'] };
      planos.forEach((plano) => {
        const planoData = registro[plano.key]?.[0];
        novosDados[plano.key] = planoData?.Serviços || [];
      });
      setDados(novosDados);
    } catch (err) {
      console.error('❌ Erro ao buscar serviços:', err);
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  const handleChange = (plano, index, field, value) => {
    const novosDados = { ...dados };
    novosDados[plano][index][field] = value;
    setDados(novosDados);
  };

  const handleAddServico = (plano) => {
    const novosDados = { ...dados };
    novosDados[plano] = [...(novosDados[plano] || []), { nome: '', Foto: [{ url: '' }] }];
    setDados(novosDados);
  };

  const handleRemoveServico = (plano, index) => {
    const novosDados = { ...dados };
    novosDados[plano].splice(index, 1);
    setDados(novosDados);
  };

  const handleSave = async (planoKey, planoNome) => {
    try {
      const body = {
        Id: dados.id,
        'Tag-MaisVendido': dados.maisVendido || null,
        [planoKey]: [
          {
            Plano: planoNome,
            Serviços: dados[planoKey]
          }
        ]
      };
      const res = await fetch('https://api.configsite.nexusnerds.com.br/plano-servico-adicional-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast({ title: 'Serviço atualizado com sucesso', status: 'success', duration: 3000, isClosable: true });
        fetchServicos();
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar serviços:', err);
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const uploadImagem = async (file, plano, index) => {
    setUploading(true);
  
    const img = new window.Image(); 
    img.src = URL.createObjectURL(file);
  
    img.onload = async () => {
      const { width, height } = img;
      URL.revokeObjectURL(img.src);
  
      if (width !== 1080 || height !== 800) {
        toast({
          title: 'Erro no tamanho da imagem',
          description: `A imagem precisa ter 1080x800 pixels. (Atual: ${width}x${height})`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setUploading(false);
        return;
      }
  
      const nomeSemEspacos = file.name.replace(/ /g, '_');
      const nomeArquivoCorrigido = encodeURIComponent(nomeSemEspacos);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('size', file.size);
      formData.append('title', nomeArquivoCorrigido);
      formData.append('path', `/${Date.now()}_${nomeArquivoCorrigido}`);
  
      try {
        const res = await fetch('https://nocodb.nexusnerds.com.br/api/v2/storage/upload', {
          method: 'POST',
          headers: { 'xc-token': import.meta.env.VITE_NOCODB_TOKEN },
          body: formData,
        });
        const result = await res.json();
        const path = result?.[0]?.path;
        const url = `https://nocodb.nexusnerds.com.br/${path}`;
  
        handleChange(plano, index, 'Foto', [{ url }]);
  
        toast({
          title: 'Imagem enviada!',
          description: 'URL atualizada com sucesso.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        console.error('❌ Erro no upload:', err);
        toast({ title: 'Erro ao enviar imagem', status: 'error', duration: 3000, isClosable: true });
      } finally {
        setUploading(false);
      }
    };
  
    img.onerror = () => {
      toast({
        title: 'Arquivo inválido',
        description: 'O arquivo não é uma imagem válida.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setUploading(false);
    };
  };
  
  
  

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
      {planos.map((plano) => (
        <Box key={plano.key} p={4} borderWidth="1px" borderRadius="md">
          <Text fontSize="lg" mb={2}>{plano.label}</Text>
          <Checkbox
            isChecked={dados.maisVendido === plano.plano}
            onChange={(e) => setDados({ ...dados, maisVendido: e.target.checked ? plano.plano : null })}
          >
            Marcar como mais vendido
          </Checkbox>
          <VStack spacing={3}>
            <Accordion allowMultiple w="100%">
              {dados[plano.key]?.map((servico, index) => (
                <AccordionItem key={index}>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">{servico.nome || `Serviço ${index + 1}`}</Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel>
                    <Text fontSize="sm">Nome do Serviço</Text>
                    <Input
                      value={servico.nome}
                      onChange={(e) => handleChange(plano.key, index, 'nome', e.target.value)}
                    />
                    <Text fontSize="sm" mt={2}>URL da Imagem</Text>

                            <HStack>
                              <Input
                                value={servico.Foto?.[0]?.url || ''}
                                onChange={(e) => handleChange(plano.key, index, 'Foto', [{ url: e.target.value }])}
                              />
                              <Button
                                leftIcon={<FiUpload />}
                                size="sm"
                                colorScheme="gray"
                                variant="outline"
                                alignItems="center"
                                display={'inline-flex'}
                                justifyContent="space-between"
                                onClick={() => document.getElementById(`file-input-${plano.key}-${index}`).click()}
                              >
                              </Button>
                              <Input
                                id={`file-input-${plano.key}-${index}`}
                                type="file"
                                accept="image/*"
                                display="none"
                        onChange={(e) => uploadImagem(e.target.files[0], plano.key, index)}
                      />
                    </HStack>

                    {servico.Foto?.[0]?.url && (
                      <Image src={servico.Foto[0].url} alt="Preview" mt={2} borderRadius="md" maxH="150px" objectFit="contain" w="100%" />
                    )}
                    <Button colorScheme="red" size="sm" mt={2} onClick={() => handleRemoveServico(plano.key, index)}>Remover</Button>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
            <Button colorScheme="green" onClick={() => handleAddServico(plano.key)}>Adicionar Serviço</Button>
            <Button colorScheme="blue" onClick={() => handleSave(plano.key, plano.plano)} size="sm" w="100%">Salvar {plano.label}</Button>
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  );
}
