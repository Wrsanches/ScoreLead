import type { MarketingPageTranslation } from "./types"

export const marketingContentEs: Record<string, MarketingPageTranslation> = {
  "feature-ai-lead-discovery": {
    eyebrow: "Función · Descubrimiento de cuentas",
    title: "Descubrimiento de Leads con IA por Mercado",
    description:
      "Encuentra empresas B2B por mercado, región, servicio y perfil de cuenta, conservando la evidencia que explica por qué cada empresa pertenece al pipeline.",
    answer:
      "El descubrimiento con IA convierte una hipótesis específica de cliente ideal en una búsqueda repetible. ScoreLead combina señales públicas de la web y mapas, normaliza resultados y entrega registros revisables en lugar de una lista sin explicación.",
    highlights: [
      "Busca por región, palabra clave, servicio y criterios de cuenta.",
      "Conserva las fuentes y elimina empresas duplicadas.",
      "Lleva descubrimientos calificados a enriquecimiento y puntuación.",
    ],
    sections: [
      {
        heading: "Empieza con una definición comprobable",
        paragraphs: [
          "Un buen trabajo de descubrimiento define segmento, geografía, señales observables y descalificadores. ScoreLead usa esas restricciones sin tratar cada empresa como igualmente relevante.",
        ],
        points: ["Define el mercado", "Elige la región", "Registra señales positivas y negativas"],
      },
      {
        heading: "Revisa evidencia, no solo nombres",
        paragraphs: [
          "Sitio, ubicación, servicios, reputación y canales de contacto facilitan aceptar, rechazar o investigar una cuenta antes del outreach.",
        ],
      },
      {
        heading: "Usa los resultados en la siguiente búsqueda",
        paragraphs: [
          "Cuentas aceptadas, rechazos, respuestas y oportunidades muestran si la hipótesis inicial era útil y hacen más precisa la siguiente búsqueda.",
        ],
      },
    ],
    proofLabel: "Qué hace la función — y qué no hace",
    proof:
      "ScoreLead reduce investigación repetitiva y organiza evidencia pública. No garantiza que una empresa esté lista para comprar; tu equipo controla la definición, revisión y decisión de contacto.",
    ctaTitle: "Ejecuta tu primera búsqueda enfocada.",
    ctaDescription: "Convierte una hipótesis de mercado en una lista revisable.",
    ctaLabel: "Descubrir leads",
  },
  "feature-lead-scoring": {
    eyebrow: "Función · Priorización",
    title: "Software de Lead Scoring B2B con IA",
    description:
      "Prioriza cuentas con software de lead scoring B2B con IA que mantiene ajuste, alcance, confianza, interacción, preparación y evidencia visibles.",
    answer:
      "ScoreLead es software de lead scoring B2B para equipos que necesitan priorizar cuentas con explicaciones. Convierte señales observables en una cola consistente y mantiene cada dimensión abierta a revisión y mejora.",
    highlights: [
      "Separa el ajuste de la empresa del momento y la preparación.",
      "Muestra evidencia por dimensión, no un número opaco.",
      "Usa niveles claros para revisar, enriquecer o contactar.",
    ],
    sections: [
      {
        heading: "Aplica el lead scoring a tu ICP real",
        paragraphs: [
          "Empieza por las condiciones de empresa vinculadas al valor y separa requisitos obligatorios de señales de ordenación. ScoreLead evalúa dimensiones que puede observar y explicar.",
        ],
        points: ["Ajuste de empresa", "Alcance", "Confianza", "Potencial de interacción", "Preparación"],
      },
      {
        heading: "Mantén cada puntuación de IA explicable",
        paragraphs: [
          "Cada cuenta mantiene evidencia por dimensión junto al total. Los datos ausentes no se vuelven negativos y los valores desconocidos se distinguen de las señales débiles.",
        ],
        points: ["Dimensiones visibles", "Fuentes", "Valores desconocidos", "Revisión humana"],
      },
      {
        heading: "Calibra el scoring con resultados comerciales",
        paragraphs: [
          "Compara puntuaciones con cuentas aceptadas, respuestas, oportunidades, clientes y motivos de rechazo. Los errores muestran cuándo deben cambiar el modelo, el ICP o los datos.",
        ],
      },
    ],
    proofLabel: "Uso responsable",
    proof:
      "Una puntuación apoya la priorización humana. No debe presentarse como intención de compra, usar atributos sensibles ocultos ni reemplazar la revisión de una persona.",
    ctaTitle: "Haz más clara la próxima cuenta.",
    ctaDescription: "Crea una cola de revisión con el razonamiento adjunto.",
    ctaLabel: "Probar lead scoring",
  },
  "feature-lead-enrichment": {
    eyebrow: "Función · Inteligencia de cuentas",
    title: "Software de Enriquecimiento de Leads B2B",
    description:
      "Convierte nombre y dominio en enriquecimiento de leads B2B con fuentes para calificación, routing, personalización, investigación y exportación al CRM.",
    answer:
      "ScoreLead es software de enriquecimiento de leads B2B creado para reducir incertidumbre, no maximizar campos. Organiza identidad, ajuste, problema, contacto y personalización con contexto verificable.",
    highlights: [
      "Recopila contexto público de empresa, servicios, ubicación y contacto.",
      "Normaliza sin borrar la evidencia original.",
      "Marca valores ausentes o inferidos en lugar de presentar suposiciones.",
    ],
    sections: [
      {
        heading: "Enriquece leads para una decisión concreta",
        paragraphs: [
          "Cada campo debe apoyar ajuste, una hipótesis de problema, el plan de contacto o un mejor mensaje. Los datos sin uso crean mantenimiento.",
        ],
      },
      {
        heading: "Conserva fuentes, fechas e incertidumbre",
        paragraphs: [
          "Los datos web cambian. URLs de origen, fechas y confianza ayudan a verificar detalles antes del outreach.",
        ],
        points: ["Identidad", "Ajuste", "Evidencia del problema", "Contacto", "Personalización"],
      },
      {
        heading: "Exporta registros más limpios al CRM",
        paragraphs: [
          "Formatos consistentes y detección de duplicados facilitan filtrar y mover cuentas al CRM sin perder el contexto.",
        ],
      },
    ],
    proofLabel: "Estándar de calidad",
    proof:
      "ScoreLead usa fuentes públicas y proveedores configurados. La cobertura varía por empresa y región; los detalles importantes deben verificarse.",
    ctaTitle: "Da contexto útil a cada cuenta.",
    ctaDescription: "Enriquece empresas antes de invertir tiempo en outreach.",
    ctaLabel: "Enriquecer leads",
  },
  "feature-outreach-automation": {
    eyebrow: "Función · Outreach comercial",
    title: "Automatización de Outreach B2B con Contexto",
    description:
      "Crea secuencias de outreach B2B a partir de evidencia verificada, con personalización y revisión humana antes del uso o la programación.",
    answer:
      "ScoreLead convierte contexto revisado en un punto de partida. Puede usar detalles relevantes y adaptar el idioma, pero el remitente sigue siendo responsable de exactitud, consentimiento y reglas del canal.",
    highlights: [
      "Redacta introducciones, seguimientos y mensajes de valor.",
      "Usa evidencia revisada en lugar de campos genéricos.",
      "Genera outreach en inglés, portugués y español.",
    ],
    sections: [
      {
        heading: "Personaliza por relevancia",
        paragraphs: [
          "La buena personalización conecta una observación verificable con el problema que resuelve tu producto. Evita elogios vacíos y familiaridad inventada.",
        ],
      },
      {
        heading: "Mantén aprobación humana",
        paragraphs: [
          "Revisa nombres, afirmaciones, tono, momento y llamada a la acción. Las cuentas de mayor valor merecen edición más profunda.",
        ],
        points: ["Verifica la evidencia", "Revisa la hipótesis", "Comprueba la acción", "Respeta las reglas locales"],
      },
      {
        heading: "Mide conversaciones, no volumen",
        paragraphs: [
          "Sigue respuestas positivas, reuniones calificadas, objeciones y bajas para saber si targeting y posicionamiento mejoran.",
        ],
      },
    ],
    proofLabel: "Responsabilidad del remitente",
    proof:
      "ScoreLead crea borradores; no crea permiso de contacto. Los usuarios deben cumplir las reglas aplicables de privacidad, comunicaciones, plataformas y opt-out.",
    ctaTitle: "Prepara mejor outreach en menos tiempo.",
    ctaDescription: "Empieza por el contexto y mantén a tu equipo en control.",
    ctaLabel: "Crear outreach",
  },
  "feature-sales-pipeline": {
    eyebrow: "Función · Flujo de trabajo",
    title: "Un pipeline comercial conectado con la evidencia",
    description:
      "Sigue empresas desde el descubrimiento hasta la conversión sin perder el contexto usado para enriquecerlas y calificarlas.",
    answer:
      "ScoreLead conecta cada etapa con el trabajo anterior. El equipo ve qué se encontró, por qué se priorizó, qué outreach se preparó y qué ocurrió después.",
    highlights: [
      "Sigue cuentas desde descubrimiento hasta cliente.",
      "Revisa trabajos, puntuaciones, mensajes y estado juntos.",
      "Usa rechazos y conversiones para mejorar nuevas búsquedas.",
    ],
    sections: [
      {
        heading: "Define etapas operativas",
        paragraphs: [
          "Cada etapa debe representar trabajo terminado y una próxima acción. Descubrimiento, enriquecimiento, scoring, outreach y conversión ayudan cuando se aplican de forma consistente.",
        ],
      },
      {
        heading: "Mantén visible la calidad",
        paragraphs: [
          "Duplicados, fuentes y razonamiento permanecen unidos al registro para que el avance no oculte datos débiles.",
        ],
        points: ["Trabajos de descubrimiento", "Enriquecimiento", "Revisión", "Estado de outreach", "Feedback"],
      },
      {
        heading: "Aprende del movimiento y rechazo",
        paragraphs: [
          "Tiempo por etapa, aceptación, rechazos y conversión muestran dónde necesitan atención el targeting o el proceso.",
        ],
      },
    ],
    proofLabel: "Principio de medición",
    proof:
      "Actividad de pipeline no equivale a ingresos. ScoreLead hace observable el flujo; los resultados dependen de oferta, ajuste, ejecución y momento.",
    ctaTitle: "Conecta investigación con acción.",
    ctaDescription: "Mantén descubrimiento, calificación y outreach en un mismo flujo.",
    ctaLabel: "Construir tu pipeline",
  },
  "use-case-agencies": {
    eyebrow: "Caso de uso · Agencias",
    title: "Generación de Leads B2B para Agencias",
    description:
      "Crea búsquedas por cliente o servicio, estandariza la calificación y prepara outreach relevante sin mezclar hipótesis.",
    answer:
      "Las agencias pueden separar espacios, definir un ICP por campaña y crear flujos revisables. Esto hace que el método sea más fácil de explicar y repetir.",
    highlights: [
      "Separa objetivos, evidencia y outreach de cada cliente.",
      "Reutiliza el proceso sin reutilizar mensajes genéricos.",
      "Exporta registros calificados para entrega o CRM.",
    ],
    sections: [
      {
        heading: "Convierte el briefing en criterios observables",
        paragraphs: [
          "Traduce el posicionamiento de cada cliente en señales obligatorias, preferencias y descalificadores antes de descubrir cuentas.",
        ],
      },
      {
        heading: "Muestra el trabajo detrás de la lista",
        paragraphs: [
          "Fuentes, dimensiones y rechazos hacen la entrega más defendible que una hoja de nombres sin explicación.",
        ],
        points: ["ICP por cliente", "Cuentas con evidencia", "Cola de revisión", "Outreach localizado"],
      },
      {
        heading: "Informa sobre calidad",
        paragraphs: [
          "Sigue cuentas aceptadas, conversaciones y feedback por segmento para revisar la próxima búsqueda.",
        ],
      },
    ],
    proofLabel: "Mejor encaje",
    proof:
      "ScoreLead es más útil para agencias responsables del targeting y la calificación. No sustituye aprobación del cliente, cumplimiento ni una oferta diferenciada.",
    ctaTitle: "Ejecuta prospección enfocada para cada cliente.",
    ctaDescription: "Da a cada campaña su lógica y evidencia.",
    ctaLabel: "Crear flujo de agencia",
  },
  "use-case-b2b-sales-teams": {
    eyebrow: "Caso de uso · Equipos de ventas",
    title: "Prospección Compartida para Ventas B2B",
    description:
      "Alinea descubrimiento, calificación, scoring y outreach alrededor de una definición visible de buen prospecto.",
    answer:
      "ScoreLead ofrece un flujo común para decidir qué empresas merecen atención. Los representantes ven evidencia, entienden la puntuación y registran resultados que mejoran el targeting.",
    highlights: [
      "Estandariza la investigación sin eliminar el juicio.",
      "Prioriza cuentas con dimensiones explicables.",
      "Conecta respuestas y rechazos con el targeting.",
    ],
    sections: [
      {
        heading: "Haz utilizable el ICP",
        paragraphs: [
          "Convierte documentos de estrategia en filtros, criterios y descalificadores aplicables al trabajo semanal.",
        ],
      },
      {
        heading: "Crea una cola consistente",
        paragraphs: [
          "Usa scoring para ordenar y deja que cada representante verifique la evidencia y elija la siguiente acción.",
        ],
        points: ["Definición de cuenta", "Revisión", "Niveles de prioridad", "Feedback"],
      },
      {
        heading: "Entrena con ejemplos reales",
        paragraphs: [
          "Cuentas aceptadas y rechazadas ayudan a calibrar el entendimiento de ajuste, preparación y relevancia.",
        ],
      },
    ],
    proofLabel: "Principio de adopción",
    proof:
      "Un flujo gana confianza cuando el equipo puede inspeccionarlo y corregirlo. ScoreLead mantiene visible el razonamiento.",
    ctaTitle: "Da al equipo una definición compartida.",
    ctaDescription: "Convierte criterios en trabajo comercial repetible.",
    ctaLabel: "Configurar el equipo",
  },
  "use-case-b2b-startups": {
    eyebrow: "Caso de uso · Startups",
    title: "Generación de Leads para Startups B2B",
    description:
      "Prueba hipótesis B2B estrechas, encuentra empresas compatibles y conserva evidencia para aprender de las primeras conversaciones.",
    answer:
      "Los equipos iniciales necesitan velocidad de aprendizaje, no solo volumen. ScoreLead ayuda a definir segmentos comprobables y comparar respuestas reales con las hipótesis.",
    highlights: [
      "Prueba un segmento y una hipótesis a la vez.",
      "Concentra atención en cuentas con más evidencia.",
      "Registra aceptación, objeciones y conversiones.",
    ],
    sections: [
      {
        heading: "Empieza lo bastante estrecho para aprender",
        paragraphs: [
          "Un mercado limitado produce feedback interpretable. Define quién tiene el problema y qué señales hacen plausible la hipótesis.",
        ],
      },
      {
        heading: "Automatiza la repetición",
        paragraphs: [
          "Usa automatización para encontrar y organizar; reserva el tiempo del founder para verificar, posicionar y conversar.",
        ],
        points: ["Hipótesis", "Evidencia", "Revisión del founder", "Iteración semanal"],
      },
      {
        heading: "Cambia una hipótesis cada vez",
        paragraphs: [
          "Compara respuestas, reuniones y objeciones por segmento para saber si el objetivo, la oferta o el mensaje deben cambiar.",
        ],
      },
    ],
    proofLabel: "Realidad inicial",
    proof:
      "Ninguna herramienta crea product-market fit. ScoreLead ayuda a ejecutar una búsqueda disciplinada y conservar evidencia.",
    ctaTitle: "Convierte tu próxima hipótesis en una prueba.",
    ctaDescription: "Encuentra un conjunto enfocado y aprende de la respuesta.",
    ctaLabel: "Probar un mercado",
  },
  "use-case-b2b-companies": {
    eyebrow: "Caso de uso · Empresas B2B",
    title: "Descubrimiento de Cuentas B2B entre Equipos",
    description:
      "Expande la prospección B2B a nuevos segmentos o regiones conservando criterios compartidos, fuentes verificables y mensajes locales.",
    answer:
      "Las empresas B2B pueden hacer consistente la investigación sin borrar diferencias locales. Los criterios compartidos dan gobernanza; búsquedas y outreach localizados conservan contexto.",
    highlights: [
      "Aplica estándares de calificación entre regiones.",
      "Mantén evidencia local e idioma visibles.",
      "Exporta registros normalizados y sin duplicados.",
    ],
    sections: [
      {
        heading: "Separa reglas globales de señales locales",
        paragraphs: [
          "Mantén requisitos obligatorios y permite que geografía, idioma, servicios y madurez den forma al descubrimiento local.",
        ],
      },
      {
        heading: "Revisa antes de entrar al CRM",
        paragraphs: [
          "Normaliza identidad, conserva fuentes y resuelve duplicados antes de crear otro proyecto de limpieza.",
        ],
        points: ["ICP compartido", "Búsquedas regionales", "Revisión de calidad", "Exportación al CRM"],
      },
      {
        heading: "Compara calidad por segmento",
        paragraphs: [
          "Mide aceptación, avance y conversión por región para invertir donde producto y mensaje tienen evidencia más fuerte.",
        ],
      },
    ],
    proofLabel: "Principio de gobernanza",
    proof:
      "Estandarizar debe mejorar la explicación, no eliminar el juicio local. ScoreLead conserva el contexto.",
    ctaTitle: "Escala la investigación sin perder contexto.",
    ctaDescription: "Crea flujos consistentes para cada mercado.",
    ctaLabel: "Planear flujo regional",
  },
  "compare-manual-lead-research": {
    eyebrow: "Comparación · Flujo",
    title: "Investigación manual vs. flujo asistido por IA",
    description:
      "Compara control, velocidad, calidad de evidencia y mantenimiento entre investigación manual y descubrimiento asistido.",
    answer:
      "La investigación manual ofrece control, pero se vuelve cara e inconsistente a escala. La IA acelera búsquedas repetitivas, pero requiere un objetivo preciso, revisión de fuentes y juicio humano.",
    highlights: [
      "El trabajo manual es flexible pero difícil de estandarizar.",
      "La automatización mejora velocidad y repetibilidad.",
      "El mejor proceso combina automatización y revisión responsable.",
    ],
    sections: [
      {
        heading: "Dónde gana la investigación manual",
        paragraphs: [
          "Una persona experta interpreta mercados extraños y señales sutiles. Esa profundidad es valiosa para cuentas estratégicas.",
        ],
      },
      {
        heading: "Dónde aporta la automatización",
        paragraphs: [
          "Búsqueda, extracción, normalización, duplicados y primera puntuación son repetitivos y se benefician de un sistema consistente.",
        ],
        points: ["Velocidad", "Repetibilidad", "Evidencia", "Excepciones humanas"],
      },
      {
        heading: "Adopta un modelo híbrido",
        paragraphs: [
          "Automatiza recopilación y triage y concentra investigación manual en cuentas prioritarias o inciertas.",
        ],
      },
    ],
    proofLabel: "Comparación justa",
    proof:
      "ScoreLead puede reducir trabajo repetitivo, pero el valor depende de complejidad, datos, revisión y coste actual.",
    ctaTitle: "Lleva la investigación repetitiva a un sistema revisable.",
    ctaDescription: "Mantén el juicio humano donde aporta más valor.",
    ctaLabel: "Comparar con tu flujo",
  },
  "compare-spreadsheets": {
    eyebrow: "Comparación · Operaciones",
    title: "ScoreLead vs. Hojas de Cálculo B2B",
    description:
      "Entiende cuándo una hoja de cálculo basta y cuándo el descubrimiento, las fuentes, el scoring y el workflow de prospección B2B necesitan un sistema.",
    answer:
      "Las hojas son flexibles para listas pequeñas. Se vuelven frágiles con descubrimiento repetible, historial, puntuación consistente, duplicados y responsabilidad compartida.",
    highlights: [
      "Siguen siendo útiles para análisis y exportación.",
      "Un flujo conectado reduce copias y fórmulas divergentes.",
      "Fuentes y puntuación acompañan cada cuenta.",
    ],
    sections: [
      {
        heading: "Usa una hoja para trabajo simple",
        paragraphs: [
          "Una lista corta, temporal y de una persona puede no necesitar sistema. Columnas claras y fecha de revisión pueden bastar.",
        ],
      },
      {
        heading: "Observa fallos operativos",
        paragraphs: [
          "Versiones conflictivas, celdas sin explicación, fórmulas copiadas, duplicados y estados viejos muestran que la lista ya es un workflow.",
        ],
        points: ["Versiones", "Procedencia", "Scoring consistente", "Responsable y siguiente acción"],
      },
      {
        heading: "Mantén la exportación",
        paragraphs: [
          "ScoreLead exporta CSV, pero gestiona descubrimiento, enriquecimiento, scoring y estado antes de que los datos salgan.",
        ],
      },
    ],
    proofLabel: "Principio de migración",
    proof:
      "No sustituyas una hoja solo porque existe software. Migra cuando errores y mantenimiento superen el valor de su flexibilidad.",
    ctaTitle: "Descubre si tu hoja ya se convirtió en sistema.",
    ctaDescription: "Usa workflow para consistencia y exporta cuando ayude.",
    ctaLabel: "Probar flujo conectado",
  },
  "compare-purchased-lead-lists": {
    eyebrow: "Comparación · Estrategia de datos",
    title: "Descubrimiento vs. Listas Compradas",
    description:
      "Compara listas estáticas con descubrimiento B2B basado en criterios, fuentes verificables, evidencia pública reciente y calificación de cuentas.",
    answer:
      "Las listas compradas ofrecen cobertura rápida, pero su origen, edad, permisos y ajuste pueden ser inciertos. El descubrimiento actual empieza con tu objetivo y recopila evidencia pública reciente.",
    highlights: [
      "Las listas pueden envejecer antes de llegar a ventas.",
      "El descubrimiento mantiene criterios y evidencia visibles.",
      "Ningún método elimina obligaciones de privacidad.",
    ],
    sections: [
      {
        heading: "Evalúa más que la cantidad",
        paragraphs: [
          "Pregunta cómo se recopilaron los datos, cuándo se verificaron, qué campos son inferidos y si el uso está permitido.",
        ],
      },
      {
        heading: "Empieza por la hipótesis de cuenta",
        paragraphs: [
          "El descubrimiento actual parte de las empresas que puedes ayudar y usa señales observables para decidir cuáles revisar.",
        ],
        points: ["Objetivo", "Fecha de observación", "Fuente", "Revisión legal"],
      },
      {
        heading: "Mide cuentas utilizables",
        paragraphs: [
          "Compara cuentas aceptadas, alcanzables y bien segmentadas, no solo coste por fila.",
        ],
      },
    ],
    proofLabel: "Nota de cumplimiento",
    proof:
      "La disponibilidad pública no autoriza cualquier uso. Revisa privacidad, marketing directo, supresión y reglas de plataforma.",
    ctaTitle: "Construye la lista desde tu mercado.",
    ctaDescription: "Descubre empresas con criterios y fuentes adjuntos.",
    ctaLabel: "Iniciar descubrimiento",
  },
  "compare-best-lead-scoring-software": {
    eyebrow: "Comparación · Lead scoring",
    title: "Mejores Software de Lead Scoring B2B",
    description:
      "Compara software de lead scoring B2B por explicabilidad, datos, integración, calibración, ajuste al workflow y decisiones comerciales compatibles.",
    answer:
      "El mejor software de lead scoring es el que encaja con tu proceso de compra y hace útil la priorización para ventas. El scoring nativo de CRM aprovecha actividad histórica; las plataformas de intención destacan señales de compra; ScoreLead organiza descubrimiento, enriquecimiento y scoring explicable antes del outreach.",
    highlights: [
      "Elige la categoría de scoring compatible con tus datos.",
      "Exige señales visibles, tratamiento de ausencias y controles de calibración.",
      "Prueba con cuentas aceptadas y resultados reales del pipeline antes de escalar.",
    ],
    sections: [
      {
        heading: "Define qué decisión debe apoyar la puntuación",
        paragraphs: [
          "Aclara si debe enrutar leads inbound, priorizar cuentas objetivo, detectar intención u ordenar un mercado recién descubierto. Un producto puede ser fuerte en una tarea y débil en otra.",
        ],
        points: ["Routing inbound", "Priorización de cuentas", "Señales de intención", "Descubrimiento de mercado"],
      },
      {
        heading: "Compara evidencia y explicabilidad",
        paragraphs: [
          "Pregunta qué señales forman la puntuación, cómo se comportan los valores ausentes, si ventas puede revisar la evidencia y cómo se registran los ajustes. Un número preciso no ayuda cuando el equipo no puede explicarlo.",
        ],
      },
      {
        heading: "Evalúa el workflow y las integraciones",
        paragraphs: [
          "Revisa dónde ocurre el scoring, qué datos deben existir, cómo llegan las cuentas al CRM y si el producto cubre regiones e idiomas relevantes. Incluye implementación y mantenimiento.",
        ],
        points: ["Datos necesarios", "Handoff al CRM", "Cobertura regional", "Revisión humana"],
      },
      {
        heading: "Ejecuta un piloto medible",
        paragraphs: [
          "Prueba un segmento controlado y compara aceptación, tiempo de investigación, falsos positivos, oportunidades y motivos de rechazo. No elijas solo por cantidad de funciones.",
        ],
      },
    ],
    proofLabel: "Metodología de comparación",
    proof:
      "ScoreLead forma parte de la comparación y tiene interés comercial. El marco evita rankings no verificables y compara ajuste, evidencia, implementación y resultados medibles de un piloto.",
    ctaTitle: "Prueba scoring explicable en un segmento enfocado.",
    ctaDescription: "Conserva la evidencia detrás de cada puntuación y compara con tu proceso actual.",
    ctaLabel: "Probar scoring en ScoreLead",
  },
  "compare-b2b-lead-enrichment-tools": {
    eyebrow: "Comparación · Enriquecimiento",
    title: "Herramientas de Enriquecimiento de Leads B2B",
    description:
      "Evalúa herramientas de enriquecimiento de leads B2B por cobertura, fuentes, actualidad, precisión, workflow, cumplimiento y coste por registro utilizable.",
    answer:
      "La mejor herramienta de enriquecimiento de leads B2B devuelve datos listos para decidir en tu mercado y suficiente contexto para verificar campos importantes. Las bases priorizan cobertura estructurada; la automatización de investigación ofrece recopilación flexible; ScoreLead combina descubrimiento público, evidencia, scoring y revisión.",
    highlights: [
      "Mide registros utilizables y verificados, no cantidad de campos.",
      "Prueba cobertura por mercado, tamaño y segmento.",
      "Mantén visibles fuentes, fechas, valores desconocidos y revisión de cumplimiento.",
    ],
    sections: [
      {
        heading: "Empieza por la decisión y los campos necesarios",
        paragraphs: [
          "Enumera los campos mínimos de identidad, ajuste, contacto y personalización en cada etapa. Comprar más datos no mejora el resultado cuando la mayoría nunca se utiliza.",
        ],
        points: ["Identidad", "Ajuste de empresa", "Contacto", "Evidencia de personalización"],
      },
      {
        heading: "Prueba cobertura y precisión en tu mercado",
        paragraphs: [
          "Usa una muestra representativa de países, tamaños y segmentos. Verifica valores importantes en fuentes primarias y registra por separado datos ausentes, antiguos, inferidos e incorrectos.",
        ],
      },
      {
        heading: "Compara procedencia y mantenimiento",
        paragraphs: [
          "Comprueba si la herramienta muestra fuentes y fechas, admite correcciones, evita duplicados y actualiza campos volátiles. Esos controles determinan cuánto trabajo manual queda.",
        ],
        points: ["URLs de origen", "Fechas de observación", "Confianza", "Política de actualización"],
      },
      {
        heading: "Calcula el coste por cuenta utilizable",
        paragraphs: [
          "Incluye suscripción, créditos, consultas fallidas, verificación, limpieza de duplicados, integración y la proporción de registros que ventas realmente acepta.",
        ],
      },
    ],
    proofLabel: "Evaluación justa",
    proof:
      "ScoreLead es una de las herramientas evaluadas. Esta guía no afirma superioridad universal; cobertura, precisión y valor varían según mercado, fuente, workflow y uso.",
    ctaTitle: "Evalúa el enriquecimiento con tu propia muestra.",
    ctaDescription: "Descubre, enriquece, puntúa y revisa empresas conservando el contexto de las fuentes.",
    ctaLabel: "Probar enriquecimiento B2B",
  },
  "case-study-ceramik": {
    eyebrow: "Historia de cliente · Ceramik",
    title: "Ceramik: Caso de Prospección B2B",
    description:
      "Un relato transparente de cómo Ceramik usó ScoreLead para descubrir estudios de cerámica, reducir investigación manual y ampliar su pipeline en 30 días.",
    answer:
      "En una comparación reportada por el cliente con su flujo manual anterior, Ceramik atribuye 2.450 leads de empresas descubiertos, un crecimiento de 10× en el pipeline y 85% menos tiempo de investigación a sus primeros 30 días con ScoreLead. Son datos direccionales del cliente, no mediciones auditadas.",
    highlights: [
      "Reporte del cliente: 2.450 leads de empresas descubiertos en los primeros 30 días.",
      "Reporte del cliente: crecimiento relativo de 10× en el pipeline durante el mismo periodo.",
      "Estimación del cliente: 85% menos tiempo dedicado a investigación manual.",
    ],
    sections: [
      {
        heading: "El problema inicial",
        paragraphs: [
          "Ceramik sirve a profesores y operadores de estudios. Encontrarlos requería búsquedas locales, revisión de sitios y organización manual.",
        ],
      },
      {
        heading: "El flujo con ScoreLead",
        paragraphs: [
          "El equipo definió el mercado, ejecutó descubrimiento geográfico, revisó evidencia y usó el contexto para decidir qué empresas entraban al pipeline.",
        ],
        points: ["Definición", "Descubrimiento", "Revisión", "Priorización"],
      },
      {
        heading: "Ventana de medición y definiciones",
        paragraphs: [
          "La comparación publicada cubre los primeros 30 días de uso de ScoreLead frente al proceso manual anterior de Ceramik. Leads descubiertos significa registros de empresas encontrados por el flujo; no significa contactos, oportunidades o clientes verificados de forma independiente.",
          "El crecimiento de 10× y la reducción de 85% son estimaciones direccionales de Ceramik. No se proporcionaron los conteos iniciales y finales del pipeline, tasas de aceptación, conversiones ni registros de horas para una revisión independiente, por lo que no se presentan como benchmarks auditados.",
        ],
        points: [
          "Ventana: primeros 30 días",
          "Baseline: flujo manual anterior",
          "Fuente: reporte del cliente",
          "Auditoría independiente: no realizada",
        ],
      },
      {
        heading: "Cómo interpretar el resultado",
        paragraphs: [
          "Usa las cifras como el relato direccional de un cliente sobre un flujo inicial. Los resultados dependen del mercado, criterios de aceptación, evidencia disponible, revisión y ejecución del outreach; no son un experimento controlado ni una garantía.",
        ],
      },
    ],
    proofLabel: "Metodología y divulgación",
    proof:
      "ScoreLead publica estas cifras como evidencia reportada por el cliente, con ventana, baseline, definiciones y límites visibles. Cualquier revisión futura debe conservar la fuente y el historial de actualización.",
    ctaTitle: "Crea un flujo para tu propio mercado.",
    ctaDescription: "Define el objetivo, conserva evidencia y mide cuentas aceptadas.",
    ctaLabel: "Iniciar tu flujo",
  },
  "company-pricing": {
    eyebrow: "Precios",
    title: "Precios de ScoreLead: Empieza Gratis",
    description:
      "Usa el flujo principal con Free, prueba Starter por US$2,95 y sube de plan a medida que crece el volumen de descubrimiento, outreach y automatización.",
    answer:
      "Free cuesta US$0 e incluye un negocio y un descubrimiento de hasta 10 leads, puntuados y enriquecidos. Starter cuesta US$2,95 los primeros 7 días y US$19,95 al mes después, Growth cuesta US$29,95 al mes y Pro cuesta US$59,95 al mes. Los cupos de los planes pagos se renuevan cada mes.",
    highlights: [
      "Free: US$0 al mes, sin tarjeta",
      "Starter: US$2,95 por 7 días, luego US$19,95 al mes",
      "Growth: US$29,95 al mes · Pro: US$59,95 al mes",
    ],
    sections: [
      {
        heading: "Plan Free",
        paragraphs: [
          "Usa un workspace y ejecuta un trabajo inicial para evaluar el flujo completo: puntuación, enriquecimiento web y textos de outreach con IA. Los límites de Free son totales únicos, no cupos mensuales.",
        ],
      },
      {
        heading: "Plan Starter",
        paragraphs: [
          "Starter empieza en US$2,95 por siete días y pasa a US$19,95 al mes si no se cancela. Cubre un negocio con 10 descubrimientos al mes de hasta 25 leads cada uno, 50 mensajes de outreach con IA y exportación CSV de todos los leads enriquecidos.",
        ],
        points: ["10 descubrimientos al mes", "Hasta 25 leads por descubrimiento", "50 mensajes de outreach", "Exportación CSV", "Puntuación y enriquecimiento web"],
      },
      {
        heading: "Plan Growth",
        paragraphs: [
          "Growth añade el lado del contacto: secuencias de WhatsApp en la plataforma oficial de Meta, enriquecimiento Apollo en los mejores leads de cada descubrimiento, el calendario de contenido con IA e imágenes generadas, tres workspaces y la opción de continuar un descubrimiento más a fondo en la misma zona.",
        ],
        points: ["Automatización de WhatsApp", "150 enriquecimientos al mes", "Calendario de contenido con IA e imágenes", "3 negocios", "30 descubrimientos de hasta 50 leads"],
      },
      {
        heading: "Plan Pro",
        paragraphs: [
          "Pro es el plan de agencia: negocios ilimitados, descubrimientos ilimitados sin tope de leads por ronda, planes de contenido y outreach ilimitados, 500 enriquecimientos al mes y contactos de decisores en los leads enriquecidos.",
        ],
        points: ["Negocios ilimitados", "Descubrimiento y outreach ilimitados", "Contactos de decisores", "500 enriquecimientos al mes", "30 imágenes con IA al mes"],
      },
      {
        heading: "Uso y términos de terceros",
        paragraphs: [
          "Pueden aplicar límites de uso y reglas de proveedores o plataformas. Los términos mostrados en checkout prevalecen.",
        ],
      },
    ],
    proofLabel: "Exactitud de precios",
    proof:
      "Los precios reflejan la configuración publicada el 23 de julio de 2026. Impuestos, monedas y cambios futuros pueden alterar el checkout.",
    ctaTitle: "Evalúa ScoreLead con un mercado real.",
    ctaDescription: "Empieza con Free y mejora cuando necesites capacidad.",
    ctaLabel: "Crear cuenta gratis",
  },
  "company-security": {
    eyebrow: "Seguridad y confianza",
    title: "Seguridad de Datos y Cuentas",
    description:
      "Una visión directa de autenticación, transporte, límites de acceso, proveedores y responsabilidades compartidas.",
    answer:
      "ScoreLead usa cuentas autenticadas, secretos en servidor, transporte cifrado, acceso por negocio y cabeceras de seguridad. Esta página describe controles sin afirmar certificaciones no publicadas.",
    highlights: [
      "Las verificaciones protegen flujos privados.",
      "Las credenciales quedan fuera del navegador.",
      "Privacidad y eliminación están documentadas.",
    ],
    sections: [
      {
        heading: "Controles de aplicación",
        paragraphs: [
          "ScoreLead valida acceso, limita operaciones sensibles al servidor y aplica rate limiting o firmas a endpoints y webhooks seleccionados.",
        ],
      },
      {
        heading: "Límites de plataforma",
        paragraphs: [
          "El servicio usa proveedores de hosting, base de datos, autenticación, pagos, email, IA, búsqueda, mapas, almacenamiento, analytics y mensajería.",
        ],
        points: ["TLS", "Credenciales en servidor", "Acceso limitado", "Webhooks verificados", "Eliminación"],
      },
      {
        heading: "Informa una preocupación",
        paragraphs: [
          "Envía vulnerabilidades sospechadas mediante la página de contacto de ScoreLead. No accedas, cambies ni conserves datos ajenos.",
        ],
      },
    ],
    proofLabel: "Nivel actual de garantía",
    proof:
      "ScoreLead no afirma SOC 2, ISO 27001, pruebas de penetración, uptime ni certificaciones sin evidencia pública.",
    ctaTitle: "¿Necesitas una respuesta de seguridad?",
    ctaDescription: "Contacta al equipo con tu requisito o flujo de datos.",
    ctaLabel: "Contactar a ScoreLead",
  },
  "company-about": {
    eyebrow: "Acerca de ScoreLead",
    title: "Prospección B2B Más Explicable",
    description:
      "ScoreLead conecta descubrimiento, evidencia, calificación, scoring y outreach para que equipos pequeños enfoquen conversaciones informadas.",
    answer:
      "ScoreLead es software de generación de leads B2B para ventas, agencias, founders y growth. Sigue una idea simple: la automatización debe conservar la evidencia y el juicio detrás de una decisión.",
    highlights: [
      "Centrado en empresas B2B.",
      "Disponible en inglés, portugués y español.",
      "Flujos transparentes y revisables.",
    ],
    sections: [
      {
        heading: "Por qué existe ScoreLead",
        paragraphs: [
          "La prospección suele vivir en pestañas, hojas copiadas, CRM incompleto y mensajes genéricos. ScoreLead reúne esas etapas sin fingir que la automatización elimina el juicio.",
        ],
      },
      {
        heading: "Qué valora el producto",
        paragraphs: [
          "Evidencia útil, puntuaciones explicables, incertidumbre honesta, targeting enfocado y outreach relevante importan más que la lista más grande.",
        ],
        points: ["Evidencia sobre volumen", "Contexto sobre personalización genérica", "Aprendizaje sobre actividad"],
      },
      {
        heading: "Quién publica este sitio",
        paragraphs: [
          "El equipo editorial de ScoreLead publica el contenido. Cuando hay autor, revisor, cliente o metodología identificados, la página lo muestra.",
        ],
      },
    ],
    proofLabel: "Transparencia de entidad",
    proof:
      "Esta página evita inventar biografías, direcciones, registros, premios o certificaciones no proporcionados.",
    ctaTitle: "Descubre si el flujo encaja con tu mercado.",
    ctaDescription: "Empieza gratis o plantea un problema específico.",
    ctaLabel: "Probar ScoreLead",
  },
  "company-editorial-policy": {
    eyebrow: "Estándares editoriales",
    title: "Estándares Editoriales de ScoreLead",
    description:
      "Los estándares para afirmaciones, fuentes, asistencia de IA, traducciones, correcciones y evidencia de clientes.",
    answer:
      "ScoreLead publica contenido para mejorar decisiones de prospección. Separa comportamiento del producto de orientación general, cita fuentes primarias, divulga limitaciones y no inventa personas ni resultados.",
    highlights: [
      "Las afirmaciones deben ser trazables.",
      "La IA puede ayudar, pero el estándar editorial controla la publicación.",
      "Las traducciones preservan significado y claridad local.",
    ],
    sections: [
      {
        heading: "Quién, cómo y por qué",
        paragraphs: [
          "Cada artículo identifica organización, fechas y propósito. Los expertos se añaden solo con permiso y biografía real.",
        ],
      },
      {
        heading: "Fuentes y evidencia",
        paragraphs: [
          "Las afirmaciones regulatorias, técnicas y de plataforma priorizan fuentes primarias. Los resultados de clientes no se convierten en garantías.",
        ],
        points: ["Fuentes primarias", "Fechas visibles", "Metodología", "Correcciones"],
      },
      {
        heading: "Correcciones y actualizaciones",
        paragraphs: [
          "Envía correcciones mediante la página de contacto de ScoreLead. Las correcciones materiales cambian la fecha; las fechas no se actualizan solo para parecer recientes.",
        ],
      },
    ],
    proofLabel: "Divulgación de IA",
    proof:
      "La IA puede apoyar estructura, traducción y edición. ScoreLead sigue siendo responsable del texto, fuentes y exactitud.",
    ctaTitle: "¿Encontraste algo que corregir?",
    ctaDescription: "Envía la fuente, URL y una explicación breve.",
    ctaLabel: "Contactar a los editores",
  },
  "author-scorelead-editorial": {
    eyebrow: "Autor",
    title: "ScoreLead Editorial",
    description:
      "El equipo de producto e investigación responsable de guías sobre descubrimiento, calificación, scoring, enriquecimiento y outreach B2B.",
    answer:
      "ScoreLead Editorial es un autor organizacional usado cuando ninguna persona ha sido aprobada para publicación. Representa al equipo, no a una persona ficticia.",
    highlights: [
      "Cubre operaciones y flujos de ScoreLead.",
      "Usa fechas, fuentes y metodología visibles.",
      "Acepta correcciones mediante la página de contacto de ScoreLead.",
    ],
    sections: [
      {
        heading: "Áreas de enfoque",
        paragraphs: [
          "El equipo escribe sobre ICP, descubrimiento, enriquecimiento, scoring transparente, calidad de datos, pipeline y outreach responsable.",
        ],
      },
      {
        heading: "Estándar de revisión",
        paragraphs: [
          "Las afirmaciones de producto se comparan con su comportamiento actual. Las externas prefieren fuentes primarias y marcan la incertidumbre.",
        ],
        points: ["Exactitud", "Fuentes primarias", "Límites claros", "Traducción fiel"],
      },
      {
        heading: "Política de identidad",
        paragraphs: [
          "Cuando un autor o revisor real esté disponible y consienta, ScoreLead usará un perfil identificado. Hasta entonces usa esta identidad organizacional.",
        ],
      },
    ],
    proofLabel: "Por qué no hay schema Person",
    proof:
      "Este perfil es una Organization en datos estructurados. Publicar una persona sin individuo real reduciría la confianza.",
    ctaTitle: "Lee la investigación detrás del flujo.",
    ctaDescription: "Explora las guías o envía una corrección.",
    ctaLabel: "Explorar el blog",
  },
  "tool-icp-worksheet": {
    eyebrow: "Herramienta gratis · Hoja de ICP",
    title: "ICP B2B con Criterios de Búsqueda",
    description:
      "Crea un ICP B2B compacto y accionable con requisitos, preferencias, descalificadores, evidencia observable y un plan de aprendizaje.",
    answer:
      "Un ICP útil ayuda a aceptar o rechazar empresas con consistencia. Esta hoja convierte posicionamiento amplio en criterios observables.",
    highlights: ["Sin cuenta", "Funciona en el navegador", "Imprime o guarda la hoja"],
    sections: [
      {
        heading: "Describe la cuenta, no un comprador ficticio",
        paragraphs: [
          "Enfócate en mercado, geografía, modelo, operaciones, evidencia del problema y razones de mal ajuste.",
        ],
      },
      {
        heading: "Separa requisitos y preferencias",
        paragraphs: [
          "Los requisitos definen elegibilidad. Las preferencias priorizan. Los descalificadores excluyen cuentas inadecuadas.",
        ],
      },
      {
        heading: "Conecta el perfil con resultados",
        paragraphs: [
          "Revisa cuentas, objeciones, oportunidades y pérdidas y cambia el perfil cuando la evidencia lo justifique.",
        ],
      },
    ],
    proofLabel: "Privacidad",
    proof: "Los datos permanecen en la página y no se envían a ScoreLead.",
    ctaTitle: "¿Listo para probar los criterios?",
    ctaDescription: "Usa la hoja y ejecuta un descubrimiento enfocado.",
    ctaLabel: "Empezar gratis",
  },
  "tool-lead-scoring-calculator": {
    eyebrow: "Herramienta gratis · Calculadora de score",
    title: "Crea una puntuación B2B explicable",
    description:
      "Compara ajuste, alcance, confianza, interacción y preparación con una calculadora de lead scoring B2B transparente y gratuita.",
    answer:
      "La calculadora crea un promedio transparente de cinco dimensiones. Ayuda a priorizar y debe revisarse contra la evidencia.",
    highlights: ["Entradas ajustables", "Fórmula visible", "Ningún dato enviado"],
    sections: [
      {
        heading: "Puntúa con evidencia observable",
        paragraphs: ["Usa la misma rúbrica y distingue desconocido de débil."],
      },
      {
        heading: "Usa requisitos obligatorios como filtros",
        paragraphs: ["Verifica requisitos regulatorios, geográficos o técnicos antes del score."],
      },
      {
        heading: "Calibra con el pipeline",
        paragraphs: ["Compara puntuaciones con aceptación, conversaciones, oportunidades y calidad."],
      },
    ],
    proofLabel: "Limitación",
    proof: "La calculadora usa pesos iguales y no estima intención de compra.",
    ctaTitle: "Aplica el modelo a cuentas descubiertas.",
    ctaDescription: "Mantén evidencia y puntuación juntas en ScoreLead.",
    ctaLabel: "Probar scoring",
  },
  "tool-enrichment-checklist": {
    eyebrow: "Herramienta gratis · Checklist de datos",
    title: "Checklist de Enriquecimiento B2B",
    description:
      "Revisa identidad, ajuste, problema, contacto, procedencia y actualidad con un checklist de enriquecimiento B2B antes del outreach o CRM.",
    answer:
      "Un registro completo no siempre es útil. Este checklist se centra en campos que apoyan decisiones y fuentes para verificarlos.",
    highlights: ["Campos orientados a decisiones", "Progreso visible", "Ningún dato enviado"],
    sections: [
      {
        heading: "Confirma la identidad",
        paragraphs: ["Dominio, nombre, ubicación y perfiles normalizados evitan duplicados."],
      },
      {
        heading: "Añade contexto de ajuste",
        paragraphs: ["Servicios, operación, presencia y señales deben conectarse con el ICP."],
      },
      {
        heading: "Conserva fuente y fecha",
        paragraphs: ["Registra origen, fecha y si cada dato es confirmado, inferido o desconocido."],
      },
    ],
    proofLabel: "Recordatorio de uso",
    proof:
      "La completitud no crea permiso de contacto. Aplica privacidad, supresión y reglas del canal por separado.",
    ctaTitle: "Automatiza las partes repetibles.",
    ctaDescription: "Organiza contexto público y fuentes con ScoreLead.",
    ctaLabel: "Enriquecer una cuenta",
  },
  "tool-roi-calculator": {
    eyebrow: "Herramienta gratis · Modelo de ROI",
    title: "Coste de Investigación Manual de Leads B2B",
    description:
      "Modela el coste mensual, las horas recuperables y el valor de equilibrio de automatizar la investigación y prospección de leads B2B.",
    answer:
      "La calculadora convierte equipo, horas semanales, coste por hora y reducción estimada en un escenario de planificación. No predice ingresos.",
    highlights: ["Supuestos transparentes", "Reducción editable", "Ningún dato enviado"],
    sections: [
      {
        heading: "Usa el coste completo",
        paragraphs: ["Incluye el coste práctico de personas, herramientas y proveedores."],
      },
      {
        heading: "Estima una reducción conservadora",
        paragraphs: ["La automatización no elimina verificación, excepciones ni revisión de calidad."],
      },
      {
        heading: "Mide después de implementar",
        paragraphs: ["Compara tiempo por cuenta aceptada, correcciones y conversión."],
      },
    ],
    proofLabel: "Modelo de planificación",
    proof:
      "Los resultados son estimaciones aritméticas y excluyen software, implementación, impuestos y efectos sobre ingresos.",
    ctaTitle: "Prueba el flujo antes de confiar en la estimación.",
    ctaDescription: "Ejecuta un descubrimiento y mide el tiempo real.",
    ctaLabel: "Iniciar prueba gratis",
  },
}
