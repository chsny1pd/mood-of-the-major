import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES } from "../constants/routes";
import { Avatar } from "./ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/DropdownMenu";

export function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profileMeta, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Link
        to={ROUTES.login}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
        aria-label={t("nav.logIn")}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    );
  }

  const displayName = profileMeta.displayName ?? user.email.split("@")[0] ?? user.email;

  return (
    <DropdownMenu
      label={displayName}
      trigger={
        <Avatar
          src={profileMeta.avatarUrl}
          name={profileMeta.displayName}
          email={user.email}
          alt={displayName}
        />
      }
    >
      <div className="px-3 py-2">
        <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">{displayName}</p>
        <p className="truncate text-xs text-stone-500 dark:text-stone-400">{user.email}</p>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => navigate(ROUTES.settings)}>{t("nav.settings")}</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => void logout()}>{t("nav.logout")}</DropdownMenuItem>
    </DropdownMenu>
  );
}
