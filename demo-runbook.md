# Demo runbook — SIH26159 SecureMailScope

**The whole demo, minute by minute.** Follow it in order. Everything here is verified working
as of the last check (76 tests green, all 27 API endpoints 200, all 8 dashboard pages 200).

---

## Before you present (5 minutes, do this first)

```bash
cd platform
./demo.sh
```

It starts the backend on `:8001` and the frontend on `:3000`, waits for both, then pre-loads all
six sample captures so **no page is ever empty on stage**. Wait for the "Demo ready" banner.

Open these two tabs in advance and leave them ready:

| Tab | URL |
|---|---|
| Ingest | http://127.0.0.1:3000/ |
| Posture | http://127.0.0.1:3000/dashboard/posture |

**Emergency recovery:** if anything goes blank, run `./demo.sh` again. It rewarms everything in
about 20 seconds. This is the one thing to memorise.

**Do not restart the backend mid-demo.** Sessions are built in memory at ingest, so a restart
empties reports that were created before it.

---

## The run

Total: **~6 minutes.** If you're cut to 3, do minutes 0, 2 and 5 — that alone carries the demo.

### 0:00 — Hook (30 sec) · Problem slide
> "Email encryption is optional. Every server can skip it, and nothing breaks when they do.
> A man-in-the-middle can remove the STARTTLS token, and both endpoints still log *success*.
> ~30% of email certificates are invalid. The problem isn't that encryption is hard — it's
> that we have no way to know whether it actually happened."

**Do not** start on your own product. Earn the problem first.

---

### 0:30 — Solution (30 sec) · Ingest screen, http://127.0.0.1:3000/
Click **"stripped"** sample. Let it process.
> "SecureMailScope is a security camera for email traffic. It reads a packet capture someone
> else already took. It never probes a server, never decrypts, never reads message content.
> The only network call in the whole system is reading DNS policy records."

**One click. Let it run.** This is the moment that has to work — protect it above everything.

---

### 1:00 — Posture (45 sec) · /dashboard/posture
> "Here's the result: **84.2, with a confidence band of 75.4 to 93.0, Grade B**."

Point at the band. This is your credibility beat:
> "Notice we publish the interval. A single number would imply a precision the packet doesn't
> support. One observed hop genuinely is that uncertain, and saying so is the point."

Then point at the tri-state summary — **SECURE / VULNERABLE / NOT-OBSERVABLE**:
> "X.509 chain under TLS 1.3 shows NOT-OBSERVABLE, not 'clean'. We never claim we verified
> something we couldn't see — and that's what widens the band."

---

### 1:45 — Findings (45 sec) · /dashboard/findings
Open the **SMS-ENF-002** evidence drawer.
> "Every finding is anchored to a packet. Packet number, byte offset, rule ID, CVSS, CWE.
> This is usable in an audit — not just in a demo."

**This is the judges' "is it real" moment.** Don't rush it.

---

### 2:30 — Delivery Graph (60 sec) · /dashboard/graph · **YOUR BEST SLIDE**
Load the **multihop** sample first so all 3 hops appear.
> "This is the part no other tool in this space does. Most tooling grades the endpoints you
> already trust. But mail is only as strong as its weakest hop.
>
> Look: hop 1 and hop 3 are both TLS 1.3, completely secure. Hop 2 strips STARTTLS on a second
> delivery path. An endpoint-only tool reports *secure* — and the exposure survives.
>
> For a CERT-In or ministry survey, this is the difference between a report that gets filed and
> a report that gets acted on. We're not handing over '84 out of 100'. We're handing over
> *this relay, this hop, this fix*."

**Spend your time here.** If you only do one screen, do this one.

---

### 3:30 — Attack Lens (30 sec) · /dashboard/lens
> "The lens forecasts the next likely attack, but every forecast is anchored to a rule that
> actually fired in your evidence. It can't speculate — it only ranks what it observed."

---

### 4:00 — Ask / RAG (60 sec) · /dashboard/ask
Type this **exact** question — it's the most impressive one:

```
Why is STARTTLS stripping dangerous?
```

> "Grounded retrieval. Every sentence is cited, and anything that can't be cited gets removed
> rather than shipped. It refuses instead of inventing."

Then, to prove the cite-or-refuse guard, type garbage:

```
asdkjh qwe zxcmnbv
```

> "Nonsense in, refusal out. A system that always answers is a system that's making things up."

Other good ones: `How is the posture index calculated?` · `What does RFC 8461 require for MTA-STS?`

---

### 4:45 — Integrity (30 sec) · /dashboard/integrity
Run **verify**.
> "Same capture, same corpus, same SHA-256 — every time. And the corpus itself is hashed, so you
> can prove the reference standards didn't quietly change underneath you."

---

### 5:15 — Close: Impact & Benefits (45 sec) · insert the pack visuals
Show **`impact-weakest-hop`** then **`benefit-economic`** from
`SIH26159-Impact-Benefits-Pack/slides/`.

> "Three groups benefit. SOC teams catch downgrade as it happens. Forensic examiners get a
> hash-signed evidence chain they can defend. And administrators get copy-paste config.
>
> Economically: minutes to posture instead of days of manual review, no per-host SaaS licence
> on a fleet, and audit evidence that reduces regulatory exposure.
>
> It's passive and air-gapped, so a national deployment keeps its mail metadata on premises."

**Then stop talking.** Let them ask.

---

## Questions you will get, and the answers

| Question | Answer |
|---|---|
| "How much money does it save?" | Don't quote a multiple. "We eliminate the mechanical part of analysis — stream reassembly and hop-checking. The honest evaluation is to time manual review against the tool on your own captures." |
| "Is it really air-gapped with an AI assistant?" | "The analysis core is air-gapped and always was. The optional grounded assistant is the single feature that makes a network call — it retrieves only from a local index and refuses rather than inventing. We label it explicitly." |
| "Why is the confidence band so wide?" | "Because one observed hop genuinely is that uncertain. Publishing the band is the point." |
| "Does it touch a live mail server?" | "No. It reads a capture someone else already took. That's what makes it usable where probing would tip off an adversary." |
| "Does the score use AI?" | "No. The score comes from a deterministic rule engine citing RFC and NIST. The detector is threshold statistics. ML only ranks — it never changes a score." |
| "What if two agencies disagree?" | "They shouldn't be able to. The report is sealed with a SHA-256; same capture and corpus gives the same digest. Disagreement becomes a corpus-version problem, not a judgement problem." |
| "What are the limitations?" | "Certificate chain validation isn't observable under TLS 1.3 — we mark it NOT-OBSERVABLE rather than guessing. Live DANE needs a DNSSEC-validating resolver. And we never validate trust without a trust store." |

**Never invent a number.** "We don't have that measured" is a stronger answer than a guess.

---

## If something breaks

| Symptom | Do this |
|---|---|
| Any page blank / zero findings | `./demo.sh` again (≈20 s), re-click the sample |
| Ask page says unavailable | Backend is down — check `/tmp/sms-backend.log` |
| Backend won't start | Port 8001 busy: `lsof -ti:8001 \| xargs kill -9` |
| Frontend won't start | Port 3000 busy: `lsof -ti:3000 \| xargs kill -9` |
| Want a clean slate | `./demo.sh --reset` |

Logs: `/tmp/sms-backend.log` · `/tmp/sms-frontend.log`
