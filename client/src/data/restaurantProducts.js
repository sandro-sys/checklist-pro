export const PRODUCT_CATEGORIES = [
  'Carnes e Proteínas',
  'Laticínios',
  'Grãos, Massas e Farinhas',
  'Óleos, Molhos e Temperos',
  'Hortifrúti',
  'Bebidas',
  'Descartáveis e Embalagens',
  'Limpeza',
  'Outros',
]

export const RESTAURANT_PRODUCTS = [
  {
    group: 'Carnes e Proteínas',
    items: [
      { name: 'FRANGO INTEIRO',       unit: 'KG',  min_stock: 5,  category: 'Carnes e Proteínas' },
      { name: 'PEITO DE FRANGO',      unit: 'KG',  min_stock: 5,  category: 'Carnes e Proteínas' },
      { name: 'CARNE MOÍDA',          unit: 'KG',  min_stock: 3,  category: 'Carnes e Proteínas' },
      { name: 'ALCATRA',              unit: 'KG',  min_stock: 3,  category: 'Carnes e Proteínas' },
      { name: 'COSTELA BOVINA',       unit: 'KG',  min_stock: 2,  category: 'Carnes e Proteínas' },
      { name: 'FILE DE PEIXE',        unit: 'KG',  min_stock: 2,  category: 'Carnes e Proteínas' },
      { name: 'CAMARÃO',              unit: 'KG',  min_stock: 1,  category: 'Carnes e Proteínas' },
      { name: 'OVOS',                 unit: 'DZ',  min_stock: 5,  category: 'Carnes e Proteínas' },
    ]
  },
  {
    group: 'Laticínios',
    items: [
      { name: 'LEITE INTEGRAL',       unit: 'L',   min_stock: 10, category: 'Laticínios' },
      { name: 'QUEIJO MUSSARELA',     unit: 'KG',  min_stock: 2,  category: 'Laticínios' },
      { name: 'QUEIJO PRATO',         unit: 'KG',  min_stock: 1,  category: 'Laticínios' },
      { name: 'MANTEIGA',             unit: 'KG',  min_stock: 1,  category: 'Laticínios' },
      { name: 'CREME DE LEITE',       unit: 'UN',  min_stock: 6,  category: 'Laticínios' },
      { name: 'REQUEIJÃO',            unit: 'UN',  min_stock: 3,  category: 'Laticínios' },
    ]
  },
  {
    group: 'Grãos, Massas e Farinhas',
    items: [
      { name: 'ARROZ',                unit: 'KG',  min_stock: 10, category: 'Grãos, Massas e Farinhas' },
      { name: 'FEIJÃO PRETO',         unit: 'KG',  min_stock: 5,  category: 'Grãos, Massas e Farinhas' },
      { name: 'FEIJÃO CARIOCA',       unit: 'KG',  min_stock: 5,  category: 'Grãos, Massas e Farinhas' },
      { name: 'FARINHA DE TRIGO',     unit: 'KG',  min_stock: 5,  category: 'Grãos, Massas e Farinhas' },
      { name: 'MACARRÃO ESPAGUETE',   unit: 'KG',  min_stock: 3,  category: 'Grãos, Massas e Farinhas' },
      { name: 'MACARRÃO PARAFUSO',    unit: 'KG',  min_stock: 2,  category: 'Grãos, Massas e Farinhas' },
      { name: 'FARINHA DE MANDIOCA',  unit: 'KG',  min_stock: 2,  category: 'Grãos, Massas e Farinhas' },
      { name: 'AMIDO DE MILHO',       unit: 'KG',  min_stock: 1,  category: 'Grãos, Massas e Farinhas' },
    ]
  },
  {
    group: 'Óleos, Molhos e Temperos',
    items: [
      { name: 'ÓLEO DE SOJA',         unit: 'L',   min_stock: 5,  category: 'Óleos, Molhos e Temperos' },
      { name: 'AZEITE DE OLIVA',      unit: 'L',   min_stock: 2,  category: 'Óleos, Molhos e Temperos' },
      { name: 'SAL REFINADO',         unit: 'KG',  min_stock: 3,  category: 'Óleos, Molhos e Temperos' },
      { name: 'AÇÚCAR CRISTAL',       unit: 'KG',  min_stock: 5,  category: 'Óleos, Molhos e Temperos' },
      { name: 'VINAGRE',              unit: 'L',   min_stock: 2,  category: 'Óleos, Molhos e Temperos' },
      { name: 'MOLHO DE TOMATE',      unit: 'UN',  min_stock: 6,  category: 'Óleos, Molhos e Temperos' },
      { name: 'MOLHO SHOYU',          unit: 'ML',  min_stock: 500, category: 'Óleos, Molhos e Temperos' },
      { name: 'CALDO DE GALINHA',     unit: 'UN',  min_stock: 10, category: 'Óleos, Molhos e Temperos' },
    ]
  },
  {
    group: 'Hortifrúti',
    items: [
      { name: 'TOMATE',               unit: 'KG',  min_stock: 5,  category: 'Hortifrúti' },
      { name: 'CEBOLA',               unit: 'KG',  min_stock: 5,  category: 'Hortifrúti' },
      { name: 'ALHO',                 unit: 'KG',  min_stock: 1,  category: 'Hortifrúti' },
      { name: 'BATATA INGLESA',       unit: 'KG',  min_stock: 5,  category: 'Hortifrúti' },
      { name: 'CENOURA',              unit: 'KG',  min_stock: 3,  category: 'Hortifrúti' },
      { name: 'ALFACE',               unit: 'UN',  min_stock: 5,  category: 'Hortifrúti' },
      { name: 'LIMÃO',                unit: 'KG',  min_stock: 2,  category: 'Hortifrúti' },
      { name: 'COUVE',                unit: 'KG',  min_stock: 1,  category: 'Hortifrúti' },
    ]
  },
  {
    group: 'Bebidas',
    items: [
      { name: 'ÁGUA MINERAL 500ML',   unit: 'UN',  min_stock: 24, category: 'Bebidas' },
      { name: 'REFRIGERANTE 2L',      unit: 'UN',  min_stock: 6,  category: 'Bebidas' },
      { name: 'SUCO DE LARANJA',      unit: 'L',   min_stock: 3,  category: 'Bebidas' },
      { name: 'CERVEJA LATA',         unit: 'UN',  min_stock: 24, category: 'Bebidas' },
    ]
  },
  {
    group: 'Descartáveis e Embalagens',
    items: [
      { name: 'COPO DESCARTÁVEL 200ML', unit: 'PC', min_stock: 100, category: 'Descartáveis e Embalagens' },
      { name: 'PRATO DESCARTÁVEL',      unit: 'PC', min_stock: 50,  category: 'Descartáveis e Embalagens' },
      { name: 'SACOLA PLÁSTICA',        unit: 'PC', min_stock: 100, category: 'Descartáveis e Embalagens' },
      { name: 'PAPEL ALUMÍNIO',         unit: 'UN', min_stock: 2,   category: 'Descartáveis e Embalagens' },
      { name: 'FILME PVC',              unit: 'UN', min_stock: 2,   category: 'Descartáveis e Embalagens' },
    ]
  },
  {
    group: 'Limpeza',
    items: [
      { name: 'DETERGENTE LÍQUIDO',   unit: 'UN',  min_stock: 3,  category: 'Limpeza' },
      { name: 'ESPONJA DE AÇO',       unit: 'PC',  min_stock: 5,  category: 'Limpeza' },
      { name: 'LUVAS DESCARTÁVEIS',   unit: 'PC',  min_stock: 2,  category: 'Limpeza' },
      { name: 'ÁLCOOL 70%',           unit: 'L',   min_stock: 2,  category: 'Limpeza' },
    ]
  },
]

export const TOTAL_PRODUCTS = RESTAURANT_PRODUCTS.reduce((acc, g) => acc + g.items.length, 0)
