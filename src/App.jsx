import "./App.css";
import { Route, Routes } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import Landing from "./components/landingSection/Landing.jsx";
import CreateStore from "./components/createStore/CreateStore.jsx";
import ManageCategories from "./components/manageCategory/ManageCategories.jsx";
import ManageItems from "./components/manageItems/ManageItems.jsx";
import PublicStore from "./components/publicStore/PublicStore.jsx";
import { getStoreSlug } from "./utils/getStoreSlug.js";
import Account from "./components/manageAccount/Account.jsx";
import Upgrade from "./components/upgrade/Upgrade.jsx";
import OrdersPage from "./components/order/OrdersPage.jsx";
import OrderDetails from "./components/order/OrderDetails.jsx";
import Analytics from "./components/analytics/Analytics.jsx";

function App() {
  const slug = getStoreSlug();

  return (
    <Routes>
      {/* ROOT */}
      <Route
        path="/"
        element={slug ? <PublicStore slug={slug} /> : <Landing />}
      />

      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/account" element={<Account />} />
      <Route path="/upgrade" element={<Upgrade />} />

      {/* OWNER */}
      <Route path="/create/store" element={<CreateStore />} />
      <Route path="/manage/categories" element={<ManageCategories />} />
      <Route path="/manage/items" element={<ManageItems />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:id" element={<OrderDetails />} />
      <Route path="/analytics" element={<Analytics />} />

      {/* FALLBACK — IMPORTANT */}
      <Route
        path="*"
        element={slug ? <PublicStore slug={slug} /> : <Landing />}
      />
    </Routes>
  );
}

export default App;
