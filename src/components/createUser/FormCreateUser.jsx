import { useState, useEffect } from 'react';
import {
  Box, Button, FormControl, FormLabel, Select, Input, Stack, useToast, Heading, Spinner, useColorModeValue, CheckboxGroup, Checkbox
} from '@chakra-ui/react'; // Importando CheckboxGroup
import { createUser } from '../../services/userApiService'; // Função de criação de usuário

// Função para gerar UnicID (exemplo simples)
const generateUnicID = () => {
  return 'user_' + Math.random().toString(36).substr(2, 9); // Gera um ID único simples
};

// Função para gerar o "user_login" como nome + 3 caracteres aleatórios
const generateUserLogin = (name) => {
  const randomChars = Math.random().toString(36).substr(2, 3); // Gera 3 caracteres aleatórios
  return name + randomChars;
};

export default function FormCreateUser({ onUserCreated }) {
  const [name, setName] = useState('');
  const [emailLogin, setEmailLogin] = useState(''); // Corrigido para email-login
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [userType, setUserType] = useState('comum');
  const [company, setCompany] = useState([]); // Lista de empresas selecionadas
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('black', 'white');

  useEffect(() => {
    console.log('Empresas selecionadas atualizadas:', company);
  }, [company]);

  const handleCheckboxChange = (selectedCompanies) => {
    setCompany(selectedCompanies); // Atualiza o estado diretamente com o array de empresas
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Verificando se pelo menos uma empresa foi selecionada
    if (company.length === 0) {
      setErrorMessage('Por favor, selecione pelo menos uma empresa.');
      return;
    }
  
    setErrorMessage(''); // Limpar mensagem de erro caso a validação seja bem-sucedida
  
    const newUserData = {
      name,
      "email-login": emailLogin, // Corrigido para usar "email-login"
      password,
      telefone_whatsapp: phone,
      data_nascimento: birthDate,
      type: userType,
      company: company.map((c) => c.trim()).join(','),
      UnicID_User: generateUnicID(),
      user_login: generateUserLogin(name), // Gerando user_login com o nome + 3 caracteres aleatórios
    };
  
    try {
      setIsLoading(true);
  
      // Enviando dados para criar o usuário na tabela principal
      const response = await createUser(newUserData); // Chama a API para criar o usuário
      console.log('Resposta da API:', response); // Log da resposta da API
  
      // Agora, envia o UnicID_User para a outra tabela (permissões)
      const permissionsResponse = await fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/mzekdm0ptp4sqlq/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': 'PQFnWUYFjMfX7aAVow3zO11oNhyvQugsPoYWDVw6', // Token de autenticação
        },
        body: JSON.stringify({
          UnicID_User: newUserData.UnicID_User, // Envia o UnicID_User gerado
          "PERM-[TOTAL]": {}  // Campos de permissão, ajuste conforme necessário
        }),
      });
  
      const permissionsData = await permissionsResponse.json();
      console.log('Resposta da API de permissões:', permissionsData); // Exibe a resposta da API
  
      toast({
        title: 'Usuário criado',
        description: 'O usuário foi criado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
  
      // Limpar campos após sucesso
      setName('');
      setEmailLogin('');
      setPassword('');
      setPhone('');
      setBirthDate('');
      setUserType('comum');
      setCompany([]);
      setErrorMessage('');
    } catch (error) {
      console.error('Erro ao criar usuário:', error); // Log do erro
  
      toast({
        title: 'Erro ao criar usuário',
        description: 'Ocorreu um erro ao tentar criar o usuário. Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <Box display="flex" minH="80vh" p={5}>
      <Box
        maxW="md"
        mx="auto"
        mt={1}
        p={5}
        borderWidth={1}
        borderRadius="lg"
        bg={bgColor} // Cor de fundo adaptada
        color={textColor} // Cor do texto adaptada
      >
        <Heading mb={4} textAlign="center">Cadastro de Usuário</Heading>

        {errorMessage && (
          <Box color="red.500" mb={4}>
            <strong>{errorMessage}</strong>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel htmlFor="name">Nome</FormLabel>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite seu nome"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="email-login">Email</FormLabel>
              <Input
                id="email-login"
                type="email"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)} // Usando o email-login correto
                placeholder="Digite seu email"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="password">Senha</FormLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="phone">Telefone</FormLabel>
              <Input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Digite seu telefone"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="birthDate">Data de Nascimento</FormLabel>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="userType">Tipo de Usuário</FormLabel>
              <Select
                id="userType"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="financeiro">Financeiro</option>
                <option value="comum">Comum</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="company">Empresa</FormLabel>
              <CheckboxGroup
                colorScheme="teal"
                value={company}
                onChange={handleCheckboxChange} // Atualização direta do valor de `company`
              >
                <Stack direction="column">
                  <Checkbox value="Max Fibra">Max Fibra</Checkbox>
                  <Checkbox value="Vir Telecom">Vir Telecom</Checkbox>
                  <Checkbox value="Reis Service">Reis Service</Checkbox>
                </Stack>
              </CheckboxGroup>
            </FormControl>

            <Button
              colorScheme="teal"
              size="lg"
              type="submit"
              isLoading={isLoading}
              loadingText="Criando..."
            >
              {isLoading ? <Spinner size="sm" /> : 'Criar Usuário'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
