import { useState } from 'react';
import { Box, Text, useToast, Spinner, Button, Input } from '@chakra-ui/react';

export default function CobrancaAutomaticaVIR({ clientes = [], whatsappStatus = {} }) {
  const [carregando, setCarregando] = useState(false);
  const [enviadas, setEnviadas] = useState([]);
  const [falhas, setFalhas] = useState([]);
  const toast = useToast();
  const [imagemNome, setImagemNome] = useState("");

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const instancia = `${usuario.nome?.toLowerCase() || 'padrao'}_instancia`;
  const [mensagemTemplate, setMensagemTemplate] = useState('Olá {nome}, sua fatura está em aberto.');

  const [empresaSelecionada, setEmpresaSelecionada] = useState(() => {
    return localStorage.getItem('empresaSelecionada');
  });

  const aplicarVariaveis = (template = '', cliente) => {
    return template
      .replace(/{nome}/g, cliente.RAZAO_SOCIAL || '')  // Substitui {nome} pela Razão Social
      .replace(/{CPF_CNPJ}/g, cliente.CPF_CNPJ || '')  // Substitui {CPF_CNPJ} pelo CPF/CNPJ
      .replace(/{telefone}/g, cliente.telefone || '');  // Substitui {telefone} pelo telefone correto
  };
  


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


  const isValidUrl = (urlString) => {
    try {
        new URL(urlString);  // Verifica se a URL é válida
        return true;
    } catch (err) {
        return false;
    }
};

const enviarMensagem = async (numero, mensagem, mediaUrl = null) => {
    //console.log('Iniciando envio de mensagem para:', numero);

    const url = `https://api.nexusnerds.com.br/message/sendText/${instancia}`;
    const payload = {
        number: numero,
        textMessage: {
            text: mensagem,  // Se não houver imagem, envia a mensagem de texto
        }
    };

    // Se a URL de mídia foi fornecida, chama a função de envio de mídia
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
            mediaMessage: {
                mediatype: "image",  // Ou "video", "audio" conforme necessário
                media: mediaUrl,     // URL da mídia
                caption: mensagem,   // Mensagem será usada como legenda
            },
        };
        await enviarMedia(mediaPayload);  // Envia a mídia
        return; // Impede o envio de texto se a mídia for enviada
    }

    //console.log('📦 Enviando para API:', url, payload);

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

    //console.log('📨 Mensagem enviada com sucesso:', numero, json);
};

