import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Modal,
  Button,
  Input,
  Typography,
  Descriptions,
  List,
  Tag,
  Popconfirm,
  Spin,
  Empty,
  message,
} from "antd"
import {
  ShareAltOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons"
import { UserSavedFile, UserSvgFileShareItem } from "@/types/userSavedFile"
import { User } from "@/types/user"
import { userSavedFileService } from "@/services/userSavedFile/userSavedFileService"
import { userService } from "@/services/users/userService"
import { extractErrorMessage } from "@/utils/error"

const { Text } = Typography

const FONT = "'IBM Plex Sans', sans-serif"
const MONO = "'IBM Plex Mono', monospace"

export interface UserSavedFileShareModalProps {
  open: boolean
  file: UserSavedFile | null
  onClose: () => void
}

export const UserSavedFileShareModal: React.FC<UserSavedFileShareModalProps> = ({
  open,
  file,
  onClose,
}) => {
  const [shares, setShares] = useState<UserSvgFileShareItem[]>([])
  const [loadingShares, setLoadingShares] = useState(false)

  // User search state for sharing
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [sharingUserId, setSharingUserId] = useState<number | null>(null)
  const [revokingUserId, setRevokingUserId] = useState<number | null>(null)

  const fetchShares = useCallback(async () => {
    if (!file) return
    setLoadingShares(true)
    try {
      const data = await userSavedFileService.getShares(file.id)
      setShares(data?.shares || [])
    } catch (err) {
      message.error(extractErrorMessage(err, "Không thể tải danh sách chia sẻ"))
      setShares([])
    } finally {
      setLoadingShares(false)
    }
  }, [file])

  useEffect(() => {
    if (open && file) {
      fetchShares()
      setSearchQuery("")
      setSearchResults([])
    } else {
      setShares([])
    }
  }, [open, file, fetchShares])

  // Search users debounce
  useEffect(() => {
    if (!searchQuery.trim() || !open || !file) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await userService.getUsers({
          username: searchQuery.trim(),
          role: "USER",
          size: 20,
        })
        // Filter out file creator
        const filtered = (res.content || []).filter(u => u.id !== file.createdBy?.id)
        setSearchResults(filtered)
      } catch (err) {
        message.error(extractErrorMessage(err, "Không thể tìm kiếm người dùng"))
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, open, file])

  const sharedUserIdSet = useMemo(() => {
    return new Set(
      shares
        .filter(s => s.status === "ACTIVE")
        .map(s => s.userId)
    )
  }, [shares])

  const handleShare = async (targetUser: User) => {
    if (!file) return
    setSharingUserId(targetUser.id)
    try {
      await userSavedFileService.share(file.id, targetUser.id)
      message.success(`Chia sẻ file cho ${targetUser.username} thành công.`)
      await fetchShares()
    } catch (err) {
      message.error(extractErrorMessage(err, "Chia sẻ file thất bại"))
    } finally {
      setSharingUserId(null)
    }
  }

  const handleRevoke = async (targetUserId: number, targetName: string) => {
    if (!file) return
    setRevokingUserId(targetUserId)
    try {
      await userSavedFileService.revokeShare(file.id, targetUserId)
      message.success(`Đã thu hồi quyền chia sẻ của ${targetName}.`)
      await fetchShares()
    } catch (err) {
      message.error(extractErrorMessage(err, "Thu hồi quyền chia sẻ thất bại"))
    } finally {
      setRevokingUserId(null)
    }
  }

  if (!file) return null

  const width = file.cutSize?.filmWidth ?? file.cutSize?.axisY
  const length = file.cutSize?.rollLength ?? file.cutSize?.axisX
  const widthUnit = file.cutSize?.filmWidthUnit || "mm"
  const lengthUnit = file.cutSize?.rollLengthUnit || "mm"

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShareAltOutlined style={{ color: "#7C3AED", fontSize: 18 }} />
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 16, color: "#1B1B19" }}>
            Chia sẻ file SVG
          </span>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={typeof window !== 'undefined' && window.innerWidth < 740 ? '96vw' : 720}
      style={{ top: 20 }}
      footer={[
        <Button key="close" onClick={onClose} style={{ borderRadius: 6 }}>
          Đóng
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
        {/* Thông tin tóm tắt file */}
        <div
          style={{
            background: "#FBFBFA",
            border: "1px solid #E4E3DE",
            borderRadius: 6,
            padding: 12,
          }}
        >
          <Descriptions size="small" column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item label="File" span={2}>
              <span
                style={{
                  fontFamily: FONT,
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#6C3BD6",
                }}
              >
                {file.fileName}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Người tạo">
              <span style={{ fontWeight: 500, color: "#1B1B19" }}>
                {file.createdBy?.displayName || file.createdBy?.username || "—"}
              </span>{" "}
              {file.createdBy?.username && (
                <span style={{ fontSize: 11, color: "#8A8983", fontFamily: MONO }}>
                  (@{file.createdBy.username})
                </span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Danh mục kho mẫu & part">
              {file.category?.name ? (
                <span
                  style={{
                    display: "inline-block",
                    padding: "1px 7px",
                    background: "#F1EDFC",
                    border: "1px solid #C9B6F5",
                    borderRadius: 4,
                    font: `500 11px ${FONT}`,
                    color: "#5B2BB0",
                  }}
                >
                  {file.category.name}
                </span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Mẫu xe">
              {file.vehicleConfiguration?.brandName || file.vehicleConfiguration?.modelName ? (
                <span style={{ fontWeight: 500 }}>
                  {file.vehicleConfiguration.brandName} {file.vehicleConfiguration.modelName}
                  {file.vehicleConfiguration.generationCode
                    ? ` (${file.vehicleConfiguration.generationCode})`
                    : ""}
                </span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Khổ cắt (Y × X)">
              {width || length ? (
                <span style={{ fontFamily: MONO, fontSize: 11.5 }}>
                  {width ? `${width.toLocaleString("vi-VN")} ${widthUnit}` : "—"} ×{" "}
                  {length ? `${length.toLocaleString("vi-VN")} ${lengthUnit}` : "—"}
                </span>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian tạo" span={2}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#4A4945" }}>
                {file.createdAt ? new Date(file.createdAt).toLocaleString("vi-VN") : "—"}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Danh sách người dùng đang được chia sẻ */}
        <div>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 13,
              color: "#1B1B19",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              Người dùng đang được chia sẻ ({shares.filter(s => s.status === "ACTIVE").length})
            </span>
          </div>

          <div
            style={{
              border: "1px solid #E4E3DE",
              borderRadius: 6,
              background: "#FFF",
              maxHeight: 180,
              overflowY: "auto",
            }}
          >
            {loadingShares ? (
              <div style={{ padding: 24, textAlign: "center" }}>
                <Spin size="small" />
              </div>
            ) : shares.filter(s => s.status === "ACTIVE").length === 0 ? (
              <div style={{ padding: "16px 0" }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa có người dùng nào được chia sẻ file này"
                />
              </div>
            ) : (
              <List
                size="small"
                dataSource={shares.filter(s => s.status === "ACTIVE")}
                renderItem={item => {
                  const targetName = item.displayName || item.username
                  return (
                    <List.Item
                      key={item.userId}
                      style={{
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "1 1 auto" }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "#F1EDFC",
                            color: "#6C3BD6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 600,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {targetName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 12.5, color: "#1B1B19" }}>
                            {targetName}{" "}
                            <span style={{ fontSize: 11, color: "#8A8983", fontFamily: MONO }}>
                              (@{item.username})
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6E6D68",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            {item.dealerName ? (
                              <>
                                <ShopOutlined style={{ color: "#6C3BD6" }} />
                                <span>{item.dealerName}</span>
                              </>
                            ) : (
                              <span>Không có đại lý</span>
                            )}
                            {item.sharedAt && (
                              <span style={{ color: "#8A8983", fontFamily: MONO, marginLeft: 6 }}>
                                · {new Date(item.sharedAt).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Popconfirm
                        title={`Bạn có chắc chắn muốn thu hồi quyền truy cập file này của ${targetName}?`}
                        okText="Thu hồi"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true, size: "small" }}
                        cancelButtonProps={{ size: "small" }}
                        onConfirm={() => handleRevoke(item.userId, targetName)}
                      >
                        <Button
                          danger
                          type="link"
                          size="small"
                          loading={revokingUserId === item.userId}
                          icon={<CloseCircleOutlined />}
                        >
                          Thu hồi
                        </Button>
                      </Popconfirm>
                    </List.Item>
                  )
                }}
              />
            )}
          </div>
        </div>

        {/* Chia sẻ cho người dùng */}
        <div>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 13,
              color: "#1B1B19",
              marginBottom: 8,
            }}
          >
            Chia sẻ cho người dùng
          </div>

          <Input
            prefix={<SearchOutlined style={{ color: "#8A8983" }} />}
            placeholder="Tìm theo username hoặc tên người dùng..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            allowClear
            style={{
              borderRadius: 6,
              height: 36,
              fontFamily: FONT,
            }}
          />

          {searchQuery.trim() && (
            <div
              style={{
                marginTop: 8,
                border: "1px solid #E4E3DE",
                borderRadius: 6,
                background: "#FFF",
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {searching ? (
                <div style={{ padding: 20, textAlign: "center" }}>
                  <Spin size="small" />
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: "16px 0" }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không tìm thấy người dùng phù hợp (ROLE_USER)"
                  />
                </div>
              ) : (
                <List
                  size="small"
                  dataSource={searchResults}
                  renderItem={u => {
                    const isAlreadyShared = sharedUserIdSet.has(u.id)
                    const isSharing = sharingUserId === u.id
                    const displayName = u.fullName || u.username

                    return (
                      <List.Item
                        key={u.id}
                        style={{
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "1 1 auto" }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "#EDEBE6",
                              color: "#4A4945",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 600,
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 12.5, color: "#1B1B19" }}>
                              {displayName}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#6E6D68",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ fontFamily: MONO }}>@{u.username}</span>
                              {u.dealerName && (
                                <>
                                  <span style={{ color: "#C9C8C3" }}>·</span>
                                  <ShopOutlined style={{ color: "#6C3BD6" }} />
                                  <span>{u.dealerName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {isAlreadyShared ? (
                          <Tag
                            color="success"
                            icon={<CheckCircleOutlined />}
                            style={{ margin: 0, padding: "2px 8px" }}
                          >
                            ✓ Đã được chia sẻ
                          </Tag>
                        ) : (
                          <Button
                            type="primary"
                            size="small"
                            icon={<ShareAltOutlined />}
                            loading={isSharing}
                            onClick={() => handleShare(u)}
                            style={{
                              background: "#7C3AED",
                              borderColor: "#7C3AED",
                              borderRadius: 4,
                            }}
                          >
                            {isSharing ? "Đang chia sẻ..." : "Chia sẻ"}
                          </Button>
                        )}
                      </List.Item>
                    )
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
