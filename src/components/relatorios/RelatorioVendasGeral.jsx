import {
  Box, Heading, Spinner, Text, Select, SimpleGrid, Tag, VStack, Button
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ModalDetalhesVenda from './ModalDetalhesVenda';
import ModalEdicaoVenda from './ModalEdicaoVenda';
import { useDisclosure } from '@chakra-ui/react';
import ModalExportarXlsx from './ModalExportarXlsx';


export default function RelatorioVendasGeral() {
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [comissaoTotal, setComissaoTotal] = useState(0);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [modoModal, setModoModal] = useState('detalhes'); // 'detalhes' ou 'edicao'
  const [paginaAtual, setPaginaAtual] = useState(1);
  const vendasPorPagina = 9;



  const {
  isOpen: isModalOpen,
  onOpen: abrirModal,
  onClose: fecharModal
} = useDisclosure();

const {
  isOpen: isExportModalOpen,
  onOpen: abrirExportModal,
  onClose: fecharExportModal
} = useDisclosure();


useEffect(() => {
  const buscarTodasVendas = async () => {
    setCarregando(true);
    try {
      const [vendedoresRes, clientesRes, contratosRes, controleRes, comissoesRes, classificacaoRes] = await Promise.all([
        fetch('https://max.api.email.nexusnerds.com.br/api/vendedores'),
        fetch('https://apidoixc.nexusnerds.com.br/Data/clientesAtivos.json'),
        fetch('https://apidoixc.nexusnerds.com.br/Data/todos_contratos.json'),
        fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m8xz7i1uldvt2gr/records', {
          headers: {
            'Content-Type': 'application/json',
            'xc-token': import.meta.env.VITE_NOCODB_TOKEN
          }
        }),
        fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m007s1znd8hpu6r/records', {
          headers: { 'Content-Type': 'application/json', 'xc-token': import.meta.env.VITE_NOCODB_TOKEN }
        }),
        fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m3cqlvi5625ahqs/records', {
          headers: { 'Content-Type': 'application/json', 'xc-token': import.meta.env.VITE_NOCODB_TOKEN }
        })
      ]);

      const vendedores = await vendedoresRes.json();
      const clientesAtivos = (await clientesRes.json()).registros;
      const contratos = (await contratosRes.json()).registros;
      const dadosControle = (await controleRes.json()).list?.[0]?.DadosClientesVendedores || {};
      const comissoesTabela = (await comissoesRes.json()).list?.[0]?.Valores_Comissão?.comissoes || {};
      const vendedoresClassificacoes = (await classificacaoRes.json()).list?.[0]?.Vendedor || {};

      let todasAsVendas = [];

      for (const vendedor of vendedores) {
        const url = `https://max.api.email.nexusnerds.com.br${vendedor.url}`;
        const res = await fetch(url);
        const vendasVendedor = await res.json();

        const classificacao = (() => {
          const chave = Object.keys(vendedoresClassificacoes).find(k =>
            vendedoresClassificacoes[k].nome?.toLowerCase().trim() === vendedor.vendedor?.toLowerCase().trim()
          );
          return vendedoresClassificacoes[chave]?.Classificação || 'Padrão';
        })();

        const valorComTaxa = parseFloat((comissoesTabela?.[classificacao]?.valor || '0').replace('R$', '').replace(',', '.'));
        const valorSemTaxa = parseFloat((comissoesTabela?.['Sem Taxa']?.valor || '0').replace('R$', '').replace(',', '.'));

        vendasVendedor.forEach((cliente) => {
          const clienteAtivo = clientesAtivos.find(c => c.cnpj_cpf === cliente.cpf);
          const idCliente = clienteAtivo?.id;
          const contrato = contratos.find(c => c.id_cliente === idCliente);
          const status = contrato?.status_internet || '---';
          const data = cliente.dataHora.split(',')[0];

          const dados = dadosControle[cliente.cpf] || {};
          const ativado = (dados.Autorizado === 'APROVADO' || dados.Ativado === 'SIM' || dados['Ativado'] === 'SIM');
          const bloqueado = (dados.Bloqueado === 'SIM' || dados['Bloqueado'] === 'SIM' || status !== 'A');
          const pagouTaxa = (dados['Pagou Taxa'] === 'SIM' || String(dados['Pagou Taxa']).toUpperCase().trim() === 'SIM');
          const desistiu = (dados.Desistiu === 'SIM' || dados['Desistiu'] === 'SIM' || dados.Desistiu === 'S' || dados['Desistiu'] === 'S');

          let valorComissao = 0;
          if (desistiu || (ativado && bloqueado)) valorComissao = 0;
          else if (ativado && pagouTaxa) valorComissao = valorComTaxa;
          else if (ativado) valorComissao = valorSemTaxa;

          todasAsVendas.push({ ...cliente, vendedor: vendedor.vendedor, valorComissao, statusContrato: status, data });
        });
      }

      setVendas(todasAsVendas);
    } catch (err) {
      console.error('Erro ao buscar vendas gerais:', err);
    } finally {
      setCarregando(false);
    }
  };

  buscarTodasVendas();
}, []);



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


  const vendasFiltradas = vendas.filter(v => v.data?.includes(`/${mesSelecionado}/`));
  const totalPaginas = Math.ceil(vendasFiltradas.length / vendasPorPagina);
  const vendasPaginadas = vendasFiltradas.slice(
    (paginaAtual - 1) * vendasPorPagina,
    paginaAtual * vendasPorPagina
  );

  useEffect(() => {
    const total = vendasFiltradas.reduce((acc, v) => acc + (v.valorComissao || 0), 0);
    setComissaoTotal(total);
  }, [vendasFiltradas]);

