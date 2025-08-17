'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';

interface ProductResult {
  platform: string;
  platformLogo: string;
  productName: string;
  price: string;
  rating: string;
  link: string;
  thumbnail: string;
  discount?: string;
  availability: string;
}

interface Column {
  id: string;
  header: string;
  accessor: keyof ProductResult | 'action';
  sortable?: boolean;
}

// Company Logo URLs
const PLATFORM_LOGOS = {
  'Amazon.in': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  'Flipkart': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Flipkart_logo.svg',
  'Meesho': 'https://seeklogo.com/images/M/meesho-logo-F543C7D9B9-seeklogo.com.png',
  'Snapdeal': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Snapdeal_logo.png',
  'JioMart': 'https://seeklogo.com/images/J/jiomart-logo-84A66B2802-seeklogo.com.png',
  'PayTM Mall': 'https://seeklogo.com/images/P/paytm-logo-6D9BB7197F-seeklogo.com.png'
};

// FIXED: Price Range Slider with proper containment and only 2 handles
const PriceRangeSlider = ({ min, max, value, onChange }: {
  min: number;
  max: number;
  value: { min: number; max: number };
  onChange: (min: number, max: number) => void;
}) => {
  const [minVal, setMinVal] = useState(value.min);
  const [maxVal, setMaxVal] = useState(value.max);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update internal state when external value prop changes
  useEffect(() => {
    setMinVal(value.min);
    setMaxVal(value.max);
  }, [value.min, value.max]);

  const getPercent = useCallback(
    (value: number) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  );

  useEffect(() => {
    onChange(minVal, maxVal);
  }, [minVal, maxVal, onChange]);

  return (
    <div className="mb-8">
      <h3 className="text-white text-lg font-semibold mb-6">Price:</h3>
      
      {/* FIXED: Proper container with constrained width */}
      <div ref={containerRef} className="relative w-full max-w-full px-4">
        <div className="relative h-2 w-full">
          {/* Background track */}
          <div className="absolute w-full h-2 bg-slate-600 rounded-full"></div>
          
          {/* FIXED: Active track with proper positioning */}
          <div 
            className="absolute h-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
            style={{
              left: `${getPercent(minVal)}%`,
              width: `${getPercent(maxVal) - getPercent(minVal)}%`
            }}
          ></div>
        </div>
        
        {/* FIXED: Single container for both range inputs to prevent layout issues */}
        <div className="absolute inset-0 w-full">
          {/* Min range input */}
          <input
            type="range"
            min={min}
            max={max}
            value={minVal}
            onChange={(e) => {
              const newMin = Math.min(+e.target.value, maxVal - 100);
              setMinVal(newMin);
            }}
            className="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer z-10 range-slider-thumb"
          />
          
          {/* Max range input */}
          <input
            type="range"
            min={min}
            max={max}
            value={maxVal}
            onChange={(e) => {
              const newMax = Math.max(+e.target.value, minVal + 100);
              setMaxVal(newMax);
            }}
            className="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer z-20 range-slider-thumb"
          />
        </div>
        
        {/* FIXED: Only 2 visual handles positioned correctly */}
        <div 
          className="absolute w-5 h-5 bg-white border-3 border-purple-500 rounded-full shadow-lg transform -translate-x-2.5 -translate-y-1.5 pointer-events-none z-30"
          style={{ 
            left: `${getPercent(minVal)}%`,
            top: '4px'
          }}
        ></div>
        
        <div 
          className="absolute w-5 h-5 bg-white border-3 border-purple-500 rounded-full shadow-lg transform -translate-x-2.5 -translate-y-1.5 pointer-events-none z-30"
          style={{ 
            left: `${getPercent(maxVal)}%`,
            top: '4px'
          }}
        ></div>
      </div>
      
      {/* Price labels */}
      <div className="flex justify-between text-white text-sm mt-6 px-4">
        <span>₹{minVal.toLocaleString()}</span>
        <span>₹{maxVal.toLocaleString()}</span>
      </div>
    </div>
  );
};

