interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 48, text: 'text-3xl' }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon - Parallel Lens */}
      <svg 
        width={currentSize.icon} 
        height={currentSize.icon} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Lens - Reality */}
        <circle 
          cx="16" 
          cy="24" 
          r="11" 
          stroke="white" 
          strokeWidth="2.5" 
          fill="none"
        />
        <circle 
          cx="16" 
          cy="24" 
          r="6" 
          fill="white" 
          opacity="0.3"
        />
        
        {/* Right Lens - Parallel World */}
        <circle 
          cx="32" 
          cy="24" 
          r="11" 
          stroke="#FFFC00" 
          strokeWidth="2.5" 
          fill="none"
        />
        <circle 
          cx="32" 
          cy="24" 
          r="6" 
          fill="#FFFC00" 
          opacity="0.4"
        />
        
        {/* Connection Line - Parallel Bridge */}
        <line 
          x1="27" 
          y1="24" 
          x2="21" 
          y2="24" 
          stroke="white" 
          strokeWidth="2" 
          opacity="0.5"
          strokeDasharray="2 2"
        />
        
        {/* Sparkle Effect */}
        <path 
          d="M38 12 L40 16 L44 18 L40 20 L38 24 L36 20 L32 18 L36 16 Z" 
          fill="#FFFC00"
          opacity="0.8"
        />
      </svg>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${currentSize.text} font-black tracking-tight text-white`}>
            平行相机
          </span>
          <span className="text-[10px] font-bold tracking-wider text-white/40 uppercase mt-0.5">
            Parallel
          </span>
        </div>
      )}
    </div>
  );
}
