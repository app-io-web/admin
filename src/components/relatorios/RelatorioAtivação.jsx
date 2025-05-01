import { useEffect, useState } from 'react';
import {
  Box, Text, Spinner, Table, Thead, Tbody, Tr, Th, Td,
  useColorModeValue, Heading, HStack, Select, Button, Tag, TagLabel, Icon, VStack
} from '@chakra-ui/react';
import { FaFileExcel, FaFilePdf, FaChartBar, FaEyeSlash } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RelatorioAtivados({ empresaSelecionada }) {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroMes, setFiltroMes] = useState('Todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mostrarGrafico, setMostrarGrafico] = useState(true);
  const itensPorPagina = 10;

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  const formatarDataBR = (data) => {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  useEffect(() => {
    const buscarDados = async () => {
      setCarregando(true);
      try {
        const res = await fetch('https://apidoixc.nexusnerds.com.br/Data/Mês_AtivaçãoCliente.json');
        const json = await res.json();
        setDados(json.clientes || []);
      } catch (error) {
        console.error('Erro ao buscar ativados:', error);
      } finally {
        setCarregando(false);
      }
    };
    buscarDados();
  }, []);

  const dadosFiltrados = dados.filter(cliente =>
    filtroMes === 'Todos' || cliente.mes_ativacao === filtroMes
  );

  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
  const dadosPaginados = dadosFiltrados.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const totalBloqueados = dadosFiltrados.filter(cliente => cliente.bloqueado === 'Sim').length;

  const obterTagBloqueado = (bloqueado) => (
    bloqueado === 'Sim' ? (
      <Tag size="sm" colorScheme="red" variant="solid">
        <TagLabel>Bloqueado</TagLabel>
      </Tag>
    ) : null
  );

  const exportarXLSX = () => {
    const dadosExportacao = dadosFiltrados.map(cliente => ({
      Nome: cliente.nome_cliente,
      Vendedor: cliente.vendedor_responsavel,
      'Data Ativação': formatarDataBR(cliente.data_ativacao),
      'Mês Ativação': cliente.mes_ativacao,
      Bloqueado: cliente.bloqueado
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ativados');
    XLSX.writeFile(wb, `Relatorio_Ativados_${empresaSelecionada}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['Nome', 'Vendedor', 'Data Ativação', 'Mês Ativação', 'Bloqueado'];
    const tableRows = dadosFiltrados.map(cliente => [
      cliente.nome_cliente,
      cliente.vendedor_responsavel,
      formatarDataBR(cliente.data_ativacao),
      cliente.mes_ativacao,
      cliente.bloqueado
    ]);

    doc.text(`Relatório de Ativados (${empresaSelecionada})`, 14, 15);
    doc.text(`Filtro: ${filtroMes}`, 14, 25);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    });
    doc.save(`Relatorio_Ativados_${empresaSelecionada}.pdf`);
  };

  const dadosGrafico = [
    {
      nome: 'Mês Passado',
      Ativados: dados.filter(c => c.mes_ativacao === 'Mês Passado').length,
      Bloqueados: dados.filter(c => c.mes_ativacao === 'Mês Passado' && c.bloqueado === 'Sim').length,
    },
    {
      nome: 'Neste Mês',
      Ativados: dados.filter(c => c.mes_ativacao === 'Neste Mês').length,
      Bloqueados: dados.filter(c => c.mes_ativacao === 'Neste Mês' && c.bloqueado === 'Sim').length,
    },
  ];

  return (
    <Box
      bg={bg}
      p={{ base: 3, md: 6 }}
      borderRadius="lg"
      boxShadow="md"
      borderWidth="1px"
      borderColor={borderColor}
      pb={{ base: 8, md: 16 }}
    >
      <Heading fontSize={{ base: 'lg', md: 'xl' }} mb={4} color={textColor}>
        Relatório de Ativados ({empresaSelecionada})
      </Heading>

      {carregando ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="blue.500" />
        </Box>
      ) : (
        <>
          <VStack
            mb={4}
            spacing={{ base: 2, md: 3 }}
            align="stretch"
            display={{ base: 'flex', md: 'flex' }}
            flexDir={{ base: 'column', md: 'row' }}
            justifyContent="space-between"
          >
            <Text
              fontSize={{ base: 'md', md: 'md' }}
              fontWeight={{ base: 'medium', md: 'normal' }}
              color={textColor}
            >
              Total Geral: {dadosFiltrados.length} | Bloqueados: {totalBloqueados}
            </Text>
            <HStack
              flexWrap="wrap"
              spacing={{ base: 2, md: 3 }}
              justifyContent={{ base: 'center', md: 'flex-end' }}
              alignItems="center"
            >
              <Select
                width={{ base: '100%', sm: '150px' }}
                size="sm"
                value={filtroMes}
                onChange={(e) => {
                  setFiltroMes(e.target.value);
                  setPaginaAtual(1);
                }}
                display={{ base: 'none', md: 'block' }} // Ocultar no mobile
              >
                <option value="Todos">Todos</option>
                <option value="Mês Passado">Mês Passado</option>
                <option value="Neste Mês">Neste Mês</option>
              </Select>
              <Button
                leftIcon={<Icon as={FaFileExcel} />}
                size={{ base: 'xs', md: 'sm' }}
                colorScheme="green"
                onClick={exportarXLSX}
                w={{ base: 'auto', md: 'auto' }}
              >
                Exportar XLSX
              </Button>
              <Button
                leftIcon={<Icon as={FaFilePdf} />}
                size={{ base: 'xs', md: 'sm' }}
                colorScheme="red"
                onClick={exportarPDF}
                w={{ base: 'auto', md: 'auto' }}
              >
                Exportar PDF
              </Button>
              <Button
                leftIcon={<Icon as={mostrarGrafico ? FaEyeSlash : FaChartBar} />}
                size={{ base: 'xs', md: 'sm' }}
                onClick={() => setMostrarGrafico(!mostrarGrafico)}
                w={{ base: 'auto', md: 'auto' }}
              >
                {mostrarGrafico ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
              </Button>
            </HStack>
          </VStack>

          {mostrarGrafico && (
            <Box w="100%" h={{ base: '200px', md: '300px' }} mb={4}>
              <ResponsiveContainer>
                <BarChart data={dadosGrafico}>
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Ativados" fill="#3182ce" />
                  <Bar dataKey="Bloqueados" fill="#e53e3e" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}

          <Box overflowX="auto">
            <Table variant="simple" size={{ base: 'sm', md: 'md' }} colorScheme="gray">
              <Thead>
                <Tr>
                  <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                    Nome
                  </Th>
                  <Th
                    borderColor={borderColor}
                    color={textColor}
                    fontSize={{ base: 'xs', md: 'sm' }}
                    display={{ base: 'none', md: 'table-cell' }}
                  >
                    Vendedor
                  </Th>
                  <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                    Data Ativação
                  </Th>
                  <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                    Mês Ativação
                  </Th>
                  <Th
                    borderColor={borderColor}
                    color={textColor}
                    fontSize={{ base: 'xs', md: 'sm' }}
                    display={{ base: 'none', md: 'table-cell' }}
                  >
                    Status
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {dadosPaginados.map((cliente, idx) => (
                  <Tr key={idx}>
                    <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                      {cliente.nome_cliente}
                    </Td>
                    <Td
                      borderColor={borderColor}
                      fontSize={{ base: 'xs', md: 'sm' }}
                      display={{ base: 'none', md: 'table-cell' }}
                    >
                      {cliente.vendedor_responsavel}
                    </Td>
                    <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                      {formatarDataBR(cliente.data_ativacao)}
                    </Td>
                    <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                      {cliente.mes_ativacao}
                    </Td>
                    <Td
                      borderColor={borderColor}
                      fontSize={{ base: 'xs', md: 'sm' }}
                      display={{ base: 'none', md: 'table-cell' }}
                    >
                      {obterTagBloqueado(cliente.bloqueado)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          {dadosFiltrados.length > itensPorPagina && (
            <Box mt={4}>
              <HStack
                justifyContent="space-between"
                alignItems="center"
                flexDirection={{ base: 'column', md: 'row' }}
                spacing={{ base: 2, md: 0 }}
              >
                <HStack spacing={2}>
                  <Button
                    size={{ base: 'xs', md: 'sm' }}
                    onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))}
                    isDisabled={paginaAtual === 1}
                    w={{ base: 'auto', md: 'auto' }}
                  >
                    Anterior
                  </Button>
                  <Text
                    color={textColor}
                    fontSize={{ base: 'sm', md: 'md' }}
                    display={{ base: 'none', md: 'block' }} // Ocultar no mobile
                  >
                    Página {paginaAtual} de {totalPaginas}
                  </Text>
                  <Button
                    size={{ base: 'xs', md: 'sm' }}
                    onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))}
                    isDisabled={paginaAtual === totalPaginas}
                    w={{ base: 'auto', md: 'auto' }}
                  >
                    Próxima
                  </Button>
                </HStack>
              </HStack>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}