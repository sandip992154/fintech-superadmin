import React from "react";
import BaseMemberComponent from "../../../components/super/members/BaseMemberComponent";
import SchemeManager from "../../../components/super/members/customer/SchemeManager";

export const Customer = () => {
  return (
    <BaseMemberComponent
      memberType="customer"
      SchemeManagerComponent={SchemeManager}
    />
  );
};
