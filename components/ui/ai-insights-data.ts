import { AiInsightData } from "./AiInsightModal";
import { Finding } from "@/components/dashboard/DashboardContext";

export const REPLAY_FRAME_INSIGHTS: Record<number, AiInsightData> = {
  1: {
    title: "Step 1: TCP 3-Way Handshake Established",
    topic: "Transport Layer Connection",
    stepName: "SYN-ACK Handshake",
    sourceSocket: "198.51.100.10:48210",
    destinationSocket: "198.51.100.14:25",
    eli5: {
      analogy: "Dialing a phone number and hearing someone pick up and say 'Hello? I can hear you.'",
      explanation:
        "Before any email content or encryption can happen, the two computers must establish a reliable underlying transport pipe. The sending mail server sends a SYN packet, the receiving server answers with SYN-ACK, and the sender confirms with ACK. At this stage, no encryption exists yet; this is raw TCP transit.",
      takeaway: "TCP connection established on standard Port 25. Ready for SMTP protocol negotiation.",
    },
    executive: {
      businessRisk:
        "Port 25 transit traverses public internet routing tables. If routes are hijacked (BGP anomaly), the TCP connection terminates at a malicious relay without corporate notice.",
      complianceImpact: "Neutral baseline; transport establishment precedes data exchange.",
      financialExposure: "None at this initial handshake stage.",
    },
    adversary: {
      mitreTactic: "T1557 - Man-in-the-Middle",
      wireTechnique:
        "Adversary observes initial SYN flags to identify connection parameters, sequence numbers, and client IP addresses for targeted payload injection.",
      whyClientFellForIt: "Standard TCP behavior; both endpoints adhere to RFC 793 connection states.",
    },
    remediation: {
      directive: "# Verify firewall egress rules restrict SMTP transit to authorized relays\niptables -A OUTPUT -p tcp --dport 25 -d 198.51.100.0/24 -j ACCEPT",
      targetSystem: "Corporate Perimeter Firewall",
      explanation: "Ensure outbound Port 25 connections only route toward validated enterprise MX gateways.",
    },
  },
  2: {
    title: "Step 2: Service Ready Banner (220)",
    topic: "SMTP Greeting",
    stepName: "220 Service Ready",
    sourceSocket: "198.51.100.14:25",
    destinationSocket: "198.51.100.10:48210",
    eli5: {
      analogy: "The clerk at the front desk saying: 'Welcome to relay-gw.partner.net, how may I help you today?'",
      explanation:
        "The receiving server announces that it is alive, ready to accept mail, and identifies its software version (ESMTP Postfix). This banner is sent in cleartext because SMTP was invented in 1982 before Internet encryption existed.",
      takeaway: "Destination mail server is online and awaiting the client's introduction.",
    },
    executive: {
      businessRisk:
        "Banner grabbing allows attackers to fingerprint exact MTA daemon software (e.g. Postfix version), enabling weaponization of known CVEs against the gateway.",
      complianceImpact: "Information disclosure under ISO 27001 Annex A.12.",
      financialExposure: "Low direct exposure; high reconnaissance utility for adversaries.",
    },
    adversary: {
      mitreTactic: "T1046 - Network Service Discovery",
      wireTechnique:
        "Adversary inspects the cleartext 220 banner string to confirm the target is an ESMTP listener before launching protocol-specific tampering.",
      whyClientFellForIt: "The client must receive a 220 code per RFC 5321 before sending commands.",
    },
    remediation: {
      directive: "# Suppress software banner disclosure in Postfix\nsmtpd_banner = $myhostname ESMTP",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Obfuscate daemon versions in public greetings to minimize reconnaissance vectors.",
    },
  },
  3: {
    title: "Step 3: Client Extended Greeting (EHLO)",
    topic: "Capability Negotiation",
    stepName: "EHLO Greeting",
    sourceSocket: "198.51.100.10:48210",
    destinationSocket: "198.51.100.14:25",
    eli5: {
      analogy: "Introducing yourself at a gate and asking: 'Here is my ID card, what security rules do you support?'",
      explanation:
        "The sending mail server greets the receiver with 'EHLO mail.corp.net'. This asks the receiver: 'What advanced features do you support? Can we do encryption (STARTTLS), large attachments (SIZE), or pipelining?'",
      takeaway: "Client explicitly asks the destination server to list its cryptographic capabilities.",
    },
    executive: {
      businessRisk:
        "The client announces its internal hostname over cleartext, revealing internal naming conventions and domain structure.",
      complianceImpact: "Internal network topology disclosure.",
      financialExposure: "Negligible direct liability.",
    },
    adversary: {
      mitreTactic: "T1040 - Network Sniffing",
      wireTechnique:
        "Adversary watches for the EHLO verb to prepare its in-line payload replacement filter for the subsequent 250 response packet.",
      whyClientFellForIt: "Mandatory RFC 5321 sequence required before mail transactions start.",
    },
    remediation: {
      directive: "# Ensure client announces its canonical external FQDN\nmyhostname = mail.corp.net",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Ensure reverse DNS (PTR) matches the EHLO hostname to prevent spam filtering rejection.",
    },
  },
  4: {
    title: "Step 4: CRITICAL INCIDENT - STARTTLS Stripping Attack",
    topic: "Adversarial In-Path Tampering",
    ruleId: "SMS-ENF-002",
    stepName: "STARTTLS Stripped",
    sourceSocket: "Hop 2 (MITM Proxy 203.0.113.88)",
    destinationSocket: "198.51.100.10:48210",
    eli5: {
      analogy:
        "A hotel has safe deposit boxes and posts a sign 'Free Safes Available'. A thief standing by the lobby secretly removes the sign. You assume there are no safes, so you leave your jewelry on the open counter.",
      explanation:
        "The destination server DID offer STARTTLS encryption! But Hop 2 is an active adversary sitting on the wire. The attacker intercepted the server's response packet in mid-air, deleted the line '250-STARTTLS', recalculated the TCP checksum, and forwarded the tampered packet to your mail server. Tricked into believing encryption is unsupported, your server gives up on security.",
      takeaway:
        "Active adversary tampered with the wire packet to suppress encryption, causing your server to downgrade to plaintext.",
    },
    executive: {
      businessRisk:
        "Total loss of email confidentiality. All customer PII, executive financial communications, intellectual property, and wire transfer orders sent through this path are intercepted in cleartext.",
      complianceImpact:
        "Severe regulatory breach under GDPR Article 32, HIPAA § 164.312(e)(1), and PCI-DSS Requirement 4.1. Unencrypted transmission of sensitive data mandates immediate regulatory disclosure and potential fines up to 4% of global annual turnover.",
      financialExposure:
        "Catastrophic: Executive wire fraud, regulatory fines ($50,000–$1,500,000 per violation), and forensic audit expenses.",
    },
    adversary: {
      mitreTactic: "T1557.002 - Man-in-the-Middle: ARP Cache Poisoning / BGP Hijack",
      wireTechnique:
        "In-path middlebox matches regex '250-STARTTLS\\r\\n'. Replaces bytes with spaces or removes the line, adjusts the TCP sequence/acknowledgment numbers, recomputes the 16-bit One's Complement TCP checksum, and re-injects the frame within 1.2ms.",
      whyClientFellForIt:
        "Opportunistic TLS (RFC 3207) treats encryption as optional. If the server doesn't advertise STARTTLS, the client is specified to silently fall back to cleartext without notifying the user.",
    },
    remediation: {
      directive:
        "# Enforce DANE authentication and MTA-STS in Postfix\nsmtp_tls_security_level = dane\nsmtp_dns_support_level = dnssec\nsmtp_tls_mandatory_ciphers = high",
      targetSystem: "Postfix MTA /etc/postfix/main.cf",
      explanation:
        "Switching from opportunistic TLS (may) to mandatory DANE/MTA-STS (dane or verify) forces Postfix to abort the connection if STARTTLS is stripped, neutralizing downgrade attacks.",
    },
  },
  5: {
    title: "Step 5: Cleartext Fallback - MAIL FROM:<cfo@corp.net>",
    topic: "Unencrypted Data Transit",
    ruleId: "SMS-ENF-002",
    stepName: "Cleartext Fallback",
    sourceSocket: "198.51.100.10:48210",
    destinationSocket: "198.51.100.14:25",
    eli5: {
      analogy: "Writing the CEO's private bank details on a postcard and dropping it into a public mailbox.",
      explanation:
        "Because our mail server was deceived by the attacker in Step 4, it proceeds with the email transfer without TLS encryption. It transmits 'MAIL FROM:<cfo@corp.net>' in raw, unencrypted ASCII text. Anyone eavesdropping on the internet wire can see the sender's identity.",
      takeaway: "Sensitive sender credentials and executive identity transmitted in cleartext on the public wire.",
    },
    executive: {
      businessRisk:
        "Executive identity leakage enables targeted spear-phishing (Whaling) and Business Email Compromise (BEC) wire-diversion schemes.",
      complianceImpact: "Violation of mandatory privacy safeguards for executive communication.",
      financialExposure:
        "FBI IC3 reports the average BEC incident costs organizations $125,000 in diverted funds.",
    },
    adversary: {
      mitreTactic: "T1056 - Input Capture / Sniffing",
      wireTechnique:
        "Adversary passive packet sniffer (libpcap / tcpdump) logs all ASCII strings following the MAIL FROM verb directly to an exfiltration database.",
      whyClientFellForIt: "Default mail server configuration allows cleartext when TLS is unadvertised.",
    },
    remediation: {
      directive: "# Reject plaintext submission on corporate relays\nsmtpd_tls_auth_only = yes\nsmtp_tls_note_starttls_offer = yes",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Refuse to send or receive sender headers unless TLS encryption is actively established.",
    },
  },
  6: {
    title: "Step 6: Recipient Confirmed (RCPT TO) in Cleartext",
    topic: "Transaction Acknowledgment",
    stepName: "RCPT TO Confirmed",
    sourceSocket: "198.51.100.14:25",
    destinationSocket: "198.51.100.10:48210",
    eli5: {
      analogy: "The post office stamping the postcard and agreeing to deliver it unsealed to the recipient.",
      explanation:
        "The destination server responds '250 2.1.5 Ok recipient confirmed'. The email transaction is now locked into unencrypted cleartext mode. Next comes the DATA command where the email body, invoice attachments, and passwords will be transmitted completely unencrypted.",
      takeaway: "Cleartext session confirmed; full message body is about to be exposed across the wire.",
    },
    executive: {
      businessRisk:
        "Recipient verification confirms active mailbox targets to the adversary, confirming valid corporate email addresses for subsequent attacks.",
      complianceImpact: "Breach of confidentiality agreement with external commercial partners.",
      financialExposure: "Brand reputational damage and partner trust erosion.",
    },
    adversary: {
      mitreTactic: "T1114 - Email Collection",
      wireTechnique:
        "Adversary captures confirmed recipient address and prepares to intercept the multi-part MIME payload during the upcoming DATA command phase.",
      whyClientFellForIt: "SMTP state machine progresses to DATA phase automatically once RCPT TO succeeds.",
    },
    remediation: {
      directive: "# Publish MTA-STS policy to notify external partners of mandatory encryption\nversion: STSv1\nmode: enforce\nmx: *.corp.net\nmax_age: 604800",
      targetSystem: "DNS & HTTPS mta-sts.corp.net/.well-known/mta-sts.txt",
      explanation:
        "Publishing an MTA-STS policy in 'enforce' mode instructs all modern senders (Google, Microsoft, Yahoo) to refuse delivery if TLS cannot be established.",
    },
  },
};

