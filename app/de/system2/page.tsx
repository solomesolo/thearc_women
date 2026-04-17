"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const easeOut = [0, 0, 0.2, 1] as const;

function fadeUp(delay = 0, reduced: boolean) {
  return {
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.55, delay, ease: easeOut },
  };
}

export default function WieArcFunktioniertPage() {
  const reduced = useReducedMotion() ?? false;

  return (
    <main className="min-h-screen bg-[var(--background)]" lang="de">

      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <section className="border-b border-black/[0.06] py-16 md:py-24 lg:py-28">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
              {...fadeUp(0, reduced)}
              className="order-1 lg:order-2"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
                Transparenz
              </p>
              <h1 className="mt-3 text-balance text-[2rem] font-medium leading-[1.1] tracking-tight text-[#0c0c0c] sm:text-[2.25rem] md:text-[2.5rem] lg:text-[2.75rem]">
                Wie The Arc funktioniert
              </h1>
              <p className="mt-5 max-w-[36rem] text-[1.0625rem] leading-[1.7] text-[#404040]">
                Verstehe, wie deine Gesundheitsdaten strukturiert werden, wie Erkenntnisse entstehen und wie deine Privatsphäre geschützt wird.
              </p>
              <div className="mt-8">
                <Link
                  href="/survey"
                  className="inline-flex rounded-[14px] bg-[#0c0c0c] px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-[filter] duration-[180ms] hover:brightness-[0.9]"
                >
                  Deine Gesundheitsübersicht erkunden
                </Link>
              </div>
            </motion.div>

            <motion.div
              {...fadeUp(0.06, reduced)}
              className="order-2 lg:order-1"
            >
              <div className="overflow-hidden rounded-[24px] border border-black/[0.08] bg-[#f5f5f3]">
                <Image
                  src="/images/background_image.avif"
                  alt="Gesundheitsdaten strukturiert und sicher — The Arc"
                  width={720}
                  height={540}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ── 2. INTRO ─────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 lg:py-24">
        <Container>
          <motion.div
            {...fadeUp(0, reduced)}
            className="mx-auto max-w-[42rem] text-center"
          >
            <h2 className="text-balance text-[1.5rem] font-medium leading-[1.2] tracking-tight text-[#0c0c0c] sm:text-[1.625rem] md:text-[1.75rem]">
              The Arc hilft dir, deine Gesundheitsdaten besser zu verstehen, zu strukturieren und daraus sinnvolle nächste Schritte abzuleiten.
            </h2>
            <p className="mt-5 text-[1rem] leading-[1.7] text-[#525252] md:text-[1.0625rem]">
              Die Plattform dient zur Orientierung und Unterstützung — nicht als Ersatz für ärztliche Beratung.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* ── 3. WISSENSCHAFTLICHE GRUNDLAGE ───────────────────────────────── */}
      <section className="border-t border-black/[0.06] bg-[#fafaf9] py-16 md:py-20 lg:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div {...fadeUp(0, reduced)}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
                Wissenschaftliche Grundlage
              </p>
              <h2 className="mt-3 text-balance text-[1.625rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] md:text-[1.875rem]">
                Basierend auf öffentlich zugänglichen medizinischen Leitlinien
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-[1.7] text-[#525252]">
                The Arc basiert auf öffentlich zugänglichen medizinischen Leitlinien, Vorsorgeempfehlungen und wissenschaftlichen Studien.
              </p>
              <p className="mt-3 text-[0.9375rem] leading-[1.7] text-[#525252]">
                Dabei werden etablierte Vorsorge- und Screening-Empfehlungen, häufig gemessene Laborwerte und strukturierte Bewertungsansätze berücksichtigt.
              </p>
            </motion.div>

            <motion.div {...fadeUp(0.08, reduced)} className="space-y-4">
              {[
                {
                  title: "Welche Werte bereits erfasst wurden",
                  body: "The Arc ordnet deine vorhandenen Daten bekannten Screening-Standards zu und zeigt, was bereits abgedeckt ist.",
                },
                {
                  title: "Was möglicherweise fehlt oder veraltet ist",
                  body: "Lücken und fällige Checks werden klar sichtbar gemacht, damit nichts Wichtiges übersehen wird.",
                },
                {
                  title: "Welche Themen besprochen werden könnten",
                  body: "Befunde, die ein Gespräch mit Fachpersonal sinnvoll machen könnten, werden hervorgehoben — nicht vorgeschrieben.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  {...fadeUp(i * 0.06, reduced)}
                  className="rounded-[16px] border border-black/[0.08] bg-white p-5"
                >
                  <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{item.title}</p>
                  <p className="mt-1.5 text-[0.875rem] leading-[1.65] text-[#525252]">{item.body}</p>
                </motion.div>
              ))}
              <p className="pt-1 text-[0.8125rem] leading-[1.55] text-[#a3a3a3]">
                Alle Inhalte werden vereinfacht und verständlich dargestellt.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ── 4. ORIENTIERUNG STATT DIAGNOSE ───────────────────────────────── */}
      <section className="py-16 md:py-20 lg:py-24">
        <Container>
          <motion.div {...fadeUp(0, reduced)} className="mx-auto max-w-[44rem] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              Orientierung statt Diagnose
            </p>
            <h2 className="mt-3 text-balance text-[1.625rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] md:text-[1.875rem]">
              The Arc stellt keine Diagnosen und gibt keine Behandlungen vor
            </h2>
          </motion.div>

          <div className="mx-auto mt-10 grid max-w-[52rem] grid-cols-1 gap-5 sm:grid-cols-2 md:mt-12">
            <motion.div
              {...fadeUp(0.04, reduced)}
              className="rounded-[20px] border border-black/[0.08] bg-white/[0.55] p-6 md:p-7"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#737373]">
                Was The Arc tut
              </p>
              <ul className="mt-5 space-y-3.5">
                {[
                  "Deine Gesundheitsdaten strukturieren und ordnen",
                  "Mögliche Lücken sichtbar machen",
                  "Nächste Schritte besser einordnen helfen",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-[0.2em] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0c0c0c]/[0.06]"
                      aria-hidden
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-[#0c0c0c]/[0.5]">
                        <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-[0.9375rem] leading-[1.6] text-[#404040]">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              {...fadeUp(0.1, reduced)}
              className="rounded-[20px] border border-black/[0.07] bg-[#fafaf9] p-6 md:p-7"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a3a3a3]">
                Was The Arc nicht ist
              </p>
              <ul className="mt-5 space-y-3.5">
                {[
                  "Keine Diagnose",
                  "Keine Behandlungsempfehlung",
                  "Kein Ersatz für qualifiziertes Fachpersonal",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-[0.2em] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/[0.12]"
                      aria-hidden
                    >
                      <span className="h-px w-2.5 bg-black/[0.2]" />
                    </span>
                    <span className="text-[0.9375rem] leading-[1.6] text-[#737373]">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-[0.8125rem] leading-[1.55] text-[#a3a3a3]">
                Medizinische Entscheidungen sollten immer gemeinsam mit qualifiziertem Fachpersonal getroffen werden.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ── 5. UMGANG MIT DEINEN DATEN ───────────────────────────────────── */}
      <section className="border-t border-black/[0.06] bg-[#fafaf9] py-16 md:py-20 lg:py-24">
        <Container>
          <motion.div {...fadeUp(0, reduced)} className="mx-auto max-w-[44rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              Umgang mit deinen Daten
            </p>
            <h2 className="mt-3 text-balance text-[1.625rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] md:text-[1.875rem]">
              Du behältst jederzeit die Kontrolle über deine Daten
            </h2>

            <ul className="mt-8 space-y-5">
              {[
                {
                  title: "Das Hochladen von Befunden ist optional",
                  body: "Du entscheidest selbst, was du teilst. The Arc funktioniert auch ohne Uploads — sie liefern nur zusätzlichen Kontext, wenn du das möchtest.",
                },
                {
                  title: "Ausschließlich für deine persönliche Übersicht",
                  body: "Deine Daten werden nur verwendet, um die Erkenntnisse und die Übersicht zu erstellen, die dir angezeigt werden.",
                },
                {
                  title: "Keine Weitergabe zu Werbezwecken",
                  body: "Wir verkaufen oder teilen deine persönlichen Gesundheitsdaten nicht für Werbung oder kommerzielle Zwecke.",
                },
              ].map((item, i) => (
                <motion.li
                  key={item.title}
                  {...fadeUp(i * 0.06, reduced)}
                  className="flex gap-4"
                >
                  <span
                    className="mt-[0.35em] h-2 w-2 shrink-0 rounded-full bg-[#0c0c0c]/[0.2]"
                    aria-hidden
                  />
                  <div>
                    <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{item.title}</p>
                    <p className="mt-1 text-[0.9375rem] leading-[1.65] text-[#525252]">{item.body}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <p className="mt-7 text-[0.8125rem] leading-[1.55] text-[#a3a3a3]">
              Wir verarbeiten nur die Daten, die für die Funktion der Plattform notwendig sind.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* ── 6. DATENSCHUTZ & SICHERHEIT ──────────────────────────────────── */}
      <section className="py-16 md:py-20 lg:py-24">
        <Container>
          <motion.div {...fadeUp(0, reduced)} className="mx-auto max-w-[44rem] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              Datenschutz und Sicherheit
            </p>
            <h2 className="mt-3 text-balance text-[1.625rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] md:text-[1.875rem]">
              Der Schutz deiner Daten hat höchste Priorität
            </h2>
            <p className="mt-4 text-[0.9375rem] leading-[1.7] text-[#525252]">
              The Arc wird von Grund auf nach datenschutzorientierten Prinzipien entwickelt.
            </p>
          </motion.div>

          <div className="mx-auto mt-10 grid max-w-[56rem] grid-cols-1 gap-5 sm:grid-cols-3 md:mt-12 md:gap-6">
            {[
              {
                title: "Sichere Speicherung",
                body: "Daten werden sicher gespeichert, mit eingeschränktem Zugriff auf allen Ebenen.",
              },
              {
                title: "Eingeschränkter Zugriff",
                body: "Nur der unbedingt notwendige Zugriff wird internen Systemen und Personen gewährt.",
              },
              {
                title: "DSGVO-Ausrichtung",
                body: "Systeme werden gemäß den DSGVO-Anforderungen entwickelt und kontinuierlich verbessert.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                {...fadeUp(i * 0.07, reduced)}
                className="rounded-[20px] border border-black/[0.08] bg-white/[0.55] p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
              >
                <p className="text-[0.9375rem] font-semibold text-[#0c0c0c]">{card.title}</p>
                <p className="mt-2 text-[0.9375rem] leading-[1.65] text-[#525252]">{card.body}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── 7. TRANSPARENZ ───────────────────────────────────────────────── */}
      <section className="border-t border-black/[0.06] bg-[#fafaf9] py-16 md:py-20 lg:py-24">
        <Container>
          <motion.div {...fadeUp(0, reduced)} className="mx-auto max-w-[44rem] text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737373]">
              Transparenz
            </p>
            <h2 className="mt-3 text-balance text-[1.625rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] md:text-[1.875rem]">
              Vertrauen entsteht durch Nachvollziehbarkeit
            </h2>
          </motion.div>

          <ul className="mx-auto mt-10 max-w-[38rem] space-y-4">
            {[
              "Verständlich erklären, wie Ergebnisse zustande kommen",
              "Keine intransparenten Entscheidungslogiken verwenden",
              "Grenzen der Plattform offen kommunizieren",
            ].map((item, i) => (
              <motion.li
                key={item}
                {...fadeUp(i * 0.07, reduced)}
                className="flex items-start gap-4 rounded-[16px] border border-black/[0.08] bg-white p-5"
              >
                <span
                  className="mt-[0.2em] h-2 w-2 shrink-0 rounded-full bg-[#0c0c0c]/[0.25]"
                  aria-hidden
                />
                <span className="text-[0.9375rem] leading-[1.6] text-[#404040]">{item}</span>
              </motion.li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ── 8. ABSCHLUSS ─────────────────────────────────────────────────── */}
      <section className="border-t border-black/[0.06] py-20 md:py-28 lg:py-32">
        <Container>
          <motion.div
            {...fadeUp(0, reduced)}
            className="mx-auto max-w-[40rem] text-center"
          >
            <h2 className="text-balance text-[1.75rem] font-medium leading-[1.15] tracking-tight text-[#0c0c0c] sm:text-[1.95rem] md:text-[2.1rem]">
              The Arc unterstützt dich dabei, informiert und strukturiert mit deiner Gesundheit umzugehen
            </h2>
            <p className="mt-4 text-[1rem] leading-[1.7] text-[#525252] md:text-[1.0625rem]">
              Und bessere Gespräche mit medizinischem Fachpersonal zu führen.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/survey"
                className="rounded-[14px] bg-[#0c0c0c] px-6 py-3 text-[0.9375rem] font-medium text-white transition-[filter] duration-[180ms] hover:brightness-[0.9]"
              >
                Jetzt starten
              </Link>
              <Link
                href="/de"
                className="rounded-[14px] border border-black/[0.14] px-6 py-3 text-[0.9375rem] font-medium text-[#404040] transition-colors hover:bg-[#f5f5f4]"
              >
                Zur Startseite
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

    </main>
  );
}
