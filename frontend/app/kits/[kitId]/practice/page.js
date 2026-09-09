import AppShell from "../../../../components/ui/AppShell";
import PracticeView from "../../../../components/practice/PracticeView";

export default async function PracticePage({ params }) {
  const { kitId } = await params;

  return <AppShell><PracticeView kitId={kitId} /></AppShell>;
}
