import { PortalSettingsCardForm } from "../../../components/super/setup_tools/PortalSettingsCardForm";

export const PortalSetting = () => {
  const cardData = [
    {
      title: "Wallet Settlement Type",
      label: "Settlement Type",
      name: "walletSettlement",
      placeholder: "Auto",
      options: ["Auto", "Manual"],
    },
    {
      title: "Bank Settlement Type",
      label: "Settlement Type",
      name: "bankSettlement",
      placeholder: "Auto",
      options: ["Auto", "Manual", "Down"],
    },
    {
      title: "Bank Settlement Charge",
      label: "Charge",
      name: "bankCharge",
      placeholder: "5",
    },
    {
      title: "Bank Settlement Charge Upto 25000",
      label: "Charge",
      name: "bankChargeUpto25000",
      placeholder: "5",
    },
    {
      title: "Login with OTP",
      label: "Login Type",
      name: "loginType",
      placeholder: "Without Otp",
      options: ["With OTP", "Without OTP"],
    },
    {
      title: "Sending mail id for OTP",
      label: "Mail Id",
      name: "otpMailId",
      placeholder: "support@phonepays.in",
    },
    {
      title: "Sending mailer name id for otp",
      label: "Mailer Name",
      name: "otpMailerName",
      placeholder: "NK Tax Consultancy-Phone",
    },
    {
      title: "Transaction Id Code",
      label: "Code",
      name: "txnIdCode",
      placeholder: "PSP",
    },
    {
      title: "Main Wallet Locked Amount",
      label: "Amount",
      name: "mainWalletAmount",
      placeholder: "0",
    },
    {
      title: "Aeps Bank Settlement Locked Amount",
      label: "Amount",
      name: "aepsLockedAmount",
      placeholder: "0",
    },
    {
      title: "Wallet Access for Parent User",
      label: "Enable Access",
      name: "walletAccess",
      placeholder: "Select Access",
      options: ["Enable", "Disable"],
    },
  ];

  return (
    <div className="h-[90vh] 2xl:max-w-[80%] p-4 mx-8 bg-secondaryOne dark:bg-darkBlue/70 rounded-2xl 2xl:mx-auto text-gray-800 overflow-hidden overflow-y-auto px-4 pb-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cardData.map((card, index) => (
          <PortalSettingsCardForm key={index} {...card} />
        ))}
      </div>
    </div>
  );
};
