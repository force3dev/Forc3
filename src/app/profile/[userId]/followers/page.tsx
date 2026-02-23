import FollowListPage from "@/components/profile/FollowListPage";

export default function FollowersPage({ params }: { params: { userId: string } }) {
  return <FollowListPage userId={params.userId} mode="followers" />;
}
