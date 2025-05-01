import { useState } from 'react';
import { Box, Text, useToast, Spinner, Button, Input } from '@chakra-ui/react';

export default function CobrancaAutomatica({ clientes = [], whatsappStatus = {} }) {
  const [carregando, setCarregando] = useState(false);
  const [enviadas, setEnviadas] = useState([]);
  const [falhas, setFalhas] = useState([]);
  const toast = useToast();
  const [imagemNome, setImagemNome] = useState("");

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const instancia = `${usuario.nome?.toLowerCase() || 'padrao'}_instancia`;
  const [mensagemTemplate, setMensagemTemplate] = useState('Olá {nome}, sua fatura está em aberto.');

  const aplicarVariaveis = (template = '', cliente) => {
    return template
      .replace(/{nome}/g, cliente.razao || '')
      .replace(/{endereco}/g, cliente.endereco || '')
      .replace(/{telefone}/g, cliente.telefone_celular || '');
  }

  // Função para verificar e corrigir o nome da imagem
  const verificarNomeImagem = (nome) => {
    if (nome.includes(' ')) {
      const nomeCorrigido = nome.replace(/\s+/g, '_'); // Substitui espaços por '_'
      toast({
        title: 'Aviso',
        description: 'O nome da imagem não deve conter espaços. Ele foi corrigido automaticamente.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return nomeCorrigido;
    }
    return nome;
  };


  const enviarMensagem = async (numero, mensagem, mediaUrl = null) => {
    const url = `https://api.nexusnerds.com.br/message/sendText/${instancia}`;
    const payload = {
      number: numero,
      textMessage: {
        text: mensagem,
      }
    };

    // Se a URL de mídia foi fornecida, enviaremos a mídia em vez da mensagem de texto
    if (mediaUrl) {
      if (!isValidUrl(mediaUrl)) {
        console.error('❌ URL da mídia inválida:', mediaUrl);
        toast({
          title: 'Erro',
          description: 'A URL da mídia fornecida é inválida.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const mediaPayload = {
        number: numero,
        mediatype: "image", // Ou "video", "audio" conforme necessário
        media: mediaUrl,    // URL da mídia
        caption: mensagem,  // Mensagem será usada como legenda
      };
      await enviarMedia(mediaPayload);
      return;
    }

    console.log('📦 Enviando para API:', url, payload);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: 'bc2aff5752f5fbb0d492fff2599afb57',
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error('❌ Erro da API:', json);
      throw new Error(json?.response?.message?.[0] || json?.message || 'Erro ao enviar mensagem');
    }

    console.log('📨 Mensagem enviada com sucesso:', numero, json);
  };

  const isValidUrl = (urlString) => {
    try {
      new URL(urlString);
      return true;
    } catch (err) {
      return false;
    }
  };

  const enviarMedia = async (payload) => {
    const mediaPayload = {
      number: payload.number,
      mediaMessage: {
        mediatype: "image", // Ou "video", "audio" conforme necessário
        media: payload.media,    // URL da mídia
        caption: payload.caption || "Mídia enviada", // Legenda opcional
      },
    };

    console.log("📦 Enviando mídia:", mediaPayload);

    const mediaRes = await fetch(`https://api.nexusnerds.com.br/message/sendMedia/${instancia}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: 'bc2aff5752f5fbb0d492fff2599afb57',
      },
      body: JSON.stringify(mediaPayload),
    });

    const mediaJson = await mediaRes.json();

    if (!mediaRes.ok) {
      console.error('❌ Erro ao enviar mídia:', mediaJson);
      throw new Error(mediaJson?.response?.message?.[0] || mediaJson?.message || 'Erro ao enviar mídia');
    }

    console.log('📨 Mídia enviada com sucesso:', mediaJson);
  };

  const registrarCobrançaNoLog = async (cliente, status) => {
    const url = 'https://nocodb.nexusnerds.com.br/api/v2/tables/mgmwultlj1hbo4u/records'; // Endpoint para inserção no log da MAX FIBRA
  
    const data = {
      Data: new Date().toISOString().split('T')[0],  // Armazena apenas a data no formato YYYY-MM-DD
      "[LOG]-[MAX_FIBRA]": {
        cliente: cliente.razao,
        numero: cliente.telefone_celular,
        status: status,
      },
    };
  
    // Verifica se já existe um log para a data
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': import.meta.env.VITE_NOCODB_TOKEN,  // Token de autenticação
        },
      });
  
      const responseData = await response.json();
  
      // Encontrar o registro existente para a data
      const existingRecord = responseData.list.find(record => record.Data === data.Data);
  
      if (existingRecord) {
        console.log('Registro encontrado:', existingRecord);
  
        // Se já houver um log para a data, garante que o campo [LOG]-[MAX_FIBRA] seja um array
        if (!Array.isArray(existingRecord['[LOG]-[MAX_FIBRA]'])) {
          existingRecord['[LOG]-[MAX_FIBRA]'] = []; // Inicializa como array vazio caso não seja um array
        }
  
        // Adiciona o novo log à lista
        existingRecord['[LOG]-[MAX_FIBRA]'].push(data["[LOG]-[MAX_FIBRA]"]);
  
        // Remover campos auto-gerados, como CreatedAt e UpdatedAt
        const { CreatedAt, UpdatedAt, ...dataToUpdate } = existingRecord;
  
        // Atualiza o registro existente com o novo log, sem enviar os campos auto-gerados
        const patchResponse = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'xc-token': import.meta.env.VITE_NOCODB_TOKEN,
          },
          body: JSON.stringify(dataToUpdate),  // Envia sem os campos auto-gerados
        });
  
        if (!patchResponse.ok) {
          const errorResponse = await patchResponse.json();
          console.error('Erro ao atualizar log da MAX FIBRA:', errorResponse);
          throw new Error(errorResponse?.message || 'Erro ao atualizar log');
        }
  
        console.log('Log de cobrança MAX FIBRA atualizado com sucesso');
      } else {
        console.log('Nenhum registro encontrado para essa data. Criando um novo...');
  
        // Se não houver log para a data, cria um novo
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xc-token': import.meta.env.VITE_NOCODB_TOKEN,  // Token de autenticação
          },
          body: JSON.stringify(data),
        });
  
        console.log('Novo log de cobrança MAX FIBRA registrado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao conectar com a API ou registrar log:', error);
    }
  };
  
  
  
  
  
  
  
  const executarCobranca = async () => {
    setCarregando(true);
  
    try {
      // Buscar dados da instância
      const instRes = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/m3xqm7fsjhg6m3g/records?where=(Instance_Name,eq,${instancia})`, {
        headers: { 'xc-token': import.meta.env.VITE_NOCODB_TOKEN }
      });
      const instData = await instRes.json();
      const dadosInstancia = instData?.list?.[0];
      if (!dadosInstancia) throw new Error(`Instância "${instancia}" não encontrada.`);
  
      if (!dadosInstancia.Enviar_CBO_Interna) {
        toast({
          title: 'Cobrança desativada',
          description: 'Essa instância está com envio de cobrança interna desativado.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        setCarregando(false);
        return;
      }
  
      const empresa = dadosInstancia.UnicID;
      const chaveEmpresa = empresa.toUpperCase().replace(/\s/g, '_');
  
      // Buscar mensagem personalizada
      const msgRes = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/mm2wytmovgp5cm6/records`, {
        headers: { 'xc-token': import.meta.env.VITE_NOCODB_TOKEN }
      });
      const msgData = await msgRes.json();
      const mensagemJson = msgData?.list?.[0]?.[chaveEmpresa];
      const mensagem = mensagemJson?.mensagem;
      const imagem = mensagemJson?.imagem;
      if (mensagem) setMensagemTemplate(mensagem);
  
      const enviados = [];
      const erros = [];
  
      for (const cliente of clientes) {
        const tel = cliente.telefone_celular?.replace(/\D/g, '');
        const numeroFormatado = `55${tel}`;
        const temWhats = whatsappStatus[numeroFormatado] === true;
  
        if (tel?.length >= 10 && temWhats) {
          const msg = aplicarVariaveis(mensagem || mensagemTemplate, cliente);
          try {
            // Enviar a mensagem ou mídia
            if (imagem) {
              await enviarMensagem(numeroFormatado, msg, imagem);
            } else {
              await enviarMensagem(numeroFormatado, msg);
            }
            enviados.push(cliente.razao);
            // Registrar no log da MAX FIBRA após o envio bem-sucedido
            await registrarCobrançaNoLog(cliente, 'Enviada');
          } catch (err) {
            console.error(`Erro ao enviar para ${cliente.razao}:`, err.message);
            erros.push(cliente.razao);
            // Registrar no log da MAX FIBRA em caso de erro
            await registrarCobrançaNoLog(cliente, 'Falha');
          }
  
          await new Promise(resolve => setTimeout(resolve, 1000)); // delay de 1s
        }
      }
  
      setEnviadas(enviados);
      setFalhas(erros);
      toast({
        title: 'Cobrança finalizada',
        description: `✅ Enviadas: ${enviados.length} | ⚠️ Falharam: ${erros.length}`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      });
  
    } catch (err) {
      console.error('Erro geral:', err);
      toast({
        title: 'Erro na cobrança',
        description: err.message || 'Erro inesperado',
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setCarregando(false);
    }
  };
  
  


  return (
    <Box>
      <Text fontWeight="bold" fontSize="lg" mb={4}>Cobrança Automática</Text>


      <Button
        colorScheme="blue"
        onClick={executarCobranca}
        isLoading={carregando}
        loadingText="Enviando..."
        mb={4}
      >
        💬 Iniciar cobrança
      </Button>

      {carregando ? (
        <Spinner size="lg" />
      ) : (
        <Text color="green.400">✅ Mensagens enviadas: {enviadas.length}</Text>
      )}
    </Box>
  );
}
