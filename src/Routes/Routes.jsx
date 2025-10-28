import { SuperAdminLayout } from "../layouts/SuperAdminLayout";
import Dashboard from "../pages/super/Dashboard";
import { SchemeManager } from "../pages/super/resources_tab/SchemeManger";
import { CompanyProfile } from "../pages/super/resources_tab/CompanyProfile";
import { CompanyManger } from "../pages/super/resources_tab/CompanyManger";
import SuperAEPS from "../pages/super/agent_list/SuperAEPS";
import SuperUTI from "../pages/super/agent_list/SuperUTI";
import { TransferReturn } from "../pages/super/fund/TransferReturn";
import { Request } from "../pages/super/fund/Request";
import { RequestReport } from "../pages/super/fund/RequestReport";
import { AllAEPSTransaction } from "../pages/super/transaction_report/AllAEPSTransaction";
import { CommissionStatement } from "../pages/super/transaction_report/CommissionStatement";
import { BillPayStatement } from "../pages/super/transaction_report/BillPayStatement";
import { VerificationStatement } from "../pages/super/transaction_report/VerificationStatement";
import { AffiliateStatement } from "../pages/super/transaction_report/AffiliateStatement";
import { MicroATMStatement } from "../pages/super/transaction_report/MicroATMStatement";
import { RechargeStatement } from "../pages/super/transaction_report/RechargeStatement";
import { UTIPancardStatement } from "../pages/super/transaction_report/UTIPancardStatement";
import { CreditCardPayment } from "../pages/super/transaction_report/CreditCardPayment";
import { MainWallet } from "../pages/super/wallet_history/MainWallet";
import { MatchingPercentage } from "../pages/super/matching_percentage/MatchingPercentage";
import { MobileUserLogout } from "../pages/super/setup_tools/MobileUserLogout";
import { APIManager } from "../pages/super/setup_tools/APIManager";
import { BankAccount } from "../pages/super/setup_tools/BankAccount";
import { OperatorManager } from "../pages/super/setup_tools/OperatorManager";
import { PortalSetting } from "../pages/super/setup_tools/PortalSetting";
import { QuickLinks } from "../pages/super/setup_tools/QuickLinks";
import { Roles } from "../pages/super/roles_permissions/Roles";
import { Permissions } from "../pages/super/roles_permissions/Permissions";
import AccountPortalSettings from "../pages/super/account_settings/AccountPortalSettings";
import KYCManagement from "../pages/KYCManagement";
import { Admin } from "../pages/super/members/Admin";
import { WhiteLabel } from "../pages/super/members/WhiteLabel";
import { MasterDistributor } from "../pages/super/members/MasterDistributor";
import { Distributor } from "../pages/super/members/Distributor";
import { Retail } from "../pages/super/members/Retail";
import { Customer } from "../pages/super/members/Customer";
import WhitelabelLayout from "../layouts/members/WhitelabelLayout";
import CreateWhitelabelUnified from "../components/super/members/whitelabel/CreateWhiteLabelUnified";
import MDLayout from "../layouts/members/MDLayout";
import DSLayout from "../layouts/members/DSLayout";
import CustomerLayout from "../layouts/members/CustomerLayout";
import RetailerLayout from "../layouts/members/RetailerLayout";
import CreateMDSUnified from "../components/super/members/mds/CreateMDSUnified";
import CreateDistributorUnified from "../components/super/members/ds/CreateRetailerUnified";
import TransactionHistory from "../pages/super/transaction_report/TransactionHistory";
import CreateAdminUnified from "../components/super/members/admin/CreateAdminUnified";
import MemberAdminLayout from "../layouts/members/MemberAdminLayout";
import CreateRetailerUnified from "../components/super/members/retailer/CreateRetailerUnified";
import CreateCustomerUnified from "../components/super/members/customer/CreateCustomerUnified";
import { SignIn } from "../pages/SignIn";
import ServiceOperatorManager from "../components/super/resource_tab/ServiceOperatorManager";

import { ForgotPassword } from "../pages/ForgotPassword";
import { ResetPassword } from "../pages/ResetPassword";
import { ProtectedRoute } from "./ProtectedRoute";

