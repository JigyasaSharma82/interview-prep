import AppShell from "../../../components/ui/AppShell";
import NewKitForm from "../../../components/kit/NewKitForm";

export default function NewKitPage() {
  return <AppShell><main className="page form-layout"><span className="eyebrow">Start with the source</span><h1>Build your prep kit.</h1><p className="lede">Give us the role and the runway. We&apos;ll organize the research and practice plan.</p><NewKitForm /></main></AppShell>;
}
