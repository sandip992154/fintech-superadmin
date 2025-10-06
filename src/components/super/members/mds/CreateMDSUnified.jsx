/**
 * Unified Create MDS Component
 * Uses the UnifiedMemberForm with mds configuration
 */
import React from "react";
import UnifiedMemberForm from "../UnifiedMemberForm";

const CreateMDSUnified = ({ onSubmit }) => {
  return <UnifiedMemberForm memberType="mds" onSubmit={onSubmit} />;
};

export default CreateMDSUnified;
