//para descobrir o nome do cliente bloqueado
// fazer um fetch no link https://apidoixc.nexusnerds.com.br/Data/ClientesBloquados.json
// e pegar o id_cliente e fazer um fetch no link https://apidoixc.nexusnerds.com.br/Data/clientesAtivos.json

/*
====================
https://apidoixc.nexusnerds.com.br/Data/clientesAtivos.json EXEMPLO DE JSON
====================
{
  "page": "1",
  "total": 1362,
  "registros": [
    {
      "senha": "Senha@25032090",
      "acesso_automatico_central": "P",
      "alterar_senha_primeiro_acesso": "P",
      "senha_hotsite_md5": "N",
      "indicado_por": "0",
      "regua_cobranca_wpp": "S",
      "regua_cobranca_notificacao": "S",
      "regua_cobranca_considera": "P",
      "rg_orgao_emissor": "",
      "razao": "LUCAS VIEIRA SOUZA",
      "ativo": "S",
      "id": "140",


*/




/*
====================
https://apidoixc.nexusnerds.com.br/Data/ClientesBloquados.json EXEMPLO DE JSON
====================

[
  {
    "data_ativacao": "2025-04-02",
    "status": "Mês Passado",
    "id_cliente": "1387"
  },
  {
    "data_ativacao": "2025-04-01",
    "status": "Neste Mês",
    "id_cliente": "140"
  },

]

*/