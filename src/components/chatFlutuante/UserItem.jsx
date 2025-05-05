import { Box, Avatar, Text, HStack, VStack, Badge } from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";

export default function UserItem({ usuario, isSelected, onClick, ultimoAtivo, unreadCount }) {
  const online = usuario?.online;
  const corStatus = online ? "green.400" : "red.400";
  const nomeExibicao = usuario?.name || usuario?.UnicID_User || "Usuário Sem Nome";

  return (
    <Box
      w="100%"
      bg={isSelected ? "gray.100" : "white"}
      _hover={{ bg: "gray.50", cursor: "pointer" }}
      borderRadius="lg"
      p={3}
      shadow="sm"
      onClick={() => onClick(usuario)}
      transition="all 0.2s"
    >
      <HStack spacing={3} justify="space-between">
        <HStack spacing={3}>
          <Box position="relative">
            <Avatar
              name={nomeExibicao}
              size="sm"
              src={usuario?.pic_profile_link || ""}
            />
            <Box
              position="absolute"
              bottom={0}
              right={0}
              bg={corStatus}
              w={3}
              h={3}
              borderRadius="full"
              border="2px solid white"
            />
          </Box>
          <VStack spacing={0} align="start">
            <Text fontWeight="bold" fontSize="md" noOfLines={1}>
              {nomeExibicao}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {online
                ? "Agora"
                : ultimoAtivo
                ? `Última vez ativo há ${formatDistanceToNow(new Date(ultimoAtivo), { addSuffix: true, locale: ptBR })}`
                : "Offline"}
            </Text>
          </VStack>
        </HStack>
        {unreadCount > 0 && (
          <Badge colorScheme="blue" borderRadius="full" px={2}>
            {unreadCount}
          </Badge>
        )}
      </HStack>
    </Box>
  );
}