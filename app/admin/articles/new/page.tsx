import Link from "next/link";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/articles"
          className="text-sm text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)]"
        >
          ← Articles
        </Link>
        <h1 className="text-xl font-medium text-[var(--text-primary)]">
          New article
        </h1>
      </div>
      <ArticleForm />
    </div>
  );
}
