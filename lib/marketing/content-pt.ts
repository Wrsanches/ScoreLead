import type { MarketingPageTranslation } from "./types"

export const marketingContentPt: Record<string, MarketingPageTranslation> = {
  "feature-ai-lead-discovery": {
    eyebrow: "Funcionalidade · Descoberta de contas",
    title: "Descoberta de Leads com IA por Mercado",
    description:
      "Encontre empresas B2B por mercado, região, serviço e perfil de conta, preservando as evidências que explicam por que cada empresa pertence ao pipeline.",
    answer:
      "A descoberta de leads com IA transforma uma hipótese específica de cliente ideal em uma busca repetível. O ScoreLead combina sinais públicos da web e de mapas, normaliza os resultados e entrega registros revisáveis em vez de uma lista sem explicação.",
    highlights: [
      "Busque por região, palavra-chave, serviço e critérios de conta.",
      "Preserve o contexto das fontes e remova empresas duplicadas.",
      "Leve descobertas qualificadas para enriquecimento e pontuação.",
    ],
    sections: [
      {
        heading: "Comece com uma definição de mercado testável",
        paragraphs: [
          "Um bom trabalho de descoberta define segmento, geografia, sinais observáveis de fit e desqualificadores. O ScoreLead usa essas restrições para buscar com amplitude sem tratar toda empresa como igualmente relevante.",
        ],
        points: ["Defina o mercado", "Escolha a região", "Registre sinais positivos e negativos"],
      },
      {
        heading: "Revise evidências, não apenas nomes",
        paragraphs: [
          "Site, localização, serviços, reputação e canais de contato tornam mais fácil aceitar, rejeitar ou pesquisar melhor uma conta antes do outreach.",
        ],
      },
      {
        heading: "Use os resultados para melhorar a próxima busca",
        paragraphs: [
          "Contas aceitas, motivos de rejeição, respostas e oportunidades mostram se a hipótese inicial era útil e ajudam a tornar a próxima rodada mais precisa.",
        ],
      },
    ],
    proofLabel: "O que a funcionalidade faz — e o que não faz",
    proof:
      "O ScoreLead reduz pesquisa repetitiva e organiza evidências públicas. Ele não garante que uma empresa esteja pronta para comprar; seu time controla a definição, a revisão e a decisão de contato.",
    ctaTitle: "Execute sua primeira busca focada.",
    ctaDescription: "Transforme uma hipótese de mercado em uma lista de contas revisável.",
    ctaLabel: "Começar a descobrir leads",
  },
  "feature-lead-scoring": {
    eyebrow: "Funcionalidade · Priorização",
    title: "Software de Lead Scoring B2B com IA",
    description:
      "Priorize contas com software de lead scoring B2B por IA que mantém fit, alcance, confiança, engajamento, prontidão e evidências visíveis.",
    answer:
      "O ScoreLead é um software de lead scoring B2B para equipes que precisam priorizar contas com explicações. Ele transforma sinais observáveis em uma fila consistente e mantém cada dimensão aberta para revisão, correção e melhoria.",
    highlights: [
      "Separe fit da empresa de momento e prontidão.",
      "Veja evidências por dimensão, não apenas um número opaco.",
      "Use faixas claras para revisão, enriquecimento ou outreach.",
    ],
    sections: [
      {
        heading: "Aplique o lead scoring ao seu ICP real",
        paragraphs: [
          "Comece pelas condições da empresa ligadas ao valor para o cliente e separe requisitos obrigatórios de sinais de ordenação. O ScoreLead avalia dimensões que consegue observar e explicar.",
        ],
        points: ["Fit da empresa", "Alcance", "Confiança", "Potencial de engajamento", "Prontidão"],
      },
      {
        heading: "Mantenha cada score de IA explicável",
        paragraphs: [
          "Cada conta mantém evidências por dimensão junto do total. Dados ausentes não viram score negativo, e valores desconhecidos ficam separados de sinais fracos.",
        ],
        points: ["Dimensões visíveis", "Fontes", "Valores desconhecidos", "Revisão humana"],
      },
      {
        heading: "Calibre o scoring com resultados comerciais",
        paragraphs: [
          "Compare scores com contas aceitas, respostas, oportunidades, clientes e motivos de rejeição. Falsos positivos e negativos mostram quando modelo, ICP ou dados precisam mudar.",
        ],
      },
    ],
    proofLabel: "Uso responsável",
    proof:
      "Uma nota apoia a priorização humana. Ela não deve ser apresentada como intenção de compra, usar atributos sensíveis ocultos ou substituir a revisão de um representante.",
    ctaTitle: "Deixe a próxima conta mais óbvia.",
    ctaDescription: "Crie uma fila de revisão com o raciocínio anexado.",
    ctaLabel: "Testar lead scoring",
  },
  "feature-lead-enrichment": {
    eyebrow: "Funcionalidade · Inteligência de contas",
    title: "Software de Enriquecimento de Leads B2B",
    description:
      "Transforme nome e domínio em enriquecimento de leads B2B com fontes para qualificação, roteamento, personalização, pesquisa e exportação ao CRM.",
    answer:
      "O ScoreLead é um software de enriquecimento de leads B2B criado para reduzir incerteza, não maximizar campos. Ele organiza identidade, fit, problema, contato e personalização com o contexto necessário para verificação.",
    highlights: [
      "Colete contexto público sobre empresa, serviços, localização e contato.",
      "Normalize campos sem apagar a evidência original.",
      "Identifique valores ausentes ou inferidos em vez de apresentar suposições.",
    ],
    sections: [
      {
        heading: "Enriqueça leads para uma decisão específica",
        paragraphs: [
          "Cada campo deve apoiar fit, hipótese de problema, planejamento de contato ou uma mensagem melhor. Dados sem uso criam manutenção e não melhoram a decisão.",
        ],
      },
      {
        heading: "Preserve fontes, datas e incerteza",
        paragraphs: [
          "Dados da web mudam. URLs de origem, datas de observação e níveis de confiança ajudam a verificar detalhes importantes antes do outreach.",
        ],
        points: ["Identidade", "Fit", "Evidência do problema", "Contato", "Personalização"],
      },
      {
        heading: "Exporte registros mais limpos para o CRM",
        paragraphs: [
          "Formatos consistentes e detecção de duplicidade facilitam filtros e exportação para o CRM sem perder o contexto usado na revisão.",
        ],
      },
    ],
    proofLabel: "Padrão de qualidade",
    proof:
      "O ScoreLead usa fontes públicas e provedores configurados. A cobertura varia por empresa e região; detalhes importantes devem ser verificados antes de decisões ou mensagens de alto impacto.",
    ctaTitle: "Dê contexto útil a cada conta.",
    ctaDescription: "Enriqueça empresas descobertas antes de investir tempo em outreach.",
    ctaLabel: "Enriquecer leads",
  },
  "feature-outreach-automation": {
    eyebrow: "Funcionalidade · Outreach comercial",
    title: "Automação de Outreach B2B com Contexto",
    description:
      "Crie sequências B2B a partir de evidências verificadas, mantendo uma revisão humana antes do uso ou agendamento.",
    answer:
      "O ScoreLead transforma contexto revisado em um ponto de partida para outreach. O sistema pode usar detalhes relevantes e adaptar o idioma, mas o remetente continua responsável por exatidão, posicionamento, consentimento e regras do canal.",
    highlights: [
      "Crie introduções, follow-ups e mensagens orientadas a valor.",
      "Use evidências revisadas em vez de campos genéricos.",
      "Gere outreach em inglês, português e espanhol.",
    ],
    sections: [
      {
        heading: "Personalize pela relevância",
        paragraphs: [
          "Boa personalização conecta uma observação verificável ao problema resolvido pelo produto. Evita elogios vazios, familiaridade inventada e detalhes sem relação com a proposta.",
        ],
      },
      {
        heading: "Mantenha aprovação humana",
        paragraphs: [
          "Revise nomes, afirmações, tom, momento e chamada para ação. Contas de maior valor merecem edição mais profunda.",
        ],
        points: ["Verifique a evidência", "Revise a hipótese de valor", "Cheque a ação pedida", "Respeite regras locais"],
      },
      {
        heading: "Meça conversas, não volume",
        paragraphs: [
          "Acompanhe respostas positivas, reuniões qualificadas, objeções e opt-outs para saber se targeting e posicionamento estão melhorando.",
        ],
      },
    ],
    proofLabel: "Responsabilidade do remetente",
    proof:
      "O ScoreLead cria rascunhos; ele não cria permissão de contato. Usuários devem seguir regras aplicáveis de privacidade, comunicação eletrônica, plataformas e descadastro.",
    ctaTitle: "Prepare um outreach melhor em menos tempo.",
    ctaDescription: "Comece pelo contexto da conta e mantenha seu time no controle.",
    ctaLabel: "Criar outreach",
  },
  "feature-sales-pipeline": {
    eyebrow: "Funcionalidade · Fluxo de trabalho",
    title: "Pipeline B2B Ligado a Evidências",
    description:
      "Acompanhe empresas da descoberta à conversão sem perder o contexto usado para enriquecer, pontuar e qualificá-las.",
    answer:
      "O ScoreLead liga cada etapa do pipeline ao trabalho anterior. O time vê o que foi encontrado, por que a conta foi priorizada, qual outreach foi preparado e o que aconteceu depois.",
    highlights: [
      "Acompanhe contas da descoberta ao status de cliente.",
      "Revise jobs, scores, mensagens e status no mesmo fluxo.",
      "Use rejeições e conversões para melhorar novas buscas.",
    ],
    sections: [
      {
        heading: "Crie definições operacionais de etapa",
        paragraphs: [
          "Cada etapa deve representar trabalho concluído e uma próxima ação. Descoberta, enriquecimento, scoring, outreach e conversão só ajudam quando usados de forma consistente.",
        ],
      },
      {
        heading: "Mantenha qualidade visível",
        paragraphs: [
          "Detecção de duplicidade, fontes e raciocínio da pontuação continuam ligados ao registro para que o avanço no pipeline não esconda dados fracos.",
        ],
        points: ["Jobs de descoberta", "Enriquecimento", "Revisão de score", "Status de outreach", "Feedback de conversão"],
      },
      {
        heading: "Aprenda com movimento e rejeição",
        paragraphs: [
          "Tempo por etapa, taxa de aceitação, rejeições e conversão mostram onde targeting ou processo precisam de atenção.",
        ],
      },
    ],
    proofLabel: "Princípio de medição",
    proof:
      "Atividade no pipeline não é receita. O ScoreLead torna o fluxo observável; resultados dependem de oferta, fit de mercado, execução e momento.",
    ctaTitle: "Conecte pesquisa de leads à ação.",
    ctaDescription: "Mantenha descoberta, qualificação e outreach no mesmo fluxo.",
    ctaLabel: "Construir seu pipeline",
  },
  "use-case-agencies": {
    eyebrow: "Caso de uso · Agências",
    title: "Geração de Leads B2B para Agências",
    description:
      "Crie buscas focadas por cliente ou serviço, padronize a qualificação e prepare outreach relevante sem misturar hipóteses de mercado.",
    answer:
      "Agências podem separar workspaces, definir um ICP por campanha e criar fluxos revisáveis de descoberta e outreach. Assim, o método de pesquisa fica mais fácil de explicar e repetir entre contas.",
    highlights: [
      "Separe alvos, evidências e outreach de cada cliente.",
      "Reutilize o processo sem reutilizar mensagens genéricas.",
      "Exporte registros qualificados para entrega ou CRM.",
    ],
    sections: [
      {
        heading: "Transforme o briefing em critérios observáveis",
        paragraphs: [
          "Converta o posicionamento de cada cliente em sinais obrigatórios, preferências e desqualificadores antes de iniciar a descoberta.",
        ],
      },
      {
        heading: "Mostre o trabalho por trás da lista",
        paragraphs: [
          "Fontes, dimensões do score e motivos de rejeição tornam a entrega mais defensável do que uma planilha de nomes sem explicação.",
        ],
        points: ["ICP por cliente", "Contas com evidências", "Fila de revisão", "Outreach localizado"],
      },
      {
        heading: "Reporte qualidade",
        paragraphs: [
          "Acompanhe contas aceitas, conversas positivas e feedback por segmento. Use os resultados para revisar a próxima busca.",
        ],
      },
    ],
    proofLabel: "Melhor encaixe",
    proof:
      "O ScoreLead é mais útil para agências responsáveis por targeting e qualificação. Não substitui aprovação do cliente, conformidade do canal ou uma oferta diferenciada.",
    ctaTitle: "Execute prospecção focada para cada cliente.",
    ctaDescription: "Dê a cada campanha sua própria lógica e trilha de evidências.",
    ctaLabel: "Criar fluxo para agência",
  },
  "use-case-b2b-sales-teams": {
    eyebrow: "Caso de uso · Times de vendas",
    title: "Prospecção Compartilhada para Vendas B2B",
    description:
      "Alinhe descoberta, qualificação, scoring e outreach B2B em torno de uma definição visível de bom prospect e evidências compartilhadas.",
    answer:
      "O ScoreLead oferece um fluxo comum para decidir quais empresas merecem atenção. Representantes veem as evidências, entendem o score e registram resultados que melhoram o targeting.",
    highlights: [
      "Padronize pesquisa sem remover o julgamento do representante.",
      "Priorize contas com dimensões explicáveis.",
      "Conecte respostas e rejeições às decisões de targeting.",
    ],
    sections: [
      {
        heading: "Torne o ICP utilizável",
        paragraphs: [
          "Converta documentos de estratégia em filtros, critérios de revisão e desqualificadores aplicáveis no trabalho semanal.",
        ],
      },
      {
        heading: "Crie uma fila de revisão consistente",
        paragraphs: [
          "Use scoring para ordenar o trabalho e deixe cada representante verificar a evidência e escolher a próxima ação.",
        ],
        points: ["Definição de conta", "Revisão de evidência", "Faixas de prioridade", "Feedback de resultado"],
      },
      {
        heading: "Treine com exemplos reais",
        paragraphs: [
          "Contas aceitas e rejeitadas ajudam líderes a calibrar o entendimento do time sobre fit, prontidão e relevância.",
        ],
      },
    ],
    proofLabel: "Princípio de adoção",
    proof:
      "Um fluxo ganha confiança quando representantes podem inspecioná-lo e corrigi-lo. O ScoreLead mantém o raciocínio visível.",
    ctaTitle: "Dê ao time uma definição compartilhada de boa conta.",
    ctaDescription: "Transforme critérios de targeting em trabalho comercial repetível.",
    ctaLabel: "Configurar o time",
  },
  "use-case-b2b-startups": {
    eyebrow: "Caso de uso · Startups",
    title: "Geração de Leads para Startups B2B",
    description:
      "Teste hipóteses B2B estreitas, encontre empresas compatíveis e preserve evidências para aprender com as primeiras conversas.",
    answer:
      "Times iniciais precisam de velocidade de aprendizado, não apenas volume. O ScoreLead ajuda founders a definir segmentos testáveis, pesquisar com consistência e comparar respostas com as hipóteses da busca.",
    highlights: [
      "Teste um segmento e uma hipótese de problema por vez.",
      "Concentre atenção em contas de maior confiança.",
      "Registre aceitação, objeções e conversões.",
    ],
    sections: [
      {
        heading: "Comece estreito o bastante para aprender",
        paragraphs: [
          "Um mercado restrito produz feedback interpretável. Defina quem tem o problema, onde encontrar essas empresas e quais sinais tornam a hipótese plausível.",
        ],
      },
      {
        heading: "Automatize repetição, mantenha conversas humanas",
        paragraphs: [
          "Use automação para encontrar e organizar contas e reserve o tempo dos founders para verificação, posicionamento e conversas diretas.",
        ],
        points: ["Hipótese de mercado", "Evidência da conta", "Revisão do founder", "Iteração semanal"],
      },
      {
        heading: "Mude uma hipótese por vez",
        paragraphs: [
          "Compare respostas, reuniões e objeções por segmento. Mudanças controladas revelam se alvo, oferta ou mensagem precisam de revisão.",
        ],
      },
    ],
    proofLabel: "Realidade de estágio inicial",
    proof:
      "Nenhuma ferramenta cria product-market fit. O ScoreLead ajuda startups a executar uma busca mais disciplinada e preservar evidências para decisões melhores.",
    ctaTitle: "Transforme sua próxima hipótese em um teste.",
    ctaDescription: "Encontre um conjunto focado e aprenda com a resposta.",
    ctaLabel: "Testar um mercado",
  },
  "use-case-b2b-companies": {
    eyebrow: "Caso de uso · Empresas B2B",
    title: "Descoberta de Contas B2B entre Times",
    description:
      "Expanda a prospecção para segmentos ou regiões preservando padrões de qualificação, fontes e mensagens locais.",
    answer:
      "Empresas B2B podem tornar a pesquisa consistente entre regiões sem apagar diferenças locais. Critérios compartilhados criam governança; buscas e outreach localizados preservam o contexto.",
    highlights: [
      "Aplique padrões de qualificação entre regiões.",
      "Mantenha evidências locais e idioma visíveis.",
      "Exporte registros normalizados e sem duplicidade.",
    ],
    sections: [
      {
        heading: "Separe regras globais de sinais locais",
        paragraphs: [
          "Mantenha requisitos obrigatórios consistentes e permita que geografia, idioma, serviços e maturidade moldem a descoberta local.",
        ],
      },
      {
        heading: "Revise dados antes da entrada no CRM",
        paragraphs: [
          "Normalize identidade, preserve fontes e resolva duplicidades antes de criar outro projeto de limpeza.",
        ],
        points: ["ICP compartilhado", "Buscas regionais", "Revisão de qualidade", "Exportação para CRM"],
      },
      {
        heading: "Compare qualidade por segmento",
        paragraphs: [
          "Meça aceitação, avanço e conversão por região ou segmento para investir onde produto e mensagem têm evidência mais forte.",
        ],
      },
    ],
    proofLabel: "Princípio de governança",
    proof:
      "Padronização deve melhorar a explicação, não apagar o julgamento local. O ScoreLead mantém o contexto junto da conta.",
    ctaTitle: "Escale a pesquisa sem perder contexto.",
    ctaDescription: "Crie fluxos consistentes para cada mercado.",
    ctaLabel: "Planejar fluxo regional",
  },
  "compare-manual-lead-research": {
    eyebrow: "Comparação · Fluxo",
    title: "Pesquisa Manual vs. Automação com IA",
    description:
      "Compare controle, velocidade, qualidade da evidência e manutenção entre pesquisa manual e descoberta assistida.",
    answer:
      "A pesquisa manual oferece controle próximo, mas se torna cara e inconsistente em escala. IA acelera busca e normalização repetitivas, mas exige alvo preciso, revisão com fontes e julgamento humano.",
    highlights: [
      "O trabalho manual é flexível, porém difícil de padronizar.",
      "Automação melhora volume e repetibilidade.",
      "O melhor processo combina automação e revisão responsável.",
    ],
    sections: [
      {
        heading: "Onde a pesquisa manual é melhor",
        paragraphs: [
          "Uma pessoa experiente interpreta mercados incomuns, valida sinais sutis e se adapta. Essa profundidade é valiosa para contas estratégicas.",
        ],
      },
      {
        heading: "Onde a automação agrega valor",
        paragraphs: [
          "Busca, extração, normalização, duplicidade e primeiro scoring são repetitivos. Um sistema estruturado executa essas etapas de forma consistente.",
        ],
        points: ["Velocidade", "Repetibilidade", "Preservação de evidências", "Exceções humanas"],
      },
      {
        heading: "Adote um modelo híbrido",
        paragraphs: [
          "Automatize coleta e triagem e concentre pesquisa manual em contas prioritárias ou incertas. Meça custo por conta aceita.",
        ],
      },
    ],
    proofLabel: "Comparação justa",
    proof:
      "O ScoreLead pode reduzir trabalho repetitivo, mas o valor depende da complexidade do mercado, disponibilidade de dados, revisão e custo do processo atual.",
    ctaTitle: "Leve pesquisa repetitiva a um sistema revisável.",
    ctaDescription: "Mantenha julgamento humano onde ele cria mais valor.",
    ctaLabel: "Comparar com seu fluxo",
  },
  "compare-spreadsheets": {
    eyebrow: "Comparação · Operações",
    title: "ScoreLead vs. planilhas para prospecção B2B",
    description:
      "Entenda quando uma planilha basta e quando descoberta, fontes, scoring, duplicidade e workflow precisam de um sistema.",
    answer:
      "Planilhas são flexíveis para listas pequenas e temporárias. Elas ficam frágeis quando o time precisa de descoberta repetível, histórico de fonte, scoring consistente, controle de duplicidade e responsabilidade compartilhada.",
    highlights: [
      "Planilhas continuam úteis para análise e exportação.",
      "Um fluxo conectado reduz cópia manual e fórmulas divergentes.",
      "Fontes e lógica de pontuação acompanham cada conta.",
    ],
    sections: [
      {
        heading: "Use planilha em trabalho simples e limitado",
        paragraphs: [
          "Uma lista curta, temporária e de uma pessoa pode não precisar de sistema. Colunas claras e uma data de revisão podem ser suficientes.",
        ],
      },
      {
        heading: "Observe falhas operacionais",
        paragraphs: [
          "Versões conflitantes, células sem explicação, fórmulas copiadas, duplicidades e status antigos mostram que a lista virou workflow.",
        ],
        points: ["Controle de versão", "Procedência", "Consistência do score", "Responsável e próxima ação"],
      },
      {
        heading: "Mantenha a exportação, substitua coordenação manual",
        paragraphs: [
          "O ScoreLead exporta CSV, mas gerencia descoberta, enriquecimento, scoring e status antes da saída dos dados.",
        ],
      },
    ],
    proofLabel: "Princípio de migração",
    proof:
      "Não substitua uma planilha apenas porque existe software. Migre quando erros de coordenação e manutenção superarem o valor da flexibilidade.",
    ctaTitle: "Veja se sua planilha já virou um sistema.",
    ctaDescription: "Use workflow para consistência e exportação quando a flexibilidade ajudar.",
    ctaLabel: "Testar fluxo conectado",
  },
  "compare-sales-prospecting-software": {
    eyebrow: "Comparação · Guia de compra",
    title: "Software de Prospecção B2B: O Que Comparar",
    description:
      "Compare software de prospecção B2B por controle de targeting, evidências de conta, qualidade dos dados, scoring, integração e resultados.",
    answer:
      "Um bom software de prospecção transforma um mercado definido em uma fila de contas revisável. Compare como cada produto descobre empresas, preserva fontes, trata duplicidade e dados desconhecidos, explica prioridades, permite revisão humana e usa resultados do pipeline para melhorar o targeting.",
    highlights: [
      "Comece pelo problema e pelo fluxo, não pela lista mais longa de recursos.",
      "Teste procedência, atualidade, identidade da empresa e explicação do score.",
      "Meça contas aceitas e avanço no pipeline, não apenas registros exportados.",
    ],
    sections: [
      {
        heading: "Defina o trabalho antes de comparar",
        paragraphs: [
          "Decida se o time precisa de descoberta de contas, contatos, enriquecimento, scoring, apoio ao outreach, pipeline ou um fluxo conectado. Um requisito claro torna as demonstrações comparáveis e evita ferramentas sobrepostas.",
        ],
      },
      {
        heading: "Inspecione a evidência de cada conta",
        paragraphs: [
          "Pergunte de onde vieram os dados, quando foram observados, como a identidade é confirmada e como a incerteza aparece. O vendedor deve conseguir verificar campos importantes antes da qualificação ou personalização.",
        ],
        points: [
          "Fonte e data de observação",
          "Identidade e controle de duplicidade",
          "Valores desconhecidos explícitos",
          "Raciocínio do score corrigível",
        ],
      },
      {
        heading: "Execute um piloto representativo",
        paragraphs: [
          "Use um segmento real e as mesmas regras de aceitação para cada produto finalista. Revise uma amostra, registre associações incorretas e evidências ausentes e inclua o tempo gasto para limpar e verificar contas.",
        ],
      },
      {
        heading: "Compare resultados e custo operacional",
        paragraphs: [
          "Acompanhe contas aceitas, tempo de pesquisa por conta aceita, prospects alcançáveis, conversas qualificadas e correções. Inclua implantação, integrações, governança e revisão humana no custo total.",
        ],
      },
    ],
    proofLabel: "Limite da avaliação",
    proof:
      "O ScoreLead reúne descoberta, enriquecimento, scoring explicável, outreach revisado e status do pipeline. Não substitui estratégia, verificação de fatos, decisões de consentimento ou o vendedor responsável pela abordagem final.",
    ctaTitle: "Avalie o ScoreLead com um segmento real.",
    ctaDescription:
      "Execute uma descoberta focada e inspecione as evidências antes de decidir.",
    ctaLabel: "Começar avaliação grátis",
  },
  "compare-purchased-lead-lists": {
    eyebrow: "Comparação · Estratégia de dados",
    title: "Descoberta atual vs. listas de leads compradas",
    description:
      "Compare listas estáticas com descoberta B2B baseada em critérios de busca, fontes, evidência pública recente e qualificação de contas.",
    answer:
      "Listas compradas oferecem cobertura rápida, mas origem, idade, permissões e fit podem ser incertos. Descoberta atual parte do seu alvo e coleta evidências públicas recentes, ainda exigindo revisão e uso legal.",
    highlights: [
      "Listas estáticas podem envelhecer antes de chegar a vendas.",
      "Descoberta mantém critérios e evidências visíveis.",
      "Nenhum método remove obrigações de consentimento e privacidade.",
    ],
    sections: [
      {
        heading: "Avalie além da quantidade",
        paragraphs: [
          "Pergunte como os dados foram coletados, quando foram verificados, quais campos são inferidos e se o uso pretendido é permitido.",
        ],
      },
      {
        heading: "Comece pela hipótese de conta",
        paragraphs: [
          "Descoberta atual começa pelas empresas que você pode ajudar e usa sinais observáveis para decidir quais merecem revisão.",
        ],
        points: ["Definição do alvo", "Data de observação", "Fonte", "Revisão legal do contato"],
      },
      {
        heading: "Meça contas utilizáveis",
        paragraphs: [
          "Compare contas aceitas, alcançáveis e bem segmentadas — não apenas custo por linha.",
        ],
      },
    ],
    proofLabel: "Nota de conformidade",
    proof:
      "Disponibilidade pública não autoriza automaticamente qualquer uso. Revise regras de privacidade, marketing direto, supressão e plataforma.",
    ctaTitle: "Construa a lista pelo seu mercado.",
    ctaDescription: "Descubra empresas com critérios e fontes anexados.",
    ctaLabel: "Começar descoberta atual",
  },
  "compare-best-lead-scoring-software": {
    eyebrow: "Comparação · Lead scoring",
    title: "Melhores Softwares de Lead Scoring B2B",
    description:
      "Compare software de lead scoring B2B por explicabilidade, dados, integração, calibração, fit com o workflow e decisões comerciais suportadas.",
    answer:
      "O melhor software de lead scoring é o que combina com seu processo de compra e torna a priorização útil para vendas. Scoring nativo de CRM aproveita histórico de atividade; plataformas de intenção destacam sinais de compra; o ScoreLead organiza descoberta, enriquecimento e scoring explicável antes do outreach.",
    highlights: [
      "Escolha a categoria de scoring compatível com os dados disponíveis.",
      "Exija sinais visíveis, tratamento de ausências e controles de calibração.",
      "Teste com contas aceitas e resultados reais do pipeline antes de escalar.",
    ],
    sections: [
      {
        heading: "Defina qual decisão o score deve apoiar",
        paragraphs: [
          "Esclareça se o score deve rotear leads inbound, priorizar contas-alvo, detectar intenção ou ordenar um mercado recém-descoberto. Um produto pode ser forte em uma dessas tarefas e fraco em outra.",
        ],
        points: ["Roteamento inbound", "Priorização de contas", "Sinais de intenção", "Descoberta de mercado"],
      },
      {
        heading: "Compare evidências e explicabilidade",
        paragraphs: [
          "Pergunte quais sinais formam o score, como valores ausentes se comportam, se vendas consegue inspecionar as evidências e como ajustes são registrados. Um número preciso não ajuda quando o time não consegue explicá-lo.",
        ],
      },
      {
        heading: "Avalie o fit com workflow e integrações",
        paragraphs: [
          "Revise onde o scoring acontece, quais dados precisam existir, como contas chegam ao CRM e se o produto atende regiões e idiomas relevantes. Inclua implantação e manutenção na comparação.",
        ],
        points: ["Dados necessários", "Handoff ao CRM", "Cobertura regional", "Revisão humana"],
      },
      {
        heading: "Execute um piloto mensurável",
        paragraphs: [
          "Teste um segmento controlado e compare aceitação, tempo de pesquisa, falsos positivos, oportunidades e motivos de rejeição. Não escolha apenas pela quantidade de recursos.",
        ],
      },
    ],
    proofLabel: "Metodologia da comparação",
    proof:
      "O ScoreLead participa da comparação e tem interesse comercial. O framework evita rankings não verificáveis e compara fit, qualidade da evidência, implantação e resultados mensuráveis de um piloto.",
    ctaTitle: "Teste scoring explicável em um segmento focado.",
    ctaDescription: "Mantenha as evidências por trás de cada score e compare com seu processo atual.",
    ctaLabel: "Testar scoring no ScoreLead",
  },
  "compare-b2b-lead-enrichment-tools": {
    eyebrow: "Comparação · Enriquecimento",
    title: "Ferramentas de Enriquecimento de Leads B2B",
    description:
      "Avalie ferramentas de enriquecimento de leads B2B por cobertura, fontes, atualidade, precisão, workflow, conformidade e custo por registro utilizável.",
    answer:
      "A melhor ferramenta de enriquecimento de leads B2B devolve dados prontos para decisão no seu mercado e contexto suficiente para verificar campos importantes. Bases de dados priorizam cobertura estruturada; automação de pesquisa oferece coleta flexível; o ScoreLead combina descoberta pública, evidências, scoring e revisão.",
    highlights: [
      "Meça registros utilizáveis e verificados, não quantidade de campos.",
      "Teste cobertura por mercado, porte e segmento.",
      "Mantenha fontes, datas, valores desconhecidos e revisão de conformidade visíveis.",
    ],
    sections: [
      {
        heading: "Comece pela decisão e pelos campos necessários",
        paragraphs: [
          "Liste os campos mínimos de identidade, fit, contato e personalização em cada etapa. Comprar mais dados não melhora o resultado quando a maioria dos campos não é usada.",
        ],
        points: ["Identidade", "Fit da empresa", "Contato", "Evidência de personalização"],
      },
      {
        heading: "Teste cobertura e precisão no seu mercado",
        paragraphs: [
          "Use uma amostra representativa de países, portes e segmentos. Verifique valores importantes em fontes primárias e registre separadamente campos ausentes, antigos, inferidos e incorretos.",
        ],
      },
      {
        heading: "Compare procedência e manutenção",
        paragraphs: [
          "Verifique se a ferramenta mostra fontes e datas, aceita correções, evita duplicidades e atualiza campos voláteis. Esses controles definem quanto trabalho manual resta.",
        ],
        points: ["URLs de origem", "Datas de observação", "Confiança", "Política de atualização"],
      },
      {
        heading: "Calcule custo por conta utilizável",
        paragraphs: [
          "Inclua assinatura, créditos, consultas sem resultado, verificação, limpeza de duplicidades, integração e a parcela de registros realmente aceita por vendas.",
        ],
      },
    ],
    proofLabel: "Avaliação justa",
    proof:
      "O ScoreLead é uma das ferramentas avaliadas. O guia não afirma superioridade universal; cobertura, precisão e valor variam por mercado, fonte, workflow e uso pretendido.",
    ctaTitle: "Avalie enriquecimento com sua própria amostra.",
    ctaDescription: "Descubra, enriqueça, pontue e revise empresas mantendo o contexto das fontes.",
    ctaLabel: "Testar enriquecimento B2B",
  },
  "case-study-ceramik": {
    eyebrow: "História de cliente · Ceramik",
    title: "Ceramik: Case de Prospecção B2B",
    description:
      "Um relato transparente de como a Ceramik usou o ScoreLead para descobrir estúdios de cerâmica, reduzir pesquisa manual e ampliar o pipeline em 30 dias.",
    answer:
      "Em uma comparação relatada pelo cliente com o fluxo manual anterior, a Ceramik atribui 2.450 leads de empresas descobertos, crescimento de 10× no pipeline e 85% menos tempo de pesquisa aos primeiros 30 dias com o ScoreLead. São evidências direcionais do cliente, não medições auditadas.",
    highlights: [
      "Relato do cliente: 2.450 leads de empresas descobertos nos primeiros 30 dias.",
      "Relato do cliente: crescimento relativo de 10× no pipeline no mesmo período.",
      "Estimativa do cliente: 85% menos tempo gasto em pesquisa manual.",
    ],
    sections: [
      {
        heading: "O problema inicial",
        paragraphs: [
          "A Ceramik atende professores e operadores de estúdios. Encontrar negócios adequados exigia buscas locais, revisão de sites e organização manual.",
        ],
      },
      {
        heading: "O fluxo com ScoreLead",
        paragraphs: [
          "O time definiu o mercado, executou descoberta geográfica, revisou evidências e usou o contexto enriquecido para decidir quais empresas entravam no pipeline.",
        ],
        points: ["Definição de mercado", "Descoberta", "Revisão de evidências", "Priorização"],
      },
      {
        heading: "Janela de medição e definições",
        paragraphs: [
          "A comparação publicada cobre os primeiros 30 dias de uso do ScoreLead em relação ao processo manual anterior da Ceramik. Leads descobertos significa registros de empresas encontrados pelo fluxo; não significa contatos, oportunidades ou clientes verificados de forma independente.",
          "O crescimento de 10× e a redução de 85% são estimativas direcionais da Ceramik. Contagens iniciais e finais do pipeline, taxas de aceitação, conversões e apontamentos de horas não foram fornecidos para revisão independente, por isso os números não são apresentados como benchmarks auditados.",
        ],
        points: [
          "Janela: primeiros 30 dias",
          "Baseline: fluxo manual anterior",
          "Fonte: relato do cliente",
          "Auditoria independente: não realizada",
        ],
      },
      {
        heading: "Como interpretar o resultado",
        paragraphs: [
          "Use os números como o relato direcional de um cliente sobre um fluxo inicial. Os resultados dependem do mercado, dos critérios de aceitação, das evidências disponíveis, da revisão e da execução do outreach; não são experimento controlado nem garantia.",
        ],
      },
    ],
    proofLabel: "Metodologia e divulgação",
    proof:
      "O ScoreLead publica esses números como evidência relatada pelo cliente, com janela, baseline, definições e limitações visíveis. Qualquer revisão futura deve preservar a fonte e o histórico de atualização.",
    ctaTitle: "Crie um fluxo para o seu próprio mercado.",
    ctaDescription: "Defina o alvo, preserve evidências e meça contas aceitas.",
    ctaLabel: "Começar seu fluxo",
  },
  "company-pricing": {
    eyebrow: "Preços",
    title: "Preços do ScoreLead: Comece Grátis",
    description:
      "Use o fluxo principal no plano Free, teste o Starter por US$ 2,95 e migre conforme cresce o volume de descoberta, outreach e automação.",
    answer:
      "O plano Free custa US$ 0 e inclui um negócio e uma descoberta com até 10 leads, pontuados e enriquecidos. O Starter custa US$ 2,95 nos primeiros 7 dias e US$ 19,95 por mês depois, o Growth custa US$ 29,95 por mês e o Pro custa US$ 59,95 por mês. As cotas dos planos pagos renovam todo mês.",
    highlights: [
      "Free: US$ 0 por mês, sem cartão",
      "Starter: US$ 2,95 por 7 dias, depois US$ 19,95 por mês",
      "Growth: US$ 29,95 por mês · Pro: US$ 59,95 por mês",
    ],
    sections: [
      {
        heading: "Plano Free",
        paragraphs: [
          "Use um workspace e execute um job inicial para avaliar o fluxo completo: pontuação, enriquecimento web e textos de outreach com IA. Os limites do Free são totais únicos, não cotas mensais.",
        ],
      },
      {
        heading: "Plano Starter",
        paragraphs: [
          "O Starter começa em US$ 2,95 por sete dias e passa a US$ 19,95 por mês se não for cancelado. Cobre um negócio com 10 descobertas por mês de até 25 leads cada, 50 mensagens de outreach com IA e exportação CSV de todos os leads enriquecidos.",
        ],
        points: ["10 descobertas por mês", "Até 25 leads por descoberta", "50 mensagens de outreach", "Exportação CSV", "Pontuação e enriquecimento web"],
      },
      {
        heading: "Plano Growth",
        paragraphs: [
          "O Growth adiciona o lado do contato: sequências de WhatsApp na plataforma oficial da Meta, enriquecimento Apollo nos melhores leads de cada descoberta, o calendário de conteúdo com IA e imagens geradas, três workspaces e a opção de continuar uma descoberta mais a fundo na mesma região.",
        ],
        points: ["Automação de WhatsApp", "150 enriquecimentos por mês", "Calendário de conteúdo com IA e imagens", "3 negócios", "30 descobertas de até 50 leads"],
      },
      {
        heading: "Plano Pro",
        paragraphs: [
          "O Pro é o plano de agência: negócios ilimitados, descobertas ilimitadas sem teto de leads por rodada, planos de conteúdo e outreach ilimitados, 500 enriquecimentos por mês e contatos de decisores nos leads enriquecidos.",
        ],
        points: ["Negócios ilimitados", "Descoberta e outreach ilimitados", "Contatos de decisores", "500 enriquecimentos por mês", "30 imagens com IA por mês"],
      },
      {
        heading: "Uso e termos de terceiros",
        paragraphs: [
          "Limites de uso justo e regras de provedores, mensagens ou plataformas podem se aplicar. Os termos exibidos no checkout prevalecem.",
        ],
      },
    ],
    proofLabel: "Exatidão de preços",
    proof:
      "Preços e limites refletem a configuração publicada em 23 de julho de 2026. Impostos, moedas e mudanças futuras podem alterar o valor no checkout.",
    ctaTitle: "Avalie o ScoreLead com um mercado real.",
    ctaDescription: "Comece no Free e faça upgrade quando precisar de capacidade.",
    ctaLabel: "Criar conta grátis",
  },
  "company-security": {
    eyebrow: "Segurança e confiança",
    title: "Segurança de Dados e Contas",
    description:
      "Uma visão direta sobre autenticação, transporte, limites de acesso, provedores e responsabilidades compartilhadas.",
    answer:
      "O ScoreLead usa contas autenticadas, segredos no servidor, transporte criptografado, acesso por negócio e cabeçalhos de segurança. Como depende de terceiros, esta página descreve controles atuais sem alegar certificações não publicadas.",
    highlights: [
      "Verificações de conta e negócio protegem fluxos privados.",
      "Credenciais ficam fora dos bundles públicos.",
      "Privacidade e exclusão estão documentadas.",
    ],
    sections: [
      {
        heading: "Controles da aplicação",
        paragraphs: [
          "O ScoreLead valida acesso a dados privados, limita operações sensíveis ao servidor e aplica rate limiting ou assinaturas em endpoints e webhooks selecionados.",
        ],
      },
      {
        heading: "Limites da plataforma",
        paragraphs: [
          "O serviço usa provedores de hospedagem, banco, autenticação, cobrança, e-mail, IA, busca, mapas, storage, analytics e mensagens.",
        ],
        points: ["TLS", "Credenciais no servidor", "Acesso com escopo", "Webhooks verificados", "Exclusão de dados"],
      },
      {
        heading: "Reporte uma preocupação",
        paragraphs: [
          "Envie vulnerabilidades suspeitas pela página de contato do ScoreLead com detalhes suficientes. Não acesse, altere ou retenha dados que não sejam seus.",
        ],
      },
    ],
    proofLabel: "Nível atual de garantia",
    proof:
      "O ScoreLead não alega SOC 2, ISO 27001, teste de invasão, uptime ou certificações não acompanhadas de evidência pública.",
    ctaTitle: "Precisa de uma resposta para sua revisão?",
    ctaDescription: "Fale com o time sobre seu requisito ou fluxo de dados.",
    ctaLabel: "Falar com o ScoreLead",
  },
  "company-about": {
    eyebrow: "Sobre o ScoreLead",
    title: "Prospecção B2B Mais Explicável",
    description:
      "O ScoreLead conecta descoberta, evidência, qualificação, scoring e outreach para que times pequenos foquem conversas informadas.",
    answer:
      "O ScoreLead é software de geração de leads B2B para vendas, agências, founders e growth. O produto segue uma ideia simples: automação deve preservar as evidências e o julgamento por trás da decisão.",
    highlights: [
      "Foco em descoberta e qualificação de empresas B2B.",
      "Disponível em inglês, português e espanhol.",
      "Fluxos transparentes e revisáveis.",
    ],
    sections: [
      {
        heading: "Por que o ScoreLead existe",
        paragraphs: [
          "A prospecção costuma se espalhar por abas, planilhas copiadas, CRM incompleto e mensagens genéricas. O ScoreLead reúne essas etapas sem fingir que automação elimina julgamento.",
        ],
      },
      {
        heading: "O que o produto valoriza",
        paragraphs: [
          "Evidência útil, scores explicáveis, incerteza honesta, targeting focado e outreach relevante importam mais do que a maior lista possível.",
        ],
        points: ["Evidência acima de volume", "Contexto acima de personalização genérica", "Aprendizado acima de atividade"],
      },
      {
        heading: "Quem publica este site",
        paragraphs: [
          "Conteúdo é publicado pelo time editorial do ScoreLead. Quando há autor, revisor, cliente ou metodologia nomeados, a página identifica isso diretamente.",
        ],
      },
    ],
    proofLabel: "Transparência de entidade",
    proof:
      "Esta página evita inventar biografias, endereços, registros, prêmios ou certificações não fornecidos para publicação.",
    ctaTitle: "Veja se o fluxo serve ao seu mercado.",
    ctaDescription: "Comece grátis ou fale com o time sobre um problema específico.",
    ctaLabel: "Testar o ScoreLead",
  },
  "company-editorial-policy": {
    eyebrow: "Padrões editoriais",
    title: "Padrões Editoriais do ScoreLead",
    description:
      "Os padrões para afirmações de produto, orientação, fontes, assistência de IA, traduções, correções e evidências de clientes.",
    answer:
      "O ScoreLead publica conteúdo para melhorar decisões de prospecção. Artigos separam comportamento do produto de orientação geral, citam fontes primárias, divulgam limitações e não inventam pessoas ou resultados.",
    highlights: [
      "Afirmações devem ser rastreáveis ao produto ou a uma fonte.",
      "IA pode apoiar o rascunho, mas o padrão editorial controla a publicação.",
      "Traduções preservam sentido e clareza local.",
    ],
    sections: [
      {
        heading: "Quem, como e por quê",
        paragraphs: [
          "Cada artigo identifica a organização, datas e propósito. Especialistas nomeados são adicionados somente com permissão e biografia real.",
        ],
      },
      {
        heading: "Fontes e evidência de clientes",
        paragraphs: [
          "Afirmações regulatórias, de plataforma e técnicas priorizam fontes primárias. Resultados de clientes mostram período e divulgação e não viram garantias.",
        ],
        points: ["Fontes primárias", "Datas visíveis", "Metodologia", "Caminho para correção"],
      },
      {
        heading: "Correções e atualizações",
        paragraphs: [
          "Envie correções pela página de contato do ScoreLead. Correções materiais alteram a data de revisão; datas não mudam apenas para parecerem novas.",
        ],
      },
    ],
    proofLabel: "Divulgação de assistência por IA",
    proof:
      "IA pode apoiar estrutura, tradução e edição. O ScoreLead continua responsável pelo texto, fontes, exatidão do produto e remoção de afirmações sem suporte.",
    ctaTitle: "Encontrou algo a corrigir?",
    ctaDescription: "Envie a fonte, URL e uma explicação curta.",
    ctaLabel: "Falar com os editores",
  },
  "author-scorelead-editorial": {
    eyebrow: "Autor",
    title: "ScoreLead Editorial",
    description:
      "O time de produto e pesquisa responsável por guias sobre descoberta, qualificação, scoring, enriquecimento e outreach B2B.",
    answer:
      "ScoreLead Editorial é um autor organizacional usado quando nenhuma pessoa foi aprovada para publicação. Representa o time que mantém o conteúdo — não uma pessoa fictícia.",
    highlights: [
      "Cobre operações de prospecção e fluxos do ScoreLead.",
      "Usa datas, fontes e metodologia visíveis.",
      "Aceita correções pela página de contato do ScoreLead.",
    ],
    sections: [
      {
        heading: "Áreas de foco",
        paragraphs: [
          "O time escreve sobre ICP, descoberta, enriquecimento, scoring transparente, qualidade de dados, pipeline e outreach responsável.",
        ],
      },
      {
        heading: "Padrão de revisão",
        paragraphs: [
          "Afirmações de produto são comparadas ao comportamento atual. Afirmações externas preferem fontes primárias e incertezas são identificadas.",
        ],
        points: ["Exatidão do produto", "Fontes primárias", "Limitações claras", "Tradução fiel"],
      },
      {
        heading: "Política de identidade",
        paragraphs: [
          "Quando um autor ou revisor real estiver disponível e consentir, o ScoreLead usará um perfil nomeado. Até lá, artigos usam esta identidade organizacional transparente.",
        ],
      },
    ],
    proofLabel: "Por que não há schema Person",
    proof:
      "Este perfil é uma Organization nos dados estruturados. Publicar uma pessoa sem indivíduo real e consentido reduziria a confiança.",
    ctaTitle: "Leia a pesquisa por trás do fluxo.",
    ctaDescription: "Explore os guias ou envie uma correção.",
    ctaLabel: "Explorar o blog",
  },
  "tool-icp-worksheet": {
    eyebrow: "Ferramenta grátis · Worksheet de ICP",
    title: "ICP B2B com Critérios de Busca",
    description:
      "Crie um ICP B2B compacto com requisitos, preferências, desqualificadores, evidência de problema e plano de aprendizado.",
    answer:
      "Um ICP útil ajuda o time a aceitar ou rejeitar empresas com consistência. Esta worksheet transforma posicionamento amplo em critérios observáveis.",
    highlights: ["Sem conta", "Funciona no navegador", "Imprima ou salve a worksheet"],
    sections: [
      {
        heading: "Descreva a conta, não um comprador fictício",
        paragraphs: [
          "Foque condições da empresa: mercado, geografia, modelo, operações, evidência do problema e razões para um fit ruim.",
        ],
      },
      {
        heading: "Separe requisitos de preferências",
        paragraphs: [
          "Requisitos definem elegibilidade. Preferências priorizam. Desqualificadores impedem que contas inadequadas entrem no pipeline.",
        ],
      },
      {
        heading: "Conecte o perfil aos resultados",
        paragraphs: [
          "Revise contas aceitas, objeções, oportunidades e perdas e altere o perfil quando a evidência justificar.",
        ],
      },
    ],
    proofLabel: "Privacidade",
    proof: "Os dados ficam na página atual e não são enviados ao ScoreLead.",
    ctaTitle: "Pronto para testar os critérios?",
    ctaDescription: "Use a worksheet e execute uma descoberta focada.",
    ctaLabel: "Começar grátis",
  },
  "tool-lead-scoring-calculator": {
    eyebrow: "Ferramenta grátis · Calculadora de score",
    title: "Crie uma pontuação B2B explicável",
    description:
      "Crie um score B2B explicável e compare fit, alcance, confiança, engajamento e prontidão sem esconder as dimensões por trás de um único número.",
    answer:
      "A calculadora cria uma média transparente de cinco dimensões. Ela ajuda a priorizar e deve ser revisada contra as evidências.",
    highlights: ["Entradas ajustáveis", "Fórmula visível", "Nenhum dado enviado"],
    sections: [
      {
        heading: "Pontue com evidências observáveis",
        paragraphs: [
          "Use a mesma rubrica e diferencie valores desconhecidos de sinais fracos.",
        ],
      },
      {
        heading: "Use requisitos obrigatórios como filtros",
        paragraphs: [
          "Requisitos regulatórios, geográficos, técnicos ou de modelo devem ser verificados antes do score.",
        ],
      },
      {
        heading: "Calibre com o pipeline",
        paragraphs: [
          "Compare pontuações com aceitação, conversas positivas, oportunidades e qualidade do cliente.",
        ],
      },
    ],
    proofLabel: "Limitação do modelo",
    proof: "A calculadora usa pesos iguais e não estima intenção de compra.",
    ctaTitle: "Aplique o modelo a contas descobertas.",
    ctaDescription: "Mantenha evidência e score juntos no ScoreLead.",
    ctaLabel: "Testar scoring",
  },
  "tool-enrichment-checklist": {
    eyebrow: "Ferramenta grátis · Checklist de dados",
    title: "Checklist de Enriquecimento B2B",
    description:
      "Use um checklist de enriquecimento B2B para revisar identidade, fit, problema, contato, procedência, atualidade e prontidão antes do outreach ou CRM.",
    answer:
      "Um registro cheio não é necessariamente útil. Este checklist foca campos que apoiam decisões e as fontes usadas para verificá-los.",
    highlights: ["Campos orientados à decisão", "Progresso visível", "Nenhum dado enviado"],
    sections: [
      {
        heading: "Confirme a identidade",
        paragraphs: [
          "Domínio, nome, localização e perfis normalizados evitam duplicidade.",
        ],
      },
      {
        heading: "Adicione contexto de fit",
        paragraphs: [
          "Serviços, operação, presença, tecnologia e outros sinais devem se conectar ao ICP.",
        ],
      },
      {
        heading: "Preserve fonte e tempo",
        paragraphs: [
          "Registre origem, data e se cada informação é confirmada, inferida ou desconhecida.",
        ],
      },
    ],
    proofLabel: "Lembrete de uso",
    proof:
      "Completude não cria permissão de contato. Aplique regras de privacidade, supressão e canal separadamente.",
    ctaTitle: "Automatize as partes repetíveis.",
    ctaDescription: "Organize contexto público e fontes com o ScoreLead.",
    ctaLabel: "Enriquecer uma conta",
  },
  "tool-roi-calculator": {
    eyebrow: "Ferramenta grátis · Modelo de ROI",
    title: "Estime o custo da pesquisa manual de leads B2B",
    description:
      "Calcule o custo mensal da pesquisa manual de leads, as horas potencialmente recuperáveis e o ponto de equilíbrio de um workflow de prospecção mais automatizado.",
    answer:
      "A calculadora transforma tamanho do time, horas semanais, custo por hora e redução estimada em um cenário de planejamento. Não prevê receita.",
    highlights: ["Premissas transparentes", "Redução editável", "Nenhum dado enviado"],
    sections: [
      {
        heading: "Use o custo completo",
        paragraphs: [
          "Inclua o custo prático das pessoas, ferramentas e prestadores envolvidos.",
        ],
      },
      {
        heading: "Estime uma redução conservadora",
        paragraphs: [
          "Automação não remove verificação, contas estratégicas, exceções e revisão de qualidade.",
        ],
      },
      {
        heading: "Meça depois da implementação",
        paragraphs: [
          "Compare tempo por conta aceita, correções e conversão antes e depois.",
        ],
      },
    ],
    proofLabel: "Modelo de planejamento",
    proof:
      "Os resultados são estimativas aritméticas dos seus inputs e excluem software, implementação, impostos e efeitos de receita.",
    ctaTitle: "Teste o fluxo antes de confiar na estimativa.",
    ctaDescription: "Execute uma descoberta e meça o tempo real.",
    ctaLabel: "Começar teste grátis",
  },
}
