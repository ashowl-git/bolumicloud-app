interface BoLumiCloudMarkProps {
  size?: number
  className?: string
}

export default function BoLumiCloudMark({ size = 24, className = '' }: BoLumiCloudMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* 수평 광선 */}
      <line
        x1="64" y1="256" x2="448" y2="256"
        stroke="currentColor" fill="none"
        strokeWidth={20} strokeLinecap="round"
      />
      {/* 렌즈 - 외곽 링 */}
      <circle
        cx="256" cy="256" r="100"
        stroke="currentColor" fill="none"
        strokeWidth={26}
      />
      {/* 렌즈 - 내부 코어 */}
      <circle
        cx="256" cy="256" r="40"
        stroke="#DC2626" fill="none"
        strokeWidth={24}
      />
      {/* 굴절선 */}
      <line
        x1="356" y1="256" x2="440" y2="196"
        stroke="#DC2626" fill="none"
        strokeWidth={18} strokeLinecap="round"
      />
      <line
        x1="356" y1="256" x2="440" y2="316"
        stroke="#DC2626" fill="none"
        strokeWidth={18} strokeLinecap="round"
      />
    </svg>
  )
}