const exportarExcelComOpcoes = (options) => {
  const dadosFiltrados = vendasFiltradas.filter(v => {
    if (options.excluirNaoEncontrados && v.statusContrato === '---') return false;
    if (options.excluirBloqueados && v.statusContrato !== 'A') return false;
    if (options.excluirStatusIndefinido && (!v.statusContrato || v.statusContrato === '---')) return false;
    return true;
  });

  const vendedores = [...new Set(dadosFiltrados.map(v => v.vendedor))];
  const wb = XLSX.utils.book_new();
  let allRows = [["RELATÓRIO GERAL MÊS " + mesSelecionado.padStart(2, '0')]];

  const statusMap = {
    'A': 'Ativo',
    'D': 'Desativado',
    'CM': 'Bloq. Manual',
    'CA': 'Bloq. Automático',
    'FA': 'Financeiro',
    'AA': 'Assinatura',
    '---': 'Indefinido',
  };

  let boldRows = new Set();
  let rowIndex = 1; // Começa na linha 2 (0-indexed)

  vendedores.forEach(vend => {
    allRows.push([]);
    rowIndex++;

    allRows.push([`📌 Vendedor: ${vend}`]);
    boldRows.add(rowIndex++);
    
    const header = ["Nome", "Data", "Vendedor"];
    if (options.exportarStatus) header.push("Status");
    if (options.exportarCPF) header.push("CPF");
    if (options.exportarPlano) header.push("Plano");
    header.push("Comissão");

    allRows.push(header);
    boldRows.add(rowIndex++);

    const vendasDoVendedor = dadosFiltrados.filter(v => v.vendedor === vend);
    let total = 0;

    vendasDoVendedor.forEach(v => {
      const row = [
        v.nome,
        v.dataHora,
        v.vendedor
      ];
      if (options.exportarStatus) row.push(statusMap[v.statusContrato] || 'Indefinido');
      if (options.exportarCPF) row.push(v.cpf);
      if (options.exportarPlano) row.push(v.plano);
      row.push(v.valorComissao || 0);
      total += v.valorComissao || 0;
      allRows.push(row);
      rowIndex++;
    });

    allRows.push([]);
    rowIndex++;

    const totalRow = ["", "", "", "", "", "Total:", total];
    allRows.push(totalRow);
    boldRows.add(rowIndex++);
  });

  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Auto ajuste de colunas
  const colWidths = allRows.reduce((acc, row) => {
    row.forEach((cell, i) => {
      const len = String(cell || '').length;
      acc[i] = Math.max(acc[i] || 10, len + 2);
    });
    return acc;
  }, []);
  ws['!cols'] = colWidths.map(w => ({ wch: w }));

  // Mesclar título (A1:G1)
  const colSpan = colWidths.length;
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: colSpan - 1 } }];

  // Aplicar negrito e alinhamento ao título
  ws['A1'].s = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: "center" }
  };

  // Aplicar negrito às linhas mapeadas
  Object.keys(ws).forEach(cell => {
    const match = cell.match(/([A-Z]+)([0-9]+)/);
    if (!match) return;
    const [, col, row] = match;
    const rowNum = parseInt(row, 10) - 1;
    if (boldRows.has(rowNum)) {
      ws[cell].s = {
        font: { bold: true },
        alignment: { horizontal: "left" }
      };
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, "RelatorioGeral");
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx', cellStyles: true });
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  saveAs(blob, `Relatorio_Geral_Mes_${mesSelecionado}.xlsx`);
};







return (
  <Box p={6}>
    <Heading size="lg" mb={4}>Relatório Geral de Vendas</Heading>

    <Box mb={4} display="flex" gap={4} alignItems="center">
      <Select
        maxW="200px"
        value={mesSelecionado}
          onChange={(e) => {
            setMesSelecionado(e.target.value);
            setPaginaAtual(1);
          }}
      >
        {[...Array(12)].map((_, i) => (
          <option key={i} value={String(i + 1).padStart(2, '0')}>
            {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
          </option>
        ))}
      </Select>

      <Text fontWeight="bold">💰 Total: R$ {comissaoTotal.toFixed(2).replace('.', ',')}</Text>
      <Button onClick={abrirExportModal} colorScheme="green">Exportar XLSX</Button>
    </Box>

    {carregando ? <Spinner size="lg" /> : (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {vendasPaginadas.map((v, i) => (
          <Box key={i} p={4} borderWidth="1px" borderRadius="md" boxShadow="sm">
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">{v.nome}</Text>
              <Text fontSize="sm">CPF: {v.cpf}</Text>
              <Text fontSize="sm">Plano: {v.plano}</Text>
              <Text fontSize="sm">Data: {v.dataHora}</Text>
              <Text fontSize="sm">Vendedor: {v.vendedor}</Text>

              {(() => {
                const status = traduzirStatus(v.statusContrato);
                return (
                  <Tag size="sm" colorScheme={status.color}>
                    {status.label}
                  </Tag>
                );
              })()}

              <Tag mt={1} colorScheme="blue">Comissão: R$ {v.valorComissao || 0}</Tag>

              <Box pt={2}>
                <Button size="xs" mr={2} colorScheme="teal" onClick={() => {
                  setVendaSelecionada([v]);
                  setModoModal('detalhes');
                  abrirModal();
                }}>
                  Ver Detalhes
                </Button>
                <Button size="xs" colorScheme="blue" variant="outline" onClick={() => {
                  setVendaSelecionada([v]);
                  setModoModal('edicao');
                  abrirModal();
                }}>
                  Editar
                </Button>
              </Box>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
      
    )}

      {totalPaginas > 1 && (
        <Box mt={4} display="flex" justifyContent="center" alignItems="center" gap={4}>
          <Button
            size="sm"
            onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
            isDisabled={paginaAtual === 1}
          >
            ← Anterior
          </Button>

          <Text fontSize="sm">Página {paginaAtual} de {totalPaginas}</Text>

          <Button
            size="sm"
            onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
            isDisabled={paginaAtual === totalPaginas}
          >
            Próxima →
          </Button>
        </Box>
      )}


    {modoModal === 'detalhes' ? (
      <ModalDetalhesVenda
        isOpen={isModalOpen}
        onClose={fecharModal}
        registros={vendaSelecionada || []}
      />
    ) : (
      <ModalEdicaoVenda
        isOpen={isModalOpen}
        onClose={fecharModal}
        registros={vendaSelecionada || []}
      />
    )}

    <ModalExportarXlsx
      isOpen={isExportModalOpen}
      onClose={fecharExportModal}
      onConfirm={exportarExcelComOpcoes}
    />

  </Box>
);

}