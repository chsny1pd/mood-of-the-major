import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../../constants/routes";
import { themeClasses } from "../../../lib/themeClasses";
import type { GroupSummary } from "../../../types/group";

interface GroupCardProps {
  group: GroupSummary;
}

export function GroupCard({ group }: GroupCardProps) {
  const { t } = useTranslation();
  const description =
    group.description.trim().length > 0
      ? group.description
      : t("groups.noDescription");

  return (
    <article className={`${themeClasses.cardLg} overflow-hidden transition hover:-translate-y-0.5 hover:border-orange-200 dark:hover:border-orange-800`}>
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-orange-200 via-amber-100 to-stone-200 dark:from-orange-950 dark:via-stone-900 dark:to-stone-800">
        {group.coverImageUrl ? (
          <img
            src={group.coverImageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-end p-4">
            <span className="font-display text-3xl font-semibold text-orange-900/40 dark:text-orange-200/30">
              {group.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className={`font-display text-xl font-semibold ${themeClasses.heading}`}>{group.name}</h2>
          <span className={`shrink-0 text-xs ${themeClasses.muted}`}>
            {t("groups.memberCount", { count: group.memberCount })}
          </span>
        </div>
        <p className={`line-clamp-3 text-sm ${themeClasses.body}`}>{description}</p>
        <Link
          to={ROUTES.groupDetail(group.id)}
          className="inline-flex items-center gap-1 text-sm font-medium text-orange-800 hover:underline dark:text-orange-300"
        >
          {t("groups.viewDetails")}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
