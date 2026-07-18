import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { Button } from "../components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../components/ui/DropdownMenu";
import { GroupCard } from "../features/groups/components/GroupCard";
import { queryKeys } from "../constants/queryKeys";
import { ROUTES } from "../constants/routes";
import { themeClasses } from "../lib/themeClasses";
import { getApiErrorMessage } from "../services/apiClient";
import { createGroup, fetchGroups, fetchMyGroups } from "../services/groupService";

const MY_GROUPS_CHIP_LIMIT = 8;

export function GroupsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const myGroupsQuery = useQuery({
    queryKey: queryKeys.myGroups,
    queryFn: fetchMyGroups,
  });

  const groupsQuery = useInfiniteQuery({
    queryKey: queryKeys.groups(debouncedQ || undefined),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchGroups({
        q: debouncedQ || undefined,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
  });

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: async () => {
      setShowCreate(false);
      setName("");
      setDescription("");
      setCoverImageUrl("");
      setCreateError(null);
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (error) => {
      setCreateError(getApiErrorMessage(error, t("groups.createError")));
    },
  });

  const groups = groupsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const myGroups = myGroupsQuery.data ?? [];
  const visibleMyGroups = myGroups.slice(0, MY_GROUPS_CHIP_LIMIT);
  const hiddenMyGroups = myGroups.slice(MY_GROUPS_CHIP_LIMIT);
  const hiddenMyGroupCount = hiddenMyGroups.length;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={themeClasses.pageTitle}>{t("groups.pageTitle")}</h1>
          <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("groups.pageDescription")}</p>
        </div>
        <Button type="button" onClick={() => setShowCreate((open) => !open)}>
          {showCreate ? t("common.cancel") : t("groups.create")}
        </Button>
      </div>

      {showCreate ? (
        <form
          className={`mt-6 space-y-4 ${themeClasses.cardLg} p-5`}
          onSubmit={(event) => {
            event.preventDefault();
            setCreateError(null);
            createMutation.mutate({
              name: name.trim(),
              description: description.trim() || undefined,
              coverImageUrl: coverImageUrl.trim() || null,
            });
          }}
        >
          <h2 className={`text-lg font-semibold ${themeClasses.heading}`}>{t("groups.createTitle")}</h2>
          {createError ? <div className={themeClasses.errorBox}>{createError}</div> : null}
          <div>
            <label htmlFor="group-name" className={`mb-1 block ${themeClasses.label}`}>
              {t("groups.name")}
            </label>
            <input
              id="group-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={themeClasses.input}
              required
              minLength={2}
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="group-description" className={`mb-1 block ${themeClasses.label}`}>
              {t("groups.description")}
            </label>
            <textarea
              id="group-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={themeClasses.input}
              maxLength={500}
            />
          </div>
          <div>
            <label htmlFor="group-cover" className={`mb-1 block ${themeClasses.label}`}>
              {t("groups.coverImageUrl")}
            </label>
            <input
              id="group-cover"
              type="url"
              value={coverImageUrl}
              onChange={(event) => setCoverImageUrl(event.target.value)}
              className={themeClasses.input}
              placeholder="https://"
            />
            <p className={`mt-1 text-xs ${themeClasses.muted}`}>{t("groups.coverHint")}</p>
          </div>
          <Button type="submit" disabled={createMutation.isPending || name.trim().length < 2}>
            {createMutation.isPending ? t("common.loading") : t("groups.createSubmit")}
          </Button>
        </form>
      ) : null}

      {visibleMyGroups.length > 0 ? (
        <div className="mt-8">
          <p className={`mb-2 text-xs font-medium uppercase tracking-wide ${themeClasses.muted}`}>
            {t("groups.myGroups")}
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {visibleMyGroups.map((group) => (
              <Link key={group.id} to={ROUTES.groupDetail(group.id)} className="shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="max-w-[12rem] rounded-full"
                  title={group.name}
                >
                  <span className="truncate">{group.name}</span>
                </Button>
              </Link>
            ))}
            {hiddenMyGroupCount > 0 ? (
              <div className="shrink-0">
                <DropdownMenu
                  align="start"
                  label={t("groups.moreJoinedMenu", { count: hiddenMyGroupCount })}
                  trigger={
                    <span className="inline-flex items-center rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800">
                      {t("groups.moreJoined", { count: hiddenMyGroupCount })}
                    </span>
                  }
                >
                  <DropdownMenuLabel>{t("groups.myGroups")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {hiddenMyGroups.map((group) => (
                      <DropdownMenuItem
                        key={group.id}
                        onSelect={() => navigate(ROUTES.groupDetail(group.id))}
                      >
                        <span className="truncate">{group.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenu>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className={visibleMyGroups.length > 0 ? "mt-4" : "mt-8"}>
        <label htmlFor="group-search" className="sr-only">
          {t("groups.searchLabel")}
        </label>
        <input
          id="group-search"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t("groups.searchPlaceholder")}
          className={themeClasses.input}
        />
      </div>

      {groupsQuery.isLoading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className={`${themeClasses.cardLg} h-64 animate-pulse bg-stone-100 dark:bg-stone-800`} />
          <div className={`${themeClasses.cardLg} h-64 animate-pulse bg-stone-100 dark:bg-stone-800`} />
        </div>
      ) : groupsQuery.isError ? (
        <div className="mt-8">
          <EmptyState
            title={t("groups.loadErrorTitle")}
            description={t("groups.loadErrorDescription")}
            action={
              <button
                type="button"
                className={themeClasses.link}
                onClick={() => void groupsQuery.refetch()}
              >
                {t("common.retry")}
              </button>
            }
          />
        </div>
      ) : groups.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={debouncedQ ? t("groups.emptySearchTitle") : t("groups.emptyTitle")}
            description={
              debouncedQ ? t("groups.emptySearchDescription") : t("groups.emptyDescription")
            }
            action={
              !debouncedQ ? (
                <button
                  type="button"
                  className={themeClasses.link}
                  onClick={() => setShowCreate(true)}
                >
                  {t("groups.create")}
                </button>
              ) : (
                <button
                  type="button"
                  className={themeClasses.link}
                  onClick={() => {
                    setSearchInput("");
                    setDebouncedQ("");
                  }}
                >
                  {t("groups.clearSearch")}
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {groupsQuery.hasNextPage ? (
        <button
          type="button"
          onClick={() => void groupsQuery.fetchNextPage()}
          disabled={groupsQuery.isFetchingNextPage}
          className="mt-6 w-full rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          {groupsQuery.isFetchingNextPage ? t("common.loading") : t("feed.loadMore")}
        </button>
      ) : null}
    </section>
  );
}
