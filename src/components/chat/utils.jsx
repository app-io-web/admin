import { io } from "socket.io-client";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const socket = io('https://api.chat.nexusnerds.com.br', {
  transports: ['websocket'],
});

export const BASE_NOCODB = import.meta.env.VITE_NOCODB_URL;
export const TOKEN_NOCODB = import.meta.env.VITE_NOCODB_TOKEN;

export function formatarHora(timestamp) {
  if (!timestamp) return '';
  const data = new Date(timestamp);
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatarSeparadorDia(timestamp) {
  const data = parseISO(timestamp);
  return format(data, 'dd/MM/yyyy');
}

export function formatarMes(timestamp) {
  const data = parseISO(timestamp);
  return format(data, 'MMMM', { locale: ptBR });
}

export function renderTextWithLinks(texto) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = texto.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={`link-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'blue', textDecoration: 'underline' }}
        >
          {part}
        </a>
      );
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
}

export const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};