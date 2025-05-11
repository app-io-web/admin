import {
  Box, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  Checkbox, VStack, useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export default function ModalEdicaoVenda({ isOpen, onClose, registros = [] }) {
  const [pagouTaxa, setPagouTaxa] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [ativado, setAtivado] = useState(false);
  const [desistiu, setDesistiu] = useState(false);
  const [comissao, setComissao] = useState('R$ 0,00');
  const toast = useToast();

  const cliente = registros[0];

  // Função para reiniciar os estados
  const resetStates = () => {
    setPagouTaxa(false);
    setBloqueado(false);
    setAtivado(false);
    setDesistiu(false);
    setComissao('R$ 0,00');
  };

  const calcularComissao = async (ativo, bloqueado, desistiu, pagouTaxa) => {
    try {
      const token = import.meta.env.VITE_NOCODB_TOKEN;

      const vendedoresRes = await fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m3cqlvi5625ahqs/records', {
        headers: { 'Content-Type': 'application/json', 'xc-token': token }
      });
      const vendedoresData = await vendedoresRes.json();
      const vendedoresJson = vendedoresData.list?.[0]?.Vendedor || {};
      let classificacao = 'Sem classificação';

      for (const key in vendedoresJson) {
        const v = vendedoresJson[key];
        if (v.nome?.toLowerCase().trim() === cliente?.vendedor?.toLowerCase().trim()) {
          classificacao = v.Classificação || 'Sem classificação';
          break;
        }
      }

      const comissoesRes = await fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m007s1znd8hpu6r/records', {
        headers: { 'Content-Type': 'application/json', 'xc-token': token }
      });
      const comissoesData = await comissoesRes.json();
      const comissoesTabela = comissoesData.list?.[0]?.Valores_Comissão?.comissoes || {};

      let valorFinal = 'R$ 0,00';
      if (desistiu || (ativo && bloqueado)) {
        valorFinal = 'R$ 0,00';
      } else if (ativo && pagouTaxa) {
        valorFinal = comissoesTabela?.[classificacao]?.valor || 'R$ 0,00';
      } else if (ativo) {
        valorFinal = comissoesTabela?.['Sem Taxa']?.valor || 'R$ 0,00';
      }

      setComissao(valorFinal);
    } catch (err) {
      console.error("Erro ao calcular comissão:", err);
    }
  };

  useEffect(() => {
    if (!cliente) {
      resetStates();
      return;
    }

    const fetchStatus = async () => {
      try {
        // Reinicia os estados antes de buscar novos dados
        resetStates();

        const token = import.meta.env.VITE_NOCODB_TOKEN;
        const normalizarCpf = cpf => cpf.replace(/\D/g, '');
        const cpfNormalizado = normalizarCpf(cliente.cpf);

        const clientesRes = await fetch('https://apidoixc.nexusnerds.com.br/Data/clientesAtivos.json');
        const clientesData = await clientesRes.json();
        const clienteAtivo = clientesData.registros.find(c => normalizarCpf(c.cnpj_cpf) === cpfNormalizado);
        if (!clienteAtivo) return;

        const idCliente = clienteAtivo.id;

        const contratosRes = await fetch('https://apidoixc.nexusnerds.com.br/Data/todos_contratos.json');
        const contratosData = await contratosRes.json();
        const contrato = contratosData.registros.find(c => c.id_cliente === idCliente);
        if (!contrato) return;

        const estaBloqueado = contrato.status_internet === 'CM' || contrato.status_internet === 'CA';
        const estaAtivo = contrato.status === 'A';
        const estaDesistiu = contrato.status === 'D';

        setBloqueado(estaBloqueado);
        setAtivado(estaAtivo);
        setDesistiu(estaDesistiu);

        const controleRes = await fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m8xz7i1uldvt2gr/records', {
          headers: { 'Content-Type': 'application/json', 'xc-token': token }
        });
        const controleData = await controleRes.json();
        const registro = controleData.list?.[0];
        const dadosSalvos = registro?.DadosClientesVendedores || {};
        const dadosCliente = dadosSalvos[cliente.cpf];

        if (dadosCliente) {
          setPagouTaxa(dadosCliente["Pagou Taxa"] === "SIM");
        }

        calcularComissao(estaAtivo, estaBloqueado, estaDesistiu, dadosCliente?.["Pagou Taxa"] === "SIM");

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchStatus();
  }, [cliente]);

  const salvarEdicao = async () => {
    try {
      const token = import.meta.env.VITE_NOCODB_TOKEN;
      const cpf = cliente.cpf;
      const formatado = cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

      const dadosAtualizados = {
        [formatado]: {
          "Pagou Taxa": pagouTaxa ? "SIM" : "NAO",
          "Ativado": ativado ? "SIM" : "NAO",
          "Bloqueado": bloqueado ? "SIM" : "NAO",
          "Desistiu": desistiu ? "SIM" : "NAO",
          "Autorizado": ativado ? "APROVADO" : null
        }
      };

      const controleRes = await fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m8xz7i1uldvt2gr/records', {
        headers: { 'Content-Type': 'application/json', 'xc-token': token }
      });

      const controleData = await controleRes.json();
      const registro = controleData.list?.[0];
      if (!registro) throw new Error('Registro de Controle de Vendas não encontrado.');

      const id = registro.Id;
      const atual = registro.DadosClientesVendedores || {};
      const atualizado = { ...atual, ...dadosAtualizados };

      await fetch('https://nocodb.nexusnerds.com.br/api/v2/tables/m8xz7i1uldvt2gr/records', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'xc-token': token },
        body: JSON.stringify({ Id: id, DadosClientesVendedores: atualizado })
      });

      toast({ title: 'Alterações salvas com sucesso.', status: 'success', isClosable: true });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: 'Erro ao salvar.', status: 'error', isClosable: true });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edição de Venda</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {cliente ? (
            <VStack align="start" spacing={3} mt={3}>
              <Text><b>Vendedor:</b> {cliente.vendedor}</Text>
              <Text><b>Protocolo:</b> {cliente.protocolo}</Text>
              <Text><b>CPF:</b> {cliente.cpf}</Text>
              <Text><b>Telefone:</b> {cliente.telefone1}</Text>
              <Box w="100%">
                <Text fontWeight="bold" mt={4}>Comissão calculada</Text>
                <Text fontSize="lg" color="green.500">💰 {comissao}</Text>
              </Box>

              <Checkbox isChecked={pagouTaxa} onChange={(e) => {
                const novo = e.target.checked;
                setPagouTaxa(novo);
                calcularComissao(ativado, bloqueado, desistiu, novo);
              }}>Pagou Taxa</Checkbox>

              <Checkbox isChecked={bloqueado} onChange={(e) => {
                const novo = e.target.checked;
                setBloqueado(novo);
                calcularComissao(ativado, novo, desistiu, pagouTaxa);
              }}>Bloqueado</Checkbox>

              <Checkbox isChecked={ativado} onChange={(e) => {
                const novo = e.target.checked;
                setAtivado(novo);
                calcularComissao(novo, bloqueado, desistiu, pagouTaxa);
              }}>Ativado</Checkbox>

              <Checkbox isChecked={desistiu} onChange={(e) => {
                const novo = e.target.checked;
                setDesistiu(novo);
                calcularComissao(ativado, bloqueado, novo, pagouTaxa);
              }}>Desistiu</Checkbox>

              <Box pt={4} w="100%">
                <button onClick={salvarEdicao} className="chakra-button css-1mqu3fl">Salvar</button>
              </Box>
            </VStack>
          ) : (
            <Text>Nenhum cliente selecionado.</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}