import { getRoleBadgeClass } from "../../utils/styleHelpers";

interface RoleBadgeProps {
  role: string;
  onClick?: () => void;
  title?: string;
  fullCell?: boolean;
}

export const RoleBadge = ({
  role,
  onClick,
  title,
  fullCell = false,
}: RoleBadgeProps) => {
  if (!role) return null;
  const isInteractive = Boolean(onClick);

  if (fullCell) {
    return (
      <div
        onClick={onClick}
        title={title}
        className={`w-full h-full flex items-center justify-center font-bold text-xs ${getRoleBadgeClass(
          role,
        )} ${isInteractive ? "cursor-pointer hover:opacity-85" : ""}`}
      >
        {role}
      </div>
    );
  }

  return (
    <span
      onClick={onClick}
      title={title}
      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getRoleBadgeClass(role)} ${
        isInteractive ? "cursor-pointer hover:opacity-80" : ""
      }`}
    >
      {role}
    </span>
  );
};
