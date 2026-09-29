# Demo runbook — SIH26159 SecureMailScope

**Live URL: https://raven.impiclabs.com** · 6 minutes · every number below was measured on the deployed server

Each beat is **DO** (clicks) / **SAY** (verbatim) / **EXPECT** (what must be on screen). If EXPECT
doesn't match, move on — never narrate a number that isn't there.

---

## Before you present (5 min)

1. Open **https://raven.impiclabs.com** in a second tab. Confirm the sidebar has 9 tabs.
2. Load the capture you'll demo: **Ingest PCAP → sample dropdown → `stripped.pcap` → Analyze.**
   The whole run happens on this one session. Loading it first means no upload wait on stage.
3. Hard-refresh once. You want `production build`, never a stale bundle.
4. Do **not** open `/dashboard/replay` first — it looks like the app's centrepiece but it is a
   scripted walkthrough (see *Conceding limits*). Open it only if asked.
5. Fullscreen, notifications off, brightness up.

**If the site is down:** you cannot narrate around it. Have the PDF report and one screenshot of
the graph as a fallback on your laptop, and say plainly: "the live instance is unreachable, here
is the sealed report from the same build."

---

## The run

| Time | Beat | Screen |
|---|---|---|
| 0:00 | Problem | (deck / talk) |
| 0:30 | Solution + ingest | `/dashboard` |
| 1:00 | Posture answer | `/dashboard/posture` |
| 1:45 | Forensic findings | `/dashboard/findings` |
| 2:30 | Delivery graph | `/dashboard/graph` |
| 3:20 | Reports + seal | `/dashboard/reports` |
| 3:50 | Ask / RAG | `/dashboard/ask` |
| 4:40 | Integrity | `/dashboard/integrity` |
| 5:10 | Close | (deck) |

---

### 0:00 — Problem · 30s

**SAY**
> "Every mail server tells you it's secure. Nobody can show you evidence. I have the certificate,
> the cipher, the STARTTLS negotiation — captured on the wire. None of it proves the mail was
> *protected in transit*. Security teams see the config. They don't see the conversation."

Then the one-line thesis: **"We don't grade mail servers. We grade the evidence that mail was
actually protected."**

---

### 0:30 — Solution + ingest · 30s · `/dashboard`

**DO** Point at the drop zone. The session is already loaded (`stripped.pcap`).

**SAY**
> "This is a PCAP of SMTP traffic. The analyst drops it in. No credentials, no decryption, no
> content — we read the handshake, the certificate and the negotiation metadata only. The tool
> never contacts the mail server. It is passive by construction."

**EXPECT** `stripped.pcap · 1 flow · 2 findings · 84.2 · Grade B`

**SAY (the passive claim, precisely)**
> "The only network call this system ever makes is reading DNS policy records — MTA-STS and DANE.
> We never probe a mail server. That's a design constraint, not a setting."

---

### 1:00 — Posture answer · 45s · `/dashboard/posture`

**DO** Let the score render. Point at the confidence band, then the grade.

**EXPECT** `84.2 [75.4–93.0] · Grade B · 0 findings unproven`

**SAY**
> "Here is the number that matters, and notice it is never bare. 84.2, with a confidence band of
> 75.4 to 93, Grade B. The band is the point."

> "We publish the band because the evidence is incomplete — under TLS 1.3 the certificate chain is
> genuinely unobservable, and we widen the interval instead of claiming a clean bill of health.
> A tool that shows you a single confident number is telling you it made a guess."

**If asked why not 100/100:** "Nothing in a PCAP proves a server is safe. Only a bound is
defensible."

---

### 1:45 — Forensic findings · 45s · `/dashboard/findings`

**DO** Click the **`SMS-ENF-002` — Active STARTTLS Stripping** row. The evidence drawer opens.

**EXPECT** drawer shows `RFC 3207 suppression · packet 8 · severity high`

**SAY**
> "Active STARTTLS stripping. The server advertises STARTTLS, then suppresses the capability in
> the EHLO response, and the client continues in cleartext. This is the strongest finding class in
> the system."

> "And here's the part that matters for an audit: packet number, byte offset, rule ID, and the RFC
> clause it violates — `SMS-ENF-002`, RFC 3207. Every finding is a citation back to observable
> evidence, not a heuristic verdict."

