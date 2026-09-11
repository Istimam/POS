# Managerium POS
**A full-featured Restaurant Point-of-Sale system** built with pure HTML, CSS and JavaScript. No frameworks, no build tools.

Live: https://istimam.github.io/POS/

---

## Features

| Module | Capabilities |
|---|---|
| Sales Screen | Product grid, cart, discounts, VAT, order types |
| Daypart Filtering | Auto-detects time of day, filters menu accordingly |
| Quick Filters | Configurable chip bar for fast menu switching |
| Floor Layout | Drag-and-drop tables across multiple floors |
| Table Management | AVAILABLE / RESERVED / OCCUPIED states + reservations |
| Stock Control | Real-time inventory deduction and restoration on cancel |
| Payment Flow | Pay Now (cash/card/mobile) or Pay Later (KOT) |
| Back Office | Category sequencing, item enable/disable, daypart config |

---

## System Architecture

```mermaid
graph TD
    A["RESTAURANT_DATA - Single Source of Truth"] --> B[products]
    A --> C[categories]
    A --> D[tables]
    A --> E[floors]
    A --> F[openOrders]
    A --> G[dayparts]

    H[Global State Object] --> I["currentMainView: sales or tables"]
    H --> J[activeDaypartId]
    H --> K["cart and originalOrderCart"]
    H --> L["selectedTable and activeInvoiceId"]

    A --> N[app.js - Logic Layer]
    H --> N
    N --> O[index.html - Single Page UI]
    N --> P[styles.css - Design System]
```

---

## Order Lifecycle

```mermaid
flowchart LR
    A([Select Table]) --> B{Table Status?}
    B -- AVAILABLE --> C[Action Modal]
    B -- RESERVED --> C
    B -- OCCUPIED --> D[Summary Modal - View Invoice]

    C -- Start Order --> E[Sales Screen]
    D -- Add/Delete Items --> E
    D -- Settle and Pay --> E

    E --> F[Add or Remove Products in Cart]
    F --> G{Action?}

    G -- KOT / Pay Later --> H{Cart Empty?}
    H -- Yes --> I[Table freed - AVAILABLE - Stock Restored]
    H -- No --> J[Open Order Saved - Table OCCUPIED - Stock Deducted]

    G -- Pay Now --> K[Payment Modal]
    K --> L[Invoice Closed - Table AVAILABLE - Stock Deducted]
```

---

## Stock Management Flow

```mermaid
flowchart TD
    A[product.stock - live inventory] --> B{User adds item to cart}
    B --> C["getRemainingStock() - diff vs originalOrderCart"]
    C --> D[UI shows live remaining stock]

    E[KOT / Pay Later clicked] --> F["deductStockForCartDiff() - stock minus new qty added"]
    F --> G[Open Order saved in openOrders]

    H[Pay Now clicked] --> I["deductStockForCartDiff() - stock permanently reduced"]
    I --> J[Order marked PAID - Table freed]

    K[All items deleted then KOT] --> L[stock restored for each item]
    L --> M[Order CANCELLED - Table freed]
```

---

## Table State Machine

```mermaid
stateDiagram-v2
    [*] --> AVAILABLE
    AVAILABLE --> RESERVED : Staff creates reservation
    AVAILABLE --> OCCUPIED : KOT submitted with items in cart
    RESERVED --> AVAILABLE : Reservation cancelled
    RESERVED --> OCCUPIED : Guest arrives and order is placed
    OCCUPIED --> AVAILABLE : Payment completed
    OCCUPIED --> AVAILABLE : All items deleted then KOT
    OCCUPIED --> OCCUPIED : Edit items and re-submit KOT
```

---

## Daypart Auto-Filter System

```mermaid
flowchart LR
    A([App Load]) --> B["autoDetectDaypart() checks hour and day"]
    B --> C{Match time window?}
    C -- Yes --> D[Set activeDaypartId]
    D --> E["renderProductGrid() filters by p.dayparts"]
    E --> F[Category sidebar counts update]
    F --> G[Quick Filter chips reflect active daypart]

    H[Show All Items toggle] --> I["isOverrideActive = true - full menu visible"]
```

---

## File Structure

`
Supplier7Star/
├── index.html      # Single-page UI - all modals, views, layout
├── app.js          # All logic - data, state, rendering (~2300 lines)
└── styles.css      # Design system - CSS variables, components
`

### app.js Module Breakdown

| Section | Key Functions |
|---|---|
| Data Schema | RESTAURANT_DATA - products, tables, floors, orders, dayparts |
| Global State | state object - single reactive store for all UI state |
| Initialization | DOMContentLoaded, startClock, autoDetectDaypart |
| Sales Screen | renderPOS, renderProductGrid, renderCategories, renderCart |
| Stock Logic | getRemainingStock, deductStockForCartDiff |
| Cart Operations | addToCart, updateCartQty, clearCart, applyDiscount |
| Order Processing | processPayLater, processPayment, cancelOrder |
| Floor Layout | renderFloorCanvas, enableTableDragging, selectTableForOrder |
| Table Modals | openTableSummaryModal, openTableActionModal, openReservationModal |
| Back Office | renderBoCategorySeqTable, renderBoItemEditor, renderBoDaypartsTable |
| Payment | openPaymentModal, selectPayMethod, addTender, calcChange |

---

## Key Design Decisions

- **Single source of truth** - RESTAURANT_DATA is the database; state is the UI layer
- **No backend** - all data lives in-memory in the browser, ideal for demo/prototype
- **Stock diff model** - stock deducted only on KOT/Pay; originalOrderCart prevents double-deductions when editing open invoices
- **Daypart-driven menu** - menu is time-aware by default; staff can override to show everything
- **Vanilla JS** - zero build tools, zero npm; open index.html and it runs

---

## Running Locally

`ash
python -m http.server 8080
`

Then visit http://localhost:8080

---

*Built for Dhanmondi Outlet - Supplier7Star / AkijiBos Group*