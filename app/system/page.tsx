import { permanentRedirect } from "next/navigation";

/** Former Health System explainer; article library lives at /blog. */
export default function SystemPage() {
  permanentRedirect("/blog");
}
