import Link from "next/link";
import { AppIcon } from "@/components/ui/icons";
import { EmptyState, PageHeader, PageActionLink, SectionCard, StatusPill } from "@/components/ui/primitives";

const tools = [
  {
    href: "/dashboard/tools/concrete-calculator",
    title: "Concrete Calculator",
    description:
      "Calculate slab, wall, and round-pour volumes with built-in waste and optional wall-opening deductions.",
    bullets: ["Desktop-first layout", "Copyable results", "10-yard truck estimate"],
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field Tools"
        title="Tools"
        description="Keep fast field references in one place for office staff and foremen. Start with the concrete calculator, then add more utility tools over time."
        action={<PageActionLink href="/dashboard/tools/concrete-calculator">Open calculator</PageActionLink>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <SectionCard
          title="Available now"
          description="Professional field calculators built to be quick on desktop today and easy to extend later."
        >
          <div className="grid gap-4">
            {tools.map((tool) => (
              <div
                key={tool.href}
                className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_12px_30px_rgba(24,24,27,0.06)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-orange-50 p-3 text-orange-500">
                        <AppIcon icon="calculator" className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight text-zinc-950">{tool.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-zinc-600">{tool.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tool.bullets.map((bullet) => (
                        <StatusPill key={bullet} tone="info">
                          {bullet}
                        </StatusPill>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={tool.href}
                    className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-600"
                  >
                    Launch tool
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <EmptyState
          title="More tools are on deck"
          description="This section is set up to hold quick field references, calculators, and utility workflows as the operations suite grows."
          action={
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
            >
              Back to jobs
            </Link>
          }
          icon="truck"
        />
      </div>
    </div>
  );
}
