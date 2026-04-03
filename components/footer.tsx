import { ScoreLeadLogo } from "./scorelead-logo"

export function Footer() {
  const footerLinks = {
    Product: ["Features", "Pricing", "Changelog", "Integrations", "Security"],
    Resources: ["Documentation", "API Reference", "Guides", "Status"],
    Company: ["About", "Blog", "Careers", "Customers"],
    Legal: ["Privacy", "Terms", "DPA", "Security"],
    Connect: ["Contact us", "X (Twitter)", "LinkedIn", "GitHub"],
  }

  return (
    <footer className="border-t border-zinc-800 py-16 px-6" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <ScoreLeadLogo className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">ScoreLead</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-medium text-sm mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
