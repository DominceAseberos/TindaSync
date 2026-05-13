import { type FormEvent, useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, AreaChart, Area } from 'recharts'
import './App.css'

type PlatformId = 'shopee' | 'lazada' | 'facebook' | 'tiktok'

type Platform = {
  id: PlatformId
  name: string
  badgeColor: string
  status: 'connected' | 'syncing' | 'error'
  lastSyncAt: string
}

type Product = {
  id: string
  name: string
  sku: string
  category: string
  price: number
  masterStock: number
  lowStockThreshold: number
  unitsSold: number
  platformStocks: Record<PlatformId, number>
}

type Order = {
  id: string
  platformId: PlatformId
  buyerName: string
  location: string
  items: { productId: string; name: string; qty: number; price: number }[]
  total: number
  deadlineAt: string
  status: 'pending' | 'packed'
}

type EarningsDay = {
  date: string
  byPlatform: Record<PlatformId, number>
}

type Toast = {
  id: string
  title: string
  message: string
  tone: 'info' | 'success' | 'warning'
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value)

const formatDate = (date: Date) => date.toISOString().slice(0, 10)

const buildEarnings = (): EarningsDay[] => {
  const days: EarningsDay[] = []
  const today = new Date()

  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    const seed = 1 + (29 - i) * 0.18
    days.push({
      date: formatDate(day),
      byPlatform: {
        shopee: Math.round(1800 * seed + (i % 5) * 120),
        lazada: Math.round(1400 * seed + (i % 4) * 90),
        facebook: Math.round(950 * seed + (i % 3) * 70),
        tiktok: Math.round(1200 * seed + (i % 6) * 85),
      },
    })
  }

  return days
}

const initialPlatforms: Platform[] = [
  {
    id: 'shopee',
    name: 'Shopee',
    badgeColor: '#ff6a3d',
    status: 'connected',
    lastSyncAt: '18s ago',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    badgeColor: '#2f6bff',
    status: 'connected',
    lastSyncAt: '22s ago',
  },
  {
    id: 'facebook',
    name: 'Facebook Marketplace',
    badgeColor: '#0f6ae5',
    status: 'connected',
    lastSyncAt: '27s ago',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    badgeColor: '#121212',
    status: 'connected',
    lastSyncAt: '31s ago',
  },
]

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Wireless Earbuds',
    sku: 'TS-EARBUDS-01',
    category: 'Gadgets',
    price: 1299,
    masterStock: 10,
    lowStockThreshold: 3,
    unitsSold: 42,
    platformStocks: { shopee: 10, lazada: 10, facebook: 10, tiktok: 10 },
  },
  {
    id: 'prod-2',
    name: 'Glow Serum 30ml',
    sku: 'TS-SKIN-GLW',
    category: 'Skincare',
    price: 399,
    masterStock: 18,
    lowStockThreshold: 5,
    unitsSold: 67,
    platformStocks: { shopee: 18, lazada: 18, facebook: 18, tiktok: 18 },
  },
  {
    id: 'prod-3',
    name: 'Reusable Coffee Tumbler',
    sku: 'TS-HOME-CUP',
    category: 'Home',
    price: 349,
    masterStock: 7,
    lowStockThreshold: 4,
    unitsSold: 33,
    platformStocks: { shopee: 7, lazada: 7, facebook: 7, tiktok: 7 },
  },
  {
    id: 'prod-4',
    name: 'Minimal Tote Bag',
    sku: 'TS-ACC-TOTE',
    category: 'Accessories',
    price: 499,
    masterStock: 14,
    lowStockThreshold: 4,
    unitsSold: 29,
    platformStocks: { shopee: 14, lazada: 14, facebook: 14, tiktok: 14 },
  },
  {
    id: 'prod-5',
    name: 'Bamboo Storage Tray',
    sku: 'TS-HOME-TRAY',
    category: 'Home',
    price: 459,
    masterStock: 6,
    lowStockThreshold: 3,
    unitsSold: 21,
    platformStocks: { shopee: 6, lazada: 6, facebook: 6, tiktok: 6 },
  },
]