// Store Filter Component
const StoreFilter = ({ 
  results, 
  selectedStores, 
  onStoreChange 
}: { 
  results: ProductResult[];
  selectedStores: string[];
  onStoreChange: (stores: string[]) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMore, setShowMore] = useState(false);

  const storeData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    
    results.forEach(product => {
      counts[product.platform] = (counts[product.platform] || 0) + 1;
    });
    
    return [
      { name: 'Amazon.in', count: counts['Amazon.in'] || 0 },
      { name: 'Flipkart', count: counts['Flipkart'] || 0 },
      { name: 'Meesho', count: counts['Meesho'] || 0 },
      { name: 'Snapdeal', count: counts['Snapdeal'] || 0 },
      { name: 'JioMart', count: counts['JioMart'] || 0 },
      { name: 'PayTM Mall', count: counts['PayTM Mall'] || 0 }
    ].filter(store => store.count > 0);
  }, [results]);

  const filteredStores = storeData.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleStores = showMore ? filteredStores : filteredStores.slice(0, 5);
  const hiddenCount = Math.max(0, filteredStores.length - 5);

  const handleStoreToggle = (storeName: string) => {
    const updatedStores = selectedStores.includes(storeName)
      ? selectedStores.filter(s => s !== storeName)
      : [...selectedStores, storeName];
    
    onStoreChange(updatedStores);
  };

  return (
    <div className="mb-8">
      <h3 className="text-white text-lg font-semibold mb-4">Store</h3>
      
      <input
        type="text"
        placeholder="Search Store"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 mb-4"
      />

      <div className="space-y-3">
        {visibleStores.map(store => (
          <label key={store.name} className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 p-2 rounded">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedStores.includes(store.name)}
                onChange={() => handleStoreToggle(store.name)}
                className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="ml-3 text-white text-sm font-medium">{store.name}</span>
            </div>
            <span className="bg-slate-700 text-gray-300 px-2 py-1 rounded text-xs font-medium">
              {store.count}
            </span>
          </label>
        ))}
      </div>

      {hiddenCount > 0 && !showMore && (
        <button
          onClick={() => setShowMore(true)}
          className="text-orange-400 text-sm mt-3 hover:text-orange-300 transition-colors font-medium"
        >
          {hiddenCount} More &gt;
        </button>
      )}
      
      {showMore && (
        <button
          onClick={() => setShowMore(false)}
          className="text-orange-400 text-sm mt-3 hover:text-orange-300 transition-colors font-medium"
        >
          Show Less
        </button>
      )}
    </div>
  );
};

