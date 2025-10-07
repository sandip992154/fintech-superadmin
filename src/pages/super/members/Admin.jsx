/**
 * Admin Members Management Component
 * Optimized and refactored using BaseMemberComponent
 */
import React from "react";
import BaseMemberComponent from "../../../components/super/members/BaseMemberComponent";
import SchemeManager from "../../../components/super/members/admin/SchemeManager";
import StockTableForm from "../../../components/super/members/admin/StockTableForm";

export const Admin = () => {
  return (
    <BaseMemberComponent
      memberType="admin"
      SchemeManagerComponent={SchemeManager}
      StockManagerComponent={StockTableForm}
    />
  );
};
