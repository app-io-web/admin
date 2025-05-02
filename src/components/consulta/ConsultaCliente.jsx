import { useState } from 'react';
import {
  Box, Heading, Input, Button, Select, VStack, Text, Spinner, HStack, Table, Thead, Tbody, Tr, Th, Td,
  useColorModeValue, useToast, InputGroup, InputLeftElement, Icon, Tag, useBreakpointValue
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';

export default function ConsultaCliente() {
  const [entrada, setEntrada] = useState('');
  const [tipoConsulta, setTipoConsulta] = useState('Contratos');
  const [tipoEntrada, setTipoEntrada] = useState('cpf_cnpj');
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [semRegistros, setSemRegistros] = useState(false);
  const [boletos, setBoletos] = useState([]);
  const [mostrarBoletos, setMostrarBoletos] = useState(false);

  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const buttonBg = useColorModeValue('blue.600', 'blue.500');
  const buttonHoverBg = useColorModeValue('blue.700', 'blue.600');

  // Detectar se estamos em mobile ou desktop
  const isMobile = useBreakpointValue({ base: true, md: false });

  const formatarCpfCnpj = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return numeros
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatarChave = (chave) => {
    const palavras = chave
      .replace(/_/g, ' ')
      .split(' ')
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase());
    return palavras.join(' ') + ':';
  };

  const formatarDataBR = (data) => {
    if (!data) return 'Não informado';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const copiarLinhaDigitavel = (linha) => {
    navigator.clipboard.writeText(linha).then(() => {
      toast({
        title: 'Sucesso',
        description: 'Linha digitável copiada para a área de transferência!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }).catch((err) => {
      toast({
        title: 'Erro',
        description: 'Erro ao copiar a linha digitável: ' + err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    });
  };

  const formatarSituacao = (situacao) => {
    if (situacao === 'V') {
      return (
        <Tag colorScheme="red" size="sm">
          Vencido
        </Tag>
      );
    } else if (situacao === 'P') {
      return (
        <Tag colorScheme="yellow" size="sm">
          Pendente
        </Tag>
      );
    }
    return situacao;
  };

  const handleInputChange = (e) => {
    let valor = e.target.value;
    if (tipoConsulta === 'Massivas' && tipoEntrada === 'telefone') {
      valor = formatarTelefone(valor);
    } else {
      valor = formatarCpfCnpj(valor);
    }
    setEntrada(valor);
  };

  const liberarBloqueio = async (idcontrato) => {
    setCarregando(true);
    try {
      const response = await fetch(`https://api.consultavirtelecom.nexusnerds.com.br/liberarBloqueio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idcontrato }),
      });
      const data = await response.json();
      if (response.status === 200) {
        toast({
          title: 'Sucesso',
          description: 'Contrato desbloqueado com sucesso!',
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
        setResultado((prev) => {
          const novosDados = Array.isArray(prev) ? [...prev] : { ...prev };
          if (Array.isArray(novosDados)) {
            novosDados[0].situacao = 'Desbloqueado';
          } else {
            novosDados.situacao = 'Desbloqueado';
          }
          return novosDados;
        });
      } else {
        throw new Error(data.message || 'Erro ao desbloquear contrato');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao desbloquear: ' + error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCarregando(false);
    }
  };

  const buscarBoletos = async (idcontrato) => {
    setCarregando(true);
    try {
      const response = await fetch(`https://api.consultavirtelecom.nexusnerds.com.br/buscarBoletos/${idcontrato}`);
      const data = await response.json();
      if (response.status === 200) {
        setBoletos(data);
        setMostrarBoletos(true);
      } else if (response.status === 404) {
        setBoletos([]);
        setMostrarBoletos(true);
        toast({
          title: 'Aviso',
          description: 'Nenhum boleto encontrado.',
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
      } else {
        throw new Error(data.message || 'Erro ao buscar boletos');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao buscar boletos: ' + error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCarregando(false);
    }
  };

  const realizarConsulta = async () => {
    if (!entrada) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um CPF/CNPJ ou telefone.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setCarregando(true);
    setErro(null);
    setResultado(null);
    setSemRegistros(false);
    setBoletos([]);
    setMostrarBoletos(false);

    const entradaLimpa = entrada.replace(/\D/g, '');

    try {
      const API_BASE = import.meta.env.PROD 
        ? 'https://api.consultavirtelecom.nexusnerds.com.br'
        : 'http://localhost:4004';
    
      let url = '';
      if (tipoConsulta === 'Contratos') {
        url = `${API_BASE}/contratos/${entradaLimpa}`;
      } else if (tipoConsulta === 'Dados') {
        url = `${API_BASE}/dados/${entradaLimpa}`;
      } else if (tipoConsulta === 'Massivas') {
        if (tipoEntrada === 'cpf_cnpj') {
          url = `${API_BASE}/massivas?cpf_cnpj=${entradaLimpa}`;
        } else {
          url = `${API_BASE}/massivas?telefone=${entradaLimpa}`;
        }
      }
    
     // console.log('Consultando URL:', url);
      const response = await fetch(url);
      const data = await response.json();
    
     // console.log('Resposta da API:', data);
    
      if (data.message && data.message === 'sem registros!') {
        setSemRegistros(true);
        return;
      }
    
      if (data.error) {
        throw new Error(data.error);
      }
    
      setResultado(data);
    } catch (error) {
      setErro(error.message || 'Erro ao realizar consulta');
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao realizar consulta',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCarregando(false);
    }
    
  };

  const renderResultado = () => {
    if (semRegistros) {
      return (
        <Box
          p={{ base: 4, md: 5 }}
          bg={bg}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <Text color={textColor} fontSize={{ base: 'sm', md: 'md' }} textAlign="center">
            Nenhum registro encontrado na massiva.
          </Text>
        </Box>
      );
    }

    if (!resultado) return null;

    const dados = Array.isArray(resultado) && resultado.length > 0 ? resultado[0] : resultado;
    const idContrato = dados.idcontrato;
    const isBloqueado = dados.situacao && dados.situacao.toLowerCase() === 'bloqueado';

    return (
      <Box
        p={{ base: 4, md: 5 }}
        bg={bg}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
        boxShadow="sm"
      >
        <VStack align="stretch" spacing={{ base: 3, md: 4 }}>
          {Object.entries(dados).map(([chave, valor]) => (
            <Box key={chave}>
              <Text
                fontWeight="bold"
                color={textColor}
                fontSize={{ base: 'sm', md: 'md' }}
                mb={1}
              >
                {formatarChave(chave)}
              </Text>
              <Text
                color={textColor}
                fontSize={{ base: 'sm', md: 'md' }}
                wordBreak="break-word"
              >
                {valor !== null && valor !== undefined ? valor.toString() : 'Não informado'}
              </Text>
            </Box>
          ))}

          {/* Botões de Ação */}
          {idContrato && (
            <VStack align="stretch" spacing={3} mt={4}>
              {/* Status de Bloqueio e Botão de Desbloqueio */}
              {dados.situacao && (
                <>
                  <Text fontWeight="bold" color={textColor}>
                    Status de Bloqueio: {dados.situacao}
                  </Text>
                  {isBloqueado && (
                    <Button
                      colorScheme="green"
                      size="md"
                      onClick={() => liberarBloqueio(idContrato)}
                      isLoading={carregando}
                    >
                      Desbloquear Contrato
                    </Button>
                  )}
                </>
              )}

              {/* Botão para Ver Boletos */}
              <Button
                colorScheme="blue"
                size="md"
                onClick={() => buscarBoletos(idContrato)}
                isLoading={carregando}
              >
                Ver Boletos
              </Button>

              {/* Exibir Boletos */}
              {mostrarBoletos && (
                <Box mt={4}>
                  {boletos.length > 0 ? (
                    isMobile ? (
                      // Layout para mobile (lista de cards)
                      <VStack align="stretch" spacing={3}>
                        {boletos.map((boleto, index) => (
                          <Box
                            key={index}
                            p={3}
                            borderWidth="1px"
                            borderColor={borderColor}
                            borderRadius="md"
                            bg={bg}
                            boxShadow="sm"
                          >
                            <VStack align="stretch" spacing={2}>
                              <HStack justify="space-between">
                                <Text fontWeight="bold" fontSize="sm">
                                  ID Boleto: {boleto.id_boleto}
                                </Text>
                                <Text fontSize="sm">{formatarSituacao(boleto.situacao)}</Text>
                              </HStack>
                              <Text fontSize="sm">
                                Valor: R$ {boleto.valor}
                              </Text>
                              <Text fontSize="sm">
                                Vencimento: {formatarDataBR(boleto.vencimento)}
                              </Text>
                              <HStack spacing={2}>
                                <Button
                                  colorScheme="gray"
                                  size="sm"
                                  onClick={() => copiarLinhaDigitavel(boleto.linhadigitavel)}
                                >
                                  Copiar Linha Digitável
                                </Button>
                                {boleto.pix ? (
                                  <Button
                                    as="a"
                                    href={boleto.pix}
                                    target="_blank"
                                    colorScheme="teal"
                                    size="sm"
                                  >
                                    Ver Pix
                                  </Button>
                                ) : (
                                  <Text fontSize="sm" color="gray.500">
                                    Pix não disponível
                                  </Text>
                                )}
                              </HStack>
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      // Layout para desktop (tabela)
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>ID Boleto</Th>
                            <Th>Valor</Th>
                            <Th>Vencimento</Th>
                            <Th>Situação</Th>
                            <Th>Linha Digitável</Th>
                            <Th>Pix</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {boletos.map((boleto, index) => (
                            <Tr key={index}>
                              <Td>{boleto.id_boleto}</Td>
                              <Td>R$ {boleto.valor}</Td>
                              <Td>{formatarDataBR(boleto.vencimento)}</Td>
                              <Td>{formatarSituacao(boleto.situacao)}</Td>
                              <Td>
                                <Button
                                  colorScheme="gray"
                                  size="sm"
                                  onClick={() => copiarLinhaDigitavel(boleto.linhadigitavel)}
                                >
                                  Copiar Linha Digitável
                                </Button>
                              </Td>
                              <Td>
                                {boleto.pix ? (
                                  <Button
                                    as="a"
                                    href={boleto.pix}
                                    target="_blank"
                                    colorScheme="teal"
                                    size="sm"
                                  >
                                    Ver Pix
                                  </Button>
                                ) : (
                                  'Não disponível'
                                )}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )
                  ) : (
                    <Text color={textColor} textAlign="center">
                      Nenhum boleto encontrado.
                    </Text>
                  )}
                </Box>
              )}
            </VStack>
          )}
        </VStack>
      </Box>
    );
  };

  return (
    <Box
      bg={bg}
      p={{ base: 4, md: 6 }}
      borderRadius="xl"
      boxShadow="md"
      borderWidth="1px"
      borderColor={borderColor}
      w={{ base: '47vh', md: '900px' }} // Ajustado para ocupar 100% da largura no mobile
      mx="auto"
      mt={{ base: 4, md: 0 }}
    >
      <Heading
        fontSize={{ base: 'lg', md: 'xl' }}
        mb={{ base: '4', md: '6'}}
        color={textColor}
        textAlign="center"
      >
        Consulta de Cliente
      </Heading>

      <VStack spacing={{ base: 4, md: 5 }} align="stretch">
        <VStack spacing={{ base: 3, md: 4 }} align="stretch">
          <Select
            size="md"
            value={tipoConsulta}
            onChange={(e) => {
              setTipoConsulta(e.target.value);
              setEntrada('');
              setResultado(null);
              setErro(null);
              setSemRegistros(false);
              setTipoEntrada('cpf_cnpj');
            }}
            borderRadius="md"
            borderColor={borderColor}
            bg={bg}
            color={textColor}
            _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
          >
            <option value="Contratos">Contratos</option>
            <option value="Dados">Dados</option>
            <option value="Massivas">Massivas</option>
          </Select>

          {tipoConsulta === 'Massivas' && (
            <Select
              size="md"
              value={tipoEntrada}
              onChange={(e) => {
                setTipoEntrada(e.target.value);
                setEntrada('');
              }}
              borderRadius="md"
              borderColor={borderColor}
              bg={bg}
              color={textColor}
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
            >
              <option value="cpf_cnpj">CPF/CNPJ</option>
              <option value="telefone">Telefone</option>
            </Select>
          )}

          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.400" boxSize={5} />
            </InputLeftElement>
            <Input
              placeholder={
                tipoConsulta === 'Massivas'
                  ? tipoEntrada === 'cpf_cnpj'
                    ? 'Digite CPF/CNPJ'
                    : 'Digite Telefone'
                  : 'Digite CPF/CNPJ'
              }
              value={entrada}
              onChange={handleInputChange}
              maxLength={
                tipoConsulta === 'Massivas' && tipoEntrada === 'telefone' ? 15 : 18
              }
              size="md"
              fontSize={{ base: 'sm', md: 'md' }}
              borderRadius="md"
              borderColor={borderColor}
              bg={bg}
              color={textColor}
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px blue.400' }}
              _placeholder={{ color: 'gray.400' }}
            />
          </InputGroup>

          <Button
            bg={buttonBg}
            color="white"
            size="md"
            onClick={realizarConsulta}
            isLoading={carregando}
            w="full"
            borderRadius="md"
            _hover={{ bg: buttonHoverBg }}
            _active={{ bg: buttonHoverBg }}
            boxShadow="sm"
          >
            Consultar
          </Button>
        </VStack>

        {carregando && (
          <Box textAlign="center" py={{ base: 3, md: 4 }}>
            <Spinner size="md" color="blue.500" />
          </Box>
        )}

        {erro && (
          <Text
            color="red.500"
            fontSize={{ base: 'sm', md: 'md' }}
            textAlign="center"
            mt={2}
          >
            {erro}
          </Text>
        )}

        {renderResultado()}
      </VStack>
    </Box>
  );
}