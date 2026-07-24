import type { BlogTranslation } from "./types"

export const spanishPosts: Record<string, BlogTranslation> = {
  "ai-lead-generation-guide": {
    title: "Generación de Leads con IA: Guía Práctica para Equipos B2B",
    description:
      "Aprende a usar IA para definir un mercado, descubrir cuentas, calificar el ajuste y preparar outreach relevante sin perder el criterio humano.",
    category: "Generación de leads con IA",
    keywords: [
      "generación de leads con IA",
      "software de generación de leads B2B",
      "prospección de ventas con IA",
      "leads B2B calificados",
      "descubrimiento de cuentas",
    ],
    introduction: [
      "La generación de leads con IA es más útil cuando mejora un proceso comercial claro. Puede investigar un mercado amplio, organizar datos públicos, identificar señales y ayudar al equipo a decidir dónde invertir atención. Pero no puede definir un buen cliente sin un objetivo preciso y reglas de calificación útiles.",
      "El objetivo práctico no es producir la lista más larga. Es crear un camino repetible desde un mercado objetivo hasta un grupo menor de empresas que merecen un contacto cuidadoso. Ese camino combina automatización para escalar y revisión humana para contexto, posicionamiento y timing.",
    ],
    sections: [
      {
        heading: "Empieza con una hipótesis de mercado",
        paragraphs: [
          "Antes de buscar, documenta a quién esperas ayudar y por qué. Una hipótesis útil incluye industria o modelo de negocio, características de la empresa, región, dolor probable y resultado del producto. “Empresas de software” es demasiado amplio. “SaaS B2B en crecimiento en España con un equipo pequeño de outbound” ofrece criterios evaluables.",
          "Trata la hipótesis como una versión, no como una verdad permanente. Compara los criterios con respuestas, reuniones y oportunidades reales. El mejor proceso aprende del pipeline en lugar de repetir la misma búsqueda.",
        ],
        points: [
          "Elige un segmento y una región específicos.",
          "Define señales observables de ajuste y descalificadores claros.",
          "Conecta cada criterio con una razón comercial.",
        ],
      },
      {
        heading: "Usa IA para descubrir y reunir evidencia",
        paragraphs: [
          "Un flujo asistido por IA puede descubrir empresas en mapas, sitios, directorios y fuentes públicas, y normalizar los resultados en registros de cuenta. Aquí la automatización elimina trabajo repetitivo: nombres, ubicaciones, servicios, presencia digital, canales de contacto y otras pistas útiles.",
          "La evidencia importa más que el volumen. Conserva la fuente y la confianza de los campos importantes. Un representante debe entender por qué apareció una cuenta y verificar los hechos que orientarán el mensaje.",
        ],
      },
      {
        heading: "Puntúa el ajuste antes de escribir",
        paragraphs: [
          "La puntuación convierte una pila de empresas en una cola de trabajo. Separa ajuste de perfil de señales de compra: una empresa puede parecer ideal y no tener un motivo inmediato para actuar. Evalúa ajuste, confianza, alcance digital, engagement y disposición, mostrando el razonamiento.",
          "No permitas que un número oculte incertidumbre. Usa el score para priorizar la revisión, no para sustituirla. Un grupo pequeño y confiable puede recibir personalización profunda; las cuentas con poca evidencia pueden volver a investigación.",
        ],
      },
      {
        heading: "Cierra el ciclo con resultados de ventas",
        paragraphs: [
          "Sigue lo que ocurre después del descubrimiento: cuentas aceptadas, respuestas, reuniones, oportunidades y motivos de rechazo. Así sabrás si el problema está en el objetivo, los datos, el score o el mensaje. Muchas respuestas de cuentas sin ajuste no son éxito.",
          "Revisa el sistema con una cadencia estable. Cambia una hipótesis importante cada vez para identificar qué mejora el rendimiento. La IA acelera la iteración; la medición disciplinada hace útil esa velocidad.",
        ],
      },
    ],
    conclusion: {
      heading: "Construye un sistema, no una lista aislada",
      paragraphs: [
        "Una buena generación de leads con IA conecta definición de mercado, evidencia de cuenta, puntuación transparente, outreach relevante y feedback del pipeline. Cuando las etapas comparten criterios, el equipo limpia menos listas y aprende más sobre las empresas que realmente puede ayudar.",
      ],
    },
  },
  "b2b-lead-scoring-model": {
    title: "Cómo Crear un Modelo de Lead Scoring B2B Confiable",
    description:
      "Crea un modelo transparente de lead scoring B2B que combine ICP, evidencia de cuenta, engagement, disposición y feedback de ventas.",
    category: "Lead scoring",
    keywords: [
      "lead scoring B2B",
      "modelo de lead scoring",
      "lead scoring con IA",
      "puntuación de prospectos",
      "calificación de ventas",
    ],
    introduction: [
      "Un score útil responde una pregunta práctica: ¿qué cuenta debe revisar el equipo ahora y por qué? Debe hacer la priorización más consistente sin disfrazar hipótesis como certezas. Si ventas no entiende o no puede cuestionar los datos, terminará ignorando el modelo.",
      "Los modelos más sólidos combinan ajuste observable con evidencia de comportamiento o timing. También conservan el detalle detrás del número, convirtiéndolo en un punto de partida para el criterio y no en un veredicto sin explicación.",
    ],
    sections: [
      {
        heading: "Separa ajuste de disposición",
        paragraphs: [
          "El ajuste describe cuánto se parece la empresa a los clientes que puedes atender bien. Industria, región, modelo de negocio, tamaño, servicios y complejidad son entradas comunes. La disposición describe señales de que la conversación puede ser oportuna, como contratación, expansión, un proceso débil o interés activo.",
          "Separar ambos conceptos evita priorizar automáticamente una empresa perfecta en el papel, pero sin necesidad visible, sobre otra con buen ajuste y una razón clara para cambiar. Muestra las dos dimensiones para elegir la acción correcta.",
        ],
      },
      {
        heading: "Elige evidencia que puedas explicar",
        paragraphs: [
          "Cada señal necesita una razón. Si las reseñas importan, explica la relación con la oferta. Si falta una integración, define por qué es negativo. No añadas campos solo porque existen; las entradas irrelevantes hacen parecer sofisticado un modelo menos fiable.",
          "Usa una rúbrica breve para cada dimensión. Define evidencia baja, media y alta, incluidos valores desconocidos. Desconocido no debe significar mal ajuste; puede significar que falta investigar.",
        ],
        points: [
          "Ajuste de perfil: quién es la empresa.",
          "Evidencia de problema: qué puede mejorar.",
          "Potencial de engagement: acceso a la persona adecuada.",
          "Disposición: por qué la conversación importa ahora.",
        ],
      },
      {
        heading: "Ajusta los pesos a la realidad",
        paragraphs: [
          "Empieza con pesos simples alineados con la estrategia. Si una condición regulatoria es obligatoria, úsala como filtro, no como aporte pequeño. Si el tamaño tiene poca relación con el valor, no dejes que domine. Requisitos, señales positivas, negativas e incertidumbre deben diferenciarse.",
          "Crea niveles que impliquen una acción. El superior puede recibir revisión manual y outreach personalizado; el medio, enriquecimiento; el inferior, exclusión o revisión futura. El score se vuelve operativo cuando el siguiente paso es obvio.",
        ],
      },
      {
        heading: "Valida con cuentas aceptadas y rechazadas",
        paragraphs: [
          "Compara la puntuación con lo que ventas acepta, avanza y gana. Estudia falsos positivos y negativos. Una cuenta con score alto rechazada puede revelar un criterio ausente; un cliente ganado con score bajo puede mostrar una señal infravalorada.",
          "Recalibra con una frecuencia definida y documenta cambios. No optimices solo para reuniones; considera calidad de oportunidad y ajuste del cliente. El objetivo es una definición compartida y cada vez mejor de dónde enfocar.",
        ],
      },
    ],
    conclusion: {
      heading: "La transparencia genera adopción",
      paragraphs: [
        "Un modelo confiable es compacto, basado en evidencia y conectado a un flujo claro. Haz visible el razonamiento, incorpora el feedback de ventas y trata el score como una herramienta viva de priorización.",
      ],
    },
  },
  "ideal-customer-profile-guide": {
    title: "Cómo Definir el Perfil de Cliente Ideal para Prospección B2B",
    description:
      "Convierte evidencia de clientes en un ICP B2B accionable con criterios de ajuste, descalificadores, segmentos prioritarios y feedback.",
    category: "Estrategia de ICP",
    keywords: [
      "perfil de cliente ideal",
      "ICP B2B",
      "segmentación de cuentas",
      "estrategia de prospección",
      "mercado objetivo",
    ],
    introduction: [
      "El perfil de cliente ideal, o ICP, describe el tipo de empresa con mayor probabilidad de recibir valor real de tu oferta y convertirse en un cliente sano. Es una definición de cuenta, no la biografía ficticia de un comprador. La persona orienta mensajes; el ICP decide qué empresas entran al pipeline.",
      "Un buen ICP es suficientemente específico para orientar el descubrimiento y suficientemente flexible para mejorar con evidencia. Debe indicar dónde buscar, qué verificar, qué cuentas rechazar y cómo reconocer segmentos adyacentes prometedores.",
    ],
    sections: [
      {
        heading: "Empieza por la evidencia de tus mejores clientes",
        paragraphs: [
          "Analiza clientes que alcanzaron valor rápido, siguieron activos, ampliaron o se convirtieron en buenas referencias. Busca condiciones compartidas antes de la venta: modelo, problema operativo, madurez, región, estructura y urgencia. Una cuenta con muchos ingresos no es ideal si exige soporte excepcional o retiene poco.",
          "Si aún tienes pocos clientes, usa entrevistas, pilotos, negocios perdidos y alternativas del mercado como evidencia provisional. Marca las hipótesis para mostrar lo que necesita validación.",
        ],
      },
      {
        heading: "Convierte patrones en criterios observables",
        paragraphs: [
          "Los criterios de descubrimiento deben ser visibles en datos fiables. “Empresa innovadora” es difícil de verificar; “ofrece reservas online y opera tres sedes” es observable. Divide los criterios en obligatorios, preferidos y negativos.",
          "Incluye una razón junto a cada criterio. Esto mantiene el ICP unido al valor del producto y evita filtros arbitrarios. También facilita revisarlo cuando los resultados contradicen una hipótesis.",
        ],
        points: [
          "Firmografía: industria, región, tamaño y modelo.",
          "Operación: procesos, canales, sedes y estructura.",
          "Señales de problema: fricción que tu oferta resuelve.",
          "Descalificadores: condiciones que hacen improbable el éxito.",
        ],
      },
      {
        heading: "Crea segmentos prioritarios",
        paragraphs: [
          "Muchos productos atienden a más de un tipo de empresa, pero esos segmentos rara vez merecen el mismo mensaje. Define un ICP principal para el ajuste más claro y perfiles secundarios para oportunidades adyacentes. Da a cada uno su hipótesis, prueba y filtros.",
          "La segmentación mejora la búsqueda y el outreach. El equipo compara respuestas y conversiones sin mezclar empresas que compran por motivos diferentes.",
        ],
      },
      {
        heading: "Lleva el ICP al trabajo comercial",
        paragraphs: [
          "Mantén el perfil donde puedan usarlo descubrimiento, scoring y revisión del pipeline. Registra motivos de aceptación y rechazo. Estos motivos muestran criterios demasiado amplios, ausentes o mal ponderados.",
          "Revisa el ICP cuando cambien producto, mercado o go-to-market. Debe ser estable para enfocar al equipo, pero nunca estar protegido contra la evidencia.",
        ],
      },
    ],
    conclusion: {
      heading: "Tu ICP es una herramienta de decisión",
      paragraphs: [
        "El mejor perfil no es el documento más largo. Es la regla compartida más clara para decidir qué cuentas merecen atención. Básalo en valor, exprésalo con señales observables y mejóralo con resultados reales.",
      ],
    },
  },
  "lead-enrichment-guide": {
    title: "Enriquecimiento de Leads B2B: Qué Datos Importan",
    description:
      "Descubre qué datos de enriquecimiento mejoran la calificación y el outreach, cómo gestionar la confianza y mantener cuentas útiles.",
    category: "Enriquecimiento de leads",
    keywords: [
      "enriquecimiento de leads B2B",
      "software de enriquecimiento",
      "datos de cuenta",
      "inteligencia de ventas",
      "leads listos para CRM",
    ],
    introduction: [
      "El enriquecimiento añade contexto a un registro básico. Un nombre y un sitio pueden convertirse en una visión de servicios, ubicación, mercado, canales, equipo, presencia digital y contexto de compra. El objetivo no es reunir todos los campos, sino reducir incertidumbre antes de calificar y contactar.",
      "Los datos útiles ayudan a responder tres preguntas: ¿esta empresa encaja?, ¿qué evidencia lo demuestra? y ¿qué haría relevante una conversación? Los campos que no ayudan a decidir crean mantenimiento sin mucho valor.",
    ],
    sections: [
      {
        heading: "Organiza los datos según la decisión",
        paragraphs: [
          "Agrupa campos en identidad, ajuste, evidencia de problema, contacto y personalización. La identidad evita duplicados. El ajuste conecta con el ICP. La evidencia sugiere dónde puede ayudar la oferta. Los datos de contacto orientan el canal. La personalización ofrece un inicio específico.",
          "Esta estructura hace visibles las carencias. Una cuenta con dirección completa, pero sin evidencia de ajuste, no está lista solo porque tenga muchos campos llenos.",
        ],
        points: [
          "Identidad: nombre, dominio, ubicación y perfiles.",
          "Ajuste: sector, servicios, presencia, tamaño y mercado.",
          "Contexto: reseñas, precios, vacantes, tecnología y cambios.",
          "Contacto: canales públicos y roles relevantes.",
        ],
      },
      {
        heading: "Conserva fuentes, fechas y confianza",
        paragraphs: [
          "Los datos web cambian. Registra de dónde salió un valor importante y cuándo se observó. Una URL permite verificar el campo antes de usarlo. La confianza es especialmente útil cuando la IA extrae una respuesta de contenido ambiguo.",
          "No presentes inferencias como hechos confirmados. Etiqueta estimaciones y valores desconocidos. Una carencia transparente es más segura que una suposición convincente que daña la credibilidad.",
        ],
      },
      {
        heading: "Normaliza sin borrar significado",
        paragraphs: [
          "Los formatos consistentes hacen los datos buscables y exportables: países, teléfonos, URLs, categorías y listas. Conserva el texto original si normalizar elimina matices. La categoría ayuda a filtrar; la frase original puede servir mejor para personalizar.",
          "Deduplica en el nivel de empresa antes de crear contactos. Dominios, nombres normalizados, direcciones y perfiles contribuyen a una coincidencia, pero ningún identificador es perfecto.",
        ],
      },
      {
        heading: "Enriquece por etapas",
        paragraphs: [
          "Haz descubrimiento y validación de ajuste antes del enriquecimiento profundo. No tiene sentido reunir datos detallados para cuentas sin elegibilidad básica. El proceso progresivo concentra investigación costosa en mejores candidatos.",
          "Actualiza campos según su velocidad de cambio. La identidad es estable; roles, vacantes y contactos requieren revisión frecuente. Permite a ventas marcar información antigua.",
        ],
      },
    ],
    conclusion: {
      heading: "Calidad significa estar listo para decidir",
      paragraphs: [
        "Un registro lleno no siempre es útil. El enriquecimiento de calidad es actual, rastreable, normalizado y conectado con la calificación o el outreach. Diseña los datos alrededor de la próxima decisión del equipo.",
      ],
    },
  },
  "sales-prospecting-automation": {
    title: "Automatización de Prospección sin Perder Relevancia",
    description:
      "Diseña un flujo que escale investigación y priorización manteniendo calificación, personalización y revisión humana.",
    category: "Automatización comercial",
    keywords: [
      "automatización de prospección",
      "prospección automatizada",
      "automatización de ventas con IA",
      "herramienta de prospección B2B",
      "flujo de ventas",
    ],
    introduction: [
      "La automatización debe eliminar trabajo repetitivo, no criterio. Las mejores tareas son las que tienen entradas claras y salidas repetibles: descubrir empresas, reunir datos públicos, normalizar registros, aplicar reglas transparentes y preparar un resumen.",
      "Los problemas aparecen al automatizar una estrategia confusa. Crear listas más rápido no corrige un ICP amplio, y enviar más rápido no vuelve relevante un mensaje genérico. Construye la automatización alrededor de controles de calidad.",
    ],
    sections: [
      {
        heading: "Mapea el flujo antes de elegir herramientas",
        paragraphs: [
          "Dibuja el camino desde la definición del objetivo hasta el pipeline. Identifica responsable, entrada, decisión y salida en cada etapa. Así verás dónde el trabajo es repetitivo y dónde una persona aporta contexto esencial.",
          "Un flujo práctico puede incluir briefing, descubrimiento, validación, enriquecimiento, scoring, revisión humana, preparación de outreach, sincronización con CRM y seguimiento. Mantén la primera versión pequeña y observable.",
        ],
      },
      {
        heading: "Automatiza investigación antes que comunicación",
        paragraphs: [
          "Descubrimiento y enriquecimiento suelen ofrecer beneficios más seguros que el envío automático. El sistema puede reunir evidencia, resumir un sitio y sugerir ajuste mientras una persona revisa la cuenta. Así libera tiempo sin exponer la marca a mensajes sin validar.",
          "Al generar borradores, exige que cada afirmación provenga de los datos de la cuenta. La plantilla da forma; la evidencia aporta la razón para contactar.",
        ],
        points: [
          "Automatiza recolección y formato repetibles.",
          "Mantén aprobaciones antes de acciones importantes.",
          "Muestra fuentes junto a los resúmenes.",
          "Envía casos inciertos a revisión.",
        ],
      },
      {
        heading: "Diseña caminos para excepciones",
        paragraphs: [
          "Los datos reales son incompletos. Define qué ocurre si un sitio no funciona, dos registros parecen duplicados, el score carece de evidencia o un canal no puede verificarse. Un flujo robusto pausa, etiqueta o redirige el caso en lugar de inventar una respuesta.",
          "Facilita la corrección manual y consérvala para futuras ejecuciones. Las excepciones son feedback valioso sobre el mercado y el diseño.",
        ],
      },
      {
        heading: "Mide calidad y velocidad juntas",
        paragraphs: [
          "Sigue el tiempo ahorrado y las cuentas procesadas, pero combínalos con aceptación, completitud, calidad de respuesta, reuniones, oportunidades y bajas. El volumen sin calidad puede esconder deterioro.",
          "Empieza con un segmento controlado, compara con el flujo anterior y revisa muestras. Amplía solo cuando el proceso entregue entradas fiables.",
        ],
      },
    ],
    conclusion: {
      heading: "Escala el trabajo que merece escalar",
      paragraphs: [
        "Una buena automatización hace consistente la investigación, expone evidencia y deja más tiempo para el criterio. Mantén preciso el objetivo, automatiza primero la repetición de bajo riesgo y conserva revisión donde el contexto afecta la confianza.",
      ],
    },
  },
  "personalized-b2b-outreach": {
    title: "Outreach B2B Personalizado: de la Investigación al Mensaje",
    description:
      "Crea outreach B2B personalizado conectando investigación verificada con un problema específico, valor útil y seguimientos respetuosos.",
    category: "Outreach B2B",
    keywords: [
      "outreach B2B personalizado",
      "contacto de ventas",
      "mensajes con IA",
      "personalización de email frío",
      "outreach basado en cuentas",
    ],
    introduction: [
      "Personalizar no es insertar el nombre de una empresa en una plantilla. Un mensaje B2B relevante demuestra que el remitente entiende algo específico de la cuenta y puede conectarlo con un resultado plausible. Es conciso, verificable y fácil de responder.",
      "La investigación aporta la materia prima, pero el criterio da forma al mensaje. No menciones todos los datos encontrados. Elige la señal que mejor explica por qué la conversación puede ser útil ahora.",
    ],
    sections: [
      {
        heading: "Crea un resumen breve de la cuenta",
        paragraphs: [
          "Antes de escribir, resume empresa, prioridad probable, evidencia, rol relevante y valor de la oferta. Incluye fuentes para afirmaciones que puedan aparecer. Un briefing estructurado produce mensajes más consistentes que una búsqueda libre.",
          "Separa hechos de interpretaciones. “La empresa abrió una segunda sede” puede ser un hecho; “el equipo tiene problemas con leads” es una hipótesis. Explora la hipótesis sin presentarla como verdad.",
        ],
      },
      {
        heading: "Usa una estructura de razón, valor y prueba",
        paragraphs: [
          "Abre con una razón creíble, conéctala a un problema comercial u operativo, explica el valor y propone un siguiente paso sencillo. Cada frase debe mejorar la comprensión.",
          "La prueba debe encajar con el segmento. Usa un caso, una explicación del flujo o una capacidad concreta en lugar de superlativos sin apoyo. Si falta evidencia, reduce la afirmación.",
        ],
        points: [
          "Razón: por qué esta cuenta y por qué ahora.",
          "Relevancia: problema u oportunidad sugeridos.",
          "Valor: resultado que apoya el producto.",
          "Siguiente paso: una pregunta clara y respetuosa.",
        ],
      },
      {
        heading: "Personaliza toda la secuencia",
        paragraphs: [
          "Los seguimientos deben añadir contexto, no repetir la misma petición. Un mensaje puede explicar el flujo, otro compartir un ejemplo y el último cerrar el contacto. Mantén la secuencia proporcional al valor y la confianza.",
          "Usa el idioma y las normas del mercado. La traducción debe conservar significado y tono; sustituir palabras literalmente puede sonar artificial o agresivo.",
        ],
      },
      {
        heading: "Revisa precisión y respeto",
        paragraphs: [
          "Comprueba nombres, detalles, enlaces y afirmaciones. Elimina personalización intrusiva o irrelevante. Un dato público puede ser inapropiado si el destinatario no espera verlo en un mensaje comercial.",
          "Facilita la baja y cumple leyes y reglas aplicables. La relevancia protege la reputación del remitente y la atención del receptor.",
        ],
      },
    ],
    conclusion: {
      heading: "La relevancia nace de una selección disciplinada",
      paragraphs: [
        "Un buen mensaje usa una señal verificada, un problema plausible, una propuesta clara y un siguiente paso sencillo. Las herramientas organizan evidencia y redactan, pero el remitente sigue siendo responsable de precisión, tono y timing.",
      ],
    },
  },
  "manual-lead-research-vs-automation": {
    title: "Investigación Manual de Leads vs. Automatización",
    description:
      "Compara la investigación manual con el descubrimiento automatizado y divide mejor el trabajo entre enriquecimiento, calificación y outreach.",
    category: "Diseño de procesos",
    keywords: [
      "investigación manual de leads",
      "automatización de investigación",
      "descubrimiento automatizado de leads",
      "investigación de ventas",
      "flujo de prospección",
    ],
    introduction: [
      "La investigación manual es flexible y sensible al contexto, pero difícil de repetir a escala. La automatización es rápida y consistente, aunque limitada a sus reglas y datos. La pregunta útil no es cuál gana, sino qué tareas exigen interpretación humana y cuáles se benefician de un proceso repetible.",
      "Un flujo híbrido usa automatización para reunir y priorizar evidencia, y dirige la atención humana a decisiones con consecuencias comerciales, de marca o relación.",
    ],
    sections: [
      {
        heading: "Dónde destaca la investigación manual",
        paragraphs: [
          "Las personas interpretan posicionamientos ambiguos, reconocen modelos inusuales, juzgan si una señal es relevante y se adaptan a mercados nuevos. La revisión manual es valiosa para cuentas estratégicas, segmentos desconocidos y mensajes con afirmaciones importantes.",
          "El trabajo manual también ayuda a diseñar el proceso. Antes de automatizar un criterio, entiende cómo lo aplica un investigador y dónde aparecen excepciones.",
        ],
      },
      {
        heading: "Dónde crea ventaja la automatización",
        paragraphs: [
          "Los sistemas son adecuados para descubrimiento amplio, recolección repetitiva, formatos estándar, deduplicación, validaciones básicas y scores consistentes. Aplican las mismas reglas sin fatiga y crean una cola para revisión.",
          "También mejoran la observabilidad: fuentes, fechas, decisiones y motivos de rechazo quedan más estructurados que en pestañas y hojas de cálculo.",
        ],
        points: [
          "Automatiza tareas reversibles y de gran volumen.",
          "Revisa cuentas valiosas o de baja confianza.",
          "Exige aprobación antes de comunicar.",
          "Usa correcciones para mejorar las reglas.",
        ],
      },
      {
        heading: "Calcula el coste oculto",
        paragraphs: [
          "La investigación manual cuesta más que horas. Puede crear cobertura desigual, decisiones no documentadas, actualizaciones lentas y dependencia de hábitos. La automatización también cuesta: configuración, seguimiento, proveedores, falsa confianza y mantenimiento.",
          "Compara coste por cuenta aceptada, no por fila recopilada. La lista más barata se vuelve cara si ventas pasa horas rechazando o corrigiendo.",
        ],
      },
      {
        heading: "Adopta un modelo híbrido por etapas",
        paragraphs: [
          "Empieza con descubrimiento y validación básica automatizados. Enriquece y puntúa solo cuentas elegibles. Envía las mejores o estratégicas a revisión humana y prepara outreach con evidencia aprobada.",
          "Amplía la automatización una etapa cada vez. Mantén revisiones por muestra incluso en flujos maduros para ver desvíos de calidad.",
        ],
      },
    ],
    conclusion: {
      heading: "Automatiza la repetición; conserva la responsabilidad",
      paragraphs: [
        "La mejor operación no maximiza automatización. Coloca el criterio humano donde cambia el resultado y usa sistemas para hacer todo lo demás más rápido, consistente y fácil de mejorar.",
      ],
    },
  },
  "b2b-sales-pipeline-guide": {
    title: "Cómo Construir un Pipeline B2B del Mercado a la Oportunidad",
    description:
      "Diseña un pipeline B2B medible que conecte cuentas objetivo, calificación, outreach, conversaciones, oportunidades y aprendizaje.",
    category: "Estrategia de pipeline",
    keywords: [
      "pipeline de ventas B2B",
      "generación de pipeline",
      "etapas del pipeline",
      "calificación de cuentas",
      "proceso de ventas B2B",
    ],
    introduction: [
      "Un pipeline B2B es más que un conjunto de etapas. Es el sistema operativo que conecta una hipótesis de mercado con el aprendizaje de ingresos. Cada etapa debe representar un cambio en evidencia, responsabilidad o compromiso del comprador, no solo una actividad del vendedor.",
      "Las etapas claras muestran dónde se pierde calidad. Si las cuentas descubiertas rara vez pasan revisión, falla el objetivo. Si las calificadas no responden, pueden fallar posicionamiento o contacto. Si las reuniones no se convierten en oportunidades, revisa discovery y ajuste.",
    ],
    sections: [
      {
        heading: "Define criterios de entrada y salida",
        paragraphs: [
          "Nombra cada etapa y especifica qué debe cumplirse para entrar y salir. “Contactado” es una actividad; “engaged” debe exigir respuesta relevante. “Calificado” necesita ajuste verificado y problema plausible, no una impresión general.",
          "Mantén pocas etapas. Añade una solo cuando cambie la siguiente acción, el responsable, la previsión o la evidencia requerida.",
        ],
        points: [
          "Descubierta: cumple las restricciones básicas.",
          "Aceptada: la evidencia de ajuste pasó revisión.",
          "Engaged: una persona relevante respondió.",
          "Oportunidad: problema, valor y proceso están confirmados.",
        ],
      },
      {
        heading: "Conecta datos de cuenta con el pipeline",
        paragraphs: [
          "Conserva segmento de ICP, score, fuentes y contexto de outreach al llevar la cuenta al CRM. Así el equipo compara resultados por objetivo y entiende por qué se priorizó. Un pipeline sin contexto de adquisición no enseña al inicio del embudo.",
          "Define campos obligatorios por transición, pero con foco. Los datos deben apoyar una decisión o handoff, no crear trabajo administrativo sin fin.",
        ],
      },
      {
        heading: "Mide conversión y tiempo",
        paragraphs: [
          "Sigue cuántas cuentas avanzan y cuánto tardan. La conversión muestra calidad; el tiempo, fricción y capacidad. Segmenta por ICP, fuente, región, campaña y responsable cuando el volumen lo permita.",
          "Controla también motivos de rechazo, pérdida e inactividad. Una taxonomía clara convierte registros cerrados en feedback de mercado.",
        ],
      },
      {
        heading: "Haz una revisión enfocada",
        paragraphs: [
          "Una buena revisión pregunta qué cambió, qué evidencia sostiene la previsión, dónde están bloqueados los negocios y cuál es la próxima acción. También mira el inicio: ¿entran nuevas cuentas con la calidad y ritmo correctos?",
          "Elige pocos experimentos: estrechar un segmento, cambiar una regla o probar un ángulo. Asigna responsable y periodo.",
        ],
      },
    ],
    conclusion: {
      heading: "Haz que cada etapa enseñe a la siguiente",
      paragraphs: [
        "Un pipeline sano crea una cadena visible desde el mercado objetivo hasta el resultado del cliente. Criterios claros, datos conectados y feedback regular permiten encontrar la restricción real y mejorar sin perseguir actividad bruta.",
      ],
    },
  },
  "crm-data-quality-guide": {
    title: "Calidad de Datos en el CRM: Guía para Leads Listos para Ventas",
    description:
      "Mejora la calidad del CRM con responsabilidad clara, validación, deduplicación, fuentes y reglas de actualización.",
    category: "Calidad de datos",
    keywords: [
      "calidad de datos CRM",
      "leads listos para ventas",
      "gestión de datos de leads",
      "deduplicación CRM",
      "calidad de datos de cuenta",
    ],
    introduction: [
      "La calidad de datos no es una limpieza que termina. Es un conjunto de reglas operativas que mantiene cuentas y contactos suficientemente fiables para la siguiente decisión. Cuando los datos están incompletos, duplicados, antiguos o sin origen, ventas verifica el sistema en lugar de usarlo.",
      "El estándar correcto depende del flujo. Una cuenta recién descubierta necesita datos para revisar ajuste; una aprobada necesita evidencia para outreach; una oportunidad necesita información para handoff y previsión.",
    ],
    sections: [
      {
        heading: "Define una cuenta lista para ventas",
        paragraphs: [
          "Crea un estándar mínimo por etapa. En descubrimiento, incluye nombre normalizado, dominio, ubicación, fuente y evidencia básica. Antes del outreach, exige hechos verificados, canal relevante y responsable.",
          "No midas calidad solo por campos completos. Un campo lleno puede ser incorrecto, antiguo o irrelevante. Combina completitud con validez, frescura, unicidad y confianza.",
        ],
      },
      {
        heading: "Evita duplicados al entrar",
        paragraphs: [
          "Deduplicar es más fácil antes de que los registros se dispersen. Normaliza dominios, nombres, URLs, teléfonos y direcciones. Usa varias señales porque filiales, franquicias, redirecciones y nombres similares superan una regla única.",
          "Define cómo combinar registros y qué valor prevalece. Conserva fuentes y actividad para no borrar contexto útil.",
        ],
        points: [
          "Valida formatos antes de guardar.",
          "Normaliza valores antes de comparar.",
          "Cruza más de un identificador.",
          "Conserva el origen al combinar.",
        ],
      },
      {
        heading: "Asigna responsables y vigencia",
        paragraphs: [
          "Cada campo crítico necesita un responsable, incluso si lo proporciona la automatización. Alguien define fuente, validación, frecuencia y corrección. Los roles y contactos caducan antes que la identidad de empresa.",
          "Muestra la fecha de verificación cuando importe. Permite señalar errores en el flujo y devuelve las correcciones al proceso de enriquecimiento.",
        ],
      },
      {
        heading: "Supervisa la calidad en el uso",
        paragraphs: [
          "Los dashboards ayudan, pero muchos problemas aparecen al preparar un mensaje o avanzar un negocio. Sigue correcciones, rechazos, campos ausentes, canales inválidos y fusiones. Revisa muestras recientes.",
          "Prioriza por impacto. Un formato inconsistente incomoda; una empresa asociada al registro incorrecto puede dañar una relación. Corrige primero los controles que evitan errores graves.",
        ],
      },
    ],
    conclusion: {
      heading: "La confianza es la métrica real",
      paragraphs: [
        "Los datos listos para ventas son correctos, actuales y transparentes para actuar con confianza. Define calidad por etapa, previene errores al entrar, conserva fuentes e integra la corrección en el trabajo diario.",
      ],
    },
  },
  "multilingual-b2b-prospecting": {
    title: "Prospección B2B Multilingüe: Cómo Entrar en Nuevos Mercados",
    description:
      "Planifica prospección B2B multilingüe con targeting localizado, investigación, mensajes naturales, compliance y resultados comparables.",
    category: "Prospección global",
    keywords: [
      "prospección B2B multilingüe",
      "generación internacional de leads",
      "outreach localizado",
      "ventas B2B globales",
      "traducción de mensajes de ventas",
    ],
    introduction: [
      "La prospección multilingüe no es el mismo flujo con palabras traducidas. Los mercados difieren en estructura empresarial, datos, lenguaje, normas de comunicación y expectativas. Una campaña se vuelve local cuando objetivo, evidencia, oferta y tono tienen sentido juntos.",
      "La automatización ayuda a descubrir cuentas y preparar variantes, pero el conocimiento del mercado sigue siendo esencial. Empieza con una región enfocada y aprende antes de ampliar a muchos idiomas.",
    ],
    sections: [
      {
        heading: "Localiza el ICP antes que el mensaje",
        paragraphs: [
          "Comprueba si los criterios originales siguen siendo observables y relevantes. El tamaño puede informarse distinto, cambian los canales y un dolor urgente en una región puede ser secundario en otra. Consulta conocimiento local y revisa cuentas reales.",
          "Crea términos de búsqueda, categorías, exclusiones y ejemplos locales. Mantén visible la hipótesis central de valor para que la adaptación no se convierta en otro segmento.",
        ],
      },
      {
        heading: "Investiga con fuentes e idioma locales",
        paragraphs: [
          "Usa directorios regionales, mapas, sitios, plataformas de reseñas y redes profesionales fiables. Busca en el idioma de los clientes, incluidos términos locales. Una consulta solo en inglés puede perder buenas cuentas o entender mal su posición.",
          "Guarda el texto original junto a campos normalizados. La lengua de origen conserva matices para revisión y personalización.",
        ],
        points: [
          "Adapta vocabulario y categorías de búsqueda.",
          "Verifica nombres, acentos, roles y formatos regionales.",
          "Separa hechos de la fuente de resúmenes traducidos.",
          "Registra el idioma preferido por cuenta y contacto.",
        ],
      },
      {
        heading: "Traduce significado, tono y prueba",
        paragraphs: [
          "Un mensaje natural conserva la intención, no el orden de palabras. Revisa formalidad, longitud, expresiones, CTA y nivel de franqueza esperado. Mantén nombres de producto y términos técnicos consistentes, evitando jerga si existe una expresión local clara.",
          "Localiza también la prueba. Un caso, moneda, norma o resultado puede necesitar contexto. Nunca inventes prueba local; explica la conexión cuando el ejemplo provenga de otro mercado.",
        ],
      },
      {
        heading: "Compara mercados sin ocultar diferencias",
        paragraphs: [
          "Usa definiciones comunes del embudo y segmenta por país e idioma. Sigue aceptación, contactos alcanzables, respuestas positivas, reuniones, oportunidades y rechazos. Los ciclos varían; no juzgues un mercado por una sola tasa.",
          "Revisa privacidad, comunicación electrónica y reglas de plataformas antes del lanzamiento. El compliance es parte de estar listo para el mercado, no una tarea final de traducción.",
        ],
      },
    ],
    conclusion: {
      heading: "La relevancia local es la estrategia",
      paragraphs: [
        "La prospección multilingüe exitosa empieza con una hipótesis localizada y lleva ese contexto por descubrimiento, datos, mensajes y medición. La tecnología acelera; el aprendizaje cuidadoso genera confianza.",
      ],
    },
  },
}
