import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";

// Existing pages
import ScanPrescription from "@/pages/scan-prescription";
import PrescriptionDetail from "@/pages/prescription-detail";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/header";
import MobileNavigation from "@/components/layout/mobile-navigation";
import StorePage from "@/pages/StorePage";
import MedicineDetailPage from "@/pages/MedicineDetailPage";

// Auth pages
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignUpPage";
import ProfilePage from "@/pages/ProfilePage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import PaymentPage from "@/pages/PaymentPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import { CartProvider } from "./context/CartContext";
import MyMedicinesPage from "@/pages/MyMedicinesPage";
import NotificationsPage from "@/pages/NotificationsPage";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">
        <Switch>
          {/* Public routes - No authentication required */}
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/reset/:token" component={ResetPasswordPage} />

          {/* Protected routes - Authentication required */}
          {/* <Route 
            path="/" 
            component={() => (
             
                <Dashboard />
             
            )} 
          /> */}

          <Route path="/profile" component={() => <ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route path="/scan" component={() => <ScanPrescription />} />

          <Route
            path="/scan-prescription"
            component={() => <ScanPrescription />}
          />

          <Route
            path="/prescriptions/:id"
            component={() => <PrescriptionDetail />}
          />

          <Route path="/" component={() => <StorePage />} />

          <Route
            path="/medicine/:id"
            component={() => <MedicineDetailPage />}
          />

          <Route
            path="/cart"
            component={() => (
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/checkout"
            component={() => (
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/payment/:orderId"
            component={() => (
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/my-orders"
            component={() => (
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/notifications"
            component={() => (
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/admin/dashboard"
            component={() => (
    <AdminRoute>
      <AdminDashboardPage />
    </AdminRoute>
            )}
          />

          <Route
            path="/my-medicines"
            component={() => (
              <ProtectedRoute>
                <MyMedicinesPage />
              </ProtectedRoute>
            )}
          />

          {/* 404 fallback */}
          <Route component={NotFound} />
        </Switch>
      </div>
      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
