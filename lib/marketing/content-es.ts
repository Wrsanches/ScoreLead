import type { MarketingPageTranslation } from "./types"

export const marketingContentEs: Record<string, MarketingPageTranslation> = {
  "feature-ai-lead-discovery": {
    eyebrow: "Función · Descubrimiento de cuentas",
    title: "Descubrimiento de leads con IA basado en tu mercado real",
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
    title: "Lead scoring B2B transparente que tu equipo puede cuestionar",
    description:
      "Prioriza cuentas por ajuste, alcance, confianza, potencial de interacción y preparación, manteniendo visible la evidencia.",
    answer:
      "La puntuación de ScoreLead es una capa de priorización, no un veredicto. Convierte señales observables en una cola consistente y mantiene cada dimensión abierta a revisión y mejora.",
    highlights: [
      "Separa el ajuste de la empresa del momento y la preparación.",
      "Muestra evidencia por dimensión, no un número opaco.",
      "Usa niveles claros para revisar, enriquecer o contactar.",
    ],
    sections: [
      {
        heading: "Puntúa señales relacionadas con tu oferta",
        paragraphs: [
          "El modelo evalúa dimensiones observables y explicables. Los requisitos obligatorios deben filtrar; señales más suaves ordenan las cuentas restantes.",
        ],
      },
      {
        heading: "Mantén visible la incertidumbre",
        paragraphs: [
          "Un dato ausente no debe convertirse silenciosamente en una nota negativa. Los campos desconocidos se distinguen de la evidencia débil.",
        ],
        points: ["Ajuste de mercado", "Alcance online", "Confianza", "Interacción", "Preparación"],
      },
      {
        heading: "Calibra con resultados comerciales",
        paragraphs: [
          "Compara puntuaciones con cuentas aceptadas, respuestas, oportunidades y rechazos. Los errores proporcionan la evidencia para mejorar el modelo.",
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
    title: "Enriquecimiento de leads que vuelve útiles los datos",
    description:
      "Convierte un nombre y dominio en contexto estructurado y trazable para calificación, personalización y exportación al CRM.",
    answer:
      "El enriquecimiento B2B debe reducir incertidumbre, no maximizar campos. ScoreLead organiza identidad, ajuste, problema, contacto y personalización con el contexto necesario para verificar.",
    highlights: [
      "Recopila contexto público de empresa, servicios, ubicación y contacto.",
      "Normaliza sin borrar la evidencia original.",
      "Marca valores ausentes o inferidos en lugar de presentar suposiciones.",
    ],
    sections: [
      {
        heading: "Enriquece para una decisión",
        paragraphs: [
          "Cada campo debe apoyar ajuste, una hipótesis de problema, el plan de contacto o un mejor mensaje. Los datos sin uso crean mantenimiento.",
        ],
      },
      {
        heading: "Conserva la procedencia",
        paragraphs: [
          "Los datos web cambian. URLs de origen, fechas y confianza ayudan a verificar detalles antes del outreach.",
        ],
        points: ["Identidad", "Ajuste", "Evidencia del problema", "Contacto", "Personalización"],
      },
      {
        heading: "Exporta registros más limpios",
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
    title: "Automatización de outreach con contexto de la cuenta",
    description:
      "Crea secuencias B2B a partir de evidencia verificada, con revisión humana antes del uso o programación.",
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
    title: "Generación de leads para agencias con varios mercados",
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
    title: "Un sistema compartido de prospección para ventas B2B",
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
    title: "Generación founder-led que aprende con cada conversación",
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
    title: "Descubrimiento repetible entre equipos y regiones",
    description:
      "Expande la prospección a segmentos o regiones conservando estándares, fuentes y mensajes locales.",
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
    title: "ScoreLead vs. hojas de cálculo para prospección B2B",
    description:
      "Entiende cuándo una hoja basta y cuándo descubrimiento, fuentes, scoring y workflow necesitan un sistema.",
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
    title: "Descubrimiento actual vs. listas de leads compradas",
    description:
      "Compara listas estáticas con criterios, fuentes, evidencia pública reciente y calificación de cuentas.",
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
  "case-study-ceramik": {
    eyebrow: "Historia de cliente · Ceramik",
    title: "Cómo Ceramik amplió un pipeline de prospección enfocado",
    description:
      "Un relato transparente de cómo Ceramik usó ScoreLead para descubrir estudios de cerámica, reducir investigación manual y ampliar su pipeline en 30 días.",
    answer:
      "Ceramik usó ScoreLead para buscar estudios, organizar evidencia pública y priorizar outreach. El relato publicado atribuye 2.450 leads descubiertos, crecimiento de 10× y 85% menos tiempo de investigación a los primeros 30 días.",
    highlights: [
      "2.450 leads de empresas reportados como descubiertos.",
      "10× de crecimiento reportado en el primer mes.",
      "85% menos tiempo reportado en investigación manual.",
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
        heading: "Cómo interpretar el resultado",
        paragraphs: [
          "Las cifras son resultados reportados por el cliente en un periodo específico. No son un benchmark independiente, experimento controlado ni garantía.",
        ],
      },
    ],
    proofLabel: "Metodología y divulgación",
    proof:
      "Las cifras coinciden con la historia ya publicada y deben actualizarse si Ceramik ofrece una nueva ventana, baseline o verificación.",
    ctaTitle: "Crea un flujo para tu propio mercado.",
    ctaDescription: "Define el objetivo, conserva evidencia y mide cuentas aceptadas.",
    ctaLabel: "Iniciar tu flujo",
  },
  "company-pricing": {
    eyebrow: "Precios",
    title: "Empieza gratis. Mejora cuando el flujo demuestre valor.",
    description:
      "Usa el flujo principal con Free y pasa a Pro cuando necesites más capacidad en descubrimiento, negocios, contenido e outreach.",
    answer:
      "Free cuesta US$0 e incluye un negocio, un descubrimiento de aproximadamente 25 leads, un plan de contenido y una imagen. Pro se publica a US$49 al mes.",
    highlights: ["Free: US$0 al mes", "Pro: US$49 al mes", "Sin tarjeta para empezar"],
    sections: [
      {
        heading: "Plan Free",
        paragraphs: [
          "Usa un workspace, ejecuta un trabajo inicial, crea un plan de contenido y genera una imagen para evaluar el flujo.",
        ],
      },
      {
        heading: "Plan Pro",
        paragraphs: [
          "Pro ofrece varios negocios, descubrimiento y contenido ilimitados, hasta 30 imágenes al mes con límite diario y outreach ilimitado.",
        ],
        points: ["Varios negocios", "Descubrimiento ilimitado", "Contenido ilimitado", "30 imágenes al mes", "Outreach ilimitado"],
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
    title: "Cómo ScoreLead aborda la seguridad de datos y cuentas",
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
          "Envía vulnerabilidades sospechadas a hello@scorelead.io. No accedas, cambies ni conserves datos ajenos.",
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
    title: "Creado para hacer más explicable la prospección B2B",
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
    title: "Cómo ScoreLead investiga, escribe y actualiza contenido",
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
          "Envía correcciones a hello@scorelead.io. Las correcciones materiales cambian la fecha; las fechas no se actualizan solo para parecer recientes.",
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
      "Acepta correcciones en hello@scorelead.io.",
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
    title: "Convierte tu ICP en criterios de búsqueda utilizables",
    description:
      "Crea un ICP B2B compacto con requisitos, preferencias, descalificadores, evidencia y un plan de aprendizaje.",
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
      "Compara ajuste, alcance, confianza, interacción y preparación sin ocultar las dimensiones.",
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
    title: "Comprueba si una cuenta B2B está lista para calificación",
    description:
      "Revisa identidad, ajuste, problema, contacto, procedencia y actualidad antes de outreach o CRM.",
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
    title: "Estima el coste de investigar leads B2B manualmente",
    description:
      "Modela coste mensual, horas recuperables y valor de equilibrio de un flujo más automatizado.",
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
