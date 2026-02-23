import FollowListPage from "@/components/profile/FollowListPage";

export default function FollowingPage({ params }: { params: { userId: string } }) {
  return <FollowListPage userId={params.userId} mode="following" />;
}
