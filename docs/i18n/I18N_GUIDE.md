# Hướng Dẫn Quốc Tế Hóa (i18n) — Cutting Manager Web

## 1. Tổng quan kiến trúc

Hệ thống hỗ trợ song ngữ Tiếng Việt (vi - mặc định) và Tiếng Anh (en) với cơ chế chuyển đổi tức thì không cần tải lại trang.

- Thư viện cốt lõi: `i18next` và `react-i18next`.
- Store đồng bộ trạng thái: `Zustand` (`src/stores/localeStore.ts`).
- UI Framework Locale: `Ant Design` (`antd/locale/vi_VN` và `antd/locale/en_US`).
- Date/Time Locale: `dayjs` (`dayjs/locale/vi` và `dayjs/locale/en`).
- Bộ chuyển đổi: `LanguageSwitcher.tsx` với icon cờ `🇻🇳 Tiếng Việt` và `🇬🇧 English`.
- Lưu trữ: `localStorage.getItem('cutting_language')` (mặc định: `vi`).

---

## 2. Cấu trúc thư mục Locales

Các chuỗi ngôn ngữ được phân chia theo namespace rõ ràng tại:
- `src/locales/vi/`
- `src/locales/en/`

Bao gồm 14 namespaces hoàn chỉnh:
1. `common.json`: Các nhãn dùng chung (nút bấm, bảng dữ liệu, tìm kiếm, xác nhận, lọc).
2. `nav.json`: Menu điều hướng sidebar, thanh header, tiêu đề trang.
3. `auth.json`: Màn hình đăng nhập, xác thực, đổi mật khẩu.
4. `dashboard.json`: Biểu đồ, chỉ số tổng quan, cảnh báo, tình trạng hệ thống.
5. `users.json`: Quản lý tài khoản, modal thêm/sửa, phân bổ ngày, giới hạn thiết bị.
6. `dealers.json`: Quản lý đại lý, gói tài khoản, quỹ ngày phân bổ, chi tiết hồ sơ.
7. `vehicles.json`: Danh mục xe 4 cấp (Hãng > Dòng > Model > Bản), dialog thêm/sửa node.
8. `parts.json`: Kho mẫu & part file SVG, lọc đa tầng, thông số khổ cắt.
9. `partLibraryCategories.json`: Danh mục kho mẫu (Ngoại thất, Nội thất...).
10. `savedFiles.json`: Bản vẽ đã lưu của máy cắt, chi tiết tệp, chia sẻ tệp SVG.
11. `devices.json`: Thiết bị máy cắt, phiên làm việc, thu hồi thiết bị.
12. `audit.json`: Nhật ký kiểm toán V1 & V2.
13. `bulkUpload.json`: Nạp hàng loạt part file SVG.
14. `errors.json`: Thông báo lỗi, mã lỗi HTTP, trang 403, 404.

---

## 3. Cách sử dụng

### 3.1. Trong React Component

```tsx
import React from 'react'
import { useTranslation } from 'react-i18next'

export const MyComponent: React.FC = () => {
  const { t } = useTranslation('users')

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('addUser')}</button>
      <span>{t('userList.totalUsers', { total: 10 })}</span>
    </div>
  )
}
```

### 3.2. Chuyển đổi ngôn ngữ

Khi người dùng chọn ngôn ngữ mới qua `LanguageSwitcher`:
- `localeStore.setLocale(newLocale)` được kích hoạt.
- `i18n.changeLanguage(newLocale)` cập nhật tức thì toàn bộ chuỗi văn bản.
- `dayjs.locale(newLocale)` đồng bộ định dạng ngày tháng.
- `ConfigProvider` của Ant Design cập nhật `locale={antdLocale}` để các thành phần như DatePicker, Table Pagination, Modal nút OK/Cancel hiển thị chuẩn xác theo ngôn ngữ đã chọn.

---

## 4. Nguyên tắc bắt buộc

1. **Không dịch dữ liệu máy:** Không dịch các enum kỹ thuật gửi lên API backend như `ADMIN`, `AGENT`, `USER`, `ACTIVE`, `LOCKED`, mã hãng, mã model xe, SHA-256 hash.
2. **Không dùng inline ternary rải rác:** Luôn khai báo chuỗi trong JSON resource file và gọi `t('...')`.
3. **Đồng bộ 1-1:** Bất kỳ key nào thêm vào `vi/` phải có key tương ứng trong `en/`.
