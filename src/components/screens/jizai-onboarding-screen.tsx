import React, { useState, useEffect } from 'react';

interface OnboardingScreenProps {
  onComplete?: () => void;
}

export function JizaiOnboardingScreen({ 
  onComplete = () => console.log('Onboarding completed')
}: OnboardingScreenProps = {}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100');

  const slides = [
    {
      title: '写真を選ぶ',
      subtitle: 'あなたの大切な一枚を',
      visual: (
        <div className="w-48 h-32 bg-gray-900 rounded-2xl shadow-lg flex items-center justify-center border border-gray-800">
          <div className="w-12 h-12 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
      )
    },
    {
      title: '美しく変える',
      subtitle: 'ワンタップで最適な編集',
      visual: (
        <div className="w-48 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-4 bg-gray-800 rounded-xl shadow-sm"></div>
          <div className="relative z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )
    },
    {
      title: '完成',
      subtitle: 'プロ品質の仕上がり',
      visual: (
        <div className="w-48 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center relative">
          <div className="absolute inset-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl"></div>
          <div className="relative z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setFadeClass('opacity-0');
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setFadeClass('opacity-100');
      }, 200);
    } else {
      onComplete();
    }
  };

  const handleDotClick = (index: number) => {
    setFadeClass('opacity-0');
    setTimeout(() => {
      setCurrentSlide(index);
      setFadeClass('opacity-100');
    }, 200);
  };

  // Auto advance after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        setFadeClass('opacity-0');
        setTimeout(() => {
          setCurrentSlide(currentSlide + 1);
          setFadeClass('opacity-100');
        }, 200);
      } else {
        onComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentSlide, onComplete]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      
      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className={`text-center transition-opacity duration-200 ${fadeClass}`}>
          
          {/* Visual */}
          <div className="mb-12 flex justify-center">
            {slides[currentSlide].visual}
          </div>
          
          {/* Text */}
          <div className="space-y-4">
            <h1 className="text-3xl font-light text-white">
              {slides[currentSlide].title}
            </h1>
            <p className="text-lg text-gray-400 font-light">
              {slides[currentSlide].subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="pb-12 flex justify-center space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentSlide 
                ? 'bg-white w-8' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}