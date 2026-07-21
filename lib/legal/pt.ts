import type { LegalDocumentContent, LegalDocumentKey } from "./types"

const shared = {
  updatedLabel: "Em vigor e última atualização:",
  updatedDate: "20 de julho de 2026",
  tocLabel: "Nesta página",
  homeLabel: "Voltar ao ScoreLead",
  contactLabel: "Dúvidas ou solicitações de privacidade?",
  contactDescription:
    "Entre em contato usando o e-mail associado à sua conta para que possamos responder e, quando necessário, verificar a solicitação.",
} as const

export const legalContentPt: Record<LegalDocumentKey, LegalDocumentContent> = {
  privacy: {
    ...shared,
    eyebrow: "Legal · Privacidade",
    title: "Política de Privacidade",
    description:
      "Esta política explica quais informações o ScoreLead trata, por que as utilizamos, com quem as compartilhamos e quais escolhas e direitos estão disponíveis para você.",
    sections: [
      {
        id: "scope-and-roles",
        title: "Abrangência e nosso papel",
        paragraphs: [
          "Esta Política de Privacidade se aplica ao site, aos aplicativos, aos canais de suporte e aos serviços relacionados do ScoreLead. “ScoreLead”, “nós” e “nosso” se referem ao fornecedor desses serviços.",
          "Em relação a dados de conta, site, cobrança e relacionamento direto, o ScoreLead normalmente atua como controlador. Quando um cliente carrega, descobre, enriquece ou utiliza dados de leads e mensagens no serviço, esse cliente geralmente define as finalidades e os meios do tratamento e atua como controlador; o ScoreLead trata esses dados segundo as instruções do cliente, como operador ou prestador de serviço. O papel exato depende do contexto e da legislação aplicável.",
        ],
      },
      {
        id: "information-we-collect",
        title: "Informações que coletamos",
        paragraphs: [
          "Coletamos informações fornecidas por você, criadas durante o uso do serviço, recebidas de serviços conectados e informações empresariais provenientes de fontes públicas ou licenciadas.",
        ],
        bullets: [
          "Dados de conta e autenticação, como nome, e-mail, credenciais de senha em forma protegida, imagem de perfil, verificação de e-mail, identificadores do provedor de login, sessões, endereço IP e agente do navegador.",
          "Dados de perfil empresarial e espaço de trabalho, incluindo nome da empresa, site, localização, setor, área de atendimento, marca, redes sociais, personas, preferências de busca e conteúdo fornecido pelos usuários.",
          "Dados de leads e prospects, como nomes empresariais, sites, contatos comerciais, localização, avaliações, perfis sociais, serviços, equipe, decisores, fontes de enriquecimento, anotações, pontuações, estágio do pipeline e rascunhos de abordagem. Esses dados podem ser fornecidos pelo cliente ou encontrados em fontes empresariais públicas e licenciadas.",
          "Dados de IA e conteúdo gerado, incluindo instruções, materiais de origem, resumos, pontuações, mensagens, planos de conteúdo, imagens e feedback usados para entregar os recursos solicitados.",
          "Dados do WhatsApp Business, incluindo identificadores da conta e do número, tokens de acesso criptografados, metadados de modelos aprovados, configurações de envio, registros e evidências de consentimento de marketing, snapshots de sequências aprovadas, números destinatários, mensagens renderizadas, identificadores da Meta, status de entrega, erros e respostas recebidas necessárias para pausar a automação e transferir a conversa.",
          "Dados de assinatura e cobrança, incluindo plano, status, periodicidade, identificadores de cliente e assinatura e eventos de pagamento. Os dados completos do cartão são coletados e tratados pelo nosso provedor de pagamentos, não armazenados pelo ScoreLead.",
          "Comunicações, incluindo formulários de contato, lista de espera, solicitações de suporte e e-mails enviados a nós.",
          "Dados de uso, dispositivo e segurança, incluindo uso de recursos, contadores, logs, horários, localização aproximada inferida do IP, cookies e tecnologias semelhantes. Analytics opcional é carregado somente após o site registrar seu consentimento.",
        ],
      },
      {
        id: "sources",
        title: "Origem das informações",
        bullets: [
          "Você, sua organização e outros usuários autorizados do espaço de trabalho.",
          "Serviços conectados, incluindo autenticação do Google, provedores de pagamento, Meta e WhatsApp e integrações solicitadas por você.",
          "Sites empresariais, mapas, diretórios, perfis sociais, resultados de busca e registros públicos.",
          "Fornecedores licenciados de dados empresariais, busca, enriquecimento, hospedagem, analytics e infraestrutura.",
          "Seu navegador e dispositivo durante o uso do ScoreLead.",
        ],
        note:
          "A publicação de um telefone ou outro contato não representa, por si só, consentimento para receber marketing. O cliente deve estabelecer sua própria base legal e, para automação de WhatsApp, registrar um opt-in válido antes do envio.",
      },
      {
        id: "how-we-use-data",
        title: "Como e por que usamos informações",
        bullets: [
          "Fornecer, operar, personalizar e melhorar o ScoreLead, incluindo descoberta, enriquecimento, pontuação, geração por IA, exportações e fluxos de abordagem.",
          "Autenticar usuários, manter sessões, administrar contas e espaços de trabalho e prestar suporte.",
          "Processar assinaturas, prevenir fraudes, aplicar limites de plano e manter registros financeiros.",
          "Conectar contas do WhatsApp Business pertencentes ao cliente, sincronizar modelos aprovados, programar sequências aprovadas, entregar mensagens, tratar eventos de entrega e interromper a automação quando houver revogação de consentimento ou resposta.",
          "Proteger o serviço, investigar uso indevido, corrigir falhas, preservar registros de auditoria e cumprir obrigações legais.",
          "Enviar comunicações transacionais e, quando permitido, comunicações de produto ou marketing das quais seja possível sair.",
          "Produzir estatísticas agregadas ou desidentificadas que não identifiquem razoavelmente uma pessoa.",
        ],
        paragraphs: [
          "Conforme o contexto e a lei aplicável, utilizamos execução de contrato, legítimo interesse, consentimento, cumprimento de obrigação legal ou outra base legal. Quando o tratamento depender de consentimento, ele poderá ser retirado, sem invalidar o tratamento lícito anterior.",
        ],
      },
      {
        id: "customer-responsibilities",
        title: "Dados de leads e mensagens controlados pelo cliente",
        paragraphs: [
          "Os clientes são responsáveis pelos dados inseridos no ScoreLead e pelas instruções dadas a nós. Isso inclui confirmar que coleta, enriquecimento, exportação e abordagem são permitidos; fornecer avisos obrigatórios; respeitar objeções e opt-outs; e manter consentimento ou outra base legal exigida para contato.",
          "Para automação de marketing no WhatsApp, o ScoreLead foi projetado para exigir sequência aprovada, opt-in atual registrado, modelo aprovado pela Meta, conta empresarial conectada e proteções no momento do envio. Esses controles auxiliam a conformidade, mas não substituem as responsabilidades legais do cliente nem as regras da Meta.",
        ],
        links: [
          {
            label: "Política de Mensagens do WhatsApp Business",
            href: "https://business.whatsapp.com/policy",
            external: true,
          },
        ],
      },
      {
        id: "ai-and-automation",
        title: "IA e tratamento automatizado",
        paragraphs: [
          "O ScoreLead usa fornecedores de inteligência artificial para analisar informações empresariais e gerar resumos, pontuações de leads, rascunhos de abordagem, conteúdo e imagens. Prompts, instruções e dados de origem relevantes podem ser enviados a esses fornecedores para atender à solicitação. Selecionamos e configuramos fornecedores considerando a proteção de dados, mas o tratamento também é regido pelos contratos que mantemos com eles.",
          "Resultados de IA podem estar incompletos, desatualizados ou incorretos. O usuário deve revisá-los antes de usar ou enviar. O ScoreLead não utiliza, por conta própria, uma pontuação de lead gerada por IA como único fundamento para decisões legais ou de efeito semelhante sobre uma pessoa.",
        ],
      },
      {
        id: "sharing",
        title: "Como compartilhamos informações",
        paragraphs: [
          "Não vendemos informações pessoais por dinheiro. Compartilhamos dados somente quando necessário para operar o serviço, seguir instruções do cliente, concluir uma transação, proteger direitos e segurança ou cumprir a lei.",
        ],
        bullets: [
          "Prestadores de hospedagem em nuvem, banco de dados, armazenamento, segurança, autenticação, e-mail, analytics, suporte, busca, enriquecimento, IA e pagamentos.",
          "Meta e WhatsApp quando um cliente conecta uma conta ou envia mensagens pela Plataforma WhatsApp Business.",
          "Usuários autorizados do mesmo espaço de trabalho e destinatários escolhidos pelo cliente.",
          "Consultores profissionais, auditores, seguradoras, autoridades ou tribunais quando razoavelmente necessário ou exigido por lei.",
          "Um sucessor ou participante de fusão, financiamento, reorganização, aquisição ou venda de ativos, sujeito a confidencialidade e avisos adequados.",
        ],
      },
      {
        id: "international-transfers",
        title: "Transferências internacionais",
        paragraphs: [
          "O ScoreLead e seus fornecedores podem tratar informações em países diferentes daquele onde foram coletadas. As leis de privacidade podem variar. Quando exigido, adotamos proteções contratuais, organizacionais ou outros mecanismos legais para transferências internacionais e fornecemos informações adicionais mediante solicitação.",
        ],
      },
      {
        id: "retention",
        title: "Retenção",
        paragraphs: [
          "Mantemos informações apenas pelo período razoavelmente necessário para prestar o serviço, manter o relacionamento, cumprir obrigações legais e contábeis, solucionar disputas, executar contratos, proteger o serviço e preservar trilhas de auditoria necessárias. O prazo depende do tipo de dado e da finalidade.",
          "Após exclusão de uma conta ou desconexão de uma integração, excluímos ou desidentificamos dados que deixaram de ser necessários, ressalvados bloqueios legais, registros antifraude e de segurança, dados de cobrança, evidências de consentimento e opt-out e cópias residuais limitadas em backups protegidos, eliminadas no ciclo normal de backup.",
        ],
      },
      {
        id: "security",
        title: "Segurança",
        paragraphs: [
          "Utilizamos medidas administrativas, técnicas e organizacionais para proteger informações, como controles de acesso, transporte criptografado, credenciais protegidas e criptografia em repouso dos tokens de acesso empresarial do WhatsApp. Nenhum sistema é totalmente seguro e não podemos garantir que acesso indevido ou perda jamais ocorrerão.",
          "Você é responsável por usar senha forte, proteger dispositivos e credenciais, limitar o acesso ao espaço de trabalho e nos avisar prontamente sobre suspeita de uso não autorizado.",
        ],
      },
      {
        id: "rights",
        title: "Seus direitos de privacidade",
        paragraphs: [
          "Conforme sua localização e a forma de tratamento, você pode ter direitos de obter informações; confirmar o tratamento; acessar, corrigir, atualizar, anonimizar, bloquear, excluir ou portar dados; se opor ou restringir certos tratamentos; retirar consentimento; sair de marketing; pedir revisão de determinadas decisões automatizadas; e reclamar a uma autoridade de proteção de dados.",
          "Podemos precisar confirmar sua identidade e legitimidade antes de atender à solicitação. Alguns direitos têm exceções, inclusive quando a retenção for necessária por lei, segurança, proteção de terceiros ou exercício de direitos em processo. Se tratarmos seus dados exclusivamente para um cliente, poderemos direcionar a solicitação a ele ou auxiliá-lo na resposta.",
        ],
        links: [{ label: "Instruções para exclusão de dados", href: "/data-deletion" }],
      },
      {
        id: "cookies",
        title: "Cookies e analytics",
        paragraphs: [
          "O ScoreLead utiliza cookies e armazenamento necessários para autenticação, segurança, preferências e funcionamento do aplicativo. Nosso site público também oferece analytics opcional. Essas ferramentas não são carregadas sem que o site registre a aceitação dos cookies opcionais. Você pode recusá-las no aviso de cookies e limpar os dados do site no navegador para redefinir sua escolha.",
        ],
      },
      {
        id: "children",
        title: "Crianças e adolescentes",
        paragraphs: [
          "O ScoreLead é um serviço empresarial e não é destinado a menores de 18 anos. Não solicitamos conscientemente que menores criem contas. Se você acredita que um menor forneceu dados pessoais a nós, entre em contato para que possamos investigar e tomar as medidas apropriadas.",
        ],
      },
      {
        id: "changes-and-contact",
        title: "Alterações e contato",
        paragraphs: [
          "Podemos atualizar esta política quando o serviço, os fornecedores ou os requisitos legais mudarem. Publicaremos a nova versão aqui, alteraremos a data de vigência e daremos aviso adicional quando a mudança for relevante e a lei assim exigir.",
          "Dúvidas, reclamações e solicitações relacionadas a direitos podem ser enviadas a hello@scorelead.io. Descreva claramente sua relação com o ScoreLead e o pedido. Você também pode procurar a Autoridade Nacional de Proteção de Dados (ANPD) ou a autoridade competente em sua jurisdição.",
        ],
      },
    ],
  },

  terms: {
    ...shared,
    eyebrow: "Legal · Termos",
    title: "Termos de Serviço",
    description:
      "Estes termos regem o acesso e o uso do ScoreLead, incluindo recursos de descoberta de leads, IA, conteúdo, cobrança e abordagem.",
    sections: [
      {
        id: "agreement",
        title: "Aceitação destes termos",
        paragraphs: [
          "Ao criar uma conta, acessar ou usar o ScoreLead, você concorda com estes Termos de Serviço e com nossa Política de Privacidade. Se usar o ScoreLead em nome de uma organização, você declara ter poderes para vinculá-la, e “você” inclui essa organização.",
          "Se não concordar, não use o serviço. Propostas, pedidos ou termos adicionais assinados podem ser aplicáveis; em caso de conflito, o termo assinado mais específico prevalece naquele ponto.",
        ],
        links: [{ label: "Política de Privacidade", href: "/privacy" }],
      },
      {
        id: "eligibility-and-accounts",
        title: "Elegibilidade e contas",
        paragraphs: [
          "Você deve ter pelo menos 18 anos e capacidade legal para contratar. Os dados da conta devem ser corretos e atualizados. Você é responsável por proteger credenciais, pelas atividades da conta e pelo acesso concedido a usuários da sua organização.",
          "Avise-nos imediatamente sobre suspeita de acesso indevido. É proibido compartilhar conta para contornar limites do plano ou se passar por outra pessoa ou organização.",
        ],
      },
      {
        id: "the-service",
        title: "O serviço",
        paragraphs: [
          "O ScoreLead ajuda empresas a descobrir e enriquecer leads empresariais, organizar pipelines, gerar conteúdo e abordagem com IA, exportar dados e, quando habilitado, conectar serviços pertencentes ao cliente, como o WhatsApp Business. Recursos podem ser adicionados, alterados, limitados ou encerrados à medida que o produto evolui.",
          "Recursos beta, de prévia ou experimentais podem ser menos confiáveis e mudar sem aviso. Não prometemos que um lead, contato, score, resultado, integração ou resultado comercial específico estará disponível, completo, atualizado ou terá sucesso.",
        ],
      },
      {
        id: "plans-and-billing",
        title: "Planos, cobrança e cancelamento",
        paragraphs: [
          "Alguns recursos são gratuitos e outros exigem assinatura paga. Preços, franquias de uso, periodicidade, impostos e renovação são exibidos antes da compra ou em documento aplicável. Assinaturas pagas são renovadas automaticamente até o cancelamento, salvo indicação diferente no checkout.",
          "Você autoriza nosso provedor de pagamento a cobrar o método escolhido. A assinatura pode ser cancelada pelos controles disponíveis e normalmente permanece ativa até o fim do período já pago. Valores não são reembolsáveis, exceto quando os termos da compra ou a lei obrigatória determinarem. Podemos alterar preços futuros mediante aviso exigido por lei.",
        ],
      },
      {
        id: "customer-data",
        title: "Seus dados e conteúdo",
        paragraphs: [
          "Você mantém a titularidade dos dados, prompts, materiais empresariais e conteúdos enviados ao ScoreLead. Você nos concede um direito limitado e mundial de hospedar, copiar, tratar, transmitir e exibir esse material apenas para fornecer, proteger, suportar e melhorar o serviço e cumprir suas instruções.",
          "Você declara possuir direitos, avisos, permissões e base legal necessários para os dados fornecidos e para o tratamento solicitado. Não envie dados pessoais sensíveis, informações confidenciais ou dados regulados, salvo se o serviço os suportar expressamente e houver acordo e base legal adequados.",
        ],
      },
      {
        id: "leads-and-outreach",
        title: "Dados de leads e conformidade da abordagem",
        paragraphs: [
          "Informações empresariais em sites, mapas, diretórios ou serviços de dados podem estar incorretas e não dão, por si só, permissão para contatar alguém. Você deve verificar os dados e cumprir as regras de privacidade, marketing direto, telemarketing, defesa do consumidor, antispam e do seu setor aplicáveis a você e aos destinatários.",
          "Você é o único responsável por decidir quem contatar, a base legal, o conteúdo e horário, as identificações e avisos obrigatórios e o respeito a objeções, listas de supressão e opt-outs. O ScoreLead pode aplicar limites ou bloquear atividades para proteger destinatários e o serviço.",
        ],
      },
      {
        id: "whatsapp",
        title: "Recursos do WhatsApp Business",
        paragraphs: [
          "Ao conectar o WhatsApp Business, você autoriza o ScoreLead a acessar os ativos selecionados que pertencem ao cliente e agir conforme suas instruções aprovadas pela plataforma da Meta. Você continua responsável pela conta, opt-ins, modelos aprovados, conteúdo, cobranças da Meta ou de terceiros e cumprimento dos termos e políticas do WhatsApp e da Meta.",
          "O envio automatizado exige opt-in de marketing atual e registrado e sequência aprovada, mas esses controles técnicos não provam a validade jurídica do consentimento. Uma resposta pode pausar a automação e mensagens reconhecidas de opt-out podem revogar o registro e cancelar envios pendentes. Você deve acompanhar as conversas e respeitar todos os opt-outs, inclusive os expressos com outras palavras ou canais.",
        ],
        links: [
          {
            label: "Política de Mensagens do WhatsApp Business",
            href: "https://business.whatsapp.com/policy",
            external: true,
          },
        ],
      },
      {
        id: "ai-output",
        title: "Resultados gerados por IA",
        paragraphs: [
          "Recursos de IA podem produzir resultados incorretos, incompletos, tendenciosos ou inadequados. Você deve revisar e aprovar o material antes de utilizá-lo, publicá-lo ou enviá-lo. Não trate resultados de IA como aconselhamento jurídico, financeiro, médico ou profissional.",
          "Você é responsável por assegurar que prompts e resultados não violem privacidade, confidencialidade, propriedade intelectual, publicidade ou outros direitos. Conteúdo semelhante pode ser gerado para outros usuários, e não garantimos exclusividade nem proteção por propriedade intelectual.",
        ],
      },
      {
        id: "acceptable-use",
        title: "Uso aceitável",
        paragraphs: ["Você só pode usar o ScoreLead de forma lícita e de acordo com estes termos. É proibido:"],
        bullets: [
          "Enviar spam, assédio, mensagens enganosas, discriminação ilegal, ameaças, malware ou conteúdo que explore ou coloque pessoas em risco.",
          "Contatar destinatários sem consentimento obrigatório ou outra base legal válida, ocultar sua identidade, ignorar opt-outs ou burlar limites de envio e plano.",
          "Coletar, inferir, carregar ou usar dados sensíveis de forma proibida por lei ou direcionar geração de leads e marketing a menores.",
          "Violar direitos de privacidade, imagem, confidencialidade, propriedade intelectual ou outros direitos.",
          "Testar, interromper, realizar engenharia reversa, extrair, sobrecarregar ou acessar o serviço sem autorização, ressalvado o que não puder ser restringido por lei.",
          "Revender, sublicenciar ou fornecer acesso ao ScoreLead sem permissão expressa, ou usar aspectos não públicos para construir produto concorrente.",
          "Usar o serviço para bens ilícitos, fraude ou atividades proibidas por um fornecedor de plataforma aplicável.",
        ],
      },
      {
        id: "third-party-services",
        title: "Serviços de terceiros",
        paragraphs: [
          "O ScoreLead opera com serviços de autenticação, pagamentos, busca, mapas, enriquecimento, IA, armazenamento, e-mail, analytics, Meta e WhatsApp. O uso desses serviços pode seguir termos e políticas próprios. Não somos responsáveis pelos serviços de terceiros, disponibilidade ou mudanças realizadas por eles.",
          "Você nos autoriza a trocar dados com um serviço conectado para realizar sua solicitação. A remoção do acesso ou uma alteração na API de terceiro pode interromper o recurso.",
        ],
      },
      {
        id: "intellectual-property",
        title: "Propriedade intelectual do ScoreLead",
        paragraphs: [
          "O ScoreLead, seu software, design, documentação, marcas e demais materiais são de nossa titularidade ou de nossos licenciantes e são protegidos por lei. Sujeito a estes termos, concedemos direito limitado, não exclusivo, intransferível e revogável de usar o serviço durante a assinatura ou conta autorizada.",
          "Ao fornecer feedback, você permite que o utilizemos sem restrição ou remuneração, sem identificá-lo publicamente sem autorização.",
        ],
      },
      {
        id: "confidentiality-and-security",
        title: "Confidencialidade e segurança",
        paragraphs: [
          "Cada parte adotará cuidado razoável para proteger informações confidenciais não públicas da outra e usá-las apenas na relação, exceto dados que se tornem públicos sem violação, já fossem legitimamente conhecidos, tenham sido desenvolvidos de forma independente ou recebidos legitimamente de outra fonte. Divulgações exigidas por lei podem ocorrer, com aviso quando permitido.",
          "Você deve manter segurança adequada para conta, exportações, contas conectadas e dados de destinatários e nos avisar prontamente sobre suspeita de comprometimento que possa afetar o ScoreLead.",
        ],
      },
      {
        id: "suspension-and-termination",
        title: "Suspensão e encerramento",
        paragraphs: [
          "Você pode parar de usar o ScoreLead e cancelar planos pagos pelos controles disponíveis. Podemos limitar ou suspender acesso quando necessário para lidar com risco de segurança, atividade ilegal, inadimplência, violação, dano a destinatários ou terceiros, exigência de uma plataforma ou descumprimento relevante.",
          "Podemos encerrar uma conta por violação relevante ou repetida e, quando viável, avisaremos e permitiremos correção. Com o encerramento, termina o direito de uso. Obrigações que por sua natureza devam continuar — como pagamentos, titularidade, limitações e disputas — permanecem vigentes.",
        ],
      },
      {
        id: "disclaimers",
        title: "Isenções de garantia",
        paragraphs: [
          "Na máxima extensão permitida por lei, o ScoreLead é oferecido “no estado em que se encontra” e “conforme disponível”. Excluímos garantias implícitas de adequação comercial ou a finalidade específica, não violação e funcionamento ininterrupto ou sem erros. Não garantimos precisão de dados, entregabilidade, conformidade regulatória, resposta de destinatários, receita ou resultado comercial específico.",
          "Algumas jurisdições não permitem determinadas exclusões. Nada nestes termos elimina direitos que não possam ser legalmente afastados.",
        ],
      },
      {
        id: "liability",
        title: "Limitação de responsabilidade",
        paragraphs: [
          "Na máxima extensão permitida por lei, nenhuma parte será responsável por danos indiretos, incidentais, especiais, exemplares, punitivos ou consequenciais, nem por perda de lucro, receita, reputação, oportunidade ou dados decorrente do serviço, mesmo que avisada da possibilidade.",
          "Na máxima extensão permitida por lei, a responsabilidade total do ScoreLead relacionada ao serviço não excederá o valor pago por você nos 12 meses anteriores ao fato que gerou a reclamação, ou USD 100 caso tenha utilizado apenas serviço gratuito. Os limites não se aplicam quando a responsabilidade não puder ser legalmente limitada.",
        ],
      },
      {
        id: "indemnity",
        title: "Indenização",
        paragraphs: [
          "Na medida permitida por lei, você defenderá e indenizará o ScoreLead e sua equipe contra reclamações de terceiros, perdas e custos razoáveis decorrentes de seus dados, abordagens ou mensagens, contas conectadas, violação de lei ou regras de plataforma ou descumprimento relevante destes termos. Isso não exige indenização por dano causado por conduta ilícita do próprio ScoreLead.",
        ],
      },
      {
        id: "changes-and-law",
        title: "Alterações, lei aplicável e disputas",
        paragraphs: [
          "Podemos atualizar estes termos para refletir mudanças de produto, fornecedor ou lei. Publicaremos os novos termos, atualizaremos a data e daremos aviso adicional de alterações relevantes quando exigido. O uso após a vigência representa aceitação quando permitido por lei.",
          "Uma proposta ou pedido assinado pode definir lei e foro aplicáveis. Na ausência desse documento, lei e foro serão determinados pelas normas obrigatórias e pelo local do principal estabelecimento do ScoreLead, sem limitar direitos do consumidor ou de proteção de dados que não possam ser renunciados. Antes de uma reclamação formal, entre em contato e permita uma oportunidade razoável de solução amigável.",
        ],
      },
      {
        id: "contact",
        title: "Contato",
        paragraphs: [
          "Dúvidas sobre estes termos podem ser enviadas a hello@scorelead.io. Notificações devem identificar a conta ou organização e trazer detalhes suficientes para resposta.",
        ],
      },
    ],
  },

  dataDeletion: {
    ...shared,
    eyebrow: "Legal · Controles de privacidade",
    title: "Instruções para exclusão de dados",
    description:
      "Use estas instruções para solicitar a exclusão dos dados da sua conta ScoreLead ou de informações recebidas por uma conta Meta ou WhatsApp conectada.",
    sections: [
      {
        id: "request-deletion",
        title: "Solicite a exclusão da conta ou dos dados conectados",
        paragraphs: [
          "O ScoreLead ainda não oferece um botão de exclusão de conta por autoatendimento. Para solicitar a exclusão, siga as etapas abaixo. Não há cobrança para enviar a solicitação.",
        ],
        steps: [
          "Envie um e-mail para hello@scorelead.io usando o endereço associado à sua conta ScoreLead.",
          "Use o assunto “Solicitação de exclusão de dados”.",
          "Informe o e-mail da conta, o nome da empresa ou espaço de trabalho e se deseja excluir toda a conta ScoreLead ou apenas os dados ligados a uma conta Facebook, Meta ou WhatsApp conectada.",
          "Não envie senhas, tokens de acesso, números de cartão ou cópias de documentos sensíveis, salvo se solicitarmos um meio seguro de verificação.",
        ],
        note:
          "Se você autorizou o ScoreLead pelo Facebook ou por outro fluxo da Meta, informe, quando possível, o e-mail ou identificador usado. Ele será usado somente para localizar e verificar a conexão relevante.",
      },
      {
        id: "disconnect-whatsapp",
        title: "Desconecte o WhatsApp imediatamente",
        paragraphs: [
          "O titular da conta pode desconectar o WhatsApp nas configurações de integração do ScoreLead. A desconexão marca a conexão como inativa, cancela etapas automáticas pendentes, tenta remover a assinatura da conta WhatsApp Business quando suportado e destrói o token armazenado. Ela não exclui da Meta a conta WhatsApp Business do cliente.",
          "Para excluir todos os dados da conta ScoreLead, envie também a solicitação descrita acima. Quando disponível, você pode remover separadamente o acesso do ScoreLead nas configurações empresariais da Meta.",
        ],
      },
      {
        id: "verification",
        title: "Como verificamos e processamos a solicitação",
        paragraphs: [
          "Confirmaremos o recebimento e poderemos pedir dados limitados para verificar sua identidade, autoridade sobre a conta empresarial e o escopo da exclusão. Pedidos em nome de terceiros podem exigir prova de representação.",
          "Após a verificação, excluiremos ou desidentificaremos os dados abrangidos no prazo exigido pela lei aplicável e informaremos a conclusão ou eventual exceção legal. Se mantivermos os dados apenas em nome de um cliente, poderemos direcionar o pedido a ele e auxiliá-lo conforme apropriado.",
        ],
      },
      {
        id: "what-is-deleted",
        title: "O que a exclusão abrange",
        bullets: [
          "Perfil da conta, vínculos de autenticação, sessões ativas e registros de espaço de trabalho abrangidos pelo pedido.",
          "Perfis empresariais, buscas salvas, leads, enriquecimentos, rascunhos de abordagem, planos de conteúdo e imagens armazenadas controlados pela conta.",
          "Identificadores e tokens criptografados do WhatsApp, modelos em cache, sequências pendentes, status de mensagens e respostas recebidas abrangidos pelo pedido.",
          "Registros de contato, suporte e preferências que não sejam mais necessários para outra finalidade lícita.",
        ],
      },
      {
        id: "what-may-remain",
        title: "Informações que podem permanecer",
        paragraphs: [
          "Podemos reter informações limitadas quando necessário para tributos, contabilidade, prevenção a fraude, segurança, solução de disputas, exercício de direitos ou cumprimento da lei. Registros de consentimento, revogação, supressão, transação e auditoria podem ser mantidos para demonstrar conformidade ou evitar novo contato com um destinatário.",
          "Cópias residuais criptografadas podem permanecer em backups protegidos até expirarem pelo ciclo normal. Dados retidos por exceção são separados do uso comum do produto e eliminados quando terminar o motivo da retenção.",
        ],
      },
      {
        id: "third-parties",
        title: "Meta e outros terceiros",
        paragraphs: [
          "Excluir dados do ScoreLead não exclui automaticamente informações mantidas de forma independente pela Meta, WhatsApp, Google, Stripe ou outro terceiro. Use os controles ou o canal de privacidade de cada fornecedor para os dados que ele controla. Encaminharemos ou executaremos instruções de exclusão aos nossos operadores quando exigido e tecnicamente possível.",
        ],
        links: [
          {
            label: "Central de Contas da Meta",
            href: "https://accountscenter.facebook.com/personal_info/account_ownership_and_control/",
            external: true,
          },
          { label: "Política de Privacidade do ScoreLead", href: "/privacy" },
        ],
      },
      {
        id: "lead-data-requests",
        title: "Se você aparece nos dados de leads de um cliente",
        paragraphs: [
          "Em geral, o cliente do ScoreLead controla os dados de leads e destinatários no espaço de trabalho. Procure primeiro a empresa que enviou a mensagem ou coletou seus dados. Você também pode nos escrever informando a empresa, telefone ou e-mail envolvido e contexto suficiente para localizar o registro. Não divulgaremos informações confidenciais de outro cliente, mas poderemos encaminhar o pedido ou auxiliá-lo quando adequado.",
        ],
      },
    ],
  },
}
