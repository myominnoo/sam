import { getRoleBadgeClass } from "../../utils/styleHelpers";

interface RoleBadgeProps {
  role: string;
  onClick?: () => void;
  title?: string;
}

export const RoleBadge = ({ role, onClick, title }: RoleBadgeProps) => {
  if (!role) return null;
  const isInteractive = Boolean(onClick);

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
