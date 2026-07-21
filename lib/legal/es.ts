import type { LegalDocumentContent, LegalDocumentKey } from "./types"

const shared = {
  updatedLabel: "Vigente y última actualización:",
  updatedDate: "20 de julio de 2026",
  tocLabel: "En esta página",
  homeLabel: "Volver a ScoreLead",
  contactLabel: "¿Preguntas o solicitudes de privacidad?",
  contactDescription:
    "Contáctanos desde el correo asociado a tu cuenta para que podamos responder y, cuando sea necesario, verificar la solicitud.",
} as const

export const legalContentEs: Record<LegalDocumentKey, LegalDocumentContent> = {
  privacy: {
    ...shared,
    eyebrow: "Legal · Privacidad",
    title: "Política de Privacidad",
    description:
      "Esta política explica qué información trata ScoreLead, por qué la usamos, con quién la compartimos y qué opciones y derechos tienes.",
    sections: [
      {
        id: "scope-and-roles",
        title: "Alcance y nuestro rol",
        paragraphs: [
          "Esta Política de Privacidad se aplica al sitio web, las aplicaciones, los canales de soporte y los servicios relacionados de ScoreLead. “ScoreLead”, “nosotros” y “nuestro” se refieren al proveedor de esos servicios.",
          "Respecto de datos de cuenta, sitio web, facturación y relación directa, ScoreLead suele actuar como responsable del tratamiento. Cuando un cliente carga, descubre, enriquece o utiliza datos de leads y mensajes en el servicio, ese cliente generalmente determina los fines y medios y actúa como responsable; ScoreLead trata los datos bajo sus instrucciones como encargado o proveedor de servicios. El rol exacto depende del contexto y de la ley aplicable.",
        ],
      },
      {
        id: "information-we-collect",
        title: "Información que recopilamos",
        paragraphs: [
          "Recopilamos información proporcionada por ti, creada durante el uso del servicio, recibida de servicios conectados e información empresarial proveniente de fuentes públicas o licenciadas.",
        ],
        bullets: [
          "Datos de cuenta y autenticación, como nombre, correo, credenciales de contraseña en forma protegida, imagen de perfil, verificación del correo, identificadores del proveedor de inicio de sesión, sesiones, dirección IP y agente del navegador.",
          "Datos del perfil empresarial y espacio de trabajo, incluidos nombre de la empresa, sitio web, ubicación, sector, área de servicio, marca, redes sociales, perfiles de comprador, preferencias de búsqueda y contenido aportado por usuarios.",
          "Datos de leads y prospectos, como nombres empresariales, sitios web, contactos comerciales, ubicación, reseñas, perfiles sociales, servicios, equipo, responsables de decisión, fuentes de enriquecimiento, notas, puntuaciones, estado del pipeline y borradores de contacto. Pueden ser aportados por un cliente u obtenidos de fuentes empresariales públicas y licenciadas.",
          "Datos de IA y contenido generado, incluidas instrucciones, material de origen, resúmenes, puntuaciones, mensajes, planes de contenido, imágenes y comentarios usados para prestar las funciones solicitadas.",
          "Datos de WhatsApp Business, incluidos identificadores de cuenta y número, tokens de acceso cifrados, metadatos de plantillas aprobadas, configuración de envío, registros y evidencia de consentimiento de marketing, instantáneas de secuencias aprobadas, números destinatarios, mensajes renderizados, identificadores de Meta, estados de entrega, errores y respuestas entrantes necesarias para pausar la automatización y transferir la conversación.",
          "Datos de suscripción y facturación, incluidos plan, estado, intervalo, identificadores de cliente y suscripción y eventos de pago. Los datos completos de tarjetas los recopila y trata el proveedor de pagos; ScoreLead no los almacena completos.",
          "Comunicaciones, incluidos formularios de contacto, lista de espera, solicitudes de soporte y correos que nos envías.",
          "Datos de uso, dispositivo y seguridad, incluidos uso de funciones, contadores, registros, fechas, ubicación aproximada inferida de la IP, cookies y tecnologías similares. Las analíticas opcionales solo se cargan después de que el sitio registra tu consentimiento.",
        ],
      },
      {
        id: "sources",
        title: "Origen de la información",
        bullets: [
          "Tú, tu organización y otros usuarios autorizados del espacio de trabajo.",
          "Servicios conectados, como autenticación de Google, proveedores de pago, Meta y WhatsApp y las integraciones que solicites.",
          "Sitios web empresariales, mapas, directorios, perfiles sociales, resultados de búsqueda y registros públicos.",
          "Proveedores licenciados de datos empresariales, búsqueda, enriquecimiento, alojamiento, analíticas e infraestructura.",
          "Tu navegador y dispositivo al usar ScoreLead.",
        ],
        note:
          "Que un teléfono u otro dato de contacto sea público no constituye por sí solo consentimiento para recibir marketing. El cliente debe establecer su propia base legal y, para automatización de WhatsApp, registrar un opt-in válido antes de enviar.",
      },
      {
        id: "how-we-use-data",
        title: "Cómo y por qué usamos la información",
        bullets: [
          "Proporcionar, operar, personalizar y mejorar ScoreLead, incluidos descubrimiento, enriquecimiento, puntuación, generación con IA, exportaciones y flujos de contacto.",
          "Autenticar usuarios, mantener sesiones, administrar cuentas y espacios de trabajo y prestar soporte.",
          "Procesar suscripciones, prevenir fraude, aplicar límites del plan y mantener registros financieros.",
          "Conectar cuentas de WhatsApp Business del cliente, sincronizar plantillas aprobadas, programar secuencias aprobadas, entregar mensajes, tratar eventos de entrega y detener la automatización si se revoca el consentimiento o llega una respuesta.",
          "Proteger el servicio, investigar abusos, corregir fallos, conservar auditorías y cumplir obligaciones legales.",
          "Enviar comunicaciones transaccionales y, cuando esté permitido, comunicaciones de producto o marketing de las que puedas darte de baja.",
          "Crear estadísticas agregadas o desidentificadas que no identifiquen razonablemente a una persona.",
        ],
        paragraphs: [
          "Según el contexto y la ley aplicable, nos basamos en la ejecución de un contrato, intereses legítimos, consentimiento, cumplimiento legal u otra base válida. Cuando usamos consentimiento, puede retirarse sin invalidar el tratamiento lícito anterior.",
        ],
      },
      {
        id: "customer-responsibilities",
        title: "Datos de leads y mensajes controlados por el cliente",
        paragraphs: [
          "Los clientes son responsables de los datos que incorporan a ScoreLead y de las instrucciones que nos dan. Esto incluye confirmar que recopilación, enriquecimiento, exportación y contacto están permitidos; proporcionar avisos obligatorios; respetar objeciones y bajas; y mantener el consentimiento u otra base legal necesaria.",
          "Para automatización de marketing por WhatsApp, ScoreLead está diseñado para exigir una secuencia aprobada, opt-in vigente registrado, plantilla aprobada por Meta, cuenta empresarial conectada y controles al enviar. Estos controles ayudan al cumplimiento, pero no sustituyen las responsabilidades legales del cliente ni las reglas de Meta.",
        ],
        links: [
          {
            label: "Política de Mensajería de WhatsApp Business",
            href: "https://business.whatsapp.com/policy",
            external: true,
          },
        ],
      },
      {
        id: "ai-and-automation",
        title: "IA y tratamiento automatizado",
        paragraphs: [
          "ScoreLead usa proveedores de inteligencia artificial para analizar información empresarial y generar resúmenes, puntuaciones, borradores de contacto, contenido e imágenes. Los prompts, instrucciones y datos de origen relevantes pueden enviarse a esos proveedores para atender una solicitud. Seleccionamos y configuramos proveedores considerando la protección de datos, pero el tratamiento también se rige por nuestros acuerdos con ellos.",
          "Los resultados de IA pueden ser incompletos, desactualizados o incorrectos. Deben revisarse antes de usarlos o enviarlos. ScoreLead no usa por sí mismo una puntuación de lead generada por IA como única base para decisiones legales o de efecto similar sobre una persona.",
        ],
      },
      {
        id: "sharing",
        title: "Cómo compartimos información",
        paragraphs: [
          "No vendemos información personal por dinero. Solo compartimos datos cuando es necesario para operar el servicio, seguir instrucciones del cliente, completar una transacción, proteger derechos y seguridad o cumplir la ley.",
        ],
        bullets: [
          "Proveedores de nube, bases de datos, almacenamiento, seguridad, autenticación, correo, analíticas, soporte, búsqueda, enriquecimiento, IA y pagos.",
          "Meta y WhatsApp cuando un cliente conecta una cuenta o envía mensajes mediante la Plataforma de WhatsApp Business.",
          "Usuarios autorizados del mismo espacio de trabajo y destinatarios elegidos por el cliente.",
          "Asesores, auditores, aseguradoras, autoridades o tribunales cuando sea razonablemente necesario o exigido por ley.",
          "Un sucesor o participante en una fusión, financiación, reorganización, adquisición o venta de activos, con medidas adecuadas de confidencialidad y aviso.",
        ],
      },
      {
        id: "international-transfers",
        title: "Transferencias internacionales",
        paragraphs: [
          "ScoreLead y sus proveedores pueden tratar información en países distintos de aquel donde fue recopilada. Las leyes de privacidad pueden variar. Cuando sea obligatorio, utilizamos salvaguardas contractuales, organizativas u otros mecanismos legales y ofrecemos información adicional a petición.",
        ],
      },
      {
        id: "retention",
        title: "Conservación",
        paragraphs: [
          "Conservamos información solo durante el tiempo razonablemente necesario para prestar el servicio, mantener la relación, cumplir obligaciones legales y contables, resolver disputas, ejecutar acuerdos, proteger el servicio y preservar auditorías necesarias. El plazo depende del tipo de dato y de la finalidad.",
          "Tras eliminar una cuenta o desconectar una integración, eliminamos o desidentificamos datos que ya no se necesitan, salvo retenciones legales, registros antifraude y de seguridad, facturación, evidencia de consentimiento y baja y copias residuales limitadas en respaldos protegidos que expiran en el ciclo habitual.",
        ],
      },
      {
        id: "security",
        title: "Seguridad",
        paragraphs: [
          "Aplicamos medidas administrativas, técnicas y organizativas para proteger la información, como controles de acceso, transporte cifrado, credenciales protegidas y cifrado en reposo de tokens empresariales de WhatsApp. Ningún sistema es completamente seguro y no podemos garantizar que nunca haya acceso indebido o pérdida.",
          "Eres responsable de usar una contraseña fuerte, proteger dispositivos y credenciales, limitar el acceso al espacio de trabajo y avisarnos rápidamente si sospechas uso no autorizado.",
        ],
      },
      {
        id: "rights",
        title: "Tus derechos de privacidad",
        paragraphs: [
          "Según tu ubicación y el tratamiento, puedes tener derecho a recibir información; confirmar el tratamiento; acceder, corregir, actualizar, anonimizar, bloquear, eliminar o portar datos; oponerte o restringir ciertos tratamientos; retirar consentimiento; darte de baja del marketing; solicitar revisión de determinadas decisiones automatizadas; y reclamar ante una autoridad de protección de datos.",
          "Podemos verificar tu identidad y autoridad antes de responder. Algunos derechos tienen excepciones cuando la conservación es necesaria por ley, seguridad, protección de terceros o reclamaciones legales. Si tratamos tus datos exclusivamente para un cliente, podremos remitirle la solicitud o ayudarlo a responder.",
        ],
        links: [{ label: "Instrucciones para eliminar datos", href: "/data-deletion" }],
      },
      {
        id: "cookies",
        title: "Cookies y analíticas",
        paragraphs: [
          "ScoreLead usa cookies y almacenamiento necesarios para autenticación, seguridad, preferencias y funcionamiento de la aplicación. El sitio público también ofrece analíticas opcionales, que no se cargan sin aceptación registrada. Puedes rechazarlas en el aviso y borrar los datos del sitio en tu navegador para restablecer la elección.",
        ],
      },
      {
        id: "children",
        title: "Menores",
        paragraphs: [
          "ScoreLead es un servicio empresarial y no está dirigido a menores de 18 años. No pedimos conscientemente que menores creen cuentas. Si crees que un menor nos proporcionó datos personales, contáctanos para que podamos investigar y tomar medidas.",
        ],
      },
      {
        id: "changes-and-contact",
        title: "Cambios y contacto",
        paragraphs: [
          "Podemos actualizar esta política cuando cambien el servicio, los proveedores o los requisitos legales. Publicaremos la nueva versión aquí, cambiaremos la fecha y daremos aviso adicional si el cambio es importante y la ley lo exige.",
          "Puedes enviar preguntas, reclamaciones y solicitudes de derechos a hello@scorelead.io. Describe claramente tu relación con ScoreLead y la solicitud. También puedes acudir a la autoridad de protección de datos de tu jurisdicción.",
        ],
      },
    ],
  },

  terms: {
    ...shared,
    eyebrow: "Legal · Términos",
    title: "Términos de Servicio",
    description:
      "Estos términos rigen el acceso y uso de ScoreLead, incluidas sus funciones de descubrimiento de leads, IA, contenido, facturación y contacto.",
    sections: [
      {
        id: "agreement",
        title: "Aceptación de estos términos",
        paragraphs: [
          "Al crear una cuenta, acceder o usar ScoreLead, aceptas estos Términos de Servicio y nuestra Política de Privacidad. Si usas ScoreLead para una organización, declaras que puedes vincularla y “tú” incluye a esa organización.",
          "Si no estás de acuerdo, no uses el servicio. Pueden aplicarse pedidos o términos adicionales por escrito; si entran en conflicto, el término firmado más específico prevalece respecto de ese conflicto.",
        ],
        links: [{ label: "Política de Privacidad", href: "/privacy" }],
      },
      {
        id: "eligibility-and-accounts",
        title: "Elegibilidad y cuentas",
        paragraphs: [
          "Debes tener al menos 18 años y capacidad legal para contratar. La información de cuenta debe ser correcta y mantenerse actualizada. Eres responsable de proteger credenciales, de la actividad de tu cuenta y del acceso que concedas a usuarios de tu organización.",
          "Avísanos de inmediato si sospechas acceso indebido. No puedes compartir una cuenta para eludir límites del plan ni suplantar a una persona u organización.",
        ],
      },
      {
        id: "the-service",
        title: "El servicio",
        paragraphs: [
          "ScoreLead ayuda a empresas a descubrir y enriquecer leads empresariales, organizar pipelines, generar contenido y contacto con IA, exportar datos y, cuando está habilitado, conectar servicios del cliente como WhatsApp Business. Las funciones pueden añadirse, modificarse, limitarse o retirarse a medida que evoluciona el producto.",
          "Las funciones beta, preliminares o experimentales pueden ser menos fiables y cambiar sin aviso. No prometemos que un lead, contacto, puntuación, resultado, integración o resultado comercial concreto esté disponible, completo, actualizado o tenga éxito.",
        ],
      },
      {
        id: "plans-and-billing",
        title: "Planes, facturación y cancelación",
        paragraphs: [
          "Algunas funciones son gratuitas y otras requieren suscripción. Precios, uso incluido, intervalo, impuestos y renovación se muestran antes de comprar o en el pedido aplicable. Las suscripciones se renuevan automáticamente hasta que se cancelan, salvo que el checkout indique otra cosa.",
          "Autorizas al proveedor de pagos a cobrar el método seleccionado. Puedes cancelar con los controles disponibles; la cancelación normalmente se aplica al final del período pagado. Los cargos no son reembolsables salvo que los términos de compra o la ley obligatoria dispongan otra cosa. Podemos cambiar precios futuros con el aviso exigido por ley.",
        ],
      },
      {
        id: "customer-data",
        title: "Tus datos y contenido",
        paragraphs: [
          "Conservas la titularidad de datos, prompts, materiales empresariales y contenido que envías a ScoreLead. Nos concedes un derecho limitado y mundial para alojar, copiar, tratar, transmitir y mostrar ese material solo cuando sea necesario para proporcionar, proteger, dar soporte y mejorar el servicio y seguir tus instrucciones.",
          "Declaras que tienes derechos, avisos, permisos y base legal necesarios para los datos y el tratamiento solicitado. No cargues datos sensibles, confidenciales o regulados salvo que el servicio los admita expresamente y tengas acuerdo y base legal adecuados.",
        ],
      },
      {
        id: "leads-and-outreach",
        title: "Datos de leads y cumplimiento del contacto",
        paragraphs: [
          "La información empresarial de sitios, mapas, directorios o proveedores puede ser incorrecta y no autoriza por sí sola a contactar a alguien. Debes verificar los datos y cumplir normas de privacidad, marketing directo, telemarketing, consumidores, antispam y del sector aplicables a ti y a los destinatarios.",
          "Eres el único responsable de elegir a quién contactar, la base legal, contenido y horario, identificaciones y avisos obligatorios y de respetar objeciones, listas de supresión y bajas. ScoreLead puede aplicar límites o bloquear actividad para proteger a destinatarios y al servicio.",
        ],
      },
      {
        id: "whatsapp",
        title: "Funciones de WhatsApp Business",
        paragraphs: [
          "Al conectar WhatsApp Business, autorizas a ScoreLead a acceder a los activos seleccionados del cliente y actuar conforme a tus instrucciones aprobadas mediante la plataforma de Meta. Sigues siendo responsable de la cuenta, opt-ins, plantillas aprobadas, contenido, cargos de Meta u otros proveedores y cumplimiento de los términos y políticas de WhatsApp y Meta.",
          "El envío automatizado exige opt-in de marketing vigente y registrado y una secuencia aprobada, pero esos controles técnicos no prueban la validez legal del consentimiento. Una respuesta puede pausar la automatización y mensajes reconocidos de baja pueden revocar el registro y cancelar envíos pendientes. Debes supervisar las conversaciones y respetar todas las bajas, incluso las expresadas con otras palabras o canales.",
        ],
        links: [
          {
            label: "Política de Mensajería de WhatsApp Business",
            href: "https://business.whatsapp.com/policy",
            external: true,
          },
        ],
      },
      {
        id: "ai-output",
        title: "Resultados generados por IA",
        paragraphs: [
          "La IA puede producir resultados incorrectos, incompletos, sesgados o inapropiados. Debes revisarlos y aprobarlos antes de usarlos, publicarlos o enviarlos. No trates esos resultados como asesoramiento legal, financiero, médico o profesional.",
          "Eres responsable de que prompts y resultados no vulneren privacidad, confidencialidad, propiedad intelectual, publicidad u otros derechos. Otros usuarios pueden recibir resultados similares y no garantizamos exclusividad ni protección por propiedad intelectual.",
        ],
      },
      {
        id: "acceptable-use",
        title: "Uso aceptable",
        paragraphs: ["Solo puedes usar ScoreLead legalmente y de acuerdo con estos términos. No puedes:"],
        bullets: [
          "Enviar spam, acoso, mensajes engañosos, discriminación ilegal, amenazas, malware o contenido que explote o ponga a personas en peligro.",
          "Contactar sin consentimiento obligatorio u otra base legal válida, ocultar tu identidad, evadir bajas o eludir límites de envío y plan.",
          "Recopilar, inferir, cargar o usar datos sensibles de forma prohibida o dirigir generación de leads y marketing a menores.",
          "Vulnerar privacidad, imagen, confidencialidad, propiedad intelectual u otros derechos.",
          "Sondear, interrumpir, realizar ingeniería inversa, extraer, sobrecargar o acceder sin autorización al servicio, salvo cuando la ley prohíba restringirlo.",
          "Revender, sublicenciar o dar acceso a ScoreLead sin permiso expreso, o usar aspectos no públicos para crear un producto competidor.",
          "Usar el servicio para bienes ilegales, fraude o actividades prohibidas por un proveedor de plataforma aplicable.",
        ],
      },
      {
        id: "third-party-services",
        title: "Servicios de terceros",
        paragraphs: [
          "ScoreLead funciona con servicios de autenticación, pagos, búsqueda, mapas, enriquecimiento, IA, almacenamiento, correo, analíticas, Meta y WhatsApp. Su uso puede estar regido por términos y políticas propios. No somos responsables de los servicios de terceros, su disponibilidad o sus cambios.",
          "Nos autorizas a intercambiar datos con un servicio conectado para ejecutar tu solicitud. Revocar acceso o un cambio de API puede hacer que una función deje de operar.",
        ],
      },
      {
        id: "intellectual-property",
        title: "Propiedad intelectual de ScoreLead",
        paragraphs: [
          "ScoreLead, su software, diseño, documentación, marcas y demás materiales son nuestros o de nuestros licenciantes y están protegidos por ley. Sujeto a estos términos, te concedemos un derecho limitado, no exclusivo, intransferible y revocable para usar el servicio durante tu suscripción o cuenta autorizada.",
          "Si aportas comentarios, nos permites utilizarlos sin restricción ni compensación, sin identificarte públicamente sin autorización.",
        ],
      },
      {
        id: "confidentiality-and-security",
        title: "Confidencialidad y seguridad",
        paragraphs: [
          "Cada parte protegerá razonablemente la información confidencial no pública de la otra y la usará solo para la relación, excepto información pública sin incumplimiento, ya conocida legalmente, desarrollada independientemente o recibida legalmente de otra fuente. Pueden hacerse divulgaciones obligatorias con aviso cuando esté permitido.",
          "Debes mantener seguridad adecuada para tu cuenta, exportaciones, cuentas conectadas y datos de destinatarios y avisarnos rápidamente de una posible vulneración que afecte a ScoreLead.",
        ],
      },
      {
        id: "suspension-and-termination",
        title: "Suspensión y terminación",
        paragraphs: [
          "Puedes dejar de usar ScoreLead y cancelar planes pagados con los controles disponibles. Podemos limitar o suspender acceso para abordar riesgos de seguridad, actividad ilegal, impago, infracciones, daño a destinatarios o terceros, exigencias de una plataforma o incumplimiento material.",
          "Podemos terminar una cuenta por incumplimiento material o repetido y, cuando sea viable, daremos aviso y oportunidad de subsanar. Al terminar, cesa tu derecho de uso. Las cláusulas que por naturaleza deban sobrevivir —pagos, propiedad, exenciones, límites y disputas— seguirán vigentes.",
        ],
      },
      {
        id: "disclaimers",
        title: "Exclusiones de garantías",
        paragraphs: [
          "En la máxima medida permitida por ley, ScoreLead se ofrece “tal cual” y “según disponibilidad”. Excluimos garantías implícitas de comerciabilidad, idoneidad, no infracción y operación ininterrumpida o sin errores. No garantizamos exactitud, entregabilidad, cumplimiento normativo, respuesta de destinatarios, ingresos ni resultados comerciales concretos.",
          "Algunas jurisdicciones no permiten ciertas exclusiones. Nada en estos términos elimina derechos que legalmente no puedan excluirse.",
        ],
      },
      {
        id: "liability",
        title: "Limitación de responsabilidad",
        paragraphs: [
          "En la máxima medida permitida por ley, ninguna parte responderá por daños indirectos, incidentales, especiales, ejemplares, punitivos o consecuentes, ni por pérdida de beneficios, ingresos, reputación, oportunidad o datos derivados del servicio, aunque conociera esa posibilidad.",
          "En la máxima medida permitida por ley, la responsabilidad total de ScoreLead no excederá lo que pagaste por el servicio durante los 12 meses anteriores al hecho que originó la reclamación, o USD 100 si solo usaste un servicio gratuito. Los límites no se aplican cuando la responsabilidad no pueda limitarse legalmente.",
        ],
      },
      {
        id: "indemnity",
        title: "Indemnización",
        paragraphs: [
          "En la medida permitida por ley, defenderás e indemnizarás a ScoreLead y su personal frente a reclamaciones de terceros, pérdidas y costes razonables derivados de tus datos, contactos o mensajes, cuentas conectadas, infracción legal o de reglas de plataforma o incumplimiento material de estos términos. No exige indemnización por daño causado por conducta ilegal de ScoreLead.",
        ],
      },
      {
        id: "changes-and-law",
        title: "Cambios, ley aplicable y disputas",
        paragraphs: [
          "Podemos actualizar estos términos por cambios de producto, proveedor o ley. Publicaremos la nueva versión, actualizaremos la fecha y daremos aviso adicional de cambios importantes cuando sea obligatorio. El uso posterior constituye aceptación cuando la ley lo permite.",
          "Un pedido firmado puede definir ley y foro aplicables. En ausencia de ese documento, se determinarán por las normas obligatorias y el lugar del establecimiento principal de ScoreLead, sin limitar derechos irrenunciables de consumidores o protección de datos. Antes de una reclamación formal, contáctanos y permite una oportunidad razonable de solución amistosa.",
        ],
      },
      {
        id: "contact",
        title: "Contacto",
        paragraphs: [
          "Puedes enviar preguntas sobre estos términos a hello@scorelead.io. Los avisos deben identificar la cuenta u organización e incluir detalles suficientes para responder.",
        ],
      },
    ],
  },

  dataDeletion: {
    ...shared,
    eyebrow: "Legal · Controles de privacidad",
    title: "Instrucciones para eliminar datos",
    description:
      "Usa estas instrucciones para solicitar la eliminación de datos de tu cuenta ScoreLead o de información recibida mediante una cuenta de Meta o WhatsApp conectada.",
    sections: [
      {
        id: "request-deletion",
        title: "Solicita eliminar la cuenta o los datos conectados",
        paragraphs: [
          "ScoreLead todavía no ofrece un botón de autoservicio para eliminar la cuenta. Para solicitarlo, sigue estos pasos. No cobramos por presentar una solicitud.",
        ],
        steps: [
          "Envía un correo a hello@scorelead.io desde la dirección asociada a tu cuenta ScoreLead.",
          "Usa el asunto “Solicitud de eliminación de datos”.",
          "Incluye el correo de la cuenta, el nombre de la empresa o espacio de trabajo y si quieres eliminar toda la cuenta ScoreLead o solo los datos asociados a una cuenta de Facebook, Meta o WhatsApp conectada.",
          "No envíes contraseñas, tokens, números de tarjeta ni documentos sensibles salvo que solicitemos un método seguro de verificación.",
        ],
        note:
          "Si autorizaste ScoreLead mediante Facebook u otro flujo de Meta, incluye cuando sea posible el correo o identificador que usaste. Solo lo usaremos para localizar y verificar la conexión relevante.",
      },
      {
        id: "disconnect-whatsapp",
        title: "Desconecta WhatsApp inmediatamente",
        paragraphs: [
          "El titular de la cuenta puede desconectar WhatsApp desde la configuración de integración de ScoreLead. La desconexión marca la conexión como inactiva, cancela pasos automáticos pendientes, intenta retirar la suscripción de la cuenta de WhatsApp Business cuando sea compatible y destruye el token almacenado. No elimina de Meta la cuenta de WhatsApp Business del cliente.",
          "Para eliminar todos los datos de la cuenta ScoreLead, envía también la solicitud anterior. Cuando esté disponible, puedes retirar por separado el acceso de ScoreLead desde la configuración empresarial de Meta.",
        ],
      },
      {
        id: "verification",
        title: "Cómo verificamos y procesamos una solicitud",
        paragraphs: [
          "Confirmaremos la recepción y podremos pedir datos limitados para verificar tu identidad, autoridad sobre la cuenta empresarial y alcance de la eliminación. Una solicitud en nombre de otra persona puede requerir prueba de representación.",
          "Tras la verificación, eliminaremos o desidentificaremos los datos incluidos dentro del plazo exigido por la ley aplicable y comunicaremos la finalización o una excepción legal. Si conservamos los datos solo para un cliente, podremos remitirle la solicitud y ayudarlo cuando corresponda.",
        ],
      },
      {
        id: "what-is-deleted",
        title: "Qué abarca la eliminación",
        bullets: [
          "Perfil de cuenta, vínculos de autenticación, sesiones activas y registros del espacio de trabajo incluidos en la solicitud.",
          "Perfiles empresariales, búsquedas guardadas, leads, enriquecimiento, borradores, planes de contenido e imágenes almacenadas controlados por la cuenta.",
          "Identificadores y tokens cifrados de WhatsApp, plantillas en caché, secuencias pendientes, estados de mensajes y respuestas entrantes incluidos.",
          "Registros de contacto, soporte y preferencias que ya no se necesiten para otra finalidad legítima.",
        ],
      },
      {
        id: "what-may-remain",
        title: "Información que puede permanecer",
        paragraphs: [
          "Podemos conservar información limitada por impuestos, contabilidad, prevención de fraude, seguridad, resolución de disputas, reclamaciones legales o cumplimiento. Registros de consentimiento, revocación, supresión, transacciones y auditoría pueden mantenerse para demostrar cumplimiento o evitar un nuevo contacto.",
          "Copias residuales cifradas pueden permanecer en respaldos protegidos hasta que expiren por el ciclo habitual. Los datos conservados por excepción se separan del uso ordinario y se eliminan cuando termina el motivo.",
        ],
      },
      {
        id: "third-parties",
        title: "Meta y otros terceros",
        paragraphs: [
          "Eliminar datos de ScoreLead no elimina automáticamente información mantenida independientemente por Meta, WhatsApp, Google, Stripe u otro tercero. Usa los controles o procesos de privacidad de cada proveedor para los datos que controla. Trasladaremos o ejecutaremos instrucciones de eliminación a nuestros encargados cuando sea obligatorio y técnicamente posible.",
        ],
        links: [
          {
            label: "Centro de cuentas de Meta",
            href: "https://accountscenter.facebook.com/personal_info/account_ownership_and_control/",
            external: true,
          },
          { label: "Política de Privacidad de ScoreLead", href: "/privacy" },
        ],
      },
      {
        id: "lead-data-requests",
        title: "Si apareces en los datos de leads de un cliente",
        paragraphs: [
          "Normalmente el cliente de ScoreLead controla los datos de leads y destinatarios en su espacio de trabajo. Contacta primero a la empresa que te envió un mensaje o recopiló tus datos. También puedes escribirnos con el nombre de la empresa, teléfono o correo implicado y contexto suficiente para localizar el registro. No revelaremos información confidencial de otro cliente, pero podremos remitir la solicitud o ayudarlo cuando corresponda.",
        ],
      },
    ],
  },
}