const enviarMedia = async (payload) => {
    //console.log("📦 Enviando mídia:", payload);

    const mediaRes = await fetch(`https://api.nexusnerds.com.br/message/sendMedia/${instancia}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: 'bc2aff5752f5fbb0d492fff2599afb57',
        },
        body: JSON.stringify(payload),  // Envia o payload de mídia
    });

    const mediaJson = await mediaRes.json();

    if (!mediaRes.ok) {
        console.error('❌ Erro ao enviar mídia:', mediaJson);
        throw new Error(mediaJson?.response?.message?.[0] || mediaJson?.message || 'Erro ao enviar mídia');
    }

    //console.log('📨 Mídia enviada com sucesso:', mediaJson);
};



const registrarCobrançaNoLogVIR = async (cliente, status) => {
  const url = 'https://nocodb.nexusnerds.com.br/api/v2/tables/mji4m0uym8axwya/records'; // Endpoint para inserção no log da VIR TELECOM

  const data = {
    Data: new Date().toISOString().split('T')[0],  // Armazena apenas a data no formato YYYY-MM-DD
    "[LOG]-[VIR_TELECOM]": {
      cliente: cliente.RAZAO_SOCIAL, // Nome do cliente
      numero: cliente.telefone,      // Número do cliente
      status: status,                // Status da cobrança (enviada, falhada, etc.)
    }
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

    const existingRecord = responseData.list.find(record => record.Data === data.Data);

    if (existingRecord) {
      //console.log('Registro encontrado:', existingRecord);

      // Se já houver um log para a data, garante que o campo [LOG]-[VIR_TELECOM] seja um array
      if (!Array.isArray(existingRecord['[LOG]-[VIR_TELECOM]'])) {
        existingRecord['[LOG]-[VIR_TELECOM]'] = []; // Inicializa como array vazio caso não seja um array
      }

      // Adiciona o novo log à lista
      existingRecord['[LOG]-[VIR_TELECOM]'].push(data["[LOG]-[VIR_TELECOM]"]);

      // Remover campos auto-gerados, como CreatedAt e UpdatedAt
      const { CreatedAt, UpdatedAt, ...dataToUpdate } = existingRecord;

      // Atualiza o registro existente com o novo log
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
        console.error('Erro ao atualizar log da VIR TELECOM:', errorResponse);
        throw new Error(errorResponse?.message || 'Erro ao atualizar log');
      }

      //console.log('Log de cobrança VIR TELECOM atualizado com sucesso');
    } else {
      //console.log('Nenhum registro encontrado para essa data. Criando um novo...');

      // Se não houver log para a data, cria um novo
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': import.meta.env.VITE_NOCODB_TOKEN,  // Token de autenticação
        },
        body: JSON.stringify(data),
      });

      //console.log('Novo log de cobrança VIR TELECOM registrado com sucesso');
    }
  } catch (error) {
    console.error('Erro ao conectar com a API ou registrar log VIR TELECOM:', error);
  }
};










const executarCobranca = async () => {
  setCarregando(true);

  try {
    //console.log("Buscando dados da instância...");
    const instRes = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/m3xqm7fsjhg6m3g/records?where=(Instance_Name,eq,${instancia})`, {
      headers: { 'xc-token': import.meta.env.VITE_NOCODB_TOKEN }
    });
    const instData = await instRes.json();
    //console.log('Resposta da API de Instância:', instData);

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
    const chaveEmpresa = empresaSelecionada === 'Max Fibra' ? 'MAX_FIBRA' : 'VIR_TELECOM';

    //console.log("Chave da empresa:", chaveEmpresa);

    // Buscando a mensagem personalizada do NocoDB
    //console.log("Buscando mensagem personalizada...");
    const msgRes = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/mm2wytmovgp5cm6/records`, {
      headers: { 'xc-token': import.meta.env.VITE_NOCODB_TOKEN }
    });

    const msgData = await msgRes.json();
    //console.log('Resposta da API de mensagem personalizada:', msgData);

    const mensagemJson = msgData?.list?.[0]?.[chaveEmpresa];
    let mensagem = mensagemJson?.mensagem;
    const imagem = mensagemJson?.imagem;
    if (mensagem) setMensagemTemplate(mensagem);

    const enviados = [];
    const erros = [];

    // Agora, percorremos os clientes e aplicamos as variáveis
    for (const cliente of clientes) {
      const tel = cliente.telefone;
      const telLimpo = tel.replace(/\D/g, '');  // Limpeza do número
      const numeroFormatado = `55${telLimpo}`;
      const temWhats = whatsappStatus[numeroFormatado] === true;

      //console.log('Enviando para número:', numeroFormatado, 'WhatsApp Status:', temWhats);

      if (telLimpo?.length >= 10 && temWhats) {
        let msg = aplicarVariaveis(mensagem || mensagemTemplate, cliente);  // Aplicar as variáveis aqui
        console.log("Mensagem após substituição:", msg);  // Verifique a mensagem gerada

        try {
          if (imagem) {
            await enviarMensagem(numeroFormatado, msg, imagem);  // Enviar com imagem
          } else {
            await enviarMensagem(numeroFormatado, msg);  // Enviar apenas texto
          }
          enviados.push(cliente.razao);
          // Registra no log da VIR TELECOM
          await registrarCobrançaNoLogVIR(cliente, 'Enviada');
        } catch (err) {
          console.error(`Erro ao enviar para ${cliente.razao}:`, err.message);
          erros.push(cliente.razao);
          // Registra no log da VIR TELECOM em caso de erro
          await registrarCobrançaNoLogVIR(cliente, 'Falha');
        }

        await new Promise(resolve => setTimeout(resolve, 1000));  // delay de 1s
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
