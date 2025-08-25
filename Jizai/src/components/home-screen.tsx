import React, { useState } from 'react';
import { IOSButton } from './ios-button';
import { IOSCard, IOSCardHeader, IOSCardContent } from './ios-card';
import { PhotoIcon, PlusIcon } from './ios-icons';
import { cn } from './ui/utils';

export const HomeScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [credits] = useState(150); // Mock credits

  const presets = [
    { id: 'anime', label: 'アニメ風' },
    { id: 'realistic', label: '写実的' },
    { id: 'painting', label: '絵画風' },
    { id: 'sketch', label: 'スケッチ' },
    { id: 'vintage', label: 'ビンテージ' }
  ];

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedImage(event.target.files[0]);
    }
  };

  const handleGenerate = () => {
    if (!selectedImage) {
      alert('写真を選択してください');
      return;
    }
    if (!selectedPreset && !customPrompt) {
      alert('プリセットを選択するか、カスタムプロンプトを入力してください');
      return;
    }
    onNavigate('generating');
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-ios-gray-6)] p-4">
      {/* Header with Balance */}
      <div className="flex justify-between items-center mb-6 pt-12">
        <h1 className="text-2xl font-semibold text-gray-900">画像編集AI</h1>
        <IOSButton
          variant="secondary"
          size="sm"
          onClick={() => onNavigate('purchase')}
          className="flex items-center gap-2"
        >
          <span className="w-2 h-2 bg-[color:var(--color-ios-blue)] rounded-full"></span>
          {credits}クレジット
        </IOSButton>
      </div>

      {/* Photo Selection */}
      <IOSCard className="mb-6">
        <IOSCardHeader>
          <h2 className="text-lg font-medium">写真を選択</h2>
        </IOSCardHeader>
        <IOSCardContent>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="photo-input"
              />
              <label
                htmlFor="photo-input"
                className={cn(
                  "flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                  selectedImage
                    ? "border-[color:var(--color-ios-blue)] bg-blue-50"
                    : "border-[color:var(--color-ios-gray-3)] hover:border-[color:var(--color-ios-gray-2)]"
                )}
              >
                {selectedImage ? (
                  <div className="text-center">
                    <PhotoIcon className="w-8 h-8 text-[color:var(--color-ios-blue)] mx-auto mb-2" />
                    <p className="text-[color:var(--color-ios-blue)] font-medium">
                      {selectedImage.name}
                    </p>
                    <p className="text-[color:var(--color-ios-gray-1)] text-sm">
                      タップして変更
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <PlusIcon className="w-8 h-8 text-[color:var(--color-ios-gray-2)] mx-auto mb-2" />
                    <p className="text-[color:var(--color-ios-gray-1)]">
                      写真を選択してください
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </IOSCardContent>
      </IOSCard>

      {/* Presets */}
      <IOSCard className="mb-6">
        <IOSCardHeader>
          <h2 className="text-lg font-medium">プリセット</h2>
        </IOSCardHeader>
        <IOSCardContent>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPreset(selectedPreset === preset.id ? '' : preset.id);
                  if (customPrompt) setCustomPrompt('');
                }}
                className={cn(
                  "p-4 rounded-lg border text-center transition-all",
                  selectedPreset === preset.id
                    ? "border-[color:var(--color-ios-blue)] bg-blue-50 text-[color:var(--color-ios-blue)]"
                    : "border-[color:var(--color-ios-gray-3)] hover:border-[color:var(--color-ios-gray-2)]"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </IOSCardContent>
      </IOSCard>

      {/* Custom Input */}
      <IOSCard className="mb-6">
        <IOSCardHeader>
          <h2 className="text-lg font-medium">カスタムプロンプト</h2>
        </IOSCardHeader>
        <IOSCardContent>
          <textarea
            value={customPrompt}
            onChange={(e) => {
              setCustomPrompt(e.target.value);
              if (e.target.value && selectedPreset) setSelectedPreset('');
            }}
            placeholder="どのような編集をしたいかを入力してください..."
            className="w-full p-3 border border-[color:var(--color-ios-gray-3)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--color-ios-blue)] focus:border-transparent"
            rows={4}
          />
        </IOSCardContent>
      </IOSCard>

      {/* Generate Button */}
      <div className="sticky bottom-4">
        <IOSButton
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleGenerate}
          state={!selectedImage || (!selectedPreset && !customPrompt) ? 'disabled' : 'enabled'}
        >
          生成する
        </IOSButton>
      </div>
    </div>
  );
};