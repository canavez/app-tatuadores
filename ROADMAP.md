# Roadmap — App para Tatuadores

Sistema para tatuadores gerenciarem agenda, clientes, finanças e materiais.

**Stack:** Java 25 + Spring Boot + PostgreSQL · React + TypeScript

Cada etapa só é concluída quando o critério de **pronto** for cumprido.

## Etapa 0 — Ambiente e fundamentos
- [x] Instalar JDK 25, Git e extensões Java no VS Code
- [x] Configurar identidade do Git
- [ ] Criar o repositório e fazer o primeiro commit
- [ ] Publicar o repositório no GitHub
- [ ] Revisar Java: classes, listas, `Optional`, exceções, `java.time`
- **Pronto quando:** criar uma classe `Cliente` com regras simples e subir para o GitHub

## Etapa 1 — Primeira API: Clientes
- [ ] Criar projeto Spring Boot e entender a estrutura
- [ ] CRUD de clientes (Controller → Service → Repository)
- [ ] PostgreSQL + JPA + migrations com Flyway
- **Pronto quando:** criar/buscar clientes via Postman e explicar o caminho da requisição até o banco

## Etapa 2 — Agenda
- [ ] Agendamentos com status (orçamento → confirmado → realizado → cancelado)
- [ ] Impedir conflito de horários
- [ ] Consultas por dia, semana e mês
- **Pronto quando:** a API recusa um horário em conflito com erro claro

## Etapa 3 — Qualidade profissional
- [ ] Validação e tratamento global de erros
- [ ] Testes unitários (JUnit, Mockito) e de integração (Testcontainers)
- [ ] Docker Compose
- [ ] Documentação com Swagger
- **Pronto quando:** regras da agenda cobertas por testes e README explica como rodar

## Etapa 4 — Autenticação e multi-tatuador
- [ ] Cadastro/login com Spring Security + JWT
- [ ] Cada tatuador acessa apenas os próprios dados
- **Pronto quando:** existe teste provando que um tatuador não acessa dados de outro

## Etapa 5 — Finanças
- [ ] Sinal, pagamento final e forma de pagamento
- [ ] Despesas
- [ ] Resumo mensal (faturamento, despesas, lucro) com `BigDecimal`
- **Pronto quando:** resumo mensal correto e testado

## Etapa 6 — Materiais e estoque
- [ ] Cadastro de materiais, entradas e saídas
- [ ] Baixa de materiais por sessão
- [ ] Alerta de estoque baixo
- **Pronto quando:** registrar uma sessão atualiza o estoque e gera alerta

## Etapa 7 — Frontend
- [ ] React + TypeScript + Vite
- [ ] Telas: login, agenda, clientes, finanças, estoque
- **Pronto quando:** um tatuador usa o sistema inteiro pelo celular

## Etapa 8 — Deploy e CI/CD
- [ ] Backend, banco e frontend online
- [ ] GitHub Actions rodando testes a cada push
- **Pronto quando:** link público funcionando no currículo

## Etapa 9 — Diferenciais
- [ ] Ficha de anamnese e termo de consentimento digitais (LGPD)
- [ ] Lembrete automático de sessão
- [ ] Portfólio público com link de agendamento
- [ ] Funcionalidade com IA (ex.: sugestão de orçamento)
