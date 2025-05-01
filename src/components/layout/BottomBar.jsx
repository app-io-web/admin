import {
    Box, IconButton, HStack, useColorMode, useColorModeValue, Text
  } from '@chakra-ui/react';
  import { MoonIcon, SunIcon } from '@chakra-ui/icons';
  import { FiHome, FiUsers, FiSettings } from 'react-icons/fi';
  import { NavLink, useLocation } from 'react-router-dom';
  import { motion } from 'framer-motion';
  
  const MotionBox = motion(Box);
  
  const navItems = [
    { to: '/', icon: FiHome, label: 'Início' },
    { to: '/usuarios', icon: FiUsers, label: 'Usuários' },
    { to: '/config', icon: FiSettings, label: 'Configurações' }
  ];
  
  export default function BottomBar() {
    const { colorMode, toggleColorMode } = useColorMode();
    const bg = useColorModeValue('#fff', '#1a202c');
    const activeBg = useColorModeValue('gray.100', 'gray.700');
    const iconColor = useColorModeValue('gray.600', 'gray.300');
    const iconActiveColor = useColorModeValue('blue.500', 'blue.300');
  
    const location = useLocation();
  
    return (
      <Box
        display={{ base: 'flex', md: 'none' }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg={bg}
        borderTop="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        px={4}
        py={3}
        justifyContent="space-between"
        alignItems="center"
        shadow="md"
        zIndex={20}
      >
        <HStack spacing={6}>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
  
            return (
                <NavLink key={to} to={to}>
                <MotionBox
                    whileTap={{ scale: 0.9 }}
                    bg={isActive ? activeBg : 'transparent'}
                    borderRadius="xl"
                    px={4}
                    py={2}
                    display="flex"
                    alignItems="center"
                    flexDirection="column"
                    color={isActive ? iconActiveColor : iconColor}
                    transition="all 0.3s"
                >
                    <Icon size="24px" />
                    {isActive && (
                    <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        mt={1}
                        transition="all 0.2s"
                        lineHeight="1"
                    >
                        {label}
                    </Text>
                    )}
                </MotionBox>
                </NavLink>
            );
          })}
        </HStack>
  
        <IconButton
          icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
          aria-label="Alternar tema"
          variant="ghost"
          isRound
        />
      </Box>
    );
  }
  