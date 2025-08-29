import React from 'react';

export interface IOSIconProps {
  className?: string;
  size?: number;
}

export const PhotoIcon = ({ className, size = 24 }: IOSIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CreditCardIcon = ({ className, size = 24 }: IOSIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArrowPathIcon = ({ className, size = 24 }: IOSIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ExclamationBubbleIcon = ({ className, size = 24 }: IOSIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 7V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 13H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const EyeIcon = ({ className, size = 24 }: IOSIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DownloadIcon = ({ className, size = 24 }: IOSIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GearIcon = ({ className, size = 24 }: IOSIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2573 9.77251 19.9887C9.5799 19.7201 9.31074 19.5176 9 19.405C8.69838 19.2719 8.36381 19.2322 8.03941 19.291C7.71502 19.3498 7.41568 19.5045 7.18 19.735L7.12 19.795C6.93425 19.981 6.71368 20.1285 6.47088 20.2291C6.22808 20.3298 5.96783 20.3816 5.705 20.3816C5.44217 20.3816 5.18192 20.3298 4.93912 20.2291C4.69632 20.1285 4.47575 19.981 4.29 19.795C4.10405 19.6093 3.95653 19.3887 3.85588 19.1459C3.75523 18.9031 3.70343 18.6428 3.70343 18.38C3.70343 18.1172 3.75523 17.8569 3.85588 17.6141C3.95653 17.3713 4.10405 17.1507 4.29 16.965L4.35 16.905C4.58054 16.6693 4.73519 16.37 4.794 16.0456C4.85282 15.7212 4.81312 15.3866 4.68 15.085C4.55324 14.7892 4.34276 14.537 4.07447 14.3593C3.80618 14.1816 3.49179 14.0863 3.17 14.085H3C2.46957 14.085 1.96086 13.8743 1.58579 13.4992C1.21071 13.1241 1 12.6154 1 12.085C1 11.5546 1.21071 11.0459 1.58579 10.6708C1.96086 10.2957 2.46957 10.085 3 10.085H3.09C3.42099 10.0773 3.742663 9.97012 4.01133 9.77751C4.27999 9.5849 4.48244 9.31574 4.595 9.005C4.72812 8.70338 4.76782 8.36881 4.709 8.04441C4.65019 7.72002 4.49554 7.42068 4.265 7.185L4.205 7.125C4.01905 6.93925 3.87153 6.71868 3.77088 6.47588C3.67023 6.23308 3.61843 5.97283 3.61843 5.71C3.61843 5.44717 3.67023 5.18692 3.77088 4.94412C3.87153 4.70132 4.01905 4.48075 4.205 4.295C4.39075 4.10905 4.61132 3.96153 4.85412 3.86088C5.09692 3.76023 5.35717 3.70843 5.62 3.70843C5.88283 3.70843 6.14308 3.76023 6.38588 3.86088C6.62868 3.96153 6.84925 4.10905 7.035 4.295L7.095 4.355C7.33068 4.58554 7.63002 4.74019 7.95441 4.799C8.27881 4.85782 8.61338 4.81812 8.915 4.685H9C9.29577 4.55824 9.54802 4.34776 9.72569 4.07947C9.90337 3.81118 9.99872 3.49679 10 3.175V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41279 14.0966 3.72718 14.2743 3.99547C14.452 4.26376 14.7042 4.47424 15 4.605C15.3016 4.73812 15.6362 4.77782 15.9606 4.719C16.285 4.66019 16.5843 4.50554 16.82 4.275L16.88 4.215C17.0657 4.02905 17.2863 3.88153 17.5291 3.78088C17.7719 3.68023 18.0322 3.62843 18.295 3.62843C18.5578 3.62843 18.8181 3.68023 19.0609 3.78088C19.3037 3.88153 19.5243 4.02905 19.71 4.215C19.896 4.40075 20.0435 4.62132 20.1441 4.86412C20.2448 5.10692 20.2966 5.36717 20.2966 5.63C20.2966 5.89283 20.2448 6.15308 20.1441 6.39588C20.0435 6.63868 19.896 6.85925 19.71 7.045L19.65 7.105C19.4195 7.34068 19.2648 7.64002 19.206 7.96441C19.1472 8.28881 19.1869 8.62338 19.32 8.925V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5872 14.0013 20.2728 14.0966 20.0045 14.2743C19.7362 14.452 19.5258 14.7042 19.395 15H19.4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CheckIcon = ({ className, size = 24 }: IOSIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const XIcon = ({ className, size = 24 }: IOSIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PlusIcon = ({ className, size = 24 }: IOSIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);