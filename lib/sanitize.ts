import sanitizeHtml from 'sanitize-html';

type Transform = (tagName: string, attribs: Record<string, string>) => {
  tagName: string;
  attribs: Record<string, string>;
};

// Centraliza a sanitização de HTML para artigos, removendo estilos e wrappers que quebram o layout
export function cleanHtml(html: string): string {
  const clean = sanitizeHtml(html ?? '', {
    // tags comuns de conteúdo; evitamos containers e elementos de layout complexos
    allowedTags: [
      'p','br','hr','strong','em','b','i','u','s','blockquote','code','pre',
      'ul','ol','li','h1','h2','h3','h4','h5','h6','a','img','span','sup','sub'
    ],
    disallowedTagsMode: 'discard',
    allowedAttributes: {
      a: ['href','name','target','rel'],
      img: ['src','alt','width','height'],
      // não permitimos class/style para evitar herdar temas errados do HTML colado
      span: [],
      p: [],
      h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
      code: [], pre: [], blockquote: [], ul: [], ol: [], li: [],
    },
    // remove CSS inline completamente
    allowedStyles: {},
    // reescreve links para abrirem em nova aba e com segurança
    transformTags: {
      a: ((tagName, attribs) => {
        const href = attribs.href || '#';
        return {
          tagName: 'a',
          attribs: {
            href,
            target: '_blank',
            rel: 'nofollow noopener noreferrer',
          },
        };
      }) as Transform,
      // remove possíveis <html>, <head>, <body> transformando-os em fragmento
      html: () => ({ tagName: 'div', attribs: {} }),
      head: () => ({ tagName: 'div', attribs: {} }),
      body: () => ({ tagName: 'div', attribs: {} }),
      // normaliza imagens sem estilos
      img: ((tagName, attribs) => ({
        tagName: 'img',
        attribs: {
          src: attribs.src || '',
          alt: attribs.alt || '',
        },
      })) as Transform,
    },
    // bloqueia URLs perigosas
    allowedSchemesByTag: {
      img: ['http','https','data'],
      a: ['http','https','mailto'],
    },
    // limita comprimento extremo
    textFilter: (text: string) => (text.length > 20000 ? text.slice(0, 20000) : text),
  });

  return clean.trim();
}
