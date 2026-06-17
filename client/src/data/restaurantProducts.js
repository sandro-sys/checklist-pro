export const RESTAURANT_PRODUCTS = [
  {
    group: 'Carnes e Proteínas',
    items: [
      { name: 'FRANGO INTEIRO',       unit: 'KG',  min_stock: 5 },
      { name: 'PEITO DE FRANGO',      unit: 'KG',  min_stock: 5 },
      { name: 'CARNE MOÍDA',          unit: 'KG',  min_stock: 3 },
      { name: 'ALCATRA',              unit: 'KG',  min_stock: 3 },
      { name: 'COSTELA BOVINA',       unit: 'KG',  min_stock: 2 },
      { name: 'FILE DE PEIXE',        unit: 'KG',  min_stock: 2 },
      { name: 'CAMARÃO',              unit: 'KG',  min_stock: 1 },
      { name: 'OVOS',                 unit: 'DZ',  min_stock: 5 },
    ]
  },
  {
    group: 'Laticínios',
    items: [
      { name: 'LEITE INTEGRAL',       unit: 'L',   min_stock: 10 },
      { name: 'QUEIJO MUSSARELA',     unit: 'KG',  min_stock: 2  },
      { name: 'QUEIJO PRATO',         unit: 'KG',  min_stock: 1  },
      { name: 'MANTEIGA',             unit: 'KG',  min_stock: 1  },
      { name: 'CREME DE LEITE',       unit: 'UN',  min_stock: 6  },
      { name: 'REQUEIJÃO',            unit: 'UN',  min_stock: 3  },
    ]
  },
  {
    group: 'Grãos, Massas e Farinhas',
    items: [
      { name: 'ARROZ',                unit: 'KG',  min_stock: 10 },
      { name: 'FEIJÃO PRETO',         unit: 'KG',  min_stock: 5  },
      { name: 'FEIJÃO CARIOCA',       unit: 'KG',  min_stock: 5  },
      { name: 'FARINHA DE TRIGO',     unit: 'KG',  min_stock: 5  },
      { name: 'MACARRÃO ESPAGUETE',   unit: 'KG',  min_stock: 3  },
      { name: 'MACARRÃO PARAFUSO',    unit: 'KG',  min_stock: 2  },
      { name: 'FARINHA DE MANDIOCA',  unit: 'KG',  min_stock: 2  },
      { name: 'AMIDO DE MILHO',       unit: 'KG',  min_stock: 1  },
    ]
  },
  {
    group: 'Óleos, Molhos e Temperos',
    items: [
      { name: 'ÓLEO DE SOJA',         unit: 'L',   min_stock: 5  },
      { name: 'AZEITE DE OLIVA',      unit: 'L',   min_stock: 2  },
      { name: 'SAL REFINADO',         unit: 'KG',  min_stock: 3  },
      { name: 'AÇÚCAR CRISTAL',       unit: 'KG',  min_stock: 5  },
      { name: 'VINAGRE',              unit: 'L',   min_stock: 2  },
      { name: 'MOLHO DE TOMATE',      unit: 'UN',  min_stock: 6  },
      { name: 'MOLHO SHOYU',          unit: 'ML',  min_stock: 500},
      { name: 'CALDO DE GALINHA',     unit: 'UN',  min_stock: 10 },
    ]
  },
  {
    group: 'Hortifrúti',
    items: [
      { name: 'TOMATE',               unit: 'KG',  min_stock: 5  },
      { name: 'CEBOLA',               unit: 'KG',  min_stock: 5  },
      { name: 'ALHO',                 unit: 'KG',  min_stock: 1  },
      { name: 'BATATA INGLESA',       unit: 'KG',  min_stock: 5  },
      { name: 'CENOURA',              unit: 'KG',  min_stock: 3  },
      { name: 'ALFACE',               unit: 'UN',  min_stock: 5  },
      { name: 'LIMÃO',                unit: 'KG',  min_stock: 2  },
      { name: 'COUVE',                unit: 'KG',  min_stock: 1  },
    ]
  },
  {
    group: 'Bebidas',
    items: [
      { name: 'ÁGUA MINERAL 500ML',   unit: 'UN',  min_stock: 24 },
      { name: 'REFRIGERANTE 2L',      unit: 'UN',  min_stock: 6  },
      { name: 'SUCO DE LARANJA',      unit: 'L',   min_stock: 3  },
      { name: 'CERVEJA LATA',         unit: 'UN',  min_stock: 24 },
    ]
  },
  {
    group: 'Descartáveis e Embalagens',
    items: [
      { name: 'COPO DESCARTÁVEL 200ML', unit: 'PC', min_stock: 100 },
      { name: 'PRATO DESCARTÁVEL',      unit: 'PC', min_stock: 50  },
      { name: 'SACOLA PLÁSTICA',        unit: 'PC', min_stock: 100 },
      { name: 'PAPEL ALUMÍNIO',         unit: 'UN', min_stock: 2   },
      { name: 'FILME PVC',              unit: 'UN', min_stock: 2   },
    ]
  },
  {
    group: 'Limpeza',
    items: [
      { name: 'DETERGENTE LÍQUIDO',   unit: 'UN',  min_stock: 3  },
      { name: 'ESPONJA DE AÇO',       unit: 'PC',  min_stock: 5  },
      { name: 'LUVAS DESCARTÁVEIS',   unit: 'PC',  min_stock: 2  },
      { name: 'ÁLCOOL 70%',           unit: 'L',   min_stock: 2  },
    ]
  },
]

export const TOTAL_PRODUCTS = RESTAURANT_PRODUCTS.reduce((acc, g) => acc + g.items.length, 0)
