export const useWhatsApp = () => {
  const config = useRuntimeConfig();
  
  const generateWALink = (phone?: string, message?: string) => {
    // Fallback to institute WhatsApp number if phone not provided
    const targetPhone = phone || '911234567890'; // Default number
    const encodedMessage = encodeURIComponent(message || 'Hello, I am interested in AEMS courses.');
    
    return `https://wa.me/${targetPhone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
  };

  return {
    generateWALink
  };
};
