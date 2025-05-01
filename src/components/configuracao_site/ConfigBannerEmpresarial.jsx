import { useState, useEffect } from 'react';
import {
  Box, Text, VStack, HStack, Button, Image, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Input, SimpleGrid, useToast, Spinner
} from '@chakra-ui/react';

export default function ConfigBannerEmpresarial() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editBanner, setEditBanner] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    'Banners-2K': '',
    'Banners-4K': '',
    'Banners-1080P': '',
    'Banners-Mobile': '',
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.configsite.nexusnerds.com.br/banners-site-empresarial');
      const data = await res.json();
      setBanners(data.list || []);
    } catch (err) {
      console.error('Erro ao buscar banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditBanner(banner);
      setFormData({
        'Banners-2K': banner['Banners-2K'] || '',
        'Banners-4K': banner['Banners-4K'] || '',
        'Banners-1080P': banner['Banners-1080P'] || '',
        'Banners-Mobile': banner['Banners-Mobile'] || '',
      });
    } else {
      setEditBanner(null);
      setFormData({ 'Banners-2K': '', 'Banners-4K': '', 'Banners-1080P': '', 'Banners-Mobile': '' });
    }
    onOpen();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const method = editBanner ? 'PATCH' : 'POST';
      const url = 'https://api.configsite.nexusnerds.com.br/banners-site-empresarial'; // <-- Mesma URL pros dois
  
      // Se for PATCH, inclui o Id no corpo
      const body = editBanner
        ? { Id: editBanner.Id, ...formData }
        : formData;
  
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
  
      if (res.ok) {
        toast({
          title: editBanner ? 'Banner atualizado' : 'Banner adicionado',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchBanners();
        onClose();
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000, isClosable: true });
    }
  };
  

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={4}>
        <Text fontSize="xl" fontWeight="bold">Configuração de Banner Empresarial</Text>
        <Button colorScheme="blue" onClick={() => handleOpenModal()}>Adicionar Banner</Button>
      </HStack>

      {loading ? (
        <Spinner />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {banners.map((banner) => (
            <Box key={banner.Id} p={4} borderWidth="1px" borderRadius="md">
              <Text fontWeight="bold" mb={2}>Banner ID: {banner.Id}</Text>
              <SimpleGrid columns={2} spacing={2}>
              {['Banners-2K', 'Banners-4K', 'Banners-1080P', 'Banners-Mobile'].map((key) => (
                  <Box key={key}>
                    <Text fontSize="sm">{key.replace('Banners-', '')}:</Text>
                    {banner[key] ? (
                      <>
                        <Image src={banner[key]} onError={(e) => e.target.style.display = 'none'} />
                        <Button
                          size="xs"
                          colorScheme="red"
                          mt={2}
                          onClick={async () => {
                            try {
                              const res = await fetch('https://api.configsite.nexusnerds.com.br/banners-site-empresarial', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ Id: banner.Id, [key]: '' }),  // Limpa só aquele campo
                              });
                              if (res.ok) {
                                toast({ title: `${key.replace('Banners-', '')} deletado`, status: 'success', duration: 2000 });
                                fetchBanners();  // Atualiza a lista
                              } else {
                                throw new Error('Erro ao deletar imagem');
                              }
                            } catch (err) {
                              console.error(err);
                              toast({ title: 'Erro ao deletar imagem', description: err.message, status: 'error' });
                            }
                          }}
                        >
                          Deletar
                        </Button>
                      </>
                    ) : (
                      <Text fontSize="xs" color="gray.400">Sem imagem</Text>
                    )}
                  </Box>
                ))}

                </SimpleGrid>

              <Button mt={3} size="sm" colorScheme="yellow" onClick={() => handleOpenModal(banner)}>Sobrescrever</Button>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editBanner ? 'Sobrescrever Banner' : 'Adicionar Novo Banner'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {['Banners-2K', 'Banners-4K', 'Banners-1080P', 'Banners-Mobile'].map((field) => (
              <Box key={field} mb={3}>
                <Text fontSize="sm" mb={1}>{field.replace('Banners-', '')}</Text>
                <Input value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} />
              </Box>
            ))}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSubmit}>{editBanner ? 'Sobrescrever' : 'Adicionar'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}