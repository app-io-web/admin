import { useState, useEffect } from 'react';
import {
  Box, Text, VStack, Button, useToast, Accordion, AccordionItem,
  AccordionButton, AccordionPanel, AccordionIcon, Input, Textarea, HStack
} from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';

export default function ConfigDuvidasFrequentes() {
  const [duvidas, setDuvidas] = useState([]);
  const toast = useToast();

  const fetchDuvidas = async () => {
    try {
      const res = await fetch(`https://api.configsite.nexusnerds.com.br/duvidas-frequentes`);
      const data = await res.json();
      const registro = data.list?.[0];
      if (!registro) return;
      setDuvidas(registro.DuvidasJson || []);
    } catch (err) {
      console.error('Erro ao buscar dúvidas:', err);
    }
  };

  useEffect(() => {
    fetchDuvidas();
  }, []);

  const handlePerguntaChange = (indicePergunta, value) => {
    const novasDuvidas = [...duvidas];
    novasDuvidas[0].Perguntas[indicePergunta].Pergunta = value;
    setDuvidas(novasDuvidas);
  };

  const handleRespostaChange = (indicePergunta, indiceResposta, value) => {
    const novasDuvidas = [...duvidas];
    novasDuvidas[0].Perguntas[indicePergunta].Resposta[indiceResposta].Resposta_Pergunta = value;
    setDuvidas(novasDuvidas);
  };

  const handleAddPergunta = () => {
    const novasDuvidas = [...duvidas];
    novasDuvidas[0].Perguntas.push({
      Pergunta: '',
      Resposta: [{ Resposta_Pergunta: '' }]
    });
    setDuvidas(novasDuvidas);
  };

  const handleRemovePergunta = (indicePergunta) => {
    const novasDuvidas = [...duvidas];
    novasDuvidas[0].Perguntas.splice(indicePergunta, 1);
    setDuvidas(novasDuvidas);
  };

  const handleSave = async () => {
    try {
      const body = {
        Id: 1,
        DuvidasJson: duvidas
      };
      const res = await fetch(`https://api.configsite.nexusnerds.com.br/duvidas-frequentes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast({ title: 'Dúvidas atualizadas!', status: 'success', duration: 3000, isClosable: true });
        fetchDuvidas();
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (err) {
      console.error('Erro ao salvar dúvidas:', err);
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const applyMarkdownShortcut = (e, idxPergunta, idxResp) => {
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      const novasDuvidas = [...duvidas];
      const respostaAtual = novasDuvidas[0].Perguntas[idxPergunta].Resposta[idxResp].Resposta_Pergunta;
      novasDuvidas[0].Perguntas[idxPergunta].Resposta[idxResp].Resposta_Pergunta = `**${respostaAtual}**`;
      setDuvidas(novasDuvidas);
    }
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      const novasDuvidas = [...duvidas];
      const respostaAtual = novasDuvidas[0].Perguntas[idxPergunta].Resposta[idxResp].Resposta_Pergunta;
      novasDuvidas[0].Perguntas[idxPergunta].Resposta[idxResp].Resposta_Pergunta = `_${respostaAtual}_`;
      setDuvidas(novasDuvidas);
    }
  };

  return (
    <Box p={4} w="100%">
      <Text fontSize="2xl" mb={4}>Configuração de Dúvidas Frequentes</Text>
      {duvidas[0]?.Perguntas && (
        <Accordion allowMultiple w="100%"> {/* Adicione w="100%" aqui */}
          {duvidas[0].Perguntas.map((pergunta, idxPergunta) => (
            <AccordionItem border="1px" borderRadius="md" mb={2} w={{ base: '100%', md: '100vh' }} minW="0" key={idxPergunta}>
            <AccordionButton w="100%" display="flex" alignItems="center">
                <Box w="100%" textAlign="left">
                  {pergunta.Pergunta || `Pergunta ${idxPergunta + 1}`}
                </Box>
                <AccordionIcon flexShrink={0} />
              </AccordionButton>
              <AccordionPanel>
                <VStack spacing={3} align="stretch">
                  <Text fontSize="sm">Pergunta</Text>
                  <Input
                    value={pergunta.Pergunta}
                    onChange={(e) => handlePerguntaChange(idxPergunta, e.target.value)}
                  />
                  {pergunta.Resposta.map((resp, idxResp) => (
                    <Box key={idxResp}>
                      <Text fontSize="sm">Resposta (Markdown)</Text>
                      <Textarea
                        value={resp.Resposta_Pergunta}
                        onChange={(e) => handleRespostaChange(idxPergunta, idxResp, e.target.value)}
                        onKeyDown={(e) => applyMarkdownShortcut(e, idxPergunta, idxResp)}
                      />
                      <Text mt={2} fontSize="sm">Preview:</Text>
                      <Box p={2} borderWidth="1px" borderRadius="md">
                        <ReactMarkdown>{resp.Resposta_Pergunta}</ReactMarkdown>
                      </Box>
                    </Box>
                  ))}
                  <Button colorScheme="red" size="sm" onClick={() => handleRemovePergunta(idxPergunta)}>
                    Deletar Pergunta
                  </Button>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      <HStack mt={4}>
        <Button colorScheme="green" onClick={handleAddPergunta}>Adicionar Pergunta</Button>
        <Button colorScheme="blue" onClick={handleSave}>Salvar Dúvidas</Button>
      </HStack>
    </Box>
  );
}