import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  // super admin
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <SuperAdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
      // resources
      {
        path: "/resources/scheme-manager",
        element: <SchemeManager />,
      },
      {
        path: "/resources/service-manager",
        element: <ServiceOperatorManager />,
      },
      {
        path: "/resources/company",
        element: <CompanyManger />,
      },
      {
        path: "/resources/company-profile",
        element: <CompanyProfile />,
      },
      // Agent List

      {
        path: "/statement/aeps",
        element: <SuperAEPS />,
      },
      {
        path: "/statement/uti",
        element: <SuperUTI />,
      },

      // Fund

      {
        path: "fund/tr",
        element: <TransferReturn />,
      },
      {
        path: "fund/requestview",
        element: <Request />,
      },
      {
        path: "fund/requestviewall",
        element: <RequestReport />,
      },

      // transaction report

      {
        path: "statement/transaction-history",
        element: <TransactionHistory />, //transaction history
      },
      {
        path: "statement/aeps-txn",
        element: <AllAEPSTransaction />,
      },
      {
        path: "statement/commision",
        element: <CommissionStatement />,
      },
      {
        path: "statement/bill-pay",
        element: <BillPayStatement />,
      },
      {
        path: "statement/verification",
        element: <VerificationStatement />,
      },
      {
        path: "statement/affiliate",
        element: <AffiliateStatement />,
      },
      {
        path: "statement/micro-atm",
        element: <MicroATMStatement />,
      },
      {
        path: "statement/recharge",
        element: <RechargeStatement />,
      },
      {
        path: "statement/uti-pancard",
        element: <UTIPancardStatement />,
      },
      {
        path: "statement/credit",
        element: <CreditCardPayment />,
      },

      // Wallet History
      {
        path: "statement/account",
        element: <MainWallet />,
      },
      // Matching Percentage
      {
        path: "matchingpercent",
        element: <MatchingPercentage />,
      },
      // Setup tools
      {
        path: "setup/token",
        element: <MobileUserLogout />,
      },
      {
        path: "setup/api",
        element: <APIManager />,
      },
      {
        path: "setup/bank",
        element: <BankAccount />,
      },
      {
        path: "setup/operator",
        element: <OperatorManager />,
      },
      {
        path: "setup/portalsettings",
        element: <PortalSetting />,
      },
      {
        path: "setup/links",
        element: <QuickLinks />,
      },

      // Roles and Permission
      {
        path: "tools/roles",
        element: <Roles />,
      },
      {
        path: "tools/permissions",
        element: <Permissions />,
      },

      // account settings
      {
        path: "profile/view",
        element: <AccountPortalSettings />,
      },

      // KYC Management
      {
        path: "kyc/management",
        element: <KYCManagement />,
      },

      // members
      {
        path: "members/admin",
        element: <MemberAdminLayout />,
        children: [
          {
            index: true,
            element: <Admin />,
          },
          {
            path: "create",
            element: <CreateAdminUnified />,
          },
        ],
      },
      {
        path: "members/whitelabel",
        element: <WhitelabelLayout />,
        children: [
          {
            index: true,
            element: <WhiteLabel />,
          },
          {
            path: "create",
            element: <CreateWhitelabelUnified />,
          },
        ],
      },
      {
        path: "members/mds",
        element: <MDLayout />,
        children: [
          {
            index: true,
            element: <MasterDistributor />,
          },
          {
            path: "create",
            element: <CreateMDSUnified />,
          },
        ],
      },
      {
        path: "members/ds",
        element: <DSLayout />,
        children: [
          {
            index: true,
            element: <Distributor />,
          },
          {
            path: "create",
            element: <CreateDistributorUnified />,
          },
        ],
      },
      {
        path: "members/retail",
        element: <RetailerLayout />,
        children: [
          {
            index: true,
            element: <Retail />,
          },
          {
            path: "create",
            element: <CreateRetailerUnified />,
          },
        ],
      },
      {
        path: "members/customer",
        element: <CustomerLayout />,
        children: [
          {
            index: true,
            element: <Customer />,
          },
          {
            path: "create",
            element: <CreateCustomerUnified />,
          },
        ],
      },
    ],
  },
]);
