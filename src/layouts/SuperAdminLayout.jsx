import { Outlet } from "react-router";
import Sidebar from "../components/super/SideBar";
import Header from "../components/super/Header";
import { ToastContainer } from "react-toastify";

export const SuperAdminLayout = () => {
  return (
    <>
      <section className=" max-h-[100vh] overflow-hidden flex w-full bg-secondaryOne dark:bg-darkBlue/95">
        <Sidebar />
        <div className="w-full">
          <Header />
          <main className="overflow-hidden max-w-[calc(100vw-14rem)]">
            <Outlet />
          </main>
        </div>
        <ToastContainer />
      </section>
    </>
  );
};
