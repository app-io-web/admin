import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Textarea,
  Button,
  Heading,
  useToast,
  Spinner,
  Text,
  Checkbox,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { MdCloudUpload, MdDelete } from 'react-icons/md';
import { apiGet, apiPatch } from '../../services/api';

export default function MensagemCobrancaVirConfig() {
  const [mensagem, setMensagem] = useState('');
  const [idRegistro, setIdRegistro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [imagemURL, setImagemURL] = useState('');
  const [enviarMidia, setEnviarMidia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const cancelRef = useRef();
  const toast = useToast();

  useEffect(() => {
    async function carregarMensagem() {
      try {
        const res = await apiGet('/api/v2/tables/mm2wytmovgp5cm6/records');
        const dados = res?.list?.[0];
        if (dados) {
          setMensagem(dados?.VIR_TELECOM?.mensagem || '');
          setImagemURL(dados?.VIR_TELECOM?.imagem || '');
          setEnviarMidia(dados?.VIR_TELECOM?.enviarMidia || false);
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

    if (enviarMidia && !imagemURL) {
      toast({
        title: 'Imagem necessária',
        description: 'Selecione uma imagem para enviar mídia ou desmarque a opção "Enviar mídia".',
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
          VIR_TELECOM: {
            mensagem: mensagem,
            imagem: imagemURL,
            enviarMidia: enviarMidia,
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

    if (file.name.includes(' ')) {
      if (!window.toastExibido) {
        toast({
          title: 'Erro no nome do arquivo',
          description: 'O nome da imagem não deve conter espaços.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        window.toastExibido = true;
      }
      setUploading(false);
      return;
    }

    const nomeArquivoCorrigido = encodeURIComponent(file.name);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('size', file.size);
    formData.append('title', nomeArquivoCorrigido);
    formData.append('path', `2025/04/23/${Date.now()}_${nomeArquivoCorrigido}`);

    try {
      const res = await fetch('https://nocodb.nexusnerds.com.br/api/v2/storage/upload', {
        method: 'POST',
        headers: {
          'xc-token': import.meta.env.VITE_NOCODB_TOKEN,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Falha no upload');

      const result = await res.json();
      const path = result?.[0]?.path;

      if (!path) throw new Error('URL não retornada corretamente');

      const url = `https://nocodb.nexusnerds.com.br/${path}`;
      setImagemURL(url);

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
      window.toastExibido = false;
    }
  };

  const handleDeleteImagem = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteImagem = async () => {
    setImagemURL('');
    setEnviarMidia(false);
    setIsDeleteDialogOpen(false);

    try {
      await apiPatch(`/api/v2/tables/mm2wytmovgp5cm6/records`, [
        {
          Id: idRegistro,
          VIR_TELECOM: {
            mensagem: mensagem,
            imagem: '',
            enviarMidia: false,
          },
        },
      ]);

      toast({
        title: 'Imagem removida',
        description: 'A imagem foi removida com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Erro ao remover imagem',
        description: 'Não foi possível salvar as alterações no servidor.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setImagemURL(imagemURL);
      setEnviarMidia(enviarMidia);
    }
  };

  const cancelDeleteImagem = () => {
    setIsDeleteDialogOpen(false);
  };

  return (
    <Box maxW="700px" mx="auto" p={4}>
      <Heading size="md" mb={4}>
        📝 Mensagem de Cobrança – VIR TELECOM
      </Heading>

      {carregando ? (
        <Spinner />
      ) : (
        <>
          <Box fontSize="sm" color="gray.500" mb={2}>
            Variáveis disponíveis:
            <Button size="xs" variant="ghost" onClick={() => setMensagem((m) => m + ' {nome}')}>
              {'{nome}'}
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setMensagem((m) => m + ' {CPF_CNPJ}')}>
              {'{CPF_CNPJ}'}
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setMensagem((m) => m + ' {telefone}')}>
              {'{telefone}'}
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

          <Text color="gray.600" fontSize="sm" mt={2}>
            O nome da imagem não deve conter espaços. Por favor, altere o nome do arquivo e tente novamente.
          </Text>

          <Box mb={4}>
            <Checkbox
              isChecked={enviarMidia}
              onChange={(e) => setEnviarMidia(e.target.checked)}
              colorScheme="blue"
              isDisabled={!imagemURL}
            >
              Enviar mídia junto com a mensagem
            </Checkbox>
          </Box>

          <Textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Digite a mensagem padrão de cobrança..."
            mb={4}
            height="160px"
            resize="none"
            bg="gray.50"
            _dark={{ bg: 'gray.700', color: 'gray.100' }}
          />

          {imagemURL && (
            <Box mt={4}>
              <Text fontSize="sm" mb={2}>
                Pré-visualização da imagem:
              </Text>
              <Box display="flex" alignItems="center" gap={4}>
                <img
                  src={imagemURL || null}
                  alt="Imagem de cobrança"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg';
                  }}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: 8,
                  }}
                />
                <Button
                  leftIcon={<MdDelete />}
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteImagem}
                >
                  Remover Imagem
                </Button>
              </Box>
            </Box>
          )}

          <Button colorScheme="blue" onClick={salvarMensagem} mt={4}>
            Salvar Mensagem
          </Button>

          <AlertDialog
            isOpen={isDeleteDialogOpen}
            leastDestructiveRef={cancelRef}
            onClose={cancelDeleteImagem}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Remover Imagem
                </AlertDialogHeader>
                <AlertDialogBody>
                  Tem certeza que deseja remover a imagem? Esta ação atualizará as configurações no servidor.
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={cancelDeleteImagem}>
                    Cancelar
                  </Button>
                  <Button colorScheme="red" onClick={confirmDeleteImagem} ml={3}>
                    Remover
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </>
      )}
    </Box>
  );
}