export const POSTURE_SCORE_INSIGHT: AiInsightData = {
  title: "Cryptographic Posture & Honest Uncertainty Engine",
  topic: "Bayesian Security Scoring",
  eli5: {
    analogy:
      "A home inspection report that says: 'We checked the locks and windows (Grade B), but the safe in the basement is sealed shut. We cannot see inside it, so we honestly report a range between 75 and 93 instead of pretending it is 100% safe.'",
    explanation:
      "Raven uses formal Bayesian statistics to score your mail security. When modern protocols like TLS 1.3 are used, intermediate certificates are encrypted on the wire. A dishonest scanner would guess or show a fake '100%'. Raven honestly reports a Credible Interval [75.4–93.0], acknowledging that what cannot be observed on the wire must mathematically widen the uncertainty band.",
    takeaway:
      "A score range is more trustworthy than a single number. It tells auditors exactly what was mathematically verified versus what was encrypted.",
  },
  executive: {
    businessRisk:
      "Relying on legacy scanners that output flat '100% Pass' numbers creates false confidence. During an actual breach, auditors discover that unobservable hops were never cryptographically verified, creating liability for executive leadership.",
    complianceImpact:
      "Meets NIST SP 800-115 technical assessment standards and DoD CMMC Level 3 cryptographic validation requirements by proving non-repudiation and evidence provenance.",
    financialExposure:
      "Auditor verification defense: Demonstrating mathematically bounded uncertainty prevents regulatory fines for negligent compliance reporting.",
  },
  adversary: {
    mitreTactic: "T1562.001 - Impair Defenses: Disable or Bypass Security Tools",
    wireTechnique:
      "Adversaries exploit blindspots where security tools assume traffic is safe just because TLS is present. By downgrading unobservable intermediate hops, they harvest data without alerting naive perimeter monitoring.",
    whyClientFellForIt: "Perimeter tools only inspect Hop 1 and assume subsequent transit hops are secure.",
  },
  remediation: {
    directive:
      "# Mandate End-to-End Cryptographic Sealing across all partner relays\nsmtp_tls_security_level = dane\nsmtp_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1, TLSv1.2, TLSv1.3",
    targetSystem: "Enterprise MX Architecture",
    explanation:
      "Require all internal and partner relays to negotiate TLS 1.3 with DANE verification, lifting the lower bound of your posture score to >90.",
  },
};

