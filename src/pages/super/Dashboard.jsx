import { BsBank, BsShieldPlus, BsPersonBadge } from "react-icons/bs";
import { HiOutlineClipboardList, HiShieldCheck } from "react-icons/hi";
import { RiAdminFill } from "react-icons/ri";
import WalletBalanceCard from "../../components/super/WalletBancedCard";
import { CustomDatePicker } from "../../components/utility/CustomDatePicker";
import { FaMoneyCheck, FaPlaneDeparture, FaUser } from "react-icons/fa";
import { Link } from "react-router";
import { SuperModal } from "../../components/utility/SuperModel";
import { useState } from "react";

import { BiSolidUserRectangle } from "react-icons/bi";
import { PiPottedPlantFill } from "react-icons/pi";
import RechargeBillPaymentCard from "../../components/super/dashboard/cards/RechargeBillPaymentCard";
import BankingServicesCard from "../../components/super/dashboard/cards/BankingServicesCard";
import InsuranceLoanCard from "../../components/super/dashboard/cards/InsuranceLoanCard";
import { ServiceCard } from "../../components/super/dashboard/ServiceCard";
import TravelServicesCard from "../../components/super/dashboard/cards/TravelServicesCard";

const serviceCards = [
  {
    icon: <BiSolidUserRectangle size={24} />,
    bgIcon: "bg-[#7fd3ec]",
    label: "Recharge & Bill Payment",
    name: "recharge",
  },
  {
    icon: <HiShieldCheck size={24} />,
    bgIcon: "bg-[#978ee1]",
    label: "Banking Services",
    bgColor: "bg-[#00B89438]",
    name: "banking",
  },
  {
    icon: <PiPottedPlantFill size={24} />,
    bgIcon: "bg-[#f4bdcf]",
    label: "Insurance",
    bgColor: "bg-[#FDE7EF]",
    name: "insurance",
  },
  {
    icon: <FaMoneyCheck size={24} />,
    bgIcon: "bg-[#978ee1]",
    label: "Loan Services",
    bgColor: "bg-[#6C5CE738]",
    name: "loan",
  },
  {
    icon: <FaPlaneDeparture size={24} />,
    bgIcon: "bg-[#4db6ac]",
    label: "Travel Services",
    bgColor: "bg-[#e0f2f1]",
    name: "travel",
  },
];

const Dashboard = () => {
  const [isCardsVisible, setIsCardsVisible] = useState({
    recharge: false,
    banking: false,
    insurance: false,
    loan: false,
    travel: false,
  });

  const toggleCardVisibility = (card) => {
    setIsCardsVisible((prev) => ({ ...prev, [card]: !prev[card] }));
  };
  return (
    <div className="h-[90vh] 2xl:max-w-[80%] p-4 mx-8  bg-secondaryOne dark:bg-darkBlue/70  rounded-2xl  2xl:mx-auto text-gray-800 overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-secondaryOne dark:bg-darkBlue/70 dark:text-adminOffWhite py-4">
        <div className="flex justify-between items-center px-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <HiOutlineClipboardList className="text-xl" />
            Dashboard
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <CustomDatePicker />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto max-h-[calc(100vh-120px)] px-4 pb-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        {/* Services */}
        <div className="">
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-3">
              <WalletBalanceCard />
            </div>
            <div className="col-span-1">
              <ServiceCard
                {...serviceCards[0]}
                onClick={() => toggleCardVisibility("recharge")}
              />
            </div>
          </div>
          <div className="py-4">
            <div className="grid grid-cols-4 gap-2 ">
              <ServiceCard
                {...serviceCards[1]}
                onClick={() => toggleCardVisibility("banking")}
              />
              <ServiceCard
                {...serviceCards[2]}
                onClick={() => toggleCardVisibility("insurance")}
              />
              <ServiceCard
                {...serviceCards[3]}
                onClick={() => toggleCardVisibility("loan")}
              />
              <ServiceCard
                {...serviceCards[4]}
                onClick={() => toggleCardVisibility("travel")}
              />
            </div>
          </div>
        </div>

        {/* User Counts & Support Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* User Counts */}
          <div className="bg-white dark:bg-cardOffWhite dark:text-adminOffWhite rounded-md shadow p-4 space-y-2 text-sm">
            <p className="font-semibold">User Counts</p>
            <Link to="members/admin">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiAdminFill className="text-blue-500" /> Admin
                </div>
                <span>1</span>
              </div>
            </Link>
            <Link to="members/whitelabel">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BsBank className="text-purple-500" /> White Label
                </div>
                <span>2</span>
              </div>
            </Link>
            <Link to="members/mds">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BsShieldPlus className="text-pink-500" /> Master Distributer
                </div>
                <span>1</span>
              </div>
            </Link>
            <Link to="members/ds">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BsPersonBadge className="text-cyan-500" /> Distributer
                </div>
                <span>1</span>
              </div>
            </Link>
            <Link to="members/retail">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaUser className="text-amber-500" /> Retailer
                </div>
                <span>1</span>
              </div>
            </Link>
            <Link to="members/customer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaUser className="text-cyan-500" /> Customer
                </div>
                <span>1</span>
              </div>
            </Link>
          </div>

          {/* Support Box */}
          <div className="bg-white dark:bg-cardOffWhite dark:text-adminOffWhite rounded-md shadow p-4 text-center text-sm">
            <div className="flex justify-center mb-2">
              <img
                src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
                alt="support"
                className="w-12 h-12 rounded-full"
              />
            </div>
            <p className="mb-1">Timing: 10am to 7pm</p>
            <p>9059207545</p>
            <p className="font-semibold">support@phonesepay.in</p>
          </div>
        </div>
      </div>

      {isCardsVisible.recharge && (
        <SuperModal
          onClose={() =>
            setIsCardsVisible((prev) => ({ ...prev, recharge: false }))
          }
        >
          <RechargeBillPaymentCard />
        </SuperModal>
      )}
      {isCardsVisible.banking && (
        <SuperModal
          onClose={() =>
            setIsCardsVisible((prev) => ({ ...prev, banking: false }))
          }
        >
          <BankingServicesCard />
        </SuperModal>
      )}
      {isCardsVisible.insurance && (
        <SuperModal
          onClose={() =>
            setIsCardsVisible((prev) => ({ ...prev, insurance: false }))
          }
        >
          <InsuranceLoanCard />
        </SuperModal>
      )}
      {isCardsVisible.travel && (
        <SuperModal
          onClose={() =>
            setIsCardsVisible((prev) => ({ ...prev, travel: false }))
          }
        >
          <TravelServicesCard />
        </SuperModal>
      )}
    </div>
  );
};

export default Dashboard;
