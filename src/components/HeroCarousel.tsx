/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Percent, Heart, Gift } from 'lucide-react';

interface Slide {
  id: number;
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  buttonText: string;
  category: 'all' | 'garments' | 'jewellery';
  badge: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1600",
    tag: "Exclusive Festive Bridal Wear",
    title: "The Kanjeevaram & Banarasi Legacy",
    subtitle: "Drape yourself in centuries of heritage. Discover handwoven pure silks and gold-gilded zari borders styled for pure royal luxury.",
    buttonText: "Explore Pure Silks",
    category: 'garments',
    badge: "New Arrivals"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1600",
    tag: "Artisan Craftsmanship",
    title: "1-Gram Gold Antique Ornaments",
    subtitle: "Exquisite Kundan, Polki, and Temple collections. Crafted by generational goldsmiths to give you a flawless precious look at an unbeatable price.",
    buttonText: "Browse Jewellery",
    category: 'jewellery',
    badge: "1-Gram Special"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=1600",
    tag: "Summer Couture 2026",
    title: "The Rose Gold Organza Silhouette",
    subtitle: "Lightweight ethereal drapes coupled with delicate dabka and sequin embroidery. Elegance redefined for the premium modern bridesmaid.",
    buttonText: "Explore Lehenga & Suits",
    category: 'garments',
    badge: "Limited Edition"
  }
];

interface HeroCarouselProps {
  onCategorySelect: (category: 'all' | 'garments' | 'jewellery') => void;
}

export default function HeroCarousel({ onCategorySelect }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <div className="relative h-[420px] md:h-[550px] w-full overflow-hidden bg-emerald-deep" id="hero-carousel">
      {/* Slides */}
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
          }`}
        >
          {/* Cover image with elegant overlay */}
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-deep/90 via-emerald-luxury/75 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-luxury via-transparent to-transparent"></div>

          {/* Slide Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-4xl mx-auto w-full px-6 md:px-12 flex flex-col items-start gap-4 text-white">
              <span className="bg-gold-champagne/20 text-gold-light border border-gold-champagne/30 text-[11px] font-sans font-semibold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                {slide.badge}
              </span>

              <p className="text-gold-champagne font-sans font-semibold tracking-[0.2em] uppercase text-xs md:text-sm">
                {slide.tag}
              </p>

              <h2 className="font-serif text-3xl md:text-5.5xl leading-tight font-bold tracking-wide">
                {slide.title}
              </h2>

              <p className="text-white/80 max-w-lg md:max-w-xl text-sm md:text-base leading-relaxed font-sans">
                {slide.subtitle}
              </p>

              <button
                onClick={() => onCategorySelect(slide.category)}
                className="mt-4 bg-gold-champagne hover:bg-gold-light text-emerald-luxury font-sans font-semibold text-xs md:text-sm uppercase tracking-widest px-6 md:px-8 py-3 md:py-3.5 rounded transition-all transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>{slide.buttonText}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Slide Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/35 hover:bg-gold-champagne hover:text-emerald-luxury text-white p-2.5 rounded-full transition-all border border-white/10 z-10 cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/35 hover:bg-gold-champagne hover:text-emerald-luxury text-white p-2.5 rounded-full transition-all border border-white/10 z-10 cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-10">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              index === currentSlide ? 'w-8 bg-gold-champagne' : 'w-2 bg-white/45'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Luxury Promo Strip */}
      <div className="absolute bottom-0 inset-x-0 bg-emerald-deep/90 border-t border-gold-champagne/15 py-3 hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-xs text-white/90 font-sans tracking-wide">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-gold-champagne" />
            <span>Free Express Delivery Across Bangalore on Orders Above ₹500</span>
          </div>
          <div className="h-4 w-[1px] bg-gold-champagne/20"></div>
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-gold-champagne" />
            <span>Exclusive 1-Gram Antique Jewellery</span>
          </div>
          <div className="h-4 w-[1px] bg-gold-champagne/20"></div>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-gold-champagne" />
            <span>Dedicated Customer Care & Easy Exchanges</span>
          </div>
        </div>
      </div>
    </div>
  );
}