// Pagination Component
const PaginationControls = ({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white text-sm rounded-lg transition-colors duration-200"
      >
        Previous
      </button>
      
      <div className="flex items-center space-x-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = i + 1;
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white text-sm rounded-lg transition-colors duration-200"
      >
        Next
      </button>
      
      <span className="text-sm text-gray-400 ml-2">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
};

export default function Page() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ProductResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [maxPriceLimit, setMaxPriceLimit] = useState(50000);
  
  const [columns, setColumns] = useState<Column[]>([
    { id: 'thumbnail', header: 'Thumbnail', accessor: 'thumbnail' },
    { id: 'platform', header: 'Platform', accessor: 'platform', sortable: true },
    { id: 'productName', header: 'Product Details', accessor: 'productName', sortable: true },
    { id: 'price', header: 'Price', accessor: 'price', sortable: true },
    { id: 'rating', header: 'Rating', accessor: 'rating', sortable: true },
    { id: 'action', header: 'Action', accessor: 'action' }
  ]);
  
  const [sortConfig, setSortConfig] = useState({ key: 'price', direction: 'asc' });
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);

  const itemsPerPage = 30;

  // Price extraction function
  const extractPrice = useCallback((priceString: string): number => {
    const cleanPrice = priceString.replace(/[₹,\s]/g, '').replace(/[^\d.]/g, '');
    const price = parseFloat(cleanPrice) || 0;
    return price;
  }, []);

  // Calculate dynamic max price and reset price range
  useEffect(() => {
    if (results.length === 0) {
      setMaxPriceLimit(50000);
      return;
    }
    
    const prices = results.map(product => extractPrice(product.price))
      .filter(price => price > 0);
    
    if (prices.length === 0) {
      setMaxPriceLimit(50000);
      return;
    }
    
    const maxPrice = Math.max(...prices);
    console.log('Max price found:', maxPrice);
    
    let roundedMax;
    if (maxPrice <= 10000) {
      roundedMax = Math.ceil(maxPrice / 1000) * 1000;
    } else {
      roundedMax = Math.ceil(maxPrice / 10000) * 10000;
    }
    
    const finalMax = Math.max(roundedMax, 1000);
    
    console.log('Setting max price limit to:', finalMax);
    setMaxPriceLimit(finalMax);
  }, [results, extractPrice]);

  // Apply filters
  const filteredResults = useMemo(() => {
    let filtered = [...results];
    
    // Store filter
    if (selectedStores.length > 0) {
      filtered = filtered.filter(product =>
        selectedStores.includes(product.platform)
      );
    }
    
    // Price filter
    filtered = filtered.filter(product => {
      const priceNum = extractPrice(product.price);
      const isInRange = priceNum >= priceRange.min && priceNum <= priceRange.max;
      
      if (!isInRange && priceNum > 0) {
        console.log(`Filtered out: ${product.productName} - Price: ${priceNum}, Range: ${priceRange.min}-${priceRange.max}`);
      }
      
      return priceNum > 0 && isInRange;
    });
    
    console.log(`Filtered ${filtered.length} products out of ${results.length} total`);
    return filtered;
  }, [results, selectedStores, priceRange, extractPrice]);

  // Apply sorting
  const sortedResults = useMemo(() => {
    if (!filteredResults.length) return [];
    
    return [...filteredResults].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      if (sortConfig.key === 'price') {
        aValue = extractPrice(a.price);
        bValue = extractPrice(b.price);
      } else if (sortConfig.key === 'rating') {
        const extractRatingValue = (r: string) => {
          const match = /([0-9]+\.?[0-9]*)/.exec(r || '');
          return parseFloat(match?.[1] ?? '0');
        };
        const aRating = extractRatingValue(a.rating);
        const bRating = extractRatingValue(b.rating);
        aValue = isNaN(aRating) ? 0 : aRating;
        bValue = isNaN(bRating) ? 0 : bRating;
      } else {
        aValue = a[sortConfig.key as keyof ProductResult]?.toString().toLowerCase() || '';
        bValue = b[sortConfig.key as keyof ProductResult]?.toString().toLowerCase() || '';
      }
      
      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filteredResults, sortConfig, extractPrice]);

  // Apply pagination
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
    setTotalPages(totalPages);
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, currentPage, itemsPerPage]);

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumn(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedColumn === null || draggedColumn === dropIndex) {
      setDraggedColumn(null);
      return;
    }
    
    const newColumns = [...columns];
    const draggedCol = newColumns.splice(draggedColumn, 1)[0];
    newColumns.splice(dropIndex, 0, draggedCol);
    
    setColumns(newColumns);
    setDraggedColumn(null);
  };

  const handlePriceChange = useCallback((min: number, max: number) => {
    console.log('Price range changed:', min, max);
    setPriceRange({ min, max });
    setCurrentPage(1);
  }, []);

  const handleStoreChange = useCallback((stores: string[]) => {
    setSelectedStores(stores);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = () => {
    setSelectedStores([]);
    setPriceRange({ min: 0, max: maxPriceLimit });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const testAPI = async () => {
    console.log('🧪 Testing API connection...');
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      console.log('✅ API Test Result:', data);
      setDebugInfo(`API Test: ${data.status} at ${data.timestamp}`);
    } catch (err: any) {
      console.error('❌ API Test Failed:', err);
      setDebugInfo(`API Test Failed: ${err.message}`);
    }
  };

  // Reset price filters on new search
  const handleSearch = async (e: React.FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;
    
    console.log(`🔍 Starting search for: "${searchTerm}"`);
    setIsLoading(true);
    setError('');
    setResults([]);
    setCurrentPage(1);
    setDebugInfo('');
    
    // Reset ALL filters on new search
    setSelectedStores([]);
    setPriceRange({ min: 0, max: 50000 });
    setMaxPriceLimit(50000);

    try {
      console.log('📡 Making API call...');
      const response = await fetch(`/api/scrape?term=${encodeURIComponent(searchTerm)}`);
      console.log(`📡 Response status: ${response.status}`);
      
      const data = await response.json();
      console.log('📡 Response data:', data);
      
      if (response.ok) {
        const fetchedResults = data.results || [];
        setResults(fetchedResults);
        setDebugInfo(
          `Search completed: ${fetchedResults.length} results found in ${data.meta?.duration}ms (Amazon: ${data.meta?.amazonCount}, Flipkart: ${data.meta?.flipkartCount}, Meesho: ${data.meta?.meeshoCount}, Snapdeal: ${data.meta?.snapdealCount}, JioMart: ${data.meta?.jiomartCount}, PayTM Mall: ${data.meta?.paytmCount})`
        );
        
        if (fetchedResults.length === 0) {
          setError('No products found. Check browser console for detailed logs.');
        }
      } else {
        setError(`API Error: ${data.error || 'Unknown error'}`);
        setDebugInfo(`Error details: ${data.details || 'No details'}`);
      }
    } catch (err: any) {
      console.error('❌ Frontend Error:', err);
      setError('Network error - API might not be running');
      setDebugInfo(`Network error: ${err.message}`);
    }

    setIsLoading(false);
  };

  const getBestDeal = () => {
    if (sortedResults.length < 2) return null;
    const amazonResult = sortedResults.find(r => r.platform === 'Amazon.in');
    const flipkartResult = sortedResults.find(r => r.platform === 'Flipkart');
    const meeshoResult = sortedResults.find(r => r.platform === 'Meesho');
    const snapdealResult = sortedResults.find(r => r.platform === 'Snapdeal');
    const jiomartResult = sortedResults.find(r => r.platform === 'JioMart');
    const paytmResult = sortedResults.find(r => r.platform === 'PayTM Mall');
    
    const prices = [amazonResult, flipkartResult, meeshoResult, snapdealResult, jiomartResult, paytmResult]
      .filter(Boolean)
      .map(result => ({
        platform: result!.platform,
        price: extractPrice(result!.price)
      }))
      .filter(item => item.price > 0)
      .sort((a, b) => a.price - b.price);
    
    if (prices.length >= 2) {
      const cheapest = prices[0];
      const secondCheapest = prices[1];
      const savings = secondCheapest.price - cheapest.price;
      return { platform: cheapest.platform, savings };
    }
    
    return null;
  };

  const bestDeal = getBestDeal();

  const renderCell = (result: ProductResult, column: Column) => {
    switch (column.accessor) {
      case 'thumbnail':
        return result.thumbnail ? (
          <img 
            src={result.thumbnail} 
            alt={result.productName}
            className="w-14 h-14 object-cover rounded-lg shadow-md"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-14 h-14 bg-slate-600 rounded-lg flex items-center justify-center">
            <span className="text-xl">{result.platformLogo}</span>
          </div>
        );
      
      case 'platform':
        return (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src={PLATFORM_LOGOS[result.platform as keyof typeof PLATFORM_LOGOS] || ''} 
                alt={result.platform}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.style.display = 'block';
                }}
              />
              <span className="text-xl hidden">{result.platformLogo}</span>
            </div>
            <div>
              <div className="text-white font-semibold text-base whitespace-nowrap">{result.platform}</div>
              <div className="text-green-400 text-xs font-medium">{result.availability}</div>
              {result.discount && (
                <div className="text-orange-400 text-xs font-medium">{result.discount}</div>
              )}
            </div>
          </div>
        );
      
      case 'action':
        return (
          <a
            href={result.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium text-xs rounded-md transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-cyan-500/25"
          >
            <span>Link</span>
           
          </a>
        );
      
      default:
        const value = result[column.accessor as keyof ProductResult];
        if (column.accessor === 'price') {
          return (
            <div className="text-emerald-400 font-bold text-base font-mono whitespace-nowrap">
              {value}
            </div>
          );
        } else if (column.accessor === 'rating') {
          return (
            <div className="flex items-center space-x-1">
              <div className="text-yellow-400 text-sm">⭐</div>
              <div className="text-yellow-300 font-medium text-sm whitespace-nowrap">
                {value}
              </div>
            </div>
          );
        } else if (column.accessor === 'productName') {
          return (
            <div className="text-slate-100 font-medium text-sm leading-tight max-w-xs truncate">
              {value}
            </div>
          );
        }
        return value;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black p-6 text-white">
      <div className="container mx-auto max-w-7xl">
        
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-violet-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
            Product Price Comparison
          </h1>
          <p className="text-gray-300 text-lg">Find the best deals across Amazon, Flipkart, Meesho, Snapdeal, JioMart & PayTM Mall</p>
          
          <div className="mt-6 space-y-2">
            <button
              onClick={testAPI}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium"
            >
              Test API Connection
            </button>
            {debugInfo && (
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-300 text-sm font-mono">{debugInfo}</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex justify-center mb-10 gap-4">
          <input
            type="text"
            className="w-full max-w-lg bg-slate-700 rounded-full px-6 py-4 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-pink-600 disabled:opacity-50"
            placeholder="Search for products (e.g., laptop, phone, headphones...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !searchTerm.trim()}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {isLoading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mb-4"></div>
            <p className="text-gray-300">Scraping Amazon, Flipkart, Meesho, Snapdeal, JioMart & PayTM Mall...</p>
            <p className="text-gray-500 text-sm mt-2">Getting up to 10 results from each platform...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-center">{error}</p>
            <p className="text-red-400 text-sm text-center mt-2">
              Check browser console (F12) and terminal for detailed logs
            </p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-12 gap-6 mb-6">
              {/* FIXED: Left Sidebar with proper width constraints */}
              <div className="col-span-3">
                <div className="bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-6 border border-purple-500/30 shadow-2xl overflow-hidden">
                  {/* FIXED: Price Range Slider with proper containment */}
                  <PriceRangeSlider
                    min={0}
                    max={maxPriceLimit}
                    value={priceRange}
                    onChange={handlePriceChange}
                  />

                  {/* Store Filter */}
                  <StoreFilter 
                    results={results}
                    selectedStores={selectedStores}
                    onStoreChange={handleStoreChange} 
                  />

                  {/* Reset Filters button */}
                  <button
                    onClick={handleResetFilters}
                    className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    Reset Filters
                  </button>
                  
                  {/* Debug info */}
                  <div className="mt-4 text-xs text-gray-400">
                    <div>Max Price: ₹{maxPriceLimit.toLocaleString()}</div>
                    <div>Current Range: ₹{priceRange.min.toLocaleString()} - ₹{priceRange.max.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Right Content - Results */}
              <div className="col-span-9">
                {/* Top Pagination */}
                <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <PaginationControls 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                    
                    <div className="text-sm text-gray-300">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedResults.length)} of {sortedResults.length} filtered results ({results.length} total)
                    </div>
                  </div>
                </div>

                {/* Results Table */}
                <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600">
                          {columns.map((column, index) => (
                            <th
                              key={column.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, index)}
                              className="text-left py-4 px-4 text-slate-300 font-semibold tracking-wider uppercase text-xs cursor-grab active:cursor-grabbing"
                            >
                              <div className="flex items-center justify-between group">
                                <span 
                                  className={column.sortable ? 'cursor-pointer hover:text-white flex items-center' : 'flex items-center'}
                                  onClick={() => column.sortable && handleSort(column.accessor as string)}
                                >
                                  {column.header}
                                  {column.sortable && sortConfig.key === column.accessor && (
                                    <span className="ml-1 text-xs">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </span>
                                <span className="text-slate-500 group-hover:text-slate-300 cursor-grab text-xs">
                                  ⋮⋮
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {paginatedResults.map((result, index) => (
                          <tr key={index} className="hover:bg-slate-700/30 transition-all duration-300 h-16">
                            {columns.map((column) => (
                              <td key={column.id} className="py-3 px-4 align-middle">
                                {renderCell(result, column)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mb-6">
                    <PaginationControls 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            </div>

            {bestDeal && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-6 py-3">
                  <div className="text-green-400">💰</div>
                  <span className="text-green-300 font-medium">
                    Best Deal: {bestDeal.platform} saves you ₹{bestDeal.savings.toLocaleString()} more!
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* FIXED: Custom CSS for range slider styling - only 2 handles */}
      <style jsx>{`
        .range-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        .range-slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid #9333ea;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }

        .range-slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid #9333ea;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          border: none;
        }

        /* Hide default range track */
        .range-slider-thumb::-webkit-slider-runnable-track {
          background: transparent;
        }

        .range-slider-thumb::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
