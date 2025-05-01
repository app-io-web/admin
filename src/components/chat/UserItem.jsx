import { memo } from 'react';
import { Flex, Avatar, Box, Text, Badge, useColorModeValue, Icon } from '@chakra-ui/react';
import { FiUsers } from 'react-icons/fi';

const UserItem = memo(({ user, isSelected, onClick, digitando, unreadCount }) => {
  const bg = useColorModeValue('gray.100', 'gray.700');
  const selectedBg = useColorModeValue('blue.100', 'blue.700');

  return (
    <Flex
      align="center"
      p={2}
      borderRadius="md"
      cursor="pointer"
      _hover={{ bg }}
      bg={isSelected ? selectedBg : 'transparent'}
      onClick={onClick}
    >
      {user.isGroup ? (
        <Flex align="center" justify="center" w="40px" h="40px" mr={2} bg="gray.200" borderRadius="full">
          <Icon as={FiUsers} boxSize={5} color="gray.600" />
        </Flex>
      ) : (
        <Avatar size="sm" src={user.pic_profile_link} mr={2} />
      )}
      <Box flex="1">
        <Flex align="center">
          <Text fontWeight="bold">
            {user.isGroup ? user.name : (user.name || 'Usuário Desconhecido')}
            {user.isGroup && <Text as="span" fontSize="xs" color="gray.500" ml={1}>(Grupo)</Text>}
          </Text>
          {unreadCount > 0 && (
            <Badge ml={2} colorScheme="red" borderRadius="full" px={2}>
              {unreadCount}
            </Badge>
          )}
        </Flex>
        {!user.isGroup && (
          <Text fontSize="xs" color="gray.500">
            {user.user_login || 'Sem login'}
            {digitando && (
              <Text as="span" fontSize="xs" color="blue.400" ml={2}>
                digitando...
              </Text>
            )}
          </Text>
        )}
      </Box>
      {!user.isGroup && (
        <Badge colorScheme={user.online ? "green" : "gray"} borderRadius="full" px={2}>
          {user.online ? "Online" : "Offline"}
        </Badge>
      )}
    </Flex>
  );
});

export default UserItem;