export const POSTURE_SUBSCORE_INSIGHTS: Record<string, AiInsightData> = {
  protocol: {
    title: "Pillar 1: Protocol Versioning (Weight: 20%)",
    topic: "TLS Protocol Integrity",
    eli5: {
      analogy: "Speaking in modern encrypted languages versus speaking in ancient dialects that any eavesdropper can decode.",
      explanation:
        "Modern email encryption must use TLS 1.3 or TLS 1.2. Legacy versions (TLS 1.0, TLS 1.1, SSLv3) have known cryptographic flaws (POODLE, BEAST) that allow attackers to decrypt traffic. When a session falls back to unencrypted cleartext, this score drops to zero.",
      takeaway: "Strict TLS 1.3/1.2 negotiation ensures forward secrecy and protection against downgrade attacks.",
    },
    executive: {
      businessRisk: "Legacy protocol support enables trivial session decryption via automated tools on public transit networks.",
      complianceImpact: "PCI-DSS 3.1 and NIST SP 800-52r2 strictly forbid TLS 1.0 and TLS 1.1.",
      financialExposure: "Immediate PCI compliance failure, jeopardizing credit card processing rights.",
    },
    adversary: {
      mitreTactic: "T1557 - Downgrade Attacks",
      wireTechnique: "Attacker injects TLS ClientHello with lower version byte (0x0301) to force negotiation of broken cipher modes.",
      whyClientFellForIt: "MTA configured with backward-compatible protocol allowances.",
    },
    remediation: {
      directive: "smtp_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1, TLSv1.2, TLSv1.3",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Explicitly blacklist SSLv2, SSLv3, TLS 1.0, and TLS 1.1 in mail configuration.",
    },
  },
  cipher: {
    title: "Pillar 2: Cipher Suite Robustness (Weight: 25%)",
    topic: "AEAD Encryption Ciphers",
    eli5: {
      analogy: "Using high-security titanium bank vault locks instead of 1970s combination padlocks.",
      explanation:
        "Ciphers are the mathematical algorithms that encrypt your email. Modern standards require AEAD (Authenticated Encryption with Associated Data) like AES-256-GCM. Older ciphers like 3DES (Triple DES) or CBC-mode ciphers suffer from collision attacks (Sweet32).",
      takeaway: "Only modern AEAD ciphers guarantee both confidentiality and tamper-proof message integrity.",
    },
    executive: {
      businessRisk: "Using weak ciphers exposes high-volume corporate email streams to Sweet32 collision attacks, leaking sensitive attachments.",
      complianceImpact: "Non-compliance with NIST SP 800-52r2 Section 3.3.",
      financialExposure: "Potential intellectual property loss through cryptographic key recovery.",
    },
    adversary: {
      mitreTactic: "T1557 - Exploitation for Credential Access",
      wireTechnique: "Exploits 64-bit block size collision in 3DES after capturing 32GB of ciphertext to recover authentication cookies.",
      whyClientFellForIt: "Default OpenSSL cipher lists often prioritize legacy compatibility.",
    },
    remediation: {
      directive: "smtp_tls_ciphers = high\nsmtp_tls_mandatory_ciphers = high\ntls_high_cipherlist = ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Restrict cipher suites strictly to NIST-recommended AEAD algorithms with Ephemeral Diffie-Hellman.",
    },
  },
  key: {
    title: "Pillar 3: Key Exchange Strength (Weight: 15%)",
    topic: "Forward Secrecy & Curve Security",
    eli5: {
      analogy: "Burning the secret decoder book after every conversation so past conversations can never be decrypted even if someone steals the key tomorrow.",
      explanation:
        "Key exchange establishes the temporary session keys used to encrypt the email. Using Ephemeral Diffie-Hellman (ECDHE) with curves like X25519 or P-256 ensures Perfect Forward Secrecy (PFS). Even if a nation-state steals the server's private key in 5 years, past emails cannot be decrypted.",
      takeaway: "Perfect Forward Secrecy prevents retrospective decryption of archived packet traces.",
    },
    executive: {
      businessRisk: "Without forward secrecy, an adversary storing encrypted packet captures today can decrypt all historical company emails if the server certificate key is ever leaked or retired.",
      complianceImpact: "Mandated under European Union GDPR Data Minimization and Protection By Design requirements.",
      financialExposure: "Catastrophic exposure of years of archived corporate communications.",
    },
    adversary: {
      mitreTactic: "T1040 - Harvest Now, Decrypt Later",
      wireTechnique: "Passive eavesdroppers archive bulk ciphertext and wait for private key compromise or quantum computing breakthroughs.",
      whyClientFellForIt: "Static RSA key exchange does not provide forward secrecy.",
    },
    remediation: {
      directive: "smtpd_tls_eecdh_grade = strong\nsmtp_tls_mandatory_protocols = TLSv1.3, TLSv1.2",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Mandate ECDHE key exchange with strong elliptic curves (P-256, X25519) to enforce Perfect Forward Secrecy.",
    },
  },
  x509: {
    title: "Pillar 4: X.509 PKI Trust & Unobservability (Weight: 15%)",
    topic: "Certificate Chain Authentication",
    eli5: {
      analogy: "An official passport proving the mail server really belongs to who it claims to belong to.",
      explanation:
        "X.509 certificates authenticate that you are connecting to the legitimate mail server, not an imposter. However, in TLS 1.3, the server's Certificate message is encrypted on the wire to protect user privacy. Because passive wire taps cannot see it, Raven honestly tags this as 'NOT-OBSERVABLE' rather than guessing.",
      takeaway: "TLS 1.3 encrypts certificate metadata on the wire, demonstrating why honest uncertainty bands are mathematically necessary.",
    },
    executive: {
      businessRisk: "If certificates are unvalidated or expired, man-in-the-middle proxies can impersonate destination gateways without detection.",
      complianceImpact: "CA/Browser Forum Baseline Requirements and RFC 5280 PKI compliance.",
      financialExposure: "Impersonation fraud and corporate identity spoofing.",
    },
    adversary: {
      mitreTactic: "T1587.003 - Digital Certificates Spoofing",
      wireTechnique: "Attacker presents self-signed or fraudulent certificates knowing that default mail clients often ignore certificate errors.",
      whyClientFellForIt: "SMTP clients historically accepted invalid certificates to avoid message bouncing.",
    },
    remediation: {
      directive: "smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt\nsmtp_tls_verify_cert_match = hostname, nexthop",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Configure the MTA with a strict CA trust store and enforce certificate hostname verification.",
    },
  },
  dns: {
    title: "Pillar 5: DNSSEC & DANE TLSA Records (Weight: 10%)",
    topic: "Cryptographic DNS Authentication",
    eli5: {
      analogy: "A notary seal on the phone book proving that nobody swapped the phone numbers in the directory.",
      explanation:
        "DNS tells your mail server what IP address to connect to. Without DNSSEC and DANE, an attacker can poison DNS to point your mail server to a rogue relay. DANE publishes cryptographic certificate fingerprints (TLSA records) directly in signed DNS.",
      takeaway: "DANE TLSA records prevent attackers from forging certificates or spoofing MX IP destinations.",
    },
    executive: {
      businessRisk: "DNS spoofing and cache poisoning allow adversaries to reroute entire mail flows without touching the mail server.",
      complianceImpact: "Mandated for government contractors under NIST SP 800-81-2 and BSI TR-03108.",
      financialExposure: "Total traffic diversion and operational disruption.",
    },
    adversary: {
      mitreTactic: "T1071.004 - DNS Manipulation",
      wireTechnique: "Adversary injects forged UDP 53 DNS responses to redirect MX lookups to an adversary-controlled listening server.",
      whyClientFellForIt: "Standard DNS is unauthenticated cleartext UDP.",
    },
    remediation: {
      directive: "# Enable DNSSEC resolver support in Postfix\nsmtp_dns_support_level = dnssec\nsmtp_tls_security_level = dane",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Enable DNSSEC validation so Postfix checks DANE TLSA records before sending mail.",
    },
  },
  enforce: {
    title: "Pillar 6: MTA-STS Enforcement & Telemetry (Weight: 15%)",
    topic: "Mandatory Transport Security Policy",
    eli5: {
      analogy: "A legal contract that says: 'Under no circumstances are you permitted to send my letters without a sealed envelope.'",
      explanation:
        "MTA-STS (Mail Transfer Agent Strict Transport Security, RFC 8461) tells the world that your domain mandates TLS encryption. If an attacker tries to strip STARTTLS, senders that respect MTA-STS will refuse to send the email in cleartext, completely neutralizing downgrade attacks.",
      takeaway: "MTA-STS closes the 40-year-old loophole of opportunistic STARTTLS stripping.",
    },
    executive: {
      businessRisk: "Without MTA-STS, your domain's incoming mail is permanently vulnerable to wiretap interception on external networks.",
      complianceImpact: "NIST Cybersecurity Framework PR.DS-2 (Data in transit protection) and UK NCSC email security guidelines.",
      financialExposure: "Zero defense against nationwide ISP or nation-state wire interception.",
    },
    adversary: {
      mitreTactic: "T1557.002 - Downgrade via STARTTLS Stripping",
      wireTechnique: "Attacker strips 250-STARTTLS from server response; because no MTA-STS policy exists, sender complies with cleartext.",
      whyClientFellForIt: "Opportunistic TLS does not know that encryption was expected without MTA-STS.",
    },
    remediation: {
      directive: "# Publish HTTPS MTA-STS policy at https://mta-sts.corp.net/.well-known/mta-sts.txt\nversion: STSv1\nmode: enforce\nmx: mail.corp.net\nmax_age: 604800",
      targetSystem: "Web Server & DNS (_mta-sts.corp.net TXT)",
      explanation: "Publish a strict MTA-STS policy in 'enforce' mode with TLS reporting (TLS-RPT) enabled.",
    },
  },
};

