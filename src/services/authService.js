const BASE_URL = import.meta.env.VITE_NOCODB_URL;
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export async function login(email, password) {
  try {
    const where = `(email-login,eq,${email})~and(password,eq,${password})`;
    const url = `${BASE_URL}/api/v2/tables/mn8xn7q4lsvk963/records?where=${encodeURIComponent(where)}`;

    console.log('🔗 URL da requisição:', url);
    console.log('🔐 Token enviado:', TOKEN);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': TOKEN,
      },
    });

    console.log('📡 Status da resposta:', res.status);

    if (!res.ok) {
      const erroTexto = await res.text();
      console.error('❌ Erro na requisição:', erroTexto);
      return null;
    }

    const contentType = res.headers.get("content-type");
    console.log('📦 Content-Type:', contentType);

    const data = await res.json();

    console.log('✅ Dados retornados:', data);

    

    return data?.list?.[0] || null;
  } catch (err) {
    console.error('❌ Erro ao converter JSON:', err);
    return null;
  }
}
