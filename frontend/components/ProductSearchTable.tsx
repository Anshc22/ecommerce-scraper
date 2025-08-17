
'use client';

import React, { useState } from 'react';

interface ProductResult {
  platform: string;
  platformLogo: string;
  productName: string;
  price: string;
  rating?: string;
  link: string;
  discount?: string;
  availability: string;
}

export default function ProductSearchTable() {
  const allProducts: ProductResult[] = [
    {
      platform: 'Amazon.in',
      platformLogo: '🛒',
      productName: 'iPhone 15 Pro Max 256GB',
      price: '₹1,34,900',
      rating: '4.2',
      link: 'https://www.amazon.in/s?k=iPhone+15+Pro+Max+256GB',
      discount: '5% off',
      availability: 'In Stock'
    },
    {
      platform: 'Flipkart',
      platformLogo: '🛍️',
      productName: 'iPhone 15 Pro Max 256GB',
      price: '₹1,32,999',
      rating: '4.0',
      link: 'https://www.flipkart.com/search?q=iPhone+15+Pro+Max+256GB',
      discount: '8% off',
      availability: 'In Stock'
    },
  ];

  const [searchTerm, setSearchTerm] = useState('iPhone 15 Pro Max 256GB');

  // Filter based on search term in product name
  const results = allProducts.filter(product => 
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle input change
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black p-6 text-white">
      <div className="container mx-auto">
        <h1 className="text-5xl font-extrabold mb-4 text-center bg-gradient-to-r from-violet-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
          Product Price Comparison
        </h1>
        <p className="text-center text-gray-300 mb-10">Find the best deals across top platforms</p>

        {/* Search Bar */}
        <div className="flex justify-center mb-10">
          <input
            type="text"
            className="w-full max-w-lg bg-slate-700 rounded-full px-6 py-4 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-pink-600"
            placeholder="Search for a product..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl bg-slate-800/30 backdrop-blur-lg p-4 shadow-lg">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wide text-sm">
                <th className="py-3 px-6">Platform</th>
                <th className="py-3 px-6">Product Details</th>
                <th className="py-3 px-6">Price & Offers</th>
                <th className="py-3 px-6">Rating</th>
                <th className="py-3 px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {results.length > 0 ? (
                results.map((result, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-700/40 transition rounded-lg"
                  >
                    <td className="py-5 px-6 flex items-center gap-3 font-semibold">
                      <span className="text-2xl">{result.platformLogo}</span>
                      <div>
                        <div className="text-white">{result.platform}</div>
                        <div className="text-green-400 text-xs font-medium">
                          {result.availability}
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-gray-300 font-medium">
                      {result.productName}
                    </td>
                    <td className="py-5 px-6">
                      <div className="text-green-400 font-mono font-semibold text-lg">
                        {result.price}
                      </div>
                      {result.discount && (
                        <div className="inline-block bg-red-500/30 text-red-400 py-1 px-3 rounded-full mt-1 text-xs font-semibold">
                          {result.discount}
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6 text-yellow-400 font-bold text-lg">
                      ⭐ {result.rating || 'N/A'}
                    </td>
                    <td className="py-5 px-6">
                      <a
                        href={result.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-gradient-to-tr from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg px-4 py-2 font-semibold shadow-lg transition-transform hover:scale-105"
                      >
                        View Deal
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 font-semibold text-gray-400">
                    No products found for &quot;{searchTerm}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Best Deal */}
        {results.length > 0 && (
          <div className="text-center mt-12">
            <div className="inline-flex items-center bg-slate-700/40 rounded-full px-6 py-3 text-green-400 font-semibold shadow-md">
              <span className="mr-2">💰</span>
              <span>
                Best Deal: {results[1]?.platform} saves you ₹{(
                parseInt(results[0]?.price.replace(/[^0-9]/g, '')) - parseInt(results[1]?.price.replace(/[^0-9]/g, ''))
              ).toLocaleString()} more!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