**Then the contrast — this is your best 15 seconds:**
> "Four findings on the same capture, four different severities. `SMS-CIPH-002` is a non-PFS cipher —
> medium, because forward secrecy only protects *future* compromises, not this session. Severity
> is a judgement about impact over time, not a severity-of-name."

---

### 2:30 — Delivery graph · 50s · `/dashboard/graph` · **your strongest beat**

**DO** Load `multihop.pcap` for this beat (3 flows, 5 findings, 4 hops). Point at the hop with
the `STRIPPED_CLEARTEXT` edge.

**EXPECT** 3 observed nodes + 4 hop nodes; one edge `STRIPPED_CLEARTEXT`, one `HANDOFF_UNVERIFIED`

**SAY**
> "Mail doesn't travel in one hop, it travels in a chain. Here is a four-hop route: the sender,
> then `aspmx.l.google.com`, then `mail.protection.outlook.com`, then the partner's relay."

> "Each edge is labelled with what we actually observed. This one is encrypted under TLS 1.3.
> This one is `HANDOFF_UNVERIFIED` — we can see the hop happened but not that it was protected,
> so we don't claim it was. And this one, `STRIPPED_CLEARTEXT`: the mail left the network in
> plaintext, here, at this hop."

> "The single question a compliance reviewer actually has is 'where does the mail leave
> encryption?' A per-server score can't answer it. This can."

---

### 3:20 — Reports + the seal · 30s · `/dashboard/reports`

**DO** Open the report. Show the SHA-256. Download the PDF.

**EXPECT** `sha256 a43fc563… · verified: true` · PDF 200 `application/pdf`

**SAY**
> "The report is a content-addressed document. Same capture, same package version, same SHA-256.
> That's what makes this defensible in a dispute — you can prove the report hasn't been edited
> after the fact. And the PDF carries the identical seal, so all three renderings agree."

> "The same build that generates the report proves it: `make verify` re-runs the pipeline and
> checks the hash. Reproducibility isn't a nice-to-have here, it's what makes the score
> arguable rather than assertive."

---

### 3:50 — Ask / RAG · 50s · `/dashboard/ask`

**DO** Load `stripped.pcap`. Ask exactly these, in order.

**Q1 — proves it's reading the capture, not reciting RFCs:**
> "What packet number was the STARTTLS stripping observed at?"

**EXPECT** `Packet 8 [FINDING-SMS-ENF-002-8]`

**SAY**
> "That answer exists nowhere in any RFC. It's in this capture. The citation is the finding span,
> not a standards document — which is how you can tell the difference between a system that
> understands your evidence and one that's just fluent."

**Q2 — capture-level:**
> "Does this capture show a STARTTLS downgrade?"

**EXPECT** `refused: false` · cites `FINDING-SMS-ENF-002-8`, `FINDING-SMS-RADAR-001-4`

**Q3 — the refusal. Ask it out loud, deliberately:**
> "What is the weather in Paris tomorrow?"

**EXPECT** `REFUSAL: outside the SecureMailScope evidence domain`

**SAY** — this is your credibility beat, do not rush it:
> "It refuses. Not because I disabled it — because the model only ever sees retrieved spans from
> this capture, the RFC set and the scoring rubric. There is no other knowledge source in the
> system. A sentence that isn't supported by a cited span gets dropped, and if nothing survives,
> the answer is a refusal. It cannot bluff, because there is nothing to bluff with."

**Q4 — the RFC layer, if time:**
> "What is the minimum RSA key size?"

**EXPECT** `2048 bits [NIST-SP800-52] [RUBRIC-SMS-KEY-001]`

**SAY**
> "Same system, same discipline, answering from the standards corpus when that's what the
> question needs."

---

### 4:40 — Integrity · 25s · `/dashboard/integrity`

**SAY**
> "The manifest screen is the same idea surfaced: every artefact the pipeline produced, each with
> its hash. This is the audit trail a regulator asks for and nobody has."

---

### 5:10 — Close · 30s

**SAY**
> "Mail security is judged on configuration. We judge it on evidence. We don't decrypt anything,
> we never touch your mail server, and we hand you a bounded number with the packet numbers
> behind it and a hash on the report."

> "It's live at raven.impiclabs.com. The corpus is public — anyone can drop in the same six
> captures and get the same six numbers we just showed you."

