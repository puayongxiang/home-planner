import { redirect } from "next/navigation";
import BrowseClient from "./BrowseClient";
import { getAuthenticatedUser } from "@/lib/auth";
import { isEditorEmail } from "@/lib/editorAccess";

export default async function BrowsePage() {
  const user = await getAuthenticatedUser();
  if (!isEditorEmail(user?.email)) {
    redirect("/");
  }

  return <BrowseClient />;
}
