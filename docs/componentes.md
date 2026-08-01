<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cotton Candy Sky - Card con Imagen 75%</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .btn-gradient-candy {
            background: linear-gradient(135deg,
              #F8A8E8 0%,
              #FE98D6 25%,
              #FFA9BB 50%,
              #B8BAFD 75%,
              #AEDDFA 100%);
            background-size: 300% 300%;
            background-position: 0% 50%;
            transition: all 0.5s ease-in-out;
        }

        .btn-gradient-candy:hover {
            background-position: 100% 50%;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(248, 168, 232, 0.4), 0 8px 10px -6px rgba(184, 186, 253, 0.3);
        }

        .btn-gradient-candy:active {
            transform: translateY(0);
        }
    </style>
</head>

<body class="bg-[#FAF8FC] min-h-screen flex items-center justify-center p-6 text-[#2C1328]">
    <div
        class="max-w-md w-full h-[620px] bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-[#B8BAFD]/40 overflow-hidden flex flex-col">

        <div class="h-[75%] w-full relative overflow-hidden group">
            <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop"
                alt="Cotton Candy Sky"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        <div class="h-[25%] p-6 flex flex-col justify-between bg-white/50">
            <div>
                <h3 class="text-xl font-extrabold text-[#2C1328] leading-snug">
                    Sueños Pastel & Cielo Mágico
                </h3>
                <p class="text-[#4A2E46] text-xs mt-1 line-clamp-2">
                    Explora nuestra colección de diseños inspirados en atardeceres de algodón de azúcar.
                </p>
            </div>

            <button
                class="btn-gradient-candy text-[#2C1328] font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm tracking-wide w-full mt-2">
                <span>Crear</span>
            </button>
        </div>

    </div>

</body>

</html>