---

## Reference: the six captures

Measured on the deployed server. All deterministic, same package version.

| Sample | Flows | Findings | Score | Grade | Use it for |
|---|---|---|---|---|---|
| `stripped.pcap` | 1 | 2 | 84.2 | B | **main path** — SMS-ENF-002 STARTTLS stripping |
| `multihop.pcap` | 3 | 5 | 84.2 | B | **graph beat** — 4 hops, cleartext leak |
| `weak-cipher.pcap` | 1 | 4 | 71.5 | B | **richest findings** — cipher + X509 + PFS |
| `weak-key.pcap` | 1 | 3 | 86.5 | B | key-size findings |
| `no-tls.pcap` | 1 | 1 | 87.2 | B | no TLS at all |
| `advertised-unused.pcap` | 1 | 1 | 93.2 | A | STARTTLS offered, never used |

`weak-cipher.pcap` findings, if you want a fourth: `SMS-X509-002` expired/self-issued chain,
`SMS-CIPH-001` non-AEAD block cipher, `SMS-CIPH-002` non-PFS suite, `SMS-X509-001` chain not
validated against a trust anchor — all packet 3.

---

## Q&A bank

**"Is this passive? Does it touch the mail server?"**
No. We read PCAPs we already have. The only outbound call in the system is a DNS policy lookup for
MTA-STS/DANE records. We never send a packet to a mail server, never authenticate, never decrypt.

**"What's your accuracy? How do you know the score is right?"**
Determinism and an oracle. Same capture + same version = same SHA-256, proven by `make verify`.
The rubric is pinned to RFC/NIST clauses and each rule carries a rule ID. Where evidence is
missing we widen the band instead of guessing.

**"Why is the band so wide? 84.2 ± 9."**
Because TLS 1.3 hides the certificate chain — that's a real limit of the evidence, not a
confidence trick. A wide band on a rich capture is more honest than a tight band we can't support.

**"What if the mail server is on TLS 1.0?"**
It gets flagged and the band widens. RFC 9325 §4.1: implementations must support TLS 1.2.

**"Does it store the mail?"**
No. Handshake, certificate and negotiation metadata only. Never content, never credentials.

**"Can it be fooled by a crafted PCAP?"**
Yes, and we say so — the confidence band exists for that reason. An attacker who controls the
captured path controls the evidence; the band and the `NOT-OBSERVABLE` states are how the tool
refuses to overclaim.

**"Why MongoDB? Isn't that a dependency for an air-gapped tool?"**
It's optional. With no `MONGO_URI` the app runs fully in cache mode; the judge path
(upload → score → PDF) never needs a network.

---

## Conceding limits

Judges probe. Conceding these *earns* credibility — the score already carries a band, so honesty
about the boundaries is consistent with the product's own thesis.

| Ask | Concede |
|---|---|
| "Show me a real attack" | "Incident Replay is a scripted walkthrough of a finding's evidence, not a packet-level replay — we have no packet source to step through. The findings it shows are real; the animation is a presentation layer." |
| "Is the live feed real?" | "The `/ws/live` feed is a heartbeat. Continuous NIC capture is not built. PCAP upload and folder ingest are real and are the supported path." |
| "Where does the MX score come from?" | "DNS posture scoring is fixture-derived. We don't label it observed, because it isn't. The findings that carry the score all are." |
| "This is air-gapped, right?" | "The badge is an analyst mode toggle. The DNS path prefers live lookups and RAG calls a hosted model. In a true air-gap, DNS falls back to fixtures and RAG disables — the judge path is unaffected." |
| "Does it decrypt mail?" | "No, and it can't. No content, no credentials, ever." |

---

## If something breaks

| Symptom | Do this |
|---|---|
| Page won't load | Say so in one line, switch to the PDF report + graph screenshot. Don't debug live. |
| Sample dropdown empty | Samples load from the server corpus. Reload once; if still empty, use a file upload. |
| Ask refuses everything | Check a capture is loaded. With no session, questions about the capture *must* refuse — that's correct, and saying so is a feature. |
| Numbers differ from this doc | Trust the screen. This doc records what was measured; never narrate a number you can't see. |
| A judge asks something off-script | Answer from the Q&A bank, or "that's outside what the evidence supports" — which is the product's own answer, and a fine place to land. |
