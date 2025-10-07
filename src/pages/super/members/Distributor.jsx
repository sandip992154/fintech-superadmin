/**
 * Distributor Members Management Component
 * Optimized and refactored using BaseMemberComponent
 */
import React from "react";
import BaseMemberComponent from "../../../components/super/members/BaseMemberComponent";
import SchemeManager from "../../../components/super/members/ds/SchemeManager";
import StockTableForm from "../../../components/super/members/ds/StockTableForm";

export const Distributor = () => {
  return (
    <BaseMemberComponent
      memberType="distributor"
      SchemeManagerComponent={SchemeManager}
      StockManagerComponent={StockTableForm}
    />
  );
};
