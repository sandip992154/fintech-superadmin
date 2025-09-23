import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/utility/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { logEnvironment } from "./config/environment";
import "./App.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-toastify/dist/ReactToastify.css";

// Log environment configuration on app start
logEnvironment();

// Super admin
import { SuperAdminLayout } from "./layouts/SuperAdminLayout";
import Dashboard from "./pages/super/Dashboard";
import { SchemeManager } from "./pages/super/resources_tab/SchemeManger";
import { CompanyProfile } from "./pages/super/resources_tab/CompanyProfile";
import { CompanyManger } from "./pages/super/resources_tab/CompanyManger";
import SuperAEPS from "./pages/super/agent_list/SuperAEPS";
import SuperUTI from "./pages/super/agent_list/SuperUTI";
import { TransferReturn } from "./pages/super/fund/TransferReturn";
import { Request } from "./pages/super/fund/Request";
import { RequestReport } from "./pages/super/fund/RequestReport";
import { AllAEPSTransaction } from "./pages/super/transaction_report/AllAEPSTransaction";
import { CommissionStatement } from "./pages/super/transaction_report/CommissionStatement";
import { BillPayStatement } from "./pages/super/transaction_report/BillPayStatement";
import { VerificationStatement } from "./pages/super/transaction_report/VerificationStatement";
import { AffiliateStatement } from "./pages/super/transaction_report/AffiliateStatement";
import { MicroATMStatement } from "./pages/super/transaction_report/MicroATMStatement";
import { RechargeStatement } from "./pages/super/transaction_report/RechargeStatement";
import { UTIPancardStatement } from "./pages/super/transaction_report/UTIPancardStatement";
import { CreditCardPayment } from "./pages/super/transaction_report/CreditCardPayment";
import { MainWallet } from "./pages/super/wallet_history/MainWallet";
import { MatchingPercentage } from "./pages/super/matching_percentage/MatchingPercentage";
import { MobileUserLogout } from "./pages/super/setup_tools/MobileUserLogout";
import { APIManager } from "./pages/super/setup_tools/APIManager";
import { BankAccount } from "./pages/super/setup_tools/BankAccount";
import { OperatorManager } from "./pages/super/setup_tools/OperatorManager";
import { PortalSetting } from "./pages/super/setup_tools/PortalSetting";
import { QuickLinks } from "./pages/super/setup_tools/QuickLinks";
import { Roles } from "./pages/super/roles_permissions/Roles";
import { Permissions } from "./pages/super/roles_permissions/Permissions";
import AccountPortalSettings from "./pages/super/account_settings/AccountPortalSettings";
import KYCManagement from "./pages/KYCManagement";
import { Admin } from "./pages/super/members/Admin";
import { WhiteLabel } from "./pages/super/members/WhiteLabel";
import { MasterDistributor } from "./pages/super/members/MasterDistributor";
import { Distributor } from "./pages/super/members/Distributor";
import { Retail } from "./pages/super/members/Retail";
import { Customer } from "./pages/super/members/Customer";
import WhitelabelLayout from "./layouts/members/WhitelabelLayout";
import CreateWhitelabel from "./components/super/members/whitelabel/CreateWhiteLabel";
import MDLayout from "./layouts/members/MDLayout";
import DSLayout from "./layouts/members/DSLayout";
import CustomerLayout from "./layouts/members/CustomerLayout";
import RetailerLayout from "./layouts/members/RetailerLayout";
import CreateMDS from "./components/super/members/mds/CreateMDS";
import CreateRetailerBYDs from "./components/super/members/ds/CreateRetailerBYDs";
import TransactionHistory from "./pages/super/transaction_report/TransactionHistory";
import CreateAdmin from "./components/super/members/admin/CreateAdmin";
import MemberAdminLayout from "./layouts/members/MemberAdminLayout";
import CreateCutsomerBYRetailer from "./components/super/members/retailer/CreateCustomerBYRetailer";
import { SignIn } from "./pages/SignIn";

