import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, CheckSquare, Package, PieChart, Wallet, Archive, Users, MoreHorizontal, X, Percent, BarChart3, Receipt } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  
  const handleFactoryReset = async () => {
    if (window.confirm("تحذير خطير: هل أنت متأكد من مسح جميع بيانات الموقع بالكامل والبدء من جديد؟ (لا يمكن التراجع)")) {
      try {
        // We will trigger a full database wipe by communicating with DataContext or just deleting from localStorage
        // Since we are in Layout, we don't have direct access to setDoc unless we import it, but it's easier to just do it via DataContext.
        // Actually, we can just import it here.
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
        await setDoc(doc(db, 'crm', 'main'), { orders: {}, columns: {
          pending:   { id: 'pending',   title: 'قيد المراجعة', orderIds: [], color: '#48bb78' },
          designing: { id: 'designing', title: 'جاري التصميم', orderIds: [], color: '#f6ad55' },
          printing:  { id: 'printing',  title: 'في الطباعة',   orderIds: [], color: '#f6e05e' },
          received:  { id: 'received',  title: 'في الكنيسة',   orderIds: [], color: '#38b2ac' },
          ready:     { id: 'ready',     title: 'جاهزة وعايزة تتشحن', orderIds: [], color: '#ed8936' },
          shipped:   { id: 'shipped',   title: 'في شركة الشحن', orderIds: [], color: '#4299e1' },
          arrived:   { id: 'arrived',   title: 'أوردرات وصلت', orderIds: [], color: '#9f7aea' },
        }, archivedOrders: [] });
        await setDoc(doc(db, 'crm', 'clients'), { clients: [] });
        await setDoc(doc(db, 'crm', 'products'), { products: [] });
        await setDoc(doc(db, 'crm', 'tasks'), { tasks: {} });
        await setDoc(doc(db, 'crm', 'ledger'), { transactions: [], profitShares: [] });
        await setDoc(doc(db, 'crm', 'supplies'), { supplies: [] });
        
        localStorage.clear();
        alert("تم فرمتة السحابة والموقع بالكامل بنجاح!");
        window.location.href = '/';
      } catch (err) {
        alert("حدث خطأ أثناء المسح: " + err.message);
      }
    }
  };

  const isAdmin = currentUser.id === 'kirolos' || currentUser.id === 'marina' || currentUser.id === 'abouna';

  // All nav items
  const mainNavItems = [
    { path: '/', label: 'الأوردرات', icon: LayoutDashboard },
    { path: '/tasks', label: 'المهام', icon: CheckSquare },
    { path: '/inventory', label: 'المخزن', icon: Package },
  ];

  const adminNavItems = [
    { path: '/clients', label: 'العملاء', icon: Users },
    { path: '/analytics', label: 'الإحصائيات', icon: PieChart },
    { path: '/transactions', label: 'المعاملات', icon: Receipt },
    { path: '/ledger', label: 'الحسابات', icon: Wallet },
    { path: '/archive', label: 'الأرشيف', icon: Archive },
    { path: '/profits', label: 'تقسيم الأرباح', icon: Percent },
    { path: '/monthly-stats', label: 'الحسابات الشهرية', icon: BarChart3 },
  ];

  // Mobile bottom nav: show 4 main + "more" if admin
  const bottomNavItems = mainNavItems.slice(0, 4);
  const moreItems = isAdmin ? adminNavItems : [];

  const isActive = (path) => location.pathname === path;
  const isMoreActive = adminNavItems.some(i => isActive(i.path));

  return (
    <div className="app-container">
      {/* ====== DESKTOP HEADER ====== */}
      <header className="glass-panel desktop-header" style={{
        margin: '16px 16px 0',
        padding: '12px 20px',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="heading-md" style={{ whiteSpace: 'nowrap' }}>الحكاية CRM</h1>
            <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: currentUser.color,
                boxShadow: `0 0 8px ${currentUser.color}`,
                flexShrink: 0
              }} />
              <span className="text-body" style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            {mainNavItems.map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                className="btn"
                onClick={() => navigate(path)}
                style={{
                  padding: '7px 14px', fontSize: '0.875rem',
                  background: isActive(path) ? 'var(--bg-glass)' : 'transparent',
                  color: isActive(path) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: isActive(path) ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
            {isAdmin && adminNavItems.map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                className="btn"
                onClick={() => navigate(path)}
                style={{
                  padding: '7px 14px', fontSize: '0.875rem',
                  background: isActive(path) ? 'var(--bg-glass)' : 'transparent',
                  color: isActive(path) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: isActive(path) ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        
        <div style={{ display: 'flex', gap: '8px' }}>
          {isAdmin && (
            <button className="btn btn-secondary" onClick={handleFactoryReset} style={{ padding: '7px 14px', fontSize: '0.875rem', color: 'red', borderColor: 'red' }}>
              ضبط المصنع
            </button>
          )}
          <button className="btn btn-secondary" onClick={logout} style={{ padding: '7px 14px', fontSize: '0.875rem' }}>
            <LogOut size={16} />
            خروج
          </button>
        </div>

      </header>

      {/* ====== MOBILE HEADER (compact top bar) ====== */}
      <header className="mobile-header glass-panel" style={{
        margin: '12px 12px 0',
        padding: '12px 16px',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 'var(--radius-lg)'
      }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 800 }}>الحكاية CRM</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '9px', height: '9px', borderRadius: '50%',
              background: currentUser.color,
              boxShadow: `0 0 8px ${currentUser.color}`
            }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{currentUser.name}</span>
          </div>
          
          {isAdmin && (
            <button className="btn btn-secondary" onClick={handleFactoryReset} style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'red', borderColor: 'red' }}>
              ضبط المصنع
            </button>
          )}
          <button className="btn btn-secondary" onClick={logout} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <LogOut size={14} />
            خروج
          </button>

        </div>
      </header>

      {/* ====== MAIN CONTENT ====== */}
      <main className="main-content" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingBottom: '100px' /* space for mobile bottom nav */
      }}>
        {children}
      </main>

      {/* ====== MOBILE BOTTOM NAVIGATION ====== */}
      <nav className="mobile-bottom-nav">
        {bottomNavItems.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className="mobile-nav-btn"
            onClick={() => { setMoreOpen(false); navigate(path); }}
            data-active={isActive(path)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}

        {/* "More" button for admins */}
        {isAdmin && (
          <button
            className="mobile-nav-btn"
            onClick={() => setMoreOpen(o => !o)}
            data-active={isMoreActive || moreOpen}
          >
            {moreOpen ? <X size={22} /> : <MoreHorizontal size={22} />}
            <span>المزيد</span>
          </button>
        )}

        {/* "More" Popover */}
        {moreOpen && isAdmin && (
          <>
            <div
              className="mobile-more-overlay"
              onClick={() => setMoreOpen(false)}
            />
            <div className="mobile-more-popup">
              {adminNavItems.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  className="mobile-more-item"
                  onClick={() => { setMoreOpen(false); navigate(path); }}
                  data-active={isActive(path)}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </nav>
    </div>
  );
};

export default Layout;
