# CheckList Pro — Manual do Gestor

> Versão 1.0 · Junho 2026

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Acesso ao Sistema](#2-acesso-ao-sistema)
3. [Configuração Inicial](#3-configuração-inicial)
4. [Módulo de Checklists](#4-módulo-de-checklists)
5. [Módulo de Estoque](#5-módulo-de-estoque)
6. [Gestão de Equipe](#6-gestão-de-equipe)
7. [Relatórios](#7-relatórios)
8. [Dicas e Boas Práticas](#8-dicas-e-boas-práticas)

---

## 1. Visão Geral

O **CheckList Pro** é uma plataforma de controle operacional para restaurantes e estabelecimentos comerciais. Com ele você pode:

- Criar checklists de abertura, fechamento, limpeza e qualquer processo operacional
- Controlar o estoque com contagens, listas de compras e inventários
- Atribuir tarefas para colaboradores específicos
- Acompanhar o histórico de tudo que foi executado

O sistema funciona pelo **navegador**, no computador ou no celular — sem necessidade de instalar nada.

---

## 2. Acesso ao Sistema

### Login
Acesse o endereço do sistema e informe seu **e-mail** e **senha**.

Na primeira vez que um colaborador acessa, ele pode receber uma **senha temporária** gerada pelo gestor. O sistema pedirá para trocar a senha no primeiro login.

### Esqueci minha senha
Na tela de login, clique em **"Esqueci minha senha"**, informe o e-mail cadastrado e siga as instruções enviadas.

---

## 3. Configuração Inicial

Antes de usar o sistema, configure os dados da empresa e da equipe. Isso só precisa ser feito uma vez.

### 3.1 Dados da Empresa
**Menu → Empresa**

Preencha nome, CNPJ, telefone e endereço. Essas informações aparecem nos relatórios e exportações.

### 3.2 Cadastro de Equipe
**Menu → Equipe → Novo Colaborador**

Para cada colaborador informe:
- **Nome completo**
- **E-mail** (será o login dele)
- **Senha temporária** (o sistema pedirá troca no primeiro acesso)
- **Cargo** (opcional — para organização interna)

> O colaborador só acessa o sistema após o cadastro feito pelo gestor.

---

## 4. Módulo de Checklists

### 4.1 O que é um Checklist?

Um checklist é uma lista de verificação que o colaborador preenche durante a operação. Exemplos comuns:

- Abertura do restaurante
- Fechamento do caixa
- Vistoria da cozinha
- Limpeza dos equipamentos

### 4.2 Criar um Checklist
**Menu → Checklists → Novo Checklist**

**Passo 1 — Templates prontos**
O sistema oferece modelos prontos (abertura, fechamento, limpeza etc.). Clique no template desejado para carregar os itens automaticamente. Você pode editar depois.

Para criar do zero, clique em **"Criar do zero"**.

**Passo 2 — Informações básicas**

| Campo | Descrição |
|-------|-----------|
| Título | Nome do checklist. Ex: "Abertura do Restaurante" |
| Descrição | Orientação geral para quem vai executar |
| Categoria | Agrupa checklists por área (Cozinha, Operação, Limpeza...) |
| Periodicidade | Com que frequência deve ser executado (Diário, Semanal, Mensal...) |
| Horário sugerido | Referência de horário para execução |

**Passo 3 — Itens do checklist**

Cada item é uma tarefa a ser verificada. Existem três tipos:

| Tipo | Ícone | Quando usar |
|------|-------|-------------|
| **Checkbox** | ☑ | Tarefa simples — marcar como feito ou não |
| **Foto** | 📷 | Exige registro fotográfico como evidência |
| **Dissertativo** | 📝 | Exige uma resposta em texto (até 30 palavras) |

Para adicionar itens, clique nos botões **Checkbox**, **Foto** ou **Texto** no canto superior da seção.

**Importar da Lista de Estoque**
Se você já tem uma lista de produtos no módulo de estoque, pode importá-la direto como itens do checklist. Clique em **"Da Lista de Estoque"**, selecione a lista e os produtos que deseja incluir.

**Passo 4 — Salvar**
Clique em **"Criar Checklist"**. O checklist fica disponível para execução imediatamente.

---

### 4.3 Compartilhar e Executar um Checklist

Após criar o checklist, ele aparece na lista em **Menu → Checklists**.

**Para o colaborador executar:**

1. O gestor copia o link de execução (botão de compartilhar na lista)
2. Envia para o colaborador via WhatsApp ou outro canal
3. O colaborador acessa o link, faz login e executa

**Durante a execução:**
- O colaborador marca cada item conforme realiza
- Pode registrar foto ou digitar resposta nos tipos correspondentes
- Pode marcar como **"N/A"** (não se aplica) ou **"Não executado"**
- Uma barra de progresso mostra quantos itens foram respondidos
- Ao final, clica em **"Finalizar Checklist"**

**Comprovante:**
Ao finalizar, o sistema gera um comprovante que pode ser baixado como imagem ou enviado por e-mail e WhatsApp.

---

### 4.4 Histórico de Execuções
**Menu → Checklists → (selecione um checklist) → Histórico**

Veja todas as execuções realizadas: quem executou, quando, índice de conformidade e respostas individuais.

---

## 5. Módulo de Estoque

O módulo de estoque controla o saldo de produtos e ingredientes do estabelecimento.

### 5.1 Cadastro de Produtos
**Menu → Estoque → Produtos → Novo Produto**

Para cada produto informe:

| Campo | Descrição |
|-------|-----------|
| Nome | Salvo automaticamente em CAIXA ALTA |
| Categoria | Carnes, Laticínios, Hortifrúti, Bebidas etc. |
| Unidade | KG, L, UN, CX etc. |
| Estoque mínimo | Quando abaixo desse valor, o sistema exibe alerta |

**Importar lista padrão de restaurante**
Clique em **"Importar Padrão"** para carregar 50 produtos pré-configurados em 8 grupos (Carnes, Laticínios, Hortifrúti, Bebidas, Limpeza etc.). Selecione os que se aplicam ao seu negócio e importe.

**Exclusão em massa**
Para desativar vários produtos de uma vez: marque as caixas de seleção na tabela (ou clique no ☑ do cabeçalho para selecionar todos) e clique em **"Desativar selecionados"** na barra vermelha que aparece.

> **Atenção:** o sistema faz **desativação** (soft-delete), não exclusão permanente. O histórico de movimentos é preservado.

---

### 5.2 Listas de Estoque
**Menu → Estoque → Listas → Nova Lista**

As listas são a forma de registrar contagens, compras e inventários.

**Tipos de lista:**

| Tipo | O que faz ao finalizar |
|------|----------------------|
| **Contagem** | O saldo do produto vira o valor contado |
| **Compras** | A quantidade comprada é somada ao saldo atual |
| **Inventário** | Igual à contagem — substitui o saldo |

---

### 5.3 Criar e Atribuir uma Lista

**Passo 1 — Nova lista**
Escolha o tipo, dê um nome (ou deixe gerar automaticamente com data) e **atribua a um colaborador** pelo campo "Atribuir a".

**Passo 2 — Montar os itens**
Na tela de configuração da lista, adicione os produtos com autocomplete. Para cada item defina a unidade e, se quiser, uma observação.

> A atribuição também pode ser alterada depois, diretamente na tela de configuração da lista.

---

### 5.4 Execução da Contagem pelo Colaborador

Após receber a atribuição, o colaborador:

1. Faz login no sistema
2. Acessa **Menu → Estoque → Listas**
3. Vê a seção **"Minhas Contagens"** em destaque no topo
4. Clica em **"Iniciar Contagem"**
5. Para cada produto, digita a quantidade no campo grande central
6. O valor é salvo automaticamente ao passar para o próximo item
7. A barra de progresso mostra o avanço em tempo real

**Finalizar:**
Ao terminar, o colaborador clica em **"Finalizar e Atualizar Estoque"**. O saldo de todos os produtos com quantidade preenchida é atualizado automaticamente.

> Itens sem quantidade preenchida são ignorados na finalização.

---

### 5.5 Lançamento Manual de Movimento
**Menu → Estoque → Produtos → (ícone ✓ na linha do produto)**

Para registrar uma entrada, saída ou ajuste avulso sem criar uma lista. Informe o tipo, a quantidade e o motivo.

---

### 5.6 Histórico de Movimentos
**Menu → Estoque → Histórico**

Filtre por produto, tipo de movimento (entrada / saída / ajuste) e período. Todas as alterações de saldo ficam registradas com usuário, data e hora.

---

### 5.7 Exportação TXT
Em qualquer lista (aberta ou finalizada), clique em **"Exportar TXT"**. O arquivo gerado contém:

- Cabeçalho com nome da empresa, tipo e data
- Tabela de produtos com quantidade e unidade
- Seção de alertas para produtos abaixo do estoque mínimo

---

## 6. Gestão de Equipe

**Menu → Equipe**

| Ação | Como fazer |
|------|-----------|
| Adicionar colaborador | Botão "Novo Colaborador" |
| Editar dados | Clique no colaborador → editar |
| Desativar acesso | Toggle "Ativo/Inativo" na linha do colaborador |
| Redefinir senha | Opção de troca de senha no perfil |

> O colaborador desativado não consegue mais fazer login, mas o histórico de atividades dele é preservado.

---

## 7. Relatórios

**Menu → Relatórios**

Acompanhe o desempenho operacional da equipe:

- **Taxa de conformidade** por checklist e período
- **Execuções realizadas** por colaborador
- **Itens mais reprovados** — identifica pontos críticos da operação
- **Comparativo de períodos** — evolução ao longo do tempo

---

## 8. Dicas e Boas Práticas

**Checklists**
- Use títulos claros e objetivos nos itens. Ex: "Temperatura do freezer verificada" em vez de "Freezer".
- Marque como **Obrigatório** apenas os itens críticos — o sistema bloqueia a finalização se itens obrigatórios não forem respondidos.
- Use o tipo **Foto** para itens que precisam de evidência (equipamentos, registros visuais).
- Crie checklists separados por turno para facilitar o controle.

**Estoque**
- Defina o **estoque mínimo** para todos os produtos essenciais — o sistema alerta automaticamente quando o saldo cai abaixo.
- Use o tipo **Compras** para listas de mercado — o saldo é somado ao existente.
- Use o tipo **Contagem** para inventários periódicos — o saldo é substituído pelo valor contado.
- Atribua cada contagem a um colaborador diferente para dividir o trabalho.

**Equipe**
- Oriente os colaboradores a sempre fazer login antes de iniciar qualquer tarefa.
- No celular, o sistema funciona como aplicativo — basta acessar pelo navegador.
- Use nomes descritivos nos checklists e listas para facilitar a identificação no celular.

---

*CheckList Pro · Suporte disponível pelo menu Ajuda dentro do sistema.*
