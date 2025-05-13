import { Box, Heading, SimpleGrid, Card, CardHeader, CardBody, Spinner, Select, VStack, useColorMode, useColorModeValue } from '@chakra-ui/react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { useEffect, useState } from 'react';

const GraficoDashboardVendas = () => {
  const { colorMode } = useColorMode();
  const [carregando, setCarregando] = useState(true);
  const [porMes, setPorMes] = useState([]);
  const [porPlano, setPorPlano] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [bloqueados, setBloqueados] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0')); // Inicia no mês atual (05 para maio)

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const token = import.meta.env.VITE_NOCODB_TOKEN;

        const [clientesAtivosJson, contratosJson, controleJson, vendasRes] = await Promise.all([
          fetch('https://apidoixc.nexusnerds.com.br/Data/clientesAtivos.json').then(r => r.json()),
          fetch('https://apidoixc.nexusnerds.com.br/Data/todos_contratos.json').then(r => r.json()),
          fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m8xz7i1uldvt2gr/records', {
            headers: { 'Content-Type': 'application/json', 'xc-token': token }
          }).then(r => r.json()),
          fetch('https://max.api.email.nexusnerds.com.br/api/vendedores').then(r => r.json())
        ]);

        const clientesAtivos = clientesAtivosJson.registros;
        const contratos = contratosJson.registros;
        const vendedoresControle = controleJson.list || [];
        const vendedores = vendasRes;

        const meses = Array.from({ length: 12 }, (_, i) => ({
          mes: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }),
          quantidade: 0
        }));
        const planosMap = {};
        const rankingMap = {};
        const bloqueiosMap = {};

        for (const vendedor of vendedores) {
          const url = `https://max.api.email.nexusnerds.com.br${vendedor.url}`;
          const vendasRes = await fetch(url);
          const vendas = await vendasRes.json();

          const vendasFiltradas = mesSelecionado === "todos" 
            ? vendas 
            : vendas.filter(venda => {
                const [dia, mes] = venda.dataHora?.split(',')[0].split('/') || [];
                return mes === mesSelecionado;
              });

          for (const venda of vendasFiltradas) {
            const [dia, mes] = venda.dataHora?.split(',')[0].split('/') || [];
            const index = parseInt(mes, 10) - 1;
            if (!isNaN(index) && meses[index]) meses[index].quantidade += 1;

            const plano = venda.plano || 'Indefinido';
            planosMap[plano] = (planosMap[plano] || 0) + 1;

            const nomeVendedor = venda.vendedor || vendedor.vendedor;
            rankingMap[nomeVendedor] = (rankingMap[nomeVendedor] || 0) + 1;

            const clienteAtivo = clientesAtivos.find(c => c.cnpj_cpf === venda.cpf);
            const idCliente = clienteAtivo?.id;
            const contrato = contratos.find(c => c.id_cliente === idCliente);
            const status = contrato?.status_internet || venda.status || '---';
            const vendedorControle = vendedoresControle.find(v =>
              v.Title?.toLowerCase().trim() === (venda.vendedor || vendedor.vendedor).toLowerCase().trim()
            );
            const dadosControle = vendedorControle?.DadosClientesVendedores || {};
            const dadosCliente = dadosControle[venda.cpf] || {
              Autorizado: 'NEGADO',
              Ativado: 'NÃO',
              Bloqueado: 'NÃO',
              Desistiu: 'NÃO',
              'Pagou Taxa': 'NÃO'
            };

            const bloqueado = dadosCliente.Bloqueado?.toUpperCase().trim() === 'SIM' || status !== 'A';

            if (bloqueado) {
              const bairro = venda.bairro || 'Indefinido';
              bloqueiosMap[bairro] = (bloqueiosMap[bairro] || 0) + 1;
            }
          }
        }

        setPorMes(meses);
        setPorPlano(Object.entries(planosMap).map(([nome, quantidade]) => ({ nome, quantidade })));
        setRanking(Object.entries(rankingMap).map(([vendedor, vendas]) => ({ vendedor, vendas })));
        setBloqueados(Object.entries(bloqueiosMap).map(([bairro, quantidade]) => ({ bairro, quantidade })));
      } catch (err) {
        console.error('Erro ao carregar os dados dos gráficos:', err);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [mesSelecionado]);

  const cores = ['#3182ce', '#2b6cb0', '#63b3ed', '#90cdf4', '#4FD1C5', '#00B5D8'];

  // Cores dinâmicas com base no modo
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  const borderColor = useColorModeValue('teal.300', 'teal.200');
  const spinnerColor = useColorModeValue('teal.500', 'teal.300');
  const gridStroke = useColorModeValue('#e0e0e0', '#4a5568');
  const axisStroke = useColorModeValue('#666', '#a0aec0');
  const tooltipBg = useColorModeValue('rgba(0, 0, 0, 0.8)', 'rgba(255, 255, 255, 0.9)');
  const tooltipText = useColorModeValue('white', 'gray.900');
  

  return (
    <Box
      w="100%"
      minH="500px"
      bg={bgColor}
      p={6}
      borderRadius="lg"
      boxShadow="md"
    >
      <VStack align="flex-start" spacing={6}>
        <Heading
          fontSize="2xl"
          fontWeight="bold"
          color={textColor}
          textTransform="uppercase"
          letterSpacing="wide"
        >
          Painel de Vendas
        </Heading>
        <Select
          placeholder="Filtrar por Mês"
          maxW="250px"
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
          borderColor={borderColor}
          borderWidth="2px"
          _hover={{ borderColor: useColorModeValue('teal.500', 'teal.100'), boxShadow: 'md' }}
          _focus={{ borderColor: useColorModeValue('teal.500', 'teal.100'), boxShadow: 'outline' }}
          bg={cardBg}
          color={textColor}
          borderRadius="md"
          p={2}
        >
          <option value="todos" style={{ background: cardBg, color: textColor }}>Todos os Meses</option>
          {[...Array(12)].map((_, i) => (
            <option key={i} value={String(i + 1).padStart(2, '0')} style={{ background: cardBg, color: textColor }}>
              {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
            </option>
          ))}
        </Select>
      </VStack>

      {carregando ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          h="400px"
          bg={cardBg}
          borderRadius="md"
          boxShadow="md"
        >
          <Spinner size="xl" thickness="4px" color={spinnerColor} />
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} spacing={6} mt={6}>
          <Card
            bg={cardBg}
            borderRadius="xl"
            boxShadow="lg"
            _hover={{ boxShadow: 'xl', bg: cardHoverBg, transition: 'all 0.2s' }}
          >
            <CardHeader fontWeight="bold" color={textColor} p={4}>
              📊 Vendas por Mês
            </CardHeader>
            <CardBody minH="300px" minWidth="400px" p={4}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={porMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="mes" stroke={axisStroke} />
                  <YAxis allowDecimals={false} stroke={axisStroke} />
                  <Tooltip contentStyle={{ background: tooltipBg, color: tooltipText }} />
                  <Bar dataKey="quantidade" fill="#3182ce" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card
            bg={cardBg}
            borderRadius="xl"
            boxShadow="lg"
            _hover={{ boxShadow: 'xl', bg: cardHoverBg, transition: 'all 0.2s' }}
          >
            <CardHeader fontWeight="bold" color={textColor} p={4}>
              📡 Distribuição por Plano
            </CardHeader>
            <CardBody minH="300px" p={4}>
              <ResponsiveContainer width="100%" height={300} minWidth={300}>
                <PieChart>
                  <Pie
                    data={porPlano}
                    dataKey="quantidade"
                    nameKey="nome"
                    outerRadius={100}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    animationDuration={500}
                  >
                    {porPlano.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={cores[i % cores.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: tooltipBg, color: tooltipText }} />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card
            bg={cardBg}
            borderRadius="xl"
            boxShadow="lg"
            _hover={{ boxShadow: 'xl', bg: cardHoverBg, transition: 'all 0.2s' }}
          >
            <CardHeader fontWeight="bold" color={textColor} p={4}>
              🏆 Ranking de Vendedores
            </CardHeader>
            <CardBody minH="300px" p={4}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ranking.sort((a, b) => b.vendas - a.vendas)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis type="number" allowDecimals={false} stroke={axisStroke} />
                  <YAxis dataKey="vendedor" type="category" width={120} stroke={axisStroke} />
                  <Tooltip contentStyle={{ background: tooltipBg, color: tooltipText }} />
                  <Bar dataKey="vendas" fill="#00B5D8" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card
            bg={cardBg}
            borderRadius="xl"
            boxShadow="lg"
            _hover={{ boxShadow: 'xl', bg: cardHoverBg, transition: 'all 0.2s' }}
          >
            <CardHeader fontWeight="bold" color={textColor} p={4}>
              🚫 Bloqueios por Bairro
            </CardHeader>
            <CardBody minH="300px" p={4}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bloqueados.sort((a, b) => b.quantidade - a.quantidade)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="bairro" stroke={axisStroke} />
                  <YAxis allowDecimals={false} stroke={axisStroke} />
                  <Tooltip contentStyle={{ background: tooltipBg, color: tooltipText }} />
                  <Bar dataKey="quantidade" fill="#E53E3E" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}
    </Box>
  );
};

export default GraficoDashboardVendas;