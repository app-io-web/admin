import {
  Box,
  Button,
  Spinner,
  useToast,
  Input,
  Select,
  Flex,
  Text,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import SideBar from '../layout/SideBar';
import BottomBar from '../layout/BottomBar';
import PerfilUsuarioDesktop from '../layout/PerfilUsuarioDesktop';
import EmpresaSwitcher from './EmpresaSwitcher';
import { usePermissions } from '../../context/PermissionsContext';

const linksPorEmpresa = {
  "Max Fibra": "https://api.dashboard.admin.nexusnerds.com.br/api/max-links",
  "Reis Service": "https://api.dashboard.admin.nexusnerds.com.br/api/reis-links",
  "Vir Telecom": "https://api.dashboard.admin.nexusnerds.com.br/api/vir-links",
};

export default function Atalhos() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const empresas = usuario?.empresa || '';
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const [links, setLinks] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [modoBusca, setModoBusca] = useState('empresa');
  const [termoBusca, setTermoBusca] = useState('');
  const [linkSelecionado, setLinkSelecionado] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const seçõesPorPagina = 2;
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { hasPermission, isLoading: permissionsLoading, error: permissionsError } = usePermissions();

  // Mapeamento de permissões por título da seção
  const sectionPermissions = {
    "Programas IXC": "PERM-[USER-ATALHOS-A.N0-Programas-IXC]",
    "Analise e Monitoramento": "PERM-[USER-ATALHOS-A.N0-Analise-e-Monitoramento]",
    "Administração e Controle": "PERM-[USER-ATALHOS-A.N0-Administração-e-Controle]",
    "Atendimento ao Publico": "PERM-[USER-ATALHOS-A.N0-Atendimento-ao-Publico]",
    "Programas úteis": "PERM-[USER-ATALHOS-A.N0-Programas-úteis]",
    "Programas Administração": "PERM-[USER-ATALHOS-A.N0-Administração-e-Controle]",
    "Atalhos Administrativos": "PERM-[REIS-USER-ATALHOS-A.N0-Atalhos-Administrativo]",
    "Atalhos úteis": "PERM-[REIS-USER-ATALHOS-A.N0-Atalhos-Uteis]",
  };

  useEffect(() => {
    if (!empresaSelecionada && modoBusca === 'empresa') return;
    setPaginaAtual(0);
    setLoading(true);

    const buscarLinks = async () => {
      try {
        const empresasPermitidas = empresas.split(',').map(e => e.trim());

        const urls = modoBusca === 'todas'
          ? empresasPermitidas.map(emp => linksPorEmpresa[emp]).filter(Boolean)
          : [linksPorEmpresa[empresaSelecionada]];

        const resultados = await Promise.all(
          urls.map((url) => fetch(url).then((res) => res.json()).catch(() => null))
        );

        const todasSeções = resultados.flatMap((res, i) => {
          const empresa = modoBusca === 'todas' ? Object.keys(linksPorEmpresa)[i] : empresaSelecionada;
          return (res?.sections || []).map((sec) => {
            const vistos = new Set();
            const linksUnicos = sec.links.filter((link) => {
              const chave = `${link.text}-${link.url}`;
              if (vistos.has(chave)) return false;
              vistos.add(chave);
              return true;
            }).map((link) => ({ ...link, empresaOrigem: empresa }));
            return { ...sec, links: linksUnicos };
          });
        });

        setLinks(todasSeções);
      } catch (err) {
        toast({
          title: 'Erro ao buscar links',
          description: err.message,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    buscarLinks();
  }, [empresaSelecionada, modoBusca, empresas, toast]);

  useEffect(() => {
    if (modoBusca === 'empresa') {
      const primeira = empresas.split(',')[0]?.trim();
      setEmpresaSelecionada(primeira);
    }
  }, [modoBusca, empresas]);

  // Filtra seções com base nas permissões e na busca
  const seçõesFiltradas = links
    .filter((sec) => {
      const permission = sectionPermissions[sec.title];
      return !permission || hasPermission(permission);
    })
    .filter((sec) => Array.isArray(sec.links) && sec.links.length > 0)
    .map((sec) => ({
      ...sec,
      links: sec.links.filter((link) =>
        link.text.toLowerCase().includes(termoBusca.toLowerCase().trim())
      ),
    }))
    .filter((sec) => sec.links.length > 0);

  const inicio = paginaAtual * seçõesPorPagina;
  const fim = inicio + seçõesPorPagina;
  const seçõesPaginadas = seçõesFiltradas.slice(inicio, fim);
  const temProximaPagina = fim < seçõesFiltradas.length;

  const handleAbrirLink = (link) => {
    if (link.popupText) {
      setLinkSelecionado(link);
      onOpen();
    } else {
      window.open(link.url, '_blank');
    }
  };

  if (permissionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (permissionsError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Text color="red.500" fontSize="sm">{permissionsError}</Text>
      </Box>
    );
  }

  return (
    <Box display="flex" minH="100vh" position="relative">
      <SideBar />

      <Box position="fixed" top="20px" right="24px" zIndex={30} display={{ base: 'none', md: 'block' }}>
        <PerfilUsuarioDesktop usuario={usuario} />
      </Box>

      <Box flex="1" p={6} pb={{ base: 24, md: 6 }}>
        <Text fontSize="2xl" fontWeight="bold" mb={8}>
          Atalhos
        </Text>
        <Box mb={4}>
          {/* MOBILE */}
          <VStack spacing={3} align="stretch" display={{ base: 'flex', md: 'none' }}>
            <Input
              placeholder="Buscar Atalhos"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />

            <Select
              value={modoBusca}
              onChange={(e) => {
                const novoModo = e.target.value;
                setModoBusca(novoModo);
                if (novoModo === 'empresa') {
                  const primeira = empresas.split(',')[0]?.trim();
                  setEmpresaSelecionada(primeira);
                } else {
                  setEmpresaSelecionada('');
                }
              }}
            >
              <option value="empresa">🔘 Empresa atual</option>
              <option value="todas">🌐 Todas empresas</option>
            </Select>

            {modoBusca === 'empresa' && (
              <EmpresaSwitcher
                empresas={empresas}
                onChange={(empresa) => setEmpresaSelecionada(empresa)}
              />
            )}
          </VStack>

          {/* DESKTOP */}
          <Flex
            wrap="wrap"
            gap={4}
            align="center"
            mb={4}
            display={{ base: 'none', md: 'flex' }}
          >
            <Input
              placeholder="Buscar Atalhos"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              maxW="300px"
            />

            <Select
              value={modoBusca}
              onChange={(e) => {
                const novoModo = e.target.value;
                setModoBusca(novoModo);
                if (novoModo === 'empresa') {
                  const primeira = empresas.split(',')[0]?.trim();
                  setEmpresaSelecionada(primeira);
                } else {
                  setEmpresaSelecionada('');
                }
              }}
              maxW="220px"
            >
              <option value="empresa">🔘 Empresa atual</option>
              <option value="todas">🌐 Todas empresas</option>
            </Select>

            {modoBusca === 'empresa' && (
              <EmpresaSwitcher
                empresas={empresas}
                onChange={(empresa) => setEmpresaSelecionada(empresa)}
              />
            )}
          </Flex>
        </Box>

        {loading && <Spinner mt={6} color="blue.500" size="lg" />}

        {!loading && seçõesPaginadas.length > 0 ? (
          <>
            {seçõesPaginadas.map((section, idx) => (
              <Box key={idx} mt={6}>
                <Text fontWeight="bold">{section.title}</Text>
                <Box mt={2} display="flex" flexWrap="wrap" gap={4}>
                  {section.links.map((link) => (
                    <Box
                      key={link.id}
                      onClick={() => handleAbrirLink(link)}
                      cursor="pointer"
                      borderWidth="1px"
                      borderRadius="md"
                      p={3}
                      w="160px"
                      textAlign="center"
                      boxShadow="sm"
                      _hover={{ shadow: 'md', transform: 'scale(1.02)' }}
                      transition="0.2s"
                    >
                      <img src={link.imgSrc} alt={link.altText} width="100%" height="auto" />
                      <Box mt={2} fontSize="sm">{link.text}</Box>
                      {modoBusca === 'todas' && link.empresaOrigem && (
                        <Box mt={1}>
                          <Badge colorScheme="blue" fontSize="0.6em">{link.empresaOrigem}</Badge>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}

            {seçõesFiltradas.length > seçõesPorPagina && (
              <Box display="flex" justifyContent="center" gap={4} mt={8}>
                <Button
                  onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 0))}
                  isDisabled={paginaAtual === 0}
                  colorScheme="gray"
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setPaginaAtual((prev) => prev + 1)}
                  isDisabled={!temProximaPagina}
                  colorScheme="blue"
                  variant="solid"
                >
                  Próxima
                </Button>
              </Box>
            )}
          </>
        ) : (
          !loading && (
            <Text textAlign="center" mt={6}>
              Nenhum atalho disponível para suas permissões ou busca.
            </Text>
          )
        )}
      </Box>

      {/* Modal de popupText */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent maxW="sm">
          <ModalHeader>Aviso</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box dangerouslySetInnerHTML={{ __html: linkSelecionado?.popupText }} />
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3} variant="ghost">Fechar</Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                window.open(linkSelecionado.url, '_blank');
                onClose();
              }}
            >
              Continuar para o site
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <BottomBar />
    </Box>
  );
}