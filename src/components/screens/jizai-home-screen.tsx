import React, { useState } from 'react';
import { track } from '../../lib/analytics';

interface JizaiHomeScreenProps {
  onNavigate: (screen: string) => void;
}

export const JizaiHomeScreen = ({ onNavigate }: JizaiHomeScreenProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedImage(event.target.files[0]);
      track('image_selected');
      onNavigate('progress');
    }
  };

  const editingOptions = [
    {
      id: 'brighten',
      title: '明るくする',
      icon: '☀️',
      description: '暗い写真を明るく自然に調整'
    },
    {
      id: 'background',
      title: '背景を変える',
      icon: '🖼️',
      description: '背景を美しい風景に変更'
    },
    {
      id: 'enhance',
      title: '美しく仕上げる',
      icon: '✨',
      description: '全体的な品質を向上させる'
    },
    {
      id: 'color',
      title: '色を調整する',
      icon: '🎨',
      description: '色合いや彩度を最適化'
    },
    {
      id: 'smooth',
      title: 'なめらかにする',
      icon: '🌟',
      description: 'ノイズを除去してクリアに'
    },
    {
      id: 'formal',
      title: 'フォーマルに',
      icon: '👔',
      description: '正式な場面にふさわしく調整'
    },
    {
      id: 'gentle',
      title: '優しい印象に',
      icon: '🌸',
      description: 'やわらかで温かみのある仕上がり'
    },
    {
      id: 'classic',
      title: 'クラシック調',
      icon: '🎭',
      description: '伝統的で上品な雰囲気に'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">JIZAI</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('settings')}
              className="p-2 text-gray-400 hover:text-white"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-white mb-4">
            思い出の写真を美しく
          </h2>
          <p className="text-gray-400 text-lg">
            AIが自然で美しい仕上がりにします
          </p>
        </div>

        {/* Image Upload Section */}
        <div className="mb-12">
          <div 
            onClick={() => document.getElementById('photo-input')?.click()}
            className="relative bg-gray-900 border-2 border-dashed border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:bg-gray-800 transition-colors"
          >
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📷</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                写真を選択してください
              </h3>
              <p className="text-gray-400">
                クリックまたはドラッグ&ドロップで写真をアップロード
              </p>
            </div>
          </div>
          <input
            id="photo-input"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Editing Options */}
        <div className="mb-12">
          <h3 className="text-xl font-medium text-white mb-6 text-center">
            編集の種類を選択
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {editingOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => {
                  track('editing_option_selected', { option: option.id });
                  onNavigate('progress');
                }}
                className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all"
              >
                <div className="text-3xl mb-3">{option.icon}</div>
                <h4 className="font-medium text-white mb-2">{option.title}</h4>
                <p className="text-sm text-gray-400">{option.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('login')}
            className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            今すぐ始める
          </button>
          <p className="text-sm text-gray-400 mt-3">
            登録不要で今すぐ使えます
          </p>
        </div>
      </div>
    </div>
  );
};