import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { MoodCard } from "../components/MoodCard";
import { MoodCardSkeleton } from "../components/Skeleton";
import { Button } from "../components/ui/Button";
import { CreateMoodForm } from "../features/mood/components/CreateMoodForm";
import { queryKeys } from "../constants/queryKeys";
import { ROUTES } from "../constants/routes";
import { themeClasses } from "../lib/themeClasses";
import { getApiErrorMessage } from "../services/apiClient";
import {
  fetchGroup,
  fetchGroupMembers,
  fetchGroupMoods,
  joinGroup,
  kickGroupMember,
  leaveGroup,
} from "../services/groupService";
import { useState } from "react";

export function GroupDetailPage() {
  const { t } = useTranslation();
  const { groupId = "" } = useParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  const groupQuery = useQuery({
    queryKey: queryKeys.groupDetail(groupId),
    queryFn: () => fetchGroup(groupId),
    enabled: Boolean(groupId),
  });

  const moodsQuery = useInfiniteQuery({
    queryKey: queryKeys.groupMoods(groupId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchGroupMoods(groupId, { cursor: pageParam }),
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
    enabled: Boolean(groupId) && Boolean(groupQuery.data?.isMember),
  });

  const membersQuery = useQuery({
    queryKey: queryKeys.groupMembers(groupId),
    queryFn: () => fetchGroupMembers(groupId),
    enabled: Boolean(groupId) && Boolean(groupQuery.data?.isOwner),
  });

  const invalidateGroup = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.groupDetail(groupId) });
    await queryClient.invalidateQueries({ queryKey: ["groups"] });
    await queryClient.invalidateQueries({ queryKey: queryKeys.groupMoods(groupId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
  };

  const joinMutation = useMutation({
    mutationFn: () => joinGroup(groupId),
    onSuccess: async () => {
      setActionError(null);
      await invalidateGroup();
    },
    onError: (error) => setActionError(getApiErrorMessage(error, t("groups.joinError"))),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveGroup(groupId),
    onSuccess: async () => {
      setActionError(null);
      setShowComposer(false);
      await invalidateGroup();
    },
    onError: (error) => setActionError(getApiErrorMessage(error, t("groups.leaveError"))),
  });

  const kickMutation = useMutation({
    mutationFn: (userId: string) => kickGroupMember(groupId, userId),
    onSuccess: async () => {
      setActionError(null);
      await invalidateGroup();
    },
    onError: (error) => setActionError(getApiErrorMessage(error, t("groups.kickError"))),
  });

  if (groupQuery.isLoading) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className={`${themeClasses.cardLg} h-48 animate-pulse bg-stone-100 dark:bg-stone-800`} />
      </section>
    );
  }

  if (groupQuery.isError || !groupQuery.data) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          title={t("groups.detailErrorTitle")}
          description={t("groups.detailErrorDescription")}
          action={
            <Link to={ROUTES.groups} className={themeClasses.link}>
              {t("groups.backToGroups")}
            </Link>
          }
        />
      </section>
    );
  }

  const group = groupQuery.data;
  const moods = moodsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to={ROUTES.groups} className={`text-sm ${themeClasses.link}`}>
        ← {t("groups.backToGroups")}
      </Link>

      <div className={`mt-4 overflow-hidden ${themeClasses.cardLg}`}>
        <div className="relative aspect-[21/9] bg-gradient-to-br from-orange-200 via-amber-100 to-stone-200 dark:from-orange-950 dark:via-stone-900 dark:to-stone-800">
          {group.coverImageUrl ? (
            <img src={group.coverImageUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="space-y-4 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className={`font-display text-3xl font-semibold ${themeClasses.heading}`}>
                {group.name}
              </h1>
              <p className={`mt-1 text-sm ${themeClasses.muted}`}>
                {t("groups.memberCount", { count: group.memberCount })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!group.isMember ? (
                <Button
                  type="button"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                >
                  {joinMutation.isPending ? t("common.loading") : t("groups.join")}
                </Button>
              ) : !group.isOwner ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => leaveMutation.mutate()}
                  disabled={leaveMutation.isPending}
                >
                  {leaveMutation.isPending ? t("common.loading") : t("groups.leave")}
                </Button>
              ) : null}
              {group.isMember ? (
                <Button type="button" variant="secondary" onClick={() => setShowComposer((v) => !v)}>
                  {showComposer ? t("common.cancel") : t("groups.post")}
                </Button>
              ) : null}
            </div>
          </div>

          <p className={themeClasses.body}>
            {group.description.trim() || t("groups.noDescription")}
          </p>

          {actionError ? <div className={themeClasses.errorBox}>{actionError}</div> : null}

          {!group.isMember ? (
            <p className={`rounded-xl bg-stone-50 px-4 py-3 text-sm dark:bg-stone-950 ${themeClasses.body}`}>
              {t("groups.joinToView")}
            </p>
          ) : null}
        </div>
      </div>

      {group.isMember && showComposer ? (
        <div className={`mt-6 ${themeClasses.cardLg} p-5`}>
          <h2 className={`mb-4 text-lg font-semibold ${themeClasses.heading}`}>
            {t("groups.postTitle")}
          </h2>
          <CreateMoodForm
            groupId={groupId}
            onSuccess={() => {
              setShowComposer(false);
              void queryClient.invalidateQueries({ queryKey: queryKeys.groupMoods(groupId) });
            }}
          />
        </div>
      ) : null}

      {group.isMember ? (
        <div className="mt-8 space-y-4">
          <h2 className={`text-lg font-semibold ${themeClasses.heading}`}>{t("groups.posts")}</h2>
          {moodsQuery.isLoading ? (
            <>
              <MoodCardSkeleton />
              <MoodCardSkeleton />
            </>
          ) : moodsQuery.isError ? (
            <EmptyState
              title={t("groups.postsErrorTitle")}
              description={t("groups.postsErrorDescription")}
            />
          ) : moods.length === 0 ? (
            <EmptyState
              title={t("groups.postsEmptyTitle")}
              description={t("groups.postsEmptyDescription")}
            />
          ) : (
            moods.map((mood) => <MoodCard key={mood.id} mood={mood} />)
          )}

          {moodsQuery.hasNextPage ? (
            <button
              type="button"
              onClick={() => void moodsQuery.fetchNextPage()}
              disabled={moodsQuery.isFetchingNextPage}
              className="w-full rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              {moodsQuery.isFetchingNextPage ? t("common.loading") : t("feed.loadMore")}
            </button>
          ) : null}
        </div>
      ) : null}

      {group.isOwner ? (
        <div className={`mt-10 ${themeClasses.cardLg} p-5`}>
          <h2 className={`text-lg font-semibold ${themeClasses.heading}`}>
            {t("groups.manageMembers")}
          </h2>
          <p className={`mt-1 text-sm ${themeClasses.muted}`}>{t("groups.manageMembersHint")}</p>
          {membersQuery.isLoading ? (
            <p className={`mt-4 text-sm ${themeClasses.muted}`}>{t("common.loading")}</p>
          ) : membersQuery.isError ? (
            <p className={`mt-4 text-sm text-red-600`}>{t("groups.membersError")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
              {(membersQuery.data ?? []).map((member) => (
                <li key={member.membershipId} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className={`text-sm font-medium ${themeClasses.heading}`}>
                      {member.displayLabel}
                    </p>
                    <p className={`text-xs ${themeClasses.muted}`}>
                      {member.role === "owner" ? t("groups.roleOwner") : t("groups.roleMember")} ·{" "}
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {member.role !== "owner" ? (
                    <button
                      type="button"
                      className="text-sm text-red-700 hover:underline dark:text-red-400"
                      disabled={kickMutation.isPending}
                      onClick={() => kickMutation.mutate(member.userId)}
                    >
                      {t("groups.kick")}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