export const HOP_INSIGHTS: Record<string, AiInsightData> = {
  "hop-1": {
    title: "Hop 1: mx1.corp.net (Internal Gateway)",
    topic: "Enterprise Perimeter Ingress",
    sourceSocket: "198.51.100.10:48210",
    destinationSocket: "Internal Relay",
    eli5: {
      analogy: "The high-security main entrance to your corporate headquarters with badge readers and armed guards.",
      explanation:
        "Hop 1 is your organization's internal boundary MTA. It negotiates strict TLS 1.3 with AEAD ciphers and scores Grade A- (88/100). The internal segment is secure, but email must leave this gateway to reach external partners.",
      takeaway: "Your perimeter security is strong, but external transit hops determine true security.",
    },
    executive: {
      businessRisk: "Low internal risk; primary exposure is when messages leave this boundary into untrusted external networks.",
      complianceImpact: "Meets enterprise encryption standards.",
      financialExposure: "Minimal at this boundary.",
    },
    adversary: {
      mitreTactic: "T1190 - Exploit Public-Facing Application",
      wireTechnique: "Adversaries cannot break TLS 1.3 AEAD on this segment; they target downstream hops instead.",
      whyClientFellForIt: "N/A - Segment is cryptographically hardened.",
    },
    remediation: {
      directive: "# Maintain strict cipher preferences\nsmtp_tls_mandatory_protocols = TLSv1.3, TLSv1.2",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Preserve current hardened cryptographic configuration on internal boundary gateway.",
    },
  },
  "hop-2": {
    title: "Hop 2: relay-gw.partner.net (CRITICAL WEAK LINK)",
    topic: "Compromised Partner Commercial Relay",
    ruleId: "SMS-ENF-002",
    sourceSocket: "198.51.100.14:25",
    destinationSocket: "198.51.100.10:48210",
    eli5: {
      analogy: "An unsecured tollbooth on a highway where a corrupt attendant forces all armored trucks to unlock their doors.",
      explanation:
        "Hop 2 is the weakest link in your entire delivery chain. It scores Grade E (42/100). An in-path middlebox or adversary stripped the STARTTLS advertisement, forcing 17.4% of your corporate traffic into unencrypted cleartext across this partner gateway.",
      takeaway: "Your Grade A internal gateway is rendered useless because Hop 2 leaks corporate emails in cleartext.",
    },
    executive: {
      businessRisk:
        "Confidential financial spreadsheets, customer PII, and executive emails are harvested in raw ASCII text by unauthorized parties transiting this relay.",
      complianceImpact: "Severe GDPR Article 32 & HIPAA violation; failure to secure third-party data transit.",
      financialExposure: "Direct regulatory breach liability and exposure to business email compromise wire fraud.",
    },
    adversary: {
      mitreTactic: "T1557.002 - Man-in-the-Middle: STARTTLS Downgrade",
      wireTechnique:
        "Adversary strips '250-STARTTLS' from the server's EHLO response. Client MTA fails open into cleartext. Adversary logs email payloads.",
      whyClientFellForIt: "Sending MTA was configured for opportunistic TLS without DANE or MTA-STS verification.",
    },
    remediation: {
      directive: "# Enforce DANE to refuse cleartext transit with partner\nsmtp_tls_policy_maps = hash:/etc/postfix/tls_policy\n# In /etc/postfix/tls_policy:\npartner.net dane",
      targetSystem: "Postfix /etc/postfix/tls_policy",
      explanation: "Pin partner.net to mandatory DANE/TLS. If STARTTLS is stripped, Postfix will refuse delivery and queue the message securely.",
    },
  },
  "hop-3": {
    title: "Hop 3: aspmx.l.google.com (Cloud Egress)",
    topic: "Google Workspace Direct Peering",
    sourceSocket: "142.250.150.27:25",
    destinationSocket: "Cloud Mailbox",
    eli5: {
      analogy: "A state-of-the-art bank vault with biometric scanners and 24/7 robotic surveillance.",
      explanation:
        "Hop 3 routes traffic to Google Workspace mailboxes. It scores Grade A+ (98/100) using TLS 1.3 with ChaCha20-Poly1305, valid GTS Root CA certificates, and mandatory MTA-STS enforcement.",
      takeaway: "Fully compliant modern transit hop with active cryptographic monitoring.",
    },
    executive: {
      businessRisk: "Negligible; Google enforces automated downgrade resistance.",
      complianceImpact: "Exceeds all international cryptographic compliance standards.",
      financialExposure: "None.",
    },
    adversary: {
      mitreTactic: "T1557 - MITM (Neutralized)",
      wireTechnique: "Adversaries cannot downgrade Google hops because Google senders and receivers enforce MTA-STS policies.",
      whyClientFellForIt: "N/A - Downgrade attacks are rejected automatically.",
    },
    remediation: {
      directive: "# No action required; hop is operating at maximum cryptographic compliance\n# Continue monitoring TLS-RPT reports",
      targetSystem: "Cloud Peering Monitoring",
      explanation: "Maintain current peering telemetry and monitor TLS-RPT error digests.",
    },
  },
  "hop-4": {
    title: "Hop 4: mail.protection.outlook.com (M365)",
    topic: "Microsoft 365 Exchange Relay",
    sourceSocket: "52.101.68.1:25",
    destinationSocket: "Exchange Online",
    eli5: {
      analogy: "A hardened corporate courier service operating under strict enterprise SLA agreements.",
      explanation:
        "Hop 4 routes traffic to Microsoft 365 Exchange Online. It scores Grade A (92/100) using TLS 1.2/1.3 with AES-256-GCM and active DANE TLSA verification.",
      takeaway: "Enterprise-grade cloud boundary relay with active policy enforcement.",
    },
    executive: {
      businessRisk: "Very low; Microsoft enforces strict partner TLS policies.",
      complianceImpact: "Compliant with SOC 2 Type II and FedRAMP High benchmarks.",
      financialExposure: "None.",
    },
    adversary: {
      mitreTactic: "T1557 - MITM (Neutralized)",
      wireTechnique: "Attacks are repelled by Exchange Online's mandatory TLS enforcement connectors.",
      whyClientFellForIt: "N/A - Microsoft connectors reject plaintext fallbacks.",
    },
    remediation: {
      directive: "# Enable Exchange Online mandatory outbound TLS\nSet-OutboundConnector -Identity 'To Partner' -TlsAuthLevel DomainValidation",
      targetSystem: "Exchange Online PowerShell",
      explanation: "Ensure outbound connectors enforce DomainValidation to require valid certificates.",
    },
  },
};

