import PlatformConsole from "../../../components/PlatformConsole";

export function generateStaticParams() {
  return [{ id: "overview" }];
}

export default function AgentDetailPage() {
  return <PlatformConsole initialPage="agents" />;
}
