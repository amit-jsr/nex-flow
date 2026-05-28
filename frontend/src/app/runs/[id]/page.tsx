import PlatformConsole from "../../../components/PlatformConsole";

export function generateStaticParams() {
  return [{ id: "overview" }];
}

export default function RunMonitorPage() {
  return <PlatformConsole initialPage="runs" />;
}
