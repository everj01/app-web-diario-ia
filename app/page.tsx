import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Diary from "@/components/Diary";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <Diary user={user} />;
}
