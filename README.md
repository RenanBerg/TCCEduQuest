# EduQuest

O **EduQuest** é uma plataforma web educacional gamificada desenvolvida como Trabalho de Conclusão de Curso (TCC), com foco em apoiar estudantes do ensino médio por meio de conteúdos organizados, missões, quizzes, conquistas e ranking.

## Sobre o projeto

O projeto foi pensado como uma **Single Page Application (SPA)** desenvolvida com React, utilizando uma arquitetura moderna, modular e responsiva. A navegação é estruturada com TanStack Router, permitindo a separação entre rotas públicas, rotas autenticadas e rotas administrativas.

A aplicação utiliza o Supabase como backend as a service, com autenticação, banco de dados PostgreSQL e armazenamento de arquivos. Dessa forma, os dados da plataforma podem ser persistidos e organizados de maneira escalável, incluindo perfis de usuários, conteúdos, missões, respostas, pontuações, conquistas e ranking.

## Funcionalidades

- Dashboard do aluno com visão geral do progresso.
- Biblioteca de conteúdos com vídeos, textos e exercícios.
- Sistema de missões com desafios diários e semanais.
- Área de conquistas com badges, troféus e histórico.
- Ranking e competições entre estudantes e turmas.
- Área administrativa para gerenciamento de conteúdos, missões e quizzes.
- Autenticação de usuários com controle de acesso por perfil.

## Arquitetura

A arquitetura do EduQuest foi projetada para ser simples de evoluir e fácil de manter, com separação clara entre interface, navegação e persistência de dados.

- **Frontend:** React.
- **Roteamento:** TanStack Router.
- **Backend as a Service:** Supabase.
- **Banco de dados:** PostgreSQL.
- **Autenticação:** Supabase Auth.
- **Armazenamento:** Supabase Storage.

## Estrutura lógica

A aplicação é organizada em módulos reutilizáveis, como cartões, formulários, listas, dashboards e componentes de navegação. Essa estrutura facilita a expansão futura da plataforma e mantém a interface mais consistente em diferentes áreas do sistema.

## Objetivo

O objetivo do EduQuest é tornar o processo de aprendizagem mais interativo e motivador, combinando elementos de gamificação com uma base técnica moderna para acompanhar o desempenho dos estudantes.

## Tecnologias utilizadas

- React
- TanStack Router
- Supabase Auth
- PostgreSQL
- Supabase Storage
- Componentes reutilizáveis
- Interface responsiva

## Observações

Este projeto foi desenvolvido no contexto acadêmico do TCC e está em evolução contínua, podendo receber novos módulos, ajustes de interface e melhorias de desempenho.

## Licença

Projeto acadêmico sem fins comerciais.
