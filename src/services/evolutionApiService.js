const BASE_EVOLUTION_URL = 'https://api.nexusnerds.com.br';
const API_KEY = 'bc2aff5752f5fbb0d492fff2599afb57';

const defaultHeaders = {
  'Content-Type': 'application/json',
  apikey: API_KEY,
};

// Cria nova instância
export async function criarInstancia(nomeInstancia) {
    const payload = {
      instanceName: nomeInstancia,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      reject_call: true,
      msgCall: 'Ligações não são aceitas. Por favor, envie uma mensagem.',
      groupsIgnore: true,
      alwaysOnline: true,
      readMessages: true,
      readStatus: true,
      syncFullHistory: true,
    };
  
    const res = await fetch(`${BASE_EVOLUTION_URL}/instance/create`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(payload),
    });
  
    const clone = res.clone(); // 🔁 permite ler o body duas vezes
  
    if (res.status === 403) {
      const texto = await clone.text();
      if (texto.includes('already in use')) {
        console.warn(`⚠️ Instância '${nomeInstancia}' já existe. Tratando automaticamente...`);
        const resultado = await verificarOuRecriarInstancia(nomeInstancia);
        if (resultado === 'CRIAR_NOVA') {
          console.log('♻️ Tentando criar novamente após deleção...');
          await new Promise(resolve => setTimeout(resolve, 1500)); // 👈 AQUI sim
          return await criarInstancia(nomeInstancia); // tenta criar de novo


        }
        if (resultado === 'JA_CONECTADA') {
          console.log('✅ Instância já conectada, sem necessidade de criar.');
          return { state: 'CONNECTED' };
        }
        throw new Error('🛑 Erro inesperado ao tentar criar após verificação.');
      }
      throw new Error(`🚫 Erro 403: ${texto}`);
    }
  
    if (!res.ok) {
      const erroTexto = await clone.text();
      throw new Error(`❌ Erro ao criar: ${erroTexto}`);
    }
  
    return await res.json(); // ✅ agora podemos usar .json() sem erro
  }
  

// Verifica se instância existe
export async function verificarInstanciaEvolution(nomeInstancia) {
  const res = await fetch(`${BASE_EVOLUTION_URL}/instance/info/${nomeInstancia}`, {
    method: 'GET',
    headers: { apikey: API_KEY },
  });

  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`❌ Erro na verificação: ${await res.text()}`);
  return true;
}

// Conecta (gera QR)
export async function conectarInstancia(nomeInstancia) {
  const res = await fetch(`${BASE_EVOLUTION_URL}/instance/connect/${nomeInstancia}`, {
    method: 'GET',
    headers: { apikey: API_KEY },
  });

  if (!res.ok) throw new Error(`❌ Erro ao conectar: ${await res.text()}`);
  return await res.json();
}

// Busca status
export async function buscarInstanciaStatus(nomeInstancia) {
    const res = await fetch(`${BASE_EVOLUTION_URL}/instance/fetchInstances?instanceName=${nomeInstancia}`, {
      method: 'GET',
      headers: {
        apikey: API_KEY,
      },
    });
  
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`❌ Erro no status: ${await res.text()}`);
    return await res.json(); // retorna { instance: { ... } }
  }
  
  
  

  export async function desconectarInstancia(nomeInstancia) {
    // Busca status antes de tudo
    const statusAtual = await buscarInstanciaStatus(nomeInstancia);
    const estado = statusAtual?.instance?.state?.toLowerCase();
    const conectado = estado === 'connected' || estado === 'open';
  
    if (!conectado) {
      console.log(`ℹ️ Instância ${nomeInstancia} já está desconectada ou inválida (estado: ${estado})`);
      return { status: 'ALREADY_DISCONNECTED' };
    }
  
    const res = await fetch(`${BASE_EVOLUTION_URL}/instance/logout/${nomeInstancia}`, {
      method: 'DELETE',
      headers: { apikey: API_KEY },
    });
  
    if (!res.ok) {
      const texto = await res.text();
      throw new Error(`❌ Erro ao desconectar: ${texto}`);
    }
  
    return await res.json();
  }
  
  
  
  
  
  

// Lista todas as instâncias
export async function listarTodasInstancias() {
    const res = await fetch(`${BASE_EVOLUTION_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: { apikey: API_KEY },
    });
  
    if (!res.ok) {
      const texto = await res.text();
  
      try {
        const parsed = JSON.parse(texto);
        console.warn('⚠️ Erro ao listar instâncias:', parsed.message || parsed);
      } catch (e) {
        console.warn('⚠️ Erro ao listar instâncias (resposta bruta):', texto);
      }
  
      // Permite seguir como se não houvesse nenhuma instância
      return [];
    }
  
    return await res.json();
  }
  
  
  

// Deleta uma instância
export async function deletarInstancia(nomeInstancia) {
  const res = await fetch(`${BASE_EVOLUTION_URL}/instance/delete/${nomeInstancia}`, {
    method: 'DELETE',
    headers: { apikey: API_KEY },
  });

  if (!res.ok) throw new Error(`❌ Erro ao deletar: ${await res.text()}`);
  return await res.json();
}

// VERIFICA / DELETA / PREPARA para criação
export async function verificarOuRecriarInstancia(nomeInstancia) {
    const instancias = await listarTodasInstancias();
  
    const repetidas = instancias.filter(
      item => item?.instance?.instanceName === nomeInstancia
    );
  
    if (repetidas.length === 0) {
      console.log('⚪ Nenhuma instância com esse nome. Pode criar nova.');
      return 'CRIAR_NOVA';
    }
  
    let algumaConectada = false;
  
    for (const inst of repetidas) {
      const nome = inst?.instance?.instanceName;
      const status = (inst?.instance?.status || '').toLowerCase();
      const state  = (inst?.instance?.state  || '').toLowerCase();
      const hasOwner = !!inst?.instance?.owner;
  
      console.log(`🔍 Instância ${nome} encontrada com status:`, status, 'e state:', state);
  
      const estaConectada = state === 'connected' || (state === 'open' && hasOwner);
      if (estaConectada) {
        algumaConectada = true;
        break;
      }
  
      // Deleta TODAS as outras instâncias com mesmo nome
      try {
        console.warn(`🧹 Deletando instância duplicada/inválida (${state || status}):`, nome);
        await deletarInstancia(nome);
      } catch (err) {
        console.error(`❌ Falha ao deletar instância '${nome}':`, err.message || err);
      }
    }
  
    if (algumaConectada) {
      console.log('✅ Pelo menos uma instância já conectada e válida.');
      return 'JA_CONECTADA';
    }
  
    return 'CRIAR_NOVA';
  }
  
  
