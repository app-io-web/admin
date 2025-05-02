import React, { useEffect, useState } from 'react';
import { Box, Textarea, Button, Heading, useToast, Spinner, useColorModeValue, Text } from '@chakra-ui/react';
import { MdCloudUpload } from 'react-icons/md';  // Ícone para o botão de upload
import { apiGet, apiPatch } from '../../services/api';

export default function MensagemCobrancaConfig() {
  const [mensagem, setMensagem] = useState('');
  const [idRegistro, setIdRegistro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [imagemURL, setImagemURL] = useState('');  // URL da imagem
  const [uploading, setUploading] = useState(false);

  const NOCODB_TOKEN = import.meta.env?.VITE_NOCODB_TOKEN || '';
  const toast = useToast();

  useEffect(() => {
    async function carregarMensagem() {
      try {
        const res = await apiGet('/api/v2/tables/mm2wytmovgp5cm6/records');
        const dados = res?.list?.[0];
        if (dados) {
          setMensagem(dados?.MAX_FIBRA?.mensagem || '');
          setImagemURL(dados?.MAX_FIBRA?.imagem || '');  // Carregar a imagem existente
          setIdRegistro(dados?.Id);
        }
      } catch (err) {
        toast({
          title: 'Erro ao carregar mensagem',
          description: 'Não foi possível buscar a configuração atual.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setCarregando(false);
      }
    }

    carregarMensagem();
  }, []);

  const salvarMensagem = async () => {
    if (!idRegistro) {
      toast({
        title: 'ID não encontrado',
        description: 'Não foi possível encontrar o registro para atualizar.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!mensagem.includes('{nome}')) {
      toast({
        title: 'Mensagem incompleta',
        description: 'A mensagem precisa conter a variável {nome}.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await apiPatch(`/api/v2/tables/mm2wytmovgp5cm6/records`, [
        {
          Id: idRegistro,
          MAX_FIBRA: {
            mensagem: mensagem,
            imagem: imagemURL,  // Atualizando o campo de imagem
          },
        },
      ]);

      toast({
        title: 'Mensagem atualizada!',
        description: 'A mensagem de cobrança foi salva com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao tentar salvar a mensagem.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const uploadImagem = async (file) => {
    setUploading(true);

    // Verificar se o nome do arquivo contém espaços
    if (file.name.includes(" ")) {
      // Verificar se o toast já foi exibido
      if (!window.toastExibido) {
        toast({
          title: 'Erro no nome do arquivo',
          description: 'O nome da imagem não deve conter espaços.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        window.toastExibido = true;  // Garantir que o toast só apareça uma vez
      }
      setUploading(false);
      return; // Impede o envio do arquivo
    }

    // Corrigindo nome do arquivo (substituindo espaços por %20)
    const nomeArquivoCorrigido = encodeURIComponent(file.name);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('size', file.size);
    formData.append('title', nomeArquivoCorrigido);  // Usando o nome corrigido
    formData.append('path', `2025/04/23/${Date.now()}_${nomeArquivoCorrigido}`); // Organizando a pasta

    try {
      const res = await fetch('https://nocodb.nexusnerds.com.br/api/v2/storage/upload', {
        method: 'POST',
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Falha no upload');

      const result = await res.json();
      //console.log("Resposta da API:", result); // Log para verificar o formato da resposta

      // Usando o 'path' para construir a URL final
      const path = result?.[0]?.path;

      if (!path) throw new Error('URL não retornada corretamente');

      // Construindo a URL final corrigida
      const url = `https://nocodb.nexusnerds.com.br/${path}`;

      setImagemURL(url);  // Atualizando a URL da imagem

      toast({
        title: 'Imagem enviada!',
        description: 'Link inserido com sucesso na variável.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('❌ Erro no upload:', err);
      toast({
        title: 'Erro ao enviar imagem',
        description: err.message || 'Verifique o tamanho ou o formato do arquivo.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      window.toastExibido = false; // Resetar a flag após a operação
    }
  };

  return (
    <Box maxW="700px" mx="auto" p={4}>
      <Heading size="md" mb={4}>
        📝 Mensagem de Cobrança – MAX FIBRA
      </Heading>

      {carregando ? (
        <Spinner />
      ) : (
        <>
          <Box fontSize="sm" color="gray.600" mb={2}>
            Variáveis disponíveis:&nbsp;
            <Button size="xs" variant="ghost" onClick={() => setMensagem((m) => m + ' {nome}')} >
              {"{nome}"}
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setMensagem((m) => m + ' {endereco}')} >
              {"{endereco}"}
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setMensagem((m) => m + ' {telefone}')} >
              {"{telefone}"}
            </Button>
          </Box>

          <Box mb={4}>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) uploadImagem(file);
              }}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <Button
              as="label"
              htmlFor="file-upload"
              leftIcon={<MdCloudUpload />}
              colorScheme="blue"
              variant="solid"
              size="lg"
              width="100%"
              fontSize="lg"
            >
              Escolher Arquivo
            </Button>
          </Box>

          {/* Adicionando a mensagem abaixo do botão de upload */}
          <Text color="gray.600" fontSize="sm" mt={2}>
            O nome da imagem não deve conter espaços. Por favor, altere o nome do arquivo e tente novamente.
          </Text>

          <Textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Digite a mensagem padrão de cobrança..."
            mb={4}
            height="160px"
            resize="none"
            bg={useColorModeValue('gray.50', 'gray.700')}
            color={useColorModeValue('gray.800', 'gray.100')}
          />

          {imagemURL && (
            <Box mt={4}>
              <Text fontSize="sm" mb={2}>
                Pré-visualização da imagem:
              </Text>
              <img
                src={imagemURL}
                alt="Imagem de cobrança"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg';
                }}
                style={{
                  maxWidth: '100%',    // Tamanho máximo para que a imagem não ultrapasse a largura do contêiner
                  maxHeight: '300px',  // Limita a altura máxima da imagem
                  objectFit: 'contain', // Garante que a imagem seja ajustada sem distorcer
                  borderRadius: 8
                }}
              />
            </Box>
          )}

          <Button colorScheme="blue" onClick={salvarMensagem} mt={4}>
            Salvar Mensagem
          </Button>
        </>
      )}
    </Box>
  );
}
