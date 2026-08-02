const features = [
  { icon: "✨", title: "Hecho con magia", text: "Cada historia es única y generada para vos." },
  { icon: "⚡", title: "Generación rápida", text: "Tu texto e imagen listos en menos de un minuto." },
  { icon: "📦", title: "Descarga tus archivos", text: "Llevá tu creación a donde quieras." },
  { icon: "🛡️", title: "Sin riesgo", text: "Si algo falla, reintentamos sin costo." }
];

export function Footer() {
  return (
    <footer className="border-t border-primary/20">
      <div className="container-x grid grid-cols-1 gap-8 py-10 text-center sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div key={feature.title}>
            <div className="text-primary" aria-hidden="true">
              {feature.icon}
            </div>
            <h5 className="mt-2 text-xs uppercase tracking-[1px] text-ink">
              {feature.title}
            </h5>
            <p className="mt-1 text-[11px] text-faint">{feature.text}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-primary/10 py-6 text-center text-xs text-muted">
        Random Dreams · historias alternativas generadas con IA
      </div>
    </footer>
  );
}