// admin

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/signin",
      element: (
        <AuthProvider>
          <SignIn />
        </AuthProvider>
      ),
    },
    {
      path: "/forgot-password",
      element: (
        <AuthProvider>
          <ForgotPassword />
        </AuthProvider>
      ),
    },
    {
      path: "/reset-password",
      element: (
        <AuthProvider>
          <ResetPassword />
        </AuthProvider>
      ),
    },
    // super admin
    {
      path: "/",
      element: (
        <AuthProvider>
          <ProtectedRoute>
            <SuperAdminLayout />
          </ProtectedRoute>
        </AuthProvider>
      ),
      children: [
        {
          path: "/",
          Component: Dashboard,
        },
        // resources
        {
          path: "/resources/scheme-manager",
          Component: SchemeManager,
        },
        {
          path: "/resources/company",
          Component: CompanyManger,
        },
        {
          path: "/resources/company-profile",
          Component: CompanyProfile,
        },
        // Agent List

        {
          path: "/statement/aeps",
          Component: SuperAEPS,
        },
        {
          path: "/statement/uti",
          Component: SuperUTI,
        },

        // Fund

        {
          path: "fund/tr",
          Component: TransferReturn,
        },
        {
          path: "fund/requestview",
          Component: Request,
        },
        {
          path: "fund/requestviewall",
          Component: RequestReport,
        },

        // transaction report

        {
          path: "statement/transaction-history",
          Component: TransactionHistory, //transaction history
        },
        {
          path: "statement/aeps-txn",
          Component: AllAEPSTransaction,
        },
        {
          path: "statement/commision",
          Component: CommissionStatement,
        },
        {
          path: "statement/bill-pay",
          Component: BillPayStatement,
        },
        {
          path: "statement/verification",
          Component: VerificationStatement,
        },
        {
          path: "statement/affiliate",
          Component: AffiliateStatement,
        },
        {
          path: "statement/micro-atm",
          Component: MicroATMStatement,
        },
        {
          path: "statement/recharge",
          Component: RechargeStatement,
        },
        {
          path: "statement/uti-pancard",
          Component: UTIPancardStatement,
        },
        {
          path: "statement/credit",
          Component: CreditCardPayment,
        },

        // Wallet History
        {
          path: "statement/account",
          Component: MainWallet,
        },
        // Matching Percentage
        {
          path: "matchingpercent",
          Component: MatchingPercentage,
        },
        // Setup tools
        {
          path: "setup/token",
          Component: MobileUserLogout,
        },
        {
          path: "setup/api",
          Component: APIManager,
        },
        {
          path: "setup/bank",
          Component: BankAccount,
        },
        {
          path: "setup/operator",
          Component: OperatorManager,
        },
        {
          path: "setup/portalsettings",
          Component: PortalSetting,
        },
        {
          path: "setup/links",
          Component: QuickLinks,
        },

        // Roles and Permission
        {
          path: "tools/roles",
          Component: Roles,
        },
        {
          path: "tools/permissions",
          Component: Permissions,
        },

        // account settings
        {
          path: "profile/view",
          Component: AccountPortalSettings,
        },

        // KYC Management
        {
          path: "kyc/management",
          Component: KYCManagement,
        },

        // members
        {
          path: "members/admin",
          Component: MemberAdminLayout,
          children: [
            {
              index: true,
              Component: Admin,
            },
            {
              path: "create",
              Component: CreateAdmin,
            },
          ],
        },
        {
          path: "members/whitelabel",
          Component: WhitelabelLayout,
          children: [
            {
              index: true,
              Component: WhiteLabel,
            },
            {
              path: "create",
              Component: CreateWhitelabel,
            },
          ],
        },
        {
          path: "members/mds",
          Component: MDLayout,
          children: [
            {
              index: true,
              Component: MasterDistributor,
            },
            {
              path: "create",
              Component: CreateMDS,
            },
          ],
        },
        {
          path: "members/ds",
          Component: DSLayout,
          children: [
            {
              index: true,
              Component: Distributor,
            },
            {
              path: "create",
              Component: CreateRetailerBYDs,
            },
          ],
        },
        {
          path: "members/retail",
          Component: RetailerLayout,
          children: [
            {
              index: true,
              Component: Retail,
            },
            {
              path: "create",
              Component: CreateCutsomerBYRetailer,
            },
          ],
        },
        {
          path: "members/customer",
          Component: CustomerLayout,
          children: [
            {
              index: true,
              Component: Customer,
            },
            // {
            //   path: "create",
            //   Component: CreateWhitelabel,
            // },
          ],
        },
      ],
    },

    // Removed duplicate sign in route
  ]);
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="modern-toast-container"
      />
    </>
  );
};

export default App;
