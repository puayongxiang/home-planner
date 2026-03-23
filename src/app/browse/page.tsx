import { redirect } from "next/navigation";
import BrowseClient from "./BrowseClient";
import { getAuthenticatedUser } from "@/lib/auth";
import { isEditorEmail } from "@/lib/editorAccess";

const enableInternalTools = process.env.ENABLE_INTERNAL_TOOLS === "1";

export default async function BrowsePage() {
  if (!enableInternalTools) {
    const user = await getAuthenticatedUser();
    if (!isEditorEmail(user?.email)) {
      redirect("/");
    }
  }

  return <BrowseClient />;
}
