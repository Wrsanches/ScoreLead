import type { MarketingPageTranslation } from "./types"

export const marketingContentPt: Record<string, MarketingPageTranslation> = {
  "feature-ai-lead-discovery": {
    eyebrow: "Funcionalidade · Descoberta de contas",
    title: "Descoberta de leads com IA baseada no seu mercado real",
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
    title: "Lead scoring B2B transparente e questionável pelo time",
    description:
      "Priorize contas por fit, alcance, confiança, potencial de engajamento e prontidão, mantendo visíveis as evidências de cada pontuação.",
    answer:
      "A pontuação do ScoreLead é uma camada de priorização, não um veredito automático. Ela transforma sinais observáveis em uma fila consistente e mantém cada dimensão aberta para revisão, correção e melhoria.",
    highlights: [
      "Separe fit da empresa de momento e prontidão.",
      "Veja evidências por dimensão, não apenas um número opaco.",
      "Use faixas claras para revisão, enriquecimento ou outreach.",
    ],
    sections: [
      {
        heading: "Pontue sinais ligados à sua oferta",
        paragraphs: [
          "O modelo avalia dimensões observáveis e explicáveis. Requisitos obrigatórios devem funcionar como filtros; sinais mais leves ajudam a ordenar as contas restantes.",
        ],
      },
      {
        heading: "Mantenha a incerteza visível",
        paragraphs: [
          "Dado ausente não deve virar uma nota negativa silenciosa. Campos desconhecidos permanecem diferentes de evidências fracas e indicam necessidade de pesquisa.",
        ],
        points: ["Fit de mercado", "Alcance online", "Confiança", "Engajamento", "Prontidão"],
      },
      {
        heading: "Calibre com resultados comerciais",
        paragraphs: [
          "Compare scores com contas aceitas, respostas, oportunidades e rejeições. Falsos positivos e negativos fornecem o material para melhorar o modelo.",
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
    title: "Enriquecimento de leads que torna os dados úteis",
    description:
      "Transforme nome e domínio em contexto estruturado, com fontes, para qualificação, roteamento, personalização e exportação ao CRM.",
    answer:
      "Enriquecer leads B2B deve reduzir incerteza, não maximizar o número de campos. O ScoreLead organiza sinais de identidade, fit, problema, contato e personalização com o contexto necessário para verificação.",
    highlights: [
      "Colete contexto público sobre empresa, serviços, localização e contato.",
      "Normalize campos sem apagar a evidência original.",
      "Identifique valores ausentes ou inferidos em vez de apresentar suposições.",
    ],
    sections: [
      {
        heading: "Enriqueça para uma decisão",
        paragraphs: [
          "Cada campo deve apoiar fit, hipótese de problema, planejamento de contato ou uma mensagem melhor. Dados sem uso criam manutenção e não melhoram a decisão.",
        ],
      },
      {
        heading: "Preserve a procedência",
        paragraphs: [
          "Dados da web mudam. URLs de origem, datas de observação e níveis de confiança ajudam a verificar detalhes importantes antes do outreach.",
        ],
        points: ["Identidade", "Fit", "Evidência do problema", "Contato", "Personalização"],
      },
      {
        heading: "Exporte registros mais limpos",
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
    title: "Automação de outreach com contexto específico da conta",
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
    title: "Pipeline comercial conectado às evidências de descoberta",
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
    title: "Geração de leads para agências com múltiplos mercados",
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
    title: "Um sistema compartilhado de prospecção para vendas B2B",
    description:
      "Alinhe descoberta, qualificação, scoring e outreach em torno de uma definição visível de bom prospect.",
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
    title: "Geração de leads founder-led que aprende a cada conversa",
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
    title: "Descoberta de contas repetível entre times e regiões",
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
    title: "Pesquisa manual de leads vs. fluxo assistido por IA",
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
  "compare-purchased-lead-lists": {
    eyebrow: "Comparação · Estratégia de dados",
    title: "Descoberta atual vs. listas de leads compradas",
    description:
      "Compare listas estáticas com critérios de busca, fontes, evidência pública recente e qualificação de contas.",
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
  "case-study-ceramik": {
    eyebrow: "História de cliente · Ceramik",
    title: "Como a Ceramik expandiu um pipeline de prospecção focado",
    description:
      "Um relato transparente de como a Ceramik usou o ScoreLead para descobrir estúdios de cerâmica, reduzir pesquisa manual e ampliar o pipeline em 30 dias.",
    answer:
      "A Ceramik usou o ScoreLead para buscar estúdios, organizar evidências públicas e priorizar outreach. O relato já publicado atribui 2.450 leads descobertos, crescimento de 10× no pipeline e 85% menos tempo de pesquisa manual aos primeiros 30 dias.",
    highlights: [
      "2.450 leads de empresas relatados como descobertos.",
      "10× de crescimento de pipeline relatado no primeiro mês.",
      "85% menos tempo relatado em pesquisa manual.",
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
        heading: "Como interpretar o resultado",
        paragraphs: [
          "Os números são um resultado relatado pelo cliente em um fluxo e período específicos. Não são benchmark independente, experimento controlado ou garantia.",
        ],
      },
    ],
    proofLabel: "Metodologia e divulgação",
    proof:
      "Os números correspondem ao texto de história de cliente já publicado no ScoreLead e devem ser atualizados se a Ceramik fornecer nova janela, baseline ou verificação.",
    ctaTitle: "Crie um fluxo para o seu próprio mercado.",
    ctaDescription: "Defina o alvo, preserve evidências e meça contas aceitas.",
    ctaLabel: "Começar seu fluxo",
  },
  "company-pricing": {
    eyebrow: "Preços",
    title: "Comece grátis. Faça upgrade quando o fluxo provar valor.",
    description:
      "Use o fluxo principal no plano Free e migre para o Pro quando precisar de limites maiores em descoberta, negócios, conteúdo, imagens e outreach.",
    answer:
      "O plano Free custa US$ 0 e inclui um negócio, uma descoberta com até 10 leads, um plano de conteúdo e uma imagem com IA. O Pro é anunciado por US$ 49 por mês.",
    highlights: ["Free: US$ 0 por mês", "Pro: US$ 49 por mês", "Sem cartão para começar"],
    sections: [
      {
        heading: "Plano Free",
        paragraphs: [
          "Use um workspace, execute um job inicial, crie um plano de conteúdo e gere uma imagem para avaliar o fluxo.",
        ],
      },
      {
        heading: "Plano Pro",
        paragraphs: [
          "O Pro oferece múltiplos negócios, descoberta e planos de conteúdo ilimitados, até 30 imagens por mês com limite diário e geração ilimitada de outreach.",
        ],
        points: ["Múltiplos negócios", "Descoberta ilimitada", "Conteúdo ilimitado", "30 imagens por mês", "Outreach ilimitado"],
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
    title: "Como o ScoreLead aborda segurança de dados e contas",
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
          "Envie vulnerabilidades suspeitas para hello@scorelead.io com detalhes suficientes. Não acesse, altere ou retenha dados que não sejam seus.",
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
    title: "Criado para tornar a prospecção B2B mais explicável",
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
    title: "Como o ScoreLead pesquisa, escreve e atualiza conteúdo",
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
          "Envie correções para hello@scorelead.io. Correções materiais alteram a data de revisão; datas não mudam apenas para parecerem novas.",
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
      "Aceita correções em hello@scorelead.io.",
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
    title: "Transforme seu ICP em critérios de busca utilizáveis",
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
      "Compare fit, alcance, confiança, engajamento e prontidão sem esconder dimensões atrás de um número.",
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
    title: "Verifique se uma conta B2B está pronta para qualificação",
    description:
      "Revise identidade, fit, problema, contato, procedência e atualidade antes do outreach ou CRM.",
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
      "Modele custo mensal, horas recuperáveis e valor de equilíbrio de um fluxo mais automatizado.",
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
