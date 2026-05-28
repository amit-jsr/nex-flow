import PlatformConsole from "../../../components/PlatformConsole";

export function generateStaticParams() {
  return [{ id: "overview" }];
}

export default function WorkflowBuilderPage() {
  return <PlatformConsole initialPage="workflows" />;
}
