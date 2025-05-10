// src/pages/EditarUsuarioPage.jsx
import { useParams } from 'react-router-dom';
import {
  Box, Heading, Input, Button, Stack, FormControl, FormLabel,
  useToast, Spinner, Text, useColorModeValue, Avatar, IconButton,
  VStack, Select, Checkbox, CheckboxGroup, HStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FaCamera } from 'react-icons/fa';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';

const API_URL = `${import.meta.env.VITE_NOCODB_URL}/api/v2/tables/mn8xn7q4lsvk963/records`;
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function EditarUsuarioPage() {
  const { id } = useParams();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [uploading, setUploading] = useState(false);
  const bg = useColorModeValue('whiteAlpha.700', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}?where=(UnicID_User,eq,${id})`, {
          headers: { 'xc-token': TOKEN }
        });
        const json = await res.json();
        setUser(json?.list?.[0]);
      } catch (err) {
        setErro('Erro ao carregar usuário.');
      } finally {
        setCarregando(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

    const handleUploadFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    // ✅ Remove espaços do nome do arquivo
    const nomeOriginal = file.name;
    const nomeSemEspacos = nomeOriginal.replace(/\s+/g, '_');
    const nomeArquivoCorrigido = encodeURIComponent(nomeSemEspacos);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('size', file.size);
    formData.append('title', nomeArquivoCorrigido);
    formData.append('path', `2025/04/23/${Date.now()}_${nomeArquivoCorrigido}`);

    try {
        const res = await fetch(`${import.meta.env.VITE_NOCODB_URL}/api/v2/storage/upload`, {
        method: 'POST',
        headers: { 'xc-token': TOKEN },
        body: formData,
        });
        const result = await res.json();
        const path = result?.[0]?.path;
        const url = `https://nocodb.nexusnerds.com.br/${path}`;
        setUser((prev) => ({ ...prev, pic_profile_link: url }));
        toast({ title: 'Foto atualizada', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
        toast({ title: 'Erro ao fazer upload', status: 'error', duration: 4000, isClosable: true });
    } finally {
        setUploading(false);
    }
    };


const handleSave = async () => {
  setSalvando(true);
  try {
    if (user.novaSenha && user.novaSenha !== user.confirmarSenha) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      setSalvando(false);
      return;
    }

    const payload = {
      Id: user.Id,
      name: user.name,
      'email-login': user['email-login'],
      telefone_whatsapp: user.telefone_whatsapp,
      type: user.type,
      company: user.company,
      data_nascimento: user.data_nascimento,
      user_login: user.user_login,
      pic_profile_link: user.pic_profile_link || '',
    };

    if (user.novaSenha) {
      payload.password = user.novaSenha;
    }

    const res = await fetch(API_URL, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': TOKEN,
      },
      body: JSON.stringify([payload]),
    });

    if (!res.ok) throw new Error();
    toast({ title: 'Usuário atualizado', status: 'success', duration: 4000, isClosable: true });
  } catch {
    toast({ title: 'Erro', description: 'Erro ao salvar usuário.', status: 'error', duration: 4000, isClosable: true });
  } finally {
    setSalvando(false);
  }
};


  if (carregando) return <Spinner />;
  if (!user) return <Text>{erro || 'Usuário não encontrado.'}</Text>;

  return (
    <Box display="flex" minH="100vh" position="relative">
      <SideBar />
      <Box flex="1" px={{ base: 4, md: 12 }} pt={{ base: 4, md: 8 }} pb={{ base: 24, md: 8 }} overflowY="auto">
        <Box position="fixed" top="20px" right="24px" zIndex={30} display={{ base: 'none', md: 'block' }}>
          <PerfilUsuarioDesktop usuario={JSON.parse(localStorage.getItem('usuario') || '{}')} />
        </Box>

        <Box
        maxW="1200px"
        mx="auto"
        bg={bg}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={border}
        boxShadow="md"
        p={10}
        >
        <Heading mb={8} fontSize="2xl" textAlign="center">Editar Usuário</Heading>

        <VStack spacing={6} align="center" mb={8}>
            <Avatar size="2xl" src={user.pic_profile_link || ''} name={user.name} />
            <Box position="relative">
            <IconButton icon={<FaCamera />} aria-label="Upload" as="label" htmlFor="upload-foto" size="sm" isLoading={uploading} />
            <Input id="upload-foto" type="file" hidden onChange={handleUploadFoto} />
            </Box>
        </VStack>

<Stack direction={{ base: 'column', md: 'row' }} spacing={8} align="start">
  <Stack flex={1} spacing={5}>
    <FormControl>
      <FormLabel>Nome</FormLabel>
      <Input value={user.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
    </FormControl>

    <FormControl>
      <FormLabel>Email</FormLabel>
      <Input value={user['email-login'] || ''} onChange={(e) => handleChange('email-login', e.target.value)} />
    </FormControl>

    <FormControl>
      <FormLabel>WhatsApp</FormLabel>
      <Input value={user.telefone_whatsapp || ''} onChange={(e) => handleChange('telefone_whatsapp', e.target.value)} />
    </FormControl>

    <FormControl>
      <FormLabel>Data de Nascimento</FormLabel>
      <Input type="date" value={user.data_nascimento || ''} onChange={(e) => handleChange('data_nascimento', e.target.value)} />
    </FormControl>
  </Stack>

  <Stack flex={1} spacing={5}>
    <FormControl>
      <FormLabel>Tipo de Usuário</FormLabel>
      <Select value={user.type || ''} onChange={(e) => handleChange('type', e.target.value)}>
        <option value="admin">Admin</option>
        <option value="financeiro">Financeiro</option>
        <option value="comum">Comum</option>
      </Select>
    </FormControl>

    <FormControl>
      <FormLabel>Empresa</FormLabel>
      <CheckboxGroup
        colorScheme="blue"
        value={user.company?.split(',').map((e) => e.trim()) || []}
        onChange={(val) => handleChange('company', val.join(','))}
      >
        <VStack align="start">
          <Checkbox value="Max Fibra">Max Fibra</Checkbox>
          <Checkbox value="Vir Telecom">Vir Telecom</Checkbox>
          <Checkbox value="Reis Service">Reis Service</Checkbox>
        </VStack>
      </CheckboxGroup>
    </FormControl>
  </Stack>

  <Stack flex={1} spacing={5}>
    <FormControl>
      <FormLabel>Nova Senha</FormLabel>
      <Input
        type="password"
        placeholder="Digite uma nova senha"
        onChange={(e) => handleChange('novaSenha', e.target.value)}
      />
    </FormControl>

    <FormControl>
      <FormLabel>Confirmar Nova Senha</FormLabel>
      <Input
        type="password"
        placeholder="Confirme a nova senha"
        onChange={(e) => handleChange('confirmarSenha', e.target.value)}
      />
    </FormControl>
  </Stack>
</Stack>


        <Button mt={10} colorScheme="blue" isLoading={salvando} onClick={handleSave} w="full">
            Salvar Alterações
        </Button>
        </Box>

      </Box>
      <BottomBar />
    </Box>
  );
}