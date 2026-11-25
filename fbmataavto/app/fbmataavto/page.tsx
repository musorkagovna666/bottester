import { headers } from "next/headers";
import { getIdentity } from "../../cursor/identity";
import { Dashboard } from "./ui";

export const dynamic = "force-dynamic";

export default async function FbMataAvtoPage() {
  const identity = await getIdentity(await headers());
  const viewer =
    identity.verified && identity.kind === "person"
      ? { name: identity.name || "Viewer", simulated: identity.simulated === true }
      : { name: "Akimova Pride", simulated: true };

  return <Dashboard viewer={viewer} />;
}
