import Avatar from "boring-avatars";

interface BoringAvatarProps {
  name: string;
  size?: number;
  variant?: "marble" | "beam" | "pixel" | "sunset" | "ring" | "bauhaus";
  className?: string;
  colors?: string[];
}

const defaultColors = [
  "#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"
];

const variantColors = {
  marble: ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"],
  beam: ["#5B8DEF", "#7B68EE", "#98D8C8", "#F7DC6F", "#BB8FCE"],
  pixel: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
  sunset: ["#FF7675", "#FD79A8", "#FDCB6E", "#6C5CE7", "#A29BFE"],
  ring: ["#74B9FF", "#00B894", "#FDCB6E", "#E17055", "#6C5CE7"],
  bauhaus: ["#E84393", "#00B894", "#FDCB6E", "#0984E3", "#6C5CE7"]
};

export function BoringAvatar({ 
  name, 
  size = 40, 
  variant = "marble", 
  className = "",
  colors 
}: BoringAvatarProps) {
  const avatarColors = colors || variantColors[variant] || defaultColors;
  
  return (
    <div className={`rounded-full overflow-hidden flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <Avatar
        size={size}
        name={name}
        variant={variant}
        colors={avatarColors}
      />
    </div>
  );
}