export const LENS_INSIGHTS: Record<string, AiInsightData> = {
  "FC-01": {
    title: "Forecast FC-01: Active BGP Hijack & Cleartext STARTTLS Stripping",
    topic: "Predictive Downgrade Vulnerability",
    ruleId: "SMS-ENF-002",
    eli5: {
      analogy: "A thief rerouting street signs so your mail truck drives through an alley where all letters are opened.",
      explanation:
        "Because our scan detected that sending MTAs silently fall back to cleartext when STARTTLS is stripped, any adversary who hijacks internet routing (BGP hijack) can intercept your entire corporate email stream without any alert appearing on users' screens.",
      takeaway: "Opportunistic TLS without DANE or MTA-STS makes your domain permanently vulnerable to silent internet route hijacks.",
    },
    executive: {
      businessRisk: "Nation-state or cybercrime syndicates can divert corporate traffic and harvest all communications unnoticed.",
      complianceImpact: "Catastrophic privacy failure; non-compliance with FTC Safeguards Rule.",
      financialExposure: "Millions of dollars in stolen intellectual property and ransom demands.",
    },
    adversary: {
      mitreTactic: "T1557.002 - BGP Route Hijacking with In-Path Stripping",
      wireTechnique: "Attacker announces rogue BGP prefix, routes Port 25 traffic through interception proxy, strips STARTTLS, and mirrors cleartext payloads.",
      whyClientFellForIt: "MTA accepts cleartext when STARTTLS is absent.",
    },
    remediation: {
      directive: "smtp_tls_security_level = dane\nsmtp_dns_support_level = dnssec",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Enforce DANE verification to make mail servers refuse unencrypted delivery.",
    },
  },
  "FC-02": {
    title: "Forecast FC-02: Sweet32 Birthday Attack Key Recovery",
    topic: "Cryptographic Collision Threat",
    ruleId: "SMS-CIPH-001",
    eli5: {
      analogy: "If you roll dice often enough, you will eventually roll two identical numbers. With weak ciphers, identical numbers leak the secret key.",
      explanation:
        "3DES uses a small 64-bit block size. After approximately 32 Gigabytes of continuous traffic, mathematical collisions occur that allow an attacker watching the wire to recover session keys and decrypt sensitive data.",
      takeaway: "Legacy 3DES ciphers must be disabled immediately in favor of modern 256-bit AEAD ciphers.",
    },
    executive: {
      businessRisk: "Bulk email archives can be retrospectively decrypted by persistent eavesdroppers.",
      complianceImpact: "Direct violation of NIST SP 800-131A cipher phase-out mandates.",
      financialExposure: "Breach of contractual confidentiality agreements with financial institutions.",
    },
    adversary: {
      mitreTactic: "T1557 - Sweet32 Ciphertext Collision Exploitation",
      wireTechnique: "Attacker induces long-running SMTP session, collects 32GB of 3DES ciphertext, locates identical ciphertext blocks, and derives plaintext.",
      whyClientFellForIt: "MTA supports backward-compatible 3DES-CBC suites.",
    },
    remediation: {
      directive: "smtp_tls_exclude_ciphers = 3DES, DES, RC4, MD5, aNULL, eNULL",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Explicitly exclude 3DES from all outbound and inbound cipher suites.",
    },
  },
  "FC-03": {
    title: "Forecast FC-03: Adversary Ingress via Hostname Spoofing",
    topic: "X.509 Certificate Impersonation",
    ruleId: "SMS-X509-002",
    eli5: {
      analogy: "A security guard letting someone in because they have a valid badge, even though the photo and name on the badge belong to someone else.",
      explanation:
        "When connecting to a remote mail server, the client must verify that the certificate's Subject Alternative Name (SAN) matches the hostname being dialed. If the client fails open, an attacker can present any valid certificate and silently eavesdrop.",
      takeaway: "Certificate hostname verification is essential to prevent man-in-the-middle impersonation.",
    },
    executive: {
      businessRisk: "Adversaries can position proxy relays between commercial partners and impersonate the destination gateway.",
      complianceImpact: "Failure of mutual authentication controls under ISO 27001.",
      financialExposure: "Compromise of confidential commercial contracts and executive correspondence.",
    },
    adversary: {
      mitreTactic: "T1587.003 - Digital Certificates / Fake MX Impersonation",
      wireTechnique: "Attacker acquires a free Let's Encrypt certificate for a lookalike domain and presents it during the TLS handshake.",
      whyClientFellForIt: "MTA disabled certificate name verification to prevent delivery delays.",
    },
    remediation: {
      directive: "smtp_tls_verify_cert_match = hostname, nexthop\nsmtp_tls_security_level = verify",
      targetSystem: "Postfix /etc/postfix/main.cf",
      explanation: "Require strict hostname verification against the destination MX domain.",
    },
  },
};

