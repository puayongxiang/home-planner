import { redirect } from "next/navigation";
import BrowseClient from "./BrowseClient";
import { getAuthenticatedUser } from "@/lib/auth";
import { isEditorEmail } from "@/lib/editorAccess";

const isCloudDeploy = process.env.VERCEL === "1";

export default async function BrowsePage() {
  if (isCloudDeploy) {
    const user = await getAuthenticatedUser();
    if (!isEditorEmail(user?.email)) {
      redirect("/");
    }
  }

  return <BrowseClient />;
}
