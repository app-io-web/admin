import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@chakra-ui/react';

// Componente para baixar o arquivo XLSX
const DownloadXLSX = ({ dados, nomeEmpresa }) => {

  // Função para gerar e baixar o arquivo XLSX
  const baixarXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(dados); // Converte os dados para uma planilha
    const wb = XLSX.utils.book_new(); // Cria um novo livro de trabalho
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes'); // Adiciona a planilha ao livro de trabalho

    // Gera o nome do arquivo com o nome da empresa
    const nomeArquivo = `clientes_bloqueados_${nomeEmpresa}.xlsx`;

    // Gera o arquivo e dispara o download com o nome dinâmico
    XLSX.writeFile(wb, nomeArquivo);
  };

  return (
    <Button colorScheme="teal" onClick={baixarXLSX}>
      Baixar Dados em XLSX
    </Button>
  );
};

export default DownloadXLSX;
