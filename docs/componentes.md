<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuerdos de lo Inexistente</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Georgia', 'Times New Roman', serif;
        }

        body {
            background-color: #0b0f14;
            color: #d1d5db;
            line-height: 1.5;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* FONDO DIFUMINADO Y TRANSICIÓN */
        .background-blur {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            /* Usar tu imagen de fondo proporcionada */
            background-image: url('Gemini_Generated_Image_bm4movbm4movbm4m.png');
            /* Inserta la imagen codificada aquí */
            background-size: cover;
            background-position: center;
            filter: blur(2px);
            /* Nivel de desenfoque inicial */
            transition: filter 0.5s ease-in-out;
            /* Transición suave para el blur */
            z-index: -1;
        }

        /* SUPERPOSICIÓN OSCURA PARA TEXTO LEGIBLE */
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(11, 15, 20, 0.6);
            /* Superposición oscura al 60% */
            z-index: -1;
        }

        a {
            color: inherit;
            text-decoration: none;
        }

        /* HEADER & NAV */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 40px;
            position: sticky;
            top: 0;
            z-index: 100;
            background-color: rgba(11, 15, 20, 0.9);
            /* Header semi-transparente */
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo-icon {
            width: 40px;
            height: 40px;
            border: 1px solid #d4af37;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #d4af37;
            font-size: 18px;
        }

        .logo-text h1 {
            font-size: 14px;
            letter-spacing: 2px;
            color: #e2e8f0;
            text-transform: uppercase;
        }

        .logo-text p {
            font-size: 9px;
            color: #d4af37;
            letter-spacing: 1px;
        }

        nav ul {
            display: flex;
            list-style: none;
            gap: 25px;
        }

        nav a {
            font-size: 12px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #cbd5e1;
            transition: color 0.3s;
        }

        nav a:hover,
        nav a.active {
            color: #d4af37;
        }

        .nav-icons {
            display: flex;
            gap: 15px;
            color: #cbd5e1;
            font-size: 16px;
        }

        /* HERO SECTION */
        .hero {
            position: relative;
            height: 80vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 0 20px;
        }

        .hero h2 {
            font-size: 2.8rem;
            color: #f8fafc;
            font-weight: normal;
            margin-bottom: 10px;
        }

        .hero h2 span {
            color: #d4af37;
            display: block;
        }

        .hero p {
            font-size: 1.1rem;
            color: #94a3b8;
            margin-bottom: 30px;
        }

        .btn-gold {
            background-color: #d4af37;
            color: #0b0f14;
            padding: 12px 28px;
            border: none;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 2px;
            text-transform: uppercase;
            cursor: pointer;
            border-radius: 2px;
            transition: all 0.3s;
        }

        .btn-gold:hover {
            background-color: #fef08a;
            box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
        }

        /* MAIN CONTAINER */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        /* CATEGORIES GRID */
        .categories-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 50px;
        }

        .category-card {
            border: 1px solid rgba(212, 175, 55, 0.3);
            background: rgba(18, 24, 32, 0.6);
            padding: 15px;
            text-align: center;
            border-radius: 4px;
            transition: transform 0.3s, border-color 0.3s;
        }

        .category-card:hover {
            transform: translateY(-5px);
            border-color: #d4af37;
        }

        .card-img-placeholder {
            width: 100%;
            height: 180px;
            background-color: #1e293b;
            margin-bottom: 15px;
            border-radius: 2px;
            background-size: cover;
            background-position: center;
        }

        .category-card h3 {
            font-size: 14px;
            letter-spacing: 1.5px;
            color: #f1f5f9;
            margin-bottom: 8px;
            text-transform: uppercase;
        }

        .category-card p {
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 15px;
            min-height: 36px;
        }

        .card-link {
            font-size: 11px;
            color: #d4af37;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-weight: bold;
        }

        /* PROCESS STEPS */
        .process-banner {
            border: 1px solid rgba(212, 175, 55, 0.2);
            background: rgba(15, 21, 28, 0.8);
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            padding: 30px;
            margin-bottom: 50px;
            border-radius: 4px;
        }

        .process-step {
            display: flex;
            align-items: flex-start;
            gap: 15px;
        }

        .step-icon {
            color: #d4af37;
            font-size: 24px;
        }

        .step-content h4 {
            font-size: 13px;
            letter-spacing: 1.5px;
            color: #f1f5f9;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .step-content p {
            font-size: 12px;
            color: #64748b;
        }

        /* ADOPTION SECTION */
        .adoption-section {
            background: rgba(18, 24, 32, 0.4);
            border: 1px solid rgba(212, 175, 55, 0.2);
            padding: 30px;
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 30px;
            align-items: center;
            margin-bottom: 50px;
            border-radius: 4px;
        }

        .adoption-info h3 {
            font-size: 18px;
            letter-spacing: 1.5px;
            color: #f1f5f9;
            margin-bottom: 15px;
            text-transform: uppercase;
        }

        .adoption-info p {
            font-size: 13px;
            color: #94a3b8;
            margin-bottom: 20px;
        }

        .creatures-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }

        .creature-card {
            background: #282119;
            border: 1px solid #785a3c;
            padding: 12px;
            border-radius: 4px;
            color: #d4c5b9;
        }

        .creature-img {
            width: 100%;
            height: 120px;
            background-color: #3d3124;
            margin-bottom: 10px;
            border-radius: 2px;
        }

        .creature-card h4 {
            font-size: 12px;
            color: #d4af37;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .creature-card p {
            font-size: 10px;
            color: #a89a8b;
            line-height: 1.3;
        }

        /* FOOTER / FEATURES */
        .features-footer {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px 0;
            border-top: 1px solid rgba(212, 175, 55, 0.2);
            text-align: center;
        }

        .feature-item h5 {
            font-size: 12px;
            letter-spacing: 1px;
            color: #f1f5f9;
            margin-top: 8px;
            text-transform: uppercase;
        }

        .feature-item p {
            font-size: 11px;
            color: #64748b;
        }
    </style>
