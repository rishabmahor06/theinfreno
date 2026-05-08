import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import wodImg from "@/assets/program-wod.jpg";
import strengthImg from "@/assets/program-strength.jpg";
import enduranceImg from "@/assets/program-endurance.jpg";
import fundamentalsImg from "@/assets/program-fundamentals.jpg";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — IronFit Updates & Training Tips" },
      { name: "description", content: "Articles on CrossFit, nutrition, recovery, and member success stories." },
    ],
  }),
  component: BlogPage,
});

const POSTS = [
  { slug: "what-it-really-means", title: "Success in CrossFit: what it can really mean", excerpt: "It's not the leaderboard. It's the consistency.", img: wodImg, date: "Oct 28, 2026" },
  { slug: "didnt-make-me-an-athlete", title: "CrossFit didn't make me an athlete. It made me a better one.", excerpt: "How CrossFit transformed my approach to training.", img: strengthImg, date: "Oct 20, 2026" },
  { slug: "stress-free-resolutions", title: "8 no-stress tips to jump-start your new year resolutions", excerpt: "Sustainable changes you can stick with.", img: enduranceImg, date: "Oct 15, 2026" },
  { slug: "what-it-can-really-mean", title: "Success in CrossFit: what it can really mean", excerpt: "Community, consistency, and showing up.", img: fundamentalsImg, date: "Oct 10, 2026" },
];

function BlogPage() {
  return (
    <SiteShell>
      <section className="bg-surface-dark py-16 text-surface-dark-foreground">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">From the Blog</p>
          <h1 className="mt-3 font-display text-5xl">Updates & Stories</h1>
        </div>
      </section>
      <section className="bg-background py-12">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-2 lg:grid-cols-4">
          {POSTS.map((p) => (
            <Link key={p.slug} to="/blog" className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={p.img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-widest text-primary">{p.date}</p>
                <h2 className="mt-2 font-semibold leading-tight">{p.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
