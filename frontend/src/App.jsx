import Admin from "./Admin";
import AdminSuggestions from "./AdminSuggestions";
import Feedback from "./Feedback";

// 查询页抽出来，避免 Admin 引入后影响首屏逻辑
import Query from "./Query";

function App() {
  const path = window.location.pathname || "/";
  const isAdminSuggestions = path.toLowerCase().startsWith("/admin/suggestions");
  const isAdmin = path.toLowerCase().startsWith("/admin");
  const isFeedback = path.toLowerCase().startsWith("/feedback");

  return (
    isAdminSuggestions ? <AdminSuggestions /> : isAdmin ? <Admin /> : isFeedback ? <Feedback /> : <Query />
  );
}

export default App;
