interface ContentWrapperProps {
  children: React.ReactNode
  narrow?: boolean
}

export function ContentWrapper({ children, narrow }: ContentWrapperProps) {
  return (
    <div
      className={`mx-auto px-6 md:px-8 py-8 ${
        narrow ? "max-w-2xl" : "max-w-[1400px]"
      }`}
    >
      {children}
    </div>
  )
}
