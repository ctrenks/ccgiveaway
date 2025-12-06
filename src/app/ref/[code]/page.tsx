import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function ReferralPage({ params }: Props) {
  const { code } = await params;

  // Redirect to API route that will set the cookie
  redirect(`/api/ref/${code}`);
}

