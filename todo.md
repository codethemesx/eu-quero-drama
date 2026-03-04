# Eu Quero Dramas - TODO

## Banco de Dados
- [x] Schema: tabela users com autenticação própria (email/senha/hash)
- [x] Schema: tabela dramas (novelas) com capa, preço, desconto, episódios
- [x] Schema: tabela episodes com link de download
- [x] Schema: tabela orders (pedidos/carrinho) com status pix
- [x] Schema: tabela order_items (itens do pedido)
- [x] Schema: tabela purchases (compras confirmadas por usuário)
- [x] Schema: tabela system_settings (chave MP, link WhatsApp)
- [x] Migração do banco de dados

## Backend / API
- [x] Autenticação própria: registro com email/senha (bcrypt)
- [x] Autenticação própria: login com JWT
- [x] Seed do usuário admin (codethemesx@gmail.com / #Tatarav0)
- [x] API pública: listar novelas
- [x] API pública: detalhe da novela
- [x] API protegida: criar pedido com múltiplas novelas
- [x] API protegida: criar pagamento Pix via Mercado Pago (server-side seguro)
- [x] API protegida: consultar status do pagamento (polling)
- [x] API protegida: listar novelas compradas do usuário
- [x] API protegida: listar episódios de novela comprada (com verificação de posse)
- [x] API admin: CRUD de novelas
- [x] API admin: CRUD de episódios
- [x] API admin: dashboard de vendas e conversão
- [x] API admin: salvar configurações (chave MP, link WhatsApp)
- [x] API admin: listar todos os pedidos
- [x] Segurança: credenciais MP nunca expostas ao cliente

## Frontend Público
- [x] Tela de Login (email/senha)
- [x] Tela de Registro
- [x] Catálogo de novelas (cards com capa, título, preço, desconto, episódios)
- [x] Página de detalhes da novela
- [x] Tela de checkout Pix (QR Code + copia-e-cola)
- [x] Polling de status do pagamento (pendente → pago → expirado)
- [x] Banner de convite WhatsApp (dismissível, salvo no localStorage)

## Área do Usuário
- [x] Página "Minhas Novelas" com lista de compras
- [x] Página de episódios com links de download (expandível)
- [x] Proteção de rotas autenticadas

## Painel Administrativo
- [x] Dashboard: métricas de vendas, conversão, receita
- [x] Gráfico de vendas por período (recharts)
- [x] Gerenciamento de novelas (listar, adicionar, editar, excluir)
- [x] Preview de capa da novela por URL
- [x] Gerenciamento de episódios (adicionar, editar, excluir por link)
- [x] Configurações: chave API Mercado Pago (campo seguro)
- [x] Configurações: link WhatsApp comunidade
- [x] Lista de todos os pedidos com status

## Estilo e UX
- [x] Tema escuro (não totalmente preto) com detalhes laranja
- [x] Design responsivo mobile-first
- [x] Loading states e feedback visual (toast)
- [x] Tratamento de erros amigável
- [x] Fonte Inter do Google Fonts
- [x] Scrollbar customizada

## Testes
- [x] Testes de autenticação (registro, login, logout)
- [x] Testes de controle de acesso admin
- [x] Testes de listagem de dramas
- [x] 10 testes passando


## Correções
- [x] Corrigir erro de inserção de order_items (orderId não era passado corretamente)
- [x] Corrigir função createOrder para retornar ID corretamente (problema com insertId do Drizzle)
- [x] Aumentar campo value em system_settings para suportar chaves longas do Mercado Pago
- [x] Corrigir nomes de colunas no dashboard (DATE(paidAt) ao invés de DATE(paid_at))
- [x] Corrigir retorno de pixQrCodeBase64 na função getStatus
- [x] Implementar webhook de Mercado Pago para confirmação automática de pagamento
- [x] Criar README.md com instruções de deploy no Vercel
- [x] Criar vercel.json com configuração de build
- [ ] Exportar projeto para GitHub (codethemesx/eu-quero-dramas)
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Configurar webhook do Mercado Pago no Vercel
