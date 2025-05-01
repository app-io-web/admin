import { useEffect, useState } from 'react';
import {
  Box,
  Text,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Heading,
  Button,
  HStack,
  VStack,
  Select,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RelatorioBloqueados({ empresaSelecionada }) {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [contagem, setContagem] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const buscarDados = async () => {
      setCarregando(true);
      try {
        if (empresaSelecionada === 'Max Fibra') {
          const resClientes = await fetch('https://apidoixc.nexusnerds.com.br/data/ClientesBloquados.json');
          const clientes = await resClientes.json();

          const resContagem = await fetch('https://apidoixc.nexusnerds.com.br/data/contagem_Bloqueados_filtrada.json');
          const { count } = await resContagem.json();

          setDados(clientes);
          setContagem(count);
        } else if (empresaSelecionada === 'Vir Telecom') {
          const resVir = await fetch('https://apidoixc.nexusnerds.com.br/data/clientes_bloqueados_atualizado.json');
          const json = await resVir.json();
          setDados(json.clientes || []);
          setContagem(json.quantidade || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar bloqueados:', error);
      } finally {
        setCarregando(false);
      }
    };

    if (empresaSelecionada) {
      buscarDados();
    }
  }, [empresaSelecionada]);

  const totalPaginas = Math.ceil(contagem / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const dadosPaginados = dados.slice(indiceInicial, indiceFinal);

  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      setPaginaAtual(novaPagina);
    }
  };

  const obterPreviaEndereco = (endereco) => {
    if (!endereco) return '-';
    return endereco.length > 15 ? `${endereco.slice(0, 15)}...` : endereco;
  };

  const exportarXLSX = () => {
    const dadosExportacao = dados.map((cliente) => {
      if (empresaSelecionada === 'Max Fibra') {
        return {
          'ID Cliente': cliente.id_cliente,
          Nome: cliente.razao,
          Endereço: cliente.endereco,
          'Telefone Celular': cliente.telefone_celular,
          'Telefone Comercial': cliente.telefone_comercial,
        };
      } else {
        return {
          Nome: cliente.RAZAO_SOCIAL,
          Telefone: cliente.telefone,
          Contrato: cliente.ID_CONTRATO,
          Início: cliente.DATA_INICIO,
          Término: cliente.DATA_TERMINO,
        };
      }
    });

    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bloqueados');
    XLSX.writeFile(wb, `Relatorio_Bloqueados_${empresaSelecionada}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const tableColumn = empresaSelecionada === 'Max Fibra'
      ? ['ID Cliente', 'Nome', 'Endereço', 'Telefone Celular', 'Telefone Comercial']
      : ['Nome', 'Telefone', 'Contrato', 'Início', 'Término'];

    const tableRows = dados.map((cliente) => {
      if (empresaSelecionada === 'Max Fibra') {
        return [
          cliente.id_cliente,
          cliente.razao,
          cliente.endereco,
          cliente.telefone_celular,
          cliente.telefone_comercial || '-',
        ];
      } else {
        return [
          cliente.RAZAO_SOCIAL,
          cliente.telefone,
          cliente.ID_CONTRATO,
          cliente.DATA_INICIO,
          cliente.DATA_TERMINO,
        ];
      }
    });

    doc.text(`Relatório de Bloqueados (${empresaSelecionada})`, 14, 15);
    doc.text(`Total de Bloqueados: ${contagem}`, 14, 25);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    });

    doc.save(`Relatorio_Bloqueados_${empresaSelecionada}.pdf`);
  };

  return (
    <Box
      bg={bg}
      p={{ base: 4, md: 6 }}
      borderRadius="lg"
      boxShadow="md"
      borderWidth="1px"
      borderColor={borderColor}
      pb={{ base: 8, md: 16 }} // Aumentado no desktop para 16px (1rem)
    >
      <Heading fontSize="xl" mb={4} color={textColor}>
        Relatório de Bloqueados ({empresaSelecionada})
      </Heading>

      {carregando ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="blue.500" />
        </Box>
      ) : (
        <>
          <Box mb={4}>
            <VStack
              alignItems={{ base: 'flex-start', md: 'center' }}
              justifyContent="space-between"
              spacing={{ base: 2, md: 0 }}
              direction={{ base: 'column', md: 'row' }}
            >
              <Text fontSize="lg" fontWeight="medium" color={textColor}>
                Total de Bloqueados: {contagem}
              </Text>
              <HStack spacing={2}>
                <Button
                  leftIcon={<Icon as={FaFileExcel} />}
                  colorScheme="green"
                  size={{ base: 'xs', md: 'sm' }}
                  onClick={exportarXLSX}
                >
                  Exportar XLSX
                </Button>
                <Button
                  leftIcon={<Icon as={FaFilePdf} />}
                  colorScheme="red"
                  size={{ base: 'xs', md: 'sm' }}
                  onClick={exportarPDF}
                >
                  Exportar PDF
                </Button>
              </HStack>
            </VStack>
          </Box>

          <Box overflowX="auto">
            <Table variant="simple" size={{ base: 'sm', md: 'md' }} colorScheme="gray">
              <Thead>
                <Tr>
                  {empresaSelecionada === 'Max Fibra' ? (
                    <>
                      <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                        ID Cliente
                      </Th>
                      <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                        Nome
                      </Th>
                      <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                        Endereço
                      </Th>
                      <Th
                        borderColor={borderColor}
                        color={textColor}
                        fontSize={{ base: 'xs', md: 'sm' }}
                        display={{ base: 'none', md: 'table-cell' }}
                      >
                        Telefone Celular
                      </Th>
                      <Th
                        borderColor={borderColor}
                        color={textColor}
                        fontSize={{ base: 'xs', md: 'sm' }}
                        display={{ base: 'none', md: 'table-cell' }}
                      >
                        Telefone Comercial
                      </Th>
                    </>
                  ) : (
                    <>
                      <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                        Nome
                      </Th>
                      <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                        Telefone
                      </Th>
                      <Th borderColor={borderColor} color={textColor} fontSize={{ base: 'xs', md: 'sm' }}>
                        Contrato
                      </Th>
                      <Th
                        borderColor={borderColor}
                        color={textColor}
                        fontSize={{ base: 'xs', md: 'sm' }}
                        display={{ base: 'none', md: 'table-cell' }}
                      >
                        Início
                      </Th>
                      <Th
                        borderColor={borderColor}
                        color={textColor}
                        fontSize={{ base: 'xs', md: 'sm' }}
                        display={{ base: 'none', md: 'table-cell' }}
                      >
                        Término
                      </Th>
                    </>
                  )}
                </Tr>
              </Thead>
              <Tbody>
                {dadosPaginados.map((cliente, idx) => (
                  <Tr key={idx} _hover={{ bg: hoverBg, transition: 'background 0.2s' }}>
                    {empresaSelecionada === 'Max Fibra' ? (
                      <>
                        <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                          {cliente.id_cliente}
                        </Td>
                        <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                          {cliente.razao}
                        </Td>
                        <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                          <Tooltip label={cliente.endereco || '-'} placement="top">
                            <Text as="span" cursor="pointer">
                              {obterPreviaEndereco(cliente.endereco)}
                            </Text>
                          </Tooltip>
                        </Td>
                        <Td
                          borderColor={borderColor}
                          fontSize={{ base: 'xs', md: 'sm' }}
                          display={{ base: 'none', md: 'table-cell' }}
                        >
                          {cliente.telefone_celular || '-'}
                        </Td>
                        <Td
                          borderColor={borderColor}
                          fontSize={{ base: 'xs', md: 'sm' }}
                          display={{ base: 'none', md: 'table-cell' }}
                        >
                          {cliente.telefone_comercial || '-'}
                        </Td>
                      </>
                    ) : (
                      <>
                        <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                          {cliente.RAZAO_SOCIAL}
                        </Td>
                        <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                          {cliente.telefone}
                        </Td>
                        <Td borderColor={borderColor} fontSize={{ base: 'xs', md: 'sm' }}>
                          {cliente.ID_CONTRATO}
                        </Td>
                        <Td
                          borderColor={borderColor}
                          fontSize={{ base: 'xs', md: 'sm' }}
                          display={{ base: 'none', md: 'table-cell' }}
                        >
                          {cliente.DATA_INICIO}
                        </Td>
                        <Td
                          borderColor={borderColor}
                          fontSize={{ base: 'xs', md: 'sm' }}
                          display={{ base: 'none', md: 'table-cell' }}
                        >
                          {cliente.DATA_TERMINO}
                        </Td>
                      </>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          {contagem > itensPorPagina && (
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
                    onClick={() => mudarPagina(paginaAtual - 1)}
                    isDisabled={paginaAtual === 1}
                  >
                    Anterior
                  </Button>
                  <Text color={textColor} fontSize={{ base: 'sm', md: 'md' }}>
                    Página {paginaAtual} de {totalPaginas}
                  </Text>
                  <Button
                    size={{ base: 'xs', md: 'sm' }}
                    onClick={() => mudarPagina(paginaAtual + 1)}
                    isDisabled={paginaAtual === totalPaginas}
                  >
                    Próxima
                  </Button>
                </HStack>
                <HStack spacing={2}>
                  <Text color={textColor} fontSize={{ base: 'sm', md: 'md' }}>
                    Itens por página:
                  </Text>
                  <Select
                    size={{ base: 'xs', md: 'sm' }}
                    width={{ base: '80px', md: '100px' }}
                    value={itensPorPagina}
                    onChange={(e) => {
                      setItensPorPagina(Number(e.target.value));
                      setPaginaAtual(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </Select>
                </HStack>
              </HStack>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}