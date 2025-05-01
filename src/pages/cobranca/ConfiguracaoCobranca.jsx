import { useState, useEffect } from 'react'
import {
  Box, Heading, Flex
} from '@chakra-ui/react'
import AdminSidebarDesktop from '../../components/layout/SideBar'
import BottomBar from '../../components/layout/BottomBar'
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop'
import EmpresaSwitcher from '../../components/admin/EmpresaSwitcher'
import MensagemCobrancaConfig from '../../components/cobranca/MensagemCobrancaConfig'
import MensagemCobrancaVirConfig from '../../components/cobranca/MensagemCobrancaVirConfig'
import ConectarWhatsApp from '../../components/cobranca/ConectarWhatsApp'

export default function ConfiguracaoCobranca() {
  const [empresaSelecionada, setEmpresaSelecionada] = useState(() => {
    return localStorage.getItem('empresaSelecionada') || 'Max Fibra'
  })
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {}

  useEffect(() => {
    localStorage.setItem('empresaSelecionada', empresaSelecionada)
  }, [empresaSelecionada])

  return (
    <Box display="flex">
      <AdminSidebarDesktop />

      <Box
        position="fixed"
        top="20px"
        right="24px"
        zIndex={30}
        display={{ base: 'none', md: 'block' }}
      >
        <PerfilUsuarioDesktop usuario={usuario} />
      </Box>

      <Box flex="1" p={4} minH="100vh" overflow="auto">
        <Heading size="md" mb={4}>⚙️ Configuração de Mensagem de Cobrança</Heading>

        <EmpresaSwitcher
          empresas="Max Fibra, Vir Telecom"
          onChange={setEmpresaSelecionada}
        />

        <Flex mt={6} gap={6} flexWrap="wrap" alignItems="flex-start">
          <Box flex="1" minW="300px">
            {empresaSelecionada === 'Max Fibra' && <MensagemCobrancaConfig empresa="MAX_FIBRA" />}
            {empresaSelecionada === 'Vir Telecom' && <MensagemCobrancaVirConfig empresa="VIR_TELECOM" />}
          </Box>

          <ConectarWhatsApp empresa={empresaSelecionada === 'Max Fibra' ? 'MAX_FIBRA' : 'VIR_TELECOM'} />
        </Flex>
      </Box>

      <BottomBar />
    </Box>
  )
}