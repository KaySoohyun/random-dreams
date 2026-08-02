### 1. "Souvenirs de Sueños y Realidades Alternativas"

En lugar de productos físicos, vendes recuerdos de cosas que nunca pasaron.

* **Producto:** *"Fotografía e historia de tu vida en un universo paralelo donde elegiste otra carrera/país"*.
* **Inputs del cliente:** Un par de datos sobre su vida real y el "punto de quiebre".
* **Lo que genera la IA:**
* **Texto:** Una crónica/diario redactado como si fuera de esa realidad.
* **Imagen:** Un retrato al óleo o fotografía fotorrealista de la escena en esa realidad paralela.
* **Portada:** Usar imagen ubicada en assets/souvenir.png

---

### 2. "Biotopo de Mascotas e Invertebrados Imposibles"

Un mercado negro ficticio o un catálogo de adopción de criaturas fantásticas únicas.

* **Producto:** *"Adoptar una quimera o criatura mitológica extinta"*.
* **Inputs del cliente:** Clima preferido, nivel de agresividad, combinación de 2 o 3 animales.
* **Lo que genera la IA:**
* **Texto:** Ficha de adopción, árbol genealógico, dieta absurda y manual de cuidados.
* **Imagen:** Render 3D estilo ilustración científica del espécimen.
* **Portada:** Usar imagen ubicada en assets/adopta.png


---

### 3. "Manuales de Contingencia para Situaciones Absurdas"

Servicio de consultoría y protocolos de emergencia hiperlocales y disparatados.

* **Producto:** *"Plan de evacuación personalizado si tu vecindario es invadido por [X evento/monstruo]"*.
* **Inputs del cliente:** Dirección o ciudad, tipo de amenaza (ej. *patos gigantes*, *viajeros del tiempo desorientados*, *zombies victorianos*).
* **Lo que genera la IA:**
* **Texto:** Un manual de instrucciones paso a paso con cláusulas de seguridad y rutas ficticias.
* **Imagen/Mapa:** Un mapa esquemático o ilustración del protocolo de emergencia.
* **Portada:** Usar imagen ubicada en assets/manual.png

---

### 4. "Identidades Secretas y Alter Egos Históricos"

Compra una vida paralela completa en cualquier época de la historia.

* **Producto:** *"Pase VIP a la nobleza del siglo XVIII" / "Identidad encubierta de espía en la Guerra Fría"*.
* **Inputs del cliente:** Nombre, época histórica favorita y un rasgo de personalidad.
* **Lo que genera la IA:**
* **Texto:** Biografía completa, árbol genealógico, lista de enemigos y carta de recomendación de la realeza.
* **Imagen:** Retrato de época adaptado o documento de identidad antiguo con sello oficial ficticio.
* **Portada:** Usar imagen ubicada en assets/ticket.png

---

### 5. "Recetas y Fórmulas Químicas de Emociones"

Transformar conceptos abstractos en productos "consumibles".

* **Producto:** *"La fórmula molecular e instrucciones de preparación del 'Sabor del Fracaso' o 'El aroma de la Nostalgia de 1998'"*.
* **Inputs del cliente:** Una emoción y un año específico.
* **Lo que genera la IA:**
* **Texto:** Receta alquímica/gastronómica imposible (con ingredientes como "3 gramos de lluvia de noviembre").
* **Imagen:** Diseño del frasco/packaging del producto terminado como si estuviera en la estantería de un supermercado.
* **Portada:** Usar imagen ubicada en assets/recetas.jpg

---

### 6. Mascota Épica

La mascota del usuario transformada en héroe de fantasía (caballero, mago, vikingo, samurái…).

**Formulario (`formSchema`):**

```json
{
  "fields": [
    { "name": "nombre_mascota", "label": "Nombre de la mascota", "type": "text", "required": true, "maxLength": 40, "placeholder": "Ej. Loki" },
    { "name": "especie", "label": "Especie o raza", "type": "text", "required": true, "maxLength": 60, "placeholder": "Ej. Perro mestizo, gato persa…" },
    { "name": "heroe", "label": "Héroe a representar", "type": "select", "required": true, "options": ["Caballero", "Mago", "Vikingo", "Samurái", "Paladín", "Explorador"] },
    { "name": "estilo", "label": "Estilo", "type": "select", "required": true, "options": ["Realista heroico", "Cartoon", "Anime", "Acuarela"] },
    { "name": "rasgo", "label": "Rasgo característico", "type": "text", "required": true, "maxLength": 80, "placeholder": "Ej. un ojo celeste y el otro marrón" },
    { "name": "accesorios", "label": "Accesorios", "type": "multiselect", "required": false, "options": ["Capa", "Casco", "Espada", "Varita", "Escudo", "Gafas", "Corona"] },
    { "name": "fondo", "label": "Fondo", "type": "select", "required": true, "options": ["Castillo", "Bosque encantado", "Montañas nevadas", "Trono", "Campo de batalla"] }
  ]
}
```

**Plantilla de prompt (`aiPromptTemplate`):**

```
Ilustra a {nombre_mascota}, un/una {especie}, transformado/a en {heroe} de fantasía. Estilo: {estilo}. Rasgo característico: {rasgo}. Accesorios: {accesorios}. Fondo: {fondo}. Expresión noble y valiente, colores vibrantes, detalle alto, composición centrada.
```

* **Portada:** Usar imagen ubicada en assets/mascota.png