import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { useData } from '../context/DataContext';
import { useMonthlyStats } from '../hooks/useMonthlyStats';
import { PieChart, Save } from 'lucide-react';

const historicalProfitShares = {
  '2026-03': { profit: 24558, workshop: 1650, p1: 2456, p2: 2456, p3: 2456, p4: 1228 },
  '2026-04': { profit: 23680, workshop: 750, p1: 2368, p2: 2368, p3: 2368, p4: 1184 },
  '2026-05': { profit: 2835, workshop: 750, p1: 284, p2: 284, p3: 284, p4: 142 },
  '2026-06': { profit: 23646, workshop: 5235, p1: 2365, p2: 2365, p3: 2365, p4: 1182 },
  '2026-07': { profit: 21396, workshop: 8063, p1: 2995, p2: 2995, p3: 2995, p4: 1712 }
};

const historicalWithdrawals = {
  '2026-04': { '1': 2000, '2': 2000, '3': 2000, '4': 500 },
  '2026-06': { '1': 3000, '2': 3000, '3': 3000, '4': 3000 }
};

const ProfitSharing = () => {
  const {  orders, archivedOrders, transactions,  profitShares, updateProfitShares  } = useData();
  const { products, supplies, addProduct, updateProduct, replaceProducts, addSupply } = useInventory();
  const monthlyStats = useMonthlyStats({ orders, archivedOrders, transactions, products });

  const handleProfitChange = (monthKey, value) => {
    const val = value === '' ? null : (parseInt(value) || 0);
    updateProfitShares({
      ...profitShares,
      customProfits: {
        ...(profitShares?.customProfits || {}),
        [monthKey]: val
      }
    });
  };

  const handleWorkshopChange = (monthKey, value) => {
    const val = parseInt(value) || 0;
    updateProfitShares({
      ...profitShares,
      workshopDeductions: {
        ...(profitShares?.workshopDeductions || {}),
        [monthKey]: val
      }
    });
  };

  const handleWithdrawalChange = (monthKey, partnerId, value) => {
    const val = parseInt(value) || 0;
    const currentWithdrawals = profitShares?.withdrawals || {};
    const monthWithdrawals = currentWithdrawals[monthKey] || {};
    
    updateProfitShares({
      ...profitShares,
      withdrawals: {
        ...currentWithdrawals,
        [monthKey]: {
          ...monthWithdrawals,
          [partnerId]: val
        }
      }
    });
  };

  // Totals for Table 1
  let totalProfit = 0;
  let totalChurch50 = 0;
  let totalWorkshop = 0;
  let totalChurchNet = 0;
  let totalP1 = 0;
  let totalP2 = 0;
  let totalP3 = 0;
  let totalP4 = 0;

  // Totals for Table 2
  let totalWithdrawnP1 = 0;
  let totalWithdrawnP2 = 0;
  let totalWithdrawnP3 = 0;
  let totalWithdrawnP4 = 0;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--accent-primary)20', padding: '12px', borderRadius: '12px', color: 'var(--accent-primary)' }}>
          <PieChart size={28} />
        </div>
        <h2 className="heading-lg">تقسيم الأرباح</h2>
      </div>

      {/* Table 1: Formula */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="heading-md" style={{ textAlign: 'center' }}>معادلة تقسيم الارباح</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '800px' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={thStyle}>الشهر</th>
                <th rowSpan={2} style={{...thStyle, background: '#e0f2fe'}}>الارباح</th>
                <th colSpan={3} style={{...thStyle, background: '#fce7f3'}}>الكنيسة</th>
                <th rowSpan={2} style={{...thStyle, background: '#e0f2fe'}}>1<br/>14%</th>
                <th rowSpan={2} style={{...thStyle, background: '#e0f2fe'}}>2<br/>14%</th>
                <th rowSpan={2} style={{...thStyle, background: '#e0f2fe'}}>3<br/>14%</th>
                <th rowSpan={2} style={{...thStyle, background: '#e0f2fe'}}>4<br/>8%</th>
              </tr>
              <tr>
                <th style={{...thStyle, background: '#fce7f3'}}>50%</th>
                <th style={{...thStyle, background: '#fce7f3'}}>حساب الورشة</th>
                <th style={{...thStyle, background: '#fce7f3'}}>باقي للكنيسة</th>
              </tr>
            </thead>
            <tbody>
              {/* Note: monthlyStats is sorted descending by default, let's sort it ascending for this table */}
              {[...monthlyStats].reverse().map(([monthKey, data]) => {
                const override = historicalProfitShares[monthKey];
                const customProfit = profitShares?.customProfits?.[monthKey];
                const netProfit = customProfit !== undefined && customProfit !== null ? customProfit : (override ? override.profit : (data.sales - (data.cogs + data.admin + data.other)));
                const church50 = Math.round(netProfit * 0.50);
                const fbWorkshop = profitShares?.workshopDeductions?.[monthKey];
                const workshop = fbWorkshop !== undefined ? fbWorkshop : (override ? override.workshop : 0);
                const churchNet = church50 - workshop;
                const p1 = override ? override.p1 : Math.round(netProfit * 0.14);
                const p2 = override ? override.p2 : Math.round(netProfit * 0.14);
                const p3 = override ? override.p3 : Math.round(netProfit * 0.14);
                const p4 = override ? override.p4 : Math.round(netProfit * 0.08);

                totalProfit += netProfit;
                totalChurch50 += church50;
                totalWorkshop += workshop;
                totalChurchNet += churchNet;
                totalP1 += p1;
                totalP2 += p2;
                totalP3 += p3;
                totalP4 += p4;

                return (
                  <tr key={monthKey}>
                    <td style={tdStyle}>{monthKey}</td>
                    <td style={{...tdStyle, fontWeight: 'bold', padding: '4px'}}>
                      <input 
                        type="number" 
                        className="input-field"
                        style={{ textAlign: 'center', padding: '4px', height: '30px', fontWeight: 'bold' }}
                        value={customProfit !== undefined && customProfit !== null ? customProfit : netProfit} 
                        onChange={(e) => handleProfitChange(monthKey, e.target.value)}
                      />
                    </td>
                    <td style={{...tdStyle, background: '#fdf2f8'}}>{church50.toLocaleString()}</td>
                    <td style={{...tdStyle, background: '#fdf2f8', padding: '4px'}}>
                      <input 
                        type="number" 
                        className="input-field"
                        style={{ textAlign: 'center', padding: '4px', height: '30px' }}
                        value={workshop === 0 && !fbWorkshop && !override?.workshop ? '' : workshop} 
                        onChange={(e) => handleWorkshopChange(monthKey, e.target.value)}
                      />
                    </td>
                    <td style={{...tdStyle, background: '#fdf2f8', color: churchNet < 0 ? 'red' : 'inherit'}}>{churchNet.toLocaleString()}</td>
                    <td style={tdStyle}>{p1.toLocaleString()}</td>
                    <td style={tdStyle}>{p2.toLocaleString()}</td>
                    <td style={tdStyle}>{p3.toLocaleString()}</td>
                    <td style={tdStyle}>{p4.toLocaleString()}</td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr style={{ background: '#fef3c7', fontWeight: 'bold', color: '#b45309' }}>
                <td style={tdStyle}>الإجمالي</td>
                <td style={{...tdStyle, color: 'red'}}>{totalProfit.toLocaleString()}</td>
                <td style={{...tdStyle, color: 'red'}}>{totalChurch50.toLocaleString()}</td>
                <td style={{...tdStyle, color: 'red'}}>{totalWorkshop.toLocaleString()}</td>
                <td style={{...tdStyle, color: 'red'}}>{totalChurchNet.toLocaleString()}</td>
                <td style={{...tdStyle, color: 'red'}}>{totalP1.toLocaleString()}</td>
                <td style={{...tdStyle, color: 'red'}}>{totalP2.toLocaleString()}</td>
                <td style={{...tdStyle, color: 'red'}}>{totalP3.toLocaleString()}</td>
                <td style={{...tdStyle, color: 'red'}}>{totalP4.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Withdrawals */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="heading-md" style={{ textAlign: 'center' }}>المسحوبات</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={thStyle}>الشهر</th>
                <th style={thStyle}>شريك 1</th>
                <th style={thStyle}>شريك 2</th>
                <th style={thStyle}>شريك 3</th>
                <th style={thStyle}>شريك 4</th>
              </tr>
            </thead>
            <tbody>
              {[...monthlyStats].reverse().map(([monthKey]) => {
                const overrideW = historicalWithdrawals[monthKey];
                
                const fbW1 = profitShares?.withdrawals?.[monthKey]?.['1'];
                const fbW2 = profitShares?.withdrawals?.[monthKey]?.['2'];
                const fbW3 = profitShares?.withdrawals?.[monthKey]?.['3'];
                const fbW4 = profitShares?.withdrawals?.[monthKey]?.['4'];

                const w1 = fbW1 !== undefined ? fbW1 : (overrideW ? (overrideW['1'] || 0) : 0);
                const w2 = fbW2 !== undefined ? fbW2 : (overrideW ? (overrideW['2'] || 0) : 0);
                const w3 = fbW3 !== undefined ? fbW3 : (overrideW ? (overrideW['3'] || 0) : 0);
                const w4 = fbW4 !== undefined ? fbW4 : (overrideW ? (overrideW['4'] || 0) : 0);

                totalWithdrawnP1 += w1;
                totalWithdrawnP2 += w2;
                totalWithdrawnP3 += w3;
                totalWithdrawnP4 += w4;

                return (
                  <tr key={`w-${monthKey}`}>
                    <td style={tdStyle}>{monthKey}</td>
                    <td style={{...tdStyle, padding: '4px'}}>
                      <input 
                        type="number" className="input-field" style={{ textAlign: 'center', padding: '4px', height: '30px' }}
                        value={w1 === 0 && !fbW1 && !overrideW?.['1'] ? '' : w1} onChange={(e) => handleWithdrawalChange(monthKey, '1', e.target.value)}
                      />
                    </td>
                    <td style={{...tdStyle, padding: '4px'}}>
                      <input 
                        type="number" className="input-field" style={{ textAlign: 'center', padding: '4px', height: '30px' }}
                        value={w2 === 0 && !fbW2 && !overrideW?.['2'] ? '' : w2} onChange={(e) => handleWithdrawalChange(monthKey, '2', e.target.value)}
                      />
                    </td>
                    <td style={{...tdStyle, padding: '4px'}}>
                      <input 
                        type="number" className="input-field" style={{ textAlign: 'center', padding: '4px', height: '30px' }}
                        value={w3 === 0 && !fbW3 && !overrideW?.['3'] ? '' : w3} onChange={(e) => handleWithdrawalChange(monthKey, '3', e.target.value)}
                      />
                    </td>
                    <td style={{...tdStyle, padding: '4px'}}>
                      <input 
                        type="number" className="input-field" style={{ textAlign: 'center', padding: '4px', height: '30px' }}
                        value={w4 === 0 && !fbW4 && !overrideW?.['4'] ? '' : w4} onChange={(e) => handleWithdrawalChange(monthKey, '4', e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
              {/* Remaining Row */}
              <tr style={{ fontWeight: 'bold' }}>
                <td style={{...tdStyle, color: 'red'}}>الباقي</td>
                <td style={{...tdStyle, color: 'red'}}>{(totalP1 - totalWithdrawnP1).toLocaleString()}</td>
                <td style={{...tdStyle, color: 'red'}}>{(totalP2 - totalWithdrawnP2).toLocaleString()}</td>
                <td style={{...tdStyle, color: 'red'}}>{(totalP3 - totalWithdrawnP3).toLocaleString()}</td>
                <td style={{...tdStyle, color: 'red'}}>{(totalP4 - totalWithdrawnP4).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

const thStyle = {
  border: '1px solid #000',
  padding: '8px',
  fontWeight: 'bold',
  fontSize: '0.9rem'
};

const tdStyle = {
  border: '1px solid #000',
  padding: '8px',
  fontSize: '0.9rem'
};

export default ProfitSharing;
