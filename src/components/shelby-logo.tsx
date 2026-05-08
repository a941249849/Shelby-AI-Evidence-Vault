interface ShelbyLogoProps {
  className?: string;
}

export default function ShelbyLogo({ className = 'h-10 w-10' }: ShelbyLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      role="img"
      aria-label="Shelby"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M30 6h36l23 23v38L66 90H30L7 67V29L30 6Z"
        fill="#2d211c"
        opacity="0.12"
      />
      <path
        d="M30 4h36l22 22v39L66 88H30L8 65V26L30 4Z"
        fill="#fff8ea"
        stroke="#2d211c"
        strokeOpacity="0.16"
        strokeWidth="2"
      />
      <path
        d="M33 14h30l16 16v31L63 78H33L17 61V30L33 14Z"
        fill="#dff2c8"
      />
      <path d="M33 14h30l16 16-46 48H17V30l16-16Z" fill="#efe2ff" opacity="0.82" />
      <path d="M79 30v31L63 78H33l46-48Z" fill="#ffe0cf" opacity="0.9" />
      <circle cx="48" cy="46" r="27" fill="#fff8ea" stroke="#157a4c" strokeWidth="4" />
      <path d="M30 63h28l8-13H38l8-13h25" fill="none" stroke="#2d211c" strokeWidth="9" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M34 63h22l5-8H39l8-13h20" fill="none" stroke="#fff8ea" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M37 65h17" stroke="#157a4c" strokeWidth="5" strokeLinecap="round" />
      <path d="M47 38h18" stroke="#ef6f4d" strokeWidth="5" strokeLinecap="round" />
      <path
        d="M71 24l5 5-5 5-5-5 5-5Z"
        fill="#f0c846"
        stroke="#2d211c"
        strokeOpacity="0.18"
      />
      <path
        d="M21 30 33 18h30"
        fill="none"
        stroke="#fff8ea"
        strokeOpacity="0.75"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
