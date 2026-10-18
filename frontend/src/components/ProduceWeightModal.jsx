import React, { useState, useEffect } from 'react';
import { Scale, X, ShoppingCart, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function ProduceWeightModal({ product, onClose, onAddToCart }) {
  const [selectedGrams, setSelectedGrams] = useState(250);
  const [customGrams, setCustomGrams] = useState('');
  const [calculatedResult, setCalculatedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calcError, setCalcError] = useState(null);

  const presetWeights = [100, 250, 500, 750, 1000];

  const fetchGramPrice = async (gramsToCalculate) => {
    if (!product || !gramsToCalculate || gramsToCalculate <= 0) return;

    setLoading(true);
    setCalcError(null);

    try {
      const response = await fetch('/api/products/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          productId: product.productId,
          grams: gramsToCalculate,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCalculatedResult(data.data);
      } else {
        setCalcError(data.message || 'Unable to calculate weight price.');
      }
    } catch (err) {
      setCalcError('Calculation service is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      fetchGramPrice(selectedGrams);
    }
  }, [product, selectedGrams]);

  const handleSelectPreset = (g) => {
    setSelectedGrams(g);
    setCustomGrams('');
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomGrams(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setSelectedGrams(num);
    }
  };

  const handleAddPortionToCart = () => {
    if (!product || !calculatedResult) return;

    const kgQty = parseFloat((calculatedResult.grams / 1000).toFixed(3));

    onAddToCart({
      productId: product.productId,
      productName: `${product.productName} (${calculatedResult.grams >= 1000 ? `${(calculatedResult.grams / 1000).toFixed(1)}kg` : `${calculatedResult.grams}g`})`,
      quantity: kgQty,
      calculatedPrice: calculatedResult.finalPrice,
    });

    onClose();
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-700 text-white uppercase tracking-wider">
                  Member 2: Weight Pricing Engine
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 mt-0.5">Produce Gram Price Calculator</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Overview Card */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
            <img 
              src={product.imageUrl} 
              alt={product.productName} 
              className="w-18 h-18 rounded-xl object-cover border border-emerald-200 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-800">{product.brandName || product.categoryName}</p>
              <h4 className="font-bold text-slate-900 text-sm truncate">{product.productName}</h4>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-xs font-extrabold text-emerald-700">
                  LKR {Number(product.pricePerKg).toLocaleString('en-US', { minimumFractionDigits: 2 })} / kg
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-slate-700 shadow-xs">
                  100g Price: LKR {Number(product.pricePer100g).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Desired Weight Portion:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {presetWeights.map((grams) => {
                const isSelected = selectedGrams === grams && !customGrams;
                return (
                  <button
                    key={grams}
                    onClick={() => handleSelectPreset(grams)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40'
                    }`}
                  >
                    {grams >= 1000 ? `${grams / 1000} kg` : `${grams}g`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Weight Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Or Enter Exact Grams:
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="50000"
                step="10"
                value={customGrams}
                onChange={handleCustomChange}
                placeholder="e.g. 350 (grams)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-4 pr-16 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium"
              />
              <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-400">
                grams
              </span>
            </div>
          </div>

          {/* Dynamic Stored Function Result Box */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Computed via MySQL Function: <code className="text-emerald-300 font-mono">fn_calc_price_100g</code>
              </span>
              <span>Weight: {selectedGrams}g</span>
            </div>

            {loading ? (
              <div className="py-2 text-center text-xs text-slate-400 animate-pulse">
                Calculating exact weight price...
              </div>
            ) : calcError ? (
              <div className="py-2 text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{calcError}</span>
              </div>
            ) : calculatedResult ? (
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-xs text-slate-400">Calculated Total:</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-400">
                      LKR {Number(calculatedResult.finalPrice).toFixed(2)}
                    </span>
                    {calculatedResult.discountPercent > 0 && (
                      <span className="text-xs text-slate-400 line-through">
                        LKR {Number(calculatedResult.basePrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                {calculatedResult.discountPercent > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {calculatedResult.discountPercent}% OFF APPLIED
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAddPortionToCart}
            disabled={loading || !!calcError}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add Weight Portion to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
