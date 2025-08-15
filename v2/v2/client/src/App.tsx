import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/components/app-layout";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Загружаем лениво
const AuthPage = lazy(() => import("@/pages/auth-page"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Assistants = lazy(() => import("@/pages/assistants"));
const KnowledgeBase = lazy(() => import("@/pages/knowledge-base"));
const Communications = lazy(() => import("@/pages/communications"));
const Channels = lazy(() => import("@/pages/channels"));
const ChannelDetail = lazy(() => import("@/pages/channel-detail"));
const VkDialogs = lazy(() => import("@/pages/vk-dialogs"));
const AvitoDialogs = lazy(() => import("@/pages/avito-dialogs"));
const WebDialogs = lazy(() => import("@/pages/web-dialogs"));
const Telephony = lazy(() => import("@/pages/telephony"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Team = lazy(() => import("@/pages/team"));
const Referrals = lazy(() => import("@/pages/referrals"));
const Billing = lazy(() => import("@/pages/billing"));
const Settings = lazy(() => import("@/pages/settings"));
const Profile = lazy(() => import("@/pages/profile"));
const NotificationChannels = lazy(
  () => import("@/pages/notification-channels")
);
const NotFound = lazy(() => import("@/pages/not-found"));

// Публичные
const HomePage = lazy(() => import("@/pages/public/home"));
const AboutPage = lazy(() => import("@/pages/public/about"));
const FeaturesPage = lazy(() => import("@/pages/public/features"));
const PricingPage = lazy(() => import("@/pages/public/pricing"));
const DocsPage = lazy(() => import("@/pages/public/docs"));
const ReferralPage = lazy(() => import("@/pages/public/referral"));
const ContactPage = lazy(() => import("@/pages/public/contact"));
const TestimonialsPage = lazy(() => import("@/pages/public/testimonials"));
const PrivacyPolicyPage = lazy(() => import("@/pages/public/privacy-policy"));
const TermsPage = lazy(() => import("@/pages/public/terms"));
const RequisitesPage = lazy(() => import("@/pages/public/requisites"));
const UnderConstructionPage = lazy(
  () => import("@/pages/public/under-construction")
);
// Удалено, так как реализация не используется и дублирует основной роутер

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light">
          <ToastProvider>
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
            <Suspense
              fallback={
                <div className="p-4 h-screen flex justify-center items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Загрузка
                  страницы...
                </div>
              }
            >
              <Switch>
                <Route path="/auth">
                  <AuthPage />
                </Route>

                {/* Публичные маршруты */}
                <Route path="/">
                  <HomePage />
                </Route>
                <Route path="/about">
                  <AboutPage />
                </Route>
                <Route path="/features">
                  <FeaturesPage />
                </Route>
                <Route path="/pricing">
                  <PricingPage />
                </Route>
                <Route path="/docs">
                  <DocsPage />
                </Route>
                <Route path="/referral">
                  <ReferralPage />
                </Route>
                <Route path="/contact">
                  <ContactPage />
                </Route>
                <Route path="/testimonials">
                  <TestimonialsPage />
                </Route>
                <Route path="/privacy-policy">
                  <PrivacyPolicyPage />
                </Route>
                <Route path="/terms">
                  <TermsPage />
                </Route>
                <Route path="/requisites">
                  <RequisitesPage />
                </Route>
                <Route path="/under-construction">
                  <UnderConstructionPage />
                </Route>

                {/* Приватные маршруты */}
                <Route>
                  <AppLayout>
                    <Switch>
                      <ProtectedRoute path="/dashboard">
                        <Dashboard />
                      </ProtectedRoute>
                      <ProtectedRoute path="/assistants">
                        <Assistants />
                      </ProtectedRoute>
                      <ProtectedRoute path="/knowledge-base">
                        <KnowledgeBase />
                      </ProtectedRoute>
                      <ProtectedRoute path="/communications">
                        <Communications />
                      </ProtectedRoute>
                      <ProtectedRoute path="/channels">
                        <Channels />
                      </ProtectedRoute>
                      <ProtectedRoute path="/channels/:id">
                        <ChannelDetail />
                      </ProtectedRoute>
                      <ProtectedRoute path="/channels/:id/vk-dialogs">
                        <VkDialogs />
                      </ProtectedRoute>
                      <ProtectedRoute path="/channels/:id/avito-dialogs">
                        <AvitoDialogs />
                      </ProtectedRoute>
                      <ProtectedRoute path="/channels/:id/web-dialogs">
                        <WebDialogs />
                      </ProtectedRoute>
                      <ProtectedRoute path="/telephony">
                        <Telephony />
                      </ProtectedRoute>
                      <ProtectedRoute path="/notifications">
                        <Notifications />
                      </ProtectedRoute>
                      <ProtectedRoute path="/analytics">
                        <Analytics />
                      </ProtectedRoute>
                      <ProtectedRoute path="/team">
                        <Team />
                      </ProtectedRoute>
                      <ProtectedRoute path="/referrals">
                        <Referrals />
                      </ProtectedRoute>
                      <ProtectedRoute path="/billing">
                        <Billing />
                      </ProtectedRoute>
                      <ProtectedRoute path="/settings">
                        <Settings />
                      </ProtectedRoute>
                      <ProtectedRoute path="/profile">
                        <Profile />
                      </ProtectedRoute>
                      <ProtectedRoute path="/notification-channels">
                        <NotificationChannels />
                      </ProtectedRoute>
                      <Route>
                        <NotFound />
                      </Route>
                    </Switch>
                  </AppLayout>
                </Route>
              </Switch>
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
