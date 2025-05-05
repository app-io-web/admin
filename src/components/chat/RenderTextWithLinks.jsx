const RenderTextWithLinks = ({ texto }) => {
  if (typeof texto !== 'string') {
    return null; // ou: return <span></span> se preferir manter estrutura
  }

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
};

export default RenderTextWithLinks;
