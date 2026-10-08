export function Mascot({ message, celebrating = false }) {
  return (
    <div className="mascot-row">
      <svg
        className={`mascot ${celebrating ? 'is-celebrating' : ''}`}
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <ellipse cx="50" cy="90" rx="26" ry="5" fill="#000" opacity="0.08" />
        <path
          d="M50 10 C72 10 86 28 86 52 C86 74 70 90 50 90 C30 90 14 74 14 52 C14 28 28 10 50 10 Z"
          fill="url(#migo-grad)"
        />
        <circle cx="38" cy="50" r="6" fill="#231542" />
        <circle cx="64" cy="50" r="6" fill="#231542" />
        <circle cx="40" cy="48" r="2" fill="#fff" />
        <circle cx="66" cy="48" r="2" fill="#fff" />
        <path
          d="M40 64 Q50 73 60 64"
          stroke="#231542"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="26" cy="58" r="5" fill="#ff5d73" opacity="0.55" />
        <circle cx="74" cy="58" r="5" fill="#ff5d73" opacity="0.55" />
        <defs>
          <linearGradient id="migo-grad" x1="14" y1="10" x2="86" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      {message && <p className="speech-bubble">{message}</p>}
    </div>
  );
}
