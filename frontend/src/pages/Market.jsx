import React from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

function Market() {
  const products = [
    { id: 1, name: 'Crystal Healing Set', price: 49.99, image: 'https://images.unsplash.com/photo-1555008872-f03b347ffb53?w=500&q=80', rating: 4.8 },
    { id: 2, name: 'Meditation Singing Bowl', price: 89.00, image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&q=80', rating: 4.9 },
    { id: 3, name: 'Organic Sage Smudge', price: 15.50, image: 'https://images.unsplash.com/photo-1611077544944-774fbe8e9329?w=500&q=80', rating: 4.7 },
    { id: 4, name: 'Tarot Card Deck', price: 35.00, image: 'https://images.unsplash.com/photo-1536768131379-34baeb32746c?w=500&q=80', rating: 4.6 }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />
      <main className="flex flex-col flex-1 pt-16 pb-24 px-4 w-full">
        <div className="flex items-center justify-between mb-6 mt-4">
          <h1 className="font-headline-md text-headline-md font-bold">Wellness Market</h1>
          <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <img src={product.image} alt={product.name} className="w-full h-32 object-cover" />
              <div className="p-3 flex flex-col flex-1">
                <h3 className="font-bold text-sm leading-tight flex-1">{product.name}</h3>
                <div className="flex justify-between items-end mt-2">
                  <span className="font-bold text-primary">${product.price}</span>
                  <div className="flex items-center text-[10px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[12px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    {product.rating}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default Market;
