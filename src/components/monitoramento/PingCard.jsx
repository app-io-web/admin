import { Box, Text, Badge, Icon, Tooltip, useColorModeValue } from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, NotAllowedIcon, TimeIcon } from '@chakra-ui/icons';

export default function PingCard({ nome, status, mensagem, latencia, atualizado }) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const infoColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const statusMap = {
    ONLINE: {
      color: 'green',
      icon: CheckCircleIcon,
      label: 'Serviço funcionando normalmente',
    },
    FALHA: {
      color: 'red',
      icon: NotAllowedIcon,
      label: 'Erro no serviço',
    },
    OFFLINE: {
      color: 'red',
      icon: NotAllowedIcon,
      label: 'Serviço indisponível',
    },
    TIMEOUT: {
      color: 'yellow',
      icon: WarningIcon,
      label: 'Tempo de resposta excedido',
    },
    VERIFICANDO: {
      color: 'gray',
      icon: TimeIcon,
      label: 'Verificando status...',
    },
  };

  const config = statusMap[status?.toUpperCase()] || statusMap.FALHA;

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="md"
      boxShadow="sm"
      bg={bgColor}
      borderColor={config.color + '.300'}
      transition="all 0.2s"
      _hover={{ boxShadow: 'md' }}
      width="100%"
      maxW="300px"
    >
      <Text fontWeight="semibold" fontSize="md" mb={2} color={textColor}>
        {nome}
      </Text>

      <Tooltip label={config.label + (mensagem ? ` (${mensagem})` : '')}>
        <Badge
          colorScheme={config.color}
          fontSize="xs"
          px={2}
          py={0.5}
          borderRadius="md"
          display="flex"
          alignItems="center"
          textTransform="uppercase"
          mb={2}
        >
          <Icon as={config.icon} mr={1.5} boxSize={3.5} />
          {status}
        </Badge>
      </Tooltip>

      {latencia !== null && (
        <Text fontSize="xs" color={infoColor}>
          ⏱ Latência: {latencia}ms
        </Text>
      )}

      {atualizado && (
        <Text fontSize="xs" color={infoColor}>
          🕒 Atualizado: {atualizado}
        </Text>
      )}
    </Box>
  );
}
