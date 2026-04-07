import { DemoGate } from "@/components/demo/demo-gate";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata(
  "Demo Portal",
  "Preview a sample Salkaro client portal with mock project data.",
);

export default function DemoPage() {
  return <DemoGate />;
}
