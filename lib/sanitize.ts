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
      'ul','ol','li','h1','h2','h3','h4','h5','h6','a','img','span','sup','sub',
      // tabelas
      'table','thead','tbody','tr','th','td',
      // checklist (algumas implementações inserem input/label)
      'input','label'
    ],
    disallowedTagsMode: 'discard',
    allowedAttributes: {
      // Links com atributos seguros + data-attrs controlados para estilo opcional
      a: ['href','name','target','rel','data-underline','data-variant','style'],
      // Imagens com src/alt e data-attrs para largura/alinhamento/estilo seguro
      img: ['src','alt','width','height','data-width','data-align','data-rounded','data-shadow','style'],
      // Permitimos spans para marcas de cor/realce (TextStyle/Highlight)
      span: ['style'],
      p: ['style'],
      h1: ['style'], h2: ['style'], h3: ['style'], h4: ['style'], h5: ['style'], h6: ['style'],
      code: [], pre: [], blockquote: [], ul: [], ol: [], li: [],
      // Tabela básica
      table: ['style'], thead: [], tbody: [], tr: [], th: ['colspan','rowspan','style'], td: ['colspan','rowspan','style'],
      // Checklist
      input: ['type','checked','disabled','readonly'], label: [],
    },
    // Estilos inline permitidos (brando e seguro)
    allowedStyles: {
      '*': {
        // texto
        'color': [/^#[0-9a-fA-F]{3,8}$/i, /^rgb\(/i, /^hsl\(/i],
        'background-color': [/^#[0-9a-fA-F]{3,8}$/i, /^rgb\(/i, /^hsl\(/i],
        'text-decoration': [/^none$/i, /^underline$/i],
        'text-align': [/^(left|center|right|justify)$/i],
        // imagem (somente dimensões e borda arredondada)
        'width': [/^\d+%$/],
        'max-width': [/^\d+%$/],
        'border-radius': [/^\d+(px|rem|%)$/],
        'box-shadow': [/^0\s\d+px\s\d+px\srgba\(\d+,\s\d+,\s\d+,\s0\.[0-9]+\)$/],
      },
    },
    // reescreve links para abrirem em nova aba e com segurança
    transformTags: {
      a: ((tagName, attribs) => {
        const href = attribs.href || '#';
        const dataUnderline = attribs['data-underline'];
        const dataVariant = attribs['data-variant'];
        const style = attribs.style;
        return {
          tagName: 'a',
          attribs: {
            href,
            target: '_blank',
            rel: 'nofollow noopener noreferrer',
            ...(dataUnderline ? { 'data-underline': dataUnderline } : {}),
            ...(dataVariant ? { 'data-variant': dataVariant } : {}),
            ...(style ? { style } : {}),
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
          // preserva data-attrs seguros para CSS controlado
          'data-width': attribs['data-width'],
          'data-align': attribs['data-align'],
          'data-rounded': attribs['data-rounded'],
          'data-shadow': attribs['data-shadow'],
          style: attribs.style, // será filtrado por allowedStyles
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
