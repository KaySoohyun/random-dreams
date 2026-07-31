import type { Prisma } from "../lib/generated/prisma/client";

import type { FormField } from "../features/forms/types";
export type { FormField } from "../features/forms/types";

export type ProductSeed = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  formSchema: Prisma.InputJsonValue;
  aiTextTemplate: string;
  aiPromptTemplate: string;
  sortOrder: number;
};

export const products: ProductSeed[] = [
  {
    slug: "souvenir-de-vida-paralela",
    name: "Souvenir de Vida Paralela",
    tagline:
      "Fotografía e historia de tu vida en un universo paralelo donde elegiste otra carrera o país.",
    description:
      "Contanos sobre tu vida real y el momento en que todo podría haber cambiado. Generaremos una crónica personal en primera persona de tu otra vida, junto con un retrato de la persona que habrías llegado a ser.",
    formSchema: {
      fields: [
        { name: "nombre", label: "Tu nombre", type: "text", required: true, maxLength: 60, placeholder: "Ej. Martín" },
        { name: "vida_real", label: "Tu vida real (carrera o país actual)", type: "text", required: true, maxLength: 120, placeholder: "Ej. soy contador viviendo en Buenos Aires" },
        { name: "punto_quiebre", label: "El punto de quiebre", type: "text", required: true, maxLength: 160, placeholder: "Ej. el día que rechacé la beca para estudiar música" },
        { name: "camino_alternativo", label: "Lo que elegiste en ese universo paralelo", type: "text", required: true, maxLength: 160, placeholder: "Ej. me fui a estudiar piano a Viena" },
        { name: "anios_despues", label: "Años después del punto de quiebre", type: "number", required: false, min: 1, max: 60, placeholder: "Ej. 10" },
        { name: "tono_relato", label: "Tono del relato", type: "select", required: true, options: ["Nostálgico", "Épico", "Humorístico", "Melancólico"] },
        { name: "estilo_retrato", label: "Estilo del retrato", type: "select", required: true, options: ["Pintura al óleo", "Fotografía fotorrealista", "Ilustración editorial"] }
      ]
    },
    aiTextTemplate:
      "Escribe una crónica personal de {nombre}, {anios_despues} años después del punto de quiebre: {punto_quiebre}, en un universo paralelo donde eligió {camino_alternativo} en lugar de {vida_real}. Relato en primera persona, tono {tono_relato}. Incluye detalles de su vida cotidiana, sus logros, sus dudas y una escena clave de ese universo. Formato de diario/crónica.",
    aiPromptTemplate:
      "Genera un retrato de {nombre} viviendo su vida en el universo paralelo donde eligió {camino_alternativo}. Estilo: {estilo_retrato}. Escena: un momento cotidiano significativo que refleje {tono_relato}, {anios_despues} años después del punto de quiebre. Ambientación coherente con la vida descrita. Alto detalle, composición tipo retrato/documental.",
    sortOrder: 1
  },
  {
    slug: "quimera-de-biotopo",
    name: "Quimera de Biotopo",
    tagline:
      "Adoptá tu quimera: una criatura fantástica única, combinación de 2 o 3 animales, con su ficha de adopción completa.",
    description:
      "Elegí los animales que la componen y su hábitat de adopción. Generaremos la ficha técnica de tu criatura imposible con su descripción física, su árbol genealógico y su manual de cuidados, más un render ilustrado para el museo.",
    formSchema: {
      fields: [
        { name: "nombre_criatura", label: "Nombre de tu quimera (opcional)", type: "text", required: false, maxLength: 40, placeholder: "Ej. Fénix del Pantano" },
        { name: "animales", label: "Combinación de animales (elegí 2 o 3)", type: "multiselect", required: true, min: 2, max: 3, options: ["León", "Águila", "Serpiente", "Lobo", "Pulpo", "Cabra", "Pez", "Murciélago", "Tortuga", "Escorpión"] },
        { name: "clima", label: "Clima preferido", type: "select", required: true, options: ["Tropical", "Desierto", "Tundra", "Selva", "Marino", "Montaña"] },
        { name: "agresividad", label: "Nivel de agresividad", type: "select", required: true, options: ["Dócil", "Travieso", "Territorial", "Peligroso"] },
        { name: "habitat", label: "Hábitat de adopción", type: "select", required: false, options: ["Departamento", "Casa con jardín", "Reserva natural", "Fantasía libre"] }
      ]
    },
    aiTextTemplate:
      "Crea la ficha de adopción de la quimera {nombre_criatura}, resultado de la combinación de {animales}. Clima preferido: {clima}. Nivel de agresividad: {agresividad}. Incluye: descripción física, árbol genealógico, dieta absurda y manual de cuidados. Tono de catálogo científico de criaturas fantásticas con humor seco. Formato ficha técnica.",
    aiPromptTemplate:
      "Render 3D estilo ilustración científica de la criatura fantástica {nombre_criatura}, combinación de {animales}, adaptada al clima {clima}, nivel de agresividad {agresividad}. Fondo de estudio de biología, anatomía detallada, luz neutra, etiqueta de espécimen en la esquina.",
    sortOrder: 2
  },
  {
    slug: "manual-de-contingencia-absurda",
    name: "Manual de Contingencia Absurda",
    tagline:
      "Plan de evacuación personalizado si tu vecindario es invadido por [X]. Consultoría de emergencia hiperlocal y disparatada.",
    description:
      "Contanos la amenaza improbable que acecha tu barrio y recibí un manual institucional impecable: instrucciones paso a paso, rutas ficticias de evacuación y protocolos por situación, con su mapa esquemático para colgar en la puerta.",
    formSchema: {
      fields: [
        { name: "ciudad", label: "Ciudad o dirección", type: "text", required: true, maxLength: 100, placeholder: "Ej. Barrio de La Boca, Buenos Aires" },
        { name: "amenaza", label: "Tipo de amenaza", type: "text", required: true, maxLength: 80, placeholder: "Ej. patos gigantes, viajeros del tiempo desorientados, zombies victorianos" },
        { name: "tono_manual", label: "Tono del manual", type: "select", required: true, options: ["Formal y técnico", "Humor absurdo", "Apocalíptico serio", "Parodia institucional"] },
        { name: "nivel_detalle", label: "Nivel de detalle", type: "select", required: false, options: ["Rápido (1 página)", "Completo (2-3 páginas)", "Exhaustivo (protocolo completo)"] }
      ]
    },
    aiTextTemplate:
      "Redacta un manual de evacuación personalizado para {ciudad} ante la invasión de {amenaza}. Incluye: instrucciones paso a paso, cláusulas de seguridad, rutas ficticias de evacuación y protocolos por situación. Tono: {tono_manual}. Nivel de detalle: {nivel_detalle}. Formato de manual institucional con pasos numerados y advertencias.",
    aiPromptTemplate:
      "Genera un mapa esquemático de evacuación de {ciudad} ante la amenaza de {amenaza}. Estilo: plano técnico / cartel institucional, con rutas marcadas, puntos de encuentro, leyendas y advertencias. Tono: {tono_manual}. Esquemático, limpio, alta legibilidad.",
    sortOrder: 3
  },
  {
    slug: "identidad-secreta-de-epoca",
    name: "Identidad Secreta de Época",
    tagline:
      "Pase VIP a la nobleza del siglo XVIII o identidad encubierta de espía en la Guerra Fría. Una vida paralela completa en cualquier época.",
    description:
      "Elegí la época y el rol, y generaremos tu biografía histórica completa: pasado, enemigos, carta de recomendación de la realeza y el souvenir visual de tu identidad con sellos oficiales ficticios.",
    formSchema: {
      fields: [
        { name: "nombre", label: "Tu nombre en la identidad secreta", type: "text", required: true, maxLength: 60, placeholder: "Ej. Lord Alexander Whitmore" },
        { name: "epoca", label: "Época histórica", type: "select", required: true, options: ["Antiguo Egipto", "Imperio Romano", "Reino Medio", "Renacimiento", "Siglo XVIII", "Era Victoriana", "Guerra Fría", "Retrofuturismo"] },
        { name: "rol", label: "Rol en esa vida", type: "select", required: true, options: ["Nobleza", "Espía", "Pirata", "Artista", "Científico", "Mercader", "Cortesano"] },
        { name: "rasgo", label: "Rasgo de personalidad", type: "select", required: true, options: ["Audaz", "Misterioso", "Ingenioso", "Carismático", "Reservado", "Leal"] },
        { name: "tipo_documento", label: "Souvenir visual", type: "select", required: true, options: ["Retrato de época", "Documento de identidad antiguo", "Carta de recomendación de la realeza"] }
      ]
    },
    aiTextTemplate:
      "Compone la biografía completa de {nombre}, {rol} en la época {epoca}, con rasgo de personalidad {rasgo}. Incluye: biografía, árbol genealógico, lista de enemigos y carta de recomendación. Datos coherentes con la época. Formato documento histórico ficcional.",
    aiPromptTemplate:
      "Crea el souvenir visual de la identidad secreta de {nombre}: {tipo_documento}, de la época {epoca}. Rol: {rol}. Reflejar el rasgo {rasgo} en el retrato o la caligrafía. Incluir sellos oficiales ficticios y envejecimiento acorde a {epoca}. Alto detalle histórico.",
    sortOrder: 4
  },
  {
    slug: "formula-de-emociones",
    name: "Fórmula de Emociones",
    tagline:
      "La fórmula molecular del Sabor del Fracaso o el aroma de la Nostalgia de 1998. Conceptos abstractos convertidos en productos consumibles.",
    description:
      "Elegí la emoción, el año y el tipo de producto, y generaremos su receta alquímica completa: ingredientes imposibles, instrucciones de preparación y advertencias, más el packaging listo para la estantería.",
    formSchema: {
      fields: [
        { name: "emocion", label: "La emoción", type: "text", required: true, maxLength: 60, placeholder: "Ej. El Sabor del Fracaso, El aroma de la Nostalgia de 1998" },
        { name: "anio", label: "Año o recuerdo específico", type: "number", required: true, min: 1900, max: 2026, placeholder: "Ej. 1998" },
        { name: "tipo_producto", label: "Tipo de producto", type: "select", required: true, options: ["Perfume", "Golosina", "Bebida", "Plato", "Remedio alquímico"] },
        { name: "presentacion", label: "Presentación", type: "select", required: true, options: ["Frasco de vidrio", "Lata", "Botella", "Estuche", "Ampolla"] }
      ]
    },
    aiTextTemplate:
      'Redacta la receta alquímica del "{emocion}" (año: {anio}). Incluye: lista de ingredientes imposibles (ej. "3 gramos de lluvia de noviembre"), instrucciones de preparación paso a paso, método alquímico/gastronómico, advertencias y forma de consumo. Tipo de producto: {tipo_producto}. Tono: manual de laboratorio/fogón con poesía.',
    aiPromptTemplate:
      'Diseña el packaging de "{emocion}" ({anio}) como {tipo_producto} en presentación {presentacion}, listo en la estantería de un supermercado. Etiqueta con el nombre del producto, ingredientes imaginarios y fecha {anio}. Estilo de producto comercial con toque onírico/alquímico.',
    sortOrder: 5
  },
  {
    slug: "mascota-epica",
    name: "Mascota Épica",
    tagline:
      "Tu mascota transformada en héroe de fantasía: caballero, mago, vikingo o samurái.",
    description:
      "Contanos sobre tu mascota y el héroe que querés que sea. Generaremos su leyenda épica completa —origen, hazañas y anécdotas— y su ilustración heroica con los accesorios que elijas.",
    formSchema: {
      fields: [
        { name: "nombre_mascota", label: "Nombre de la mascota", type: "text", required: true, maxLength: 40, placeholder: "Ej. Loki" },
        { name: "especie", label: "Especie o raza", type: "text", required: true, maxLength: 60, placeholder: "Ej. Perro mestizo, gato persa…" },
        { name: "heroe", label: "Héroe a representar", type: "select", required: true, options: ["Caballero", "Mago", "Vikingo", "Samurái", "Paladín", "Explorador"] },
        { name: "estilo", label: "Estilo", type: "select", required: true, options: ["Realista heroico", "Cartoon", "Anime", "Acuarela"] },
        { name: "rasgo", label: "Rasgo característico", type: "text", required: true, maxLength: 80, placeholder: "Ej. un ojo celeste y el otro marrón" },
        { name: "accesorios", label: "Accesorios", type: "multiselect", required: false, options: ["Capa", "Casco", "Espada", "Varita", "Escudo", "Gafas", "Corona"] },
        { name: "fondo", label: "Fondo", type: "select", required: true, options: ["Castillo", "Bosque encantado", "Montañas nevadas", "Trono", "Campo de batalla"] }
      ]
    },
    aiTextTemplate:
      "Escribe la leyenda heroica de {nombre_mascota}, un/una {especie} transformado/a en {heroe} de fantasía. Rasgo característico: {rasgo}. Accesorios: {accesorios}. Fondo: {fondo}. Incluye: su origen, sus hazañas, su personalidad noble y valiente, y una anécdota con su guardián humano. Estilo: {estilo}. Formato de crónica épica legendaria.",
    aiPromptTemplate:
      "Ilustra a {nombre_mascota}, un/una {especie}, transformado/a en {heroe} de fantasía. Estilo: {estilo}. Rasgo característico: {rasgo}. Accesorios: {accesorios}. Fondo: {fondo}. Expresión noble y valiente, colores vibrantes, detalle alto, composición centrada.",
    sortOrder: 6
  }
];

