import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    const titles = {
      "/login": "RestoMaster | Login",
      "/": "RestoMaster | Dashboard",
      "/menu": "RestoMaster | Menu",
      "/orders": "RestoMaster | Orders",
      "/checkout": "RestoMaster | Checkout",
      "/list-orders": "RestoMaster | List Orders",
      "/history-orders": "RestoMaster | History",
      "/tables": "RestoMaster | Tables",
      "/settings": "RestoMaster | Settings",
    };

    document.title = titles[path] || "RestoMaster";
  }, [location]);

  return null;
}
