/**
 * Unified Create Admin Component
 * Uses the UnifiedMemberForm with admin configuration
 */
import React from "react";
import UnifiedMemberForm from "../UnifiedMemberForm";

const CreateAdminUnified = ({ onSubmit }) => {
  return <UnifiedMemberForm memberType="admin" onSubmit={onSubmit} />;
};

export default CreateAdminUnified;
