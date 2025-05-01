import { useState, useEffect } from 'react';
import {
  Box, VStack, Text, Spinner, Divider, useColorModeValue,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, SimpleGrid, Input, ModalFooter, Button, useDisclosure, useToast, HStack, Select
} from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

export default function HistoricoFechamentos() {
  const [fechamentos, setFechamentos] = useState([]);
  const [fechamentosFiltrados, setFechamentosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [fechamentoSelecionado, setFechamentoSelecionado] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // State for pagination
  const cardsPerPage = 3; // Limit to 3 cards per page
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [valores, setValores] = useState({});
  const toast = useToast();

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario?.idUnico || 'desconhecido';
  const bgCard = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const gridColor = useColorModeValue('#E2E8F0', '#4A5568');
  const labelColor = useColorModeValue('#333', '#E2E8F0');
  const barFillColor = useColorModeValue('#009ddd', '#05d3f8');
  const hoje = new Date().toISOString().split('T')[0];

  const pieColors = useColorModeValue(
    ['#009ddd', '#05d3f8'],
    ['#009ddd', '#05d3f8']
  );

  useEffect(() => {
    const buscarFechamentos = async () => {
      try {
        const response = await fetch(`https://api.fechamentodiario.nexusnerds.com.br/fechamento/${unicID_user}`);
        const data = await response.json();
        setFechamentos(data);
        setFechamentosFiltrados(data);
        if (data.length > 0) {
          const datasOrdenadas = data
            .map((f) => f.Data)
            .sort((a, b) => new Date(a) - new Date(b));
          setDataInicial(datasOrdenadas[0]);
          setDataFinal(datasOrdenadas[datasOrdenadas.length - 1]);
        }
      } catch (err) {
        console.error('Erro ao buscar fechamentos:', err);
      } finally {
        setCarregando(false);
      }
    };
    buscarFechamentos();
  }, [unicID_user]);

  useEffect(() => {
    if (dataInicial && dataFinal && fechamentos.length > 0) {
      const dataInicialDate = new Date(dataInicial);
      const dataFinalDate = new Date(dataFinal);
      const filtrados = fechamentos
        .filter((fechamento) => {
          const dataFechamento = new Date(fechamento.Data);
          return dataFechamento >= dataInicialDate && dataFechamento <= dataFinalDate;
        })
        // Sort by date in descending order (most recent first)
        .sort((a, b) => new Date(b.Data) - new Date(a.Data));
      setFechamentosFiltrados(filtrados);
      setCurrentPage(1); // Reset to first page when filter changes
    } else {
      setFechamentosFiltrados(fechamentos.sort((a, b) => new Date(b.Data) - new Date(a.Data)));
    }
  }, [dataInicial, dataFinal, fechamentos]);

  const handleOpenModal = (fechamento) => {
    setFechamentoSelecionado(fechamento);
    setValores(fechamento.fechamento_diario || {});
    onOpen();
  };

  const calcularTotal = (fechamento) => {
    const categorias = ['moedas', 'caixaFrente', 'caixaInterno'];
    return categorias.reduce((total, categoria) => {
      const valores = fechamento?.[categoria] || {};
      const somaCategoria = Object.entries(valores).reduce(
        (acc, [valor, qtd]) => acc + valor * qtd, 0
      );
      return total + somaCategoria;
    }, 0);
  };

  const handleChange = (categoria, valor, qtd) => {
    setValores((prev) => ({
      ...prev,
      [categoria]: { ...prev[categoria], [valor]: qtd },
    }));
  };

  const handleSalvar = async () => {
    try {
      const response = await fetch('https://api.fechamentodiario.nexusnerds.com.br/fechamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unicID_user,
          Data: fechamentoSelecionado.Data,
          fechamento_diario: valores,
        }),
      });
      const resJson = await response.json();
      if (response.ok) {
        toast({
          title: 'Fechamento atualizado!',
          description: resJson.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error(resJson.error || 'Erro ao atualizar.');
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDownloadXLSX = () => {
    if (!fechamentoSelecionado) return;

    const data = [];
    const categorias = ['moedas', 'caixaFrente', 'caixaInterno'];

    categorias.forEach((categoria) => {
      const valoresCategoria = valores?.[categoria] || {};
      Object.entries(valoresCategoria).forEach(([valor, qtd]) => {
        data.push({
          Categoria: categoria.charAt(0).toUpperCase() + categoria.slice(1),
          Valor: `R$ ${parseFloat(valor).toFixed(2)}`,
          Quantidade: qtd,
          Total: `R$ ${(valor * qtd).toFixed(2)}`,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fechamento');
    XLSX.writeFile(wb, `Fechamento_${new Date(fechamentoSelecionado.Data).toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
  };

  const formatarMes = (data) => {
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const date = new Date(data);
    return meses[date.getMonth()];
  };

  const toggleChartType = () => {
    setChartType((prevType) => (prevType === 'bar' ? 'pie' : 'bar'));
  };

  const pieData = fechamentosFiltrados.map((f) => ({
    name: new Date(f.Data).toLocaleDateString('pt-BR'),
    value: calcularTotal(f.fechamento_diario),
  }));

  // Pagination logic
  const totalPages = Math.ceil(fechamentosFiltrados.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentCards = fechamentosFiltrados.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (carregando) {
    return <Spinner size="lg" />;
  }

  return (
    <>
      <Box
        w={{ base: "49vh", md: "100vh" }}
        maxW="100%"
        px={{ base: 3, md: 6 }}
      >
        <VStack align="stretch" spacing={6} w="100%">
          <HStack spacing={4}>
            <Box>
              <Text fontSize="sm" mb={1} color={textColor}>De</Text>
              <Select
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                bg={bgCard}
              >
                {fechamentos.map((fechamento) => (
                  <option key={fechamento.Id} value={fechamento.Data}>
                    {new Date(fechamento.Data).toLocaleDateString('pt-BR')}
                  </option>
                ))}
              </Select>
            </Box>
            <Box>
              <Text fontSize="sm" mb={1} color={textColor}>A</Text>
              <Select
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                bg={bgCard}
              >
                {fechamentos.map((fechamento) => (
                  <option key={fechamento.Id} value={fechamento.Data}>
                    {new Date(fechamento.Data).toLocaleDateString('pt-BR')}
                  </option>
                ))}
              </Select>
            </Box>
          </HStack>

          {fechamentosFiltrados.length > 0 && (
            <Box h="300px" bg={bgCard} borderRadius="md" p={4}>
              <HStack justify="space-between" mb={4}>
                <Text fontWeight="bold" color={textColor}>Histórico de Totais</Text>
                <Button
                  size="sm"
                  onClick={toggleChartType}
                  colorScheme="blue"
                >
                  {chartType === 'bar' ? 'Ver Pizza' : 'Ver Histograma'}
                </Button>
              </HStack>
              <ResponsiveContainer width="100%" height="80%">
                {chartType === 'bar' ? (
                  <BarChart
                    data={fechamentosFiltrados.map((f) => ({
                      data: formatarMes(f.Data),
                      total: calcularTotal(f.fechamento_diario),
                    }))}
                    margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="data" stroke={labelColor} />
                    <YAxis stroke={labelColor} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a202c', borderRadius: '8px', color: 'white' }}
                      formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Total']}
                    />
                    <Bar
                      dataKey="total"
                      fill={barFillColor}
                      barSize={30}
                    >
                      <LabelList
                        dataKey="total"
                        position="top"
                        formatter={(value) => `R$ ${value.toFixed(2)}`}
                        style={{ fontSize: '12px', fill: labelColor }}
                      />
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a202c', borderRadius: '8px', color: 'white' }}
                      formatter={(value) => `R$ ${value.toFixed(2)}`}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </Box>
          )}

          {fechamentosFiltrados.length === 0 ? (
            <Text color={textColor}>Nenhum fechamento encontrado para o intervalo selecionado.</Text>
          ) : (
            <>
              {currentCards.map((fechamento) => (
                <Box
                  key={fechamento.Id}
                  p={5}
                  bg={bgCard}
                  borderRadius="2xl"
                  boxShadow="lg"
                  cursor="pointer"
                  _hover={{ transform: 'scale(1.02)', transition: '0.2s' }}
                  onClick={() => handleOpenModal(fechamento)}
                >
                  <HStack justify="space-between">
                    <Text fontWeight="bold" color={textColor}>
                      Data: {new Date(fechamento.Data).toLocaleDateString('pt-BR')}
                    </Text>
                    {fechamento.Data === hoje && (
                      <Box as="span" px={2} py={1} bg="blue.100" color="blue.800" fontSize="xs" borderRadius="md">
                        Editável
                      </Box>
                    )}
                  </HStack>
                  <Divider my={2} />
                  <Text fontSize="sm" color="gray.500">
                    Total: R$ {calcularTotal(fechamento.fechamento_diario).toFixed(2)}
                  </Text>
                </Box>
              ))}
              {/* Pagination Controls */}
              {fechamentosFiltrados.length > cardsPerPage && (
                <HStack justify="center" mt={4}>
                  <Button
                    onClick={handlePrevPage}
                    isDisabled={currentPage === 1}
                    colorScheme="blue"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  <Text color={textColor}>
                    Página {currentPage} de {totalPages}
                  </Text>
                  <Button
                    onClick={handleNextPage}
                    isDisabled={currentPage === totalPages}
                    colorScheme="blue"
                    size="sm"
                  >
                    Próxima
                  </Button>
                </HStack>
              )}
            </>
          )}
        </VStack>
      </Box>

      {fechamentoSelecionado && (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Fechamento de {new Date(fechamentoSelecionado.Data).toLocaleDateString('pt-BR')}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {['moedas', 'caixaFrente', 'caixaInterno'].map((categoria) => (
                <Box key={categoria} mb={4}>
                  <Text fontWeight="bold" mb={2}>{categoria.charAt(0).toUpperCase() + categoria.slice(1)}</Text>
                  <SimpleGrid columns={categoria === 'moedas' ? 3 : 2} spacing={2}>
                    {Object.entries(valores?.[categoria] || {}).map(([valor, qtd]) => (
                      <Box key={valor}>
                        <Text>R$ ${parseFloat(valor).toFixed(2)}</Text>
                        <Input
                          type="number"
                          value={qtd}
                          onChange={(e) => handleChange(categoria, valor, parseInt(e.target.value) || 0)}
                          isReadOnly={fechamentoSelecionado.Data !== hoje}
                        />
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              ))}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="green" mr={3} onClick={handleDownloadXLSX}>
                Baixar XLSX
              </Button>
              {fechamentoSelecionado.Data === hoje && (
                <Button colorScheme="blue" onClick={handleSalvar}>
                  Salvar Alterações
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}