export function ScoreLeadLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path
        d="M7 6.5C7 4.567 8.567 3 10.5 3H14C16.209 3 18 4.791 18 7C18 9.209 16.209 11 14 11H10C7.791 11 6 12.791 6 15C6 17.209 7.791 19 10 19H13.5C15.433 19 17 20.567 17 22.5"
        stroke="url(#sGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
