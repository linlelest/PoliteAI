export function GeometricBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-[0.04] dark:opacity-[0.06]">
      {/* Large circles */}
      <svg className="absolute -left-32 -top-32 h-[500px] w-[500px]" viewBox="0 0 500 500">
        <circle cx="250" cy="250" r="200" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="250" cy="250" r="140" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="250" cy="250" r="70" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Hexagon */}
      <svg className="absolute -bottom-20 -right-20 h-[400px] w-[400px]" viewBox="0 0 200 200">
        <polygon
          points="100,5 190,52.5 190,147.5 100,195 10,147.5 10,52.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <polygon
          points="100,30 165,62.5 165,137.5 100,170 35,137.5 35,62.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      {/* Small dots grid */}
      <svg className="absolute left-1/2 top-1/3 h-[200px] w-[200px] -translate-x-1/2" viewBox="0 0 100 100">
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 5 }).map((__, col) => (
            <circle
              key={`${row}-${col}`}
              cx={10 + col * 20}
              cy={10 + row * 20}
              r="1.5"
              fill="currentColor"
            />
          ))
        )}
      </svg>

      {/* Triangle */}
      <svg className="absolute right-1/4 top-1/4 h-[150px] w-[150px]" viewBox="0 0 100 100">
        <polygon points="50,5 95,90 5,90" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="50,25 78,75 22,75" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Cross pattern */}
      <svg className="absolute bottom-1/4 left-1/4 h-[120px] w-[120px]" viewBox="0 0 60 60">
        <line x1="30" y1="5" x2="30" y2="55" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="30" x2="55" y2="30" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="30" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Rhombus */}
      <svg className="absolute right-1/3 bottom-1/3 h-[100px] w-[100px]" viewBox="0 0 80 80">
        <polygon points="40,5 75,40 40,75 5,40" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="40,18 62,40 40,62 18,40" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  )
}