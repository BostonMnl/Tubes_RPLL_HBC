import React from 'react';
import './TopProducts.css';

const products = [
  { name: 'Premium Package', sales: 1234, revenue: '$49,234' },
  { name: 'Business Plan', sales: 892, revenue: '$35,680' },
  { name: 'Enterprise Solution', sales: 567, revenue: '$28,350' },
  { name: 'Basic Package', sales: 2345, revenue: '$23,450' },
];

const TopProducts = () => {
  return (
    <div className="top-products">
      <h3>Top Products</h3>
      <div className="products-list">
        {products.map((product, index) => (
          <div key={index} className="product-item">
            <div className="product-info">
              <span className="product-rank">{index + 1}</span>
              <div>
                <div className="product-name">{product.name}</div>
                <div className="product-sales">{product.sales} sales</div>
              </div>
            </div>
            <div className="product-revenue">{product.revenue}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;