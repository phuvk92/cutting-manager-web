import React from 'react'
import { Tag } from 'antd'
import { Role } from '@/types/auth'
import { ROLE_COLORS, ROLE_LABELS } from '@/constants/auth'

interface RoleTagProps {
  role: Role | string
}

export const RoleTag: React.FC<RoleTagProps> = ({ role }) => {
  const color = ROLE_COLORS[role] || 'default'
  const label = ROLE_LABELS[role] || role

  return <Tag color={color}>{label}</Tag>
}
