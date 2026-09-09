import AppShell from "../../../components/ui/AppShell";
import KitView from "../../../components/kit/KitView";

export default async function KitPage({ params }) {
  const { kitId } = await params;

  return <AppShell><KitView kitId={kitId} /></AppShell>;
}
