import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  Table,
  Input,
  Button,
  Space,
  Popconfirm,
  message,
  Tooltip,
  Card,
  Row,
  Col,
  Tag,
  Typography,
  AutoComplete,
  Alert,
} from "antd"
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  NodeIndexOutlined,
  FilterOutlined,
  ClearOutlined,
  CarOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import { Category } from "@/types/category"
import { categoryService } from "@/services/category/categoryService"
import { CategoryModal } from "./CategoryModal"
import { extractErrorMessage } from "@/utils/error"

const { Text } = Typography

const LEVEL_COLOR_MAP: Record<string, string> = {
  category: "blue",
  brand: "purple",
  model: "cyan",
  variant: "green",
  year: "orange",
  submodel: "magenta",
}

const LEVEL_VIETNAMESE_MAP: Record<string, string> = {
  category: "Cấp 1 - Loại sản phẩm",
  brand: "Cấp 2 - Hãng xe",
  model: "Cấp 3 - Dòng xe",
  variant: "Cấp 4 - Phiên bản",
  year: "Cấp 5 - Năm sản xuất",
  submodel: "Cấp 6 - Chi tiết / Kiểu dáng",
}

// Common years for quick suggestion
const COMMON_YEARS = [
  "2026", "2025", "2024", "2023", "2022", "2021",
  "2020", "2019", "2018", "2017", "2016", "2015"
]

