// src/services/userApiService.js

const API_URL = import.meta.env.VITE_NOCODB_URL + '/api/v2/tables/mn8xn7q4lsvk963/records'; // URL base da API de usuários
const API_TOKEN = import.meta.env.VITE_NOCODB_TOKEN; // Token da API

// Função para criar um novo usuário
export const createUser = async (userData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': API_TOKEN,
      },
      body: JSON.stringify(userData),
    });

    


    const data = await response.json();

    if (!response.ok) {
      console.error('Erro ao criar o usuário:', data); // Adicione isso para debugar
      throw new Error(data?.message || 'Erro ao criar o usuário');
    }
    

    return data;
  } catch (error) {
    console.error('Erro no cadastro de usuário:', error);
    throw error;
  }
};

// Função para listar todos os usuários
export const getUsers = async () => {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': API_TOKEN, // Token de autenticação
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao listar os usuários');
    }

    const data = await response.json();
    return data.list; // Retorna a lista de usuários
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    throw error;
  }
};

// Função para ler um usuário específico pelo ID
export const getUserById = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': API_TOKEN, // Token de autenticação
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao ler os dados do usuário');
    }

    const data = await response.json();
    return data; // Retorna os dados do usuário
  } catch (error) {
    console.error('Erro ao ler o usuário:', error);
    throw error;
  }
};

// Função para atualizar um usuário
export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(`${API_URL}/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': API_TOKEN, // Token de autenticação
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar o usuário');
    }

    const data = await response.json();
    return data; // Retorna os dados do usuário atualizado
  } catch (error) {
    console.error('Erro ao atualizar o usuário:', error);
    throw error;
  }
};

// Função para excluir um usuário
export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': API_TOKEN, // Token de autenticação
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao excluir o usuário');
    }

    return { message: 'Usuário excluído com sucesso' }; // Mensagem de sucesso
  } catch (error) {
    console.error('Erro ao excluir o usuário:', error);
    throw error;
  }
};
