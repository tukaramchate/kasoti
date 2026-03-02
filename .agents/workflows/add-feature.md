---
description: Add a new page, component, or API endpoint to Kasoti following the established patterns
---

# Add New Feature to Kasoti

## Adding a New Frontend Page

### 1. Create the page file
```
c:\Users\sif-\Desktop\kasoti\frontend\src\pages\<PageName>\<PageName>.js
```

### 2. Register the route in App.js
Open `src/App.js` and add:
```js
// At top — lazy import
const MyPage = lazy(() => import("./pages/MyPage/MyPage"));

// Inside <Routes>
<Route path="/my-page" element={
  <ProtectedRoute><AppLayout><MyPage /></AppLayout></ProtectedRoute>
} />
```
Use `RoleGuard roles={["TEACHER", "ADMIN"]}` for restricted pages.

### 3. Follow the page template (modern style)
```jsx
import React from "react";
import { motion } from "framer-motion";
import PageHeader from "../../components/PageHeader";
import { inputStyles, primaryButtonStyles } from "../../utils/styles";

const MyPage = () => {
  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] p-4 sm:p-6 max-w-[860px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title="My Page" />
        {/* content */}
      </motion.div>
    </div>
  );
};

export default MyPage;
```

---

## Adding a New API Call

Open `src/api/index.js` and add to the relevant API group:
```js
export const myAPI = {
  getSomething: (id) => api.get(`/api/something/${id}`),
  createSomething: (data) => api.post("/api/something", data),
};
```

---

## Adding a Reusable Component

Create the file:
```
src/components/MyComponent.js
```

Follow the glassmorphism pattern:
```jsx
const MyComponent = ({ title, children }) => (
  <div className="bg-[color:var(--bg-card)]/80 backdrop-blur-lg border border-[color:var(--border)] rounded-2xl p-5 shadow-soft hover:shadow-glow transition-all duration-300">
    <h3 className="text-base font-bold text-[color:var(--text-primary)] mb-4">{title}</h3>
    {children}
  </div>
);
```

---

## Shared Utilities
Use `src/utils/styles.js` for:
- `inputStyles` — all text inputs
- `primaryButtonStyles` — accent gradient buttons
- `ghostButtonStyles` — link-style buttons
- `formatTime(seconds)` — "Xm Ys" formatter
- `getScoreClass(score)` — score badge classes