</head>

<body>

    <!-- FONDO DIFUMINADO -->
    <div class="background-blur"></div>
    <div class="overlay"></div>

    <!-- NAVBAR -->
    <header>
        <div class="logo">
            <div class="logo-icon">✧</div>
            <div class="logo-text">
                <h1>Recuerdos de lo Inexistente</h1>
                <p>TUS RECUERDOS. OTRO MUNDO. PARA SIEMPRE.</p>
            </div>
        </div>
    </header>

    <!-- HERO SECTION -->
    <section class="hero">
        <h2>Trae los recuerdos
            <span>Nosotros los hacemos eternos</span>
        </h2>
        <p>Productos mágicos de otro universo</p>

    </section>

    <!-- MAIN CONTENT -->
    <div class="container">

        <!-- CATEGORIES -->
        <section class="categories-grid">
            <div class="category-card">
                <div class="card-img-placeholder"></div>
                <h3>Recuerdos</h3>
                <p>Objetos, cartas y souvenirs de tu viaje.</p>
                <a href="#" class="card-link">Ver productos ➔</a>
            </div>
            <div class="category-card">
                <div class="card-img-placeholder"></div>
                <h3>Fotos</h3>
                <p>Imágenes que capturan lo que las palabras no pueden.</p>
                <a href="#" class="card-link">Ver fotos ➔</a>
            </div>
            <div class="category-card">
                <div class="card-img-placeholder"></div>
                <h3>Libros</h3>
                <p>Historias, guías y diarios de un mundo que no existe... o sí.</p>
                <a href="#" class="card-link">Ver libros ➔</a>
            </div>
            <div class="category-card">
                <div class="card-img-placeholder"></div>
                <h3>Recetas</h3>
                <p>Sabores y recetas de lugares lejanos y criaturas extraordinarias.</p>
                <a href="#" class="card-link">Ver recetas ➔</a>
            </div>
            <div class="category-card">
                <div class="card-img-placeholder"></div>
                <h3>Certificados</h3>
                <p>Certificados oficiales de adopción de criaturas fantásticas.</p>
                <a href="#" class="card-link">Ver certificados ➔</a>
            </div>
        </section>

        <!-- PROCESS -->
        <section class="process-banner">
            <div class="process-step">
                <div class="step-icon">☸</div>
                <div class="step-content">
                    <h4>Viaja</h4>
                    <p>Tú ya conoces este mundo. Nosotros te ayudamos a recordarlo.</p>
                </div>
            </div>
            <div class="process-step">
                <div class="step-icon">✦</div>
                <div class="step-content">
                    <h4>Elige</h4>
                    <p>Explora productos únicos inspirados en tu aventura.</p>
                </div>
            </div>
            <div class="process-step">
                <div class="step-icon">📦</div>
                <div class="step-content">
                    <h4>Personaliza</h4>
                    <p>Hazlo tuyo. Personalizamos cada detalle para ti.</p>
                </div>
            </div>
            <div class="process-step">
                <div class="step-icon">🎁</div>
                <div class="step-content">
                    <h4>Recibe</h4>
                    <p>Recibe un pedazo de tu viaje en el mundo real.</p>
                </div>
            </div>
        </section>

        <!-- ELIMINAR -->
        <section class="adoption-section">

            <div class="creatures-grid">
                <p><strong>Especie:</strong> Ignículo<br><strong>Origen:</strong> Volcán
                    Ámbar<br><strong>Temperamento:</strong> Juguetón</p>
            </div>

        </section>

        <!-- FOOTER FEATURES -->
        <footer class="features-footer">
            <div class="feature-item">
                <div style="color: #d4af37;">☕</div>
                <h5>Bebidas calientes</h5>
                <p>Para disfrutar en tu día a día.</p>
            </div>
            <div class="feature-item">
                <div style="color: #d4af37;">🌍</div>
                <h5>Envíos a todo el mundo</h5>
                <p>Llevamos tu recuerdo a donde estés.</p>
            </div>
            <div class="feature-item">
                <div style="color: #d4af37;">✨</div>
                <h5>Hecho con Magia</h5>
                <p>Cada producto es creado con amor y detalle.</p>
            </div>
            <div class="feature-item">
                <div style="color: #d4af37;">🛡️</div>
                <h5>Garantía de Por Vida</h5>
                <p>Protección mágica asegurada.</p>
            </div>
        </footer>

    </div>

</body>

</html>