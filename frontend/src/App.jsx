import Admin from "./Admin";
import AdminCourseReviews from "./AdminCourseReviews";
import AdminSuggestions from "./AdminSuggestions";
import Feedback from "./Feedback";
import SubmitTransfer from "./SubmitTransfer";

// 查询页抽出来，避免 Admin 引入后影响首屏逻辑
import Query from "./Query";

function App() {
  const path = window.location.pathname || "/";
  const p = path.toLowerCase();
  const isSubmitTransfer = p.startsWith("/submit-transfer");
  const isAdminReviews = p.startsWith("/admin/reviews");
  const isAdminSuggestions = p.startsWith("/admin/suggestions");
  const isAdmin = p.startsWith("/admin");
  const isFeedback = p.startsWith("/feedback");

  return isSubmitTransfer ? (
    <SubmitTransfer />
  ) : isAdminReviews ? (
    <AdminCourseReviews />
  ) : isAdminSuggestions ? (
    <AdminSuggestions />
  ) : isAdmin ? (
    <Admin />
  ) : isFeedback ? (
    <Feedback />
  ) : (
    <Query />
  );
}

export default App;