export function getFindingInsight(finding: Finding): AiInsightData {
  if (finding.ruleId.includes("ENF-002")) {
    return REPLAY_FRAME_INSIGHTS[4];
  }
  if (finding.ruleId.includes("CIPH")) {
    return POSTURE_SUBSCORE_INSIGHTS["cipher"];
  }
  if (finding.ruleId.includes("KEY")) {
    return POSTURE_SUBSCORE_INSIGHTS["key"];
  }
  if (finding.ruleId.includes("X509")) {
    return POSTURE_SUBSCORE_INSIGHTS["x509"];
  }
  if (finding.ruleId.includes("DNS")) {
    return POSTURE_SUBSCORE_INSIGHTS["dns"];
  }
  if (finding.ruleId.includes("ENF")) {
    return POSTURE_SUBSCORE_INSIGHTS["enforce"];
  }

  // Default generic fallback built dynamically from finding
  return {
    title: `${finding.ruleId}: ${finding.ruleTitle}`,
    topic: "Cryptographic Vulnerability",
    ruleId: finding.ruleId,
    sourceSocket: finding.mxHost,
    eli5: {
      analogy: "Leaving a back window unlocked in an otherwise secured building.",
      explanation: finding.summary,
      takeaway: `Evaluated against RFC standards. Violates formal rule ${finding.ruleId}.`,
    },
    executive: {
      businessRisk: `Finding severity is ${finding.severity} with CVSS score ${finding.cvss.toFixed(1)}. Poses risks to email confidentiality and data integrity.`,
      complianceImpact: "May fail regulatory audits under GDPR Article 32 and NIST SP 800-52r2.",
      financialExposure: "Potential regulatory fines and client remediation costs.",
    },
    adversary: {
      mitreTactic: "T1557 - Adversarial Wire Protocol Manipulation",
      wireTechnique: `Observed at wire byte offset ${finding.provenance.byteOffset} in frame #${finding.provenance.packetNo}.`,
      whyClientFellForIt: "MTA lacks strict cryptographic policy pinning.",
    },
    remediation: {
      directive: "# Enforce strict TLS in MTA\nsmtp_tls_security_level = dane",
      targetSystem: "Mail Transfer Agent (Postfix/Exim/Exchange)",
      explanation: "Apply recommended cryptographic settings to prevent protocol exploitation.",
    },
  };
}

