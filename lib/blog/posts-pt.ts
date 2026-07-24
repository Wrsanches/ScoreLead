import type { BlogTranslation } from "./types"

export const portuguesePosts: Record<string, BlogTranslation> = {
  "ai-lead-generation-guide": {
    title: "Geração de Leads com IA: Guia Prático para Times B2B",
    description:
      "Aprenda a usar IA para definir um mercado, descobrir contas, qualificar fit e preparar outreach relevante sem abrir mão do julgamento humano.",
    category: "Geração de leads com IA",
    keywords: [
      "geração de leads com IA",
      "software de geração de leads B2B",
      "prospecção de vendas com IA",
      "leads B2B qualificados",
      "descoberta de contas",
    ],
    introduction: [
      "A geração de leads com IA é mais útil quando melhora um processo comercial claro. Ela pode pesquisar um mercado amplo, organizar dados públicos, identificar sinais e ajudar o time a decidir onde investir atenção. Mas não consegue definir um bom cliente sem receber um alvo preciso e regras de qualificação úteis.",
      "O objetivo prático não é produzir a maior lista possível. É criar um caminho repetível entre um mercado-alvo e um conjunto menor de empresas que merecem uma abordagem cuidadosa. Esse caminho combina automação para escala e revisão humana para contexto, posicionamento e timing.",
    ],
    sections: [
      {
        heading: "Comece com uma hipótese de mercado",
        paragraphs: [
          "Antes de buscar, registre quem você espera ajudar e por quê. Uma hipótese útil informa setor ou modelo de negócio, características da empresa, região, dor provável e resultado gerado pelo produto. “Empresas de software” é amplo demais. “SaaS B2B em crescimento no Brasil com um time pequeno de outbound” oferece critérios que um sistema consegue avaliar.",
          "Trate a hipótese como uma versão, não como verdade permanente. Compare os critérios com respostas, reuniões e oportunidades reais. O melhor processo aprende com o pipeline em vez de repetir a mesma busca indefinidamente.",
        ],
        points: [
          "Escolha um segmento e uma região específicos.",
          "Liste sinais observáveis de fit e desqualificadores claros.",
          "Conecte cada critério a uma razão comercial.",
        ],
      },
      {
        heading: "Use IA para descoberta e coleta de evidências",
        paragraphs: [
          "Um fluxo assistido por IA pode descobrir empresas em mapas, sites, diretórios e fontes públicas, normalizando os resultados em registros de conta. É aí que a automação elimina trabalho repetitivo: coletar nomes, locais, serviços, presença digital, canais de contato e outros indícios úteis.",
          "Evidência importa mais do que volume. Sempre que possível, preserve a fonte e o nível de confiança dos campos importantes. O vendedor precisa entender por que a conta apareceu e verificar os fatos que orientarão a mensagem.",
        ],
      },
      {
        heading: "Pontue o fit antes de escrever o outreach",
        paragraphs: [
          "A pontuação transforma uma pilha de empresas em uma fila de trabalho. Separe fit de perfil de sinais de compra: uma empresa pode parecer o cliente ideal e ainda não ter motivo imediato para agir. Avalie fit, confiança, alcance digital, potencial de engajamento e prontidão, mostrando o raciocínio por trás do total.",
          "Não deixe um único número esconder incerteza. Use o score para priorizar a revisão, não para substituí-la. Um grupo menor e mais confiável pode receber personalização profunda; contas com pouca evidência podem voltar para pesquisa.",
        ],
      },
      {
        heading: "Feche o ciclo com resultados de vendas",
        paragraphs: [
          "Acompanhe o que acontece depois da descoberta: contas aceitas, respostas, reuniões, oportunidades e motivos de rejeição. Esses resultados mostram se o problema está no alvo, nos dados, no score ou na mensagem. Muitas respostas de contas sem fit não representam sucesso.",
          "Revise o sistema em uma cadência consistente. Altere uma hipótese importante por vez para identificar o que melhorou o desempenho. A IA acelera a iteração; a medição disciplinada torna essa velocidade útil.",
        ],
      },
    ],
    conclusion: {
      heading: "Construa um sistema, não uma lista isolada",
      paragraphs: [
        "Uma boa geração de leads com IA conecta definição de mercado, evidências da conta, pontuação transparente, outreach relevante e feedback do pipeline. Quando as etapas usam os mesmos critérios, o time gasta menos tempo limpando listas e mais tempo aprendendo quais empresas pode realmente ajudar.",
      ],
    },
  },
  "b2b-lead-scoring-model": {
    title: "Como Criar um Modelo de Lead Scoring B2B Confiável",
    description:
      "Crie um modelo transparente de lead scoring B2B que combine ICP, evidências da conta, engajamento, prontidão e feedback de vendas.",
    category: "Lead scoring",
    keywords: [
      "lead scoring B2B",
      "modelo de lead scoring",
      "lead scoring com IA",
      "pontuação de prospects",
      "qualificação de vendas",
    ],
    introduction: [
      "Um score útil responde a uma pergunta prática: qual conta o time deve revisar agora e por quê? Ele deve tornar a priorização mais consistente sem disfarçar hipóteses como certezas. Se vendedores não conseguem entender ou questionar os dados, acabarão ignorando o modelo.",
      "Os melhores modelos combinam fit observável com evidências de comportamento ou timing. Também preservam os detalhes por trás do número, fazendo do score um ponto de partida para julgamento — e não um veredito sem explicação.",
    ],
    sections: [
      {
        heading: "Separe fit de prontidão",
        paragraphs: [
          "Fit descreve quanto a empresa se parece com os clientes que você consegue atender bem. Setor, região, modelo de negócio, porte, serviços e complexidade operacional são entradas comuns. Prontidão indica sinais de que a conversa pode ser oportuna, como contratação, expansão, um processo frágil ou interesse ativo.",
          "Separar os conceitos evita priorizar automaticamente uma empresa perfeita no papel, mas sem necessidade visível, acima de outra com bom fit e motivo claro para mudar. Mostre as duas dimensões para orientar a ação correta.",
        ],
      },
      {
        heading: "Escolha evidências que você consegue explicar",
        paragraphs: [
          "Todo sinal precisa de uma razão. Se avaliações online importam, explique a conexão com a oferta. Se uma integração ausente é negativa, defina o motivo. Não inclua campos apenas porque estão disponíveis; entradas irrelevantes dão aparência sofisticada a um modelo menos confiável.",
          "Use uma rubrica curta para cada dimensão. Defina evidências baixas, médias e altas, incluindo valores desconhecidos. Desconhecido não deve significar fit ruim; pode indicar necessidade de mais pesquisa.",
        ],
        points: [
          "Fit de perfil: quem é a empresa.",
          "Evidência de problema: o que pode melhorar.",
          "Potencial de engajamento: acesso à pessoa certa.",
          "Prontidão: por que a conversa importa agora.",
        ],
      },
      {
        heading: "Ajuste os pesos à realidade do negócio",
        paragraphs: [
          "Comece com pesos simples que reflitam a estratégia. Se uma condição regulatória é obrigatória, trate-a como filtro, não como contribuição pequena. Se porte se relaciona pouco com valor, não o deixe dominar. Requisitos, sinais positivos, sinais negativos e incerteza devem aparecer de formas diferentes.",
          "Crie faixas que indiquem ações. O topo pode receber revisão manual e outreach personalizado; o meio pode ir para enriquecimento; a base pode ser excluída ou revisitada. O score se torna operacional quando o próximo passo é evidente.",
        ],
      },
      {
        heading: "Valide com contas aceitas e rejeitadas",
        paragraphs: [
          "Compare a pontuação com o que vendas aceita, avança e ganha. Estude falsos positivos e negativos. Uma conta bem pontuada rejeitada por vendas pode expor um critério ausente; um cliente ganho com score baixo pode revelar um sinal subestimado.",
          "Recalibre em uma cadência definida e documente mudanças. Não otimize apenas para reuniões; considere qualidade da oportunidade e fit do cliente. O objetivo é uma definição compartilhada e cada vez melhor de onde focar.",
        ],
      },
    ],
    conclusion: {
      heading: "Transparência gera adoção",
      paragraphs: [
        "Um modelo confiável é compacto, baseado em evidências e conectado a um fluxo claro. Mantenha o raciocínio visível, incorpore feedback de vendas e trate o score como uma ferramenta viva de priorização.",
      ],
    },
  },
  "ideal-customer-profile-guide": {
    title: "Como Definir o Perfil de Cliente Ideal para Prospecção B2B",
    description:
      "Transforme evidências de clientes em um ICP B2B acionável, com critérios de fit, desqualificadores, segmentos prioritários e ciclo de feedback.",
    category: "Estratégia de ICP",
    keywords: [
      "perfil de cliente ideal",
      "ICP B2B",
      "segmentação de contas",
      "estratégia de prospecção",
      "mercado-alvo",
    ],
    introduction: [
      "O perfil de cliente ideal, ou ICP, descreve o tipo de empresa com maior chance de receber valor real da sua oferta e se tornar um cliente saudável. É uma definição de conta, não a biografia fictícia de um comprador. A persona orienta mensagens para uma pessoa; o ICP decide quais empresas entram no pipeline.",
      "Um bom ICP é específico o bastante para orientar a descoberta e flexível o bastante para evoluir com evidências. Deve indicar onde buscar, o que verificar, quais contas rejeitar e como reconhecer segmentos adjacentes promissores.",
    ],
    sections: [
      {
        heading: "Comece pelas evidências dos melhores clientes",
        paragraphs: [
          "Analise clientes que chegaram rápido ao valor, mantiveram engajamento, expandiram ou viraram boas referências. Procure condições em comum antes da venda: modelo de negócio, problema operacional, maturidade, região, estrutura de equipe e urgência. Receita alta não torna uma conta ideal se ela exige suporte excepcional ou retém pouco.",
          "Se a empresa ainda tem poucos clientes, use entrevistas, pilotos, negócios perdidos e alternativas do mercado como evidências provisórias. Marque as hipóteses para deixar claro o que ainda precisa de validação.",
        ],
      },
      {
        heading: "Transforme padrões em critérios observáveis",
        paragraphs: [
          "Critérios de descoberta precisam ser visíveis em dados confiáveis. “Empresa inovadora” é difícil de verificar; “oferece agendamento online e opera três unidades” é observável. Divida os critérios em obrigatórios, preferenciais e negativos.",
          "Inclua uma razão ao lado de cada critério. Isso mantém o ICP ligado ao valor do produto e evita filtros arbitrários. Também facilita a revisão quando os resultados contradizem uma hipótese.",
        ],
        points: [
          "Firmográficos: setor, região, porte e modelo de negócio.",
          "Operação: processos, canais, unidades e estrutura de equipe.",
          "Sinais de problema: fricções que sua oferta resolve.",
          "Desqualificadores: condições que tornam o sucesso improvável.",
        ],
      },
      {
        heading: "Crie segmentos prioritários",
        paragraphs: [
          "Muitos produtos atendem mais de um tipo de empresa, mas esses segmentos raramente merecem a mesma mensagem. Defina um ICP principal para o fit mais claro e perfis secundários para oportunidades adjacentes. Dê a cada segmento uma hipótese de problema, prova e filtros próprios.",
          "A segmentação melhora a busca e o outreach. O time compara respostas e conversões sem misturar empresas que compram por razões diferentes.",
        ],
      },
      {
        heading: "Leve o ICP para a rotina comercial",
        paragraphs: [
          "Mantenha o perfil onde descoberta, scoring e revisão de pipeline possam usá-lo. Oriente o time a registrar motivos de aceitação e rejeição. Esses motivos mostram quais critérios estão amplos, ausentes ou mal ponderados.",
          "Revise o ICP quando produto, mercado ou go-to-market mudarem. Ele deve ser estável para gerar foco, mas nunca protegido contra evidências.",
        ],
      },
    ],
    conclusion: {
      heading: "Seu ICP é uma ferramenta de decisão",
      paragraphs: [
        "O melhor perfil de cliente ideal não é o documento mais longo. É a regra compartilhada mais clara para decidir quais contas merecem atenção. Fundamente-o no valor ao cliente, expresse-o com sinais observáveis e melhore-o com resultados reais do pipeline.",
      ],
    },
  },
  "lead-enrichment-guide": {
    title: "Enriquecimento de Leads B2B: Quais Dados Realmente Importam",
    description:
      "Descubra quais dados de enriquecimento melhoram qualificação e outreach, como gerenciar confiança das fontes e manter contas úteis.",
    category: "Enriquecimento de leads",
    keywords: [
      "enriquecimento de leads B2B",
      "software de enriquecimento de leads",
      "dados de conta",
      "inteligência de vendas",
      "leads prontos para CRM",
    ],
    introduction: [
      "O enriquecimento adiciona contexto a um registro básico. Nome e site podem se transformar em uma visão de serviços, localização, mercado, canais de contato, equipe, presença digital e momento de compra. O objetivo não é coletar todo campo possível, mas reduzir a incerteza antes da qualificação e do outreach.",
      "Dados úteis ajudam o vendedor a responder rapidamente: esta empresa tem fit, quais evidências sustentam a decisão e o que pode tornar uma conversa relevante? Campos que não ajudam nessas decisões geram manutenção sem muito valor.",
    ],
    sections: [
      {
        heading: "Organize os dados pela decisão que apoiam",
        paragraphs: [
          "Agrupe campos em identidade, fit, evidência de problema, contato e personalização. Identidade evita duplicatas. Fit conecta ao ICP. Evidências indicam onde a oferta ajuda. Dados de contato orientam o canal. Personalização oferece um início específico e confiável para a mensagem.",
          "Essa estrutura deixa lacunas visíveis. Uma conta com endereço completo, mas sem evidência de fit, não está pronta só porque muitos campos foram preenchidos.",
        ],
        points: [
          "Identidade: nome, domínio, localização e perfis.",
          "Fit: setor, serviços, presença, porte e mercado.",
          "Contexto: avaliações, preços, vagas, tecnologia e mudanças.",
          "Contato: canais públicos e funções relevantes.",
        ],
      },
      {
        heading: "Preserve fontes, datas e confiança",
        paragraphs: [
          "Dados da web mudam. Registre de onde veio um valor importante e quando ele foi observado. Uma URL ajuda a verificar o campo antes de usá-lo. A confiança é especialmente útil quando a IA extrai uma resposta de conteúdo ambíguo.",
          "Não apresente inferência como fato confirmado. Identifique estimativas e valores desconhecidos. Uma lacuna transparente é mais segura do que um palpite convincente que prejudica a credibilidade.",
        ],
      },
      {
        heading: "Normalize sem apagar significado",
        paragraphs: [
          "Formatos consistentes tornam dados pesquisáveis e exportáveis: países, telefones, URLs, categorias e listas. Preserve o texto original quando a normalização remover nuances. Uma categoria ajuda no filtro; a frase original pode ser melhor para personalização.",
          "Remova duplicatas no nível da empresa antes de criar contatos. Domínios, nomes normalizados, endereços e perfis sociais contribuem para a correspondência, mas nenhum identificador é perfeito em todo mercado.",
        ],
      },
      {
        heading: "Enriqueça em etapas",
        paragraphs: [
          "Faça descoberta e validação de fit antes do enriquecimento profundo. Não vale coletar dados detalhados de contato ou tecnologia para contas sem elegibilidade básica. O enriquecimento progressivo concentra pesquisas mais caras nos melhores candidatos.",
          "Atualize campos conforme a velocidade de mudança. Identidade é estável; cargos, vagas e contatos precisam de revisão mais frequente. Dê a vendas uma forma simples de sinalizar informação desatualizada.",
        ],
      },
    ],
    conclusion: {
      heading: "Qualidade significa prontidão para decidir",
      paragraphs: [
        "Um registro cheio não é necessariamente útil. Enriquecimento de qualidade é atual, rastreável, normalizado e ligado à qualificação ou ao outreach. Projete os dados em torno da próxima decisão do time.",
      ],
    },
  },
  "sales-prospecting-automation": {
    title: "Automação de Prospecção sem Perder Relevância",
    description:
      "Crie um fluxo de automação comercial que escale pesquisa e priorização mantendo qualificação, personalização e revisão humana.",
    category: "Automação comercial",
    keywords: [
      "automação de prospecção",
      "prospecção automatizada",
      "automação de vendas com IA",
      "ferramenta de prospecção B2B",
      "fluxo de vendas",
    ],
    introduction: [
      "Automação de prospecção deve remover trabalho repetitivo, não julgamento. Os melhores candidatos são tarefas com entradas claras e saídas repetíveis: descobrir empresas, coletar dados públicos, normalizar registros, aplicar regras transparentes e preparar um resumo de pesquisa.",
      "Os problemas começam quando se automatiza uma estratégia confusa. Criar listas mais rápido não corrige um ICP amplo, e enviar mais rápido não torna uma mensagem genérica relevante. Construa a automação em torno de controles de qualidade.",
    ],
    sections: [
      {
        heading: "Mapeie o fluxo antes de escolher ferramentas",
        paragraphs: [
          "Desenhe o caminho entre definição do alvo e entrada no pipeline. Identifique responsável, entrada, decisão e saída em cada etapa. Assim aparecem os pontos realmente repetitivos e aqueles em que uma pessoa adiciona contexto essencial.",
          "Um fluxo prático pode incluir briefing de mercado, descoberta, validação, enriquecimento, scoring, revisão humana, preparação de outreach, sincronização com CRM e acompanhamento de resultados. Mantenha a primeira versão pequena e observável.",
        ],
      },
      {
        heading: "Automatize a pesquisa antes da comunicação",
        paragraphs: [
          "Descoberta e enriquecimento costumam oferecer ganhos mais seguros do que envio automático. O sistema pode reunir evidências, resumir um site e sugerir fit enquanto um vendedor revisa a conta. Isso libera tempo para conversas melhores sem expor a marca a mensagens não verificadas.",
          "Ao gerar rascunhos, exija que cada afirmação venha dos dados da conta. O template organiza a mensagem; a evidência fornece a razão de falar com aquela empresa.",
        ],
        points: [
          "Automatize coleta e formatação repetíveis.",
          "Mantenha aprovações antes de ações de alto impacto.",
          "Mostre fontes ao lado dos resumos gerados.",
          "Envie casos incertos para revisão.",
        ],
      },
      {
        heading: "Projete caminhos para exceções",
        paragraphs: [
          "Dados reais são incompletos. Defina o que acontece quando um site está fora do ar, registros parecem duplicados, o score não tem evidência ou um canal não pode ser verificado. Um fluxo robusto pausa, identifica ou redireciona o caso em vez de inventar uma resposta.",
          "Facilite a correção manual e preserve-a para execuções futuras. Exceções são feedback valioso sobre o mercado e o desenho da automação.",
        ],
      },
      {
        heading: "Meça qualidade e velocidade juntas",
        paragraphs: [
          "Acompanhe tempo economizado e contas processadas, mas combine esses números com taxa de aceitação, completude, qualidade de respostas, reuniões, oportunidades e descadastros. Volume sem qualidade pode esconder deterioração.",
          "Comece com um segmento controlado, compare com o fluxo anterior e revise amostras. Expanda apenas quando o processo produzir entradas confiáveis para a etapa seguinte.",
        ],
      },
    ],
    conclusion: {
      heading: "Escale o trabalho que merece escala",
      paragraphs: [
        "Boa automação torna a pesquisa consistente, expõe evidências e deixa mais tempo para julgamento. Mantenha o alvo preciso, automatize primeiro a repetição de baixo risco e preserve a revisão onde o contexto afeta a confiança.",
      ],
    },
  },
  "personalized-b2b-outreach": {
    title: "Outreach B2B Personalizado: da Pesquisa à Mensagem Relevante",
    description:
      "Crie outreach B2B personalizado conectando pesquisa verificada a um problema específico, uma proposta de valor útil e follow-ups respeitosos.",
    category: "Outreach B2B",
    keywords: [
      "outreach B2B personalizado",
      "abordagem de vendas",
      "mensagens com IA",
      "personalização de email frio",
      "outreach baseado em contas",
    ],
    introduction: [
      "Personalizar não é inserir o nome da empresa em um template. Uma mensagem B2B relevante mostra que o remetente entendeu algo específico sobre a conta e consegue conectá-lo a um resultado plausível. Ela é curta, verificável e fácil de responder.",
      "A pesquisa fornece a matéria-prima, mas o julgamento molda a mensagem. Não mencione todos os fatos encontrados. Escolha o sinal que melhor explica por que a conversa pode ser útil agora.",
    ],
    sections: [
      {
        heading: "Crie um resumo curto da conta",
        paragraphs: [
          "Antes de escrever, resuma empresa, prioridade provável, evidências, função relevante e valor que sua oferta pode gerar. Inclua fontes para afirmações que possam entrar na mensagem. Um briefing estruturado produz outreach mais consistente do que pedir a uma pessoa ou modelo que pesquise livremente.",
          "Separe fatos de interpretações. “A empresa abriu uma segunda unidade” pode ser fato; “o time enfrenta dificuldades com leads” é hipótese. Explore a hipótese sem apresentá-la como verdade.",
        ],
      },
      {
        heading: "Use a estrutura razão, valor e prova",
        paragraphs: [
          "Abra com uma razão confiável para o contato, conecte-a a um problema comercial ou operacional, explique o valor e proponha um próximo passo simples. Cada frase deve aumentar a compreensão do leitor.",
          "A prova precisa combinar com o segmento. Use um exemplo de cliente, uma explicação do fluxo ou uma capacidade concreta em vez de superlativos sem sustentação. Se falta prova, reduza a afirmação.",
        ],
        points: [
          "Razão: por que esta conta e por que agora.",
          "Relevância: problema ou oportunidade sugerido pelo sinal.",
          "Valor: resultado que o produto apoia.",
          "Próximo passo: uma pergunta clara e respeitosa.",
        ],
      },
      {
        heading: "Personalize a sequência inteira",
        paragraphs: [
          "Follow-ups devem adicionar contexto, não repetir o mesmo pedido. Uma mensagem pode explicar o fluxo, outra compartilhar exemplo e a última encerrar o contato. Mantenha a sequência proporcional ao valor e à confiança na conta.",
          "Use o idioma e as normas de comunicação do mercado. A tradução precisa preservar significado e tom; a substituição literal pode soar artificial ou agressiva.",
        ],
      },
      {
        heading: "Revise precisão e respeito",
        paragraphs: [
          "Confira nomes, detalhes, links e afirmações antes de enviar. Remova personalizações invasivas ou sem relação com a proposta. Dados públicos ainda podem ser inadequados se o destinatário não espera vê-los em uma abordagem.",
          "Facilite o descadastro e siga leis e regras aplicáveis. Relevância protege tanto a reputação do remetente quanto a atenção de quem recebe.",
        ],
      },
    ],
    conclusion: {
      heading: "Relevância nasce da seleção disciplinada",
      paragraphs: [
        "Uma boa mensagem usa um sinal verificado, um problema plausível, uma proposta clara e um próximo passo simples. Ferramentas organizam evidências e criam rascunhos, mas o remetente continua responsável por precisão, tom e timing.",
      ],
    },
  },
  "manual-lead-research-vs-automation": {
    title: "Pesquisa Manual de Leads vs. Automação: o que Automatizar?",
    description:
      "Compare pesquisa manual e descoberta automatizada para dividir melhor o trabalho entre enriquecimento, qualificação e outreach.",
    category: "Desenho de processos",
    keywords: [
      "pesquisa manual de leads",
      "automação de pesquisa de leads",
      "descoberta automatizada de leads",
      "pesquisa de vendas",
      "fluxo de prospecção",
    ],
    introduction: [
      "A pesquisa manual é flexível e sensível ao contexto, mas difícil de repetir em escala. A automação é rápida e consistente, porém limitada às regras e dados recebidos. A pergunta útil não é qual vence, e sim quais tarefas exigem interpretação humana e quais se beneficiam de processamento repetível.",
      "Um fluxo híbrido usa automação para reunir e priorizar evidências e direciona atenção humana às decisões com consequências comerciais, de marca ou relacionamento.",
    ],
    sections: [
      {
        heading: "Onde a pesquisa manual é mais forte",
        paragraphs: [
          "Pessoas interpretam posicionamentos ambíguos, reconhecem modelos incomuns, avaliam se um sinal é relevante e se adaptam a mercados novos. A revisão manual é valiosa para contas estratégicas, segmentos desconhecidos e mensagens com afirmações importantes.",
          "O trabalho manual também ajuda a desenhar o processo inicial. Antes de automatizar um critério, entenda como um pesquisador experiente o aplica e onde surgem exceções.",
        ],
      },
      {
        heading: "Onde a automação gera alavancagem",
        paragraphs: [
          "Sistemas funcionam bem para descoberta ampla, coleta repetitiva de páginas, formatação, deduplicação, validações básicas e scores consistentes. Aplicam as mesmas regras sem fadiga e criam uma fila para revisão profunda.",
          "A automação também melhora a observabilidade: fontes, datas, decisões e motivos de rejeição ficam mais estruturados do que em abas e planilhas dispersas.",
        ],
        points: [
          "Automatize tarefas reversíveis e de alto volume.",
          "Revise contas valiosas ou de baixa confiança.",
          "Exija aprovação antes de comunicação externa.",
          "Use correções para melhorar as regras.",
        ],
      },
      {
        heading: "Calcule o custo oculto",
        paragraphs: [
          "Pesquisa manual custa mais do que horas. Pode gerar cobertura desigual, decisões não documentadas, atualizações lentas e dependência de hábitos individuais. Automação também custa: configuração, monitoramento, provedores, falsa confiança e manutenção.",
          "Compare o custo por conta aceita, não por linha coletada. A lista mais barata fica cara quando vendas passa horas rejeitando ou corrigindo dados.",
        ],
      },
      {
        heading: "Adote um modelo híbrido em etapas",
        paragraphs: [
          "Comece com descoberta e validação básicas automatizadas. Aplique enriquecimento e scoring apenas às contas elegíveis. Envie as melhores ou mais estratégicas para revisão humana e prepare outreach com evidências aprovadas.",
          "Amplie a automação uma etapa por vez. Preserve revisões por amostragem mesmo em fluxos maduros para tornar desvios de qualidade visíveis.",
        ],
      },
    ],
    conclusion: {
      heading: "Automatize a repetição; preserve a responsabilidade",
      paragraphs: [
        "A melhor operação não maximiza automação. Ela coloca julgamento humano onde ele muda o resultado e usa sistemas para tornar o entorno desse julgamento mais rápido, consistente e fácil de melhorar.",
      ],
    },
  },
  "b2b-sales-pipeline-guide": {
    title: "Como Construir um Pipeline de Vendas B2B do Mercado à Oportunidade",
    description:
      "Desenhe um pipeline B2B mensurável conectando contas-alvo, qualificação, outreach, conversas, oportunidades e aprendizado.",
    category: "Estratégia de pipeline",
    keywords: [
      "pipeline de vendas B2B",
      "geração de pipeline",
      "etapas do pipeline",
      "qualificação de contas",
      "processo de vendas B2B",
    ],
    introduction: [
      "Um pipeline B2B é mais do que um conjunto de etapas. É o sistema operacional que conecta uma hipótese de mercado ao aprendizado de receita. Cada estágio deve representar uma mudança relevante em evidência, responsabilidade ou compromisso do comprador — não apenas uma atividade do vendedor.",
      "Etapas claras mostram onde a qualidade se perde. Se contas descobertas raramente passam pela revisão, o alvo precisa mudar. Se contas qualificadas não respondem, posicionamento ou contato podem estar fracos. Se reuniões não viram oportunidades, investigue discovery e fit.",
    ],
    sections: [
      {
        heading: "Defina critérios de entrada e saída",
        paragraphs: [
          "Nomeie cada etapa e especifique o que precisa ser verdadeiro para entrar e sair. “Contatado” é atividade; “engajado” deve exigir resposta relevante. “Qualificado” precisa de fit verificado e um problema plausível, não uma impressão genérica.",
          "Mantenha poucas etapas. Adicione uma somente quando ela mudar a próxima ação, o responsável, o significado da previsão ou a evidência exigida.",
        ],
        points: [
          "Descoberta: atende aos filtros básicos da busca.",
          "Aceita: evidências de fit passaram pela revisão.",
          "Engajada: uma pessoa relevante respondeu.",
          "Oportunidade: problema, valor e próximo processo estão confirmados.",
        ],
      },
      {
        heading: "Conecte dados da conta ao pipeline",
        paragraphs: [
          "Preserve segmento de ICP, score, fontes e contexto de outreach ao levar a conta ao CRM. Assim o time compara resultados por alvo e entende por que uma empresa foi priorizada. Um pipeline sem contexto de aquisição não ensina o topo do funil.",
          "Defina campos obrigatórios por transição, mas mantenha o foco. Dados mandatórios devem apoiar decisão ou handoff, não criar trabalho administrativo sem finalidade.",
        ],
      },
      {
        heading: "Meça conversão e tempo",
        paragraphs: [
          "Acompanhe quantas contas avançam e quanto tempo levam. Conversão mostra qualidade; tempo mostra fricção e capacidade. Segmente por ICP, fonte, região, campanha e responsável quando houver volume suficiente.",
          "Monitore também motivos de rejeição, perda e inatividade. Uma taxonomia clara transforma registros encerrados em feedback de mercado.",
        ],
      },
      {
        heading: "Faça uma revisão focada",
        paragraphs: [
          "Uma boa revisão pergunta o que mudou, quais evidências sustentam a previsão, onde negócios travaram e qual é a próxima ação. Também olha para cima: novas contas entram na qualidade e velocidade certas? Evite usar a reunião só para atualizar campos.",
          "Escolha poucos experimentos: estreitar um segmento, alterar uma regra ou testar um ângulo de mensagem. Defina responsável e janela de tempo.",
        ],
      },
    ],
    conclusion: {
      heading: "Faça cada etapa ensinar a próxima",
      paragraphs: [
        "Um pipeline saudável cria uma corrente visível entre mercado-alvo e resultado do cliente. Critérios claros, dados conectados e feedback frequente facilitam encontrar a restrição real e melhorar o sistema sem perseguir atividade bruta.",
      ],
    },
  },
  "crm-data-quality-guide": {
    title: "Qualidade de Dados no CRM: Guia para Leads Prontos para Vendas",
    description:
      "Melhore dados do CRM com responsabilidade clara, validação, deduplicação, rastreamento de fontes e regras de atualização.",
    category: "Qualidade de dados",
    keywords: [
      "qualidade de dados no CRM",
      "leads prontos para vendas",
      "gestão de dados de leads",
      "deduplicação de CRM",
      "qualidade de dados de conta",
    ],
    introduction: [
      "Qualidade de dados no CRM não é uma limpeza com data para acabar. É um conjunto de regras operacionais que mantém contas e contatos confiáveis para a próxima decisão. Quando os dados estão incompletos, duplicados, antigos ou sem origem, vendas verifica o sistema em vez de usá-lo.",
      "O padrão correto depende do fluxo. Uma conta recém-descoberta precisa de dados para revisão de fit; uma conta aprovada precisa de evidências para outreach; uma oportunidade precisa do necessário para handoff e previsão.",
    ],
    sections: [
      {
        heading: "Defina uma conta pronta para vendas",
        paragraphs: [
          "Crie um padrão mínimo para cada etapa. Na descoberta, inclua nome normalizado, domínio, localização, fonte e evidência básica de fit. Antes do outreach, exija fatos verificados para personalização, canal relevante e responsável.",
          "Não meça qualidade só por preenchimento. Um campo completo pode estar errado, antigo ou ser irrelevante. Combine completude com validade, atualização, unicidade e confiança da fonte.",
        ],
      },
      {
        heading: "Evite duplicatas na entrada",
        paragraphs: [
          "Deduplicar é mais fácil antes que registros se espalhem. Normalize domínios, nomes, URLs, telefones e endereços. Use vários sinais, porque filiais, franquias, redirecionamentos e nomes semelhantes derrotam uma regra única.",
          "Defina como mesclar e qual valor prevalece. Preserve histórico de fontes e atividades para não apagar contexto útil.",
        ],
        points: [
          "Valide formatos antes de salvar.",
          "Normalize valores antes de comparar.",
          "Cruze mais de um identificador.",
          "Mantenha a origem ao mesclar registros.",
        ],
      },
      {
        heading: "Atribua responsáveis e validade",
        paragraphs: [
          "Todo campo crítico precisa de um responsável, mesmo quando a automação o fornece. Alguém deve definir fonte, validação, intervalo de atualização e processo de correção. Cargos e contatos expiram mais rápido do que a identidade da empresa.",
          "Mostre a última data de verificação quando isso importar. Permita sinalizar erro sem sair do fluxo e devolva as correções ao processo de enriquecimento.",
        ],
      },
      {
        heading: "Monitore a qualidade no uso",
        paragraphs: [
          "Dashboards ajudam, mas muitos problemas aparecem quando o vendedor prepara uma mensagem ou avança um negócio. Acompanhe correções, rejeições, campos ausentes, canais inválidos e mesclagens. Revise amostras recentes.",
          "Priorize pelo impacto. Uma inconsistência de formato incomoda; uma empresa associada ao registro errado pode prejudicar uma relação. Corrija primeiro os controles que evitam erros graves.",
        ],
      },
    ],
    conclusion: {
      heading: "Confiança é a métrica real",
      paragraphs: [
        "Dados prontos para vendas são corretos, atuais e transparentes o bastante para uma pessoa agir com segurança. Defina qualidade por etapa, evite erros na entrada, preserve fontes e incorpore correção à rotina.",
      ],
    },
  },
  "multilingual-b2b-prospecting": {
    title: "Prospecção B2B Multilíngue: Como Entrar em Novos Mercados",
    description:
      "Planeje prospecção B2B multilíngue com segmentação localizada, pesquisa de mercado, mensagens naturais, compliance e resultados comparáveis.",
    category: "Prospecção global",
    keywords: [
      "prospecção B2B multilíngue",
      "geração internacional de leads",
      "outreach localizado",
      "vendas B2B globais",
      "tradução de mensagens de vendas",
    ],
    introduction: [
      "Prospecção multilíngue não é o mesmo fluxo repetido com palavras traduzidas. Mercados variam em estruturas empresariais, dados disponíveis, linguagem de negócios, normas de comunicação e expectativas sobre a primeira conversa. Uma campanha se torna local quando alvo, evidência, oferta e tom fazem sentido juntos.",
      "A automação ajuda a descobrir contas e preparar variações, mas o conhecimento de mercado continua essencial. Comece por uma região específica e aprenda antes de expandir para muitos idiomas.",
    ],
    sections: [
      {
        heading: "Localize o ICP antes da mensagem",
        paragraphs: [
          "Teste se os critérios do ICP original continuam observáveis e relevantes. Porte pode ser informado de outro jeito, canais comuns mudam e uma dor urgente em um país pode ser secundária em outro. Consulte conhecimento local e revise contas reais.",
          "Crie termos de busca, mapeamentos de categoria, exclusões e exemplos locais. Preserve a hipótese central de valor para que a adaptação não vire um segmento sem relação.",
        ],
      },
      {
        heading: "Pesquise com fontes e idioma locais",
        paragraphs: [
          "Use diretórios regionais, mapas, sites, plataformas de avaliação e redes profissionais confiáveis. Busque no idioma do cliente, incluindo termos locais para setores e serviços. Consultas apenas em inglês podem perder contas fortes ou interpretar mal o posicionamento.",
          "Armazene o texto original junto aos campos normalizados. A língua de origem preserva nuances para revisão e personalização.",
        ],
        points: [
          "Adapte vocabulário e categorias de busca.",
          "Verifique nomes, acentos, cargos e formatos regionais.",
          "Separe fatos da fonte de resumos traduzidos.",
          "Registre o idioma preferido por conta e contato.",
        ],
      },
      {
        heading: "Traduza significado, tom e prova",
        paragraphs: [
          "Uma mensagem natural preserva a intenção, não a ordem das palavras. Revise formalidade, comprimento, expressões, CTA e nível de objetividade esperado. Mantenha nomes de produto e termos técnicos consistentes, evitando jargão quando existe expressão local clara.",
          "Localize também a prova. Um caso, moeda, regra ou resultado pode precisar de contexto. Nunca invente prova local; explique a conexão honestamente quando o exemplo vier de outro mercado.",
        ],
      },
      {
        heading: "Compare mercados sem esconder diferenças",
        paragraphs: [
          "Use definições de funil compartilhadas e segmente por país e idioma. Acompanhe aceitação de contas, contatos alcançáveis, respostas positivas, reuniões, oportunidades e rejeições. Ciclos e expectativas variam; não julgue um mercado por uma taxa isolada.",
          "Revise regras de privacidade, comunicação eletrônica e plataformas antes do lançamento. Compliance faz parte da prontidão de mercado, não é uma tarefa final de tradução.",
        ],
      },
    ],
    conclusion: {
      heading: "Relevância local é a estratégia de crescimento",
      paragraphs: [
        "A prospecção multilíngue bem-sucedida começa com uma hipótese localizada e leva esse contexto por descoberta, dados, mensagens e medição. Tecnologia de linguagem aumenta velocidade; aprendizado cuidadoso conquista confiança.",
      ],
    },
  },
}