const initialOrders: Order[] = [
  {
    id: 'ord-1001',
    platformId: 'shopee',
    buyerName: 'Mika Reyes',
    location: 'Quezon City',
    items: [{ productId: 'prod-2', name: 'Glow Serum 30ml', qty: 2, price: 399 }],
    total: 798,
    deadlineAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'ord-1002',
    platformId: 'lazada',
    buyerName: 'Jomar Castillo',
    location: 'Makati',
    items: [
      { productId: 'prod-1', name: 'Wireless Earbuds', qty: 1, price: 1299 },
    ],
    total: 1299,
    deadlineAt: new Date(Date.now() + 6.5 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'ord-1003',
    platformId: 'facebook',
    buyerName: 'Ana Dizon',
    location: 'Cebu City',
    items: [
      { productId: 'prod-4', name: 'Minimal Tote Bag', qty: 1, price: 499 },
    ],
    total: 499,
    deadlineAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'ord-1004',
    platformId: 'tiktok',
    buyerName: 'Rina Gonzales',
    location: 'Davao City',
    items: [
      { productId: 'prod-3', name: 'Reusable Coffee Tumbler', qty: 1, price: 349 },
    ],
    total: 349,
    deadlineAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: 'ord-1005',
    platformId: 'shopee',
    buyerName: 'Liza Flores',
    location: 'Taguig',
    items: [
      { productId: 'prod-5', name: 'Bamboo Storage Tray', qty: 1, price: 459 },
    ],
    total: 459,
    deadlineAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
]

function App() {
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [earnings, setEarnings] = useState<EarningsDay[]>(buildEarnings())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialOrders[0]?.id ?? null,
  )
  const [showAddProduct, setShowAddProduct] = useState(false)

  const todayKey = formatDate(new Date())

  const totals = useMemo(() => {
    const today = earnings.find((day) => day.date === todayKey)
    const last7 = earnings.slice(-7)
    const last30 = earnings

    const sumByDay = (list: EarningsDay[]) =>
      list.reduce(
        (total, day) =>
          total +
          day.byPlatform.shopee +
          day.byPlatform.lazada +
          day.byPlatform.facebook +
          day.byPlatform.tiktok,
        0,
      )

    return {
      today: today
        ? today.byPlatform.shopee +
          today.byPlatform.lazada +
          today.byPlatform.facebook +
          today.byPlatform.tiktok
        : 0,
      week: sumByDay(last7),
      month: sumByDay(last30),
    }
  }, [earnings, todayKey])

  const ordersByUrgency = useMemo(() => {
    return [...orders]
      .filter((order) => order.status === 'pending')
      .sort(
        (a, b) =>
          new Date(a.deadlineAt).getTime() -
          new Date(b.deadlineAt).getTime(),
      )
  }, [orders])

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === selectedOrderId) ?? null
  }, [orders, selectedOrderId])

  const lowStock = useMemo(() => {
    return products.filter(
      (product) => product.masterStock <= product.lowStockThreshold,
    )
  }, [products])

  const bestSellers = useMemo(() => {
    return [...products]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5)
  }, [products])

  const addToast = (toast: Toast) => {
    setToasts((prev) => [...prev, toast])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toast.id))
    }, 4200)
  }

  const handleSimulateSale = () => {
    const productId = 'prod-1'
    const platformId: PlatformId = 'shopee'
    const orderId = `ord-${Math.floor(1000 + Math.random() * 9000)}`
    const deadline = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
    const currentProduct = products.find((product) => product.id === productId)

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) {
          return product
        }
        const nextStock = Math.max(product.masterStock - 1, 0)
        const nextPlatformStocks = {
          ...product.platformStocks,
          shopee: nextStock,
          lazada: nextStock,
          facebook: nextStock,
          tiktok: nextStock,
        }

        return {
          ...product,
          masterStock: nextStock,
          unitsSold: product.unitsSold + 1,
          platformStocks: nextPlatformStocks,
        }
      }),
    )

    setOrders((prev) => [
      {
        id: orderId,
        platformId,
        buyerName: 'Paolo Mercado',
        location: 'Pasig',
        items: [
          {
            productId,
            name: 'Wireless Earbuds',
            qty: 1,
            price: 1299,
          },
        ],
        total: 1299,
        deadlineAt: deadline,
        status: 'pending',
      },
      ...prev,
    ])

    setSelectedOrderId(orderId)

    setEarnings((prev) => {
      return prev.map((day) => {
        if (day.date !== todayKey) {
          return day
        }
        return {
          ...day,
          byPlatform: {
            ...day.byPlatform,
            shopee: day.byPlatform.shopee + 1299,
          },
        }
      })
    })

    setPlatforms((prev) =>
      prev.map((platform) => {
        if (platform.id === 'shopee' || platform.id === 'facebook') {
          return { ...platform, lastSyncAt: 'just now' }
        }
        return platform
      }),
    )

    addToast({
      id: `toast-${Date.now()}`,
      title: 'Demo sale received from Shopee',
      message: 'Stock updated across all connected platforms.',
      tone: 'success',
    })

    if (
      currentProduct &&
      currentProduct.masterStock - 1 <= currentProduct.lowStockThreshold
    ) {
      addToast({
        id: `toast-low-${Date.now()}`,
        title: 'Low stock alert',
        message: 'Wireless Earbuds is at or below the reorder threshold.',
        tone: 'warning',
      })
    }
  }

  const handlePackOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: 'packed' } : order,
      ),
    )
    addToast({
      id: `toast-pack-${Date.now()}`,
      title: 'Order packed',
      message: 'Packed orders move out of the urgent queue.',
      tone: 'info',
    })
  }

  const handleAddProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const sku = String(formData.get('sku') ?? '').trim()
    const category = String(formData.get('category') ?? '').trim()
    const price = Number(formData.get('price'))
    const stock = Number(formData.get('stock'))
    const threshold = Number(formData.get('threshold'))

    if (!name || !sku || !category || Number.isNaN(price)) {
      return
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      sku,
      category,
      price,
      masterStock: stock,
      lowStockThreshold: threshold,
      unitsSold: 0,
      platformStocks: {
        shopee: stock,
        lazada: stock,
        facebook: stock,
        tiktok: stock,
      },
    }

    setProducts((prev) => [newProduct, ...prev])
    setShowAddProduct(false)
    addToast({
      id: `toast-add-${Date.now()}`,
      title: 'Product added',
      message: 'Listing added to your master catalog.',
      tone: 'success',
    })
  }

  const chartData = useMemo(() => {
    return earnings.map((day) => ({
      ...day,
      total: day.byPlatform.shopee + day.byPlatform.lazada + day.byPlatform.facebook + day.byPlatform.tiktok,
      shortDate: day.date.slice(5) // MM-DD
    }))
  }, [earnings])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#111827', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}>
          <p style={{ marginBottom: '4px', fontWeight: 600 }}>{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: entry.fill || entry.color, textTransform: 'capitalize' }}>{entry.name.includes('shopee') ? 'Shopee' : entry.name.includes('lazada') ? 'Lazada' : entry.name.includes('facebook') ? 'Facebook' : entry.name.includes('tiktok') ? 'TikTok' : 'Total'}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace' }}>{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span>★</span>
          </div>
          <div>
            <p className="brand-title">TindaSync</p>
            <p className="brand-tagline">Sell Everywhere. Sync Effortlessly.</p>
          </div>
        </div>
        <div className="top-actions">
          <button className="ghost" type="button">
            Demo: Maria Santos
          </button>
          <button className="primary" type="button" onClick={handleSimulateSale}>
            Simulate Shopee Sale
          </button>
        </div>
      </header>

      <section className="onboarding">
        <div>
          <p className="eyebrow">Onboarding</p>
          <h1>Connect your stores, then sell from one dashboard.</h1>
          <p className="muted">
            Demo mode uses mock data. Last sync updates are simulated for the
            investor walk-through.
          </p>
        </div>
        <div className="onboarding-steps">
          <div className="step">
            <span>1</span>
            <div>
              <p>Sign up</p>
              <p className="muted">Email or Google account</p>
            </div>
          </div>
          <div className="step">
            <span>2</span>
            <div>
              <p>Connect platforms</p>
              <p className="muted">Shopee, Lazada, FB, TikTok</p>
            </div>
          </div>
          <div className="step">
            <span>3</span>
            <div>
              <p>Import catalog</p>
              <p className="muted">Instant master stock sync</p>
            </div>
          </div>
        </div>
        <button className="secondary" type="button">
          Start connection wizard
        </button>
      </section>

      <section className="status-bar">
        {platforms.map((platform) => (
          <div className="status-pill" key={platform.id}>
            <span
              className="status-dot"
              style={{ background: platform.badgeColor }}
            ></span>
            <div>
              <p>{platform.name}</p>
              <p className="muted">{platform.lastSyncAt}</p>
            </div>
            <span className={`status ${platform.status}`}>
              {platform.status}
            </span>
          </div>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="card earnings" style={{ animationDelay: '0.05s' }}>
          <div className="card-header">
            <h2>Total earnings</h2>
            <p className="muted">Gross revenue</p>
          </div>
          <div className="earnings-values">
            <div>
              <p>Today</p>
              <h3>{formatCurrency(totals.today)}</h3>
            </div>
            <div>
              <p>This week</p>
              <h3>{formatCurrency(totals.week)}</h3>
            </div>
            <div>
              <p>This month</p>
              <h3>{formatCurrency(totals.month)}</h3>
            </div>
          </div>
          <div className="sparkline" style={{ height: '120px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.slice(-14)}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card orders" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <h2>Orders inbox</h2>
            <p className="muted">Urgent fulfillment window</p>
          </div>
          <div className="orders-list">
            {ordersByUrgency.slice(0, 5).map((order) => (
              <button
                type="button"
                key={order.id}
                className={`order-row ${
                  selectedOrderId === order.id ? 'active' : ''
                }`}
                onClick={() => setSelectedOrderId(order.id)}
              >
                <span className={`badge ${order.platformId}`}></span>
                <div>
                  <p>{order.items[0]?.name}</p>
                  <p className="muted">
                    {order.buyerName} · {order.location}
                  </p>
                </div>
                <span className="countdown">
                  {Math.max(
                    1,
                    Math.round(
                      (new Date(order.deadlineAt).getTime() - Date.now()) /
                        (60 * 60 * 1000),
                    ),
                  )}
                  h
                </span>
              </button>
            ))}
            {ordersByUrgency.length === 0 && (
              <p className="empty">No urgent orders right now.</p>
            )}
          </div>
        </div>

        <div className="card alerts" style={{ animationDelay: '0.15s' }}>
          <div className="card-header">
            <h2>Inventory alerts</h2>
            <p className="muted">Low stock thresholds</p>
          </div>
          <div className="list">
            {lowStock.map((product) => (
              <div className="list-row" key={product.id}>
                <div>
                  <p>{product.name}</p>
                  <p className="muted">
                    {product.masterStock} left · threshold {product.lowStockThreshold}
                  </p>
                </div>
                <button type="button" className="tertiary">
                  Restock
                </button>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="empty">All items are above threshold.</p>
            )}
          </div>
        </div>

        <div className="card best" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <h2>Best sellers</h2>
            <p className="muted">Top products by units sold</p>
          </div>
          <div className="list">
            {bestSellers.map((product) => (
              <div className="list-row" key={product.id}>
                <div>
                  <p>{product.name}</p>
                  <p className="muted">{product.unitsSold} units sold</p>
                </div>
                <div style={{ width: '80px', height: '28px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{ s: product.platformStocks.shopee, l: product.platformStocks.lazada, f: product.platformStocks.facebook, t: product.platformStocks.tiktok }]}>
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '11px', padding: '4px' }} />
                      <Bar dataKey="s" stackId="a" fill="#EE4D2D" radius={[2, 2, 2, 2]} />
                      <Bar dataKey="l" stackId="a" fill="#000080" radius={[2, 2, 2, 2]} />
                      <Bar dataKey="f" stackId="a" fill="#0866FF" radius={[2, 2, 2, 2]} />
                      <Bar dataKey="t" stackId="a" fill="#000000" radius={[2, 2, 2, 2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card chart" style={{ animationDelay: '0.25s' }}>
          <div className="card-header">
            <h2>Earnings (30 days)</h2>
            <p className="muted">Platform breakdown</p>
          </div>
          <div className="chart-grid" style={{ height: '240px', marginTop: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="shortDate" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="byPlatform.shopee" stackId="a" fill="#EE4D2D" radius={[0, 0, 2, 2]} />
                <Bar dataKey="byPlatform.lazada" stackId="a" fill="#000080" />
                <Bar dataKey="byPlatform.facebook" stackId="a" fill="#0866FF" />
                <Bar dataKey="byPlatform.tiktok" stackId="a" fill="#000000" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="legend" style={{ marginTop: '16px' }}>
            <span className="legend-item shopee">Shopee</span>
            <span className="legend-item lazada">Lazada</span>
            <span className="legend-item facebook">Facebook</span>
            <span className="legend-item tiktok">TikTok</span>
          </div>
        </div>

        <div className="card detail" style={{ animationDelay: '0.3s' }}>
          <div className="card-header">
            <h2>Order detail</h2>
            <p className="muted">Unified view</p>
          </div>
          {selectedOrder ? (
            <div className="order-detail">
              <div className="detail-header">
                <div>
                  <p className="muted">Buyer</p>
                  <h3>{selectedOrder.buyerName}</h3>
                  <p className="muted">{selectedOrder.location}</p>
                </div>
                <span className={`badge large ${selectedOrder.platformId}`}></span>
              </div>
              <div className="detail-items">
                {selectedOrder.items.map((item) => (
                  <div className="detail-row" key={item.productId}>
                    <div>
                      <p>{item.name}</p>
                      <p className="muted">Qty {item.qty}</p>
                    </div>
                    <p className="price">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>
              <div className="detail-footer">
                <div>
                  <p className="muted">Total</p>
                  <h3>{formatCurrency(selectedOrder.total)}</h3>
                </div>
                <button
                  type="button"
                  className="primary"
                  onClick={() => handlePackOrder(selectedOrder.id)}
                  disabled={selectedOrder.status === 'packed'}
                >
                  {selectedOrder.status === 'packed' ? 'Packed' : 'Mark as packed'}
                </button>
              </div>
            </div>
          ) : (
            <p className="empty">Select an order to view details.</p>
          )}
        </div>
      </section>

      <button className="fab" type="button" onClick={() => setShowAddProduct(true)}>
        + Quick add product
      </button>

      {showAddProduct && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <h2>Add product</h2>
                <p className="muted">Publish to multiple platforms in one step.</p>
              </div>
              <button
                type="button"
                className="ghost"
                onClick={() => setShowAddProduct(false)}
              >
                Close
              </button>
            </div>
            <form className="modal-body" onSubmit={handleAddProduct}>
              <label>
                Product name
                <input name="name" placeholder="e.g., Matte Lip Tint" required />
              </label>
              <label>
                SKU
                <input name="sku" placeholder="TS-MAKEUP-02" required />
              </label>
              <label>
                Category
                <input name="category" placeholder="Beauty" required />
              </label>
              <div className="row">
                <label>
                  Price (PHP)
                  <input name="price" type="number" min="0" required />
                </label>
                <label>
                  Starting stock
                  <input name="stock" type="number" min="0" required />
                </label>
                <label>
                  Low-stock threshold
                  <input name="threshold" type="number" min="0" required />
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary">
                  Add to master catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.tone}`}>
            <div>
              <p className="toast-title">{toast.title}</p>
              <p className="muted">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
