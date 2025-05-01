import { useEffect, useState } from 'react';
import {
  Box, Text, Spinner, Table, Thead, Tbody, Tr, Th, Td,
  useColorModeValue, Heading, HStack, Button, VStack, Icon, Select
} from '@chakra-ui/react';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RelatorioAtivacaoVIR() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtroMes, setFiltroMes] = useState('Todos'); // Estado para o filtro
  const itensPorPagina = 10;

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  const formatarDataBR = (data) => {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const obterSituacaoContrato = (situacao) => {
    switch (situacao) {
      case 'A':
        return 'Ativo';
      case 'C':
        return 'Cancelado';
      case 'B':
        return 'Bloqueado';
      case 'I':
        return 'Inativo';
      default:
        return situacao;
    }
  };

  // Função para verificar se a data de início está no mês atual
  const isMesAtual = (dataInicio) => {
    if (!dataInicio) return false;
    const data = new Date(dataInicio);
    const agora = new Date();
    return (
      data.getMonth() === agora.getMonth() &&
      data.getFullYear() === agora.getFullYear()
    );
  };

  // Função para verificar se a data de início está no mês passado
  const isMesPassado = (dataInicio) => {
    if (!dataInicio) return false;
    const data = new Date(dataInicio);
    const agora = new Date();
    const mesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1);
    return (
      data.getMonth() === mesPassado.getMonth() &&
      data.getFullYear() === mesPassado.getFullYear()
    );
  };

  useEffect(() => {
    const buscarDados = async () => {
      setCarregando(true);
      try {
        const res = await fetch('https://apidoixc.nexusnerds.com.br/Data/clientes_ativosVIR.json');
        const json = await res.json();
        setDados(json.clientes || []);
      } catch (error) {
        console.error('Erro ao buscar clientes ativos VIR Telecom:', error);
      } finally {
        setCarregando(false);
      }
    };
    buscarDados();
  }, []);

  // Filtrar os dados com base no filtro selecionado
  const dadosFiltrados = dados.filter(cliente => {
    if (filtroMes === 'Todos') return true;
    if (filtroMes === 'Mês Atual') return isMesAtual(cliente.DATA_INICIO);
    if (filtroMes === 'Mês Passado') return isMesPassado(cliente.DATA_INICIO);
    return false;
  });

  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
  const dadosPaginados = dadosFiltrados.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const exportarXLSX = () => {
    const dadosExportacao = dadosFiltrados.map(cliente => ({
      'Razão Social': cliente.RAZAO_SOCIAL,
      'CPF/CNPJ': cliente.CPF_CNPJ,
      'ID Contrato': cliente.ID_CONTRATO,
      'Situação Contrato': obterSituacaoContrato(cliente.SITUACAO_CONTRATO),
      'Data Início': formatarDataBR(cliente.DATA_INICIO),
      'Data Término': formatarDataBR(cliente.DATA_TERMINO),
      'Dia Vencimento': cliente.DIA_VENCIMENTO,
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AtivadosVIR');
    XLSX.writeFile(wb, `Relatorio_Ativacao_VIR_Telecom_${filtroMes === 'Todos' ? 'Todos' : filtroMes === 'Mês Atual' ? 'Mes_Atual' : 'Mes_Passado'}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ['Razão Social', 'CPF/CNPJ', 'ID Contrato', 'Situação Contrato', 'Data Início', 'Data Término', 'Dia Vencimento'];
    const tableRows = dadosFiltrados.map(cliente => [
      cliente.RAZAO_SOCIAL,
      cliente.CPF_CNPJ,
      cliente.ID_CONTRATO,
      obterSituacaoContrato(cliente.SITUACAO_CONTRATO),
      formatarDataBR(cliente.DATA_INICIO),
      formatarDataBR(cliente.DATA_TERMINO),
      cliente.DIA_VENCIMENTO,
    ]);

    doc.text('Relatório de Ativação - VIR Telecom', 14, 15);
    doc.text(`Filtro: ${filtroMes}`, 14, 25);
    doc.text(`Total de Clientes: ${dadosFiltrados.length}`, 14, 35);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    });
    doc.save(`Relatorio_Ativacao_VIR_Telecom_${filtroMes === 'Todos' ? 'Todos' : filtroMes === 'Mês Atual' ? 'Mes_Atual' : 'Mes_Passado'}.pdf`);
  };

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
        Relatório de Ativação - VIR Telecom
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
            flexDir={{ base: 'column', md: 'row' }}
            justifyContent="space-between"
          >
            <Text
              fontSize={{ base: 'md', md: 'md' }}
              fontWeight={{ base: 'medium', md: 'normal' }}
              color={textColor}
            >
              Total de Clientes: {dadosFiltrados.length}
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
                  setPaginaAtual(1); // Resetar a página ao mudar o filtro
                }}
                display={{ base: 'none', md: 'block' }} // Ocultar no mobile
              >
                <option value="Todos">Todos</option>
                <option value="Mês Atual">Mês Atual</option>
                <option value="Mês Passado">Mês Passado</option>
              </Select>
              <Button
                leftIcon={<Icon as={FaFileExcel} />}
                size={{ base: 'xs', md: 'sm' }}
                colorScheme="green"
                onClick={exportarXLSX}
                w={{ base: 'auto', md: 'auto' }}
              >
                XLSX
              </Button>
              <Button
                leftIcon={<Icon as={FaFilePdf} />}
                size={{ base: 'xs', md: 'sm' }}
                colorScheme="red"
                onClick={exportarPDF}
                w={{ base: 'auto', md: 'auto' }}
              >
                PDF
              </Button>
            </HStack>
          </VStack>

          <Box overflowX="auto">
            <Table variant="simple" size={{ base: 'sm', md: 'md' }} colorScheme="gray">
              <Thead>
                <Tr>
                  <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                    Razão Social
                  </Th>
                  <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                    CPF/CNPJ
                  </Th>
                  <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                    ID Contrato
                  </Th>
                  <Th
                    borderColor={borderColor}
                    color={textColor}
                    fontSize={{ base: 'xs', md: 'sm' }}
                    display={{ base: 'none', md: 'table-cell' }}
                  >
                    Situação Contrato
                  </Th>
                  <Th
                    borderColor={borderColor}
                    color={textColor}
                    fontSize={{ base: 'xs', md: 'sm' }}
                    display={{ base: 'none', md: 'table-cell' }}
                  >
                    Data Início
                  </Th>
                  <Th
                    borderColor={borderColor}
                    color={textColor}
                    fontSize={{ base: 'xs', md: 'sm' }}
                    display={{ base: 'none', md: 'table-cell' }}
                  >
                    Dia Vencimento
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {dadosPaginados.map((cliente, idx) => (
                  <Tr key={idx}>
                    <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                      {cliente.RAZAO_SOCIAL}
                    </Td>
                    <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                      {cliente.CPF_CNPJ}
                    </Td>
                    <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                      {cliente.ID_CONTRATO}
                    </Td>
                    <Td
                      borderColor={borderColor}
                      fontSize={{ base: 'xs', md: 'sm' }}
                      display={{ base: 'none', md: 'table-cell' }}
                    >
                      {obterSituacaoContrato(cliente.SITUACAO_CONTRATO)}
                    </Td>
                    <Td
                      borderColor={borderColor}
                      fontSize={{ base: 'xs', md: 'sm' }}
                      display={{ base: 'none', md: 'table-cell' }}
                    >
                      {formatarDataBR(cliente.DATA_INICIO)}
                    </Td>
                    <Td
                      borderColor={borderColor}
                      fontSize={{ base: 'xs', md: 'sm' }}
                      display={{ base: 'none', md: 'table-cell' }}
                    >
                      {cliente.DIA_VENCIMENTO}
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
                    display={{ base: 'none', md: 'block' }}
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