export const INTEGRITY_CHAIN_INSIGHT: AiInsightData = {
  title: "Cryptographic Chain of Custody & Court Admissibility",
  topic: "Tamper-Proof Audit Manifest (MANIFEST.sha256)",
  eli5: {
    analogy:
      "A wax seal stamped on an envelope with a unique royal signet. If even one millimeter of the seal is broken or chipped, everyone knows the contents were tampered with.",
    explanation:
      "In legal forensics and regulatory audits, evidence is only admissible if you can mathematically prove it was never altered after capture. Raven creates a SHA-256 cryptographic tree connecting the raw packet bytes, the rule catalog, and the signed PDF report. If even a single bit of a PCAP is altered, the entire manifest verification fails immediately.",
    takeaway:
      "The integrity manifest guarantees mathematical non-repudiation: proof that your audit evidence is authentic and tamper-free.",
  },
  executive: {
    businessRisk:
      "If audit reports lack cryptographic proof of custody, opposing legal counsel or regulatory auditors (SEC, FTC, GDPR DPA) can disqualify your evidence in court, claiming logs were altered internally.",
    complianceImpact:
      "Satisfies Federal Rules of Evidence Rule 902(13) and Rule 902(14) for self-authenticating electronic records generated by a process or system.",
    financialExposure:
      "Inadmissible evidence can result in summary judgments and multi-million dollar penalties during regulatory breach investigations.",
  },
  adversary: {
    mitreTactic: "T1070 - Indicator Removal on Host",
    wireTechnique:
      "Adversaries attempt to modify packet captures or delete log lines to hide their tracks. SHA-256 cryptographic sealing exposes any byte-level alterations.",
    whyClientFellForIt: "Traditional text logs have no cryptographic integrity checks and can be edited in Notepad.",
  },
  remediation: {
    directive:
      "# Verify local PCAP and report hash against court manifest\nsha256sum -c MANIFEST.sha256\n# Expected output: All artifacts OK",
    targetSystem: "Forensic Evidence Repository",
    explanation:
      "Always archive the signed MANIFEST.sha256 receipt alongside exported PCAPs and JSON reports for immutable verification.",
  },
};
