import React from 'react';
import * as Icons from 'lucide-react';

interface IconRendererProps extends React.SVGProps<SVGSVGElement> {
  iconName: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
}

export default function IconRenderer({ iconName, ...props }: IconRendererProps) {
  const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
  return <IconComponent {...props} />;
}
