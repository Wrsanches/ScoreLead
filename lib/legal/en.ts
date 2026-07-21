import type { LegalDocumentContent, LegalDocumentKey } from "./types"

const shared = {
  updatedLabel: "Effective and last updated:",
  updatedDate: "July 20, 2026",
  tocLabel: "On this page",
  homeLabel: "Back to ScoreLead",
  contactLabel: "Questions or privacy requests?",
  contactDescription:
    "Contact us from the email associated with your account so we can respond and, when necessary, verify your request.",
} as const

export const legalContentEn: Record<LegalDocumentKey, LegalDocumentContent> = {
  privacy: {
    ...shared,
    eyebrow: "Legal · Privacy",
    title: "Privacy Policy",
    description:
      "This policy explains what information ScoreLead handles, why we use it, who we share it with, and the choices and rights available to you.",
    sections: [
      {
        id: "scope-and-roles",
        title: "Scope and our role",
        paragraphs: [
          "This Privacy Policy applies to the ScoreLead website, applications, support channels, and related services. “ScoreLead,” “we,” “us,” and “our” refer to the provider of those services.",
          "For account, website, billing, and direct relationship data, ScoreLead generally acts as a data controller. When a customer uploads, discovers, enriches, or uses lead and messaging data through the service, that customer generally determines the purpose and means of processing and acts as the controller; ScoreLead processes that data on the customer’s instructions as a processor or service provider. The exact role can depend on the context and applicable law.",
        ],
      },
      {
        id: "information-we-collect",
        title: "Information we collect",
        paragraphs: [
          "We collect information you provide, information created through your use of the service, information received from connected services, and business information from public or licensed sources.",
        ],
        bullets: [
          "Account and authentication data, such as name, email address, password credentials in protected form, profile image, email-verification status, authentication provider identifiers, sessions, IP address, and user agent.",
          "Business profile and workspace data, including company name, website, location, industry, service area, brand details, social links, buyer personas, search preferences, and content supplied by users.",
          "Lead and prospect data, such as business names, websites, business contact details, locations, reviews, social profiles, services, team information, decision-maker details, enrichment sources, notes, scores, pipeline status, and outreach drafts. This data may be supplied by a customer or found in public and licensed business-data sources.",
          "AI and generated-content data, including instructions, source material, summaries, scores, messages, content plans, images, and feedback used to provide requested features.",
          "WhatsApp Business data, including connected WhatsApp Business Account and phone-number identifiers, encrypted access tokens, approved template metadata, sending settings, marketing-consent records and evidence, approved sequence snapshots, recipient numbers, rendered messages, Meta message identifiers, delivery status, errors, and inbound replies needed to pause automation and hand off the conversation.",
          "Subscription and billing data, including plan, subscription status, billing interval, customer and subscription identifiers, and payment events. Payment card details are collected and processed by our payment provider, not stored by ScoreLead in full.",
          "Communications, including contact-form submissions, waitlist entries, support requests, and emails you send us.",
          "Usage, device, and security data, including feature use, usage counters, logs, timestamps, approximate location inferred from IP, cookies, and similar technologies. Optional analytics is loaded only after the site records your consent.",
        ],
      },
      {
        id: "sources",
        title: "Where information comes from",
        bullets: [
          "You, your organization, and other authorized workspace users.",
          "Connected services, including Google authentication, payment providers, Meta and WhatsApp, and services you ask us to integrate.",
          "Public business websites, maps, directories, social profiles, search results, and public records.",
          "Licensed business-data, search, enrichment, hosting, analytics, and infrastructure providers.",
          "Your browser and device when you use ScoreLead.",
        ],
        note:
          "A phone number or other contact detail appearing publicly does not by itself establish consent to receive marketing messages. Customers must establish their own lawful basis and, for automated WhatsApp outreach, record a valid opt-in before sending.",
      },
      {
        id: "how-we-use-data",
        title: "How and why we use information",
        bullets: [
          "Provide, operate, personalize, and improve ScoreLead, including discovery, enrichment, scoring, AI generation, exports, and outreach workflows.",
          "Authenticate users, maintain sessions, manage accounts and workspaces, and provide customer support.",
          "Process subscriptions, prevent fraud, enforce plan limits, and maintain financial records.",
          "Connect customer-owned WhatsApp Business accounts, synchronize approved templates, schedule approved sequences, deliver messages, process delivery events, and stop automation when consent is revoked or a reply arrives.",
          "Protect the service, investigate misuse, debug failures, preserve audit records, and comply with legal obligations.",
          "Send transactional communications and, where permitted, product or marketing communications that can be opted out of.",
          "Produce aggregated or de-identified statistics that do not reasonably identify an individual.",
        ],
        paragraphs: [
          "Depending on the context and applicable law, we rely on performance of a contract, legitimate interests, consent, compliance with law, or another lawful basis. Where consent is the basis, it may be withdrawn, although prior lawful processing remains valid.",
        ],
      },
      {
        id: "customer-responsibilities",
        title: "Customer-controlled lead and messaging data",
        paragraphs: [
          "Customers are responsible for the data they place in ScoreLead and for instructions they give us. This includes confirming that collection, enrichment, export, and outreach are permitted; providing required notices; honoring objections and opt-outs; and maintaining any consent or other lawful basis required for contact.",
          "For WhatsApp marketing automation, ScoreLead is designed to require an approved message sequence, a current recorded opt-in, an approved Meta template, a connected business account, and send-time guardrails. These controls support compliance but do not replace the customer’s legal responsibilities or Meta’s rules.",
        ],
        links: [
          {
            label: "WhatsApp Business Messaging Policy",
            href: "https://business.whatsapp.com/policy",
            external: true,
          },
        ],
      },
      {
        id: "ai-and-automation",
        title: "AI and automated processing",
        paragraphs: [
          "ScoreLead uses artificial intelligence providers to analyze business information and generate summaries, lead scores, outreach drafts, content, and images. Relevant prompts, instructions, and source data may be sent to those providers to fulfill a request. We configure and select providers with data protection in mind, but their processing is also governed by our agreements with them.",
          "AI output can be incomplete, outdated, or inaccurate. Users must review output before relying on or sending it. ScoreLead does not use an AI-generated lead score by itself to make legal or similarly significant decisions about an individual on our own behalf.",
        ],
      },
      {
        id: "sharing",
        title: "How we disclose information",
        paragraphs: [
          "We do not sell personal information for money. We disclose information only as needed to operate the service, follow customer instructions, complete a transaction, protect rights and safety, or comply with law.",
        ],
        bullets: [
          "Service providers for cloud hosting, databases, file storage, security, authentication, email, analytics, customer support, search, enrichment, AI, and payment processing.",
          "Meta and WhatsApp when a customer connects an account or sends messages through the WhatsApp Business Platform.",
          "Authorized users of the same customer workspace and recipients chosen by the customer.",
          "Professional advisers, auditors, insurers, authorities, or courts when reasonably necessary or legally required.",
          "A successor or participant in a merger, financing, reorganization, acquisition, or sale of assets, subject to appropriate confidentiality and notice requirements.",
        ],
      },
      {
        id: "international-transfers",
        title: "International data transfers",
        paragraphs: [
          "ScoreLead and its providers may process information in countries other than the country where it was collected. Privacy laws in those countries may differ. Where required, we use contractual, organizational, or other lawful safeguards for international transfers and make additional information available on request.",
        ],
      },
      {
        id: "retention",
        title: "Retention",
        paragraphs: [
          "We keep information only for as long as reasonably needed to provide the service, maintain the customer relationship, meet legal and accounting obligations, resolve disputes, enforce agreements, protect the service, and preserve necessary audit trails. Retention depends on the type of information and why it is processed.",
          "When an account or integration is disconnected, we delete or de-identify information when it is no longer needed, subject to legal holds, fraud and security records, billing records, consent and opt-out evidence, and limited residual copies in protected backups that expire through ordinary backup cycles.",
        ],
      },
      {
        id: "security",
        title: "Security",
        paragraphs: [
          "We use administrative, technical, and organizational safeguards intended to protect information, including access controls, encrypted transport, protected credentials, and encryption of WhatsApp business access tokens at rest. No system is completely secure, and we cannot guarantee that unauthorized access or loss will never occur.",
          "You are responsible for using a strong password, protecting your devices and credentials, limiting workspace access, and notifying us promptly if you suspect unauthorized use.",
        ],
      },
      {
        id: "rights",
        title: "Your privacy rights",
        paragraphs: [
          "Depending on where you live and how ScoreLead processes your information, you may have rights to receive information about processing; confirm whether we process your data; access, correct, update, anonymize, block, delete, or port data; object to or restrict certain processing; withdraw consent; opt out of marketing; request review of certain automated decisions; and complain to a data protection authority.",
          "We may need to verify your identity and authority before completing a request. Some rights are subject to exceptions, including where information must be retained by law, for security, to protect others, or to establish or defend legal claims. If ScoreLead processes your data solely for a customer, we may direct the request to that customer or assist them in responding.",
        ],
        links: [{ label: "Data deletion instructions", href: "/data-deletion" }],
      },
      {
        id: "cookies",
        title: "Cookies and analytics",
        paragraphs: [
          "ScoreLead uses necessary browser storage and cookies for authentication, security, preferences, and application functions. Our public site also offers optional analytics. Those analytics tools are not loaded unless the site records an accepted cookie choice. You can decline optional analytics in the cookie notice and can clear site storage in your browser to reset that choice.",
        ],
      },
      {
        id: "children",
        title: "Children",
        paragraphs: [
          "ScoreLead is a business service and is not directed to children under 18. We do not knowingly request that children create accounts. If you believe a child has provided personal information to us, contact us so we can investigate and take appropriate action.",
        ],
      },
      {
        id: "changes-and-contact",
        title: "Changes and contact",
        paragraphs: [
          "We may update this policy as the service, providers, or legal requirements change. We will post the revised version here, change the effective date, and provide additional notice when a change is material and applicable law requires it.",
          "Questions, complaints, and privacy-rights requests can be sent to hello@scorelead.io. Please describe your relationship with ScoreLead and the request clearly. You may also contact the data protection authority in your jurisdiction.",
        ],
      },
    ],
  },

  terms: {
    ...shared,
    eyebrow: "Legal · Terms",
    title: "Terms of Service",
    description:
      "These terms govern access to and use of ScoreLead, including its lead discovery, AI, content, billing, and outreach features.",
    sections: [
      {
        id: "agreement",
        title: "Agreement to these terms",
        paragraphs: [
          "By creating an account, accessing, or using ScoreLead, you agree to these Terms of Service and our Privacy Policy. If you use ScoreLead for an organization, you represent that you are authorized to bind that organization, and “you” includes the organization.",
          "If you do not agree, do not use the service. Additional written order forms or service terms may apply; if they conflict with these terms, the more specific signed terms control for that conflict.",
        ],
        links: [{ label: "Privacy Policy", href: "/privacy" }],
      },
      {
        id: "eligibility-and-accounts",
        title: "Eligibility and accounts",
        paragraphs: [
          "You must be at least 18 and legally able to enter a binding agreement. Account information must be accurate and kept current. You are responsible for safeguarding credentials, activity under your account, and access granted to your organization’s users.",
          "Tell us promptly about suspected unauthorized access. You may not share an account in a way that circumvents plan limits or impersonate another person or organization.",
        ],
      },
      {
        id: "the-service",
        title: "The service",
        paragraphs: [
          "ScoreLead helps businesses discover and enrich business leads, organize pipelines, generate AI-assisted content and outreach, export data, and, where enabled, connect customer-owned services such as WhatsApp Business. Features may be added, changed, limited, or retired as the product evolves.",
          "Beta, preview, or experimental features may be less reliable and can change without notice. We do not promise that any particular lead, contact detail, score, output, integration, or business result will be available, complete, current, or successful.",
        ],
      },
      {
        id: "plans-and-billing",
        title: "Plans, billing, and cancellation",
        paragraphs: [
          "Some features are free and others require a paid subscription. Prices, included usage, billing interval, taxes, and renewal terms are shown before purchase or in an applicable order form. Paid subscriptions renew automatically until canceled unless the checkout terms state otherwise.",
          "You authorize our payment provider to charge the selected payment method. You can cancel a subscription through the available account or billing controls; cancellation generally takes effect at the end of the current paid period. Fees are non-refundable except where the purchase terms or mandatory law provide otherwise. We may change future prices with advance notice required by law.",
        ],
      },
      {
        id: "customer-data",
        title: "Your data and content",
        paragraphs: [
          "You retain ownership of data, prompts, business materials, and content you submit to ScoreLead. You grant us a limited, worldwide right to host, copy, process, transmit, and display that material only as needed to provide, secure, support, and improve the service and to follow your instructions.",
          "You represent that you have the rights, notices, permissions, and lawful basis needed for the data you provide and the ways you instruct ScoreLead to process it. Do not upload sensitive personal data, confidential information, or regulated data unless the service expressly supports it and you have an appropriate agreement and lawful basis.",
        ],
      },
      {
        id: "leads-and-outreach",
        title: "Lead data and outreach compliance",
        paragraphs: [
          "Business information found on public websites, maps, directories, or data services may be inaccurate and does not by itself give permission to contact a person. You must verify data before use and comply with privacy, direct-marketing, telemarketing, consumer-protection, anti-spam, and industry rules that apply to you and your recipients.",
          "You are solely responsible for deciding whom to contact, the lawful basis for contact, the content and timing of communications, required identification and disclosures, and honoring objections, suppression lists, and opt-outs. ScoreLead may apply limits or block activity intended to protect recipients and the service.",
        ],
      },
      {
        id: "whatsapp",
        title: "WhatsApp Business features",
        paragraphs: [
          "If you connect WhatsApp Business, you authorize ScoreLead to access the selected customer-owned WhatsApp Business assets and act on your approved instructions through Meta’s platform. You remain responsible for your WhatsApp Business Account, recipient opt-ins, approved templates, message content, fees charged by Meta or other providers, and compliance with all WhatsApp and Meta terms and policies.",
          "Automated WhatsApp sending requires a current recorded marketing opt-in and an approved sequence, but these technical controls do not prove that consent is legally valid. A recipient reply may pause automation, and recognized opt-out messages may revoke the recorded consent and cancel pending messages. You must monitor handoffs and honor all opt-outs, including those expressed in other words or channels.",
        ],
        links: [
          {
            label: "WhatsApp Business Messaging Policy",
            href: "https://business.whatsapp.com/policy",
            external: true,
          },
        ],
      },
      {
        id: "ai-output",
        title: "AI-generated output",
        paragraphs: [
          "AI features can produce inaccurate, incomplete, biased, or inappropriate output. You must review and approve output before relying on, publishing, or sending it. Do not treat AI output as legal, financial, medical, or other professional advice.",
          "You are responsible for ensuring that prompts and output do not violate privacy, confidentiality, intellectual-property, advertising, or other rights. Similar output may be generated for other users, and we do not guarantee that output is unique or eligible for intellectual-property protection.",
        ],
      },
      {
        id: "acceptable-use",
        title: "Acceptable use",
        paragraphs: ["You may use ScoreLead only lawfully and in accordance with these terms. You must not:"],
        bullets: [
          "Send spam, harassment, deceptive messages, unlawful discrimination, threats, malware, or content that exploits or endangers people.",
          "Contact recipients without required consent or another valid lawful basis, conceal your identity, evade opt-outs, or bypass sending and plan limits.",
          "Collect, infer, upload, or use sensitive data in a manner prohibited by law or target children with lead-generation or marketing activities.",
          "Infringe privacy, publicity, confidentiality, intellectual-property, or other rights.",
          "Probe, disrupt, reverse engineer, scrape, overload, or gain unauthorized access to the service, except to the extent a restriction is prohibited by law.",
          "Resell, sublicense, or provide access to ScoreLead except as expressly permitted, or use it to build a competing product from non-public aspects of the service.",
          "Use the service for illegal goods, fraud, or activities prohibited by an applicable platform provider.",
        ],
      },
      {
        id: "third-party-services",
        title: "Third-party services",
        paragraphs: [
          "ScoreLead interoperates with third-party services such as authentication, payments, search, maps, data enrichment, AI, storage, email, analytics, Meta, and WhatsApp. Your use of those services may be governed by their own terms and privacy policies. We are not responsible for third-party services, their availability, or changes they make.",
          "You authorize us to exchange data with a connected service as needed to perform your request. Removing access or a third party changing its API can cause a feature to stop working.",
        ],
      },
      {
        id: "intellectual-property",
        title: "ScoreLead intellectual property",
        paragraphs: [
          "ScoreLead and its software, design, documentation, trademarks, and other service materials are owned by us or our licensors and are protected by law. Subject to these terms, we grant you a limited, non-exclusive, non-transferable, revocable right to use the service during your authorized subscription or account term.",
          "If you provide feedback, you allow us to use it without restriction or compensation, provided we do not identify you publicly without permission.",
        ],
      },
      {
        id: "confidentiality-and-security",
        title: "Confidentiality and security",
        paragraphs: [
          "Each party will use reasonable care to protect the other party’s non-public confidential information and use it only for the relationship, except for information that is public without breach, already lawfully known, independently developed, or lawfully received from another source. Required legal disclosures may be made with notice when permitted.",
          "You must maintain appropriate security for your account, exports, connected accounts, and recipient data. Notify us promptly of a suspected compromise that may affect ScoreLead.",
        ],
      },
      {
        id: "suspension-and-termination",
        title: "Suspension and termination",
        paragraphs: [
          "You may stop using ScoreLead at any time and may cancel paid plans using the available controls. We may limit or suspend access when reasonably necessary to address a security risk, unlawful activity, non-payment, policy violation, harm to recipients or third parties, platform-provider requirement, or material breach.",
          "We may terminate an account for a material or repeated breach and, where practical, will provide notice and an opportunity to cure. On termination, your right to use the service ends. Provisions that by their nature should survive—including payment obligations, ownership, disclaimers, liability limits, and dispute terms—will survive.",
        ],
      },
      {
        id: "disclaimers",
        title: "Disclaimers",
        paragraphs: [
          "To the maximum extent permitted by law, ScoreLead is provided “as is” and “as available.” We disclaim implied warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted or error-free operation. We do not warrant data accuracy, deliverability, regulatory compliance, recipient response, revenue, or any particular business outcome.",
          "Some jurisdictions do not allow certain disclaimers, so parts of this section may not apply to you. Nothing in these terms excludes rights that cannot lawfully be excluded.",
        ],
      },
      {
        id: "liability",
        title: "Limitation of liability",
        paragraphs: [
          "To the maximum extent permitted by law, neither party will be liable for indirect, incidental, special, exemplary, punitive, or consequential damages, or for lost profits, revenue, goodwill, business opportunity, or data, arising from the service, even if advised that such harm was possible.",
          "To the maximum extent permitted by law, ScoreLead’s aggregate liability arising out of the service will not exceed the amount you paid ScoreLead for the service during the 12 months before the event giving rise to the claim, or USD 100 if you used only a free service. These limits do not apply where liability cannot legally be limited.",
        ],
      },
      {
        id: "indemnity",
        title: "Indemnity",
        paragraphs: [
          "To the extent permitted by law, you will defend and indemnify ScoreLead and its personnel against third-party claims, losses, and reasonable costs arising from your data, your outreach or messages, your connected accounts, your violation of law or platform rules, or your material breach of these terms. This does not require indemnification for harm caused by ScoreLead’s own unlawful conduct.",
        ],
      },
      {
        id: "changes-and-law",
        title: "Changes, governing law, and disputes",
        paragraphs: [
          "We may update these terms to reflect product, provider, or legal changes. We will post the new terms and update the effective date, and we will give additional notice of material changes when required. Continued use after the effective date constitutes acceptance where permitted by law.",
          "Any signed order form identifies the governing law and forum for that agreement. Otherwise, applicable governing law and venue will be determined by mandatory law and the location of ScoreLead’s principal establishment, without limiting consumer or data-protection rights that cannot be waived. Before filing a formal claim, please contact us and allow a reasonable opportunity to resolve the issue informally.",
        ],
      },
      {
        id: "contact",
        title: "Contact",
        paragraphs: [
          "Questions about these terms can be sent to hello@scorelead.io. Notices should identify the account or organization involved and provide enough detail for us to respond.",
        ],
      },
    ],
  },

  dataDeletion: {
    ...shared,
    eyebrow: "Legal · Privacy controls",
    title: "Data deletion instructions",
    description:
      "Use these instructions to request deletion of your ScoreLead account data or information received through a connected Meta or WhatsApp account.",
    sections: [
      {
        id: "request-deletion",
        title: "Request account or connected-data deletion",
        paragraphs: [
          "ScoreLead does not currently offer a self-service account deletion button. To request deletion, follow the steps below. There is no fee for submitting a request.",
        ],
        steps: [
          "Email hello@scorelead.io from the email address associated with your ScoreLead account.",
          "Use the subject “Data deletion request.”",
          "Include your account email, business or workspace name, and whether you want the entire ScoreLead account deleted or only data associated with a connected Facebook, Meta, or WhatsApp account.",
          "Do not send passwords, access tokens, payment card numbers, or copies of sensitive identity documents unless we specifically request a secure verification method.",
        ],
        note:
          "If you authorized ScoreLead through Facebook or another Meta flow, include the Facebook email or identifier you used when possible. We will use it only to locate and verify the relevant connection.",
      },
      {
        id: "disconnect-whatsapp",
        title: "Disconnect WhatsApp immediately",
        paragraphs: [
          "An account owner can disconnect WhatsApp from the ScoreLead integration settings. Disconnecting marks the connection inactive, cancels pending automated steps, attempts to unsubscribe the WhatsApp Business Account where supported, and destroys the stored access token. It does not delete the customer’s WhatsApp Business Account from Meta.",
          "For full deletion of ScoreLead account data, still send the deletion request described above. You can separately remove ScoreLead’s access from your Meta business settings where available.",
        ],
      },
      {
        id: "verification",
        title: "How we verify and process a request",
        paragraphs: [
          "We will acknowledge the request and may ask for limited information needed to confirm your identity, authority over the business account, and scope of deletion. If you submit a request for someone else, we may require evidence that you are authorized to act for them.",
          "After verification, we will delete or de-identify covered data within the period required by applicable law and tell you when the request is completed or explain any lawful exception. If ScoreLead holds the data only for one of our customers, we may direct the request to that customer and assist them as appropriate.",
        ],
      },
      {
        id: "what-is-deleted",
        title: "What the deletion covers",
        bullets: [
          "Account profile, authentication links, active sessions, and workspace records covered by the request.",
          "Business profiles, saved searches, lead records, enrichment data, outreach drafts, content plans, and stored images controlled by that account.",
          "Connected WhatsApp identifiers and encrypted tokens, cached templates, pending sequences, message-status records, and inbound reply records covered by the request.",
          "Contact, support, and preference records that are no longer needed for another lawful purpose.",
        ],
      },
      {
        id: "what-may-remain",
        title: "Information that may remain",
        paragraphs: [
          "We may retain limited information when required for taxes, accounting, fraud prevention, security, dispute resolution, legal claims, or compliance with law. Consent, revocation, suppression, transaction, and audit records may be retained when necessary to demonstrate compliance or ensure a recipient is not contacted again.",
          "Residual encrypted copies may remain in protected backups until they expire through ordinary backup cycles. Data retained under an exception is isolated from ordinary product use and deleted when the reason for retaining it ends.",
        ],
      },
      {
        id: "third-parties",
        title: "Meta and other third parties",
        paragraphs: [
          "Deleting data from ScoreLead does not automatically delete information held independently by Meta, WhatsApp, Google, Stripe, or another third party. Use that provider’s account controls or privacy request process for data they control. We will forward or execute deletion instructions to our processors where required and technically available.",
        ],
        links: [
          {
            label: "Meta Accounts Center",
            href: "https://accountscenter.facebook.com/personal_info/account_ownership_and_control/",
            external: true,
          },
          { label: "ScoreLead Privacy Policy", href: "/privacy" },
        ],
      },
      {
        id: "lead-data-requests",
        title: "If you appear in a customer’s lead data",
        paragraphs: [
          "A ScoreLead customer generally controls lead and recipient data in its workspace. Contact that business first if it sent you a message or collected your information. You may also email us with the business name, phone number or email involved, and enough context to locate the record. We will not disclose another customer’s confidential information, but we can route the request or assist the customer where appropriate.",
        ],
      },
    ],
  },
}
