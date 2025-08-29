import React from 'react';

export interface JZIconProps {
  className?: string;
  size?: number;
}

// Photo icon (SF Symbol: photo)
export const JZPhotoIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="4" width="18" height="15" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Slider horizontal (SF Symbol: slider.horizontal.3)
export const JZSliderIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2"/>
    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2"/>
    <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8" cy="7" r="2" fill="currentColor"/>
    <circle cx="16" cy="12" r="2" fill="currentColor"/>
    <circle cx="12" cy="17" r="2" fill="currentColor"/>
  </svg>
);

// Arrow 2 square path (SF Symbol: arrow.2.squarepath)
export const JZRefreshIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M23 20v-6h-6" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

// Credit card icon (SF Symbol: creditcard)
export const JZCreditCardIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="5" width="20" height="14" rx="3" ry="3" stroke="currentColor" strokeWidth="2"/>
    <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Exclamation bubble (SF Symbol: exclamationmark.bubble)
export const JZExclamationBubbleIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="7" x2="12" y2="10" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="13" r="1" fill="currentColor"/>
  </svg>
);

// Additional JIZAI specific icons
export const JZSettingsIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const JZBoltIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
  </svg>
);

export const JZMagicWandIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M15 4V2m0 2v2m0-2h2m-2 0h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 12V10m0 2v2m0-2h2m-2 0H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M20 8V6m0 2v2m0-2h2m-2 0h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="m5 18 14-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="5" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const JZDownloadIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
    <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const JZChevronRightIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const JZChevronDownIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polyline points="6,9 12,15 18,9" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const JZCheckIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const JZXIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const JZPlusIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/>
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Bell icon (SF Symbol: bell)
export const JZBellIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Shield icon (SF Symbol: shield)
export const JZShieldIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Info icon (SF Symbol: info.circle)
export const JZInfoIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="8" r="1" fill="currentColor"/>
  </svg>
);

// Help circle icon (SF Symbol: questionmark.circle)
export const JZHelpIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="17" r="1" fill="currentColor"/>
  </svg>
);

// External link icon (SF Symbol: arrow.up.right.square)
export const JZExternalLinkIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2"/>
    <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2"/>
    <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Trash icon (SF Symbol: trash)
export const JZTrashIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2"/>
    <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2"/>
    <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Photograph icon (SF Symbol: photo.on.rectangle)
export const JZPhotographIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Copy icon (SF Symbol: doc.on.doc)
export const JZCopyIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Arrow left icon (SF Symbol: arrow.left)
export const JZArrowLeftIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="19" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2"/>
    <polyline points="12,19 5,12 12,5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Share icon (SF Symbol: square.and.arrow.up)
export const JZShareIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
    <line x1="8.7" y1="10.7" x2="15.3" y2="7.3" stroke="currentColor" strokeWidth="2"/>
    <line x1="8.7" y1="13.3" x2="15.3" y2="16.7" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Calendar icon (SF Symbol: calendar)
export const JZCalendarIcon = ({ className, size = 24 }: JZIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
);