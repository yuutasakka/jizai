"use client";
import { track } from "../lib/analytics";

interface TryEditButtonProps {
  sampleImageUrl: string;
  usecase: string;
  preset?: string;
  className?: string;
  children?: React.ReactNode;
}

export function TryEditButton({ sampleImageUrl, usecase, preset = '', className = '', children }: TryEditButtonProps) {
  const handleTryEdit = async () => {
    try {
      // Analytics tracking
      track('try_edit_sample', { usecase, preset, sample: sampleImageUrl });
      
      // Create a demo blob from sample URL for immediate experience
      const response = await fetch(sampleImageUrl);
      const blob = await response.blob();
      
      // Store sample data in session for immediate use
      const fileUrl = URL.createObjectURL(blob);
      sessionStorage.setItem('demo-image-url', fileUrl);
      sessionStorage.setItem('demo-usecase', usecase);
      if (preset) sessionStorage.setItem('demo-preset', preset);
      
      // Navigate to editor with demo flag
      const params = new URLSearchParams({
        demo: 'true',
        usecase,
        engine: 'standard'
      });
      if (preset) params.set('preset', preset);
      
      window.location.href = '/?' + params.toString();
    } catch (error) {
      console.error('Failed to load sample image:', error);
      // Fallback to regular flow
      window.location.href = `/?usecase=${usecase}&engine=standard${preset ? '&preset=' + preset : ''}`;
    }
  };

  return (
    <button 
      onClick={handleTryEdit}
      className={`px-3 py-2 bg-[color:var(--color-jz-accent)] text-white rounded-md text-sm hover:opacity-90 transition-opacity ${className}`}
    >
      {children || '試し編集'}
    </button>
  );
}