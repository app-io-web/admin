// src/components/relatorios/RelatorioVendasMes.jsx
import {
  Box, Text, Heading, Tag, Spinner, SimpleGrid, useColorModeValue,
  Select, useDisclosure, HStack, Switch, Flex, VStack, Button 
} from '@chakra-ui/react';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Checkbox
} from '@chakra-ui/react';

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ModalDetalhesVenda from './ModalDetalhesVenda';
import ModalEdicaoVenda from './ModalEdicaoVenda';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function RelatorioVendasMes() {
  const { vendedorId } = useParams();
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [cpfSelecionado, setCpfSelecionado] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalTipo, setModalTipo] = useState('detalhes');
  const [comissaoTotal, setComissaoTotal] = useState('R$ 0,00');
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();

  const [colunasSelecionadas, setColunasSelecionadas] = useState({
    Nome: true,
    CPF: true,
    Plano: true,
    Data: true,
    'Status Contrato': true,
    'Pagou a Taxa': true,
    Comissão: true,
  });

  const [isFirstLoad, setIsFirstLoad] = useState(true);

useEffect(() => {
  let intervalo;

  const buscarDados = async () => {
    try {
      const token = import.meta.env.VITE_NOCODB_TOKEN;

      // 🔍 Buscar dados da tabela de vendedores com classificação
      const vendedoresRes = await fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m3cqlvi5625ahqs/records', {
        headers: { 'Content-Type': 'application/json', 'xc-token': token }
      });
      const vendedoresJson = await vendedoresRes.json();
      const vendedoresData = vendedoresJson?.list?.[0]?.Vendedor || {};

      // 🔍 Buscar classificação com base no nome (não no ID)
      let classificacao = 'Sem classificação';
      for (const key in vendedoresData) {
        const item = vendedoresData[key];
        if (item?.nome?.toLowerCase().trim() === vendedorId.toLowerCase().trim()) {
          classificacao = item?.Classificação || 'Sem classificação';
          break;
        }
      }

      // 🔍 Buscar tabela de comissões
      const comissaoRes = await fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m007s1znd8hpu6r/records', {
        headers: { 'Content-Type': 'application/json', 'xc-token': token }
      });
      const comissaoJson = await comissaoRes.json();
      const tabelaComissoes = comissaoJson?.list?.[0]?.Valores_Comissão?.comissoes || {};

      // 🔍 Demais dados
      const [clientesAtivosJson, contratosJson, controleJson, vendasRes] = await Promise.all([
        fetch('https://apidoixc.nexusnerds.com.br/Data/clientesAtivos.json').then(r => r.json()),
        fetch('https://apidoixc.nexusnerds.com.br/Data/todos_contratos.json').then(r => r.json()),
        fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m8xz7i1uldvt2gr/records', {
          headers: { 'Content-Type': 'application/json', 'xc-token': token }
        }).then(r => r.json()),
        fetch(`https://max.api.email.nexusnerds.com.br/api/vendedores`).then(r => r.json())
      ]);

      const clientesAtivos = clientesAtivosJson.registros;
      const contratos = contratosJson.registros;

      const vendedorURL = vendasRes.find(v => v.vendedor === vendedorId);
      if (!vendedorURL) return;

      const urlCompleta = `https://max.api.email.nexusnerds.com.br${vendedorURL.url}`;
      const vendasJson = await fetch(urlCompleta).then(r => r.json());

      const vendedoresControle = controleJson.list || [];
      const vendedorControle = vendedoresControle.find(v =>
        v.Title?.toLowerCase().trim() === vendedorId.toLowerCase().trim()
      );
      const dadosControle = vendedorControle?.DadosClientesVendedores || {};

      const todasVendas = vendasJson.map((cliente) => {
        const clienteAtivo = clientesAtivos.find(c => c.cnpj_cpf === cliente.cpf);
        const idCliente = clienteAtivo?.id;
        const contrato = contratos.find(c => c.id_cliente === idCliente);
        const status = contrato?.status_internet || '---';
        const data = cliente.dataHora.split(',')[0];

        const dados = dadosControle[cliente.cpf] || {
          Autorizado: 'NEGADO',
          Ativado: 'NÃO',
          Bloqueado: 'NÃO',
          Desistiu: 'NÃO',
          'Pagou Taxa': 'NÃO'
        };

        const ativado = dados.Autorizado?.toUpperCase().trim() === 'APROVADO' || dados.Ativado?.toUpperCase().trim() === 'SIM';
        const bloqueado = dados.Bloqueado?.toUpperCase().trim() === 'SIM' || status !== 'A';
        const pagouTaxa = dados['Pagou Taxa']?.toUpperCase().trim() === 'SIM';
        const desistiu = dados.Desistiu?.toUpperCase().trim() === 'SIM';

        let valorComissao = 0;
        let motivo = '';

        if (desistiu) {
          valorComissao = 0;
          motivo = 'Desistiu';
        } else if (ativado && !bloqueado && pagouTaxa) {
          const valorStr = tabelaComissoes?.[classificacao]?.valor || 'R$ 0,00';
          valorComissao = parseFloat(valorStr.replace('R$', '').replace(',', '.')) || 0;
          motivo = 'Ativado + Pagou Taxa';
        } else if (ativado && !bloqueado) {
          const valorStr = tabelaComissoes?.['Sem Taxa']?.valor || 'R$ 0,00';
          valorComissao = parseFloat(valorStr.replace('R$', '').replace(',', '.')) || 0;
          motivo = 'Ativado sem taxa';
        } else if (ativado && bloqueado) {
          valorComissao = 0;
          motivo = 'Ativado mas bloqueado';
        } else {
          motivo = 'Condições não atendidas';
        }

        return {
          ...cliente,
          vendedor: cliente.vendedor || vendedorId,
          statusContrato: status,
          data,
          valorComissao,
          pagouTaxa,
          motivoComissao: motivo
        };
      });

      const vendasFiltradas = todasVendas.filter(v => v.data.includes(`/${mesSelecionado}/`));
      const total = vendasFiltradas.reduce((acc, v) => acc + v.valorComissao, 0);

      setComissaoTotal(`R$ ${total.toFixed(2).replace('.', ',')}`);
      setVendas(todasVendas);

      if (isFirstLoad) setIsFirstLoad(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  if (vendedorId) {
    buscarDados();
    intervalo = setInterval(buscarDados, 3000);
  }

  return () => clearInterval(intervalo);
}, [vendedorId, mesSelecionado]);


  const traduzirStatus = (codigo) => {
    switch (codigo) {
      case 'A': return { label: 'Ativo', color: 'green' };
      case 'D': return { label: 'Desativado', color: 'gray' };
      case 'CM': return { label: 'Bloq. Manual', color: 'red' };
      case 'CA': return { label: 'Bloq. Automático', color: 'orange' };
      case 'FA': return { label: 'Financeiro', color: 'red' };
      case 'AA': return { label: 'Assinatura', color: 'yellow' };
      default: return { label: '---', color: 'gray' };
    }
  };

  const filtrarPorMes = (lista) => {
    if (!mesSelecionado) return lista;
    return lista.filter(v => v.data.includes(`/${mesSelecionado}/`));
  };

  const dadosFiltrados = filtrarPorMes(vendas);
  const agrupadoPorCPF = dadosFiltrados.reduce((acc, venda) => {
    if (!acc[venda.cpf]) acc[venda.cpf] = [];
    acc[venda.cpf].push(venda);
    return acc;
  }, {});

  const registrosUnicos = Object.entries(agrupadoPorCPF);


