import { Box, Text, Badge, Spinner, Tooltip, Icon, useColorModeValue } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { CheckCircleIcon, WarningIcon, NotAllowedIcon } from '@chakra-ui/icons';

export default function PingCard({ nome, url, interval = 60000 }) {
  const [status, setStatus] = useState('verificando');
  const [latency, setLatency] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const infoColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const testarPing = async () => {
      setStatus('verificando');
      setError(null);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const start = Date.now();

        const res = await fetch(url, { signal: controller.signal });
        const end = Date.now();
        clearTimeout(timeoutId);

        if (res.ok) {
          setStatus('online');
          setLatency(end - start);
        } else {
          setStatus('falha');
          setError(`HTTP ${res.status}`);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          setStatus('timeout');
          setError('Tempo de resposta excedido');
        } else {
          setStatus('offline');
          setError('Falha na conexão');
        }
      } finally {
        setLastUpdated(new Date());
      }
    };

    testarPing();
    const intervalo = setInterval(testarPing, interval);
    return () => clearInterval(intervalo);
  }, [url, interval]);

  const statusConfig = {
    online: {
      color: 'green',
      icon: CheckCircleIcon,
      label: 'Serviço funcionando normalmente',
    },
    offline: {
      color: 'red',
      icon: NotAllowedIcon,
      label: 'Serviço indisponível',
    },
    falha: {
      color: 'orange',
      icon: WarningIcon,
      label: 'Erro no serviço',
    },
    timeout: {
      color: 'yellow',
      icon: WarningIcon,
      label: 'Tempo de resposta excedido',
    },
    verificando: {
      color: 'gray',
      icon: null,
      label: 'Verificando status...',
    },
  }[status];

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderRadius="md"
      boxShadow="sm"
      bg={bgColor}
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={{ boxShadow: 'md' }}
      width="100%"
      maxWidth="300px"
    >
      <Text fontWeight="medium" fontSize="md" mb={2} color={textColor}>
        {nome}
      </Text>

      <Tooltip label={statusConfig.label + (error ? ` (${error})` : '')}>
        <Badge
          colorScheme={statusConfig.color}
          fontSize="xs"
          px={2}
          py={0.5}
          borderRadius="sm"
          display="flex"
          alignItems="center"
          textTransform="uppercase"
        >
          {status === 'verificando' ? (
            <Spinner size="xs" mr={1.5} />
          ) : (
            statusConfig.icon && <Icon as={statusConfig.icon} mr={1.5} boxSize={3.5} />
          )}
          {status.toUpperCase()}
        </Badge>
      </Tooltip>

      {latency && status === 'online' && (
        <Text fontSize="xs" color={infoColor} mt={1.5}>
          Latência: {latency}ms
        </Text>
      )}
      {lastUpdated && (
        <Text fontSize="xs" color={infoColor} mt={1}>
          Atualizado: {lastUpdated.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </Text>
      )}
    </Box>
  );
}
