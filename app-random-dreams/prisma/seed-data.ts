import type { Prisma } from "../lib/generated/prisma/client";

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
  imageUrl?: string;
};

export const products: ProductSeed[] = [
  {
    slug: "souvenir-de-vida-paralela",
    name: "Souvenirs de Sueños y Realidades Alternativas",
    tagline:
      "Fotografía e historia de tu vida en un universo paralelo donde elegiste otra vida.",
    description:
      "Contanos sobre tu vida real y el momento en que todo podría haber cambiado. Generaremos una crónica personal en primera persona de tu otra vida, junto con un retrato de la persona que habrías llegado a ser.",
    formSchema: {
      fields: [
        { name: "nombre", label: "Tu nombre", type: "text", required: true, maxLength: 60, placeholder: "Ej. Martín" },
        { name: "vida_real", label: "Tu vida real (carrera o país actual)", type: "text", required: true, maxLength: 120, placeholder: "Ej. soy contador viviendo en Argentina" },
        { name: "anios_despues", label: "¿Hace cuántos años te hubiera gustado cambiar?", type: "number", required: false, min: 1, max: 60, placeholder: "Ej. 10" },
        { name: "tono_relato", label: "Tono del relato", type: "select", required: true, options: ["Nostálgico", "Épico", "Humorístico", "Melancólico"] },
        { name: "estilo_retrato", label: "Estilo del retrato", type: "select", required: true, options: ["Pintura al óleo", "Fotografía realista", "Ilustración editorial"] }
      ]
    },
    aiTextTemplate:
      "Escribe una crónica personal de {nombre}, {anios_despues} años después de un punto de quiebre. Crea un universo paralelo donde no eligió ser {vida_real}. Relato en primera persona, tono {tono_relato}. Incluye detalles de su vida cotidiana, sus logros, sus dudas y una escena clave de ese universo. Formato de diario/crónica.",
    aiPromptTemplate:
      "Genera un retrato de {nombre} viviendo su vida en el universo paralelo donde no eligió ser {vida_real}. Estilo: {estilo_retrato}. Escena: un momento cotidiano significativo que refleje {tono_relato}, {anios_despues} años después del punto de quiebre. Ambientación coherente con la vida descrita. Alto detalle, composición tipo retrato/documental.",
    sortOrder: 1,
    imageUrl: "/assets/souvenir.jpg"
  },
  {
    slug: "quimera-de-biotopo",
    name: "Criatura fantástica",
    tagline:
      "Crea una criatura fantástica única",
    description:
      "Elegí los animales que la componen y su hábitat de adopción. Generaremos la ficha técnica de tu criatura imposible con su descripción física, su árbol genealógico y su manual de cuidados, más un render ilustrado para el museo.",
    formSchema: {
      fields: [
        { name: "nombre_criatura", label: "Nombre para la mascota", type: "text", required: true, maxLength: 40, placeholder: "Ej. Fénix del Pantano" },
        { name: "clima", label: "Clima preferido", type: "select", required: true, options: ["Tropical", "Desierto", "Tundra", "Selva", "Marino", "Montaña"] },
        { name: "agresividad", label: "Nivel de agresividad", type: "select", required: true, options: ["Dócil", "Travieso", "Territorial", "Peligroso"] },
      ]
    },
    aiTextTemplate:
      "Crea la ficha de adopción de la quimera {nombre_criatura}. Clima preferido: {clima}. Nivel de agresividad: {agresividad}. Incluye: descripción física, árbol genealógico, dieta absurda y manual de cuidados. Tono de catálogo científico de criaturas fantásticas con humor seco. Formato ficha técnica.",
    aiPromptTemplate:
      "Render 3D estilo ilustración científica de la criatura fantástica {nombre_criatura}, adaptada al clima {clima}, nivel de agresividad {agresividad}. Fondo de estudio de biología, anatomía detallada, luz neutra, etiqueta de espécimen en la esquina.",
    sortOrder: 2,
    imageUrl: "/assets/adopta.png"
  },
  {
    slug: "manual-de-contingencia-absurda",
    name: "Manual Absurdo",
    tagline:
      "Planes de evacuación personalizados por si tu vecindario es invadido. Consultoría de emergencia hiperlocal y disparatada.",
    description:
      "Amenazas improbables que acechan tu barrio y un manual institucional impecable de como actuar: instrucciones paso a paso, rutas ficticias de evacuación y protocolos por situación, con su mapa esquemático para colgar en la puerta.",
    formSchema: {
      fields: [
        { name: "ciudad", label: "Ciudad o dirección", type: "text", required: true, maxLength: 100, placeholder: "Ej. Barrio de La Boca, Buenos Aires" },
        { name: "nivel_detalle", label: "Nivel de detalle", type: "select", required: false, options: ["Rápido (1 página)", "Completo (2-3 páginas)", "Exhaustivo (protocolo completo)"] }
      ]
    },
    aiTextTemplate:
      "Redacta un manual de evacuación personalizado para {ciudad} ante una invasion absurda. Incluye: instrucciones paso a paso, cláusulas de seguridad, rutas ficticias de evacuación y protocolos por situación. Tono: Humor absurdo. Nivel de detalle: {nivel_detalle}. Formato de manual institucional con pasos numerados y advertencias.",
    aiPromptTemplate:
      "Genera un mapa esquemático de evacuación de {ciudad} ante la amenaza de una invasion absurda. Estilo: plano técnico / cartel institucional, con rutas marcadas, puntos de encuentro, leyendas y advertencias. Tono: Humor absurdo. Esquemático, limpio, alta legibilidad.",
    sortOrder: 3,
    imageUrl: "/assets/manual.png"
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
    sortOrder: 4,
    imageUrl: "/assets/ticket.jpg"
  },
  {
    slug: "formula-de-emociones",
    name: "Receta abstracta",
    tagline:
      "La fórmula molecular del Sabor del Fracaso o el aroma de la Nostalgia de 1998. Conceptos abstractos convertidos en productos consumibles.",
    description:
      "Recetas alquímicas completsa: ingredientes imposibles, instrucciones de preparación y advertencias, más el packaging listo para la estantería.",
    formSchema: {
      fields: [
        { name: "anio", label: "Año o recuerdo específico", type: "number", required: true, min: 1900, max: 2026, placeholder: "Ej. 1998" },
        { name: "tipo_producto", label: "Tipo de producto", type: "select", required: true, options: ["Perfume", "Golosina", "Bebida", "Plato", "Remedio alquímico"] },
        { name: "presentacion", label: "Presentación", type: "select", required: true, options: ["Frasco de vidrio", "Lata", "Botella", "Estuche", "Ampolla"] }
      ]
    },
    aiTextTemplate:
      'Redacta la receta alquímica de alguna emocion al azar del año (año: {anio}). Incluye: lista de ingredientes imposibles (ej. "3 gramos de lluvia de noviembre"), instrucciones de preparación paso a paso, método alquímico/gastronómico, advertencias y forma de consumo. Tipo de producto: {tipo_producto}. Tono: manual de laboratorio/fogón con poesía.',
    aiPromptTemplate:
      'Diseña el packaging de alguna emocion al azar del año ({anio}) como {tipo_producto} en presentación {presentacion}, listo en la estantería de un supermercado. Etiqueta con el nombre del producto, ingredientes imaginarios y fecha {anio}. Estilo de producto comercial con toque onírico/alquímico.',
    sortOrder: 5,
    imageUrl: "/assets/receta.jpg"
  },
  {
    slug: "mascota-epica",
    name: "Mascota Épica",
    tagline:
      "Tu mascota transformada en héroe de fantasía",
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
    sortOrder: 6,
    imageUrl: "/assets/mascota.png"
  }
];