const exportarParaExcel = () => {
  if (!vendas.length) return;

  const nomeVendedor = vendas[0]?.vendedor?.replace(/\s+/g, '_') || 'Vendedor';
  const nomeArquivo = `Relatorio_Comissao_${nomeVendedor}_${mesSelecionado}.xlsx`;

  const campos = Object.keys(colunasSelecionadas).filter(c => colunasSelecionadas[c]);

  const headers = campos;
  const dados = dadosFiltrados.map(v => {
    const linha = [];
    campos.forEach(campo => {
      switch (campo) {
        case "Nome": linha.push(v.nome); break;
        case "CPF": linha.push(v.cpf); break;
        case "Plano": linha.push(v.plano); break;
        case "Data": linha.push(v.data); break;
        case "Status Contrato": linha.push(traduzirStatus(v.statusContrato).label); break;
        case "Pagou a Taxa": linha.push(v.pagouTaxa ? "SIM" : "NÃO"); break;
        case "Comissão": linha.push(v.valorComissao); break;
      }
    });
    return linha;
  });

  const totalComissao = campos.includes("Comissão")
    ? dados.reduce((acc, linha) => acc + (linha[campos.indexOf("Comissão")] || 0), 0)
    : null;

  const conteudo = [
    [],
    Array(headers.length).fill(""),
    [`RELATÓRIO DE VENDA MÊS ${mesSelecionado}`],
    headers,
    ...dados
  ];

  if (totalComissao !== null) {
    const totalRow = Array(headers.length).fill("");
    totalRow[headers.length - 2] = "TOTAL:";
    totalRow[headers.length - 1] = totalComissao;
    conteudo.push(totalRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(conteudo);

  // Mesclar célula do título
  ws["!merges"] = [{ s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } }];

  // Largura das colunas
  ws["!cols"] = headers.map(() => ({ wch: 22 }));

  // Estilos
  const styleSim = { fill: { fgColor: { rgb: "C6EFCE" } }, font: { color: { rgb: "006100" } } };
  const styleNao = { fill: { fgColor: { rgb: "FFC7CE" } }, font: { color: { rgb: "9C0006" } } };
  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "A9D08E" } } };
  const titleStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } };

  Object.keys(ws).forEach((cell) => {
    if (!cell.startsWith("!")) {
      const colLetter = cell.replace(/[0-9]/g, '');
      const row = parseInt(cell.replace(/[A-Z]/g, ''));

      // Título
      if (row === 3) ws[cell].s = titleStyle;

      // Cabeçalho
      if (row === 4) ws[cell].s = headerStyle;

      // "Pagou a Taxa" colorido
      const idxPagou = headers.indexOf("Pagou a Taxa");
      if (row > 4 && idxPagou !== -1 && colLetter === String.fromCharCode(65 + idxPagou)) {
        ws[cell].s = ws[cell].v === "SIM" ? styleSim : styleNao;
      }

      // TOTAL
      if (
        totalComissao !== null &&
        row === 5 + dados.length &&
        colLetter === String.fromCharCode(65 + headers.length - 2)
      ) {
        ws[cell].s = { font: { bold: true } };
      }
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Comissões");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
  const blob = new Blob([buf], { type: "application/octet-stream" });
  saveAs(blob, nomeArquivo);
};


  return (
    <Box p={4}>
      <VStack align="flex-start" mb={4} spacing={2}>
        <Heading fontSize="2xl">Vendas - {vendedorId}</Heading>
        <Flex gap={4} align="center" flexWrap="wrap">
          <Select
            placeholder="Filtrar por Mês"
            maxW="200px"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
          >
            {[...Array(12)].map((_, i) => (
              <option key={i} value={String(i + 1).padStart(2, '0')}>
                {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
              </option>
            ))}
          </Select>
          <Text fontWeight="bold">💰 {comissaoTotal}</Text>
          <HStack>
            <Text fontSize="sm">Modo Edição</Text>
            <Switch
              colorScheme="teal"
              isChecked={modoEdicao}
              onChange={(e) => setModoEdicao(e.target.checked)}
            />
          </HStack>
          <Button colorScheme="green" size="sm" onClick={openModal}>
            📤 Exportar XLSX
          </Button>

        </Flex>
      </VStack>

      {carregando ? (
        <Spinner size="lg" />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {registrosUnicos.map(([cpf, registros]) => {
            const venda = registros[0];
            const status = traduzirStatus(venda.statusContrato);
            return (
              <Box
                key={cpf}
                p={4}
                shadow="md"
                borderWidth="1px"
                borderRadius="md"
                bg={useColorModeValue('white', 'gray.800')}
                cursor="pointer"
                onClick={() => {
                  setCpfSelecionado(registros);
                  setModalTipo(modoEdicao ? 'edicao' : 'detalhes');
                  onOpen();
                }}
              >
                <Text fontWeight="bold">{venda.nome}</Text>
                <Text fontSize="sm">CPF: {venda.cpf}</Text>
                <Text fontSize="sm">Plano: {venda.plano}</Text>
                <Text fontSize="sm">Data: {venda.dataHora}</Text>
                <HStack spacing={2} mt={2} wrap="wrap">
                  <Tag colorScheme={status.color}>{status.label}</Tag>
                  {(() => {
                    const hoje = new Date().toISOString().split('T')[0];
                    const [dia, mes, ano] = venda.dataHora.split(',')[0].split('/');
                    const dataVenda = new Date(`${ano}-${mes}-${dia}`).toISOString().split('T')[0];
                    return dataVenda === hoje ? (
                      <Tag colorScheme="purple">Nova Venda</Tag>
                    ) : null;
                  })()}
                </HStack>


              </Box>
            );
          })}
        </SimpleGrid>
      )}

      {modalTipo === 'edicao' ? (
        <ModalEdicaoVenda
          isOpen={isOpen}
          onClose={onClose}
          registros={cpfSelecionado || []}
        />
      ) : (
        <ModalDetalhesVenda
          isOpen={isOpen}
          onClose={onClose}
          registros={cpfSelecionado || []}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Selecionar Colunas</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start">
              {Object.keys(colunasSelecionadas).map((coluna) => (
                <Checkbox
                  key={coluna}
                  isChecked={colunasSelecionadas[coluna]}
                  onChange={(e) =>
                    setColunasSelecionadas((prev) => ({
                      ...prev,
                      [coluna]: e.target.checked,
                    }))
                  }
                >
                  {coluna}
                </Checkbox>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={() => {
              closeModal();
              exportarParaExcel();
            }}>
              Exportar
            </Button>
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}