export const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

  // Independent vehicle selector state (Độc lập với cây thư mục)
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [appliedFilters, setAppliedFilters] = useState({
    brand: "",
    model: "",
    year: "",
  })

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null)

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await categoryService.getCategories()
      setCategories(data)
      const rootKeys = data.map(c => c.id)
      setExpandedRowKeys(rootKeys)
    } catch (err: unknown) {
      message.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Collect all nodes matching a level across entire tree
  const getNodesByLevel = useCallback((nodes: Category[], level: string): Category[] => {
    const result: Category[] = []
    const traverse = (list: Category[]) => {
      for (const item of list) {
        if (item.level?.toLowerCase() === level.toLowerCase()) {
          result.push(item)
        }
        if (item.children && item.children.length > 0) {
          traverse(item.children)
        }
      }
    }
    traverse(nodes)
    return result
  }, [])

  // AutoComplete options for Brand (Hãng xe)
  const brandOptions = useMemo(() => {
    const brandNodes = getNodesByLevel(categories, "brand")
    const uniqueValues = Array.from(new Set(brandNodes.map(b => b.label || b.value)))
    return uniqueValues.sort().map(val => ({ value: val, label: val }))
  }, [categories, getNodesByLevel])

  // AutoComplete options for Model (Dòng xe)
  const modelOptions = useMemo(() => {
    let modelNodes: Category[] = []
    if (selectedBrand) {
      // Find models belonging to the selected brand
      const brandNodes = getNodesByLevel(categories, "brand").filter(
        b => (b.label || b.value).toLowerCase() === selectedBrand.toLowerCase()
      )
      for (const b of brandNodes) {
        if (b.children) {
          for (const m of b.children) {
            if (m.level === "model") modelNodes.push(m)
          }
        }
      }
    } else {
      modelNodes = getNodesByLevel(categories, "model")
    }
    const uniqueValues = Array.from(new Set(modelNodes.map(m => m.label || m.value)))
    return uniqueValues.sort().map(val => ({ value: val, label: val }))
  }, [categories, selectedBrand, getNodesByLevel])

  // AutoComplete options for Year (Năm)
  const yearOptions = useMemo(() => {
    const yearNodes = getNodesByLevel(categories, "year")
    const existingYears = yearNodes.map(y => y.label || y.value)
    const merged = Array.from(new Set([...existingYears, ...COMMON_YEARS]))
    return merged.sort().reverse().map(val => ({ value: val, label: val }))
  }, [categories, getNodesByLevel])

  // Collect all keys in tree
  const getAllKeys = (nodes: Category[]): React.Key[] => {
    const keys: React.Key[] = []
    const traverse = (list: Category[]) => {
      for (const item of list) {
        keys.push(item.id)
        if (item.children && item.children.length > 0) {
          traverse(item.children)
        }
      }
    }
    traverse(nodes)
    return keys
  }

  const handleExpandAll = () => {
    setExpandedRowKeys(getAllKeys(categories))
  }

  const handleCollapseAll = () => {
    setExpandedRowKeys([])
  }

  // Handle Apply Vehicle Filters
  const handleApplyVehicleFilter = () => {
    setAppliedFilters({
      brand: selectedBrand.trim(),
      model: selectedModel.trim(),
      year: selectedYear.trim(),
    })
  }

  // Handle Reset Vehicle Filters
  const handleResetVehicleFilter = () => {
    setSelectedBrand("")
    setSelectedModel("")
    setSelectedYear("")
    setAppliedFilters({
      brand: "",
      model: "",
      year: "",
    })
  }

  // Recursive tree filter supporting Brand, Model, Year and general keyword
  const { filteredData, matchedKeys, exactMatchedNode } = useMemo<{
    filteredData: Category[]
    matchedKeys: React.Key[]
    exactMatchedNode: Category | null
  }>(() => {
    const { brand, model, year } = appliedFilters
    const keyword = searchKeyword.trim().toLowerCase()
    const brandLower = brand.toLowerCase()
    const modelLower = model.toLowerCase()
    const yearLower = year.toLowerCase()

    const hasVehicleFilter = Boolean(brandLower || modelLower || yearLower)
    const hasKeyword = Boolean(keyword)

    if (!hasVehicleFilter && !hasKeyword) {
      return { filteredData: categories, matchedKeys: [], exactMatchedNode: null }
    }

    const matchedKeysList: React.Key[] = []
    let deepestMatchedNode: Category | null = null

    const checkBranch = (
      node: Category,
      currentBrand: string | null = null,
      currentModel: string | null = null,
      currentYear: string | null = null
    ): Category | null => {
      const b = currentBrand || (node.level === "brand" ? (node.label || node.value) : null)
      const m = currentModel || (node.level === "model" ? (node.label || node.value) : null)
      const y = currentYear || (node.level === "year" ? (node.label || node.value) : null)

      const filteredChildren: Category[] = []
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const res = checkBranch(child, b, m, y)
          if (res) filteredChildren.push(res)
        }
      }

      // Check conditions
      const brandOk = !brandLower || (b && b.toLowerCase().includes(brandLower)) || node.level === "category"
      const modelOk = !modelLower || (m && m.toLowerCase().includes(modelLower)) || ["category", "brand"].includes(node.level)
      const yearOk = !yearLower || (y && y.toLowerCase().includes(yearLower)) || ["category", "brand", "model", "variant"].includes(node.level)

      let keywordOk = true
      if (hasKeyword) {
        keywordOk =
          (node.label || "").toLowerCase().includes(keyword) ||
          (node.value || "").toLowerCase().includes(keyword) ||
          (node.level || "").toLowerCase().includes(keyword)
      }

      const hasMatchingChildren = filteredChildren.length > 0
      const isSelfMatch = brandOk && modelOk && yearOk && (keywordOk || hasMatchingChildren)

      if (isSelfMatch || hasMatchingChildren) {
        if (brandLower && !b && !hasMatchingChildren && node.level === "category") {
          return null
        }
        if (modelLower && !m && !hasMatchingChildren) {
          return null
        }
        if (yearLower && !y && !hasMatchingChildren) {
          return null
        }

        matchedKeysList.push(node.id)

        // Track exact leaf match
        if (yearLower && y && y.toLowerCase().includes(yearLower)) {
          deepestMatchedNode = node
        } else if (modelLower && m && m.toLowerCase().includes(modelLower) && !deepestMatchedNode) {
          deepestMatchedNode = node
        } else if (brandLower && b && b.toLowerCase().includes(brandLower) && !deepestMatchedNode) {
          deepestMatchedNode = node
        }

        return {
          ...node,
          children: hasMatchingChildren ? filteredChildren : node.children,
        }
      }

      return null
    }

    const result: Category[] = []
    for (const root of categories) {
      const filtered = checkBranch(root)
      if (filtered) result.push(filtered)
    }

    return {
      filteredData: result,
      matchedKeys: matchedKeysList,
      exactMatchedNode: deepestMatchedNode,
    }
  }, [categories, appliedFilters, searchKeyword])

  // Automatically expand matching keys when vehicle filter or search is active
  useEffect(() => {
    if (appliedFilters.brand || appliedFilters.model || appliedFilters.year || searchKeyword.trim()) {
      if (matchedKeys.length > 0) {
        setExpandedRowKeys(matchedKeys)
      }
    }
  }, [appliedFilters, searchKeyword, matchedKeys])

  // Handlers for modal
  const handleOpenCreateRoot = () => {
    setSelectedCategory(null)
    setDefaultParentId(null)
    setModalOpen(true)
  }

  const handleOpenAddChild = (parent: Category) => {
    setSelectedCategory(null)
    setDefaultParentId(parent.id)
    setModalOpen(true)
  }

  const handleOpenEdit = (category: Category) => {
    setSelectedCategory(category)
    setDefaultParentId(category.parentId || null)
    setModalOpen(true)
  }

  const handleDelete = async (category: Category) => {
    try {
      await categoryService.deleteCategory(category.id)
      message.success(`Đã xóa danh mục "${category.label}"`)
      fetchCategories()
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err)
      if (errorMsg.includes("CATEGORY_HAS_CHILDREN")) {
        message.error("Không thể xóa Category vì vẫn còn Category con.")
      } else if (errorMsg.includes("CATEGORY_IN_USE")) {
        message.error("Không thể xóa Category vì đang được sử dụng bởi SVG.")
      } else {
        message.error(errorMsg)
      }
    }
  }

  const isVehicleFilterActive = Boolean(
    appliedFilters.brand || appliedFilters.model || appliedFilters.year
  )

  const columns: ColumnsType<Category> = [
    {
      title: "Tên danh mục (Label)",
      dataIndex: "label",
      key: "label",
      width: "35%",
      render: (label: string, record: Category) => (
        <div>
          <Space>
            <span style={{ fontWeight: 600 }}>{label}</span>
            {record.children && record.children.length > 0 && (
              <Tag style={{ fontSize: 11, borderRadius: 10 }}>
                {record.children.length} cấp con
              </Tag>
            )}
          </Space>
          {(record.brand || record.model || record.year) && (
            <div style={{ marginTop: 4 }}>
              <Space size={4} wrap>
                {record.brand && (
                  <Tag color="purple" style={{ fontSize: 11, padding: "0 6px", margin: 0 }}>
                    Hãng: {record.brand}
                  </Tag>
                )}
                {record.model && (
                  <Tag color="cyan" style={{ fontSize: 11, padding: "0 6px", margin: 0 }}>
                    Dòng: {record.model}
                  </Tag>
                )}
                {record.year && (
                  <Tag color="orange" style={{ fontSize: 11, padding: "0 6px", margin: 0 }}>
                    Năm: {record.year}
                  </Tag>
                )}
              </Space>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Mã / Giá trị (Value)",
      dataIndex: "value",
      key: "value",
      width: "20%",
      render: (value: string) => <Text code>{value}</Text>,
    },
    {
      title: "Cấp bậc (Level)",
      dataIndex: "level",
      key: "level",
      width: "20%",
      render: (level: string) => (
        <Tooltip title={LEVEL_VIETNAMESE_MAP[level] || level}>
          <Tag color={LEVEL_COLOR_MAP[level] || "default"} style={{ fontWeight: 500 }}>
            {level.toUpperCase()}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Thứ tự",
      dataIndex: "displayOrder",
      key: "displayOrder",
      width: "10%",
      align: "center",
      render: (order: number) => order ?? 0,
    },
    {
      title: "Hành động",
      key: "actions",
      width: "15%",
      align: "right",
      render: (_: unknown, record: Category) => {
        const isMaxDepth = record.level === "submodel"
        return (
          <Space size="small">
            <Tooltip title={isMaxDepth ? "Đã đạt cấp sâu nhất (submodel)" : "Thêm danh mục con"}>
              <Button
                type="text"
                size="small"
                icon={<NodeIndexOutlined />}
                disabled={isMaxDepth}
                onClick={() => handleOpenAddChild(record)}
                style={{ color: isMaxDepth ? undefined : "#52c41a" }}
              />
            </Tooltip>

            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenEdit(record)}
              />
            </Tooltip>

            <Tooltip title="Xóa danh mục">
              <Popconfirm
                title="Xóa danh mục"
                description={`Bạn có chắc muốn xóa danh mục "${record.label}"?`}
                onConfirm={() => handleDelete(record)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ══ BỘ CHỌN XE ĐỘC LẬP (HÃNG XE, DÒNG XE, NĂM) ══ */}
      <Card
        title={
          <Space>
            <CarOutlined style={{ color: "#722ed1", fontSize: 18 }} />
            <span style={{ fontWeight: 600 }}>Bộ chọn xe độc lập (Hãng xe / Dòng xe / Năm)</span>
            <Tag color="purple">Độc lập với cây thư mục</Tag>
          </Space>
        }
        bordered
        style={{
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          borderRadius: 8,
        }}
      >
        <div style={{ marginBottom: 12, color: "#6b7280", fontSize: 13 }}>
          Nhập hoặc chọn trực tiếp Hãng xe, Dòng xe và Năm sản xuất để tra cứu nhanh hoặc thêm cấp con mà không cần mở duyệt từng nhánh cây thư mục:
        </div>

        <Row gutter={[16, 16]} align="bottom">
          {/* Hãng xe (Brand) */}
          <Col xs={24} sm={8} md={6}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Hãng xe (Brand)
            </label>
            <AutoComplete
              style={{ width: "100%" }}
              options={brandOptions}
              value={selectedBrand}
              onChange={val => {
                setSelectedBrand(val)
                // Reset model if brand changes
                if (selectedModel && !val) setSelectedModel("")
              }}
              placeholder="Chọn hoặc nhập hãng xe..."
              filterOption={(inputValue, option) =>
                (option?.value ?? "").toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
              allowClear
            />
          </Col>

          {/* Dòng xe (Model) */}
          <Col xs={24} sm={8} md={6}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Dòng xe (Model)
            </label>
            <AutoComplete
              style={{ width: "100%" }}
              options={modelOptions}
              value={selectedModel}
              onChange={val => setSelectedModel(val)}
              placeholder="Chọn hoặc nhập dòng xe..."
              filterOption={(inputValue, option) =>
                (option?.value ?? "").toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
              allowClear
            />
          </Col>

          {/* Năm (Year) */}
          <Col xs={24} sm={8} md={4}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
              Năm (Year)
            </label>
            <AutoComplete
              style={{ width: "100%" }}
              options={yearOptions}
              value={selectedYear}
              onChange={val => setSelectedYear(val)}
              placeholder="Chọn hoặc nhập năm..."
              filterOption={(inputValue, option) =>
                (option?.value ?? "").toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
              allowClear
            />
          </Col>

          {/* Action buttons */}
          <Col xs={24} sm={24} md={8}>
            <Space wrap>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={handleApplyVehicleFilter}
                disabled={!selectedBrand && !selectedModel && !selectedYear}
                style={{ background: "#722ed1", borderColor: "#722ed1" }}
              >
                Lọc cây thư mục
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={handleResetVehicleFilter}
                disabled={!selectedBrand && !selectedModel && !selectedYear && !isVehicleFilterActive}
              >
                Đặt lại
              </Button>
              {exactMatchedNode && exactMatchedNode.level !== "submodel" && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenAddChild(exactMatchedNode!)}
                  style={{ borderColor: "#52c41a", color: "#52c41a" }}
                >
                  + Thêm con vào {exactMatchedNode.label}
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Selected Vehicle Badge / Notification */}
        {isVehicleFilterActive && (
          <div style={{ marginTop: 16 }}>
            <Alert
              type={filteredData.length > 0 ? "success" : "warning"}
              showIcon
              icon={filteredData.length > 0 ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
              message={
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <Space wrap>
                    <span>Xe đang chọn:</span>
                    {appliedFilters.brand && <Tag color="purple">Hãng: {appliedFilters.brand}</Tag>}
                    {appliedFilters.model && <Tag color="cyan">Dòng: {appliedFilters.model}</Tag>}
                    {appliedFilters.year && <Tag color="orange">Năm: {appliedFilters.year}</Tag>}
                  </Space>
                  <Tag color={filteredData.length > 0 ? "green" : "red"}>
                    {filteredData.length > 0
                      ? `Tìm thấy ${matchedKeys.length} nút khớp trong cây thư mục`
                      : "Không tìm thấy nhánh phù hợp trong cây thư mục"}
                  </Tag>
                </div>
              }
            />
          </div>
        )}
      </Card>

      {/* ══ CÂY DANH MỤC (CATEGORY TREE TABLE) ══ */}
      <Card
        title={
          <Space>
            <span>Cấu trúc Cây Danh mục (Category Hierarchy Tree)</span>
            <Tag color="blue">{categories.length} danh mục gốc</Tag>
          </Space>
        }
      >
        {/* Search & Tool Bar */}
        <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm theo tên, mã hoặc cấp danh mục..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={16} style={{ textAlign: "right" }}>
            <Space wrap>
              <Button onClick={handleExpandAll}>Mở rộng tất cả</Button>
              <Button onClick={handleCollapseAll}>Thu gọn tất cả</Button>
              <Button icon={<ReloadOutlined />} onClick={fetchCategories} loading={loading}>
                Làm mới
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateRoot}>
                + Tạo danh mục gốc
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Category Tree Table */}
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={false}
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: keys => setExpandedRowKeys(keys as React.Key[]),
          }}
          bordered
          size="middle"
        />

        {/* Create / Edit Modal */}
        {modalOpen && (
          <CategoryModal
            open={modalOpen}
            category={selectedCategory}
            defaultParentId={defaultParentId}
            categoriesTree={categories}
            onClose={() => setModalOpen(false)}
            onSuccess={fetchCategories}
          />
        )}
      </Card>
    </div>
  )
}
