import { useState, useEffect } from "react";
import LeaderboardPage from "./pages/LeaderboardPage";
import AchievementsPage from "./pages/AchievementsPage";
import Onboarding from "./pages/OnboardingPage";

export default function App() {
  // Function to get current page from hash
  const getPageFromHash = () => {
    const hash = window.location.hash.replace('#', '');
    if (hash === "achievements") return "achievements";
    if (hash === "onboarding") return "onboarding";
    return "leaderboard";
  };

  const [page, setPage] = useState(getPageFromHash);

  // Sync state if the user types in the URL bar or hits Back/Forward
  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPageFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Global navigation helper
  window.__navigate = (p) => {
    window.location.hash = p; // Changing hash will trigger the listener above
  };

  // Conditional Rendering
  if (page === "onboarding") return <Onboarding />;
  if (page === "achievements") return <AchievementsPage />;
  
  return <LeaderboardPage />;
}