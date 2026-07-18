import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { Button } from "../components/ui/Button";
import { GroupCard } from "../features/groups/components/GroupCard";
import { queryKeys } from "../constants/queryKeys";
import { themeClasses } from "../lib/themeClasses";
import { getApiErrorMessage } from "../services/apiClient";
import { createGroup, fetchGroups } from "../services/groupService";

export function GroupsPage() {
  const { t } = useTranslation();
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

      <div className="mt-8">
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
