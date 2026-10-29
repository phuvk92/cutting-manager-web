import React from 'react'
import { Tag } from 'antd'
import { useTranslation } from 'react-i18next'
import { Role } from '@/types/auth'
import { ROLE_COLORS } from '@/constants/auth'

interface RoleTagProps {
  role: Role | string
}

export const RoleTag: React.FC<RoleTagProps> = ({ role }) => {
  const { t } = useTranslation(['common'])
  const color = ROLE_COLORS[role] || 'default'
  const label = t(`roles.${role}`, { defaultValue: role })

  return <Tag color={color}>{label}</Tag>
}
