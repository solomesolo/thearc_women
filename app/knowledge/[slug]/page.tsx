import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getArticleBySlug, KNOWLEDGE_ARTICLES } from "@/content/knowledge";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return KNOWLEDGE_ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function KnowledgeArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <Container className="py-16 md:py-24">
        <div className="mx-auto max-w-[48rem]">
          <Link
            href="/knowledge"
            className="text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
          >
            ← Knowledge Hub
          </Link>

          <p className="mt-4 text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
            {article.category}
          </p>
          <h1 className="mt-2 text-[1.875rem] font-medium leading-[1.2] tracking-tight md:text-[2.25rem] lg:text-[2.5rem]">
            {article.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {article.readTime} read · {article.date}
          </p>

          {article.contextParagraph && (
            <p className="mt-8 text-base leading-[1.7] text-[var(--text-secondary)] md:text-lg">
              {article.contextParagraph}
            </p>
          )}

          {article.whyTrending && (
            <>
              <h2 className="mt-10 text-sm font-medium uppercase tracking-wider text-[var(--text-primary)]">
                Why this is trending
              </h2>
              <p className="mt-2 text-base leading-[1.7] text-[var(--text-secondary)]">
                {article.whyTrending}
              </p>
            </>
          )}

          {article.whatResearchSays && (
            <>
              <h2 className="mt-10 text-sm font-medium uppercase tracking-wider text-[var(--text-primary)]">
                What research actually says
              </h2>
              <p className="mt-2 text-base leading-[1.7] text-[var(--text-secondary)]">
                {article.whatResearchSays}
              </p>
            </>
          )}

          {article.whatItMeansForWomen && (
            <>
              <h2 className="mt-10 text-sm font-medium uppercase tracking-wider text-[var(--text-primary)]">
                What this means for women
              </h2>
              <p className="mt-2 text-base leading-[1.7] text-[var(--text-secondary)]">
                {article.whatItMeansForWomen}
              </p>
            </>
          )}

          {article.whenItApplies && (
            <>
              <h2 className="mt-10 text-sm font-medium uppercase tracking-wider text-[var(--text-primary)]">
                When it might apply
              </h2>
              <p className="mt-2 text-base leading-[1.7] text-[var(--text-secondary)]">
                {article.whenItApplies}
              </p>
            </>
          )}

          {article.whenItDoesNot && (
            <>
              <h2 className="mt-10 text-sm font-medium uppercase tracking-wider text-[var(--text-primary)]">
                When it might not
              </h2>
              <p className="mt-2 text-base leading-[1.7] text-[var(--text-secondary)]">
                {article.whenItDoesNot}
              </p>
            </>
          )}

          {article.implementationConsiderations && (
            <>
              <h2 className="mt-10 text-sm font-medium uppercase tracking-wider text-[var(--text-primary)]">
                Implementation considerations
              </h2>
              <p className="mt-2 text-base leading-[1.7] text-[var(--text-secondary)]">
                {article.implementationConsiderations}
              </p>
            </>
          )}

          {article.sources && article.sources.length > 0 && (
            <>
              <h2 className="mt-10 text-sm font-medium uppercase tracking-wider text-[var(--text-primary)]">
                Sources
              </h2>
              <ul className="mt-2 list-none space-y-1 pl-0 text-sm leading-[1.6] text-[var(--text-secondary)]">
                {article.sources.map((src, i) => (
                  <li key={i}>{src}</li>
                ))}
              </ul>
            </>
          )}

          {/* Placeholder for "Related to your profile" when user logged in */}
          <div className="mt-16 border-t border-[var(--color-border-hairline)] pt-10">
            <p className="text-sm text-[var(--text-secondary)]">
              Related articles from the Knowledge Hub:
            </p>
            <ul className="mt-3 list-none space-y-2 pl-0">
              {KNOWLEDGE_ARTICLES.filter((a) => a.slug !== article.slug)
                .slice(0, 2)
                .map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/knowledge/${a.slug}`}
                      className="text-base text-[var(--text-primary)] underline hover:no-underline"
                    >
                      {a.title}
                    </Link>
                    <span className="ml-2 text-sm text-[var(--text-secondary)]">
                      {a.readTime}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </Container>
    </main>
  );
}
