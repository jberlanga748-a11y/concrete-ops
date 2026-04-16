import Link from "next/link";
import { ConcreteCalculator } from "@/components/tools/ConcreteCalculator";
import { PageHeader } from "@/components/ui/primitives";

export default function ConcreteCalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Field Tools"
        title="Concrete Calculator"
        description="Estimate slab, wall, and round-pour quantities with waste included so office staff and foremen can make faster order calls."
        action={
          <Link
            href="/dashboard/tools"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
          >
            Back to tools
          </Link>
        }
      />

      <ConcreteCalculator />
    </div>
  );
}
